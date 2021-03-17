const blockOriginal = require('./block')
const AWS = require('aws-sdk')
const http = require('http')
const fs = require('fs')
const db = new AWS.DynamoDB.DocumentClient({
    region: process.env.AWS_REGION
})

const cognito = new AWS.CognitoIdentityServiceProvider({
    region: process.env.AWS_REGION
})

const eventbridge = new AWS.EventBridge({
    region: process.env.AWS_REGION
})

let block = blockOriginal
const getModules = () => {
    try {
        return fs
            .readdirSync('./modules', { withFileTypes: true })
            .filter((dirent) => dirent.isDirectory())
            .map((dirent) => dirent.name)
    } catch (e) {
        return []
    }
}

const folders = getModules()
for (const folder of folders) {
    const loaded = require('./modules/' + folder + '/rise.js')
    if (loaded.code.Query) {
        block.code.Query = {
            ...block.code.Query,
            ...loaded.code.Query
        }
    }
    if (loaded.code.Mutation) {
        block.code.Mutation = {
            ...block.code.Mutation,
            ...loaded.code.Mutation
        }
    }
    if (loaded.code.Events) {
        block.code.Events = {
            ...block.code.Events,
            ...loaded.code.Events
        }
    }
}

// * * * * * * * * * * * * * * * * * * *
// UUID
// * * * * * * * * * * * * * * * * * * *

const crypto = require('crypto')

const byteToHex = []
for (let i = 0; i < 256; ++i) {
    byteToHex.push((i + 0x100).toString(16).substr(1))
}

function bytesToUuid(buf, offset_) {
    const offset = offset_ || 0
    return (
        byteToHex[buf[offset + 0]] +
        byteToHex[buf[offset + 1]] +
        byteToHex[buf[offset + 2]] +
        byteToHex[buf[offset + 3]] +
        '-' +
        byteToHex[buf[offset + 4]] +
        byteToHex[buf[offset + 5]] +
        '-' +
        byteToHex[buf[offset + 6]] +
        byteToHex[buf[offset + 7]] +
        '-' +
        byteToHex[buf[offset + 8]] +
        byteToHex[buf[offset + 9]] +
        '-' +
        byteToHex[buf[offset + 10]] +
        byteToHex[buf[offset + 11]] +
        byteToHex[buf[offset + 12]] +
        byteToHex[buf[offset + 13]] +
        byteToHex[buf[offset + 14]] +
        byteToHex[buf[offset + 15]]
    ).toLowerCase()
}

function rng() {
    const rnds8 = new Uint8Array(16)
    return crypto.randomFillSync(rnds8)
}

function uuid(options, buf, offset) {
    options = options || {}
    const rnds = options.random || (options.rng || rng)()
    rnds[6] = (rnds[6] & 0x0f) | 0x40
    rnds[8] = (rnds[8] & 0x3f) | 0x80

    if (buf) {
        offset = offset || 0
        for (let i = 0; i < 16; ++i) {
            buf[offset + i] = rnds[i]
        }

        return buf
    }

    return bytesToUuid(rnds)
}

// * * * * * * * * * * * * * * * * * * *
// Format Keys
// * * * * * * * * * * * * * * * * * * *
function formatKeys(input) {
    let newInput = input
    if (newInput.pk) {
        newInput.pk = newInput.pk.toString()
    }

    if (newInput.sk) {
        newInput.sk = newInput.sk.toString()
    }

    if (newInput.pk2) {
        newInput.pk2 = newInput.pk2.toString()
    }

    if (newInput.pk3) {
        newInput.pk3 = newInput.pk3.toString()
    }
    if (newInput.pk !== '@id' && newInput.pk.includes('@id')) {
        newInput.pk = newInput.pk.replace('@id', uuid())
    }

    if (newInput.pk === '@id') {
        newInput.pk = uuid()
    }

    if (newInput.sk !== '@id' && newInput.sk.includes('@id')) {
        newInput.sk = newInput.sk.replace('@id', uuid())
    }

    if (newInput.sk === '@id') {
        newInput.sk = uuid()
    }

    if (
        newInput.pk2 &&
        newInput.pk2 !== '@id' &&
        newInput.pk2.includes('@id')
    ) {
        newInput.pk2 = newInput.pk2.replace('@id', uuid())
    }

    if (newInput.pk2 === '@id') {
        newInput.pk2 = uuid()
    }

    if (
        newInput.pk3 &&
        newInput.pk3 !== '@id' &&
        newInput.pk3.includes('@id')
    ) {
        newInput.pk3 = newInput.pk3.replace('@id', uuid())
    }

    if (newInput.pk3 === '@id') {
        newInput.pk3 = uuid()
    }

    return newInput
}

