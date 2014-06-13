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
  parseTimestampFields(this, data.timestamp);

  this.event = getEvent(data.message);
  this.line = data.line;
  this.message = data.message || '';
  this.tokens = data.line.split(' ');
  this.thread = data.thread;

  var match;

  // connection accepted format
  match = regret('connectionAccepted', data.message);

  if (match !== null)
    this.conn = 'conn' + match.connNum;
  else if (data.thread.substring(0, 4) === 'conn')
    this.conn = data.thread;

  // operation format
  if (operationTypes.contains(this.tokens[2])) {
    var lastToken = this.tokens.slice(-1)[0];
    this.duration = lastToken.substring(0, lastToken.length - 2);
    this.operation = this.tokens[2];

    parseNamespaceFields(this);

    var tokensIndex = parseQuery(this);
    var token;

    for (; tokensIndex < this.tokens.length; tokensIndex++) {
      token = this.tokens[tokensIndex];
      parseOperationStats(this, token);
    }
  }
}

function parseNamespaceFields(thisObj) {
  thisObj.namespace = thisObj.tokens[3];

  var namespaceTokens = thisObj.namespace.split('.');
  thisObj.database = namespaceTokens[0];
  thisObj.collection = namespaceTokens.slice(1).join('.');

  var lastToken = namespaceTokens.slice(-1)[0];
  if (lastToken[0] === '$')
    thisObj.index = lastToken.substring(1);
}

function parseOperationStats(thisObj, token) {
  var colonIndex = token.search(':');
  var key, intValue;

  // parsing operation stat fields
  if (colonIndex >= 1) {
    key = token.substring(0, colonIndex);
    intValue = parseInt(token.substring(colonIndex + 1));

    if (!isNaN(intValue))
      thisObj[key] = intValue; 
  }
}

function parseQuery(thisObj) {
  // if there is a operations query field, it'd be the fifth token
  if (thisObj.tokens[4] !== 'query:')
    return 4;

  var leftParenCount = 0, parsingFirstNestedQuery = false, queryStartIndex = 5, 
    rightParenCount = 0, token, tokensIndex = 5;

  do {
    token = thisObj.tokens[tokensIndex];

    if (token === 'query:' && !parsingFirstNestedQuery && 
        (leftParenCount - rightParenCount) === 1) {
      // it's safe to assume that the next token will be a '{' since the first
      // nested query's value will be an object so we'll skip to the next next 
      // token
      leftParenCount = 1;
      queryStartIndex = tokensIndex + 1;
      rightParenCount = 0;
      tokensIndex += 2;

      // ensures that we only parse the first nested query key and no other 
      // query key
      parsingFirstNestedQuery = true;
    } else if (token === '{') {
      leftParenCount++;
    } else if (token === '}' || token === '},') {
      rightParenCount++;
    }

    tokensIndex++;
  } while (leftParenCount !== rightParenCount);

  thisObj.query = thisObj.tokens.slice(queryStartIndex, tokensIndex).join(' ');

  return tokensIndex;
}

var timestampLengths = {
  '19': 'ctime-pre2.4',
  '23': 'ctime',
  '24': 'iso8601-utc',
  '28': 'iso8601-local'
};

function parseTimestampFields(thisObj, timestamp) {
  thisObj.timestamp = timestamp || new Date();
  var tsLength = thisObj.timestamp.length;

  if (timestampLengths[tsLength] !== undefined)
    thisObj.timestamp_format = timestampLengths[tsLength];
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
