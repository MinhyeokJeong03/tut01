import express from 'express';
import fetch from 'node-fetch';
import path from 'path';

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

    const tokenJson = await tokenResp.json();
    // Persist token securely in production (DB). For demo, return it in response.
    res.json({ token: tokenJson });
  } catch (err) {
    console.error('Error exchanging Canva token:', err);
    res.status(500).send('token exchange failed');
  }
});

// Serve embed demo page
router.get('/embed', (req, res) => {
  res.sendFile('canva.html', { root: path.join(__dirname, '..', '..', 'public') });
});

export default router;
