require('dotenv').config()

var accountSid = process.env.ACCOUNT_SID
var authToken = process.env.AUTH_TOKEN
var client = require('twilio')(accountSid, authToken)
var fs = require('fs')

var express = require('express')
var app = express()

app.get('/', function(req, res){
  fs.createReadStream('./index.html').pipe(res)
})

app.post('/call', function(req, res){
  client.calls.create({
    url: `http://${req.hostname}/call.xml`,
    to: process.env.TO_PHONE,
    from: process.env.FROM_PHONE,
    record: true,
    sendDigits: 'wwwwwwwwwwwwwwww1' // wait 8 seconds, dial 1
  }, function(err, call) {
    if(err){
      res.status(500).json(err)
      return
    }
    res.send(
      '<h1>Bam!<h1>' +
      `<p>We are still working on a way to record these,
        but in the meantime rest assured that it is working. Keep up the fight!</p>`
    )
  })
})

app.all('/call.xml', function(req, res){
  res.status(200).send(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      '<Response>'+
      '<Pause length="90"/>'+
      '<Say>Yes</Say>'+
      `<Play>http://${req.hostname}/track.mp3</Play>`+
      '</Response>'
    )
})

app.get('/track.mp3', function(req, res){
  res.format({'audio/mpeg': function(){
    fs.createReadStream('./Daler Mehndi - Tunak Tunak Tun Video.mp3').pipe(res)
  }})
})

var port = process.env.PORT || 5000;

app.listen(port, function() {
  console.log("server running");
})


