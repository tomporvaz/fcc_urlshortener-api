'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

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
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});