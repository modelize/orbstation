import { OrbServiceFeatures } from '@orbstation/service/OrbServiceFeatures'

export class OrbService<F extends OrbServiceFeatures<any> = OrbServiceFeatures<any>> {
    public readonly name: string
    public readonly environment: string
    // should be the semantic version
    public readonly version: string
    // should be the specific build_no
    public readonly buildNo?: string

    public readonly features: F

    constructor(
        service: {
            name: string
            environment: string
            version: string
            buildNo?: string
        },
        features: F,
    ) {
        if(typeof service.name === 'undefined') {
            throw new Error('OrbService missing `name`')
        }
        if(typeof service.environment === 'undefined') {
            throw new Error('OrbService missing `environment`')
        }
        if(typeof service.version === 'undefined') {
            throw new Error('OrbService missing `version`')
        }
        this.name = service.name
        this.environment = service.environment
        this.version = service.version
        this.buildNo = service.buildNo
        this.features = features
    }

    /*onHalt() {
        // todo: implement `onHalt() / halt()` here maybe, for usage in `SIGINT` etc on api an cli;
        //       compatible and connected to `CommandRun.onHalt`
    }*/
}
