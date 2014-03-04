var fs = require('fs')
  , path = require('path')

  , config = require(path.join('..', 'config'))
  , departments = require(path.join('..', 'data', 'sections'));

var output = [];

// Build section UIDs.
for (var i = 0; i < departments.length; i++) {
  var dept = departments[i];
  for (var j = 0; j < dept.courses.length; j++) {
    var course = dept.courses[j];
    if (course.sections) {
      for (var k = 0; k < course.sections.length; k++) {
        var section = course.sections[k];
        
        output.push({
          uid: dept.abbreviation + ' ' + course.number,
          ccn: section.ccn
        });
      }
    }
  }
}

fs.writeFile(path.join(__dirname, '..', 'data', 'section-list.json'), JSON.stringify(output, null, '  '), function(err) {
  if (err) {
    return console.log('FS error:', err);
  }
  console.log('Saving completed.');
});

