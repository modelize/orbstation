import { ServiceService } from '../../services.js'
import { DataContextService } from '../../service/DataContextService.js'
import { RouteHandler } from '@orbstation/route/RouteHandler'

const DataContextDescribeHandler: RouteHandler = async(req, res) => {
    const dataContextService = ServiceService.use(DataContextService)
    const contextId = req.params.contextId
    const dataContext = await dataContextService.getDataContext(contextId)
    return res.send({
        definition: dataContext?.context,
    })
}

export default DataContextDescribeHandler
