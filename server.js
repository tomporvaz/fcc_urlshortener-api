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
  
  let retry = false; //used to test if url should be resaved.
  
  dns.lookup(parsedURL.hostname, 
    function(err){
      if(err){ 
        res.json({"url": req.body.url, "error": "invalid url"})
        console.error("url not found! error: " + err)
      } else {
        //query mongo to find available shorturl
        //add parsedURL object to mongo with a shorturl
        //The do while loop will retry a new random number until save is sucessful
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
                  createEntry(requestBodyURL, attemptCounter++);
                }
              };
              console.log("Returned Entry: " + JSON.stringify(entry));
              return res.json({"URL": entry.url, "ShortURL": entry.shortURL});
            }
          )
          
          /*
          return new Promise(function (resolve) {
            let entryPromise = createSaveShortURL(req.body.url);
            entryPromise
            .then(entry => function(entry){
              console.log("Returned Entry: " + JSON.stringify(entry));
              return res.json({"URL": entry.url, "ShortURL": entry.shortURL});
            } .catch(
              (error) => {
                console.error("CurrentURL could not be saved. " + error);
                if(error.code === 11000){
                  console.log("Error code 11000");
                  attemptCounter += attemptCounter;
                  createEntry(url, attemptCounter);
                }
              }
              )
              
              )
            })*/
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


  //DELETE ALL CODE HERE too....
  function createSaveShortURL (requestBodyURL) {
    const currentURL = new URLentry({url: requestBodyURL, shortURL: getRandomInt(10000)});
    return currentURL.save()
    /*.then(
      savedEntry => savedEntry, //return saved object
      //begining of failure callback the recursively calls createSaveShortURL on shortURL db collision
      function(error){  
        console.error("CurrentURL could not be saved. " + error);
        if(error.code === 11000){
          console.log("Error code 11000");
          createSaveShortURL(requestBodyURL);
        }
      }*/
      // );
      /*
      function(err, entry){
        if(err){
          console.error("CurrentURL could not be saved. " + err);
          
          //check if error occured due to a shortURL collision and set retry to true if so
          //could be implemented using info from error (less resilent due to mongoose updates)
          //or it could be implemented with a query (ineffecient due to additional db request)
          if(err.code === 11000){
            console.log("Error code 11000");
            createSaveShortURL(requestBodyURL);
          }
        };
        console.log("Saved entry: " + JSON.stringify(entry));
        
      }
      );
      */
    };
    //....HERE!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    
    app.listen(port, function () {
      console.log('Node.js listening ...');
    });