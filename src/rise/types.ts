/**
 * RiseCommandInput
 * This represents the input from the cli deploy command.
 *
 */
export interface RiseCommandInput {
    profile?: string
    region?: string
    stage?: string
}

/**
 * Rise Block
 * This represents the entire project definition and will inform
 * how the cloudformation should be built, and how appsync should
 * be configured
 *
 */
export interface RiseBlock {
    api: RiseBlockApi
    code: RiseBlockCode
    config: RiseBlockConfig
}

type RiseBlockConfig = {
    name: string
    profile: string
    region: string
    stage: string
    auth: boolean
    env: Record<string, string>
    s3BucketName: string
    s3BucketFile: string
    events: string[]
    additionalUserPool?: string
}

type RiseBlockApi = string
type RiseBlockCode = {
    Query?: {
        [name: string]: Function | Resolver
    }
    Mutation?: {
        [name: string]: Function | Resolver
    }
    Events?: {
        [name: string]: Function | Resolver
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
    endpoint: string
    table: string
    apiKey?: string
    userPool?: UserPoolSettings
}

type UserPoolSettings = {
    userPoolId: string
    userPoolRegion: string
    userPoolClientId: string
}

/**
 * Actions
 *
 */
type Action = 'db' | 'add' | 'guard'

type DbActionDefinition = {
    type: 'db'
    action: 'create' | 'remove' | 'get' | 'list'
    sk?: string
    pk?: string
    pk2?: string
    pk3?: string

    // retry: {

    // },

    // catch: {

    // }
}

type AddActionDefinition = {
    type: 'add'
    [value: string]: string
}

type GuardActionDefinition = {
    type: 'guard'
    inputPath?: 'string' // if schema has input, then we say take everything from input, rather than root
    outputMerge?: 'string' // think thru
    outputPath?: 'string' // think thru

    sk: string
    pk?: string
    pk2?: string
    pk3?: string
}

type FunctionActionDefinition = {
    type: 'function'
}

type ActionDefinition =
    | DbActionDefinition
    | AddActionDefinition
    | GuardActionDefinition
    | FunctionActionDefinition

export type Resolver = ActionDefinition | ActionDefinition[]
