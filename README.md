# LINE AI Bot

這是一個最小可用的 LINE 群組 AI Bot 後端。群組成員可以用 `/ai` 或指定觸發字與 Bot 對話；管理指令用 `ADMIN_USER_IDS` 控管。

## 功能

- `POST /webhook` 接收 LINE Messaging API webhook
- 使用 LINE SDK 驗證 `x-line-signature`
- `/ai 你的問題`：群組或個人聊天都可用
- `@bot 你的問題`：群組中用觸發字呼叫
- `/help`：顯示指令
- `/admin ping`：只有 allowlist 使用者可用
- 簡單保留近期群組內容於記憶體，提供對話上下文

## 本機啟動

```bash
npm install
cp .env.example .env
npm run dev
```

編輯 `.env`：

```env
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
OPENAI_API_KEY=...
ADMIN_USER_IDS=Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
BOT_TRIGGER_NAME=@bot
```

## LINE Developers 設定

1. 建立 LINE Official Account。
2. 到 LINE Developers 建立 Messaging API channel。
3. 複製 Channel access token 與 Channel secret 到 `.env`。
4. 在 Messaging API 分頁啟用 `Use webhook`。
5. 開啟 `Allow bot to join group chats`。
6. 將 Webhook URL 設為：

```text
https://你的網域/webhook
```

7. 按下 Verify，確認 webhook 回傳 200。
8. 把官方帳號加入 LINE 群組。

LINE 官方文件說明：webhook 收到事件前應驗證 signature；群組使用需在 Messaging API 設定開啟允許加入群組。

## 部署到 Render

1. 建立 Web Service。
2. Build command：

```bash
npm install
```

3. Start command：

```bash
npm start
```

4. 設定環境變數：

```text
LINE_CHANNEL_ACCESS_TOKEN
LINE_CHANNEL_SECRET
OPENAI_API_KEY
OPENAI_MODEL
ADMIN_USER_IDS
BOT_TRIGGER_NAME
RESPOND_TO_ALL_GROUP_MESSAGES
```

5. 部署完成後，把 Render 網址加上 `/webhook` 填回 LINE Developers。

## 指令設計建議

群組中建議先使用明確觸發，避免 Bot 對所有訊息回覆：

```text
/ai 幫我整理這段討論
@bot 幫我翻譯成英文
/help
```

若真的要讓 Bot 回應所有群組訊息，設定：

```env
RESPOND_TO_ALL_GROUP_MESSAGES=true
```

## 注意事項

- 目前記憶體只存在於單一執行程序，重啟後會消失。正式使用可改接 Redis 或資料庫。
- 「執行外部動作」需要額外串接，例如 GitHub、Google Sheets、Notion 或你自己的 webhook。
- 管理指令務必使用 allowlist，避免群組成員誤觸敏感操作。
