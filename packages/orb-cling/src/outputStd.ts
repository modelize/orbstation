import { ClingLevels, ClingOnOutput } from '@orbstation/cling/make'

export const clingOutputStd: (symbols: ClingLevels) => ClingOnOutput = (symbols) => (line, opts) => {
    if(typeof line === 'string') {
        let lineStr = line + (opts?.noNewLine ? '' : '\n')
        if(opts?.replacePrev) {
            lineStr = '\r' + lineStr
        }
        process.stdout.write(lineStr)
    } else if(Array.isArray(line)) {
        const [symbol, text] = line
        let lineStr = ' ' + symbols[symbol as keyof typeof symbols] + ' ' + text + (opts?.noNewLine ? '' : '\n')
        if(opts?.replacePrev) {
            lineStr = '\r' + lineStr
        }
        process.stdout.write(lineStr)
    }
}
