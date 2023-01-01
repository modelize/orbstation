import { ErrorCommandNotFound } from '@orbstation/command/ErrorCommandNotFound'
import fs from 'fs'
import path from 'path'
import { CommandHandler } from '@orbstation/command/CommandHandler'

export interface CommandResolver<C = undefined> {
    resolve(command: string): Promise<CommandHandler<C> | undefined>

    listHelp(): Promise<{
        help: CommandHandler<C>['help']
        name: string
    }[]>
}

export class CommandResolverFolder<C = undefined> implements CommandResolver<C> {
    protected readonly folder: string
    protected readonly fileSuffix: string
    protected readonly commandPrefix: string
    protected readonly filterCommands?: (command: string, fileName: string) => boolean
    protected readonly makeFileName: (command: string) => string
    protected readonly makeCommandName: (commandFile: string, fileSuffix: string) => string
    protected readonly exportCommand: (commandFileExports: any, command: string, commandFile: string) => CommandHandler<C> | undefined

    constructor(
        config: {
            folder: string
            fileSuffix?: string
            commandPrefix?: string
            filterCommands?: (command: string, fileName: string) => boolean
            makeFileName?: (command: string) => string
            makeCommandName?: (commandFile: string, fileSuffix: string) => string
            exportCommand?: (commandFileExports: any, command: string, commandFile: string) => CommandHandler<C>
        },
    ) {
        this.folder = config.folder
        this.fileSuffix = typeof config.fileSuffix === 'string' ? config.fileSuffix : 'Command.js'
        this.commandPrefix = typeof config.commandPrefix === 'string' ? config.commandPrefix : ''
        this.filterCommands = config.filterCommands
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
        this.exportCommand = config.exportCommand || ((exports) => exports?.command)
    }

    protected async matches(command: string, fileName: string): Promise<boolean> {
        if(this.filterCommands && !this.filterCommands(command, fileName)) return false
        return new Promise<boolean>((resolve) => {
            fs.stat(path.join(this.folder, fileName + this.fileSuffix), (err, stats) => {
                if(err) {
                    resolve(false)
                    return
                }
                resolve(stats.isFile())
            })
        })
    }

    protected async resolveFile(commandName: string, commandFile: string): Promise<CommandHandler<C>> {
        return await import((process.platform === 'win32' ? 'file://' : '') + path.join(this.folder, commandFile))
            .then(r => {
                const cmdExport = this.exportCommand(r, commandName, commandFile)
                if(!cmdExport) {
                    throw new ErrorCommandNotFound('command export not found in file `' + commandFile + '`, expected by default: `export const command: CommandHandler`')
                }
                return cmdExport
            })
    }

    async resolve(command: string): Promise<CommandHandler<C> | undefined> {
        if(this.commandPrefix !== '' && !command.startsWith(this.commandPrefix)) return undefined
        const fileName = this.makeFileName(command)
        if(!await this.matches(command, fileName)) return undefined
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
            const commandName = this.commandPrefix + this.makeCommandName(filteredFile, this.fileSuffix)
            const command = await this.resolve(commandName)
            if(!command) continue
            commands.push({
                name: commandName,
                help: command.help,
            })
        }
        return commands
    }
}
