import { RouteHandler } from '@orbstation/route/RouteHandler'
import express from 'express'

/**
 * Loading express handlers dynamically
 * @example use `app.get`, `app.post` like needed
 * app.get(
 *     '/example/url-path',
 *     loadHandler(() => import ('./handler/PingHandler.js').then(module => module.default)),
 * )
 * @example with error handling
 * const handler = loadHandler(() => import ('./handler/PingHandler').then(module => module.default))
 * app.get(
 *     '/example/url-path',
 *     (req: express.Request, res: express.Response, next: express.NextFunction) =>
 *         handler(req, res).catch(next),
 * )
 */
export const loadableHandler =
    <H extends RouteHandler>(importer: () => Promise<H>) => {
        let handler: H
        return async(...[req, res]: Parameters<H>): Promise<express.Response | void> => {
            if(!handler) {
                handler = await importer()
            }
            return handler(req, res)
        }
    }
