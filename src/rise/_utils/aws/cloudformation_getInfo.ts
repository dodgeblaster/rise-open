async function getInfo(AWS: any, name: string) {
    const cloudformation = new AWS.CloudFormation()
    const params = {
        StackName: name
    }

    const x = await cloudformation.describeStacks(params).promise()
    return x.Stacks[0]
}

export default getInfo
