---
read_when:
    - 設定通道 Plugin（驗證、存取控制、多帳號）
    - 疑難排解各通道設定鍵
    - 稽核 DM 政策、群組政策或提及門控
summary: 頻道設定：適用於 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等的存取控制、配對與各頻道金鑰
title: 設定 — 通道
x-i18n:
    generated_at: "2026-05-11T20:28:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

每個頻道的設定鍵位於 `channels.*` 之下。涵蓋 DM 與群組存取、
多帳號設定、提及閘控，以及 Slack、Discord、
Telegram、WhatsApp、Matrix、iMessage 和其他內建頻道 Plugin 的每頻道鍵。

對於代理、工具、gateway runtime 和其他頂層鍵，請參閱
[設定參考](/zh-TW/gateway/configuration-reference)。

## 頻道

每個頻道會在其設定區段存在時自動啟動（除非 `enabled: false`）。

### DM 與群組存取

所有頻道都支援 DM 政策與群組政策：

| DM 政策             | 行為                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（預設）   | 未知傳送者會收到一次性配對碼；擁有者必須核准                  |
| `allowlist`         | 僅允許 `allowFrom`（或已配對允許儲存區）中的傳送者             |
| `open`              | 允許所有傳入 DM（需要 `allowFrom: ["*"]`）                     |
| `disabled`          | 忽略所有傳入 DM                                                |

| 群組政策              | 行為                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（預設）   | 僅允許符合已設定允許清單的群組                         |
| `open`                | 略過群組允許清單（仍會套用提及閘控）                   |
| `disabled`            | 封鎖所有群組/房間訊息                                  |

<Note>
`channels.defaults.groupPolicy` 會在 provider 的 `groupPolicy` 未設定時設定預設值。
配對碼會在 1 小時後過期。待處理的 DM 配對請求上限為**每個頻道 3 個**。
如果 provider 區塊完全缺少（不存在 `channels.<provider>`），runtime 群組政策會退回到 `allowlist`（故障關閉），並顯示啟動警告。
</Note>

### 頻道模型覆寫

使用 `channels.modelByChannel` 將特定頻道 ID 固定到某個模型。值接受 `provider/model` 或已設定的模型別名。當 session 尚未有模型覆寫時（例如透過 `/model` 設定），會套用頻道對應。

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

使用 `channels.defaults` 設定跨 provider 共用的群組政策與 Heartbeat 行為：

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

- `channels.defaults.groupPolicy`：provider 層級的 `groupPolicy` 未設定時使用的備援群組政策。
- `channels.defaults.contextVisibility`：所有頻道的預設補充上下文可見性模式。值：`all`（預設，包含所有引用/討論串/歷史上下文）、`allowlist`（僅包含允許清單傳送者的上下文）、`allowlist_quote`（與 allowlist 相同，但保留明確的引用/回覆上下文）。每頻道覆寫：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 Heartbeat 輸出中包含健康的頻道狀態。
- `channels.defaults.heartbeat.showAlerts`：在 Heartbeat 輸出中包含降級/錯誤狀態。
- `channels.defaults.heartbeat.useIndicator`：呈現精簡指示器樣式的 Heartbeat 輸出。

### WhatsApp

WhatsApp 透過 Gateway 的 Web 頻道（Baileys Web）執行。當連結的 session 存在時會自動啟動。

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

<Accordion title="Multi-account WhatsApp">

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

- 外送命令預設使用 `default` 帳號（若存在）；否則使用第一個已設定的帳號 ID（排序後）。
- 選用的 `channels.whatsapp.defaultAccount` 可在符合已設定帳號 ID 時覆寫該備援預設帳號選擇。
- 舊版單帳號 Baileys auth dir 會由 `openclaw doctor` 遷移到 `whatsapp/default`。
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

- 機器人權杖：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），預設帳號以 `TELEGRAM_BOT_TOKEN` 作為備援。
- `apiRoot` 僅是 Telegram Bot API 根路徑。請使用 `https://api.telegram.org` 或你自行託管/代理的根路徑，不要使用 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外尾隨的 `/bot<TOKEN>` 後綴。
- 選用的 `channels.telegram.defaultAccount` 可在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 在多帳號設定（2 個以上帳號 ID）中，請設定明確預設值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免備援路由；缺少或無效時，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 帶有 `type: "acp"` 的頂層 `bindings[]` 項目會為論壇主題設定持久 ACP 綁定（在 `match.peer.id` 中使用標準 `chatId:topic:topicId`）。欄位語義於 [ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings) 共用。
- Telegram 串流預覽使用 `sendMessage` + `editMessageText`（可用於直接聊天與群組聊天）。
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
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
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

