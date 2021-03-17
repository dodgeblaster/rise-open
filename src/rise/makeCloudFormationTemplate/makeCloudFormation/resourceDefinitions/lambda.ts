import { ResourceDefinition } from '../../types'

type LambdaLogGroupInput = {
    name: string
}
const mainFunctionLogGroup = ({
    name
}: LambdaLogGroupInput): ResourceDefinition => {
    return {
        Resources: {
            MainFunctionLogGroup: {
                Type: 'AWS::Logs::LogGroup',
                Properties: {
                    LogGroupName: `/aws/lambda/${name}`
                }
            }
        },
        Outputs: {}
    }
}

type LambdaInput = {
    bucket: string
    bucketFile: string
    env: object
    name: string
}

const mainFunction = ({
    bucket,
    bucketFile,
    env,
    name
}: LambdaInput): ResourceDefinition => {
    const params = {
        Code: {
            S3Bucket: bucket,
            S3Key: bucketFile
        },
        Description: '',
        Environment: {
            Variables: env
        },
        FunctionName: name,
        Handler: '_index.handler',
        MemorySize: 256,
        Role: {
            'Fn::GetAtt': ['IamRoleLambdaExecution', 'Arn']
        },
        Runtime: 'nodejs12.x',
        Timeout: 15
    }

    return {
        Resources: {
            GraphQLEndpointLambdaFunction: {
                Type: 'AWS::Lambda::Function',
                Properties: {
                    ...params
                },
                DependsOn: ['MainFunctionLogGroup']
            }
        },
        Outputs: {}
    }
}

export default {
    mainFunction,
    mainFunctionLogGroup
}
