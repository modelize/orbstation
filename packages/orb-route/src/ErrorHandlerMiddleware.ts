import express, { ErrorRequestHandler } from 'express'
import { RouteHandlerError } from '@orbstation/route/RouteHandlerError'

export const ErrorHandlerMiddleware: ErrorRequestHandler = async(
    err: Error, _req: express.Request, res: express.Response,
) => {
    res.locals.error_stack = err.stack
    if(err instanceof RouteHandlerError) {
        res.locals.error = err.message || err.publicMessage
        if(err.error) {
            res.locals.error_data = err.error
        }
        if(err.statusCode) {
            res = res.status(err.statusCode)
        }
        return res.json({error: err.publicMessage})
    }
    res.locals.error = err.message
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {message, ...err2} = err
    if(Object.keys(err2).length > 0) {
        res.locals.error_data = err2
    }

    if(process.env.NODE_ENV !== 'production') {
        return res.status(500).json({error: err.stack?.split('\n')})
    }

    return res.status(500).json({error: 'system-error'})
}
