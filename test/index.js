/*global describe:false, it:false, before:false, beforeEach:false, after:false, afterEach:false*/

'use strict';

var http = require('http')
  , path = require('path')
  , expect = require('chai').expect
  , request = require('request')

  , PollWatcher = require(path.join('..', 'lib', 'poll'))
  , app = require('.' + path.sep + path.join('fixtures', 'app'));

describe('stubbed testing', function() {
  var watcher;

  beforeEach(function() {
    watcher = new PollWatcher();
  });

  it('should initialise and store values', function(done) {
    watcher.watch('test', function(callback) {
      callback(null, 'test-value');
    });
    watcher.watch('test-2', function(callback) {
      callback(null, 'test-value-2');
    });
    watcher.subscribe('test', function(input) {
      expect(input).to.be.an('array').and.deep.equal(['test-value']);
      done();
    });

    watcher._loop();
  });

  it('should handle channels correctly', function() {
    watcher.watch('test', function(callback) {
      callback(null, 'test-value');
    });
    watcher.watch('test-2', function(callback) {
      callback(null, 'test-value-2');
    });
    watcher.subscribe('test-2', function(input) {
      expect(input).to.be.an('array');
      expect(input).to.deep.equal(['test-value-2']);
    });

    watcher._loop();
  });

  it('should handle new values', function(done) {
    var itr = 0;
    watcher.watch('test', function(callback) {
      callback(null, 'test-value');
    });
    watcher.subscribe('test', function(input) {
      expect(input).to.be.an('array');
      itr++;
      
      if (itr == 2) {
        expect(input).to.deep.equal([]);
        watcher.watch('test', function(callback) {
          callback(null, 'test-value-2');
        });
      } else if (itr == 3) {
        expect(input).to.deep.equal(['test-value-2']);
        done();
      }
    });

    watcher._loop(3);
  });

  it('should handle changed values', function(done) {
    var itr = 0, mock = {f: function(){return 'test-value';}};
    watcher.watch('test', function(callback) {
      callback(null, mock.f());
    });
    watcher.subscribe('test', function(input) {
      expect(input).to.be.an('array');
      itr++;
      
      if (itr == 2) {
        expect(input).to.deep.equal([]);
        mock.f = function(){return 'new-test-value';};
      } else if (itr == 3) {
        expect(input).to.deep.equal(['new-test-value']);
        done();
      }
    });

    watcher._loop(3);
  });

  it('should handle no change of values', function(done) {
    var itr = 0;
    watcher.watch('test', function(callback) {
      callback(null, 'test-value');
    });
    watcher.subscribe('test', function(input) {
      expect(input).to.be.an('array');
      itr++;

      if (itr > 1) {
        expect(input).to.deep.equal([]);
      }
      if (itr == 3) {
        done();
      }
    });

    watcher._loop(3);
  });
});

describe('web testing', function() {
  var mock, watcher;

  before(function(done) {
    watcher = new PollWatcher();

    mock = http.createServer(app);
    mock.listen(app.get('port'), function() {
      console.log('Express server listening on port ' + app.get('port'));
      done();
    });
  });

  after(function(done) {
    mock.close(done);
  });

  it('should initialise and store values');

  it('should handle new values');

  it('should handle removal of values');

  it('should handle total change of values');

  it('should handle no change of values');
});
