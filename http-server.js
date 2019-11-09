const http = require('http')
const https = require('https')
const fs = require('fs')
const httpServer = http.createServer()
const httpsServer = https.createServer({
    key : fs.readFileSync('/root/.acme.sh/7.versionlin.com/7.versionlin.com.key'),
    cert : fs.readFileSync('/root/.acme.sh/7.versionlin.com/7.versionlin.com.cer')
})
module.exports = {httpServer, httpsServer}
