var cheerio = require('cheerio')
  , request = require('request')

  , _ = require('underscore')

  , config = process.env
  , semester = config.SEMESTER
  , year = config.YEAR
  , app_id = config.APP_ID
  , app_key = config.APP_KEY;

/**
 * Loads the course list.
 * @param  {Function} callback A callback given (err, result) where result is an array of departments
 */
var load_course_list = function(callback) {
  var url = 'http://osoc.berkeley.edu/OSOC/osoc?p_term=' + semester + '&p_list_all=Y'
    , result = []
    , deptData = {}
    , gotAbb = false
    , initialized = false;

  // This scrapes everything from that big scary page of everything.
  request.get(url, function(err, res, body) {
    if(err || res.statusCode != 200) {
      return callback(err, null);
    }

    console.log('Request to berkeley successful');

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

    // This gets the actual department names from the API.
    var count = 0;
    _.each(result, function(dept) {
      var url = 'https://apis-dev.berkeley.edu/cxf/asws/department?departmentCode=' +
        dept.abbreviation+'&_type=json&app_id=' + app_id + '&app_key=' + app_key;

      request(url, function(err, response, body) {
        if (err || res.statusCode != 200) {
          return callback(err, null);
        }
        dept.name = JSON.parse(body).CanonicalDepartment[0].departmentName;
        count++;
        console.log('Loading department', count);
      });
    });

    var done = _.after(result.length, function() {
      callback(null, result);
    });
  });
};

/**
 * Grab a list of sections.
 * @param  {String}   id       The department abbreviation
 * @param  {String}   course   The course number
 * @param  {Function} callback A callback given (err, result), where result is an array of section objects
 */
var load_section_list = function(id, course, callback) {
  var courses = []
    , url = 'http://osoc.berkeley.edu/OSOC/osoc?p_term=' + semester + '&p_course=' + course + '&p_dept=' + id;

  request.get(url, function(err, res, body) {
    if (err || res.statusCode != 200) {
      return callback(err, null);
    }

    var $ = cheerio.load(body)
      , end = $('table').length - 1;

    $('table').slice(1,end).each(function() {
      var section = $(this).find('tr:nth-of-type(1) td:nth-of-type(3)').text().trim()
        , space = section.lastIndexOf(' ');
      for (var i = 0; i < 2; i++) {
        space = section.lastIndexOf(' ', space-1);
      }
      var section_id = section.substring(space+1)
        , section_index = section.indexOf(course.toUpperCase());
      if (section.charAt(section_index-1) == ' ' && section.charAt(section_index+course.length) == ' ') {
        var restrictions = $(this).find('tr:nth-of-type(8) td:nth-of-type(2)').text()
          , location = $(this).find('tr:nth-of-type(2) td:nth-of-type(2)').text();
        if (location != 'CANCELLED' && restrictions != 'CURRENTLY NOT OPEN') {
          var locationArray = location.split(', ');
          courses.push({
            id: section_id,
            instructor: $(this).find('tr:nth-of-type(3) td:nth-of-type(2)').text(),
            time: locationArray[0],
            location: locationArray[1],
            ccn: $(this).find('input[name="_InField2"]').val()
          });
        }
      }
    });

    callback(null, courses);
  });
};

/**
 * Grab live enrollment data for a section.
 * @param  {String}   ccn      The section CCN.
 * @param  {Function} callback A callback given (err, result) where result is a section data object
 */
var load_enrollment_data = function(ccn, callback) {
  request.post('https://telebears.berkeley.edu/enrollment-osoc/osc',
    {
      form: {
        _InField1:'RESTRIC',
        _InField2: ccn,
        _InField3: year
      }
    },
    function(err, res, body) {
      if (err || res.statusCode != 200) {
        return callback(err, null);
      }
      var $ = cheerio.load(body)
        , raw_text = $('blockquote:first-of-type div.layout-div').text();
      raw_text = raw_text.replace(/(\r\n|\n|\r)/gm,'')
        .replace(/\s+/g,' ')
        .substring(1);
      var data_array = raw_text.split(' ');
      var enrollData = {
        ccn: parseInt(ccn,10),
        enroll: parseInt(data_array[0],10),
        enrollLimit: parseInt(data_array[8],10),
        waitlist: data_array[21]? parseInt(data_array[10],10) : null,
        waitlistLimit: data_array[21]? parseInt(data_array[21]) : null
      };
      
      callback(null, enrollData);
  });
};

module.exports = {
  courses: load_course_list,
  sections: load_section_list,
  enrollment: load_enrollment_data
};