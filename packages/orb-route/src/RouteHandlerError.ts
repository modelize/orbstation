export class RouteHandlerError extends Error {
    statusCode?: number = undefined
    error?: any = undefined
    publicMessage?: string = undefined

    static fromError(e: any) {
        if(e instanceof Error) {
            return new RouteHandlerError(e.message)
                .setStatusCode(500)
                .setError(e)
        }
        return new RouteHandlerError(e)
            .setStatusCode(500)
            .setPublicMessage('system-error')
            .setError(e)
    }

    setStatusCode(statusCode: number): RouteHandlerError {
        this.statusCode = statusCode
        return this
    }

    setError(error: any): RouteHandlerError {
        this.error = error
        return this
    }

    setPublicMessage(publicMessage: string): RouteHandlerError {
        this.publicMessage = publicMessage
        return this
    }
}
