import { LogManager } from '@bemit/glog/LogManager'
import { bindHalt } from './lib/bindHalt.js'
import { services } from './services.js'
import { dirname } from 'path'
import { fileURLToPath } from 'url'
import process from 'process'
import { LoggerGlobal } from '@bemit/glog/LoggerGlobal'
import { envIsTrue } from '@orbstation/service/envIs'
import preloadEnv from './config/preload/preloadEnv.js'
import preloadPackage from './config/preload/preloadPackage.js'
import preloadBuildInfo from './config/preload/preloadBuildInfo.js'
import { serviceFeatures } from './config/serviceFeatures.js'
import { OrbExtensions, OrbService, OrbServiceExtension } from '@orbstation/service'
import { RedisManager } from '@bemit/redis'


const __dirname = dirname(fileURLToPath(import.meta.url))

if(!envIsTrue(process.env.NO_DOTENV)) {
    preloadEnv(__dirname)
}
const packageJson = preloadPackage(__dirname)
const buildInfo = preloadBuildInfo(__dirname, packageJson)

const onHalt = bindHalt(
    ['SIGINT', 'SIGTERM', 'SIGHUP', 'SIGQUIT'],
    envIsTrue(process.env.SERVER_DEBUG_SHUTDOWN),
)

export default async(nodeType?: 'api' | 'cli') => {
    //
    // todo: validate order, e.g. in Satellite first `env`, then `config`, then `services`, then `setup` (with e.g. command/route discovery), then `dispatch`
    //
    serviceFeatures.parseFeatureConfig(process.env as { [k: string]: string })

    serviceFeatures.debugFeatures()

    // todo: unify `serviceConfig`, buildInfo, "service-meta inside of `logManager.serviceInfo`" inside of `OrbService`
    const service = new OrbService(
        {
            name: process.env.LOG_SERVICE_NAME as string || 'orbstation-demo-app',
            environment: process.env.APP_ENV as string || 'local',
            version: packageJson?.version || buildInfo?.GIT_COMMIT?.split('/')?.[2]?.slice(0, 6) || 'v0.0.1',
            buildNo: (buildInfo?.GIT_COMMIT ? buildInfo?.GIT_COMMIT + '.' : '') + (buildInfo?.GIT_CI_RUN || process.env.K_REVISION),
        },
        serviceFeatures,
    )

    const extensions = new OrbExtensions<OrbServiceExtension<{ service: typeof service, ServiceService: typeof ServiceService }>>([])

    const ServiceService = services({
        service: service,
        isProd: process.env.NODE_ENV !== 'development',
        packageJson: packageJson,
        buildInfo: buildInfo,
    })

    // todo: refactor to be more "AbortSignal" compatible
    // const onHalt: OnHaltHandler = {
    //     server: [],
    //     app: [],
    //     system: [],
    // }
    // todo: actually the "on halt" must bind even before boot - to be able to cancel boot

    if(service.features.enabled('gcp:log')) {
        const logManager = ServiceService.use(LogManager)
        const logger = logManager.getLogger(logManager.serviceInfo.logId)
        logManager.setLogger('default', logger)
        if(nodeType !== 'cli' && service.features.enabled('log:global')) {
            onHalt.log = LoggerGlobal(
                logManager.getLogger('default'),
                {
                    ...logManager.globalLabels,
                    node_type: nodeType + '.console',
                }, undefined, {
                    service: logManager.serviceInfo.service as string,
                    version: logManager.serviceInfo.version as string,
                },
            )
        }
    }

    // todo: add `onHalt` to extensions definition by default - or to `onBoot`? using the complex or explicit just `app` and `system` scopes?
    await extensions.boot({service, ServiceService})

    onHalt.system.push(function closeRedis() {
        return ServiceService.use(RedisManager).quit()
    })

    return {service, extensions, ServiceService, onHalt}
}

