import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
import { CommandHandler } from '@orbstation/command/CommandHandler'
import { HookRepoCouchDb, IHookCouchDb } from '@orbstation/app-model-couchdb/HookRepoCouchDb'
import { HookRepoLowDb } from '@orbstation/app-model-lowdb/HookRepoLowDb'
import { IHook } from '@orbstation/app/HookService'
import { Transfer } from '@modelize/transfer/Transfer'
import { JSONFile, Low } from 'lowdb'
import { nanoid } from 'nanoid'
import path from 'path'
import { fileURLToPath } from 'url'
import { ServiceService } from '../services.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const etlCommand: CommandHandler['run'] = async() => {
    const lowDbFolder = path.resolve(__dirname, '../../data')
    await new Transfer(
        new HookRepoCouchDb('hook', ServiceService.use(CouchDbService)),
        new HookRepoLowDb(new Low(new JSONFile(path.resolve(lowDbFolder, 'db-hook.json')))),
        ({_id, _rev, ...row}: IHookCouchDb): IHook => {
            return row
        },
    )
        .nextProcess(
            {
                trace: nanoid(16),
                batchWrite: 1,
            },
            async(_loader, writer): Promise<{ offset: number } | undefined | void> => {
                await writer.cleanDb()
            },
            (msg, o) => (
                o?.progress === 'load-start' ?
                    process.stdout.write(msg + ' ' + (o?.resumeInfo ? 'w/ resume' : 'from begin') + '\n') :
                    process.stdout.write(msg + '\n')
            ) as unknown as undefined,
        )
        .filter((row) => typeof row.id !== 'undefined')
        .onLoad(async(loader/*, resumeInfo*/) => {
            /*if(resumeInfo) {
                console.log(resumeInfo)
            }*/
            const data = await loader.listHooks()
            return {
                rows: data,
                // resumeInfo: {offset: data.length}
            }
        })
        .onWrite(async(writer, row) => {
            // for(const row of rows) {
            await writer.createHook(row)
            // }
        })
        .start()
        .then((stats) => {
            stats.printPretty()
        })
        .catch(e => {
            console.error(e)
            process.exit(1)
        })
}

export const command: CommandHandler = {
    help: `Demo command for CouchDB to LowDB transfer`,
    run: etlCommand,
}
