module.exports = {
    api: `
        type Query {
            note: String
        }
    `,

    code: {
        Query: {
            note: () => 'hi'
        }
    },

    config: {
        name: 'hi'
    }
}
