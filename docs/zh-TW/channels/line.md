---
read_when:
    - 你想將 OpenClaw 連接到 LINE
    - 你需要 LINE 網路鉤子與憑證設定
    - 你想要 LINE 專屬的訊息選項
summary: LINE Messaging API 外掛設定、組態與使用方式
title: LINE
x-i18n:
    generated_at: "2026-06-27T16:32:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c27572d1db71d1f46b4e6ee68aa03bdbec8f90ed7fb0884f0185ea4aa877468a
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接到 OpenClaw。外掛會在閘道上作為網路鉤子
接收器執行，並使用你的通道存取權杖 + 通道密鑰進行
驗證。

狀態：可下載外掛。支援直接訊息、群組聊天、媒體、位置、Flex
訊息、範本訊息與快速回覆。不支援反應和討論串。

## 安裝

設定通道之前，請先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳戶並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選擇）Provider，並新增 **Messaging API** 通道。
3. 從通道設定複製 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將網路鉤子 URL 設為你的閘道端點（必須使用 HTTPS）：

```
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子驗證（GET），並在簽章和酬載驗證後立即確認已簽章的
傳入事件（POST）；代理處理會繼續非同步進行。
如果你需要自訂路徑，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE 簽章驗證取決於本文（對原始本文執行 HMAC），因此 OpenClaw 會在驗證前套用嚴格的預先驗證本文限制與逾時。
- OpenClaw 會從已驗證的原始請求位元組處理網路鉤子事件。為了簽章完整性安全，會忽略上游中介軟體轉換過的 `req.body` 值。

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

公開直接訊息組態：

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

直接訊息預設使用配對。未知傳送者會收到配對碼，而他們的
訊息在核准前會被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單和政策：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`
- `channels.line.allowFrom`：允許用於直接訊息的 LINE 使用者 ID；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`
- `channels.line.groupAllowFrom`：允許用於群組的 LINE 使用者 ID
- 個別群組覆寫：`channels.line.groups.<groupId>.allowFrom`
- 靜態傳送者存取群組可透過 `accessGroup:<name>` 從 `allowFrom`、`groupAllowFrom` 和個別群組的 `allowFrom` 參照。
- 執行階段注意事項：如果完全缺少 `channels.line`，執行階段會在群組檢查時退回使用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 類似：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- Markdown 格式會被移除；程式碼區塊和表格會在可行時轉換為 Flex
  卡片。
- 串流回應會被緩衝；當代理工作時，LINE 會收到完整分段並顯示載入
  動畫。
- 媒體下載受 `channels.line.mediaMaxMb` 限制（預設 10）。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/` 底下，再傳遞給
  代理，這與其他內建通道外掛使用的共用媒體儲存區一致。

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

LINE 外掛也提供用於 Flex 訊息預設集的 `/card` 命令：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP（Agent Communication Protocol）對話繫結：

- `/acp spawn <agent> --bind here` 會將目前的 LINE 聊天繫結到 ACP 工作階段，而不建立子討論串。
- 已設定的 ACP 繫結和作用中的對話繫結 ACP 工作階段在 LINE 上的運作方式與其他對話通道相同。

詳情請參閱 [ACP 代理](/zh-TW/tools/acp-agents)。

## 對外媒體

LINE 外掛支援透過代理訊息工具傳送圖片、影片和音訊檔案。媒體會透過 LINE 專用的傳遞路徑傳送，並包含適當的預覽與追蹤處理：

- **圖片**：以 LINE 圖片訊息傳送，並自動產生預覽。
- **影片**：以明確的預覽和內容類型處理傳送。
- **音訊**：以 LINE 音訊訊息傳送。

對外媒體 URL 必須是公開 HTTPS URL。OpenClaw 會在將 URL 交給 LINE 前驗證目標主機名稱，並拒絕 loopback、link-local 和私人網路目標。

當 LINE 專用路徑不可用時，一般媒體傳送會退回到既有的僅圖片路由。

## 疑難排解

- **網路鉤子驗證失敗：** 請確認網路鉤子 URL 使用 HTTPS，且
  `channelSecret` 與 LINE console 相符。
- **沒有傳入事件：** 確認網路鉤子路徑符合 `channels.line.webhookPath`，
  且 LINE 可以連到閘道。
- **媒體下載錯誤：** 如果媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關

- [通道總覽](/zh-TW/channels) — 所有支援的通道
- [配對](/zh-TW/channels/pairing) — 直接訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及門檻
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
