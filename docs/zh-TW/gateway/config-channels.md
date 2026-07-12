---
read_when:
    - 設定頻道外掛（驗證、存取控制、多帳號）
    - 疑難排解各頻道的設定鍵
    - 稽核私訊政策、群組政策或提及閘控
summary: 頻道設定：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等頻道的存取控制、配對與各頻道金鑰
title: 設定 — 頻道
x-i18n:
    generated_at: "2026-07-12T14:27:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: af161d396b2dc40e3ccb5f00ca4815fc1ad782f96f98dc4a74d65be958530da6
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 下的各頻道設定鍵：私訊與群組存取、多帳號設定、提及閘控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他頻道外掛的個別頻道設定鍵。

關於代理程式、工具、閘道執行階段及其他頂層設定鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 頻道

當頻道的設定區段存在時，每個頻道都會自動啟動（除非設定 `enabled: false`）。Telegram 和 iMessage 隨核心 `openclaw` 套件一同提供。其他官方頻道（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost 等）會以獨立外掛形式安裝，使用 `openclaw plugins install <spec>`；完整清單與安裝規格請參閱[頻道](/zh-TW/channels)。

### 私訊與群組存取

所有頻道都支援私訊政策與群組政策：

| 私訊政策            | 行為                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（預設）   | 未知的傳送者會收到一次性配對碼；擁有者必須核准                  |
| `allowlist`         | 僅允許 `allowFrom` 中的傳送者（或已配對的允許儲存區）            |
| `open`              | 允許所有傳入私訊（需要 `allowFrom: ["*"]`）                     |
| `disabled`          | 忽略所有傳入私訊                                                |

| 群組政策              | 行為                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（預設）   | 僅允許符合已設定允許清單的群組                         |
| `open`                | 略過群組允許清單（提及閘控仍會套用）                   |
| `disabled`            | 封鎖所有群組／聊天室訊息                               |

<Note>
當提供者未設定 `groupPolicy` 時，`channels.defaults.groupPolicy` 會設定其預設值。
配對碼會在 1 小時後到期。待處理的配對要求上限為**每個帳號 3 個**（依頻道與帳號 ID 劃分範圍）。
如果提供者區塊完全缺失（不存在 `channels.<provider>`），執行階段群組政策會退回 `allowlist`（預設拒絕），並在啟動時發出警告。
</Note>

### 頻道模型覆寫

使用 `channels.modelByChannel` 將特定頻道 ID 或私訊對象固定至某個模型。值可接受 `provider/model` 或已設定的模型別名。僅當工作階段尚未有作用中的模型覆寫時，才會套用頻道對應（例如透過 `/model` 設定的覆寫）。

