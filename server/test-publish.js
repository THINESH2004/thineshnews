const fetch = require('node-fetch');

(async () => {
  try {
    // Example: send an image (as before)
    const res = await fetch('http://localhost:3001/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'secret123' },
      body: JSON.stringify({ image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVQYV2NgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII=', caption: 'Test publish from script' }),
    });
    console.log('IMAGE STATUS', res.status);
    console.log('IMAGE BODY', await res.text());

    // Example: send a text-only publish to a channel username
    const res2 = await fetch('http://localhost:3001/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-webhook-secret': 'secret123' },
      body: JSON.stringify({ chatId: '@newaithinesh', text: 'News' }),
    });
    console.log('TEXT STATUS', res2.status);
    console.log('TEXT BODY', await res2.text());
  } catch (err) {
    console.error('Error sending publish', err && err.message);
  }
})();
