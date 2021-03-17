import {
    ResolverInstructions,
    ResourceDefinition,
    EventTemplateInstructions
} from '../types'
import { RiseBlock } from '../../types'
import make from './resourceDefinitions'

function makeTemplate(r: ResourceDefinition[]) {
    return r.reduce((template: ResourceDefinition, r: ResourceDefinition) => {
        return {
            ...template,
            Resources: {
                ...template.Resources,
                ...r.Resources
            },
            Outputs: {
                ...template.Outputs,
                ...r.Outputs
            }
        }
    }, make.template())
}

function makeApp(
    block: RiseBlock,
    resolvers: ResolverInstructions[],
    eventRules: EventTemplateInstructions[]
) {
    const resourceName = `${block.config.name}-${block.config.stage}`
    return makeTemplate([
        /**
         * IAM Roles
         *
         */
        make.iam.lambdaDatasourceRole(),
        make.iam.lambdaRole({
            name: resourceName
        }),

        /**
         * DynamoDB
         *
         */
        make.db({
            name: resourceName
        }),

        /**
         * EventBridge
         *
         */
        make.eventbridge({
            name: resourceName,
            events: eventRules
        }),

        /**
         * Lambda
         *
         */
        make.lambda.mainFunction({
            bucket: block.config.s3BucketName,
            bucketFile: block.config.s3BucketFile,
            env: block.config.env,
            name: resourceName
        }),

        make.lambda.mainFunctionLogGroup({
            name: resourceName
        }),

        /**
         * Appsync
         *
         */
        make.appsync.graphQL({
            name: resourceName,
            auth: block.config.auth,
            region: block.config.region,
            additionalUserPool: block.config.additionalUserPool
        }),
        make.appsync.schema({
            schema: block.api
        }),
        make.appsync.apiKey(),
        make.appsync.datasource(),
        ...resolvers.map(
            (x: ResolverInstructions): ResourceDefinition =>
                make.appsync.resolver({
                    type: x.type,
                    field: x.field,
                    vtlRequest: x.vtlRequest,
                    vtlResponse: x.vtlResponse
                })
        ),

        /**
         * Cognito
         *
         */
        make.cognito({
            active: block.config.auth,
            name: resourceName
        })
    ])
}

export default makeApp
