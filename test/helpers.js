var parse = require('./..');
var fs = require('fs');
var es = require('event-stream');
var path = require('path');
var format = require('util').format;

module.exports = {
  parseFixture: function(name, fn) {
    var records = [];
    var src = path.join(__dirname, 'fixtures', format('%s.log', name));

    fs.createReadStream(src)
      .pipe(es.split('\n'))
      .pipe(parse())
      .on('data', function(d) {
        records.push(d);
      })
      .on('error', fn)
      .on('end', function() {
        fn(null, records);
      });
  }
};
