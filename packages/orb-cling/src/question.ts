import readline from 'readline'
import { ClingQuestionOptions } from '@orbstation/cling/make'

export type ClingQuestion = (question: string, fallback?: string, options?: ClingQuestionOptions) => Promise<string>

const question: ClingQuestion = (question, fallback, {silent} = {}) => new Promise((resolve, reject) => {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: question + (typeof fallback === 'string' ? ' [' + fallback + ']: ' : ': '),
    })
    rl.prompt()
    // @ts-ignore
    rl._writeToOutput = function _writeToOutput(stringToWrite: string) {
        if(silent) {
            if(['\r\n', '\n', '\r'].includes(stringToWrite)) {
                process.stdout.write(stringToWrite)
                return
            }
            // - `Esc [2K` clear entire line
            // - `Esc D` move/scroll window up one line
            process.stdout.write('\x1B[2K\x1B[200D' + rl.getPrompt() + '*'.repeat(rl.line.length))
        } else {
            process.stdout.write(stringToWrite)
        }
    }
    rl.on('line', inputLine => {
        if(inputLine.trim().length === 0) {
            if(typeof fallback === 'string') {
                resolve(fallback)
                rl.close()
                return
            }
            process.stdout.write('Please enter a value.\n')
            rl.prompt()
            return
        }
        resolve(inputLine)
        rl.close()
    })
    rl.on('SIGINT', () => {
        process.stdout.write('aborted.\n')
        reject()
        rl.close()
    })
})

export default question
