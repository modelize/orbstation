import { CommandRun } from '@orbstation/command/CommandRun'

export interface CommandHandler<C = undefined> {
    help: string
    run: (
        command: string,
        args: string[],
        commandRun: CommandRun<C>,
    ) => void | Promise<void>
}
