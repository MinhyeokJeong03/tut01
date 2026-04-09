import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs/promises';
import { saveToken, getToken } from '../lib/tokenStore';

const router = express.Router();

const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || '';
const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || '';
const CANVA_AUTHORIZE_URL = process.env.CANVA_AUTHORIZE_URL || '';
const CANVA_TOKEN_URL = process.env.CANVA_TOKEN_URL || '';

// Start OAuth flow
router.get('/auth', (req, res) => {
  if (!CANVA_AUTHORIZE_URL || !CANVA_CLIENT_ID || !CANVA_REDIRECT_URI) {
    return res.status(500).send('CANVA_AUTHORIZE_URL, CANVA_CLIENT_ID and CANVA_REDIRECT_URI must be set');
  }
  const state = Math.random().toString(36).slice(2);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CANVA_CLIENT_ID,
    redirect_uri: CANVA_REDIRECT_URI,
    state
  }).toString();
  res.redirect(`${CANVA_AUTHORIZE_URL}?${params}`);
});

// OAuth callback: exchange code for token
router.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('missing code');

  if (!CANVA_TOKEN_URL || !CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET || !CANVA_REDIRECT_URI) {
    return res.status(500).send('Canva OAuth not configured');
  }

  try {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: String(code),
      redirect_uri: CANVA_REDIRECT_URI,
      client_id: CANVA_CLIENT_ID,
      client_secret: CANVA_CLIENT_SECRET
    }).toString();

    const tokenResp = await fetch(CANVA_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!tokenResp.ok) {
      const txt = await tokenResp.text();
      console.error('Canva token exchange failed:', tokenResp.status, txt);
      return res.status(500).send('token exchange failed');
    }

    const tokenJson = await tokenResp.json();
    // Persist token securely in production. For dev, store locally in .data (ignored by git).
    await saveToken('canva', { token: tokenJson, createdAt: Date.now() });

    res.json({ ok: true, note: 'Token saved to .data/tokens.json (local dev). Do not commit secrets.' });
  } catch (err) {
    console.error('Error exchanging Canva token:', err);
    res.status(500).send('token exchange failed');
  }
});

// Retrieve stored token for dev/testing
router.get('/token', async (req, res) => {
  try {
    const token = await getToken('canva');
    if (!token) return res.status(404).send('no token stored');
    return res.json({ token });
  } catch (err) {
    console.error('Error reading token', err);
    res.status(500).send('error');
  }
});

// Serve embed demo page with CANVA_EMBED_SCRIPT_URL replaced from env
router.get('/embed', async (req, res) => {
  try {
    const file = path.join(__dirname, '..', '..', 'public', 'canva.html');
    let html = await fs.readFile(file, 'utf8');
    html = html.replace('%%CANVA_EMBED_SCRIPT_URL%%', process.env.CANVA_EMBED_SCRIPT_URL || '');
    res.send(html);
  } catch (err) {
    console.error('Failed to serve embed page', err);
    res.status(500).send('embed not available');
  }
});

export default router;
