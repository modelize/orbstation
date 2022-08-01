import fs from 'fs'
import path from 'path'
import { IExtensionDefinition, IExtensionResolver } from '@orbstation/app/ExtensionService'

export class ExtensionResolver implements IExtensionResolver {
    private readonly extensionFolder: string

    constructor(extensionFolder: string) {
        this.extensionFolder = extensionFolder
    }

    async listAvailable(): Promise<IExtensionDefinition[]> {
        return await new Promise<IExtensionDefinition[]>((resolve, reject) => {
            fs.readdir(this.extensionFolder, (err, files) => {
                if(err) {
                    reject(err)
                    return
                }
                Promise.all(
                    files.map((name) => {
                        return new Promise<string | undefined>((resolve1, reject1) => {
                            fs.stat(path.join(this.extensionFolder as string, name), (err, stat) => {
                                if(err) {
                                    reject1(err)
                                    return
                                }
                                if(stat.isDirectory()) {
                                    resolve1(name)
                                    return
                                }
                                resolve1(undefined)
                            })
                        })
                    }),
                )
                    .then(folders => folders.filter(f => typeof f === 'string') as string[])
                    .then(folders =>
                        Promise.all(
                            folders.map((folder) =>
                                new Promise<IExtensionDefinition>((resolve, reject) => {
                                    fs.readFile(path.join(this.extensionFolder, folder, 'station-extension.json'), (err, buff) => {
                                        if(err) {
                                            reject(err)
                                            return
                                        }
                                        resolve(JSON.parse(buff.toString()))
                                    })
                                }),
                            ),
                        ),
                    )
                    .then(folders => resolve(folders))
            })
        })
    }

    async getDefinition(extensionFolder: string): Promise<IExtensionDefinition> {
        // todo: this is the fastest, but correct would be finding the folder with the correct `id` in it....
        return new Promise((resolve, reject) => {
            fs.readFile(path.join(this.extensionFolder, extensionFolder, 'station-extension.json'), (err, buff) => {
                if(err) {
                    reject(err)
                    return
                }
                resolve(JSON.parse(buff.toString()))
            })
        })
    }

    getDefinitionSync(extensionFolder: string): IExtensionDefinition {
        // todo: this is the fastest, but correct would be finding the folder with the correct `id` in it....
        const buff = fs.readFileSync(path.join(this.extensionFolder, extensionFolder, 'station-extension.json'))
        return JSON.parse(buff.toString())
    }
}
