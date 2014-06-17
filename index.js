var debug     = require('debug')('index'),
    regret    = require('./patterns'),
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
    parseObject('sort_shape', 'orderby:', this, 4, false);

    var tokensIndex = parseObject('query', 'query:', this, 4, false);
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

function parseObject(objectName, objectToken, thisObj, tokensIndex, 
    parsedFirstNestedObj) {
  if (thisObj.tokens.indexOf(objectToken) === -1)
    return tokensIndex;

  debug();
  debug('objectName: ' + objectName);
  debug(thisObj.line);
  debug();

  tokensIndex++;
  parsedFirstNestedObj = (typeof parsedFirstNestedObj !== 'undefined') ? 
    parsedFirstNestedObj : false;

  var leftParenCount = 0, rightParenCount = 0;
  var parsingRegex = false, parsingSingleQuotedString = false, 
    parsingDoubleQuotedString = false;
  var objectStartIndex = tokensIndex;
  var token;

  // when the number of left and right parentheses are equal, we've parsed the
  // object
  do {
    token = thisObj.tokens[tokensIndex];

    debug('token: ' + token);

    // rare edge case handling:
    // we have to know if we're tokenzing tokens that are part of a string or
    // regex since we need to be able to tell the difference between when the
    // objectToken is either 1. part of a string or regex or 2. a key
    // if it's the latter, then we can expect to parse an object after the key
    if (parsingRegex) {
      if (token.search('/') >= 0)
        parsingRegex = false;
    } else if (parsingSingleQuotedString) {
      if (token.search('\'') >= 0) 
        parsingSingleQuotedString = false;
    } else if (parsingDoubleQuotedString) {
      if (token.search('\"') >= 0) 
        parsingDoubleQuotedString = false;
    } else if (tokenBeginsWrap(token, '/')) {
      parsingRegex = true;
    } else if (tokenBeginsWrap(token, '\'')) {
      parsingSingleQuotedString = true;
    } else if (tokenBeginsWrap(token, '\"')) {
      parsingDoubleQuotedString = true;
    }

    // handles the nested objectToken, see test cases
    else if (!parsedFirstNestedObj && token === objectToken &&
        (leftParenCount - rightParenCount) === 1) {

      return parseObject(objectName, objectToken, thisObj, tokensIndex, true);

    }

    // parenthesis count
    else if (token === '{') {
      leftParenCount++;
    } else if (token === '}' || token === '},') {
      rightParenCount++;
    }

    debug('leftParenCount: ' + leftParenCount + ' rightParenCount: ' + 
    rightParenCount);
    debug('parsingRegex: ' + parsingRegex);
    debug('parsingSingleQuotedString: ' + parsingSingleQuotedString);
    debug('parsingDoubleQuotedString: ' + parsingDoubleQuotedString);
    debug(tokenBeginsWrap('/', token));
    debug();

    tokensIndex++;
  } while (leftParenCount !== rightParenCount);

  debug('Done tokenizing');

  thisObj[objectName] = thisObj.tokens.slice(objectStartIndex, tokensIndex).
    join(' ');
  if (thisObj[objectName].slice(-2) === '},') {
    thisObj[objectName] = thisObj[objectName].
      slice(0, thisObj[objectName].length - 1);
  }

  debug(objectName);
  debug(thisObj[objectName]);

  return tokensIndex;
}

function tokenBeginsWrap(token, wrapSymbol) {
  return token === wrapSymbol || 
      (token[0] === wrapSymbol && 
      token.slice(-1) !== wrapSymbol && 
      token.slice(-2) !== wrapSymbol + ',');
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
