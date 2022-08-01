export type DomainEventHandlerFn<P = any, E extends { [k: string]: any } = { [k: string]: any }> = (
    domain: string, event: string,
    payload: P,
    exec: E,
) => Promise<E>

export interface DomainEventHandlerDefinition {
    [domain: string]: {
        [event: string]: DomainEventHandlerFn[]
    }
}

export class DomainEventDispatcher {
    private readonly handler: DomainEventHandlerDefinition = {}

    constructor(handler: DomainEventHandlerDefinition) {
        this.handler = handler
    }

    async dispatch<P = any>(
        domain: string, event: string,
        payload: P,
    ): Promise<number> {
        if(!this.handler?.[domain]?.[event]) {
            return Promise.resolve(0)
        }
        const handler = this.handler[domain][event]
        let exec: { [k: string]: any } = {}
        for(const h of handler) {
            exec = await h(domain, event, payload, exec)
        }
        return Promise.resolve(handler.length)
    }
}
