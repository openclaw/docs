---
read_when:
    - 你想將 OpenClaw 連接到 LINE
    - 您需要 LINE Webhook + 憑證設定
    - 您需要 LINE 專屬的訊息選項
summary: LINE Messaging API Plugin 設定、組態與使用方式
title: 行
x-i18n:
    generated_at: "2026-05-10T19:22:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7a11edbadda1ec99452eadc19a4557bb594f8b69ebb92314e2c3a0be325ab89d
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接到 OpenClaw。Plugin 會在 Gateway 上作為 Webhook
接收器執行，並使用你的頻道存取權杖與頻道密鑰進行
驗證。

狀態：可下載的 Plugin。支援私訊、群組聊天、媒體、位置、Flex
訊息、範本訊息和快速回覆。不支援回應和對話串。

## 安裝

設定頻道前，請先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機簽出（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳戶並開啟主控台：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選取）Provider，並新增 **Messaging API** 頻道。
3. 從頻道設定複製 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將 Webhook URL 設為你的 Gateway 端點（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 會回應 LINE 的 Webhook 驗證（GET）和傳入事件（POST）。
如果你需要自訂路徑，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全注意事項：

- LINE 簽章驗證依賴請求本文（對原始本文執行 HMAC），因此 OpenClaw 會在驗證前套用嚴格的預先驗證本文大小限制和逾時。
- OpenClaw 會從已驗證的原始請求位元組處理 Webhook 事件。為確保簽章完整性安全，會忽略上游中介軟體轉換後的 `req.body` 值。

## 設定組態

最小組態：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "pairing",
    },
  },
}
```

公開私訊組態：

```json5
{
  channels: {
    line: {
      enabled: true,
      channelAccessToken: "LINE_CHANNEL_ACCESS_TOKEN",
      channelSecret: "LINE_CHANNEL_SECRET",
      dmPolicy: "open",
      allowFrom: ["*"],
    },
  },
}
```

環境變數（僅預設帳戶）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

權杖／密鑰檔案：

```json5
{
  channels: {
    line: {
      tokenFile: "/path/to/line-token.txt",
      secretFile: "/path/to/line-secret.txt",
    },
  },
}
```

`tokenFile` 和 `secretFile` 必須指向一般檔案。符號連結會被拒絕。

多個帳戶：

```json5
{
  channels: {
    line: {
      accounts: {
        marketing: {
          channelAccessToken: "...",
          channelSecret: "...",
          webhookPath: "/line/marketing",
        },
      },
    },
  },
}
```

## 存取控制

私訊預設使用配對。未知傳送者會取得配對碼，且其
訊息會被忽略，直到核准為止。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單和政策：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：允許私訊的 LINE 使用者 ID；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：允許群組的 LINE 使用者 ID
- 每個群組覆寫：`channels.line.groups.<groupId>.allowFrom`
- 靜態傳送者存取群組可由 `allowFrom`、`groupAllowFrom` 和每個群組的 `allowFrom` 使用 `accessGroup:<name>` 參照。
- 執行階段注意事項：如果完全缺少 `channels.line`，執行階段會對群組檢查退回使用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- Markdown 格式會被移除；可行時，程式碼區塊和表格會轉換為 Flex
  卡片。
- 串流回應會被緩衝；Agent 工作時，LINE 會收到完整分段並顯示載入
  動畫。
- 媒體下載受 `channels.line.mediaMaxMb` 限制（預設 10）。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/` 下，再傳遞給
  Agent，這與其他內建頻道
  Plugin 使用的共享媒體儲存相符。

## 頻道資料（豐富訊息）

使用 `channelData.line` 傳送快速回覆、位置、Flex 卡片或範本
訊息。

```json5
{
  text: "Here you go",
  channelData: {
    line: {
      quickReplies: ["Status", "Help"],
      location: {
        title: "Office",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "Status card",
        contents: {
          /* Flex payload */
        },
      },
      templateMessage: {
        type: "confirm",
        text: "Proceed?",
        confirmLabel: "Yes",
        confirmData: "yes",
        cancelLabel: "No",
        cancelData: "no",
      },
    },
  },
}
```

LINE Plugin 也提供 `/card` 指令用於 Flex 訊息預設集：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP (Agent Communication Protocol) 對話綁定：

- `/acp spawn <agent> --bind here` 會將目前的 LINE 聊天綁定到 ACP 工作階段，而不建立子對話串。
- 已設定的 ACP 綁定和作用中的對話綁定 ACP 工作階段在 LINE 上的運作方式與其他對話頻道相同。

詳情請參閱 [ACP Agent](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE Plugin 支援透過 Agent 訊息工具傳送圖片、影片和音訊檔案。媒體會透過 LINE 專用遞送路徑傳送，並具備適當的預覽和追蹤處理：

- **圖片**：以 LINE 圖片訊息傳送，並自動產生預覽。
- **影片**：以明確的預覽和內容類型處理傳送。
- **音訊**：以 LINE 音訊訊息傳送。

傳出媒體 URL 必須是公開 HTTPS URL。OpenClaw 會先驗證目標主機名稱，再將 URL 交給 LINE，並拒絕 local loopback、link-local 和私有網路目標。

當 LINE 專用路徑不可用時，一般媒體傳送會退回使用既有的僅圖片路由。

## 疑難排解

- **Webhook 驗證失敗：** 確認 Webhook URL 是 HTTPS，且
  `channelSecret` 與 LINE 主控台相符。
- **沒有傳入事件：** 確認 Webhook 路徑符合 `channels.line.webhookPath`，
  且 Gateway 可由 LINE 連線。
- **媒體下載錯誤：** 如果媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關

- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證和配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為和提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型和強化
