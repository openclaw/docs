---
read_when:
    - 設定頻道 Plugin（身分驗證、存取控制、多帳號）
    - 疑難排解各通道設定鍵
    - 稽核私訊政策、群組政策或提及閘控
summary: 通道設定：涵蓋 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 等的存取控制、配對與每個通道的金鑰
title: 設定 — 頻道
x-i18n:
    generated_at: "2026-05-04T02:44:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 57dcc0b5148324ea6fdee51b7b6e97ec7bd7dc3ca89518ab0816fe4172feefbc
    source_path: gateway/config-channels.md
    workflow: 16
---

每個通道的設定鍵位於 `channels.*` 底下。涵蓋 DM 與群組存取、多帳號設定、提及閘控，以及 Slack、Discord、Telegram、WhatsApp、Matrix、iMessage 和其他內建通道 Plugin 的每通道鍵。

若要設定代理、工具、Gateway 執行階段與其他頂層鍵，請參閱
[設定參考](/zh-TW/gateway/configuration-reference)。

## 通道

每個通道都會在其設定區段存在時自動啟動（除非 `enabled: false`）。

### DM 與群組存取

所有通道都支援 DM 政策與群組政策：

| DM 政策            | 行為                                                            |
| ------------------- | --------------------------------------------------------------- |
| `pairing`（預設）  | 未知寄件者會取得一次性配對碼；擁有者必須核准                    |
| `allowlist`         | 僅允許 `allowFrom`（或已配對允許儲存區）中的寄件者              |
| `open`              | 允許所有傳入 DM（需要 `allowFrom: ["*"]`）                      |
| `disabled`          | 忽略所有傳入 DM                                                 |

| 群組政策              | 行為                                                   |
| --------------------- | ------------------------------------------------------ |
| `allowlist`（預設）  | 僅允許符合已設定允許清單的群組                         |
| `open`                | 略過群組允許清單（提及閘控仍會套用）                   |
| `disabled`            | 封鎖所有群組/聊天室訊息                                |

<Note>
`channels.defaults.groupPolicy` 會在提供者的 `groupPolicy` 未設定時指定預設值。
配對碼會在 1 小時後過期。待處理的 DM 配對請求上限為**每個通道 3 個**。
如果提供者區塊完全缺失（沒有 `channels.<provider>`），執行階段群組政策會回退到 `allowlist`（失敗關閉），並在啟動時發出警告。
</Note>

### 通道模型覆寫

使用 `channels.modelByChannel` 將特定通道 ID 固定到某個模型。值可接受 `provider/model` 或已設定的模型別名。當工作階段尚未有模型覆寫時（例如透過 `/model` 設定），會套用通道對應。

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

### 通道預設值與 Heartbeat

使用 `channels.defaults` 設定跨提供者共用的群組政策與 Heartbeat 行為：

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
- `channels.defaults.contextVisibility`：所有通道的預設補充上下文可見性模式。值：`all`（預設，包含所有引用/討論串/歷史上下文）、`allowlist`（僅包含允許清單寄件者的上下文）、`allowlist_quote`（與 allowlist 相同，但保留明確的引用/回覆上下文）。每通道覆寫：`channels.<channel>.contextVisibility`。
- `channels.defaults.heartbeat.showOk`：在 Heartbeat 輸出中包含健康的通道狀態。
- `channels.defaults.heartbeat.showAlerts`：在 Heartbeat 輸出中包含降級/錯誤狀態。
- `channels.defaults.heartbeat.useIndicator`：呈現精簡指示器樣式的 Heartbeat 輸出。

### WhatsApp

WhatsApp 透過 Gateway 的 Web 通道（Baileys Web）執行。當已連結的工作階段存在時會自動啟動。

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

- 若存在 `default`，傳出命令預設使用帳號 `default`；否則使用第一個已設定的帳號 ID（排序後）。
- 選用的 `channels.whatsapp.defaultAccount` 會在符合已設定帳號 ID 時覆寫該後援預設帳號選擇。
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

