const http = require('http')

// ===================================================
const PORT = 7992
// ===================================================
const reqserv = http.createServer(onRequest)
reqserv.listen(PORT)
console.log(`Start server at port : ${PORT}`)
// ===================================================
function onRequest(req,resp)
{
	const now 	= new Date()
	const result 	= `Hello at  ${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()} ${now.getHours()}:${now.getMinutes()} : ${now.getSeconds()}`
	resp.writeHead(200)
	console.log(result)
	resp.write(result)
	resp.end()
}


