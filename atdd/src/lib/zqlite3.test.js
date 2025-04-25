const assert                    = require('node:assert')
const { describe, it, test }    = require('node:test')
const fs                        = require('node:fs')
const path                      = require('node:path')
// ----------------------------------------------------------------------------------------------
const zqlite                    = require('../../../src/lib/zqlite3')
const package                   = require(process.cwd()+'/package.json')
// ----------------------------------------------------------------------------------------------
const SOMEDATA_TABLE            = require('../../../src/json/somedata_table.json')
const SOMEDATA_ROWS             = require('../../../src/json/somedata_rows.json')
const SOMEDATA_SELECT_01        = require('../../../src/json/somedata_select_1.json')
const JOINSOME                  = require('../../../src/json/joinsome.json')
// ----------------------------------------------------------------------------------------------
const rgxspace                  = /\s/g
const DB_FILE_NAME              = package.name + '.db'
const DB_FILE_PATH              = path.join( process.cwd() , 'atdd', 'src', 'db', DB_FILE_NAME)
// ----------------------------------------------------------------------------------------------
describe('### 000 Cleaned file or not !', () => {
    it('check db file', () => {
        assert.strictEqual(false, fs.existsSync(DB_FILE_PATH))
})})
// ----------------------------------------------------------------------------------------------
describe('### 001 Create db (empty params in new instance) and test connected', () => {
    const dbctrl     = new zqlite()
    
    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it('check dbpath and dbtype will equal if not a :memory: config', async () => {
        assert.strictEqual( dbctrl.dbtype , dbctrl.dbpath )
    })

    it(`check db file exists at ${dbctrl.dbpath}`, async () => {
        assert.strictEqual( true, await fs.existsSync(dbctrl.dbpath) )
    })

    it('close db', async () => {
        assert.strictEqual( true , (await dbctrl.close()).success )
    })

    it('remove DB file', async () => {
        assert.strictEqual( true, await dbctrl.removeDBFile() )
    })
})
// ----------------------------------------------------------------------------------------------
describe('### 002 Create db custom file path and test connected', () => {
    const dbctrl     = new zqlite( DB_FILE_PATH )
    
    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it('check dbpath and dbtype will equal if not a :memory: config', async () => {
        assert.strictEqual( dbctrl.dbtype , dbctrl.dbpath )
    })

    describe('Disconnected and remove DB file', () => {
        it('close db', async () => {
            assert.strictEqual( true , (await dbctrl.close()).success )
        })
        it('remove DB file', async () => {
            assert.strictEqual( true, await dbctrl.removeDBFile() )
        })
    })
})
// ----------------------------------------------------------------------------------------------
describe('### 003 Create in-memory database', () => {
    const dbctrl     = new zqlite( ':mem:' )
    
    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it('check dbpath and dbtype will NOT!! equal if set :memory: config', async () => {
        assert.strictEqual( false , dbctrl.dbtype === dbctrl.dbpath )
    })

    it('check db file NOT!! exists', async () => {
        assert.strictEqual( false , fs.existsSync(dbctrl.dbpath) )
    })

    describe('Disconnected and remove DB file', () => {
        it('close db', async () => {
            assert.strictEqual( true , (await dbctrl.close()).success )
        })
    })
})
// ----------------------------------------------------------------------------------------------
describe('### 004 Create somedata Table', () => {
    const dbctrl     = new zqlite()
    
    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it('check dbpath and dbtype will equal if set :memory: config', async () => {
        assert.strictEqual( dbctrl.dbtype , dbctrl.dbpath )
    })

    it('check db file exists', () => {
        assert.strictEqual( true , fs.existsSync(dbctrl.dbpath) )
    })

    it('create somedata table', async () => {
        await dbctrl.createTable('somedata', SOMEDATA_TABLE )
        await dbctrl.insert('somedata',SOMEDATA_ROWS)
        const rows  = await dbctrl.countRows('somedata', 't_id')
        assert.strictEqual( 3 , rows )
    })

    it('test selectOne() : somedata table', async () => {
        const EXPECTSQL = `SELECT  t_id , username  FROM somedata WHERE  t_id > 1  AND ( t_id = 2  OR  username IS 'user3'  )`
        const query     = await dbctrl.selectOne(SOMEDATA_SELECT_01.TARGET.table, SOMEDATA_SELECT_01.FIELDS, SOMEDATA_SELECT_01.WHERE)
        const rows      = query.result
        assert.strictEqual( EXPECTSQL.replace(rgxspace, ''), dbctrl.lastsql_exec.replace(rgxspace, '') )
        assert.strictEqual( 'user2' , rows[0].username )
        assert.strictEqual( 'user3' , rows[1].username )
    })

    it('test selectOne() : somedata table but just get 1 record', async () => {

        const EXPECTSQL = `SELECT  t_id , username  FROM somedata WHERE  t_id > 1  AND ( t_id = 2  OR  username IS 'user3'  ) LIMIT 1`
        const query     = await dbctrl.selectOne(SOMEDATA_SELECT_01.TARGET.table, SOMEDATA_SELECT_01.FIELDS, SOMEDATA_SELECT_01.WHERE, { limit: 1 } )
        const rows      = query.result

        assert.strictEqual( EXPECTSQL.replace(rgxspace, '') , dbctrl.lastsql_exec.replace(rgxspace, '') )
        assert.strictEqual( 'user2' , rows[0].username )
        assert.strictEqual(   1     , rows.length )
    })

    it('test selectOne() : somedata table but just get last record', async () => {

        const EXPECTSQL = `SELECT  t_id , username  FROM somedata WHERE t_id > 1 AND ( t_id = 2  OR  username IS 'user3'  ) LIMIT 1 OFFSET 1`
        const query     = await dbctrl.selectOne(SOMEDATA_SELECT_01.TARGET.table, SOMEDATA_SELECT_01.FIELDS, SOMEDATA_SELECT_01.WHERE, { limit: 1, offset: 1 } )
        const rows      = query.result

        assert.strictEqual( EXPECTSQL.replace(rgxspace, '') , dbctrl.lastsql_exec.replace(rgxspace, '') )
        assert.strictEqual( 'user3' , rows[0].username )
        assert.strictEqual(   1     , rows.length )
    })

    it('test selectOne() : somedata table test order', async () => {

        const EXPECTSQL = `SELECT  t_id , username  FROM somedata WHERE  t_id > 1  AND  (  t_id = 2  OR  username IS 'user3'  ) ORDER BY t_id DESC`
        const query     = await dbctrl.selectOne(SOMEDATA_SELECT_01.TARGET.table, SOMEDATA_SELECT_01.FIELDS, SOMEDATA_SELECT_01.WHERE, null, [{ name: 't_id', order: 'DESC'}] )
        const rows      = query.result

        assert.strictEqual( EXPECTSQL.replace(rgxspace, '') , dbctrl.lastsql_exec.replace(rgxspace, '') )
        assert.strictEqual( 'user3' , rows[0].username )
        assert.strictEqual( 'user2' , rows[1].username )
        assert.strictEqual(   2     , rows.length )
    })

    describe('Disconnected DB', () => {
        it('close db', async () => {
            assert.strictEqual( true , (await dbctrl.close()).success )
        })
    })
})

