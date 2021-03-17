import { RiseBlock } from '../types'
const fs = require('fs')

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

function deployInfo(block: RiseBlock, result: DeploymentResult) {
    const schema = block.api

    if (result.status === 'fail') {
        console.log('Failed, Reason: ', result.message)
    }

    if (result.status === 'in progress') {
        console.log('Deployment is still in progress')
    }

    if (result.status === 'success') {
        console.log('')
        console.log('Endpoint: ', result.url)
        if (result.apiKey) {
            console.log('Api Key:  ', result.apiKey)
        }

        if (result.eventBridgeArn) {
            console.log('EventBridge Arn:  ', result.eventBridgeArn)
        }

        fs.writeFileSync(
            process.cwd() + '/info.md',
            `# Rise Information 
- **Block Url**: ${result.url}
${result.apiKey ? `- **Api Key**: ${result.apiKey}` : ''}
- **Logs**: https://console.aws.amazon.com/cloudwatch/home?region=${
                block.config.region
            }#logsV2:log-groups/log-group/$252Faws$252Flambda$252F${
                block.config.name
            }-${block.config.stage}
- **Monitoring**: https://console.aws.amazon.com/lambda/home?region=${
                block.config.region
            }#/applications/${block.config.name}?tab=monitoring

# GraphQL Schema
\`\`\`
${schema}      
\`\`\`
        `
        )
    }
}

export default deployInfo
