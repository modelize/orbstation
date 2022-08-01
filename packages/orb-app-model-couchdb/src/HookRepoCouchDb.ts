import Nano from 'nano'
import { ModelInteropDefinition, ModelInteropDescription, ModelOperationResult } from '@modelize/interop/ModelService'
import { IHook, IHookRepository } from '@orbstation/app/HookService'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'

export type IHookCouchDb = IHook & Nano.MaybeDocument

export class HookRepoCouchDb implements IHookRepository {
    private db: Nano.DocumentScope<IHookCouchDb>
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
            id: 'model',
            domain: 'system',
        }
        return {
            desc: desc,
            onInstall: async() => {
                const dbs = await this.couchDb.db().list()
                /*const [r1, l1] = await ServiceService.use(CouchDbService)
                    .destroyView(desc.id, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)*/
                const [r2, l2] = await couchDb
                    .createOrUpdateView(this.table, dbs, {
                        partitioned: true,
                    })
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
                const [r3, l3] = await couchDb
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
                // return [r2, l2]
                // return [r1 && r2, [...l1, ...l2]]
                return [r2 && r3, [...l2, ...l3]]
            },
            onUninstall: async() => {
                const dbs = await this.couchDb.db().list()
                return await couchDb
                    .destroyView(desc.id, dbs)
                    .then((l) => [true, l] as ModelOperationResult)
                    .catch(() => [false, []] as ModelOperationResult)
            },
        }
    }

    private static processOp(obj: IHookCouchDb, response: Nano.DocumentInsertResponse): IHookCouchDb {
        if(response.ok) {
            obj._id = response.id
            obj._rev = response.rev
        }
        return obj
    }

    async createHook(newHook: IHookCouchDb): Promise<IHookCouchDb> {
        const hook = {
            ...newHook,
            _id: newHook.parent + ':' + newHook.id,
        }
        const response = await this.db.insert(hook)
        if(!response.ok) {
            throw new Error('could not create hook')
        }
        return HookRepoCouchDb.processOp(hook, response)
    }

    registerHook(_newHook: IHookCouchDb): void {
        throw new Error('HookRepoCouchDb does not support register hook')
    }

    async getHook(hookId: string): Promise<IHookCouchDb> {
        try {
            return await this.db.get(hookId)
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async updateHook(hook: IHookCouchDb): Promise<IHookCouchDb> {
        if(!hook._rev) throw new Error('create hook before update')
        const response = await this.db.insert({
            ...hook,
            _id: hook.parent + ':' + hook.id,
        })
        if(!response.ok) {
            throw new Error('could not update hook')
        }
        return HookRepoCouchDb.processOp(hook, response)
    }

    async listHooks(): Promise<IHookCouchDb[]> {
        const hooks = await this.db.list({include_docs: true})
        return hooks.rows.map(r => {
            return r.doc as IHookCouchDb
        })
    }

    async listHooksOfParent(parent: string, limit: number = 100): Promise<IHookCouchDb[]> {
        try {
            const hooks = await this.db.partitionedList(parent, {
                include_docs: true,
                limit: limit,
            })
            return hooks.rows.map(r => {
                return r.doc as IHookCouchDb
            })
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async listHooksOf(from: string, limit: number = 1000): Promise<IHookCouchDb[]> {
        try {
            const hooks = await this.db.find({
                selector: {
                    from: {'$eq': from},
                },
                sort: ['from'],
                limit: limit,
            })
            return hooks.docs.map(r => {
                return r as IHookCouchDb
            })
        } catch(e) {
            throw CouchDbService.makeModelError(e)
        }
    }

    async deleteHook(hook: IHookCouchDb): Promise<void> {
        await this.db.destroy(hook._id as string, hook._rev as string)
    }

    onChanges(cb: (data: IHookCouchDb) => void) {
        this.db
            .changesReader
            .start({
                // fastChanges: true,
                includeDocs: true,
                selector: {
                    parent: {'$eq': 'router'},
                },
            })
            .on('change', (change) => {
                // console.log('change', change)
                // todo: seems changesReader doesn't support deletions, just changes
                cb(change.doc)
            })
            /*.on('batch', (b) => {
                console.log('a batch of', b.length, 'changes has arrived')
                b.forEach(change => {
                    console.log(change)
                })
            })
            .on('seq', (s) => {
                console.log('sequence token', s)
            })*/
            .on('error', (e) => {
                console.error('error', e)
            })
    }
}
