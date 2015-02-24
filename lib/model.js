var AmpersandState = require('ampersand-state'),
  JSONL = require('json-literal'),
  log2ejson = require('mongodb-log2ejson'),
  _ = require('lodash'),
  regret = require('./patterns'),
  debug = require('debug')('mongodb-log:model');

var OPS = 'command delete getmore query remove update'.split(' ');
var QUERY_OPS = '$exists $gt $gte $in $lt $lte $nin $regex'.split(' ');

// convert objects to flat string
// don't want the newlines and extra spaces from JSON.stringify
// e.g. {"mongoscope_feature":"get instance collections"} ->
//      "{ mongoscope_feature: \"get instance collections\" }"
function flatStringify(obj) {
  return JSON.stringify(obj, null, ' ').split(/\s+/).join(' ');
}

var LEVEL_MAP = require('./level');

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
  nupdated: 'updated_count',
};

var dataTypes = {
  ms: {
    set: function(newVal) {
      return {
        type: 'ms',
        val: newVal / 1000
      };
    }
  }
};

var OperationStats = AmpersandState.extend({
  dataTypes: dataTypes,
  props: {
    to_return_count: {
      type: 'number'
    },
    to_skip_count: {
      type: 'number'
    },
    scanned_count: {
      type: 'number'
    },
    scanned_object_count: {
      type: 'number'
    },
    key_update_count: {
      type: 'number'
    },
    yield_count: {
      type: 'number'
    },
    /**
     * Time holding the write lock?
     *
     * Logged in microseconds, stored as milliseconds using `dataTypes.ms`.
     */
    write_lock_time: {
      type: 'ms'
    },
    /**
     * Time holding the read lock?
     *
     * Logged in microseconds, stored as milliseconds using `dataTypes.ms`.
     */
    read_lock_time: {
      type: 'ms'
    },
    returned_count: {
      type: 'number'
    },
    result_length: {
      type: 'number'
    },
    moved_count: {
      type: 'number'
    },
    deleted_count: {
      type: 'number'
    },
    updated_count: {
      type: 'number'
    },
  }
});

