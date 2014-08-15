var JSONL = require('json-literal'),
  debug = require('debug')('mongodb-log:query-shape');

var OPERATORS = [
  '$exists', '$gt', '$gte', '$in', '$lt', '$lte', '$nin', '$regex'
];

// convert objects to flat string
// don't want the newlines and extra spaces from JSON.stringify
// e.g. {"mongoscope_feature":"get instance collections"} ->
//      "{ mongoscope_feature: \"get instance collections\" }"
function flatJson(obj) {
  return JSON.stringify(obj, null, ' ').split(/\s+/).join(' ');
}

module.exports = function(entry){
  if(!entry.query) return;

  var queryObject;
  try {
    queryObject = JSONL.parse(entry.query);
  } catch (e) {
    debug('Could not parse literal json %s. error: %s', entry.query, e);
    return;
  }
  entry.queryShape = parseQueryShapeObject(queryObject);
  this.queryPattern = this.namespace + ' ' + flatJson(this.queryShape);
};

function parseQueryShapeObject(obj) {
  var objCopy = JSON.parse(JSON.stringify(obj));

  var value;
  for (var key in obj) {
    value = obj[key];
    if (OPERATORS.indexOf(key) > -1) return 1;

    if (Array.isArray(value)){
      objCopy[key] = parseQueryShapeArray(value);
    }
    else if (typeof value === 'object' && !(value instanceof RegExp)){
      objCopy[key] = parseQueryShapeObject(value);
    }
    else{
      objCopy[key] = 1;
    }
  }
  return obj;
}

function parseQueryShapeArray(value) {
  var el;
  for (var i = 0; i < value.length; i++) {
    el = value[i];
    if (Array.isArray(el)){
      parseQueryShapeArray(el);
    }
    else if (typeof el === 'object') {
      parseQueryShapeObject(el);
    }
  }
  return value.sort();
}
