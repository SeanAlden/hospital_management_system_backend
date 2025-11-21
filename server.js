// server.js
const express = require('express')
const cors = require('cors')
const path = require('path')
const apiRoutes = require('./routes/api')

// Import controller
const patientController = require('./controllers/patient-controller')

const app = express()
const port = 5000

app.use(express.static(path.join(__dirname, "public")))
app.use(cors())
app.use(express.json())

app.get("/", (_, res) => {
    res.json({ message: "Hello World" })
})

// Semua route API
app.use('/api', apiRoutes)

// const supplierRoutes = require('./routes/supplier-routes');
// app.use('/api/suppliers', supplierRoutes);


app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`)
})
