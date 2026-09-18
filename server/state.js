import { getStore } from '@netlify/blobs';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

function store() {
  // Do not fall back to ephemeral /tmp files in production.
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return getStore({ name: 'courseit-state', consistency: 'strong' });
  }
  return null;
}

function localPath(key) {
  if (!/^[a-zA-Z0-9_/.-]+$/.test(key) || key.includes('..')) throw new Error('Invalid state key');
  return path.join(process.env.COURSEIT_DATA_DIR || path.resolve('server/data/state'), `${key}.json`);
}

export async function readState(key) {
  const blobs = store();
  if (blobs) return blobs.get(key, { type: 'json' });
  try { return JSON.parse(await fs.readFile(localPath(key), 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function writeState(key, value) {
  const blobs = store();
  if (blobs) return blobs.setJSON(key, value);
  const file = localPath(key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  await fs.writeFile(temporary, JSON.stringify(value));
  await fs.rename(temporary, file);
}

export async function deleteState(key) {
  const blobs = store();
  if (blobs) return blobs.delete(key);
  await fs.rm(localPath(key), { force: true });
}

export async function listState(prefix) {
  const blobs = store();
  if (blobs) {
    const records = [];
    for await (const page of blobs.list({ prefix, paginate: true })) {
      records.push(...await Promise.all(page.blobs.map(({ key }) => readState(key))));
    }
    return records.filter(Boolean);
  }
  const directory = path.dirname(localPath(`${prefix}placeholder`));
  let files;
  try { files = await fs.readdir(directory); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  return (await Promise.all(files.filter(f => f.endsWith('.json')).map(f =>
    readState(`${prefix}${f.slice(0, -5)}`)))).filter(Boolean);
}

const locks = new Map();
export async function updateState(key, transform) {
  // Serialize requests sharing a function instance. Conditional writes below
  // also protect against concurrent updates from other function instances.
  const previous = locks.get(key) || Promise.resolve();
  const pending = previous.catch(() => {}).then(() => updateRecord(key, transform));
  locks.set(key, pending);
  try { return await pending; } finally { if (locks.get(key) === pending) locks.delete(key); }
}

async function updateRecord(key, transform) {
  const blobs = store();
  if (blobs) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const record = await blobs.getWithMetadata(key, { type: 'json' });
      if (record && !record.etag) throw new Error('Storage did not return a version for this record. Please retry.');
      const next = transform(record?.data ?? null);
      const result = await blobs.setJSON(key, next, record
        ? { onlyIfMatch: record.etag } : { onlyIfNew: true });
      if (result.modified) return next;
    }
    throw Object.assign(new Error('Another request updated this account. Please retry.'), { status: 409 });
  }
  const next = transform(await readState(key));
  await writeState(key, next);
  return next;
}
