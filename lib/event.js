var error = require('./error');

module.exports = function(entry){
  if (entry.message.indexOf('exception') > -1) {
    return {
      name: 'error',
      data: error(entry)
    };
  }
  if (entry.message.indexOf('waiting for connections') > -1) {
    return {
      name: 'ready',
      data: { port: parseInt(/(\d+)/.exec(entry.message)[1], 10) }
    };
  }
  return null;
};
