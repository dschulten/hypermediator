'use strict';

// based on http://bill.burkecentral.com/2009/10/15/parsing-link-headers-with-javascript-and-java/
// improvements: support for multiple rels

/**
 * Creates LinkParser for HTTP Link headers.
 * @constructor
 */
var LinkParser = function () {
  this.linkExpr = /<[^>]*>\s*(\s*;\s*[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*")))*(,|$)/g;
  this.paramExpr = /[^\(\)<>@,;:"\/\[\]\?={} \t]+=(([^\(\)<>@,;:"\/\[\]\?={} \t]+)|("[^"]*"))/g;

};

LinkParser.prototype.unquote = function (value) {
  if (value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
    return value.substring(1, value.length - 1);
  }
  return value;
};

LinkParser.prototype.parseLinkHeader = function (value) {
  var linksWithParams = value.match(this.linkExpr);
  var linkHeader = {};
  var i;
  var j;
  var k;

  for (i = 0; i < linksWithParams.length; i++) {
    var linkWithParams = linksWithParams[i].split('>');
    var href = linkWithParams[0].substring(1);
    var paramsString = linkWithParams[1];

    var link = {};
    var relationNames = [];
    var reverseRelationNames = [];
    link.href = href;

    var params = paramsString.match(this.paramExpr);
    for (j = 0; j < params.length; j++) {
      var param = params[j];
      var paramSplit = param.split('=');
      var name = paramSplit[0];
      var unquoted = this.unquote(paramSplit[1]);
      if (name === 'rel') {
        relationNames = unquoted.split(' ');
      } else if (name === 'rev') {
        reverseRelationNames = unquoted.split(' ');
      } else if (name === 'hreflang') {
        link.hreflang = link.hreflang || [];
        link.hreflang.push(unquoted);
      } else if (name === 'title*') {
        // parsers must ignore title* occurences after the first
        link['title*'] = link['title*'] || unquoted;
      } else {
        link[name] = unquoted;
      }
    }
    for (k = 0; k < relationNames.length; k++) {
      linkHeader.rels = linkHeader.rels || {};
      linkHeader.rels[relationNames[k]] = link;
    }
    for (k = 0; k < reverseRelationNames.length; k++) {
      linkHeader.revs = linkHeader.revs || {};
      linkHeader.revs[reverseRelationNames[k]] = link;
    }
  }
  return linkHeader;
};

module.exports = LinkParser;
