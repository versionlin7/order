const express = require('express')
const path = require('path')
const cors = require('cors')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const app = express()

// ioServer.on('connect', socket => {
//   console.log(socket.request.headers.referer)
//   console.log(socket.request)
//   console.log(socket.request.headers)
//   // let path = url.parse(socket.request.headers.referer).path
//   // socket.join(path) 
// })

app.use(cors({
  credentials: true,
  maxAge: 86400,
  origin: function(origin,cb) {
    cb(null,true)
  },

}))
app.use(session({
  secret:'secret',
  resave: false,
  saveUninitialized: true,
}))
app.use(cookieParser('secret'))

const userAccountMiddleware = require('./user-account.js')
const restaurantMiddleware = require('./restaurant')

app.use(express.static(__dirname + "/static"))//处理静态文件请求的中间件
app.use(express.static(__dirname + "/build"))//处理静态文件请求的中间件
app.use('/upload', express.static(__dirname + '/upload'))//处理静态文件请求的中间件

app.use(express.urlencoded({extended:true}))//用于解析扩展url编码请求体
app.use(express.json())//用于解析json请求体

app.use('/api', userAccountMiddleware)
app.use('/api', restaurantMiddleware)

module.exports = app