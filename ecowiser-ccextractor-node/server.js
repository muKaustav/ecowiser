require('dotenv').config()
const cors = require('cors')
const express = require('express')
const { extract } = require('./extract')

const app = express()

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Node API' })
})

app.post('/add', (req, res) => {
    const { num1, num2 } = req.body

    console.log(num1, num2)

    const sum = num1 + num2

    res.send({
        "sum": sum,
        "num1": num1,
        "num2": num2
    })
})

app.post('/extract', extract)

let port = process.env.PORT || 5000

app.listen(5000, () => {
    console.log(`Server running on port ${port}`)
})