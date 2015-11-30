'use strict';

var assert = require('assert');
var LinkParser = require('../lib/link_parser');

describe('LinkParser', function () {

  var linkParser = new LinkParser();


  it('should parse link with extension rel', function () {
    var linkHeader = '<http://api.example.com/doc/>; rel="http://www.w3.org/ns/hydra/core#apiDocumentation"';
    var parsed = linkParser.parseLinkHeader(linkHeader);
    assert.equal(parsed.rels['http://www.w3.org/ns/hydra/core#apiDocumentation'].href, 'http://api.example.com/doc/');
  });


  it('should parse link with title', function () {
    var linkHeader = '<http://example.com/TheBook/chapter2>; rel="previous"; title="previous chapter"';
    var parsed = linkParser.parseLinkHeader(linkHeader);
    var linkPrevious = parsed.rels.previous;
    assert.equal(linkPrevious.href, 'http://example.com/TheBook/chapter2');
    assert.equal(linkPrevious.title, 'previous chapter');
  });

  it('should parse link with hreflang', function () {
    var linkHeader = '<http://example.com/TheBook/chapter2>; rel="previous"; hreflang="de"; hreflang="jp"';
    var parsed = linkParser.parseLinkHeader(linkHeader);
    var linkPrevious = parsed.rels.previous;
    assert.equal(linkPrevious.href, 'http://example.com/TheBook/chapter2');
    assert.deepEqual(linkPrevious.hreflang, ['de', 'jp']);
  });

  it('should parse link with multiple rels', function () {
    var linkHeader = '<http://example.org/>; rel="start http://example.net/relation/other"';
    var parsed = linkParser.parseLinkHeader(linkHeader);
    assert.equal(parsed.rels.start.href, 'http://example.org/');
    assert.equal(parsed.rels['http://example.net/relation/other'].href, 'http://example.org/');
  });


  it('should parse multi-link header', function () {
    var linkHeader = '</TheBook/chapter2>;rel="previous"; title*=UTF-8\'de\'letztes%20Kapitel,</TheBook/chapter4>;rel="next"; title*=UTF-8\'de\'n%c3%a4chstes%20Kapitel';
    var parsed = linkParser.parseLinkHeader(linkHeader);
    var linkPrevious = parsed.rels.previous;
    assert.equal(linkPrevious.href, '/TheBook/chapter2');
    assert.equal(linkPrevious['title*'], 'UTF-8\'de\'letztes%20Kapitel');

    var linkNext = parsed.rels.next;
    assert.equal(linkNext.href, '/TheBook/chapter4');
    assert.equal(linkNext['title*'], 'UTF-8\'de\'n%c3%a4chstes%20Kapitel');
  });


});


