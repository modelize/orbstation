import { ServiceService } from '../../services.js'
import { AppService } from '@orbstation/app/AppService'
import { RouteHandler } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../../lib/routing.js'

const AppSaveHandler: RouteHandler<RequestCustomPayload> = async(req, res) => {
    const appService = ServiceService.use(AppService)

    const appInfo = await appService.createOrUpdateApp(req.authId?.['https://id.bemit.io/project'], req.body.name, 'system')
    return res.send({
        appInfo: appInfo,
    })
}

export default AppSaveHandler
