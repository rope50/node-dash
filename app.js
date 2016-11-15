/**
*  Node Dash
*  Developed By Rodrigo Urbina
*  rodrigo.urbina.e@gmail.com
*
**/
var express   = require('express');
var NodeDash  = require('./node-dash');
// configure Express App

var app = express();

app.set('views', __dirname + '/views');
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('json spaces', 0);
app.engine('ejs', require('ejs-locals'));

NodeDash(app);

app.get('/test', function (req, res) {
  res.send('Hello World!');
});

app.get('/',function(req, res){
  var videoId = req.params.videoId
  res.render('index', { videoId: videoId});  
});



app.listen(3000, function () {
  console.log('Node-dash app running on port 3000!');
});