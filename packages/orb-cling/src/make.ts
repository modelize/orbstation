export type ClingOnOutput = (
    line: string | [level: string, line: string],
    opts?: {
        replacePrev?: boolean
        noNewLine?: boolean
    },
) => void

export interface ClingLevels {
    success: string
    warning: string
    error: string
}

export interface ClingOptions {
    onOutput: ClingOnOutput
}

export interface ClingQuestionOptions {
    silent?: boolean
}

export type onProgressEnd<L extends ClingLevels = ClingLevels> = (endMessage?: string | [level: Extract<keyof L, string>, line: string]) => void

export interface ClingFns<L extends ClingLevels = ClingLevels> {
    line: (line: string) => void
    lines: (lines: string[]) => void
    message: (symbol: Extract<keyof L, string>, line: string) => void
    progress: (message: string, delay?: number) => onProgressEnd<L>
    progressing: <T extends (onEnd: onProgressEnd<L>) => Promise<unknown> | unknown>(message: string, cb: T, delay?: number) =>
        Promise<ReturnType<T> extends Promise<any> ? Awaited<ReturnType<T>> : ReturnType<T>>
}


export const makeCling = <O extends ClingOptions = ClingOptions, L extends ClingLevels = ClingLevels>(
    opts: O,
): ClingFns<L> => {
    const line: ClingFns<L>['line'] = (line) => opts.onOutput(line)
    const lines: ClingFns<L>['lines'] = (lines) => lines.forEach(line => opts.onOutput(line))
    const message: ClingFns<L>['message'] = (symbol, line) => opts.onOutput([symbol, line])
    const progress: ClingFns<L>['progress'] = (message, delay = 130): onProgressEnd<L> => {
        let lastI = 0
        const timer = setInterval(() => {
            const i = lastI % 3
            opts.onOutput(
                message + ' ' +
                Array.from(Array(i + 1)).map(() => '.').join('') +
                Array.from(Array(3 - i)).map(() => ' ').join(''),
                {replacePrev: lastI > 0, noNewLine: true},
            )
            lastI++
        }, delay)
        // `4` = blank and ... from the `onOutput` inside the interval
        const messageDecoLength = 4
        let ended = false
        return (endMessage?: string | [level: Extract<keyof L, string>, line: string]) => {
            if(ended) return
            ended = true
            opts.onOutput(
                Array.isArray(endMessage) ?
                    [
                        endMessage[0],
                        endMessage[1] +
                        (endMessage.length < message.length ? Array.from(Array((message.length + messageDecoLength) - endMessage.length)).map(() => ' ').join('') : ''),
                    ] :
                    (
                        typeof endMessage === 'string' ?
                            endMessage +
                            (endMessage.length < message.length ? Array.from(Array((message.length + messageDecoLength) - endMessage.length)).map(() => ' ').join('') : '') :
                            message + ' ...'
                    ),
                {replacePrev: lastI > 0},
            )
            clearInterval(timer)
        }
    }
    const progressing = async <T extends (onEnd: onProgressEnd<L>) => Promise<unknown> | unknown>(message: string, cb: T, delay?: number):
        Promise<ReturnType<T> extends Promise<any> ? Awaited<ReturnType<T>> : ReturnType<T>> => {
        const onEnd = progress(message, delay)
        try {
            return await cb(onEnd) as any
        } finally {
            onEnd()
        }
    }
    return {
        line, lines,
        message,
        progress, progressing,
    }
}

