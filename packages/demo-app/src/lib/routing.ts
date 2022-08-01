import express from 'express'
import { IApp } from '@orbstation/app/AppService'
import { RouteHandler } from '@orbstation/route/RouteHandler'

export interface RequestCustomPayload extends express.Request {
    authId?: any
    trace?: string
    appInfo?: IApp
}

export const handlerErrorWrapper = (id: string, fn: RouteHandler) => (req: express.Request, res: express.Response, next: express.NextFunction): Promise<RouteHandler> => {
    res.locals.api_id = id
    return fn(req, res).catch(next)
}

/**
 * Loading express handlers dynamically
 * @example use `app.get`, `app.post` like needed
 * app.get(
 *     '/example/url-path',
 *     (req: express.Request, res: express.Response, next: express.NextFunction) =>
 *         dynamicLoader(
 *             () => import ('./handler/TemplateOfDistributionsHandler').then(extension => extension.default)
 *         )(req, res).catch(next)
 * )
 */
export const dynamicLoader =
    (importer: () => Promise<RouteHandler>) =>
        async(req: express.Request, res: express.Response): Promise<RouteHandler> =>
            importer().then(handler => handler(req, res))
