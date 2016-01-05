'use strict';

var HalAffordanceFinder = require('./hal_affordance_finder');
var LinkParser = require('./link_parser');

/**
 * Browser for HAL responses.
 * @constructor
 */
var HalBrowser = function () {
  this.affordanceFinder = new HalAffordanceFinder();
  this.linkParser = new LinkParser();
  /** Body, e.g. as JSON, XML DOM, text */
  this.parsedBody = undefined;
  this.currentResponse = undefined;
};

/**
 * Gets parsed response body, e.g. JSON or XML-DOM
 * @returns {*}
 */
HalBrowser.prototype.responseBody = function () {
  return this.parsedBody;
};

/**
 * Gets HTTP response headers
 * @returns {*}
 */
HalBrowser.prototype.headers = function () {
  return this.currentResponse ? this.currentResponse.headers : undefined;
};

HalBrowser.prototype.getTypeMatcher = function () {
  return 'application/hal+json';
};

HalBrowser.prototype.getLinkRelMatchers = function () {
  return undefined;
};

HalBrowser.prototype.parse = function (response) {
  var self = this;

  self.currentResponse = response;

  return response.json()
    .then(function (json) {
      self.parsedBody = json;
      return response;
    });
};

/**
 * Finds affordance in current response.
 * @param {string} rel relation name
 * @param {string} currentUrl of response
 * @returns {Promise.<Affordance>} affordance, may be undefined
 */
HalBrowser.prototype.findAffordance = function (rel, currentUrl) {
  var self = this;
  return new Promise(function (resolve) {
    resolve(self.affordanceFinder.findAffordance(self.expandedBody, rel, currentUrl));
  });
};

/**
 * Checks if this browser can handle the given response.
 * @param {Response} response
 */
HalBrowser.prototype.supportsResponse = function (response) {
  var headers = response.headers;
  return this.supportsContentType(headers.get('Content-Type'))
    && this.linkRelMatches(headers.getAll('Link'));
};

HalBrowser.prototype.supportsContentType = function (contentType) {
  return contentType === this.getTypeMatcher();
};

/**
 * Checks if Link header matches. E.g. could check for the presence of a certain
 * profile rel or some other link header.
 * @param {string[]} linkHeaders
 */
HalBrowser.prototype.linkRelMatches = function (linkHeaders) {
  var linkRelMatchers = this.getLinkRelMatchers();
  if (!linkRelMatchers || linkRelMatchers.length === 0) {
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
    return true;
  }

};

module.exports = HalBrowser;
