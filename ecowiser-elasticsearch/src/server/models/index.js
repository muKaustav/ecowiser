const { esclient, index, type } = require("../../elastic")

let getAllData = async () => {
  const { body: { hits } } = await esclient.search({
    index: index,
    type: type,
    body: {
      query: {
        match_all: {}
      }
    }
  })

  return hits.hits.map((hit) => {
    return {
      id: hit._id,
      subtitle: hit._source.subtitle,
      timing: hit._source.timing,
      video_url: hit._source.video_url
    }
  })
}

let getSubtitles = async (req) => {
  const query = {
    "query": {
      "bool": {
        "must": [
          {
            "multi_match": {
              "type": "best_fields",
              "query": `subtitle ${req.text}`,
              "lenient": true
            }
          }
        ],
        "filter": [],
        "should": [],
        "must_not": []
      }
    },
  }

  const { body: { hits } } = await esclient.search({
    from: req.page || 0,
    size: req.limit || 100,
    index: index,
    type: type,
    body: query
  })

  const results = hits.total.value

  const values = hits.hits.map((hit) => {
    return {
      id: hit._id,
      subtitle: hit._source.subtitle,
      timing: hit._source.timing,
      video_url: hit._source.video_url,
      score: hit._score
    }
  })

  return { results, values }
}

let insertNewSubtitle = async (subtitle, timing, video_url) => {
  return esclient.index({
    index,
    type,
    body: { subtitle, timing, video_url }
  })
}

module.exports = { getSubtitles, insertNewSubtitle, getAllData }