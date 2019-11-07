const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const io = require('./io-server')
const fsp = fs.promises


var deskCartMap = new Map()

io.restaurant.on('connection', socket => {
  console.log('restaurant client in')

  var restaurant = socket.handshake.query.restaurant
  socket.join(restaurant)
})

io.desk.on('connection', socket => {

  socket.on('disconnect', function () { // 这里监听 disconnect，就可以知道谁断开连接了
    console.log(socket);
  })

  var desk = socket.handshake.query.desk
  if (!desk) {
    socket.close()
    return
  }

  socket.join(desk,() =>{
    console.log(socket)
  })

  var cartFood = deskCartMap.get(desk)

  if (!cartFood) {
    cartFood = [] 
    deskCartMap.set(desk, cartFood)
  }

  socket.emit('cart food', cartFood)

  socket.on('new food', info => {
    var foodAry = deskCartMap.get(info.desk)
    var idx = foodAry.findIndex(it => it.food.id === info.food.id)

    if (idx >= 0) {
      if (info.amount === 0) {
        foodAry.splice(idx, 1)
      } else {
        foodAry[idx].amount = info.amount
      }
    } else {
      foodAry.push({
        food: info.food,
        amount: info.amount,
      })
    }

    io.desk.in(desk).emit('new food', info)
  })
})


let storage = multer.diskStorage({
  destination: function(req,file,cb) {
    cb(null, './upload')
  },
  filename: function(req, file, cb) {
    cb(null, Date.now()+path.extname(file.originalname))
  }
})

const upload = multer({storage:storage})

let db
(async function() {
  db = await require('./db.js')
}())

const app = express.Router()

//获取餐厅和桌面信息并在landing页面展示
app.get('/deskInfo', async (req, res, next) => {
  let info = await db.get(`
    SELECT 
      desks.id as did, 
      users.id as uid, 
      desks.name, 
      users.title 
      FROM desks JOIN users ON desks.rid=users.id 
      WHERE desks.id=?
    `, 
    req.query.did);

    res.json(info)
})

//用户下单
app.post('/restaurant/:rid/desk/:did/order', async (req, res, next) => {
  let rid = req.params.rid
  let did = req.params.did
  let info = req.body

  let details = JSON.stringify(info.foods)
  let status = 'pending'//confirmed/completed
  let timestamp = new Date().toISOString()

  let item = await db.run(`
    INSERT INTO orders (rid,did, deskName,customCount,totalPrice,details,status,timestamp) 
    VALUES (?,?,?,?,?,?,?,?)
  `, rid, did, info.deskName, info.customsCount,info.totalPrice,details, status, timestamp)
  let order
  if(item.lastID) {
    order = await db.get('SELECT * FROM orders WHERE id=?', item.lastID)
    order.details = info.foods
  res.json({code:0, order})
  }else {
    res.json({code:-1})
  }

  var desk = 'desk:' + did

  deskCartMap.set(desk, [])//清空当前桌已点菜数据

  io.desk.in(desk).emit('placeorder success', order)//通知其它人下单成功
  io.restaurant.in('restaurant:' + rid).emit('new order', order)//通知餐厅新订单
})

//订单管理
app.route('/restaurant/:rid/order')
  .get(async (req, res, next) => {

    let orders = await db.all('SELECT * FROM orders WHERE rid=? ORDER BY timestamp DESC', req.signedCookies.userId)

    orders.forEach(order => {
      order.details = JSON.parse(order.details)
    })
    console.log(orders)
    res.json(orders)
  })


//顾客获取餐厅菜单
app.get('/menu/restaurant/:rid', async (req, res, next) => {
  let menu = await db.all(`
  SELECT * FROM foods WHERE rid=? AND status='on'
  `,req.params.rid)

  res.json(menu)
})

//删除订单
app.route('/restaurant/:rid/order/:oid')
.delete(async (req, res, next) => {
  console.log('1')
  await db.run('DELETE FROM orders WHERE id = ? AND rid = ?', req.params.oid, req.signedCookies.userId)
  res.json().end()
})

// 更改订单状态
// PUT {status: 'pending/confirmed/completed'}
app.route('/restaurant/:rid/order/:oid/status')
.put(async (req, res, next) => {
  await db.run(`
    UPDATE orders SET status = ?
      WHERE id = ? AND rid = ?
  `, req.body.status, req.params.oid, req.signedCookies.userId)

  res.json(await db.get(`SELECT * FROM orders WHERE id = ?`, req.params.oid))
})



