const httpServer = require('./http-server')
const app = require('./App')
const io = require('./io-server')

httpServer.on('request', app)

io.desk.attach(httpServer)
io.restaurant.attach(httpServer)

const port = 9090

httpServer.listen(port, () => {
  console.log(port)
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