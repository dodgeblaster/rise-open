type VTLRequestResponse = {
    request: string
    response: string
}
type VTLAction = string

export const vtlShell = (action: VTLAction): VTLRequestResponse => ({
    request: `
        #set( $myMap = {
            "ctx": $ctx,
            "action": ${action}
        })
        
        { 
            "version": "2017-02-28",
            "operation": "Invoke",
            "payload": $util.toJson($myMap)
        }`,
    response: `$util.toJson($ctx.result)`
})

/**
 * Function VTL
 *
 */

type FunctionVTLInput = {
    table: string
}

export const functionVTL = (config: FunctionVTLInput): VTLAction => `{ 
    "type": "function",
    "table": "${config.table}",
    "userpoolId":"\${UserPoolId}"
}`

/**
 * Database VTL
 *
 */

type DbVTLInput = {
    action: string
    table: string
}

export const dbVTL = (config: DbVTLInput): VTLAction => `{ 
    "type": "db",
    "action": "${config.action}",
    "table": "${config.table}"
}`

/**
 * User VTL
 *
 */

type UserVTLInput = {
    action: string
    email: string
}

export const userVTL = (config: UserVTLInput): VTLAction => `{ 
    "type": "user",
    "action": "${config.action}",
    "email": "${config.email}",
    "userpoolId":"\${UserPoolId}"
}`

/**
 * Guard VTL
 *
 */

type GuardVTLInput = {
    pk: string
    sk: string
    table: string
}

export const guardVTL = (config: GuardVTLInput): VTLAction => `{ 
    "type": "guard",
    "pk": "${config.pk}",
    "sk": "${config.sk}",
    "table": "${config.table}"
}`

/**
 * Add VTL
 *
 */

type AddVTLInput = Record<string, string>

export const addVTL = (config: AddVTLInput): VTLAction => {
    delete config.type
    const keyValues = Object.keys(config).map((k) => [k, config[k]])

    return `{
    "type": "add",
    ${keyValues.map((x: any, i: number, arr: any) => {
        return `"${x[0]}":"${x[1]}"${arr.length - 1 > i ? ',' : ''}`
    })}
}`
}

/**
 * makeVTLArray
 *
 */

type MakeVTLArrayInput = VTLAction[]

export const makeVTLArray = (actions: MakeVTLArrayInput): VTLAction => {
    let vtl = '['
    actions.forEach((action: string, i: number, array: any) => {
        vtl = vtl + action
        if (array.length !== i + 1) {
            vtl = vtl + ','
        }
    })

    return vtl + ']'
}
