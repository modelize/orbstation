import { ModelInteropDefinition } from '@modelize/interop/ModelService'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'

export interface IHook {
    id: string
    type: string
    from: string
    parent: string
    restrict: string[]

    [k: string]: any
}

export interface IHookRepository {
    getModel(): ModelInteropDefinition

    createHook(newHook: Partial<IHook> & Pick<IHook, 'from' | 'type' | 'parent' | 'restrict'>): Promise<IHook>

    registerHook(newHook: Partial<IHook> & Pick<IHook, 'from' | 'type' | 'parent' | 'restrict'>): void

    getHook(hookId: string): Promise<IHook>

    updateHook(hook: IHook): Promise<IHook>

    listHooks(): Promise<IHook[]>

    listHooksOfParent(parent: string, limit?: number): Promise<IHook[]>

    listHooksOf(extension: string, limit?: number): Promise<IHook[]>

    deleteHook(hook: IHook): Promise<void>

    onChanges(cb: (data: IHook) => void): void
}

export class HookService {
    private repo: IHookRepository

    constructor(
        config: {
            repo: IHookRepository
        },
    ) {
        this.repo = config.repo
    }

    getModel() {
        return this.repo.getModel()
    }

    async getHook(hookId: string): Promise<IHook | undefined> {
        try {
            return await this.repo.getHook(hookId)
        } catch(e) {
            if(e instanceof ErrorModelNotFound) {
                // noop
            } else {
                throw e
            }
        }
        return undefined
    }

    async createHook(newHook: Partial<IHook> & Pick<IHook, 'from' | 'type' | 'parent' | 'restrict'>): Promise<IHook> {
        return await this.repo.createHook(newHook)
    }

    registerHook(newHook: Partial<IHook> & Pick<IHook, 'from' | 'type' | 'parent' | 'restrict'>): void {
        this.repo.registerHook(newHook)
    }

    async deleteHook(hook: IHook): Promise<void> {
        await this.repo.deleteHook(hook)
    }

    async updateHook(hook: IHook): Promise<IHook> {
        return await this.repo.updateHook(hook)
    }

    async listHooks(): Promise<IHook[]> {
        try {
            return await this.repo.listHooks()
        } catch(e) {
            if(e instanceof ErrorModelNotFound) {
                // noop
                return []
            }
            throw e
        }
    }

    async listHooksOfParent(parent: string, limit?: number): Promise<IHook[]> {
        try {
            return await this.repo.listHooksOfParent(parent, limit)
        } catch(e) {
            if(e instanceof ErrorModelNotFound) {
                // noop
                return []
            }
            console.log(e)
            throw e
        }
    }

    async listHooksOfExt(extension: string, limit?: number): Promise<IHook[]> {
        try {
            return await this.repo.listHooksOf('ext:' + extension, limit)
        } catch(e) {
            if(e instanceof ErrorModelNotFound) {
                // noop
                return []
            }
            throw e
        }
    }

    onChanges(cb: (data: IHook) => void) {
        this.repo.onChanges(cb)
    }
}
