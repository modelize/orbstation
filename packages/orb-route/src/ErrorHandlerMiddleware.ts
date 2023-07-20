import express, { ErrorRequestHandler } from 'express'
import { RouteHandlerError } from '@orbstation/route/RouteHandlerError'

export const ErrorHandlerMiddleware: ErrorRequestHandler = async(
    err: Error, _req: express.Request, res: express.Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _next,
) => {
    res.locals.error_stack = err.stack
    let messagePublic = 'system-error'
    let extraPublic: { [k: string]: any } = {}
    res = res.status(500)
    if(err instanceof RouteHandlerError) {
        res.locals.error = err.message || err.publicMessage
        if(err.error) {
            res.locals.error_data = err.error
        }
        if(err.statusCode) {
            res = res.status(err.statusCode)
        }
        messagePublic = err.publicMessage || 'handler-error'
        extraPublic = err.publicExtra || {}
    } else {
        res.locals.error = err.message
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {message, ...errData} = err
        if(Object.keys(errData).length > 0) {
            res.locals.error_data = errData
        }
    }

    if(process.env.NODE_ENV !== 'production') {
        return res.json({
            error: typeof err.message === 'undefined' ? messagePublic : err.message,
            reason: typeof err.message === 'undefined' ? undefined : messagePublic,
            error_stack: err.stack?.split('\n'),
        })
    }

    return res.json({
        ...extraPublic,
        error: messagePublic,
    })
}