對於群組／討論串對話，設定鍵是頻道特定的群組 ID、主題 ID 或頻道名稱。對於私訊（DM）對話，設定鍵是從頻道傳送者身分衍生的對象識別碼（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From` 或 `SenderId`）。確切的設定鍵格式取決於頻道：

| 頻道     | 私訊設定鍵格式      | 範例                                         |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | 原始使用者 ID       | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | Matrix 使用者 ID    | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | 原始使用者 ID       | `123456789`                                  |
| WhatsApp | 電話號碼或 JID      | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

私訊專用設定鍵只會在私訊對話中比對；不會影響群組／討論串路由。

### 頻道預設值與心跳偵測

使用 `channels.defaults` 設定各提供者共用的群組政策與心跳偵測行為：

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

- `channels.defaults.groupPolicy`：當提供者層級未設定 `groupPolicy` 時使用的備援群組政策。
- `channels.defaults.contextVisibility`：所有頻道的預設補充上下文可見性模式。值：`all`（預設，包含所有引用／討論串／歷程上下文）、`allowlist`（僅包含來自允許清單中傳送者的上下文）、`allowlist_quote`（與允許清單相同，但保留明確的引用／回覆上下文）。各頻道可使用 `channels.<channel>.contextVisibility` 覆寫。
- `channels.defaults.heartbeat.showOk`：在心跳偵測輸出中包含狀態正常的頻道（預設為 `false`）。
- `channels.defaults.heartbeat.showAlerts`：在心跳偵測輸出中包含降級／錯誤狀態（預設為 `true`）。
- `channels.defaults.heartbeat.useIndicator`：以精簡指示器樣式呈現心跳偵測輸出（預設為 `true`）。

### WhatsApp

WhatsApp 透過閘道的網頁頻道（Baileys Web）執行。存在已連結的工作階段時，它會自動啟動。

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
      maxAttempts: 12, // 0 = 永遠重試
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // 藍色勾號（自我聊天模式中為 false）
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- `web.whatsapp.keepAliveIntervalMs`（預設為 `25000`）、`connectTimeoutMs`（預設為 `60000`）和 `defaultQueryTimeoutMs`（預設為 `60000`）可調整 Baileys 通訊端。
- `web.reconnect` 預設值：`initialMs: 2000`、`maxMs: 30000`、`factor: 1.8`、`jitter: 0.25`、`maxAttempts: 12`。`maxAttempts: 0` 會持續重試，而不會放棄。
- 頂層 `bindings[]` 中 `type: "acp"` 的項目可為 WhatsApp 私訊與群組設定持續性 ACP 繫結。在 `match.peer.id` 中使用 E.164 直撥號碼或 WhatsApp 群組 JID。欄位語意共用於 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

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

- 傳出命令預設使用 `default` 帳號（如果存在）；否則使用排序後第一個已設定的帳號 ID。
- 當 `channels.whatsapp.defaultAccount` 符合已設定的帳號 ID 時，此選用設定會覆寫該備援預設帳號選擇。
- 舊版單帳號 Baileys 驗證目錄會由 `openclaw doctor` 遷移至 `whatsapp/default`。
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
          systemPrompt: "保持回答簡短。",
          topics: {
            "99": {
              requireMention: false,
              skills: ["search"],
              systemPrompt: "請緊扣主題。",
            },
          },
        },
      },
      customCommands: [
        { command: "backup", description: "Git 備份" },
        { command: "generate", description: "建立圖片" },
      ],
      historyLimit: 50,
      replyToMode: "first", // off | first | all | batched
      linkPreview: true,
      streaming: "partial", // off | partial | block | progress（預設：partial）
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

- Bot 權杖：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），預設帳號會以 `TELEGRAM_BOT_TOKEN` 作為備援。
- `apiRoot` 僅是 Telegram Bot API 根目錄。請使用 `https://api.telegram.org` 或你的自架／代理根目錄，不要使用 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外加上的尾端 `/bot<TOKEN>` 後綴。
- 對於在 `--local` 模式下自架的 Bot API 伺服器，`trustedLocalFileRoots` 會列出 OpenClaw 可讀取的主機路徑。將伺服器資料磁碟區掛載至 OpenClaw 主機，並設定其資料根目錄或各權杖目錄；`/var/lib/telegram-bot-api` 下的容器路徑會對應至這些根目錄。其他絕對路徑仍會遭到拒絕。
- 當 `channels.telegram.defaultAccount` 符合已設定的帳號 ID 時，此選用設定會覆寫預設帳號選擇。
- 在多帳號設定（2 個以上的帳號 ID）中，請設定明確的預設帳號（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`），以避免備援路由；當此設定缺失或無效時，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖由 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 頂層 `bindings[]` 中 `type: "acp"` 的項目可為論壇主題設定持續性 ACP 繫結（在 `match.peer.id` 中使用標準的 `chatId:topic:topicId`）。欄位語意共用於 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
- Telegram 串流預覽使用 `sendMessage` + `editMessageText`（適用於私訊與群組聊天）。
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
              systemPrompt: "僅提供簡短回答。",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress（Discord 預設：progress）
        chunkMode: "length", // length | newline
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
- 提供明確 Discord `token` 的直接對外呼叫會使用該權杖進行呼叫；帳號的重試／政策設定仍取自作用中執行階段快照內所選的帳號。
- 選用的 `channels.discord.defaultAccount` 若與已設定的帳號 ID 相符，會覆寫預設帳號選擇。
- 傳送目標請使用 `user:<id>`（DM）或 `channel:<id>`（伺服器頻道）；不接受單獨的數字 ID。
- 伺服器 slug 使用小寫，並將空格替換為 `-`；頻道鍵使用經 slug 化的名稱（不含 `#`）。建議優先使用伺服器 ID。
- 預設會忽略機器人撰寫的訊息。`allowBots: true` 會啟用這些訊息；使用 `allowBots: "mentions"` 可僅接受提及該機器人的機器人訊息（仍會過濾自身訊息）。
- 支援接收機器人撰寫訊息的頻道可以使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。請透過 `channels.defaults.botLoopProtection` 設定配對預算基準，只有在某個頻道或帳號介面需要不同限制時才進行覆寫。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及頻道覆寫）會捨棄提及其他使用者或角色、但未提及該機器人的訊息（不包含 @everyone/@here）。
- `channels.discord.mentionAliases` 會在傳送前，將穩定的對外 `@handle` 文字對應至 Discord 使用者 ID，因此即使暫時性目錄快取為空，仍能以確定性方式提及已知的團隊成員。各帳號的覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases`。
- `maxLinesPerMessage`（預設為 `17`）即使訊息少於 2000 個字元，也會拆分行數過多的訊息。
- `channels.discord.suppressEmbeds` 預設為 `true`，因此除非停用，否則對外 URL 不會展開為 Discord 連結預覽。明確的 `embeds` 承載資料仍會正常傳送；每則訊息的工具呼叫可透過 `suppressEmbeds` 覆寫。
- `channels.discord.threadBindings` 控制 Discord 討論串繫結路由：
  - `enabled`：Discord 對討論串繫結工作階段功能的覆寫（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及繫結的傳送／路由）
  - `idleHours`：Discord 對閒置自動取消聚焦時數的覆寫（`0` 表示停用）
  - `maxAgeHours`：Discord 對硬性最長存續時數的覆寫（`0` 表示停用）
  - `spawnSessions`：控制 `sessions_spawn({ thread: true })` 與 ACP 討論串衍生時自動建立／繫結討論串的開關（預設：`true`）
  - `defaultSpawnContext`：討論串繫結衍生所使用的原生子代理程式情境（預設為 `"fork"`）
- 含有 `type: "acp"` 的頂層 `bindings[]` 項目，會為頻道與討論串設定持久性 ACP 繫結（請在 `match.peer.id` 中使用頻道／討論串 ID）。欄位語意共用於 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
- `channels.discord.ui.components.accentColor` 設定 Discord components v2 容器的強調色。
- `channels.discord.agentComponents.ttlMs` 控制已傳送 Discord 元件回呼維持註冊的時間。預設為 `1800000`（30 分鐘），上限為 `86400000`（24 小時）。各帳號的覆寫位於 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。建議使用能滿足工作流程的最短 TTL。
- `channels.discord.voice` 啟用 Discord 語音頻道對話，以及選用的自動加入、LLM 和 TTS 覆寫。純文字 Discord 設定預設會關閉語音；請設定 `channels.discord.voice.enabled=true` 以選擇啟用。
- `channels.discord.voice.model` 可選擇性覆寫 Discord 語音頻道回應所使用的 LLM 模型。
- `channels.discord.voice.daveEncryption`（預設為 `true`）和 `channels.discord.voice.decryptionFailureTolerance`（預設為 `24`）會直接傳遞至 `@discordjs/voice` 的 DAVE 選項。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試時，初次等候 `@discordjs/voice` Ready 的時間（預設為 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制語音工作階段中斷連線後，可花多長時間進入重新連線訊號狀態，超過後 OpenClaw 便會將其銷毀（預設為 `15000`）。
- Discord 語音播放不會因其他使用者的開始說話事件而中斷。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取。
- 此外，OpenClaw 會在重複發生解密失敗後，離開並重新加入語音工作階段，以嘗試恢復語音接收。
- `channels.discord.streaming` 是標準的串流模式鍵。Discord 預設使用 `streaming.mode: "progress"`，因此工具／工作進度會顯示在同一則持續編輯的預覽訊息中；設定 `streaming.mode: "off"` 可停用此功能。舊版扁平鍵（`streamMode`、`chunkMode`、`blockStreaming`、`draftChunk`、`blockStreamingCoalesce`）不再由執行階段讀取；請執行 `openclaw doctor --fix` 以遷移持久化設定。
- `channels.discord.autoPresence` 會將執行階段可用性對應至機器人上線狀態（健康 => online、降級 => idle、耗盡 => dnd），並允許選用的狀態文字覆寫。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變動的名稱／標籤比對（緊急相容模式）。
- `channels.discord.execApprovals`：Discord 原生的執行核准傳送與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式下，若可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者，便會啟用執行核准。
  - `approvers`：允許核准執行要求的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用的代理程式 ID 允許清單。省略即可轉送所有代理程式的核准要求。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或規則運算式）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）會傳送至核准者的 DM，`"channel"` 會傳送至原始頻道，`"both"` 則會同時傳送至兩者。當目標包含 `"channel"` 時，只有已解析的核准者能使用按鈕。
  - `cleanupAfterResolve`：設為 `true` 時，會在核准、拒絕或逾時後刪除核准 DM。

**回應通知模式：** `off`（無）、`own`（機器人的訊息，預設）、`all`（所有訊息）、`allowlist`（所有訊息中來自 `guilds.<id>.users` 的回應）。

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

- 服務帳戶 JSON：內嵌（`serviceAccount`）或檔案型（`serviceAccountFile`）。
- 也支援服務帳戶 SecretRef（`serviceAccountRef`）。
- 環境變數備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（僅限預設帳號）。
- 傳送目標請使用 `spaces/<spaceId>` 或 `users/<userId>`。
- `channels.googlechat.dangerouslyAllowNameMatching` 會重新啟用可變動的電子郵件主體比對（緊急相容模式）。

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "僅提供簡短回答。",
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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // 當 mode=partial 時使用 Slack 原生串流 API
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

- **Socket 模式**同時需要 `botToken` 和 `appToken`（預設帳號的環境變數備援為 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加上 `signingSecret`（可位於根層級或各帳號層級）。
- `enterpriseOrgInstall: true` 會讓帳號選用 Slack Enterprise Grid
  的全組織事件路徑。啟動時會使用 `auth.test` 驗證機器人權杖，
  若設定的模式與 Slack 的安裝身分不符，啟動就會失敗。
  Enterprise 私訊必須停用，或使用 `dmPolicy: "open"` 並搭配有效的
  `allowFrom: ["*"]`。頻道與使用者原則必須使用穩定的 Slack ID；
  使用可變名稱或不支援的頻道前綴會導致啟動失敗。V1 僅處理直接的
  Socket Mode 或 HTTP `message` 與 `app_mention` 事件，並立即
  回覆；不支援中繼、命令、互動、App Home、回應事件接聽器、
  釘選、動作工具、原生核准、繫結、延遲傳遞及主動傳送。由接聽器
  負責的確認、輸入狀態和狀態回應，在具備 `reactions:write` 時仍然
  可用；不支援傳入回應通知及回應動作工具。最低權限資訊清單、設定
  工作流程及完整限制，請參閱
  [Enterprise Grid 全組織安裝](/zh-TW/channels/slack#enterprise-grid-org-wide-installs)。
- `socketMode` 會透過公開的 Bolt 接收器 API 傳遞 Slack SDK Socket Mode 傳輸調校設定。僅在調查 ping/pong 逾時或過期的 websocket 行為時使用。`clientPingTimeout` 預設為 `15000`；只有在設定後，才會傳遞 `serverPingTimeout` 和 `pingPongLoggingEnabled`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- Slack 帳號快照會公開各認證資訊的來源／狀態欄位，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及 HTTP 模式中的
  `signingSecretStatus`。`configured_unavailable` 表示帳號已透過
  SecretRef 設定，但目前的命令／執行階段路徑無法解析密鑰值。
- `configWrites: false` 會阻擋由 Slack 發起的設定寫入。
- 當選用的帳號 ID 與已設定的帳號相符時，可選的 `channels.slack.defaultAccount` 會覆寫預設帳號選擇。
- `channels.slack.streaming.mode` 是標準的 Slack 串流模式鍵（預設為 `"partial"`）。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生串流傳輸（預設為 `true`）。執行階段不再讀取舊版的 `streamMode`、布林值 `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce` 和 `nativeStreaming` 值；請執行 `openclaw doctor --fix`，將持久化設定遷移至 `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`。
- `unfurlLinks` 和 `unfurlMedia` 會為機器人回覆傳遞 Slack `chat.postMessage` 的連結與媒體展開布林值。`unfurlLinks` 預設為 `false`，因此除非啟用，否則機器人傳出的連結不會在行內展開；若未設定，則會省略 `unfurlMedia`。若要為單一帳號覆寫頂層值，請在 `channels.slack.accounts.<accountId>` 設定任一值。
- 傳遞目標請使用 `user:<id>`（私訊）或 `channel:<id>`。

**回應通知模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

**討論串工作階段隔離：** `thread.historyScope` 可設為各討論串獨立（預設），或在頻道中共用。`thread.inheritParent` 會將父頻道逐字稿複製到新討論串。`thread.initialHistoryLimit`（預設為 `20`）限制新討論串工作階段啟動時擷取的現有討論串訊息數量；`0` 會停用討論串歷史記錄擷取。

- Slack 原生串流及 Slack 助理風格的 “is typing...” 討論串狀態需要回覆討論串目標。頂層私訊預設不在討論串中，因此仍可透過 Slack 草稿的張貼後編輯預覽進行串流，而不會顯示討論串風格的原生串流／狀態預覽。
- `typingReaction` 會在回覆執行期間，於傳入的 Slack 訊息上加入暫時回應，並在完成時移除。請使用 Slack 表情符號短代碼，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生核准用戶端傳遞與執行核准者授權。結構描述與 Discord 相同：`enabled`（`true`／`false`／`"auto"`）、`approvers`（Slack 使用者 ID）、`agentFilter`、`sessionFilter`，以及 `target`（`"dm"`、`"channel"` 或 `"both"`）。當 Slack 外掛核准者可解析時，外掛核准可針對源自 Slack 的要求使用此原生用戶端路徑；也可透過 `approvals.plugin`，為源自 Slack 的工作階段或 Slack 目標啟用 Slack 原生外掛核准傳遞。外掛核准使用來自 `allowFrom` 和預設路由的 Slack 外掛核准者，而非執行核准者。

| 動作群組 | 預設值 | 備註                   |
| ------------ | ------- | ---------------------- |
| 回應         | 已啟用  | 加入回應 + 列出回應    |
| 訊息         | 已啟用  | 讀取／傳送／編輯／刪除 |
| 釘選         | 已啟用  | 釘選／取消釘選／列出   |
| 成員資訊     | 已啟用  | 成員資訊               |
| 表情符號清單 | 已啟用  | 自訂表情符號清單       |

### Mattermost

Mattermost 會安裝為獨立外掛，方式與 Discord、Slack 和 WhatsApp 相同：

```bash
openclaw plugins install @openclaw/mattermost
```

固定版本前，請查看 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) 以確認目前的 dist-tags。

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

聊天模式：`oncall`（收到 @提及時回應，預設）、`onmessage`（每則訊息）、`onchar`（以觸發前綴開頭的訊息）。

啟用 Mattermost 原生命令時：

- `commands.callbackPath` 必須是路徑（例如 `/api/channels/mattermost/command`），而非完整 URL。
- `commands.callbackUrl` 必須解析至 OpenClaw 閘道端點，且 Mattermost 伺服器必須能夠連線。
- 原生斜線命令回呼會使用 Mattermost 在註冊斜線命令時傳回的各命令
  權杖進行驗證。如果註冊失敗或未啟用任何命令，OpenClaw 會拒絕回呼並顯示
  `Unauthorized: invalid command token.`
- 若回呼主機為私人／tailnet／內部主機，Mattermost 可能會要求
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機／網域。
  請使用主機／網域值，而非完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕由 Mattermost 發起的設定寫入。
- `channels.mattermost.requireMention`：要求頻道中必須先有 `@mention` 才回覆。
- `channels.mattermost.groups.<channelId>.requireMention`：各頻道的提及閘控覆寫（使用 `"*"` 作為預設值）。
- 當選用的帳號 ID 與已設定的帳號相符時，可選的 `channels.mattermost.defaultAccount` 會覆寫預設帳號選擇。

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

- `channels.signal.account`：將頻道啟動固定至特定 Signal 帳號身分。
- `channels.signal.configWrites`：允許或拒絕由 Signal 發起的設定寫入。
- 當選用的帳號 ID 與已設定的帳號相符時，可選的 `channels.signal.defaultAccount` 會覆寫預設帳號選擇。

### iMessage

OpenClaw 會啟動 `imsg rpc`（透過標準輸入輸出的 JSON-RPC）。不需要常駐程式或連接埠。若主機可授予「訊息」資料庫和「自動化」權限，這是新 OpenClaw iMessage 設定的建議路徑。

BlueBubbles 支援已移除。`channels.bluebubbles` 在目前的 OpenClaw 中不是受支援的執行階段設定介面。請將舊設定遷移至 `channels.imessage`；簡要說明請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整轉換表請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。

如果閘道未在已登入「訊息」的 Mac 上執行，請保留 `channels.imessage.enabled=true`，並將 `channels.imessage.cliPath` 設定為 SSH 包裝函式，由它在該 Mac 上執行 `imsg "$@"`。預設的本機 `imsg` 路徑僅支援 macOS。

在正式環境傳送中依賴 SSH 包裝函式前，請透過該確切包裝函式驗證一次傳出的 `imsg send`。某些 macOS TCC 狀態會將「訊息」自動化權限指派給 `/usr/libexec/sshd-keygen-wrapper`，這可能導致讀取與探查正常運作，但傳送會因 AppleEvents `-1743` 而失敗；請參閱 [iMessage](/zh-TW/channels/imessage) 上的 SSH 包裝函式疑難排解章節。

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

- 選用的 `channels.imessage.defaultAccount` 在符合已設定的帳號 ID 時，會覆寫預設帳號選擇。
- 需要 Messages 資料庫的「完整磁碟存取權限」。
- 優先使用 `chat_id:<id>` 目標。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可指向 SSH 包裝程式；設定 `remoteHost`（`host` 或 `user@host`）以透過 SCP 擷取附件。
- `attachmentRoots` 與 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格的主機金鑰檢查，因此請確認中繼主機金鑰已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕由 iMessage 發起的設定寫入。
- `channels.imessage.sendTransport`：一般傳出回覆偏好的 `imsg` RPC 傳送傳輸方式。`auto`（預設）會在 IMCore 橋接器執行時對現有聊天使用該橋接器，接著回退至 AppleScript；`bridge` 要求透過私有 API 傳遞；`applescript` 強制使用公開的 Messages 自動化路徑。
- `channels.imessage.actions.*`：啟用同時受 `imsg status` / `openclaw channels status --probe` 限制的私有 API 動作。
- `channels.imessage.includeAttachments` 預設為關閉；若希望代理回合包含傳入媒體，請先將其設為 `true`。
- 橋接器／閘道重新啟動後，系統會自動復原傳入訊息（GUID 去重，加上過期積壓訊息的時間界線）。現有的 `channels.imessage.catchup.enabled: true` 設定仍會作為已棄用的相容性設定檔受到支援；`catchup` 預設為停用。
- `channels.imessage.groups`：群組登錄檔與個別群組設定。使用 `groupPolicy: "allowlist"` 時，請設定明確的 `chat_id` 鍵或 `"*"` 萬用字元項目，讓群組訊息能通過登錄檔閘門。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目，可將 iMessage 對話繫結至持續性 ACP 工作階段。在 `match.peer.id` 中使用正規化識別代碼或明確的聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

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
- `channels.matrix.proxy` 會透過明確的 HTTP(S) Proxy 路由 Matrix HTTP 流量。具名帳號可使用 `channels.matrix.accounts.<id>.proxy` 覆寫此設定。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許私人／內部主伺服器。`proxy` 與此網路選擇加入設定是彼此獨立的控制項。
- `channels.matrix.defaultAccount` 會在多帳號設定中選取偏好的帳號。
- `channels.matrix.autoJoin` 預設為 `"off"`，因此受邀房間與新的類私訊邀請會被忽略，直到你使用 `autoJoinAllowlist` 設定 `autoJoin: "allowlist"`，或設定 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生的執行核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式下，若可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者，就會啟用執行核准。
  - `approvers`：允許核准執行要求的 Matrix 使用者 ID（例如 `@owner:example.org`）。
  - `agentFilter`：選用的代理 ID 允許清單。省略時會轉送所有代理的核准要求。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或規則運算式）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）、`"channel"`（原始房間）或 `"both"`。
  - 個別帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私訊如何分組為工作階段：`per-user`（預設）依路由後的對等端共用，而 `per-room` 則隔離各個私訊房間。
- Matrix 狀態探測與即時目錄查詢，會使用與執行階段流量相同的 Proxy 原則。
- 完整的 Matrix 設定、目標規則與設定範例，記載於 [Matrix](/zh-TW/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由外掛支援，並在 `channels.msteams` 下設定。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、網路鉤子、團隊／頻道原則：
      // 請參閱 /channels/msteams
    },
  },
}
```

