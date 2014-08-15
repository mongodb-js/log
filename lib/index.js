var debug = require('debug')('mongodb-log'),
  regret = require('./patterns'),
  timestamp = require('./timestamp'),
  event = require('./event'),
  connection = require('./connection'),
  queryShape = require('./query-shape');

var OPS = 'command delete getmore query remove update'.split(' ');

function Entry(data, opts) {
  opts = opts || {};
  data = data || {};

  if (!data.line || !data.thread) return;

  this.timestamp = data.timestamp || new Date();
  this.line = data.line;
  this.message = data.message || '';
  this.thread = data.thread;
  this.tokens = data.line ? data.line.split(' ') : [];

  this.timestamp_format = timestamp(this);
  this.event = event(this);
  this.conn = connection(this);

  this.parseOperation();
}

Entry.prototype.timestamp = null;
Entry.prototype.timestamp_format = '';

Entry.prototype.line = '';
Entry.prototype.message = '';
Entry.prototype.thread = '';

Entry.prototype.tokens = [];
Entry.prototype.event = null;

Entry.prototype.conn = null;

Entry.prototype.parseNamespaceFields = function(){
  this.namespace = this.tokens[this.timestamp.split(' ').length + 2];
  var namespaceTokens = this.namespace.split('.');
  this.database = namespaceTokens[0];
  this.collection = namespaceTokens.slice(1).join('.');
  var lastToken = namespaceTokens.slice(-1)[0];
  if (lastToken[0] === '$') this.index = lastToken.substring(1);
};

Entry.prototype.parseOperation = function(){
  // the operation type comes after the thread
  var opTypeIndex = this.tokens.indexOf('[' + this.thread + ']') + 1;
  if (OPS.indexOf(this.tokens[opTypeIndex]) > -1) {
    var lastToken = this.tokens.slice(-1)[0];
    this.duration = parseInt(lastToken.substring(0, lastToken.length - 2));
    this.operation = this.tokens[2];
    this.parseNamespaceFields();

    // opTypeIndex + 2 is where the query object should start
    this.parseObject('sortShape', 'orderby:', opTypeIndex + 2, false);
    var tokensIndex = this.parseObject('query', 'query:', opTypeIndex + 2, false);
    queryShape(this);

    if (this.queryShape !== undefined) this.queryPattern = this.namespace + ' ' + this.queryShape;

    var token;
    for (; tokensIndex < this.tokens.length; tokensIndex++) {
      token = this.tokens[tokensIndex];
      this.parseOperationStats(token);
    }
  }
};

Entry.prototype.parseOperationStats = function(token) {
  var colonIndex = token.search(':');
  var key, intValue;
  // parsing operation stat fields
  if (colonIndex >= 1) {
    key = token.substring(0, colonIndex);
    intValue = parseInt(token.substring(colonIndex + 1));
    if (!isNaN(intValue)) this[key] = intValue;
  }
};

function tokenBeginsWrap(token, wrapSymbol) {
  return token === wrapSymbol || token[0] === wrapSymbol &&
    token.slice(-1) !== wrapSymbol && token.slice(-2) !== wrapSymbol + ',';
}


Entry.prototype.parseObject = function(objectName, objectToken, tokensIndex, parsedFirstNestedObj) {
  if (this.tokens.indexOf(objectToken) === -1)
    return tokensIndex;
  debug('parsing object `' + objectName + '`', this.line);
  tokensIndex++;
  parsedFirstNestedObj = typeof parsedFirstNestedObj !== 'undefined' ? parsedFirstNestedObj : false;
  var leftParenCount = 0, rightParenCount = 0;
  var parsingArray = false, parsingRegex = false, parsingSingleQuotedString = false, parsingDoubleQuotedString = false;
  var objectStartIndex = tokensIndex;
  var JSONtokens = this.tokens.slice(0);
  var token;
  // when the number of left and right parentheses are equal, we've parsed the
  // object
  do {
    token = this.tokens[tokensIndex];
    if (token === undefined)
      return tokensIndex;
    // rare edge case handling:
    // we have to know if we're tokenzing tokens that are part of a string or
    // regex since we need to be able to tell the difference between when the
    // objectToken is either 1. part of a array, regex or string or 2. a key
    // if it's the latter, then we can expect to parse an object after the key
    if (parsingArray) {
      if (token.search(']') >= 0)
        parsingArray = false;
    } else if (parsingRegex) {
      if (token.search('/') >= 0)
        parsingRegex = false;
    } else if (parsingSingleQuotedString) {
      if (token.search('\'') >= 0)
        parsingSingleQuotedString = false;
    } else if (parsingDoubleQuotedString) {
      if (token.search('"') >= 0)
        parsingDoubleQuotedString = false;
    } else if (tokenBeginsWrap(token, '/')) {
      parsingRegex = true;
    } else if (tokenBeginsWrap(token, '\'')) {
      parsingSingleQuotedString = true;
    } else if (tokenBeginsWrap(token, '"')) {
      parsingDoubleQuotedString = true;
    } else if (tokenBeginsWrap(token, '[')) {
      parsingArray = true;
    }  // handles the nested objectToken, see test cases
    else if (!parsedFirstNestedObj && token === objectToken && leftParenCount - rightParenCount === 1) {
      return this.parseObject(objectName, objectToken, tokensIndex, true);
    }  // parenthesis count
    else if (token === '{') {
      leftParenCount++;
    } else if (token === '}' || token === '},') {
      rightParenCount++;
    } else if (objectToken === 'query:' && token.length > 1 && token.slice(-1) === ':') {
      JSONtokens[tokensIndex] = '"' + token.slice(0, -1) + '":';
    }
    tokensIndex++;
  } while (leftParenCount !== rightParenCount);
  this[objectName] = this.tokens.slice(objectStartIndex, tokensIndex).join(' ');
  if (this[objectName].slice(-2) === '},') {
    this[objectName] = this[objectName].slice(0, this[objectName].length - 1);
  }
  if (objectToken === 'query:') {
    this.queryShape = JSONtokens.slice(objectStartIndex, tokensIndex).join(' ');
  }
  return tokensIndex;
};

module.exports.parse = function (lines, opts) {
  opts = opts || {};
  if (!Array.isArray(lines)) lines = [lines];

  return lines.filter(function (line) {
    return line && line.length > 0;
  }).map(function (line){
    var match = regret(/^mongodb.log/, line, opts);
    if (match === null) return { line: line };

    return new Entry(match);
  });
};
