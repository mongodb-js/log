var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  it('should match the timestamp from each log line', function() {
    var timestampFormats = {
      'ctime': [
        'Wed Mar  2 14:42:31.000',
        'Wed Mar 12 14:42:31.000'
      ],

      'ctimePreTwoPointFour': [
        'Wed Mar  2 14:42:31',
        'Wed Mar 12 14:42:31'
      ],

      'iso8601_local': [
        '2014-02-13T18:00:04.709-0500',
        '2014-02-13T18:00:04.709+0500'
      ],

      'iso8601_utc': [
        '2014-02-13T18:00:04.709Z',
      ]
    }

    for (var timestampFormat in timestampFormats) {
      var timestamps = timestampFormats[timestampFormat];

      for (var i = 0; i < timestamps.length; i++) {
        var timestamp = timestamps[i];

        var line = timestamp + ' [initandlisten] db version v2.5.6 -pre-';
        var res = log.parse(line)[0];

        assert.equal(res.timestamp_format, );
        assert.equal(res.timestamp, timestamp);
      }
    }
  });
});