type Input = {
    AWS: any
    name: string
}

async function getTemplate(input: Input): Promise<unknown> {
    const cloudformation = new input.AWS.CloudFormation()
    const params = {
        StackName: input.name
    }
    return await cloudformation.getTemplate(params).promise()
}

export default getTemplate
