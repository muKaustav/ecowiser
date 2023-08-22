const fs = require('fs')
const { spawn } = require('child_process')
const AWS = require('aws-sdk')
const axios = require('axios')

AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
})

const s3 = new AWS.S3()

let runCCExtractor = (videoPath) => {
    return new Promise((resolve, reject) => {
        const command = 'ccextractor'
        const outputSRTPath = 'output.srt'

        const args = [
            videoPath,
            '-o', outputSRTPath
        ]

        const child = spawn(command, args)

        let ccextractorOutput = ''

        child.stdout.on('data', (data) => {
            ccextractorOutput += data.toString()
            console.log(`ccextractor output (stdout): ${data}`)
        })

        child.stderr.on('data', (data) => {
            console.error(`ccextractor output (stderr): ${data}`)
        })

        child.on('close', (code) => {
            if (code === 0 || code == 10) {
                console.log('ccextractor completed successfully.')

                fs.readFile(outputSRTPath, 'utf8', (err, srtContents) => {
                    if (err) {
                        console.error(`Error reading output SRT file: ${err}`)
                        resolve({ ccextractorOutput, srtContents: null })
                    } else {
                        console.log(`Read output SRT file: ${outputSRTPath}`)
                        // console.log(ccextractorOutput)
                        resolve(srtContents)
                    }

                    fs.unlink(videoPath, (videoErr) => {
                        if (videoErr) {
                            console.error(`Error removing video file: ${videoErr}`)
                        } else {
                            console.log(`Video file ${videoPath} removed.`)
                        }

                        fs.unlink(outputSRTPath, (srtErr) => {
                            if (srtErr) {
                                console.error(`No subtitles || Error removing output SRT file: ${srtErr}`)
                            } else {
                                console.log(`Output SRT file ${outputSRTPath} removed.`)
                            }
                        })
                    })
                })
            } else {
                console.error(`ccextractor exited with code ${code}`)
                reject(`ccextractor exited with code ${code}`)
            }
        })
    })
}


let extract = async (req, res) => {
    let { url } = req.body

    let params = {
        Bucket: process.env.AWS_STORAGE_BUCKET_NAME,
        Key: url
    }

    s3.getObject(params, async (err, data) => {
        if (err) {
            console.log(err)
            res.status(500).send(err)
        }

        let videoUrl = process.env.AWS_S3_CUSTOM_DOMAIN + url
        let videoPath = data.ETag.replace(/"/g, '') + '.' + url.split('.').pop()

        axios.get(videoUrl, { responseType: 'stream' }).then((response) => {
            const videoStream = response.data
            const fileStream = fs.createWriteStream(videoPath)

            videoStream.pipe(fileStream)

            fileStream.on('finish', () => {
                console.log('Video downloaded successfully.')

                runCCExtractor(videoPath)
                    .then((ccextractorOutput) => {
                        // console.log(ccextractorOutput)
                        res.send({ ccextractorOutput })
                    }).catch((err) => {
                        console.error(err)
                        res.send({
                            "error": err
                        })
                    })
            })

            fileStream.on('error', (err) => {
                console.error('Error downloading video:', err)
                res.send({
                    "error": err
                })
            })
        }).catch((error) => {
            console.log(error)
            res.send({
                "error": error
            })
        })
    })
}

module.exports = { extract }