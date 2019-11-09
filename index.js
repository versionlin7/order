const {httpServer, httpsServer} = require('./http-server')

const app = require('./App')
const io = require('./io-server')

httpsServer.on('request', app)
httpServer.on('request', function (req, res) {
  res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
  res.end();
})

io.desk.attach(httpsServer)
io.restaurant.attach(httpsServer)



httpsServer.listen(443, () => {
  console.log(443)
})
httpServer.listen(80, () => {
  console.log(80)
})

// var http = require('http')
// var server = http.createServer()
// var socketIO = require('socket.io')

// var io = socketIO(server)
// //相当于
// server.on('upgrade', () => {

// })
// server.on('request', (req, res) => {
//用于请求
//http://xxxx/socket.io/socket.io.js
// })


//这样的顺序会报错
// var io = socketIO(server)
// server.on('request', app)