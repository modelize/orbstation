import { ModelInteropDefinition } from '@modelize/interop/ModelService'
import { IApp, IAppRepository } from '@orbstation/app/AppService'
import { InMemoryStore } from '@orbstation/app/InMemoryStore'

export class InMemoryAppRepository<IA extends IApp = IApp> implements IAppRepository {
    private readonly store: InMemoryStore<IA>

    constructor(store: { [id: string]: IA } = {}, readOnly = false) {
        this.store = new InMemoryStore<IA>(store, readOnly)
    }

    getModel(): ModelInteropDefinition {
        return {
            desc: {
                provider: 'inmemory',
                id: 'app',
                domain: 'system',
                readOnly: true,
                autoCreate: true,
            },
        }
    }

    static makeWithStore<IA2 extends IApp = IApp>(newApp: IA2[]): InMemoryAppRepository<IA2> {
        return new InMemoryAppRepository<IA2>(newApp.reduce((dataStore, app) => ({
            ...dataStore,
            [app.id]: app,
        }), {}))
    }

    async createApp(newApp: Partial<IA> & Pick<IA, 'id' | 'projectId'>): Promise<IA> {
        return this.store.create(newApp.id, newApp as IA)
    }

    async getApp(appId: string): Promise<IA> {
        return this.store.get(appId)
    }

    async updateApp(app: IA): Promise<IA> {
        return this.store.update(app.id, app)
    }
}
