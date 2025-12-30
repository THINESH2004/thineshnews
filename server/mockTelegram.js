const express = require('express');
const multer = require('multer');
const upload = multer();
const app = express();
const PORT = process.env.MOCK_TG_PORT || 9090;

app.post('/bot:token/sendPhoto', upload.any(), (req, res) => {
  console.log('Mock Telegram received sendPhoto:', req.params.token, 'fields=', Object.keys(req.body), 'files=', (req.files || []).length);
  // reply with the minimal shape Telegram returns
  return res.json({ ok: true, result: { message_id: 1 } });
});

app.listen(PORT, () => console.log(`Mock Telegram server listening on http://localhost:${PORT}`));
