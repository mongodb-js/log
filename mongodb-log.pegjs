start = line

/**
 * 2.2.5:
 *
 * Mon Aug  5 20:53:20 [conn133] end connection 10.0.0.12:52655 (2 connections now open)
 * Mon Aug  5 20:53:20 [initandlisten] connection accepted from 10.0.0.12:52665 #135 (3 connections now open)
 *
 * 2.4.11:
 *
 * Thu Oct  9 15:20:20.465 [rsStart] replSet info you may need to run replSetInitiate -- rs.initiate() in the shell -- if that is not already done
 * Thu Oct  9 15:20:20.692 [initandlisten] connection accepted from 127.0.0.1:54763 #1 (1 connection now open)
 *
 * 2.6:
 *
 * 2014-04-09T23:17:40.799-0400 [initandlisten] connection accepted from 10.0.1.135:52274 #39 (13 connections now open)
 * 2014-04-09T23:17:40.800-0400 [conn39]  authenticate db: local { authenticate: 1, nonce: "xxx", user: "__system", key: "xxx" }
 *
 * 2.7.8:
 *
 * 2014-10-31T13:00:04.258+0000 I STORAGE  [FileAllocator] done allocating datafile /Users/joleary/Documents/Support/CS-16129/data/db/local.0,  * size: 64MB,  took 0.261 secs
 * 2014-10-31T13:00:04.295+0000 I QUERY    [initandlisten] command local.$cmd command: create { create: "startup_log", size: 10485760, capped: true } ntoreturn:1 keyUpdates:0 numYields:0  reslen:37 365ms
*/

/**
 * ## Timestamp
 *
 * The timestamp is at the beginning of every log line. There are 4
 * timestamp formats that need to be supported.
 *
 * | Timestamp Format |           Example            | MongoDB Version |
 * | :--------------- | :--------------------------- | :-------------- |
 * | ctime-no-ms      | Wed Dec 31 19:00:00          | < 2.4           |
 * | ctime            | Wed Dec 31 19:00:00.000      | 2.4             |
 * | iso8601-local    | 1969-12-31T19:00:00.000+0500 | >= 2.6          |
 * | iso8601-utc      | 1970-01-01T00:00:00.000Z     | >= 2.6          |
 */
date_year = $(DIGIT DIGIT DIGIT DIGIT)
date_month "MM 01-12" = $(DIGIT DIGIT)
date_mday "DD 01-31" = $(DIGIT DIGIT)
date "YYYY-MM-DD" = $(date_year '-' date_month '-' date_mday)
abbrv_days "ddd" = 'Mon' / 'Tue' / 'Wed' / 'Thu' / 'Fri' / 'Sat' / 'Sun'
abbrv_months "MMM" = 'Jan' / 'Feb' / 'Mar' / 'Apr' / 'May' / 'Jun' / 'Jul' / 'Aug' / 'Sep' / 'Oct' / 'Nov' / 'Dec'
time_hour "HH 00-24" = $(DIGIT DIGIT)
time_minute "MM" = $(DIGIT DIGIT)
time_second "SS" = $(DIGIT DIGIT)
time_fraction "SSS" = (',' / '.') $(DIGIT+)
time_numoffset "ZZ" = ('+' / '-') time_hour (':'? time_minute)?
time_zone "Z" = 'Z' / time_numoffset
time "HH:MM:SS" = time_hour ':' time_minute ':' time_second

// describe('mongodb-log timestamp parsing', function(){
//
//  it('should parse MongoDB < 2.4.x (ctime_no_ms)', function(){
//    var val = 'Wed Dec 31 19:00:00';
//    var res = parseTimestamp(val);
//    assert.equal(res.timestamp_format, 'MMM ddd D hh:mm:ss');
//  });
ctime_no_ms
  = value:$(abbrv_days ws abbrv_months ws date_mday ws time) {
    return {
      'timestamp': value,
      // @todo: D (`1`) or DD (`01`)?
      'timestamp_format': 'MMM ddd D hh:mm:ss'
    };
  }
// it('should parse MongoDB 2.4.x (ctime)', function(){
//   var val = 'Wed Dec 31 19:00:00.000';
//   var res = parseTimestamp(val);
//   assert.equal(res.timestamp_format, 'MMM ddd D hh:mm:ss.SSS');
// });
ctime
  = value:$(abbrv_days ws abbrv_months ws date_mday ws time time_fraction) {
    return {
      'timestamp': value,
      // @todo: D (`1`) or DD (`01`)?
      'timestamp_format': 'MMM ddd D hh:mm:ss.SSS'
    };
  }

