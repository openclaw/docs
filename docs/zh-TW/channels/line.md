---
read_when:
    - 您想要將 OpenClaw 連接到 LINE
    - 你需要設定 LINE Webhook 與憑證
    - 你想要 LINE 專用的訊息選項
summary: LINE Messaging API Plugin 的設定、組態與使用方式
title: 行
x-i18n:
    generated_at: "2026-04-30T02:47:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9f06d882f1e8d2a758e50459fadefd77796a68c28f63bef5790eb1b540c17d1
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接到 OpenClaw。此 Plugin 會在 Gateway 上作為 Webhook
接收器執行，並使用你的通道存取權杖 + 通道密鑰進行驗證。

狀態：內建 Plugin。支援直接訊息、群組聊天、媒體、位置、Flex
訊息、範本訊息與快速回覆。不支援回應與討論串。

## 內建 Plugin

LINE 在目前的 OpenClaw 版本中作為內建 Plugin 隨附，因此一般
封裝建置不需要另行安裝。

如果你使用的是較舊的建置，或排除 LINE 的自訂安裝，請在 npm 套件發布後安裝
目前的 npm 套件：

```bash
openclaw plugins install @openclaw/line
```

如果 npm 回報 OpenClaw 擁有的套件已淘汰或不存在，請使用
目前封裝的 OpenClaw 建置或本機 checkout，直到 npm 套件發布流程
趕上。

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳號並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選取）Provider，並新增 **Messaging API** 通道。
3. 從通道設定複製 **Channel access token** 與 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將 Webhook URL 設為你的 Gateway 端點（必須使用 HTTPS）：

```
https://gateway-host/line/webhook
```

Gateway 會回應 LINE 的 Webhook 驗證（GET）與傳入事件（POST）。
如果你需要自訂路徑，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE 簽章驗證取決於請求本文（對原始本文做 HMAC），因此 OpenClaw 會在驗證前套用嚴格的預驗證本文大小限制與逾時。
- OpenClaw 會從已驗證的原始請求位元組處理 Webhook 事件。為了簽章完整性安全，會忽略上游中介軟體轉換過的 `req.body` 值。

## 設定

最小設定：

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

環境變數（僅限預設帳號）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

權杖/密鑰檔案：

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

`tokenFile` 與 `secretFile` 必須指向一般檔案。符號連結會被拒絕。

多個帳號：

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

直接訊息預設使用配對。未知傳送者會取得配對代碼，且其
訊息會被忽略，直到獲得核准。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與政策：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：允許傳送 DM 的 LINE 使用者 ID
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：允許在群組中傳送訊息的 LINE 使用者 ID
- 個別群組覆寫：`channels.line.groups.<groupId>.allowFrom`
- 執行階段注意事項：如果 `channels.line` 完全不存在，執行階段會在群組檢查時回退到 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為一段進行分段。
- Markdown 格式會被移除；程式碼區塊與表格會在可行時轉換成 Flex
  卡片。
- 串流回應會被緩衝；Agent 工作期間，LINE 會收到完整分段並顯示載入
  動畫。
- 媒體下載受 `channels.line.mediaMaxMb` 限制（預設 10）。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/` 下，再傳給
  Agent，與其他內建通道 Plugin 使用的共用媒體儲存區一致。

## 通道資料（豐富訊息）

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

LINE Plugin 也隨附 `/card` 命令，可用於 Flex 訊息預設：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP（Agent Communication Protocol）對話繫結：

- `/acp spawn <agent> --bind here` 會將目前 LINE 聊天繫結到 ACP 工作階段，而不建立子討論串。
- 已設定的 ACP 繫結與作用中的對話繫結 ACP 工作階段，在 LINE 上的運作方式與其他對話通道相同。

詳情請參閱 [ACP Agent](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE Plugin 支援透過 Agent 訊息工具傳送圖片、影片與音訊檔案。媒體會透過 LINE 專用的傳遞路徑送出，並具備適當的預覽與追蹤處理：

- **圖片**：作為 LINE 圖片訊息傳送，並自動產生預覽。
- **影片**：傳送時明確處理預覽與內容類型。
- **音訊**：作為 LINE 音訊訊息傳送。

傳出媒體 URL 必須是公開 HTTPS URL。OpenClaw 會先驗證目標主機名稱，再將 URL 交給 LINE，並拒絕 loopback、link-local 與私人網路目標。

當 LINE 專用路徑不可用時，一般媒體傳送會回退到既有的僅圖片路由。

## 疑難排解

- **Webhook 驗證失敗：** 確認 Webhook URL 使用 HTTPS，且
  `channelSecret` 與 LINE console 相符。
- **沒有傳入事件：** 確認 Webhook 路徑符合 `channels.line.webhookPath`，
  且 LINE 能連線到 Gateway。
- **媒體下載錯誤：** 如果媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關

- [通道概觀](/zh-TW/channels) — 所有支援的通道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
