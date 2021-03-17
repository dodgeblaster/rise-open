import { ResourceDefinition } from '../../types'

type ResolverInput = {
    type: string
    field: string
    vtlRequest: string
    vtlResponse: string
}

const resolver = ({
    type,
    field,
    vtlRequest,
    vtlResponse
}: ResolverInput): ResourceDefinition => {
    return {
        Resources: {
            ['Resolver' + type + field]: {
                Type: 'AWS::AppSync::Resolver',
                DependsOn: 'GraphQlSchema',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    TypeName: type,
                    FieldName: field,
                    RequestMappingTemplate: {
                        'Fn::Sub': [
                            vtlRequest,
                            {
                                UserPoolId: {
                                    Ref: 'CognitoUserPoolMyUserPool'
                                }
                            }
                        ]
                    },

                    ResponseMappingTemplate: vtlResponse,
                    Kind: 'UNIT',
                    DataSourceName: {
                        'Fn::GetAtt': ['GraphQlDslambdadatasource', 'Name']
                    }
                }
            }
        },
        Outputs: {}
    }
}

const datasource = (): ResourceDefinition => {
    return {
        Resources: {
            GraphQlDslambdadatasource: {
                Type: 'AWS::AppSync::DataSource',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Name: 'lambdadatasource',
                    Description: 'Main Lambda function',
                    Type: 'AWS_LAMBDA',
                    ServiceRoleArn: {
                        'Fn::GetAtt': ['GraphQlDslambdadatasourceRole', 'Arn']
                    },
                    LambdaConfig: {
                        LambdaFunctionArn: {
                            'Fn::GetAtt': [
                                'GraphQLEndpointLambdaFunction',
                                'Arn'
                            ]
                        }
                    }
                }
            }
        },
        Outputs: {}
    }
}

type SchemaInput = {
    schema: string
}

const schema = ({ schema }: SchemaInput): ResourceDefinition => {
    return {
        Resources: {
            GraphQlSchema: {
                Type: 'AWS::AppSync::GraphQLSchema',
                Properties: {
                    Definition: schema,
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    }
                }
            }
        },
        Outputs: {}
    }
}

const apiKey = (): ResourceDefinition => {
    return {
        Resources: {
            GraphQlApiKeyDefault: {
                Type: 'AWS::AppSync::ApiKey',
                Properties: {
                    ApiId: {
                        'Fn::GetAtt': ['GraphQlApi', 'ApiId']
                    },
                    Expires: 1627859769
                }
            }
        },
        Outputs: {
            ApiKey: {
                Description: 'ApiKey',
                Value: {
                    'Fn::GetAtt': ['GraphQlApiKeyDefault', 'ApiKey']
                }
            }
        }
    }
}

type GraphQLInput = {
    name: string
    auth: boolean
    region: string
    additionalUserPool?: string
}

const graphQL = ({
    name,
    auth = false,
    region,
    additionalUserPool
}: GraphQLInput): ResourceDefinition => {
    const additional = additionalUserPool
        ? [
              {
                  AuthenticationType: 'API_KEY'
              },
              {
                  AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
                  UserPoolConfig: {
                      AwsRegion: region,
                      UserPoolId: additionalUserPool
                  }
              }
          ]
        : [
              {
                  AuthenticationType: 'API_KEY'
              }
          ]

    const authTrue = {
        Name: name,
        AuthenticationType: 'AMAZON_COGNITO_USER_POOLS',
        AdditionalAuthenticationProviders: additional,
        UserPoolConfig: {
            AwsRegion: region,
            UserPoolId: {
                Ref: 'CognitoUserPoolMyUserPool'
            },
            DefaultAction: 'ALLOW'
        }
    }
    //console.log('authTrue::: ', authTrue.AdditionalAuthenticationProviders)
    const params = auth
        ? typeof auth === 'boolean'
            ? authTrue
            : {
                  Name: name,
                  AuthenticationType: 'OPENID_CONNECT',
                  OpenIDConnectConfig: {
                      Issuer: auth
                  },
                  XrayEnabled: false
              }
        : {
              AuthenticationType: 'API_KEY',
              Name: name,
              XrayEnabled: false
          }

    return {
        Resources: {
            GraphQlApi: {
                Type: 'AWS::AppSync::GraphQLApi',
                Properties: params
            }
        },
        Outputs: {
            ApiUrl: {
                Description: 'URL',
                Value: {
                    'Fn::GetAtt': ['GraphQlApi', 'GraphQLUrl']
                }
            }
        }
    }
}

export default {
    graphQL,
    schema,
    apiKey,
    datasource,
    resolver
}
