import { CommandRun } from '@orbstation/command/CommandRun'

export interface CommandHandler<C = undefined> {
    help: string
    run: (
        commandRun: CommandRun<C>,
        args: string[],
    ) => void | Promise<void>
}
