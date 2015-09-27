var url = require('url');
var http = require('http');
var express = require('express');
var request = require('request');
var config = require('../config');
var querystring = require('querystring');
var router = express.Router();

var redirect_uri = 'http://localhost:3000/';

router.get('/', function(req, res, next) {
  if(req.query.code === undefined) {

    var url = 'https://api.instagram.com/oauth/authorize?'
      +querystring.stringify({ 'client_id' : config.client_id })
      +'&'
      +querystring.stringify({ 'redirect_uri' : redirect_uri })
      +'&'
      +'response_type=code&state=a%20state&scope=likes';
    res.redirect(url);

  } else {
    request({
      url: 'https://api.instagram.com/oauth/access_token',
      method: 'POST',
      form: {
        'client_id' : config.client_id,
        'client_secret' : config.client_secret,
        'grant_type' : 'authorization_code',
        'redirect_uri' : redirect_uri,
        'code' : req.query.code
      }
    }, function(error, outerResponse, body) {
      if(error) {
        console.log(error);
      } else {
        var responseContents = JSON.parse(body),
            access_token = responseContents.access_token;

        var url_liked_media =
          'https://api.instagram.com/v1/users/self/media/liked?' +
          querystring.stringify({
            'access_token' : access_token
          });

        request(url_liked_media, function(error, innerResponse, body) {
          if(error) console.log(error);
          var content = JSON.parse(body),
              medias = content.data,
              instagramsObj = {};
          for(var i=0; i<medias.length; i++) {
            var id = medias[i].id,
                tags = medias[i].tags,
                link = medias[i].link,
                images = medias[i].images;
            instagramsObj[id] = {
              tags: tags,
              link: link,
              images: images
            };
          }
          res.render('index', {
            access_token: outerResponse.access_token,
            instagramsObj: instagramsObj
          });
        });
      }
    });
  }
});

module.exports = router;
