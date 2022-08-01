import { SchemaService } from '@bemit/schema/SchemaService'
import { ServiceService } from '../services.js'
import { RouteHandler } from '@orbstation/route/RouteHandler'

const SchemaListHandler: RouteHandler = async(req, res) => {
    const schemaService = ServiceService.use(SchemaService)
    const scopeId = req.params.scopeId
    if(!scopeId.startsWith('@')) {
        return res.status(400).send({
            error: 'invalid scope'
        })
    }
    return res.send({
        schemas: await schemaService.list({
            path: scopeId,
        }).then(r => r?.schemas),
    })
}

export default SchemaListHandler
