const http 		= require('http')
const crypt 	= require('crypto')
// ===================================================
const PORT 		= 9978
// ===================================================
const reqserv 	= http.createServer(onRequest)
reqserv.listen(PORT)
console.log(`Start server at port : ${PORT}`)
// ===================================================
let req_count 	= 0
// ===================================================
function onRequest(req,resp)
{
	req_count	   += 1
	const now 		= new Date()
	const result 	= `Hello ${req_count} | ${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()} : ${now.getSeconds()}`
	
	console.log(result)

	resp.writeHead(200, { 'Content-Type' : 'text/plain' })
	resp.write(result)
	resp.end()
}


