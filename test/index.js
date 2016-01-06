'use strict';

var assert = require('assert');
var Affordance = require('../lib/affordance');
var fetchMock = require('fetch-mock');
var mockery = require('mockery');
fetchMock.useNonGlobalFetch(require('node-fetch'));
var Symbol = require('es6-symbol');

describe('HyperMediator', function () {

  //this.timeout(5000);
  /**
   * @type HyperMediator
   */
  var hypermediator;

  beforeEach(function () {

    // define mock before loading hypermediator
    mockery.enable({
      warnOnUnregistered: false
    });
    var theFetchMock = fetchMock
      .mock('http://www.markus-lanthaler.com/hydra/event-api/',
        {
          body: {
            '@context': {
              hydra: 'http://www.w3.org/ns/hydra/core#',
              vocab: 'http://www.markus-lanthaler.com/hydra/event-api/vocab#',
              EntryPoint: 'vocab:EntryPoint',
              events: {
                '@id': 'vocab:EntryPoint/events',
                '@type': '@id'
              }
            },
            '@id': '/hydra/event-api/',
            '@type': 'EntryPoint',
            events: '/hydra/event-api/events/'
          },
          headers: {
            'Content-Type': 'application/ld+json',
            Link: '<http://api.example.com/doc/>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"'
          }
        }
      )
      .mock('http://www.markus-lanthaler.com/hydra/event-api/events/',
        {
          body: {
            '@context': {
              hydra: 'http://www.w3.org/ns/hydra/core#',
              vocab: 'http://www.markus-lanthaler.com/hydra/event-api/vocab#',
              EventCollection: 'vocab:EventCollection',
              members: 'http://www.w3.org/ns/hydra/core#member'
            },
            '@id': 'http://www.markus-lanthaler.com/hydra/event-api/events/',
            '@type': 'EventCollection',
            members: [
              {
                '@id': 'http://www.markus-lanthaler.com/hydra/event-api/events/38',
                '@type': 'http://schema.org/Event'
              },
              {
                '@id': 'http://www.markus-lanthaler.com/hydra/event-api/events/39',
                '@type': 'http://schema.org/Event'
              }
            ]
          },
          headers: {
            'Content-Type': 'application/ld+json',
            Link: '<http://api.example.com/doc/>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"'
          }
        }
      )
      .mock('http://www.markus-lanthaler.com/hydra/event-api/events/38', 404)
      .mock('http://www.markus-lanthaler.com/hydra/event-api/events/39',
        {
          body: {
            '@context': {
              '@vocab': 'http://schema.org/',
              hydra: 'http://www.w3.org/ns/hydra/core#'
            },
            '@id': '/hydra/event-api/events/39',
            '@type': 'Event',
            name: 'James Bond 007 - Spectre',
            location: {
              '@type': 'Place',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Denver',
                addressRegion: 'CO',
                postalCode: '80209',
                streetAddress: '7 S. Broadway'
              },
              name: 'The Hi-Dive'
            },
            description: 'Movie'
          },
          headers: {
            'Content-Type': 'application/ld+json',
            Link: '<http://api.example.com/doc/>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"'
          }
        }
      );

    mockery.registerMock('node-fetch', theFetchMock.getMock());

    // now we can require HyperMediator so that it loads fetch-mock for node-fetch
    var HyperMediator = require('../lib/');
    hypermediator = new HyperMediator('http://www.markus-lanthaler.com/hydra/event-api/');

  });

  afterEach(function () {
    fetchMock.restore();
    mockery.deregisterMock('node-fetch');
    mockery.disable();
  });


  it('should get the entrypoint', function () {

    return hypermediator.get()
      .then(function (entryPoint) {
        var body = entryPoint.responseBody();
        assert.equal(body['@type'], 'http://www.markus-lanthaler.com/hydra/event-api/vocab#EntryPoint');
      });
  });


  it('should get rel from entrypoint', function () {
    return hypermediator.get('http://www.markus-lanthaler.com/hydra/event-api/vocab#EntryPoint/events')
      .then(function (events) {
        var body = events.responseBody();
        assert.equal(body['@type'], 'http://www.markus-lanthaler.com/hydra/event-api/vocab#EventCollection');
      });
  });

  it('should ignore links in hydra:member items', function () {
    return hypermediator.get('http://www.markus-lanthaler.com/hydra/event-api/vocab#EntryPoint/events')
      .then(function (events) {
        // not a single link
        return events.get('http://www.w3.org/ns/hydra/core#member');
      })
      .then(function (events) {
        // ensure that no transition to member's @id took place
        var body = events.responseBody();
        assert.equal(body['@type'], 'http://www.markus-lanthaler.com/hydra/event-api/vocab#EventCollection');
      });
  });

  it('should iterate over collection, dereferencing links', function () {
    return hypermediator.get('http://www.markus-lanthaler.com/hydra/event-api/vocab#EntryPoint/events')
      .then(function (eventCollection) {

        return Promise.all(eventCollection).then(function (items) {
          var first = items[0].responseBody();
          assert.equal(first['@id'], 'http://www.markus-lanthaler.com/hydra/event-api/events/38');
          assert.equal(first['@type'][0], 'http://schema.org/Event');

          var second = items[1].responseBody();
          assert.equal(second['@type'][0], 'http://schema.org/Event');
          assert.equal(second['@id'], 'http://www.markus-lanthaler.com/hydra/event-api/events/39');
          assert.equal(second['http://schema.org/name'][0]['@value'], 'James Bond 007 - Spectre');
          assert.equal(second['http://schema.org/location'][0]['http://schema.org/name'][0]['@value'], 'The Hi-Dive');
        });
      });
  });


  it('should return link if item does not dereference', function () {
    return hypermediator.get('http://www.markus-lanthaler.com/hydra/event-api/vocab#EntryPoint/events')
      .then(function (eventCollection) {
        var eventIterator = eventCollection[Symbol.iterator]();
        return eventIterator.next().value.then(function (eventItem) {
          var body = eventItem.responseBody();
          assert.equal(body['@type'][0], 'http://schema.org/Event');
          assert.equal(body['@id'], 'http://www.markus-lanthaler.com/hydra/event-api/events/38');
          assert.equal(body['http://schema.org/name'], undefined);
        });
      });
  });


  it('should resolve absolute-path URLs', function () {
    return hypermediator.get().then(function () {
      var absoluteUrl = hypermediator.absoluteUrl(new Affordance('/foo'));
      assert.equal(absoluteUrl, 'http://www.markus-lanthaler.com/foo');
    });
  });

  it('should resolve relative URLs', function () {
    return hypermediator.get().then(function () {
      var absoluteUrl = hypermediator.absoluteUrl(new Affordance('foo'));
      assert.equal(absoluteUrl, 'http://www.markus-lanthaler.com/hydra/event-api/foo');
    });
  });

});
