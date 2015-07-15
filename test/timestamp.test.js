var assert = require('assert');
var parse = require('./..');

describe('parse', function() {
  it('should parse the timestamp and the timestamp format', function() {
    var timestampFormats = {
      ctime: [
        'Wed Mar  2 14:42:31.000',
        'Wed Mar 12 14:42:31.000'
      ],

      'ctime-pre2.4': [
        'Wed Mar  2 14:42:31',
        'Wed Mar 12 14:42:31'
      ],

      'iso8601-local': [
        '2014-02-13T18:00:04.709-0500',
        '2014-02-13T18:00:04.709+0500'
      ],

      'iso8601-utc': [
        '2014-02-13T18:00:04.709Z'
      ]
    };

    var line;
    var timestamp;
    var timestamps;
    var res;
    Object.keys(timestampFormats).map(function(timestampFormat) {
      timestamps = timestampFormats[timestampFormat];
      for (var i = 0; i < timestamps.length; i++) {
        timestamp = timestamps[i];
        line = timestamp + ' [initandlisten] db version v2.5.6 -pre-';
        res = parse(line)[0];

        assert.equal(res.timestamp_format, timestampFormat);
        assert.equal(res.timestamp, timestamp);
      }
    });
  });
});
