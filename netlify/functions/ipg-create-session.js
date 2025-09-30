const crypto = require('crypto');

function payhereCheckoutUrl(env) {
  const e = String(env || 'sandbox').toLowerCase();
  return e === 'live' ? 'https://www.payhere.lk/pay/checkout' : 'https://sandbox.payhere.lk/pay/checkout';
}

function buildPayHereHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  const amt = Number(amount).toFixed(2);
  const sigStr = `${merchantId}${orderId}${amt}${currency}${merchantSecret}`;
  return crypto.createHash('md5').update(sigStr).digest('hex');
}

exports.handler = async (event) => {
  // CORS / preflight support
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const merchantId = process.env.PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const env = process.env.PAYHERE_ENV || 'sandbox';

    if (!merchantId || !merchantSecret) {
      return { statusCode: 500, body: 'Missing PAYHERE_MERCHANT_ID or PAYHERE_MERCHANT_SECRET' };
    }

    const body = JSON.parse(event.body || '{}');
    const {
      orderId,
      amount,
      currency,
      returnUrl,
      cancelUrl,
      notifyUrl,
      items,
      customer
    } = body;

    if (!orderId || amount == null || !currency) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'orderId, amount, currency are required' })
      };
    }

    const amt = Number(amount);
    if (!(amt > 0)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'amount must be > 0' })
      };
    }

    const first_name = (customer && customer.firstName) || 'Customer';
    const last_name = (customer && customer.lastName) || 'User';
    const email = (customer && customer.email) || 'no-reply@example.com';
    const phone = (customer && customer.phone) || '';
    const address = (customer && customer.address) || '';
    const city = (customer && customer.city) || '';
    const country = (customer && customer.country) || 'Sri Lanka';

    const amountStr = amt.toFixed(2);
    const hash = buildPayHereHash({
      merchantId,
      orderId,
      amount: amountStr,
      currency,
      merchantSecret
    });

    const action = payhereCheckoutUrl(env);

    const formFields = {
      merchant_id: merchantId,
      return_url: returnUrl || 'https://example.com/thankyou.html',
      cancel_url: cancelUrl || 'https://example.com/checkout-payment.html',
      notify_url: notifyUrl || 'https://example.com/api/ipg/notify',
      first_name,
      last_name,
      email,
      phone,
      address,
      city,
      country,
      order_id: orderId,
      items: items || `Order ${orderId}`,
      amount: amountStr,
      currency,
      hash
    };

    const inputs = Object.entries(formFields)
      .map(([k, v]) => `<input type="hidden" name="${k}" value="${String(v).replace(/"/g, '&quot;')}"/>`)
      .join('');

    const formHtml = `<!doctype html><html><head><meta charset="utf-8"></head><body>
      <form id="payhereForm" action="${action}" method="post">${inputs}</form>
      <script>document.getElementById('payhereForm').submit();</script>
    </body></html>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ formHtml })
    };
  } catch (err) {
    console.error('ipg-create-session error', err);
    return { statusCode: 500, body: 'Failed to create PayHere session' };
  }
};
