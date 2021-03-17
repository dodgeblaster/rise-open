async function makeBucketNameWithAccountId(AWS: any, name: string) {
    const sts = new AWS.STS()
    const { Account } = await sts.getCallerIdentity().promise()
    return name + '-' + Account
}

export default makeBucketNameWithAccountId
