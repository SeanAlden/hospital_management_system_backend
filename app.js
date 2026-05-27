// const express = require('express')
// const cors = require('cors')
// const path = require('path')

// const apiRoutes = require('./routes/api')

// const app = express()

// app.use(express.static(path.join(__dirname, "public")))
// app.use(cors())
// app.use(express.json())

// app.get("/", (_, res) => {
//     res.json({ message: "Hello World" })
// })

// app.use('/api', apiRoutes)

// module.exports = app

// const express = require('express')
// const cors = require('cors')

// const apiRoutes = require('./routes/api')

// const app = express()

// app.use(cors())
// app.use(express.json())

// app.get("/", (_, res) => {
//     return res.json({
//         success: true,
//         message: "Hello World"
//     })
// })

// app.use('/api', apiRoutes)

// module.exports = app

require('dotenv').config()

const express = require('express')
const cors = require('cors')
const apiRoutes = require('./routes/api')

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (_, res) => {
    res.json({ success: true, message: "Hello World" })
})

app.use('/api', apiRoutes)

module.exports = app