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
 * @param {Object} opts.button
 * @param {String} opts.button.id
 * @param {String} [opts.button.type] 'large' (default), 'small'
 * @param {String} [opts.button.color] 'Gold' (default), 'LightGray', 'DarkGray'
 * @param {Object} opts.wallet
 * @param {String} opts.wallet.id
 * @param {Number} [opts.wallet.width]
 * @param {Number} [opts.wallet.height]
 * @param {Object} [opts.addressBook]
 * @param {String} opts.addressBook.id
 * @param {Number} [opts.addressBook.width]
 * @param {Number} [opts.addressBook.height]
 * @param {Object} [opts.consent]
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
  if (!opts.sellerId) throw new Error('opts.sellerId required.');
  if (!opts.clientId) throw new Error('opts.clientId required.');

  opts.button.type = opts.button.type === 'small' ? 'Pay' : 'PwA';
  opts.button.color = opts.button.color || 'Gold';

  opts.wallet.width = (opts.wallet.width || 400) + 'px';
  opts.wallet.height = (opts.wallet.height || 260) + 'px';

  if (opts.addressBook) {
    opts.addressBook.width = (opts.addressBook.width || 400) + 'px';
    opts.addressBook.height = (opts.addressBook.height || 260) + 'px';
  }

  if (opts.consent) {
    opts.consent.width = (opts.consent.width || 400) + 'px';
    opts.consent.height = (opts.consent.height || 140) + 'px';
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

  if (this.config.consent) {
    if (consent !== undefined) {
      status.consent = consent;
    }

    if (consent === undefined) {
      status.error = 'Billing consent not yet given.';
    } else if (!consent) {
      status.error = 'Billing consent not given.';
    }
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
        if (self.config.addressBook) {
          self.initAddressBook();
        } else {
          self.initWallet();
        }
      });
    },
    onError: this.error
  });
};

/**
 * Initializes the Address Book widget
 */

PayWithAmazon.prototype.initAddressBook = function () {
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
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: { size: this.config.wallet },
    onPaymentSelect: function () {
      if (this.consent) this.initConsent();
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
  console.log(ref);
  this.billingAgreementId = ref.getAmazonBillingAgreementId();
  this.check();
};

/**
 * Sets consent state based on an Amazon ConsentStatus
 */

PayWithAmazon.prototype.setConsent = function (consentStatus) {
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

  console && console.error(error);

  this.emit('error', error);
};
