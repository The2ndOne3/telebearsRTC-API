var path = require('path')

  , _ = require('underscore')
  , q = require('q')

  // , get = require(path.join(__dirname, 'get'));

var count = 0;
var get = {
  enrollment: function(ccn, callback) {
    count++;

    if (count > 4) {
      return callback(null, 
      {
        ccn: '557',
        enroll: 2,
        enrollLimit: 10,
        waitlist: 0,
        waitlistLimit: 10
      });
    }

    callback(null, 
      {
        ccn: '557',
        enroll: 0,
        enrollLimit: 10,
        waitlist: 0,
        waitlistLimit: 10
      });
  }
};

process.on('message', function(m) {
  if (m.name == 'watch' && !_.has(sections, m.message)) {
    console.log('[DEBUG] Received watch assignment from parent', m.message);
    sections[m.message] = {};
  }
});

var sections = {}
  , lock = false;

var poll = function() {
  if (lock) {
    return;
  }
  lock = true;

  // Fire all requests.
  q.all(_.keys(sections).map(function(ccn) {
    var d = q.defer();

    get.enrollment(ccn, function(err, result) {
      if (err) {
        console.error('[ERROR] Could not load enrollment for', ccn, err);
        d.resolve(sections[ccn]);
      }

      result.ccn = ccn;
      d.resolve(result);
    });

    return d.promise;
  }))
  // Compute diffs.
  .then(function(results) {
    console.log('[DEBUG] Results', results);
    console.log('[DEBUG] Previous', sections);
    console.log('---');
    var diffs = [];

    _.each(results, function(result) {
      var prev = sections[result.ccn];
      if (prev.enroll === undefined || prev.waitlist === undefined) {
        sections[result.ccn] = result;
        return;
      }
      if (prev.enroll != result.enroll ||
          prev.enrollLimit != result.enrollLimit ||
          prev.waitlist != result.waitlist ||
          prev.waitlistLimit != result.waitlistLimit) {
        prev.enroll = result.enroll;
        prev.waitlist = result.waitlist;
        diffs.push(result);
      }
    });

    return diffs;
  })
  // Alert parent.
  .then(function(diffs) {
    console.log('[DEBUG] Diffs', diffs);
    if (diffs.length > 0) {
      _.each(diffs, function(diff) {
        process.send({
          name: 'change',
          message: diff
        });
      });
    }
    lock = false;
  }).done();
};

setInterval(poll, 1 * 1000);