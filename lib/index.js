var LogEntry = require('./model');
var map = require('lodash.map');
var regret = require('./patterns');
var es = require('event-stream');
var debug = require('debug')('mongodb-log');

// @todo: async support
function getLogEntry(line) {
  if (!line) {
    return {
      unknown: true
    };
  }

  var match = regret(/^mongodb.log/, line);
  if (match === null) {
    module.exports.unknown.push(line);
    return {
      line: line,
      unknown: true
    };
  }

  return new LogEntry(match);
}

function createTransformStream() {
  return es.through(function(data) {
    var self = this;
    var lines = data.toString('utf-8').split('\n');
    lines.map(function(line, i) {
      // Empty line
      if (line.length === 0) {
        return;
      }
      var res = getLogEntry(line);
      // @todo: log unknowns somewhere to find things we're missing?
      if (!res.unknown) {
        self.emit('data', res);
      } else {
        debug('unknown pattern at #%d: `%s`', i, line.toString('utf-8'));
      }
    });
  });
}

module.exports = function() {
  module.exports.unknown = [];
  var args = Array.prototype.slice.call(arguments, 0);
  if (args.length === 0) {
    return createTransformStream();
  }

  return map(args, getLogEntry);
};

module.exports.unknown = [];
