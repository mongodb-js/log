var parse = require('../');
var benchmark = require('benchmark');

module.exports = new benchmark.Suite('default')
  .add('with operation', function() {
    var msg = '2014-06-02T14:26:48.300-0400 [initandlisten] command admin.system '
      + 'planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 '
      + 'keyUpdates:0 numYields:0 locks(micros) W:2347 r;:243 nreturned:30000 '
      + 'reslen:20 nmoved:11 ninserted:100 900000ms';

    parse(msg);
  })
  .add('without operation', function() {
    var msg = 'Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-';
    parse(msg);
  });
// @todo: sync vs. async
//
// .add('sync', function(){
// })
// .add('async', function(){
// });
