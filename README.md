# hypermediator [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> Generic hypermedia client

## Installation

```sh
$ npm install --save hypermediator
```

If you are running in a browser, include whatwg-fetch for http requests.

```sh
$ npm install --save whatwg-fetch
```

If your are running in a node environment, include node-fetch.
```sh
$ npm install --save node-fetch
```

## Usage

```js
var Hypermediator = require('hypermediator');

new HyperMediator('');
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
