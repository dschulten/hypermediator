'use strict';

var fetch = require('node-fetch');

function goFetch(url) {
  return fetch(url);
}
module.exports = goFetch;

