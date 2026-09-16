import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

/**
 * Extracts clean, readable text from any documentation URL using Mozilla Readability & jsdom.
 * Strips sidebars, headers, footers, navigation, and advertisement clutter.
 * 
 * @param {string} url - Target documentation URL
 * @returns {Promise<{ title: string, content: string, excerpt: string, siteName: string }>}
 */
export async function extractDocumentation(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid documentation URL is required.');
  }

  // Ensure valid URL format
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (err) {
    throw new Error('Invalid URL format. Please provide a full URL including https://');
  }

  // Fetch raw HTML with a standard browser User-Agent
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 CourseIT/1.0',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch documentation from ${url} (HTTP ${response.status}: ${response.statusText})`);
  }

  const html = await response.text();

  // Parse HTML DOM
  const dom = new JSDOM(html, { url });
  const doc = dom.window.document;

  // Remove common non-content elements that might confuse Readability
  const selectorsToRemove = [
    'script', 'style', 'noscript', 'iframe', 'svg', 
    '.wy-nav-side', '.sphinxsidebar', 'nav', 'header', 'footer',
    '.sidebar', '#sidebar', '.toc', '.table-of-contents'
  ];
  selectorsToRemove.forEach(selector => {
    doc.querySelectorAll(selector).forEach(el => el.remove());
  });

  // Run Mozilla Readability
  const reader = new Readability(doc);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.trim().length < 50) {
    // Fallback: extract main body text if Readability was overly aggressive
    const bodyText = doc.body ? doc.body.textContent.replace(/\s+/g, ' ').trim() : '';
    if (bodyText.length > 50) {
      return {
        title: doc.title || parsedUrl.hostname,
        content: bodyText.slice(0, 30000), // Cap reasonable payload for LLM
        excerpt: bodyText.slice(0, 200),
        siteName: parsedUrl.hostname
      };
    }
    throw new Error('Could not extract meaningful article content from the given documentation page.');
  }

  return {
    title: article.title || doc.title || parsedUrl.hostname,
    content: article.textContent.replace(/\s+/g, ' ').trim().slice(0, 35000),
    excerpt: article.excerpt || article.textContent.slice(0, 200).trim(),
    siteName: article.siteName || parsedUrl.hostname
  };
}
