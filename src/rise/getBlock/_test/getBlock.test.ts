import getBlock from '../index'

test('can get Block', async () => {
    const projectPath = __dirname + '/exampleProject'

    const result = await getBlock(
        {
            profile: 'example',
            region: 'us-east-2',
            stage: 'dev',
            name: 'blueapp'
        },
        projectPath
    )

    expect(result).toMatchSnapshot()
})
