const express = require('express');
const multer = require('multer');
const upload = multer();
const app = express();
const PORT = process.env.MOCK_TELE_PORT || 4000;

app.post('/bot:token/sendPhoto', upload.single('photo'), (req, res) => {
  console.log('Mock Telegram received request:');
  console.log('Token:', req.params.token);
  console.log('Fields:', req.body);
  if (req.file) console.log('Photo size:', req.file.size, 'bytes, mimetype:', req.file.mimetype);

  // Simulate success response from Telegram
  return res.json({ ok: true, result: { message_id: 123, chat: { id: req.body.chat_id } } });
});

app.get('/health', (req, res) => res.json({ ok: true, msg: 'mock telegram running' }));

app.listen(PORT, () => console.log(`Mock Telegram listening on port ${PORT}`));
