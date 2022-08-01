import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { ModelInteropDescriptionCouchDb } from '@orbstation/app/ExtensionService.js'
import { ExtensionSetupOpts } from '@orbstation/app/ExtensionSetup.js'
import { ModelInteropDescription, ModelOperationResult } from '@modelize/interop/ModelService'

export const couchDbModelInstaller = (
    dbService: CouchDbService,
) => async(
    extensionId: string,
    models: (ModelInteropDescription & Partial<ModelInteropDescriptionCouchDb>)[] | undefined,
    opts: ExtensionSetupOpts = {},
): Promise<string[]> => {
    if(!models) return []
    const existingDbs = await dbService.db().list()
    const fullLog: string[] = []
    for(const model of models) {
        if(model.provider !== 'couchdb') continue
        try {
            const [, log] = await dbService
                .createOrUpdateView(model.id, existingDbs, model.params)
                .then((l) => [true, l] as ModelOperationResult)
                .catch(() => [false, []] as ModelOperationResult)
            fullLog.push(...log)
        } catch(e) {
            fullLog.push(' ❌ system failure while creating model `' + model.id + '`')
        }
        if(model.indexes) {
            for(const index of model.indexes) {
                try {
                    const [, log] = await dbService
                        .createOrUpdateViewIndex(model.id, opts.recreateIndex, {
                            ddoc: index.ddoc,
                            name: index.name,
                            index: index.index,
                            type: index.type,
                            partitioned: index.partitioned,
                        })
                        .then((l) => [true, l] as ModelOperationResult)
                        .catch(() => [false, []] as ModelOperationResult)
                    fullLog.push(...log)
                } catch(e) {
                    fullLog.push(' ❌ system failure while creating index `' + (index.name || index.ddoc) + '` in model `' + model.id + '`')
                }
            }
        }
    }
    return fullLog
}
