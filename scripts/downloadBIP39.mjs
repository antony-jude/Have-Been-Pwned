import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://raw.githubusercontent.com/bitcoin/bips/master/bip-0039/english.txt';
const TARGET_DIR = path.join(__dirname, '..', 'client', 'src', 'utils');
const TARGET_FILE = path.join(TARGET_DIR, 'wordlist.js');

async function download() {
  console.log('Downloading BIP39 English wordlist...');
  try {
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();
    const words = text
      .split(/\r?\n/)
      .map(w => w.trim())
      .filter(w => w.length > 0);

    console.log(`Downloaded ${words.length} words. Formatting and saving to ${TARGET_FILE}...`);
    const fileContent = `// BIP39 English Wordlist (2048 words) for secure passphrase generation
export const wordlist = ${JSON.stringify(words, null, 2)};
`;

    fs.writeFileSync(TARGET_FILE, fileContent, 'utf-8');
    console.log('Done!');
  } catch (error) {
    console.error('Error downloading BIP39 wordlist:', error);
    process.exit(1);
  }
}

download();
