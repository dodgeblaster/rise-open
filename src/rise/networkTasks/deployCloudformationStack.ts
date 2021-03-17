import update from '../_utils/aws/cloudformation_updateStack'
import create from '../_utils/aws/cloudformation_createStack'
import updateLambda from '../_utils/aws/lambda_update'
import getStatus from './getDeploymentStatus'
import { RiseBlock } from '../types'

type DeploymentInput = {
    AWS: any
    block: RiseBlock
    template: string
}

type StartDeploymentStatus = 'UPDATING' | 'CREATING' | 'NOTHING'

/**
 * StartDeployment
 *
 * Cloudformation Stacks take time to deploy. When we initiate a CF
 * deployment with the AWS sdk, it returns right away with a response,
 * and does not wait for the stack to be completely deployed. For that
 * reason, its best to think of this sdk call as triggering or starting
 * the process. When then need to check back with other sdk calls
 * to get the compeletion status.
 *
 */
async function startDeployment({
    AWS,
    name,
    template
}: {
    AWS: any
    name: string
    template: string
}): Promise<StartDeploymentStatus> {
    try {
        await update({ AWS, template, name })

        return 'UPDATING'
    } catch (e) {
        if (e.message === `Stack [${name}] does not exist`) {
            await create({ AWS, template, name })
            return 'CREATING'
        } else if (e.message === 'No updates are to be performed.') {
            return 'NOTHING'
        } else {
            console.log('CLOUDFORMATION ERR:', e.message)
            throw new Error(e)
        }
    }
}

async function main({
    AWS,
    block,
    template
}: DeploymentInput): Promise<DeploymentResult> {
    const name = block.config.name + '-' + block.config.stage
    const status = await startDeployment({ AWS, template, name })

    if (status === 'CREATING') {
        return await getStatus(AWS, name)
    }

    if (status === 'UPDATING') {
        await updateLambda({ AWS, block })
        return await getStatus(AWS, name)
    }

    if (status === 'NOTHING') {
        const cliMessage = 'No infrastructure updates are to be performed.'
        console.log(cliMessage)
        await updateLambda({ AWS, block })
        return await getStatus(AWS, name)
    }

    return {
        status: 'fail',
        message: 'Unrecognized status'
    }
}

export default main


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