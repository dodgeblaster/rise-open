type Input = {
    AWS: any
    name: string
    template: string
}

async function update(input: Input): Promise<unknown> {
    const cloudformation = new input.AWS.CloudFormation()
    const params = {
        StackName: input.name,
        Capabilities: [
            'CAPABILITY_IAM',
            'CAPABILITY_AUTO_EXPAND',
            'CAPABILITY_NAMED_IAM'
        ],
        // DisableRollback: false,
        // EnableTerminationProtection: false,
        TemplateBody: input.template
    }

    return await cloudformation.updateStack(params).promise()
}

export default update
