---
read_when:
    - 您想將 OpenClaw 連接到 LINE
    - 你需要 LINE 網路鉤子 + 憑證設定
    - 您想要 LINE 專屬的訊息選項
summary: LINE Messaging API 外掛設定、組態與使用
title: LINE
x-i18n:
    generated_at: "2026-06-28T20:43:16Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d54b6740c3403d8fb2e815d969d891973d88c2e2ff43e9de7642c1c81d36e090
    source_path: hi/channels/line.md
    workflow: 16
---

LINE 會透過 LINE Messaging API 連接到 OpenClaw。外掛會在閘道上作為網路鉤子接收器執行，並使用你的 channel access token + channel secret 進行驗證。

狀態：可下載外掛。支援 direct messages、group chats、media、locations、Flex messages、template messages 與 quick replies。不支援 Reactions 和 threads。

## 安裝

在設定 channel 前先安裝 LINE：

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
5. 將 Webhook URL 設為你的閘道端點（必須使用 HTTPS）：

```
https://gateway-host/line/webhook
```

閘道會回應 LINE 的 Webhook verification (GET)，並在 signature 與 payload validation 後立即接受已簽署的 inbound events (POST)；agent processing 會以非同步方式繼續。
如果你需要 custom path，請設定 `channels.line.webhookPath` 或 `channels.line.accounts.<id>.webhookPath`，並相應更新 URL。

安全性注意事項：

- LINE signature verification 取決於 body（對 raw body 執行 HMAC），因此 OpenClaw 會在 verification 前套用 strict pre-auth body limits 和 timeout。
- OpenClaw 會從 verified raw request bytes 處理 Webhook events。為了 signature-integrity safety，會忽略 upstream middleware-transformed `req.body` values。

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

Env vars（僅限 default account）：

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

Direct messages 預設使用 pairing。未知 senders 會收到 pairing code，在其 messages 獲准前會被忽略。

```bash
openclaw pairing list line
openclaw pairing approve line <CODE>
```

Allowlists 和 policies：

- `channels.line.dmPolicy`: `pairing | allowlist | open | disabled`
- `channels.line.allowFrom`: DMs 的 allowlisted LINE user IDs；`dmPolicy: "open"` 需要 `["*"]`
- `channels.line.groupPolicy`: `allowlist | open | disabled`
- `channels.line.groupAllowFrom`: groups 的 allowlisted LINE user IDs
- Per-group overrides: `channels.line.groups.<groupId>.allowFrom`
- Static sender access groups 可以透過 `allowFrom`、`groupAllowFrom` 和 per-group `allowFrom` 中的 `accessGroup:<name>` 參照。
- Runtime note：如果 `channels.line` 完全 missing，runtime 會針對 group checks fallback 至 `groupPolicy="allowlist"`（即使已設定 `channels.defaults.groupPolicy`）。

LINE IDs 區分大小寫。Valid IDs 如下：

- User: `U` + 32 hex chars
- Group: `C` + 32 hex chars
- Room: `R` + 32 hex chars

## 訊息行為

- Text 會以 5000 characters 為單位切分成 chunks。
- Markdown formatting 會被移除；code blocks 和 tables 會在可能時轉換為 Flex cards。
- Streaming responses 會被 buffered；agent 工作期間，LINE 會收到帶有 loading animation 的完整 chunks。
- Media downloads 受 `channels.line.mediaMaxMb`（default 10）限制。
- Inbound media 在傳給 agent 前會儲存在 `~/.openclaw/media/inbound/` 底下，這與其他 bundled channel plugins 使用的 shared media store 相符。

## Channel data（rich messages）

若要傳送 quick replies、locations、Flex cards 或 template messages，請使用 `channelData.line`。

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

LINE 外掛也隨附用於 Flex message presets 的 `/card` command：

```
/card info "Welcome" "Thanks for joining!"
```

## ACP 支援

LINE 支援 ACP (Agent Communication Protocol) conversation bindings：

- `/acp spawn <agent> --bind here` 會將目前 LINE chat 綁定到 ACP session，而不建立 child thread。
- Configured ACP bindings 和 active conversation-bound ACP sessions 在 LINE 上會像其他 conversation channels 一樣運作。

詳情請參閱 [ACP agents](/zh-TW/tools/acp-agents)。

## Outbound media

LINE 外掛支援透過 agent message tool 傳送 images、videos 和 audio files。Media 會透過 LINE-specific delivery path 傳送，並具備適當的 preview 和 tracking handling：

- **Images**：以 LINE image messages 傳送，並自動產生 preview。
- **Videos**：以 explicit preview 和 content-type handling 傳送。
- **Audio**：以 LINE audio messages 傳送。

Outbound media URLs 必須是 public HTTPS URLs。OpenClaw 會在將 URL 交給 LINE 前驗證 target hostname，並拒絕 loopback、link-local 和 private-network targets。

當 LINE-specific path 不可用時，Generic media sends 會 fallback 至 existing image-only route。

## 疑難排解

- **Webhook verification fails:** 確認 Webhook URL 使用 HTTPS，且 `channelSecret` 與 LINE console 相符。
- **No inbound events:** 確認 Webhook path 與 `channels.line.webhookPath` 相符，且閘道可由 LINE 連線。
- **Media download errors:** 如果 media 超過 default limit，請提高 `channels.line.mediaMaxMb`。

## 相關

- [Channels Overview](/zh-TW/channels) — 所有支援的 channels
- [Pairing](/zh-TW/channels/pairing) — DM authentication 和 pairing flow
- [Groups](/zh-TW/channels/groups) — group chat behavior 和 mention gating
- [Channel Routing](/zh-TW/channels/channel-routing) — messages 的 session routing
- [Security](/zh-TW/gateway/security) — access model 和 hardening
