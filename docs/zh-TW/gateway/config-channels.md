---
read_when:
    - 設定頻道 Plugin（驗證、存取控制、多帳戶）
    - 各通道設定鍵的疑難排解
    - 稽核私訊政策、群組政策或提及門控
summary: 頻道設定：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等平台的存取控制、配對與各頻道金鑰
title: 設定 — 頻道
x-i18n:
    generated_at: "2026-05-06T17:55:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

每個頻道在 `channels.*` 下的設定鍵。涵蓋 DM 與群組存取、多帳號設定、提及門控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他內建頻道 Plugin 的個別頻道鍵。

如需代理程式、工具、Gateway 執行階段與其他最上層鍵，請參閱
[設定參考](/zh-TW/gateway/configuration-reference)。

## 頻道

每個頻道會在其設定區段存在時自動啟動（除非 `enabled: false`）。

### DM 與群組存取

所有頻道都支援 DM 政策與群組政策：

| DM 政策            | 行為                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (預設) | 未知寄件者會取得一次性配對碼；擁有者必須核准 |
| `allowlist`         | 只允許 `allowFrom` 中的寄件者（或配對的允許儲存區）             |
| `open`              | 允許所有傳入 DM（需要 `allowFrom: ["*"]`）             |
| `disabled`          | 忽略所有傳入 DM                                          |

| 群組政策          | 行為                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (預設) | 只允許符合已設定允許清單的群組          |
| `open`                | 略過群組允許清單（提及門控仍會套用） |
| `disabled`            | 封鎖所有群組/聊天室訊息                          |

<Note>
`channels.defaults.groupPolicy` 會在提供者的 `groupPolicy` 未設定時設定預設值。
配對碼會在 1 小時後過期。待處理的 DM 配對請求上限為**每個頻道 3 個**。
如果提供者區塊完全缺失（缺少 `channels.<provider>`），執行階段群組政策會回退為 `allowlist`（預設封閉），並在啟動時顯示警告。
</Note>

### 頻道模型覆寫

