var fs = require('fs')
  , path = require('path')

  , _ = require('underscore')

  , cheerio = require('cheerio')
  , request = require('request')

  , config = process.env
  , term = config.TERM
  , termYear = config.TERMYEAR
  , app_id = config.APP_ID
  , app_key = config.APP_KEY

  , departments = require(path.join('..', 'data', 'departments'));

_.each(departments, function(dept) {
  // This gives us a 500, because the API hates people.
  if (dept.abbreviation == 'AST' ||
      dept.abbreviation == 'JOURN') {
    return;
  }

  // You need to encode the ampersands, but not the pluses, because why would an api ever need to be consistent?
  var url = 'https://apis-dev.berkeley.edu/cxf/asws/classoffering?departmentCode=' +
    dept.abbreviation.replace(/\s/g, '+').replace('&', '%26') + '&term=' +
    term + '&termYear=' + termYear + '&_type=json&app_id=' + 
    app_id + '&app_key=' + app_key;

  request(url, function(err, res, body) {
    if (err) {
      return console.error(err, url);
    }
    if (body == 'Authentication failed') {
      return console.error('Error (Auth failed):', url);
    }

    console.log('Department:', dept.abbreviation);
    var data = JSON.parse(body);
    console.log('Parsed.');

    dept.courses = data.ClassOffering.map(function(element) {
      var course = {
        number: '' + element.courseNumber,
        title: element.courseTitle,
      };
      course.classId = [dept.abbreviation, course.number].join(' ');
      return course;
    });

    save();
  });
});

// We skipped the 2 broken departments that give us empty 500s.
var save = _.after(departments.length - 2, function() {
  fs.writeFile(path.join(__dirname, '..', 'data', 'departments-parsed.json'), JSON.stringify(departments, null, '  '), {encoding: 'utf8'}, function(err) {
    if(err){
      console.log('FS error:', err);
    }
    console.log('Course names saved.');
    process.exit();
  });
});
