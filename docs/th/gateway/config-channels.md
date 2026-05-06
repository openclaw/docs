---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าแบบแยกตามช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว นโยบายกลุ่ม หรือการควบคุมด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์รายช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-06T17:56:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9be70fd706bcf5acfd06b99632c97f4affb854c6aed02558f70c0403247c448
    source_path: gateway/config-channels.md
    workflow: 16
---

Per-channel configuration keys under `channels.*`. Covers DM and group access,
multi-account setups, mention gating, and per-channel keys for Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, and the other bundled channel plugins.

For agents, tools, gateway runtime, and other top-level keys, see
[Configuration reference](/th/gateway/configuration-reference).

## Channels

Each channel starts automatically when its config section exists (unless `enabled: false`).

### DM and group access

All channels support DM policies and group policies:

| DM policy           | Behavior                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | Unknown senders get a one-time pairing code; owner must approve |
| `allowlist`         | Only senders in `allowFrom` (or paired allow store)             |
| `open`              | Allow all inbound DMs (requires `allowFrom: ["*"]`)             |
| `disabled`          | Ignore all inbound DMs                                          |

| Group policy          | Behavior                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | Only groups matching the configured allowlist          |
| `open`                | Bypass group allowlists (mention-gating still applies) |
| `disabled`            | Block all group/room messages                          |

<Note>
`channels.defaults.groupPolicy` sets the default when a provider's `groupPolicy` is unset.
Pairing codes expire after 1 hour. Pending DM pairing requests are capped at **3 per channel**.
If a provider block is missing entirely (`channels.<provider>` absent), runtime group policy falls back to `allowlist` (fail-closed) with a startup warning.
</Note>

### Channel model overrides

Use `channels.modelByChannel` to pin specific channel IDs to a model. Values accept `provider/model` or configured model aliases. The channel mapping applies when a session does not already have a model override (for example, set via `/model`).

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

### Channel defaults and heartbeat

Use `channels.defaults` for shared group-policy and heartbeat behavior across providers:

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

- `channels.defaults.groupPolicy`: fallback group policy when a provider-level `groupPolicy` is unset.
- `channels.defaults.contextVisibility`: default supplemental context visibility mode for all channels. Values: `all` (default, include all quoted/thread/history context), `allowlist` (only include context from allowlisted senders), `allowlist_quote` (same as allowlist but keep explicit quote/reply context). Per-channel override: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: include healthy channel statuses in heartbeat output.
- `channels.defaults.heartbeat.showAlerts`: include degraded/error statuses in heartbeat output.
- `channels.defaults.heartbeat.useIndicator`: render compact indicator-style heartbeat output.

### WhatsApp

WhatsApp runs through the gateway's web channel (Baileys Web). It starts automatically when a linked session exists.

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

