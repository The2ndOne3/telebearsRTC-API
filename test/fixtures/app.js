var express = require('express')
  , jade = require('jade')

  , path = require('path');

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);
app.use(express.errorHandler());

var counter = 1;
app.get('/', function(req, res) {
  res.render('test-' + counter);
  counter++;
  if (counter > 4) {
    counter = 1;
  }
});

app.get('/test-1', function(req, res) {
  res.render('test-1');
});
app.get('/test-2', function(req, res) {
  res.render('test-2');
});
app.get('/test-3', function(req, res) {
  res.render('test-3');
});
app.get('/test-4', function(req, res) {
  res.render('test-4');
});

module.exports = app;