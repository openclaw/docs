---
read_when:
    - 使用 OpenClaw 設定 Synology Chat
    - 偵錯 Synology Chat 網路鉤子路由
summary: Synology Chat 網路鉤子設定與 OpenClaw 設定
title: Synology Chat
x-i18n:
    generated_at: "2026-07-11T21:07:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7829bb1464c4f5546adf086a96b7f3478e6f03e35ed2443bd92c160fa3d2bb8b
    source_path: channels/synology-chat.md
    workflow: 16
---

Synology Chat 透過一對網路鉤子連接至 OpenClaw：Synology Chat 的傳出網路鉤子會將傳入的私訊傳送至閘道，而回覆則透過 Synology Chat 的傳入網路鉤子送回。

狀態：官方外掛，需另外安裝。僅支援私訊；支援文字及以 URL 為基礎的檔案傳送。

## 安裝

```bash
openclaw plugins install @openclaw/synology-chat
```

本機簽出版本（從 git 儲存庫執行時）：

```bash
openclaw plugins install ./path/to/local/synology-chat-plugin
```

詳細資訊：[外掛](/zh-TW/tools/plugin)

## 快速設定

1. 安裝外掛（如上所述）。
2. 在 Synology Chat 整合中：
   - 建立傳入網路鉤子並複製其 URL。
   - 使用你的秘密權杖建立傳出網路鉤子。
3. 將傳出網路鉤子的 URL 指向你的 OpenClaw 閘道：
   - 預設為 `https://gateway-host/webhook/synology`。
   - 或使用自訂的 `channels.synology-chat.webhookPath`。
4. 在 OpenClaw 中完成設定。Synology Chat 在兩種流程中都會顯示於相同的頻道設定清單：
   - 引導式：`openclaw onboard` 或 `openclaw channels add`
   - 直接設定：`openclaw channels add --channel synology-chat --token <token> --url <incoming-webhook-url>`
5. 重新啟動閘道，並傳送私訊給 Synology Chat 機器人。

網路鉤子驗證詳細資訊：

- OpenClaw 依序從 `body.token`、`?token=...`，再從標頭接受傳出網路鉤子權杖。
- 接受的標頭格式：
  - `x-synology-token`
  - `x-webhook-token`
  - `x-openclaw-token`
  - `Authorization: Bearer <token>`
- 權杖為空或缺少時會採取封閉式失敗。
- 承載資料可以是 `application/x-www-form-urlencoded` 或 `application/json`；必須包含 `token`、`user_id` 和 `text`。

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

預設帳號可以使用環境變數：

- `SYNOLOGY_CHAT_TOKEN`
- `SYNOLOGY_CHAT_INCOMING_URL`
- `SYNOLOGY_NAS_HOST`
- `SYNOLOGY_ALLOWED_USER_IDS`（以逗號分隔）
- `SYNOLOGY_RATE_LIMIT`
- `OPENCLAW_BOT_NAME`

設定值會覆寫環境變數。

