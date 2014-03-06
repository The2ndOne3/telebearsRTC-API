'use strict';

var path = require('path')
  , url = require('url')
  , fork = require('child_process').fork

  , restify = require('restify')
  , bunyan = require('bunyan')

  , Cacheman = require('cacheman')

  , _ = require('underscore')
  , TOTP = require('onceler').TOTP
  , request = require('request')

  , config = process.env
  , port = config.PORT
  , key = config.SECRET
  , app_url = config.TARGET;

// Make server.
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

// Initialise stuff.
var totp = new TOTP(key, null, 60)
  , enrollment_monitor = fork(path.join(__dirname, 'src', 'poll-enrollment'), {
    cwd: path.join(__dirname, 'src'),
    env: process.env
  })
  , redis_url = url.parse(process.env.REDISTOGO_URL || 'redis://telebearsRTC:@127.0.0.1:6379')
  , redis_auth = redis_url.auth.split(':')
  , sections = new Cacheman('sections', {
    engine: 'redis',
    port: redis_url.port,
    host: redis_url.hostname
  });

// Send requests to child to watch.
var watch_ccn = function(ccn) {
  enrollment_monitor.send({
    name: 'watch',
    message: ccn
  });
};

// On startup, watch all previously watched sections.
sections.get('section-list', function(err, section_list) {
  if (err) {
    return console.error('[ERROR] Caching get error on init', err);
  }

  _.each(section_list, function(section) {
    watch_ccn(section);
  });
});

// Allow new requests for things to poll.
server.post('/poll/:key/:ccn', function(req, res, next) {
  if (config.NODE_ENV == 'production') {
    if (!totp.verify(req.params.key)) {
      return res.send(403);
    }
  }

  // Add to fail-resistant cache.
  sections.get('section-list', function(err, section_list) {
    if (err) {
      return console.error('[ERROR] Caching get error', err);
    }

    var new_list = section_list instanceof Array? section_list : [];
    new_list.push(req.params.ccn);

    sections.set('section-list', new_list, function(err) {
      if (err) {
        return console.error('[ERROR] Caching set error', err);
      }
    });
  });

  console.log('[DEBUG] Assigning child to watch', req.params.ccn);
  watch_ccn(req.params.ccn);

  res.send(200, {
    success: true
  });
});

// Receive diffs from child to send.
enrollment_monitor.on('message', function(m) {
  if (m.name == 'change') {
    console.log('[DEBUG] Received diff', m.message);

    var request_url = [
      app_url,
      '' + totp.now(),
      m.message.ccn,
      m.message.enroll,
      m.message.enrollLimit,
      m.message.waitlist,
      m.message.waitlistLimit
    ].join('/');

    if (m.message.init) {
      request_url += '/' + m.message.init;
    }

    request.post(request_url, function(err, res, body) {
      if (err) {
        return console.error('[ERROR] API connection error to', request_url, err);
      }
      console.log('[DEBUG] Sending', _.values(m.message));
    });
  }
});

server.listen(config.PORT);
console.log('Server listening on port', config.PORT);