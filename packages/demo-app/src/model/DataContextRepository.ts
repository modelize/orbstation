import Nano from 'nano'
import { ServiceService } from '../services.js'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { ModelInteropDefinition, ModelInteropDescription, ModelOperationResult } from '@modelize/interop/ModelService'

export interface IDataContext extends Nano.MaybeDocument {
    id: string
    from: string
    context: any
}

export class DataContextRepository {
    private db: Nano.DocumentScope<IDataContext>
    protected readonly table: string
    protected readonly couchDb: CouchDbService

    constructor(table: string, couchDb: CouchDbService) {
        this.db = couchDb.db().use(table)
        this.couchDb = couchDb
        this.table = table
    }

    getModel(): ModelInteropDefinition {
        const desc: ModelInteropDescription = {
            provider: 'couchdb',
            id: 'data_context',
            domain: 'system',
        }
        return {
            desc: desc,
            onInstall: async() => {
                const dbs = await this.couchDb.db().list()
                const [r2, l2] = await ServiceService.use(CouchDbService)
                    .createOrUpdateView(this.table, dbs, {
                        // partitioned: true,
                    })
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
                const [r3, l3] = await ServiceService.use(CouchDbService)
                    .createOrUpdateViewIndex(this.table, true, {
                        partitioned: false,
                        ddoc: 'index-from',
                        name: 'index-from',
                        index: {
                            fields: ['from']
                        },
                    })
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
                return [r2 && r3, [...l2, ...l3]]
            },
            onUninstall: async() => {
                const dbs = await this.couchDb.db().list()
                return await ServiceService.use(CouchDbService)
                    .destroyView(this.table, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
            },
        }
    }

    private static processOp(obj: IDataContext, response: Nano.DocumentInsertResponse): IDataContext {
        if(response.ok) {
            obj._id = response.id
            obj._rev = response.rev
        }
        return obj
    }

    async createDataContext(newDataContext: IDataContext): Promise<IDataContext> {
        const response = await this.db.insert({
            _id: newDataContext._id || newDataContext.id,
            ...newDataContext,
        })
        if(!response.ok) {
            throw new Error('could not create dataContext')
        }
        return DataContextRepository.processOp(newDataContext, response)
    }

    async getDataContext(dataContextId: string): Promise<IDataContext> {
        try {
            return await this.db.get(dataContextId)
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async updateDataContext(dataContext: IDataContext): Promise<IDataContext> {
        if(!dataContext._rev) throw new Error('create dataContext before update')
        const response = await this.db.insert(dataContext)
        if(!response.ok) {
            throw new Error('could not update dataContext')
        }
        return DataContextRepository.processOp(dataContext, response)
    }

    async listDataContexts(): Promise<IDataContext[]> {
        try {
            const dataContexts = await this.db.list({include_docs: true})
            return dataContexts.rows.map(r => {
                return r.doc as IDataContext
            })
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async listDataContextsOfExt(extension: string, limit: number = 1000): Promise<IDataContext[]> {
        try {
            const dataContexts = await this.db.find({
                selector: {
                    from: {'$eq': 'ext:' + extension},
                },
                sort: ['from'],
                limit: limit,
            })
            return dataContexts.docs.map(r => {
                return r as IDataContext
            })
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async deleteDataContext(dataContextId: string, rev: string): Promise<void> {
        await this.db.destroy(dataContextId, rev)
    }
}
