import { RiseBlock } from '../../types'
import { ResolverInstructions, SchemaType } from '../types'
import {
    guardVTL,
    functionVTL,
    addVTL,
    makeVTLArray,
    vtlShell,
    dbVTL,
    userVTL
} from './vtl'

const makeArrayOfActions = (block: any, resolver: any) => {
    const stage = block.config.stage
    const name = block.config.name
    const table = `${name}-${stage}`

    let vtlActions: any = []
    resolver.forEach((r: any) => {
        if (r.type === 'function') {
            return vtlActions.push(
                functionVTL({
                    table
                })
            )
        }

        if (r.type === 'user') {
            return vtlActions.push(
                userVTL({
                    action: r.action,
                    email: r.email
                })
            )
        }

        if (r.type === 'db') {
            return vtlActions.push(
                dbVTL({
                    action: r.action,
                    table
                })
            )
        }

        if (r.type === 'guard') {
            return vtlActions.push(
                guardVTL({
                    pk: r.pk,
                    sk: r.sk,
                    table
                })
            )
        }

        if (r.type === 'add') {
            return vtlActions.push(addVTL(r))
        }

        throw new Error('Action not supported')
    })

    const vtlArray = makeVTLArray(vtlActions)
    return vtlShell(vtlArray)
}

const makeSingleAction = (block: any, resolver: any) => {
    const stage = block.config.stage
    const name = block.config.name
    const table = `${name}-${stage}`

    if (resolver.type === 'function') {
        return vtlShell(
            functionVTL({
                table
            })
        )
    }

    if (resolver.type === 'user') {
        return vtlShell(
            userVTL({
                action: resolver.action,
                email: resolver.email
            })
        )
    }

    if (resolver.type === 'db') {
        return vtlShell(
            dbVTL({
                action: resolver.action,
                table
            })
        )
    }

    if (resolver.type === 'add') {
        return vtlShell(addVTL(resolver))
    }

    if (resolver.type === 'guard') {
        return vtlShell(
            guardVTL({
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
    type: SchemaType
): ResolverInstructions[] => {
    const file = block.code
    let arr: ResolverInstructions[] = []

    Object.keys(file[type]).forEach((k) => {
        const resolver = file[type][k]
        const isArrayOfActions = Array.isArray(resolver)
        const isSingleAction = resolver.type

        if (isArrayOfActions) {
            const vtl = makeArrayOfActions(block, resolver)
            return arr.push({
                type: type,
                field: k,
                vtlRequest: vtl.request,
                vtlResponse: vtl.response
            })
        }

        if (isSingleAction) {
            const vtl = makeSingleAction(block, resolver)
            return arr.push({
                type: type,
                field: k,
                vtlRequest: vtl.request,
                vtlResponse: vtl.response
            })
        }

        throw new Error(`${type}/${k} action is in invalid format`)
    })

    return arr
}

function main(block: RiseBlock): ResolverInstructions[] {
    const Query = printInstructionsForType(block, 'Query')
    const Mutation = printInstructionsForType(block, 'Mutation')
    return [...Query, ...Mutation]
}

export default main
