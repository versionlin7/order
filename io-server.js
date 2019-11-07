const socketIO = require('socket.io')

// module.exports =  socketIO()

module.exports.restaurant = socketIO({
  path:'/restaurant'
})
module.exports.desk = socketIO({
  path:'/desk'
})


