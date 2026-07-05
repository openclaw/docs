---
read_when:
    - 設定通道外掛（驗證、存取控制、多帳號）
    - 疑難排解各頻道設定鍵
    - 稽核私訊政策、群組政策或提及閘控
summary: 通道設定：涵蓋 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等的存取控制、配對與各通道金鑰
title: 設定 — 頻道
x-i18n:
    generated_at: "2026-07-05T11:18:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26a8920ee55a2e9985425dad6b982a62b61877bde5bb8fcf6ce5e172bf7fb36e
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 下的各通道設定鍵：DM 與群組存取、多帳號設定、提及門檻，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他通道外掛的各通道鍵。

如需代理、工具、閘道執行階段與其他頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 通道

每個通道會在其設定區段存在時自動啟動（除非 `enabled: false`）。Telegram 與 iMessage 隨核心 `openclaw` 套件一起提供。其他官方通道（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost 等）會以獨立外掛透過 `openclaw plugins install <spec>` 安裝；完整清單與安裝規格請參閱[通道](/zh-TW/channels)。

### DM 與群組存取

所有通道都支援 DM 政策與群組政策：

| DM 政策            | 行為                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（預設） | 未知傳送者會取得一次性配對碼；擁有者必須核准 |
| `allowlist`         | 僅允許 `allowFrom` 中的傳送者（或已配對允許儲存區中的傳送者） |
| `open`              | 允許所有傳入 DM（需要 `allowFrom: ["*"]`）             |
| `disabled`          | 忽略所有傳入 DM                                          |

| 群組政策          | 行為                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（預設） | 僅允許符合已設定允許清單的群組          |
| `open`                | 略過群組允許清單（提及門檻仍會套用） |
| `disabled`            | 封鎖所有群組/聊天室訊息                          |

<Note>
`channels.defaults.groupPolicy` 會在提供者的 `groupPolicy` 未設定時設定預設值。
配對碼會在 1 小時後過期。待處理的配對請求上限為**每個帳號 3 個**（依通道與帳號 ID 範圍區分）。
如果提供者區塊完全遺失（缺少 `channels.<provider>`），執行階段群組政策會退回到 `allowlist`（故障關閉），並顯示啟動警告。
</Note>

### 通道模型覆寫

使用 `channels.modelByChannel` 將特定通道 ID 或私訊對等方固定到某個模型。值可接受 `provider/model` 或已設定的模型別名。通道對應只會在工作階段尚未有作用中的模型覆寫時套用（例如透過 `/model` 設定的覆寫）。

