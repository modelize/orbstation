import { ExtensionSetup } from '@orbstation/app/ExtensionSetup'
import { ErrorExtensionSetup } from '@orbstation/app/ExtensionSetup/ErrorExtensionSetup'
import { ServiceService } from '../../services.js'
import { ExtensionService } from '@orbstation/app/ExtensionService'
import { AuthRuleError } from '@bemit/cloud-id/AuthRuleError'
import { RouteHandler } from '@orbstation/route/RouteHandler'
import { RequestCustomPayload } from '../../lib/routing.js'

const ExtensionInstallHandler: RouteHandler<RequestCustomPayload> = async(req, res) => {
    if(req.appInfo?.projectId && req.authId?.['https://id.bemit.io/project'] !== req.appInfo?.projectId) {
        throw new AuthRuleError('invalid project for station')
    }
    const extensionService = ServiceService.use(ExtensionService)
    const extensionId = req.params.extensionId
    const doUpdate = req.path.endsWith('/update')
    let updatedExtension
    let fullLog
    try {
        const {extension, log} = await ExtensionSetup.install(
            extensionService,
            extensionId,
            {
                doUpdate: doUpdate,
                recreateIndex: doUpdate,
            },
        )
        updatedExtension = extension
        fullLog = log
    } catch(e) {
        if(e instanceof ErrorExtensionSetup) {
            return res.status(400).send({
                error: 'extension setup failed',
                description: e.message,
            })
        }
        throw e
    }

    return res.send({
        extension: updatedExtension,
        log: fullLog,
        result: doUpdate ? 'updated' : 'created',
    })
}

export default ExtensionInstallHandler
