import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, '..', '..', '.data');
const TOKENS_FILE = path.join(DATA_DIR, 'tokens.json');

async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch (e) {
    // ignore
  }
}

export async function readTokens(): Promise<Record<string, any>> {
  try {
    await ensureDataDir();
    const raw = await fs.readFile(TOKENS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return {};
  }
}

export async function writeTokens(obj: Record<string, any>) {
  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(obj, null, 2), { encoding: 'utf8', mode: 0o600 });
}

export async function getToken(provider: string) {
  const tokens = await readTokens();
  return tokens[provider];
}

export async function saveToken(provider: string, token: any) {
  const tokens = await readTokens();
  tokens[provider] = token;
  await writeTokens(tokens);
}

export async function deleteToken(provider: string) {
  const tokens = await readTokens();
  delete tokens[provider];
  await writeTokens(tokens);
}

export async function listTokens() {
  return await readTokens();
}

export default { readTokens, writeTokens, getToken, saveToken, deleteToken, listTokens };
