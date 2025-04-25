const assert                    = require('node:assert')
const { describe, it, test }    = require('node:test')
const fs                        = require('node:fs')
const path                      = require('node:path')
// ----------------------------------------------------------------------------------------------
const zcron                     = require('../../../src/lib/zcron')
// ----------------------------------------------------------------------------------------------
const DB_FILE_NAME              = 'testzcron' + '.db'
const DB_FILE_PATH              = path.join( process.cwd() , 'atdd', 'src', 'db', DB_FILE_NAME)
// ----------------------------------------------------------------------------------------------
describe('### 000 Cleaned file or not !', () => {
    it('check db file', () => {
        assert.strictEqual(false, fs.existsSync(DB_FILE_PATH))
    })
})
// ----------------------------------------------------------------------------------------------
describe('### 001 Test parseDuration Func', () => {

    it('3min', () => {
        assert.strictEqual( zcron.parseDuration('3min') , '3 * * * *' )
    })

    it('4H', () => {
        assert.strictEqual( zcron.parseDuration('4H') , '0 4 * * *' )
    })

    it('7h', () => {
        assert.strictEqual( zcron.parseDuration('7h') , '0 7 * * *' )
    })

    it('11d : Every day 11 of the month at 0:00', () => {
        assert.strictEqual( zcron.parseDuration('11d') , '0 0 11 * *' )
    })

    it('10mon : Every October of the month at 0:00  ', () => {
        assert.strictEqual( zcron.parseDuration('10mon') , '0 0 0 10 *' )
    })

    it(`custom [ 0, '*/2', '*', '*', '1,3,5' ] `, () => {
        assert.strictEqual( zcron.parseDuration([ 0, '*/2', '*', '*', '1,3,5' ]) , '0 */2 * * 1,3,5' )
    })

    it('3s is * * * * * : Every min because wrong format', () => {
        assert.strictEqual( zcron.parseDuration('3s') , '* * * * *' )
    })

    it('3sec is * * * * * : Every min because wrong format', () => {
        assert.strictEqual( zcron.parseDuration('3sec') , '* * * * *' )
    })

    it('3hSF is * * * * * : Every min because wrong format', () => {
        assert.strictEqual( zcron.parseDuration('3hSF') , '* * * * *' )
    })

    it('aa3h9 is * * * * * : Every min because wrong format', () => {
        assert.strictEqual( zcron.parseDuration('aa3h9') , '* * * * *' )
    })
})