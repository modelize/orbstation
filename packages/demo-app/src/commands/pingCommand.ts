import { ServiceConfig, ServiceService } from '../services.js'
import { CommandHandler } from '@orbstation/command/CommandHandler'
import { cling } from '@orbstation/cling'

export type CustomCommandContext = { serviceConfig?: ServiceConfig }

const timeout = (cb: () => void, ms: number) =>
    new Promise<void>((resolve) => setTimeout(() => resolve(), ms)).then(() => cb())

export const pingCommand: CommandHandler<CustomCommandContext>['run'] = async(_command, _args, commandRun) => {
    cling.line('serviceId:  ' + commandRun.context?.serviceConfig?.serviceId)
    cling.line('isProd:     ' + (commandRun.context?.serviceConfig?.isProd ? 'yes' : 'no'))
    cling.line('git_commit: ' + ServiceService.config('git_commit'))
    const end = cling.progress('testing timeOut')
    await timeout(() => {
        end()
    }, 430)
    const end2 = cling.progress('testing timeOut with reset')
    await timeout(() => {
        end2(['success', 'timeOut tests done'])
    }, 1250)
}

export const command: CommandHandler<CustomCommandContext> = {
    help: `Debug Command to get app info`,
    run: pingCommand,
}
