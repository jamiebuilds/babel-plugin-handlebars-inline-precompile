'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _handlebarsRuntime = require('handlebars/runtime');

var _handlebarsRuntime2 = _interopRequireDefault(_handlebarsRuntime);

_handlebarsRuntime2['default'].template({
  'compiler': [6, '>= 2.0.0-beta.1'],
  'main': function main(depth0, helpers, partials, data) {
    return 'Hello World!';
  },
  'useData': true
});