對於群組/討論串對話，鍵是通道特定的群組 ID、主題 ID 或通道名稱。對於私訊（DM）對話，鍵是從通道傳送者身分衍生出的對等方識別碼（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From` 或 `SenderId`）。確切的鍵形式取決於通道：

| 通道  | DM 鍵形式         | 範例                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | 原始使用者 ID         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix 使用者 ID      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 原始使用者 ID         | `123456789`                                  |
| WhatsApp | 電話號碼或 JID | `15551234567`                                |

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

DM 專用鍵只會在私訊對話中比對；它們不會影響群組/討論串路由。

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

- `channels.defaults.groupPolicy`：當提供者層級的 `groupPolicy` 未設定時使用的後備群組政策。
- `channels.defaults.contextVisibility`：所有通道的預設補充上下文可見性模式。值：`all`（預設，包含所有引用/討論串/歷史上下文）、`allowlist`（僅包含允許清單傳送者的上下文）、`allowlist_quote`（與 allowlist 相同，但保留明確引用/回覆上下文）。各通道覆寫：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在心跳偵測輸出中包含健康的通道狀態（預設 `false`）。
- `channels.defaults.heartbeat.showAlerts`：在心跳偵測輸出中包含降級/錯誤狀態（預設 `true`）。
- `channels.defaults.heartbeat.useIndicator`：呈現精簡指示器樣式的心跳偵測輸出（預設 `true`）。

### WhatsApp

WhatsApp 會透過閘道的網頁通道（Baileys Web）執行。當已連結的工作階段存在時，它會自動啟動。

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
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

- `web.whatsapp.keepAliveIntervalMs`（預設 `25000`）、`connectTimeoutMs`（預設 `60000`）與 `defaultQueryTimeoutMs`（預設 `60000`）可調整 Baileys socket。
- `web.reconnect` 預設值：`initialMs: 2000`、`maxMs: 30000`、`factor: 1.8`、`jitter: 0.25`、`maxAttempts: 12`。`maxAttempts: 0` 會永久重試，而不是放棄。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為 WhatsApp DM 與群組設定持久 ACP 繫結。在 `match.peer.id` 中使用 E.164 直撥號碼或 WhatsApp 群組 JID。欄位語意在 [ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)中共用。

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

- 傳出命令若存在 `default` 帳號，預設使用該帳號；否則使用第一個已設定的帳號 ID（排序後）。
- 選用的 `channels.whatsapp.defaultAccount` 會在符合已設定帳號 ID 時，覆寫該後備預設帳號選擇。
- 舊版單帳號 Baileys 驗證目錄會由 `openclaw doctor` 遷移到 `whatsapp/default`。
- 各帳號覆寫：`channels.whatsapp.accounts.<id>.sendReadReceipts`、`channels.whatsapp.accounts.<id>.dmPolicy`、`channels.whatsapp.accounts.<id>.allowFrom`。

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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），並以 `TELEGRAM_BOT_TOKEN` 作為預設帳號的後備。
- `apiRoot` 僅是 Telegram Bot API 根目錄。使用 `https://api.telegram.org` 或你自行託管/代理的根目錄，不要使用 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外附加的尾端 `/bot<TOKEN>` 後綴。
- 對於以 `--local` 模式執行的自行託管 Bot API 伺服器，`trustedLocalFileRoots` 會列出 OpenClaw 可讀取的主機路徑。將伺服器資料卷掛載到 OpenClaw 主機，並設定其資料根目錄或各 token 目錄；`/var/lib/telegram-bot-api` 下的容器路徑會對應到這些根目錄。其他絕對路徑仍會被拒絕。
- 選用的 `channels.telegram.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 在多帳號設定（2 個以上帳號 ID）中，設定明確的預設值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免後備路由；若缺少或無效，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖由 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為論壇主題設定持久 ACP 繫結（在 `match.peer.id` 中使用標準 `chatId:topic:topicId`）。欄位語意在 [ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)中共用。
- Telegram 串流預覽使用 `sendMessage` + `editMessageText`（可用於私訊與群組聊天）。
- `network.dnsResultOrder` 預設為 `"ipv4first"`，以避免常見的 IPv6 擷取失敗。
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

- 權杖：`channels.discord.token`，預設帳號會以 `DISCORD_BOT_TOKEN` 作為備援。
- 提供明確 Discord `token` 的直接對外呼叫會使用該權杖執行呼叫；帳號重試/政策設定仍來自作用中執行階段快照裡選取的帳號。
- 選用的 `channels.discord.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 傳遞目標使用 `user:<id>`（DM）或 `channel:<id>`（公會頻道）；裸數字 ID 會被拒絕。
- 公會 slug 使用小寫，並將空格替換為 `-`；頻道鍵使用 slug 化名稱（不含 `#`）。建議優先使用公會 ID。
- 預設會忽略機器人撰寫的訊息。`allowBots: true` 會啟用這些訊息；使用 `allowBots: "mentions"` 則只接受提及該機器人的機器人訊息（仍會過濾自己的訊息）。
- 支援機器人撰寫入站訊息的頻道可以使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。先設定 `channels.defaults.botLoopProtection` 作為基準配對預算，只有在某個介面需要不同限制時才覆寫頻道或帳號。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及頻道覆寫）會丟棄提及其他使用者或角色但未提及該機器人的訊息（不含 @everyone/@here）。
- `channels.discord.mentionAliases` 會在傳送前將穩定的對外 `@handle` 文字對應到 Discord 使用者 ID，因此即使暫時性目錄快取為空，也能以確定方式提及已知隊友。每帳號覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases`。
- `maxLinesPerMessage`（預設 `17`）即使在少於 2000 個字元時，也會拆分過高的訊息。
- `channels.discord.suppressEmbeds` 預設為 `true`，因此除非停用，對外 URL 不會展開成 Discord 連結預覽。明確的 `embeds` 酬載仍會正常傳送；每則訊息的工具呼叫可以用 `suppressEmbeds` 覆寫。
- `channels.discord.threadBindings` 控制 Discord 執行緒綁定路由：
  - `enabled`：執行緒綁定工作階段功能的 Discord 覆寫（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及綁定傳遞/路由）
  - `idleHours`：非作用中自動取消聚焦的小時數 Discord 覆寫（`0` 會停用）
  - `maxAgeHours`：硬性最長存在時間的小時數 Discord 覆寫（`0` 會停用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 與 ACP 執行緒生成自動建立/綁定執行緒的開關（預設：`true`）
  - `defaultSpawnContext`：執行緒綁定生成的原生子代理情境（預設為 `"fork"`）
- 具有 `type: "acp"` 的最上層 `bindings[]` 項目會為頻道與執行緒設定持久 ACP 綁定（在 `match.peer.id` 中使用頻道/執行緒 ID）。欄位語意在 [ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)中共用。
- `channels.discord.ui.components.accentColor` 設定 Discord 元件 v2 容器的強調色。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord 元件回呼保持註冊的時間。預設 `1800000`（30 分鐘），最大 `86400000`（24 小時）。每帳號覆寫位於 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。建議使用符合工作流程的最短 TTL。
- `channels.discord.voice` 啟用 Discord 語音頻道對話，以及選用的自動加入 + LLM + TTS 覆寫。純文字 Discord 設定預設會關閉語音；設定 `channels.discord.voice.enabled=true` 以選擇啟用。
- `channels.discord.voice.model` 可選擇性覆寫用於 Discord 語音頻道回應的 LLM 模型。
- `channels.discord.voice.daveEncryption`（預設 `true`）與 `channels.discord.voice.decryptionFailureTolerance`（預設 `24`）會傳遞至 `@discordjs/voice` DAVE 選項。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間（預設 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制中斷連線的語音工作階段在 OpenClaw 銷毀它之前，可花多久進入重新連線訊號狀態（預設 `15000`）。
- Discord 語音播放不會被其他使用者的開始說話事件中斷。為避免回饋迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取。
- OpenClaw 另外會在重複解密失敗後，透過離開/重新加入語音工作階段來嘗試恢復語音接收。
- `channels.discord.streaming` 是標準串流模式鍵。Discord 預設為 `streaming.mode: "progress"`，因此工具/工作進度會顯示在一則已編輯的預覽訊息中；設定 `streaming.mode: "off"` 可停用。舊版 `streamMode` 與布林 `streaming` 值仍保留為執行階段別名；執行 `openclaw doctor --fix` 以重寫持久化設定。
- `channels.discord.autoPresence` 會將執行階段可用性對應到機器人狀態（healthy => online、degraded => idle、exhausted => dnd），並允許選用的狀態文字覆寫。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變名稱/標籤比對（緊急相容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用代理 ID 允許清單。省略則轉送所有代理的核准。
  - `sessionFilter`：選用工作階段鍵模式（子字串或 regex）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）會傳送給核准者 DM，`"channel"` 會傳送到來源頻道，`"both"` 會同時傳送到兩者。當目標包含 `"channel"` 時，按鈕僅能由已解析的核准者使用。
  - `cleanupAfterResolve`：為 `true` 時，會在核准、拒絕或逾時後刪除核准 DM。

**反應通知模式：** `off`（無）、`own`（機器人的訊息，預設）、`all`（所有訊息）、`allowlist`（所有訊息上來自 `guilds.<id>.users` 的使用者）。

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

- 服務帳號 JSON：內嵌（`serviceAccount`）或檔案式（`serviceAccountFile`）。
- 也支援服務帳號 SecretRef（`serviceAccountRef`）。
- 環境變數備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（僅預設帳號）。
- 傳遞目標使用 `spaces/<spaceId>` 或 `users/<userId>`。
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
        initialHistoryLimit: 20,
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

- **Socket 模式**需要同時有 `botToken` 和 `appToken`（預設帳戶環境後援使用 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加上 `signingSecret`（位於根層級或各帳戶）。
- `socketMode` 會將 Slack SDK Socket Mode 傳輸調校傳遞到公開的 Bolt receiver API。只有在調查 ping/pong 逾時或過期 websocket 行為時才使用它。`clientPingTimeout` 預設為 `15000`；`serverPingTimeout` 和 `pingPongLoggingEnabled` 只會在設定時傳遞。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- Slack 帳戶快照會公開各憑證的來源/狀態欄位，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式中的
  `signingSecretStatus`。`configured_unavailable` 表示該帳戶是
  透過 SecretRef 設定，但目前的命令/執行階段路徑無法
  解析祕密值。
- `configWrites: false` 會阻止 Slack 發起的設定寫入。
- 選用的 `channels.slack.defaultAccount` 會在符合已設定帳戶 id 時覆寫預設帳戶選擇。
- `channels.slack.streaming.mode` 是正式的 Slack 串流模式鍵（預設 `"partial"`）。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生串流傳輸（預設 `true`）。舊版 `streamMode`、布林值 `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce` 和 `nativeStreaming` 值仍保留為執行階段別名；執行 `openclaw doctor --fix` 將已保存的設定重寫為 `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`。
- `unfurlLinks` 和 `unfurlMedia` 會將 Slack 的 `chat.postMessage` 連結與媒體展開布林值傳遞給 Bot 回覆。`unfurlLinks` 預設為 `false`，因此外送 Bot 連結除非啟用，否則不會在行內展開；`unfurlMedia` 除非已設定，否則會省略。請在 `channels.slack.accounts.<accountId>` 設定任一值，以覆寫單一帳戶的頂層值。
- 使用 `user:<id>`（DM）或 `channel:<id>` 作為傳遞目標。

**反應通知模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

**討論串工作階段隔離：** `thread.historyScope` 是每個討論串（預設）或跨頻道共享。`thread.inheritParent` 會將父頻道逐字稿複製到新討論串。`thread.initialHistoryLimit`（預設 `20`）限制新討論串工作階段開始時擷取的既有討論串訊息數量；`0` 會停用討論串歷史擷取。

- Slack 原生串流加上 Slack assistant 風格的「is typing...」討論串狀態需要回覆討論串目標。頂層 DM 預設維持不在討論串中，因此它們仍可透過 Slack 草稿發佈後編輯預覽進行串流，而不顯示討論串風格的原生串流/狀態預覽。
- `typingReaction` 會在回覆執行時，對傳入的 Slack 訊息新增暫時反應，並在完成時移除。請使用 Slack emoji 短代碼，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生核准用戶端傳遞與 exec 核准者授權。結構描述與 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 使用者 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。外掛核准可在 Slack 外掛核准者可解析時，針對 Slack 來源請求使用此原生用戶端路徑；Slack 原生外掛核准傳遞也可透過 `approvals.plugin` 針對 Slack 來源工作階段或 Slack 目標啟用。外掛核准使用來自 `allowFrom` 和預設路由的 Slack 外掛核准者，而不是 exec 核准者。

| 動作群組 | 預設 | 備註                  |
| ------------ | ------- | ---------------------- |
| reactions    | 已啟用 | 反應 + 列出反應 |
| messages     | 已啟用 | 讀取/傳送/編輯/刪除  |
| pins         | 已啟用 | 釘選/取消釘選/列出         |
| memberInfo   | 已啟用 | 成員資訊            |
| emojiList    | 已啟用 | 自訂 emoji 清單      |

### Mattermost

Mattermost 會安裝為獨立外掛，方式與 Discord、Slack 和 WhatsApp 相同：

```bash
openclaw plugins install @openclaw/mattermost
```

釘選版本之前，請檢查 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) 以取得目前的 dist-tags。

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

啟用 Mattermost 原生命令時：

- `commands.callbackPath` 必須是路徑（例如 `/api/channels/mattermost/command`），而不是完整 URL。
- `commands.callbackUrl` 必須解析到 OpenClaw 閘道端點，且可由 Mattermost 伺服器連線。
- 原生斜線命令回呼會使用 Mattermost 在斜線命令註冊期間傳回的各命令權杖
  進行驗證。如果註冊失敗或沒有啟用任何
  命令，OpenClaw 會以
  `Unauthorized: invalid command token.` 拒絕回呼。
- 對於私有/tailnet/內部回呼主機，Mattermost 可能需要
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機/網域。
  請使用主機/網域值，而不是完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕 Mattermost 發起的設定寫入。
- `channels.mattermost.requireMention`：在頻道中回覆前需要 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：各頻道的提及閘控覆寫（`"*"` 作為預設）。
- 選用的 `channels.mattermost.defaultAccount` 會在符合已設定帳戶 id 時覆寫預設帳戶選擇。

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

- `channels.signal.account`：將頻道啟動釘選到特定 Signal 帳戶身分。
- `channels.signal.configWrites`：允許或拒絕 Signal 發起的設定寫入。
- 選用的 `channels.signal.defaultAccount` 會在符合已設定帳戶 id 時覆寫預設帳戶選擇。

### iMessage

OpenClaw 會產生 `imsg rpc`（透過 stdio 的 JSON-RPC）。不需要常駐程式或連接埠。當主機可授予 Messages 資料庫和 Automation 權限時，這是新 OpenClaw iMessage 設定的偏好路徑。

BlueBubbles 支援已移除。`channels.bluebubbles` 不是目前 OpenClaw 支援的執行階段設定介面。請將舊設定遷移到 `channels.imessage`；簡短版本請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整翻譯表請參閱 [從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。

如果閘道未在已登入 Messages 的 Mac 上執行，請保留 `channels.imessage.enabled=true`，並將 `channels.imessage.cliPath` 設為會在該 Mac 上執行 `imsg "$@"` 的 SSH 包裝程式。預設本機 `imsg` 路徑僅適用於 macOS。

在依賴 SSH 包裝程式進行正式環境傳送之前，請透過該精確包裝程式驗證外送 `imsg send`。某些 macOS TCC 狀態會將 Messages Automation 指派給 `/usr/libexec/sshd-keygen-wrapper`，這可能讓讀取和探查可正常運作，但傳送因 AppleEvents `-1743` 而失敗；請參閱 [iMessage](/zh-TW/channels/imessage) 上的 SSH 包裝程式疑難排解章節。

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

- 選用的 `channels.imessage.defaultAccount` 會在符合已設定帳戶 id 時覆寫預設帳戶選擇。
- 需要 Messages DB 的完整磁碟存取權。
- 偏好使用 `chat_id:<id>` 目標。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可指向 SSH 包裝程式；設定 `remoteHost`（`host` 或 `user@host`）以進行 SCP 附件擷取。
- `attachmentRoots` 和 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格的主機金鑰檢查，因此請確保轉送主機金鑰已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕 iMessage 發起的設定寫入。
- `channels.imessage.sendTransport`：一般外送回覆偏好的 `imsg` RPC 傳送傳輸。`auto`（預設）會在 IMCore bridge 執行時，對既有聊天使用它，然後後援到 AppleScript；`bridge` 需要私有 API 傳遞；`applescript` 會強制使用公開 Messages automation 路徑。
- `channels.imessage.actions.*`：啟用也受到 `imsg status` / `openclaw channels status --probe` 閘控的私有 API 動作。
- `channels.imessage.includeAttachments` 預設關閉；在預期 agent 回合中有傳入媒體前，請將其設為 `true`。
- bridge/gateway 重新啟動後的傳入復原是自動的（GUID 去重加上過期積壓年齡柵欄）。既有的 `channels.imessage.catchup.enabled: true` 設定仍會作為已淘汰的相容性設定檔受到支援；`catchup` 預設停用。
- `channels.imessage.groups`：群組登錄與各群組設定。使用 `groupPolicy: "allowlist"` 時，請設定明確的 `chat_id` 鍵或 `"*"` 萬用字元項目，讓群組訊息可通過登錄閘門。
- 頂層 `bindings[]` 項目若具有 `type: "acp"`，可將 iMessage 對話繫結到持久 ACP 工作階段。請在 `match.peer.id` 使用正規化控制代碼或明確聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共享欄位語意：[ACP Agents](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包裝程式範例">

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
- `channels.matrix.proxy` 會透過明確的 HTTP(S) Proxy 路由 Matrix HTTP 流量。具名帳號可用 `channels.matrix.accounts.<id>.proxy` 覆寫。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許私有/內部 homeserver。`proxy` 和這項網路選擇加入是彼此獨立的控制項。
- `channels.matrix.defaultAccount` 會在多帳號設定中選取偏好的帳號。
- `channels.matrix.autoJoin` 預設為 `"off"`，因此受邀房間和新的 DM 風格邀請都會被忽略，直到你設定 `autoJoin: "allowlist"` 搭配 `autoJoinAllowlist`，或設定 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析出核准者時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（例如 `@owner:example.org`）。
  - `agentFilter`：選用的 agent ID 允許清單。省略時會轉送所有 agent 的核准。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或 regex）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）、`"channel"`（來源房間）或 `"both"`。
  - 每帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix DM 如何分組成工作階段：`per-user`（預設）會依路由到的對等端共用，而 `per-room` 會隔離每個 DM 房間。
- Matrix 狀態探測和即時目錄查詢會使用與執行階段流量相同的 Proxy 政策。
- 完整的 Matrix 設定、目標規則和設定範例記錄於 [Matrix](/zh-TW/channels/matrix)。

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

- 此處涵蓋的核心鍵路徑：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 設定（憑證、網路鉤子、DM/群組政策、每團隊/每頻道覆寫）記錄於 [Microsoft Teams](/zh-TW/channels/msteams)。

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

- 此處涵蓋的核心鍵路徑：`channels.irc`、`channels.irc.dmPolicy`、`channels.irc.configWrites`、`channels.irc.nickserv.*`。
- 選用的 `channels.irc.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 完整的 IRC 頻道設定（主機/連接埠/TLS/頻道/允許清單/提及閘控）記錄於 [IRC](/zh-TW/channels/irc)。