無法從工作區 `.env` 設定 `SYNOLOGY_CHAT_INCOMING_URL` 和 `SYNOLOGY_NAS_HOST`；請參閱[工作區 `.env` 檔案](/zh-TW/gateway/security#workspace-env-files)。

## 私訊政策與存取控制

- 支援的 `dmPolicy` 值：`allowlist`（預設）、`open` 和 `disabled`。Synology Chat 沒有配對流程；請將傳送者的 Synology 數字使用者 ID 新增至 `allowedUserIds` 以核准傳送者。
- `allowedUserIds` 接受 Synology 使用者 ID 清單（或以逗號分隔的字串）。
- 在 `allowlist` 模式下，空白的 `allowedUserIds` 清單會被視為設定錯誤，網路鉤子路由不會啟動。
- 僅當 `allowedUserIds` 包含 `"*"` 時，`dmPolicy: "open"` 才允許公開私訊；若包含限制性項目，則只有符合的使用者能夠交談。當 `allowedUserIds` 清單為空時，`open` 也會拒絕啟動路由。
- `dmPolicy: "disabled"` 會封鎖私訊。
- 回覆收件者繫結預設會維持使用穩定的數字 `user_id`。`channels.synology-chat.dangerouslyAllowNameMatching: true` 是緊急相容模式，會重新啟用可變動的使用者名稱／暱稱查詢以傳遞回覆。

## 傳出訊息傳遞

使用 Synology Chat 數字使用者 ID 作為目標。接受 `synology-chat:`、`synology_chat:` 和 `synology:` 前綴。

範例：

```bash
openclaw message send --channel synology-chat --target 123456 --message "Hello from OpenClaw"
openclaw message send --channel synology-chat --target synology-chat:123456 --message "Hello again"
openclaw message send --channel synology-chat --target synology:123456 --message "Short prefix"
```

傳出文字會以 2000 個字元為單位分段。媒體傳送支援以 URL 為基礎的檔案傳遞：NAS 會下載並附加檔案（上限 32 MB）。傳出檔案 URL 必須使用 `http` 或 `https`，且在 OpenClaw 將 URL 轉送至 NAS 網路鉤子之前，私有或因其他原因遭封鎖的網路目標會被拒絕。

## 多帳號

`channels.synology-chat.accounts` 支援多個 Synology Chat 帳號。
每個帳號都可以覆寫權杖、傳入 URL、網路鉤子路徑、私訊政策和限制。
私訊工作階段會依帳號和使用者隔離，因此兩個不同 Synology 帳號上的相同數字 `user_id`
不會共用對話記錄狀態。
請為每個已啟用帳號指定不同的 `webhookPath`。OpenClaw 會拒絕完全重複的路徑，
並在多帳號設定中拒絕啟動僅繼承共用網路鉤子路徑的具名帳號。
如果你刻意需要具名帳號沿用舊版繼承行為，請在該帳號或 `channels.synology-chat`
設定 `dangerouslyAllowInheritedWebhookPath: true`，但完全重複的路徑仍會以封閉式失敗方式遭拒絕。請優先為每個帳號明確指定路徑。

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

- 對 `token` 保密，若洩漏請進行輪替。
- 除非你明確信任本機 NAS 的自我簽署憑證，否則請保持 `allowInsecureSsl: false`。
- 傳入網路鉤子請求會驗證權杖，並依傳送者進行速率限制（`rateLimitPerMinute`，預設為 30）。
- 無效權杖檢查使用固定時間秘密值比較並採取封閉式失敗；重複的無效權杖嘗試會暫時封鎖來源 IP。
- 傳入訊息文字會針對已知的提示詞注入模式進行清理，並截斷至 4000 個字元。
- 正式環境請優先使用 `dmPolicy: "allowlist"`。
- 除非你明確需要舊版以使用者名稱為基礎的回覆傳遞，否則請保持關閉 `dangerouslyAllowNameMatching`。
- 除非你明確接受多帳號設定中的共用路徑路由風險，否則請保持關閉 `dangerouslyAllowInheritedWebhookPath`。

## 疑難排解

- `Missing required fields (token, user_id, text)`：
  - 傳出網路鉤子承載資料缺少其中一個必要欄位
  - 如果 Synology 在標頭中傳送權杖，請確認閘道／代理伺服器會保留這些標頭
- `Invalid token`：
  - 傳出網路鉤子的秘密值與 `channels.synology-chat.token` 不符
  - 請求送達錯誤的帳號／網路鉤子路徑
  - 反向代理在請求送達 OpenClaw 前移除了權杖標頭
- `Rate limit exceeded`：
  - 來自相同來源的無效權杖嘗試次數過多，可能會暫時封鎖該來源
  - 已驗證的傳送者另有個別的每位使用者訊息速率限制
- `Allowlist is empty. Configure allowedUserIds or use dmPolicy=open with allowedUserIds=["*"].`：
  - 已啟用 `dmPolicy="allowlist"`，但尚未設定任何使用者
- `User not authorized`：
  - 傳送者的數字 `user_id` 不在 `allowedUserIds` 中

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化措施
