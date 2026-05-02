---
read_when:
    - 設定 Synology Chat 搭配 OpenClaw
    - 偵錯 Synology Chat Webhook 路由
summary: Synology Chat Webhook 設定與 OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-05-02T20:42:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1f1946425fa6e7a071b03d212854476dc2c0af98097f38da93d3711e5a5c7e96
    source_path: channels/synology-chat.md
    workflow: 16
---

狀態：使用 Synology Chat Webhook 的隨附 Plugin 直接訊息通道。
此 Plugin 接受來自 Synology Chat 傳出 Webhook 的傳入訊息，並透過 Synology Chat 傳入 Webhook 傳送回覆。

## 隨附 Plugin

在目前的 OpenClaw 發行版本中，Synology Chat 會作為隨附 Plugin 一起提供，因此一般封裝建置不需要另外安裝。

如果你使用的是較舊的建置版本，或是不包含 Synology Chat 的自訂安裝，請手動安裝：

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## 快速設定

1. 確認 Synology Chat Plugin 可用。
   - 目前封裝的 OpenClaw 發行版本已隨附它。
   - 較舊／自訂安裝可以使用上方指令，從來源 checkout 手動加入它。
   - `openclaw onboard` 現在會在與 `openclaw channels add` 相同的通道設定清單中顯示 Synology Chat。
   - 非互動式設定：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. 在 Synology Chat 整合中：
   - 建立傳入 Webhook 並複製其 URL。
   - 使用你的祕密 token 建立傳出 Webhook。
3. 將傳出 Webhook URL 指向你的 OpenClaw gateway：
   - 預設為 `https://gateway-host/webhook/synology`。
   - 或使用你的自訂 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成設定。
   - 引導式：`openclaw onboard`
   - 直接：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重新啟動 gateway，並傳送 DM 給 Synology Chat bot。

Webhook 驗證詳細資訊：

- OpenClaw 會依序接受來自 `body.token`、`?token=...`，再來是標頭中的傳出 Webhook token。
- 接受的標頭形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空白或缺漏的 token 會以失敗關閉方式拒絕。

最小設定：

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      token: "synology-outgoing-token",
      incomingUrl: "https://nas.example.com/webapi/entry.cgi?api=SYNO.Chat.External&method=incoming&version=2&token=...",
      webhookPath: "/webhook/synology",
      dmPolicy: "allowlist",
      allowedUserIds: ["123456"],
      rateLimitPerMinute: 30,
      allowInsecureSsl: false,
    },
  },
}
```

## 環境變數

對於預設帳號，你可以使用環境變數：

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（以逗號分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定值會覆寫環境變數。

`SYNOLOGY_CHAT_INCOMING_URL` 無法從工作區 `.env` 設定；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security)。

## DM 政策與存取控制

- `dmPolicy: "allowlist"` 是建議的預設值。
- `allowedUserIds` 接受 Synology 使用者 ID 的清單（或以逗號分隔的字串）。
- 在 `allowlist` 模式中，空的 `allowedUserIds` 清單會被視為設定錯誤，且 Webhook 路由不會啟動（若要允許全部，請使用 `dmPolicy: "open"` 搭配 `allowedUserIds: ["*"]`）。
- 只有當 `allowedUserIds` 包含 `"*"` 時，`dmPolicy: "open"` 才允許公開 DM；若使用限制性項目，只有符合的使用者可以聊天。
- `dmPolicy: "disabled"` 會封鎖 DM。
- 回覆收件者繫結預設會保持在穩定的數字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變的使用者名稱／暱稱查找來遞送回覆。
- 配對核准可使用：
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 傳出遞送

使用數字 Synology Chat 使用者 ID 作為目標。

範例：

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --text "Short prefix"
```

支援透過 URL 型檔案遞送傳送媒體。
傳出檔案 URL 必須使用 `http` 或 `https`，且私人或其他遭封鎖的網路目標會在 OpenClaw 將 URL 轉送至 NAS Webhook 之前被拒絕。

## 多帳號

`channels.synology-chat.accounts` 下支援多個 Synology Chat 帳號。
每個帳號都可以覆寫 token、傳入 URL、Webhook 路徑、DM 政策和限制。
直接訊息工作階段會依帳號和使用者隔離，因此兩個不同 Synology 帳號上的相同數字 `user_id` 不會共用逐字記錄狀態。
請為每個已啟用的帳號提供不同的 `webhookPath`。OpenClaw 現在會拒絕重複的完全相同路徑，並拒絕啟動在多帳號設定中只繼承共用 Webhook 路徑的命名帳號。
如果你刻意需要命名帳號的舊版繼承行為，請在該帳號或 `channels.synology-chat` 上設定 `dangerouslyAllowInheritedWebhookPath: true`，但重複的完全相同路徑仍會以失敗關閉方式被拒絕。建議使用明確的逐帳號路徑。

```json5
{
  channels: {
    "synology-chat": {
      enabled: true,
      accounts: {
        default: {
          token: "token-a",
          incomingUrl: "https://nas-a.example.com/...token=...",
        },
        alerts: {
          token: "token-b",
          incomingUrl: "https://nas-b.example.com/...token=...",
          webhookPath: "/webhook/synology-alerts",
          dmPolicy: "allowlist",
          allowedUserIds: ["987654"],
        },
      },
    },
  },
}
```

## 安全性注意事項

- 保持 `token` 保密，若外洩請輪替它。
- 除非你明確信任自簽的本機 NAS 憑證，否則保持 `allowInsecureSsl: false`。
- 傳入 Webhook 請求會進行 token 驗證，並依傳送者套用速率限制。
- 無效 token 檢查會使用常數時間祕密比較，並以失敗關閉方式拒絕。
- 生產環境建議使用 `dmPolicy: "allowlist"`。
- 除非你明確需要舊版以使用者名稱為基礎的回覆遞送，否則請保持 `dangerouslyAllowNameMatching` 關閉。
- 除非你明確接受多帳號設定中的共用路徑路由風險，否則請保持 `dangerouslyAllowInheritedWebhookPath` 關閉。

## 疑難排解

- `Missing required fields (token, user_id, text)`：
  - 傳出 Webhook payload 缺少其中一個必要欄位
  - 如果 Synology 在標頭中傳送 token，請確認 gateway／proxy 保留這些標頭
- `Invalid token`：
  - 傳出 Webhook 祕密與 `channels.synology-chat.token` 不相符
  - 請求送到了錯誤的帳號／Webhook 路徑
  - reverse proxy 在請求到達 OpenClaw 之前移除了 token 標頭
- `Rate limit exceeded`：
  - 來自相同來源的太多無效 token 嘗試，可能會暫時將該來源鎖定在外
  - 已驗證的傳送者也有個別的逐使用者訊息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - `dmPolicy="allowlist"` 已啟用，但未設定任何使用者
- `User not authorized`：
  - 傳送者的數字 `user_id` 不在 `allowedUserIds` 中

## 相關

- [通道概觀](/zh-TW/channels) — 所有支援的通道
- [配對](/zh-TW/channels/pairing) — DM 驗證和配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為和提及閘控
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型和強化
