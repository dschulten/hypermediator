# hypermediator [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Generic hypermedia client with support for hydra

## Installation

```sh
$ npm install --save hypermediator
```

If you are running in a browser, include whatwg-fetch for http requests.

```sh
$ npm install --save whatwg-fetch
```

If you are running in a node environment, include node-fetch.
```sh
$ npm install --save node-fetch
```

## Usage

```js
var HyperMediator = require('hypermediator');

var hyperMediator = new HyperMediator('<url to api entry point>');

// access related resource
hyperMediator.get('<first link relation>').then(function(firstHop) {
    var responseBody = firstHop.responseBody();
    return firstHop.get('<second link relation>');
  })
  .then(function(secondHop) {
    var responseBody = secondHop.responseBody();
  };
});

// iterate over collection
hypermediator.get('<collection link relation>')
  .then(function (collection) {
    Promise.all(collection).then(function (items) {
      // work with items array
    });
  });
```
## License

Apache-2.0 © [Dietrich Schulten](https://github.com/dschulten)


[npm-image]: https://badge.fury.io/js/hypermediator.svg
[npm-url]: https://npmjs.org/package/hypermediator
[travis-image]: https://travis-ci.org/dschulten/hypermediator.svg?branch=master
[travis-url]: https://travis-ci.org/dschulten/hypermediator
[daviddm-image]: https://david-dm.org/dschulten/hypermediator.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/dschulten/hypermediator
[coveralls-image]: https://coveralls.io/repos/dschulten/hypermediator/badge.svg
[coveralls-url]: https://coveralls.io/r/dschulten/hypermediator
