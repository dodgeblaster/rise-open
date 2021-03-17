import { ResourceDefinition } from '../../types'

type CognitoInput = {
    active: boolean
    name: string
}

export default ({ active, name }: CognitoInput): ResourceDefinition => {
    if (!active) {
        return {
            Resources: {},
            Outputs: {}
        }
    }
    return {
        Resources: {
            CognitoUserPoolMyUserPool: {
                Type: 'AWS::Cognito::UserPool',
                Properties: {
                    UserPoolName: name + '-user-pool',
                    UsernameAttributes: ['email'],
                    AutoVerifiedAttributes: ['email'],
                    AdminCreateUserConfig: {
                        AllowAdminCreateUserOnly: true,
                        InviteMessageTemplate: {
                            EmailSubject: 'You are being invited to join'
                        },
                        UnusedAccountValidityDays: 365
                    }
                }
            },
            CognitoUserPoolClient: {
                Type: 'AWS::Cognito::UserPoolClient',
                Properties: {
                    ClientName: name + '-user-pool-client',
                    UserPoolId: {
                        Ref: 'CognitoUserPoolMyUserPool'
                    },
                    ExplicitAuthFlows: ['ADMIN_NO_SRP_AUTH'],
                    GenerateSecret: false
                }
            }
        },
        Outputs: {
            UserPoolId: {
                Value: {
                    Ref: 'CognitoUserPoolMyUserPool'
                }
            },
            UserPoolClientId: {
                Value: {
                    Ref: 'CognitoUserPoolClient'
                }
            }
        }
    }
}
