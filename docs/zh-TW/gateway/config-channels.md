---
read_when:
    - 設定通道外掛（驗證、存取控制、多帳號）
    - 排除各通道設定鍵問題
    - 稽核私訊政策、群組政策或提及閘控
summary: 頻道設定：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等的存取控制、配對與各頻道金鑰
title: 設定 — 通道
x-i18n:
    generated_at: "2026-07-01T10:58:12Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 下的各通道設定鍵。涵蓋 DM 與群組存取、多帳號設定、提及閘控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他內建通道外掛的各通道鍵。

若要設定代理程式、工具、閘道執行階段與其他頂層鍵，請參閱
[設定參考](/zh-TW/gateway/configuration-reference)。

## 通道

每個通道會在其設定區段存在時自動啟動（除非設定 `enabled: false`）。

### DM 與群組存取

所有通道都支援 DM 政策與群組政策：

| DM 政策             | 行為                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（預設） | 未知寄件者會取得一次性配對碼；擁有者必須核准 |
| `allowlist`         | 僅允許 `allowFrom`（或已配對允許儲存區）中的寄件者             |
| `open`              | 允許所有傳入 DM（需要 `allowFrom: ["*"]`）             |
| `disabled`          | 忽略所有傳入 DM                                          |

| 群組政策            | 行為                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（預設） | 僅允許符合已設定允許清單的群組          |
| `open`                | 略過群組允許清單（仍會套用提及閘控） |
| `disabled`            | 封鎖所有群組/聊天室訊息                          |

<Note>
`channels.defaults.groupPolicy` 會在提供者的 `groupPolicy` 未設定時設定預設值。
配對碼會在 1 小時後過期。待處理的 DM 配對請求上限為**每個通道 3 個**。
如果提供者區塊完全缺失（沒有 `channels.<provider>`），執行階段群組政策會退回到 `allowlist`（預設關閉），並顯示啟動警告。
</Note>

### 通道模型覆寫

使用 `channels.modelByChannel` 將特定通道 ID 或直接訊息對象固定到某個模型。值可接受 `provider/model` 或已設定的模型別名。當工作階段尚未有模型覆寫時（例如透過 `/model` 設定），會套用通道對應。

對於群組/討論串對話，鍵是通道特定的群組 ID、主題 ID 或通道名稱。對於直接訊息（DM）對話，鍵是從通道寄件者身分衍生的對象識別碼（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From` 或 `SenderId`）。確切的鍵形式取決於通道：

| 通道  | DM 鍵形式         | 範例                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 原始使用者 ID         | `123456789`                                  |
| Discord  | 原始使用者 ID         | `987654321`                                  |
| WhatsApp | 電話號碼或 JID | `15551234567`                                |
| Matrix   | Matrix 使用者 ID      | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

DM 專用鍵只會在直接訊息對話中相符；它們不會影響群組/討論串路由。

### 通道預設值與心跳偵測

使用 `channels.defaults` 設定跨提供者共用的群組政策與心跳偵測行為：

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      heartbeat: {
        showOk: false,
        showAlerts: true,
        useIndicator: true,
      },
    },
  },
}
```

- `channels.defaults.groupPolicy`：提供者層級的 `groupPolicy` 未設定時使用的備援群組政策。
- `channels.defaults.contextVisibility`：所有通道的預設補充脈絡可見性模式。值：`all`（預設，包含所有引用/討論串/歷史脈絡）、`allowlist`（僅包含來自允許清單寄件者的脈絡）、`allowlist_quote`（與允許清單相同，但保留明確引用/回覆脈絡）。每通道覆寫：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在心跳偵測輸出中包含健康的通道狀態。
- `channels.defaults.heartbeat.showAlerts`：在心跳偵測輸出中包含降級/錯誤狀態。
- `channels.defaults.heartbeat.useIndicator`：呈現精簡指示器樣式的心跳偵測輸出。

### WhatsApp

WhatsApp 透過閘道的 Web 通道（Baileys Web）執行。當已連結的工作階段存在時，它會自動啟動。

