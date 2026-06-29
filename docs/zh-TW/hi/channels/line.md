---
read_when:
    - 您想將 OpenClaw 連接到 LINE
    - 您需要設定 LINE 網路鉤子與憑證
    - 您想要 LINE 專屬的訊息選項
summary: LINE Messaging API 外掛設定、配置與使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T22:33:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE 透過 LINE Messaging API 連接到 OpenClaw。外掛會在閘道上以網路鉤子
接收器的形式執行，並使用您的頻道存取權杖 + 頻道密鑰進行驗證。

狀態：可下載的外掛。支援直接訊息、群組聊天、媒體、位置資訊、Flex
訊息、範本訊息和快速回覆。不支援回應和串連討論。

## 安裝

設定頻道之前，請先安裝 LINE：

```bash
openclaw plugins install @openclaw/line
```

本機 checkout（從 git repo 執行時）：

```bash
openclaw plugins install ./path/to/local/line-plugin
```

## 設定

1. 建立 LINE Developers account 並開啟 Console：
   [https://developers.line.biz/console/](https://developers.line.biz/console/)
2. 建立（或選擇）一個 Provider，並新增 **Messaging API** channel。
3. 從 channel settings 複製 **Channel access token** 和 **Channel secret**。
4. 在 Messaging API settings 中啟用 **Use webhook**。
5. 將 Webhook URL 設為您的閘道 endpoint（必須使用 HTTPS）：

```
https://gateway-host/line/webhook
```

閘道會回應 LINE 的網路鉤子 verification (GET)，並在 signature 與 payload validation 後立即接受 signed
inbound events (POST)；agent
processing 會以非同步方式繼續。
如果您需要 custom path，請設定 `channels.line.webhookPath` 或
`channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE signature verification 依賴 body（對 raw body 進行 HMAC），因此 OpenClaw 會在 verification 前套用嚴格的 pre-auth body limits 和 timeout。
- OpenClaw 會從已驗證的 raw request bytes 處理網路鉤子 events。為了 signature-integrity safety，會忽略 upstream middleware-transformed `req.body` values。

## 設定組態

最小 config：

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

Public DM config：

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

Env vars（僅 default account）：

- `LINE_CHANNEL_ACCESS_TOKEN`
- `LINE_CHANNEL_SECRET`

Token/secret files：

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

`tokenFile` 和 `secretFile` 應指向 regular files。Symlinks 會被拒絕。

多個 accounts：

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

私訊預設使用配對。未知寄件者會收到配對碼，且他們的
訊息在核准前會被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

允許清單與政策：

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: 用於私訊的允許清單 LINE 使用者 ID；若為 `dmPolicy: "open"`，則需要 `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: 用於群組的允許清單 LINE 使用者 ID
- 每個群組的覆寫：`channels.line.groups.<groupId>.allowFrom`
- 靜態寄件者存取群組可以透過 `allowFrom`、`groupAllowFrom` 和每個群組的 `allowFrom`，使用 `accessGroup:<name>` 來引用。
- 執行階段注意事項：如果 `channels.line` 完全缺失，執行階段會針對群組檢查 fallback 到 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE ID 區分大小寫。有效 ID 如下：

- 使用者：`U` + 32 個十六進位字元
- 群組：`C` + 32 個十六進位字元
- 聊天室：`R` + 32 個十六進位字元

## 訊息行為

- 文字會以 5000 個字元為單位分成多個區塊。
- Markdown 格式會被移除；code blocks 和 tables 會在可行時轉換成 Flex
  cards。
- Streaming responses 會被緩衝；agent 工作時，LINE 會收到帶有 loading
  animation 的完整區塊。
- 媒體下載會受 `channels.line.mediaMaxMb`（預設 10）限制。
- 傳入媒體會先儲存在 `~/.openclaw/media/inbound/` 之下，再傳遞給 agent，
  這與其他 bundled channel
  plugins 使用的 shared media store 一致。

## 頻道資料（豐富訊息）

使用 `channelData.line` 傳送 quick replies、locations、Flex cards 或 template
messages。

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

LINE 外掛也提供用於 Flex message presets 的 `/card` command：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP（Agent Communication Protocol）conversation bindings：

- `/acp spawn <agent> --bind here` 會將目前的 LINE chat 綁定到 ACP session，而不建立 child thread。
- 已設定的 ACP bindings 和 active conversation-bound ACP sessions，在 LINE 上的運作方式與其他 conversation channels 相同。

如需詳細資訊，請參閱 [ACP agents](/zh-TW/tools/acp-agents)。

## 傳出媒體

LINE 外掛支援透過 agent message tool 傳送 images、videos 和 audio files。Media 會透過 LINE-specific delivery path 傳送，並具備適當的 preview 和 tracking handling：

- **圖片**：以 LINE image messages 傳送，並自動產生 preview。
- **影片**：以明確的 preview 和 content-type handling 傳送。
- **音訊**：以 LINE audio messages 傳送。

Outbound media URLs 必須是 public HTTPS URLs。OpenClaw 會在將 URL 交給 LINE 前驗證 target hostname，並拒絕 loopback、link-local 和 private-network targets。

Generic media sends 會在 LINE-specific path 不可用時 fallback 到 existing image-only route。

## 疑難排解

- **Webhook 驗證失敗：** 確認 Webhook URL 是 HTTPS，且
  `channelSecret` 與 LINE console 相符。
- **沒有傳入事件：** 確認 Webhook path 與 `channels.line.webhookPath` 相符，
  且 Gateway 可由 LINE 連線。
- **媒體下載錯誤：** 如果 media 超過 default limit，請提高 `channels.line.mediaMaxMb`。

## 相關內容

- [頻道總覽](/zh-TW/channels) — 所有支援的 channels
- [配對](/zh-TW/channels/pairing) — DM authentication 和 pairing flow
- [群組](/zh-TW/channels/groups) — group chat behavior 和 mention gating
- [頻道路由](/zh-TW/channels/channel-routing) — messages 的 session routing
- [安全性](/zh-TW/gateway/security) — access model 和 hardening
