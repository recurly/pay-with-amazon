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
require.register("component-emitter/index.js", function(exports, require, module){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

});
require.register("component-bind/index.js", function(exports, require, module){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

});
require.register("pay-with-amazon/index.js", function(exports, require, module){
'use strict';

/**
 * Dependencies
 */

var Emitter = require('emitter');
var bind = require('bind');

/**
 * Exports
 */

module.exports = PayWithAmazon;

/**
 * Off Amazon Payments wrapper
 *
 * order of operations
 *
 *   button -> address book -> wallet -> consent
 *
 * example
 *
 *   new PayWithAmazon({
 *     sellerId: 'abc',
 *     clientId: 'xyz',
 *     button: { id: 'pay-with-amazon' },
 *     addressBook: { id: 'address-book' [, width: 400 [, height: 260]]},
 *     wallet: { id: 'wallet' [, width: 400 [, height: 260]]},
 *     consent: { id: 'consent' [, width: 400 [, height: 140]]}
 *   });
 *
 * @param {Object} opts
 * @param {String} opts.sellerId
 * @param {String} opts.clientId
 * @param {Object|String} opts.button if string, sets opts.button.id
 * @param {String} opts.button.id
 * @param {String} [opts.button.type] 'large' (default), 'small'
 * @param {String} [opts.button.color] 'Gold' (default), 'LightGray', 'DarkGray'
 * @param {Object|String} opts.wallet
 * @param {String} opts.wallet.id
 * @param {Number} [opts.wallet.width]
 * @param {Number} [opts.wallet.height]
 * @param {Object|String} [opts.addressBook]
 * @param {String} opts.addressBook.id
 * @param {Number} [opts.addressBook.width]
 * @param {Number} [opts.addressBook.height]
 * @param {Object|String} opts.consent
 * @param {String} opts.consent.id
 * @param {Number} [opts.consent.width]
 * @param {Number} [opts.consent.height]
 */

function PayWithAmazon (opts) {
  if (!(this instanceof PayWithAmazon)) return new PayWithAmazon(opts);

  this.configure(opts);

  this.billingAgreementId = null;
  this.consent = undefined;
  this.widgets = {};
  this._status = this.status();

  this.setBillingAgreementId = bind(this, this.setBillingAgreementId);
  this.initWallet = bind(this, this.initWallet);
  this.initConsent = bind(this, this.initConsent);
  this.setConsent = bind(this, this.setConsent);
  this.error = bind(this, this.error);
  this.init = bind(this, this.init);

  if ('window.OffAmazonPayments' in window) {
    this.init();
  } else {
    document.write('<script src="'
      + 'https://static-na.payments-amazon.com/OffAmazonPayments'
      + '/us/sandbox/js/Widgets.js?sellerId='
      + this.config.sellerId
      + '"></script>');

    window.onAmazonLoginReady = this.init;
  }

  return this;
}

/**
 * PayWithAmazon inherits Emitter
 */

Emitter(PayWithAmazon.prototype);

/**
 * Configures the instance based on passed `opts`
 *
 * Throws errors if the opts are insufficient to configure the instance,
 * and sets defaults for those not specified.
 *
 * See initializer for description of `opts`
 */

PayWithAmazon.prototype.configure = function (opts) {
  if (typeof opts !== 'object') throw new Error ('opts must be provided as an object.');

  if (!opts.sellerId) throw new Error('opts.sellerId is required.');
  if (!opts.clientId) throw new Error('opts.clientId is required.');
  if (!opts.button) throw new Error('opts.button is required.');
  if (!opts.wallet) throw new Error('opts.wallet is required.');
  if (!opts.consent) throw new Error('opts.consent is required.');

  if (typeof opts.button === 'string') opts.button = { id: opts.button };
  if (typeof opts.wallet === 'string') opts.wallet = { id: opts.wallet };
  if (typeof opts.consent === 'string') opts.consent = { id: opts.consent };
  if (typeof opts.addressBook === 'string') opts.addressBook = { id: opts.addressBook };

  opts.button.type = opts.button.type === 'small' ? 'Pay' : 'PwA';
  opts.button.color = opts.button.color || 'Gold';

  opts.wallet.width = (opts.wallet.width || 400) + 'px';
  opts.wallet.height = (opts.wallet.height || 260) + 'px';

  opts.consent.width = (opts.consent.width || 400) + 'px';
  opts.consent.height = (opts.consent.height || 140) + 'px';

  if (opts.addressBook) {
    opts.addressBook.width = (opts.addressBook.width || 400) + 'px';
    opts.addressBook.height = (opts.addressBook.height || 260) + 'px';
  }

  this.config = opts;
};

/**
 * Initialized the Amazon plugin
 *
 * Sets the client ID then waits for the widget classes to load
 * before initializing the login button.
 */

PayWithAmazon.prototype.init = function () {
  window.amazon.Login.setClientId(this.config.clientId);

  var self = this;
  var pollId = setInterval(poll, 200);

  function poll () {
    if (!window.OffAmazonPayments.Button) return;
    clearTimeout(pollId);
    self.initButton();
  }
};

/**
 * Returns an object describing the customer state
 *
 * @return {Object} customer state
 */

PayWithAmazon.prototype.status = function () {
  var id = this.billingAgreementId;
  var consent = this.consent;
  var status = {};

  if (!id) {
    status.error = 'Billing agreement ID has not been set.';
  }

  if (consent !== undefined) {
    status.consent = consent;
  }

  if (consent === undefined) {
    status.error = 'Billing consent not yet given.';
  } else if (!consent) {
    status.error = 'Billing consent not given.';
  }

  if (!status.error) {
    status.id = id;
  }

  return status;
};

/**
 * Emits the 'change' event if the customer status has changed
 */

PayWithAmazon.prototype.check = function () {
  var status = this.status();
  if (JSON.stringify(status) !== JSON.stringify(this._status)) {
    this._status = status;
    this.emit('change', status);
  }
};

/**
 * Initializes the login button
 */

PayWithAmazon.prototype.initButton = function () {
  var self = this;
  var type = this.config.button.type;
  var color = this.config.button.color;

  this.widgets.button = new window.OffAmazonPayments.Button(this.config.button.id, this.config.sellerId, {
    type: type,
    color: color,
    authorization: function () {
      var opts = {
        scope: 'profile payments:widget payments:shipping_address',
        popup: true
      };

      window.amazon.Login.authorize(opts, function (res) {
        if (res.error) return self.error(res.error);
        self.initAddressBook();
      });
    },
    onError: this.error
  });
};

/**
 * Initializes the Address Book widget
 */

PayWithAmazon.prototype.initAddressBook = function () {
  if (!this.config.addressBook) return this.initWallet();

  var opts = {
    agreementType: 'BillingAgreement',
    sellerId: this.config.sellerId,
    onReady: this.setBillingAgreementId,
    onAddressSelect: this.initWallet,
    design: { size: this.config.addressBook },
    onError: this.error
  };

  this.widgets.addressBook = new window.OffAmazonPayments.Widgets.AddressBook(opts);
  this.widgets.addressBook.bind(this.config.addressBook.id);
};

/**
 * Initializes the wallet widget
 */

PayWithAmazon.prototype.initWallet = function () {
  var self = this;
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: { size: this.config.wallet },
    onPaymentSelect: function () {
      self.initConsent();
      self.check();
    },
    onError: this.error
  };

  if (!this.billingAgreementId) {
    opts.agreementType = 'BillingAgreement';
    opts.onReady = this.setBillingAgreementId;
  }

  this.widgets.wallet = new window.OffAmazonPayments.Widgets.Wallet(opts);
  this.widgets.wallet.bind(this.config.wallet.id);
};

/**
 * Initializes the consent widget
 */

PayWithAmazon.prototype.initConsent = function () {
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: { size: this.config.consent },
    onReady: this.setConsent,
    onConsent: this.setConsent,
    onError: this.error
  };

  this.widgets.consent = new window.OffAmazonPayments.Widgets.Consent(opts);
  this.widgets.consent.bind(this.config.consent.id);
};

