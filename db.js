const sqlite = require('sqlite')

const dbPromise = sqlite.open(__dirname + '/db/order.sqlite3')

module.exports = dbPromise