使用 `channels.modelByChannel` 將特定頻道 ID 固定到某個模型。值可接受 `provider/model` 或已設定的模型別名。當工作階段尚未有模型覆寫時（例如透過 `/model` 設定），會套用頻道對應。

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-4.1",
      },
      telegram: {
        "-1001234567890": "openai/gpt-4.1-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
      },
    },
  },
}
```

### 頻道預設值與 Heartbeat

使用 `channels.defaults` 在各提供者之間共用群組政策與 Heartbeat 行為：

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

- `channels.defaults.groupPolicy`：提供者層級的 `groupPolicy` 未設定時的後援群組政策。
- `channels.defaults.contextVisibility`：所有頻道的預設補充脈絡可見性模式。值：`all`（預設，包含所有引用/討論串/歷史脈絡）、`allowlist`（只包含來自允許清單寄件者的脈絡）、`allowlist_quote`（與 allowlist 相同，但保留明確引用/回覆脈絡）。每個頻道的覆寫：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 Heartbeat 輸出中包含健康的頻道狀態。
- `channels.defaults.heartbeat.showAlerts`：在 Heartbeat 輸出中包含降級/錯誤狀態。
- `channels.defaults.heartbeat.useIndicator`：呈現精簡指示器樣式的 Heartbeat 輸出。

### WhatsApp

WhatsApp 透過 Gateway 的網頁頻道（Baileys Web）執行。當已連結的工作階段存在時會自動啟動。

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

- 如果存在 `default`，外送命令預設使用帳號 `default`；否則使用第一個已設定的帳號 ID（排序後）。
- 選用的 `channels.whatsapp.defaultAccount` 會在符合已設定帳號 ID 時，覆寫該後援預設帳號選擇。
- 舊版單帳號 Baileys auth 目錄會由 `openclaw doctor` 遷移到 `whatsapp/default`。
- 每個帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      streaming: "partial", // off | partial | block | progress (default: off; opt in explicitly to avoid preview-edit rate limits)
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

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），預設帳號會以 `TELEGRAM_BOT_TOKEN` 作為後援。
- `apiRoot` 只代表 Telegram Bot API 根目錄。請使用 `https://api.telegram.org` 或你的自架/代理根目錄，而不是 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>` 後綴。
- 選用的 `channels.telegram.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 在多帳號設定（2 個以上帳號 ID）中，請設定明確預設值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免後援路由；當此設定缺失或無效時，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖由 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 最上層 `bindings[]` 項目搭配 `type: "acp"`，可為論壇主題設定持久 ACP 繫結（在 `match.peer.id` 中使用標準 `chatId:topic:topicId`）。欄位語義在 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings) 中共用。
- Telegram 串流預覽使用 `sendMessage` + `editMessageText`（適用於私訊與群組聊天）。
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
      chunkMode: "length", // length | newline
      streaming: "off", // off | partial | block | progress
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

- Token：`channels.discord.token`，預設帳號的備援為 `DISCORD_BOT_TOKEN`。
- 提供明確 Discord `token` 的直接對外呼叫會使用該 token 進行呼叫；帳號重試/政策設定仍來自作用中執行階段快照中的所選帳號。
- 選用的 `channels.discord.defaultAccount` 在符合已設定帳號 ID 時，會覆寫預設帳號選擇。
- 對於傳送目標，請使用 `user:<id>` (DM) 或 `channel:<id>` (伺服器頻道)；裸數字 ID 會被拒絕。
- 伺服器 slug 為小寫，並以 `-` 取代空格；頻道鍵使用 slug 化名稱 (不含 `#`)。建議優先使用伺服器 ID。
- 預設會忽略由機器人發出的訊息。`allowBots: true` 會啟用這些訊息；使用 `allowBots: "mentions"` 可只接受提及該機器人的機器人訊息 (仍會過濾自己的訊息)。
- `channels.discord.guilds.<id>.ignoreOtherMentions` (以及頻道覆寫) 會捨棄提及另一位使用者或身分組但未提及該機器人的訊息 (不包含 @everyone/@here)。
- `channels.discord.mentionAliases` 會在傳送前將穩定的對外 `@handle` 文字對應到 Discord 使用者 ID，因此即使暫時性目錄快取為空，也能確定性地提及已知隊友。個別帳號覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases` 底下。
- `maxLinesPerMessage` (預設 17) 即使在少於 2000 個字元時，也會拆分過高的訊息。
- `channels.discord.threadBindings` 控制 Discord 討論串繫結路由：
  - `enabled`：Discord 對討論串繫結工作階段功能的覆寫 (`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及繫結的傳送/路由)
  - `idleHours`：Discord 對閒置自動取消聚焦的小時數覆寫 (`0` 會停用)
  - `maxAgeHours`：Discord 對硬性最長存續時間的小時數覆寫 (`0` 會停用)
  - `spawnSessions`：`sessions_spawn({ thread: true })` 以及 ACP 討論串衍生自動建立/繫結討論串的開關 (預設：`true`)
  - `defaultSpawnContext`：討論串繫結衍生的原生子代理內容 (預設為 `"fork"`)
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為頻道與討論串設定持久 ACP 繫結 (在 `match.peer.id` 中使用頻道/討論串 ID)。欄位語意在 [ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings) 中共用。
- `channels.discord.ui.components.accentColor` 設定 Discord 元件 v2 容器的強調色。
- `channels.discord.voice` 啟用 Discord 語音頻道對話，以及選用的自動加入 + LLM + TTS 覆寫。僅文字的 Discord 設定預設會關閉語音；設定 `channels.discord.voice.enabled=true` 以選擇啟用。
- `channels.discord.voice.model` 可選擇性覆寫用於 Discord 語音頻道回應的 LLM 模型。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 會傳遞到 `@discordjs/voice` DAVE 選項 (預設為 `true` 和 `24`)。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間 (預設為 `30000`)。
- `channels.discord.voice.reconnectGraceMs` 控制斷線的語音工作階段可花多久進入重新連線訊號傳遞，之後 OpenClaw 會將其銷毀 (預設為 `15000`)。
- OpenClaw 另外會在重複解密失敗後，透過離開/重新加入語音工作階段來嘗試語音接收復原。
- `channels.discord.streaming` 是正式的串流模式鍵。舊版 `streamMode` 和布林值 `streaming` 仍作為執行階段別名保留；執行 `openclaw doctor --fix` 以重寫已保存的設定。
- `channels.discord.autoPresence` 會將執行階段可用性對應到機器人狀態 (healthy => online、degraded => idle、exhausted => dnd)，並允許選用的狀態文字覆寫。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變名稱/標籤比對 (緊急相容模式)。
- `channels.discord.execApprovals`：Discord 原生 exec 核准傳送與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"` (預設)。在自動模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用的代理 ID 允許清單。省略即可轉送所有代理的核准。
  - `sessionFilter`：選用的工作階段鍵模式 (子字串或正規表示式)。
  - `target`：要傳送核准提示的位置。`"dm"` (預設) 會傳送到核准者 DM，`"channel"` 會傳送到來源頻道，`"both"` 會傳送到兩者。當目標包含 `"channel"` 時，按鈕只能由已解析的核准者使用。
  - `cleanupAfterResolve`：為 `true` 時，會在核准、拒絕或逾時後刪除核准 DM。

