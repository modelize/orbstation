import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../../services.js'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { ModelService } from '@modelize/interop/ModelService'

const ModelDomainStatusHandler: RouteHandler = async(req, res) => {
    const domainId = req.params.domainId
    const db = ServiceService.use(CouchDbService)
    const modelService = ServiceService.use(ModelService)
    // const appSchema = await schemaService.resolve({path: '@system/app'})
    // todo: use future `getModelStatus` from interop
    const existingDbs = await db.db().list()
    const models = modelService.getModelsByTag(domainId)
    const modelInfos: any[] = []
    for(const modelId of models) {
        const model = modelService.getModel(modelId)
        let exists = false
        switch(model.desc.provider) {
            case 'inmemory':
                exists = true
                break
            case 'lowdb':
                exists = true
                break
            case 'couchdb':
                exists = existingDbs.includes(modelId)
                break
        }
        modelInfos.push({
            ...model.desc,
            exists: exists,
        })
    }
    return res.send({
        models: modelInfos,
    })
}

export default ModelDomainStatusHandler