- 此處涵蓋的核心鍵路徑：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 設定（認證資訊、網路鉤子、私訊／群組原則、個別團隊／頻道覆寫）記載於 [Microsoft Teams](/zh-TW/channels/msteams)。

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
- 選用的 `channels.irc.defaultAccount` 在符合已設定的帳號 ID 時，會覆寫預設帳號選擇。
- 完整的 IRC 頻道設定（主機／連接埠／TLS／頻道／允許清單／提及閘控）記載於 [IRC](/zh-TW/channels/irc)。

### 多帳號（所有頻道）

每個頻道可執行多個帳號（各自具有自己的 `accountId`）：

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
- 環境變數權杖僅套用至**預設**帳號。
- 基礎頻道設定會套用至所有帳號，除非個別帳號另有覆寫。
- 使用 `bindings[].match.accountId` 將各帳號路由至不同的代理。
- 若你仍使用單帳號的頂層頻道設定，並透過 `openclaw channels add`（或頻道上線設定）新增非預設帳號，OpenClaw 會先將帳號範圍的頂層單帳號值提升至頻道帳號對應表，使原始帳號能繼續運作。大多數頻道會將這些值移至 `channels.<channel>.accounts.default`；Matrix 則可保留現有且相符的具名／預設目標。
- 現有僅限頻道的繫結（沒有 `accountId`）會繼續比對預設帳號；帳號範圍的繫結仍為選用。
- `openclaw doctor --fix` 也會將帳號範圍的頂層單帳號值移至為該頻道選定的提升帳號，以修復混合結構。大多數頻道使用 `accounts.default`；Matrix 則可保留現有且相符的具名／預設目標。

