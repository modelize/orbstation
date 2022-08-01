import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../../services.js'
import { ModelService } from '@modelize/interop/ModelService'
import { ModelSetup } from '@modelize/interop/ModelSetup'

const ModelInstallHandler: RouteHandler = async(req, res) => {
    const domainId = req.params.domainId
    const modelService = ServiceService.use(ModelService)
    const {models, log, changes} = await ModelSetup.install(modelService, domainId)
    return res.send({
        installed: changes,
        log: log,
        models: models,
    })
}

export default ModelInstallHandler
