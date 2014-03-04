'use strict';

var path = require('path')
  , _ = require('underscore')

  , PollWatcher = require('.' + path.sep + path.join('lib', 'poll'))

  , sections = require('.' + path.sep + path.join('data', 'section-list'))
  , depts = require('.' + path.sep + path.join('data', 'departments'));

var classes = []
  , prev = {};

_.each(depts, function(dept) {
  classes = _.union(classes, dept.courses.map(function(course) {
    return {
      department: dept.abbreviation,
      course: course.course,
      classId: dept.abbreviation + ' ' + course.course
    };
  }));
});

console.log(classes);

// var daemon = new PollWatcher();
// attach all listeners
// run _loop once to initialise
// attach hooks
// run .start()
