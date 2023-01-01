import process from 'process'

export class CommandRun<C = undefined> {
    public readonly runId: string
    public readonly context: C | undefined
    protected readonly onHaltCb: (() => Promise<void> | void)[] = []
    protected halting: boolean = false
    protected readonly opts: { logHalt?: boolean } = {}

    constructor(runId: string, context?: C, opts: CommandRun['opts'] = {}) {
        this.runId = runId
        this.context = context
        this.opts = opts
    }

    onHalt(cb: () => Promise<void> | void) {
        this.onHaltCb.push(cb)
    }

    isHalted() {
        return this.halting
    }

    protected logDebug(message: string) {
        if(this.opts.logHalt) {
            process.stdout.write('[' + this.runId + '] ' + message + '\n')
        }
    }

    async halt() {
        this.halting = true
        try {
            await Promise.all(this.onHaltCb.map((on) => on() || Promise.resolve()))
            this.logDebug('cli: closed')
        } catch {
            process.stderr.write('[' + this.runId + '] ' + 'cli: shutdown error' + '\n')
            process.exit(10)
        }
    }

    listenOnSignals(signals: string[] = ['SIGINT', 'SIGTERM']): CommandRun<C> {
        const listenOnSignal = (signal: string) => {
            process.on(signal, () => {
                this.logDebug('cli: received ' + signal)
                this.halt()
                    .then(() => undefined)
                    .catch((e) => {
                        process.stderr.write('[' + this.runId + '] ' + 'cli: halt by ' + signal + ' with error' + '\n')
                        process.stderr.write(JSON.stringify(e) + '\n')
                        process.exit(1)
                    })
            })
        }
        signals.forEach(signal => {
            listenOnSignal(signal)
        })

        return this
    }
}
