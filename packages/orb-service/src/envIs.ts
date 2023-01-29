export const envIsTrue = (envVar: string | undefined, fallback: boolean = false) => {
    return typeof envVar === 'undefined' ? fallback :
        envVar === 'yes' || envVar === 'true' || envVar === '1' || envVar === 'on'
}
