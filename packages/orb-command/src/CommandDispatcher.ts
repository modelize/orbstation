import { CommandResolver } from '@orbstation/command/CommandResolverFolder'
import { CommandRun } from '@orbstation/command/CommandRun'
import { ErrorCommandNotFound } from '@orbstation/command/ErrorCommandNotFound'
import process from 'process'

export class CommandDispatcher {
    private readonly resolvers: CommandResolver[]
    protected readonly helpArgs: string[] = ['-h', '--help', 'help']

    constructor(
        config: {
            resolvers: CommandResolver[]
            helpArgs?: string[]
        },
    ) {
        this.resolvers = config.resolvers
        if(config.helpArgs) {
            this.helpArgs = config.helpArgs
        }
    }

    prepare(runId: string): CommandRun {
        return (new CommandRun(runId)).listenOnSignals()
    }

    async dispatch(commandRun: CommandRun, args?: string[]): Promise<void> {
        const maybeCommand = args?.[0]
        let command: string | undefined = undefined
        if(maybeCommand && !maybeCommand.startsWith('-') && !this.helpArgs.includes(maybeCommand)) {
            command = maybeCommand
            args = args?.slice(1)
        }
        const maybeHelpArg = args?.[0]
        if(!command) {
            if(maybeHelpArg && this.helpArgs.includes(maybeHelpArg)) {
                for(const resolver of this.resolvers) {
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
        const resolver = this.resolvers.find(resolver => resolver.matches(command as string))
        if(!resolver) {
            throw new ErrorCommandNotFound('command not found: ' + command)
        }
        const cmd = await resolver.resolve(command)
        const showHelp = maybeHelpArg ? this.helpArgs.includes(maybeHelpArg) : false
        if(showHelp) {
            process.stdout.write(' Command `' + command + '`:' + '\n')
            process.stdout.write('  ' + (cmd.help || 'no help description') + '\n\n')
            return
        }
        await (cmd.run(command, args || [], commandRun) || Promise.resolve())
    }
}
