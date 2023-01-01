import { CommandHandler } from '@orbstation/command/CommandHandler'
import { ServiceService } from '../services.js'
import { ModelService } from '@modelize/interop/ModelService'
import { ModelSetup } from '@modelize/interop/ModelSetup'

export const installCommand: CommandHandler['run'] = async() => {
    const domainId = 'system'
    const modelService = ServiceService.use(ModelService)
    const {models, log, changes} = await ModelSetup.install(modelService, domainId)
    log.forEach(console.log)

    console.log({
        installed: changes,
        models: models,
    })
}

export const command: CommandHandler = {
    help: `Installs the available 'system' models`,
    run: installCommand,
}
