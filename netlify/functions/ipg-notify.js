exports.handler = async (event) => {
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
    // PayHere will POST order status updates here. For now, just return 200.
    // You can enhance this to verify signatures and update your DB.
    return {
      statusCode: 200,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: 'OK'
    };
  } catch (err) {
    return { statusCode: 500, body: 'Notify handler error' };
  }
};
