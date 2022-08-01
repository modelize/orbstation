import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../../services.js'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { ModelService } from '@modelize/interop/ModelService'

const ModelStatusHandler: RouteHandler = async(req, res) => {
    const modelId = req.params.modelId
    const db = ServiceService.use(CouchDbService)
    const modelService = ServiceService.use(ModelService)
    // const appSchema = await schemaService.resolve({path: '@system/app'})
    // todo: use future `getModelStatus` from interop
    const existingDbs = await db.db().list()
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
    return res.send({
        model: {
            ...model.desc,
            exists: exists,
        },
    })
}

export default ModelStatusHandler
