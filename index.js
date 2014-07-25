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
 *   - configurable widget sizing
 *   - use binding shim
 *   - provide default values
 *   - configurable widget dimensions
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
