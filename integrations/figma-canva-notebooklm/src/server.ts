import express from 'express';
import path from 'path';
import figmaRouter from './routes/figma';
import canvaRouter from './routes/canva';
import notebooklmRouter from './routes/notebooklm';

const app = express();
const PORT = process.env.PORT || 3000;

// Mount routes. Note: Figma route uses express.raw() to allow signature verification
app.use('/', figmaRouter);
app.use('/canva', express.json(), canvaRouter);
app.use('/notebooklm', express.json(), notebooklmRouter);

// Serve public assets (e.g., canva.html)
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

app.get('/', (_req, res) => {
  res.status(200).send('Integration template: Figma webhooks, Canva OAuth/embed, NotebookLM wrapper');
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
