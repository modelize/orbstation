import { ServiceService } from '../../services.js'
import { ExtensionService } from '@orbstation/app/ExtensionService'
import { AuthRuleError } from '@bemit/cloud-id/AuthRuleError'
import { RouteHandler } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../../lib/routing.js'

const ExtensionsListAvailableHandler: RouteHandler<RequestCustomPayload> = async(req, res) => {
    if(req.appInfo?.projectId && req.authId?.['https://id.bemit.io/project'] !== req.appInfo?.projectId) {
        throw new AuthRuleError('invalid project for station')
    }
    const extensionService = ServiceService.use(ExtensionService)
    const extensions = await extensionService.listAvailable()
    return res.send({
        extensions: extensions,
    })
}

export default ExtensionsListAvailableHandler
