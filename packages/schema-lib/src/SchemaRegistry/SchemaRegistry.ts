import { ISchemaRegistry, SchemaResolverDefinition, SchemaResolverFn, SchemaResolverListFn } from '@bemit/schema/SchemaService'
import { SchemaRegistryError } from '@bemit/schema/SchemaRegistryError'

export const schemaDefParse = (def: SchemaResolverDefinition) => {
    if(!def?.path && !def?.scope) return undefined
    const isPathScope = def?.path?.startsWith('@')
    if(!isPathScope && !def?.scope) return undefined
    const [maybeScope, ...pathParts] = (isPathScope ? def?.path?.split('/') : []) as string[]
    const scope = isPathScope ? maybeScope.slice(1) :
        typeof def?.scope !== 'undefined' ? def?.scope : undefined
    if(typeof scope === 'undefined' || scope.trim() === '') {
        throw new SchemaRegistryError('no valid scope found for definitions: ' + JSON.stringify(def))
    }
    if(pathParts.includes('..')) {
        throw new SchemaRegistryError('unsecure path in `schemaRegistryResolver` detected')
    }
    return {
        scope,
        path: isPathScope ? pathParts.join('/') : def?.path,
    }
}

export const schemaRegistryResolver: (
    registries: {
        [scope: string]: (id: string) => ISchemaRegistry
    },
) => ISchemaRegistry =
    (registries) => {
        const registryInstances: {
            [scope: string]: ISchemaRegistry
        } = {}
        const getRegistry = (scope: string): ISchemaRegistry | undefined => {
            if(!registries?.[scope]) {
                return undefined
            }
            if(!registryInstances?.[scope]) {
                registryInstances[scope] = registries?.[scope](scope)
            }
            return registryInstances[scope]
        }
        return {
            resolve: async(def) => {
                const schemaDef = schemaDefParse(def)
                if(!schemaDef) {
                    return undefined
                }
                const {scope, path} = schemaDef
                return getRegistry(scope)?.resolve({
                    ...def,
                    path: path,
                    scope: scope,
                })
            },
            list: async(def) => {
                const schemaDef = schemaDefParse(def)
                if(!schemaDef) {
                    return undefined
                }
                const {scope, path} = schemaDef
                return getRegistry(scope)?.list?.({
                    ...def,
                    path: path,
                    scope: scope,
                })
            },
        }
    }

export abstract class SchemaRegistry implements ISchemaRegistry {
    protected readonly id: string
    protected readonly resolver: SchemaResolverFn
    protected readonly listResolver?: SchemaResolverListFn

    protected constructor(
        id: string,
        resolver: SchemaResolverFn,
        listResolver?: SchemaResolverListFn,
    ) {
        this.resolver = resolver
        this.listResolver = listResolver
        this.id = id
    }

    public async resolve(...[def]: Parameters<SchemaResolverFn>): ReturnType<SchemaResolverFn> {
        return this.resolver(def)
    }

    public async list(...[def]: Parameters<SchemaResolverListFn>): ReturnType<SchemaResolverListFn> {
        return this.listResolver?.(def)
    }
}
