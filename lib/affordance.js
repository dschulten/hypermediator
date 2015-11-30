'use strict';

/**
 * Hypermedia affordance.
 * @param href {string} hyperlink of affordance
 * @constructor
 */
function Affordance(href) {
  if (!href) {
    throw new Error('href must have a value');
  }
  this.href = href;
}

module.exports = Affordance;
