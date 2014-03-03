var fs = require('fs')
  , path = require('path')

  , cheerio = require('cheerio')
  , request = require('request')

  , config = require(path.join('..', 'config'))
  , term = config.semester

  , departments = require(path.join('..', 'data', 'departments'));

var itr = 0;
for(var i = 0; i < departments.length; i++) {
  // This gives us a 500, because the API hates people.
  if (departments[i].abbreviation == 'AST' ||
      departments[i].abbreviation == 'JOURN') {
    continue;
  }

  var url = 'https://apis-dev.berkeley.edu/cxf/asws/classoffering?departmentCode=' +
    // encodeURIComponent(department.abbreviation.replace(/\s/g, '+')) + '&term=' +
    // YOU NEED TO ENCODE THE AMPERSANDS, BUT NOT THE PLUSES
    // BECAUSE WHY WOULD AN API EVER NEED TO BE CONSISTENT?
    departments[i].abbreviation.replace(/\s/g, '+').replace('&', '%26') + '&term=' +
    config.term + '&termYear=' + config.termYear + '&_type=json&app_id=' + 
    config.app_id + '&app_key=' + config.app_key;

  (function(){
    // Async trick.
    var index = i;
    request(url, function(err, res, body) {
  
      if (err) {
        return console.error(err);
      }
      console.log('url:', res.req.path);
      JSON.parse(body);
      console.log('parsed.');
  
      departments[index].courses = JSON.parse(body).ClassOffering.map(function(element) {
        return {
          number: '' + element.courseNumber,
          title: element.courseTitle
        };
      });
      itr++;
  
      // The 2 we skipped.
      if (itr == departments.length - 2) {
        fs.writeFile(path.join('..', 'data', 'departments-2.json'), JSON.stringify(departments, null, '  '), {encoding: 'utf8'}, function(err) {
          console.log('course names saved');
          if(err){
            console.log('FS error:', err);
          }
          process.exit();
        });
      }
    });
  })();
}