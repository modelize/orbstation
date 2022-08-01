import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../../services.js'
import { AppService } from '@orbstation/app/AppService'
//import { ExtensionService } from '@orbstation/app/ExtensionService'
// import { HookService } from '@orbstation/app/HookService'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'

const AppDetailsHandler: RouteHandler = async(_req, res) => {
    const appService = ServiceService.use(AppService)
    //const extensionService = ServiceService.use(ExtensionService)
    // const hookService = ServiceService.use(HookService)
    try {
        const appInfo = await appService.getApp('system')
        // const hooks = await hookService.listHooksOfParent('global')
        return res.send({
            appInfo: appInfo,
            // hooks: hooks.map(h => h.exportVars()),
        })
    } catch(e) {
        if(e instanceof ErrorModelNotFound) {
            return res.send({})
        }
        throw e
    }
}

export default AppDetailsHandler
