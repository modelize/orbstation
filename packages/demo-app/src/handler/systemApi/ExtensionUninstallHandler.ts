import { ServiceService } from '../../services.js'
import { IExtensionDefinition, ExtensionService } from '@orbstation/app/ExtensionService'
import { AuthRuleError } from '@bemit/cloud-id/AuthRuleError'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { ModelOperationResult } from '@modelize/interop/ModelService'
import { HookService } from '@orbstation/app/HookService'
import { DataContextService } from '../../service/DataContextService.js'
import { RouteHandler } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../../lib/routing.js'

const ExtensionUninstallHandler: RouteHandler<RequestCustomPayload> = async(req, res) => {
    if(req.appInfo?.projectId && req.authId?.['https://id.bemit.io/project'] !== req.appInfo?.projectId) {
        throw new AuthRuleError('invalid project for station')
    }
    const extensionService = ServiceService.use(ExtensionService)
    const hookService = ServiceService.use(HookService)
    const dataContextService = ServiceService.use(DataContextService)
    const extensionId = req.params.extensionId
    const mod = await extensionService.getExtension(extensionId)
    if(!mod) {
        return res.status(400).send({
            error: 'extension not exists',
        })
    }
    let def: IExtensionDefinition
    try {
        def = await extensionService.getDefinition(extensionId)
    } catch(e) {
        return res.status(400).send({
            error: 'extension definition not found',
        })
    }
    const fullLog: string[] = []
    const dataContextsOfExt = await dataContextService.listDataContextsOfExt(extensionId)
    if(dataContextsOfExt.length) {
        fullLog.push(' > deleting `' + dataContextsOfExt.length + '` data-contexts')
        for(const contextToRemove of dataContextsOfExt) {
            await dataContextService.deleteDataContext(contextToRemove)
            fullLog.push('   ✓ deleted data-context `' + contextToRemove.id + '`')
        }
    }
    const hooksOfExt = await hookService.listHooksOfExt(extensionId)
    if(hooksOfExt.length) {
        fullLog.push(' > deleting `' + hooksOfExt.length + '` hooks')
        for(const hookToRemove of hooksOfExt) {
            await hookService.deleteHook(hookToRemove)
            fullLog.push('   ✓ deleted hook `' + hookToRemove.id + '`')
        }
    }
    if(def.models) {
        const dbService = ServiceService.use(CouchDbService)
        const existingDbs = await dbService.db().list()
        for(const model of def.models) {
            try {
                // break
                const [, log] = await dbService
                    .destroyView(model.id, existingDbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
                fullLog.push(...log)
            } catch(e) {
                fullLog.push('   ❌ system failure while deleting model `' + model.id + '`')
            }
        }
    }
    const extension = await extensionService.uninstallExtension(extensionId)
    return res.send({
        extension: extension,
        log: fullLog,
        result: 'uninstalled',
    })
}

export default ExtensionUninstallHandler
