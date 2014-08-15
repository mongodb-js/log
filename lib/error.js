module.exports = function(entry) {
  if (entry.message.indexOf('mongod instance already running?') > -1) {
    return new Error('already running');
  }
  return new Error(entry.message);
};
