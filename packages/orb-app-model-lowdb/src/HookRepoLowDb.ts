import { IHookCouchDb } from '@orbstation/app-model-couchdb/HookRepoCouchDb'
import { ErrorDuplicateEntry } from '@modelize/interop/ErrorDuplicateEntry'
import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'
import { Low } from 'lowdb'
import { ModelInteropDefinition, ModelInteropDescription } from '@modelize/interop/ModelService'
import { IHook, IHookRepository } from '@orbstation/app/HookService'

export class HookRepoLowDb<IH extends IHook = IHook> implements IHookRepository {
    protected readonly lowDb: Low<{
        entries: { [id: string]: IH }
        byParent: { [parent: string]: string[] }
    }>
    protected readonly onChangesCb: ((data: IH) => void)[] = []

    constructor(lowDb: Low) {
        this.lowDb = lowDb as Low<{
            entries: { [id: string]: IH }
            byParent: { [parent: string]: string[] }
        }>
    }

    getModel(): ModelInteropDefinition {
        const desc: ModelInteropDescription = {
            provider: 'lowdb',
            id: 'hook',
            domain: 'system',
        }
        return {
            desc: desc,
        }
    }

    protected async readDb(): Promise<{
        entries: { [id: string]: IH }
        byParent: { [parent: string]: string[] }
    }> {
        // todo: without this "has been initialized" it works multi-threaded and from CLI+API concurrently
        //       but it introduces a lot of performance impact of course
        // if(this.lowDb.data) return this.lowDb.data
        await this.lowDb.read()
        this.lowDb.data = this.lowDb.data || {
            entries: {},
            byParent: {},
        }
        return this.lowDb.data
    }

    protected processHookUpdate(
        data: {
            entries: { [id: string]: IH }
            byParent: { [parent: string]: string[] }
        },
        hook: IH,
    ) {
        if(!data.byParent[hook.parent]) {
            data.byParent[hook.parent] = []
        }
        data.byParent[hook.parent].push(hook.id)
    }

    protected processHookDelete(
        data: {
            entries: { [id: string]: IH }
            byParent: { [parent: string]: string[] }
        },
        hook: IH,
    ) {
        const oldI = data.byParent[hook.parent].findIndex(h => h === hook.id)
        if(oldI !== -1) {
            data.byParent[hook.parent].splice(oldI, 1)
        }
        if(data.byParent[hook.parent].length === 0) {
            delete data.byParent[hook.parent]
        }
    }

    async createHook(newHook: IH): Promise<IH> {
        const hook = {
            ...newHook,
            // _id: newHook.parent + ':' + newHook.id,
        }
        const data = await this.readDb()
        if(data.entries[hook.id]) {
            throw new ErrorDuplicateEntry()
        }
        data.entries[hook.id] = hook as IH
        this.processHookUpdate(data, hook)
        await this.lowDb.write()
        this.dispatchChanges(hook)
        return {...data.entries[hook.id]}
    }

    registerHook(_newHook: IH): void {
        throw new Error('HookRepoLowDb does not support register hook')
    }

    async getHook(hookId: string): Promise<IH> {
        const data = await this.readDb()
        if(!data.entries[hookId]) {
            throw new ErrorEntryNotFound()
        }
        return {...data.entries[hookId]}
    }

    async updateHook(hook: IH): Promise<IH> {
        const oldHook = await this.getHook(hook.id)
        // todo: this is hacky for lowdb, the read is executed always, thus here in `getHook` and the next line,
        //       the read must be after the `get` part, otherwise the read inside of get destroys the ref of `data`
        const data = await this.readDb()
        data.entries[hook.id] = hook as IH
        if(hook.parent !== oldHook.parent) {
            this.processHookUpdate(data, hook)
            this.processHookDelete(data, oldHook)
        }
        await this.lowDb.write()
        this.dispatchChanges(hook)
        return {...data.entries[hook.id]}
    }

    async listHooks(): Promise<IH[]> {
        const data = await this.readDb()
        return Object.values(data.entries)
    }

    async listHooksOfParent(parent: string, limit: number = 100): Promise<IH[]> {
        const data = await this.readDb()
        const ids = data.byParent[parent] || []
        return ids.map(id => data.entries[id])
    }

    async listHooksOf(from: string, limit: number = 1000): Promise<IH[]> {
        const data = await this.readDb()
        return Object.values(data.entries).filter(r => r.from === from)
    }

    async deleteHook(hook: IH): Promise<void> {
        const data = await this.readDb()
        if(!data.entries[hook.id]) {
            throw new ErrorEntryNotFound()
        }
        delete data.entries[hook.id]
        this.processHookDelete(data, hook)
        await this.lowDb.write()
    }

    async cleanDb(): Promise<void> {
        const data = await this.readDb()
        data.entries = {}
        data.byParent = {}
        await this.lowDb.write()
    }

    private dispatchChanges(item: IH) {
        this.onChangesCb.forEach((cb) => {
            cb(item)
        })
    }

    onChanges(cb: (data: IHookCouchDb) => void) {
        this.onChangesCb.push(cb)
    }
}
