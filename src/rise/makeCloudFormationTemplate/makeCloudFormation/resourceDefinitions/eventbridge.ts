import { ResourceDefinition, EventTemplateInstructions } from '../../types'

type EventBridgeInput = {
    name: string
    events: EventTemplateInstructions[]
}

export default ({ name, events }: EventBridgeInput): ResourceDefinition => {
    if (name.includes('/') || name === 'default') {
        throw new Error(
            'EventBridge name cannot include / or be called default'
        )
    }

    const rules = events.map((x) => ({
        [x.field + 'EventRule']: {
            Type: 'AWS::Events::Rule',
            Properties: {
                Description: 'EventRule',
                EventBusName: name,
                EventPattern: {
                    source: [`custom.${name}`],
                    'detail-type': [x.field]
                },

                State: 'ENABLED',
                Targets: [
                    {
                        Arn: {
                            'Fn::GetAtt': [
                                'GraphQLEndpointLambdaFunction',
                                'Arn'
                            ]
                        },
                        Id: 'TargetFunctionV1',
                        InputTransformer: {
                            InputPathsMap: {
                                detail: '$.detail',
                                field: '$.detail-type'
                            },
                            InputTemplate: {
                                'Fn::Sub': [
                                    x.inputTemplate,
                                    {
                                        UserPoolId: {
                                            Ref: 'CognitoUserPoolMyUserPool'
                                        }
                                    }
                                ]
                            }

                            //`{"detail": <detail>, "field": <field>, "db": "${name}", "source": "rise-event"}`
                        }
                    }
                ]
            }
        },
        [x.field + 'PermissionForEventsToInvokeLambda']: {
            Type: 'AWS::Lambda::Permission',
            Properties: {
                FunctionName: { Ref: 'GraphQLEndpointLambdaFunction' },
                Action: 'lambda:InvokeFunction',
                Principal: 'events.amazonaws.com',
                SourceArn: { 'Fn::GetAtt': [`${x.field}EventRule`, 'Arn'] }
            }
        }
    }))

    let rulesObjects = {}
    for (const r of rules) {
        rulesObjects = {
            ...rulesObjects,
            ...r
        }
    }

    return {
        Resources: {
            EventBridge: {
                Type: 'AWS::Events::EventBus',
                Properties: {
                    Name: name
                }
            },
            ...rulesObjects
        },
        Outputs: {
            EventBridgeArn: {
                Description: 'EventBridgeArn',
                Value: {
                    'Fn::GetAtt': ['EventBridge', 'Arn']
                }
            }
        }
    }
}