```json5
{
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
    },
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // blue ticks (false in self-chat mode)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- 帶有 `type: "acp"` 的頂層 `bindings[]` 項目會為 WhatsApp DM 與群組設定持久 ACP 繫結。在 `match.peer.id` 中使用 E.164 直接號碼或 WhatsApp 群組 JID。欄位語意在 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)中共用。

<Accordion title="多帳號 WhatsApp">

```json5
{
  channels: {
    whatsapp: {
      accounts: {
        default: {},
        personal: {},
        biz: {
          // authDir: "~/.openclaw/credentials/whatsapp/biz",
        },
      },
    },
  },
}
```

- 如果存在，對外命令預設使用帳號 `default`；否則使用第一個已設定的帳號 ID（排序後）。
- 選用的 `channels.whatsapp.defaultAccount` 會在符合已設定帳號 ID 時覆寫該備援預設帳號選擇。
- 舊版單帳號 Baileys 驗證目錄會由 `openclaw doctor` 遷移到 `whatsapp/default`。
- 每帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

</Accordion>

### Telegram

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "your-bot-token",
      dmPolicy: "pairing",
      allowFrom: ["tg:123456789"],
      groups: {
        "*": { requireMention: true },
        "-1001234567890": {
          allowFrom: ["@admin"],
          systemPrompt: "Keep answers brief.",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "Stay on topic.",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress (default: partial)
      actions: { reactions: true, sendMessage: true },
      reactionNotifications: "own", // off | own | all
      mediaMaxMb: 100,
      retry: {
        attempts: 3,
        minDelayMs: 400,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
      network: {
        autoSelectFamily: true,
        dnsResultOrder: "ipv4first",
      },
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot 權杖：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），預設帳號則以 `TELEGRAM_BOT_TOKEN` 作為備援。
- `apiRoot` 只是 Telegram Bot API 根路徑。請使用 `https://api.telegram.org` 或你的自架/代理根路徑，而不是 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>` 後綴。
- 選用的 `channels.telegram.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 在多帳號設定（2 個以上帳號 ID）中，請設定明確預設值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免備援路由；當缺失或無效時，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖由 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 帶有 `type: "acp"` 的頂層 `bindings[]` 項目會為論壇主題設定持久 ACP 繫結（在 `match.peer.id` 中使用標準 `chatId:topic:topicId`）。欄位語意在 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)中共用。
- Telegram 串流預覽使用 `sendMessage` + `editMessageText`（可用於直接與群組聊天）。
- 重試政策：請參閱[重試政策](/zh-TW/concepts/retry)。

### Discord

```json5
{
  channels: {
    discord: {
      enabled: true,
      token: "your-bot-token",
      mediaMaxMb: 100,
      allowBots: false,
      actions: {
        reactions: true,
        stickers: true,
        polls: true,
        permissions: true,
        messages: true,
        threads: true,
        pins: true,
        search: true,
        memberInfo: true,
        roleInfo: true,
        roles: false,
        channelInfo: true,
        voiceStatus: true,
        events: true,
        moderation: false,
      },
      replyToMode: "off", // off | first | all | batched
      dmPolicy: "pairing",
      allowFrom: ["1234567890", "123456789012345678"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["openclaw-dm"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          ignoreOtherMentions: true,
          reactionNotifications: "own",
          users: ["987654321098765432"],
          channels: {
            general: { allow: true },
            help: {
              allow: true,
              requireMention: true,
              users: ["987654321098765432"],
              skills: ["docs"],
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
          toolProgress: true,
        },
      },
      maxLinesPerMessage: 17,
      ui: {
        components: {
          accentColor: "#5865F2",
        },
      },
      threadBindings: {
        enabled: true,
        idleHours: 24,
        maxAgeHours: 0,
        spawnSessions: true,
        defaultSpawnContext: "fork",
      },
      voice: {
        enabled: true,
        autoJoin: [
          {
            guildId: "123456789012345678",
            channelId: "234567890123456789",
          },
        ],
        daveEncryption: true,
        decryptionFailureTolerance: 24,
        connectTimeoutMs: 30000,
        reconnectGraceMs: 15000,
        tts: {
          provider: "openai",
          openai: { voice: "alloy" },
        },
      },
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["987654321098765432"],
        agentFilter: ["default"],
        sessionFilter: ["discord:"],
        target: "dm", // dm | channel | both
        cleanupAfterResolve: false,
      },
      retry: {
        attempts: 3,
        minDelayMs: 500,
        maxDelayMs: 30000,
        jitter: 0.1,
      },
    },
  },
}
```

- 權杖：`channels.discord.token`，預設帳號以 `DISCORD_BOT_TOKEN` 作為備援。
- 提供明確 Discord `token` 的直接對外呼叫會使用該權杖進行呼叫；帳號重試/政策設定仍來自作用中執行階段快照中選取的帳號。
- 選用的 `channels.discord.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 傳送目標請使用 `user:<id>`（DM）或 `channel:<id>`（伺服器頻道）；裸數字 ID 會被拒絕。
- 伺服器 slug 使用小寫，並將空格替換為 `-`；頻道鍵使用 slug 化名稱（不含 `#`）。建議優先使用伺服器 ID。
- 預設會忽略由機器人撰寫的訊息。`allowBots: true` 會啟用這些訊息；使用 `allowBots: "mentions"` 則只接受提及該機器人的機器人訊息（仍會過濾自己的訊息）。
- 支援機器人撰寫入站訊息的頻道可以使用共用的[機器人迴圈保護](/zh-TW/channels/bot-loop-protection)。設定 `channels.defaults.botLoopProtection` 作為基準配對預算，只有在某個介面需要不同限制時，才覆寫頻道或帳號。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及頻道覆寫）會丟棄提及另一位使用者或角色但未提及機器人的訊息（不含 @everyone/@here）。
- `channels.discord.mentionAliases` 會在傳送前將穩定的對外 `@handle` 文字對應到 Discord 使用者 ID，因此即使暫時性目錄快取為空，也能以確定方式提及已知隊友。每帳號覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases`。
- `maxLinesPerMessage`（預設 17）即使在低於 2000 個字元時，也會分割過高的訊息。
- `channels.discord.suppressEmbeds` 預設為 `true`，因此除非停用，否則對外 URL 不會展開成 Discord 連結預覽。明確的 `embeds` 承載仍會正常傳送；每則訊息的工具呼叫可以用 `suppressEmbeds` 覆寫。
- `channels.discord.threadBindings` 控制 Discord 執行緒綁定路由：
  - `enabled`：執行緒綁定工作階段功能的 Discord 覆寫（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及已綁定的傳送/路由）
  - `idleHours`：以小時為單位的閒置自動取消聚焦 Discord 覆寫（`0` 會停用）
  - `maxAgeHours`：以小時為單位的硬性最長存續時間 Discord 覆寫（`0` 會停用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 與 ACP 執行緒生成自動建立/綁定執行緒的開關（預設：`true`）
  - `defaultSpawnContext`：執行緒綁定生成的原生子代理程式內容（預設為 `"fork"`）
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為頻道和執行緒設定持久 ACP 綁定（在 `match.peer.id` 中使用頻道/執行緒 ID）。欄位語意共用於 [ACP Agents](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
- `channels.discord.ui.components.accentColor` 會設定 Discord components v2 容器的強調色。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord 元件回呼保持註冊的時間長度。預設值為 `1800000`（30 分鐘），最大值為 `86400000`（24 小時），每帳號覆寫位於 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。較長的值會讓舊按鈕/選單/表單可用更久，因此請優先選擇符合工作流程的最短 TTL。
- `channels.discord.voice` 會啟用 Discord 語音頻道對話，以及選用的自動加入 + LLM + TTS 覆寫。純文字 Discord 設定預設會關閉語音；設定 `channels.discord.voice.enabled=true` 以選擇加入。
- `channels.discord.voice.model` 可選擇性覆寫用於 Discord 語音頻道回應的 LLM 模型。
- `channels.discord.voice.daveEncryption` 與 `channels.discord.voice.decryptionFailureTolerance` 會傳遞至 `@discordjs/voice` DAVE 選項（預設分別為 `true` 和 `24`）。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間（預設為 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制已中斷連線的語音工作階段在 OpenClaw 銷毀之前，可花多久進入重新連線訊號狀態（預設為 `15000`）。
- Discord 語音播放不會因另一位使用者開始說話事件而中斷。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取。
- OpenClaw 也會在重複解密失敗後，透過離開/重新加入語音工作階段來嘗試語音接收復原。
- `channels.discord.streaming` 是正式的串流模式鍵。Discord 預設為 `streaming.mode: "progress"`，因此工具/工作進度會顯示在一則經編輯的預覽訊息中；設定 `streaming.mode: "off"` 可停用。舊版 `streamMode` 與布林 `streaming` 值仍是執行階段別名；執行 `openclaw doctor --fix` 以改寫已保存的設定。
- `channels.discord.autoPresence` 會將執行階段可用性對應到機器人狀態（healthy => online、degraded => idle、exhausted => dnd），並允許選用的狀態文字覆寫。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變名稱/標籤比對（緊急相容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 核准傳送與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當核准者可從 `approvers` 或 `commands.ownerAllowFrom` 解析時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用的代理程式 ID 允許清單。省略則轉送所有代理程式的核准。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或正規表示式）。
  - `target`：要傳送核准提示的位置。`"dm"`（預設）傳送到核准者 DM，`"channel"` 傳送到原始頻道，`"both"` 同時傳送兩者。當目標包含 `"channel"` 時，按鈕只能由已解析的核准者使用。
  - `cleanupAfterResolve`：為 `true` 時，會在核准、拒絕或逾時後刪除核准 DM。

**反應通知模式：** `off`（無）、`own`（機器人的訊息，預設）、`all`（所有訊息）、`allowlist`（所有訊息中來自 `guilds.<id>.users` 的使用者）。

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // app-url | project-number
      audience: "https://gateway.example.com/googlechat",
      webhookPath: "/googlechat",
      botUser: "users/1234567890",
      dm: {
        enabled: true,
        policy: "pairing",
        allowFrom: ["users/1234567890"],
      },
      groupPolicy: "allowlist",
      groups: {
        "spaces/AAAA": { allow: true, requireMention: true },
      },
      actions: { reactions: true },
      typingIndicator: "message",
      mediaMaxMb: 20,
    },
  },
}
```

- 服務帳號 JSON：行內（`serviceAccount`）或以檔案為基礎（`serviceAccountFile`）。
- 也支援服務帳號 SecretRef（`serviceAccountRef`）。
- 環境變數備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 傳送目標請使用 `spaces/<spaceId>` 或 `users/<userId>`。
- `channels.googlechat.dangerouslyAllowNameMatching` 會重新啟用可變電子郵件主體比對（緊急相容模式）。

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
      socketMode: {
        clientPingTimeout: 15000,
        serverPingTimeout: 30000,
        pingPongLoggingEnabled: false,
      },
      dmPolicy: "pairing",
      allowFrom: ["U123", "U456", "*"],
      dm: { enabled: true, groupEnabled: false, groupChannels: ["G123"] },
      channels: {
        C123: { allow: true, requireMention: true, allowBots: false },
        "#general": {
          allow: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "Short answers only.",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // off | first | all | batched
      thread: {
        historyScope: "thread", // thread | channel
        inheritParent: false,
      },
      actions: {
        reactions: true,
        messages: true,
        pins: true,
        memberInfo: true,
        emojiList: true,
      },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
      typingReaction: "hourglass_flowing_sand",
      unfurlLinks: false,
      unfurlMedia: false,
      textChunkLimit: 4000,
      chunkMode: "length",
      streaming: {
        mode: "partial", // off | partial | block | progress
        nativeTransport: true, // use Slack native streaming API when mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | channel | both
      },
    },
  },
}
```

- **Socket 模式**需要同時提供 `botToken` 和 `appToken`（預設帳戶環境變數後援為 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加上 `signingSecret`（位於根層級或每個帳戶）。
- `socketMode` 會將 Slack SDK Socket Mode 傳輸調校傳遞至公開的 Bolt receiver API。只有在調查 ping/pong 逾時或過期 websocket 行為時才使用它。`clientPingTimeout` 預設為 `15000`；`serverPingTimeout` 和 `pingPongLoggingEnabled` 只有在設定時才會傳遞。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- Slack 帳戶快照會公開每個憑證的來源/狀態欄位，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式中的
  `signingSecretStatus`。`configured_unavailable` 表示帳戶是
  透過 SecretRef 設定，但目前的命令/執行階段路徑無法
  解析秘密值。
- `configWrites: false` 會封鎖 Slack 發起的設定寫入。
- 選用的 `channels.slack.defaultAccount` 會在符合已設定的帳戶 id 時覆寫預設帳戶選取。
- `channels.slack.streaming.mode` 是標準 Slack 串流模式鍵。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生串流傳輸。舊版 `streamMode`、布林值 `streaming` 和 `nativeStreaming` 值仍保留為執行階段別名；執行 `openclaw doctor --fix` 以重寫已保存的設定。
- `unfurlLinks` 和 `unfurlMedia` 會將 Slack 的 `chat.postMessage` 連結與媒體展開布林值傳遞給機器人回覆。`unfurlLinks` 預設為 `false`，因此除非啟用，否則外送機器人連結不會在行內展開；`unfurlMedia` 除非已設定，否則會省略。將任一值設定在 `channels.slack.accounts.<accountId>`，即可覆寫單一帳戶的頂層值。
- 使用 `user:<id>`（DM）或 `channel:<id>` 作為傳遞目標。

**反應通知模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

**執行緒工作階段隔離：** `thread.historyScope` 是每個執行緒（預設）或跨頻道共用。`thread.inheritParent` 會將父頻道逐字稿複製到新執行緒。

- Slack 原生串流加上 Slack assistant 風格的「正在輸入...」執行緒狀態需要回覆執行緒目標。頂層 DM 預設仍不在執行緒中，因此它們仍可透過 Slack 草稿貼文與編輯預覽進行串流，而不是顯示執行緒風格的原生串流/狀態預覽。
- `typingReaction` 會在回覆執行時，向傳入的 Slack 訊息新增暫時反應，然後在完成時移除。使用 Slack emoji 短代碼，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生核准用戶端傳遞與 exec 核准者授權。結構描述與 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 使用者 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。當 Slack 外掛核准者可解析時，外掛核准可對 Slack 來源請求使用這個原生用戶端路徑；Slack 原生外掛核准傳遞也可透過 `approvals.plugin` 對 Slack 來源工作階段或 Slack 目標啟用。外掛核准會使用來自 `allowFrom` 和預設路由的 Slack 外掛核准者，而不是 exec 核准者。

| 動作群組 | 預設 | 備註                  |
| ------------ | ------- | ---------------------- |
| reactions    | 已啟用 | 反應 + 列出反應 |
| messages     | 已啟用 | 讀取/傳送/編輯/刪除  |
| pins         | 已啟用 | 釘選/取消釘選/列出         |
| memberInfo   | 已啟用 | 成員資訊            |
| emojiList    | 已啟用 | 自訂 emoji 清單      |

### Mattermost

Mattermost 在目前的 OpenClaw 版本中作為內建外掛隨附。較舊或
自訂建置可以使用以下命令安裝目前的 npm 套件：
`openclaw plugins install @openclaw/mattermost`。在固定版本前，請查看
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
以確認目前的 dist-tags。

```json5
{
  channels: {
    mattermost: {
      enabled: true,
      botToken: "mm-token",
      baseUrl: "https://chat.example.com",
      dmPolicy: "pairing",
      chatmode: "oncall", // oncall | onmessage | onchar
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // opt-in
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // Optional explicit URL for reverse-proxy/public deployments
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

聊天模式：`oncall`（在 @-提及時回應，預設）、`onmessage`（每則訊息）、`onchar`（以觸發前綴開頭的訊息）。

啟用 Mattermost 原生命令時：

- `commands.callbackPath` 必須是路徑（例如 `/api/channels/mattermost/command`），而不是完整 URL。
- `commands.callbackUrl` 必須解析為 OpenClaw 閘道端點，並且可由 Mattermost 伺服器存取。
- 原生 slash 回呼會使用 Mattermost 在 slash 命令註冊期間傳回的每個命令權杖進行驗證。如果註冊失敗或沒有
  命令被啟用，OpenClaw 會以
  `Unauthorized: invalid command token.` 拒絕回呼。
- 對於私有/tailnet/內部回呼主機，Mattermost 可能需要
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機/網域。
  使用主機/網域值，而不是完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕 Mattermost 發起的設定寫入。
- `channels.mattermost.requireMention`：在頻道中回覆前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：每個頻道的提及門檻覆寫（`"*"` 表示預設）。
- 選用的 `channels.mattermost.defaultAccount` 會在符合已設定的帳戶 id 時覆寫預設帳戶選取。

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // optional account binding
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // off | own | all | allowlist
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**反應通知模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

- `channels.signal.account`：將頻道啟動固定到特定 Signal 帳戶身分。
- `channels.signal.configWrites`：允許或拒絕 Signal 發起的設定寫入。
- 選用的 `channels.signal.defaultAccount` 會在符合已設定的帳戶 id 時覆寫預設帳戶選取。

### iMessage

OpenClaw 會產生 `imsg rpc`（透過 stdio 的 JSON-RPC）。不需要 daemon 或連接埠。當主機可以授予 Messages 資料庫和自動化權限時，這是新 OpenClaw iMessage 設定的偏好路徑。

BlueBubbles 支援已移除。`channels.bluebubbles` 不是目前 OpenClaw 支援的執行階段設定介面。將舊設定遷移到 `channels.imessage`；簡短版本請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整轉換表請參閱 [從 BlueBubbles 轉換](/zh-TW/channels/imessage-from-bluebubbles)。

如果閘道未在已登入 Messages 的 Mac 上執行，請保留 `channels.imessage.enabled=true`，並將 `channels.imessage.cliPath` 設為在該 Mac 上執行 `imsg "$@"` 的 SSH 包裝器。預設本機 `imsg` 路徑僅限 macOS。

在生產傳送依賴 SSH 包裝器之前，請透過該確切包裝器驗證外送 `imsg send`。某些 macOS TCC 狀態會將 Messages 自動化指派給 `/usr/libexec/sshd-keygen-wrapper`，這可能讓讀取和探測可用，但傳送因 AppleEvents `-1743` 失敗；請參閱 [SSH 包裝器傳送因 AppleEvents -1743 失敗](/zh-TW/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)。

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
      remoteHost: "user@gateway-host",
      dmPolicy: "pairing",
      allowFrom: ["+15555550123", "user@example.com", "chat_id:123"],
      historyLimit: 50,
      includeAttachments: false,
      attachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      remoteAttachmentRoots: ["/Users/*/Library/Messages/Attachments"],
      mediaMaxMb: 16,
      service: "auto",
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- 選用的 `channels.imessage.defaultAccount` 會在符合已設定的帳戶 id 時覆寫預設帳戶選取。

- 需要 Messages DB 的完整磁碟存取權。
- 偏好使用 `chat_id:<id>` 目標。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可指向 SSH 包裝器；設定 `remoteHost`（`host` 或 `user@host`）以擷取 SCP 附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格主機金鑰檢查，因此請確保中繼主機金鑰已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕 iMessage 發起的設定寫入。
- `channels.imessage.sendTransport`：一般外送回覆偏好的 `imsg` RPC 傳送傳輸。`auto`（預設）會在 IMCore bridge 執行時對既有聊天使用它，然後後援至 AppleScript；`bridge` 需要私有 API 傳遞；`applescript` 會強制使用公開的 Messages 自動化路徑。
- `channels.imessage.actions.*`：啟用也受 `imsg status` / `openclaw channels status --probe` 門控的私有 API 動作。
- `channels.imessage.includeAttachments` 預設為關閉；在期待 agent 回合中的傳入媒體之前，請將其設為 `true`。
- bridge/閘道重新啟動後的傳入復原是自動的（GUID 去重加上過期待處理項目年齡防線）。既有的 `channels.imessage.catchup.enabled: true` 設定仍會作為已淘汰的相容性設定檔受到支援。
- `channels.imessage.groups`：群組登錄與每個群組的設定。使用 `groupPolicy: "allowlist"` 時，請設定明確的 `chat_id` 鍵或 `"*"` 萬用字元項目，讓群組訊息可以通過登錄門檻。
- 頂層 `bindings[]` 項目搭配 `type: "acp"` 可將 iMessage 對話繫結到持久 ACP 工作階段。在 `match.peer.id` 中使用正規化 handle 或明確聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP Agents](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包裝器範例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由外掛支援，並在 `channels.matrix` 下設定。

```json5
{
  channels: {
    matrix: {
      enabled: true,
      homeserver: "https://matrix.example.org",
      accessToken: "syt_bot_xxx",
      proxy: "http://127.0.0.1:7890",
      encryption: true,
      initialSyncLimit: 20,
      defaultAccount: "ops",
      accounts: {
        ops: {
          name: "Ops",
          userId: "@ops:example.org",
          accessToken: "syt_ops_xxx",
        },
        alerts: {
          userId: "@alerts:example.org",
          password: "secret",
          proxy: "http://127.0.0.1:7891",
        },
      },
    },
  },
}
```

- 權杖驗證使用 `accessToken`；密碼驗證使用 `userId` + `password`。
- `channels.matrix.proxy` 透過明確的 HTTP(S) 代理路由 Matrix HTTP 流量。具名帳號可使用 `channels.matrix.accounts.<id>.proxy` 覆寫它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許私人/內部 homeserver。`proxy` 與此網路選用設定是彼此獨立的控制項。
- `channels.matrix.defaultAccount` 在多帳號設定中選取偏好的帳號。
- `channels.matrix.autoJoin` 預設為 `off`，因此受邀房間與新的 DM 樣式邀請會被忽略，直到你使用 `autoJoinAllowlist` 設定 `autoJoin: "allowlist"`，或設定 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（例如 `@owner:example.org`）。
  - `agentFilter`：選用的代理 ID 允許清單。省略即可轉送所有代理的核准。
  - `sessionFilter`：選用的工作階段金鑰模式（子字串或 regex）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）、`"channel"`（來源房間）或 `"both"`。
  - 單帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix DM 如何分組到工作階段：`per-user`（預設）依路由對等方共用，而 `per-room` 會隔離每個 DM 房間。
- Matrix 狀態探測與即時目錄查詢使用與執行階段流量相同的代理政策。
- 完整的 Matrix 設定、目標規則與設定範例記錄於 [Matrix](/zh-TW/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由外掛支援，並在 `channels.msteams` 下設定。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // see /channels/msteams
    },
  },
}
```

- 此處涵蓋的核心金鑰路徑：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 設定（憑證、網路鉤子、DM/群組政策、每個團隊/每個頻道覆寫）記錄於 [Microsoft Teams](/zh-TW/channels/msteams)。

### IRC

IRC 由外掛支援，並在 `channels.irc` 下設定。

```json5
{
  channels: {
    irc: {
      enabled: true,
      dmPolicy: "pairing",
      configWrites: true,
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "${IRC_NICKSERV_PASSWORD}",
        register: false,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

- 此處涵蓋的核心金鑰路徑：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 選用的 `channels.irc.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選取。
- 完整的 IRC 頻道設定（host/port/TLS/channels/allowlists/mention gating）記錄於 [IRC](/zh-TW/channels/irc)。

### 多帳號（所有頻道）

每個頻道執行多個帳號（各自有自己的 `accountId`）：

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "Primary bot",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "Alerts bot",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- 省略 `accountId` 時會使用 `default`（命令列介面 + 路由）。
- Env 權杖只套用於**預設**帳號。
- 基礎頻道設定會套用於所有帳號，除非每個帳號另行覆寫。
- 使用 `bindings[].match.accountId` 將每個帳號路由到不同代理。
- 如果你在仍使用單帳號頂層頻道設定時，透過 `openclaw channels add`（或頻道 onboarding）新增非預設帳號，OpenClaw 會先將帳號範圍的頂層單帳號值提升到頻道帳號對應中，讓原始帳號維持運作。大多數頻道會將它們移到 `channels.<channel>.accounts.default`；Matrix 則可改為保留現有相符的具名/預設目標。
- 既有的僅頻道繫結（沒有 `accountId`）會繼續符合預設帳號；帳號範圍繫結仍為選用。
- `openclaw doctor --fix` 也會修復混合形狀，方法是將帳號範圍的頂層單帳號值移到該頻道選定的已提升帳號。大多數頻道使用 `accounts.default`；Matrix 則可改為保留現有相符的具名/預設目標。

### 其他外掛頻道

許多外掛頻道設定為 `channels.<id>`，並記錄於各自專屬的頻道頁面（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 與 Twitch）。
請參閱完整頻道索引：[頻道](/zh-TW/channels)。

### 群組聊天提及門控

群組訊息預設為**需要提及**（中繼資料提及或安全的 regex 模式）。適用於 WhatsApp、Telegram、Discord、Google Chat 與 iMessage 群組聊天。

可見回覆由另一組設定控制。一般群組、頻道與內部 WebChat 直接請求預設會自動傳遞最終回覆：最終助理文字會透過舊版可見回覆路徑發送。若可見輸出只應在代理呼叫 `message(action=send)` 後發送，請選用 `messages.visibleReplies: "message_tool"` 或 `messages.groupChat.visibleReplies: "message_tool"`。如果模型在已選用僅工具模式時回傳最終文字但未呼叫訊息工具，該最終文字會保持私密，且閘道詳細記錄會記錄被抑制的 payload 中繼資料。

僅工具可見回覆需要能可靠呼叫工具的模型/執行階段，並建議用於 GPT 5.5 等最新世代模型所在的共用環境房間。某些較弱的模型可以回答最終文字，但無法理解來源可見輸出必須透過 `message(action=send)` 傳送。對於那些模型，請使用 `"automatic"`，讓最終助理回合成為可見回覆路徑。如果工作階段記錄顯示助理文字含有 `didSendViaMessagingTool: false`，表示模型產生了私密最終文字，而不是呼叫訊息工具。請切換該頻道到更強的工具呼叫模型、檢查閘道詳細記錄中的被抑制 payload 摘要，或設定 `messages.groupChat.visibleReplies: "automatic"`，為每個群組/頻道請求使用可見最終回覆。

如果訊息工具在作用中的工具政策下無法使用，OpenClaw 會退回到自動可見回覆，而不是靜默抑制回應。`openclaw doctor` 會警告這項不相符。

此規則適用於一般代理最終文字。外掛擁有的對話繫結會使用擁有外掛回傳的回覆，作為已宣告繫結執行緒回合的可見回應；該外掛不需要為那些繫結回覆呼叫 `message(action=send)`。

**疑難排解：群組 @mention 觸發輸入中，然後無聲（沒有錯誤）**

症狀：群組/頻道 @mention 顯示輸入中指示器，且閘道記錄回報 `dispatch complete (queuedFinal=false, replies=0)`，但房間內沒有收到訊息。傳給同一代理的 DM 則正常回覆。

原因：群組/頻道可見回覆模式解析為 `"message_tool"`，因此 OpenClaw 會執行該回合，但除非代理呼叫 `message(action=send)`，否則會抑制最終助理文字。此模式沒有 `NO_REPLY` 合約；沒有訊息工具呼叫就表示沒有來源回覆。沒有錯誤是因為抑制是已設定的行為。一般群組與頻道回合預設為 `"automatic"`，因此此症狀只會在 `messages.groupChat.visibleReplies`（或全域 `messages.visibleReplies`）明確設為 `"message_tool"` 時出現。Harness `defaultVisibleReplies` 不適用於此處 — 群組/頻道解析器會忽略它；它只影響直接/來源聊天（Codex harness 會以這種方式抑制直接聊天的最終文字）。

修正：選用更強的工具呼叫模型、移除明確的 `"message_tool"` 覆寫以退回到 `"automatic"` 預設，或設定 `messages.groupChat.visibleReplies: "automatic"`，強制每個群組/頻道請求都有可見回覆。閘道會在檔案儲存後熱重新載入 `messages` 設定；只有在部署中停用檔案監看或設定重新載入時，才需要重新啟動閘道。

**提及類型：**

- **中繼資料提及**：原生平台 @-mentions。在 WhatsApp 自我聊天模式中會被忽略。
- **文字模式**：`agents.list[].groupChat.mentionPatterns` 中的安全 regex 模式。無效模式與不安全的巢狀重複會被忽略。
- 只有在可偵測時（原生提及或至少一個模式），才會強制執行提及門控。

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 會設定全域預設。頻道可使用 `channels.<channel>.historyLimit`（或每個帳號）覆寫。設為 `0` 可停用。

`messages.groupChat.unmentionedInbound: "room_event"` 會在支援的頻道上，將未提及的常駐群組/頻道訊息作為安靜的房間情境提交。已提及的訊息、命令與直接訊息仍為使用者請求。請參閱 [環境房間事件](/zh-TW/channels/ambient-room-events)，取得完整的 Discord、Slack 與 Telegram 範例。

`messages.visibleReplies` 是全域來源事件預設；`messages.groupChat.visibleReplies` 會針對群組/頻道來源事件覆寫它。當 `messages.visibleReplies` 未設定時，直接/來源聊天會使用所選執行階段或 harness 預設，但內部 WebChat 直接回合會使用自動最終傳遞，以維持 Pi/Codex 提示一致性。設定 `messages.visibleReplies: "message_tool"` 可有意要求以 `message(action=send)` 進行可見輸出。頻道允許清單與提及門控仍會決定事件是否被處理。

#### DM 歷史限制

```json5
{
  channels: {
    telegram: {
      dmHistoryLimit: 30,
      dms: {
        "123456789": { historyLimit: 50 },
      },
    },
  },
}
```

解析順序：每個 DM 覆寫 → 提供者預設 → 無限制（全部保留）。

支援：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自我聊天模式

在 `allowFrom` 中包含你自己的號碼，即可啟用自我聊天模式（忽略原生 @-mentions，只回應文字模式）：

```json5
{
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  agents: {
    list: [
      {
        id: "main",
        groupChat: { mentionPatterns: ["reisponde", "@openclaw"] },
      },
    ],
  },
}
```

### 命令（聊天命令處理）

```json5
{
  commands: {
    native: "auto", // register native commands when supported
    nativeSkills: "auto", // register native skill commands when supported
    text: true, // parse /commands in chat messages
    bash: false, // allow ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // allow /config
    mcp: false, // allow /mcp
    plugins: false, // allow /plugins
    debug: false, // allow /debug
    restart: true, // allow /restart + gateway restart tool
    ownerAllowFrom: ["discord:123456789012345678"],
    ownerDisplay: "raw", // raw | hash
    ownerDisplaySecret: "${OWNER_ID_HASH_SECRET}",
    allowFrom: {
      "*": ["user1"],
      discord: ["user:123"],
    },
    useAccessGroups: true,
  },
}
```

<Accordion title="命令詳細資料">

- 此區塊設定命令介面。如需目前的內建 + 隨附命令目錄，請參閱 [斜線命令](/zh-TW/tools/slash-commands)。
- 此頁是**設定鍵參考**，不是完整命令目錄。由頻道/外掛擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶 `/dreaming`、電話控制 `/phone`，以及 Talk `/voice`，會記載於各自的頻道/外掛頁面以及 [斜線命令](/zh-TW/tools/slash-commands)。
- 文字命令必須是帶有前置 `/` 的**獨立**訊息。
- `native: "auto"` 會為 Discord/Telegram 開啟原生命令，Slack 則維持關閉。
- `nativeSkills: "auto"` 會為 Discord/Telegram 開啟原生 Skills 命令，Slack 則維持關閉。
- 依頻道覆寫：`channels.discord.commands.native`（布林值或 `"auto"`）。對於 Discord，`false` 會在啟動期間略過原生命令註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills` 依頻道覆寫原生 Skills 註冊。
- `channels.telegram.customCommands` 會新增額外的 Telegram Bot 選單項目。
- `bash: true` 會為主機 shell 啟用 `! <cmd>`。需要 `tools.elevated.enabled`，且傳送者需位於 `tools.elevated.allowFrom.<channel>`。
- `config: true` 會啟用 `/config`（讀取/寫入 `openclaw.json`）。對於閘道 `chat.send` 用戶端，持久化的 `/config set|unset` 寫入也需要 `operator.admin`；唯讀的 `/config show` 仍可供一般具寫入範圍的 operator 用戶端使用。
- `mcp: true` 會為 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會啟用 `/plugins`，用於外掛探索、安裝，以及啟用/停用控制。
- `channels.<provider>.configWrites` 會依頻道控管設定變更（預設：true）。
- 對於多帳號頻道，`channels.<provider>.accounts.<id>.configWrites` 也會控管以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 和閘道重新啟動工具動作。預設：`true`。
- `ownerAllowFrom` 是明確的擁有者允許清單，用於僅限擁有者的命令，以及由擁有者控管的頻道動作。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示中雜湊擁有者 ID。設定 `ownerDisplaySecret` 以控制雜湊。
- `allowFrom` 是依 provider 設定。設定後，它就是**唯一**授權來源（會忽略頻道允許清單/配對和 `useAccessGroups`）。
- `useAccessGroups: false` 允許命令在未設定 `allowFrom` 時繞過存取群組政策。
- 命令文件對照：
  - 內建 + 隨附目錄：[斜線命令](/zh-TW/tools/slash-commands)
  - 頻道特定命令介面：[頻道](/zh-TW/channels)
  - QQ Bot 命令：[QQ Bot](/zh-TW/channels/qqbot)
  - 配對命令：[配對](/zh-TW/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-TW/channels/line)
  - 記憶夢境整理：[夢境整理](/zh-TW/concepts/dreaming)

</Accordion>

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 頂層鍵
- [設定 — agents](/zh-TW/gateway/config-agents)
- [頻道概覽](/zh-TW/channels)
