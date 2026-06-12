import OpenAI from 'openai';
import { config } from './config.js';

const systemPrompt = `
You are an AI assistant in a LINE group chat.
Reply in Traditional Chinese unless the user asks for another language.
Be concise and practical.
If the user asks you to perform an external action that is not implemented by this bot, say clearly that the tool is not connected yet.
Do not claim that you completed actions that this bot cannot actually perform.
`.trim();

const openai = config.openai.apiKey
  ? new OpenAI({ apiKey: config.openai.apiKey })
  : null;

export async function askAi({ userText, recentMessages = [] }) {
  const messages = buildMessages({ userText, recentMessages });

  if (config.aiMode === 'ollama') {
    return askOllama(messages);
  }

  return askOpenAI(messages);
}

function buildMessages({ userText, recentMessages }) {
  const context = recentMessages
    .slice(-12)
    .map((item) => `${item.role}: ${item.text}`)
    .join('\n');

  return [
    { role: 'system', content: systemPrompt },
    ...(context ? [{ role: 'system', content: `Recent group context:\n${context}` }] : []),
    { role: 'user', content: userText }
  ];
}

async function askOpenAI(messages) {
  if (!openai) {
    throw Object.assign(new Error('OPENAI_API_KEY is missing'), {
      code: 'missing_openai_api_key'
    });
  }

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    temperature: 0.4,
    messages
  });

  return response.choices[0]?.message?.content?.trim() || '我沒有產生回覆。';
}

async function askOllama(messages) {
  const response = await fetch(`${config.ollama.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.model,
      messages,
      stream: false,
      options: {
        temperature: 0.4
      }
    })
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    throw Object.assign(new Error(`Ollama request failed: ${response.status} ${detail}`), {
      code: 'ollama_request_failed',
      status: response.status
    });
  }

  const data = await response.json();
  return data.message?.content?.trim() || '我沒有產生回覆。';
}
