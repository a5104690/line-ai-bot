const MAX_MESSAGES_PER_CHAT = 40;
const chats = new Map();

export function remember(chatId, message) {
  if (!chatId) return;
  const history = chats.get(chatId) ?? [];
  history.push({
    ...message,
    at: new Date().toISOString()
  });
  chats.set(chatId, history.slice(-MAX_MESSAGES_PER_CHAT));
}

export function getRecentMessages(chatId) {
  return chats.get(chatId) ?? [];
}
