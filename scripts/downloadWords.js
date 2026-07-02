import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const URL = 'https://raw.githubusercontent.com/danielmiessler/SecLists/master/Passwords/Common-Credentials/10k-most-common.txt';
const TARGET_DIR = path.join(__dirname, '..', 'client', 'src', 'data');
const TARGET_FILE = path.join(TARGET_DIR, 'commonPasswords.json');

async function download() {
  console.log('Downloading top 10k common passwords...');
  try {
    // Ensure target directory exists
    if (!fs.existsSync(TARGET_DIR)) {
      fs.mkdirSync(TARGET_DIR, { recursive: true });
    }

    const response = await fetch(URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.statusText}`);
    }

    const text = await response.text();
    const passwords = text
      .split(/\r?\n/)
      .map(p => p.trim())
      .filter(p => p.length > 0);

    console.log(`Downloaded ${passwords.length} passwords. Saving to ${TARGET_FILE}...`);
    fs.writeFileSync(TARGET_FILE, JSON.stringify(passwords, null, 2), 'utf-8');
    console.log('Done!');
  } catch (error) {
    console.error('Error downloading passwords:', error);
    process.exit(1);
  }
}

download();
