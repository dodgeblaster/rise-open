import removeStack from '../_utils/aws/cloudformation_deleteStack'
import getStatus from './getRemoveStatus'
import { RiseBlock } from '../types'

type DeploymentInput = {
    AWS: any
    block: RiseBlock
}

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
async function removeDeployment({
    AWS,
    name
}: {
    AWS: any
    name: string
}): Promise<string> {
    try {
        await removeStack({ AWS, name })
        return 'REMOVING'
    } catch (e) {
        console.log('CLOUDFORMATION ERR:', e.message)
        throw new Error(e)
    }
}

async function main({ AWS, block }: DeploymentInput) {
    const name = block.config.name + '-' + block.config.stage
    await removeDeployment({ AWS, name })

    return await getStatus(AWS, name)
}

export default main