- 權杖：`channels.discord.token`，預設帳號的備援為 `DISCORD_BOT_TOKEN`。
- 提供明確 Discord `token` 的直接對外呼叫會使用該權杖進行呼叫；帳號重試/政策設定仍來自作用中 runtime 快照中選取的帳號。
- 選用的 `channels.discord.defaultAccount` 會在符合已設定帳號 id 時覆寫預設帳號選擇。
- 使用 `user:<id>`（DM）或 `channel:<id>`（guild channel）作為傳送目標；裸數字 ID 會被拒絕。
- Guild slug 會轉為小寫，並以 `-` 取代空格；channel key 使用 slug 化名稱（不含 `#`）。偏好使用 guild ID。
- 預設會忽略 bot 作者的訊息。`allowBots: true` 會啟用它們；使用 `allowBots: "mentions"` 只接受提及該 bot 的 bot 訊息（仍會過濾自己的訊息）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及 channel 覆寫）會捨棄提及另一位使用者或角色但未提及該 bot 的訊息（不含 @everyone/@here）。
- `channels.discord.mentionAliases` 會在傳送前將穩定的對外 `@handle` 文字對應到 Discord 使用者 ID，因此即使暫時性目錄快取為空，也能確定性地提及已知隊友。每個帳號的覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases`。
- `maxLinesPerMessage`（預設 17）即使在低於 2000 字元時，也會拆分過高的訊息。
- `channels.discord.threadBindings` 控制 Discord thread-bound 路由：
  - `enabled`：thread-bound session 功能的 Discord 覆寫（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及 bound delivery/routing）
  - `idleHours`：Discord 的閒置自動取消聚焦覆寫，以小時為單位（`0` 會停用）
  - `maxAgeHours`：Discord 的硬性最大年齡覆寫，以小時為單位（`0` 會停用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 和 ACP thread-spawn 自動 thread 建立/繫結的開關（預設：`true`）
  - `defaultSpawnContext`：thread-bound spawn 的原生 subagent context（預設為 `"fork"`）
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為 channel 和 thread 設定持久 ACP 繫結（在 `match.peer.id` 中使用 channel/thread id）。欄位語意在 [ACP Agents](/zh-TW/tools/acp-agents#persistent-channel-bindings) 中共用。
- `channels.discord.ui.components.accentColor` 設定 Discord components v2 容器的強調色。
- `channels.discord.voice` 會啟用 Discord voice channel 對話，以及選用的 auto-join + LLM + TTS 覆寫。純文字 Discord 設定預設會關閉語音；設定 `channels.discord.voice.enabled=true` 以選擇加入。
- `channels.discord.voice.model` 可選擇性覆寫 Discord voice channel 回應所使用的 LLM 模型。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 會傳遞到 `@discordjs/voice` DAVE 選項（預設為 `true` 和 `24`）。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和 auto-join 嘗試的初始 `@discordjs/voice` Ready 等待時間（預設為 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制已中斷連線的語音 session 在 OpenClaw 銷毀它之前，可進入重新連線訊號狀態的時間長度（預設為 `15000`）。
- Discord 語音播放不會被另一位使用者的開始說話事件中斷。為避免回授迴路，OpenClaw 會在 TTS 播放時忽略新的語音擷取。
- OpenClaw 也會在重複解密失敗後，透過離開/重新加入語音 session 來嘗試語音接收復原。
- `channels.discord.streaming` 是標準 stream mode key。Discord 預設為 `streaming.mode: "progress"`，因此 tool/work 進度會顯示在一則已編輯的預覽訊息中；設定 `streaming.mode: "off"` 可停用。舊版 `streamMode` 和布林值 `streaming` 仍保留為 runtime alias；執行 `openclaw doctor --fix` 以重寫持久化設定。
- `channels.discord.autoPresence` 會將 runtime 可用性對應到 bot presence（healthy => online、degraded => idle、exhausted => dnd），並允許選用的狀態文字覆寫。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變名稱/標籤比對（break-glass 相容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec approval 傳送與 approver 授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在 auto 模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析 approver 時，exec approval 會啟用。
  - `approvers`：允許核准 exec request 的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用的 agent ID allowlist。省略時會轉送所有 agent 的 approval。
  - `sessionFilter`：選用的 session key pattern（substring 或 regex）。
  - `target`：approval prompt 的傳送位置。`"dm"`（預設）會傳送到 approver DM，`"channel"` 會傳送到來源 channel，`"both"` 會同時傳送到兩者。當 target 包含 `"channel"` 時，按鈕只能由已解析的 approver 使用。
  - `cleanupAfterResolve`：為 `true` 時，會在核准、拒絕或逾時後刪除 approval DM。

**Reaction notification 模式：** `off`（無）、`own`（bot 的訊息，預設）、`all`（所有訊息）、`allowlist`（來自所有訊息上的 `guilds.<id>.users`）。

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

- Service account JSON：inline（`serviceAccount`）或 file-based（`serviceAccountFile`）。
- 也支援 service account SecretRef（`serviceAccountRef`）。
- Env 備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 使用 `spaces/<spaceId>` 或 `users/<userId>` 作為傳送目標。
- `channels.googlechat.dangerouslyAllowNameMatching` 會重新啟用可變 email principal 比對（break-glass 相容模式）。

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

- **Socket mode** 需要同時有 `botToken` 和 `appToken`（預設帳號 env 備援為 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** 需要 `botToken` 加上 `signingSecret`（位於根層或每個帳號）。
- `socketMode` 會將 Slack SDK Socket Mode transport tuning 傳遞到公開 Bolt receiver API。僅在調查 ping/pong timeout 或 stale websocket 行為時使用它。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受 plaintext
  string 或 SecretRef object。
- Slack 帳號快照會公開每個 credential 的 source/status 欄位，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP mode 中的
  `signingSecretStatus`。`configured_unavailable` 表示該帳號已透過 SecretRef
  設定，但目前 command/runtime path 無法解析 secret value。
- `configWrites: false` 會封鎖 Slack 發起的 config write。
- 選用的 `channels.slack.defaultAccount` 會在符合已設定帳號 id 時覆寫預設帳號選擇。
- `channels.slack.streaming.mode` 是標準 Slack stream mode key。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生 streaming transport。舊版 `streamMode`、布林值 `streaming` 和 `nativeStreaming` 仍保留為 runtime alias；執行 `openclaw doctor --fix` 以重寫持久化設定。
- `unfurlLinks` 和 `unfurlMedia` 會將 Slack 的 `chat.postMessage` link 與 media unfurl 布林值傳遞給 bot 回覆。省略它們以保留 Slack 的預設行為；在 `channels.slack.accounts.<accountId>` 設定它們，可覆寫單一帳號的頂層預設值。
- 使用 `user:<id>`（DM）或 `channel:<id>` 作為傳送目標。

**Reaction notification 模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

**Thread session 隔離：** `thread.historyScope` 是 per-thread（預設）或在 channel 間共用。`thread.inheritParent` 會將父 channel transcript 複製到新 thread。

- Slack 原生 streaming 加上 Slack assistant-style 的「is typing...」thread 狀態需要回覆 thread 目標。頂層 DM 預設保持 off-thread，因此它們仍可透過 Slack draft post-and-edit preview 進行串流，而不是顯示 thread-style native stream/status preview。
- `typingReaction` 會在回覆執行期間，對傳入的 Slack 訊息新增暫時 reaction，完成後再移除。使用 Slack emoji shortcode，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec approval 傳送與 approver 授權。與 Discord 相同 schema：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 使用者 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| Action group | 預設 | 備註                   |
| ------------ | ---- | ---------------------- |
| reactions    | enabled | 反應 + 列出反應       |
| messages     | enabled | 讀取/傳送/編輯/刪除   |
| pins         | enabled | 釘選/取消釘選/列出    |
| memberInfo   | enabled | 成員資訊              |
| emojiList    | enabled | 自訂 emoji 清單       |

### Mattermost

Mattermost 在目前 OpenClaw 版本中作為 bundled Plugin 隨附。較舊或
自訂 build 可使用
`openclaw plugins install @openclaw/mattermost` 安裝目前的 npm package。鎖定版本前，請查看
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
取得目前的 dist-tag。

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

聊天模式：`oncall`（在 @-mention 時回應，預設）、`onmessage`（每則訊息）、`onchar`（以觸發前綴開頭的訊息）。

啟用 Mattermost 原生指令時：

- `commands.callbackPath` 必須是路徑（例如 `/api/channels/mattermost/command`），而不是完整 URL。
- `commands.callbackUrl` 必須解析到 OpenClaw Gateway 端點，且 Mattermost 伺服器必須能連到它。
- 原生斜線回呼會使用 Mattermost 在斜線指令註冊期間傳回的每個指令 token 進行驗證。如果註冊失敗或沒有啟用任何指令，OpenClaw 會以 `Unauthorized: invalid command token.` 拒絕回呼。
- 對於私有、tailnet 或內部回呼主機，Mattermost 可能會要求 `ServiceSettings.AllowedUntrustedInternalConnections` 包含該回呼主機或網域。請使用主機或網域值，不要使用完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕 Mattermost 發起的設定寫入。
- `channels.mattermost.requireMention`：在頻道中回覆前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：每個頻道的提及閘控覆寫（`"*"` 表示預設）。
- 選用的 `channels.mattermost.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。

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

