import { ServiceConfig, ServiceService } from '../services.js'
import { CommandHandler } from '@orbstation/command/CommandHandler'
import { cling } from '@orbstation/cling'

export type CustomCommandContext = { serviceConfig?: ServiceConfig }

const timeout = (
    cb: () => void,
    ms: number,
    onHalt: (haltCb: () => void) => void,
) =>
    new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), ms)
        onHalt(() => {
            clearTimeout(timeout)
            resolve()
        })
    }).then(() => cb())

export const pingCommand: CommandHandler<CustomCommandContext>['run'] = async(_command, _args, commandRun) => {
    cling.line('serviceId:  ' + commandRun.context?.serviceConfig?.serviceId)
    cling.line('isProd:     ' + (commandRun.context?.serviceConfig?.isProd ? 'yes' : 'no'))
    cling.line('git_commit: ' + ServiceService.config('git_commit'))
    const end = cling.progress('testing timeOut')
    await timeout(
        () => {
            end()
        },
        430,
        commandRun.onHalt.bind(commandRun),
    )
    const end2 = cling.progress('testing timeOut with reset')
    await timeout(
        () => {
            end2(['success', 'timeOut tests done'])
        },
        1250,
        commandRun.onHalt.bind(commandRun),
    )
}

export const command: CommandHandler<CustomCommandContext> = {
    help: `Debug Command to get app info`,
    run: pingCommand,
}
