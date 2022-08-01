import Nano, { RequestError } from 'nano'
import { ModelInteropDefinition, ModelInteropDescription, ModelInteropRepo, ModelOperationResult } from '@modelize/interop/ModelService'
import { IApp, IAppRepository } from '@orbstation/app/AppService'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'
import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'

export type IAppCouchDb = IApp & Nano.MaybeDocument

class App implements IAppCouchDb {
    _id: string | undefined
    _rev: string | undefined
    id: string
    projectId: string
    name?: string
    createdAt: number
    updatedAt: number

    constructor(data: Partial<IAppCouchDb> & Pick<IAppCouchDb, 'id' | 'projectId'>) {
        this._id = data._id || data.id
        this._rev = data._rev
        this.id = data.id
        this.projectId = data.projectId
        this.name = data.name
        this.createdAt = data.createdAt || new Date().getTime()
        this.updatedAt = data.updatedAt || this.createdAt
    }
}

export class AppRepoCouchDb<IA extends IAppCouchDb = IAppCouchDb> implements IAppRepository, ModelInteropRepo {
    private db: Nano.DocumentScope<IA>
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
            id: 'app',
            domain: 'system',
        }
        return {
            desc: desc,
            onInstall: async() => {
                const dbs = await this.couchDb.db().list()
                return await this.couchDb
                    .createOrUpdateView(this.table, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
            },
            onUninstall: async() => {
                const dbs = await this.couchDb.db().list()
                return await this.couchDb
                    .destroyView(this.table, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
            },
        }
    }

    private static processOp<IA2 extends IAppCouchDb>(obj: IA2, response: Nano.DocumentInsertResponse): IA2 {
        if(response.ok) {
            obj._id = response.id
            obj._rev = response.rev
        }
        return obj
    }

    async createApp(newApp: Partial<IA> & Pick<IA, 'id' | 'projectId'>): Promise<IA> {
        try {
            const app = new App(newApp)
            const response = await this.db.insert(app as IA)
            if(!response.ok) {
                throw new Error('could not create app')
            }
            return AppRepoCouchDb.processOp<IA>(app as IA, response)
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async getApp(appId: string): Promise<IA> {
        try {
            const appData = await this.db.get(appId)
            return new App(appData) as IA
        } catch(e) {
            if(e instanceof Error && (e as RequestError).statusCode === 404) {
                if((e as RequestError).description?.startsWith('Database ')) {
                    throw new ErrorModelNotFound()
                }
                throw new ErrorEntryNotFound()
            } else {
                throw e
            }
        }
    }

    async updateApp(app: IA): Promise<IA> {
        if(!app._rev) throw new Error('create app before update')
        app.updatedAt = new Date().getTime()
        const response = await this.db.insert(app)
        if(!response.ok) {
            throw new Error('could not update app')
        }
        return AppRepoCouchDb.processOp<IA>(app, response)
    }
}
