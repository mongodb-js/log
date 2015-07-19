var AmpersandState = require('ampersand-state');
var map = require('lodash.map');
var regret = require('./patterns');
var parseQuery = require('./parse-query');
var parseQueryShape = require('./parse-query-shape');
var parseOperationStats = require('./parse-operation-stats');
var debug = require('debug')('mongodb-log:model');
var format = require('util').format;
var trim = require('lodash.trim');

var OPS = 'command delete getmore query remove update'.split(' ');
var LEVEL_MAP = require('./level');

var LogEntry = AmpersandState.extend({
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
    stats: 'object',
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
      type: 'any'
    },
    // var Shape = State.extend({
    //   query: {type: 'object'},
    //   sort: {type: 'object'}
    // });
    shape: {
      type: 'object'
    },
    mapreduce: {
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
    var opTypeIndex = this.tokens.indexOf('[' + this.thread + ']') + 1;
    debug('operation', this.tokens[opTypeIndex]);
    if (OPS.indexOf(this.tokens[opTypeIndex]) > -1) {
      var lastToken = this.tokens.slice(-1)[0];
      this.duration = parseInt(lastToken.substring(0, lastToken.length - 2), 10);

      this.namespace = this.tokens[this.timestamp.split(' ').length + 2];
      var namespaceTokens = this.namespace.split('.');
      this.database = namespaceTokens[0];
      this.collection = namespaceTokens.slice(1).join('.');

      var res;
      if (this.tokens[opTypeIndex + 4] === 'mapreduce:') {
        this.operation = 'mapreduce';
        this.collection = this.tokens[opTypeIndex + 5].replace(/["|,]/g, '');
        this.namespace = format('%s.%s', this.database, this.collection);
        var mapIndex = opTypeIndex + 7;
        var reduceIndex = this.tokens.indexOf('reduce:');
        var verboseIndex = this.tokens.indexOf('verbose:');
        var queryIndex = this.tokens.indexOf('query:');

        this.mapreduce = {};
        this.mapreduce.map = trim(this.tokens.slice(mapIndex, reduceIndex).join(''), ',');
        this.mapreduce.reduce = trim(this.tokens.slice(reduceIndex + 1, verboseIndex).join(''), ',');
        this.mapreduce.verbose = Boolean(this.tokens.slice(verboseIndex + 1)[0].replace(',', ''));
        this.mapreduce.out = trim(this.tokens.slice(verboseIndex + 3, queryIndex).join(' '), ',');
        res = parseQuery(this.tokens, opTypeIndex + 2);
      } else {
        this.operation = this.tokens[opTypeIndex];
        res = parseQuery(this.tokens, opTypeIndex + 2);
      }
      debug('namespace', this.namespace);
      lastToken = namespaceTokens.slice(-1)[0];
      if (lastToken[0] === '$') {
        this.index = lastToken.substring(1);
      }
      debug('parse query returned', res);
      this.query = res.query;
      this.comment = res.comment;

      this.shape = {
        sort: res.sortShape,
        query: parseQueryShape(res.query)
      };

      var stats = parseOperationStats(this.tokens, res.pos);
      if (stats) {
        this.stats = stats;
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
    res.line = undefined;
    res.message = undefined;
    res.tokens = undefined;
    return res;
  }
});

module.exports = LogEntry;
