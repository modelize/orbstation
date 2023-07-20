export interface AppConfig {
    host: string
    buildInfo: { [k: string]: string }
    // max file size upload in MB
    maxFileUpload?: number
}

