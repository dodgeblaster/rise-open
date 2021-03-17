import { ResourceDefinition } from '../../types'

const lambdaDatasourceRole = (): ResourceDefinition => {
    return {
        Resources: {
            GraphQlDslambdadatasourceRole: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: {
                                    Service: ['appsync.amazonaws.com']
                                },
                                Action: ['sts:AssumeRole']
                            }
                        ]
                    },
                    Policies: [
                        {
                            PolicyName: 'GraphQlDslambdadatasourcePolicy',
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Action: ['lambda:invokeFunction'],
                                        Effect: 'Allow',
                                        Resource: [
                                            {
                                                'Fn::GetAtt': [
                                                    'GraphQLEndpointLambdaFunction',
                                                    'Arn'
                                                ]
                                            },
                                            {
                                                'Fn::Join': [
                                                    ':',
                                                    [
                                                        {
                                                            'Fn::GetAtt': [
                                                                'GraphQLEndpointLambdaFunction',
                                                                'Arn'
                                                            ]
                                                        },
                                                        '*'
                                                    ]
                                                ]
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    ]
                }
            }
        },
        Outputs: {}
    }
}

type LambdaRoleInput = {
    name: string
}

const lambdaRole = ({ name }: LambdaRoleInput): ResourceDefinition => {
    return {
        Resources: {
            IamRoleLambdaExecution: {
                Type: 'AWS::IAM::Role',
                Properties: {
                    AssumeRolePolicyDocument: {
                        Version: '2012-10-17',
                        Statement: [
                            {
                                Effect: 'Allow',
                                Principal: {
                                    Service: ['lambda.amazonaws.com']
                                },
                                Action: ['sts:AssumeRole']
                            }
                        ]
                    },
                    Policies: [
                        {
                            PolicyName: {
                                'Fn::Join': ['-', [name, 'lambda']]
                            },
                            PolicyDocument: {
                                Version: '2012-10-17',
                                Statement: [
                                    {
                                        Effect: 'Allow',
                                        Action: [
                                            'logs:CreateLogStream',
                                            'logs:CreateLogGroup'
                                        ],
                                        Resource: [
                                            {
                                                'Fn::Sub':
                                                    'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/' +
                                                    name +
                                                    '*:*'
                                            }
                                        ]
                                    },
                                    {
                                        Effect: 'Allow',
                                        Action: ['logs:PutLogEvents'],
                                        Resource: [
                                            {
                                                'Fn::Sub':
                                                    'arn:${AWS::Partition}:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/' +
                                                    name +
                                                    '*:*'
                                            }
                                        ]
                                    },
                                    {
                                        Effect: 'Allow',
                                        Action: [
                                            'dynamodb:Query',
                                            'dynamodb:Scan',
                                            'dynamodb:GetItem',
                                            'dynamodb:PutItem',
                                            'dynamodb:UpdateItem',
                                            'dynamodb:DeleteItem'
                                        ],
                                        Resource: {
                                            'Fn::Sub':
                                                'arn:aws:dynamodb:${AWS::Region}:*:*'
                                        }
                                    },
                                    {
                                        Effect: 'Allow',
                                        Action: ['events:PutEvents'],
                                        Resource: {
                                            'Fn::GetAtt': ['EventBridge', 'Arn']
                                        }
                                    },
                                    {
                                        Effect: 'Allow',
                                        Action: ['cognito-idp:*'],
                                        Resource: {
                                            'Fn::GetAtt': [
                                                'CognitoUserPoolMyUserPool',
                                                'Arn'
                                            ]
                                        }
                                    }
                                ]
                            }
                        }
                    ],
                    Path: '/',
                    RoleName: {
                        'Fn::Join': [
                            '-',
                            [
                                name,

                                {
                                    Ref: 'AWS::Region'
                                },
                                'lambdaRole'
                            ]
                        ]
                    }
                }
            }
        },
        Outputs: {}
    }
}

export default {
    lambdaDatasourceRole,
    lambdaRole
}
