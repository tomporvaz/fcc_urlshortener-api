'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
let bodyParser = require('body-parser');

var cors = require('cors');

var app = express();
let Schema = mongoose.Schema;

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);
console.log("ReadyState: " + mongoose.connection.readyState);

//define url table schema
let urlSchema = new Schema({
  url: {type: String, required: true},
  shortURL: String
})
let URLtable = ("URLtable", urlSchema);

app.use(cors());  

/** this project needs to parse POST bodies **/
app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
/*
first enpoint accepts post requests, parses payload, writes url and shortURL to mongo,
and returns json with url and shortURL
*/
app.post("/api/shorturl/new", function (req, res) {
  dns.lookup(req.body.url, 
    function(err){
      if(err){return console.log("url not found! error: " + err)}
      res.json({"url": req.body.url, "shortURL": "return short URL here"});
    }
  )
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});