### 其他外掛頻道

許多外掛頻道設定為 `channels.<id>`，並記載於各自的專屬頻道頁面（例如 Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch 與 Zalo）。
請參閱完整的頻道索引：[頻道](/zh-TW/channels)。

### 群組聊天提及閘控

群組訊息預設**需要提及**（中繼資料提及或安全的規則運算式模式）。適用於 WhatsApp、Telegram、Discord、Google Chat 與 iMessage 群組聊天。

可見回覆會獨立控制。一般群組、頻道與內部 WebChat 直接要求預設為自動傳遞最終內容：最終助理文字會透過舊版可見回覆路徑發佈。若可見輸出僅應在代理呼叫 `message(action=send)` 後發佈，請選擇加入 `messages.visibleReplies: "message_tool"` 或 `messages.groupChat.visibleReplies: "message_tool"`。在已選擇加入的僅工具模式中，若模型未呼叫訊息工具便傳回實質性的最終答案，該最終文字會保持私密，閘道詳細記錄會記錄受抑制的承載資料中繼資料，而 OpenClaw 會將一次復原重試排入佇列，要求模型透過 `message(action=send)` 傳遞相同回覆。

僅工具可見回覆需要能可靠呼叫工具的模型／執行階段，並建議在共用的環境式房間中搭配最新一代模型使用，例如 GPT-5.6 Sol。某些較弱的模型能以最終文字作答，卻無法理解來源可見輸出必須透過 `message(action=send)` 傳送。僅當最終內容具有實質內容、來源回合不是房間事件、傳送原則未拒絕傳遞，且尚未傳送來源回覆時，OpenClaw 才會預設復原常見的最終內容擱置情況。復原限制為一次重試；它會抑制合成重試提示的持久化，並使該重試不進入收集批次，以免與不相關的佇列提示合併。若重試仍然擱置或無法排入佇列，OpenClaw 只會傳遞經清理的診斷訊息，例如 “我已產生回覆，但無法將其傳遞至此聊天。請再試一次。”。原始私密最終文字絕不會標記為自動傳遞至來源。對於反覆擱置回覆的模型，請使用 `"automatic"`，讓最終助理回合成為可見回覆路徑；切換至工具呼叫能力更強的模型；在閘道詳細記錄中檢查受抑制的承載資料摘要；或設定 `messages.groupChat.visibleReplies: "automatic"`，對每個群組／頻道要求使用可見的最終回覆。

