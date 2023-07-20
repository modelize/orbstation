import { ServiceService } from '../../services.js'
import { IExtensionDefinition, ExtensionService } from '@orbstation/app/ExtensionService'
import { AuthRuleError } from '@bemit/cloud-id/AuthRuleError'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { RouteHandler } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../../lib/routing.js'

const ExtensionStatusHandler: RouteHandler<RequestCustomPayload> = async(req, res) => {
    if(req.appInfo?.projectId && req.authId?.['https://id.bemit.io/project'] !== req.appInfo?.projectId) {
        throw new AuthRuleError('invalid project for station')
    }
    const extensionService = ServiceService.use(ExtensionService)
    const extensionId = req.params.extensionId
    const mod = await extensionService.getExtension(extensionId)
    let def: IExtensionDefinition
    try {
        def = await extensionService.getDefinition(extensionId)
    } catch(e) {
        return res.status(400).send({
            error: 'extension definition not found',
        })
    }
    const models: any[] = []
    if(def.models) {
        const dbService = ServiceService.use(CouchDbService)
        // todo: use future `getModelStatus` from interop
        const existingDbs = await dbService.db().list()
        for(const model of def.models) {
            models.push({
                id: model.id,
                provider: model.provider,
                domain: model.domain,
                exists: existingDbs.includes(model.id),
            })
        }
    }
    return res.send({
        extension: mod,
        models: models,
    })
}

export default ExtensionStatusHandler
