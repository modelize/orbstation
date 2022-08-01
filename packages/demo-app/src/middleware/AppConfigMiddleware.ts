import { ServiceService } from '../services.js'
import { AppService } from '@orbstation/app/AppService'
import { RouteMiddleware } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../lib/routing.js'

export const AppConfigMiddleware: RouteMiddleware<RequestCustomPayload> = async(req, _res, next) => {
    // todo: add caching, auto reload etc.
    const appInfo = await ServiceService.use(AppService).getApp('system')
    req.appInfo = appInfo

    try {
        next()
    } catch(e) {
        throw e
    }
}
