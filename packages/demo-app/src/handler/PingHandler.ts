import { SchemaService } from '@bemit/schema/SchemaService'
import { ServiceService } from '../services.js'
import path from 'path'
import { fileURLToPath } from 'url'
import { RouteHandler } from '@orbstation/route/RouteHandler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PingHandler: RouteHandler = async(_req, res) => {
    const schemaService = ServiceService.use(SchemaService)
    return res.send({
        schema: await schemaService.resolve({
            path: path.resolve(__dirname, '../schemas', 'schema.json'),
        }).then(r => r?.schema),
        schemaNs: await schemaService.resolve({
            path: '@commons/schema1',
        }).then(r => r?.schema),
        schemaJs: await schemaService.resolve({
            path: '@commonsJs/form',
        }).then(r => r?.schema),
        schemaList: await schemaService.list({
            path: '@commons',
        }).then(r => r?.schemas),
    })
}

export default PingHandler
