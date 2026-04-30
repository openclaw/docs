---
read_when:
    - 設定 Synology Chat 與 OpenClaw 搭配使用
    - 偵錯 Synology Chat Webhook 路由
summary: Synology Chat Webhook 設定與 OpenClaw 配置
title: Synology Chat
x-i18n:
    generated_at: "2026-04-30T02:49:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: c3d6d7a56bd15d29de38c6ae29ae496b491c2e75df5e0a0a15410b0fbdc55a00
    source_path: channels/synology-chat.md
    workflow: 16
---

狀態：使用 Synology Chat Webhook 的隨附 Plugin 直接訊息頻道。
此 Plugin 接受來自 Synology Chat outgoing Webhook 的傳入訊息，並透過 Synology Chat incoming Webhook 傳送回覆。

## 隨附 Plugin

Synology Chat 在目前的 OpenClaw 版本中以隨附 Plugin 形式提供，因此一般封裝建置不需要另外安裝。

如果你使用的是較舊的建置，或是不包含 Synology Chat 的自訂安裝，請手動安裝：

從本機 checkout 安裝：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細資訊：[Plugins](/zh-TW/tools/plugin)

## 快速設定

1. 確認 Synology Chat Plugin 可用。
   - 目前封裝的 OpenClaw 版本已經隨附它。
   - 較舊或自訂安裝可以使用上方指令，從原始碼 checkout 手動加入。
   - `openclaw onboard` 現在會在與 `openclaw channels add` 相同的頻道設定清單中顯示 Synology Chat。
   - 非互動式設定：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
2. 在 Synology Chat integrations 中：
   - 建立 incoming Webhook 並複製其 URL。
   - 使用你的秘密 token 建立 outgoing Webhook。
3. 將 outgoing Webhook URL 指向你的 OpenClaw Gateway：
   - 預設為 `https://gateway-host/webhook/synology`。
   - 或使用你的自訂 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成設定。
   - 引導式：`openclaw onboard`
   - 直接：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重新啟動 Gateway，並向 Synology Chat bot 傳送 DM。

Webhook 驗證詳細資訊：

- OpenClaw 會先從 `body.token` 接受 outgoing Webhook token，接著是
  `?token=...`，再來是 headers。
- 接受的 header 形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空白或缺少的 token 會安全失敗。

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
- 在 `allowlist` 模式中，空的 `allowedUserIds` 清單會視為設定錯誤，Webhook 路由將不會啟動（若要允許全部，請使用 `dmPolicy: "open"` 搭配 `allowedUserIds: ["*"]`）。
- `dmPolicy: "open"` 只有在 `allowedUserIds` 包含 `"*"` 時才允許公開 DM；如果是限制性項目，只有相符的使用者可以聊天。
- `dmPolicy: "disabled"` 會封鎖 DM。
- 回覆收件者繫結預設維持在穩定的數字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是破窗相容模式，會重新啟用可變更的使用者名稱/暱稱查找以進行回覆傳送。
- 配對核准可搭配：
  - `openclaw pairing list synology-chat`
  - `openclaw pairing approve synology-chat <CODE>`

## 對外傳送

使用數字 Synology Chat 使用者 ID 作為目標。

範例：

```bash
openclaw message send --channel synology-chat --target 123456 --text "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --text "Hello again"
```

支援透過 URL 型檔案傳送媒體。
對外檔案 URL 必須使用 `http` 或 `https`，而且私有或其他遭封鎖的網路目標會在 OpenClaw 將 URL 轉送至 NAS Webhook 前被拒絕。

## 多帳號

`channels.synology-chat.accounts` 下支援多個 Synology Chat 帳號。
每個帳號都可以覆寫 token、incoming URL、Webhook path、DM 政策與限制。
直接訊息工作階段會依帳號與使用者隔離，因此兩個不同 Synology 帳號上的相同數字 `user_id`
不會共用 transcript 狀態。
請為每個啟用的帳號提供不同的 `webhookPath`。OpenClaw 現在會拒絕重複的完全相同路徑，
並拒絕啟動在多帳號設定中只繼承共用 Webhook path 的具名帳號。
如果你刻意需要具名帳號的舊版繼承行為，請在該帳號或 `channels.synology-chat` 上設定
`dangerouslyAllowInheritedWebhookPath: true`，但重複的完全相同路徑仍會安全失敗並遭拒絕。請優先使用明確的各帳號路徑。

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

- 請保護 `token` 秘密，若外洩請輪換它。
- 除非你明確信任自簽的本機 NAS 憑證，否則請保持 `allowInsecureSsl: false`。
- 傳入 Webhook 請求會經過 token 驗證，並依傳送者套用速率限制。
- 無效 token 檢查使用固定時間秘密比較，並會安全失敗。
- 生產環境建議使用 `dmPolicy: "allowlist"`。
- 除非你明確需要舊版以使用者名稱為基礎的回覆傳送，否則請保持 `dangerouslyAllowNameMatching` 關閉。
- 除非你明確接受多帳號設定中的共用路徑路由風險，否則請保持 `dangerouslyAllowInheritedWebhookPath` 關閉。

## 疑難排解

- `Missing required fields (token, user_id, text)`：
  - outgoing Webhook payload 缺少其中一個必填欄位
  - 如果 Synology 在 headers 中傳送 token，請確認 Gateway/proxy 保留這些 headers
- `Invalid token`：
  - outgoing Webhook secret 與 `channels.synology-chat.token` 不相符
  - 請求打到錯誤的帳號/Webhook path
  - reverse proxy 在請求到達 OpenClaw 前移除了 token header
- `Rate limit exceeded`：
  - 來自同一來源的過多無效 token 嘗試可能會暫時鎖定該來源
  - 已驗證的傳送者也有另一個依使用者套用的訊息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - 已啟用 `dmPolicy="allowlist"`，但尚未設定任何使用者
- `User not authorized`：
  - 傳送者的數字 `user_id` 不在 `allowedUserIds` 中

## 相關

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
