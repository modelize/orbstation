import fs from 'fs'
import path from 'path'
import { SchemaRegistry } from '@bemit/schema/SchemaRegistry'
import { ISchemaRegistry, SchemaResolverFn, SchemaResolverListFn } from '@bemit/schema/SchemaService'
import util from 'util'

const makeRepoPath = (path: string): string => {
    return process.platform === 'win32' ? 'file://' + path : path
}

export const schemaFileImporter: (suffix: string) => SchemaResolverFn = (suffix) => async(def) => {
    if(
        !def?.path ||
        !def.path.endsWith(suffix)
    ) return undefined
    return import(makeRepoPath(def.path))
        .then(m => ({schema: m.default}))
    // todo: add a good "ERR_MODULE_NOT_FOUND" catch
    // .catch(e => ({schema: m.default}))
}

const readFile = util.promisify(fs.readFile)

export const schemaFileResolver: (suffix: string) => SchemaResolverFn = (suffix) => async(def) => {
    if(
        !def?.path ||
        !def.path.endsWith(suffix)
    ) return undefined
    const schema = await readFile(def.path)
    return {schema: JSON.parse(schema.toString())}
}

export const schemaFileListResolver: (extension: string) => SchemaResolverListFn = (
    extension: string,
) =>
    async(def) => {
        if(!def?.path) return undefined
        const schemaList = await new Promise<string[]>((resolve, reject) => {
            fs.readdir(def.path as string, (err, files) => {
                if(err) {
                    reject(err)
                    return
                }
                Promise.all(
                    files.filter(f => f.endsWith(extension)).map((name) => {
                        return new Promise<string | undefined>((resolve1, reject1) => {
                            fs.stat(path.join(def.path as string, name), (err, stat) => {
                                if(err) {
                                    reject1(err)
                                    return
                                }
                                if(stat.isDirectory()) {
                                    resolve1(undefined)
                                    return
                                }
                                resolve1(name.slice(0, name.length - extension.length))
                            })
                        })
                    }),
                )
                    .then(files => files.filter(f => typeof f === 'string') as string[])
                    .then(files => resolve(files))
            })
        })
        return {
            schemas: schemaList
                .sort((a, b) => a.localeCompare(b))
                .map(schemaFile => ({
                    path: schemaFile,
                })),
        }
    }

export class SchemaRegistryFile extends SchemaRegistry implements ISchemaRegistry {
    private readonly folder: string
    private readonly extension: string

    constructor(id: string, folder: string, extension: string) {
        super(id, schemaFileResolver(extension), schemaFileListResolver(extension))
        this.folder = folder
        this.extension = extension
    }

    resolve(...[def]): ReturnType<SchemaResolverFn> {
        return super.resolve({
            path: path.join(this.folder, def.path + this.extension),
            scope: this.id,
        })
    }

    list(...[def]): ReturnType<SchemaResolverListFn> {
        return super.list({
            path: path.join(this.folder, def.path),
            scope: this.id,
        })
    }
}
