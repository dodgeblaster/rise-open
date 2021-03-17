import { RiseBlock } from '../types'
import makeResolverInstructions from './makeResolverInstructions'
import makeEventRuleInstructions from './makeEventRuleInstructions'
import makeCloudFormation from './makeCloudFormation'

function deployResources(block: RiseBlock) {
    const resolverInstructions = makeResolverInstructions(block)
    const eventRuleInstructions = makeEventRuleInstructions(block)
    const result = makeCloudFormation(
        block,
        resolverInstructions,
        eventRuleInstructions
    )
    return JSON.stringify(result)
}

export default deployResources
