import { RouteDef } from '@orbstation/route/RouteDef'

// todo: add further strict typings
export interface OpenApiSpecPathMethod {
    operationId?: string
    summary?: string
    tags?: string[]
    parameters?: any[]
    responses?: { [k: string]: any }
    requestBody?: {
        description?: string
        required?: boolean
        content?: {
            'application/json'?: {
                schema?: any
                [k: string]: any
            }
            [k: string]: any
        }
        [k: string]: any
    }
    security?: any[]

    [k: string]: any
}

export interface OpenApiSpecPath {
    [method: string]: OpenApiSpecPathMethod
}

export interface OpenApiSpecCollection {
    [path: string]: OpenApiSpecPath
}

export interface OpenApiRoute extends RouteDef {
    spec?: Omit<OpenApiSpecPathMethod, 'operationId'>
    noSpec?: boolean
    pathServer?: string
}
