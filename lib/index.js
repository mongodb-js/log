var LogEntry = require('./model'),
  _ = require('lodash'),
  regret = require('./patterns'),
  es = require('event-stream');

// @todo: async support
function getLogEntry(line) {
  var match = regret(/^mongodb.log/, line);
  if (match === null) {
    return {
      line: line,
      unknown: true
    };
  }
  return new LogEntry(match);
}

function createTransformStream() {
  return es.map(function(data, done) {
    var res = getLogEntry(data);
    // Drop unknowns.
    // @todo: log these somewhere to find things we're missing?
    if (res.unknown) {
      return done();
    }
    done(null, res);
  });

}

module.exports = function() {
  var args = Array.prototype.slice.call(arguments, 0);
  if (args.length === 0) {
    return createTransformStream();
  }

  return _.map(args, getLogEntry);
};


// Legacy.
// @todo: remove before 2.0.0
module.exports.parse = module.exports;
