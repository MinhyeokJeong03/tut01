import fetch from 'node-fetch';

type SummarizeArgs = { documentId?: string; text?: string };

const NOTEBOOKLM_API_URL = process.env.NOTEBOOKLM_API_URL || '';
const NOTEBOOKLM_API_KEY = process.env.NOTEBOOKLM_API_KEY || '';

export async function summarizeDocument(args: SummarizeArgs) {
  if (!NOTEBOOKLM_API_URL || !NOTEBOOKLM_API_KEY) {
    throw new Error('NOTEBOOKLM_API_URL and NOTEBOOKLM_API_KEY must be set in env');
  }
  const payload = {
    // Adapt this payload to the official NotebookLM API shape
    action: 'summarize',
    ...args
  };
  const res = await fetch(NOTEBOOKLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NOTEBOOKLM_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NotebookLM API error: ${res.status} ${text}`);
  }
  return res.json();
}

export async function questionDocument({ documentId, text, question }: { documentId?: string; text?: string; question?: string }) {
  if (!NOTEBOOKLM_API_URL || !NOTEBOOKLM_API_KEY) {
    throw new Error('NOTEBOOKLM_API_URL and NOTEBOOKLM_API_KEY must be set in env');
  }
  const payload = {
    action: 'qa',
    documentId,
    text,
    question
  };
  const res = await fetch(NOTEBOOKLM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NOTEBOOKLM_API_KEY}` },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NotebookLM API error: ${res.status} ${text}`);
  }
  return res.json();
}
