import build from '../index'
import { RiseBlock } from '../../types'

test('build resolver instructions works', () => {
    const block: RiseBlock = {
        api: ``,
        code: {
            Mutation: {
                submit: [
                    {
                        type: 'guard',
                        pk: '123',
                        sk: '123'
                    },
                    {
                        type: 'add',
                        note: '!email'
                    },
                    {
                        type: 'function'
                    },
                    {
                        type: 'db',
                        action: 'create'
                    }
                ],
                check: {
                    type: 'guard',
                    pk: '123',
                    sk: '123'
                },

                add: {
                    type: 'add',
                    note: '!email'
                },
                hat: {
                    type: 'function'
                },
                note: {
                    type: 'db',
                    action: 'create'
                }
            },
            Query: {
                submit: [
                    {
                        type: 'guard',
                        pk: '123',
                        sk: '123'
                    },
                    {
                        type: 'add',
                        note: '!email'
                    },
                    {
                        type: 'function'
                    },
                    {
                        type: 'db',
                        action: 'create'
                    }
                ],
                check: {
                    type: 'guard',
                    pk: '123',
                    sk: '123'
                },

                add: {
                    type: 'add',
                    note: '!email'
                },
                hat: {
                    type: 'function'
                },
                note: {
                    type: 'db',
                    action: 'create'
                }
            },
            Events: {}
        },
        config: {
            auth: false,
            env: {},
            name: 'hi',
            profile: 'example',
            region: 'us-east-2',
            s3BucketFile: 'rise-lambdadeployments',
            s3BucketName: 'rise-hi-dev.zip',
            stage: 'dev',
            events: []
        }
    }

    const result = build(block)
    // console.log('+++ ', JSON.stringify(result, null, ' '))
    expect(result).toMatchSnapshot()
})
