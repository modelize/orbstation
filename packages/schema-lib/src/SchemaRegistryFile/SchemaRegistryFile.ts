import fs from 'fs'
import path from 'path'
import { SchemaRegistry } from '@bemit/schema/SchemaRegistry'
import { ISchemaRegistry, SchemaResolverFn, SchemaResolverListFn } from '@bemit/schema/SchemaService'
import util from 'util'

const makeRepoPath = (path: string): string => {
    return process.platform === 'win32' ? 'file://' + path : path
}

const readFile = util.promisify(fs.readFile)

export const schemaFileResolver: (suffix: string, useImport?: boolean | ((path: string) => boolean)) => SchemaResolverFn = (suffix, useImport) => async(def) => {
    if(
        !def?.path ||
        !def.path.endsWith(suffix)
    ) return undefined
    if(useImport === true || (typeof useImport === 'function' && useImport(def.path))) {
        return import(makeRepoPath(def.path))
            .then(m => ({schema: m.default}))
    }
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
    private readonly resolved: { [path: string]: { schema: any } } = {}
    private readonly resolvedLists: { [path: string]: { schemas: any[] } } = {}

    // todo: add `noResolveCache` option
    constructor(
        id: string, folder: string, extension: string,
        useImport?: boolean | ((path: string) => boolean),
    ) {
        super(id, schemaFileResolver(extension, useImport), schemaFileListResolver(extension))
        this.folder = folder
        this.extension = extension
    }

    async resolve(...[def]): ReturnType<SchemaResolverFn> {
        if(this.resolved[def.path]) return this.resolved[def.path]
        const schema = await super.resolve({
            path: path.join(this.folder, def.path + this.extension),
            scope: this.id,
        })
        if(!schema) return undefined
        this.resolved[def.path] = schema
        return this.resolved[def.path]
    }

    async list(...[def]): ReturnType<SchemaResolverListFn> {
        if(this.resolvedLists[def.path]) return this.resolvedLists[def.path]
        const list = await super.list({
            path: path.join(this.folder, def.path),
            scope: this.id,
        })
        if(!list) return undefined
        this.resolvedLists[def.path] = list
        return this.resolvedLists[def.path]
    }
}
