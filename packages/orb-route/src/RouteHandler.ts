import express from 'express'

export type RouteMiddleware<Q extends express.Request = express.Request, S extends express.Response = express.Response> =
    (req: Q, res: S, next: express.NextFunction) =>
        express.Response | void | Promise<express.Response | void>

export type RouteHandler<Q extends express.Request = express.Request, S extends express.Response = express.Response> =
    (req: Q, res: S) =>
        express.Response | void | Promise<express.Response | void>

