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

export interface ClingFns<L extends ClingLevels = ClingLevels> {
    line: (line: string) => void
    lines: (lines: string[]) => void
    message: (symbol: Extract<keyof L, string>, line: string) => void
    progress: (message: string, delay?: number) => (endMessage?: string | [level: Extract<keyof L, string>, line: string]) => void
}

export const makeCling = <O extends ClingOptions = ClingOptions, L extends ClingLevels = ClingLevels>(
    opts: O,
): ClingFns<L> => {
    return {
        line: (line) => opts.onOutput(line),
        lines: (lines) => lines.forEach(line => opts.onOutput(line)),
        message: (symbol, line) => opts.onOutput([symbol, line]),
        progress: (message, delay = 130) => {
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
            return (endMessage?: string | [level: Extract<keyof L, string>, line: string]) => {
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
        },
    }
}

