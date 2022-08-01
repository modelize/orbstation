import { ErrorCommandNotFound } from '@orbstation/command/ErrorCommandNotFound'
import fs from 'fs'
import path from 'path'
import { CommandHandler } from '@orbstation/command/CommandHandler'

export interface CommandResolver {
    matches(command: string): boolean

    resolve(command: string): Promise<CommandHandler>

    listHelp(): Promise<{
        help: CommandHandler['help']
        name: string
    }[]>
}

export class CommandResolverFolder implements CommandResolver {
    protected readonly folder: string
    protected readonly fileSuffix: string
    protected readonly makeFileName: (command: string) => string
    protected readonly makeCommandName: (commandFile: string, fileSuffix: string) => string
    protected readonly exportCommand: (commandFileExports: any, command: string, commandFile: string) => CommandHandler | undefined

    constructor(
        config: {
            folder: string
            fileSuffix?: string
            makeFileName?: (command: string) => string
            makeCommandName?: (commandFile: string, fileSuffix: string) => string
            exportCommand?: (commandFileExports: any, command: string, commandFile: string) => CommandHandler
        },
    ) {
        this.folder = config.folder
        this.fileSuffix = typeof config.fileSuffix === 'string' ? config.fileSuffix : 'Command.js'
        this.makeFileName = config.makeFileName || (
            (command: string) =>
                command
                    .split(':')
                    .map((c, i) => i === 0 ? c : c.slice(0, 1).toUpperCase() + (c.length > 1 ? c.slice(1) : ''))
                    .join('')
        )
        this.makeCommandName = config.makeCommandName || (
            (commandFile: string, fileSuffix: string) =>
                (commandFile.slice(0, commandFile.length - fileSuffix.length)
                    .split(/(?=[A-Z])/) || [])
                    .map((c) => c.slice(0, 1).toLowerCase() + (c.length > 1 ? c.slice(1) : ''))
                    .join(':')
        )
        this.exportCommand = config.exportCommand || ((exports) => exports.command)
    }

    matches(command: string): boolean {
        const commandName = this.makeFileName(command)
        try {
            return fs.statSync(path.join(this.folder, commandName + this.fileSuffix)).isFile()
        } catch(e) {
            return false
        }
    }

    protected async resolveFile(commandName: string, commandFile: string): Promise<CommandHandler> {
        return await import((process.platform === 'win32' ? 'file://' : '') + path.join(this.folder, commandFile))
            .then(r => {
                const cmdExport = this.exportCommand(r, commandName, commandFile)
                if(!cmdExport) {
                    throw new ErrorCommandNotFound('command export not found in file `' + commandFile + '`')
                }
                return cmdExport
            })
    }

    async resolve(command: string): Promise<CommandHandler> {
        const fileName = this.makeFileName(command)
        return await this.resolveFile(command, fileName + this.fileSuffix)
    }

    async listHelp(): Promise<{
        help: CommandHandler['help']
        name: string
    }[]> {
        const dir = await new Promise<string[]>((resolve, reject) => {
            fs.readdir(this.folder, (err, stats) => {
                if(err) {
                    reject(err)
                    return
                }
                resolve(stats)
            })
        })
        const filteredFiles = dir.filter(maybeCommandFile => maybeCommandFile.endsWith(this.fileSuffix))
        const commands: {
            help: CommandHandler['help']
            name: string
        }[] = []
        for(const filteredFile of filteredFiles) {
            const commandName = this.makeCommandName(filteredFile, this.fileSuffix)
            const command = await this.resolve(commandName)
            commands.push({
                name: commandName,
                help: command.help,
            })
        }
        return commands
    }
}
