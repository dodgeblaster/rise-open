import getBlock from '../index'

test('can get Block', async () => {
    const projectPath = __dirname + '/exampleProject'

    const result = await getBlock({
        flags: {
            profile: 'example',
            region: 'us-east-2',
            stage: 'dev'
        },
        projectPath
    })

    expect(result).toMatchSnapshot()
})
