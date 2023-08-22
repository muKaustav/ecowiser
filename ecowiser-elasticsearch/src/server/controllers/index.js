const model = require("../models")
const elastic = require("../../elastic")

let getAllData = async () => {
  try {
    const result = await model.getAllData()
    return result

  } catch (err) {
    res.status(500).json({ success: false, error: "Unknown error." })
  }
}

let getSub = async (req, res) => {
  const query = req.query

  console.log("query", query)

  if (!query.text) {
    res.status(422).json({
      error: true,
      data: "Missing required parameter: text"
    })

    return
  }

  try {
    const result = await model.getSubtitles(req.query)
    res.json({ success: true, data: result })

  } catch (err) {
    res.status(500).json({ success: false, error: "Unknown error." })
  }
}

let addSub = async (req, res) => {
  const body = req.body

  if (!body.subtitle || !body.timing || !body.video_url) {
    res.status(422).json({
      error: true,
      data: "Missing required parameter(s): 'body' or 'subtitle' or 'timing' or 'video_url'"
    })

    return
  }

  try {
    const result = await model.insertNewSubtitle(body.subtitle, body.timing, body.video_url)

    res.json({
      success: true,
      data: {
        id: result.body._id,
        subtitle: body.subtitle,
        timing: body.timing,
        video_url: body.video_url
      }
    })

  } catch (err) {
    res.status(500).json({ success: false, error: "Unknown error." })
  }
}

let addSubBulk = async (req, res) => {
  const esAction = {
    index: {
      _index: elastic.index,
      _type: elastic.type
    }
  }

  let subtitles = req.body.subtitles

  let docs = []

  for (const subtitle of subtitles) {
    docs.push(esAction)
    docs.push(subtitle)
  }

  try {
    const result = await elastic.esclient.bulk({ body: docs })

    res.json({ success: true, data: result })

  } catch (err) {
    res.status(500).json({ success: false, error: "Unknown error." })
  }
}

module.exports = { getSub, addSub, addSubBulk, getAllData }