### 多帳號（所有頻道）

每個頻道執行多個帳號（每個都有自己的 `accountId`）：

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
- 環境變數權杖只套用於 **default** 帳號。
- 基礎頻道設定會套用至所有帳號，除非每帳號覆寫。
- 使用 `bindings[].match.accountId` 將每個帳號路由至不同 agent。
- 如果你在仍使用單帳號頂層頻道設定時，透過 `openclaw channels add`（或頻道 onboarding）新增非預設帳號，OpenClaw 會先將帳號範圍的頂層單帳號值提升到頻道帳號對應中，讓原始帳號繼續運作。多數頻道會將它們移到 `channels.<channel>.accounts.default`；Matrix 則可改為保留既有相符的具名/預設目標。
- 既有僅限頻道的繫結（沒有 `accountId`）會繼續符合預設帳號；帳號範圍的繫結仍為選用。
- `openclaw doctor --fix` 也會修復混合形狀，方式是將帳號範圍的頂層單帳號值移到為該頻道選定的已提升帳號。多數頻道使用 `accounts.default`；Matrix 則可改為保留既有相符的具名/預設目標。

### 其他外掛頻道

許多外掛頻道設定為 `channels.<id>`，並記錄於各自專屬的頻道頁面（例如 Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch 和 Zalo）。
請參閱完整頻道索引：[頻道](/zh-TW/channels)。

