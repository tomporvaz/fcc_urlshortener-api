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

//define url schema
let urlSchema = new Schema({
  url: {type: String, required: true},
  shortURL: {type: Number, index: true, required: true, unique: true, min: 0, max: 99999}
})
let URLentry = mongoose.model("URLentry", urlSchema);

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
  console.log("ParsedURL: " + JSON.stringify(parsedURL));
  
  //dns.lookup checks if url is valid.
  dns.lookup(parsedURL.hostname, 
    function(err){
      //If url is invalid, then error is logged and response to user notes the error
      if(err){ 
        res.json({"url": req.body.url, "error": "invalid url"})
        console.error("url not found! error: " + err)
      } else {
        /*
        createEntry function creates a URLentry document with the current URL,
        document.save() saves new URLentry to the database, and with an 11000 error
        indicating a database collision, createEntry() function is recursively called 
        with an attemptCounter incremented up to 10 attempts, at which point an error will
        be thrown, and the range of unique numbers should be increased.
        */
        function createEntry(requestBodyURL, attemptCounter) {
          if (attemptCounter > 10){
            res.json({Error: "Too many attempts to save shortURL"});
            throw new Error ("Too many attempts to save shortURL");
          }
          
          const currentURL = new URLentry({url: requestBodyURL, shortURL: getRandomInt(10000)});
          return currentURL.save(
            function(err, entry){
              if(err){
                console.error("CurrentURL could not be saved. " + err);
                
                //check if error occured due to a shortURL collision and set retry to true if so
                //could be implemented using info from error (less resilent due to mongoose updates)
                //or it could be implemented with a query (ineffecient due to additional db request)
                if(err.code === 11000){
                  console.log("Error code 11000");
                  console.log("attemptCouter = " + attemptCounter);
                  createEntry(requestBodyURL, ++attemptCounter);
                }
              } else {
                console.log("Returned Entry: " + JSON.stringify(entry));
                return res.json({"URL": entry.url, "ShortURL": entry.shortURL});
              }
              
            }
            )
          }
          createEntry(req.body.url, 0);
        }
      })
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
  } else {
    //return error here and escape function
    console.error("url does not contain a protocol")}
    
    //split hostname off of url
    const beginSlice = protocol.length;
    console.log("BeginSlice: " + beginSlice);
    const endSlice = url.indexOf("/", (protocol.length + 1));
    console.log("EndSlice: " + endSlice);
    
    if (endSlice > -1){
      hostname = url.slice(beginSlice, endSlice);
    } else {hostname = url.slice(beginSlice)};
    
    //split path off of url
    if (endSlice > -1){
      path = url.slice(endSlice);
    }
    
    //return object with url, protocol, hostname, and path
    return {
      "url": url,
      "protocol": protocol,
      "hostname": hostname,
      "path": path
    }
  }
  
  
  function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
  }
  
  app.listen(port, function () {
    console.log('Node.js listening ...');
  });