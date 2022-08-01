import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../../services.js'
import { ModelService } from '@modelize/interop/ModelService'
import { ModelSetup } from '@modelize/interop/ModelSetup'

const ModelUninstallHandler: RouteHandler = async(req, res) => {
    const domainId = req.params.domainId
    const modelService = ServiceService.use(ModelService)
    const {models, log, changes} = await ModelSetup.uninstall(modelService, domainId)
    return res.send({
        uninstalled: changes,
        log: log,
        models: models,
    })
}

export default ModelUninstallHandler
