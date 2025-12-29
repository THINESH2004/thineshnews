const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const rateLimit = require('express-rate-limit');

// Simple in-memory job queue with retries
class JobQueue {
  constructor() {
    this.jobs = [];
    this.processing = false;
  }

  enqueue(job) {
    this.jobs.push({ job, attempts: 0, nextRun: Date.now() });
    this.process();
  }

  async process() {
    if (this.processing) return;
    this.processing = true;

    while (this.jobs.length) {
      const item = this.jobs[0];
      if (Date.now() < item.nextRun) break; // wait for next run

      try {
        await this._runJob(item.job);
        this.jobs.shift();
      } catch (err) {
        item.attempts += 1;
        if (item.attempts >= 5) {
          // drop and log
          console.error('Job failed after attempts', err && err.message);
          this.jobs.shift();
        } else {
          // exponential backoff
          const backoff = Math.pow(2, item.attempts) * 1000;
          item.nextRun = Date.now() + backoff;
          console.warn(`Job failed, retrying in ${backoff}ms`);
        }
      }
    }

    this.processing = false;
  }

  async _runJob(job) {
    // job: { imageData, caption }
    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) throw new Error('Missing TELEGRAM token or chat id');

    const m = job.imageData.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
    if (!m) throw new Error('Invalid image format');

    const mime = m[1];
    const b64 = m[3];
    const buf = Buffer.from(b64, 'base64');

    const form = new FormData();
    form.append('chat_id', CHAT_ID);
    form.append('caption', (job.caption || '').slice(0, 1024));
    form.append('photo', buf, { filename: 'template.png', contentType: mime });

    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;

    const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() });
    const json = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error('Telegram API error');
      err.details = json;
      throw err;
    }

    return json;
  }
}

const queue = new JobQueue();

function stripToText(input = '') {
  return String(input || '').replace(/<[^>]*>/g, '').replace(/[\r\n]+/g, ' ').trim().slice(0, 1024);
}

function createApp() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // Rate limiter middleware (apply to publish route)
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Auth middleware: either use WEBHOOK_SECRET header or WEBHOOK_API_KEY header
  function authMiddleware(req, res, next) {
    const secret = process.env.WEBHOOK_SECRET;
    const apiKey = process.env.WEBHOOK_API_KEY;

    const headerSecret = (req.headers['x-webhook-secret'] || '') + '';
    const headerApiKey = (req.headers['x-api-key'] || '') + '';

    if (secret && headerSecret === secret) return next();
    if (apiKey && headerApiKey === apiKey) return next();

    // if neither configured, allow but log (useful for dev)
    if (!secret && !apiKey) {
      console.warn('No webhook auth configured - accepting requests (dev)');
      return next();
    }

    return res.status(401).json({ error: 'Unauthorized' });
  }

  app.post('/publish', limiter, authMiddleware, (req, res) => {
    try {
      const { image, caption } = req.body || {};
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Missing image (data URL) in request body.' });
      }

      // validate image format minimally
      const m = image.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
      if (!m) return res.status(400).json({ error: 'Invalid image format. Provide data:image/png|jpeg;base64,...' });

      const cleanCaption = stripToText(caption || '');

      // enqueue for background processing
      queue.enqueue({ imageData: image, caption: cleanCaption });

      return res.json({ success: true, queued: true });
    } catch (err) {
      console.error('Publish error', err && err.message);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/health', (req, res) => res.json({ ok: true }));

  // expose internals for testing
  app._jobQueue = queue;
  return app;
}

function startServerIfEnvReady(app, port) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.warn('TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set - server will not start listening (use in tests or set env vars)');
    return;
  }

  app.listen(port, () => {
    console.log(`Telegram webhook server listening on port ${port}`);
  });
}

module.exports = { createApp, startServerIfEnvReady };
