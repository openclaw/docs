---
read_when:
    - 您想將 OpenClaw 連接到 LINE
    - 您需要設定 LINE 網路鉤子和憑證
    - 您需要 LINE 專用的訊息參數
summary: LINE Messaging API 外掛的設定、組態與使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9a6c76ea64b92b76dd2f6ab0d9fff7eb316e1940ba660d65262307796b5a6abc
    source_path: ru/channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接到 OpenClaw。外掛作為閘道上的網路鉤子接收器運作，並使用你的 channel access token + channel secret 進行驗證。

狀態：可載入外掛。支援私人訊息、群組聊天、媒體、位置、Flex messages、template messages 和快速回覆。 不支援回應和執行緒。

## 安裝

設定通道前先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機工作副本（從 git 儲存庫執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers 帳號並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選取）Provider，並新增 **Messaging API** 通道。
3. 從通道設定複製 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API 設定中啟用 **Use webhook**。
5. 為你的閘道端點設定網路鉤子 URL（需要 HTTPS）：

```
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子驗證（GET），並在完成簽章與承載資料驗證後立即確認已簽署的傳入事件（POST）；代理程式處理會以非同步方式繼續。
如果需要自訂路徑，請設定 `channels.line.webhookPath` 或 `channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE 簽章驗證取決於請求本文（對原始本文進行 HMAC），因此 OpenClaw 會在驗證前套用嚴格的本文大小限制與逾時。
- OpenClaw 會從已驗證的請求原始位元組處理網路鉤子事件。為維持簽章完整性，會忽略上游中介軟體轉換過的 `req.body` 值。

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

開放私人訊息組態：

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

環境變數（僅預設帳號）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret 檔案：

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

私人訊息預設需要配對。未知寄件者會收到配對代碼，而他們的訊息會在核准前被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與政策：

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: 允許私人訊息的 LINE 使用者 ID；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 允許群組的 LINE 使用者 ID
- 個別群組覆寫：`channels.line.groups.<groupId>.allowFrom`
- 靜態寄件者存取群組可透過 `accessGroup:<name>` 從 `allowFrom`、`groupAllowFrom` 和群組 `allowFrom` 參照。
- runtime 注意事項：如果 `channels.line` 完全不存在，runtime 會回退到 `groupPolicy="allowlist"` 來進行群組檢查（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分段。
- Markdown 格式會被移除；程式碼區塊和表格會在可行情況下轉換為 Flex cards。
- 串流回覆會被緩衝；代理程式執行時，LINE 會收到完整片段並顯示載入動畫。
- 媒體下載受 `channels.line.mediaMaxMb` 限制（預設為 10）。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/`，再傳遞給代理程式，這與其他內建通道外掛使用的共用媒體儲存一致。

## 通道資料（進階訊息）

使用 `channelData.line` 傳送快速回覆、位置、Flex cards 或 template messages。

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

LINE 外掛也隨附 `/card` 命令，可用於 Flex messages 預設集：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP（Agent Communication Protocol）對話綁定：

- `/acp spawn <agent> --bind here` 會將目前的 LINE 聊天綁定到 ACP 工作階段，而不建立子執行緒。
- 已設定的 ACP 綁定與綁定至對話的作用中 ACP 工作階段，在 LINE 中的運作方式與其他對話通道相同。

詳情請參閱 [ACP 代理程式](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE 外掛支援透過代理程式訊息工具傳送圖片、影片和音訊檔案。媒體會透過 LINE 專用傳遞路徑傳送，並進行相應的預覽處理與追蹤：

- **圖片**：以 LINE 圖片訊息傳送，並自動產生預覽。
- **影片**：以明確的預覽與內容類型處理傳送。
- **音訊**：以 LINE 音訊訊息傳送。

傳出媒體 URL 必須是公開 HTTPS URL。OpenClaw 會先檢查目標主機名稱，再將 URL 傳遞給 LINE，並拒絕 local loopback、link-local 和私有網路目標。

當 LINE 專用路徑不可用時，通用媒體傳送只會針對圖片回退到現有路由。

## 疑難排解

- **網路鉤子驗證失敗：** 請確認網路鉤子 URL 使用 HTTPS，且 `channelSecret` 與 LINE console 相符。
- **沒有傳入事件：** 請確認網路鉤子路徑符合 `channels.line.webhookPath`，且 LINE 可連線到閘道。
- **媒體下載錯誤：** 如果媒體超過預設限制，請增加 `channels.line.mediaMaxMb`。

## 另請參閱

- [通道總覽](/zh-TW/channels) — 所有支援的通道
- [配對](/zh-TW/channels/pairing) — 私人訊息驗證與配對流程
- [群組](/zh-TW/channels/groups) — 群組聊天行為與提及限制
- [通道路由](/zh-TW/channels/channel-routing) — 訊息的工作階段路由
- [安全性](/zh-TW/gateway/security) — 存取模型與防護強化