**回應通知模式：** `off` (無)、`own` (機器人的訊息，預設)、`all` (所有訊息)、`allowlist` (來自所有訊息上的 `guilds.<id>.users`)。

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

- 服務帳號 JSON：內嵌 (`serviceAccount`) 或檔案式 (`serviceAccountFile`)。
- 也支援服務帳號 SecretRef (`serviceAccountRef`)。
- 環境備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 對於傳送目標，請使用 `spaces/<spaceId>` 或 `users/<userId>`。
- `channels.googlechat.dangerouslyAllowNameMatching` 會重新啟用可變電子郵件主體比對 (緊急相容模式)。

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

- **Socket 模式**需要 `botToken` 和 `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` 作為預設帳號環境備援)。
- **HTTP 模式**需要 `botToken` 加上 `signingSecret` (位於根層或個別帳號)。
- `socketMode` 會將 Slack SDK Socket Mode 傳輸調校傳遞到公開的 Bolt 接收器 API。僅在調查 ping/pong 逾時或過時 websocket 行為時使用。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- Slack 帳號快照會公開個別認證來源/狀態欄位，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式中的
  `signingSecretStatus`。`configured_unavailable` 表示帳號是
  透過 SecretRef 設定，但目前的命令/執行階段路徑無法
  解析祕密值。
- `configWrites: false` 會封鎖由 Slack 發起的設定寫入。
- 選用的 `channels.slack.defaultAccount` 在符合已設定帳號 ID 時，會覆寫預設帳號選擇。
- `channels.slack.streaming.mode` 是正式的 Slack 串流模式鍵。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生串流傳輸。舊版 `streamMode`、布林值 `streaming` 和 `nativeStreaming` 仍作為執行階段別名保留；執行 `openclaw doctor --fix` 以重寫已保存的設定。
- 對於傳送目標，請使用 `user:<id>` (DM) 或 `channel:<id>`。

**回應通知模式：** `off`、`own` (預設)、`all`、`allowlist` (來自 `reactionAllowlist`)。

**討論串工作階段隔離：** `thread.historyScope` 是個別討論串 (預設) 或跨頻道共用。`thread.inheritParent` 會將父頻道轉錄複製到新的討論串。

- Slack 原生串流加上 Slack 助理樣式的「is typing...」討論串狀態需要回覆討論串目標。頂層 DM 預設保持在討論串外，因此仍可透過 Slack 草稿發佈與編輯預覽進行串流，而不是顯示討論串樣式的原生串流/狀態預覽。
- `typingReaction` 會在回覆執行期間，對傳入的 Slack 訊息加入暫時回應，並在完成時移除。使用 Slack emoji shortcode，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 核准傳送與核准者授權。與 Discord 相同結構描述：`enabled` (`true`/`false`/`"auto"`)、`approvers` (Slack 使用者 ID)、`agentFilter`、`sessionFilter` 和 `target` (`"dm"`、`"channel"` 或 `"both"`)。

| 動作群組 | 預設 | 附註                  |
| ------------ | ------- | ---------------------- |
| reactions    | 已啟用 | 回應 + 列出回應 |
| messages     | 已啟用 | 讀取/傳送/編輯/刪除  |
| pins         | 已啟用 | 釘選/取消釘選/列出         |
| memberInfo   | 已啟用 | 成員資訊            |
| emojiList    | 已啟用 | 自訂表情符號清單      |

### Mattermost

Mattermost 在目前的 OpenClaw 版本中作為內建 Plugin 提供。較舊或
自訂建置可使用
`openclaw plugins install @openclaw/mattermost` 安裝目前的 npm 套件。鎖定版本前，請查看
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
以取得目前的 dist-tags。

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

