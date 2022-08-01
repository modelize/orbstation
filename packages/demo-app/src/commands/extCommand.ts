import { ExtensionService } from '@orbstation/app/ExtensionService'
import { ExtensionSetup } from '@orbstation/app/ExtensionSetup'
import { ServiceService } from '../services.js'
import { CommandHandler } from '@orbstation/command/CommandHandler'

export const extensionUpdate: CommandHandler['run'] = async() => {
    const extensionService = ServiceService.use(ExtensionService)
    const extensions = await extensionService.listExtensions()
    console.log(` > found ${extensions.length} installed extensions`)
    const outdatedIds: string[] = []
    for(const extension of extensions) {
        const extensionDef = await extensionService.getDefinition(extension.id)
        console.log(`   · ${extension.name} installed: ${extension.version}, available: ${extensionDef.version} `)
        if(extension.version !== extensionDef.version) {
            outdatedIds.push(extension.id)
        }
    }
    console.log(` > found ${outdatedIds.length} outdated extensions`)
    console.log('')
    // const fullLog: string[] = []
    for(const extension of extensions) {
        console.log(' > updating ' + extension.id)
        const {/*extension: updatedExtension,*/log} = await ExtensionSetup.install(
            extensionService,
            extension.id,
            {
                doUpdate: true,
                recreateIndex: false,
            },
        )
        if(log) {
            log.forEach(line => console.log('  ' + line))
        }
        console.log('')
    }
}

export const command: CommandHandler = {
    help: `Updates all installed extension models and hooks`,
    run: extensionUpdate,
}
