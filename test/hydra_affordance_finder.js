'use strict';

var assert = require('assert');
var HydraAffordanceFinder = require('../lib/hydra_affordance_finder');

describe('HydraAffordanceFinder', function () {

  var affordanceFinder = new HydraAffordanceFinder();

  var currentResource = {
    '@type': 'http://schema.org/CafeOrCoffeeShop',
    'http://schema.org/name': 'Kaffeehaus Hagen',
    'http://schema.org/address': {'@id': '/address'}
  };

  it('should provide affordance for rel', function () {
    var affordance = affordanceFinder.findAffordance(currentResource, 'http://schema.org/address');
    assert.equal(affordance.href, '/address');
  });

});
