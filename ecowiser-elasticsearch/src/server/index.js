require("dotenv").config()
const cors = require("cors")
const express = require("express")
const routes = require("./routes")

const app = express()
const PORT = process.env.NODE_PORT || 5001

start = () => {
  return app.use(cors())
    .use(express.json())
    .use("/subtitles", routes)
    .use((_req, res) => res.status(404).json({ success: false, error: "Route not found" }))
    .listen(PORT, () => console.log(`Server ready on port ${PORT}`))
}

module.exports = { start }