'use strict';

var Poller = require('./lib/poll');

var daemon = new Poller();

// attach all listeners
// run _loop once to initialise
// attach hooks
// run .start()
