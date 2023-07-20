import { ServiceService } from '../services.js'
import { CommandHandler } from '@orbstation/command/CommandHandler'
import { cling } from '@orbstation/cling'
import { OrbService, OrbServiceFeature, OrbServiceFeatures } from '@orbstation/service'

export type CustomCommandContext = {
    service: OrbService<OrbServiceFeatures<{ 'gcp:log': OrbServiceFeature }>>
}

const timeout = <R = void>(
    cb: () => Promise<R> | R,
    ms: number,
    onHalt: (haltCb: () => void) => void,
) => new Promise<void>((resolve) => {
    const timeout = setTimeout(() => resolve(), ms)
    onHalt(() => {
        clearTimeout(timeout)
        resolve()
    })
}).then(() => cb())

export const pingCommand: CommandHandler<CustomCommandContext>['run'] = async(commandRun) => {
    cling.line('service.name:        ' + commandRun.context?.service.name)
    cling.line('service.environment: ' + commandRun.context?.service.environment)
    cling.line('git_commit:          ' + ServiceService.config('buildInfo')?.GIT_COMMIT)
    const end = cling.progress('checking progress')
    await timeout(
        () => {
            end()
        },
        630,
        commandRun.onHalt.bind(commandRun),
    )
    if(commandRun.shouldHalt) return

    const end2 = cling.progress('checking progress with reset')
    await timeout(
        () => {
            end2(['success', 'progress checks done'])
        },
        2500,
        commandRun.onHalt.bind(commandRun),
    )
    if(commandRun.shouldHalt) return

    const progressingResult = await cling.progressing('checking progressing', () => timeout(
        async() => {
            return 123
        },
        2500,
        commandRun.onHalt.bind(commandRun),
    ))
    console.log('progressing result: ', progressingResult)
    if(commandRun.shouldHalt) return

    await cling.progressing('checking progressing with reset', (end3) => timeout(
        () => {
            end3(['success', 'progress checks done'])
        },
        2500,
        commandRun.onHalt.bind(commandRun),
    ))
    if(commandRun.shouldHalt) return

    let i = 0
    do {
        console.log('counting to 10k... ' + i)
        i++
        if(i % 100 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0))
        }
    } while(i <= 10000)

    do {
        console.log('counting to 30k... ' + i)
        i++
        if(i % 100 === 0) {
            await new Promise((resolve) => setTimeout(resolve, 0))
        }
    } while(i < 30000 && !commandRun.shouldHalt)
}

export const command: CommandHandler<CustomCommandContext> = {
    help: `Debug Command to get app info`,
    run: pingCommand,
}
