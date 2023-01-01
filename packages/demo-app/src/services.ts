import process from 'process'
import path from 'path'
import { fileURLToPath } from 'url'
import { ServiceContainer } from 'service-service'
import { LogManager } from '@bemit/glog/LogManager'
import { extensionInstallers } from './lib/extensionInstallers.js'
import { SchemaValidateService } from './service/SchemaValidateService.js'
import { AppConfig } from './config/AppConfig.js'
import { SchemaService } from '@bemit/schema/SchemaService'
import { schemaRegistryResolver } from '@bemit/schema/SchemaRegistry'
import { schemaFileResolver, SchemaRegistryFile } from '@bemit/schema/SchemaRegistryFile'
import { DataContextService } from './service/DataContextService.js'
import { DataContextRepository } from './model/DataContextRepository.js'
import { AppService } from '@orbstation/app/AppService'
import { ExtensionService } from '@orbstation/app/ExtensionService'
import { HookService } from '@orbstation/app/HookService'
import { ModelService } from '@modelize/interop/ModelService'
import { RedisManager } from '@bemit/redis/RedisManager'
import { RedisCached } from '@bemit/redis/RedisCached'
import { IdManager } from '@bemit/cloud-id/IdManager'
import { CommandDispatcher } from '@orbstation/command/CommandDispatcher'
import { CommandResolverFolder } from '@orbstation/command/CommandResolverFolder'
import { CouchDbService } from '@orbstation/app-model-couchdb/CouchDbService'
// import { HookRepoCouchDb } from '@orbstation/app-model-couchdb/HookRepoCouchDb'
// import { ExtensionRepoCouchDb } from '@orbstation/app-model-couchdb/ExtensionRepoCouchDb'
// import { AppRepoCouchDb } from '@orbstation/app-model-couchdb/AppRepoCouchDb'
import { InMemoryAppRepository } from '@orbstation/app/InMemoryAppRepository'
import { InMemoryHookRepository } from '@orbstation/app/InMemoryHookRepository'
import { ExtensionResolver } from '@orbstation/app/ExtensionResolver'
import { ExtensionRepoLowDb } from '@orbstation/app-model-lowdb/ExtensionRepoLowDb'
// import { HookRepoLowDb } from '@orbstation/app-model-lowdb/HookRepoLowDb'
import { JSONFile, Low } from 'lowdb'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const ServiceService = new ServiceContainer<AppConfig>()

export interface ServiceConfig {
    buildInfo: { [k: string]: string }
    isProd?: boolean
    serviceId: string
    logId: string
}

