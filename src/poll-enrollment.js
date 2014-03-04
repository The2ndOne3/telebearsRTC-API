var path = require('path')

  , _ = require('underscore')
  , q = require('q')

  , get = require(path.join('..', 'lib', 'get'));

var sections = {};

process.parent.on('watch', function(ccn) {
  sections[ccn] = {};
  process.parent.emit('change');
  console.log('[DEBUG] Watching', ccn);
});

while (true) {
  // Fire all requests.
  q.all(_.keys(sections).map(function(section, ccn) {
    var d = q.defer();

    get.enrollment(ccn, function(err, result) {
      if (err) {
        console.error('[ERROR] Could not load enrollment for', ccn, err);
        q.resolve(section);
      }

      q.resolve({
        ccn: ccn,
        enrollment: {
          current: result.enroll,
          limit: result.enrollLimit,
        },
        waitlist: {
          current: result.waitlist,
          limit: result.waitlistLimit,
        }
      });
    });

    return d.promise;
  }))
  // Compute diffs.
  .then(function(results) {
    var diffs = [];

    _.each(results, function(result) {
      var prev = sections[result.ccn];
      if (prev.enrollment === undefined || prev.waitlist === undefined) {
        return;
      }
      if (prev.enrollment.current != result.enrollment.current ||
          prev.enrollment.limit != result.enrollment.limit ||
          prev.waitlist.current != result.waitlist.current ||
          prev.waitlist.limit != result.waitlist.limit) {
        prev.enrollment = result.enrollment;
        prev.waitlist = result.waitlist;
        diffs.push(result);
      }
    });

    return diffs;
  })
  // Alert parent.
  .then(function(diffs) {
    if (diffs.length > 0) {
      _.each(diffs, function(diff) {
        process.parent.emit('change',
          diff.ccn,
          diff.enrollment,
          diff.waitlist
        );
      });
    }
  }).done();
}