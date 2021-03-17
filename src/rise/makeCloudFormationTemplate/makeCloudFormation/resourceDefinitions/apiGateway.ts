import { ResourceDefinition } from '../../types'

type ApiInput = {
    name: string
    stage: string
}

export default ({ name, stage }: ApiInput): ResourceDefinition => {
    return {
        Resources: {
            ApiRoot: {
                Type: 'AWS::ApiGatewayV2::Api',
                Properties: {
                    Name: `${name}-${stage}`,
                    ProtocolType: 'HTTP'
                }
            },
            ApiStage: {
                Type: 'AWS::ApiGatewayV2::Stage',
                Properties: {
                    ApiId: {
                        Ref: 'ApiRoot'
                    },
                    StageName: '$default',
                    AutoDeploy: true,
                    DefaultRouteSettings: {
                        DetailedMetricsEnabled: true
                    }
                }
            },
            MainLambdaPermissionHttpApi: {
                Type: 'AWS::Lambda::Permission',
                Properties: {
                    FunctionName: {
                        'Fn::GetAtt': ['GraphQLEndpointLambdaFunction', 'Arn']
                    },
                    Action: 'lambda:InvokeFunction',
                    Principal: 'apigateway.amazonaws.com',
                    SourceArn: {
                        'Fn::Sub':
                            'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${HttpApiIntegrationMain}/*'
                    }
                }
            },
            HttpApiIntegrationMain: {
                Type: 'AWS::ApiGatewayV2::Integration',
                Properties: {
                    ApiId: {
                        Ref: 'ApiRoot'
                    },
                    IntegrationType: 'AWS_PROXY',
                    IntegrationUri: {
                        'Fn::GetAtt': ['GraphQLEndpointLambdaFunction', 'Arn']
                    },
                    PayloadFormatVersion: '2.0',
                    TimeoutInMillis: 6500
                }
            },
            HttpApiRoutePostGraphql: {
                Type: 'AWS::ApiGatewayV2::Route',
                Properties: {
                    ApiId: {
                        Ref: 'ApiRoot'
                    },
                    RouteKey: `POST /${name}/graphql`,
                    Target: {
                        'Fn::Join': [
                            '/',
                            [
                                'integrations',
                                {
                                    Ref: 'HttpApiIntegrationMain'
                                }
                            ]
                        ]
                    }
                },
                DependsOn: 'HttpApiIntegrationMain'
            },
            HttpApiRouteGetGraphql: {
                Type: 'AWS::ApiGatewayV2::Route',
                Properties: {
                    ApiId: {
                        Ref: 'ApiRoot'
                    },
                    RouteKey: `GET /${name}/graphql`,
                    Target: {
                        'Fn::Join': [
                            '/',
                            [
                                'integrations',
                                {
                                    Ref: 'HttpApiIntegrationMain'
                                }
                            ]
                        ]
                    }
                },
                DependsOn: 'HttpApiIntegrationMain'
            }
        },
        Outputs: {
            ApiUrl: {
                Description: 'URL',
                Value: {
                    'Fn::Join': [
                        '',
                        [
                            'https://',
                            {
                                Ref: 'ApiRoot'
                            },
                            '.execute-api.',
                            {
                                Ref: 'AWS::Region'
                            },
                            '.',
                            {
                                Ref: 'AWS::URLSuffix'
                            }
                        ]
                    ]
                }
            }
        }
    }
}