聊天模式：`oncall` (在 @ 提及時回應，預設)、`onmessage` (每則訊息)、`onchar` (以觸發前綴開頭的訊息)。

啟用 Mattermost 原生命令時：

- `commands.callbackPath` 必須是路徑（例如 `/api/channels/mattermost/command`），而不是完整 URL。
- `commands.callbackUrl` 必須解析為 OpenClaw gateway endpoint，且 Mattermost 伺服器必須能連線到它。
- 原生 slash callbacks 會使用 Mattermost 在 slash command 註冊期間傳回的每個命令 token 進行驗證。如果註冊失敗或沒有啟用任何命令，OpenClaw 會以 `Unauthorized: invalid command token.` 拒絕 callbacks。
- 對於 private/tailnet/internal callback hosts，Mattermost 可能需要 `ServiceSettings.AllowedUntrustedInternalConnections` 包含 callback host/domain。請使用 host/domain 值，而不是完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕由 Mattermost 發起的 config 寫入。
- `channels.mattermost.requireMention`：在頻道中回覆前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：每個頻道的 mention-gating 覆寫（`"*"` 代表預設）。
- 選用的 `channels.mattermost.defaultAccount` 會在符合已設定的 account id 時覆寫預設帳號選擇。

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

**回應通知模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

- `channels.signal.account`：將頻道啟動固定到特定 Signal 帳號身分。
- `channels.signal.configWrites`：允許或拒絕由 Signal 發起的 config 寫入。
- 選用的 `channels.signal.defaultAccount` 會在符合已設定的 account id 時覆寫預設帳號選擇。

### BlueBubbles

BlueBubbles 是建議的 iMessage 路徑（以 Plugin 支援，設定於 `channels.bluebubbles` 下）。

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls, and advanced actions:
      // see /channels/bluebubbles
    },
  },
}
```

- 這裡涵蓋的核心 key paths：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 選用的 `channels.bluebubbles.defaultAccount` 會在符合已設定的 account id 時覆寫預設帳號選擇。
- 帶有 `type: "acp"` 的頂層 `bindings[]` 項目可以將 BlueBubbles 對話綁定到持久 ACP sessions。在 `match.peer.id` 中使用 BlueBubbles handle 或 target string（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
- 完整的 BlueBubbles 頻道設定記錄於 [BlueBubbles](/zh-TW/channels/bluebubbles)。

### iMessage

OpenClaw 會產生 `imsg rpc`（透過 stdio 的 JSON-RPC）。不需要 daemon 或 port。

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
      region: "US",
    },
  },
}
```

- 選用的 `channels.imessage.defaultAccount` 會在符合已設定的 account id 時覆寫預設帳號選擇。

- 需要對 Messages DB 具備 Full Disk Access。
- 建議使用 `chat_id:<id>` 目標。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH wrapper；設定 `remoteHost`（`host` 或 `user@host`）以透過 SCP 擷取附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格的 host-key checking，因此請確保 relay host key 已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕由 iMessage 發起的 config 寫入。
- 帶有 `type: "acp"` 的頂層 `bindings[]` 項目可以將 iMessage 對話綁定到持久 ACP sessions。在 `match.peer.id` 中使用正規化 handle 或明確聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH wrapper 範例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 以 Plugin 支援，並設定於 `channels.matrix` 下。

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

- Token auth 使用 `accessToken`；password auth 使用 `userId` + `password`。
- `channels.matrix.proxy` 會透過明確的 HTTP(S) proxy 路由 Matrix HTTP 流量。具名帳號可以用 `channels.matrix.accounts.<id>.proxy` 覆寫它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許 private/internal homeservers。`proxy` 和此 network opt-in 是獨立控制項。
- `channels.matrix.defaultAccount` 會在多帳號設定中選取偏好的帳號。
- `channels.matrix.autoJoin` 預設為 `off`，因此受邀 rooms 和新的 DM-style invites 會被忽略，直到你設定 `autoJoin: "allowlist"` 搭配 `autoJoinAllowlist`，或設定 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec approval 傳遞與 approver 授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在 auto 模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析 approvers 時，exec approvals 會啟用。
  - `approvers`：允許核准 exec requests 的 Matrix user IDs（例如 `@owner:example.org`）。
  - `agentFilter`：選用的 agent ID allowlist。省略時會轉送所有 agents 的 approvals。
  - `sessionFilter`：選用的 session key patterns（substring 或 regex）。
  - `target`：approval prompts 的傳送位置。`"dm"`（預設）、`"channel"`（來源 room）或 `"both"`。
  - 每帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix DMs 如何分組成 sessions：`per-user`（預設）依 routed peer 共用，而 `per-room` 會隔離每個 DM room。
