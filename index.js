import Emitter from 'component-emitter';

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

export default class PayWithAmazon extends Emitter {
  constructor (opts) {
    super();
    this.configure(opts);

    this.billingAgreementId = null;
    this.consent = undefined;
    this.widgets = {};
    this._status = this.status();

    this.setBillingAgreementId = this.setBillingAgreementId.bind(this);
    this.initWallet = this.initWallet.bind(this);
    this.initConsent = this.initConsent.bind(this);
    this.setConsent = this.setConsent.bind(this);
    this.error = this.error.bind(this);
    this.init = this.init.bind(this);

    if ('OffAmazonPayments' in window) {
      this.init();
    } else {
      window.onAmazonLoginReady = this.init;

      var script = document.createElement('script');
      script.src = this.getAssetPath();
      document.head.appendChild(script);
    }

    return this;
  }

  version = '1.0.4';

  /**
   * Configures the instance based on passed `opts`
   *
   * Throws errors if the opts are insufficient to configure the instance,
   * and sets defaults for those not specified.
   *
   * See initializer for description of `opts`
   */

  configure (opts) {
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
  }

  /**
   * Initialized the Amazon plugin
   *
   * Sets the client ID then waits for the widget classes to load
   * before initializing the login button.
   */

  init () {
    window.amazon.Login.setClientId(this.config.clientId);

    var self = this;
    var pollId = setInterval(poll, 200);

    function poll () {
      if (!window.OffAmazonPayments.Button) return;
      clearTimeout(pollId);
      self.initButton();
    }
  }

  /**
   * Returns an object describing the customer state
   *
   * @return {Object} customer state
   */

  status () {
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
  }

  /**
   * Emits the 'change' event if the customer status has changed
   */

  check () {
    var status = this.status();
    if (JSON.stringify(status) !== JSON.stringify(this._status)) {
      this._status = status;
      this.emit('change', status);
    }
  }

  /**
   * Initializes the login button
   */

  initButton () {
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
  }

  /**
   * Initializes the Address Book widget
   */

  initAddressBook () {
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
  }

  /**
   * Initializes the wallet widget
   */

  initWallet () {
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
  }

  /**
   * Initializes the consent widget
   */

  initConsent () {
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
  }

  /**
   * Sets the billingAgreementId based on a widgit init reference
   */

  setBillingAgreementId (ref) {
    this.billingAgreementId = ref.getAmazonBillingAgreementId();
    this.check();
  }

  /**
   * Sets consent state based on an Amazon ConsentStatus
   */

  setConsent (consentStatus) {
    if (typeof consentStatus.getConsentStatus === 'undefined') return;
    this.consent = consentStatus.getConsentStatus() === 'true';
    this.check();
  }

  /**
   * Adds a class to opened widget containers
   */

  opened (id) {
    var elem = document.getElementById(id);
    if (elem) elem.className = elem.className + ' ' + this.config.openedClass;
  }

  /**
   * Handles errors, logging to console and emitting via the 'error' event
   */

  error (err) {
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
  }
}

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