- Outbound commands default to account `default` if present; otherwise the first configured account id (sorted).
- Optional `channels.whatsapp.defaultAccount` overrides that fallback default account selection when it matches a configured account id.
- Legacy single-account Baileys auth dir is migrated by `openclaw doctor` into `whatsapp/default`.
- Per-account overrides: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- Bot token: `channels.telegram.botToken` or `channels.telegram.tokenFile` (regular file only; symlinks rejected), with `TELEGRAM_BOT_TOKEN` as fallback for the default account.
- `apiRoot` is the Telegram Bot API root only. Use `https://api.telegram.org` or your self-hosted/proxy root, not `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` removes an accidental trailing `/bot<TOKEN>` suffix.
- Optional `channels.telegram.defaultAccount` overrides default account selection when it matches a configured account id.
- In multi-account setups (2+ account ids), set an explicit default (`channels.telegram.defaultAccount` or `channels.telegram.accounts.default`) to avoid fallback routing; `openclaw doctor` warns when this is missing or invalid.
- `configWrites: false` blocks Telegram-initiated config writes (supergroup ID migrations, `/config set|unset`).
- Top-level `bindings[]` entries with `type: "acp"` configure persistent ACP bindings for forum topics (use canonical `chatId:topic:topicId` in `match.peer.id`). Field semantics are shared in [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings).
- Telegram stream previews use `sendMessage` + `editMessageText` (works in direct and group chats).
- Retry policy: see [Retry policy](/th/concepts/retry).

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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็นค่าทดแทนสำหรับบัญชีเริ่มต้น.
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก ส่วนการตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่.
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ.
- slug ของกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ของช่องใช้ชื่อแบบ slug (ไม่มี `#`). แนะนำให้ใช้ ID ของกิลด์.
- ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้นโดยค่าเริ่มต้น. `allowBots: true` เปิดใช้ข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here).
- `channels.discord.mentionAliases` จับคู่ข้อความ `@handle` ขาออกที่เสถียรกับ ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่. การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แยกข้อความที่สูงมากแม้จะต่ำกว่า 2000 อักขระ.
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ของ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ของ Discord สำหรับการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` ปิดใช้)
  - `maxAgeHours`: การแทนที่ของ Discord สำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติเมื่อ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent เนทีฟสำหรับการ spawn ที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ของช่อง/เธรดใน `match.peer.id`). ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ components v2 ของ Discord.
- `channels.discord.voice` เปิดใช้การสนทนาในช่องเสียง Discord และการแทนที่ auto-join + LLM + TTS แบบไม่บังคับ. การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงไว้ตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้.
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord แบบไม่บังคับ.
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`).
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (ค่าเริ่มต้นคือ `30000`).
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ถูกตัดการเชื่อมต่อสามารถเข้าสู่สัญญาณ reconnect ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (ค่าเริ่มต้นคือ `15000`).
- นอกจากนี้ OpenClaw ยังพยายามกู้คืนการรับเสียงด้วยการออกจาก/เข้าร่วมเซสชันเสียงอีกครั้งหลังจากถอดรหัสล้มเหลวซ้ำ ๆ.
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน. ค่า legacy `streamMode` และค่า boolean `streaming` ยังคงเป็น alias ขณะรันไทม์; เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่.
- `channels.discord.autoPresence` จับคู่ความพร้อมใช้งานของรันไทม์กับสถานะ presence ของบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะแบบไม่บังคับ.
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass).
- `channels.discord.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ.
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น). ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อแก้ค่าผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`.
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec. จะถอยกลับไปใช้ `commands.ownerAllowFrom` เมื่อละไว้.
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ. ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ. `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่. เมื่อ target รวม `"channel"` ปุ่มจะใช้งานได้เฉพาะโดยผู้อนุมัติที่แก้ค่าได้เท่านั้น.
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา.

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` ในทุกข้อความ).

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

- JSON ของบัญชีบริการ: แบบอินไลน์ (`serviceAccount`) หรือแบบใช้ไฟล์ (`serviceAccountFile`).
- รองรับ SecretRef ของบัญชีบริการด้วย (`serviceAccountRef`).
- ค่าทดแทนจาก env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง.
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass).

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

- **Socket mode** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับค่าทดแทนจาก env ของบัญชีเริ่มต้น).
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี).
- `socketMode` ส่งต่อการปรับแต่ง transport ของ Slack SDK Socket Mode ไปยัง API receiver Bolt สาธารณะ. ใช้เฉพาะเมื่อตรวจสอบ ping/pong timeout หรือพฤติกรรม websocket ค้าง.
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริง plaintext
  หรือออบเจ็กต์ SecretRef.
- สแนปช็อตบัญชี Slack แสดงฟิลด์ source/status ราย credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus`. `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่พาธคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  แก้ค่าความลับได้.
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มโดย Slack.
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack. `channels.slack.streaming.nativeTransport` ควบคุม transport สตรีมมิงเนทีฟของ Slack. ค่า legacy `streamMode`, ค่า boolean `streaming` และค่า `nativeStreaming` ยังคงเป็น alias ขณะรันไทม์; เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง.

**โหมดการแจ้งเตือนด้วยรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`).

**การแยก session ของ thread:** `thread.historyScope` เป็นแบบต่อ thread (ค่าเริ่มต้น) หรือแชร์ข้าม channel `thread.inheritParent` คัดลอก transcript ของ channel แม่ไปยัง thread ใหม่

- การสตรีมแบบเนทีฟของ Slack รวมถึงสถานะ thread แบบผู้ช่วยของ Slack อย่าง "กำลังพิมพ์..." ต้องมีเป้าหมายเป็น reply thread โดยค่าเริ่มต้น DM ระดับบนสุดจะอยู่นอก thread ดังนั้นจึงยังสามารถสตรีมผ่านพรีวิวแบบโพสต์ร่างแล้วแก้ไขของ Slack แทนการแสดงพรีวิว stream/status แบบเนทีฟสไตล์ thread ได้
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวไปยังข้อความ Slack ขาเข้าขณะกำลังสร้างคำตอบ แล้วลบออกเมื่อเสร็จสิ้น ใช้ emoji shortcode ของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่ม Action | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | รีแอ็กต์ + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการอีโมจิที่กำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือ
บิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost` ตรวจสอบ
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
เพื่อดู dist-tags ปัจจุบันก่อน pin เวอร์ชัน

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

