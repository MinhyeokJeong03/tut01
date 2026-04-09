import express from 'express';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { summarizeDocument } from '../services/notebooklm';

const router = express.Router();

/**
 * Figma webhook receiver
 * - Uses express.raw so we can verify the HMAC-SHA256 signature against FIGMA_WEBHOOK_SECRET
 * - Header expected: x-figma-signature (base64)
 */
router.post('/webhooks/figma', express.raw({ type: 'application/json' }), async (req, res) => {
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

    // Try to find a file key in the payload
    const fileKey = (payload as any).file_key || (payload as any).fileKey || (payload as any).file?.key || (payload as any).documentId;

    if (fileKey) {
      try {
        const text = await fetchAndExtractTextFromFigma(fileKey);
        if (text && text.length > 0) {
          // Summarize using NotebookLM wrapper
          const summaryResp = await summarizeDocument({ text });
          const summary = (summaryResp && (summaryResp.summary || summaryResp.result || JSON.stringify(summaryResp))) as any;

          // Optionally create a comment on the Figma file with the summary
          try {
            await createFigmaComment(fileKey, `NotebookLM summary:\n\n${String(summary).slice(0, 3000)}`);
          } catch (err) {
            console.warn('Failed to post comment to Figma:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching or processing Figma file', err);
      }
    }

    // TODO: process other event details (notify, enqueue, etc.)
    res.json({ ok: true });
  } catch (err) {
    console.error('Failed to parse Figma webhook body', err);
    res.status(400).send('bad request');
  }
});

const FIGMA_TOKEN = process.env.FIGMA_PERSONAL_ACCESS_TOKEN || '';

async function fetchAndExtractTextFromFigma(fileKey: string) {
  if (!FIGMA_TOKEN) throw new Error('FIGMA_PERSONAL_ACCESS_TOKEN not set');
  const url = `https://api.figma.com/v1/files/${fileKey}`;
  const resp = await fetch(url, { headers: { 'X-Figma-Token': FIGMA_TOKEN } });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Figma API error: ${resp.status} ${txt}`);
  }
  const json = await resp.json();
  const texts: string[] = [];
  if (json && json.document) {
    collectText(json.document, texts);
  }
  return texts.join('\n\n');
}

function collectText(node: any, out: string[]) {
  if (!node) return;
  if (node.type === 'TEXT' && typeof node.characters === 'string') {
    out.push(node.characters);
  }
  if (Array.isArray(node.children)) {
    for (const c of node.children) collectText(c, out);
  }
}

async function createFigmaComment(fileKey: string, message: string) {
  if (!FIGMA_TOKEN) throw new Error('FIGMA_PERSONAL_ACCESS_TOKEN not set');
  const url = `https://api.figma.com/v1/files/${fileKey}/comments`;
  const body = { message, client_meta: { x: 0, y: 0 } };
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'X-Figma-Token': FIGMA_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Figma comment error: ${resp.status} ${txt}`);
  }
  return resp.json();
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export default router;
