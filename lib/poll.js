'use strict';

// Module dependencies.
var _ = require('underscore')
  , q = require('q');

// THIS SHOULD ONLY BE ON IN DEV
q.longStackSupport = process.env.NODE_ENV != 'production';

// Construct a polling watcher.
var PollWatcher = function() {
  this.channels = {};
  this.global_hooks = [];
  this.started = false;
  this.prev = [];
};

// Add a target to a channel to watch, and provide a method to reach that target.
PollWatcher.prototype.watch = function(channel, request) {
  if (!_.has(this.channels, channel)) {
    this.channels[channel] = {
      requests: [],
      hooks: []
    };
  }
  this.channels[channel].requests.push(request);
};

// Subscribe a hook to a channel.
PollWatcher.prototype.subscribe = function(channel, hook) {
  if (!_.has(this.channels, channel)) {
    this.channels[channel] = {
      requests: [],
      hooks: []
    };
  }
  this.channels[channel].hooks.push(hook);
};

// Subscribe a hook to all channels, programmatically passing it the channel name.
PollWatcher.prototype.subscribeAll = function(hook) {
  this.global_hooks.push(hook);
};

// Start watching.
PollWatcher.prototype.start = function() {
  this.started = true;
  this._loop();
};

// The polling loop.
PollWatcher.prototype._loop = function(n) {
  var self = this;

  if (n === undefined) {
    n = 1;
  }

  // For all channels:
  return q.all(_.keys(self.channels).map(function(channel) {
    // Fire all requests.
    return q.all(self.channels[channel].requests.map(function(request) {
      return q.nfcall(request);
    }))
    // Then process for diffs.
    .then(function(results) {
      // console.log('results:', results);
      var diff = [];
      _.each(results, function(element, i) {
        // console.log('checking:', self.prev[i], JSON.stringify(element), element);
        if (self.prev[i] === undefined || JSON.stringify(element) !== self.prev[i]) {
          diff.push(element);
          self.prev[i] = JSON.stringify(element);
        }
      });
      return diff;
    })
    // Then fire all hooks.
    .then(function(diffs) {
      // console.log('prev:', self.prev);
      // console.log('diffs:', diffs);
      self.channels[channel].hooks.map(function(hook) {
        hook(diffs);
      });
      return diffs;
    })
    // Then fire all global hooks.
    .then(function(diffs) {
      self.global_hooks.map(function(hook) {
        hook(channel, diffs);
      });
    });
  }))
  // Then loop again.
  .then(function(result) {
    // console.log('---');
    if (self.started) {
      return self._loop();
    } else if (n > 1) {
      return self._loop(n - 1);
    }
    return self;
  }).done();
};

module.exports = PollWatcher;