export const services = (serviceConfig: Partial<ServiceConfig>): ServiceConfig => {
    const {buildInfo, isProd} = serviceConfig
    // const serviceId = 'render.orbiter.cloud' // process.env.LOG_SERVICE_NAME
    // ServiceService.configure('cdn_public_url', 'https://cdn.bserve.link')
    if(buildInfo?.GIT_COMMIT) {
        ServiceService.configure('git_commit', buildInfo?.GIT_COMMIT)
    }

    const lowDbFolder = path.resolve(__dirname, '../data')

    const gcpFiles = {
        // todo: most likely wrong file for storage access
        storage: process.env.GCP_MEDIA as string,
        log: process.env.GCP_LOG as string,
    }
    Object.keys(gcpFiles).forEach((gcpFileId) => {
        if(!gcpFiles[gcpFileId]) return
        if(gcpFiles[gcpFileId].indexOf('//') === -1 && gcpFiles[gcpFileId].indexOf('/') !== 0) {
            gcpFiles[gcpFileId] = __dirname + '/' + gcpFiles[gcpFileId]
        }
    })

    ServiceService.define(LogManager, [{
        //keyFilename: __dirname + '/config/_auth_google_cloud_log.json',
        keyFilename: gcpFiles.log as string,
    }])

    ServiceService.define(RedisManager, (): ConstructorParameters<typeof RedisManager> => [[
        RedisManager
            .create({
                url: 'redis://' + process.env.REDIS_HOST,
                database: 6,
            })
            .on('error', (err) => console.log('Redis Client Error', err)),
        RedisManager
            .create({
                url: 'redis://' + process.env.REDIS_HOST,
                database: 7,
            })
            .on('error', (err) => console.log('Redis Client Error', err)),
    ]])
    ServiceService.define(RedisCached, (): ConstructorParameters<typeof RedisCached> => [
        ServiceService.use(RedisManager).database(7),
    ])
    ServiceService.define(CouchDbService, [{
        endpoint: 'http://local-admin:local-pass@localhost:4273',
    }])

    ServiceService.define<typeof CommandDispatcher<{ demo?: undefined }>>(CommandDispatcher, (): ConstructorParameters<typeof CommandDispatcher<{ demo?: undefined }>> => [{
        resolver: [
            new CommandResolverFolder({folder: path.join(__dirname, 'commands')}),
        ],
    }])
    /*ServiceService.use<typeof CommandDispatcher<{ demo?: undefined }>>(CommandDispatcher)
        .addResolver(new CommandResolverFolder<{ demo?: undefined }>({folder: path.join(__dirname, 'commands2')}))*/

    ServiceService.define(IdManager, (): ConstructorParameters<typeof IdManager> => [{
        host: process.env.ID_HOST as string,
        validation: {
            type: 'load-key',
            issuer: process.env.ID_ISSUER as string,
            keyUrl: '/.verification-key',
            algorithms: ['RS256'],
        },
        cacheExpire: 60 * (isProd ? 60 * 6 : 15),
        cacheExpireMemory: 60 * 5,
        redis: ServiceService.use(RedisManager).database(6),
    }])

    ServiceService.define(SchemaService, [{
        resolver: [
            schemaRegistryResolver({
                commons: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas'), '.json'),
                commonsJs: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas/schemaJs'), '.js', true),
                //
                system: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas', 'system'), '.json'),
                model: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas', 'model'), '.json'),
                //
                page: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas', 'page'), '.json'),
                product: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas', 'product'), '.json'),
                block: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas', 'block'), '.json'),
                storage: (id: string) => new SchemaRegistryFile(id, path.resolve(__dirname, 'schemas', 'storage'), '.json'),
            }),
            {resolve: schemaFileResolver('.json')},
        ],
    }])
    ServiceService.define(SchemaValidateService, [])

    ServiceService.define(AppService, (): ConstructorParameters<typeof AppService> => [{
        // repo: () => ServiceService.use(ModelService).getRepo<IAppRepository>('app'),
        // repo: () => new AppRepository('app', ServiceService.use(CouchDbService)),
        repo: InMemoryAppRepository.makeWithStore([{
            id: 'system',
            name: 'demo App',
            projectId: 'demo',
        }]),
    }])

    ServiceService.define(ExtensionService, (): ConstructorParameters<typeof ExtensionService> => [{
        repo: new ExtensionRepoLowDb(new Low(new JSONFile(path.resolve(lowDbFolder, 'db-extension.json')))),
        // repo: () => new ExtensionRepository('extension', ServiceService.use(CouchDbService)),
        resolver: new ExtensionResolver(path.resolve(__dirname, 'extensions')),
        installers: extensionInstallers,
        preloadExtensions: [],
    }])

    ServiceService.define(HookService, (): ConstructorParameters<typeof HookService> => [{
        // repo: new HookRepoCouchDb('hook', ServiceService.use(CouchDbService)),
        // repo: new HookRepoLowDb(new Low(new JSONFile(path.resolve(lowDbFolder, 'db-hook.json')))),
        repo: new InMemoryHookRepository({}, false),
        // repo: new InMemoryHookRepository({}, true),
    }])

    ServiceService.define(DataContextService, (): ConstructorParameters<typeof DataContextService> => [{
        repo: new DataContextRepository('data_context', ServiceService.use(CouchDbService)),
    }])

    ServiceService.define(ModelService, (): ConstructorParameters<typeof ModelService> => [{
        'app': {
            def: ServiceService.use(AppService).getModel(),
            tags: ['system'],
        },
        'extension': {
            def: ServiceService.use(ExtensionService).getModel(),
            tags: ['system'],
        },
        'hook': {
            def: ServiceService.use(HookService).getModel(),
            tags: ['system'],
        },
        'data_context': {
            def: ServiceService.use(DataContextService).getModel(),
            tags: ['system'],
        },
    }])

    return serviceConfig as ServiceConfig
}
