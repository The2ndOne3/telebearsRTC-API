var fs = require('fs')
  , path = require('path')
  , _ = require('underscore')

  , departments = require(path.join('..', 'data', 'sections'));

var output = [];

// Build section UIDs.
_.each(departments, function(dept) {
  _.each(dept.courses, function(course) {
    _.each(course.sections, function(section) {
      output.push({
        uid: [dept.abbreviation, course.number].join(' '),
        ccn: section.ccn
      });
    });
  });
});

fs.writeFile(path.join(__dirname, '..', 'data', 'section-list.json'), JSON.stringify(output, null, '  '), function(err) {
  if (err) {
    return console.log('FS error:', err);
  }
  console.log('Section list saved.');
});

