var fs = require('fs')
  , path = require('path')

  , get = require('.' + path.sep + 'get');

get.courses(function(err, result) {
  console.log('Done loading courses');
  fs.writeFile(path.join(__dirname, '..', 'data', 'departments.json'), JSON.stringify(result, null, '  '), {encoding: 'utf8'}, function(err) {
    if(err){
      console.log('FS error:', err);
    }
    console.log('Done saving courses');
    process.exit();
  });
});