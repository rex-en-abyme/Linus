var url = require('url');
var http = require('http');
var express = require('express');
var getPixels = require('get-pixels');
var router = express.Router();

router.get('/', function(req, res) {
  var urlWithImage = (req.originalUrl).split('?')[1];
  getPixels(urlWithImage, function(err, pixels) {
    if(err) {
      return console.log(err);
    }
    var img_shape = pixels.shape;
    var img_data = pixels.data;
    res.send(JSON.stringify({
      h: img_shape[0],
      w: img_shape[1],
      arr: img_data
    }));
    res.end();
  });
});

module.exports = router;