// * * * * * * * * * * * * * * * * * * *
// Make Password
// * * * * * * * * * * * * * * * * * * *
function makePass() {
    const id = uuid().split('-').join('').slice(0, 10)
    const addCharacter = (x, char) => {
        const i = Math.floor(Math.random() * 10) + 1
        const arr = x.split('')
        arr.splice(i, 0, char)
        return arr.join('')
    }

    const withUppercaseLetter = addCharacter(id, 'C')
    const withSpecialCharacter = addCharacter(withUppercaseLetter, '!')
    return withSpecialCharacter
}

const createUser = async ({ email, userPoolId }) => {
    if (!email) {
        throw new Error('CreateUser must have an email defined')
    }

    const pass = makePass()
    const params = {
        UserPoolId: userPoolId,
        Username: email,
        TemporaryPassword: pass,
        MessageAction: 'SUPPRESS',
        UserAttributes: [
            {
                Name: 'name',
                Value: email
            },
            {
                Name: 'email',
                Value: email
            },
            {
                Name: 'email_verified',
                Value: 'True'
            }
        ]
    }

    try {
        await cognito.adminCreateUser(params).promise()
        return {
            email,
            password: pass
        }
    } catch (err) {
        throw new Error(err)
    }
}

const removeUser = async ({ email, userPoolId }) => {
    if (!email) {
        throw new Error('RemoveUser must have an email defined')
    }

    const params = {
        UserPoolId: userPoolId,
        Username: email
    }

    try {
        await cognito.adminDeleteUser(params).promise()
        return true
    } catch (err) {
        throw new Error(err)
    }
}

const hasUserUsedTemporaryPassword = async ({ email, userPoolId }) => {
    const params = {
        UserPoolId: userPoolId,
        Username: email
    }

    const x = await cognito.adminGetUser(params).promise()
    return x.UserStatus !== 'FORCE_CHANGE_PASSWORD'
}

const resetPassword = async ({ email, userPoolId }) => {
    if (!email) {
        throw new Error('ResetPassword must have an email defined')
    }

    const usedTemp = await hasUserUsedTemporaryPassword({ email, userPoolId })

    if (usedTemp) {
        return false
    }

    await deleteUser({ email, userPoolId })
    return await createUser({
        email: email,
        userPoolId
    })
}

