var fs = require('fs')
  , path = require('path')

  , _ = require('underscore')

  , get = require('.' + path.sep + 'get')
  , departments = require(path.join('..', 'data', 'departments-named'));

var count = 0;
_.each(departments, function(dept) {
  _.each(dept.courses, function(course) {
    get.sections(dept.abbreviation, course.number, function(err, result) {
      course.sections = result;
      count++;
      console.log('Department', count, 'completed.');
      save();
    });
  });
});

var save = _.after(departments.length, function() {
  console.log('Done loading courses.');
  fs.writeFile(path.join(__dirname, '..', 'data', 'sections.json'), JSON.stringify(departments, null, '  '), {encoding: 'utf8'}, function(err) {
    if(err){
      console.log('FS error:', err);
    }
    console.log('Done saving courses.');
    process.exit();
  });
});
