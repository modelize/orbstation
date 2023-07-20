import { ServiceService } from '../../services.js'
import { ExtensionService } from '@orbstation/app/ExtensionService'
import { AuthRuleError } from '@bemit/cloud-id/AuthRuleError'
import { RouteHandler } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../../lib/routing.js'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'

const ExtensionsListEnabledHandler: RouteHandler<RequestCustomPayload> = async(req, res) => {
    if(req.appInfo?.projectId && req.authId?.['https://id.bemit.io/project'] !== req.appInfo?.projectId) {
        throw new AuthRuleError('invalid project for station')
    }
    const extensionService = ServiceService.use(ExtensionService)
    let extensions: any
    try {
        extensions = await extensionService.listExtensions()
    } catch(e) {
        if(e instanceof ErrorModelNotFound) {
            return res.status(500).send({
                error: 'model not found',
            })
        }
        throw e
    }
    return res.send({
        extensions: extensions,
    })
}

export default ExtensionsListEnabledHandler
