
# pay-with-amazon

  Easy Amazon Payments

  [Demo][demo]

## Usage

  Simply include the `pay-with-amazon.min.js`.

  **Important!** This **must** be included in the `<head>` of your document. [[1](#1)]

  ```html
  <script src="pay-with-amazon.min.js"></script>
  ```

  Then, also in the document `<head>`, invoke `PayWithAmazon`.

  ```js
  var payWithAmazon = new PayWithAmazon({
    sellerId: 'abc',
    clientId: 'xyz',
    button: { id: 'pay-with-amazon' },
    addressBook: { id: 'address-book' [, width: 400 [, height: 260]]},
    wallet: { id: 'wallet' [, width: 400 [, height: 260]]},
    consent: { id: 'consent' [, width: 400 [, height: 140]]}
  });
  ```

## API

### PayWithAmazon(opts)


  Initializes a new PayWthAmazon object.


  Param | Type | Description
  ----- | ---- | -----------
  sellerId | String | Amazon Seller ID
  clientId | String | Amazon Client ID
  button | Object | [button options](#button-options)
  wallet | Object | [wallet options](#wallet-options)
  [addressBook] | Object | [addressBook options](#addressbook-options). If excluded, customers will interact solely with the wallet and consent widgets
  [consent] | Object | [conset options](#consent-options). If excluded, customers may only be charged once

#### button options

  Param | Type | Description
  ----- | ---- | -----------
  id | String | DOM node id in which the Amazon login button will be placed
  [type] | String | 'large' (default), 'small' [See button guide][button-guide]
  [color] | String | 'Gold' (default), 'LightGray', 'DarkGray' [See button guide][button-guide]

#### addressBook options

  Param | Type | Description
  ----- | ---- | -----------
  id | String | DOM node id in which the Amazon address book widget will be placed
  [width] | Number | Width of the widget in pixels
  [height] | Number | Height of the widget in pixels

#### wallet options

  Param | Type | Description
  ----- | ---- | -----------
  id | String | DOM node id in which the Amazon wallet widget will be placed
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

#### error

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

## Notes

##### 1
  Amazon builds its widgets using methods that will otherwise fail if
  they are not invoked from the document `<head>`.

[demo]: https://recurly.github.io/pay-with-amazon/
[error-codes]: http://docs.developer.amazonservices.com/en_US/pay_with_amazon_automatic_payments/APAGuide_ErrorHandling.html#APAGuide_ErrorHandling__table_A767CBA7D23A4C938855A0255528FB81
[button-guide]: http://docs.developer.amazonservices.com/en_US/apa_guide/APAGuide_ButtonGallery.html