### 群組聊天提及閘控

群組訊息預設為 **需要提及**（中繼資料提及或安全的 regex 模式）。適用於 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群組聊天。

可見回覆會另外控制。一般群組、頻道和內部 WebChat 直接請求預設會自動傳遞最終內容：最終 assistant 文字會透過舊版可見回覆路徑張貼。當可見輸出應只在 agent 呼叫 `message(action=send)` 後張貼時，選擇加入 `messages.visibleReplies: "message_tool"` 或 `messages.groupChat.visibleReplies: "message_tool"`。如果模型在選擇加入的僅工具模式中沒有呼叫訊息工具就回傳最終文字，該最終文字會保持私密，且閘道詳細記錄會記錄被抑制的 payload 中繼資料。

僅工具可見回覆需要能可靠呼叫工具的模型/執行階段，並建議用於最新世代模型（例如 GPT 5.5）上的共享環境房間。有些較弱的模型可以回答最終文字，但無法理解來源可見輸出必須以 `message(action=send)` 傳送。對於這些模型，請使用 `"automatic"`，讓最終 assistant 回合成為可見回覆路徑。如果工作階段記錄顯示 assistant 文字帶有 `didSendViaMessagingTool: false`，表示模型產生的是私密最終文字，而不是呼叫訊息工具。請切換到該頻道較強的工具呼叫模型、檢查閘道詳細記錄中的被抑制 payload 摘要，或設定 `messages.groupChat.visibleReplies: "automatic"`，讓每個群組/頻道請求都使用可見最終回覆。

