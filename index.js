var regret = require('./patterns');

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
  data = data || {};
  opts.wrap = opts.wrap || 80;
  this.name = data.name;
  this.message = data.message || '';
  this.date = data.date || new Date();
  this.event = getEvent(this.message);

  // operation format
  var match = regret('operation', data.message);
  if (match !== null) {
    console.log(data.message);
    console.log(match);

    this.collection = match.collection;
    if (match.index !== null )
     this.collection += '.' + match.index;

    this.database = match.database;
    this.operation = match.operation;

    // remove
    this.other = match.other;
  }
}

module.exports.parse = function(lines, opts){
  opts = opts || {};
  if(!Array.isArray(lines)){
    lines = [lines];
  }
  return lines.filter(function(line){
    return line && line.length > 0;
  }).map(function(line){
    var match = regret(/^mongodb.log/, line, opts);
    match = match || {message: line};
    return new Entry(match);
  });
};
