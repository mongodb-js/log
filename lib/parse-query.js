var JSONL = require('json-literal'),
  log2ejson = require('mongodb-log2ejson'),
  debug = require('debug')('mongodb-log:parse-query');

var fixUnescapedQuotes = require('./fix-unescaped-quotes');

module.exports = function(tokens, pos) {
  var queryIndex = tokens.indexOf('query:');
  if (queryIndex === -1) return {
      pos: pos
    };
  pos = queryIndex + 1;

  var leftParenCount = 0,
    rightParenCount = 0,
    queryStartIndex = pos,
    token;

  // when the number of left and right parentheses are equal, we've parsed the
  // query object string
  do {
    token = tokens[pos];
    if (token === '{') {
      leftParenCount++;
    } else if (token === '}' || token === '},') {
      rightParenCount++;
    }

    pos++;
  } while (leftParenCount !== rightParenCount);

  var objectStr = tokens.slice(
    queryStartIndex, pos
  ).join(' ').replace(/},$/, '}');

  objectStr = fixUnescapedQuotes(objectStr);

  // wrap non-quoted key names in quotes (to handle dot-notation key names)
  objectStr = objectStr.replace(/([{,])\s*([^,{\s\'"]+)\s*:/g, ' $1 "$2" :');
  // convert log types to ejson
  objectStr = log2ejson(objectStr);

  //@todo: wouldn't it be faster to convert to JSON instead of JS and
  // parse that?  We dont need ALL of javascript in any way...

  // parse to js object
  var ctx = {};
  try {
    ctx = JSONL.parse(objectStr);
  } catch (e) {
    console.warn('Could not parse as JSONL `%s`', objectStr);
  }

  return {
    pos: pos,
    comment: ctx.$comment,
    sortShape: ctx.orderby,
    query: ctx.query || ctx.$query || ctx || {}
  };
};
