import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: '*'})); // tighten in production
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend from project root so frontend and API share the same origin
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
app.use(express.static(projectRoot));

function requireEnv(name) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env: ${name}`);
  return v;
}

function payhereCheckoutUrl() {
  const env = (process.env.PAYHERE_ENV || 'sandbox').toLowerCase();
  return env === 'live' ? 'https://www.payhere.lk/pay/checkout' : 'https://sandbox.payhere.lk/pay/checkout';
}

function buildPayHereHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  // PayHere signature: md5(merchant_id + order_id + amount + currency + merchant_secret)
  const amt = Number(amount).toFixed(2);
  const sigStr = `${merchantId}${orderId}${amt}${currency}${merchantSecret}`;
  // Use uppercase hex to avoid case-sensitivity issues on gateway side
  return crypto.createHash('md5').update(sigStr).digest('hex').toUpperCase();
}

app.post('/api/ipg/create-session', async (req, res) => {
  try {
    const merchantId = requireEnv('1232226'); // your PayHere merchant ID
    const merchantSecret = requireEnv('MTM2MjE4MDEyNjY0MzM0MjU5MTUxNDAxOTk1MzE5MzIyNDkwODc='); // your PayHere merchant secret

    const {
      orderId,
      amount,
      currency,
      returnUrl,
      cancelUrl,
      notifyUrl,
      items,
      customer
    } = req.body || {};

    if (!orderId || amount == null || !currency) {
      return res.status(400).json({ error: 'orderId, amount, currency are required' });
    }

    const amt = Number(amount);
    if (!(amt > 0)) return res.status(400).json({ error: 'amount must be > 0' });

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

    const action = payhereCheckoutUrl();

    const formFields = {
      merchant_id: merchantId,
      return_url: returnUrl || 'http://localhost:8080/thankyou.html',
      cancel_url: cancelUrl || 'http://localhost:8080/checkout-payment.html',
      notify_url: notifyUrl || 'http://localhost:8080/api/ipg/notify',
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

    return res.json({ formHtml });
  } catch (err) {
    console.error('create-session error', err);
    return res.status(500).json({ error: 'Failed to create PayHere session' });
  }
});

// Basic notify endpoint stub - you should verify signature and update order status here
app.post('/api/ipg/notify', (req, res) => {
  console.log('PayHere notify payload:', req.body);
  // TODO: verify and update order in your database (e.g., Firestore)
  res.status(200).send('OK');
});

app.get('/health', (req, res) => res.send('ok'));

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
