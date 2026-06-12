import OpenAI from 'openai';
import { config } from './config.js';

const openai = new OpenAI({ apiKey: config.openai.apiKey });

const systemPrompt = `
你是一個在 LINE 群組中的 AI 助手。請使用繁體中文回覆，除非使用者要求其他語言。
回覆要精簡、可執行。若使用者要求你執行外部動作，但目前後端尚未提供該工具，請明確說明尚未串接。
不要聲稱你已經完成無法由目前程式完成的動作。
`.trim();

export async function askAi({ userText, recentMessages = [] }) {
  const context = recentMessages
    .slice(-12)
    .map((item) => `${item.role}: ${item.text}`)
    .join('\n');

  const response = await openai.chat.completions.create({
    model: config.openai.model,
    temperature: 0.4,
    messages: [
      { role: 'system', content: systemPrompt },
      ...(context ? [{ role: 'system', content: `近期群組內容：\n${context}` }] : []),
      { role: 'user', content: userText }
    ]
  });

  return response.choices[0]?.message?.content?.trim() || '我沒有產生回覆。';
}
