var regret    = require('./patterns'),
    Set       = require('set');

var operationTypes = new Set([ 
  'command', 
  'delete', 
  'getmore', 
  'query', 
  'remove', 
  'update' 
]);

function errorMessage(msg){
  if(msg.indexOf('mongod instance already running?') > -1){
    return new Error('already running');
  }
  return new Error(msg);
}

function getEvent(msg){
  if (msg.indexOf('exception') > -1) {
    return {name: 'error', data: errorMessage(msg)};
  } else if(msg.indexOf('waiting for connections') > -1) {
    return {name: 'ready', data: {port: parseInt(/(\d+)/.exec(msg)[1], 10)}};
  }
  return null;
}

function Entry(data, opts){
  opts = opts || {};
  data = data || {};

  opts.wrap = opts.wrap || 80;

  // general fields
  this.date = data.date || new Date();
  this.event = getEvent(data.message);
  this.line = data.line;
  this.message = data.message || '';
  this.split_tokens = data.line.split(' ');
  this.thread = data.thread;

  var match;

  // connection accepted format
  match = regret('connectionAccepted', data.message);

  if (match !== null)
    this.conn = 'conn' + match.connNum;
  else if (data.thread.substring(0, 4) === 'conn')
    this.conn = data.thread;

  // operation format
  if (operationTypes.contains(this.split_tokens[2])) {
    var lastToken = this.split_tokens.slice(-1)[0];
    this.duration = lastToken.substring(0, lastToken.length - 2);

    this.namespace = this.split_tokens[3];
    var namespaceTokens = this.namespace.split('.');
    this.database = namespaceTokens[0];
    this.collection = namespaceTokens.slice(1).join('.');

    this.operation = this.split_tokens[2];

    var colonIndex, key, token, intValue;

    for (var i = 4; i < this.split_tokens.length; i++) {
      token = this.split_tokens[i];
      colonIndex = token.search(':');

      // parsing operation stat fields
      if (colonIndex) {
        key = token.substring(0, colonIndex);
        intValue = parseInt(token.substring(colonIndex + 1));

        if (intValue != NaN)
          this[key] = intValue; 
      }
    }
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

    if (match === null)
      return { line: line };

    return new Entry(match);
  });
};
