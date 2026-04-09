import express from 'express';
import { summarizeDocument, questionDocument } from '../services/notebooklm';

const router = express.Router();

router.post('/summarize', async (req, res) => {
  const { documentId, text } = req.body;
  if (!documentId && !text) return res.status(400).send('documentId or text required');
  try {
    const result = await summarizeDocument({ documentId, text });
    res.json(result);
  } catch (err) {
    console.error('NotebookLM summarize error', err);
    res.status(500).send('error');
  }
});

router.post('/qa', async (req, res) => {
  const { documentId, question, text } = req.body;
  if (!question) return res.status(400).send('question required');
  try {
    const result = await questionDocument({ documentId, question, text });
    res.json(result);
  } catch (err) {
    console.error('NotebookLM QA error', err);
    res.status(500).send('error');
  }
});

export default router;
