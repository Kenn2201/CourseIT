import { JSDOM } from 'jsdom';
import { fetchDocumentHtml, validateDocumentUrl } from './safeFetch.js';

const STOP_WORDS = new Set(['the', 'and', 'for', 'from', 'with', 'want', 'learn', 'about', 'into', 'this', 'that', 'docs', 'documentation']);

export async function discoverDocumentationSections(seedUrl, topic, fetchHtml = url => fetchDocumentHtml(url, { maxBytes: 2 * 1024 * 1024 })) {
  if (typeof topic !== 'string' || topic.length > 120) {
    throw Object.assign(new Error('Enter a topic under 120 characters.'), { status: 400 });
  }
  const words = [...new Set((topic.toLowerCase().match(/[a-z0-9]{3,}/g) || []).filter(word => !STOP_WORDS.has(word)))].slice(0, 8);
  if (!words.length) throw Object.assign(new Error('Enter a specific topic to find in the documentation.'), { status: 400 });
  const seed = validateDocumentUrl(seedUrl);
  const { html, url } = await fetchHtml(seed.href);
  const finalUrl = validateDocumentUrl(url || seed.href);
  const dom = new JSDOM(html, { url: finalUrl.href });
  const result = new Map();
  for (const anchor of [...dom.window.document.querySelectorAll('a[href]')].slice(0, 10000)) {
    let target;
    try { target = validateDocumentUrl(new URL(anchor.getAttribute('href'), finalUrl).href); }
    catch { continue; }
    if (target.origin !== finalUrl.origin || target.href === finalUrl.href || result.has(target.href)) continue;
    const title = (anchor.textContent || anchor.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 120);
    let pathText;
    try { pathText = decodeURIComponent(target.pathname); } catch { pathText = target.pathname; }
    const haystack = `${title} ${pathText.replace(/[-_/]/g, ' ')}`.toLowerCase();
    const titleLower = title.toLowerCase();
    const pathWords = target.pathname.toLowerCase().split(/[\/_.-]+/);
    const topicPathMatch = words.some(word => pathWords.includes(word));
    const score = words.reduce((sum, word) => sum + (titleLower.includes(word) ? 5 : 0) +
      (haystack.includes(word) ? 2 : 0) + (titleLower === word ? 4 : 0), 0) +
      (topicPathMatch ? 8 : 0) + (target.pathname.includes('/tutorials/') ? 2 : 0) +
      (topicPathMatch && target.pathname.endsWith('/index.html') ? 3 : 0);
    if (score < 2) continue;
    result.set(target.href, { title: title || target.pathname.split('/').filter(Boolean).at(-1) || target.hostname,
      url: target.href, score });
  }
  return { sourceUrl: seed.href, resolvedIndexUrl: finalUrl.href, topic,
    candidates: [...result.values()].sort((a, b) => b.score - a.score || a.url.localeCompare(b.url)).slice(0, 4) };
}
