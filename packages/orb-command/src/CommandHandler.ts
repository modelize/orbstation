import { CommandRun } from '@orbstation/command/CommandRun'

export interface CommandHandler {
    help: string
    run: (
        command: string,
        args: string[],
        commandRun: CommandRun,
    ) => void | Promise<void>
}
