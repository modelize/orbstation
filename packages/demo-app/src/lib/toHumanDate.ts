export const toHumanDate = (ms: number, exact?: boolean) => {
    const date = new Date(ms)
    return date.getUTCFullYear() + '-' +
        (date.getUTCMonth() + 1).toFixed(0).padStart(2, '0') + '-' +
        date.getUTCDate().toFixed(0).padStart(2, '0') + ' ' +
        date.getUTCHours().toFixed(0).padStart(2, '0') + ':' +
        date.getUTCMinutes().toFixed(0).padStart(2, '0') + ':' +
        date.getUTCSeconds().toFixed(0).padStart(2, '0') +
        (
            exact ?
                '.' + date.getUTCMilliseconds().toFixed(0).padStart(3, '0') :
                ''
        )
}
