import express from 'express';
import crypto from 'crypto';

const router = express.Router();

/**
 * Figma webhook receiver
 * - Uses express.raw so we can verify the HMAC-SHA256 signature against FIGMA_WEBHOOK_SECRET
 * - Header expected: x-figma-signature (base64)
 */
router.post('/webhooks/figma', express.raw({ type: 'application/json' }), (req, res) => {
  const secret = process.env.FIGMA_WEBHOOK_SECRET || '';
  const signatureHeader = (req.header('x-figma-signature') || req.header('X-Figma-Signature') || '') as string;

  if (secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(req.body);
    const expected = hmac.digest('base64');
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(signatureHeader))) {
      return res.status(401).send('invalid signature');
    }
  } else {
    console.warn('FIGMA_WEBHOOK_SECRET not set — skipping signature verification');
  }

  try {
    const payload = JSON.parse(req.body.toString('utf8'));
    console.log('Received Figma webhook:', JSON.stringify(payload, null, 2));
    // TODO: process the event: notify, enqueue, call NotebookLM, etc.
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to parse Figma webhook body', err);
    res.status(400).send('bad request');
  }
});

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export default router;
