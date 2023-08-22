const express = require("express")
const controller = require("../controllers")

const Router = express.Router()

Router.get('/', controller.getSub)
Router.post('/new', controller.addSub)
Router.post('/bulk', controller.addSubBulk)
Router.get('/all', controller.getAllData)

module.exports = Router