const fetch = require('node-fetch');

(async () => {
  try {
    const res = await fetch('http://localhost:3001/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'secret123' },
      body: JSON.stringify({ image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=', caption: 'Test publish from script' }),
    });
    const body = await res.text();
    console.log('STATUS', res.status);
    console.log('BODY', body);
  } catch (err) {
    console.error('Error sending publish', err && err.message);
  }
})();
