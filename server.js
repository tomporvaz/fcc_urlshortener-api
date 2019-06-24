'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
let bodyParser = require('body-parser');
const dns = require('dns');

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
  //req.body.url needs to be parsed before passing it into dns.lookup.  
  //dns.lookup will not accept the protocol (https//) and it cannot have a path (e.g. /)
  //recommendation: parse req.body.url with regexs and pass host var to dns look up.
  let parsedURL = urlParser(req.body.url);
  console.log("ParsedURL: " + parsedURL);


  dns.lookup(req.body.url, 
    function(err){
      if(err){ 
        res.json({"url": req.body.url, "shortURL": "return short URL here"})
        console.error("url not found! error: " + err)}
      res.json({"url": req.body.url, "shortURL": "return short URL here"});
    }
  )
});

/*url parser function to split url into:
    - protocol (e.g. https://),
    - hostname (e.g. www.freecodecamp.org)
    - path (e.g. /) 
*/
function urlParser(url) {
  let protocol = "";
  let hostname = "";
  let path = "";

  //split protocol off of url
  if(url.startsWith("https://")){
    protocol = "https://"
  } else if (url.startsWith("http://")){
    protocol = "http://"
  } else {console.error("url does not contain a protocol")}

  //split hostname off of url

  //split path off of url


  //return object with url, protocol, hostname, and path
  return {
    "url": url,
    "protocol": protocol,
    "hostname": hostname,
    "path": path
  }
}


app.listen(port, function () {
  console.log('Node.js listening ...');
});