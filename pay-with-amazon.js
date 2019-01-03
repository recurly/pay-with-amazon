(function outer(modules, cache, entries){

  /**
   * Global
   */

  var global = (function(){ return this; })();

  /**
   * Require `name`.
   *
   * @param {String} name
   * @api public
   */

  function require(name){
    if (cache[name]) return cache[name].exports;
    if (modules[name]) return call(name, require);
    throw new Error('cannot find module "' + name + '"');
  }

  /**
   * Call module `id` and cache it.
   *
   * @param {Number} id
   * @param {Function} require
   * @return {Function}
   * @api private
   */

  function call(id, require){
    var m = cache[id] = { exports: {} };
    var mod = modules[id];
    var name = mod[2];
    var fn = mod[0];
    var threw = true;

    try {
      fn.call(m.exports, function(req){
        var dep = modules[id][1][req];
        return require(dep || req);
      }, m, m.exports, outer, modules, cache, entries);
      threw = false;
    } finally {
      if (threw) {
        delete cache[id];
      } else if (name) {
        // expose as 'name'.
        cache[name] = cache[id];
      }
    }

    return cache[id].exports;
  }

  /**
   * Require all entries exposing them on global if needed.
   */

  for (var id in entries) {
    if (entries[id]) {
      global[entries[id]] = require(id);
    } else {
      require(id);
    }
  }

  /**
   * Duo flag.
   */

  require.duo = true;

  /**
   * Expose cache.
   */

  require.cache = cache;

  /**
   * Expose modules
   */

  require.modules = modules;

  /**
   * Return newest require.
   */

   return require;
})({
1: [function(require, module, exports) {
'use strict';

/**
 * Dependencies
 */

var Emitter = require('component/emitter');
var bind = require('component/bind');

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
 *     consent: { id: 'consent' [, width: 400 [, height: 140]]},
 *   });
 *
 * @param {Object} opts
 * @param {String} opts.sellerId
 * @param {String} opts.clientId
 * @param {Boolean} opts.production Whether to use the production widgets (defaults to false)
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
 * @param {String} [opts.openedClass]
 * @param {String} [opts.region] 'us' (default), 'eu', 'uk'
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

  if ('OffAmazonPayments' in window) {
    this.init();
  } else {
    document.write('<script src="'
      + this.getAssetPath()
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
 * Version
 */

PayWithAmazon.prototype.version = '1.0.4';

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

  if (opts.button.kind === 'login') {
    opts.button.type = opts.button.type === 'small' ? 'Login' : 'LwA';
  } else {
    opts.button.type = opts.button.type === 'small' ? 'Pay' : 'PwA';
  }

  opts.button.color = opts.button.color || 'Gold';

  if (opts.wallet.width || opts.wallet.height) {
    opts.wallet.dimensions = {
      width: dimension(opts.wallet.width || 400),
      height: dimension(opts.wallet.height || 260)
    };
  }

  if (opts.consent.width || opts.consent.height) {
    opts.consent.dimensions = {
      width: dimension(opts.consent.width || 400),
      height: dimension(opts.consent.height || 140)
    };
  }

  if (opts.addressBook && (opts.addressBook.width || opts.addressBook.height)) {
    opts.addressBook.dimensions = {
      width: dimension(opts.addressBook.width || 400),
      height: dimension(opts.addressBook.height || 260)
    };
  }

  opts.production = typeof opts.production === 'boolean' ? opts.production : false;
  opts.openedClass = opts.openedClass || 'open';

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
 * Returns the url for Amazon widgets based on region url param
 *
 * @return {String} url
 */
PayWithAmazon.prototype.getAssetPath = function () {
  var env = this.config.production ? '' : '/sandbox';
  var assetPath;

  switch (this.config.region) {
    case 'eu':
      assetPath = 'https://static-eu.payments-amazon.com/OffAmazonPayments/eur' + env + '/lpa/js/Widgets.js?sellerId=';
      break;
    case 'uk':
      assetPath = 'https://static-eu.payments-amazon.com/OffAmazonPayments/gbp' + env + '/lpa/js/Widgets.js?sellerId=';
      break;
    default:
      assetPath = 'https://static-na.payments-amazon.com/OffAmazonPayments/us' + env + '/js/Widgets.js?sellerId=';
      break;
  }
  return assetPath + this.config.sellerId;
}

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
        self.emit('login', res);
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
  var self = this;

  if (!this.config.addressBook) return this.initWallet();

  var opts = {
    agreementType: 'BillingAgreement',
    sellerId: this.config.sellerId,
    onReady: function (ref) {
      self.emit('ready.addressBook');
      self.setBillingAgreementId(ref);
    },
    onAddressSelect: this.initWallet,
    design: design(this.config.addressBook),
    onError: this.error
  };

  this.widgets.addressBook = new window.OffAmazonPayments.Widgets.AddressBook(opts);
  this.widgets.addressBook.bind(this.config.addressBook.id);
  this.opened(this.config.addressBook.id);
};

/**
 * Initializes the wallet widget
 */

PayWithAmazon.prototype.initWallet = function () {
  var self = this;
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: design(this.config.wallet),
    onReady: function (ref) {
      self.emit('ready.wallet');
      if (!self.billingAgreementId) {
        self.setBillingAgreementId(ref);
      }
    },
    onPaymentSelect: function () {
      self.initConsent();
      self.check();
    },
    onError: this.error
  };

  if (!this.billingAgreementId) {
    opts.agreementType = 'BillingAgreement';
  }

  this.widgets.wallet = new window.OffAmazonPayments.Widgets.Wallet(opts);
  this.widgets.wallet.bind(this.config.wallet.id);
  this.opened(this.config.wallet.id);
};

/**
 * Initializes the consent widget
 */

PayWithAmazon.prototype.initConsent = function () {
  var self = this;
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: design(this.config.consent),
    onReady: function (consentStatus) {
      self.emit('ready.consent');
      self.setConsent(consentStatus);
    },
    onConsent: this.setConsent,
    onError: this.error
  };

  this.widgets.consent = new window.OffAmazonPayments.Widgets.Consent(opts);
  this.widgets.consent.bind(this.config.consent.id);
  this.opened(this.config.consent.id);
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
 * Adds a class to opened widget containers
 */

PayWithAmazon.prototype.opened = function (id) {
  var elem = document.getElementById(id);
  if (elem) elem.className = elem.className + ' ' + this.config.openedClass;
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

/**
 * Given a number or string, returns a properly-formatted dimension string
 *
 * @param {Number|String} dim
 * @returns {String}
 */

function dimension (dim) {
  dim = dim + '';
  return dim + (isNaN(parseInt(dim.charAt(dim.length - 1), 10)) ? '' : 'px');
}

/**
 * Given a widget configuration, returns a properly-formatted design spec
 *
 * @param {Object} widget Widget options hash
 */

function design (widget) {
  if (widget.dimensions) {
    return { size: widget.dimensions };
  } else {
    return { designMode: 'responsive' };
  }
}

}, {"component/emitter":2,"component/bind":3}],
2: [function(require, module, exports) {

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

}, {}],
3: [function(require, module, exports) {
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

}, {}]}, {}, {"1":"PayWithAmazon"})