/**
 * Sets the billingAgreementId based on a widgit init reference
 */

PayWithAmazon.prototype.setBillingAgreementId = function (ref) {
  this.billingAgreementId = ref.getAmazonBillingAgreementId();
  this.check();
};

/**
 * Sets consent state based on an Amazon ConsentStatus
 */

PayWithAmazon.prototype.setConsent = function (consentStatus) {
  if (typeof consentStatus.getConsentStatus === 'undefined') return;
  this.consent = consentStatus.getConsentStatus() === 'true';
  this.check();
};

/**
 * Handles errors, logging to console and emitting via the 'error' event
 */

PayWithAmazon.prototype.error = function (err) {
  var error = {
    code: err.getErrorCode(),
    message: err.getErrorMessage()
  };

  if (console) {
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, this.error);
    }
    console.error(error);
  }

  this.emit('error', error);
};

});




require.alias("component-emitter/index.js", "pay-with-amazon/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-bind/index.js", "pay-with-amazon/deps/bind/index.js");
require.alias("component-bind/index.js", "bind/index.js");

require.alias("pay-with-amazon/index.js", "pay-with-amazon/index.js");if (typeof exports == "object") {
  module.exports = require("pay-with-amazon");
} else if (typeof define == "function" && define.amd) {
  define([], function(){ return require("pay-with-amazon"); });
} else {
  this["PayWithAmazon"] = require("pay-with-amazon");
}})();