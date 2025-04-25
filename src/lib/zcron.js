// ------------------------------------------------------------------------------------------------------------
//  Create by : Nattaworn Tancharoen
//  Update date : 25 Apr 2025
// ------------------------------------------------------------------------------------------------------------
//  Minute 	Hour 	Days 	Month 	Weekdays	    Explanation 
//  * 	    * 	    * 	    * 	    * 	                Every minute 
//  0 	    * 	    * 	    * 	    * 	                Every hour 
//  30 	    8 	    * 	    * 	    * 	                Every day at 8:30 
//  0 	    0 	    1 	    * 	    * 	                Every first day of the month at 0:00 
//  0 	    2 	    * 	    * 	    1 	                Every Monday at 2:00 
//  45 	    8 	    1 	    1 	    * 	                8:45 on the 1st of January 
//  0 	    */2     * 	    * 	    * 	                Every two hours 
//  0 	    * 	    * 	    * 	    1,3,5 	            Every hour on Mondays, Wednesdays, and Fridays 
//
// *    *    *    *    *   /home/user/bin/somecommand.sh
// |    |    |    |    |            |
// |    |    |    |    |          Command or Script to execute
// |    |    |    |    |
// |    |    |    |    |
// |    |    |    |    Weekdays [0-6] : Days of the week where commands would run. Here, 0 is Sunday.
// |    |    |    |
// |    |    |    Months [1-12] : The month in which tasks need to be executed.
// |    |    |
// |    |    Days [1-31] Commands would be executed in these days of the months.
// |    |
// |    Hours [0-23] Command would be executed at the specific hour.
// |
// Minutes [0-59] Command would be executed at the specific minute.
// ------------------------------------------------------------------------------------------------------------
const fs       = require('fs')
const { exec } = require('child_process')
// ------------------------------------------------------------------------------------------------------------
const DEFAULT_SCRIPT_PATH  = '/app/callscript.sh'
const REGX_CRON_DURATION = /(\d+)|(d|day|h|hour|m|min|mon|month|wkd|weekday)\b/gi
const LIMIT = {
    minute : { min: 0, max: 59}
    ,hour : { min: 0, max: 24}
    ,day : { min: 1, max: 31}
    ,month : { min: 1, max: 12}
    ,weekday: { min: 0, max: 6}
}
// ------------------------------------------------------------------------------------------------------------
function runCronScript(interval)
{
    const cron_duration = parseDuration(interval)
    const cron_line     = `${cron_duration} ${DEFAULT_SCRIPT_PATH} >> /var/log/cron.log 2>&1\n` 

    try{
        fs.writeFileSync('/etc/cron.d/my-cronjob', cron_line)

        exec('crontab /etc/cron.d/my-cronjob', err => {
          if (err) {
            console.error('Failed to update cron:', err)
          } else {
            console.log(`Updated cron to: ${interval}`)
          }
        })
    }catch(excp){
        console.log(`------------------------------------------------------\n runCronScript Error !!! \n`)
        console.log( excp )
    }
}
// ------------------------------------------------------------------------------------------------------------
function parseDuration(interval = '*') 
{
    const jobs = [ '*', '*', '*', '*', '*' ]        // Default Every minute 

    // For assign minute only
    if(typeof interval === "number" && interval >= 0 && interval <= 59 ){
        jobs[0] = interval
    }

    if(typeof interval === "string")
    {
        const target = checkCommStr(interval)

        if( target.unit === 'm' || target.unit === 'min' ){
            jobs[0] = assign( target, LIMIT.minute.min, LIMIT.minute.max)
        }

        if( target.unit === 'h' || target.unit === 'hour' ){
            jobs[0] = 0
            jobs[1] = assign( target, LIMIT.hour.min, LIMIT.hour.max)
        }

        if( target.unit === 'd' || target.unit === 'day' ){
            jobs[0] = 0
            jobs[1] = 0
            jobs[2] = assign( target, LIMIT.day.min, LIMIT.day.max)
        }

        if( target.unit === 'mon' || target.unit === 'month' ){
            jobs[0] = 0
            jobs[1] = 0
            jobs[2] = 0
            jobs[3] = assign( target, LIMIT.month.min, LIMIT.month.max)
        }

        if( target.unit === 'wkd' || target.unit === 'weekday' ){
            jobs[0] = 0
            jobs[1] = 0
            jobs[2] = 0
            jobs[3] = 0
            jobs[4] = assign( target, LIMIT.weekday.min, LIMIT.weekday.max)
        }
    }

    // For flexible custom
    if(Array.isArray(interval) && interval.length >= jobs.length )
    {
        interval.map( (item,count) => {
            if( count < jobs.length ){
                jobs[count] = item
            } 
        })
    }
    
    return `${jobs[0]} ${jobs[1]} ${jobs[2]} ${jobs[3]} ${jobs[4]}`
}
// ------------------------------------------------------------------------------------------------------------
function assign(target,min,max)
{
    let result = target.value

    if(target.value < min)     result = min
    if(target.value > max)     result = max

    return result
}
// ------------------------------------------------------------------------------------------------------------
function checkCommStr(value = '')
{
    const result = { value : 0 , unit: '' }
    const matchPattern  = value.match(REGX_CRON_DURATION) || []

    if( matchPattern.length === 2 )
    {
        result.value = parseNumeric( matchPattern[0] )
        result.unit  = matchPattern[1].toLocaleLowerCase()
        result.from  = value
    }else{
        console.log(`Wrong Pattern from `,value," result : ", matchPattern)
    }
    
    return result
}
// ------------------------------------------------------------------------------------------------------------
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
// ------------------------------------------------------------------------------------------------------------
function parseNumeric(str) {
    const trimmed = str.trim();
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
      return Number(trimmed);
    }
    return null;
}
// ------------------------------------------------------------------------------------------------------------
module.exports = {
    runCronScript
    ,checkCommStr
    ,parseDuration
}