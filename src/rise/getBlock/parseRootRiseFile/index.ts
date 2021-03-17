const fs = require('fs')
const { parse, print } = require('recast')

function getExportedRiseBlock(ast: any) {
    return ast.program.body.find((x: any) => {
        return (
            x.type === 'ExpressionStatement' &&
            x.expression.operator === '=' &&
            x.expression.left.type === 'MemberExpression' &&
            x.expression.left.object.name === 'module' &&
            x.expression.left.property.name === 'exports' &&
            x.expression.right.type === 'ObjectExpression'
        )
    })
}

function getRiseConfig(riseBlock: any) {
    return riseBlock.expression.right.properties.find((x: any) => {
        return x.value.type === 'ObjectExpression' && x.key.name === 'config'
    })
}

function getRiseCode(riseBlock: any) {
    return riseBlock.expression.right.properties.find((x: any) => {
        return x.value.type === 'ObjectExpression' && x.key.name === 'code'
    })
}

function getCodeType(code: any, type: string) {
    const section = code?.value?.properties.find((x: any) => {
        return x.value.type === 'ObjectExpression' && x.key.name === type
    })

    return section
}

function getRootRiseFile(pathString: string) {
    const ast = parse(fs.readFileSync(pathString))
    const riseBlock = getExportedRiseBlock(ast)
    // const config = getRiseConfig(riseBlock)
    // const code = getRiseCode(riseBlock)
    //const Query = getCodeType(code, 'Query')

    return print(riseBlock).code
}

export default getRootRiseFile