// it('should parse MongoDB >= 2.6.x (iso8601-local)', function(){
//   var val = '1969-12-31T19:00:00.000+0500';
//   var res = parseTimestamp(val);
//   assert.equal(res.timestamp_format, 'YYYY-MM-DDThh:mm:ss.SSSZZ');
// });
iso8601_local
  = value:$(date "T" time time_fraction time_zone) {
    return {
      'timestamp': value,
      'timestamp_format': 'YYYY-MM-DDThh:mm:ss.SSSZZ'
    };
  }

// it('should parse MongoDB >= 2.6.x (iso8601-utc)', function(){
//   var val = '1970-01-01T00:00:00.000Z';
//   var res = parseTimestamp(val);
//   assert.equal(res.timestamp_format, 'YYYY-MM-DDThh:mm:ss.SSS\Z');
// });
iso8601_utc
  = value:$(date "T" time time_fraction time_zone) {
    return {
      'timestamp': value,
      'timestamp_format': 'YYYY-MM-DDThh:mm:ss.SSS\\Z'
    };
  }

// Reduce *all* timestamps to a single rule
timestamp
  = iso8601_utc
  / iso8601_local
  / ctime
  / ctime_no_ms
// });

/**
 * ## component
 *
 * [Source][src] [Documentation][docs]
 *
 * [src]: https://github.com/mongodb/mongo/blob/master/src/mongo/logger/log_component.cpp#L138-L151
 * [docs]: http://docs.mongodb.org/master/reference/log-messages/#components
 */
component
  = '-'
  / 'ACCESS'
  / 'COMMAND'
  / 'CONTROL'
  / 'GEO'
  / 'INDEX'
  / 'NETWORK'
  / 'QUERY'
  / 'REPL'
  / 'SHARDING'
  / 'STORAGE'
  / 'JOURNAL'
  / 'WRITE'
  / 'S2'

/**
 * ## severity
 *
 * *New in 3.0*
 *
 * [Documentation][docs]
 *
 * [docs]: http://docs.mongodb.org/master/reference/log-messages/#severity-levels

 */
severity
  = 'F'
  / 'E'
  / 'W'
  / 'I'
  / 'D'
  / 'U'

/**
 * ## context
 *
 * a.k.a. `thread`
 */

/**
 * @todo: handle thread initanlisten but conn accepted message should have connection_id
 * set instead of thread=initandlisten.
 *
 * /^connection accepted from (?:\d{1,3}\.){3}\d{1,3}:\d{1,5} #(\d*)/,
 * 'connection accepted from 127.0.0.1:52049 #700 (1 connection now open)',
 */
context_connection = '[conn' connection_id:$(DIGIT+) ']' { return { 'connection_id': connection_id } }
context_thread = '[' thread:$([a-zA-Z]+) ']' { return { 'thread': thread } }
context = context_connection / context_thread

message = chars

line_before_30
  = ts:timestamp ws context:context ws message:message {
    return {
      'timestamp': ts.timestamp,
      'timestamp_format': ts.timestamp_format,
      'thread': context.thread,
      'connection_id': context.connection_id,
      'message': message
    };
  }

line_30
  = ts:timestamp ws severity:severity ws component:component ws context:context ws message:message {
    return {
      'timestamp': ts.timestamp,
      'timestamp_format': ts.timestamp_format,
      'severity': severity,
      'component': component,
      'thread': context.thread,
      'connection_id': context.connection_id,
      'message': message
    };
  }

line
  = line_30
  / line_before_30

/**
 * [json.pegjs](https://github.com/pegjs/pegjs/blob/master/examples/json.pegjs)
 */
ws "whitespace" = [ \t\n\r]*
decimal_point = '.'
digit1_9      = [1-9]
e             = [eE]
exp           = e (minus / plus)? DIGIT+
frac          = decimal_point DIGIT+
int           = zero / (digit1_9 DIGIT*)
minus         = '-'
plus          = '+'
zero          = '0'
string "string"
  = chars:char* { return chars.join(""); }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape         = "\\"
quotation_mark = '"'
unescaped      = [\x20-\x21\x23-\x5B\x5D-\u10FFFF]

// Core ABNF Rules
DIGIT = [0-9]
HEXDIG = [0-9a-f]i

chars
  = $([A-Za-z0-9.:, /\-\*\n\+\[\]\$\{\"\_\}]+)
