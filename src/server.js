import express from 'express';
import * as line from '@line/bot-sdk';
import { askAi } from './ai.js';
import { config } from './config.js';
import { getRecentMessages, remember } from './memory.js';

const app = express();
const lineClient = line.LineBotClient.fromChannelAccessToken({
  channelAccessToken: config.line.channelAccessToken
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/webhook', line.middleware(config.line), async (req, res) => {
  await Promise.all(req.body.events.map(handleEvent));
  res.status(200).end();
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    return;
  }

  const text = event.message.text.trim();
  const chatId = event.source.groupId ?? event.source.roomId ?? event.source.userId;
  const userId = event.source.userId;
  const isGroupLike = Boolean(event.source.groupId || event.source.roomId);

  remember(chatId, { role: userId ?? 'user', text });

  if (text === '/help' || text === 'help') {
    return reply(event.replyToken, helpText());
  }

  if (text.startsWith('/admin')) {
    return handleAdminCommand(event, text, userId);
  }

  const prompt = extractPrompt(text, isGroupLike);
  if (!prompt) {
    return;
  }

  try {
    const answer = await askAi({
      userText: prompt,
      recentMessages: getRecentMessages(chatId)
    });
    remember(chatId, { role: 'assistant', text: answer });
    await reply(event.replyToken, answer);
  } catch (error) {
    console.error('AI request failed:', error);
    await reply(event.replyToken, formatAiError(error));
  }
}

function extractPrompt(text, isGroupLike) {
  if (text.startsWith('/ai ')) {
    return text.slice('/ai '.length).trim();
  }

  if (!isGroupLike) {
    return text;
  }

  if (config.respondToAllGroupMessages) {
    return text;
  }

  if (config.botTriggerName && text.includes(config.botTriggerName)) {
    return text.replace(config.botTriggerName, '').trim();
  }

  if (text.startsWith('@')) {
    return text.replace(/^@\S+\s*/, '').trim();
  }

  return '';
}

async function handleAdminCommand(event, text, userId) {
  if (!userId || !config.adminUserIds.includes(userId)) {
    return reply(event.replyToken, '你沒有權限使用管理指令。');
  }

  if (text === '/admin ping') {
    return reply(event.replyToken, 'admin ok');
  }

  return reply(event.replyToken, '可用管理指令：/admin ping');
}

function helpText() {
  return [
    '可用指令：',
    '/ai 你的問題',
    `${config.botTriggerName} 你的問題`,
    '/help',
    '/admin ping'
  ].join('\n');
}

function reply(replyToken, text) {
  return lineClient.replyMessage({
    replyToken,
    messages: [{ type: 'text', text: truncateLineText(text) }]
  });
}

function truncateLineText(text) {
  return text.length > 4900 ? `${text.slice(0, 4900)}\n...(已截斷)` : text;
}

function formatAiError(error) {
  if (error?.code === 'insufficient_quota' || error?.error?.code === 'insufficient_quota') {
    return 'OpenAI API 目前沒有可用額度或尚未完成付款設定，因此暫時無法回答。請到 OpenAI Platform 的 Billing / Usage 檢查額度。';
  }

  if (error?.status === 401 || error?.code === 'invalid_api_key') {
    return 'OpenAI API key 無效或已失效，請更新 Render 環境變數 OPENAI_API_KEY。';
  }

  return '處理時發生錯誤，請稍後再試。';
}

app.listen(config.port, () => {
  console.log(`LINE AI bot listening on port ${config.port}`);
});
