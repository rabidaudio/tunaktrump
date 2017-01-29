require('dotenv').config()

var accountSid = process.env.ACCOUNT_SID
var authToken = process.env.AUTH_TOKEN
var client = require('twilio')(accountSid, authToken)
var fs = require('fs')

var express = require('express')
var app = express()


app.get('/', function(req, res){
  client.calls.create({
    url: `http://${req.hostname}/call.xml`,
    to: process.env.TO_PHONE,
    from: process.env.FROM_PHONE,
    sendDigits: 'ww1'
  }, function(err, call) {
    if(err){
      res.error(err)
      return
    }
    res.json(call)
  })
})

app.all('/call.xml', function(req, res){
  res.status(200).send(
    '<?xml version="1.0" encoding="UTF-8"?>' +
      `<Response><Play>http://${req.hostname}/track.mp3</Play></Response>`)
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


