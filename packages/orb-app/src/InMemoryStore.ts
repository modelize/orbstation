import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'

export class InMemoryStore<I> {
    protected dataStore: { [id: string]: I }
    protected readonly readOnly: boolean | undefined

    constructor(
        dataStore: { [id: string]: I } = {},
        readOnly?: boolean,
    ) {
        this.dataStore = dataStore
        this.readOnly = readOnly
    }

    async create(id: string, item: I): Promise<I> {
        if(this.readOnly) {
            throw new Error('inmemory repository can not create data')
        }
        this.dataStore[id] = item
        return item
    }

    createSync(id: string, item: I): void {
        if(this.readOnly) {
            throw new Error('inmemory repository can not createSync data')
        }
        this.dataStore[id] = item
    }

    async get(id: string): Promise<I> {
        if(!this.dataStore[id]) {
            throw new ErrorEntryNotFound()
        }
        return this.dataStore[id]
    }

    async delete(id: string): Promise<void> {
        if(this.readOnly) {
            throw new Error('inmemory repository can not delete data')
        }
        if(!this.dataStore[id]) {
            throw new ErrorEntryNotFound()
        }
        delete this.dataStore[id]
    }

    async update(id: string, item: I): Promise<I> {
        if(this.readOnly) {
            throw new Error('inmemory repository can not update data')
        }
        this.dataStore[id] = item
        return item
    }

    async values(): Promise<I[]> {
        return Object.values(this.dataStore)
    }
}
