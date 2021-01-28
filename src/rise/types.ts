/**
 * RiseCommandInput
 * This represents the input from the cli deploy command.
 *
 */
export interface RiseCommandInput {
    name: String
    profile: String
    region: String
    stage: String
}

/**
 * Rise Block
 * This represents the entire project definition and will inform
 * how the cloudformation should be built, and how appsync should
 * be configured
 *
 */
export type RiseBlock = {
    api: RiseBlockApi
    code: RiseBlockCode
    config: RiseBlockConfig
}
type RiseBlockConfig = {
    name: String
    profile: String
    region: String
    stage: String
    auth: Boolean
    env: Object
    s3BucketName: String
    s3BucketFile: String
}

type RiseBlockApi = String
type RiseBlockCode = {
    Query?: {
        [name: string]: Function
    }
    Mutation?: {
        [name: string]: Function
    }
}

//ny // need to make this into a proper type

/**
 * Rise Output
 * Once the app has been deployed, the following details we be outputed
 * which will allow us to print info to the terminal, and write a helpful
 * info.md file. In the future, this may aslo be where we derive state.
 *
 */
export interface RiseOutput {
    endpoint: String
    table: String
    apiKey?: String
    userPool?: UserPoolSettings
}

interface UserPoolSettings {
    userPoolId: String
    userPoolRegion: String
    userPoolClientId: String
}
