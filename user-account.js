const express = require('express')
const fs = require('fs')
const fsp = fs.promises

const md5 = require('md5')
const svgCaptcha = require('svg-captcha')
const multer = require('multer')
const mailer = require('./mailer')

let db
(async function() {
  db = await require('./db.js')
}())

const upload = multer({
  dest: './upload',
  preservePath: true,
})

const app = express.Router()

let changePassToken = {}

//验证码
app.get('/captcha', (req, res, next) => {
  let captcha = svgCaptcha.create({
    ignoreChars: '0Oo1ilI',
    color: true
  })
  console.log(captcha)
  res.type('svg')
  req.session.captcha = captcha.text
  res.send(captcha.data)
})

//用户信息
app.get('/userInfo', async (req, res, next) => {
  let userId = req.signedCookies.userId
  if (userId) {
    res.json({
      code: 0,
      info: await db.get('SELECT id,name,title FROM users WHERE id=?', userId)
    })
  } else {
    res.status(404).json({
      code:-1,
      msg:'不存在此餐厅'
    }).end()
  }
})

app.route('/login')
  .post(async (req, res, next) => {
    let tryUserInfo = req.body

    if(tryUserInfo.captcha != req.session.captcha) {//验证码错误
      res.json({code:-1,msg:'验证码错误'})
      return
    }
    let user = await db.get('SELECT id,title FROM users WHERE name=? AND pwd=?', tryUserInfo.name, md5(tryUserInfo.pwd))
    if (user) {
      res.cookie('userId', user.id, {
        signed: true,
        httpOnly: true,
      })
      
      res.json({
        id:user.id,
        msg: '登录成功',
        code: 0
      })
      return
    } else {
      res.json({
        code: -1,
        msg: '用户名或密码错误'
      })
    }
    res.end()
  })

//注册
app.route('/register')
  .post(async (req, res, next) => {
    let reqInfo = req.body
    let user = await db.get('SELECT * FROM users WHERE name=?', reqInfo.name)
    if (user) {
      res.json({
        code: -1,
        msg: '用户已被占用'
      })
    } else {
      console.log(reqInfo)
      await db.run('INSERT INTO users (name, email, pwd, title) VALUES(?,?,?,?)', reqInfo.name, reqInfo.email, md5(reqInfo.pwd), reqInfo.title)
      res.json({
        code: 0,
        msg: '注册成功'
      })
    }
    res.end()
  })
//登出
app.get('/logout', (req, res, next) => {
  res.clearCookie('userId')
  res.json({
    code:0,
    msg:'登出成功'
  })
})
//忘记密码
app.route('/forgot')
  .post(async (req, res, next) => {
    let email = req.body.email
    let user = await db.get('SELECT * FROM users WHERE email=?', email)
    if (user) {
      let token = Math.random().toString().slice(2)
      changePassToken[token] = email
      setTimeout(() => {
        delete changePassToken[token]
      }, 1000 * 60 * 20)
      let link = `https:///#/changePass/${token}`
      console.log(link)
      res.json({
        code: 0,
        msg: '已向您的邮箱发送密码重置链接，请于20分钟内点击链接修改密码'
      })
      //邮件发送
      return
      mailer.sendMail({
        from: '401688138@qq.com',
        to: email,
        subject: '密码重置链接',
        text: '请点击链接重置密码: ' + link,
      }, (err, data) => {
        if (err) {
          console.log(err)
          res.redirect('/forgot')
        } else {
          res.json({
            code: 0,
            msg: '已向您的邮箱发送密码重置链接，请于20分钟内点击链接修改密码'
          })
        }
      })
    } else { //ajax重写
      res.json({
        code: -1,
        msg: '用户不存在'
      })
    }
  })

app.route('/changePass/:token')
  .get(async (req, res, next) => {
    let token = req.params.token
    if(!token) {
      res.json({code:-1,msg:'链接已失效'}).end()
    }else {
      res.json({code:0}).end()
    }

  })
  .post(async (req, res, next) => {
    let token = req.params.token
    let pwd = md5(req.body.pwd)
    let user = await db.get('SELECT * FROM users WHERE email=?', changePassToken[token])
    if (user) {
      await db.run('UPDATE users SET pwd=? where id=?', pwd, user.id)
      delete changePassToken[token]
      res.json({
        code: 0,
        msg: '密码修改成功'
      })
    } else {
      res.json({
        code: -1,
        msg: '此链接已失效'
      })
    }
  })

module.exports = app