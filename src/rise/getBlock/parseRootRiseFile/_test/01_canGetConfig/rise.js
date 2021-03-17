throw new Error('hey')

module.exports = {
    code: {
        Query: {
            one: async () => {},
            two: console.log('hi')
        }
    },
    config: {
        name: 'hellow'
    }
}
