import { SchemaService } from '@bemit/schema/SchemaService'
import { ServiceService } from '../services.js'
import { RouteHandler } from '@orbstation/route/RouteHandler'

const SchemaDetailsHandler: RouteHandler = async(req, res) => {
    const schemaService = ServiceService.use(SchemaService)
    const scopeId = req.params.scopeId
    if(!scopeId.startsWith('@')) {
        return res.status(400).send({
            error: 'invalid scope'
        })
    }
    const schemaId = req.params.schemaId
    return res.send({
        schema: await schemaService.resolve({
            path: scopeId + '/' + schemaId,
        }).then(r => r?.schema),
    })
}

export default SchemaDetailsHandler
