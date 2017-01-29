require('dotenv').config()

var accountSid = process.env.ACCOUNT_SID
var authToken = process.env.AUTH_TOKEN
var client = require('twilio')(accountSid, authToken)
var request = require('request')
var fs = require('fs')

var express = require('express')
var app = express()

app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.render('index', {})
})

app.post('/call', function (req, res) {
  client.calls.create({
    url: `http://${req.hostname}/call.xml`,
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

app.all('/call.xml', function (req, res) {
  res.render('twiml', {hostname: req.hostname})
})

app.get('/track.mp3', function (req, res) {
  res.format({'audio/mpeg': function () {
    fs.createReadStream('./Daler Mehndi - Tunak Tunak Tun Video.mp3').pipe(res)
  }})
})

var port = process.env.PORT || 5000

app.listen(port, function () {
  console.log('server running')
})
