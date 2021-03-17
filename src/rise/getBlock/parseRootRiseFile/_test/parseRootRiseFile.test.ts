import getRootRiseFile from '../'

/**
 * Experimental Feature
 *
 */
test.skip('can get config', () => {
    const result = getRootRiseFile(__dirname + '/01_canGetConfig/rise.js')
    console.log(result)
})
