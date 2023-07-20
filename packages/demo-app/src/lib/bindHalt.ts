export interface OnHaltHandler {
    server: ((signal: string) => Promise<void>)[]
    app: (() => Promise<void>)[]
    system: (() => Promise<void>)[]
    log?: () => Promise<void>
}

const now = () => {
    const date = new Date()
    return date.getUTCHours().toFixed(0).padStart(2, '0') + ':' +
        date.getUTCMinutes().toFixed(0).padStart(2, '0') + ':' +
        date.getUTCSeconds().toFixed(0).padStart(2, '0')
}

export const handleHalt = (onHalt: OnHaltHandler, debugShutdown?: boolean) => async function handleShutdown(signal: string) {
    // first close the server, e.g. so no new connections can be created
    console.debug(now() + ' [' + signal + '] ' + 'server: halt (' + onHalt.server.length + ')')

    let hasError = false
    for(const onCloseServer of onHalt.server) {
        try {
            if(debugShutdown) {
                console.debug(now() + ' [' + signal + '] ' + 'server: halting: ' + onCloseServer.name)
            }
            await onCloseServer(signal)
            if(debugShutdown) {
                console.debug(now() + ' [' + signal + '] ' + 'server: halted', onCloseServer.name)
            }
        } catch(e) {
            hasError = true
            console.error(now() + ' [' + signal + '] ' + 'server: halt failed', onCloseServer.name, e)
        }
    }

    // then clean up your resources and stuff
    console.debug(now() + ' [' + signal + '] ' + 'app: halt (' + onHalt.app.length + ')')
    await Promise.allSettled(onHalt.app.map(halt => halt()))
        .catch(() => hasError = true)

    console.debug(now() + ' [' + signal + '] ' + 'system: halt (' + onHalt.system.length + ')')
    for(const onCloseSystem of onHalt.system) {
        try {
            if(debugShutdown) {
                console.debug(now() + ' [' + signal + '] ' + 'system: halting: ' + onCloseSystem.name)
            }
            // todo: use Shutdown here to support parallel and sequential closings
            await onCloseSystem()
            if(debugShutdown) {
                console.debug(now() + ' [' + signal + '] ' + 'system: halted: ' + onCloseSystem.name)
            }
        } catch(e) {
            hasError = true
            console.debug(now() + ' [' + signal + '] ' + 'system: halt failed', onCloseSystem.name, e)
        }
    }

    console.debug(now() + ' [' + signal + '] ' + 'system: halted')
    await onHalt.log?.()

    if(debugShutdown) {
        // this isn't shown in e.g. external app log-streams, as those where closed just now
        console.debug(now() + ' [' + signal + '] ' + 'log: halted')
    }

    // then exit gracefully
    process.exit(hasError ? 81 : 0)
}

export const bindHalt = (signals: string[], debugShutdown = false) => {
    // todo: make this maybe as a class and include the shutdown there to be able to easily use it in server or cli
    const onHalt: OnHaltHandler = {
        server: [],
        app: [],
        system: [],
    }
    let closing = false
    const registerShutdown = (event: string) => {
        process.on(event, () => {
            if(closing) {
                console.debug(now() + ' [' + event + '] process termination signal - force quit')
                process.exit(1)
            }
            closing = true
            console.debug(now() + ' [' + event + '] process termination signal')
            handleHalt(onHalt, debugShutdown)(event)
                .then(() => {
                    // noop
                })
        })
    }

    signals.forEach(registerShutdown)

    return onHalt
}
