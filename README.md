# babel-plugin-handlebars-inline-precompile

Precompile inline Handlebars templates.

## Example

**In**

```js
import hbs from 'handlebars-inline-precompile';

hbs`Hello World!`;
```

**Out**

```js
import _Handlebars from 'handlebars/runtime';

_Handlebars.template({ /* A bunch of crazy template stuff */ })
```

## Installation

```sh
$ npm install babel-plugin-handlebars-templates
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

```json
{
  "plugins": ["handlebars-templates"]
}
```

### Via CLI

```sh
$ babel --plugins handlebars-templates script.js
```

### Via Node API

```javascript
require("babel-core").transform("code", {
  plugins: ["handlebars-templates"]
});
```
