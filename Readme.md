
# Pay with Amazon

Simple subscription billing with Amazon!

[Demo][demo]

[Download][download]

## Introduction

This JavaScript library makes it easy to add Pay with Amazon to your payments
flow. It wraps Amazon's Login and Pay with Amazon JavaScript libraries to
simplify its integration. See [Amazon's introduction to this service][amazon-docs]
for more detail.

Hundreds of millions of Amazon customers can subscribe to your subscription
plans and make purchases using their Amazon account.

This library is platform agnostic, and may be used in any checkout flow to
make Amazon Payments easier to implement. To learn how use this library with
your Recurly site, please see [Recurly's documentation][recurly-docs] to get started.

## Usage

Simply include `pay-with-amazon.min.js` in your document head.

**Important!** This **must** be included in the `<head>` of your document.
[[1](#1)]

```html
<head>
  ...
  <script src="pay-with-amazon.min.js"></script>
  ...
</head>
```

Then, also in the document `<head>`, invoke `PayWithAmazon`. Each widget
property accepts a String corresponding to the `id` of an element on your
page. These elements are where the corresponding widget will be injected.

For example:

```html
<head>
  ...
  <script>
    var payWithAmazon = new PayWithAmazon({
      sellerId: 'ABC',
      clientId: 'XYZ',
      button: 'pay-with-amazon',
      addressBook: 'address-book',
      wallet: 'wallet',
      consent: 'consent'
    });
  </script>
  ...
</head>
```

Each widget option also accepts an object value to pass more options.

```js
var payWithAmazon = new PayWithAmazon({
  sellerId: 'ABC',
  clientId: 'XYZ',
  button: { id: 'pay-with-amazon', [type], [color] },
  addressBook: { id: 'address-book', [width], [height] },
  wallet: { id: 'wallet', [width], [height] },
  consent: { id: 'consent', [width], [height] }
});
```

To add EU support, simply include the `region` parameter:

```js
var payWithAmazon = new PayWithAmazon({
  sellerId: 'ABC',
  clientId: 'XYZ',
  button: { id: 'pay-with-amazon', [type], [color] },
  addressBook: { id: 'address-book', [width], [height] },
  wallet: { id: 'wallet', [width], [height] },
  consent: { id: 'consent', [width], [height] },
  region: 'eu'
});
```

For this example, the `<body>` would need to contain the following elements:

```html
<body>
  ...
  <div id="pay-with-amazon"></div>
  <div id="address-book"></div>
  <div id="wallet"></div>
  <div id="consent"></div>
  ...
</body>
```

### Styling

If widget dimensions are not passed in directly, PayWithAmazon will rely
upon the dimensions of their container elements.

PayWithAmazon will add a class to each widget container, `'open'` by default,
but customizable by the `openedClass` option. This allows more robust styling
than simply specifying dimensions. For an example of how this enables the
widgets to be sized responsively, see the [responsive demo][responsive-demo]

## API

### PayWithAmazon(opts)

Initializes a new PayWthAmazon object.

Param | Type | Description
----- | ---- | -----------
sellerId | String | Amazon Seller ID
clientId | String | Amazon Client ID
[production] | Boolean | Whether to use production widgets (defaults to false)
button | Object/String | [button options](#button-options). If String, sets button.id
wallet | Object/String | [wallet options](#wallet-options). If String, sets wallet.id
[addressBook] | Object/String | [addressBook options](#addressbook-options). If excluded, customers will interact solely with the wallet and consent widgets. If String, sets addressBook.id
consent | Object/String | [conset options](#consent-options). If String, sets consent.id
[openedClass] | String | Class name to add to containers once their widgets have been opened. Defaults to 'open'

#### button options

Param | Type | Description
----- | ---- | -----------
id | String | DOM node id in which the Amazon login button will be placed
[type] | String | 'large' (default), 'small' [See button guide][button-guide]
[color] | String | 'Gold' (default), 'LightGray', 'DarkGray' [See button guide][button-guide]
[kind] | String | 'pay' (default), 'login' [See button guide][button-guide]

#### wallet options

Param | Type | Description
----- | ---- | -----------
id | String | DOM node id in which the Amazon wallet widget will be placed
[width] | Number | Width of the widget in pixels
[height] | Number | Height of the widget in pixels

#### addressBook options

Param | Type | Description
----- | ---- | -----------
id | String | DOM node id in which the Amazon address book widget will be placed
[width] | Number | Width of the widget in pixels
[height] | Number | Height of the widget in pixels

#### consent options

Param | Type | Description
----- | ---- | -----------
id | String | DOM node id in which the Amazon consent widget will be placed
[width] | Number | Width of the widget in pixels
[height] | Number | Height of the widget in pixels

### #on(event, listener)

Attaches a listener to the specified event. See below for possible
event names.

### #off(event, listener)

Detaches a listener from the specified event.

### Events

A PayWithAmazon instance may emit events during setup and customer
interaction with the Amazon widgets.

Listeners can be attached with the `on` method, and detached with
the `off` method.

#### change

Whenever the customer makes a change to their billing agreement.

**Emits:** An object describing the customer's status.

```js
{
  id: 'abc-xyz', // Amazon billing agreement id.
  consent: true // Whether billing consent has been given
}
```

And in case of an error:

```js
{
  consent: false, // May be true or false
  error: 'Billing consent not given.' // A brief description of the error
}
```

#### login

Whenever the customer logs in. This may be used to hide the login button, or
perform other page transitions.

**Emits:** Nothing.

#### ready.addressBook

The address book widget has finished laoding and is now displayed on the page.

**Emits:** Nothing.

#### ready.wallet

The wallet widget has finished laoding and is now displayed on the page.

**Emits:** Nothing.

#### ready.consent

The consent widget has finished laoding and is now displayed on the page.

**Emits:** Nothing.

#### error

Whenever an error occurs setting up the widgets or while the customer is
interacting with the Amazon widgets.

**Emits:** and object describing the error.

```js
{
  code: 'InvalidSellerId', // A string representing an error code
  message: 'The seller identifier that you have provided is invalid. Specify a valid SellerId.' // A brief description of the error
}
```

[See Amazon's documentation][error-codes] for a list of all possible error codes.

## Use Cases

### Case 1: Standard Subscriptions

This is a basic example of the standard settings for the Amazon Payment
widgets. This would display the Amazon address, payment and consent widgets.

```js
var payWithAmazon = new PayWithAmazon({
  sellerId: 'ABC',
  clientId: 'XYZ',
  button: { id: 'pay-with-amazon', type: 'large', color: 'DarkGray' },
  addressBook: { id: 'address-book', width: 400, height: 260 },
  wallet: { id: 'wallet', width: 400, height: 260 },
  consent: { id: 'consent', width: 400, height: 140 }
});
```

### Case 2: No Address Widget

You may want to streamline your checkout experience if you are selling only
digital goods and do not require an account address. In this case, you can
remove the Amazon address widget.

```js
var payWithAmazon = new PayWithAmazon({
  sellerId: 'ABC',
  clientId: 'XYZ',
  button: { id: 'pay-with-amazon', type: 'large', color: 'DarkGray' },
  wallet: { id: 'wallet', width: 400, height: 260 },
  consent: { id: 'consent', width: 400, height: 140 }
});
```

## Contributing

[See Contributing file][contributing]

## Compatibility

IE11+, Firefox, Chrome, Safari

## Notes

##### 1
Amazon's widgets use methods that will otherwise fail if they are not
invoked from the document `<head>`.

## License

The MIT License (MIT)

Copyright (c) 2020 Recurly, inc.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

[demo]: https://recurly.github.io/pay-with-amazon/
[responsive-demo]: https://recurly.github.io/pay-with-amazon/responsive.html
[download]: https://github.com/recurly/pay-with-amazon/releases
[error-codes]: https://payments.amazon.com/developer/documentation/lpwa/201954960
[button-guide]: https://payments.amazon.com/developer/documentation/lpwa/201953980
[amazon-docs]: https://payments.amazon.com/developer/documentation/lpwa/201985870
[recurly-docs]: https://docs.recurly.com/payment-gateways/amazon-payments
[contributing]: CONTRIBUTING.md