โหมดแชต: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย prefix ทริกเกอร์)

เมื่อเปิดใช้งานคำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยังปลายทาง Gateway ของ OpenClaw และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- Callback แบบ slash ดั้งเดิมจะยืนยันตัวตนด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งคืนระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มีคำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบส่วนตัว/tailnet/ภายใน Mattermost อาจต้องให้ `ServiceSettings.AllowedUntrustedInternalConnections` มีโฮสต์/โดเมน callback รวมอยู่ด้วย ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การควบคุมการกล่าวถึงรายช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่คอนฟิกไว้

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

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ตรึงการเริ่มช่องกับตัวตนบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่คอนฟิกไว้

### BlueBubbles

BlueBubbles เป็นเส้นทาง iMessage ที่แนะนำ (ขับเคลื่อนด้วย Plugin และคอนฟิกไว้ภายใต้ `channels.bluebubbles`)

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

- พาธคีย์หลักที่ครอบคลุมในที่นี้: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่คอนฟิกไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles เข้ากับเซสชัน ACP แบบถาวรได้ ใช้ handle ของ BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- คอนฟิกช่อง BlueBubbles ฉบับเต็มมีเอกสารอยู่ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw สร้าง `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่คอนฟิกไว้

- ต้องมี Full Disk Access สำหรับ DB ของ Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง wrapper ของ SSH ได้ ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบด้วย SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่าคีย์โฮสต์ของรีเลย์มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบถาวรได้ ใช้ handle ที่ปรับรูปแบบแล้วหรือเป้าหมายแชตแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง wrapper SSH ของ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ขับเคลื่อนด้วย Plugin และคอนฟิกไว้ภายใต้ `channels.matrix`

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

- การยืนยันตัวตนด้วยโทเค็นใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) แบบระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ค่านี้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver แบบส่วนตัว/ภายใน `proxy` และการเลือกใช้เครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ถูกเชิญและคำเชิญใหม่แบบ DM จะถูกเพิกเฉยจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำอนุมัติ exec แบบ Matrix-native และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ คำอนุมัติ exec จะเปิดใช้งานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ ละไว้เพื่อส่งต่อคำอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์คำอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตามเพียร์ที่ถูกกำหนดเส้นทาง ขณะที่ `per-room` แยกห้อง DM แต่ละห้องออกจากกัน
- การตรวจสอบสถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบายพร็อกซีเดียวกับทราฟฟิกรันไทม์
- คอนฟิก Matrix ฉบับเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารอยู่ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams ขับเคลื่อนด้วย Plugin และคอนฟิกไว้ภายใต้ `channels.msteams`

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

- พาธคีย์หลักที่ครอบคลุมในที่นี้: `channels.msteams`, `channels.msteams.configWrites`
- คอนฟิก Teams ฉบับเต็ม (credentials, Webhook, นโยบาย DM/กลุ่ม, การแทนที่รายทีม/รายช่อง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC ขับเคลื่อนด้วย Plugin และคอนฟิกไว้ภายใต้ `channels.irc`

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

- พาธคีย์หลักที่ครอบคลุมในที่นี้: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่คอนฟิกไว้
- คอนฟิกช่อง IRC ฉบับเต็ม (host/port/TLS/channels/allowlists/การควบคุมการกล่าวถึง) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่อง)

เรียกใช้หลายบัญชีต่อช่อง (แต่ละบัญชีมี `accountId` ของตนเอง):

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การกำหนดเส้นทาง)
- โทเค็น env ใช้กับบัญชี **เริ่มต้น** เท่านั้น
- การตั้งค่าช่องพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มใช้งานช่อง) ในขณะที่ยังใช้คอนฟิกช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีเข้าไปในแมปบัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านี้ไปยัง `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วแทนได้
- Binding เฉพาะช่องที่มีอยู่ (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น; binding ที่อยู่ในขอบเขตบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมแซมรูปทรงแบบผสมด้วยการย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีเข้าไปในบัญชีที่ถูกเลื่อนซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วแทนได้

### ช่อง Plugin อื่น ๆ

ช่อง Plugin จำนวนมากคอนฟิกเป็น `channels.<id>` และมีเอกสารอยู่ในหน้าช่องเฉพาะของตนเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทั้งหมด: [ช่อง](/th/channels)

### การควบคุมการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** (การกล่าวถึงจาก metadata หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผลรอบการสนทนา แต่การตอบสุดท้ายตามปกติจะยังคงเป็นส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมแบบเดิมที่โพสต์การตอบปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบต้องใช้เครื่องมือเดียวกันกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; harness ของ Codex ยังใช้พฤติกรรมแบบต้องใช้เครื่องมือนั้นเป็นค่าเริ่มต้นของแชตโดยตรงที่ไม่ได้ตั้งค่าไว้ด้วย

การตอบกลับที่มองเห็นได้แบบต้องใช้เครื่องมือต้องอาศัยโมเดล/รันไทม์ที่เรียกใช้เครื่องมือได้อย่างน่าเชื่อถือ หากบันทึกเซสชันแสดงข้อความผู้ช่วยพร้อม `didSendViaMessagingTool: false` แสดงว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนการเรียกเครื่องมือข้อความ ให้เปลี่ยนไปใช้โมเดลที่เรียกใช้เครื่องมือได้ดีกว่าสำหรับช่องนั้น หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อคืนค่าการตอบสุดท้ายที่มองเห็นได้แบบเดิม

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะ fallback ไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการระงับการตอบกลับอย่างเงียบ ๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะ hot-reload คอนฟิก `messages` หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดคอนฟิกซ้ำถูกปิดใช้งานในการปรับใช้

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงในเมทาดาทา**: การกล่าวถึงด้วย @ ของแพลตฟอร์มเนทีฟ ถูกละเว้นในโหมดแชตกับตัวเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
- การกั้นด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (การกล่าวถึงแบบเนทีฟหรืออย่างน้อยหนึ่งรูปแบบ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องทางสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของเทิร์นต้นทาง; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับเทิร์นต้นทางของกลุ่ม/ช่องทาง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` harness สามารถให้ค่าเริ่มต้น direct/source ของตัวเองได้; harness ของ Codex มีค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของช่องทางและการกั้นด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่าเทิร์นจะถูกประมวลผลหรือไม่

#### ขีดจำกัดประวัติ DM

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

การแก้ลำดับค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บทั้งหมดไว้)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้นการกล่าวถึงด้วย @ แบบเนทีฟ และตอบกลับเฉพาะรูปแบบข้อความ):

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

### คำสั่ง (การจัดการคำสั่งแชต)

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

<Accordion title="รายละเอียดคำสั่ง">

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแคตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แคตตาล็อกคำสั่งฉบับเต็ม คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone` และ Talk `/voice` มีเอกสารในหน้าช่องทาง/Plugin ของคำสั่งเหล่านั้น รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวๆ** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- `nativeSkills: "auto"` เปิดคำสั่ง Skills เนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- แทนที่รายช่องทางได้ด้วย: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งเนทีฟระหว่างเริ่มต้น
- แทนที่การลงทะเบียน Skills เนทีฟรายช่องทางได้ด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้งาน `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรต้องมี `operator.admin` ด้วย; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ operator ที่มีขอบเขตการเขียนปกติ
- `mcp: true` เปิดใช้งาน `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้งาน `/plugins` สำหรับการค้นพบ ติดตั้ง และควบคุมการเปิด/ปิดใช้งาน Plugin
- `channels.<provider>.configWrites` กั้นการเปลี่ยนแปลงค่ากำหนดรายช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะกั้นการเขียนที่ระบุเป้าหมายเป็นบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการกระทำของเครื่องมือรีสตาร์ท Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือสำหรับเจ้าของเท่านั้น แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮช ID เจ้าของในพรอมป์ต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบรายผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องทางและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนผังเอกสารคำสั่ง:
  - แคตตาล็อก built-in + bundled: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - Dreaming ของหน่วยความจำ: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
