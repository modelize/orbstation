import { ExtensionService, IExtension, IExtensionDefinition } from '@orbstation/app/ExtensionService'
import { ErrorExtensionSetup } from '@orbstation/app/ExtensionSetup/ErrorExtensionSetup'

export interface ExtensionSetupOpts {
    doUpdate?: boolean
    recreateIndex?: boolean
}

export type ExtensionSetupIntegrationInstallers<D extends IExtensionDefinition = IExtensionDefinition> = {
    [k in keyof D]?: ((extensionId: string, data: D[k], opts?: ExtensionSetupOpts) => Promise<string[] | void>)[]
}


export const ExtensionSetup = {
    async install<D extends IExtensionDefinition = IExtensionDefinition>(
        extensionService: ExtensionService,
        extensionId: string,
        opts: ExtensionSetupOpts = {},
    ): Promise<{
        log: string[]
        extension: IExtension
    }> {
        const mod = await extensionService.getExtension(extensionId)
        const {doUpdate} = opts
        if(!doUpdate && mod) {
            throw new ErrorExtensionSetup('extension already exists')
        }
        if(doUpdate && !mod) {
            throw new ErrorExtensionSetup('extension must exists')
        }
        const fullLog: string[] = []
        let def: D
        try {
            def = await extensionService.getDefinition(extensionId) as D
        } catch(e) {
            throw new ErrorExtensionSetup('extension definition not found')
        }
        let extension: IExtension
        if(mod) {
            mod.name = def.name
            mod.version = def.version
            extension = await extensionService.updateExtension(mod)
        } else {
            // non existing yet, so installing
            extension = await extensionService.createExtension({
                id: extensionId,
                name: def.name,
                version: def.version,
            })
        }
        const installers = extensionService.makeInstallers<D>()
        for(const defKey in def) {
            const integrationInstallers = installers[defKey]
            if(!integrationInstallers) continue
            // @ts-ignore
            for(const installer of integrationInstallers) {
                const log = await installer(extensionId, def[defKey], opts)
                if(log) {
                    fullLog.push(...log)
                }
            }
        }

        return {
            log: fullLog,
            extension: extension,
        }
    },
}
