require('dotenv').config()

var accountSid = process.env.ACCOUNT_SID
var authToken = process.env.AUTH_TOKEN
var client = require('twilio')(accountSid, authToken)
var request = require('request')
var ytdl = require('ytdl-core')
var ffmpeg = require('fluent-ffmpeg')
var bodyParser = require('body-parser')

var express = require('express')
var app = express()

app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({ extended: true }))

app.get('/', function (req, res) {
  res.render('index', {})
})

app.post('/call', function (req, res) {
  var youtubeUrl = req.body.video === 'other' ? request.body.custom : req.body.video
  client.calls.create({
    url: `http://${req.hostname}/call.xml?youtube_url=${youtubeUrl}`,
    to: process.env.TO_PHONE,
    from: process.env.FROM_PHONE,
    record: true,
    sendDigits: 'wwwwwwwwwwwwwwww1' // wait 8 seconds, dial 1
  }).then(function (call) {
    res.render('result', {})
  }).catch(function (err) {
    res.status(500).json(err)
  })
})

app.get('/call_log', function (req, res) {
  client.calls.get({pageSize: 1000}).then(function (callResponse) {
    return Promise.all(callResponse.calls.map(function (call) {
      if (call.status === 'in-progress') {
        return Promise.resolve(call)
      }
      // otherwise load recordings
      return client.recordings.list({CallSid: call.sid, pageSize: 1}).then(function (recordingResponse) {
        return Object.assign({}, call, {recordings: recordingResponse.recordings})
      })
    }))
  }).then(function (callsWithRecordings) {
    res.render('call_log', {calls: callsWithRecordings})
  }).catch(function (error) {
    res.status(500).json(error)
  })
})

// expects query ?uri=
app.get('/recording', function (req, res) {
  // sdk doesn't support non-JSON calls so we have to do it by hand
  var url = `https://${accountSid}:${authToken}@${client.host}${req.query.uri.replace(/\.json$/, '.mp3')}`
  request.get(url).pipe(res)
})

// expects query ?youtube_url=
app.all('/call.xml', function (req, res) {
  res.render('call_config', {hostname: req.hostname, youtubeUrl: req.query.youtube_url})
})

// expects query ?youtube_url=
app.get('/audio.mp3', function (req, res) {
  res.set({'Content-Type': 'audio/mpeg'})
  var youtubeStream = ytdl(req.query.youtube_url, {
    filter: function (format) {
      return format.container === 'mp4' &&
        format.encoding === 'H.264' &&
        format.audioBitrate !== null
    }
  })
  ffmpeg(youtubeStream)
    .audioCodec('libmp3lame')
    .noVideo()
    .outputFormat('mp3')
    .on('error', function (err) {
      console.error(err)
    })
    .on('end', function () {
      console.log('Audio stream finised')
    })
    .pipe(res, { end: true })
})

var port = process.env.PORT || 5000

app.listen(port, function () {
  console.log('server running')
})
