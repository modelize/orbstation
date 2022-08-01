import { ServiceService } from '../services.js'
import { IdManager } from '@bemit/cloud-id/IdManager'
import { AuthRuleError } from '@bemit/cloud-id/AuthValidator'
import { RouteMiddleware } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../lib/routing.js'

export const AuthMiddleware: RouteMiddleware<RequestCustomPayload> = async(req, res, next) => {
    const idManager = ServiceService.get<IdManager>('IdManager')
    const header = req.header('Authorization')
    if(header) {
        if(header.indexOf('Bearer ') !== 0) {
            return res.status(401).send({
                error: 'invalid-token-format',
            })
        }
        const validationKey = await idManager.getValidationKey()
        if(!validationKey) {
            return res.status(500).send({
                error: 'verification-key-not-loaded',
            })
        }
        try {
            req.authId = await idManager.verify(header.slice('Bearer '.length))
        } catch(e) {
            return res.status(401).send({
                error: 'invalid-token',
            })
        }
    }

    try {
        next()
    } catch(e) {
        if(e instanceof AuthRuleError) {
            return res.status(e.code || 401).send({
                error: e.message || 'not-allowed',
            })
        } else {
            throw e
        }
    }
}