如果訊息工具在作用中的工具政策下不可用，OpenClaw 會改為退回自動可見回覆，而不是無聲抑制回應。`openclaw doctor` 會警告此不相符狀態。

此規則適用於一般 agent 最終文字。外掛擁有的對話繫結會使用擁有外掛回傳的回覆，作為已宣告繫結執行緒回合的可見回應；該外掛不需要為這些繫結回覆呼叫 `message(action=send)`。

**疑難排解：群組 @提及觸發輸入中狀態後沉默（無錯誤）**

症狀：群組/頻道 @提及會顯示輸入中指示器，且閘道記錄回報 `dispatch complete (queuedFinal=false, replies=0)`，但房間內沒有收到訊息。傳給同一 agent 的 DM 會正常回覆。

原因：群組/頻道的可見回覆模式解析為 `"message_tool"`，因此 OpenClaw 會執行該回合，但除非 agent 呼叫 `message(action=send)`，否則會抑制最終 assistant 文字。此模式沒有 `NO_REPLY` contract；沒有訊息工具呼叫就沒有來源回覆。沒有錯誤，因為抑制是已設定的行為。一般群組和頻道回合預設為 `"automatic"`，所以只有在明確將 `messages.groupChat.visibleReplies`（或全域 `messages.visibleReplies`）設定為 `"message_tool"` 時，才會出現此症狀。Harness `defaultVisibleReplies` 不適用於此處 — 群組/頻道解析器會忽略它；它只影響直接/來源聊天（Codex harness 會用這種方式抑制直接聊天的最終內容）。

