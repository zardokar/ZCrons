// ------------------------------------------------------
const MULTIPLIER_TIME    = 1000
const UNIXTIME_CONDITION = 9999000000
const TIME_FORMAT        = `T00:00:00.000`
const FORMAT_KEY = {
                          W3C: 'W3C',
                        W3CMS: 'W3CMS',
                          UTC: 'UTC',
                      ISO8601: 'ISO8601',
                         UNIX: 'UNIX',
                        EPOCH: 'EPOCH',
                  DATETIMEOBJ: 'DATETIMEOBJ'
}
// ------------------------------------------------------

module.exports = {
                    now,
                    nowDate,
                    pad,
                    formating,
                    getDateTime,
}

// ------------------------------------------------------
function pad(norm,fact='00'){   
    let padding = 1
    for( let i=0 ; i < ((''+fact).length)-1 ; i++){
        padding *= 10
        if(norm < padding) norm = '0' + norm
    }
    return ''+norm
}

function pad2(num){
    return pad( Math.floor(Math.abs(num)) , '00' )
}

function pad3(num){
    return pad( Math.floor(Math.abs(num)) , '000' )
}

function exist(value , key = '')
{
    let pass = true

    if(value === '')        pass = false
    if(value === null)      pass = false
    if(value === undefined) pass = false

    if(key !== '' && pass === true){
        try{ 
            
                if(value[key] === '')        pass = false
                if(value[key] === null)      pass = false
                if(value[key] === undefined) pass = false
            
        }catch(excp){                        pass = false }
    }

    return pass
}

// ------------------------------------------------------
function formating(strIndex, year, month, date, hour,min,sec ,milsec, dif,tzo)
{
    let dateform     = `${year}-${pad2(month)}-${pad2(date)}`
    let timeform     = `T${pad2(hour)}:${ pad2(min)}:${pad2(sec)}`
    let resultFormat = ''

    if(strIndex.toUpperCase() === FORMAT_KEY.W3CMS)
        timeform     =`T${pad2(hour)}:${ pad2(min)}:${pad2(sec)}.${pad3(milsec)}`

    switch(strIndex.toUpperCase()){
        case FORMAT_KEY.W3C     :
        case FORMAT_KEY.W3CMS   : resultFormat = dateform +timeform+`${dif}${pad2(tzo / 60)}:${pad2(tzo % 60)}`
                            break
        case FORMAT_KEY.UTC     : resultFormat = dateform +timeform+'Z' 
                            break
        case FORMAT_KEY.ISO8601 : resultFormat = dateform + timeform + dif + pad2(tzo / 60) + pad2(tzo % 60)
                            break
        case FORMAT_KEY.EPOCH   :
        case FORMAT_KEY.UNIX    : resultFormat = Math.floor( new Date(`${dateform}${timeform}${dif}${pad2(tzo / 60)}:${pad2(tzo % 60)}`).getTime() / MULTIPLIER_TIME)
                            break
    }
    
    return resultFormat
}

// ------------------------------------------------------
function getDateTime(dateobj, offset = null ,format='W3C')
{
    let result = null
    let tempdt

    try { 
        if(dateobj.getFullYear() !== undefined)     // Checking DateTime object data with DateTime method
        {
            tempdt = dateobj
        }
    } catch(err) {
        if(dateobj === null || dateobj === undefined ||  dateobj.length < 1 || Object.keys(dateobj).length < 1 )
            tempdt = new Date()

        if(typeof dateobj === 'string' && dateobj.length > 0)
        {
            if(dateobj.match(/:/g) === null){  
                dateobj = dateobj+TIME_FORMAT 
                let tzo = offset === null ? -(new Date()).getTimezoneOffset() : offset*60
                let dif = tzo >= 0 ? '+' : '-'
                dateobj += offset === null ? '' : `${dif}${ pad2(offset) }:00`
            }
            tempdt  = new Date(dateobj)
        }
        
        if(typeof dateobj === 'number')
            tempdt = dateobj > UNIXTIME_CONDITION ? new Date(dateobj) :  new Date(dateobj*MULTIPLIER_TIME)
    }

    // Check data is ready and not 'DATETIMEOBJ' in format option
    if (tempdt !== undefined && tempdt !== null && format.toUpperCase() !== FORMAT_KEY.DATETIMEOBJ )
    {
        let tzo = offset === null ? -tempdt.getTimezoneOffset() : offset*60

        let dif = tzo >= 0 ? '+' : '-',
            tdate = (format !== 'UTC') && offset === null ? tempdt.getDate() : tempdt.getUTCDate() ,
            month = tempdt.getUTCMonth() + 1, 
            hour  = tempdt.getUTCHours()+offset
            
            if(format !== 'UTC')
                hour  = (tzo !== -tempdt.getTimezoneOffset()) ? tempdt.getUTCHours()+offset : tempdt.getHours()

            if(hour >= 24){
                hour    = hour % 24
                tdate  += 1
            }else if(hour < 0){
                hour    = 24 - hour
                tdate  -= 1
            }
        
            result = formating( format, 
                                tempdt.getFullYear(), 
                                month, 
                                tdate, 
                                hour, 
                                tempdt.getMinutes(), 
                                tempdt.getSeconds(), 
                                tempdt.getMilliseconds(),
                                dif,tzo)
    }

    // If format === DATETIMEOBJ will return js datetime object
    if(format.toUpperCase() === FORMAT_KEY.DATETIMEOBJ) result = tempdt
    
    return result
}

// ------------------------------------------------------
function now(format)
{
    return getDateTime(null,null,format)
}
// ------------------------------------------------------
function nowDate(format)
{
    let result = ''
    let now  = new Date()

    if(exist(format) === false)
    {
        result = `${now.getUTCFullYear()}-${now.getUTCMonth()+1}-${now.getUTCDate()}`
    }

    return result
}

/*
2021-04-16T06:35:48.000Z 
1997-08-31T17:00:00.000Z 
*/