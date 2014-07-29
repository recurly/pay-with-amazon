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

function PayWithAmazon (opts) {
  if (!(this instanceof PayWithAmazon)) return new PayWithAmazon(opts);

  this.configure(opts);

  this.billingAgreementId = null;
  this.consentStatus = false;
  this.widgets = {};
  this._status = this.status();

  this.setBillingAgreementId = bind(this, this.setBillingAgreementId);
  this.initWallet = bind(this, this.initWallet);
  this.initConsent = bind(this, this.initConsent);
  this.setConsent = bind(this, this.setConsent);

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
  var error;

  if (!id) {
    error = 'Billing agreement ID has not been set.';
  } else if (!consent) {
    error = 'Billing consent not given.';
  }

  return error ? { error: error } : { id: id };
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

PayWithAmazon.prototype.initAddressBook = function () {
  this.widgets.addressBook = new OffAmazonPayments.Widgets.AddressBook({
    agreementType: 'BillingAgreement',
    sellerId: this.config.sellerId,
    onReady: this.setBillingAgreementId,
    onAddressSelect: this.initWallet,
    design: this.config.addressBookDimensions,
    onError: this.error
  }).bind(this.config.targets.addressBook);
};

PayWithAmazon.prototype.initWallet = function (ref) {
  this.widgets.wallet = new OffAmazonPayments.Widgets.Wallet({
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: this.config.walletDimensions,
    onPaymentSelect: this.initConsent,
    onError: this.error
  }).bind(this.config.targets.wallet);
};

PayWithAmazon.prototype.initConsent = function (ref) {
  this.widgets.consent = new OffAmazonPayments.Widgets.Consent({
    amazonBillingAgreementId: this.billingAgreementId,
    sellerId: this.config.sellerId,
    design: this.config.consentDimensions,
    onReady: this.setConsent,
    onConsent: this.setConsent,
    onError: this.error
  }).bind(this.config.targets.consent);
};

PayWithAmazon.prototype.setBillingAgreementId = function (ref) {
  this.billingAgreementId = ref.getAmazonBillingAgreementId();
  this.check();
};

PayWithAmazon.prototype.setConsent = function (consentStatus) {
  this.consent = consentStatus.getConsentStatus() === 'true';
  this.check();
};

PayWithAmazon.prototype.error = function (err) {
  console.error(err, err.getErrorCode(), err.getErrorMessage());
};
