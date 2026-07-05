---
read_when:
    - 你想將 OpenClaw 連接到 LINE
    - 你需要 LINE 網路鉤子與憑證設定
    - 你想要 LINE 專屬訊息選項
summary: LINE Messaging API 外掛的設置、組態與使用方式
title: LINE
x-i18n:
    generated_at: "2026-07-05T11:03:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: abad928180a8b5590ab32a28688531214b78eaee104e6b82f068ae48e2e930f0
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接到 OpenClaw。此外掛作為閘道上的網路鉤子
接收器執行，並使用你的頻道存取權杖與頻道密鑰進行
驗證。

狀態：官方外掛，需另行安裝。支援直接訊息、群組聊天、媒體、
位置、Flex 訊息、範本訊息與快速回覆。
不支援反應和執行緒。

## 安裝

設定頻道前，先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳號並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選取）Provider，並新增 **Messaging API** 頻道。
3. 從頻道設定複製 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將網路鉤子 URL 設為你的閘道端點（需要 HTTPS）：

```text
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子驗證（GET），並在簽章與負載驗證後立即確認已簽章的
傳入事件（POST）；agent
處理會繼續以非同步方式進行。
如果需要自訂路徑，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全注意事項：

- LINE 簽章驗證依賴本文（對原始本文執行 HMAC），因此 OpenClaw 會在驗證前套用嚴格的預先驗證本文限制（64 KB）與讀取逾時。
- OpenClaw 會從已驗證的原始請求位元組處理網路鉤子事件。為了簽章完整性安全，會忽略上游中介軟體轉換過的 `req.body` 值。

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

公開 DM 設定：

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

`tokenFile` 和 `secretFile` 必須指向一般檔案。會拒絕符號連結。
行內設定值優先於檔案；環境變數是預設帳號的最後備援。

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

直接訊息預設為配對。未知寄件者會取得配對碼，且其
訊息會被忽略，直到核准為止：

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與政策：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`（預設 `pairing`）
- `channels.line.allowFrom`：允許清單中的 LINE 使用者 ID，用於 DM；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`（預設 `allowlist`）
- `channels.line.groupAllowFrom`：允許清單中的 LINE 使用者 ID，用於群組
- 個別群組覆寫：`channels.line.groups.<groupId>.allowFrom`（加上 `enabled`、`requireMention`、`systemPrompt`、`skills`）
- 靜態寄件者存取群組可由 `allowFrom`、`groupAllowFrom` 和個別群組 `allowFrom` 以 `accessGroup:<name>` 參照；請參閱[存取群組](/zh-TW/channels/access-groups)。
- 執行階段注意事項：如果完全缺少 `channels.line`，執行階段會在群組檢查時回退到 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- Markdown 格式會被移除；程式碼區塊和表格會盡可能轉換為 Flex
  卡片。
- 串流回應會被緩衝；agent 工作時，LINE 會收到帶有載入
  動畫的完整分段。
- 媒體下載受 `channels.line.mediaMaxMb` 限制（預設 10）。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/` 底下，再傳遞
  給 agent，與其他頻道外掛使用的共享媒體儲存區一致。

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

LINE 外掛也隨附 `/card` 命令，可用於 Flex 訊息預設：

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP（Agent Communication Protocol）對話綁定：

- `/acp spawn <agent> --bind here` 會將目前 LINE 聊天綁定到 ACP 工作階段，而不建立子執行緒。
- 已設定的 ACP 綁定與作用中的對話綁定 ACP 工作階段，在 LINE 上會像其他對話頻道一樣運作。

詳情請參閱 [ACP agents](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE 外掛會透過 agent 訊息工具傳送圖片、影片和音訊：

- **圖片**：以 LINE 圖片訊息傳送；預覽圖片預設為媒體 URL。
- **影片**：需要預覽圖片；將 `channelData.line.previewImageUrl` 設為圖片 URL。
- **音訊**：以 LINE 音訊訊息傳送；除非設定 `channelData.line.durationMs`，否則時長預設為 60 秒。

設定時，媒體種類會取自 `channelData.line.mediaKind`，否則會從
其他 LINE 選項或 URL 檔案副檔名推斷，並以圖片作為備援。

傳出媒體 URL 必須是最多 2000 個字元的公開 HTTPS URL。OpenClaw
會先驗證目標主機名稱，再將 URL 交給 LINE，並拒絕 loopback、
link-local 和 private-network 目標。

未使用 LINE 專屬選項的一般媒體傳送會使用圖片路由。

## 疑難排解

- **網路鉤子驗證失敗：** 確認網路鉤子 URL 是 HTTPS，且
  `channelSecret` 與 LINE console 相符。
- **沒有傳入事件：** 確認網路鉤子路徑符合 `channels.line.webhookPath`，
  且閘道可由 LINE 連線。
- **媒體下載錯誤：** 如果媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關

- [頻道概觀](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — DM 驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與強化
