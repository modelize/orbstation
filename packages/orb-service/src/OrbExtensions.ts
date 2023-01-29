import { OpenApiRoute } from '@orbstation/oas/OpenApi'

export interface OrbServiceExtension<B = unknown> {
    id: string

    onBoot?: (boot: B) => void

    routes?: OpenApiRoute[] | (() => OpenApiRoute[])
}

export class OrbExtensions<E extends OrbServiceExtension<any>> {
    private readonly extensions: E[] = []
    private readonly preloadExtensions?: (() => Promise<E>)[]
    private isBooted: boolean = false

    constructor(
        extensions?: (() => Promise<E>)[],
    ) {
        this.preloadExtensions = extensions
    }

    async boot(boot: Extract<E['onBoot'], (...args: any) => void> extends (...args: infer P) => any ? P[0] : never) {
        if(this.isBooted) {
            throw new Error('OrbExtensions can only booted once')
        }
        this.isBooted = true
        if(!this.preloadExtensions) return
        const extensions = await Promise.all(this.preloadExtensions.splice(0, this.preloadExtensions.length).map(ext => ext()))
        this.extensions.push(...extensions)
        this.extensions.forEach((extension) => {
            if(extension.onBoot) {
                extension.onBoot(boot)
            }
        })
    }

    addExtension(extension: E) {
        this.extensions.push(extension)
        return this
    }

    list(): E[] {
        if(!this.isBooted) {
            throw new Error('OrbExtensions must be booted first')
        }
        return this.extensions
    }
}