- `channels.signal.account`：將頻道啟動固定到特定 Signal 帳號身分。
- `channels.signal.configWrites`：允許或拒絕 Signal 發起的設定寫入。
- 選用的 `channels.signal.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。

### iMessage

OpenClaw 會產生 `imsg rpc`（透過 stdio 的 JSON-RPC）。不需要 daemon 或連接埠。當主機可以授予 Messages 資料庫和 Automation 權限時，這是新的 OpenClaw iMessage 設定偏好的路徑。

BlueBubbles 支援已移除。`channels.bluebubbles` 在目前的 OpenClaw 上不是受支援的執行階段設定介面。將舊設定遷移到 `channels.imessage`；簡短版本請使用 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整轉換表請使用 [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。

如果 Gateway 未在已登入 Messages 的 Mac 上執行，請保留 `channels.imessage.enabled=true`，並將 `channels.imessage.cliPath` 設為會在該 Mac 上執行 `imsg "$@"` 的 SSH 包裝器。預設本機 `imsg` 路徑僅適用於 macOS。

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- 選用的 `channels.imessage.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。

- 需要 Messages DB 的完整磁碟存取權限。
- 偏好使用 `chat_id:<id>` 目標。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包裝器；設定 `remoteHost`（`host` 或 `user@host`）以擷取 SCP 附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格的主機金鑰檢查，因此請確保轉送主機金鑰已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕 iMessage 發起的設定寫入。
- `channels.imessage.actions.*`：啟用也受 `imsg status` / `openclaw channels status --probe` 閘控的私有 API 動作。
- `channels.imessage.includeAttachments` 預設為關閉；在預期 agent 回合中接收傳入媒體之前，請將它設為 `true`。
- `channels.imessage.catchup.enabled`：選擇加入重播 Gateway 停機期間抵達的傳入訊息。
- `channels.imessage.groups`：群組登錄與每個群組設定。使用 `groupPolicy: "allowlist"` 時，請設定明確的 `chat_id` 鍵或 `"*"` 萬用字元項目，讓群組訊息可以通過登錄閘門。
- 頂層 `bindings[]` 項目搭配 `type: "acp"` 可以將 iMessage 對話繫結到持久 ACP 工作階段。在 `match.peer.id` 中使用正規化 handle 或明確聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP Agents](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包裝器範例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由 Plugin 支援，並在 `channels.matrix` 下設定。

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

- Token 驗證使用 `accessToken`；密碼驗證使用 `userId` + `password`。
- `channels.matrix.proxy` 會透過明確的 HTTP(S) proxy 路由 Matrix HTTP 流量。具名帳號可以使用 `channels.matrix.accounts.<id>.proxy` 覆寫它。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許私有或內部 homeserver。`proxy` 與此網路選擇加入是彼此獨立的控制項。
- `channels.matrix.defaultAccount` 會在多帳號設定中選取偏好的帳號。
- `channels.matrix.autoJoin` 預設為 `off`，因此受邀房間與新的 DM 風格邀請會被忽略，直到你設定含有 `autoJoinAllowlist` 的 `autoJoin: "allowlist"` 或 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在 auto 模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（例如 `@owner:example.org`）。
  - `agentFilter`：選用的 agent ID allowlist。省略時會轉送所有 agents 的核准。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或 regex）。
  - `target`：傳送核准提示的位置。`"dm"`（預設）、`"channel"`（來源房間）或 `"both"`。
  - 每個帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix DM 如何分組成工作階段：`per-user`（預設）依路由後的對等方共用，而 `per-room` 會隔離每個 DM 房間。
- Matrix 狀態探測與即時目錄查詢使用與執行階段流量相同的 proxy 政策。
- 完整 Matrix 設定、目標規則與設定範例記錄於 [Matrix](/zh-TW/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由 Plugin 支援，並在 `channels.msteams` 下設定。

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

- 此處涵蓋的核心鍵路徑：`channels.msteams`、`channels.msteams.configWrites`。
- 完整 Teams 設定（憑證、webhook、DM/群組政策、每個團隊/每個頻道覆寫）記錄於 [Microsoft Teams](/zh-TW/channels/msteams)。

### IRC

IRC 由 Plugin 支援，並在 `channels.irc` 下設定。

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

- 此處涵蓋的核心鍵路徑：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 選用的 `channels.irc.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 完整 IRC 頻道設定（主機/連接埠/TLS/頻道/allowlist/提及閘控）記錄於 [IRC](/zh-TW/channels/irc)。

### 多帳號（所有通道）

每個通道可執行多個帳號（每個都有自己的 `accountId`）：

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

- 省略 `accountId` 時會使用 `default`（CLI + 路由）。
- Env token 只套用於**預設**帳號。
- 基礎頻道設定會套用到所有帳號，除非每個帳號另有覆寫。
- 使用 `bindings[].match.accountId` 將每個帳號路由到不同 agent。
- 如果在仍使用單帳號頂層頻道設定時，透過 `openclaw channels add`（或頻道 onboarding）新增非預設帳號，OpenClaw 會先將帳號範圍的頂層單帳號值提升到頻道帳號對應表，讓原始帳號保持運作。大多數通道會將它們移到 `channels.<channel>.accounts.default`；Matrix 則可以改為保留現有相符的具名/預設目標。
- 現有僅限頻道的繫結（沒有 `accountId`）會繼續符合預設帳號；帳號範圍的繫結仍為選用。
- `openclaw doctor --fix` 也會修復混合形狀，方式是將帳號範圍的頂層單帳號值移入為該通道選定的已提升帳號。大多數通道使用 `accounts.default`；Matrix 則可以改為保留現有相符的具名/預設目標。

### 其他 Plugin 通道

許多 Plugin 通道設定為 `channels.<id>`，並記錄於各自的專用通道頁面（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
請參閱完整通道索引：[通道](/zh-TW/channels)。

### 群組聊天提及閘控

群組訊息預設為**要求提及**（中繼資料提及或安全 regex 模式）。適用於 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群組聊天。

可見回覆會另外控制。群組/頻道聊天室預設為 `messages.groupChat.visibleReplies: "message_tool"`：OpenClaw 仍會處理該回合，但一般最終回覆會保持私密，而可見的聊天室輸出需要 `message(action=send)`。只有在你想要使用舊版行為，也就是一般回覆會發回聊天室時，才設定為 `"automatic"`。若也要將相同的僅工具可見回覆行為套用到直接聊天，請設定 `messages.visibleReplies: "message_tool"`；Codex harness 也會將該僅工具行為作為其未設定直接聊天時的預設值。

僅工具可見回覆需要能可靠呼叫工具的模型/執行階段。如果
工作階段記錄顯示含有 `didSendViaMessagingTool: false` 的 assistant 文字，表示
模型產生了私密最終答案，而不是呼叫 message 工具。
請為該頻道切換到更強的工具呼叫模型，或設定
`messages.groupChat.visibleReplies: "automatic"` 以還原舊版可見最終
回覆。

如果在作用中的工具政策下無法使用 message 工具，OpenClaw 會退回自動可見回覆，而不是靜默抑制回應。`openclaw doctor` 會警告這種不一致。

Gateway 會在檔案儲存後熱重新載入 `messages` 設定。只有在部署中停用檔案監看或設定重新載入時才需要重新啟動。

**提及類型：**

- **中繼資料提及**：原生平台 @-mentions。在 WhatsApp 自我聊天模式中會被忽略。
- **文字模式**：`agents.list[].groupChat.mentionPatterns` 中的安全 regex 模式。無效模式與不安全的巢狀重複會被忽略。
- 只有在可偵測時（原生提及或至少一個模式）才會強制執行提及閘控。

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

`messages.groupChat.historyLimit` 會設定全域預設值。頻道可用 `channels.<channel>.historyLimit`（或每個帳號）覆寫。設定為 `0` 可停用。

`messages.visibleReplies` 是全域來源回合預設值；`messages.groupChat.visibleReplies` 會針對群組/頻道來源回合覆寫它。未設定 `messages.visibleReplies` 時，harness 可提供自己的直接/來源預設值；Codex harness 預設為 `message_tool`。頻道允許清單與提及閘控仍會決定是否處理某個回合。

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

解析順序：每個 DM 覆寫 → 提供者預設值 → 無限制（全部保留）。

支援：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自我聊天模式

在 `allowFrom` 中加入你自己的號碼以啟用自我聊天模式（忽略原生 @-mentions，只回應文字模式）：

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

- 此區塊會設定命令介面。如需目前內建 + 隨附命令目錄，請參閱[斜線命令](/zh-TW/tools/slash-commands)。
- 此頁是**設定鍵參考**，不是完整命令目錄。頻道/Plugin 擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶 `/dreaming`、手機控制 `/phone`，以及 Talk `/voice`，記錄於其頻道/Plugin 頁面與[斜線命令](/zh-TW/tools/slash-commands)。
- 文字命令必須是以 `/` 開頭的**獨立**訊息。
- `native: "auto"` 會為 Discord/Telegram 開啟原生命令，並讓 Slack 保持關閉。
- `nativeSkills: "auto"` 會為 Discord/Telegram 開啟原生 Skills 命令，並讓 Slack 保持關閉。
- 依頻道覆寫：`channels.discord.commands.native`（bool 或 `"auto"`）。對 Discord 而言，`false` 會在啟動期間略過原生命令註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills` 依頻道覆寫原生 Skills 註冊。
- `channels.telegram.customCommands` 會新增額外的 Telegram Bot 選單項目。
- `bash: true` 會為主機 shell 啟用 `! <cmd>`。需要 `tools.elevated.enabled`，且傳送者位於 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 會啟用 `/config`（讀取/寫入 `openclaw.json`）。對於 Gateway `chat.send` 用戶端，持久化 `/config set|unset` 寫入也需要 `operator.admin`；唯讀 `/config show` 仍可供一般具寫入範圍的 operator 用戶端使用。
- `mcp: true` 會為 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會啟用 `/plugins`，用於 Plugin 探索、安裝，以及啟用/停用控制。
- `channels.<provider>.configWrites` 會依頻道控管設定變更（預設值：true）。
- 對於多帳號頻道，`channels.<provider>.accounts.<id>.configWrites` 也會控管以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 與 Gateway 重新啟動工具動作。預設值：`true`。
- `ownerAllowFrom` 是 owner-only 命令/工具的明確擁有者允許清單。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示中雜湊擁有者 ID。設定 `ownerDisplaySecret` 可控制雜湊。
- `allowFrom` 是依提供者設定的。設定後，它會是**唯一**授權來源（會忽略頻道允許清單/配對與 `useAccessGroups`）。
- `useAccessGroups: false` 允許命令在未設定 `allowFrom` 時繞過存取群組政策。
- 命令文件對照：
  - 內建 + 隨附目錄：[斜線命令](/zh-TW/tools/slash-commands)
  - 頻道特定命令介面：[頻道](/zh-TW/channels)
  - QQ Bot 命令：[QQ Bot](/zh-TW/channels/qqbot)
  - 配對命令：[配對](/zh-TW/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-TW/channels/line)
  - 記憶 Dreaming：[Dreaming](/zh-TW/concepts/dreaming)

</Accordion>

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 最上層鍵
- [設定 — agents](/zh-TW/gateway/config-agents)
- [頻道概觀](/zh-TW/channels)
