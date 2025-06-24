// =============================================================================================
function pad(norm,fact='00'){  
	let padding = 1 
	norm = Math.floor(Math.abs(norm))
    for( let i=0 ; i < ((''+fact).length)-1 ; i++){
        padding *= 10
        if(norm < padding) norm = '0' + norm
    }
    return ''+norm
}

// =============================================================================================
function getDate(process_env='',offest = 0)
{
	let env 			= {}

	if( process_env !== '')
	{
		env 			= process_env
	}
	
	const now 			= new Date()
	const future 		= new Date(now)
	const offset 		= parseInt(env.DATE_OFFSET) || parseInt(offest)

	const hour 			= pad(future.getHours())
	const min 			= pad(future.getMinutes())
	const sec 			= pad(future.getSeconds())

	if( isNaN( offset ) === false ){
		future.setDate(now.getDate() + offset )
	}

	return `${future.getFullYear()}-${pad(future.getMonth()+1)}-${pad(future.getDate() )} ${hour}:${min}:${sec}`
}
// =============================================================================================
async function checkEnv(request = {})
{
	const env_path 		= '.env'
	await process.loadEnvFile(env_path)

	const datetime_str 	= await getDate(process.env)
	
	console.log(`checkEnv at : ${datetime_str}`)

	const env 			= process.env

	const target_count 	= parseInt(env.TARGET_COUNT)

	if( env.TARGET_COUNT && isNaN( target_count ) === false ){

		for(let n=0; n < target_count; n++)
		{
			const key	 = `TARGET_${ pad( n+1 ) }`
			const url 	 = env[`${ key }_URL`]
			const method = env[`${ key }_METHOD`]

			// Check url not empty
			if( url && typeof url === 'string' && url.length > 7 )
			{
				const protocolMatch  = url.match(/^(https?)/g)
				const protocol_lib   = protocolMatch ? protocolMatch[0] : ''

				if( protocol_lib !== ''){
					console.log(`${key} has been launch!`)
					await request(protocol_lib, method ,url, datetime_str)
				}
			}
		}
	}
}
// =============================================================================================
function request(protocol_lib,method,url,datetime_str)
{
	const protocol = require(protocol_lib)
	const port 	   = protocol_lib === 'https' ? 443 : 80
	const dest 	   = url.match(/^https?:\/\/([^\/]+)(\/.*)$/)
	const host 	   = dest[1]
	const path 	   = dest[2]
	// --------------------------------------------------
	const options = {
						hostname: host,
						port: port,
						path: path,
						method: method,
						headers: {
							'Content-Type': 'application/json'
						}
					}
	// --------------------------------------------------
	const payload = JSON.stringify({ date: datetime_str })
	// --------------------------------------------------
	// Start request and set callback for response
	const req = protocol.request(options, (res) => {
		let respbody = ''

		console.log('Status Code:', res.statusCode)

		res.on('data', (chunk) => {
			respbody += chunk
		})
		res.on('end', () => {
			console.log('Response:', respbody.substring(0,150))
		})
	})
	req.on('error', (e) => {
		console.error('Request error:', e)
	})
	req.write(payload)
	req.end()
}

// =============================================================================================
module.exports = {
                    pad
                    ,getDate
                    ,request
                    ,checkEnv
}