const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const rateLimit = require('express-rate-limit');
const { Queue, Worker, QueueScheduler } = require('bullmq');
const IORedis = require('ioredis');

// Durable queue backed by Redis (BullMQ)
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
// When using BullMQ with ioredis, `maxRetriesPerRequest` must be null to allow blocking commands
const redisOptions = { maxRetriesPerRequest: null };
const redisConnection = new IORedis(REDIS_URL, redisOptions);

const publishQueue = new Queue('publish', { connection: redisConnection });
let publishQueueScheduler = null;
try {
  publishQueueScheduler = new QueueScheduler('publish', { connection: redisConnection });
} catch (err) {
  // some Redis mocks or environments may not support all commands required by QueueScheduler
  console.warn('QueueScheduler not available in this environment:', err && err.message);
}

async function publishToTelegram(job) {
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

  const TELEGRAM_API_BASE = process.env.TELEGRAM_API_BASE || 'https://api.telegram.org';
  const url = `${TELEGRAM_API_BASE}/bot${BOT_TOKEN}/sendPhoto`;

  const res = await fetch(url, { method: 'POST', body: form, headers: form.getHeaders() });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const err = new Error('Telegram API error');
    err.details = json;
    throw err;
  }

  return json;
}

// Worker to process publish jobs
const publishWorker = new Worker('publish', async (job) => {
  return await publishToTelegram(job.data);
}, { connection: redisConnection, concurrency: 3 });

publishWorker.on('completed', (job) => {
  console.log('Publish job completed', job.id);
});

publishWorker.on('failed', (job, err) => {
  console.error('Publish job failed', job.id, err && err.message);
});

process.on('SIGINT', async () => {
  console.log('Shutting down worker...');
  await publishWorker.close();
  await publishQueue.close();
  await publishQueueScheduler.close();
  redisConnection.quit();
  process.exit(0);
});

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

  app.post('/publish', limiter, authMiddleware, async (req, res) => {
    try {
      const { image, caption } = req.body || {};
      if (!image || typeof image !== 'string') {
        return res.status(400).json({ error: 'Missing image (data URL) in request body.' });
      }

      // validate image format minimally
      const m = image.match(/^data:(image\/(png|jpeg|jpg));base64,(.+)$/);
      if (!m) return res.status(400).json({ error: 'Invalid image format. Provide data:image/png|jpeg;base64,...' });

      const cleanCaption = stripToText(caption || '');

      // enqueue for background processing (durable queue)
      const job = await publishQueue.add('publish-job', { imageData: image, caption: cleanCaption }, { attempts: 5, backoff: { type: 'exponential', delay: 2000 } });

      return res.json({ success: true, queued: true, jobId: job.id });
    } catch (err) {
      console.error('Publish error', err && err.message);
      return res.status(500).json({ error: 'Server error' });
    }
  });

  app.get('/health', (req, res) => res.json({ ok: true }));

  // expose internals for testing
  app._publishQueue = publishQueue;
  app._publishWorker = publishWorker;
  app._redis = redisConnection;
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
