import { DataContextRepository, IDataContext } from '../model/DataContextRepository.js'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'

export class DataContextService {
    private repo: DataContextRepository

    constructor(
        config: {
            repo: DataContextRepository
        },
    ) {
        this.repo = config.repo
    }

    getModel() {
        return this.repo.getModel()
    }

    async getDataContext(dataContextId: string): Promise<IDataContext | undefined> {
        try {
            return await this.repo.getDataContext(dataContextId)
        } catch(e) {
            if(e instanceof ErrorModelNotFound) {
                // noop
            } else {
                throw e
            }
        }
        return undefined
    }

    async createDataContext(dataContext: IDataContext): Promise<IDataContext> {
        return await this.repo.createDataContext(dataContext)
    }

    async deleteDataContext(dataContext: IDataContext): Promise<void> {
        await this.repo.deleteDataContext(dataContext._id as string, dataContext._rev as string)
    }

    async updateDataContext(dataContext: IDataContext): Promise<IDataContext> {
        return await this.repo.updateDataContext(dataContext)
    }

    async listDataContexts(): Promise<IDataContext[]> {
        return await this.repo.listDataContexts()
    }

    async listDataContextsOfExt(extension: string, limit?: number): Promise<IDataContext[]> {
        return await this.repo.listDataContextsOfExt(extension, limit)
    }
}
