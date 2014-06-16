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

function parseQuery(thisObj, parsingFirstNestedQuery, tokensIndex) {
  var debug = false;
  tokensIndex = tokensIndex || 4;

  // if there is a operations query field, it'd be the fifth token
  if (thisObj.tokens[tokensIndex] !== 'query:')
    return tokensIndex;

  if (debug)
    console.log(thisObj.line);

  tokensIndex++;
  parsingFirstNestedQuery = (typeof parsingFirstNestedQuery !== 'undefined') ? 
    parsingFirstNestedQuery : false;

  var leftParenCount = 0, rightParenCount = 0;
  var parsingRegex = false, parsingSingleQuotedString = false, 
    parsingDoubleQuotedString = false;
  var queryStartIndex = tokensIndex;
  var token;

  do {
    token = thisObj.tokens[tokensIndex];

    if (debug) {
      console.log('token: ' + token);
      console.log('leftParenCount: ' + leftParenCount + ' rightParenCount: ' + 
        rightParenCount);
    }

    if (parsingRegex) {
      if (token.search('/') >= 0)
        parsingRegex = false;
    } else if (parsingSingleQuotedString) {
      if (token.search('\'') >= 0) 
        parsingSingleQuotedString = false;
    } else if (parsingDoubleQuotedString) {
      if (token.search('\"') >= 0) 
        parsingDoubleQuotedString = false;
    } else if (!parsingFirstNestedQuery && token === 'query:' &&
        (leftParenCount - rightParenCount) === 1) {

      return parseQuery(thisObj, true, tokensIndex);

    } else if (token === '{') {
      leftParenCount++;
    } else if (token === '}' || token === '},') {
      rightParenCount++;
    } else if (tokenBeginsExpression('/', token)) {
      parsingRegex = true;
    } else if (tokenBeginsExpression('\'', token)) {
      parsingSingleQuotedString = true;
    } else if (tokenBeginsExpression('\"', token)) {
      parsingDoubleQuotedString = true;
    }

    tokensIndex++;
  } while (leftParenCount !== rightParenCount);

  thisObj.query = thisObj.tokens.slice(queryStartIndex, tokensIndex).join(' ');

  return tokensIndex;
}

function tokenBeginsExpression(exprSymbol, token) {
  return token === exprSymbol || 
    (token[0] === exprSymbol && token[token.length - 1] !== exprSymbol);
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
