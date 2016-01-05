'use strict';

var fetchMock = require('fetch-mock');
var mockery = require('mockery');
fetchMock.useNonGlobalFetch(require('node-fetch'));

describe('fetch mockery', function () {


  beforeEach(function () {
    mockery.enable({useCleanCache: true});
    var myMock = fetchMock
      .mock('http://auth.service.com/user', '{"foo": 1}');
    mockery.registerMock('node-fetch', myMock.getMock());
  });

  afterEach(function () {
    fetchMock.restore();
    mockery.deregisterMock('node-fetch');
    mockery.disable();
  });

  it('should mock a request', function () {

    var goFetch = require('../lib/fetchsample');

    return goFetch('http://auth.service.com/user').then(function (response) {
      return response.json();
    }).then(function (json) {
      console.log(json);
    });
  });

});