const rise = ({ qlType, qlField, table, userPoolId }) => {
    const f = async (input) => {
        if (
            input.type !== 'db' &&
            input.type !== 'log' &&
            input.type !== 'logError'
        ) {
            return input.input
        }

        if (input.type === 'log') {
            console.log(
                JSON.stringify({
                    pltfm: 'RISE',
                    app: table,
                    field: `${qlType}__${qlField}`,
                    log: input.message,
                    type: 'info'
                })
            )
            return
        }

        if (input.type === 'logError') {
            console.log(
                JSON.stringify({
                    pltfm: 'RISE',
                    app: table,
                    field: `${qlType}__${qlField}`,
                    log: input.error.message,
                    stack: input.error.stack,
                    type: 'error'
                })
            )
            return
        }

        const action = {
            action: input.action,
            table
        }

        const newInput = formatKeys(input.input)

        if (action.action === 'create') {
            await db
                .put({
                    TableName: action.table,
                    Item: newInput
                })
                .promise()

            return newInput
        }

        if (action.action === 'get') {
            let keys = {
                pk: newInput.pk,
                sk: newInput.sk
            }
            if (newInput.pk2) {
                keys = {
                    pk2: newInput.pk2,
                    sk: newInput.sk
                }
            }
            if (newInput.pk3) {
                keys = {
                    pk3: newInput.pk3,
                    sk: newInput.sk
                }
            }

            const item = await db
                .get({
                    TableName: action.table,
                    Key: keys
                })
                .promise()

            return item.Item || false
        }

        if (action.action === 'list') {
            let params = {}

            if (newInput.pk) {
                params = {
                    TableName: action.table,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': newInput.pk,
                        ':sk': newInput.sk
                    }
                }
            }

            if (newInput.pk2) {
                params = {
                    TableName: action.table,
                    IndexName: 'pk2',
                    KeyConditionExpression:
                        'pk2 = :gsi AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':gsi': newInput.pk2,
                        ':sk': newInput.sk
                    }
                }
            }

            if (newInput.pk3) {
                params = {
                    TableName: action.table,
                    IndexName: 'pk3',
                    KeyConditionExpression:
                        'pk3 = :gsi AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':gsi': newInput.pk3,
                        ':sk': newInput.sk
                    }
                }
            }

            const result = await db.query(params).promise()
            return result.Items
        }

        if (action.action === 'remove') {
            await db
                .delete({
                    TableName: action.table,
                    Key: {
                        pk: newInput.pk,
                        sk: newInput.sk
                    }
                })
                .promise()

            return newInput
        }

        throw new Error(
            'DB ACTION ' + action.action + ', table: ' + action.table
        )
    }
    f.log = (m) => {
        console.log(
            JSON.stringify({
                pltfm: 'RISE',
                app: table,
                field: `${qlType}__${qlField}`,
                log: m,
                type: 'info'
            })
        )
    }

    f.db = {
        create: async (input) => {
            const newInput = formatKeys(input)
            // if (newInput.pk) {
            //     newInput.pk = newInput.pk.toString()
            // }

            // if (newInput.sk) {
            //     newInput.sk = newInput.sk.toString()
            // }

            // if (newInput.pk2) {
            //     newInput.pk2 = newInput.pk2.toString()
            // }

            // if (newInput.pk3) {
            //     newInput.pk3 = newInput.pk3.toString()
            // }
            // if (newInput.pk !== '@id' && newInput.pk.includes('@id')) {
            //     newInput.pk = newInput.pk.replace('@id', uuid())
            // }

            // if (newInput.pk === '@id') {
            //     newInput.pk = uuid()
            // }

            // if (newInput.sk !== '@id' && newInput.sk.includes('@id')) {
            //     newInput.sk = newInput.sk.replace('@id', uuid())
            // }

            // if (newInput.sk === '@id') {
            //     newInput.sk = uuid()
            // }

            // if (
            //     newInput.pk2 &&
            //     newInput.pk2 !== '@id' &&
            //     newInput.pk2.includes('@id')
            // ) {
            //     newInput.pk2 = newInput.pk2.replace('@id', uuid())
            // }

            // if (newInput.pk2 === '@id') {
            //     newInput.pk2 = uuid()
            // }

            // if (
            //     newInput.pk3 &&
            //     newInput.pk3 !== '@id' &&
            //     newInput.pk3.includes('@id')
            // ) {
            //     newInput.pk3 = newInput.pk3.replace('@id', uuid())
            // }

            // if (newInput.pk3 === '@id') {
            //     newInput.pk3 = uuid()
            // }

            await db
                .put({
                    TableName: table,
                    Item: newInput
                })
                .promise()

            return newInput
        },

        get: async (newInput) => {
            let keys = {
                pk: newInput.pk,
                sk: newInput.sk
            }
            if (newInput.pk2) {
                keys = {
                    pk2: newInput.pk2,
                    sk: newInput.sk
                }
            }
            if (newInput.pk3) {
                keys = {
                    pk3: newInput.pk3,
                    sk: newInput.sk
                }
            }

            const item = await db
                .get({
                    TableName: table,
                    Key: keys
                })
                .promise()

            return item.Item || false
        },

        list: async (newInput) => {
            let params = {}

            if (newInput.pk) {
                params = {
                    TableName: table,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': newInput.pk,
                        ':sk': newInput.sk
                    }
                }
            }

            if (newInput.pk2) {
                params = {
                    TableName: table,
                    IndexName: 'pk2',
                    KeyConditionExpression:
                        'pk2 = :gsi AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':gsi': newInput.pk2,
                        ':sk': newInput.sk
                    }
                }
            }

            if (newInput.pk3) {
                params = {
                    TableName: table,
                    IndexName: 'pk3',
                    KeyConditionExpression:
                        'pk3 = :gsi AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':gsi': newInput.pk3,
                        ':sk': newInput.sk
                    }
                }
            }

            const result = await db.query(params).promise()
            return result.Items
        },

        remove: async (newInput) => {
            await db
                .delete({
                    TableName: table,
                    Key: {
                        pk: newInput.pk,
                        sk: newInput.sk
                    }
                })
                .promise()

            return newInput
        }
    }

    f.events = {
        emit: async (events) => {
            if (events.length > 10) {
                throw new Error(
                    'Event Bridge cannot publish more than 10 events at a time'
                )
            }

            if (!Array.isArray(events)) {
                events = [events]
            }
            const params = {
                Entries: events.map((x) => ({
                    Source: 'custom.' + table,
                    EventBusName: table,
                    DetailType: x.event,
                    Time: new Date(),
                    Detail: JSON.stringify(x.data)
                }))
            }
            await eventbridge.putEvents(params).promise()
        }
    }

    f.users = {
        create: async (email) => await createUser({ email, userPoolId }),
        remove: async (email) => await removeUser({ email, userPoolId }),
        resetPassword: async (email) =>
            await resetPassword({ email, userPoolId })
    }

    return f
}

