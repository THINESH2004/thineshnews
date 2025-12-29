/* Minimal, secure webhook to post generated images to Telegram Bot API

Environment variables:
  - TELEGRAM_BOT_TOKEN: required
  - TELEGRAM_CHAT_ID: required (chat id or @channelusername)
  - PORT: optional (default 3001)
  - WEBHOOK_SECRET: optional secret that clients must send as header 'x-webhook-secret' if set

Usage: cd server && npm i && npm start
*/

const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const PORT = process.env.PORT || 3001;

// Lazy load the app from ./app to make the server testable
const { createApp, startServerIfEnvReady } = require('./src/app');

const app = createApp();

startServerIfEnvReady(app, PORT);
