import { CommandResolver } from '@orbstation/command/CommandResolverFolder'
import { CommandRun } from '@orbstation/command/CommandRun'
import { ErrorCommandNotFound } from '@orbstation/command/ErrorCommandNotFound'
import process from 'process'
import { CommandHandler } from '@orbstation/command/CommandHandler'
import { ErrorCommandAborted } from '@orbstation/command/ErrorCommandAborted'

export class CommandDispatcher<C = undefined> {
    private readonly resolver: CommandResolver<C>[]
    private readonly helpArgs: string[] = ['-h', '--help', 'help']

    constructor(
        config: {
            resolver?: CommandResolver<C>[]
            helpArgs?: string[]
        },
    ) {
        this.resolver = config.resolver || []
        if(config.helpArgs) {
            this.helpArgs = config.helpArgs
        }
    }

    addResolver(...resolver: CommandResolver<C>[]): CommandDispatcher<C> {
        this.resolver.push(...resolver)
        return this
    }

    prepare(runId: string, context?: C, opts: CommandRun['opts'] = {}, signals?: string[]): CommandRun<C> {
        return (new CommandRun<C>(runId, context, opts)).listenOnSignals(signals)
    }

    protected async showHelpOrExit(commandRun: CommandRun<C>, args?: string[]) {
        const maybeHelpArg = args?.[0]
        if(maybeHelpArg && this.helpArgs.includes(maybeHelpArg)) {
            for(const resolver of this.resolver) {
                if(commandRun.shouldHalt) return
                const commands = await resolver.listHelp()
                commands.forEach(({help, name}) => {
                    process.stdout.write(' Command `' + name + '`:' + '\n')
                    process.stdout.write('  ' + (help || 'no help description') + '\n\n')
                })
            }
            return
        }
        throw new Error('no command given, use one of `' + this.helpArgs.join(', ') + '` to list all commands')
    }

    async dispatch(commandRun: CommandRun<C>, args?: string[]): Promise<void> {
        try {
            await this.dispatchCommand(commandRun, args)
        } finally {
            if(!commandRun.isHalted) {
                commandRun.setIsHalted()
            }
        }

        if(commandRun.shouldHalt) {
            throw new ErrorCommandAborted('commandRun is halted')
        }
    }

    protected async dispatchCommand(commandRun: CommandRun<C>, args?: string[]): Promise<void> {
        const maybeCommand = args?.[0]
        let command: string | undefined = undefined
        if(maybeCommand && !maybeCommand.startsWith('-') && !this.helpArgs.includes(maybeCommand)) {
            command = maybeCommand
            args = args?.slice(1)
        }
        if(!command) {
            await this.showHelpOrExit(commandRun, args)
            if(commandRun.shouldHalt) return
        }

        const resolvers = this.resolver.slice(0, this.resolver.length)
        let resolver: undefined | CommandResolver<C>
        let cmd: undefined | CommandHandler<C>
        do {
            resolver = resolvers.shift()
            if(resolver) {
                cmd = await resolver.resolve(command as string)
            }
        } while(!commandRun.shouldHalt && typeof resolver !== 'undefined' && typeof cmd === 'undefined')

        if(commandRun.shouldHalt) return

        if(!resolver || typeof cmd === 'undefined') {
            throw new ErrorCommandNotFound('command not found: ' + command)
        }

        const maybeHelpArg = args?.[0]
        const showHelp = maybeHelpArg ? this.helpArgs.includes(maybeHelpArg) : false
        if(showHelp) {
            process.stdout.write(' Command `' + command + '`:' + '\n')
            process.stdout.write('  ' + (cmd.help || 'no help description') + '\n\n')
            return
        }

        await (cmd.run(commandRun, args || []) || Promise.resolve())
    }
}
