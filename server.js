'use strict';

var path = require('path')
  , url = require('url')
  , fork = require('child_process').fork

  , restify = require('restify')
  , bunyan = require('bunyan')

  , _ = require('underscore')
  , TOTP = require('onceler').TOTP
  , request = require('request')

  , config = process.env
  , port = config.PORT
  , key = config.SECRET
  , app_url = config.TARGET;

var server = restify.createServer({
  name: 'telebears-rtc-api',
  bunyan: bunyan.createLogger({name: 'telebears-rtc-api'})
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser());
server.use(restify.jsonp());
server.use(restify.requestLogger());
server.use(restify.gzipResponse());

server.on('after', restify.auditLogger({
  log: bunyan.createLogger({
    name: 'audit',
    stream: process.stdout
  })
}));

var totp = new TOTP(key)
  , enrollment_monitor = fork(path.join(__dirname, 'src', 'poll-enrollment'), {
    cwd: path.join(__dirname, 'src'),
    env: process.env
  });

server.get('/poll/:key/:ccn', function(req, res, next) {
  // if (!totp.verify(req.params.key)) {
  //   return res.send(403);
  // }

  console.log('[DEBUG] Assigning child to watch', req.params.ccn);
  enrollment_monitor.send({
    name: 'watch',
    message: req.params.ccn
  });

  res.send(200, {
    success: true
  });
});

enrollment_monitor.on('message', function(m) {
  if (m.name == 'change') {
    console.log('[DEBUG] Received diff', m.message);
    var request_url = path.join(app_url, '' + totp.now(), _.values(m.message).join('/'));
    request(request_url, function(err, res, body) {
      if (err) {
        return console.error('[ERROR] API connection error to', request_url, err);
      }
      console.log(_.values(m.message));
    });
  }
});

server.listen(port || 2713);
console.log('Server listening on port', port || 2713);