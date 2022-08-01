import { Low } from 'lowdb'
import { ModelInteropDefinition, ModelInteropDescription } from '@modelize/interop/ModelService'
import { IExtension, IExtensionRepository } from '@orbstation/app/ExtensionService'
import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'

export type IExtensionLowDb = IExtension & {
    createdAt: number
    updatedAt: number
}

export class ExtensionLowDb implements IExtensionLowDb {
    name: string
    id: string
    version: string
    createdAt: number
    updatedAt: number

    constructor(data: Partial<IExtensionLowDb> & Pick<IExtensionLowDb, 'id' | 'version' | 'name'>) {
        this.id = data.id
        this.name = data.name
        this.version = data.version
        this.createdAt = data.createdAt || new Date().getTime()
        this.updatedAt = data.updatedAt || this.createdAt
    }
}

export class ExtensionRepoLowDb<IE extends IExtensionLowDb = IExtensionLowDb> implements IExtensionRepository<IE> {
    protected readonly lowDb: Low<{ [id: string]: IE }>

    constructor(lowDb: Low) {
        this.lowDb = lowDb as Low<{ [id: string]: IE }>
    }

    getModel(): ModelInteropDefinition {
        const desc: ModelInteropDescription = {
            provider: 'lowdb',
            id: 'extension',
            domain: 'system',
        }
        return {
            desc: desc,
        }
    }

    protected async readDb(): Promise<{ [id: string]: IE }> {
        if(this.lowDb.data) return this.lowDb.data
        await this.lowDb.read()
        this.lowDb.data = this.lowDb.data || {}
        return this.lowDb.data
    }

    async createExtension(newExtension: Partial<IE> & Pick<IE, 'id' | 'version' | 'name'>): Promise<IE> {
        const ext = new ExtensionLowDb({
            ...newExtension,
        })
        const data = await this.readDb()
        data[ext.id] = ext as IE
        await this.lowDb.write()
        return data[ext.id]
    }

    async getExtension(extensionId: string): Promise<IE> {
        const data = await this.readDb()
        if(!data[extensionId]) {
            throw new ErrorEntryNotFound()
        }
        return new ExtensionLowDb(data[extensionId]) as IE
    }

    async updateExtension(extension: IE): Promise<IE> {
        extension.updatedAt = new Date().getTime()
        const data = await this.readDb()
        data[extension.id] = extension as IE
        await this.lowDb.write()
        return data[extension.id]
    }

    async listExtensions(): Promise<IE[]> {
        const data = await this.readDb()
        return Object.values(data).map(r => {
            return new ExtensionLowDb(r) as IE
        })
    }

    async deleteExtension(extension: IE): Promise<void> {
        const data = await this.readDb()
        delete data[extension.id]
        await this.lowDb.write()
    }
}
