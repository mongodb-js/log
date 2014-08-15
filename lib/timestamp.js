module.exports = function (entry){
  var l = entry.timestamp.length;

  if(l === 19) return 'ctime-pre2.4';
  if(l === 23) return 'ctime';
  if(l === 24) return 'iso8601-utc';
  if(l === 28) return 'iso8601-local';
};
