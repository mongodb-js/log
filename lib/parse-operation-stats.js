var debug = require('debug')('mongodb-log:parse-operation-stats');

var STAT_PROPERTY_MAP = {
  ntoreturn: 'to_return_count',
  ntoskip: 'to_skip_count',
  nscanned: 'scanned_count',
  nscannedobjects: 'scanned_object_count',
  keyupdates: 'key_update_count',
  numyields: 'yield_count',
  w: 'write_lock_time', // @todo: normalize against mondo.stats
  r: 'read_lock_time',
  nreturned: 'returned_count',
  reslen: 'result_length',
  nmoved: 'moved_count',
  ndeleted: 'deleted_count',
  nupdated: 'updated_count'
};

module.exports = function(tokens, pos) {
  var token;
  var stats = {};
  var stats_found = 0;
  var unknown_stats = 0;

  for (; pos < tokens.length; pos++) {
    token = tokens[pos];
    var colonIndex = token.indexOf(':');
    var key = '';
    var property_name = '';
    var value = -1;

    // parsing operation stat fields
    if (colonIndex >= 1) {
      key = token.substring(0, colonIndex).toLowerCase();
      property_name = STAT_PROPERTY_MAP[key];
      if (!property_name) {
        debug('skipping unknown operation stat `%s`', key);
        unknown_stats += 1;
      } else {
        value = parseInt(token.substring(colonIndex + 1), 10);

        if (property_name.indexOf && property_name.indexOf('lock_time') > -1) {
          value = value / 1000;
        }
        stats[property_name] = value;
        debug('decoded operation stat %s=%d', property_name, stats[property_name]);
        stats_found += 1;
      }
    }
  }
  debug('operation stats: skipped unknown %d, found %d %j', unknown_stats, stats_found, stats);

  if (stats_found === 0) return undefined;
  return stats;
};
