import Nano from 'nano'
import { ModelInteropDefinition, ModelInteropDescription, ModelOperationResult } from '@modelize/interop/ModelService'
import { IExtension, IExtensionRepository } from '@orbstation/app/ExtensionService'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'

export type IExtensionCouchDb = IExtension & Nano.MaybeDocument & {
    createdAt: number
    updatedAt: number
}

export class Extension implements IExtensionCouchDb {
    _id: string | undefined
    _rev: string | undefined
    name: string
    id: string
    version: string
    createdAt: number
    updatedAt: number

    constructor(data: Partial<IExtensionCouchDb> & Pick<IExtensionCouchDb, 'id' | 'version' | 'name'>) {
        this._id = data._id
        this._rev = data._rev
        this.id = data.id
        this.name = data.name
        this.version = data.version
        this.createdAt = data.createdAt || new Date().getTime()
        this.updatedAt = data.updatedAt || this.createdAt
    }
}

export class ExtensionRepoCouchDb<IE extends IExtensionCouchDb = IExtensionCouchDb> implements IExtensionRepository<IE> {
    private db: Nano.DocumentScope<IExtensionCouchDb>
    protected readonly table: string
    protected readonly couchDb: CouchDbService

    constructor(table: string, couchDb: CouchDbService) {
        this.db = couchDb.db().use(table)
        this.couchDb = couchDb
        this.table = table
    }

    getModel(): ModelInteropDefinition {
        const couchDb = this.couchDb
        const desc: ModelInteropDescription = {
            provider: 'couchdb',
            id: 'extension',
            domain: 'system',
        }
        return {
            desc: desc,
            onInstall: async() => {
                const dbs = await this.couchDb.db().list()
                return await couchDb
                    .createOrUpdateView(this.table, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
            },
            onUninstall: async() => {
                const dbs = await this.couchDb.db().list()
                return await couchDb
                    .destroyView(this.table, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
            },
        }
    }

    private static processOp<IE2 extends IExtensionCouchDb = IExtensionCouchDb>(obj: IE2, response: Nano.DocumentInsertResponse): IE2 {
        if(response.ok) {
            obj._id = response.id
            obj._rev = response.rev
        }
        return obj
    }

    async createExtension(newExtension: Partial<IE> & Pick<IE, 'id' | 'version' | 'name'>): Promise<IE> {
        const ext = new Extension({
            _id: newExtension.id,
            ...newExtension,
        })
        const response = await this.db.insert(ext)
        if(!response.ok) {
            throw new Error('could not create extension')
        }
        return ExtensionRepoCouchDb.processOp<IE>(ext as IE, response)
    }

    async getExtension(extensionId: string): Promise<IE> {
        try {
            const response = await this.db.get(extensionId)
            return new Extension(response) as IE
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async updateExtension(extension: IE): Promise<IE> {
        if(!extension._rev) throw new Error('create extension before update')
        extension.updatedAt = new Date().getTime()
        const response = await this.db.insert(extension)
        if(!response.ok) {
            throw new Error('could not update extension')
        }
        return ExtensionRepoCouchDb.processOp(extension, response)
    }

    async listExtensions(): Promise<IE[]> {
        try {
            const extensions = await this.db.list({include_docs: true})
            return extensions.rows.map(r => {
                return new Extension(r.doc as IExtension) as IE
            })
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async deleteExtension(extension: IE): Promise<void> {
        await this.db.destroy(extension.id, extension._rev as string)
    }
}
