import getInfo from '../_utils/aws/cloudformation_getInfo'
type StackStatus =
    | 'CREATE_IN_PROGRESS'
    | 'CREATE_FAILED'
    | 'CREATE_COMPLETE'
    | 'ROLLBACK_IN_PROGRESS'
    | 'ROLLBACK_FAILED'
    | 'ROLLBACK_COMPLETE'
    | 'DELETE_IN_PROGRESS'
    | 'DELETE_FAILED'
    | 'DELETE_COMPLETE'
    | 'UPDATE_IN_PROGRESS'
    | 'UPDATE_COMPLETE_CLEANUP_IN_PROGRESS'
    | 'UPDATE_COMPLETE'
    | 'UPDATE_ROLLBACK_IN_PROGRESS'
    | 'UPDATE_ROLLBACK_FAILED'
    | 'UPDATE_ROLLBACK_COMPLETE_CLEANUP_IN_PROGRESS'
    | 'UPDATE_ROLLBACK_COMPLETE'
    | 'REVIEW_IN_PROGRESS'
    | 'IMPORT_IN_PROGRESS'
    | 'IMPORT_COMPLETE'
    | 'IMPORT_ROLLBACK_IN_PROGRESS'
    | 'IMPORT_ROLLBACK_FAILED'
    | 'IMPORT_ROLLBACK_COMPLETE'

type Output = {
    OutputKey: string
    OutputValue: string
}

type ShowStatusInput = {
    getInfo: () => any
    times: number
}

const isInProgress = (x: StackStatus) => x.includes('PROGRESS')
const failed = (x: StackStatus) => x.includes('FAIL')
const complete = (x: StackStatus) => x.includes('COMPLETE')
const wait = (time: number): Promise<void> =>
    new Promise((r) => setTimeout(() => r(), time))

const showStatus = async (
    input: ShowStatusInput
): Promise<DeploymentResult> => {
    const data = await input.getInfo()
    const status = data.StackStatus
    const message = data.StackStatusReason

    if (isInProgress(status)) {
        if (input.times > 20) {
            return {
                status: 'in progress',
                message: 'Deployment is still in progress'
            }
        }

        const time = input.times < 6 ? 1000 : 5000
        await wait(time)
        return await showStatus({
            getInfo: input.getInfo,
            times: input.times + 1
        })
    }

    if (failed(status)) {
        return {
            status: 'fail',
            message
        }
    }

    if (complete(status)) {
        const result = data
        const outputs: Output[] = result.Outputs

        const urlOutput = outputs.find((x) => x.OutputKey === 'ApiUrl')
        const apiKeyOutput = outputs.find((x) => x.OutputKey === 'ApiKey')
        const userPoolOutput = outputs.find((x) => x.OutputKey === 'UserPoolId')
        const userPoolClientOutput = outputs.find(
            (x) => x.OutputKey === 'UserPoolClientId'
        )
        const eventBridgeOutput = outputs.find(
            (x) => x.OutputKey === 'EventBridgeArn'
        )

        return {
            status: 'success',
            url: urlOutput ? urlOutput.OutputValue : false,
            apiKey: apiKeyOutput ? apiKeyOutput.OutputValue : false,
            userPoolId: userPoolOutput ? userPoolOutput.OutputValue : false,
            userPoolClientId: userPoolClientOutput
                ? userPoolClientOutput.OutputValue
                : false,
            eventBridgeArn: eventBridgeOutput
                ? eventBridgeOutput.OutputValue
                : false
        }
    }

    return {
        status: 'fail',
        message: 'Unrecognized status'
    }
}

type SuccessfullDeployment = {
    status: 'success'
    url: string | false
    apiKey: string | false
    userPoolId: string | false
    userPoolClientId: string | false
    eventBridgeArn: string | false
}

type FailedDeployment = {
    status: 'fail'
    message: string
}

type InProgressDeployment = {
    status: 'in progress'
    message: string
}

type DeploymentResult =
    | SuccessfullDeployment
    | FailedDeployment
    | InProgressDeployment

export default async (AWS: any, name: string): Promise<DeploymentResult> => {
    return await showStatus({
        getInfo: async () => await getInfo(AWS, name),
        times: 0
    })
}
