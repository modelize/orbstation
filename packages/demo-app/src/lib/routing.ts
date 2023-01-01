import express from 'express'
import { IApp } from '@orbstation/app/AppService'
import { RouteHandler } from '@orbstation/route/RouteHandler'

export interface RequestCustomPayload extends express.Request {
    authId?: any
    trace?: string
    appInfo?: IApp
}

export const handlerErrorWrapper = (id: string, fn: RouteHandler) => (req: express.Request, res: express.Response, next: express.NextFunction): Promise<express.Response | void> => {
    res.locals.api_id = id
    return fn(req, res).catch(next)
}
