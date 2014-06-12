var regret    = require('./patterns'),
    Set       = require('set'),
    fields    = new Set([ 'query' ]);

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

  // general format
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
  match = regret('operation', data.message);

  if (match !== null) {
    this.collection = match.collection;
    if (match.index !== null ) 
      this.collection += '.' + match.index;

    this.database = match.database;
    this.duration = this.split_tokens.slice(-1)[0].substring(0, -2);
    this.operation = match.operation;
    this.namespace = this.database + '.' + this.collection;

    var leftParenCount, parsingBrackets, rightParenCount, queryStartIndex,
      parsingFieldName, token;

    // parsing other operation fields
    for (var i = 4; i < this.split_tokens.length; i++) {
      var token = this.split_tokens[i];

      if (token == 'orderby:' || token == 'query:') {

        if (token == 'orderby:') parsingFieldName = 'sort_shape';
        else if (token == 'query:') parsingFieldName = 'query';

        leftParenCount = 0;
        parsingBrackets = true;
        rightParenCount = 0;
        queryStartIndex = i + 1;

      } else if (parsingBrackets) {

        if (token == '{') leftParenCount++;
        else if (token == '}' || token == '},') rightParenCount++;

        if (token == '},') this.split_tokens[i] = '}';

        if (leftParenCount == rightParenCount) {
          var fieldTokens = this.split_tokens.slice(queryStartIndex, i + 1);

          parsingBrackets = false;
          this[parsingFieldName] = fieldTokens.join(' ');

          // query_shape field e.g.
          // if query = { foo: "value", bar: "another value" }
          // then query_shape = { foo: 1, bar: 1 }
          if (parsingFieldName == 'query') {
            console.log(fieldTokens);

            // for (var i = 0; i < fieldTokens.length; i++) {

            //   // the token is the value of a key value pair e.g. key: "value"
            //   if (fieldTokens[i][0] == '\"')
            //     if (fieldTokens[i].slice(-1) == '\"') 
            //       fieldTokens[i] = '1';
            //     else if (fieldTokens[i].slice(-2) == '\",') 
            //       fieldTokens[i] = '1,';
            //     else

            // // JSON.parse requires that the keys are surrouned by double quotes
            // // e.g. { foo: "value", bar: "another value" } should be
            // //      "{"foo":"value","var":"another value"}"
            // for (var i = 0; i < fieldTokens.length; i++) {
            //   if (fieldTokens[i].slice(-1) == ':') {
            //     fieldTokens[i] = '\"' + fieldTokens[i].
            //       substring(0, fieldTokens[i].length - 1) + '\"';
            //     fieldTokens.splice(i + 1, 0, ':');
            //     i++;
            //   }
            // }

            // console.log('the query');
            // console.log('\"' + fieldTokens.join('') + '\"');
            // console.log('should be: ');
            // console.log('{\"foo\":\"value\",\"var\":\"another value\"}');

            // var queryObject = JSON.parse('\"' + fieldTokens.join('') + '\"');

            // for (var i = 0; i < fieldTokens.length; i++) {

            //   // the token is the value of a key value pair e.g. key: "value"
            //   if (fieldTokens[i][0] == '\"')
            //     if (fieldTokens[i].slice(-1) == '\"') 
            //       fieldTokens[i] = '1';
            //     else if (fieldTokens[i].slice(-2) == '\",') 
            //       fieldTokens[i] = '1,';
            //     else


            // }

            this.query_shape = fieldTokens.join(' ');
          }
        }

      }
      // if (fields.contains(this.split_tokens[i]).substring(0, -1)) {
 
      // }
    }

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

    if (match === null)
      return { line: line };

    return new Entry(match);
  });
};
