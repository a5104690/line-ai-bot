import 'dotenv/config';

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name, fallback = '') {
  return process.env[name] ?? fallback;
}

function bool(name, fallback = false) {
  const value = process.env[name];
  if (value == null || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function csv(name) {
  return (process.env[name] ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  line: {
    channelAccessToken: required('LINE_CHANNEL_ACCESS_TOKEN'),
    channelSecret: required('LINE_CHANNEL_SECRET')
  },
  aiMode: optional('AI_MODE', optional('OPENAI_MODE', 'openai')),
  openai: {
    apiKey: optional('OPENAI_API_KEY'),
    model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini'
  },
  ollama: {
    baseUrl: optional('OLLAMA_BASE_URL', 'http://localhost:11434'),
    model: optional('OLLAMA_MODEL', 'llama3.1:8b')
  },
  adminUserIds: csv('ADMIN_USER_IDS'),
  botTriggerName: process.env.BOT_TRIGGER_NAME ?? '@bot',
  respondToAllGroupMessages: bool('RESPOND_TO_ALL_GROUP_MESSAGES', false)
};
