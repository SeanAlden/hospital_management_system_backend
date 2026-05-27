// const serverless = require('serverless-http')
// const app = require('../app')

// module.exports = serverless(app)

// const app = require('../app')

// module.exports = (req, res) => {
//     return res.json({ ok: true })
// }

const serverless = require('serverless-http')
const app = require('../app')

// module.exports = serverless(app)

module.exports = (req, res) => {
    console.log("HIT:", req.url)
    return res.json({ ok: true })
}