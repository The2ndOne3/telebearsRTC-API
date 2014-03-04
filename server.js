'use strict';

var path = require('path')
  , url = require('url')

  , Child = require('intercom').EventChild

  , restify = require('restify')
  , bunyan = require('bunyan')

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
  , enrollment_monitor = new Child('.' + path.sep + path.join('src', 'poll-enrollment'))
  , section_monitor = new Child('.' + path.sep + path.join('src', 'poll-sections'));

server.get('/poll/:key/:ccn', function(req, res, next) {
  // if (!totp.verify(req.params.key)) {
  //   return res.send(403);
  // }

  console.log('[DEBUG] Assigning child to watch', req.params.ccn);
  enrollment_monitor.emit('watch', req.params.ccn);

  res.send(200, {
    success: true
  });
});

enrollment_monitor.on('change', function(ccn, enrollment, waitlist) {
  console.log('[DEBUG] Enrollment change detected for', ccn);

  var url = url.resolve(app_url, totp.now());
  url = url.resolve(url, [
    ccn,
    enrollment.current,
    enrollment.limit,
    waitlist.current,
    waitlist.limit
  ].join(':'));

  request.post(url, function(err, res, body) {
    if (err) {
      console.error('[ERROR] API connection error', url, err);
    }
  });
});

enrollment_monitor.on('stdout', function(txt) {
  console.log(txt);
});

server.listen(port || 2713);
console.log('Server listening on port', port || 2713);