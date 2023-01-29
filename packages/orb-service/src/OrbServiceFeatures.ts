import { envIsTrue } from '@orbstation/service/envIs'

export interface OrbServiceFeature {
    default?: boolean
}

export class OrbServiceFeatures<F extends { [k: string]: OrbServiceFeature }> {
    public readonly features: F
    public readonly featureState: { [K in keyof F]?: boolean } = {}

    constructor(
        features: F,
    ) {
        this.features = features
        this.featureState = {}
        Object.keys(this.features).forEach((featureId) => {
            const feature = this.features[featureId]
            if(typeof feature.default === 'undefined') return
            this.featureState[featureId as keyof F] = feature.default
        })
    }

    enabled(feature: Extract<keyof F, string>): boolean {
        return Boolean(this.featureState[feature])
    }

    parseFeatureConfig(config: { [k: string]: string }) {
        Object.keys(this.features).forEach((featureId) => {
            const featureConfigId = featureId.toUpperCase().replace(/\|.-/g, '_')
            const featureConfigFlag = featureConfigId.replace(/:/g, '_')
            const featureConfigFlagNegate =
                featureConfigId.includes(':') ?
                    (featureConfigId.split(':')[0] + '_NO_' + featureConfigId.split(':').slice(1).join(':'))
                        .replace(/\|.:-/g, '_') :
                    featureConfigFlag + '_NO'
            const fid = featureId as Extract<keyof F, string>
            this.featureState[fid] =
                typeof config[featureConfigFlagNegate] !== 'undefined' && envIsTrue(config[featureConfigFlagNegate]) ? false :
                    typeof config[featureConfigFlag] !== 'undefined' ? envIsTrue(config[featureConfigFlag]) :
                        this.featureState[fid]
        })
    }

    debugFeatures() {
        Object.keys(this.features).forEach((featureId) => {
            console.debug('feature [' + featureId + '] is `' + (this.enabled(featureId as Extract<keyof F, string>) ? 'on' : 'off') + '`')
        })
    }
}
