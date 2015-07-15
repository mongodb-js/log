// work-around for unescaped quotes in strings: https://jira.mongodb.org/browse/SERVER-16620
var debug = require('debug')('mongodb-log:fix-unescaped-quotes');
var TWO_SLASHES = '\\' + '"';
module.exports = function(line) {
  var stringRegex = /([:,\[]\s*)"(.*?)"(\s*[,}\]])/g;
  var match;
  while ((match = stringRegex.exec(line)) !== null) {
    if (match[2].indexOf('"') !== -1) {
      var prefix = match[1];
      var suffix = match[3];
      var content = match[2].replace(/"/g, TWO_SLASHES); // replacement should be two slasshes '\\"'

      debug('handling double quotes: `%s`.replace(%s, %s)',
        line, match[0], prefix + '"' + content + '"' + suffix);

      line = line.replace(match[0], prefix + '"' + content + '"' + suffix);
      debug('line now', line);
    }
  }
  return line;
};