修正：選擇較強的工具呼叫模型、移除明確的 `"message_tool"` 覆寫以退回 `"automatic"` 預設值，或設定 `messages.groupChat.visibleReplies: "automatic"`，強制每個群組/頻道請求都使用可見回覆。儲存檔案後，閘道會熱重新載入 `messages` 設定；只有在部署中停用檔案監看或設定重新載入時，才需要重新啟動閘道。

**提及類型：**

- **中繼資料提及**：原生平台 @ 提及。在 WhatsApp 自我聊天模式中會被忽略。
- **文字模式**：`agents.list[].groupChat.mentionPatterns` 中的安全 regex 模式。無效模式和不安全的巢狀重複會被忽略。
- 只有在可偵測時（原生提及或至少一個模式），才會強制執行提及閘控。

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

`messages.groupChat.historyLimit` 會設定全域預設值。頻道可用 `channels.<channel>.historyLimit`（或每帳號設定）覆寫。設定為 `0` 可停用。

`messages.groupChat.unmentionedInbound: "room_event"` 會在支援的頻道上，將未提及的常開群組/頻道訊息作為安靜的房間脈絡提交。已提及訊息、命令和直接訊息仍維持為使用者請求。完整的 Discord、Slack 和 Telegram 範例請參閱 [環境房間事件](/zh-TW/channels/ambient-room-events)。

