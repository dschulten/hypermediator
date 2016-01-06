'use strict';

var HydraAffordanceFinder = require('./hydra_affordance_finder');
var LinkParser = require('./link_parser');
var jsonld = require('jsonld');
var Symbol = require('es6-symbol');

/**
 * Browser for Hydra responses.
 * @constructor
 */
var HydraBrowser = function () {
  this.affordanceFinder = new HydraAffordanceFinder();
  this.linkParser = new LinkParser();
  /** Body, e.g. as JSON, XML DOM, text */
  this.parsedBody = undefined;
  this.expandedBody = undefined;
  this.currentResponse = undefined;
};

/**
 * Gets parsed response body, e.g. JSON or XML-DOM
 * @returns {*}
 */
HydraBrowser.prototype.responseBody = function () {
  return this.expandedBody;
};

/**
 * Gets HTTP response headers
 * @returns {*}
 */
HydraBrowser.prototype.headers = function () {
  return this.currentResponse ? this.currentResponse.headers : undefined;
};

HydraBrowser.prototype.getTypeMatcher = function () {
  return 'application/ld+json';
};

HydraBrowser.prototype.getLinkRelMatchers = function () {
  return {
    'http://www.w3.org/ns/hydra/core#apiDocumentation': '*'
  };
};

HydraBrowser.prototype.hasData = function () {
  var key;
  var ret;
  var item = this.expandedBody;
  for (key in item) {
    if (item.hasOwnProperty(key)) {
      if (!(key.indexOf('@') === 0)) {
        ret = true;
        break;
      }
    }
  }
  return ret || false;
};


HydraBrowser.prototype[Symbol.iterator] = function () {
  var members = this.expandedBody['http://www.w3.org/ns/hydra/core#member'];
  var self = this;
  if (members) {
    return {
      currentIndex: 0,
      next: function () {
        var item;
        var done = false;
        // TODO remove handling of single item if we stick to expanded
        if (members instanceof Array && members.length > this.currentIndex) {
          item = members[this.currentIndex++];
        } else if (!(members instanceof Array) && this.currentIndex === 0) {
          item = members;
          this.currentIndex++;
        } else {
          done = true;
        }
        return {value: item, done: done};
      },
      hasData: function () {
        var key;
        var ret;
        var item = members[this.currentIndex - 1];
        for (key in item) {
          if (item.hasOwnProperty(key)) {
            if (!(key.indexOf('@') === 0)) {
              ret = true;
              break;
            }
          }
        }
        return ret || false;
      },
      selfRel: function (item) {
        return self.affordanceFinder.findHref(item);
      }
    };
  } else {
    // no members
    return this.eol;
  }
};

HydraBrowser.prototype.parse = function (response, baseUrl) {
  var self = this;

  self.currentResponse = response;

  return response.json()
    .then(function (json) {
      self.parsedBody = json;
      return jsonld.promises.expand(json, {base: baseUrl})
        .then(function (compactedBody) {
          self.expandedBody = compactedBody[0];
          return response;
        });
    });
};

HydraBrowser.prototype.adoptBody = function (body) {
  this.parsedBody = body;
  this.expandedBody = body;
};

/**
 * Finds affordance in current response.
 * @param {string} rel relation name
 * @param {string} currentUrl of response
 * @returns {Promise.<Affordance>} affordance, may be undefined
 */
HydraBrowser.prototype.findAffordance = function (rel, currentUrl) {
  // TODO: prefix IANA rels with IANA prefix
  var self = this;
  return new Promise(function (resolve) {
    resolve(self.affordanceFinder.findAffordance(self.expandedBody, rel, currentUrl));
  });
};

/**
 * Checks if this browser can handle the given response.
 * @param {Response} response
 */
HydraBrowser.prototype.supportsResponse = function (response) {
  var headers = response.headers;
  return this.supportsContentType(headers.get('Content-Type'))
    && this.linkRelMatches(headers.getAll('Link'));
};

HydraBrowser.prototype.supportsContentType = function (contentType) {
  return contentType === this.getTypeMatcher();
};

/**
 * Checks if Link header matches. E.g. could check for the presence of a certain
 * profile rel or some other link header.
 * @param {string[]} linkHeaders
 */
HydraBrowser.prototype.linkRelMatches = function (linkHeaders) {
  var linkRelMatchers = this.getLinkRelMatchers();
  if (!linkRelMatchers) {
    return true;
  } else {
    var i;
    var len = linkHeaders.length;
    for (i = 0; i < len; i++) {
      var parsedLinkHeader = this.linkParser.parseLinkHeader(linkHeaders[i]);
      var rel;
      for (rel in linkRelMatchers) {
        if (linkRelMatchers.hasOwnProperty(rel)) {
          var link = parsedLinkHeader.rels[rel];
          var supportedValue = linkRelMatchers[rel];
          if (link && (supportedValue === '*' || link.href === supportedValue)) {
            return true;
          }
        }
      }
    }
    return false;
  }
};


module.exports = HydraBrowser;
