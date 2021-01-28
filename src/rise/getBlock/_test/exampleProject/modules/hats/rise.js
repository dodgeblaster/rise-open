module.exports = {
    api: `
    
        type Query {
            hat: String
        }
    
    `,

    code: {
        Query: {
            hat: () => 'hi'
        }
    }
}
