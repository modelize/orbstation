import { OpenApiRoute, OpenApiSpecPathMethod, OpenApiSpecCollection } from '@orbstation/oas/OpenApi'

export class OpenApiApp {
    protected readonly routes: OpenApiRoute[]
    protected specRoutes?: OpenApiSpecCollection
    protected readonly version: string
    protected baseSpec?: {
        securitySchemes?: {
            [scheme: string]: {
                type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect'
                description?: string
            } & ({
                type: 'apiKey'
                name: string
                in: 'query' | 'header' | 'cookie'
            } | {
                type: 'http'
                scheme: string
                bearerFormat: string
            } | {
                type: 'oauth2'
                flows: any
            } | {
                type: 'openIdConnect'
                openIdConnectUrl: string
            })
        }
        servers?: {
            url: string
            description?: string
            variables: {
                [variable: string]: {
                    enum?: string[]
                    default: string
                    description?: string
                }
            }
        }[]
        schemas?: {
            [schema: string]: any
        }
        security?: any[]
    }
    protected info: {
        version?: string
        title?: string
        description?: string
        license?: { name: string }
    }

    constructor(
        baseInfo: OpenApiApp['info'],
        routes: OpenApiRoute[] = [],
        baseSpec: OpenApiApp['baseSpec'] = {},
        version: string = '3.0.3',
    ) {
        this.info = baseInfo
        this.routes = routes
        this.baseSpec = baseSpec
        this.version = version
    }

    addRoutes(...routes: OpenApiRoute[]) {
        this.routes.push(...routes)
    }

    pathToExpress(path: string, parameters: OpenApiSpecPathMethod['parameters']): string {
        const pathParams = parameters?.filter(p => p.in === 'path')
        const pathParts = path.slice(1).split('/')
        return '/' + pathParts.map(pathPart => {
            if(pathPart.startsWith('{') && pathPart.endsWith('}')) {
                const cleanName = pathPart.slice(1, -1)
                const tplParam = pathParams?.find(p => p.name === cleanName)
                if(!tplParam) {
                    throw new Error('OpenApiGen missing parameter for path template `' + cleanName + '` in `' + path + '`')
                }
                return ':' + tplParam?.name + (!tplParam?.required ? '?' : '')
            }
            return pathPart
        }).join('/')
    }

    getRoutes() {
        return this.routes
    }

    genSpecRoutes(route: OpenApiRoute): { path: string, method: string, spec: OpenApiSpecPathMethod } {
        const {id, method, path, spec} = route
        return {
            path, method,
            spec: {
                ...spec || {},
                operationId: id,
                summary: spec?.summary || id,
            },
        }
    }

    getSpecRoutes(filterOperations?: string[]) {
        if(!this.specRoutes || filterOperations) {
            const specRoutes: OpenApiApp['specRoutes'] = {}
            const specRoutesList = this.routes
                .filter(r => !r.noSpec)
                .map(r => this.genSpecRoutes(r))
            for(const route of specRoutesList) {
                const {path, method, spec} = route
                if(filterOperations && (!spec.operationId || !filterOperations.includes(spec.operationId))) {
                    continue
                }
                if(!specRoutes[path]) {
                    specRoutes[path] = {}
                }
                specRoutes[path][method] = spec
            }

            if(filterOperations) {
                return specRoutes
            } else {
                this.specRoutes = specRoutes
            }
        }
        return this.specRoutes
    }

    generate(filterOperations?: string[]) {
        const openApi = {
            'openapi': this.version,
            'info': this.info,
            'servers': this.baseSpec?.servers,
            'paths': {},
            'security': this.baseSpec?.security,
            'components': {
                'securitySchemes': this.baseSpec?.securitySchemes,
                'schemas': this.baseSpec?.schemas,
            },
        }

        openApi.paths = {
            ...this.getSpecRoutes(filterOperations),
        }

        return openApi
    }
}
