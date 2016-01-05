'use strict';

// TODO make this dynamic for node or browser, use SystemJS for that?
// fetch browser polyfill: https://github.com/github/fetch
// var fetch = require('fetch');
var fetch = require('node-fetch');
var HydraBrowser = require('./hydra_browser');
var HalBrowser = require('./hal_browser');
var Symbol = require('es6-symbol');


/**
 * Creates HyperMediator instance.
 * @param {string} entryPoint url of the API
 * @constructor
 */
function HyperMediator(entryPoint) {
  var indexResource = entryPoint;
  var browsers = [new HydraBrowser(), new HalBrowser()];
  var currentUrl;
  var currentBrowser;

  /**
   * Chooses browser and stores it as current browser for subsequent operations on the response.
   * @param {Response} response
   * @param {string} url of the response
   */
  this.chooseBrowser = function (response, url) {

    var i;
    var len = browsers.length;
    var supportingBrowser;
    for (i = 0; i < len; i++) {
      var browser = browsers[i];
      if (browser.supportsResponse(response)) {
        supportingBrowser = browser;
        break;
      }
    }
    if (supportingBrowser === null) {
      throw new Error('no suitable browser found for ' + url);
    }
    currentBrowser = supportingBrowser;
  };

  this.getCurrentBrowser = function () {
    return currentBrowser;
  };

  this.getCurrentUrl = function () {
    return currentUrl;
  };

  this.setCurrentBrowser = function (browser) {
    currentBrowser = browser;
  };

  this.setCurrentUrl = function (url) {
    currentUrl = url;
  };

  this.getEntryPoint = function () {
    return indexResource;
  };

  /**
   * Visits resource and, if successful, creates a current browser for it.
   * @param {string} url of the resource
   * @returns {Promise.<Response>} promise of response
   */
  this.visitResource = function (url) {
    var self = this;
    return fetch(url)
      .then(self.checkStatus)
      .then(function (response) {
        self.chooseBrowser(response, url);
        return currentBrowser.parse(response, url);
      })
      .then(function (response) {
        currentUrl = url;
        return response;
      }).catch(function (error) {
        console.log(error.stack);
      });
  };

  /**
   * Checks HTTP status and throws Error for client and server errors.
   * @param response to check
   * @returns {*}
   */
  this.checkStatus = function (response) {
    if (response.status >= 200 && response.status < 300) {
      return response;
    } else {
      var error = new Error(response.statusText);
      error.response = response;
      throw error;
    }
  };

  /**
   * Ensures that url is absolute.
   * @param {Affordance} affordance with url to make absolute if necessary
   * @returns {string} absolute url or undefined
   */
  this.absoluteUrl = function (affordance) {
    if (!affordance) {
      return undefined;
    }
    var url = affordance.href;
    if (url.indexOf('http:') !== 0 && url.indexOf('https:') !== 0) {
      if (url.charAt(0) === '/') {
        var parsedUri = this.parseUri(currentUrl);
        url = parsedUri.protocol + '://' + parsedUri.authority + (parsedUri.port ? ':' + parsedUri.port : '') + url;
      } else {
        url = currentUrl + url;
      }
    }
    return url;
  };


  this.parseUri = function (str) {
    // parseUri 1.2.2
    // (c) Steven Levithan <stevenlevithan.com>
    // MIT License
    var o = {
      strictMode: true,
      key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
      q: {
        name: 'queryKey',
        parser: /(?:^|&)([^&=]*)=?([^&]*)/g
      },
      parser: {
        strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
        loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
      }
    };
    var m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
    var uri = {};
    var i = 14;

    while (i--) {
      uri[o.key[i]] = m[i] || '';
    }

    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) {
        uri[o.q.name][$1] = $2;
      }
    });

    return uri;
  };

  this.headers = function () {
    return currentBrowser ? currentBrowser.headers() : undefined;
  };

  this.responseBody = function () {
    return currentBrowser ? currentBrowser.responseBody() : undefined;
  };

}

HyperMediator.prototype[Symbol.iterator] = function () {
  var self = this;
  return {
    iteratorDelegate: self.getCurrentBrowser() ? this.getCurrentBrowser()[Symbol.iterator]() : undefined,
    next: function () {
      if (this.iteratorDelegate) {
        var iterated = this.iteratorDelegate.next();
        if (iterated.value === undefined && iterated.done) {
          return iterated;
        } else {
          // create HyperMediator with item as entrypoint, may be dereferenced later using get()
          // TODO use factory method for this:
          // provide browser with item as body for mediatype from current browser
          var itemBrowser = Object.create(self.getCurrentBrowser());
          itemBrowser.adoptBody(iterated.value);
          // pre-initialize hypermediator
          var hypermediator = new HyperMediator(this.iteratorDelegate.selfRel(iterated.value));
          hypermediator.setCurrentBrowser(itemBrowser);
          hypermediator.setCurrentUrl(hypermediator.getEntryPoint());
          return {value: hypermediator, done: false};
        }
      } else {
        return {value: undefined, done: true};
      }
    }
  };
};

/**
 * Dereferences URL with given link relation type (RFC-5988) in the current response.
 * If the link relation type cannot be found or has no single href, nothing will be
 * dereferenced and the current state remains unchanged.
 * @param {string} rel registered IANA relation type or extension relation type.
 * @returns {HyperMediator} hypermediator containing the new response or the previous response if the rel did not resolve
 */
HyperMediator.prototype.get = function (rel) {
  var self = this;
  var affordancePromise;
  if (!self.getCurrentBrowser() || !self.getCurrentBrowser().hasData()) {
    affordancePromise = self.visitResource(self.getEntryPoint())
      .then(function () {
        return self.getCurrentBrowser().findAffordance(rel, self.getCurrentUrl());
      });
  } else {
    affordancePromise = self.getCurrentBrowser().findAffordance(rel, self.getCurrentUrl());
  }
  return affordancePromise.then(function (affordance) {
      var url = self.absoluteUrl(affordance);
      if (url) {
        return self.visitResource(url)
          .then(function () {
            return self;
          });
      } else {
        return self;
      }
    })
    .catch(function (error) {
      console.log(error.stack);
    });
};


module.exports = HyperMediator;
