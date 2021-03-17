type Input = {
    AWS: any
    name: string
    template: string
}

async function deploy(input: Input): Promise<unknown> {
    const cloudformation = new input.AWS.CloudFormation()
    const params = {
        StackName: input.name,
        Capabilities: [
            'CAPABILITY_IAM',
            'CAPABILITY_AUTO_EXPAND',
            'CAPABILITY_NAMED_IAM'
        ],
        //DisableRollback: false,
        //EnableTerminationProtection: false,
        TemplateBody: input.template
    }

    return await cloudformation.createStack(params).promise()
}

export default deploy
