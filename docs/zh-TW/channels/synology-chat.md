---
read_when:
    - 設定 Synology Chat 與 OpenClaw 搭配使用
    - 偵錯 Synology Chat 網路鉤子路由
summary: Synology Chat 網路鉤子設定與 OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-07-05T11:04:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat 透過一組網路鉤子與 OpenClaw 連接：Synology Chat outgoing webhook 會將傳入的私訊發布到閘道，而回覆會透過 Synology Chat incoming webhook 傳回。

狀態：官方外掛，需另外安裝。僅支援私訊；支援文字與基於 URL 的檔案傳送。

## 安裝

```bash
openclaw plugins install @openclaw/synology-chat
```

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 安裝外掛（如上）。
2. 在 Synology Chat integrations 中：
   - 建立一個 incoming webhook 並複製其 URL。
   - 使用你的秘密 token 建立一個 outgoing webhook。
3. 將 outgoing webhook URL 指向你的 OpenClaw 閘道：
   - 預設為 `https://gateway-host/webhook/synology`。
   - 或你的自訂 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成設定。Synology Chat 會在兩種流程的同一個頻道設定清單中出現：
   - 引導式：`openclaw onboard` 或 `openclaw channels add`
   - 直接：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重新啟動閘道，並傳送 DM 給 Synology Chat bot。

網路鉤子驗證詳細資訊：

- OpenClaw 會先從 `body.token` 接受 outgoing webhook token，接著是
  `?token=...`，再來是 headers。
- 接受的 header 形式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 空白或缺少 token 會失敗關閉。
- Payload 可以是 `application/x-www-form-urlencoded` 或 `application/json`；`token`、`user_id` 和 `text` 為必填。

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

對於預設帳號，你可以使用 env vars：

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（以逗號分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定值會覆寫 env vars。

`SYNOLOGY_CHAT_INCOMING_URL` 和 `SYNOLOGY_NAS_HOST` 不能從 workspace `.env` 設定；請參閱 [Workspace `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)。

## DM 政策與存取控制

- 支援的 `dmPolicy` 值：`allowlist`（預設）、`open` 和 `disabled`。Synology Chat 沒有配對流程；請將傳送者的數字 Synology user ID 加入 `allowedUserIds` 以核准。
- `allowedUserIds` 接受 Synology user ID 的清單（或以逗號分隔的字串）。
- 在 `allowlist` 模式中，空的 `allowedUserIds` 清單會被視為設定錯誤，且網路鉤子路由不會啟動。
- `dmPolicy: "open"` 只有在 `allowedUserIds` 包含 `"*"` 時才允許公開 DM；若有嚴格限制的項目，則只有符合的使用者可以聊天。`open` 搭配空的 `allowedUserIds` 清單也會拒絕啟動該路由。
- `dmPolicy: "disabled"` 會封鎖 DM。
- 回覆收件者綁定預設會維持在穩定的數字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變的使用者名稱/暱稱查找以進行回覆傳遞。

## 對外傳遞

使用數字 Synology Chat user ID 作為目標。接受 `synology-chat:`、`synology_chat:` 和 `synology:` 前綴。

範例：

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

對外文字會以 2000 個字元為單位分段。媒體傳送支援基於 URL 的檔案傳遞：NAS 會下載並附加檔案（最大 32 MB）。對外檔案 URL 必須使用 `http` 或 `https`，且私有或其他被封鎖的網路目標會在 OpenClaw 將 URL 轉送給 NAS 網路鉤子前被拒絕。

## 多帳號

多個 Synology Chat 帳號在 `channels.synology-chat.accounts` 下受支援。
每個帳號都可以覆寫 token、incoming URL、網路鉤子路徑、DM 政策和限制。
私訊工作階段會依帳號與使用者隔離，因此同一個數字 `user_id`
在兩個不同的 Synology 帳號上不會共用 transcript 狀態。
請為每個啟用的帳號提供不同的 `webhookPath`。OpenClaw 會拒絕重複的精確路徑，
且在多帳號設定中，會拒絕啟動僅繼承共用網路鉤子路徑的具名帳號。
如果你有意需要具名帳號的 legacy 繼承，請在該帳號或 `channels.synology-chat` 設定
`dangerouslyAllowInheritedWebhookPath: true`，
但重複的精確路徑仍會失敗關閉並被拒絕。建議明確設定每帳號路徑。

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

- 請將 `token` 保密，若外洩請輪換。
- 除非你明確信任自簽的本機 NAS 憑證，否則請保持 `allowInsecureSsl: false`。
- 傳入的網路鉤子請求會按 token 驗證，並依傳送者進行速率限制（`rateLimitPerMinute`，預設 30）。
- 無效 token 檢查會使用固定時間的秘密比較並失敗關閉；重複的無效 token 嘗試會暫時鎖定來源 IP。
- 傳入訊息文字會針對已知的 prompt-injection 模式進行清理，並在 4000 個字元處截斷。
- 生產環境建議使用 `dmPolicy: "allowlist"`。
- 除非你明確需要 legacy username-based 回覆傳遞，否則請關閉 `dangerouslyAllowNameMatching`。
- 除非你明確接受多帳號設定中的共用路徑路由風險，否則請關閉 `dangerouslyAllowInheritedWebhookPath`。

## 疑難排解

- `Missing required fields (token, user_id, text)`：
  - outgoing webhook payload 缺少其中一個必填欄位
  - 如果 Synology 在 headers 中傳送 token，請確保 gateway/proxy 保留這些 headers
- `Invalid token`：
  - outgoing webhook secret 與 `channels.synology-chat.token` 不相符
  - request 打到錯誤的帳號/網路鉤子路徑
  - reverse proxy 在 request 到達 OpenClaw 前移除了 token header
- `Rate limit exceeded`：
  - 來自同一來源的無效 token 嘗試過多，可能會暫時鎖定該來源
  - 已驗證的傳送者也有另一個依使用者計算的訊息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - `dmPolicy="allowlist"` 已啟用，但未設定任何使用者
- `User not authorized`：
  - 傳送者的數字 `user_id` 不在 `allowedUserIds` 中

## 相關

- [頻道總覽](/zh-TW/channels) — 所有支援的頻道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與 mention gating
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