- Matrix 狀態 probes 和即時 directory lookups 使用與 runtime traffic 相同的 proxy policy。
- 完整的 Matrix 設定、targeting rules 和 setup examples 記錄於 [Matrix](/zh-TW/channels/matrix)。

### Microsoft Teams

Microsoft Teams 以 Plugin 支援，並設定於 `channels.msteams` 下。

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

- 這裡涵蓋的核心 key paths：`channels.msteams`、`channels.msteams.configWrites`。
- 完整 Teams 設定（credentials、webhook、DM/group policy、per-team/per-channel overrides）記錄於 [Microsoft Teams](/zh-TW/channels/msteams)。

### IRC

IRC 以 Plugin 支援，並設定於 `channels.irc` 下。

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

- 這裡涵蓋的核心 key paths：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 選用的 `channels.irc.defaultAccount` 會在符合已設定的 account id 時覆寫預設帳號選擇。
- 完整 IRC 頻道設定（host/port/TLS/channels/allowlists/mention gating）記錄於 [IRC](/zh-TW/channels/irc)。

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

- 當省略 `accountId` 時會使用 `default`（CLI + routing）。
- Env tokens 只會套用到 **default** 帳號。
- 基礎頻道設定會套用到所有帳號，除非每個帳號另有覆寫。
- 使用 `bindings[].match.accountId` 將每個帳號路由到不同 agent。
- 如果你透過 `openclaw channels add`（或頻道 onboarding）新增非預設帳號，同時仍在使用單帳號頂層頻道 config，OpenClaw 會先將 account-scoped 頂層單帳號值提升到頻道帳號 map 中，讓原始帳號繼續運作。大多數頻道會把它們移到 `channels.<channel>.accounts.default`；Matrix 則可以改為保留現有相符的 named/default target。
- 現有僅頻道 bindings（沒有 `accountId`）會繼續符合預設帳號；account-scoped bindings 仍是選用。
- `openclaw doctor --fix` 也會修復混合形狀，方法是將 account-scoped 頂層單帳號值移到該頻道所選的已提升帳號。大多數頻道使用 `accounts.default`；Matrix 則可以改為保留現有相符的 named/default target。

### 其他 Plugin 頻道

許多 Plugin 頻道設定為 `channels.<id>`，並記錄於各自專用的頻道頁面（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
請參閱完整頻道索引：[頻道](/zh-TW/channels)。

### 群組聊天 mention gating

群組訊息預設為 **需要 mention**（metadata mention 或安全 regex patterns）。套用於 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群組聊天。

可見回覆會分開控制。群組/頻道 rooms 預設為 `messages.groupChat.visibleReplies: "message_tool"`：OpenClaw 仍會處理該 turn，但一般最終回覆會維持私密，而可見 room output 需要 `message(action=send)`。只有在你想要舊版行為，也就是將一般回覆貼回 room 時，才設定 `"automatic"`。若也要將相同的 tool-only visible-reply 行為套用到直接聊天，請設定 `messages.visibleReplies: "message_tool"`；Codex harness 也會將該 tool-only 行為作為未設定 direct-chat 的預設值。

Tool-only visible replies 需要可可靠呼叫 tools 的 model/runtime。如果 session log 顯示 assistant text 且 `didSendViaMessagingTool: false`，表示模型產生了私密最終答案，而不是呼叫 message tool。請為該頻道切換到更強的 tool-calling model，或設定 `messages.groupChat.visibleReplies: "automatic"` 以還原舊版可見最終回覆。

如果 message tool 在作用中的 tool policy 下不可用，OpenClaw 會退回 automatic visible replies，而不是默默抑制回應。`openclaw doctor` 會對此 mismatch 發出警告。

Gateway 會在檔案儲存後 hot-reloads `messages` config。只有在部署中停用 file watching 或 config reload 時才需要重新啟動。

**Mention 類型：**

