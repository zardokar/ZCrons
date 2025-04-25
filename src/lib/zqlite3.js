// ----------------------------------------------------------------------------------------------
//  Create by : Nattaworn Tancharoen
//  Update date : 25 Apr 2025
// ----------------------------------------------------------------------------------------------
const fs                    = require('node:fs')
const fsproms               = fs.promises
const path                  = require('node:path')
const sqlite3               = require('sqlite3').verbose()

const package               = require(process.cwd()+'/package.json')
// ----------------------------------------------------------------------------------------------
const SHOW_LOG              = true
const PREFIX_IND            = 'IND_'
const DB_FILE_NAME          = package.name + '.db'
const DB_DIR_PATH           = path.join( process.cwd() , 'src', 'db' )
const DB_FILE_PATH          = path.join( DB_DIR_PATH , DB_FILE_NAME)
const DB_DUMMYFILE_PATH     = path.join( DB_DIR_PATH , 'dummy.db')
const DEFAULT_FORG_ACTION   = 'SET DEFAULT'
const DEFAULT_JOIN_TYPE     = 'INNER'
const PRAGMA_FORG_CONS      = 'ON'
// ----------------------------------------------------------------------------------------------
/*  class ZQLite3
        - all( sql )
        - close()
        - connect()                                             // when connect not found this function will create DB
        - countRows( table )
        - createTable( table, schema )
        - delete( table, filter )
        - deleteSQL( table, filter )
        - deleteAllRows( table )                                // just need delete all rows but no need to drop table
        - dropIndex( table )
        - dropTable( table )
        - each( sql , condition )                               // calls a callback for every row in the result is true condition
        - exec( sql )
        - get( sql , findamount )                               // Retrieve rows based on the value of the 'findamount'
        - insert( table, values )
        - insertSQL( table, values )
        - insertClose( table, values )                          // when insert completed this function will disconnected DB
        - queryClose( sql )
        - removeDBFile()
        - select( target, filter, limit, order_by, order )
        - selectSQL( target, filter, limit, order_by, order )
        - selectOne( table, filter, limit, order_by, order )
        - transaction( sqls )
        - update( table, values, filter )
        - updateSQL( table, values, filter )
        - upsert( table, values, filter )
        - upsertSQL( table, values, filter )
*/
// ----------------------------------------------------------------------------------------------
class ZQLite3
{
    constructor(type_or_path, log)
    {
        this.db             = undefined
        this.connected      = false
        this.dbexists       = false
        this.lastsql_exec   = ''
        this.forg_const     = PRAGMA_FORG_CONS
        // -----------------------------
        this.dbpath         = DB_FILE_PATH
        this.dbtype         = DB_FILE_PATH
        // -----------------------------
        const typeparam     = exists(type_or_path) ? type_or_path.toLowerCase() : DB_FILE_PATH
        // -----------------------------
        if(typeparam === ':mem:' || typeparam === ':memory:' ){
            this.dbtype     = ':memory:'
        }else if( typeparam === ':dummy:' ){
            this.dbpath     = DB_DUMMYFILE_PATH
            this.dbtype     = DB_DUMMYFILE_PATH
        }else if( exists(type_or_path) ) {
            this.dbpath     = type_or_path
            this.dbtype     = this.dbpath
        }
        // -----------------------------
        this.log            = exists(log) ? log : SHOW_LOG
    }
    // ---------------------------------------------------------------------------------
    async all( sql )
    {
        this.lastsql_exec        = sql

        if(exists(this.db) === false || this.connected === false ){ await this.connect() }

        return new Promise ( async (resolve) => {
                this.db.all(sql , [], (err, result) => {
                            if (err) {
                                console.log(err) 
                                resolve({ result: null, success: false })
                            } else {
                                resolve({ result: result, success: true })
                            }
                                    
                })
        })
    }
    // ---------------------------------------------------------------------------------
    close()
    {
        return new Promise( (resolve) => { 
                this.db.close((err) => {
                    if (err) {
                        console.error( err.message )
                        resolve({ 
                            success : false,
                            message : err.message,
                                err : err
                        })
                    }else{
                        this.connected = false
                        resolve({ 
                            success : true
                        })
                        console.log('Close the database connection.')
                    }
                })
        })
    }
    // ---------------------------------------------------------------------------------
    async connect()
    {
        const mkDBDir           = await createDirPath(this.dbtype)

        // If the database doesn't exist, create a new file:
        try{
            if (mkDBDir.created === true) {
                // Initialize the database:
                this.db         = new sqlite3.Database( this.dbtype , sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE , connectCalled )
            }else{
                this.db         = new sqlite3.Database( this.dbtype , sqlite3.OPEN_READWRITE, connectCalled )
                this.dbexists   = true
            }

            await this.db.get(`PRAGMA foreign_keys = ${this.forg_const}`)

            this.connected      = true
        }catch(excp){
            console.log(`-------------------------------`)
            console.log(excp)
            console.log('DB not found and cannot created')
            this.connected      = false
        }
        // Check db after created
        if(this.log)
        {
            if ( exists(this.db) && this.dbtype !== ':memory:') console.log(`Create and Connected SQLite DB complete at ${this.dbpath}`)
            else if ( exists(this.db) && this.dbtype === ':memory:') console.log('Connected to the in-memory SQlite DB.')
        }

        return this.db
    }
    // ---------------------------------------------------------------------------------
    async countRows( table, field = '*' )
    {
        const col       = `COUNT(${field})`
        const resp      = (await this.all(` SELECT ${col} FROM ${ table }`)).result[0][col]
        return resp
    }
    // ---------------------------------------------------------------------------------
    // schema is Object Array
    /* schema =  [
                    {
                         field : 'field_name',           # must have
                          type : 'XXX'                   # must have : INTEGER, TEXT, REAL, NUMERIC
                       default : 'X'
                         index : true or false           # this field will create index
                        unique : true or false
                       primary : true or false           # set Primary Key
                    }, 
                    ...
                ]
    //*/
    createTable(table,schema, primary_order= 'ASC')
    {
        let SQL             = `CREATE TABLE ${table} (`
        
        let primarys        = []
        let primary_field   = ''
        let foreign_sql     = ''

        const indexlist     = []

        schema.map( (col,count) => {
            SQL     += `${ col.field } ${ col.type.toUpperCase() }`
            if( exists(col,'primary') )     {
                primarys.push(col.field)
            }

            if( exists(col,'default') )     SQL += ` DEFAULT ${ col.default } `

            if( exists(col,'notnull') ){
                if(col.notnull === true)    SQL += ` NOT NULL `
                else                        SQL += ` NULL `
            }

            if( exists(col,'unique') )      SQL += ` UNIQUE `
            
            if( exists(col,'index') && col.index === true)  {
                let index_obj       = { field : col.field, index : 'INDEX' }
                if( exists(col,'unique') && col.unique === true)      
                    index_obj.index = `UNIQUE INDEX`
                indexlist.push(index_obj)
            }     

            if( exists(col,'foreign') ){
                // Add foreign key constraint actions
                /* forg_update : 'SET NULL' | 'SET DEFAULT' | 'RESTRICT' | 'NO ACTION' | 'CASCADE' */
                            let         actions = ''
                if( exists(col,'act_updel') === true ){
                                        actions = `ON UPDATE ${col.act_updel} ON DELETE ${col.act_updel}`
                }else if( ( exists(col,'act_update') === true ) ){
                                        actions += ` ON UPDATE ${col.act_update}`
                }else if( ( exists(col,'act_del') === true ) ){
                                        actions += ` ON DELETE ${col.act_del}`
                }else{
                                        actions = `ON UPDATE ${DEFAULT_FORG_ACTION} ON DELETE ${DEFAULT_FORG_ACTION}`
                }

                // Add FOREIGN KEY
                if( exists(col,'refkey') === true )
                                    foreign_sql += ` FOREIGN KEY (${col.field}) REFERENCES ${col.foreign} (${col.refkey}) ${actions}`
                else
                                    foreign_sql += ` FOREIGN KEY (${col.field}) REFERENCES ${col.foreign} (${col.field}) ${actions}`
            }

            if( count < schema.length )     SQL += `, `
        })

        // Check and create composite key 
        if( primarys.length > 1){
            let composit_key = ''
            primarys.map( (field, primcount) => { 
                composit_key                    += field 
                if( primcount < primarys.length-1 ) composit_key += ','
            })
            
            primary_field                       = composit_key
        }

        // Create primary key
        if( primary_field !== '' )          SQL += ` PRIMARY KEY (${primary_field} ${primary_order})`

        // Add Foreign Key
                                            SQL += ` ${foreign_sql} `

        // just finish create teable function
                                            SQL += '); \n'
        // creating index
        if(indexlist.length > 0)
        {
            indexlist.map( (indobj) => {
                                            SQL += `CREATE ${indobj.index} ${PREFIX_IND}${table}_${indobj.field} ON ${table}(${indobj.field}); \n`
            } )
        }
        //console.log( SQL )
        return this.exec(SQL)
    }
    // ---------------------------------------------------------------------------------
    deleteAllRows(table)
    {
        return this.exec(`DELETE FROM ${table}`)
    }
    // ---------------------------------------------------------------------------------
    delete(table,filter)
    {
        return this.exec( this.deleteSQL(table,filter) )
    }
    // ---------------------------------------------------------------------------------
    deleteSQL(table,filter)
    {
        let sql = `DELETE FROM ${table}`
        if(exists(filter) ){
            sql +=  ' WHERE ' + convertCondition(filter)
        }
        return sql
    }
    // ---------------------------------------------------------------------------------
    dropIndex(table,indname)
    {
        return this.exec(`DROP INDEX IF EXISTS ${indname};`)
    }   
    // ---------------------------------------------------------------------------------
    dropTable(table)
    {
        return this.exec(`DROP TABLE IF EXISTS ${table};`)
    }
    // ---------------------------------------------------------------------------------
    async each( sql , condition )
    {
        this.lastsql_exec        = sql

        if(exists(this.db) === false || this.connected === false ){ await this.connect() }

        return new Promise ( (resolve) => {
            this.db.each(sql , [condition], (err, rows) => {
                if (err)  console.log(err) 
                resolve({ result: rows, lastID: this.lastID })
            })
        })
    }
    // ---------------------------------------------------------------------------------
    async exec( sql )
    {
        this.lastsql_exec        = sql

        if(exists(this.db) === false || this.connected === false ){ await this.connect() }

        return new Promise ( (resolve) => {
            this.db.exec(sql , (err) => {
                if (err) {
                    console.log(err) 
                    resolve({ success: false})
                }else
                    resolve({ success: true})
            })
        })
    }
    // ---------------------------------------------------------------------------------
    async get( sql , findamount )
    {
        this.lastsql_exec        = sql

        console.log( `--------------------- get : ${sql} `)

        if(exists(this.db) === false || this.connected === false ){ await this.connect() }

        return new Promise ( (resolve) => {
            this.db.get(sql , [findamount], (err, result) => {
                if (err)  console.log(err) 
                resolve({ result: result })
            })
        })
    }
    // ---------------------------------------------------------------------------------
    /*  values is Object Array
        values = [
                    {
                        column_name_1 : value ,
                        column_name_2 : value ,
                        ...
                        column_name_n : value ,
                    }, 
                    ...
                 ]
    //*/
    insert(table,values)
    {
        return this.all( this.insertSQL(table,values) )
    }
    // ---------------------------------------------------------------------------------
    insertSQL(table,values)
    {
        const keys  = (Object.keys(values[0]))
        let SQL     = `INSERT INTO ${table} (${keys}) VALUES`

        values.map( (row,rcount) => {
                                        SQL += "("
            keys.map( (key,kcount) => {
                const value = valueSQL(row[key])
                SQL += value
                if(kcount < keys.length-1) SQL += `,`
            })
                                            
            if(rcount < values.length-1 ) SQL += `),`
            else                          SQL += `);`
        })

        return SQL
    }
    // ---------------------------------------------------------------------------------
    async insertClose(table,values)
    {
        const result = await this.insert(table,values)
                       await this.close()
        return result
    }
    // ---------------------------------------------------------------------------------
    async queryClose( sql )
    {
        const result = await this.all(sql)
                       await this.close()
        return result
    }
    // ---------------------------------------------------------------------------------
    removeDBFile()
    {
        return new Promise( (resolve) => {
            fs.unlink(this.dbpath, (err) => {
                if(err)
                    resolve(false)
                else
                    resolve(true)
            })
        }) 
    }
    // ---------------------------------------------------------------------------------
    select(tables, fields, filter, limit, order)
    {
        return this.all( this.selectSQL( tables, fields, filter, limit, order) )
    }
    // ---------------------------------------------------------------------------------
    /*

    */
    selectSQL(tables, fields = '*', filter, limit, order)
    {
            let sql   = ''

        if ( exists(tables) && Array.isArray(tables) )
        {
            let from  = ''
            if( tables.length === 1) {
                if( exists(tables[0], "table") )
                        from          = ` FROM ${ tables[0].table } `
                else if ( typeof tables[0] === 'string' ) 
                        from          = ` FROM ${ tables[0] } `
            }else if ( tables.length > 1 ){
                let     base_table = ''
                tables.map( (itable,tcount) => {
                    const  join_type  = exists(itable,'join') ? itable.join : DEFAULT_JOIN_TYPE
                   if(tcount === 0){
                              from    = ` FROM ${ itable.table }`
                        base_table    = itable.table
                   }else if( exists( itable, 'rcol') && exists( itable, 'table') ){
                              from   += ` ${join_type} JOIN ${ itable.table } ON ${base_table}.${itable.col} = ${itable.table}.${itable.rcol}`
                   }else if( exists( itable, 'left') && exists( itable, 'right') ){
                              from   += ` ${join_type} JOIN ${ itable.table } ON ${itable.left} = ${itable.right}`
                   }
                })
            }
            // --------------------------------------------
                sql += 'SELECT '
                sql += ` ${convertFields(fields)} `
                sql += from
                sql += getWhere(filter)
                sql += convertOrder(order)
                sql += convertLimit(limit)
        }

       return sql
    }
    // ---------------------------------------------------------------------------------
    selectOne(table, fields = '*', filter, limit, order)
    {
        let         sql = 'SELECT '
                    sql += ` ${convertFields(fields)} `
                    sql += ` FROM ${ table }`
                    sql += getWhere(filter)
                    sql += convertOrder(order)
                    sql += convertLimit(limit)

        return this.all(sql)
    }
    // ---------------------------------------------------------------------------------
    transaction(sqls)
    {

    }
    // ---------------------------------------------------------------------------------
    update(table,updateobj,filter)
    {
        return this.exec(this.updateSQL(table,updateobj,filter))
    }
    // ---------------------------------------------------------------------------------
    updateSQL(table,updateobj,filter)
    {
        let sql         = `UPDATE ${table} SET`
        let updatekeys  = Object.keys(updateobj)

        updatekeys.map( (key,keycount) => {
            sql         += ` ${key} = ${valueSQL(updateobj[key])} `
            if(keycount < updatekeys.length-1 ) sql += `,`
        })

        if( exists(filter) )
            sql         += getWhere(filter)

        return sql        
    }
    // ---------------------------------------------------------------------------------
    upsert(table,values,filter)
    {

    }
    // ---------------------------------------------------------------------------------
    upsertSQL(table,values,filter)
    {

    }
}
// ---------------------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------------------
/*  
*/
function convertOrder(order)
{
    let     sql      = ''

    if(exists(order) && typeof order === 'string'){ 
                return order
    }else if( exists(order) && Array.isArray(order) && order.length > 0  ){
            sql     = ' ORDER BY '
        order.map( (item, icount) => {
            if( exists(item,'name') )
            {
                if( exists(item,'order') ){
                    sql     += item.name + ' ' + item.order.toUpperCase()
                }else{
                    sql     += item.name
                }

                if(icount < order.length-1 ) sql += `,`
            }
        })
    }

    return sql
}
// ---------------------------------------------------------------------------------------------------
function valueSQL(data)
{
    if(typeof data === 'string')
        return `'${data}'`

    return data 
}

