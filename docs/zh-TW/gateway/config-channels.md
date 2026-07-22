---
read_when:
    - 設定頻道外掛（驗證、存取控制、多帳號）
    - 疑難排解各頻道的設定鍵
    - 稽核私訊政策、群組政策或提及門檻控制
summary: 頻道設定：Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等頻道的存取控制、配對與各頻道專用金鑰
title: 設定 — 頻道
x-i18n:
    generated_at: "2026-07-22T10:33:47Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e346648287d275d84a9c082a3bb13edaee751d53546d8231dcf1525bf9adafc2
    source_path: gateway/config-channels.md
    workflow: 16
---

`channels.*` 下的各頻道設定鍵：DM 與群組存取、多帳號設定、提及門檻，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他頻道外掛的各頻道專屬鍵。

關於代理程式、工具、閘道執行階段與其他頂層鍵，請參閱[設定參考](/zh-TW/gateway/configuration-reference)。

## 頻道

每個頻道會在其設定區段存在時自動啟動（除非 `enabled: false`）。Telegram 與 iMessage 隨核心 `openclaw` 套件一起提供。其他官方頻道（Discord、Slack、WhatsApp、Matrix、Microsoft Teams、IRC、Google Chat、Signal、Mattermost 等）則透過 `openclaw plugins install <spec>` 安裝為獨立外掛；如需完整清單與安裝規格，請參閱[頻道](/zh-TW/channels)。

### DM 與群組存取

所有頻道都支援 DM 政策與群組政策：

| DM 政策           | 行為                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（預設） | 未知傳送者會收到一次性配對碼；擁有者必須核准 |
| `allowlist`         | 僅限 `allowFrom` 中的傳送者（或已配對的允許儲存區）             |
| `open`              | 允許所有傳入 DM（需要 `allowFrom: ["*"]`）             |
| `disabled`          | 忽略所有傳入 DM                                          |

| 群組政策          | 行為                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（預設） | 僅限符合所設定允許清單的群組          |
| `open`                | 略過群組允許清單（提及門檻仍適用） |
| `disabled`            | 封鎖所有群組／聊天室訊息                          |

<Note>
當提供者的 `groupPolicy` 未設定時，`channels.defaults.groupPolicy` 會設定預設值。
配對碼會在 1 小時後到期。待處理的配對要求上限為**每個帳號 3 個**（範圍依頻道與帳號 ID 劃分）。
如果提供者區塊完全不存在（缺少 `channels.<provider>`），執行階段群組政策會回退至 `allowlist`（故障時關閉），並顯示啟動警告。
</Note>

### 頻道模型覆寫

使用 `channels.modelByChannel` 將特定頻道 ID 或私訊對象固定至某個模型。值可接受 `provider/model` 或已設定的模型別名。頻道對應僅在工作階段尚無作用中的模型覆寫時套用（例如透過 `/model` 設定的覆寫）。

對於群組／討論串對話，鍵是頻道專屬的群組 ID、主題 ID 或頻道名稱。對於私訊（DM）對話，鍵是衍生自頻道傳送者身分的對等方識別碼（`nativeDirectUserId`、`origin.from`、`origin.to`、`OriginatingTo`、`From` 或 `SenderId`）。確切的鍵格式視頻道而定：

| 頻道  | DM 鍵格式         | 範例                                      |
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

DM 專屬鍵僅在私訊對話中相符；不會影響群組／討論串路由。

### 頻道預設值與心跳偵測

