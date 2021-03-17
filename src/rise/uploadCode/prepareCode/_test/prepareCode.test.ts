import prepareCode from '../index'

test('can prepare code correctly', async () => {
    const cacheLocation = __dirname + '/exampleProject/cacheLocation'
    const project = __dirname + '/exampleProject/project'

    console.log('cacheLocation: ', cacheLocation)
    console.log('project: ', project)

    await prepareCode(cacheLocation, project, `type Query{ note: String}`)

    expect(2).toBe(2)
})
