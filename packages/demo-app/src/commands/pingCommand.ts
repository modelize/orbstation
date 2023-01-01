import { ServiceConfig, ServiceService } from '../services.js'
import { CommandHandler } from '@orbstation/command/CommandHandler'

export type CustomCommandContext = { serviceConfig?: ServiceConfig }

export const pingCommand: CommandHandler<CustomCommandContext>['run'] = async(_command, _args, commandRun) => {
    console.log('serviceId:  ', commandRun.context?.serviceConfig?.serviceId)
    console.log('isProd:     ', commandRun.context?.serviceConfig?.isProd ? 'yes' : 'no')
    console.log('git_commit: ', ServiceService.config('git_commit'))
}

export const command: CommandHandler<CustomCommandContext> = {
    help: `Debug Command to get app info`,
    run: pingCommand,
}
