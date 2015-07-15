var AmpersandState = require('ampersand-state');
var map = require('lodash.map');
var regret = require('./patterns');
var parseQuery = require('./parse-query');
var parseQueryShape = require('./parse-query-shape');
var parseOperationStats = require('./parse-operation-stats');
var debug = require('debug')('mongodb-log:model');

var OPS = 'command delete getmore query remove update'.split(' ');
var LEVEL_MAP = require('./level');

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
    }
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
    },
    query: {
      type: 'object'
    },
    comment: {
      type: 'object'
    },
    // var Shape = State.extend({
    //   query: {type: 'object'},
    //   sort: {type: 'object'}
    // });
    shape: {
      type: 'object'
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
    // @todo: deprecate this shit...
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
          var match = regret('connection.accept', this.message);
          // connection accepted format
          if (match) {
            return 'conn' + match._id;
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
      this.duration = parseInt(lastToken.substring(0, lastToken.length - 2), 10);
      this.operation = this.tokens[2];

      this.namespace = this.tokens[this.timestamp.split(' ').length + 2];

      var namespaceTokens = this.namespace.split('.');
      this.database = namespaceTokens[0];
      this.collection = namespaceTokens.slice(1).join('.');

      lastToken = namespaceTokens.slice(-1)[0];
      if (lastToken[0] === '$') {
        this.index = lastToken.substring(1);
      }

      var res = parseQuery(this.tokens, opTypeIndex + 2);
      this.query = res.query;
      this.comment = res.comment;

      this.shape = {
        sort: res.sortShape,
        query: parseQueryShape(res.query)
      };

      var stats = parseOperationStats(this.tokens, res.pos);
      if (stats) {
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
    map(this._children, function(value, key) {
      res[key] = this[key].serialize();
    }, this);
    res.tokens = undefined;
    return res;
  }
});

module.exports = LogEntry;