// ----------------------------------------------------------------------------------------------
describe('### 005 Create somedata & joinsome Table use :dummy: ', () => {
    const dbctrl        = new zqlite(':dummy:')
    const dummydirpath  = path.join( process.cwd() , 'src', 'db', 'dummy.db')
    
    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it(`check dbpath ${dbctrl.dbpath}`, async () => {
        assert.strictEqual( dummydirpath , dbctrl.dbpath )
    })

    it('check db file exists', () => {
        assert.strictEqual( true , fs.existsSync(dbctrl.dbpath) )
    })

    it('create somedata table', async () => {
        await dbctrl.createTable('somedata', SOMEDATA_TABLE )
        await dbctrl.insert('somedata',SOMEDATA_ROWS)
        const rows  = await dbctrl.countRows('somedata', 't_id')
        assert.strictEqual( 3 , rows )
    })

    it('create joinsome table', async () => {
        await dbctrl.createTable(JOINSOME.DB_NAME , JOINSOME.TABLE )
        console.log( dbctrl.lastsql_exec )
        await dbctrl.insert(JOINSOME.DB_NAME , JOINSOME.ROWS)
        const jrows  = await dbctrl.countRows(JOINSOME.DB_NAME , '*')
        assert.strictEqual( 5 , jrows )
    })

    it('insert error row to joinsome table (missing t_id in somdata table) ', async () => {
        const query  = await dbctrl.insert(JOINSOME.DB_NAME, JOINSOME.ERROR_INS_ROWS)
                       await dbctrl.close()
        assert.strictEqual( false , query.success )
        assert.strictEqual( null , query.result )
    })

    it('SELECT default INNER JOIN and compare join option 1 and 2', async () => {
        const join_select1 = await dbctrl.select( JOINSOME.JOIN_01.TABLES, JOINSOME.JOIN_01.FIELDS, '', JOINSOME.JOIN_01.LIMIT, JOINSOME.JOIN_01.ORDER) 
                             await dbctrl.close()
        console.table( `----------- join_select1 --------------` )
        console.table( join_select1.result )
        const join_select2 = await dbctrl.select( JOINSOME.JOIN_02.TABLES, JOINSOME.JOIN_02.FIELDS, '', JOINSOME.JOIN_02.LIMIT, JOINSOME.JOIN_02.ORDER)
        assert.strictEqual( true , join_select1.success )
        assert.strictEqual( true , join_select2.success )
        assert.strictEqual( join_select1.result[2].test_uindex_col , join_select2.result[2].test_uindex_col )
        assert.strictEqual( join_select1.result[1].t_id , join_select2.result[1].t_id )
    })

    it('SELECT RIGHT Join ', async () => {
        const join_select3 = await dbctrl.select( JOINSOME.JOIN_03.TABLES, JOINSOME.JOIN_03.FIELDS, JOINSOME.JOIN_03.WHERE, JOINSOME.JOIN_03.LIMIT, JOINSOME.JOIN_03.ORDER)
        console.log( dbctrl.lastsql_exec )
        console.table( join_select3.result )
        assert.strictEqual( true , join_select3.success )
        assert.strictEqual( 4 , join_select3.result.length )
        assert.strictEqual( 3 , join_select3.result[0].t_id )
        assert.strictEqual( 3 , join_select3.result[0].j_id )
    })

    describe('Disconnected and remove DB file', () => {
        it('close db', async () => {
            assert.strictEqual( true , (await dbctrl.close()).success )
        })
    })
})

