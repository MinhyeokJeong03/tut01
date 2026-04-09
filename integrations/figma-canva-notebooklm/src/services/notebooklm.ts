import fetch from 'node-fetch';

type SummarizeArgs = { documentId?: string; text?: string };

const NOTEBOOKLM_API_URL = process.env.NOTEBOOKLM_API_URL || '';
const NOTEBOOKLM_API_KEY = process.env.NOTEBOOKLM_API_KEY || '';

export async function summarizeDocument(args: SummarizeArgs) {
  const text = args.text || '';
  if (!NOTEBOOKLM_API_URL || !NOTEBOOKLM_API_KEY) {
    // Fallback: simple truncation-based summary for dev/testing
    const truncated = text.length > 1200 ? text.slice(0, 1200) + '...' : text;
    return { summary: `FALLBACK_SUMMARY:\n${truncated}`, raw: null };
  }

  const payload = { text: args.text, documentId: args.documentId };
  const res = await fetch(NOTEBOOKLM_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${NOTEBOOKLM_API_KEY}`
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const textResp = await res.text();
    throw new Error(`NotebookLM API error: ${res.status} ${textResp}`);
  }
  const json = await res.json();
  if (json.summary) return { summary: json.summary, raw: json };
  if (json.result) return { summary: json.result, raw: json };
  if (json.answer) return { summary: json.answer, raw: json };
  if (json.data && json.data.summary) return { summary: json.data.summary, raw: json };
  return { summary: typeof json === 'string' ? json : JSON.stringify(json), raw: json };
}

export async function questionDocument({ documentId, text, question }: { documentId?: string; text?: string; question?: string }) {
  if (!NOTEBOOKLM_API_URL || !NOTEBOOKLM_API_KEY) {
    return { answer: 'No NotebookLM provider configured (fallback).' };
  }
  const payload = { documentId, text, question };
  const res = await fetch(NOTEBOOKLM_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${NOTEBOOKLM_API_KEY}` },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const textResp = await res.text();
    throw new Error(`NotebookLM API error: ${res.status} ${textResp}`);
  }
  const json = await res.json();
  if (json.answer) return { answer: json.answer, raw: json };
  if (json.result) return { answer: json.result, raw: json };
  return { answer: typeof json === 'string' ? json : JSON.stringify(json), raw: json };
}
