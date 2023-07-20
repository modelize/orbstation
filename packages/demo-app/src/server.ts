import { appStarter } from './function.js'
import spdy from 'spdy'
import process from 'process'
// import ws from './ws.js'

const now = () => {
    const date = new Date()
    return date.getUTCHours().toFixed(0).padStart(2, '0') + ':' +
        date.getUTCMinutes().toFixed(0).padStart(2, '0') + ':' +
        date.getUTCSeconds().toFixed(0).padStart(2, '0')
}

appStarter()
    .then(({app, onHalt, ServiceService}) => {
        // todo: maybe add the `runId`, which is used in `cli`, globally, as maybe also good for general signals logging
        const server = spdy
            .createServer(
                {
                    spdy: {
                        // @ts-ignore
                        protocols: ['h2c'],
                        plain: true,
                        ssl: false,
                    },
                    /*key: fs.readFileSync('./server.key'),
                    cert: fs.readFileSync('./server.crt'),*/
                },
                app,
            )
            .on('error', (err: any) => {
                if(err) {
                    throw new Error(err)
                }
            })
            .listen((process.env.PORT ? parseInt(process.env.PORT) : 3000) as number, () => {
                console.debug(now() + ' [BOOT] server: started on ' + ServiceService.config('host'))
            })
        return {app, onHalt, server}
    })
    .then(({server, onHalt}) => {
        // if(envIsTrue(process.env.RUN_WSS, false)) {
        //     return ws(server)
        //         .then(({closeSocket, closeLive}) => {
        //             console.debug(now() + ' [BOOT] wss: listening')
        //             onHalt.server.push(closeSocket)
        //             // `closeLive` must be closed BEFORE redis is closed
        //             onHalt.app.push(closeLive)
        //             return {server, onHalt}
        //         })
        // }
        return {server, onHalt}
    })
    .then(({server, onHalt}) => {
        // HTTP Server won't close when WS is still open
        onHalt.server.push(function closeServer() {
            return new Promise<void>((resolve, reject) => {
                server.close((err) => {
                    if(err) {
                        reject(err)
                        return
                    }
                    resolve()
                })
            })
        })
    })
    .catch(e => {
        console.error('AppStarter failed', e)
        process.exit(1)
    })
