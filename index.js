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
 * TODO
 * 
 *   - proper error handling
 *
 * @param {Object} opts
 * @param {String} opts.sellerId
 * @param {String} opts.clientId
 * @param {Object} opts.button
 * @param {String} opts.button.id
 * @param {Object} [opts.addressBook]
 * @param {String} [opts.addressBook.id]
 * @param {Number} [opts.addressBook.width]
 * @param {Number} [opts.addressBook.height]
 * @param {Object} opts.wallet
 * @param {String} opts.wallet.id
 * @param {Number} [opts.wallet.width]
 * @param {Number} [opts.wallet.height]
 * @param {Object} opts.consent
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

  document.write('<script src="'
    + 'https://static-na.payments-amazon.com/OffAmazonPayments'
    + '/us/sandbox/js/Widgets.js?sellerId='
    + this.config.sellerId
    + '"></script>');

  window.onAmazonLoginReady = bind(this, this.init);

  return this;
}

Emitter(PayWithAmazon.prototype);

PayWithAmazon.prototype.configure = function (opts) {
  if (!(typeof opts === 'object')) throw new Error ('opts must be provided as an object.');
  if (!opts.sellerId) throw new Error('opts.sellerId required.');
  if (!opts.clientId) throw new Error('opts.clientId required.');

  opts.addressBook.width = (opts.addressBook.width || 400) + 'px';
  opts.addressBook.height = (opts.addressBook.height || 260) + 'px';

  opts.wallet.width = (opts.wallet.width || 400) + 'px';
  opts.wallet.height = (opts.wallet.height || 260) + 'px';

  opts.consent.width = (opts.consent.width || 400) + 'px';
  opts.consent.height = (opts.consent.height || 140) + 'px';

  this.config = opts;
};

PayWithAmazon.prototype.init = function () {
  window.amazon.Login.setClientId(this.config.clientId);

  var self = this;
  var pollId = setInterval(poll, 200);

  function poll () {
    if (!window.OffAmazonPayments.Button) return;
    clearTimeout(pollId);
    self.initLogin();
  }
};

PayWithAmazon.prototype.status = function () {
  var id = this.billingAgreementId;
  var consent = this.consent;
  var status = {};
  var error;

  if (!id) {
    error = 'Billing agreement ID has not been set.';
  } else if (consent === undefined) {
    error = 'Billing consent not yet given.';
  } else if (!consent) {
    error = 'Billing consent not given.';
  }

  if (consent !== undefined) status.consent = consent;

  if (error) {
    status.error = error;
  } else {
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

PayWithAmazon.prototype.initLogin = function () {
  var self = this;

  this.widgets.button = new OffAmazonPayments.Button(this.config.button, this.config.sellerId, {
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

PayWithAmazon.prototype.initAddressBook = function () {
  if (this.config.addressBook) {
    var opts = {
      agreementType: 'BillingAgreement',
      sellerId: this.config.sellerId,
      onReady: this.setBillingAgreementId,
      onAddressSelect: this.initWallet,
      design: this.config.addressBook,
      onError: this.error
    };

    this.widgets.addressBook = new OffAmazonPayments.Widgets.AddressBook(opts);
    this.widgets.addressBook.bind(this.config.addressBook.id);
  } else {
    this.initWallet();
  }
};

PayWithAmazon.prototype.initWallet = function (ref) {
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: this.config.wallet,
    onPaymentSelect: this.initConsent,
    onError: this.error
  };

  if (!this.billingAgreementId) {
    opts.agreementType = 'BillingAgreement';
    opts.onReady: this.setBillingAgreementId;
  }

  this.widgets.wallet = new OffAmazonPayments.Widgets.Wallet(opts);
  this.widgets.wallet.bind(this.config.wallet.id);
};

PayWithAmazon.prototype.initConsent = function (ref) {
  var opts = {
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: this.config.consent,
    onReady: this.setConsent,
    onConsent: this.setConsent,
    onError: this.error
  };

  this.widgets.consent = new OffAmazonPayments.Widgets.Consent(opts);
  this.widgets.consent.bind(this.config.consent.id);
};

PayWithAmazon.prototype.setBillingAgreementId = function (ref) {
  this.billingAgreementId = ref.getAmazonBillingAgreementId();
};

PayWithAmazon.prototype.setConsent = function (consentStatus) {
  this.consent = consentStatus.getConsentStatus() === 'true';
  this.check();
};

PayWithAmazon.prototype.error = function (err) {
  var error = {
    code: err.getErrorCode(),
    message: err.getErrorMessage()
  };

  console && console.error(error);

  this.emit('error', error);
};