const mainFunction = async ({ path, input, identity, action, arrayIndex }) => {
    let newInput = input.input ? input.input : input
    newInput =
        input.source && input.source === 'rise-event' ? input.detail : newInput

    newInput = formatKeys(newInput)
    // if (newInput.pk) {
    //     newInput.pk = newInput.pk.toString()
    // }

    // if (newInput.sk) {
    //     newInput.sk = newInput.sk.toString()
    // }

    // if (newInput.pk2) {
    //     newInput.pk2 = newInput.pk2.toString()
    // }

    // if (newInput.pk3) {
    //     newInput.pk3 = newInput.pk3.toString()
    // }

    // if (newInput.pk && newInput.pk !== '@id' && newInput.pk.includes('@id')) {
    //     newInput.pk = newInput.pk.replace('@id', uuid())
    // }

    // if (newInput.pk && newInput.pk === '@id') {
    //     newInput.pk = uuid()
    // }

    // if (newInput.sk && newInput.sk !== '@id' && newInput.sk.includes('@id')) {
    //     newInput.sk = newInput.sk.replace('@id', uuid())
    // }

    // if (newInput.sk && newInput.sk === '@id') {
    //     newInput.sk = uuid()
    // }

    // if (
    //     newInput.pk2 &&
    //     newInput.pk2 !== '@id' &&
    //     newInput.pk2.includes('@id')
    // ) {
    //     newInput.pk2 = newInput.pk2.replace('@id', uuid())
    // }

    // if (newInput.pk2 === '@id') {
    //     newInput.pk2 = uuid()
    // }

    // if (
    //     newInput.pk3 &&
    //     newInput.pk3 !== '@id' &&
    //     newInput.pk3.includes('@id')
    // ) {
    //     newInput.pk3 = newInput.pk3.replace('@id', uuid())
    // }

    // if (newInput.pk3 === '@id') {
    //     newInput.pk3 = uuid()
    // }

    if (action.pk && action.pk.includes('!')) {
        const parts = action.pk.split('!')
        const str = parts[0]
        const input = parts[1]

        const arrOfValues = input.split('.')

        action.pk =
            str +
            arrOfValues.reduce((acc, k) => {
                return acc[k]
            }, identity)

        //action.pk = identity[v]
    }
    if (action.sk && action.sk.includes('!')) {
        const parts = action.sk.split('!')
        const str = parts[0]
        const input = parts[1]

        const arrOfValues = input.split('.')

        action.sk =
            str +
            arrOfValues.reduce((acc, k) => {
                return acc[k]
            }, identity)
    }

    if (action.pk2 && action.pk2.includes('!')) {
        const parts = action.pk2.split('!')
        const str = parts[0]
        const input = parts[1]

        const arrOfValues = input.split('.')

        action.pk2 =
            str +
            arrOfValues.reduce((acc, k) => {
                return acc[k]
            }, identity)
    }

    if (action.pk3 && action.pk3.includes('!')) {
        const parts = action.pk3.split('!')
        const str = parts[0]
        const input = parts[1]

        const arrOfValues = input.split('.')

        action.pk3 =
            str +
            arrOfValues.reduce((acc, k) => {
                return acc[k]
            }, identity)
    }
    // if (action.pk && action.pk.startsWith('$')) {
    //     const v = action.pk.slice(1)
    //     action.pk = newInput[v]
    // }
    // if (action.sk && action.sk.startsWith('$')) {
    //     const v = action.sk.slice(1)
    //     action.sk = newInput[v]
    // }

    if (action.pk && action.pk.includes('$')) {
        const parts = action.pk.split('$')
        const str = parts[0]
        const input = parts[1]

        const arrOfValues = input.split('.')

        action.pk =
            str +
            arrOfValues.reduce((acc, k) => {
                return acc[k]
            }, newInput)

        //action.pk = identity[v]
    }
    if (action.sk && action.sk.includes('$')) {
        const parts = action.sk.split('$')
        const str = parts[0]
        const input = parts[1]

        const arrOfValues = input.split('.')

        action.sk =
            str +
            arrOfValues.reduce((acc, k) => {
                return acc[k]
            }, newInput)
    }

    if (Array.isArray(action) && !arrayIndex) {
        let index = 0
        let result = newInput
        let actions = action
        for (const action of actions) {
            result = await mainFunction({
                path,
                input: result,
                identity,
                action,
                arrayIndex: index
            })

            index++
        }
        return result
    }

    if (Array.isArray(action) && (arrayIndex === 0 || arrayIndex)) {
        throw new Error('Cannot have an array within an array for actions')
    }

    if (action.type === 'user') {
        if (action.email && action.email.includes('$')) {
            const parts = action.email.split('$')
            const str = parts[0]
            const input = parts[1]

            const arrOfValues = input.split('.')

            action.email =
                str +
                arrOfValues.reduce((acc, k) => {
                    return acc[k]
                }, newInput)
        }
        if (action.action === 'create') {
            if (!action.email) {
                throw new Error('Create user must have an email defined')
            }

            const x = await createUser({
                email: action.email,
                userPoolId: action.userpoolId
            })
            return {
                ...newInput,
                user: x
            }
        }
        if (action.action === 'resetPassword') {
            if (!action.email) {
                throw new Error('Create user must have an email defined')
            }

            const x = await resetPassword({
                email: action.email,
                userPoolId: action.userpoolId
            })
            return {
                ...newInput,
                user: x
            }
        }

        if (action.action === 'remove') {
            if (!action.email) {
                throw new Error('Create user must have an email defined')
            }

            await removeUser({
                email: action.email,
                userPoolId: action.userpoolId
            })
            return {
                ...newInput,
                user: {
                    email: action.email,
                    password: false
                }
            }
        }
    }

    // if (action.type === 'event') {
    //     let newObj = {
    //         ...newInput
    //     }
    //     const params = {
    //         Entries: [
    //             {
    //                 Source: 'custom.' + table,
    //                 EventBusName: table,
    //                 DetailType: action.event,
    //                 Time: new Date(),
    //                 Detail: JSON.stringify(newObj)
    //             }
    //         ]
    //     }
    //     await eventbridge.putEvents(params).promise()

    //     return {
    //         ...newObj
    //     }
    // }

    if (action.type === 'db') {
        if (action.action === 'create') {
            let newObj = {
                ...newInput
            }

            await db
                .put({
                    TableName: action.table,
                    Item: newObj
                })
                .promise()

            return {
                ...newObj
            }
        }

        if (action.action === 'get') {
            let keys = {
                pk: newInput.pk,
                sk: newInput.sk
            }
            if (newInput.pk2) {
                keys = {
                    pk2: newInput.pk2,
                    sk: newInput.sk
                }
            }
            if (newInput.pk3) {
                keys = {
                    pk3: newInput.pk3,
                    sk: newInput.sk
                }
            }

            const item = await db
                .get({
                    TableName: action.table,
                    Key: keys
                })
                .promise()

            return item.Item || false
        }

        if (action.action === 'list') {
            let params = {}

            if (newInput.pk) {
                params = {
                    TableName: action.table,
                    KeyConditionExpression: 'pk = :pk AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':pk': newInput.pk,
                        ':sk': newInput.sk
                    }
                }
            }

            if (newInput.pk2) {
                params = {
                    TableName: action.table,
                    IndexName: 'pk2',
                    KeyConditionExpression:
                        'pk2 = :gsi AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':gsi': newInput.pk2,
                        ':sk': newInput.sk
                    }
                }
            }

            if (newInput.pk3) {
                params = {
                    TableName: action.table,
                    IndexName: 'pk3',
                    KeyConditionExpression:
                        'pk3 = :gsi AND begins_with(sk, :sk)',
                    ExpressionAttributeValues: {
                        ':gsi': newInput.pk3,
                        ':sk': newInput.sk
                    }
                }
            }
            const result = await db.query(params).promise()
            return result.Items
        }

        if (action.action === 'remove') {
            await db
                .delete({
                    TableName: action.table,
                    Key: {
                        pk: newInput.pk,
                        sk: newInput.sk
                    }
                })
                .promise()

            return newInput
        }

        throw new Error(
            'DB ACTION ' + action.action + ', table: ' + action.table
        )
    }

    if (action.type === 'guard') {
        const item = await db
            .get({
                TableName: action.table,
                Key: {
                    pk: action.pk,
                    sk: action.sk
                }
            })
            .promise()

        if (item.Item) {
            return newInput
        } else {
            throw new Error('Unauthorized')
        }
    }

    if (action.type === 'add') {
        delete action.type

        Object.keys(action).forEach((k) => {
            if (action[k].startsWith('!')) {
                const v = action[k].slice(1)
                newInput[k] = identity[v]
            } else if (action[k].startsWith('$')) {
                const v = action[k].slice(1)
                newInput[k] = newInput[v]
            } else {
                newInput[k] = action[k]
            }
        })

        return newInput
    }

    if (action.type === 'http') {
        throw new Error('HTTP URL ' + action.url)
    }

    if (action.type === 'function') {
        try {
            if (arrayIndex !== false) {
                const x = await block.code[path.type][path.field][arrayIndex](
                    input,
                    rise({
                        table: action.table,
                        userPoolId: action.userPoolId,
                        qlType: path.type,
                        qlField: path.field
                    }),
                    identity
                )

                return x
            } else {
                const x = await block.code[path.type][path.field](
                    input,
                    rise({
                        table: action.table,
                        userPoolId: action.userpoolId,
                        qlType: path.type,
                        qlField: path.field
                    }),
                    identity
                )

                return x
            }
        } catch (e) {
            console.log(
                JSON.stringify({
                    pltfm: 'RISE',
                    app: action.table,
                    field: `${path.type}__${path.field}`,
                    log: e.message,
                    type: 'error',
                    stack: e.stack
                })
            )
            throw new Error(e)
        }
    }

    throw new Error('Unsupported action')
}

module.exports.handler = async (event) => {
    if (typeof event === 'string') {
        event = JSON.parse(event)
    }

    const isEventBridgeEvent = event.source === 'rise-event'

    if (isEventBridgeEvent) {
        console.log('event triggered', event)
        const data = {
            path: {
                type: 'Events',
                field: event.field
            },
            input: event.detail,
            identity: {
                id: false,
                email: false,
                ip: false
            },
            action: event.action,
            arrayIndex: false
        }

        return await mainFunction(data)
    }
    const path = {
        type: event.ctx.info.parentTypeName,
        field: event.ctx.info.fieldName
    }

    const input = event.ctx.arguments
    const identity = {
        source: event.ctx.identity ? event.ctx.identity.claims.iss : false,
        id: event.ctx.identity ? event.ctx.identity.claims.sub : false,
        email: event.ctx.identity ? event.ctx.identity.claims.email : false,
        ip:
            event.ctx.identity && event.ctx.identity.sourceIp
                ? event.ctx.identity.sourceIp[0]
                : false
    }
    const action = event.action

    return await mainFunction({
        path,
        input,
        identity,
        action,
        arrayIndex: false
    })
}