使用 `channels.defaults` 設定各提供者共用的群組政策、隱含提及及心跳偵測行為：

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
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
- `channels.defaults.contextVisibility`：所有頻道的預設補充內容可見性模式。值：`all`（預設，包含所有引用／討論串／歷史內容）、`allowlist`（僅包含來自允許清單中傳送者的內容）、`allowlist_quote`（與允許清單相同，但保留明確引用／回覆內容）。各頻道覆寫：`channels.<channel>.contextVisibility`。
- `channels.defaults.implicitMentions`：控制哪些受支援的傳入事實會視為提及。`replyToBot`、`quotedBot` 和 `threadParticipation` 各自預設為 `true`，以保留目前行為。可使用 `channels.<channel>.implicitMentions` 依頻道覆寫，或使用 `channels.<channel>.accounts.<id>.implicitMentions` 依帳號覆寫；每個旗標都會依「帳號 -> 頻道 -> 預設值」獨立解析。名稱採正向語意：將旗標設為 `false`，即可阻止該事實略過提及門檻。原生明確提及一律允許；若頻道不會產生該事實，旗標便不會產生作用。如需目前的產生者矩陣，請參閱[提及門檻](/zh-TW/channels/groups#mention-gating-default)。這些設定不會變更傳出回覆／討論串模式或已授權命令的處理方式。
- `channels.defaults.heartbeat.showOk`：在心跳偵測輸出中包含健康的頻道狀態（預設 `false`）。
- `channels.defaults.heartbeat.showAlerts`：在心跳偵測輸出中包含降級／錯誤狀態（預設 `true`）。
- `channels.defaults.heartbeat.useIndicator`：以精簡指示器樣式呈現心跳偵測輸出（預設 `true`）。

### WhatsApp

WhatsApp 透過閘道的網頁頻道（Baileys Web）運作。存在已連結的工作階段時，它會自動啟動。

```json5
{
  web: {
    enabled: true,
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為 WhatsApp DM 與群組設定持續性 ACP 繫結。在 `match.peer.id` 中使用 E.164 直撥號碼或 WhatsApp 群組 JID。欄位語意共用於 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

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

- 若帳號 `default` 存在，傳出命令預設使用該帳號；否則使用排序後第一個已設定的帳號 ID。
- 當選用的 `channels.whatsapp.defaultAccount` 符合已設定的帳號 ID 時，可選擇性覆寫上述備援預設帳號選擇。
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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

- 機器人權杖：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），預設帳號則以 `TELEGRAM_BOT_TOKEN` 作為備援。
- `apiRoot` 僅是 Telegram Bot API 根目錄。請使用 `https://api.telegram.org` 或你自架／代理的根目錄，而非 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外附加的 `/bot<TOKEN>` 後綴。
- 對於以 `--local` 模式運作的自架 Bot API 伺服器，`trustedLocalFileRoots` 會列出 OpenClaw 可讀取的主機路徑。請將伺服器資料磁碟區掛載至 OpenClaw 主機，並設定其資料根目錄或各權杖目錄；`/var/lib/telegram-bot-api` 下的容器路徑會對應至這些根目錄。其他絕對路徑仍會遭到拒絕。
- 當選用的 `channels.telegram.defaultAccount` 符合已設定的帳號 ID 時，可覆寫預設帳號選擇。
- 在多帳號設定（2 個以上的帳號 ID）中，請設定明確的預設值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免備援路由；缺少或無效時，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖由 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為論壇主題設定持續性 ACP 繫結（在 `match.peer.id` 中使用標準 `chatId:topic:topicId`）。欄位語意共用於 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
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
              systemPrompt: "Short answers only.",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress（Discord 預設值：progress）
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

- 權杖：`channels.discord.token`，預設帳號則以 `DISCORD_BOT_TOKEN` 作為備援。
- 提供明確 Discord `token` 的直接對外呼叫會對該次呼叫使用該權杖；帳號重試／政策設定仍取自作用中執行階段快照內選定的帳號。
- 選用的 `channels.discord.defaultAccount` 若符合已設定的帳號 ID，便會覆寫預設帳號選擇。
- 傳遞目標請使用 `user:<id>`（DM）或 `channel:<id>`（伺服器頻道）；系統會拒絕純數字 ID。
- 伺服器 slug 使用小寫，並將空格替換為 `-`；頻道鍵使用轉為 slug 的名稱（不含 `#`）。建議使用伺服器 ID。
- 預設會忽略由機器人撰寫的訊息。`allowBots: true` 可啟用這類訊息；使用 `allowBots: "mentions"` 則只接受提及該機器人的機器人訊息（仍會篩除自身訊息）。
- 支援接收機器人所撰寫訊息的頻道，可使用共用的[機器人迴圈防護](/zh-TW/channels/bot-loop-protection)。請設定 `channels.defaults.botLoopProtection` 作為配對預算基準，只有當某個頻道或帳號介面需要不同限制時才個別覆寫。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及頻道覆寫）會捨棄提及其他使用者或角色、但未提及機器人的訊息（不含 @everyone/@here）。
- `channels.discord.mentionAliases` 會在傳送前，將穩定的對外 `@handle` 文字對應至 Discord 使用者 ID，因此即使暫時性目錄快取為空，仍能確定性地提及已知團隊成員。各帳號覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases`。
- `maxLinesPerMessage`（預設為 `17`）即使訊息少於 2000 個字元，也會拆分過長的訊息。
- `channels.discord.suppressEmbeds` 預設為 `true`，因此除非停用，否則對外 URL 不會展開為 Discord 連結預覽。明確的 `embeds` 承載內容仍會正常傳送；每則訊息的工具呼叫可用 `suppressEmbeds` 覆寫。
- `channels.discord.threadBindings` 控制 Discord 執行緒綁定路由：
  - `enabled`：Discord 對執行緒綁定工作階段功能的覆寫（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及綁定的傳遞／路由）
  - `idleHours`：Discord 對閒置自動取消聚焦時數的覆寫（`0` 會停用）
  - `maxAgeHours`：Discord 對硬性最長存續時數的覆寫（`0` 會停用）
  - `spawnSessions`：控制 `sessions_spawn({ thread: true })` 與 ACP 執行緒衍生自動建立／綁定執行緒的開關（預設：`true`）
  - `defaultSpawnContext`：執行緒綁定衍生的原生子代理程式情境（預設為 `"fork"`）
- 包含 `type: "acp"` 的頂層 `bindings[]` 項目，會為頻道與執行緒設定持續性 ACP 綁定（在 `match.peer.id` 中使用頻道／執行緒 ID）。欄位語意共用於 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
- `channels.discord.ui.components.accentColor` 設定 Discord components v2 容器的強調色。
- `channels.discord.agentComponents.ttlMs` 控制已傳送的 Discord 元件回呼維持註冊的時間。預設為 `1800000`（30 分鐘），上限為 `86400000`（24 小時）。各帳號覆寫位於 `channels.discord.accounts.<accountId>.agentComponents.ttlMs`。請優先採用足以符合工作流程的最短 TTL。
- `channels.discord.voice` 啟用 Discord 語音頻道對話，以及選用的自動加入、LLM 與 TTS 覆寫。純文字 Discord 設定預設會關閉語音；設定 `channels.discord.voice.enabled=true` 即可選擇啟用。
- `channels.discord.voice.model` 可選擇性覆寫 Discord 語音頻道回應使用的 LLM 模型。
- `channels.discord.voice.daveEncryption`（預設為 `true`）與 `channels.discord.voice.decryptionFailureTolerance`（預設為 `24`）會傳遞至 `@discordjs/voice` DAVE 選項。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 與自動加入嘗試初始的 `@discordjs/voice` Ready 等待時間（預設為 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制已中斷連線的語音工作階段在 OpenClaw 將其銷毀前，可花費多長時間進入重新連線訊號狀態（預設為 `15000`）。
- Discord 語音播放不會因另一位使用者的開始說話事件而中斷。為避免回授迴圈，OpenClaw 會在 TTS 播放期間忽略新的語音擷取。
- 此外，在重複發生解密失敗後，OpenClaw 會離開並重新加入語音工作階段，嘗試復原語音接收。
- `channels.discord.streaming` 是標準串流模式鍵。Discord 預設為 `streaming.mode: "progress"`，因此工具／工作進度會顯示於同一則持續編輯的預覽訊息中；設定 `streaming.mode: "off"` 可將其停用。舊版扁平鍵（`streamMode`、`chunkMode`、`blockStreaming`、`draftChunk`、`blockStreamingCoalesce`）已不再於執行階段讀取；請執行 `openclaw doctor --fix` 以移轉持久化設定。
- `channels.discord.autoPresence` 將執行階段可用性對應至機器人上線狀態（健康 => online、降級 => idle、耗盡 => dnd），並允許選用的狀態文字覆寫。
- `channels.discord.guilds.<id>.presenceEvents` 會將人員可用性的到達事件，作為代理程式系統事件路由至一個已設定的 Discord 頻道。符合資格的成員必須能檢視 `channelId`；公開執行緒會繼承上層可見性，私人執行緒則還需要成為成員或具備 Manage Threads。`users` 可進一步縮小該受眾範圍。它會從完整的 `GUILD_CREATE` 快照植入目前在線成員、路由觀察到的離線轉在線狀態變更，並將先前未見成員後續的第一個在線訊號視為新近可用，而不判定其是在快照後上線或加入。成員數超過 Discord 75,000 名快照限制的伺服器，必須先有明確的離線更新。節流調整項目：`reconnectSuppressSeconds`（新的閘道工作階段建立後，在重建伺服器上線狀態期間的靜默時窗，預設為 300，`0` 會停用），以及 `burstLimit`/`burstWindowSeconds`（每個伺服器成功排入佇列事件的速率限制，預設為每 60 秒滑動時窗 8 個事件）。恢復的工作階段不會啟動重新連線抑制時窗。現有的每位使用者再次問候冷卻時間仍為八小時。此功能需要 `channels.discord.intents.presence=true`、Discord Developer Portal 中的特殊權限 Presence Intent，以及已啟用的代理程式心跳偵測。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變的名稱／標籤比對（緊急相容模式）。
- `channels.discord.execApprovals`：Discord 原生執行核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式下，若能從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者，便會啟用執行核准。
  - `approvers`：允許核准執行請求的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用的代理程式 ID 允許清單。省略即可轉送所有代理程式的核准。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或規則運算式）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）會傳送至核准者的 DM，`"channel"` 會傳送至來源頻道，`"both"` 則兩者皆傳送。當目標包含 `"channel"` 時，只有解析出的核准者可以使用按鈕。
  - `cleanupAfterResolve`：當為 `true` 時，會在核准、拒絕或逾時後刪除核准 DM。

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
      dmPolicy: "pairing",
      allowFrom: ["users/1234567890"],
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
- `serviceAccount` 可直接接受 SecretRef。
- 環境變數備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`（僅限預設帳號）。
- 傳遞目標請使用 `spaces/<spaceId>` 或 `users/<userId>`。
- `channels.googlechat.dangerouslyAllowNameMatching` 會重新啟用可變的電子郵件主體比對（緊急相容模式）。

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
      streaming: {
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
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

- **Socket 模式**需要同時提供 `botToken` 和 `appToken`（預設帳號的環境變數備援則為 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP 模式**需要 `botToken` 加上 `signingSecret`（位於根層級或各帳號中）。
- **使用者身分**（`identity: "user"`）會以授權者本人的身分發文及讀取。Socket 模式需要 `userToken` 加上 `appToken`，HTTP 模式則需要 `userToken` 加上 `signingSecret`。不需要 Bot 權杖或 Bot 使用者。關於使用者範圍和事件訂閱，請參閱[使用者身分](/zh-TW/channels/slack#user-identity-post-as-a-real-person)。
- `enterpriseOrgInstall: true` 會讓帳號採用 Slack Enterprise Grid
  全組織事件路徑。啟動時會使用 `auth.test` 驗證 Bot 權杖，
  若設定的模式與 Slack 的安裝身分不符，便會失敗。
  Enterprise 私訊必須停用，或使用 `dmPolicy: "open"` 並搭配有效的
  `allowFrom: ["*"]`。頻道和使用者政策必須使用穩定的 Slack ID；
  可變動的名稱和不支援的頻道前綴會導致啟動失敗。V1 僅處理
  直接 Socket 模式或 HTTP `message` 與 `app_mention` 事件，並立即
  回覆；轉送、命令、互動、App Home、回應事件監聽器、
  釘選、動作工具、原生核准、繫結、延後傳送和
  主動傳送均不可用。由監聽器負責的確認、輸入中狀態和
  狀態回應仍可搭配 `reactions:write` 使用；傳入回應
  通知和回應動作工具不可用。關於最低權限資訊清單、
  設定工作流程及完整限制，請參閱
  [Enterprise Grid 全組織安裝](/zh-TW/channels/slack#enterprise-grid-org-wide-installs)。
- `socketMode` 會將 Slack SDK Socket 模式的傳輸調校設定傳遞至公開的 Bolt 接收器 API。僅在調查 ping/pong 逾時或過期 WebSocket 行為時使用。`clientPingTimeout` 預設為 `15000`；只有在已設定時才會傳遞 `serverPingTimeout` 和 `pingPongLoggingEnabled`。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- Slack 帳號快照會公開各認證資訊的來源／狀態欄位，例如
  `botTokenSource`、`botTokenStatus`、`userTokenSource`、`userTokenStatus`、
  `appTokenStatus`，以及 HTTP 模式中的 `signingSecretStatus`。
  `configured_unavailable` 表示帳號已
  透過 SecretRef 設定，但目前的命令／執行階段路徑無法
  解析密鑰值。
- `configWrites: false` 會封鎖由 Slack 發起的設定寫入。
- 選用的 `channels.slack.defaultAccount` 在符合已設定的帳號 ID 時，會覆寫預設帳號選擇。
- `channels.slack.streaming.mode` 是 Slack 串流模式的標準鍵（預設為 `"partial"`）。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生串流傳輸（預設為 `true`）。舊版 `streamMode`、布林值 `streaming`、`chunkMode`、`blockStreaming`、`blockStreamingCoalesce` 和 `nativeStreaming` 值已不再於執行階段讀取；請執行 `openclaw doctor --fix`，將持久化設定遷移至 `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`。
- `unfurlLinks` 和 `unfurlMedia` 會為 Bot 回覆傳遞 Slack 的 `chat.postMessage` 連結與媒體展開布林值。`unfurlLinks` 預設為 `false`，因此除非啟用，否則傳出的 Bot 連結不會在行內展開；除非已設定，否則會省略 `unfurlMedia`。若要為單一帳號覆寫頂層值，請在 `channels.slack.accounts.<accountId>` 設定任一值。
- 傳送目標請使用 `user:<id>`（私訊）或 `channel:<id>`。

**回應通知模式：**`off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

**討論串工作階段隔離：**`thread.historyScope` 可設為每個討論串一個工作階段（預設），或在整個頻道共用。`thread.inheritParent` 會將父頻道逐字記錄複製到新討論串。`thread.initialHistoryLimit`（預設為 `20`）限制新討論串工作階段開始時擷取的既有討論串訊息數量；`0` 會停用討論串歷史記錄擷取。

- Slack 原生串流和 Slack 助理樣式的「正在輸入……」討論串狀態需要以回覆討論串為目標。頂層私訊預設不進入討論串，因此仍可透過 Slack 的草稿發文與編輯預覽進行串流，而不顯示討論串樣式的原生串流／狀態預覽。
- `typingReaction` 會在回覆執行期間，對傳入的 Slack 訊息新增暫時回應，完成後再將其移除。請使用 Slack 表情符號短碼，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生核准用戶端傳送及執行核准者授權。結構描述與 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 使用者 ID）、`agentFilter`、`sessionFilter`，以及 `target`（`"dm"`、`"channel"` 或 `"both"`）。當 Slack 外掛核准者可解析時，外掛核准可對源自 Slack 的要求使用此原生用戶端路徑；也可透過 `approvals.plugin`，為源自 Slack 的工作階段或 Slack 目標啟用 Slack 原生外掛核准傳送。外掛核准使用 `allowFrom` 中的 Slack 外掛核准者和預設路由，而非執行核准者。

| 動作群組 | 預設值 | 備註                   |
| ------------ | ------- | ---------------------- |
| reactions    | 已啟用 | 新增回應 + 列出回應 |
| messages     | 已啟用 | 讀取／傳送／編輯／刪除 |
| pins         | 已啟用 | 釘選／取消釘選／列出 |
| memberInfo   | 已啟用 | 成員資訊             |
| emojiList    | 已啟用 | 自訂表情符號清單     |

### Mattermost

Mattermost 會安裝為獨立外掛，方式與 Discord、Slack 和 WhatsApp 相同：

```bash
openclaw plugins install @openclaw/mattermost
```

固定版本前，請先查看 [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) 目前的 dist-tags。

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
      streaming: { chunkMode: "length" },
    },
  },
}
```

聊天模式：`oncall`（被 @ 提及時回覆，預設）、`onmessage`（每則訊息）、`onchar`（以觸發前綴開頭的訊息）。

啟用 Mattermost 原生命令時：

- `commands.callbackPath` 必須是路徑（例如 `/api/channels/mattermost/command`），而非完整 URL。
- `commands.callbackUrl` 必須解析至 OpenClaw 閘道端點，且 Mattermost 伺服器必須能夠連線。
- 原生斜線命令回呼會使用 Mattermost 在斜線命令註冊期間傳回的
  各命令權杖進行驗證。若註冊失敗或未啟用任何
  命令，OpenClaw 會以
  `Unauthorized: invalid command token.` 拒絕回呼
- 對於私有／tailnet／內部回呼主機，Mattermost 可能要求
  `ServiceSettings.AllowedUntrustedInternalConnections` 包含回呼主機／網域。
  請使用主機／網域值，而非完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕由 Mattermost 發起的設定寫入。
- `channels.mattermost.requireMention`：在頻道中回覆前要求 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：各頻道的提及閘控覆寫（預設使用 `"*"`）。
- 選用的 `channels.mattermost.defaultAccount` 在符合已設定的帳號 ID 時，會覆寫預設帳號選擇。

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

**回應通知模式：**`off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

- `channels.signal.account`：將頻道啟動固定至特定 Signal 帳號身分。
- `channels.signal.configWrites`：允許或拒絕由 Signal 發起的設定寫入。
- 選用的 `channels.signal.defaultAccount` 在符合已設定的帳號 ID 時，會覆寫預設帳號選擇。

### iMessage

OpenClaw 會產生 `imsg rpc`（透過 stdio 使用 JSON-RPC）。不需要常駐程式或連接埠。當主機能授予「訊息」資料庫和「自動化」權限時，這是新 OpenClaw iMessage 設定的建議方式。

BlueBubbles 支援已移除。`channels.bluebubbles` 在目前的 OpenClaw 中不是受支援的執行階段設定介面。請將舊設定遷移至 `channels.imessage`；簡短說明請參閱 [BlueBubbles 移除與 imsg iMessage 路徑](/zh-TW/announcements/bluebubbles-imessage)，完整轉換表請參閱[從 BlueBubbles 遷移](/zh-TW/channels/imessage-from-bluebubbles)。

如果閘道不是在已登入「訊息」的 Mac 上執行，請保留 `channels.imessage.enabled=true`，並將 `channels.imessage.cliPath` 設為 SSH 包裝程式，以便在該 Mac 上執行 `imsg "$@"`。預設的本機 `imsg` 路徑僅適用於 macOS。

在依賴 SSH 包裝器進行正式環境傳送之前，請透過該確切包裝器驗證一次對外 `imsg send`。部分 macOS TCC 狀態會將 Messages 自動化權限指派給 `/usr/libexec/sshd-keygen-wrapper`，這可能導致讀取和探測正常運作，但傳送會因 AppleEvents `-1743` 而失敗；請參閱 [iMessage](/zh-TW/channels/imessage) 上的 SSH 包裝器疑難排解章節。

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
- `cliPath` 可指向 SSH 包裝器；設定 `remoteHost`（`host` 或 `user@host`）以透過 SCP 擷取附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格的主機金鑰檢查，因此請確保中繼主機金鑰已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕由 iMessage 發起的設定寫入。
- `channels.imessage.sendTransport`：一般對外回覆偏好使用的 `imsg` RPC 傳送傳輸方式。`auto`（預設）會在 IMCore 橋接器執行時用於現有聊天，接著退回使用 AppleScript；`bridge` 要求透過私有 API 傳送；`applescript` 強制使用公開的 Messages 自動化路徑。
- `channels.imessage.actions.*`：啟用同時受 `imsg status` / `openclaw channels status --probe` 控制的私有 API 動作。
- `channels.imessage.includeAttachments` 預設關閉；若要讓代理程式回合接收傳入媒體，請先將其設為 `true`。
- 橋接器／閘道重新啟動後會自動復原傳入內容（GUID 去重加上過時待處理訊息的時間限制）。現有的 `channels.imessage.catchup.enabled: true` 設定仍會作為已棄用的相容性設定檔受到支援；`catchup` 預設停用。
- `channels.imessage.groups`：群組登錄與各群組設定。使用 `groupPolicy: "allowlist"` 時，請設定明確的 `chat_id` 鍵或 `"*"` 萬用字元項目，讓群組訊息可以通過登錄閘門。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目，可將 iMessage 對話繫結至持久 ACP 工作階段。在 `match.peer.id` 中使用正規化控點或明確的聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包裝器範例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由外掛提供支援，並在 `channels.matrix` 下設定。

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
- `channels.matrix.proxy` 會透過明確的 HTTP(S) Proxy 路由 Matrix HTTP 流量。具名帳號可以使用 `channels.matrix.accounts.<id>.proxy` 覆寫此設定。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許私人／內部主伺服器。`proxy` 與此網路選擇加入設定是相互獨立的控制項。
- `channels.matrix.defaultAccount` 會選取多帳號設定中的偏好帳號。
- `channels.matrix.autoJoin` 預設為 `"off"`，因此受邀加入的房間與新的私訊型邀請會被忽略，直到你使用 `autoJoinAllowlist` 或 `autoJoin: "always"` 設定 `autoJoin: "allowlist"`。
- `channels.matrix.execApprovals`：Matrix 原生的執行核准傳送與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析出核准者時，執行核准功能會啟用。
  - `approvers`：獲准核准執行要求的 Matrix 使用者 ID（例如 `@owner:example.org`）。
  - `agentFilter`：選用的代理程式 ID 允許清單。省略即可轉送所有代理程式的核准要求。
  - `sessionFilter`：選用的工作階段金鑰模式（子字串或規則運算式）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）、`"channel"`（發起要求的房間）或 `"both"`。
  - 各帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix 私訊如何分組至工作階段：`per-user`（預設）依路由後的對等端共用，而 `per-room` 則隔離每個私訊房間。
- Matrix 狀態探測與即時目錄查詢使用和執行階段流量相同的 Proxy 原則。
- 完整的 Matrix 設定、目標規則和設定範例記載於 [Matrix](/zh-TW/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由外掛提供支援，並在 `channels.msteams` 下設定。

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId、appPassword、tenantId、webhook、團隊／頻道原則：
      // 請參閱 /channels/msteams
    },
  },
}
```

- 此處涵蓋的核心鍵路徑：`channels.msteams`、`channels.msteams.configWrites`。
- 完整的 Teams 設定（認證資訊、網路鉤子、私訊／群組原則、各團隊／各頻道覆寫）記載於 [Microsoft Teams](/zh-TW/channels/msteams)。

### IRC

IRC 由外掛提供支援，並在 `channels.irc` 下設定。

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
- 完整的 IRC 頻道設定（主機／連接埠／TLS／頻道／允許清單／提及閘門）記載於 [IRC](/zh-TW/channels/irc)。

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

- 省略 `accountId` 時，會使用 `default`（命令列介面 + 路由）。
- 環境權杖僅套用至**預設**帳號。
- 基礎頻道設定會套用至所有帳號，除非個別帳號另有覆寫。
- 使用 `bindings[].match.accountId` 將各帳號路由至不同的代理程式。
- 如果你仍使用單一帳號的頂層頻道設定，並透過 `openclaw channels add`（或頻道新手設定）新增非預設帳號，OpenClaw 會先將帳號範圍的頂層單一帳號值提升至頻道帳號對應表中，讓原始帳號可繼續運作。大多數頻道會將這些值移入 `channels.<channel>.accounts.default`；Matrix 則可改為保留現有相符的具名／預設目標。
- 現有僅限頻道的繫結（沒有 `accountId`）會繼續符合預設帳號；帳號範圍的繫結仍為選用。
- `openclaw doctor --fix` 也會修復混合結構，將帳號範圍的頂層單一帳號值移入為該頻道選擇的提升帳號。大多數頻道使用 `accounts.default`；Matrix 則可改為保留現有相符的具名／預設目標。

### 其他外掛頻道

許多外掛頻道會設定為 `channels.<id>`，並記載於其專屬頻道頁面中（例如 Feishu、LINE、Nextcloud Talk、Nostr、QQ Bot、Synology Chat、Twitch 和 Zalo）。
請參閱完整頻道索引：[頻道](/zh-TW/channels)。

### 群組聊天提及閘門

群組訊息預設為**必須提及**（中繼資料提及或安全的規則運算式模式）。適用於 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群組聊天。

可見回覆由另一套設定控制。一般群組、頻道和內部 WebChat 直接要求預設會自動傳送最終結果：最終助理文字會透過舊版可見回覆路徑發布。當模型撰寫的來源回覆僅應在代理程式呼叫 `message(action=send)` 後發布時，請選擇加入 `messages.visibleReplies: "message_tool"` 或 `messages.groupChat.visibleReplies: "message_tool"`。如果在已選擇加入的僅工具模式中，模型未呼叫訊息工具便傳回具實質內容的最終答案，該最終文字會保持私密，閘道詳細記錄會記錄被抑制的承載內容中繼資料，且 OpenClaw 會排入一次復原重試，要求模型透過 `message(action=send)` 傳送相同回覆。

僅工具原則規範助理來源回覆與一般工具媒體。它不會抑制執行階段擁有的終端輸出，例如已授權的命令回應、持久完成通知，或擁有該內容的測試框架明確分類為主機擁有的提供者原生成品。主機擁有的成品會透過一般頻道分派路徑傳送，且仍遵循對外 `sendPolicy` 拒絕設定。環境式 `room_event` 回合除非是明確命令，否則會保持安靜，即使執行階段輸出標示為主機擁有亦然。

僅工具可見回覆需要能可靠呼叫工具的模型／執行階段，並建議在使用 GPT-5.6 Sol 等最新世代模型的共用環境式房間中採用。部分較弱的模型能以最終文字作答，卻無法理解來源可見的輸出必須使用 `message(action=send)` 傳送。OpenClaw 預設僅在最終內容具實質意義、來源回合並非房間事件、傳送原則未拒絕傳送，且尚未傳送任何來源回覆時，才會復原常見的擱置最終回覆情況。復原僅限重試一次；它會抑制合成重試提示的持久化，並將該重試排除在彙集批次之外，以免與不相關的排隊提示合併。如果重試也被擱置或無法排入佇列，OpenClaw 只會傳送經清理的診斷訊息，例如“I generated a reply but could not deliver it to this chat. Please try again.”原始的私密最終文字絕不會標記為自動傳送至來源。對於反覆擱置回覆的模型，請使用 `"automatic"`，讓最終助理回合成為可見回覆路徑；切換至工具呼叫能力較強的模型；檢查閘道詳細記錄中的被抑制承載內容摘要；或設定 `messages.groupChat.visibleReplies: "automatic"`，讓每個群組／頻道要求都使用可見的最終回覆。

如果在目前的工具政策下無法使用訊息工具，OpenClaw 會改用自動顯示回覆，而不是無聲地抑制回應。`openclaw doctor` 會針對此不一致發出警告。

此規則適用於一般代理最終文字。由外掛擁有的對話繫結，會在已宣告的繫結討論串回合中，將擁有者外掛傳回的回覆作為可見回應；外掛不需要為這些繫結回覆呼叫 `message(action=send)`。

**疑難排解：群組 @提及觸發輸入中狀態後便無聲無息（無錯誤）**

症狀：群組／頻道中的 @提及會顯示輸入中指示器，且閘道記錄會回報 `dispatch complete (queuedFinal=false, replies=0)`，但聊天室中沒有出現任何訊息。傳送給同一代理的私訊則會正常回覆。

原因：群組／頻道的可見回覆模式解析為 `"message_tool"`，因此 OpenClaw 會執行該回合，但除非代理呼叫 `message(action=send)`，否則會抑制最終助理文字。此模式沒有 `NO_REPLY` 契約；未呼叫訊息工具，代表原始最終文字是私密的。對於有實質內容的來源回合，OpenClaw 現在會嘗試一次受保護的復原重試；簡短附註、明確要求保持安靜、聊天室事件、傳送政策拒絕的回合，以及已送達的回合，都不會重試。一般群組與頻道回合預設為 `"automatic"`，因此只有在明確將 `messages.groupChat.visibleReplies`（或全域 `messages.visibleReplies`）設為 `"message_tool"` 時，才會出現此症狀。測試框架的 `defaultVisibleReplies` 不適用於此處——群組／頻道解析器會忽略它；它只會影響直接／來源聊天（Codex 測試框架會以此方式抑制直接聊天的最終文字）。

修正方式：選用工具呼叫能力更強的模型、移除明確的 `"message_tool"` 覆寫以回復使用 `"automatic"` 預設值，或設定 `messages.groupChat.visibleReplies: "automatic"`，強制每個群組／頻道請求都顯示回覆。有實質內容但未送達的最終文字不應再以無聲成功結束；它應透過一次 `message(action=send)` 重試復原，或顯示經過清理的送達失敗診斷。儲存檔案後，閘道會熱重新載入 `messages` 設定；只有在部署中停用檔案監看或設定重新載入時，才需要重新啟動閘道。

**提及類型：**

- **中繼資料提及**：平台原生的 @提及。在 WhatsApp 自我聊天模式中會忽略。
- **文字模式**：`agents.entries.*.groupChat.mentionPatterns` 中的安全規則運算式模式。無效模式與不安全的巢狀重複會被忽略。
- 只有在能夠偵測時（原生提及或至少一個模式），才會強制執行提及閘控。

```json5
{
  messages: {
    visibleReplies: "automatic", // 強制直接／來源聊天使用舊版自動最終回覆
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // 持續接收的未提及聊天室對話會成為安靜的情境
      visibleReplies: "message_tool", // 選用；可見的聊天室回覆必須使用 message(action=send)
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` 設定全域預設值。頻道可以使用 `channels.<channel>.historyLimit`（或每個帳號的設定）覆寫。設為 `0` 即可停用。

`messages.groupChat.unmentionedInbound: "room_event"` 會在支援的頻道上，將持續接收但未提及的群組／頻道訊息作為安靜的聊天室情境提交。已提及的訊息、命令與直接訊息仍屬於使用者請求。如需完整的 Discord、Slack 與 Telegram 範例，請參閱[環境聊天室事件](/zh-TW/channels/ambient-room-events)。

`messages.visibleReplies` 是全域來源事件預設值；`messages.groupChat.visibleReplies` 會針對群組／頻道來源事件覆寫它。未設定 `messages.visibleReplies` 時，直接／來源聊天會使用所選執行階段或測試框架的預設值，但內部 WebChat 直接回合會自動送達最終內容，以維持 Pi／Codex 提示詞的一致性。設定 `messages.visibleReplies: "message_tool"`，可刻意要求必須使用 `message(action=send)` 才能產生可見輸出。頻道允許清單與提及閘控仍會決定是否處理事件。

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

解析順序：每則私訊的覆寫 → 提供者預設值 → 無限制（全部保留）。

此解析器會針對工作階段金鑰符合標準 `provider:direct:<id>`（或舊版 `provider:dm:<id>`）格式的任何頻道，讀取 `channels.<provider>.dmHistoryLimit` 與 `channels.<provider>.dms.<id>.historyLimit`，因此它同樣適用於內建與外掛頻道，而不僅限於固定清單。

#### 自我聊天模式

在 `allowFrom` 中加入你自己的號碼，即可啟用自我聊天模式（忽略原生 @提及，只回應文字模式）：

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
    native: "auto", // 支援時註冊原生命令
    nativeSkills: "auto", // 支援時註冊原生 Skills 命令
    text: true, // 解析聊天訊息中的 /commands
    bash: false, // 允許 !（別名：/bash）
    bashForegroundMs: 2000,
    config: false, // 允許 /config
    mcp: false, // 允許 /mcp
    plugins: false, // 允許 /plugins
    debug: false, // 允許 /debug
    restart: true, // 允許 /restart 與外部 SIGUSR1 重新啟動請求
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

- 此區塊用於設定命令介面。如需目前的內建與隨附命令目錄，請參閱[斜線命令](/zh-TW/tools/slash-commands)。
- 此頁是**設定鍵參考**，不是完整的命令目錄。頻道／外掛擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶 `/dreaming`、電話控制 `/phone` 與 Talk `/voice`，記載於各自的頻道／外掛頁面及[斜線命令](/zh-TW/tools/slash-commands)。
- 文字命令必須是以 `/` 開頭的**獨立**訊息。
- `native: "auto"` 會為 Discord／Telegram 啟用原生命令，Slack 則保持停用。
- `nativeSkills: "auto"` 會為 Discord／Telegram 啟用原生 Skills 命令，Slack 則保持停用。
- 每個頻道可使用 `channels.discord.commands.native`（布林值或 `"auto"`）覆寫。對於 Discord，`false` 會在啟動期間略過原生命令註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills`，可依頻道覆寫原生 Skills 註冊。
- `channels.telegram.customCommands` 會新增額外的 Telegram 機器人選單項目。
- `bash: true` 會為主機殼層啟用 `! <cmd>`。需要 `tools.elevated.enabled`，且傳送者必須位於 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 會啟用 `/config`（讀取／寫入 `openclaw.json`）。對於閘道 `chat.send` 用戶端，持久化 `/config set|unset` 寫入還需要 `operator.admin`；唯讀 `/config show` 仍可供具有一般寫入範圍的操作員用戶端使用。
- `mcp: true` 會為 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會啟用 `/plugins`，用於外掛探索、安裝，以及啟用／停用控制。
- `channels.<provider>.configWrites` 會依頻道控管設定變更（預設值：true）。
- 對於多帳號頻道，`channels.<provider>.accounts.<id>.configWrites` 也會控管以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 與外部 `SIGUSR1` 重新啟動請求。預設值：`true`。
- `ownerAllowFrom` 是僅限擁有者命令與擁有者閘控頻道動作的明確擁有者允許清單。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示詞中雜湊擁有者 ID。設定 `ownerDisplaySecret` 可控制雜湊。
- `allowFrom` 依提供者設定。設定後，它會成為**唯一**的授權來源（忽略頻道允許清單／配對與 `useAccessGroups`）。
- 未設定 `allowFrom` 時，`useAccessGroups: false` 允許命令略過存取群組政策。
- 命令文件索引：
  - 內建與隨附命令目錄：[斜線命令](/zh-TW/tools/slash-commands)
  - 頻道專屬命令介面：[頻道](/zh-TW/channels)
  - QQ Bot 命令：[QQ Bot](/zh-TW/channels/qqbot)
  - 配對命令：[配對](/zh-TW/channels/pairing)
  - LINE 卡片命令：[LINE](/zh-TW/channels/line)
  - 記憶夢境整理：[夢境整理](/zh-TW/concepts/dreaming)

</Accordion>

---

## 相關內容

- [設定參考](/zh-TW/gateway/configuration-reference) — 頂層鍵
- [設定 — 代理](/zh-TW/gateway/config-agents)
- [頻道概覽](/zh-TW/channels)
