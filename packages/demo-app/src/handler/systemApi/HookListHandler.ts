import { ServiceService } from '../../services.js'
import { HookService } from '@orbstation/app/HookService'
import { RouteHandler } from '@orbstation/route/RouteHandler'

const HookListHandler: RouteHandler = async(req, res) => {
    const hookService = ServiceService.use(HookService)
    const hookParent = req.params[0]
    if(!hookParent || hookParent.trim() === '') {
        return res.send({
            error: 'invalid hook parent',
        })
    }
    if(hookParent.startsWith('/')) {
        return res.send({
            error: 'invalid hook parent, starts with slash',
        })
    }
    if(hookParent.indexOf(':') !== -1) {
        return res.send({
            error: 'invalid hook parent, contains double colon',
        })
    }
    const hooks = await hookService.listHooksOfParent(hookParent)
    return res.send({
        hooks: hooks,
    })
}

export default HookListHandler
