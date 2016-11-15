/**
* NodeDash module
* @Param {String}  app Express app instance.
**/
var NodeDash = function(app){
  
  /**
  * Get MPD manifest of a youtube video.
  * @Param {String}  url
  * @Param {Integer} start
  * @Param {Integer} end
  **/
  app.get("/dash/youtube/mpd/:videoId", function(req, res){
    var https = require('https');
    var http = require('http');
    var request = require('request');
    var xml2js = require('xml2js');

    var videoURLs = [];

    //var req = https.get("https://www.youtube.com/watch?v="+req.params.videoId, function(response) {
    var req = https.get("https://www.youtube.com/get_video_info?video_id="+req.params.videoId, function(response) {
      if(response.statusCode !== 200)
        res.json({error: 'Unknown Video ID'})
      else{
        var bodyChunks = [];
        response.on('data', function(chunk) {
          bodyChunks.push(chunk);
        }).on('end', function() {
          var body = ""+Buffer.concat(bodyChunks);
          var manifestURL =  body.split('"dashmpd"')[1].split('"')[1].split('\\').join('');
          //console.log('ManigestURL', manifestURL);
          console.log('ManifestURL', body);
          console.log('DECODING',decodeURIComponent( body) );
          https.get(manifestURL, function(response) {
            if(response.statusCode !== 200)
              res.json({error: 'Unknowed Video ID'});
            else{
              var bodyChunks = [];
              response.on('data', function(chunk) {
                bodyChunks.push(chunk);
              }).on('end', function() {
                var body = ""+Buffer.concat(bodyChunks);

                xml2js.parseString(body, function(err,result){
                  var sets = result.MPD.Period[0].AdaptationSet;
                  for(var i in sets){
                    //console.log('ADAPTATION_SET: ',sets[i])
                    if(sets[i].Representation){
                      var reps = sets[i].Representation;
                      for(var j in reps){
                        //TRANSFORM URL: REPLACE & BY ** 
                        reps[j].BaseURL[0]._ = '/dash/proxy/get_resource?url='+reps[j].BaseURL[0]._.split('&').join('**');
                        videoURLs.push(reps[j]);
                      }
                    }
                  }
                  var builder = new xml2js.Builder();
                  var finalXML = builder.buildObject(result);

                  res.set('Content-Type', 'application/dash+xml');
                  res.send(finalXML);

                });
             });
            }
          });
        });
      }
    });
  });

  /**
  * Get url of media resources.
  * @Param {String}  videoId
  **/
  app.get("/dash/youtube/data/:videoId", function(req, res){
    var https = require('https');
    var http = require('http');
    var request = require('request');
    var xml2js = require('xml2js');

    var videoURLs = [];

    console.log('Buscando video: ', req.params.videoId);

    https.get("https://www.youtube.com/get_video_info?video_id="+req.params.videoId, function(response) {
      if(response.statusCode !== 200)
        res.json({error: 'Unknowed Video ID'})
      else{
        var bodyChunks = [];
        response.on('data', function(chunk) {
          bodyChunks.push(chunk);
        }).on('end', function() {
          var body = ""+Buffer.concat(bodyChunks);
          split_body = body.split('&');
          var manifestURL = '';
          try{
            for (var i = 0; i < split_body.length; i++) {
              var pair = split_body[i].split('=');
              if(decodeURIComponent(pair[0]) == 'dashmpd'){
                manifestURL =  decodeURIComponent(pair[1]);
                console.log ("MPD",manifestURL);
              }
            }
          }catch(err){
            console.log('Retrying MPD URL:', req.url, err);

            res.redirect(req.url);
            return;
          }
          //GET MPD XML MANIFEST
          https.get(manifestURL, function(response) {
            if(response.statusCode !== 200)
              res.json({error: 'Unknowed Video ID'});
            else{
              var bodyChunks = [];
              response.on('data', function(chunk) {
                bodyChunks.push(chunk);
              }).on('end', function() {
                var body = ""+Buffer.concat(bodyChunks);
                //XML PARSING TO JSON
                xml2js.parseString(body, function(err,result){
                  var sets = result.MPD.Period[0].AdaptationSet;
                  for(var i in sets){
                    //console.log('ADAPTATION_SET: ',sets[i])
                    if(sets[i].Representation){
                      var reps = sets[i].Representation;
                      for(var j in reps){
                        //TRANSFORM URL: REPLACE & BY ** 
                        reps[j].BaseURL[0]._ = '/dash/proxy/get_resource?url='+reps[j].BaseURL[0]._.split('&').join('**');
                        reps[j].mimeType = sets[i].$.mimeType;
                        videoURLs.push(reps[j]);
                      }
                    }
                  }
                  res.json(videoURLs);
                });
             });
            }
          });
        });
      }
    });
  });


  /**
  * Get chunks of a resource using a proxy to skip Access-Control problem.
  * @Param {String}  url
  * @Param {Integer} start
  * @Param {Integer} end
  **/
  app.get('/dash/proxy/get_resource/:start?/:end?', function(req, res){
    //console.log('Dash step range:', req.headers.range);
    var request = require('request');
    var url = req.query.url;    //INVERSE TRANSFORM URL: REPLACE ** BY &
    url = url.split('**').join('&');    
    //Capture the Request and  re-request to the server
    req.pipe(request(url)).pipe(res);
  });
	
  /**
  * Get headers of a resource using a proxy to skip Access-Control problem.
  * @Param {String}  url
  **/
  app.head('/dash/proxy/get_resource', function(req, res){
    var request = require('request');
    var url = req.query.url;    //INVERSE TRANSFORM URL: REPLACE ** BY &
    url = url.split('**').join('&');    
    req.pipe(request(url)).pipe(res);
  });

}

module.exports = NodeDash;