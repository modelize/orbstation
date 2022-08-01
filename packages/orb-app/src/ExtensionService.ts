import { ModelInteropDefinition, ModelInteropDescription } from '@modelize/interop/ModelService'
import { ExtensionSetupIntegrationInstallers } from '@orbstation/app/ExtensionSetup.js'
import { HookService, IHook } from '@orbstation/app/HookService'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'
import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'

export interface ModelInteropDescriptionCouchDb {
    params?: any
    indexes?: {
        name: string
        ddoc: string
        index: any
        partitioned?: boolean
        type?: 'json' | 'text'
    }[]
}

export interface IExtensionDefinition {
    id: string
    name: string
    version: string
    description?: string
    models?: ModelInteropDescription[]
    hooks?: (Pick<IHook, 'type' | 'parent' | 'restrict'> & { [k: string]: any })[]
    dataContexts?: { [id: string]: any }
}

export interface IExtensionResolver {
    listAvailable(): Promise<IExtensionDefinition[]>

    getDefinition(extensionId: string): Promise<IExtensionDefinition>

    getDefinitionSync(extensionId: string): IExtensionDefinition
}

export interface IExtension {
    name: string
    id: string
    version: string
    createdAt: number
    updatedAt: number
    preloaded?: boolean
}

export interface IExtensionRepository<IE extends IExtension = IExtension> {
    getModel(): ModelInteropDefinition

    createExtension(newExtension: Partial<IE> & Pick<IE, 'id' | 'version' | 'name'>): Promise<IE>

    getExtension(extensionId: string): Promise<IE>

    updateExtension(extension: IE): Promise<IE>

    listExtensions(): Promise<IE[]>

    deleteExtension(extension: IE): Promise<void>
}

export class ExtensionService<IE extends IExtension = IExtension> {
    private readonly repo?: IExtensionRepository<IE>
    private readonly resolver: IExtensionResolver
    private readonly preloadExtensions?: string[]
    private readonly preloadedExtensions: { [id: string]: IE } = {}
    private readonly installers: () => ExtensionSetupIntegrationInstallers<IExtensionDefinition>

    constructor(
        config: {
            repo?: IExtensionRepository<IE>
            resolver: IExtensionResolver
            preloadExtensions?: string[]
            installers: () => ExtensionSetupIntegrationInstallers<IExtensionDefinition>
        },
    ) {
        this.repo = config.repo
        this.resolver = config.resolver
        this.preloadExtensions = config.preloadExtensions
        this.installers = config.installers
    }

    getModel(): ModelInteropDefinition {
        if(this.repo) {
            return this.repo.getModel()
        }
        return {
            desc: {
                id: 'extension',
                domain: 'system',
                readOnly: true,
                autoCreate: true,
                provider: 'inmemory',
            },
        }
    }

    makeInstallers<IED extends IExtensionDefinition = IExtensionDefinition>(): ExtensionSetupIntegrationInstallers<IED> {
        return this.installers() as ExtensionSetupIntegrationInstallers<IED>
    }

    async listAvailable(): Promise<IExtensionDefinition[]> {
        return await this.resolver.listAvailable()
    }

    async getDefinition(extensionId: string): Promise<IExtensionDefinition> {
        return await this.resolver.getDefinition(extensionId)
    }

    getDefinitionSync(extensionId: string): IExtensionDefinition {
        return this.resolver.getDefinitionSync(extensionId)
    }

    async getExtension(extensionId: string): Promise<IE | undefined> {
        if(this.preloadedExtensions[extensionId]) {
            return this.preloadedExtensions[extensionId]
        }
        if(!this.repo) {
            return undefined
        }
        try {
            return await this.repo.getExtension(extensionId)
        } catch(e) {
            if(e instanceof ErrorEntryNotFound) {
                // noop
            } else {
                throw e
            }
        }
        return undefined
    }

    async createExtension(extension): Promise<IE> {
        if(this.preloadedExtensions[extension.id]) {
            return this.preloadedExtensions[extension.id]
        }
        if(!this.repo) {
            throw new Error('can not alter non-preloaded extensions without a repository')
        }
        return await this.repo.createExtension(extension)
    }

    async uninstallExtension(extensionId: string): Promise<IE | undefined> {
        if(this.preloadedExtensions[extensionId]) {
            return this.preloadedExtensions[extensionId]
        }
        if(!this.repo) {
            throw new Error('can not alter non-preloaded extensions without a repository')
        }
        const extension = await this.repo.getExtension(extensionId)
        await this.repo.deleteExtension(extension)
        return undefined
    }

    async updateExtension(extension: IE): Promise<IE> {
        if(this.preloadedExtensions[extension.id]) {
            this.preloadedExtensions[extension.id] = {
                ...this.preloadedExtensions[extension.id],
                updatedAt: new Date().getTime(),
            }
            return this.preloadedExtensions[extension.id]
        }
        if(!this.repo) {
            throw new Error('can not alter non-preloaded extensions without a repository')
        }
        return await this.repo.updateExtension(extension)
    }

    async listExtensions(): Promise<IE[]> {
        try {
            const list = await this.repo?.listExtensions()
            return [
                ...Object.values(this.preloadedExtensions),
                ...list?.filter(e => !this.preloadedExtensions[e.id]) || [],
            ]
        } catch(e) {
            if(e instanceof ErrorModelNotFound) {
                // noop
                return []
            }
            throw e
        }
    }

    preloadSync(hookService: HookService) {
        this.preloadExtensions?.forEach(extensionId => {
            const def = this.getDefinitionSync(extensionId)
            if(def.hooks) {
                def.hooks.forEach((hookDef, i) => {
                    const parsedParent = hookDef.parent.replace('{{extId}}', extensionId)
                    hookService.registerHook({
                        ...hookDef,
                        id: 'preload-' + extensionId + '-' + i,
                        from: 'ext:' + extensionId,
                        parent: parsedParent,
                    })
                })
            }
            this.preloadedExtensions[extensionId] = {
                id: extensionId,
                createdAt: new Date().getTime(),
                updatedAt: new Date().getTime(),
                version: def.version,
                name: def.name,
                preloaded: true,
            } as IE
        })
    }
}
