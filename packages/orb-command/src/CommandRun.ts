import process from 'process'

export class CommandRun<C = undefined> {
    public readonly runId: string
    public readonly context: C | undefined
    protected readonly onHaltCb: ((signal: string) => Promise<void> | void)[] = []
    protected halting: boolean = false
    protected halted: boolean = false
    public readonly opts: { logHalt?: boolean } = {}

    constructor(runId: string, context?: C, opts: CommandRun['opts'] = {}) {
        this.runId = runId
        this.context = context
        this.opts = opts
    }

    onHalt(cb: (signal: string) => Promise<void> | void) {
        this.onHaltCb.push(cb)
    }

    protected logDebug(message: string) {
        if(this.opts.logHalt) {
            process.stdout.write('[' + this.runId + '] ' + message + '\n')
        }
    }

    get shouldHalt() {
        return this.halting
    }

    get isHalted() {
        return this.halted
    }


    setIsHalted() {
        this.halted = true
    }

    async halt(signal: string) {
        if(this.halting) return
        this.halting = true
        try {
            await Promise.allSettled(this.onHaltCb.map((on) => on(signal)))
            this.logDebug('cli: closed')
        } catch {
            process.stderr.write('[' + this.runId + '] ' + 'cli: shutdown error' + '\n')
            process.exit(10)
        }
    }

    listenOnSignals(signals?: string[]): CommandRun<C> {
        const listenOnSignal = (signal: string) => {
            process.on(signal, () => {
                this.logDebug('cli: received ' + signal)
                if(this.halting) {
                    process.stderr.write('[' + this.runId + '] ' + 'cli: force halt by ' + signal + '\n')
                    process.exit(1)
                } else {
                    this.halt(signal)
                        .then(() => undefined)
                        .catch((e) => {
                            process.stderr.write('[' + this.runId + '] ' + 'cli: halt by ' + signal + ' with error' + '\n')
                            process.stderr.write(JSON.stringify(e) + '\n')
                            process.exit(1)
                        })
                }
            })
        }
        signals?.forEach(signal => {
            listenOnSignal(signal)
        })

        return this
    }
}
