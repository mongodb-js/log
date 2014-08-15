var regret = require('./patterns');

module.exports = function(entry){
  var match;
  // connection accepted format
  if (match = regret('connectionAccepted', entry.message)) {
    return 'conn' + match.connNum;
  }
  else if (entry.thread && entry.thread.substring(0, 4) === 'conn') {
    return entry.thread;
  }
};
