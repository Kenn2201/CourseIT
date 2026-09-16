import { createWorker } from 'tesseract.js';

/**
 * Extracts text from an uploaded file (image or text document).
 * For text/markdown files, reads text directly for instant speed.
 * For images, uses client-side Tesseract.js OCR to minimize vision LLM costs.
 * 
 * @param {File} file 
 * @param {Function} [onProgress] - Callback for progress (status: string, progress: number 0-100)
 * @returns {Promise<{ title: string, text: string, charCount: number, type: string }>}
 */
export async function extractTextFromFile(file, onProgress = () => {}) {
  if (!file) {
    throw new Error('No file provided for text extraction.');
  }

  const fileName = file.name || 'uploaded_document';
  const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  // 1. Instant direct read for text formats
  const textExtensions = ['txt', 'md', 'markdown', 'json', 'csv', 'html', 'js', 'jsx', 'ts', 'tsx', 'py'];
  if (textExtensions.includes(extension) || file.type.startsWith('text/')) {
    onProgress({ status: 'Reading text document...', progress: 50 });
    const text = await readFileAsText(file);
    onProgress({ status: 'Complete!', progress: 100 });
    return {
      title: cleanTitle,
      text: text.trim(),
      charCount: text.length,
      type: 'text'
    };
  }

  // 2. OCR processing for images
  const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tiff'];
  const isImage = imageExtensions.includes(extension) || file.type.startsWith('image/');

  if (isImage) {
    onProgress({ status: 'Initializing Tesseract OCR engine...', progress: 15 });
    
    let worker = null;
    try {
      worker = await createWorker('eng', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            const pct = Math.round((m.progress || 0) * 80) + 15;
            onProgress({ status: `Scanning image characters... ${Math.min(95, pct)}%`, progress: pct });
          } else if (m.status) {
            onProgress({ status: `${m.status}...`, progress: 20 });
          }
        }
      });

      onProgress({ status: 'Performing OCR recognition...', progress: 40 });
      const ret = await worker.recognize(file);
      const extractedText = ret.data.text || '';
      
      await worker.terminate();
      onProgress({ status: 'OCR Extraction complete!', progress: 100 });

      if (!extractedText.trim()) {
        throw new Error('No readable text found in the image. Please upload a clearer image or document.');
      }

      return {
        title: cleanTitle,
        text: extractedText.trim(),
        charCount: extractedText.length,
        type: 'ocr-image'
      };
    } catch (err) {
      if (worker) {
        try { await worker.terminate(); } catch {}
      }
      throw new Error(`OCR extraction failed: ${err.message || err}`);
    }
  }

  // 3. Fallback for PDF or other formats
  throw new Error(`Unsupported file type (.${extension}). Please upload an image (.png, .jpg, .webp) or text file (.txt, .md).`);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => reject(new Error('Failed to read file contents.'));
    reader.readAsText(file);
  });
}
