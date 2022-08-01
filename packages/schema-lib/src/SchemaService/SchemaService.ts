export type SchemaResolverFn = (
    def: SchemaResolverDefinition,
) => Promise<undefined | {
    schema: {
        [k: string]: any
    }
}>

export type SchemaResolverListFn = (
    def: SchemaResolverDefinition,
) => Promise<undefined | {
    schemas: {
        [k: string]: any
    }[]
}>

export interface SchemaResolverDefinition {
    // the `$id` field
    id?: string
    // any fetch-able URL
    href?: string
    // local relative/absolute paths, if begins with `@` is treated as namespace
    path?: string
    // optionally, if possible, get specific version (range)
    version?: string
    // optionally, scope of the registry
    scope?: string
}

export interface ISchemaRegistry {
    resolve(...[def]: Parameters<SchemaResolverFn>): ReturnType<SchemaResolverFn>

    list?(...[def]: Parameters<SchemaResolverListFn>): ReturnType<SchemaResolverListFn>
}

export class SchemaService implements ISchemaRegistry {
    protected readonly resolver: ISchemaRegistry[]

    constructor(
        {
            resolver,
        }: {
            resolver: ISchemaRegistry[]
        },
    ) {
        this.resolver = resolver
    }

    async resolve(...args: Parameters<SchemaResolverFn>): ReturnType<SchemaResolverFn> {
        let schemaData: any
        for(const resolve of this.resolver) {
            schemaData = await resolve.resolve(...args)
            if(schemaData) {
                break
            }
        }
        return schemaData
    }

    async list(...args: Parameters<SchemaResolverListFn>): ReturnType<SchemaResolverListFn> {
        let schemaData: any
        for(const resolve of this.resolver) {
            schemaData = await resolve.list?.(...args)
            if(schemaData) {
                break
            }
        }
        return schemaData
    }
}
