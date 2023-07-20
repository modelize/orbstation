import { CommandDispatcher } from '@orbstation/command/CommandDispatcher'
import { ErrorCommandNotFound } from '@orbstation/command/ErrorCommandNotFound'
import process from 'process'
import boot from './boot.js'
import { nanoid } from 'nanoid'
import { ErrorCommandAborted } from '@orbstation/command/ErrorCommandAborted'
import { handleHalt } from './lib/bindHalt.js'

boot('cli')
    .then(({ServiceService, service, onHalt}) => {
        const cliRunId = nanoid()

        const commandDispatcher = ServiceService.use(CommandDispatcher)
        const fullArgs = process.argv.slice(2)
        const commandRun = commandDispatcher.prepare(
            cliRunId, {service},
            {logHalt: true},
            //['SIGINT', 'SIGTERM'],
        )
        onHalt.server.push(async(signal) => {
            await commandRun.halt(signal)
            do {
                await new Promise((resolve) => setTimeout(resolve, 20))
            } while(!commandRun.isHalted)
        })
        return commandDispatcher
            .dispatch(commandRun, fullArgs)
            .catch((e) => {
                if(e instanceof ErrorCommandAborted) {
                    console.log('[' + cliRunId + '] command aborted')
                    return
                }
                if(e instanceof ErrorCommandNotFound) {
                    console.error('[' + cliRunId + '] ' + e.message)

                    return handleHalt(onHalt, commandRun.opts.logHalt)('none')
                        .then(() => {
                            process.exit(1)
                        })
                }
                console.error('[' + cliRunId + '] command failed', e)

                process.exit(2)
            })
            .then(() => {
                console.log('[' + cliRunId + '] command finished')
                return handleHalt(onHalt, commandRun.opts.logHalt)('none')
            })
            .then(() => undefined)
    })