var LogEntry = AmpersandState.extend({
  children: {
    stats: OperationStats
  },
  dataTypes: {
    level: {
      set: function(v) {
        return {
          type: 'level',
          val: LEVEL_MAP[v]
        };
      }
    },
    component: {
      set: function(v) {
        if (v === '-') {
          v = 'UNKNOWN';
        }

        return {
          type: 'component',
          val: v
        };
      },
      default: 'UNKNOWN'
    }
  },
  props: {
    timestamp: {
      type: 'string',
      // @todo: support parsing:
      //
      // - Tue, 24 Feb 2015 13:14:41 GMT
      // - Mon Aug  5 20:27:15
      // set: function(val){},
      default: function() {
        // @todo: support parsing ``.
        return new Date().toUTCString();
      }
    },
    /**
     * Any actual message text that can stand alone.
     */
    message: {
      type: 'string'
    },
    /**
     * @todo: rename to raw? source? input?
     */
    line: {
      type: 'string'
    },
    /**
     * @todo: possible values?
     */
    thread: {
      type: 'string'
    },
    duration: {
      type: 'number'
    },
    operation: {
      type: 'string'
    },
    namespace: {
      type: 'string'
    },
    database: {
      type: 'string'
    },
    collection: {
      type: 'string'
    },
    component: {
      type: 'component'
    },
    level: {
      type: 'level'
    }
  },
  extraProperties: 'allow',
  derived: {
    event: {
      deps: ['message'],
      fn: function() {
        if (!this.message) return undefined;
        var msg = this.message;
        if (this.message.indexOf('mongod instance already running?') > -1) {
          msg = 'already running';
        }

        if (this.message.indexOf('exception') > -1) {
          return {
            name: 'error',
            data: msg
          };
        }
        if (this.message.indexOf('waiting for connections') > -1) {
          return {
            name: 'ready',
            data: {
              port: parseInt(/(\d+)/.exec(this.message)[1], 10)
            }
          };
        }
      }
    },
    tokens: {
      deps: ['line'],
      fn: function() {
        if (!this.line) return [];
        return this.line.split(' ');
      }
    },
    timestamp_format: {
      deps: ['timestamp'],
      fn: function() {
        if (!this.timestamp) return undefined;

        var l = this.timestamp.length;
        if (l === 19) {
          return 'ctime-pre2.4';
        } else if (l === 23) {
          return 'ctime';
        } else if (l === 24) {
          return 'iso8601-utc';
        } else if (l === 28) {
          return 'iso8601-local';
        }
      }
    },
    connection_id: {
      deps: ['thread', 'message'],
      fn: function() {
        if (!this.thread) return undefined;
        if (this.thread.substring(0, 4) === 'conn') return this.thread;
        if (this.thread === 'initandlisten') {
          var match;
          // connection accepted format
          if (match = regret('connectionAccepted', this.message)) {
            return 'conn' + match.connNum;
          }
        }
      }
    },
    _id: {
      deps: ['timestamp', 'thread'],
      fn: function() {
        return this.thread + ':' + this.timestamp;
      }
    }
  },
  initialize: function() {
    // the operation type comes after the thread
    var opTypeIndex = this.tokens.indexOf('[' + this.thread + ']') + 1;

    if (OPS.indexOf(this.tokens[opTypeIndex]) > -1) {
      var lastToken = this.tokens.slice(-1)[0];
      this.duration = parseInt(lastToken.substring(0, lastToken.length - 2));
      this.operation = this.tokens[2];

      this.namespace = this.tokens[this.timestamp.split(' ').length + 2];

      var namespaceTokens = this.namespace.split('.');
      this.database = namespaceTokens[0];
      this.collection = namespaceTokens.slice(1).join('.');

      lastToken = namespaceTokens.slice(-1)[0];
      if (lastToken[0] === '$') {
        this.index = lastToken.substring(1);
      }

      var currentTokenIndex = this.parseQuery(opTypeIndex + 2);
      // @todo: move all of this to `OperationStats#parse`?
      var token,
        stats = {},
        stats_found = 0,
        unknown_stats = 0;

      for (; currentTokenIndex < this.tokens.length; currentTokenIndex++) {
        token = this.tokens[currentTokenIndex];
        var colonIndex = token.indexOf(':');
        var key = '',
          property_name = '',
          value = -1;

        // parsing operation stat fields
        if (colonIndex >= 1) {
          key = token.substring(0, colonIndex).toLowerCase();
          property_name = STAT_PROPERTY_MAP[key];
          if (!property_name) {
            debug('skipping unknown operation stat `%s`', key);
            unknown_stats += 1;
          } else {
            value = parseInt(token.substring(colonIndex + 1));

            stats[property_name] = value;
            debug('decoded operation stat %s=%d', property_name, stats[property_name]);
            stats_found += 1;
          }
        }
      }
      debug('operation stats: skipped unknown %d, found %d %j', unknown_stats, stats_found, stats);

      if (stats_found > 0) {
        this.stats.set(stats);
      }
    } else if (this.tokens[opTypeIndex]) {
      debug('unknown op `%s` for `%s`', this.tokens[opTypeIndex], JSON.stringify(this, null, 2));
    }
  },
  serialize: function() {
    var res = this.getAttributes({
      props: true,
      derived: true
    }, true);
    _.each(this._children, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    _.each(this._collections, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    res.tokens = undefined;
    return res;
  },
  parseQuery: function(currentTokenIndex) {
    var queryIndex = this.tokens.indexOf('query:');
    if (queryIndex === -1) return currentTokenIndex;
    currentTokenIndex = queryIndex + 1;

    var leftParenCount = 0;
    var rightParenCount = 0;
    var queryStartIndex = currentTokenIndex;
    var token;

    // when the number of left and right parentheses are equal, we've parsed the
    // query object string
    do {
      token = this.tokens[currentTokenIndex];
      if (token === undefined)
        return currentTokenIndex;else if (token === '{') {
        leftParenCount++;
      } else if (token === '}' || token === '},') {
        rightParenCount++;
      }

      currentTokenIndex++;
    } while (leftParenCount !== rightParenCount);

    var objectStr = this.tokens.slice(
      queryStartIndex, currentTokenIndex
    ).join(' ').replace(/},$/, '}');

    // work-around for unescaped quotes in strings: https://jira.mongodb.org/browse/SERVER-16620
    var stringRegex = /([:,\[]\s*)"(.*?)"(\s*[,}\]])/g;
    var match;
    while ((match = stringRegex.exec(objectStr)) !== null) {
      if (match[2].indexOf('"') !== -1) {
        var prefix = match[1];
        var suffix = match[3] || '';
        var content = match[2].replace(/"/g, '\\"'); // replacement should be two slasshes '\\"'

        debug('handling double quotes: `%s`.replace(%s, %s)',
          objectStr, match[0], prefix + '"' + content + '"' + suffix);

        objectStr = objectStr.replace(match[0], prefix + '"' + content + '"' + suffix);
        debug('object string now', objectStr);
      }
    }

    // wrap non-quoted key names in quotes (to handle dot-notation key names)
    objectStr = objectStr.replace(/([{,])\s*([^,{\s\'"]+)\s*:/g, ' $1 "$2" :');
    // convert log types to ejson
    objectStr = log2ejson(objectStr);
    // parse to js object
    var object = {};
    try {
      object = JSONL.parse(objectStr);
    } catch (e) {
      debug('Could not parse as JSONL `%s`', objectStr);
    }
    if (object.$comment) {
      this.comment = object.$comment;
    }

    if (object.orderby) {
      this.sortShape = object.orderby;
    }

    if (object.query) {
      this.query = object.query;
    } else if (object.$query) {
      this.query = object.$query;
    } else {
      this.query = object;
    }

    this.queryShape = parseQueryShapeObject(this.query);
    this.queryPattern = this.namespace + ' ' + flatStringify(this.queryShape);
    return currentTokenIndex;
  }
});

function parseQueryShapeObject(obj) {
  var shape = {};
  _.each(_.clone(obj), function(value, key) {
    if (QUERY_OPS.indexOf(key) > -1) {
      shape = 1;
    } else if (_.isArray(value)) {
      shape[key] = parseQueryShapeArray(value);
    } else if (_.isObject(value) && !_.isRegExp(value)) {
      shape[key] = parseQueryShapeObject(value);
    } else {
      shape[key] = 1;
    }
  });

  debug('parsed query shape: %j -> %j', obj, shape);
  return shape;
}

function parseQueryShapeArray(shapes) {
  return _.chain(shapes)
    .each(function(shape) {
      if (_.isArray(shape)) {
        parseQueryShapeArray(shape);
      } else if (_.isObject(shape)) {
        parseQueryShapeObject(shape);
      }
    })
    .sort()
    .value();
}

module.exports = LogEntry;