- **Metadata 提及**：原生平台 @ 提及。在 WhatsApp 自我聊天模式中會被忽略。
- **文字模式**：`agents.list[].groupChat.mentionPatterns` 中的安全 regex 模式。無效模式與不安全的巢狀重複會被忽略。
- 只有在可偵測時（原生提及或至少一個模式），才會強制執行提及閘控。

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats; Codex harness defaults unset direct chats to message_tool
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // default; use "automatic" for legacy final replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 會設定全域預設值。頻道可使用 `channels.<channel>.historyLimit`（或每個帳號）覆寫。設為 `0` 可停用。

`messages.visibleReplies` 是全域來源回合預設值；`messages.groupChat.visibleReplies` 會針對群組/頻道來源回合覆寫它。當 `messages.visibleReplies` 未設定時，執行框架可以提供自己的直接/來源預設值；Codex 執行框架預設為 `message_tool`。頻道允許清單與提及閘控仍會決定是否處理某個回合。

#### 私訊歷史記錄限制

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

解析順序：每個私訊覆寫 → 提供者預設值 → 無限制（全部保留）。

支援：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自我聊天模式

在 `allowFrom` 中包含你自己的號碼即可啟用自我聊天模式（忽略原生 @ 提及，只回應文字模式）：

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

<Accordion title="命令詳細資訊">

- 此區塊會設定命令介面。若要查看目前內建 + 隨附命令目錄，請參閱 [斜線命令](/zh-TW/tools/slash-commands)。
- 本頁是**設定鍵參考**，不是完整命令目錄。頻道/Plugin 擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶體 `/dreaming`、手機控制 `/phone`，以及 Talk `/voice`，會在其頻道/Plugin 頁面與 [斜線命令](/zh-TW/tools/slash-commands) 中記錄。
- 文字命令必須是帶有前導 `/` 的**獨立**訊息。
- `native: "auto"` 會為 Discord/Telegram 開啟原生命令，並讓 Slack 保持關閉。
- `nativeSkills: "auto"` 會為 Discord/Telegram 開啟原生 Skills 命令，並讓 Slack 保持關閉。
- 依頻道覆寫：`channels.discord.commands.native`（布林值或 `"auto"`）。對 Discord 而言，`false` 會在啟動期間略過原生命令註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills` 依頻道覆寫原生 Skills 註冊。
- `channels.telegram.customCommands` 會新增額外的 Telegram Bot 選單項目。
- `bash: true` 會為主機 shell 啟用 `! <cmd>`。需要 `tools.elevated.enabled`，且傳送者需位於 `tools.elevated.allowFrom.<channel>`。
- `config: true` 會啟用 `/config`（讀取/寫入 `openclaw.json`）。對於 Gateway `chat.send` 用戶端，持久性 `/config set|unset` 寫入也需要 `operator.admin`；唯讀 `/config show` 仍可供一般寫入範圍的 operator 用戶端使用。
- `mcp: true` 會為 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會為 Plugin 探索、安裝與啟用/停用控制項啟用 `/plugins`。
- `channels.<provider>.configWrites` 會依頻道控管設定變更（預設：true）。
- 對於多帳號頻道，`channels.<provider>.accounts.<id>.configWrites` 也會控管以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 與 Gateway 重新啟動工具動作。預設值：`true`。
- `ownerAllowFrom` 是擁有者專用命令/工具的明確擁有者允許清單。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示中雜湊擁有者 ID。設定 `ownerDisplaySecret` 可控制雜湊。
- `allowFrom` 是按提供者設定。設定後，它會是**唯一**授權來源（頻道允許清單/配對與 `useAccessGroups` 會被忽略）。
- 當未設定 `allowFrom` 時，`useAccessGroups: false` 允許命令略過存取群組政策。
- 命令文件對應：
  - 內建 + 隨附目錄：[斜線命令](/zh-TW/tools/slash-commands)
  - 頻道特定命令介面：[頻道](/zh-TW/channels)
  - QQ Bot 命令：[QQ Bot](/zh-TW/channels/qqbot)
  - 配對命令：[配對](/zh-TW/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-TW/channels/line)
  - 記憶體 Dreaming：[Dreaming](/zh-TW/concepts/dreaming)

</Accordion>

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 頂層鍵
- [設定 — agents](/zh-TW/gateway/config-agents)
- [頻道概覽](/zh-TW/channels)
