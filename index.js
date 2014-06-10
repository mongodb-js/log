var regret = require('./patterns');

function errorMessage(msg){
  if(msg.indexOf('mongod instance already running?') > -1){
    return new Error('already running');
  }
  return new Error(msg);
}

function getEvent(msg){
  if (msg.indexOf('exception') > -1) {
    return {name: 'error', data: errorMessage(msg)};
  } else if(msg.indexOf('waiting for connections') > -1){
    return {name: 'ready', data: {port: parseInt(/(\d+)/.exec(msg)[1], 10)}};
  }
  return null;
}

function Entry(data, opts){
  opts = opts || {};
  data = data || {};
  
  opts.wrap = opts.wrap || 80;

  var res = regret('connectionAccepted', data.message);

  if (res !== null)
    this.conn = 'conn' + res.connNum;
  else if (data.name.substring(0, 4) === 'conn')
    this.conn = data.name;

  this.date = data.date || new Date();
  this.event = getEvent(data.message);
  this.message = data.message || '';
  this.name = data.name;
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
