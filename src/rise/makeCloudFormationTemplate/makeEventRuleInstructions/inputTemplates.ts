type ITAction = string

export const ITShell = (action: ITAction) =>
    `{
    "detail": <detail>,
    "field": <field>,
    "source": "rise-event",
    "action": ${action}
}`

/**
 * Function IT
 *
 */

type FunctionITInput = {
    table: string
}

export const functionIT = (config: FunctionITInput): ITAction => `{ 
    "type": "function",
    "table": "${config.table}",
    "userpoolId":"\${UserPoolId}"
}`

/**
 * Database IT
 *
 */

type DbITInput = {
    action: string
    table: string
}

export const dbIT = (config: DbITInput): ITAction => `{ 
    "type": "db",
    "action": "${config.action}",
    "table": "${config.table}"
}`

/**
 * User IT
 *
 */

type UserITInput = {
    action: string
    email: string
}

export const userIT = (config: UserITInput): ITAction => `{ 
    "type": "user",
    "action": "${config.action}",
    "email": "${config.email}",
    "userpoolId":"\${UserPoolId}"
}`

/**
 * Guard IT
 *
 */

type GuardITInput = {
    pk: string
    sk: string
    table: string
}

export const guardIT = (config: GuardITInput): ITAction => `{ 
    "type": "guard",
    "pk": "${config.pk}",
    "sk": "${config.sk}",
    "table": "${config.table}"
}`

/**
 * Add IT
 *
 */

type AddITInput = Record<string, string>

export const addIT = (config: AddITInput): ITAction => {
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
 * makeITArray
 *
 */

type MakeITArrayInput = ITAction[]

export const makeITArray = (actions: MakeITArrayInput): ITAction => {
    let vtl = '['
    actions.forEach((action: string, i: number, array: any) => {
        vtl = vtl + action
        if (array.length !== i + 1) {
            vtl = vtl + ','
        }
    })

    return vtl + ']'
}
