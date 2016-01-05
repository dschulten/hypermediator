'use strict';
var Affordance = require('./affordance');

function HalAffordanceFinder() {
}

/**
 * Finds affordance at rel in response.
 * @param {*} body response body
 * @param {string} rel link relation name
 * @returns {Affordance}
 */
HalAffordanceFinder.prototype.findAffordance = function (body, rel) {

  var self = this;

  var objectAtRel = self.findObjectAtRel(body, rel);

  var href;
  href = self.findHref(objectAtRel);
  return href ? new Affordance(href) : undefined;

};

/**
 * Finds object at rel in data.
 * @param {object} data prepared for lookup
 * @param {string} rel link relation name
 * @returns {object} object found at rel or undefined;
 */
HalAffordanceFinder.prototype.findObjectAtRel = function (data, rel) {
  var links = '_links';
  return data[links] ? data[links][rel] : undefined;
};

/**
 * Finds href in object.
 * @param {object} objectAtRel
 * @returns {string|undefined} href or undefined
 */
HalAffordanceFinder.prototype.findHref = function (objectAtRel) {
  return objectAtRel ? objectAtRel.href : undefined;
};


module.exports = HalAffordanceFinder;
