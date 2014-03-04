var fs = require('fs')
  , path = require('path')

  , _ = require('underscore')
  , q = require('q')

  , get = require('.' + path.sep + 'get')
  , departments = require(path.join('..', 'data', 'sections'));

var output = [];

// Build section UIDs and enrollment.
var progress = 0;
_.each(departments, function(dept) {
  _.each(dept.courses, function(course) {
    _.each(course.sections, function(section) {
      var defer = q.defer();

      get.enrollment(section.ccn, function(err, result) {
        progress++;
        if (progress % 100 === 0) {
          console.log(progress + ' sections loaded.');
        }

        section.classId = [dept.abbreviation, course.number].join(' ');

        if (err) {
          console.error('[ERROR] COURSE:', dept.abbreviation, course.number, err);

          section.enrollment = {
            current: 0,
            limit: 0
          };
          section.waitlist = {
            current: 0,
            limit: 0
          };

          return defer.resolve(section);
        }

        section.enrollment = {
          current: result.enroll,
          limit: result.enrollLimit,
        };
        section.waitlist = {
          current: result.waitlist,
          limit: result.waitlistLimit,
        };

        return defer.resolve(section);
      });

      output.push(defer.promise);
    });
  });
});

q.allSettled(output).then(function(sections) {
  sections = sections.map(function(section) {
    return section.value;
  });

  fs.writeFile(path.join(__dirname, '..', 'data', 'section-list.json'), JSON.stringify(sections, null, '  '), function(err) {
    if (err) {
      return console.log('FS error:', err);
    }
    console.log('Section list saved.');
    process.exit();
  });
}).done();

