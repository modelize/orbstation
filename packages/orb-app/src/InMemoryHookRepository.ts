import { ModelInteropDefinition } from '@modelize/interop/ModelService'
import { IHookCouchDb } from '@orbstation/app-model-couchdb/HookRepoCouchDb.js'
import { IHook, IHookRepository } from '@orbstation/app/HookService'
import { InMemoryStore } from '@orbstation/app/InMemoryStore'

export class InMemoryHookRepository<IH extends IHook = IHook> implements IHookRepository {
    private readonly store: InMemoryStore<IH>
    protected readonly onChangesCb: ((data: IH) => void)[] = []

    constructor(store: { [id: string]: IH } = {}, readOnly = false) {
        this.store = new InMemoryStore<IH>(store, readOnly)
    }

    getModel(): ModelInteropDefinition {
        return {
            desc: {
                provider: 'inmemory',
                id: 'hook',
                domain: 'system',
                readOnly: true,
                autoCreate: true,
            },
        }
    }

    async createHook(newHook: IH): Promise<IH> {
        newHook = await this.store.create(newHook.id, newHook as IH)
        this.dispatchChanges(newHook)
        return newHook
    }

    registerHook(newHook: IH) {
        this.store.createSync(newHook.id, newHook as IH)
    }

    async getHook(hookId: string): Promise<IH> {
        return this.store.get(hookId)
    }

    async updateHook(hook: IH): Promise<IH> {
        hook = await this.store.update(hook.id, hook)
        this.dispatchChanges(hook)
        return hook
    }

    async listHooks(): Promise<IH[]> {
        return this.store.values()
    }

    async listHooksOfParent(parent: string): Promise<IH[]> {
        const list = await this.store.values()
        return list.filter(h => h.parent === parent)
    }

    async listHooksOf(from: string): Promise<IH[]> {
        const list = await this.store.values()
        return list.filter(h => h.from === from)
    }

    async deleteHook(hook: IH): Promise<void> {
        await this.store.delete(hook.id)
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