- Bot 權杖：`channels.telegram.botToken` 或 `channels.telegram.tokenFile`（僅限一般檔案；拒絕符號連結），預設帳號會以 `TELEGRAM_BOT_TOKEN` 作為後援。
- `apiRoot` 僅是 Telegram Bot API 根目錄。請使用 `https://api.telegram.org` 或你的自架/Proxy 根目錄，不要使用 `https://api.telegram.org/bot<TOKEN>`；`openclaw doctor --fix` 會移除意外加上的尾端 `/bot<TOKEN>` 後綴。
- 選用的 `channels.telegram.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 在多帳號設定（2 個以上帳號 ID）中，請設定明確預設值（`channels.telegram.defaultAccount` 或 `channels.telegram.accounts.default`）以避免後援路由；缺失或無效時，`openclaw doctor` 會發出警告。
- `configWrites: false` 會封鎖由 Telegram 發起的設定寫入（超級群組 ID 遷移、`/config set|unset`）。
- 帶有 `type: "acp"` 的頂層 `bindings[]` 項目會為論壇主題設定持久 ACP 繫結（在 `match.peer.id` 中使用標準 `chatId:topic:topicId`）。欄位語意在 [ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings) 中共用。
- Telegram 串流預覽使用 `sendMessage` + `editMessageText`（可在直接聊天與群組聊天中運作）。
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

- Token：`channels.discord.token`，預設帳戶可使用 `DISCORD_BOT_TOKEN` 作為備援。
- 提供明確 Discord `token` 的直接對外呼叫會使用該 Token 進行呼叫；帳戶重試/政策設定仍來自作用中執行階段快照中的所選帳戶。
- 選用的 `channels.discord.defaultAccount` 會在符合已設定帳戶 ID 時覆寫預設帳戶選擇。
- 使用 `user:<id>`（DM）或 `channel:<id>`（伺服器頻道）作為傳送目標；不接受裸數字 ID。
- 伺服器 slug 為小寫，空格會替換為 `-`；頻道鍵使用 slug 化名稱（不含 `#`）。建議使用伺服器 ID。
- 預設會忽略機器人作者的訊息。`allowBots: true` 會啟用它們；使用 `allowBots: "mentions"` 則只接受提及該機器人的機器人訊息（自己的訊息仍會被過濾）。
- `channels.discord.guilds.<id>.ignoreOtherMentions`（以及頻道覆寫）會捨棄提及其他使用者或角色、但未提及該機器人的訊息（排除 @everyone/@here）。
- `channels.discord.mentionAliases` 會在傳送前將穩定的對外 `@handle` 文字對應到 Discord 使用者 ID，因此即使暫時性目錄快取為空，也能確定性地提及已知隊友。每個帳戶的覆寫位於 `channels.discord.accounts.<accountId>.mentionAliases` 下。
- `maxLinesPerMessage`（預設 17）即使在低於 2000 字元時也會拆分較高的訊息。
- `channels.discord.threadBindings` 控制 Discord 執行緒綁定路由：
  - `enabled`：針對執行緒綁定工作階段功能的 Discord 覆寫（`/focus`、`/unfocus`、`/agents`、`/session idle`、`/session max-age`，以及綁定的傳送/路由）
  - `idleHours`：以小時計算的閒置自動取消聚焦 Discord 覆寫（`0` 會停用）
  - `maxAgeHours`：以小時計算的硬性最長存續時間 Discord 覆寫（`0` 會停用）
  - `spawnSessions`：`sessions_spawn({ thread: true })` 與 ACP 執行緒衍生自動建立/綁定執行緒的開關（預設：`true`）
  - `defaultSpawnContext`：執行緒綁定衍生的原生子代理程式情境（預設為 `"fork"`）
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目會為頻道和執行緒設定持久 ACP 綁定（在 `match.peer.id` 中使用頻道/執行緒 ID）。欄位語意在 [ACP 代理程式](/zh-TW/tools/acp-agents#persistent-channel-bindings) 中共用。
- `channels.discord.ui.components.accentColor` 設定 Discord 元件 v2 容器的強調色。
- `channels.discord.voice` 啟用 Discord 語音頻道對話，以及選用的自動加入 + LLM + TTS 覆寫。純文字 Discord 設定預設會關閉語音；設定 `channels.discord.voice.enabled=true` 即可選擇啟用。
- `channels.discord.voice.model` 可選擇性覆寫用於 Discord 語音頻道回應的 LLM 模型。
- `channels.discord.voice.daveEncryption` 和 `channels.discord.voice.decryptionFailureTolerance` 會傳遞至 `@discordjs/voice` DAVE 選項（預設分別為 `true` 和 `24`）。
- `channels.discord.voice.connectTimeoutMs` 控制 `/vc join` 和自動加入嘗試的初始 `@discordjs/voice` Ready 等待時間（預設為 `30000`）。
- `channels.discord.voice.reconnectGraceMs` 控制已中斷連線的語音工作階段在 OpenClaw 銷毀它之前，可花多久時間進入重新連線訊號狀態（預設為 `15000`）。
- OpenClaw 也會在重複解密失敗後，透過離開/重新加入語音工作階段來嘗試語音接收復原。
- `channels.discord.streaming` 是正式的串流模式鍵。舊版 `streamMode` 和布林值 `streaming` 會自動遷移。
- `channels.discord.autoPresence` 會將執行階段可用性對應至機器人狀態（healthy => online、degraded => idle、exhausted => dnd），並允許選用的狀態文字覆寫。
- `channels.discord.dangerouslyAllowNameMatching` 會重新啟用可變名稱/標籤比對（緊急相容模式）。
- `channels.discord.execApprovals`：Discord 原生 exec 核准傳送與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當核准者可從 `approvers` 或 `commands.ownerAllowFrom` 解析時，exec 核准就會啟用。
  - `approvers`：允許核准 exec 請求的 Discord 使用者 ID。省略時會退回使用 `commands.ownerAllowFrom`。
  - `agentFilter`：選用的代理程式 ID 允許清單。省略即可轉送所有代理程式的核准。
  - `sessionFilter`：選用的工作階段鍵模式（子字串或正規表示式）。
  - `target`：核准提示的傳送位置。`"dm"`（預設）會傳送給核准者 DM，`"channel"` 會傳送到來源頻道，`"both"` 會兩者都傳送。當目標包含 `"channel"` 時，按鈕僅可由已解析的核准者使用。
  - `cleanupAfterResolve`：為 `true` 時，會在核准、拒絕或逾時後刪除核准 DM。

**反應通知模式：** `off`（無）、`own`（機器人的訊息，預設）、`all`（所有訊息）、`allowlist`（來自所有訊息上的 `guilds.<id>.users`）。

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

- 服務帳戶 JSON：行內（`serviceAccount`）或檔案型（`serviceAccountFile`）。
- 也支援服務帳戶 SecretRef（`serviceAccountRef`）。
- 環境變數備援：`GOOGLE_CHAT_SERVICE_ACCOUNT` 或 `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`。
- 使用 `spaces/<spaceId>` 或 `users/<userId>` 作為傳送目標。
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

- **Socket mode** 需要同時有 `botToken` 和 `appToken`（預設帳戶環境變數備援為 `SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN`）。
- **HTTP mode** 需要 `botToken` 加上 `signingSecret`（位於根層級或每個帳戶）。
- `socketMode` 會將 Slack SDK Socket Mode 傳輸調校傳遞給公開 Bolt 接收器 API。僅在調查 ping/pong 逾時或過期 websocket 行為時使用它。
- `botToken`、`appToken`、`signingSecret` 和 `userToken` 接受純文字
  字串或 SecretRef 物件。
- Slack 帳戶快照會公開每個憑證的來源/狀態欄位，例如
  `botTokenSource`、`botTokenStatus`、`appTokenStatus`，以及在 HTTP 模式中的
  `signingSecretStatus`。`configured_unavailable` 表示帳戶是
  透過 SecretRef 設定，但目前的命令/執行階段路徑無法
  解析密鑰值。
- `configWrites: false` 會封鎖由 Slack 發起的設定寫入。
- 選用的 `channels.slack.defaultAccount` 會在符合已設定帳戶 ID 時覆寫預設帳戶選擇。
- `channels.slack.streaming.mode` 是正式的 Slack 串流模式鍵。`channels.slack.streaming.nativeTransport` 控制 Slack 的原生串流傳輸。舊版 `streamMode`、布林值 `streaming` 和 `nativeStreaming` 會自動遷移。
- 使用 `user:<id>`（DM）或 `channel:<id>` 作為傳送目標。

**反應通知模式：** `off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

**執行緒工作階段隔離：** `thread.historyScope` 為每個執行緒（預設）或跨頻道共用。`thread.inheritParent` 會將父頻道轉錄複製到新執行緒。

- Slack 原生串流加上 Slack 助理風格的「is typing...」執行緒狀態需要回覆執行緒目標。頂層 DM 預設保持非執行緒，因此它們仍可透過 Slack 草稿發文並編輯預覽進行串流，而不是顯示執行緒風格的原生串流/狀態預覽。
- `typingReaction` 會在回覆執行期間，將暫時性反應新增到傳入的 Slack 訊息，然後在完成時移除。請使用 Slack emoji 短代碼，例如 `"hourglass_flowing_sand"`。
- `channels.slack.execApprovals`：Slack 原生 exec 核准傳送與核准者授權。結構描述與 Discord 相同：`enabled`（`true`/`false`/`"auto"`）、`approvers`（Slack 使用者 ID）、`agentFilter`、`sessionFilter` 和 `target`（`"dm"`、`"channel"` 或 `"both"`）。

| 動作群組 | 預設 | 備註                  |
| ------------ | ------- | ---------------------- |
| reactions    | 已啟用 | 反應 + 列出反應 |
| messages     | 已啟用 | 讀取/傳送/編輯/刪除  |
| pins         | 已啟用 | 釘選/取消釘選/列出         |
| memberInfo   | 已啟用 | 成員資訊            |
| emojiList    | 已啟用 | 自訂 emoji 清單      |

### Mattermost

Mattermost 在目前的 OpenClaw 版本中以 bundled Plugin 形式提供。較舊或
自訂建置可以使用
`openclaw plugins install @openclaw/mattermost` 安裝目前的 npm 套件。固定版本前，請先查看
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
- `commands.callbackUrl` 必須解析到 OpenClaw gateway 端點，且可由 Mattermost 伺服器存取。
- 原生斜線命令回呼會使用 Mattermost 在註冊斜線命令時傳回的逐命令權杖進行驗證。如果註冊失敗或沒有啟用任何命令，OpenClaw 會以 `Unauthorized: invalid command token.` 拒絕回呼。
- 對於私有、tailnet 或內部回呼主機，Mattermost 可能要求 `ServiceSettings.AllowedUntrustedInternalConnections` 包含該回呼主機/網域。請使用主機/網域值，而不是完整 URL。
- `channels.mattermost.configWrites`：允許或拒絕由 Mattermost 發起的設定寫入。
- `channels.mattermost.requireMention`：要求在頻道中回覆前必須有 `@mention`。
- `channels.mattermost.groups.<channelId>.requireMention`：逐頻道的提及門檻覆寫（`"*"` 表示預設）。
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

**反應通知模式：**`off`、`own`（預設）、`all`、`allowlist`（來自 `reactionAllowlist`）。

- `channels.signal.account`：將頻道啟動固定到特定 Signal 帳號身分。
- `channels.signal.configWrites`：允許或拒絕由 Signal 發起的設定寫入。
- 選用的 `channels.signal.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。

### BlueBubbles

BlueBubbles 是建議的 iMessage 路徑（由 Plugin 支援，設定於 `channels.bluebubbles` 下）。

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

- 此處涵蓋的核心鍵路徑：`channels.bluebubbles`、`channels.bluebubbles.dmPolicy`。
- 選用的 `channels.bluebubbles.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目可將 BlueBubbles 對話繫結到持久 ACP 工作階段。請在 `match.peer.id` 中使用 BlueBubbles handle 或目標字串（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)。
- 完整的 BlueBubbles 頻道設定記錄於 [BlueBubbles](/zh-TW/channels/bluebubbles)。

### iMessage

OpenClaw 會產生 `imsg rpc`（透過 stdio 的 JSON-RPC）。不需要 daemon 或連接埠。

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

- 選用的 `channels.imessage.defaultAccount` 會在符合已設定帳號 ID 時覆寫預設帳號選擇。

- 需要對 Messages DB 授予完整磁碟存取權。
- 優先使用 `chat_id:<id>` 目標。使用 `imsg chats --limit 20` 列出聊天。
- `cliPath` 可以指向 SSH 包裝器；設定 `remoteHost`（`host` 或 `user@host`）以擷取 SCP 附件。
- `attachmentRoots` 和 `remoteAttachmentRoots` 會限制傳入附件路徑（預設：`/Users/*/Library/Messages/Attachments`）。
- SCP 使用嚴格主機金鑰檢查，因此請確保轉送主機金鑰已存在於 `~/.ssh/known_hosts`。
- `channels.imessage.configWrites`：允許或拒絕由 iMessage 發起的設定寫入。
- 具有 `type: "acp"` 的頂層 `bindings[]` 項目可將 iMessage 對話繫結到持久 ACP 工作階段。請在 `match.peer.id` 中使用正規化 handle 或明確的聊天目標（`chat_id:*`、`chat_guid:*`、`chat_identifier:*`）。共用欄位語意：[ACP 代理](/zh-TW/tools/acp-agents#persistent-channel-bindings)。

<Accordion title="iMessage SSH 包裝器範例">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix 由 Plugin 支援，並設定於 `channels.matrix` 下。

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
- `channels.matrix.proxy` 會透過明確的 HTTP(S) proxy 路由 Matrix HTTP 流量。具名帳號可使用 `channels.matrix.accounts.<id>.proxy` 覆寫。
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` 允許私有/內部 homeserver。`proxy` 與此網路選擇加入是獨立控制項。
- `channels.matrix.defaultAccount` 會在多帳號設定中選取偏好的帳號。
- `channels.matrix.autoJoin` 預設為 `off`，因此受邀房間與新的 DM 樣式邀請都會被忽略，直到你設定 `autoJoin: "allowlist"` 搭配 `autoJoinAllowlist`，或設定 `autoJoin: "always"`。
- `channels.matrix.execApprovals`：Matrix 原生 exec 核准傳遞與核准者授權。
  - `enabled`：`true`、`false` 或 `"auto"`（預設）。在自動模式中，當可從 `approvers` 或 `commands.ownerAllowFrom` 解析核准者時，exec 核准會啟用。
  - `approvers`：允許核准 exec 請求的 Matrix 使用者 ID（例如 `@owner:example.org`）。
  - `agentFilter`：選用代理 ID allowlist。省略時會轉送所有代理的核准。
  - `sessionFilter`：選用工作階段鍵模式（子字串或 regex）。
  - `target`：傳送核准提示的位置。`"dm"`（預設）、`"channel"`（來源房間）或 `"both"`。
  - 逐帳號覆寫：`channels.matrix.accounts.<id>.execApprovals`。
- `channels.matrix.dm.sessionScope` 控制 Matrix DM 如何分組成工作階段：`per-user`（預設）依路由對等端共用，而 `per-room` 會隔離每個 DM 房間。
- Matrix 狀態探測與即時目錄查詢使用與執行階段流量相同的 proxy 原則。
- 完整的 Matrix 設定、目標規則與設定範例記錄於 [Matrix](/zh-TW/channels/matrix)。

### Microsoft Teams

Microsoft Teams 由 Plugin 支援，並設定於 `channels.msteams` 下。

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
- 完整的 Teams 設定（認證、Webhook、DM/群組原則、逐團隊/逐頻道覆寫）記錄於 [Microsoft Teams](/zh-TW/channels/msteams)。

### IRC

IRC 由 Plugin 支援，並設定於 `channels.irc` 下。

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
- 完整的 IRC 頻道設定（主機/連接埠/TLS/頻道/allowlist/提及門檻）記錄於 [IRC](/zh-TW/channels/irc)。

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

- 省略 `accountId` 時會使用 `default`（CLI + 路由）。
- Env 權杖只會套用到**預設**帳號。
- 基礎頻道設定會套用到所有帳號，除非逐帳號覆寫。
- 使用 `bindings[].match.accountId` 將每個帳號路由到不同代理。
- 如果你透過 `openclaw channels add`（或頻道 onboarding）新增非預設帳號，同時仍使用單帳號頂層頻道設定，OpenClaw 會先將帳號範圍的頂層單帳號值提升到頻道帳號對應表，使原始帳號繼續運作。大多數頻道會將它們移入 `channels.<channel>.accounts.default`；Matrix 則可改為保留現有相符的具名/預設目標。
- 現有僅限頻道的繫結（沒有 `accountId`）會繼續符合預設帳號；帳號範圍的繫結仍為選用。
- `openclaw doctor --fix` 也會透過將帳號範圍的頂層單帳號值移入該頻道所選的已提升帳號，來修復混合形狀。大多數頻道使用 `accounts.default`；Matrix 則可改為保留現有相符的具名/預設目標。

### 其他 Plugin 頻道

許多 Plugin 頻道會設定為 `channels.<id>`，並記錄於其專用頻道頁面（例如 Feishu、Matrix、LINE、Nostr、Zalo、Nextcloud Talk、Synology Chat 和 Twitch）。
請參閱完整頻道索引：[頻道](/zh-TW/channels)。

### 群組聊天提及門檻

群組訊息預設為**要求提及**（中繼資料提及或安全的 regex 模式）。適用於 WhatsApp、Telegram、Discord、Google Chat 和 iMessage 群組聊天。

可見回覆由另一組設定控制。群組/頻道房間預設為 `messages.groupChat.visibleReplies: "message_tool"`：OpenClaw 仍會處理該輪對話，但一般最終回覆會保持私密，可見的房間輸出需要 `message(action=send)`。只有在你想要舊有行為，也就是一般回覆會張貼回房間時，才設定 `"automatic"`。若也要將相同的僅工具可見回覆行為套用到直接聊天，請設定 `messages.visibleReplies: "message_tool"`；Codex harness 也會將該僅工具行為作為其未設定的直接聊天預設。

僅工具可見回覆需要能可靠呼叫工具的模型/執行階段。如果工作階段記錄顯示 assistant 文字帶有 `didSendViaMessagingTool: false`，表示模型產生了私密最終答案，而不是呼叫 message 工具。請改用該頻道的更強工具呼叫模型，或設定 `messages.groupChat.visibleReplies: "automatic"` 以還原舊有可見最終回覆。

如果 message 工具在作用中的工具原則下不可用，OpenClaw 會退回到自動可見回覆，而不是靜默抑制回應。`openclaw doctor` 會針對此不相符狀況發出警告。

gateway 會在檔案儲存後熱重載 `messages` 設定。只有在部署中停用檔案監看或設定重載時，才需要重新啟動。

**提及類型：**

- **中繼資料提及**：原生平台 @-提及。在 WhatsApp 自我聊天模式中會被忽略。
- **文字模式**：`agents.list[].groupChat.mentionPatterns` 中的安全 regex 模式。無效模式和不安全的巢狀重複會被忽略。
- 只有在可偵測時才會強制執行提及閘控（原生提及或至少一個模式）。

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

`messages.groupChat.historyLimit` 會設定全域預設值。頻道可以用 `channels.<channel>.historyLimit`（或依帳號）覆寫。設為 `0` 可停用。

`messages.visibleReplies` 是全域來源回合預設值；`messages.groupChat.visibleReplies` 會針對群組/頻道來源回合覆寫它。當 `messages.visibleReplies` 未設定時，harness 可以提供自己的直接/來源預設值；Codex harness 預設為 `message_tool`。頻道允許清單和提及閘控仍會決定是否處理某個回合。

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

解析順序：依 DM 覆寫 → 提供者預設值 → 無限制（全部保留）。

支援：`telegram`、`whatsapp`、`discord`、`slack`、`signal`、`imessage`、`msteams`。

#### 自我聊天模式

在 `allowFrom` 中加入你自己的號碼以啟用自我聊天模式（忽略原生 @-提及，只回應文字模式）：

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

- 這個區塊會設定命令介面。若要查看目前內建 + 隨附的命令目錄，請參閱 [斜線命令](/zh-TW/tools/slash-commands)。
- 本頁是**設定鍵參考**，不是完整命令目錄。頻道/Plugin 擁有的命令，例如 QQ Bot `/bot-ping` `/bot-help` `/bot-logs`、LINE `/card`、裝置配對 `/pair`、記憶 `/dreaming`、電話控制 `/phone` 和 Talk `/voice`，會記錄在其頻道/Plugin 頁面以及 [斜線命令](/zh-TW/tools/slash-commands)。
- 文字命令必須是以 `/` 開頭的**獨立**訊息。
- `native: "auto"` 會為 Discord/Telegram 開啟原生命令，並讓 Slack 維持關閉。
- `nativeSkills: "auto"` 會為 Discord/Telegram 開啟原生 skill 命令，並讓 Slack 維持關閉。
- 依頻道覆寫：`channels.discord.commands.native`（布林值或 `"auto"`）。對於 Discord，`false` 會在啟動期間略過原生命令註冊與清理。
- 使用 `channels.<provider>.commands.nativeSkills` 依頻道覆寫原生 skill 註冊。
- `channels.telegram.customCommands` 會加入額外的 Telegram Bot 選單項目。
- `bash: true` 會為主機 shell 啟用 `! <cmd>`。需要 `tools.elevated.enabled`，且傳送者必須在 `tools.elevated.allowFrom.<channel>` 中。
- `config: true` 會啟用 `/config`（讀取/寫入 `openclaw.json`）。對於 gateway `chat.send` 用戶端，持久性 `/config set|unset` 寫入也需要 `operator.admin`；唯讀 `/config show` 仍可供一般寫入範圍的 operator 用戶端使用。
- `mcp: true` 會為 `mcp.servers` 下由 OpenClaw 管理的 MCP 伺服器設定啟用 `/mcp`。
- `plugins: true` 會為 Plugin 探索、安裝，以及啟用/停用控制項啟用 `/plugins`。
- `channels.<provider>.configWrites` 會依頻道閘控設定變更（預設：true）。
- 對於多帳號頻道，`channels.<provider>.accounts.<id>.configWrites` 也會閘控以該帳號為目標的寫入（例如 `/allowlist --config --account <id>` 或 `/config set channels.<provider>.accounts.<id>...`）。
- `restart: false` 會停用 `/restart` 和 Gateway 重新啟動工具動作。預設：`true`。
- `ownerAllowFrom` 是 owner-only 命令/工具的明確擁有者允許清單。它與 `allowFrom` 分開。
- `ownerDisplay: "hash"` 會在系統提示中雜湊擁有者 ID。設定 `ownerDisplaySecret` 可控制雜湊。
- `allowFrom` 是依提供者設定。設定後，它就是**唯一**授權來源（頻道允許清單/配對和 `useAccessGroups` 都會被忽略）。
- 當未設定 `allowFrom` 時，`useAccessGroups: false` 允許命令繞過存取群組政策。
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

- [設定參考](/zh-TW/gateway/configuration-reference) — 頂層鍵
- [設定 — agents](/zh-TW/gateway/config-agents)
- [頻道概觀](/zh-TW/channels)
