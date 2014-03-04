var fs = require('fs')
  , path = require('path')

  , _ = require('underscore')
  , q = require('q')

  , get = require('.' + path.sep + 'get')
  , departments = require(path.join('..', 'data', 'sections'));

// Build section UIDs and enrollment.
var progress = 0, output = [];
_.each(departments, function(dept) {
  _.each(dept.courses, function(course) {
    _.each(course.sections, function(section) {
      section.classId = [dept.abbreviation, course.number].join(' ');
      output.push(section);
    });
  });
});

fs.writeFile(path.join(__dirname, '..', 'data', 'section-list.json'), JSON.stringify(output, null, '  '), function(err) {
  if (err) {
    return console.log('FS error:', err);
  }
  console.log('Section list saved.');
  process.exit();
});
