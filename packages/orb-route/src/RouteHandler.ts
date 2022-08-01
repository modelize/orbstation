import express from 'express'

export type RouteMiddleware<Q extends express.Request = express.Request, S extends express.Response = express.Response> = (req: Q, res: S, next: () => void) => Promise<any>
export type RouteHandler<Q extends express.Request = express.Request, S extends express.Response = express.Response> = (req: Q, res: S) => Promise<any>

