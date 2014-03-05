var regret = require('regret'),
  util = require('util'),
  debug = require('debug')('mongolog');

regret.add('date.iso',
  /\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+-[0-5]\d/,
  '2014-02-13T18:00:04.709-0500');

regret.add('mongodb.log', /({{date.iso}}+) \[(\w+)\] (.*)/,
  '2014-02-13T18:00:04.709-0500 [initandlisten] db version v2.5.6-pre-',
  ['date', 'name', 'message']);

regret.add('mongodb.logshutdown', /(\w+)\: (.*)/,
  'dbexit: really exiting now', ['name', 'message']);

function errorMessage(msg){
  if(msg.indexOf('mongod instance already running?') > -1){
  return new Error('already running');
  }
  return new Error(msg);
}

function getEvent(msg){
  if(msg.indexOf('exception') > -1){
    return {name: 'error', data: errorMessage(msg)};
  }
  else if(msg.indexOf('waiting for connections') > -1){
    return {name: 'ready', data: {port: parseInt(/(\d+)/.exec(msg)[1], 10)}};
  }
  return null;
}

function Entry(data, opts){
  opts = opts || {};
  opts.wrap = opts.wrap || 80;
  this.name = data.name;
  this.message = data.message;
  this.date = data.date || new Date();
  this.event = getEvent(this.message);
}

Entry.prototype.toString = function(){
  return this.date.toString() + ' [' + this.name + '] ' + this.message;
};

module.exports.parse = function(lines, opts){
  return lines.filter(function(line){
    return line.length > 0;
  }).map(function(line){
    return new Entry(regret(/^mongodb.log/, line, opts));
  });
};