`messages.visibleReplies` 是全域來源事件預設值；`messages.groupChat.visibleReplies` 會針對群組/頻道來源事件覆寫它。未設定 `messages.visibleReplies` 時，直接/來源聊天會使用選定的執行階段或 harness 預設值，但內部 WebChat 直接回合會使用自動最終傳遞，以維持 Pi/Codex 提示詞一致性。設定 `messages.visibleReplies: "message_tool"` 可刻意要求以 `message(action=send)` 產生可見輸出。頻道允許清單和提及閘控仍會決定是否處理事件。

#### DM 歷史記錄限制

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

解析順序：每 DM 覆寫 → provider 預設值 → 無限制（全部保留）。

此解析器會針對任何工作階段鍵遵循標準 `provider:direct:<id>`（或舊版 `provider:dm:<id>`）形狀的頻道，讀取 `channels.<provider>.dmHistoryLimit` 和 `channels.<provider>.dms.<id>.historyLimit`，因此它可同時適用於 bundled 和外掛頻道，而不只是固定清單。

#### 自我聊天模式

在 `allowFrom` 中包含你自己的號碼以啟用自我聊天模式（忽略原生 @ 提及，只回應文字模式）：

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

- 此區塊設定命令介面。若要查看目前內建 + 捆綁的命令目錄，請參閱[斜線命令](/zh-TW/tools/slash-commands)。
- 此頁面是**設定鍵參考**，不是完整命令目錄。頻道/外掛擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶 `/dreaming`、手機控制 `/phone`，以及 Talk `/voice`，會記錄在其頻道/外掛頁面以及[斜線命令](/zh-TW/tools/slash-commands)中。
- 文字命令必須是帶有前置 `/` 的**獨立**訊息。
- `native: "auto"` 會為 Discord/Telegram 啟用原生命令，並讓 Slack 維持關閉。
- `nativeSkills: "auto"` 會為 Discord/Telegram 啟用原生 Skills 命令，並讓 Slack 維持關閉。
- 依頻道覆寫：`channels.discord.commands.native`（布林值或 `"auto"`）。對於 Discord，`false` 會在啟動期間跳過原生命令註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills` 依頻道覆寫原生 Skills 註冊。
- `channels.telegram.customCommands` 會新增額外的 Telegram Bot 選單項目。
- `bash: true` 會為主機 shell 啟用 `! <cmd>`。需要 `tools.elevated.enabled`，且傳送者必須位於 `tools.elevated.allowFrom.<channel>`。
- `config: true` 會啟用 `/config`（讀取/寫入 `openclaw.json`）。對於閘道 `chat.send` 用戶端，持久性 `/config set|unset` 寫入也需要 `operator.admin`；唯讀 `/config show` 仍可供一般具寫入範圍的操作者用戶端使用。
- `mcp: true` 會針對 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會啟用 `/plugins`，用於外掛探索、安裝，以及啟用/停用控制。
- `channels.<provider>.configWrites` 會依頻道控管設定變更（預設：true）。
- 對於多帳號頻道，`channels.<provider>.accounts.<id>.configWrites` 也會控管以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 和閘道重新啟動工具動作。預設：`true`。
- `ownerAllowFrom` 是擁有者專用命令和受擁有者控管的頻道動作所使用的明確擁有者允許清單。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示中雜湊擁有者 ID。設定 `ownerDisplaySecret` 以控制雜湊。
- `allowFrom` 是依提供者設定。設定後，它就是**唯一**授權來源（頻道允許清單/配對和 `useAccessGroups` 會被忽略）。
- `useAccessGroups: false` 允許命令在未設定 `allowFrom` 時繞過存取群組政策。
- 命令文件對照：
  - 內建 + 捆綁目錄：[斜線命令](/zh-TW/tools/slash-commands)
  - 頻道特定命令介面：[頻道](/zh-TW/channels)
  - QQ Bot 命令：[QQ Bot](/zh-TW/channels/qqbot)
  - 配對命令：[配對](/zh-TW/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-TW/channels/line)
  - 記憶夢境整理：[夢境整理](/zh-TW/concepts/dreaming)

</Accordion>

---

## 相關

- [設定參考](/zh-TW/gateway/configuration-reference) — 頂層鍵
- [設定 — agent](/zh-TW/gateway/config-agents)
- [頻道概觀](/zh-TW/channels)
