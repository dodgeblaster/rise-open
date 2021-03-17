import { RiseBlock } from '../../types'
import { EventTemplateInstructions } from '../types'
import {
    guardIT,
    functionIT,
    addIT,
    makeITArray,
    ITShell,
    dbIT,
    userIT
} from './inputTemplates'

const makeArrayOfActions = (block: any, resolver: any) => {
    const stage = block.config.stage
    const name = block.config.name
    const table = `${name}-${stage}`

    let vtlActions: any = []
    resolver.forEach((r: any) => {
        if (r.type === 'function') {
            return vtlActions.push(
                functionIT({
                    table
                })
            )
        }

        if (r.type === 'user') {
            return vtlActions.push(
                userIT({
                    action: r.action,
                    email: r.email
                })
            )
        }

        if (r.type === 'db') {
            return vtlActions.push(
                dbIT({
                    action: r.action,
                    table
                })
            )
        }

        if (r.type === 'guard') {
            return vtlActions.push(
                guardIT({
                    pk: r.pk,
                    sk: r.sk,
                    table
                })
            )
        }

        if (r.type === 'add') {
            return vtlActions.push(addIT(r))
        }

        throw new Error('Action not supported')
    })

    const vtlArray = makeITArray(vtlActions)
    return ITShell(vtlArray)
}

const makeSingleAction = (block: any, resolver: any) => {
    const stage = block.config.stage
    const name = block.config.name
    const table = `${name}-${stage}`

    if (resolver.type === 'function') {
        return ITShell(
            functionIT({
                table
            })
        )
    }

    if (resolver.type === 'user') {
        return ITShell(
            userIT({
                action: resolver.action,
                email: resolver.email
            })
        )
    }

    if (resolver.type === 'db') {
        return ITShell(
            dbIT({
                action: resolver.action,
                table
            })
        )
    }

    if (resolver.type === 'add') {
        return ITShell(addIT(resolver))
    }

    if (resolver.type === 'guard') {
        return ITShell(
            guardIT({
                pk: resolver.pk,
                sk: resolver.sk,
                table
            })
        )
    }

    throw new Error('Action not supported')
}

/**
 * Print Instructions For Type
 * @param block
 * @param type
 *
 */
const printInstructionsForType = (
    block: any,
    type: string
): EventTemplateInstructions[] => {
    const file = block.code
    let arr: EventTemplateInstructions[] = []

    Object.keys(file[type]).forEach((k) => {
        const resolver = file[type][k]
        const isArrayOfActions = Array.isArray(resolver)
        const isSingleAction = resolver.type

        if (isArrayOfActions) {
            const inputTemplate = makeArrayOfActions(block, resolver)
            return arr.push({
                type: 'Events',
                field: k,
                inputTemplate
            })
        }

        if (isSingleAction) {
            const inputTemplate = makeSingleAction(block, resolver)
            return arr.push({
                type: 'Events',
                field: k,
                inputTemplate
            })
        }

        throw new Error(`${type}/${k} action is in invalid format`)
    })

    return arr
}

function main(block: RiseBlock): EventTemplateInstructions[] {
    const Events = printInstructionsForType(block, 'Events')

    return Events
}

export default main
