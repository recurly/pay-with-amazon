;(function(){

/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("pay-with-amazon/index.js", function(exports, require, module){
/**
 * exports
 */

module.exports = payWithAmazon;

/**
 * Off Amazon Payments wrapper
 *
 * order of operations
 *
 *   button -> address book -> wallet -> consent
 *
 * example
 *
 *   payWithAmazon({
 *     sellerId: 'abc',
 *     clientId: 'xyz',
 *     targets: {
 *       button: 'pay-with-amazon',
 *       addressBook: 'address-book',
 *       wallet: 'wallet',
 *       consent: 'consent'
 *     }
 *   });
 *
 * TODO
 * 
 *   - proper error handling
 *   - add events
 *   - configurable widget sizing
 *   - config defaults
 *   - use bind shim
 *
 * @param {Object} opts
 * @param {String} opts.sellerId
 * @param {String} opts.clientId
 * @param {Object} opts.targets
 * @param {String} opts.targets.button
 * @param {String} opts.targets.addressBook
 * @param {String} opts.targets.wallet
 * @param {String} opts.targets.consent
 */

function payWithAmazon (opts) {
  if (!(this instanceof payWithAmazon)) return new payWithAmazon(opts);

  this.configure(opts);

  this.billingAgreementId = null;
  this.consentStatus = false;
  this.widgets = {};

  document.write('<script src="'
    + 'https://static-na.payments-amazon.com/OffAmazonPayments'
    + '/us/sandbox/js/Widgets.js?sellerId='
    + this.config.sellerId
    + '"></script>');

  window.onAmazonLoginReady = this.init.bind(this);
}

payWithAmazon.prototype.configure = function (opts) {
  if (!(typeof opts === 'object')) throw new Error ('opts must be provided as an object.');
  if (!opts.sellerId) throw new Error('opts.sellerId required.');
  if (!opts.clientId) throw new Error('opts.clientId required.');

  opts.addressBookDimensions = {
    size: { width: '400px', height: '260px' }
  };

  opts.walletDimensions = {
    size: { width: '400px', height: '260px' }
  };

  opts.consentDimensions = {
    size : { width: '400px', height: '140px' }
  };

  this.config = opts;
};

payWithAmazon.prototype.error = function (err) {
  console.error(err, err.getErrorCode(), err.getErrorMessage());
};

payWithAmazon.prototype.init = function () {
  window.amazon.Login.setClientId(this.config.clientId);

  var self = this;
  var pollId = setInterval(poll, 200);

  function poll () {
    if (!window.OffAmazonPayments.Button) return;
    clearTimeout(pollId);
    self.initLogin();
  }
};

payWithAmazon.prototype.initLogin = function () {
  var self = this;

  this.widgets.button = new OffAmazonPayments.Button(this.config.targets.button, this.config.sellerId, {
    type: 'PwA',
    authorization: function () {
      var opts = {
        scope: 'profile payments:widget payments:shipping_address',
        popup: true
      };

      amazon.Login.authorize(opts, function (res) {
        if (res.error) return self.error(res.error);
        self.initAddressBook();
      });
    },
    onError: this.error
  });
};

payWithAmazon.prototype.initAddressBook = function () {
  this.widgets.addressBook = new OffAmazonPayments.Widgets.AddressBook({
    agreementType: 'BillingAgreement',
    sellerId: this.config.sellerId,
    onReady: this.setBillingAgreementId.bind(this),
    onAddressSelect: this.initWallet.bind(this),
    design: this.config.addressBookDimensions,
    onError: this.error
  }).bind(this.config.targets.addressBook);
};

payWithAmazon.prototype.initWallet = function (ref) {
  this.widgets.wallet = new OffAmazonPayments.Widgets.Wallet({
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: this.config.walletDimensions,
    onPaymentSelect: this.initConsent.bind(this),
    onError: this.error
  }).bind(this.config.targets.wallet);
};

payWithAmazon.prototype.initConsent = function (ref) {
  this.widgets.consent = new OffAmazonPayments.Widgets.Consent({
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: this.config.consentDimensions,
    onReady: this.setConsentStatus.bind(this),
    onConsent: this.setConsentStatus.bind(this),
    onError: this.error
  }).bind(this.config.targets.consent);
};

payWithAmazon.prototype.setBillingAgreementId = function (ref) {
  this.billingAgreementId = ref.getAmazonBillingAgreementId();
};

payWithAmazon.prototype.setConsentStatus = function (amazonConsentStatus) {
  this.consentStatus = amazonConsentStatus.getConsentStatus();
};

});
require.alias("pay-with-amazon/index.js", "pay-with-amazon/index.js");if (typeof exports == "object") {
  module.exports = require("pay-with-amazon");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("pay-with-amazon"); });
} else {
  this["payWithAmazon"] = require("pay-with-amazon");
}})();