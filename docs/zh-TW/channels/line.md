---
read_when:
    - 你想要將 OpenClaw 連接到 LINE
    - 你需要設定 LINE 網路鉤子和認證資訊
    - 你需要 LINE 專用的訊息選項
summary: LINE Messaging API 外掛設定、組態與使用方式
title: LINE
x-i18n:
    generated_at: "2026-07-12T14:18:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接至 OpenClaw。此外掛在閘道上作為網路鉤子
接收器執行，並使用你的頻道存取權杖 + 頻道密鑰進行
驗證。

狀態：官方外掛，需另外安裝。支援私訊、群組聊天、媒體、
位置、Flex 訊息、範本訊息及快速回覆。
不支援表情回應與討論串。

## 安裝

設定頻道前，請先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機簽出版本（從 git 儲存庫執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳號並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選擇）Provider，並新增 **Messaging API** 頻道。
3. 從頻道設定中複製 **Channel access token** 與 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將網路鉤子 URL 設定為你的閘道端點（必須使用 HTTPS）：

```text
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子驗證（GET），並在簽章與承載資料驗證後立即確認
已簽章的傳入事件（POST）；代理程式處理則會以非同步方式繼續進行。
若需要自訂路徑，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE 簽章驗證取決於本文內容（對原始本文進行 HMAC），因此 OpenClaw 會在驗證前套用嚴格的本文大小限制（64 KB）與讀取逾時。
- OpenClaw 會從已驗證的原始請求位元組處理網路鉤子事件。為確保簽章完整性，會忽略上游中介軟體轉換過的 `req.body` 值。

## 配置

最小配置：

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

公開私訊配置：

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

`tokenFile` 與 `secretFile` 必須指向一般檔案。不接受符號連結。
行內配置值優先於檔案；對預設帳號而言，環境變數是最後的備援來源。

多帳號：

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

私訊預設使用配對。未知傳送者會收到配對碼，其
訊息在核准前會被忽略：

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與政策：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`（預設為 `pairing`）
- `channels.line.allowFrom`：私訊允許清單中的 LINE 使用者 ID；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`（預設為 `allowlist`）
- `channels.line.groupAllowFrom`：群組允許清單中的 LINE 使用者 ID
- 各群組覆寫設定：`channels.line.groups.<groupId>.allowFrom`（以及 `enabled`、`requireMention`、`systemPrompt`、`skills`）
- 靜態傳送者存取群組可透過 `accessGroup:<name>`，從 `allowFrom`、`groupAllowFrom` 及各群組的 `allowFrom` 中參照；請參閱[存取群組](/zh-TW/channels/access-groups)。
- 執行階段注意事項：若完全缺少 `channels.line`，執行階段會在群組檢查時回復使用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 格式如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- Markdown 格式會被移除；程式碼區塊與表格會在可能的情況下轉換成 Flex
  卡片。
- 串流回應會先經過緩衝；代理程式處理期間，LINE 會顯示載入
  動畫並接收完整區塊。
- 媒體下載受 `channels.line.mediaMaxMb` 限制（預設為 10）。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/`，再傳遞
  給代理程式，與其他頻道外掛使用的共用媒體儲存區一致。

## 頻道資料（豐富訊息）

使用 `channelData.line` 傳送快速回覆、位置、Flex 卡片或範本
訊息。

```json5
{
  text: "這就給你",
  channelData: {
    line: {
      quickReplies: ["狀態", "說明"],
      location: {
        title: "辦公室",
        address: "123 Main St",
        latitude: 35.681236,
        longitude: 139.767125,
      },
      flexMessage: {
        altText: "狀態卡片",
        contents: {/* Flex 承載資料 */},
      },
      templateMessage: {
        type: "confirm",
        text: "要繼續嗎？",
        confirmLabel: "是",
        confirmData: "yes",
        cancelLabel: "否",
        cancelData: "no",
      },
    },
  },
}
```

LINE 外掛也隨附用於 Flex 訊息預設的 `/card` 命令：

```text
/card info "歡迎" "感謝你的加入！"
```

## ACP 支援

LINE 支援 ACP（代理程式通訊協定）對話繫結：

- `/acp spawn <agent> --bind here` 會將目前的 LINE 聊天繫結至 ACP 工作階段，而不建立子討論串。
- 已配置的 ACP 繫結及作用中的對話繫結 ACP 工作階段，在 LINE 上的運作方式與其他對話頻道相同。

詳情請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE 外掛透過代理程式訊息工具傳送圖片、影片及音訊：

- **圖片**：以 LINE 圖片訊息傳送；預覽圖片預設使用媒體 URL。
- **影片**：需要預覽圖片；將 `channelData.line.previewImageUrl` 設定為圖片 URL。
- **音訊**：以 LINE 音訊訊息傳送；除非已設定 `channelData.line.durationMs`，否則持續時間預設為 60 秒。

設定 `channelData.line.mediaKind` 時，會以其值判定媒體種類；否則會根據
其他 LINE 選項或 URL 檔案副檔名推斷，並以圖片作為備援。

傳出媒體 URL 必須是公開的 HTTPS URL，且最多 2000 個字元。OpenClaw
會先驗證目標主機名稱，再將 URL 交給 LINE，並拒絕回送、
連結本機及私人網路目標。

未指定 LINE 專用選項的一般媒體傳送會使用圖片路徑。

## 疑難排解

- **網路鉤子驗證失敗：**請確認網路鉤子 URL 使用 HTTPS，且
  `channelSecret` 與 LINE Console 相符。
- **沒有傳入事件：**請確認網路鉤子路徑與 `channels.line.webhookPath`
  相符，且 LINE 可連線至閘道。
- **媒體下載錯誤：**若媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及閘控
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化
