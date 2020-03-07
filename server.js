'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bodyParser = require('body-parser');
var cors = require('cors');
const dnsLookup = require('dns').lookup;
const uuidv4 = require('uuid').v4;

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const urlSchema = new Schema({
  original_url: { type: String, required: true },
  id : { type: String, required: true }
});
const Url = mongoose.model('Url', urlSchema);

app.post('/api/shorturl/new', (req, res) => {
  let url = req.body.url;
  dnsLookup(url, (err, address, family) => {
    if (err && !address) {
      res.json({
        "error": "invalid URL"
      });
    }
  });
  
  let newUrl = new Url({
    original_url: url,
    id: uuidv4()
  });
  
  newUrl.save()
    .then((data) => res.json({
      "original_url": data.original_url,
      "short_url": data.id
    }))
    .catch((err) => res.json({
      "error":"failed to save"
    }));
});

// your first API endpoint... 
app.get("/api/shorturl/:new", function (req, res) {
  let shortUrl = req.params.new;
  Url.findOne({id: shortUrl})
    .then((data) => res.redirect(data.original_url))
    .catch((error) => console.error("an error happened"))
});


app.listen(port, function () {
  console.log('Node.js listening ...');
});