// ---------------------------------------------------------------------------------------------------
// _limit = 'LIMIT 10'                  => 'LIMIT 10'
// _limit = 10                          => 'LIMIT ' + 10 
// _limit = { limit: 10 }               => 'LIMIT 10'
// _limit = { limit: 10 , offset: 10}   => 'LIMIT 10 OFFSET 10'
function convertLimit(_limit)
{
    let         sql   = ''

    if(typeof _limit === 'string'){
                sql   =  _limit
    }else if(typeof _limit === 'integer'){
                sql   =  `LIMIT ${_limit}`
    }else if( exists(_limit) ){
        if( exists(_limit.limit) )
            if( exists(_limit.offset) )
                sql   =   ` LIMIT ${_limit.limit} OFFSET ${_limit.offset}`
            else 
                sql   =   ` LIMIT ${_limit.limit}`
    }
    
    return sql
}
// ---------------------------------------------------------------------------------------------------
function convertFields(fields)
{
    let sql = ''
    if(exists(fields) && typeof fields === 'string'){
        sql += fields
    }else if( Array.isArray(fields) ){
        fields.map( (field,fcount) => {
            if(typeof field === 'string') sql += field
            if(fcount < fields.length-1 ) sql += ` , `
        })
    }

    return sql
}
// ---------------------------------------------------------------------------------------------------
function getWhere(filter)
{
    let sql = ''

    if(exists(filter) && typeof filter === 'string'){
            sql += filter
    }else if( exists(filter) ){
    const  condition = convertCondition(filter) 
            sql += ' WHERE ' + condition
    }

    return sql
}
// ---------------------------------------------------------------------------------------------------
/*  filter is Object Array
    [
        {
                field : column or field name 
                 oprt : "=" or ">=" or "IS" or "NOT NULL" or "LIKE" 
                value : value 
                  and : true or false
                   or : true or false
        },
        {
            group : [
                        {
                               field : column or field name 
                                oprt : "=" or ">=" or "IS" or "NOT NULL" or "LIKE" 
                               value : value 
                                 and : true or false
                                  or : true or false
                        }, ... 
                    ],
        } , ...
    ]
*/
function convertCondition(filter)
{
    let     sql = ''
    if( Array.isArray(filter) ) {
        filter.map( (item) => {
            if( exists(item,'field') && typeof item.field === 'string' ){
                sql += ' '+item.field
            }

            if( exists(item,'oprt') && typeof item.oprt === 'string' ){
                sql += ' '+item.oprt
            }

            if( exists(item,'value') ){
                sql +=  ` ${valueSQL(item.value)} `
            }

            if( exists(item,'link') && typeof item.link === 'string' )
                sql += ` ${item.link} `

            if( exists(item,'group') ){
                sql += ' ( '
                sql += convertCondition(item.group)
                sql += ' )'
            }
        })
    } else {
        if( exists(filter,'field') && typeof filter.field === 'string' ){
            sql += ' '+filter.field
        }

        if( exists(filter,'oprt') && typeof filter.oprt === 'string' ){
            sql += ' '+filter.oprt
        }

        if( exists(filter,'value') ){
            sql +=  ` ${valueSQL(filter.value)} `
        }
    }

    return sql
}
// ---------------------------------------------------------------------------------------------------
function connectCalled(err)
{
    if (err) console.error(err.message)
    else console.log('Connected to the database.')
}
// ---------------------------------------------------------------------------------------------------
function exists(data,key=null,emptystr=true)
{
    let result  = true

    try{
        if(data === undefined)               result = false
        else if(data === '' && emptystr )    result = false
        else if(data === null)               result = false
        else if(typeof data === 'undefined') result = false

        if(key !== null && typeof key === 'string')
        {
            if( exists(data[key]) !== true ) result = false
        }
    }catch(excp){
        result = false
    }

    return result
}
// ----------------------------------------------------------------------------------------------
async function createDirPath(_path)
{
    let result      = { created : false }
    let checkpath   = _path.split(/\/|\\/g)
    const dirpath   = path.join( ...(checkpath.slice(0, -1)) )

    if(exists(checkpath) && checkpath.length > 1)
    {
        try{
            fs.mkdirSync(dirpath, true) 
        }catch(excp){}
        if ( (await fsproms.lstat(dirpath)).isDirectory() ){
            result.created = true
            result.path    = dirpath
        }
    }

    return Promise.resolve(result) 
}
// ----------------------------------------------------------------------------------------------
module.exports = ZQLite3