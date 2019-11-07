const nodemailer = require('nodemailer')

let transporter = nodemailer.createTransport({
  service: 'qq',
  auth: {
    user: '401688138',
    pass: 'btxjvvxglxmpbhii'
  }
});

module.exports = transporter