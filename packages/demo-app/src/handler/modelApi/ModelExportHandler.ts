import { RouteHandler } from '@orbstation/route/RouteHandler'
import { ServiceService } from '../../services.js'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { DatabaseScope } from 'nano'

const exportDb = async(db: DatabaseScope, dbId: string, startKey?: string, limit: number = 4) => {
    const rows: any[] = []
    const dbVars = await db.use<any>(dbId).list({
        include_docs: true,
        limit: limit + 1,
        start_key: startKey,
    })
    const overLimit = dbVars.rows.length > limit
    // todo: GC optimize this:
    rows.push(...dbVars.rows.slice(0, limit))
    // console.log(dbId, overLimit, dbVars.total_rows, dbVars.offset, dbVars.rows[limit]?.key)
    if(overLimit) {
        rows.push(...await exportDb(db, dbId, dbVars.rows[limit]?.key, limit))
    }
    return rows
}
const ModelExportHandler: RouteHandler = async(_req, res) => {
    const db = ServiceService.use(CouchDbService)
    const existingDbs = await db.db().list()
    const dbExport = {}
    for(const dbId of existingDbs) {
        if(dbId.startsWith('_')) {
            // couchdb system databases
            continue
        }

        // dbExport[dbId] = await exportDb(db.db(), dbId)
        dbExport[dbId] = await exportDb(db.db(), dbId, undefined, 5)
            // todo: optimize "do not export index docs"
            .then(r => r.filter((row) => !row.doc._id?.startsWith('_design/')))
            // .then(r => r.filter((row) => row.doc.language !== 'query'))
            .then(r => r.map((row) => row.doc))
    }
    return res.send({
        vars: dbExport,
    })
}

export default ModelExportHandler
