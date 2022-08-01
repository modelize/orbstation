import { ModelInteropDefinition } from '@modelize/interop/ModelService'
import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'

export interface IApp {
    id: string
    projectId: string
    name?: string
    createdAt?: number
    updatedAt?: number
}

export interface IAppRepository {
    getModel(): ModelInteropDefinition

    createApp(newApp: Partial<IApp> & Pick<IApp, 'id' | 'projectId'>): Promise<IApp>

    getApp(appId: string): Promise<IApp>

    updateApp(app: IApp): Promise<IApp>
}

export class AppService {
    private repo: IAppRepository

    constructor(
        config: {
            repo: IAppRepository
        },
    ) {
        this.repo = config.repo
    }

    getModel() {
        return this.repo.getModel()
    }

    async getApp(appId: string): Promise<IApp | undefined> {
        try {
            return await this.repo.getApp(appId)
        } catch(e) {
            if(e instanceof ErrorEntryNotFound) {
                // noop
            } else {
                throw e
            }
        }
        return undefined
    }

    async createOrUpdateApp(projectId: string, name: string, id: string): Promise<IApp> {
        let app = await this.getApp(id)
        if(!app) {
            app = await this.createApp({projectId, name, id})
        } else {
            if(app.projectId !== projectId) {
                throw new Error('can not update station of different project')
            }
            app.name = name
            app = await this.updateApp(app)
        }
        return app
    }

    async createApp(app: Partial<IApp> & Pick<IApp, 'id' | 'projectId'>): Promise<IApp> {
        return await this.repo.createApp(app)
    }

    async updateApp(app: IApp): Promise<IApp> {
        return await this.repo.updateApp(app)
    }
}
