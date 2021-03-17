import { RiseCommandInput, RiseBlock } from '../types'
const qlmerge = require('@graphql-tools/merge')
const fs = require('fs')
const path = require('path')

/**
 * Get Code By Type from Block
 * TODO: this needs to be typed corectly
 * @param block
 * @param type
 */
const getCodeByTypeFromBlock = (block: any, type: string) => {
    if (!block.code || !block.code[type]) {
        return {}
    }

    const codeBlocks = Object.keys(block.code[type] || [])
    const formatIntoRiseDeclaration = (x: any) => {
        return typeof x === 'function'
            ? {
                  type: 'function'
              }
            : x
    }

    return codeBlocks.reduce((acc, k) => {
        const target = block.code[type][k]
        let toAdd = {}

        if (Array.isArray(target)) {
            toAdd = target.reduce((acc: any, x: any) => {
                acc.push(formatIntoRiseDeclaration(x))
                return acc
            }, [])
        } else {
            toAdd = formatIntoRiseDeclaration(target)
        }

        return {
            ...acc,
            [k]: toAdd
        }
    }, {})
}

const getRiseBlock = async (pathString: string, isModule: boolean) => {
    let x
    try {
        x = require(pathString)
    } catch (e) {
        throw new Error('Your project does not have a rise.js file')
    }

    if (Object.keys(x).length === 0) {
        throw new Error(pathString + ' does not have anything defined')
    }

    if (!x.api || typeof x.api !== 'string') {
        try {
            x.api = fs.readFileSync(
                path.join(pathString, '/schema.graphql'),
                'utf8'
            )
        } catch (e) {
            throw new Error(`${pathString} does have a valid GraphQL schema`)
        }
    }

    if (!x.code || Object.keys(x.code).length === 0) {
        throw new Error(module + ' does not have code defined')
    }

    if (!isModule && !x.config) {
        throw new Error(
            'The rise.js file at the root of your project must have config defined'
        )
    }

    if (!isModule && !x.config.name) {
        throw new Error(
            'The rise.js file at the root of your project must have a name inside config'
        )
    }

    x.code.Query = getCodeByTypeFromBlock(x, 'Query')
    x.code.Mutation = getCodeByTypeFromBlock(x, 'Mutation')
    x.code.Events = getCodeByTypeFromBlock(x, 'Events')
    return x
}

const getModuleDirectories = (source: string) => {
    try {
        return fs
            .readdirSync(source, { withFileTypes: true })
            .filter((dirent: any) => dirent.isDirectory())
            .map((dirent: any) => dirent.name)
    } catch (e) {
        return []
    }
}

async function getRootRiseBlock(pathPrefix: string) {
    const block: any = await getRiseBlock(pathPrefix + '/rise.js', false)

    const moduleFolders = getModuleDirectories(pathPrefix + '/modules')

    for (const module of moduleFolders) {
        const path = pathPrefix + '/modules/' + module + '/rise.js'
        const nestedBlock = await getRiseBlock(path, true)

        // Merge code into root rise code
        block.code.Query = {
            ...block.code.Query,
            ...nestedBlock.code.Query
        }
        block.code.Mutation = {
            ...block.code.Mutation,
            ...nestedBlock.code.Mutation
        }
        block.code.Events = {
            ...block.code.Events,
            ...nestedBlock.code.Events
        }

        // Merge schema into root rise schema
        if (block.api) {
            const ast = qlmerge.mergeTypeDefs([block.api, nestedBlock.api])
            block.api = qlmerge.printWithComments(ast)
        } else {
            block.api = nestedBlock.api
        }
    }

    const noValues = (x: any) => Object.keys(x).length === 0
    if (noValues(block.code.Query) && noValues(block.code.Mutation)) {
        throw new Error('You must have at least 1 Query or Mutation defined')
    }

    // Appsync must have at least 1 query. If not, CF will fail
    if (Object.keys(block.code.Query).length === 0) {
        block.code.Query = {
            ...block.code.Query,
            ...{
                ping: {
                    type: 'function'
                }
            }
        }

        const ast = qlmerge.mergeTypeDefs([
            block.api,
            `
       type Query {
           ping: String
       }
        schema {
            query: Query
        }`
        ])

        block.api = qlmerge.printWithComments(ast)
    }

    if (block.api.trim().length === 0) {
        throw new Error('You must have GraphQL types defined')
    }

    return block
}

type Input = {
    flags: RiseCommandInput
    projectPath: string
}

type Output = Promise<RiseBlock>

async function getBlock(input: Input): Output {
    let block = await getRootRiseBlock(input.projectPath)

    const name = block.config.name.split(' ').join('')
    if (!name) {
        throw new Error('Rise App must have a name defined')
    }

    const profile = input.flags.profile || block.config.profile || 'default'
    const region = input.flags.region || block.config.region || 'us-east-1'
    const stage = input.flags.stage || block.config.stage || 'dev'
    const auth = block.config.auth || false
    const bucketName = 'rise-lambdadeployments'
    const bucketFile = `rise-${name}-${stage}.zip`
    const additionalUserPool = block.config.additionalUserPool || null

    // const env = Object.keys(block.config.env || {}).reduce((acc: any, k) => {
    //     if (block.config.env[k].startsWith('ssm:')) {
    //         acc[k] = block.config.env[k]
    //         return acc
    //     }

    //     const x = process.env[k]

    //     if (!x || x === undefined) {
    //         throw new Error(
    //             `Environment variable "${k}" is not defined in your environment`
    //         )
    //     }

    //     acc[k] = x
    //     return acc
    // }, {})

    const events = block.code.Events ? Object.keys(block.code.Events) : []

    return {
        api: block.api.replace('@public', '@aws_api_key'),
        code: block.code,
        config: {
            name: name,
            auth: auth,
            profile: profile,
            region: region,
            stage: stage,
            env: block.config.env || {},
            s3BucketFile: bucketFile,
            s3BucketName: bucketName,
            events: events,
            additionalUserPool
        }
    }
}

export default getBlock
