require("dotenv").config()
const { Client } = require("@elastic/elasticsearch")

const elasticUrl = process.env.ELASTIC_URL || "http://localhost:9200"
const esclient = new Client({ node: elasticUrl })

const index = "subtitles"
const type = "_doc"

let createIndex = async (index) => {
  try {
    await esclient.indices.create({ index })
    console.log(`Created index ${index}`)
  } catch (err) {
    console.error(`An error occurred while creating the index ${index}:`)
    console.error(err)
  }
}

let setSubtitlesMapping = async () => {
  try {
    const schema = {
      subtitle: { type: "text" },
      timing: { type: "text" },
      video_url: { type: "text" }
    }

    await esclient.indices.putMapping({
      index,
      type,
      include_type_name: true,
      body: { properties: schema }
    })

    console.log("Subtitle mapping created successfully")
  } catch (err) {
    console.error("An error occurred while setting the subtitle mapping:")
    console.error(err)
  }
}

let checkConnection = () => {
  return new Promise(async (resolve) => {
    console.log("Checking connection to ElasticSearch...")
    let isConnected = false

    while (!isConnected) {
      try {
        await esclient.cluster.health({})
        console.log("Successfully connected to ElasticSearch")
        isConnected = true
        // eslint-disable-next-line no-empty
      } catch (_) {
        console.log("Connection failed, retrying in 2 seconds...")
      }
    }
    resolve(true)
  })
}

module.exports = { esclient, setSubtitlesMapping, checkConnection, createIndex, index, type }