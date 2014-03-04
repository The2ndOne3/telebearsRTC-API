var fs = require('fs')
  , path = require('path')

  , _ = require('underscore')
  , q = require('q')

  , get = require('.' + path.sep + 'get')
  , departments = require(path.join('..', 'data', 'departments-parsed'));

var load_sections = function(dept, course, d) {
  get.sections(dept.abbreviation, course.number, function(err, result) {
    count++;
    if (err) {
      console.error('[ERROR] CLASS:', dept.abbreviation, course.number, err);
      console.error('TRYING AGAIN...');
      return load_sections(dept, course, d);
    }

    if (count % 100 === 0) {
      console.log(count + ' sections loaded.');
    }

    course.sections = result;
    d.resolve(course);
  });
};

var promises = [], count = 0;
_.each(departments, function(dept) {
  _.each(dept.courses, function(course) {
    var d = q.defer();

    load_sections(dept, course, d);

    promises.push(d.promise);
  });
});

q.allSettled(promises).then(function() {
  console.log('Done loading courses.');
  fs.writeFile(path.join(__dirname, '..', 'data', 'sections.json'),
    JSON.stringify(departments, null, '  '),
    {encoding: 'utf8'},
    function(err) {
      if(err){
        console.error('FS error:', err);
      }
      console.log('Done saving courses.');
      process.exit();
    });
}).done();
