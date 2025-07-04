const http 		= require('http')
const crypt 	= require('crypto')
const zutils 	= require('./lib/zutils')
// =============================================================================================
const PORT 		= 9978
// =============================================================================================
const reqserv 	= http.createServer(onRequest)
reqserv.listen(PORT)
console.log(`Start server at port : ${PORT}`)
// =============================================================================================
let req_count 	= 0
// =============================================================================================
async function onRequest(req,resp)
{
	req_count	   	   += 1
	
	const reqresp 		= await zutils.checkEnv(req)
	const result 		= `Active at :  ${req_count} | ${ zutils.getDate() } | Requested : ${ reqresp.requested } (${reqresp.req_method}) `

	resp.writeHead(200, { 'Content-Type' : 'text/plain' })
	resp.write(result)
	resp.end()
}