若使用中的工具原則不提供訊息工具，OpenClaw 會回退至自動可見回覆，而非無聲地抑制回應。`openclaw doctor` 會對此不相符情況發出警告。

此規則適用於一般代理最終文字。外掛擁有的對話繫結，會將所屬外掛傳回的回覆作為已宣告繫結討論串回合的可見回應；該外掛不需要為這些繫結回覆呼叫 `message(action=send)`。

**疑難排解：群組 @提及觸發輸入狀態後便無回應（沒有錯誤）**

症狀：群組／頻道中的 @提及會顯示輸入指示器，且閘道記錄回報 `dispatch complete (queuedFinal=false, replies=0)`，但房間中沒有收到任何訊息。傳送給同一代理的私訊則會正常回覆。

原因：群組／頻道的可見回覆模式解析為 `"message_tool"`，因此 OpenClaw 會執行該回合，但除非代理呼叫 `message(action=send)`，否則會抑制最終助理文字。此模式沒有 `NO_REPLY` 合約；未呼叫訊息工具即表示原始最終文字為私密內容。對於具有實質內容的來源回合，OpenClaw 現在會嘗試一次受保護的復原重試；簡短附註、明確要求保持沉默、房間事件、遭傳送原則拒絕的回合，以及已傳遞的回合都不會重試。一般群組與頻道回合預設為 `"automatic"`，因此只有明確將 `messages.groupChat.visibleReplies`（或全域 `messages.visibleReplies`）設為 `"message_tool"` 時，才會出現此症狀。測試框架的 `defaultVisibleReplies` 不適用於此處——群組／頻道解析器會忽略它；它只影響直接／來源聊天（Codex 測試框架會以這種方式抑制直接聊天的最終內容）。

