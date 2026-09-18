import { GoogleGenerativeAI } from '@google/generative-ai';
import { LLMError, SYSTEM_INSTRUCTION, parseAndValidateSteps, isTransientError } from '../errors.js';

/**
 * Calls Google Gemini generative AI models.
 */
export async function callGemini({
  rawText,
  fallbackTitle = 'Documentation Learning Path',
  apiKey = process.env.GEMINI_API_KEY || process.env.LLM_API_KEY,
  customModel = null,
  learningTopic = null,
  deadline = Date.now() + 42000
}) {
  if (!apiKey) {
    throw new LLMError('Gemini API key is not set.', { status: 401, safeCode: 'PROVIDER_UNAVAILABLE' });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const preferred = customModel || process.env.GEMINI_MODEL || process.env.LLM_MODEL || 'gemini-flash-lite-latest';
  const modelsToTry = [...new Set([preferred, 'gemini-flash-lite-latest'])];

  const prompt = `Documentation Topic / Page Title: ${fallbackTitle}\nRequested learning focus: ${learningTopic || 'Follow the source page'}\nUse only evidence in the source. If the requested topic is absent, say so rather than inventing steps.\n\nDocumentation Content:\n${rawText.slice(0, 35000)}`;

  let lastError;
  for (const modelName of modelsToTry) {
    for (let attempt = 1; attempt <= 1; attempt++) {
      try {
        console.log(`[CourseIT] Calling Gemini (${modelName}, attempt ${attempt})...`);
        const remaining = deadline - Date.now();
        if (remaining <= 0) {
          throw new LLMError('AI generation timed out', { name: 'TimeoutError', status: 504, safeCode: 'PROVIDER_TIMEOUT' });
        }

        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        }, { timeout: Math.min(20000, remaining) });

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const usage = result.response.usageMetadata ? {
          promptTokens: result.response.usageMetadata.promptTokenCount || 0,
          candidateTokens: result.response.usageMetadata.candidatesTokenCount || 0,
          totalTokens: result.response.usageMetadata.totalTokenCount || 0,
          model: modelName
        } : {
          promptTokens: Math.round(prompt.length / 4),
          candidateTokens: Math.round(responseText.length / 4),
          totalTokens: Math.round((prompt.length + responseText.length) / 4),
          model: modelName
        };

        const parsed = parseAndValidateSteps(responseText, fallbackTitle);
        const isFallback = Boolean(customModel && modelName !== customModel);
        const fallbackNotice = isFallback
          ? `${customModel} was temporarily busy — used ${modelName} for this result instead.`
          : null;

        return {
          ...parsed,
          usage,
          actualModel: modelName,
          requestedModel: customModel || modelName,
          isFallback,
          fallbackNotice
        };
      } catch (err) {
        lastError = new LLMError(err.message || 'Gemini request failed.', {
          name: err.name,
          status: err.status,
          code: err.code,
          provider: true,
          errorDetails: err.errorDetails,
          response: err.response,
          headers: err.headers,
          retryAfter: err.retryAfter,
          retryDelay: err.retryDelay
        });
        console.warn('[CourseIT] Gemini model request failed:', modelName, Number(err.status) || 'unknown');
        if (isTransientError(lastError)) throw lastError;
        break; // Move to next model if non-transient, or outer handler catches transient
      }
    }
  }
  throw lastError;
}

export default callGemini;
