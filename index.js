var JSONL   = require('json-literal'),
    debug   = require('debug')('mongodb-log'),
    regret  = require('./patterns');
var OPS       = 'command delete getmore query remove update'.split(' '),
    QUERY_OPS = '$exists $gt $gte $in $lt $lte $nin $regex'.split(' ');

function getTimestampFormat(timestamp) {
  var format, l = timestamp.length;
  switch (l) {
  case 19:
    format = 'ctime-pre2.4';
    break;
  case 23:
    format = 'ctime';
    break;
  case 24:
    format = 'iso8601-utc';
    break;
  case 28:
    format = 'iso8601-local';
    break;
  }
  return format;
}
function errorMessage(msg) {
  var message = msg;
  if (msg.indexOf('mongod instance already running?') > -1) {
    message = 'already running';
  }
  return new Error(message);
}
function getEvent(msg) {
  if (msg.indexOf('exception') > -1) {
    return {
      name: 'error',
      data: errorMessage(msg)
    };
  }
  if (msg.indexOf('waiting for connections') > -1) {
    return {
      name: 'ready',
      data: { port: parseInt(/(\d+)/.exec(msg)[1], 10) }
    };
  }
  return null;
}
function Entry(data, opts) {
  opts = opts || {};
  data = data || {};
  this.timestamp = data.timestamp || new Date();
  this.timestamp_format = getTimestampFormat(this.timestamp);
  this.line = data.line;
  this.message = data.message || '';
  this.tokens = data.line ? data.line.split(' ') : [];
  this.thread = data.thread;
  this.event = getEvent(data.message);
  var match;
  // connection accepted format
  if (match = regret('connectionAccepted', data.message)) {
    this.conn = 'conn' + match.connNum;
  } else if (data.thread && data.thread.substring(0, 4) === 'conn') {
    this.conn = data.thread;
  }
  if (!data.line || !data.thread) {
    // Message from shell that is not a log entry
    console.error(data.line);
    return;
  }
  parseOperation(this);
}
function parseNamespaceFields(thisObj) {
  thisObj.namespace = thisObj.tokens[thisObj.timestamp.split(' ').length + 2];
  var namespaceTokens = thisObj.namespace.split('.');
  thisObj.database = namespaceTokens[0];
  thisObj.collection = namespaceTokens.slice(1).join('.');
  var lastToken = namespaceTokens.slice(-1)[0];
  if (lastToken[0] === '$')
    thisObj.index = lastToken.substring(1);
}
function parseOperation(thisObj) {
  // the operation type comes after the thread
  var opTypeIndex = thisObj.tokens.indexOf('[' + thisObj.thread + ']') + 1;

  if (OPS.indexOf(thisObj.tokens[opTypeIndex]) > -1) {
    var lastToken = thisObj.tokens.slice(-1)[0];
    thisObj.duration = parseInt(lastToken.substring(0, lastToken.length - 2));
    thisObj.operation = thisObj.tokens[2];

    parseNamespaceFields(thisObj);
    var currentTokenIndex = parseQuery(thisObj, opTypeIndex + 2);
    parseOperationStats(thisObj, currentTokenIndex);
  }
}
function parseOperationStats(thisObj, currentTokenIndex) {
  var token;
  for (; currentTokenIndex < thisObj.tokens.length; currentTokenIndex++) {
    token = thisObj.tokens[currentTokenIndex];
    parseOperationStat(thisObj, token);
  }
}
function parseOperationStat(thisObj, token) {
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
function parseQuery(thisObj, currentTokenIndex) {
  if (thisObj.tokens.indexOf('query:') === -1)
    return currentTokenIndex;
  currentTokenIndex++;
  var leftParenCount = 0, rightParenCount = 0;
  var queryStartIndex = currentTokenIndex;
  var token;

  // when the number of left and right parentheses are equal, we've parsed the
  // query object string
  do {
    token = thisObj.tokens[currentTokenIndex];
    if (token === undefined)
      return currentTokenIndex;
    else if (token === '{')
      leftParenCount++;
    else if (token === '}' || token === '},')
      rightParenCount++;

    currentTokenIndex++;
  } while (leftParenCount !== rightParenCount);

  var objectStr = thisObj.tokens.slice(
    queryStartIndex, currentTokenIndex
  ).join(' ');
  var object = JSONL.parse(objectStr);

  if (object['$comment'])
    thisObj.comment = object['$comment'];

  if (object.orderby)
    thisObj.sortShape = object.orderby;

  if (object.query)
    thisObj.query = object.query;
  else if (object['$query'])
    thisObj.query = object['$query'];
  else
    thisObj.query = object;

  parseQueryShape(thisObj);

  return currentTokenIndex;
}
// convert objects to flat string 
// don't want the newlines and extra spaces from JSON.stringify
// e.g. {"mongoscope_feature":"get instance collections"} -> 
//      "{ mongoscope_feature: \"get instance collections\" }"
function JSONFlatStringify(obj) {
  return JSON.stringify(obj, null, ' ').split(/\s+/).join(' ');
}
function parseQueryShape(thisObj) {
  thisObj.queryShape = parseQueryShapeObject(thisObj.query);
  setQueryPattern(thisObj);
}
function parseQueryShapeObject(obj) {
  objCopy = JSON.parse(JSON.stringify(obj));

  var value;
  for (var key in objCopy) {
    value = objCopy[key];
    if (QUERY_OPS.indexOf(key) > -1)
      return 1;
    if (Array.isArray(value))
      objCopy[key] = parseQueryShapeArray(value);
    else if (typeof value === 'objCopyect' && !(value instanceof RegExp))
      objCopy[key] = parseQueryShapeObjCopyect(value);
    else
      objCopy[key] = 1;
  }
  return objCopy;
}
function parseQueryShapeArray(ary) {
  var ele;
  for (var i = 0; i < ary.length; i++) {
    ele = ary[i];
    if (Array.isArray(ele))
      parseQueryShapeArray(ele);
    else if (typeof ele === 'object')
      parseQueryShapeObject(ele);
  }
  return ary.sort();
}
function setQueryPattern(thisObj) {
  thisObj.queryPattern = thisObj.namespace + ' ' + 
    JSONFlatStringify(thisObj.queryShape);
}
module.exports.parse = function (lines, opts) {
  opts = opts || {};
  if (!Array.isArray(lines)) {
    lines = [lines];
  }
  return lines.filter(function (line) {
    return line && line.length > 0;
  }).map(function (line) {
    var match = regret(/^mongodb.log/, line, opts);
    if (match === null)
      return { line: line };
    return new Entry(match);
  });
};