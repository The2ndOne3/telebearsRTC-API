var fs = require('fs')
  , path = require('path')

  , _ = require('underscore')
  , q = require('q')

  , get = require('.' + path.sep + 'get')
  , departments = require(path.join('..', 'data', 'sections'));

var output = [];

var load_enrollment = function(dept, course, section, d) {
  get.enrollment(section.ccn, function(err, result) {
    progress++;
    if (progress % 100 === 0) {
      console.log(progress + ' sections loaded.');
    }

    section.classId = [dept.abbreviation, course.number].join(' ');

    if (err) {
      console.error('[ERROR] COURSE:', dept.abbreviation, course.number, err);
      console.error('TRYING AGAIN...');
      progress--;
      return _.delay(load_enrollment, 500, dept, course, d);
    }

    section.enrollment = {
      current: result.enroll,
      limit: result.enrollLimit,
    };
    section.waitlist = {
      current: result.waitlist,
      limit: result.waitlistLimit,
    };

    d.resolve(section);
  });
};

// Build section UIDs and enrollment.
var progress = 0;
_.each(departments, function(dept) {
  _.each(dept.courses, function(course) {
    _.each(course.sections, function(section) {
      var d = q.defer();

      load_enrollment(dept, course, section, d);

      output.push(d.promise);
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

