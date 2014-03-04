
/*
 * GET listing of all courses from schedule.berkeley.edu
 */

var fs = require('fs')
  , path = require('path')

  , cheerio = require('cheerio')
  , request = require('request')

  , config = process.env
  , term = config.SEMESTER
  , app_id = config.APP_ID
  , app_key = config.APP_KEY;

var url = 'http://osoc.berkeley.edu/OSOC/osoc?p_term=' + term + '&p_list_all=Y'
  , result = []
  , deptData = {}
  , gotAbb = false
  , initialized = false;

request.get(url, function(error, resp, body) {
  // This scrapes everything from that big scary page of everything.
  if(!error && resp.statusCode == 200) {
    console.log('request to berkeley successful');
    var $ = cheerio.load(body);
    var length = $('table table tr').length;
    $('table table tr').slice(1).each(function(index) {
      var department = $(this).find('td[colspan="3"]');
      if(department.length > 0) {
        if(initialized) {
          result.push(deptData);
        }
        gotAbb = false;
        deptData = {};
        deptData.courses = [];
        deptData.name = department.text();
        initialized = true;
      }
      else if(index == length - 2) {
        result.push(deptData);
      }
      else {
        var course = {};

        if(!gotAbb) {
          deptData.abbreviation = $(this).find('td:nth-of-type(1)').text();
          gotAbb = true;
        }

        course.course = $(this).find('td:nth-of-type(2)').text().trim();
        if(course.course != '999') {
          course.title = $(this).find('td:nth-of-type(3)').text();
          deptData.courses.push(course);
        }
      }
    });

    var count = 0, total = [];

    // This gets the actual department names from the API.
    for(var i = 0; i < result.length; i++) {
      var url = 'https://apis-dev.berkeley.edu/cxf/asws/department?departmentCode='+result[i].abbreviation+'&_type=json&app_id=' + app_id + '&app_key=' + app_key;

      // DON'T TOUCH.
      // Yes it looks stupid, but you will break things otherwise because asynchronous and reasons.
      function getDepartmentName() {
        var index = i;

        request(url, function(error, response, body) {
          if(!error && response.statusCode == 200) {
            result[index].name = JSON.parse(body).CanonicalDepartment[0].departmentName;
            total.push(result[index]);
            count++;
            console.log('Loading department', count);
            if(count == result.length) {
              // Save stuff in here, because Larry has never heard of promises.
              console.log('Done loading courses');
              fs.writeFile(path.join(__dirname, '..', 'data', 'departments.json'), JSON.stringify(total, null, '  '), {encoding: 'utf8'}, function(err) {
                if(err){
                  console.log('FS error:', err);
                }
                console.log('Done saving courses');
                process.exit();
              });
            }
          }
          else
            console.log(error);
        });
      }

      getDepartmentName();
    }
  }
  else
    console.log('Error: ' + error);
});
