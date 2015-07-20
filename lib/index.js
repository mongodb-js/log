var map = require('lodash.map');
var parse = require('./grammar').parse;
var es = require('event-stream');
var debug = require('debug')('mongodb-log');

function createTransformStream() {
  var index = 0;
  return es.through(function(data) {
    var self = this;
    var lines = data.toString('utf-8').split('\n');
    lines.map(function(line) {
      index++;
      // Empty line
      if (line.length === 0) {
        return;
      }
      try {
        var res = parse(line);
        self.emit('data', res);
      } catch (e) {
        console.error(e, 'parsing', line);
      }
    });
  });
}

module.exports = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  if (args.length === 0) {
    return createTransformStream();
  }
};
