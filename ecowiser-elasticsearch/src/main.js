const elastic = require("./elastic")
const server = require("./server")
require("dotenv").config();

(main = async () => {

  const isElasticReady = await elastic.checkConnection()

  if (isElasticReady) {

    const elasticIndex = await elastic.esclient.indices.exists({ index: elastic.index })

    if (!elasticIndex.body) {
      await elastic.createIndex(elastic.index)
      await elastic.setSubtitlesMapping()
    }

    server.start()
  }

})()