'use strict';

var Affordance = require('./affordance');

function HydraAffordanceFinder() {
}

/**
 * Finds affordance at rel in response.
 * @param {*} expandedBody response body
 * @param {string} rel link relation name
 * @returns {Affordance}
 */
HydraAffordanceFinder.prototype.findAffordance = function (expandedBody, rel) {

  var self = this;

  var objectAtRel = self.findObjectAtRel(expandedBody, rel);

  var href;
  // do not follow @id of members automatically
  if (rel !== 'http://www.w3.org/ns/hydra/core#member') {
    href = self.findHref(objectAtRel);
  } else {
    href = undefined;
  }
  return href ? new Affordance(href) : undefined;

};

/**
 * Finds object at rel in data.
 * @param {object} data prepared for lookup
 * @param {string} rel link relation name
 * @returns {object} object found at rel or undefined;
 */
HydraAffordanceFinder.prototype.findObjectAtRel = function (data, rel) {
  return data[rel] ? data[rel][0] : undefined;
};

/**
 * Finds href in object.
 * @param {object} objectAtRel
 * @returns {string|undefined} href or undefined
 */
HydraAffordanceFinder.prototype.findHref = function (objectAtRel) {
  return objectAtRel ? objectAtRel['@id'] : undefined;
};


module.exports = HydraAffordanceFinder;
