var assert = require('assert'),
    log    = require('./..');

var data = {
  'ctime': [
    'Wed Mar 12 14:42:31.000'
  ],

  'ctimePreTwoPointFour': [
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

describe('parse', function(){

  for (var dateFormat in data) {
    var dates = data[dateFormat];

    for (var i = 0; i < dates.length; i++) {
      var date = dates[i];

      it('should match ' + dateFormat, function() {
        var line = date + ' [initandlisten] db version v2.5.6 -pre-';
        var res = log.parse(line)[0];

        assert.equal(res.date, date);
      });

    }
  }

});
