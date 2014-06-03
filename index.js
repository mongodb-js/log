var debug = require('debug')('mongolog'),
    regret = require('./regretSetup.js'),
    util = require('util');

function errorMessage(msg) {
  if (msg.indexOf('mongod instance already running?') > -1)
    return new Error('already running');

  return new Error(msg);
}

function getEvent(msg) {
  if (msg.indexOf('exception') > -1)
    return { name: 'error', data: errorMessage(msg) };
  else if(msg.indexOf('waiting for connections') > -1)
    return {
      name: 'ready', 
      data: {port: parseInt(/(\d+)/.exec(msg)[1], 10)} 
    };

  return null;
}

function Entry(data, opts) {
  data = data || {};
  opts = opts || {};

  this.date = data.date || new Date();
  this.name = data.name;

  opts.wrap = opts.wrap || 80;

  this.message = data.message || '';
  this.event = getEvent(this.message);
}

Entry.prototype.toString = function() {
  return this.date.toString() + ' [' + this.name + '] ' + this.message;
};

module.exports.parse = function(lines, opts) {
  opts = opts || {};

  if (!Array.isArray(lines))
    lines = [ lines ];

  return lines.filter(
    function(line) {
      return line && line.length > 0;
    }
  ).map(
    function(line) {
      var match = regret(/^mongodb.log/, line, opts);

      if (!match)
        match = { message: line };

      return new Entry(match);
    }
  );
};
