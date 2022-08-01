import { RouteHandler } from '@orbstation/route/RouteHandler'

export const GET = 'get'
export const POST = 'post'
export const PUT = 'put'
export const PATCH = 'patch'
export const DELETE = 'delete'
export const OPTIONS = 'options'

export type RouteMethod = typeof GET | typeof POST | typeof PUT | typeof DELETE | typeof PATCH | typeof OPTIONS

export interface RouteDef {
    id: string
    method: RouteMethod
    path: string
    handler: RouteHandler
}
