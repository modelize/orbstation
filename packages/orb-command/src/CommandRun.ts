import process from 'process'

export class CommandRun<C = undefined> {
    public readonly runId: string
    public readonly context: C | undefined
    protected readonly onHaltCb: (() => Promise<void> | void)[] = []

    constructor(runId: string, context?: C) {
        this.runId = runId
        this.context = context
    }

    onHalt(cb: () => Promise<void> | void) {
        this.onHaltCb.push(cb)
    }

    async halt() {
        try {
            await Promise.all(this.onHaltCb.map((on) => on() || Promise.resolve()))
            process.stdout.write('[' + this.runId + '] ' + 'cli: closed' + '\n')
        } catch {
            process.stderr.write('[' + this.runId + '] ' + 'cli: shutdown error' + '\n')
            process.exit(10)
        }
    }

    listenOnSignals(): CommandRun<C> {
        process.on('SIGINT', () => {
            process.stdout.write('[' + this.runId + '] ' + 'cli: received SIGINT 1' + '\n')
            // todo: somehow after the first console, nothing is logged further on -> but only for most times, sometimes it logs/halts correctly,
            //       this seems to be normal for windows/unix cli interrupt behaviour and e.g. force exiting
            //process.stdout.write('cli: received SIGINT 2')
            try {
                this.halt().then(() => {
                    process.stdout.write('[' + this.runId + '] ' + 'cli: halt by SIGINT' + '\n')
                    process.exit(0)
                })
            } catch(e) {
                process.stderr.write('SIGINT ERROR' + '\n')
            }
        })

        process.on('SIGTERM', () => {
            process.stdout.write('[' + this.runId + '] ' + 'cli: received SIGTERM' + '\n')
            this.halt().then(() => {
                process.stdout.write('[' + this.runId + '] ' + 'cli: halt by SIGTERM' + '\n')
                process.exit()
            })
        })

        return this
    }
}
