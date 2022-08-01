import Nano, { CreateIndexRequest, DatabaseCreateParams, DocumentGetResponse, RequestError } from 'nano'
import { ErrorModelNotFound } from '@modelize/interop/ErrorModelNotFound'
import { ErrorEntryNotFound } from '@modelize/interop/ErrorEntryNotFound'

export class CouchDbService {
    private nano: Nano.ServerScope

    public constructor(
        config: { endpoint: string },
    ) {
        this.nano = Nano(config.endpoint)
    }

    public db(): Nano.DatabaseScope {
        return this.nano.db
    }

    static makeModelError(e: any) {
        if(e instanceof Error && (e as RequestError).statusCode === 404) {
            if((e as RequestError).description?.startsWith('Database ')) {
                return new ErrorModelNotFound()
            }
            return new ErrorEntryNotFound()
        }
        return e
    }

    createOrUpdateView = async(
        name: string,
        dbs: string[],
        params?: DatabaseCreateParams,
        buildIndex?: (name: string) => Promise<void | (string[])>,
    ): Promise<string[]> => {
        const log: string[] = []
        if(dbs.includes(name)) {
            log.push(' > db existing `' + name + '`')
        } else {
            log.push(' > db creating `' + name + '`')
            await this.db().create(name, params)
            log.push('    ✓ created `' + name + '`')
        }
        if(buildIndex) {
            const indexLog = await buildIndex(name)
            if(indexLog) {
                log.push(...indexLog)
            }
        }
        return log
    }

    destroyView = async(
        name: string,
        dbs: string[],
    ): Promise<string[]> => {
        const log: string[] = []
        if(dbs.includes(name)) {
            log.push(' > db destroying `' + name + '`')
            await this.db().destroy(name)
            log.push('    ✓ destroyed `' + name + '`')
        } else {
            log.push(' > db not existing `' + name + '`')
        }
        return log
    }

    getIndex = async(
        name: string,
        indexName: string,
    ): Promise<DocumentGetResponse | undefined> => {
        let res: DocumentGetResponse | undefined
        try {
            res = await this.db().use(name).get('_design/' + indexName)
        } catch(e) {
            const e2 = e as RequestError
            if(e instanceof Error && e2.scope === 'couch' && e2.statusCode === 404) {
                // index does not exist
                res = undefined
            } else {
                throw e2
            }
        }
        return res?._deleted ? undefined : res
    }

    createOrUpdateViewIndex = async(
        name: string,
        recreateIndex: boolean = false,
        index: CreateIndexRequest,
    ) => {
        const log: string[] = []
        const indexData = await this.getIndex(name, index.ddoc as string)
        // todo: add as second fallback the maybe-already-existing `indexData.name`
        const friendlyName = index.name || index.ddoc
        if(recreateIndex && indexData?._id && indexData?._rev) {
            log.push('     > index delete (recreate) `' + friendlyName + '`')
            await this.db().use(name).destroy(indexData._id, indexData._rev)
            log.push('           ✓ deleted `' + friendlyName + '`')
        }

        if(recreateIndex || !indexData) {
            log.push('     > index creating `' + friendlyName + '`')
            await this.db().use(name).createIndex(index)
            log.push('           ✓ created `' + friendlyName + '`')
        } else {
            log.push('     > index exists `' + friendlyName + '`')
        }
        return log
    }

    deleteIfExistsViewIndex = async(
        name: string,
        indexName: string,
    ) => {
        const indexData = await this.getIndex(name, indexName)
        if(indexData?._id && indexData?._rev) {
            console.log('     > index delete `' + indexName + '`')
            await this.db().use(name).destroy(indexData._id, indexData._rev)
            console.log('           ✓ deleted `' + indexName + '`')
        }
    }
}