//菜品管理
app.route('/restaurant/:rid/food')
  .get( async (req,res,next) => {//获取所有菜品列表
    let foods = await db.all(`SELECT * FROM foods WHERE rid=?`,req.signedCookies.userId)
    res.json(foods)
  })
  .post(upload.single('img'), async (req, res, next) => {//增加一个菜品
    // console.log(req.signedCookies.userId,req.body.desc,req.body.category, req.body.name, req.body.price, req.body.status)
    // console.log(req.file.path)
    if(!req.body.name ) {
      return res.json({code:-1,msg:'请填写菜名'}).end()
    }
    let item = await db.run(`
      INSERT INTO foods (rid,name,price,status,img,category,desc) VALUES (?,?,?,?,?,?,?)
    `, req.signedCookies.userId, req.body.name, req.body.price, req.body.status, req.file != null?req.file.path:null,req.body.category, req.body.desc)
    
    let food = await db.get('SELECT * FROM foods WHERE id=?',item.lastID)
    res.json({
      food,
      code:0,
    })
  })

app.route('/restaurant/:rid/food/:fid')
  .delete(async (req, res, next) => {//删除一个菜品
    let fid = req.params.fid
    let rid = req.signedCookies.userId
    let food =await db.get('SELECT * FROM foods WHERE id=? AND rid=?', fid, rid)
    if(!food) return res.json({code:-1,msg:'该菜品不存在'}).end()
    let change = await db.run(`
      DELETE FROM foods WHERE id=? AND rid=?
    `, req.params.fid, req.signedCookies.userId)
    // await fsp.unlink(food.img)
    if(change.changes) {
      res.json({code:0})
    }else {
      res.json({code:-1,msg:'该菜品已删除'})
    }
  })
  .put(upload.single('img'), async (req, res, next) => {//修改一个菜品
    let fid = req.params.fid
    let rid = req.signedCookies.userId
    let info = req.body
    let food = await db.get('SELECT * FROM foods WHERE id=? AND rid=?', fid, rid)
    if(!food) {
      res.json({code:-1,msg:'菜品不存在'}).end()
      return
    }
    let newFood = {
      ...Object.assign({},food,info),
      img: req.file != null ? req.file.path : food.img
    }

    // if(food.img != newFood.img) {
    //   await fsp.unlink(food.img)
    // }
    let change = await db.run(`
      UPDATE foods SET name=?, price=?, status=?, desc=?, category=?, img=?
      WHERE id=? AND rid=?
    `, newFood.name,newFood.price,newFood.status,newFood.desc,newFood.category,newFood.img,fid,rid)

    if(change) {
      res.json({code:0,food:newFood})
    }else {
      res.json({code:-1,msg:'该菜品不存在'})
    }
  })


  
//桌面管理
app.route('/restaurant/:rid/desk')
  .get( async (req,res,next) => {//获取所有桌面列表
    let desks = await db.all(`SELECT * FROM desks WHERE rid=?`,req.signedCookies.userId)
    res.json(desks)
  })
  .post(async (req, res, next) => {//增加一个桌面
    let item = await db.run(`
      INSERT INTO desks (rid,name,capacity) VALUES (?,?,?)
    `, req.signedCookies.userId, req.body.name, req.body.capacity)
    
    let desk = await db.get('SELECT * FROM desks WHERE id=?',item.lastID)
    console.log(item)
    res.json({
      desk,
      code:0,
    })
  })

app.route('/restaurant/:rid/desk/:did')
  .delete(async (req, res, next) => {//删除一个桌面
    let did = req.params.did
    let rid = req.signedCookies.userId
    console.log(did,rid)
    let desks =await db.get('SELECT * FROM desks WHERE id=? AND rid=?', did, rid)
    console.log(desks)
    if(!desks) return res.json({code:-1,msg:'该桌面不存在'}).end()
    let change = await db.run(`
      DELETE FROM desks WHERE id=? AND rid=?
    `, req.params.did, req.signedCookies.userId)
    console.log(change.changes)
    if(change.changes) {
      res.json({code:0})
    }else {
      res.json({code:-1,msg:'该桌面已删除'})
    }
  })
  .put(async (req, res, next) => {//修改一个桌面}
    let did = req.params.did
    let rid = req.signedCookies.userId
    let info = req.body
    console.log(info)
    let desks = await db.get('SELECT * FROM desks WHERE id=? AND rid=?', did, rid)
    if(!desks) res.json({code:-1,msg:'桌面不存在'})
    let change = await db.run(`
      UPDATE desks SET name=?, capacity=?
      WHERE id=? AND rid=?
    `, info.name,info.capacity,did,rid)

    if(change.changes) {
      res.json({code:0,msg:'修改成功'})
    }else {
      res.json({code:-1,msg:'该桌面不存在'})
    }
  })

module.exports = app