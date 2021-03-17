type Input = {
    AWS: any
    name: string
}

async function remove(input: Input): Promise<unknown> {
    const cloudformation = new input.AWS.CloudFormation()
    const params = {
        StackName: input.name
    }
    return await cloudformation.deleteStack(params).promise()
}

export default remove
