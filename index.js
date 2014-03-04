'use strict';

var path = require('path')
  , _ = require('underscore')

  , PollWatcher = require('.' + path.sep + path.join('lib', 'poll'))

  , sections = require(path.join('..', 'data', 'section-list'))
  , depts = require(path.join('..', 'data', 'departments'));

var classes = [];

var daemon = new PollWatcher();
// attach all listeners
// run _loop once to initialise
// attach hooks
// run .start()