// ----------------------------------------------------------------------------------------------
describe('### 006 Test update() func Table use :dummy: ', () => {
    const dbctrl        = new zqlite(':dummy:')
    const dummydirpath  = path.join( process.cwd() , 'src', 'db', 'dummy.db')
    
    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it(`check dbpath ${dbctrl.dbpath}`, async () => {
        assert.strictEqual( dummydirpath , dbctrl.dbpath )
    })

    it('check db file exists', () => {
        assert.strictEqual( true , fs.existsSync(dbctrl.dbpath) )
    })

    it('update description only j_id = 2', async () => {
        const updateexec  = await dbctrl.update( 'joinsome', { description : "update from update()"} , { "field": "j_id" , oprt : '=', value: 2 } )
        console.log( updateexec )

        const join_select3 = await dbctrl.select( [ 'joinsome' ], '*', { "field": "j_id" , oprt : '=', value: 2 } )
        console.log( dbctrl.lastsql_exec )
        console.table( join_select3.result )
        
        assert.strictEqual( true , join_select3.success )
        assert.strictEqual( 'update from update()' , join_select3.result[0].description )
    })

    describe('Disconnected and remove DB file', () => {
        it('close db', async () => {
            assert.strictEqual( true , (await dbctrl.close()).success )
        })
    })
})

// ----------------------------------------------------------------------------------------------
describe('### 007 test delete() and deleteAllRows() Table use :dummy: ', () => {
    const dbctrl        = new zqlite(':dummy:')
    const dummydirpath  = path.join( process.cwd() , 'src', 'db', 'dummy.db')

    it('test connect', async () => {
        await dbctrl.connect()
        assert.strictEqual( true, dbctrl.connected )
    })

    it(`check dbpath ${dbctrl.dbpath}`, async () => {
        assert.strictEqual( dummydirpath , dbctrl.dbpath )
    })

    it('check db file exists', () => {
        assert.strictEqual( true , fs.existsSync(dbctrl.dbpath) )
    })

    it(`delete only 'user1' in joinsome table`, async () => {
        const deletequery   = await dbctrl.delete( JOINSOME.DELETE_01.TABLE, JOINSOME.DELETE_01.WHERE )
        const join_select1  = await dbctrl.select( JOINSOME.JOIN_01.TABLES, JOINSOME.JOIN_01.FIELDS, '', '', JOINSOME.JOIN_01.ORDER)
        const rowscount     = join_select1.result.length
        console.table(join_select1.result)

        assert.strictEqual( 2 , rowscount )
    })

    it('deleteAllRows() ', async () => {
        const deletequery   = await dbctrl.deleteAllRows(JOINSOME.DELETE_01.TABLE)
        const join_select1  = await dbctrl.select( JOINSOME.JOIN_01.TABLES )
        const rowscount     = join_select1.result.length
        console.log( dbctrl.lastsql_exec )
        assert.strictEqual( true , deletequery.success )
        assert.strictEqual( 0 , rowscount )
    })

    describe('Disconnected and remove DB file', () => {
        it('close db', async () => {
            assert.strictEqual( true , (await dbctrl.close()).success )
        })

        it(`remove DB file at ${dbctrl.dbpath}`, async () => {
            assert.strictEqual( true, await dbctrl.removeDBFile() )
        })
    })
})

// ----------------------------------------------------------------------------------------------
describe('### FINAL remove DB file', () => {
    const dbctrl     = new zqlite()

    it('remove DB file', async () => {
        assert.strictEqual( true, await dbctrl.removeDBFile() )
    })
})