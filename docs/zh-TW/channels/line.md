---
read_when:
    - 你想要將 OpenClaw 連接至 LINE
    - 你需要設定 LINE 網路鉤子與憑證
    - 你想要 LINE 專用的訊息選項
summary: LINE Messaging API 外掛的設定、配置與使用方式
title: LINE
x-i18n:
    generated_at: "2026-07-11T21:08:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ee5931c2bfca4a67a8b390f300907cd31a074988b10c6c0540444cff0bfde334
    source_path: channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接至 OpenClaw。此外掛在閘道上作為網路鉤子接收器執行，並使用你的頻道存取權杖與頻道密鑰進行驗證。

狀態：官方外掛，需另行安裝。支援私訊、群組聊天、媒體、位置、Flex 訊息、範本訊息及快速回覆。不支援表情回應與討論串。

## 安裝

設定頻道前，先安裝 LINE：

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
2. 建立（或選取）Provider，並新增 **Messaging API** 頻道。
3. 從頻道設定中複製 **Channel access token** 與 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 將網路鉤子 URL 設為你的閘道端點（必須使用 HTTPS）：

```text
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子驗證（GET），並在驗證簽章及承載資料後，立即確認收到已簽署的傳入事件（POST）；代理程式處理會以非同步方式繼續進行。
如需自訂路徑，請設定 `channels.line.webhookPath` 或 `channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE 的簽章驗證取決於本文內容（對原始本文執行 HMAC），因此 OpenClaw 會在驗證前套用嚴格的本文大小限制（64 KB）與讀取逾時。
- OpenClaw 會根據已驗證的原始請求位元組處理網路鉤子事件。為確保簽章完整性安全，會忽略經上游中介軟體轉換的 `req.body` 值。

## 組態

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

環境變數（僅適用於預設帳號）：

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
行內組態值優先於檔案；對預設帳號而言，環境變數是最後的備援來源。

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

私訊預設使用配對。未知傳送者會取得配對碼，其訊息在獲得核准前將被忽略：

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與政策：

- `channels.line.dmPolicy`：`pairing | allowlist | open | disabled`（預設為 `pairing`）
- `channels.line.allowFrom`：私訊允許清單中的 LINE 使用者 ID；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`：`allowlist | open | disabled`（預設為 `allowlist`）
- `channels.line.groupAllowFrom`：群組允許清單中的 LINE 使用者 ID
- 各群組覆寫：`channels.line.groups.<groupId>.allowFrom`（以及 `enabled`、`requireMention`、`systemPrompt`、`skills`）
- `allowFrom`、`groupAllowFrom` 及各群組的 `allowFrom` 可使用 `accessGroup:<name>` 參照靜態傳送者存取群組；請參閱[存取群組](/zh-TW/channels/access-groups)。
- 執行階段注意事項：若完全缺少 `channels.line`，執行階段會在群組檢查時退回使用 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 的格式如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- 會移除 Markdown 格式；若可行，程式碼區塊和表格會轉換為 Flex 卡片。
- 串流回應會先緩衝；代理程式運作期間，LINE 會顯示載入動畫，並接收完整的訊息分段。
- 媒體下載大小受 `channels.line.mediaMaxMb` 限制（預設為 10）。
- 傳入媒體會先儲存至 `~/.openclaw/media/inbound/`，再傳遞給代理程式；此路徑與其他頻道外掛使用的共用媒體儲存區一致。

## 頻道資料（豐富訊息）

使用 `channelData.line` 傳送快速回覆、位置、Flex 卡片或範本訊息。

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
        contents: {/* Flex payload */},
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

LINE 外掛也提供用於 Flex 訊息預設樣式的 `/card` 命令：

```text
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP（代理程式通訊協定）對話繫結：

- `/acp spawn <agent> --bind here` 會將目前的 LINE 聊天繫結至 ACP 工作階段，而不建立子討論串。
- 已設定的 ACP 繫結和作用中的對話繫結 ACP 工作階段，在 LINE 上的運作方式與其他對話頻道相同。

詳情請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE 外掛會透過代理程式訊息工具傳送圖片、影片與音訊：

- **圖片**：以 LINE 圖片訊息傳送；預覽圖片預設使用媒體 URL。
- **影片**：需要預覽圖片；請將 `channelData.line.previewImageUrl` 設為圖片 URL。
- **音訊**：以 LINE 音訊訊息傳送；除非設定 `channelData.line.durationMs`，否則持續時間預設為 60 秒。

若有設定 `channelData.line.mediaKind`，便以其決定媒體類型；否則會從其他 LINE 選項或 URL 檔案副檔名推斷，並以圖片作為備援類型。

傳出媒體 URL 必須是公開的 HTTPS URL，且長度不得超過 2000 個字元。OpenClaw 會先驗證目標主機名稱，再將 URL 交給 LINE，並拒絕回送、本機連結及私人網路目標。

未使用 LINE 專屬選項的一般媒體傳送會採用圖片路徑。

## 疑難排解

- **網路鉤子驗證失敗：**請確認網路鉤子 URL 使用 HTTPS，且 `channelSecret` 與 LINE Console 中的值相符。
- **沒有傳入事件：**請確認網路鉤子路徑與 `channels.line.webhookPath` 相符，且 LINE 可連線至閘道。
- **媒體下載錯誤：**若媒體超過預設限制，請提高 `channels.line.mediaMaxMb`。

## 相關內容

- [頻道概覽](/zh-TW/channels) — 所有支援的頻道
- [配對](/zh-TW/channels/pairing) — 私訊驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及限制
- [頻道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與安全強化
