export type ResolverInstructions = {
    type: SchemaType
    field: string
    vtlRequest: string
    vtlResponse: string
}

export type EventTemplateInstructions = {
    type: 'Events'
    field: string
    inputTemplate: string
}

export type SchemaType = 'Query' | 'Mutation'

export type ResourceDefinition = {
    Resources: object
    Outputs: object
}

export type CloudformationTemplate = {
    Resources: object
    Outputs: object
}
