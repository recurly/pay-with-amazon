
# pay-with-amazon

  Easy Amazon Payments

## Installation

  Install with [component(1)](http://component.io):

    $ component install recurly/pay-with-amazon

## API

### Events

Any PayWithAmazon instance will emit events during setup and customer interaction with the Amazon widgets.

Listeners can be attached with the `on` method, and detached with the `off` method.

#### `change`

Whenever the customer makes a change to their billing agreement.

Emits an object describing the customer's status.

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

#### `error`

Whenever an error occurs setting up the widgets or while the customer is interacting with the Amazon widgets.

Emits and object describing the error.

```js
{
  code: 'InvalidSellerId', // A string representing an error code
  message: 'The seller identifier that you have provided is invalid. Specify a valid SellerId.' // A brief description of the error
}
```

[See Amazon's documentation][error-codes] for a list of all possible error codes.

## License

  The MIT License (MIT)

  Copyright (c) 2014 Recurly, inc.

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

[error-codes]: http://docs.developer.amazonservices.com/en_US/pay_with_amazon_automatic_payments/APAGuide_ErrorHandling.html#APAGuide_ErrorHandling__table_A767CBA7D23A4C938855A0255528FB81