修正方式：選擇工具呼叫能力更強的模型、移除明確的 `"message_tool"` 覆寫以回退至 `"automatic"` 預設值，或設定 `messages.groupChat.visibleReplies: "automatic"`，強制每個群組／頻道請求都產生可見回覆。有實質內容但未送達的最終回覆不應再以靜默成功結束；它應透過一次 `message(action=send)` 重試來恢復，或顯示經過清理的傳送失敗診斷。儲存檔案後，閘道會熱重新載入 `messages` 設定；只有在部署中停用檔案監看或設定重新載入時，才需要重新啟動閘道。

**提及類型：**

- **中繼資料提及**：平台原生的 @ 提及。在 WhatsApp 自我聊天模式中會忽略。
- **文字模式**：`agents.list[].groupChat.mentionPatterns` 中的安全規則運算式模式。無效模式和不安全的巢狀重複會被忽略。
- 只有在可以偵測提及時（原生提及或至少一個模式），才會強制執行提及閘控。

```json5
{
  messages: {
    visibleReplies: "automatic", // 對直接／來源聊天強制使用舊版自動最終回覆
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // 永遠開啟且未提及的聊天室閒聊會成為安靜的上下文
      visibleReplies: "message_tool", // 選擇啟用；可見的聊天室回覆必須使用 message(action=send)
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 設定全域預設值。頻道可以使用 `channels.<channel>.historyLimit`（或個別帳號設定）覆寫。設為 `0` 即可停用。

`messages.groupChat.unmentionedInbound: "room_event"` 會在支援的頻道上，將永遠開啟但未提及的群組／頻道訊息以安靜的聊天室上下文提交。含提及的訊息、命令及直接訊息仍會視為使用者請求。完整的 Discord、Slack 和 Telegram 範例請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

`messages.visibleReplies` 是全域來源事件預設值；`messages.groupChat.visibleReplies` 會針對群組／頻道來源事件覆寫該值。未設定 `messages.visibleReplies` 時，直接／來源聊天會使用所選執行階段或測試框架的預設值，但內部 WebChat 直接回合會使用自動最終傳送，以維持 Pi/Codex 提示詞一致性。設定 `messages.visibleReplies: "message_tool"` 可刻意要求可見輸出必須使用 `message(action=send)`。頻道允許清單和提及閘控仍會決定是否處理事件。

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

解析順序：個別私訊覆寫 → 提供者預設值 → 無限制（全部保留）。

此解析器會為工作階段金鑰符合標準 `provider:direct:<id>`（或舊版 `provider:dm:<id>`）格式的任何頻道讀取 `channels.<provider>.dmHistoryLimit` 和 `channels.<provider>.dms.<id>.historyLimit`，因此同樣適用於內建與外掛頻道，而不僅限於固定清單。

#### 自我聊天模式

將你自己的號碼加入 `allowFrom` 以啟用自我聊天模式（忽略原生 @ 提及，只回應文字模式）：

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
    native: "auto", // 在支援時註冊原生命令
    nativeSkills: "auto", // 在支援時註冊原生 skill 命令
    text: true, // 解析聊天訊息中的 /commands
    bash: false, // 允許 !（別名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允許 /config
    mcp: false, // 允許 /mcp
    plugins: false, // 允許 /plugins
    debug: false, // 允許 /debug
    restart: true, // 允許 /restart + 閘道重新啟動工具
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

- 此區塊設定命令介面。如需目前的內建與隨附命令目錄，請參閱[斜線命令](/zh-TW/tools/slash-commands)。
- 本頁是**設定鍵參考**，不是完整的命令目錄。頻道／外掛所擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶 `/dreaming`、電話控制 `/phone` 及 Talk `/voice`，均記錄於各自的頻道／外掛頁面和[斜線命令](/zh-TW/tools/slash-commands)中。
- 文字命令必須是以 `/` 開頭的**獨立**訊息。
- `native: "auto"` 會為 Discord/Telegram 開啟原生命令，Slack 則保持關閉。
- `nativeSkills: "auto"` 會為 Discord/Telegram 開啟原生 skill 命令，Slack 則保持關閉。
- 依頻道覆寫：`channels.discord.commands.native`（布林值或 `"auto"`）。對 Discord 而言，`false` 會在啟動期間略過原生命令的註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills` 依頻道覆寫原生 skill 註冊。
- `channels.telegram.customCommands` 會新增額外的 Telegram 機器人選單項目。
- `bash: true` 會為主機殼層啟用 `! <cmd>`。需要啟用 `tools.elevated.enabled`，且傳送者必須位於 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 會啟用 `/config`（讀取／寫入 `openclaw.json`）。對閘道 `chat.send` 用戶端而言，持續性 `/config set|unset` 寫入還需要 `operator.admin`；唯讀的 `/config show` 仍可供一般具有寫入範圍的操作員用戶端使用。
- `mcp: true` 會為 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會啟用 `/plugins`，用於外掛探索、安裝及啟用／停用控制。
- `channels.<provider>.configWrites` 會依頻道閘控設定變更（預設值：true）。
- 對多帳號頻道而言，`channels.<provider>.accounts.<id>.configWrites` 也會閘控以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 和閘道重新啟動工具動作。預設值：`true`。
- `ownerAllowFrom` 是僅限擁有者命令與受擁有者閘控之頻道動作的明確擁有者允許清單。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示詞中對擁有者 ID 進行雜湊。設定 `ownerDisplaySecret` 以控制雜湊。
- `allowFrom` 依提供者設定。設定後，它會成為**唯一**的授權來源（頻道允許清單／配對及 `useAccessGroups` 均會被忽略）。
- 未設定 `allowFrom` 時，`useAccessGroups: false` 允許命令略過存取群組原則。
- 命令文件對照：
  - 內建與隨附目錄：[斜線命令](/zh-TW/tools/slash-commands)
  - 頻道特定命令介面：[頻道](/zh-TW/channels)
  - QQ Bot 命令：[QQ Bot](/zh-TW/channels/qqbot)
  - 配對命令：[配對](/zh-TW/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-TW/channels/line)
  - 記憶夢境整理：[夢境整理](/zh-TW/concepts/dreaming)

</Accordion>

---

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference) — 頂層鍵
- [設定 — 代理程式](/zh-TW/gateway/config-agents)
- [頻道概覽](/zh-TW/channels)
