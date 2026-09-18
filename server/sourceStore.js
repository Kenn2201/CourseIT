import { getStore } from '@netlify/blobs';
import { promises as fs } from 'node:fs';
import path from 'node:path';

function validateId(id) {
  if (!/^[a-zA-Z0-9-]{36}$/.test(id)) throw new Error('Invalid source file ID.');
  return id;
}

function blobStore() {
  return process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? getStore({ name: 'courseit-sources', consistency: 'strong' }) : null;
}

function localFile(id) {
  return path.join(process.env.COURSEIT_DATA_DIR || path.resolve('server/data/state'), 'source-files', validateId(id));
}

export async function writeSourceFile(id, bytes) {
  validateId(id);
  const store = blobStore();
  if (store) return store.set(id, bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const file = localFile(id);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bytes);
}

export async function readSourceFile(id) {
  validateId(id);
  const store = blobStore();
  if (store) {
    const bytes = await store.get(id, { type: 'arrayBuffer' });
    return bytes ? Buffer.from(bytes) : null;
  }
  try { return await fs.readFile(localFile(id)); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

export async function deleteSourceFile(id) {
  validateId(id);
  const store = blobStore();
  if (store) return store.delete(id);
  await fs.rm(localFile(id), { force: true });
}
