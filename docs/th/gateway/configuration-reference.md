---
read_when:
    - คุณต้องการความหมายของการตั้งค่าระดับฟิลด์หรือค่าเริ่มต้นอย่างแม่นยำ
    - คุณกำลังตรวจสอบบล็อกการตั้งค่าของช่องทาง โมเดล Gateway หรือเครื่องมือ
summary: ข้อมูลอ้างอิงการตั้งค่า Gateway สำหรับคีย์หลักของ OpenClaw ค่าเริ่มต้น และลิงก์ไปยังข้อมูลอ้างอิงเฉพาะของแต่ละระบบย่อย
title: ข้อมูลอ้างอิงการตั้งค่า
x-i18n:
    generated_at: "2026-04-23T10:17:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 75c7e0d88ea6eacb8a2dd41f83033da853130dc2a689950c1a188d7c4ca8f977
    source_path: gateway/configuration-reference.md
    workflow: 15
---

# ข้อมูลอ้างอิงการตั้งค่า

ข้อมูลอ้างอิงการตั้งค่าหลักสำหรับ `~/.openclaw/openclaw.json` สำหรับภาพรวมแบบเน้นงาน ให้ดู [Configuration](/th/gateway/configuration)

หน้านี้ครอบคลุมพื้นผิวการตั้งค่าหลักของ OpenClaw และลิงก์ออกไปเมื่อระบบย่อยใดมีข้อมูลอ้างอิงเชิงลึกของตนเอง โดย **ไม่ได้** พยายามใส่แค็ตตาล็อกคำสั่งทั้งหมดที่เป็นของช่องทาง/Plugin หรือค่าปรับละเอียดของ memory/QMD ทุกตัวไว้ในหน้าเดียว

แหล่งความจริงของโค้ด:

- `openclaw config schema` จะแสดง JSON Schema แบบสดที่ใช้สำหรับการตรวจสอบและ Control UI โดยรวมเมทาดาทาของ bundled/plugin/channel เข้าไปเมื่อมี
- `config.schema.lookup` จะคืนค่า schema node แบบกำหนดขอบเขตตาม path หนึ่งรายการสำหรับเครื่องมือ drill-down
- `pnpm config:docs:check` / `pnpm config:docs:gen` ใช้ตรวจสอบ baseline hash ของเอกสาร config เทียบกับพื้นผิว schema ปัจจุบัน

ข้อมูลอ้างอิงเชิงลึกเฉพาะด้าน:

- [ข้อมูลอ้างอิงการตั้งค่า memory](/th/reference/memory-config) สำหรับ `agents.defaults.memorySearch.*`, `memory.qmd.*`, `memory.citations` และค่าตั้งค่า Dreaming ภายใต้ `plugins.entries.memory-core.config.dreaming`
- [Slash Commands](/th/tools/slash-commands) สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน
- หน้า channel/plugin เจ้าของฟีเจอร์สำหรับพื้นผิวคำสั่งเฉพาะของแต่ละช่องทาง

รูปแบบ config คือ **JSON5** (อนุญาตคอมเมนต์และ trailing commas) ทุกฟิลด์เป็นแบบไม่บังคับ — OpenClaw จะใช้ค่าเริ่มต้นที่ปลอดภัยเมื่อไม่ได้ระบุ

---

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานอัตโนมัติเมื่อมีส่วน config ของมันอยู่ (ยกเว้นตั้ง `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับ allowlist ที่ตั้งค่าไว้          |
| `open`                | ข้าม group allowlists (แต่การควบคุมด้วย mention ยังมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ใช้กำหนดค่าเริ่มต้นเมื่อ `groupPolicy` ของผู้ให้บริการไม่ได้ถูกตั้งค่า
รหัส Pairing จะหมดอายุหลัง 1 ชั่วโมง คำขอ DM pairing ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากไม่มี provider block เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มในรันไทม์จะ fallback เป็น `allowlist` (fail-closed) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลรายช่องทาง

ใช้ `channels.modelByChannel` เพื่อปักหมุด channel ID เฉพาะให้ใช้โมเดลหนึ่ง ค่าในนี้รองรับ `provider/model` หรือ model aliases ที่ตั้งค่าไว้แล้ว การแมปของช่องทางจะมีผลเมื่อเซสชันนั้นยังไม่มีการแทนที่โมเดลอยู่ก่อน (เช่น ถูกตั้งค่าผ่าน `/model`)

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

### ค่าเริ่มต้นของช่องทางและ Heartbeat

ใช้ `channels.defaults` สำหรับพฤติกรรม group-policy และ Heartbeat ที่ใช้ร่วมกันข้ามผู้ให้บริการ:

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

- `channels.defaults.groupPolicy`: นโยบายกลุ่มสำรองเมื่อไม่ได้ตั้งค่า `groupPolicy` ระดับผู้ให้บริการ
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่าได้แก่ `all` (ค่าเริ่มต้น รวมบริบทจาก quote/thread/history ทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่คงบริบท quote/reply แบบชัดเจนไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในผลลัพธ์ Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะช่องทางที่ degraded/error ในผลลัพธ์ Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงผล Heartbeat แบบกะทัดรัดในสไตล์ตัวบ่งชี้

### WhatsApp

WhatsApp ทำงานผ่าน web channel ของ Gateway (Baileys Web) โดยจะเริ่มทำงานอัตโนมัติเมื่อมี linked session อยู่

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // เครื่องหมายถูกสีน้ำเงิน (false ในโหมด self-chat)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
  web: {
    enabled: true,
    heartbeatSeconds: 60,
    reconnect: {
      initialMs: 2000,
      maxMs: 120000,
      factor: 1.4,
      jitter: 0.2,
      maxAttempts: 0,
    },
  },
}
```

<Accordion title="WhatsApp แบบหลายบัญชี">

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี มิฉะนั้นจะใช้ account id ตัวแรกที่ตั้งค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` แบบไม่บังคับจะใช้แทนกลไกเลือกบัญชีเริ่มต้นแบบ fallback นี้ เมื่อค่าตรงกับ account id ที่ตั้งค่าไว้
- legacy single-account Baileys auth dir จะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่รายบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; ปฏิเสธ symlink) โดยมี `TELEGRAM_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- `channels.telegram.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้
- ในการตั้งค่าแบบหลายบัญชี (ตั้งแต่ 2 account ids ขึ้นไป) ให้ตั้งค่า default แบบชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยง fallback routing; `openclaw doctor` จะเตือนเมื่อไม่มีหรือตั้งค่าไม่ถูกต้อง
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Telegram (การย้าย supergroup ID, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนด persistent ACP bindings สำหรับ forum topics (ใช้ canonical `chatId:topic:topicId` ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันกับ [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- Telegram stream previews ใช้ `sendMessage` + `editMessageText` (ใช้ได้ทั้งใน direct และ group chats)
- นโยบาย retry: ดู [Retry policy](/th/concepts/retry)

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
      streaming: "off", // off | partial | block | progress (progress maps to partial on Discord)
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
        spawnSubagentSessions: false, // opt-in for sessions_spawn({ thread: true })
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

- Token: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้ token นั้นสำหรับการเรียก แต่การตั้งค่า retry/policy ของบัญชียังคงมาจากบัญชีที่ถูกเลือกใน active runtime snapshot
- `channels.discord.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (guild channel) เป็น target สำหรับการส่ง โดยจะปฏิเสธ numeric ID แบบเปล่า
- slug ของ guild เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ของช่องทางใช้ชื่อที่ทำเป็น slug แล้ว (ไม่มี `#`) ควรใช้ guild IDs
- ข้อความที่บอตเขียนเองจะถูกเพิกเฉยโดยค่าเริ่มต้น `allowBots: true` จะเปิดรับข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตนี้ (แต่ยังคงกรองข้อความของตัวเองออก)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่องทาง) จะทิ้งข้อความที่ mention ผู้ใช้หรือ role อื่น แต่ไม่ได้ mention บอต (ไม่รวม @everyone/@here)
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแยกข้อความที่สูงหลายบรรทัดแม้จะยังไม่เกิน 2000 ตัวอักษร
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ระดับ Discord สำหรับฟีเจอร์เซสชันแบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางแบบ bound)
  - `idleHours`: การแทนที่ระดับ Discord สำหรับการ auto-unfocus หลังไม่มีการใช้งาน เป็นชั่วโมง (`0` คือปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ระดับ Discord สำหรับอายุสูงสุดแบบ hard limit เป็นชั่วโมง (`0` คือปิดใช้งาน)
  - `spawnSubagentSessions`: สวิตช์ opt-in สำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนด persistent ACP bindings สำหรับช่องทางและเธรด (ใช้ channel/thread id ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันกับ [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` ใช้กำหนดสีเน้นสำหรับคอนเทนเนอร์ Discord components v2
- `channels.discord.voice` เปิดใช้การสนทนาใน voice channel ของ Discord และการแทนที่ auto-join + TTS แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ถูกส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`)
- นอกจากนี้ OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก voice session แล้วเข้าร่วมใหม่หลังเกิดความล้มเหลวในการถอดรหัสซ้ำหลายครั้ง
- `channels.discord.streaming` คือคีย์โหมดสตรีมแบบ canonical ค่าเดิม `streamMode` และค่า `streaming` แบบบูลีนจะถูกย้ายให้อัตโนมัติ
- `channels.discord.autoPresence` จะแมปสถานะความพร้อมใช้งานของรันไทม์ไปยัง presence ของบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะได้แบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` จะเปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบฉุกเฉิน)
- `channels.discord.execApprovals`: การส่ง exec approval แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะทำงานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Discord user IDs ที่อนุญาตให้อนุมัติคำขอ exec หากไม่ระบุจะ fallback ไปที่ `commands.ownerAllowFrom`
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ หากไม่ระบุจะส่งต่อการอนุมัติสำหรับทุกเอเจนต์
  - `sessionFilter`: รูปแบบ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งข้อความขออนุมัติ `"dm"` (ค่าเริ่มต้น) จะส่งไปยัง DM ของผู้อนุมัติ, `"channel"` จะส่งไปยังช่องทางต้นทาง, `"both"` จะส่งไปทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้งานได้เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM สำหรับการอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลาแล้ว

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` บนทุกข้อความ)

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

- JSON ของ service account: แบบอินไลน์ (`serviceAccount`) หรืออิงไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของ service account เช่นกัน (`serviceAccountRef`)
- env fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` เป็น target สำหรับการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` จะเปิดใช้การจับคู่ email principal ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบฉุกเฉิน)

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
        nativeTransport: true, // ใช้ Slack native streaming API เมื่อ mode=partial
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

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` เป็น env fallback สำหรับบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องใช้ `botToken` ร่วมกับ `signingSecret` (ที่ระดับ root หรือรายบัญชี)
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้ง
  สตริงข้อความล้วนหรือออบเจ็กต์ SecretRef
- Slack account snapshots จะแสดงฟิลด์ source/status รายข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus` ค่า `configured_unavailable` หมายความว่าบัญชีนั้นถูก
  ตั้งค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ resolve
  ค่า secret ได้
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมของ Slack แบบ canonical ส่วน `channels.slack.streaming.nativeTransport` ควบคุม native streaming transport ของ Slack ค่าเดิม `streamMode`, `streaming` แบบบูลีน และ `nativeStreaming` จะถูกย้ายให้อัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` เป็น target สำหรับการส่ง

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันของเธรด:** `thread.historyScope` เป็นแบบรายเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่องทาง ส่วน `thread.inheritParent` จะคัดลอก transcript ของช่องทางแม่ไปยังเธรดใหม่

- Slack native streaming และสถานะเธรดแบบ "is typing..." สไตล์ Slack assistant ต้องมี target การตอบกลับแบบเธรด DM ระดับบนสุดจะอยู่นอกเธรดโดยค่าเริ่มต้น ดังนั้นจึงใช้ `typingReaction` หรือการส่งแบบปกติแทน preview แบบเธรด
- `typingReaction` จะเพิ่ม reaction ชั่วคราวบนข้อความ Slack ขาเข้าระหว่างที่กำลังตอบกลับ จากนั้นจะลบออกเมื่อเสร็จสิ้น ใช้ Slack emoji shortcode เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่ง exec approval แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ ใช้ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้ | React + แสดงรายการ reactions |
| messages     | เปิดใช้ | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้ | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้ | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้ | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost มาในรูปแบบ Plugin: `openclaw plugins install @openclaw/mattermost`

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
        // URL แบบชัดเจนที่ไม่บังคับ สำหรับการนำไปใช้หลัง reverse-proxy/สาธารณะ
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

โหมดแชท: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย prefix ที่ใช้กระตุ้น)

เมื่อเปิดใช้ Mattermost native commands:

- `commands.callbackPath` ต้องเป็น path (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw Gateway และ Mattermost server ต้องเข้าถึงได้
- Native slash callbacks จะยืนยันตัวตนด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งกลับมา
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มีการเปิดใช้
  คำสั่งใดเลย OpenClaw จะปฏิเสธ callbacks ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบ private/tailnet/internal Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนของ callback ด้วย
  ให้ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบกลับในช่องทาง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การควบคุมด้วย mention ระดับช่องทาง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การผูกบัญชีแบบไม่บังคับ
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

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ปักหมุดการเริ่มต้นช่องทางให้ใช้ Signal account identity ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้

### BlueBubbles

BlueBubbles เป็นเส้นทาง iMessage ที่แนะนำ (ขับเคลื่อนด้วย Plugin ตั้งค่าภายใต้ `channels.bluebubbles`)

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls และ actions ขั้นสูง:
      // ดู /channels/bluebubbles
    },
  },
}
```

- เส้นทางคีย์หลักที่ครอบคลุมในที่นี้: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles เข้ากับเซสชัน ACP แบบ persistent ได้ ใช้ BlueBubbles handle หรือ target string (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- การตั้งค่าช่องทาง BlueBubbles แบบเต็มมีเอกสารไว้ที่ [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw จะ spawn `imsg rpc` (JSON-RPC ผ่าน stdio) โดยไม่ต้องใช้ daemon หรือพอร์ต

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้

- ต้องมีสิทธิ์ Full Disk Access กับฐานข้อมูล Messages
- ควรใช้ target แบบ `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชท
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้ง `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` ใช้จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host key แบบเข้มงวด ดังนั้นต้องแน่ใจว่า host key ของ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบ persistent ได้ ใช้ handle ที่ถูกทำให้เป็นมาตรฐานหรือ explicit chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix ขับเคลื่อนด้วย Plugin และตั้งค่าภายใต้ `channels.matrix`

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

- การยืนยันตัวตนด้วย token ใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` จะส่งทราฟฟิก HTTP ของ Matrix ผ่าน HTTP(S) proxy ที่ระบุ บัญชีแบบมีชื่อสามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver แบบ private/internal ส่วน `proxy` และการ opt-in ด้านเครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` ใช้เลือกบัญชีที่ต้องการในกรณีตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ถูกเชิญและคำเชิญแบบ DM ใหม่จะถูกเพิกเฉยจนกว่าคุณจะตั้ง `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่ง exec approval แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะทำงานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Matrix user IDs (เช่น `@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ หากไม่ระบุจะส่งต่อการอนุมัติสำหรับทุกเอเจนต์
  - `sessionFilter`: รูปแบบ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งข้อความขออนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม DM ของ Matrix เข้ากับเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม routed peer ส่วน `per-room` จะแยกแต่ละห้อง DM ออกจากกัน
- Matrix status probes และการค้นหาไดเรกทอรีแบบสดใช้ policy ของ proxy เดียวกับทราฟฟิกรันไทม์
- การตั้งค่า Matrix แบบเต็ม กฎการระบุเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารไว้ที่ [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams ขับเคลื่อนด้วย Plugin และตั้งค่าภายใต้ `channels.msteams`

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // ดู /channels/msteams
    },
  },
}
```

- เส้นทางคีย์หลักที่ครอบคลุมในที่นี้: `channels.msteams`, `channels.msteams.configWrites`
- การตั้งค่า Teams แบบเต็ม (ข้อมูลรับรอง, webhook, นโยบาย DM/กลุ่ม, การแทนที่รายทีม/รายช่องทาง) มีเอกสารไว้ที่ [Microsoft Teams](/th/channels/msteams)

### IRC

IRC ขับเคลื่อนด้วย Plugin และตั้งค่าภายใต้ `channels.irc`

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

- เส้นทางคีย์หลักที่ครอบคลุมในที่นี้: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` แบบไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ account id ที่ตั้งค่าไว้
- การตั้งค่าช่องทาง IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) มีเอกสารไว้ที่ [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่องทาง)

รันหลายบัญชีต่อช่องทาง (แต่ละบัญชีมี `accountId` ของตัวเอง):

```json5
{
  channels: {
    telegram: {
      accounts: {
        default: {
          name: "บอตหลัก",
          botToken: "123456:ABC...",
        },
        alerts: {
          name: "บอตแจ้งเตือน",
          botToken: "987654:XYZ...",
        },
      },
    },
  },
}
```

- จะใช้ `default` เมื่อไม่ได้ระบุ `accountId` (ทั้ง CLI + การกำหนดเส้นทาง)
- Env tokens มีผลกับบัญชี **default** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานจะใช้กับทุกบัญชี เว้นแต่จะมีการแทนที่รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ของช่องทาง) ขณะที่ยังใช้ config ช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีไปยังแผนที่บัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ โดยส่วนใหญ่ช่องทางจะย้ายค่าเหล่านั้นไปไว้ที่ `channels.<channel>.accounts.default`; สำหรับ Matrix อาจคงชื่อเป้าหมายเดิม/ค่าเริ่มต้นที่ตรงกันไว้แทน
- bindings เดิมที่ผูกเฉพาะช่องทาง (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้นต่อไป; bindings แบบกำหนดขอบเขตบัญชียังคงเป็นทางเลือก
- `openclaw doctor --fix` จะซ่อมรูปร่างแบบผสมด้วย โดยย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีไปยังบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ส่วนใหญ่ช่องทางจะใช้ `accounts.default`; สำหรับ Matrix อาจคงชื่อเป้าหมายเดิม/ค่าเริ่มต้นที่ตรงกันไว้แทน

### ช่องทาง Plugin อื่นๆ

ช่องทางจาก Plugin จำนวนมากถูกตั้งค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตน (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมดได้ที่: [Channels](/th/channels)

### การควบคุมด้วย mention ในแชทกลุ่ม

โดยค่าเริ่มต้น ข้อความกลุ่มจะ **ต้องมี mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) มีผลกับ WhatsApp, Telegram, Discord, Google Chat และแชทกลุ่ม iMessage

**ประเภทของ mention:**

- **Metadata mentions**: @-mentions แบบเนทีฟของแพลตฟอร์ม จะถูกเพิกเฉยในโหมด self-chat ของ WhatsApp
- **Text patterns**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและ nested repetition ที่ไม่ปลอดภัยจะถูกเพิกเฉย
- การควบคุมด้วย mention จะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (มี native mentions หรือมีอย่างน้อยหนึ่ง pattern)

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ใช้กำหนดค่าเริ่มต้นแบบทั่วทั้งระบบ ช่องทางสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี) ตั้งค่า `0` เพื่อปิดใช้งาน

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

ลำดับการ resolve: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่จำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมด self-chat

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมด self-chat (จะเพิกเฉยต่อ native @-mentions และตอบเฉพาะ text patterns):

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

### Commands (การจัดการคำสั่งในแชท)

```json5
{
  commands: {
    native: "auto", // ลงทะเบียนคำสั่งแบบเนทีฟเมื่อรองรับ
    nativeSkills: "auto", // ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ
    text: true, // parse /commands ในข้อความแชท
    bash: false, // อนุญาต ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // อนุญาต /config
    mcp: false, // อนุญาต /mcp
    plugins: false, // อนุญาต /plugins
    debug: false, // อนุญาต /debug
    restart: true, // อนุญาต /restart + เครื่องมือ restart ของ Gateway
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

- บล็อกนี้ใช้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน ดู [Slash Commands](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์ config** ไม่ใช่แค็ตตาล็อกคำสั่งแบบเต็ม คำสั่งที่เป็นของช่องทาง/Plugin เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/Plugin ของตัวเองและใน [Slash Commands](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความ **เดี่ยวๆ** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` จะเปิดคำสั่งแบบเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ไว้ปิด
- `nativeSkills: "auto"` จะเปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ไว้ปิด
- แทนที่รายช่องทางได้ด้วย `channels.discord.commands.native` (บูลีนหรือ `"auto"`) ค่า `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้า
- แทนที่การลงทะเบียน Skills แบบเนทีฟรายช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` ใช้เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียนแบบคงอยู่ของ `/config set|unset` ยังต้องใช้ `operator.admin` เพิ่มเติม ส่วน `/config show` แบบอ่านอย่างเดียวจะยังคงใช้ได้สำหรับไคลเอนต์ operator ทั่วไปที่มีขอบเขตเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับ config ของ MCP server ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา Plugin การติดตั้ง และการควบคุมเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ใช้ควบคุมการแก้ไข config รายช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่เจาะจงบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการกระทำของเครื่องมือ restart ของ Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ owner allowlist แบบชัดเจนสำหรับคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` จะทำแฮช owner ids ใน system prompt ตั้ง `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบรายผู้ให้บริการ เมื่อมีการตั้งค่าไว้ มันจะเป็นแหล่งการอนุญาต **แหล่งเดียว** (channel allowlists/pairing และ `useAccessGroups` จะถูกเพิกเฉย)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบาย access-group ได้เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [Slash Commands](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [Channels](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่ง pairing: [Pairing](/th/channels/pairing)
  - คำสั่งการ์ดของ LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

ราก repository แบบไม่บังคับที่จะแสดงในบรรทัด Runtime ของ system prompt หากไม่ตั้งค่า OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

Skills allowlist เริ่มต้นแบบไม่บังคับสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // รับช่วง github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

- ไม่ต้องระบุ `agents.defaults.skills` หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ไม่ต้องระบุ `agents.list[].skills` หากต้องการรับช่วงค่าเริ่มต้น
- ตั้ง `agents.list[].skills: []` หากไม่ต้องการ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น
  โดยจะไม่รวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมว่าจะฉีดไฟล์ bootstrap ของ workspace เข้าไปใน system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: ในเทิร์นต่อเนื่องที่ปลอดภัย (หลังจาก assistant ตอบเสร็จสมบูรณ์) จะข้ามการฉีด bootstrap ของ workspace ซ้ำ ช่วยลดขนาด prompt ส่วนการรัน Heartbeat และการลองใหม่หลัง Compaction จะยังคงสร้างบริบทใหม่

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของ workspace ก่อนถูกตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นได้เมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความเตือนเข้า system prompt
- `"once"`: ฉีดคำเตือนหนึ่งครั้งต่อหนึ่งลายเซ็นการตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดคำเตือนทุกครั้งที่มีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณ prompt/context ปริมาณสูงหลายส่วน และถูกแยก
ตามระบบย่อยโดยตั้งใจ แทนที่จะไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude ตอนเริ่มต้นแบบครั้งเดียวสำหรับการรัน `/new` และ `/reset`
  รวมถึงไฟล์ `memory/*.md` รายวันล่าสุด
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้า system prompt
- `agents.defaults.contextLimits.*`:
  excerpt ของรันไทม์ที่มีขอบเขต และบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  ขนาด snippet และการฉีดของ indexed memory-search

ใช้การแทนที่รายเอเจนต์ที่สอดคล้องกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude บริบทเริ่มต้นของเทิร์นแรกที่ถูกฉีดในรันแบบ `/new` และ `/reset`
ที่ไม่มีข้อมูลเพิ่มเติม

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิวบริทรันไทม์ที่มีขอบเขต

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: ค่าสูงสุดเริ่มต้นของ excerpt `memory_get` ก่อนเพิ่ม
  metadata การตัดทอนและข้อความแจ้ง continuation
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ
  `lines`
- `toolResultMaxChars`: ค่าสูงสุดของผลลัพธ์เครื่องมือแบบสดที่ใช้กับผลลัพธ์ที่คงอยู่และ
  การกู้คืนเมื่อเกิด overflow
- `postCompactionMaxChars`: ค่าสูงสุดของ excerpt จาก AGENTS.md ที่ใช้ระหว่างการฉีด
  refresh หลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่รายเอเจนต์สำหรับปุ่ม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ไม่ระบุจะรับช่วง
จาก `agents.defaults.contextLimits`

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

ค่าสูงสุดทั่วทั้งระบบสำหรับรายการ Skills แบบย่อที่ฉีดเข้า system prompt ค่านี้
ไม่กระทบการอ่านไฟล์ `SKILL.md` ตามต้องการ

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

การแทนที่รายเอเจนต์สำหรับงบประมาณ prompt ของ Skills

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/tool ก่อนเรียกใช้ provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision tokens และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าสูงกว่าจะคงรายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทใน system prompt (ไม่ใช่ timestamp ของข้อความ) หากไม่ตั้งค่าจะ fallback ไปยังเขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (ตามค่ากำหนดของระบบปฏิบัติการ)

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // พารามิเตอร์ provider เริ่มต้นแบบทั่วทั้งระบบ
      embeddedHarness: {
        runtime: "auto", // auto | pi | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: รองรับทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งเฉพาะโมเดลหลัก
  - รูปแบบออบเจ็กต์จะตั้งโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: รองรับทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นค่าตั้งค่า vision-model
  - ใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่รองรับอินพุตรูปภาพ
- `imageGenerationModel`: รองรับทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถ image-generation ที่ใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าที่ใช้บ่อย: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal หรือ `openai/gpt-image-2` สำหรับ OpenAI Images
  - หากคุณเลือก provider/model โดยตรง ให้ตั้งค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` สำหรับ `openai/*`, `FAL_KEY` สำหรับ `fal/*`)
  - หากไม่ระบุ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการ image-generation ที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รองรับทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถ music-generation ที่ใช้ร่วมกัน และเครื่องมือ `music_generate` ที่มีมาในตัว
  - ค่าที่ใช้บ่อย: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.5+`
  - หากไม่ระบุ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการ music-generation ที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้ตั้งค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รองรับทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถ video-generation ที่ใช้ร่วมกัน และเครื่องมือ `video_generate` ที่มีมาในตัว
  - ค่าที่ใช้บ่อย: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากไม่ระบุ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการ video-generation ที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้ตั้งค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - ผู้ให้บริการ video-generation ของ Qwen ที่มากับระบบรองรับวิดีโอผลลัพธ์ได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ความยาว 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รองรับทั้งแบบสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากไม่ระบุ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปยังโมเดลเริ่มต้น/ของเซสชันที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่มีการส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด extraction fallback ของเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่าได้แก่ `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `elevatedDefault`: ระดับ elevated-output เริ่มต้นสำหรับเอเจนต์ ค่าได้แก่ `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.4`) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจะลองจับคู่กับ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้น และสุดท้ายจึง fallback ไปยัง provider เริ่มต้นที่ตั้งค่าไว้ (เป็นพฤติกรรมเข้ากันได้แบบเลิกใช้แล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หาก provider นั้นไม่ได้เปิดให้ใช้โมเดลเริ่มต้นที่ตั้งค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ตัวแรกที่ตั้งค่าไว้ แทนที่จะแสดงค่าเริ่มต้นเก่าของ provider ที่ถูกถอดออก
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่ตั้งค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่ทำให้รายการ allowlist เดิมหายไป เว้นแต่คุณจะส่ง `--replace`
  - flow การ configure/onboarding แบบผูกกับ provider จะรวมโมเดลของ provider ที่เลือกเข้าในแมปนี้ และคง provider อื่นที่ตั้งค่าไว้ก่อนหน้าโดยไม่แตะต้อง
- `params`: พารามิเตอร์ provider เริ่มต้นแบบทั่วทั้งระบบที่ใช้กับทุกโมเดล ตั้งที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับการ merge ของ `params` (config): `agents.defaults.params` (ฐานทั่วทั้งระบบ) จะถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ตรงกับ agent id) จะ override ตามคีย์ ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `embeddedHarness`: นโยบายรันไทม์ embedded agent ระดับล่างเริ่มต้น ใช้ `runtime: "auto"` เพื่อให้ plugin harnesses ที่ลงทะเบียนไว้อ้างสิทธิ์โมเดลที่รองรับได้, `runtime: "pi"` เพื่อบังคับใช้ PI harness ที่มีมาในตัว หรือใช้ registered harness id เช่น `runtime: "codex"` ตั้ง `fallback: "none"` เพื่อปิด automatic PI fallback
- ตัวเขียน config ที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกเป็นรูปแบบออบเจ็กต์ canonical และคงรายการ fallback เดิมไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบลำดับเดียว) ค่าเริ่มต้น: 4

### `agents.defaults.embeddedHarness`

`embeddedHarness` ควบคุมว่า executor ระดับล่างตัวใดใช้รัน embedded agent turns
โดยส่วนใหญ่ควรคงค่าเริ่มต้น `{ runtime: "auto", fallback: "pi" }`
ใช้เมื่อต้องการให้ Plugin ที่เชื่อถือได้จัดหา native harness เช่น bundled
Codex app-server harness

```json5
{
  agents: {
    defaults: {
      model: "codex/gpt-5.4",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` หรือ registered plugin harness id โดย bundled Codex plugin จะลงทะเบียน `codex`
- `fallback`: `"pi"` หรือ `"none"` ค่า `"pi"` จะคง PI harness ที่มีมาในตัวไว้เป็น compatibility fallback เมื่อไม่ได้เลือก plugin harness ส่วน `"none"` จะทำให้การเลือก plugin harness ที่หายไปหรือไม่รองรับล้มเหลว แทนที่จะเงียบแล้วใช้ PI plugin harness ที่เลือกไว้แล้วหากล้มเหลวจะถูกแสดงโดยตรงเสมอ
- การแทนที่ด้วย environment: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` ใช้แทน `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=none` จะปิด PI fallback สำหรับ process นั้น
- สำหรับ deployment ที่ใช้ Codex อย่างเดียว ให้ตั้ง `model: "codex/gpt-5.4"`, `embeddedHarness.runtime: "codex"` และ `embeddedHarness.fallback: "none"`
- สิ่งนี้ควบคุมเฉพาะ embedded chat harness เท่านั้น ส่วนการสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังใช้ค่าตั้งค่า provider/model ของมันเอง

**alias shorthands ที่มีมาในตัว** (มีผลเฉพาะเมื่อโมเดลนั้นอยู่ใน `agents.defaults.models`):

| Alias               | Model                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.4`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

aliases ที่คุณตั้งค่าไว้จะมีความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมด thinking อัตโนมัติ เว้นแต่คุณจะตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI จะเปิดใช้ `tool_stream` โดยค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้ง `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 จะใช้ค่าเริ่มต้น thinking แบบ `adaptive` เมื่อไม่ได้ตั้งระดับ thinking ไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

CLI backends แบบไม่บังคับสำหรับการรัน fallback ที่เป็นข้อความล้วน (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อ API providers ล้มเหลว

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backends เน้นข้อความเป็นหลัก; เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อมีการตั้ง `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับ file paths

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งชุดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือรายเอเจนต์ (`agents.list[].systemPromptOverride`) ค่ารายเอเจนต์มีความสำคัญสูงกว่า ส่วนค่าที่ว่างหรือมีแต่ช่องว่างจะถูกเพิกเฉย เหมาะสำหรับการทดลอง prompt แบบควบคุม

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

prompt overlays ที่ไม่ขึ้นกับ provider และใช้ตาม family ของโมเดล model ids ในตระกูล GPT-5 จะได้รับ behavior contract แบบใช้ร่วมกันข้าม providers ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` จะเปิดเลเยอร์การโต้ตอบแบบเป็นมิตร
- `"off"` จะปิดเฉพาะเลเยอร์ที่เป็นมิตร; GPT-5 behavior contract ที่มีแท็กไว้ยังคงเปิดใช้งาน
- ค่าเดิม `plugins.entries.openai.config.personality` จะยังถูกอ่านเมื่อการตั้งค่าร่วมนี้ยังไม่ได้ตั้ง

### `agents.defaults.heartbeat`

การรัน Heartbeat แบบเป็นระยะ

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m คือปิดใช้งาน
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // ค่าเริ่มต้น: true; false จะไม่รวมส่วน Heartbeat ใน system prompt
        lightContext: false, // ค่าเริ่มต้น: false; true จะคงไว้เฉพาะ HEARTBEAT.md จากไฟล์ bootstrap ของ workspace
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรัน Heartbeat แต่ละครั้งในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (ค่าเริ่มต้น) | block
        target: "none", // ค่าเริ่มต้น: none | ตัวเลือก: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วย API key) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะไม่รวมส่วน Heartbeat ใน system prompt และข้ามการฉีด `HEARTBEAT.md` เข้า bootstrap context ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตให้ Heartbeat agent turn ทำงานก่อนถูกยกเลิก หากไม่ตั้งค่าจะใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบ direct/DM ค่า `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายแบบ direct ส่วน `block` จะระงับการส่งแบบ direct-target และปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้ bootstrap context แบบเบา และเก็บไว้เฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะทำงานในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกแบบเดียวกับ cron `sessionTarget: "isolated"` ช่วยลดค่าใช้ token ต่อ Heartbeat จากประมาณ ~100K เหลือ ~2-5K tokens
- รายเอเจนต์: ตั้งที่ `agents.list[].heartbeat` เมื่อมีเอเจนต์ใดกำหนด `heartbeat` แล้ว จะมี **เฉพาะเอเจนต์เหล่านั้น** ที่รัน Heartbeat
- Heartbeat จะรันเป็น agent turns แบบเต็ม — ช่วงเวลาที่สั้นลงจะใช้ tokens มากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id ของ registered compaction provider plugin (ไม่บังคับ)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // ใช้เมื่อ identifierPolicy=custom
        postCompactionSections: ["Session Startup", "Red Lines"], // [] จะปิดการฉีดซ้ำ
        model: "openrouter/anthropic/claude-sonnet-4-6", // การแทนที่โมเดลเฉพาะ compaction แบบไม่บังคับ
        notifyUser: true, // ส่งข้อความสั้นๆ เมื่อ compaction เริ่มต้นและเสร็จสิ้น (ค่าเริ่มต้น: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งเป็นช่วงสำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ registered compaction provider plugin เมื่อมีการตั้งค่า จะเรียก `summarize()` ของ provider แทนการสรุปด้วย LLM ที่มีมาในตัว และจะ fallback ไปใช้แบบมีมาในตัวเมื่อเกิดความล้มเหลว การตั้ง provider จะบังคับใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการทำ compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` ค่า `strict` จะเติมแนวทางการเก็บ opaque identifiers ที่มีมาในตัวไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความการรักษา identifiers แบบกำหนดเองที่ใช้เมื่อ `identifierPolicy=custom`
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบไม่บังคับที่จะฉีดกลับเข้ามาหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งเป็น `[]` เพื่อปิดการฉีดซ้ำ เมื่อไม่ตั้งค่าหรือกำหนดเป็นคู่นี้อย่างชัดเจน ระบบจะยอมรับหัวข้อเก่า `Every Session`/`Safety` เป็น fallback แบบ legacy ด้วย
- `model`: การแทนที่ `provider/model-id` แบบไม่บังคับสำหรับการสรุป Compaction เท่านั้น ใช้เมื่อเซสชันหลักควรคงใช้โมเดลหนึ่ง แต่สรุป Compaction ควรรันด้วยอีกโมเดลหนึ่ง หากไม่ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `notifyUser`: เมื่อเป็น `true` จะส่งข้อความสั้นๆ ให้ผู้ใช้เมื่อ Compaction เริ่มต้นและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดไว้โดยค่าเริ่มต้นเพื่อให้ Compaction ทำงานแบบเงียบ
- `memoryFlush`: agentic turn แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำที่คงทน จะถูกข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

### `agents.defaults.contextPruning`

ตัด **ผลลัพธ์เครื่องมือเก่า** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติเซสชันบนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยเริ่มต้น: นาที
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="พฤติกรรมของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้รอบการ pruning
- `ttl` ควบคุมว่าจะรัน pruning ได้อีกครั้งเมื่อใด (หลังการแตะ cache ครั้งล่าสุด)
- การ pruning จะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินไปก่อน จากนั้นจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากยังจำเป็น

**Soft-trim** จะเก็บส่วนต้น + ส่วนท้ายไว้ และแทรก `...` ตรงกลาง

**Hard-clear** จะแทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนเป็นแบบอิงจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวน token แบบตรงตัว
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` จะข้ามการ pruning

</Accordion>

ดูรายละเอียดพฤติกรรมได้ที่ [Session Pruning](/th/concepts/session-pruning)

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (ใช้ minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การแทนที่รายช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และแบบรายบัญชี) โดย Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหน่วงเวลาแบบสุ่มระหว่างบล็อกของการตอบกลับ ค่า `natural` = 800–2500ms การแทนที่รายเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรม + การแบ่ง chunk ได้ที่ [Streaming](/th/concepts/streaming)

### ตัวบ่งชี้การกำลังพิมพ์

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- ค่าเริ่มต้น: `instant` สำหรับ direct chats/mentions, `message` สำหรับแชทกลุ่มที่ไม่มี mention
- การแทนที่รายเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [Typing Indicators](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandbox แบบไม่บังคับสำหรับ embedded agent ดูคู่มือเต็มได้ที่ [Sandboxing](/th/gateway/sandboxing)

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // รองรับ SecretRefs / เนื้อหาแบบอินไลน์ด้วย:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="รายละเอียด Sandbox">

**Backend:**

- `docker`: Docker runtime ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: remote runtime แบบอิง SSH ทั่วไป
- `openshell`: OpenShell runtime

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การตั้งค่า SSH backend:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่ง SSH client (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: remote root แบบ absolute ที่ใช้สำหรับ workspaces ตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่แล้วและส่งต่อไปยัง OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw จะ materialize เป็นไฟล์ชั่วคราวในรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีความสำคัญเหนือ `identityFile`
- `certificateData` มีความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีความสำคัญเหนือ `knownHostsFile`
- ค่า `*Data` ที่อิง SecretRef จะถูก resolve จาก active secrets runtime snapshot ก่อนเซสชัน sandbox จะเริ่ม

**พฤติกรรมของ SSH backend:**

- seed remote workspace หนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นจะถือ remote SSH workspace เป็น canonical
- กำหนดเส้นทาง `exec`, เครื่องมือไฟล์ และ media paths ผ่าน SSH
- จะไม่ซิงก์การเปลี่ยนแปลงบน remote กลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับ sandbox browser containers

**การเข้าถึง Workspace:**

- `none`: sandbox workspace ตาม scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: sandbox workspace ที่ `/workspace`, agent workspace ถูก mount แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: agent workspace ถูก mount แบบอ่านเขียนที่ `/workspace`

**Scope:**

- `session`: container + workspace ต่อเซสชัน
- `agent`: container + workspace หนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: container และ workspace แบบใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**การตั้งค่า OpenShell plugin:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // ไม่บังคับ
          gatewayEndpoint: "https://lab.example", // ไม่บังคับ
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // ไม่บังคับ
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมด OpenShell:**

- `mirror`: seed remote จาก local ก่อน `exec` แล้ว sync กลับหลัง `exec`; local workspace ยังคงเป็น canonical
- `remote`: seed remote หนึ่งครั้งเมื่อ sandbox ถูกสร้าง จากนั้นให้ remote workspace เป็น canonical

ในโหมด `remote` การแก้ไขบนโฮสต์ในเครื่องที่ทำนอก OpenClaw จะไม่ถูก sync เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งใช้ SSH เข้าสู่ OpenShell sandbox แต่ Plugin เป็นผู้ดูแลวงจรชีวิต sandbox และการ sync แบบ mirror ที่ไม่บังคับ

**`setupCommand`** จะรันหนึ่งครั้งหลังสร้าง container (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้ และผู้ใช้ root

**Containers มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือ custom bridge network) หากเอเจนต์ต้องการการเข้าถึงขาออก
ค่า `"host"` ถูกบล็อก ส่วน `"container:<id>"` จะถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้ง
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (โหมดฉุกเฉิน)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ของ workspace ที่ใช้งานอยู่

**`docker.binds`** ใช้ mount ไดเรกทอรีโฮสต์เพิ่มเติม; binds ระดับทั่วทั้งระบบและรายเอเจนต์จะถูกรวมกัน

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP ใน container โดย URL ของ noVNC จะถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC แบบสังเกตการณ์ใช้ VNC auth โดยค่าเริ่มต้น และ OpenClaw จะปล่อย URL แบบโทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) จะบล็อกไม่ให้เซสชัน sandboxed กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (dedicated bridge network) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการ global bridge connectivity อย่างชัดเจน
- `cdpSourceRange` ใช้จำกัด CDP ingress ที่ขอบ container ให้เหลือช่วง CIDR ที่ระบุได้แบบไม่บังคับ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` ใช้ mount ไดเรกทอรีโฮสต์เพิ่มเติมเข้า browser container ของ sandbox เท่านั้น เมื่อมีการตั้งค่า (รวมถึง `[]`) มันจะใช้แทน `docker.binds` สำหรับ browser container
- ค่าเริ่มต้นของการเปิดตัวถูกกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับให้เหมาะกับโฮสต์แบบ container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (เปิดใช้งานโดยค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` ถูก
    เปิดใช้โดยค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` จะเปิดใช้งาน extensions อีกครั้งหาก workflow ของคุณ
    ต้องพึ่งพามัน
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้
    ขีดจำกัด process เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` และ `--disable-setuid-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นเหล่านี้คือ baseline ของ container image; ใช้ custom browser image พร้อม custom
    entrypoint เพื่อเปลี่ยนค่าเริ่มต้นของ container

</Accordion>

browser sandboxing และ `sandbox.docker.binds` ใช้ได้เฉพาะกับ Docker เท่านั้น

สร้าง images:

```bash
scripts/sandbox-setup.sh           # image sandbox หลัก
scripts/sandbox-browser-setup.sh   # browser image แบบไม่บังคับ
```

### `agents.list` (การแทนที่รายเอเจนต์)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // หรือ { primary, fallbacks }
        thinkingDefault: "high", // การแทนที่ระดับ thinking รายเอเจนต์
        reasoningDefault: "on", // การแทนที่การมองเห็น reasoning รายเอเจนต์
        fastModeDefault: false, // การแทนที่ fast mode รายเอเจนต์
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // override matching defaults.models params ตามคีย์
        skills: ["docs-search"], // แทนที่ agents.defaults.skills เมื่อมีการตั้งค่า
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: agent id แบบคงที่ (จำเป็น)
- `default`: หากตั้งหลายตัว ตัวแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่มีการตั้ง ตัวแรกในรายการจะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะ override เฉพาะ `primary`; รูปแบบออบเจ็กต์ `{ primary, fallbacks }` จะ override ทั้งคู่ (`[]` จะปิด global fallbacks) งาน Cron ที่ override เฉพาะ `primary` จะยังรับช่วง default fallbacks เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: stream params รายเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับการ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำสำเนาแค็ตตาล็อกโมเดลทั้งชุด
- `skills`: Skills allowlist รายเอเจนต์แบบไม่บังคับ หากไม่ระบุ เอเจนต์จะรับช่วง `agents.defaults.skills` เมื่อมีการตั้งค่า; รายการแบบชัดเจนจะใช้แทนค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นรายเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) จะ override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการ override รายข้อความหรือรายเซสชัน
- `reasoningDefault`: ค่าการมองเห็น reasoning เริ่มต้นรายเอเจนต์แบบไม่บังคับ (`on | off | stream`) จะใช้เมื่อไม่มีการ override reasoning รายข้อความหรือรายเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นของ fast mode รายเอเจนต์แบบไม่บังคับ (`true | false`) จะใช้เมื่อไม่มีการ override fast-mode รายข้อความหรือรายเซสชัน
- `embeddedHarness`: การ override นโยบาย low-level harness รายเอเจนต์แบบไม่บังคับ ใช้ `{ runtime: "codex", fallback: "none" }` เพื่อทำให้เอเจนต์หนึ่งใช้ Codex เท่านั้น ขณะที่เอเจนต์อื่นยังคงใช้ PI fallback เริ่มต้น
- `runtime`: runtime descriptor รายเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธแบบ relative กับ workspace, URL `http(s)` หรือ URI แบบ `data:`
- `identity` จะอนุมานค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ agent ids สำหรับ `sessions_spawn` (`["*"]` = ได้ทุกตัว; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่ทำงานโดยไม่มี sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ไม่ระบุ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

รันหลายเอเจนต์แบบแยกขาดจากกันภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### ฟิลด์การจับคู่ของ Binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะถือเป็น route), `acp` สำหรับ persistent ACP conversation bindings
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = ทุกบัญชี; หากไม่ระบุ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; ใช้ได้เฉพาะ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงตัว, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` ตัวแรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ตาม identity ของการสนทนาแบบตรงตัว (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับการกำหนดเส้นทางด้านบน

### โปรไฟล์การเข้าถึงรายเอเจนต์

<Accordion title="การเข้าถึงเต็มรูปแบบ (ไม่มี sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="เครื่องมือ + workspace แบบอ่านอย่างเดียว">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ไม่มีการเข้าถึงไฟล์ระบบ (ส่งข้อความอย่างเดียว)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

ดูรายละเอียดลำดับความสำคัญได้ที่ [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools)

---

## เซสชัน

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ข้าม parent-thread fork เมื่อเกินจำนวน token นี้ (0 คือปิดใช้งาน)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // ระยะเวลา หรือ false
      maxDiskBytes: "500mb", // hard budget แบบไม่บังคับ
      highWaterBytes: "400mb", // เป้าหมายการ cleanup แบบไม่บังคับ
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus เป็นชั่วโมง (`0` คือปิดใช้งาน)
      maxAgeHours: 0, // default hard max age เป็นชั่วโมง (`0` คือปิดใช้งาน)
    },
    mainKey: "main", // แบบเดิม (รันไทม์จะใช้ "main" เสมอ)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์เซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานในการจัดกลุ่มเซสชันสำหรับบริบทแชทกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะมีเซสชันแยกกันภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางจะแชร์เซสชันเดียวกันร่วมกัน (ใช้เฉพาะเมื่อคุณตั้งใจให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้ main session ร่วมกัน
  - `per-peer`: แยกตาม sender id ข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับ inbox หลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป canonical ids ไปยัง peers ที่มี provider prefix สำหรับการแชร์เซสชันข้ามช่องทาง
- **`reset`**: นโยบายรีเซ็ตหลัก ค่า `daily` จะรีเซ็ตที่เวลา `atHour` ตามเวลาท้องถิ่น; ค่า `idle` จะรีเซ็ตหลัง `idleMinutes` เมื่อมีการตั้งค่าทั้งสองอย่าง ระบบจะใช้ตัวที่หมดอายุก่อน
- **`resetByType`**: การแทนที่รายประเภท (`direct`, `group`, `thread`) โดย `dm` แบบเดิมยังรับได้เป็น alias ของ `direct`
- **`parentForkMaxTokens`**: จำนวน `totalTokens` สูงสุดของ parent-session ที่อนุญาตเมื่อสร้าง forked thread session (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของ parent สูงกว่าค่านี้ OpenClaw จะเริ่ม thread session ใหม่แทนการรับช่วงประวัติ transcript ของ parent
  - ตั้งเป็น `0` เพื่อปิด guard นี้และอนุญาต parent forking เสมอ
- **`mainKey`**: ฟิลด์แบบเดิม รันไทม์จะใช้ `"main"` เสมอสำหรับบัคเก็ต direct-chat หลัก
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบ reply-back สูงสุดระหว่างเอเจนต์ในระหว่างการแลกเปลี่ยนแบบ agent-to-agent (จำนวนเต็ม ช่วง: `0`–`5`) ค่า `0` จะปิด ping-pong chaining
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` โดยมี alias แบบเดิมคือ `dm`), `keyPrefix` หรือ `rawKeyPrefix` โดย deny ตัวแรกที่ตรงกันจะมีผล
- **`maintenance`**: การ cleanup + การเก็บรักษา session-store
  - `mode`: `warn` จะเตือนอย่างเดียว; `enforce` จะทำ cleanup จริง
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่าที่ไม่ใช้งาน (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`)
  - `rotateBytes`: หมุน `sessions.json` เมื่อเกินขนาดนี้ (ค่าเริ่มต้น `10mb`)
  - `resetArchiveRetention`: ระยะเวลาเก็บ transcript archives แบบ `*.reset.<timestamp>` ค่าเริ่มต้นจะเท่ากับ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifacts/sessions ที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายหลัง cleanup ตามงบประมาณแบบไม่บังคับ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นทั่วทั้งระบบสำหรับฟีเจอร์เซสชันแบบผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับ auto-unfocus เมื่อไม่มีการใช้งาน เป็นชั่วโมง (`0` คือปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: ค่าเริ่มต้นสำหรับ hard max age เป็นชั่วโมง (`0` คือปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)

</Accordion>

---

## ข้อความ

```json5
{
  messages: {
    responsePrefix: "🦞", // หรือ "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 คือปิดใช้งาน
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### คำนำหน้าการตอบกลับ

การแทนที่รายช่องทาง/รายบัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การ resolve (ตัวที่เจาะจงที่สุดชนะ): account → channel → global ค่า `""` จะปิดใช้งานและหยุดการไล่ระดับ ค่า `"auto"` จะอนุมานเป็น `[{identity.name}]`

**ตัวแปรในเทมเพลต:**

| Variable          | Description            | Example                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม  | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อ provider          | `anthropic`                 |
| `{thinkingLevel}` | ระดับ thinking ปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์    | (เหมือนกับ `"auto"`)          |

ตัวแปรไม่แยกตัวพิมพ์เล็กใหญ่ `{think}` เป็น alias ของ `{thinkingLevel}`

### Ack reaction

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่กำลังใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- การแทนที่รายช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการ resolve: account → channel → `messages.ackReaction` → identity fallback
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับใน Slack, Discord และ Telegram
- `messages.statusReactions.enabled`: เปิดใช้ status reactions ตามวงจรสถานะใน Slack, Discord และ Telegram
  ใน Slack และ Discord หากไม่ตั้งค่า จะคงเปิด status reactions ไว้เมื่อ ack reactions ทำงานอยู่
  ใน Telegram ต้องตั้งเป็น `true` อย่างชัดเจนเพื่อเปิดใช้ lifecycle status reactions

### Inbound debounce

รวมข้อความตัวอักษรล้วนที่ส่งมาอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็น agent turn เดียว ส่วน media/attachments จะ flush ทันที คำสั่งควบคุมจะข้ามการทำ debouncing

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      elevenlabs: {
        apiKey: "elevenlabs_api_key",
        baseUrl: "https://api.elevenlabs.io",
        voiceId: "voice_id",
        modelId: "eleven_multilingual_v2",
        seed: 42,
        applyTextNormalization: "auto",
        languageCode: "en",
        voiceSettings: {
          stability: 0.5,
          similarityBoost: 0.75,
          style: 0.0,
          useSpeakerBoost: true,
          speed: 1.0,
        },
      },
      openai: {
        apiKey: "openai_api_key",
        baseUrl: "https://api.openai.com/v1",
        model: "gpt-4o-mini-tts",
        voice: "alloy",
      },
    },
  },
}
```

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` โดย `/tts on|off` สามารถ override ค่ากำหนดเฉพาะเครื่องได้ และ `/tts status` จะแสดงสถานะที่มีผลจริง
- `summaryModel` ใช้ override `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` ถูกเปิดใช้โดยค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้อง opt-in)
- API keys จะ fallback ไปยัง `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- `openai.baseUrl` ใช้ override endpoint ของ OpenAI TTS ลำดับการ resolve คือ config แล้วจึง `OPENAI_TTS_BASE_URL` แล้วจึง `https://api.openai.com/v1`
- เมื่อ `openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ของ OpenAI, OpenClaw จะถือว่าเป็น OpenAI-compatible TTS server และผ่อนคลายการตรวจสอบ model/voice

---

## Talk

ค่าเริ่มต้นสำหรับโหมด Talk (macOS/iOS/Android)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อมีการตั้งค่า Talk providers หลายตัว
- คีย์ Talk แบบแบนในรูปแบบเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- Voice IDs จะ fallback ไปยัง `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รองรับทั้งสตริงข้อความล้วนหรือออบเจ็กต์ SecretRef
- `ELEVENLABS_API_KEY` fallback จะมีผลเฉพาะเมื่อไม่มีการตั้งค่า Talk API key
- `providers.*.voiceAliases` ช่วยให้คำสั่งของ Talk ใช้ชื่อที่เป็นมิตรได้
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk จะรอหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่า จะใช้หน้าต่างพักเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ใช้กำหนด base allowlist ก่อน `tools.allow`/`tools.deny`

local onboarding จะตั้งค่า local configs ใหม่เป็น `tools.profile: "coding"` โดยค่าเริ่มต้นเมื่อไม่ได้ตั้งไว้ (โปรไฟล์ที่ตั้งไว้อย่างชัดเจนเดิมจะคงไว้)

| Profile     | Includes                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ตั้งค่า)                                                                                                  |

### กลุ่มเครื่องมือ

| Group              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ใช้เป็น alias ของ `exec` ได้)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | เครื่องมือที่มีมาในตัวทั้งหมด (ไม่รวม provider plugins)                                                                          |

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือแบบทั่วทั้งระบบ (deny มีผลเหนือกว่า) ไม่สนตัวพิมพ์เล็กใหญ่ และรองรับไวลด์การ์ด `*` มีผลแม้ตอนปิด Docker sandbox

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับ providers หรือโมเดลเฉพาะ ลำดับคือ: base profile → provider profile → allow/deny

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.elevated`

ควบคุมการเข้าถึง exec แบบ elevated นอก sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- การแทนที่รายเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัดเพิ่มได้เท่านั้น
- `/elevated on|off|ask|full` จะเก็บสถานะแยกตามเซสชัน; inline directives มีผลกับข้อความเดียว
- `exec` แบบ elevated จะข้าม sandboxing และใช้ escape path ที่ตั้งค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมายของ exec คือ `node`)

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.4"],
      },
    },
  },
}
```

### `tools.loopDetection`

การตรวจสอบความปลอดภัยจาก tool-loop จะ **ปิดไว้โดยค่าเริ่มต้น** ตั้ง `enabled: true` เพื่อเปิดใช้การตรวจจับ
การตั้งค่าสามารถกำหนดได้ทั่วทั้งระบบใน `tools.loopDetection` และ override รายเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

- `historySize`: ขนาดประวัติการเรียกใช้เครื่องมือสูงสุดที่เก็บไว้เพื่อวิเคราะห์ loop
- `warningThreshold`: เกณฑ์ของรูปแบบซ้ำแบบไม่มีความคืบหน้าสำหรับการเตือน
- `criticalThreshold`: เกณฑ์ซ้ำที่สูงขึ้นสำหรับบล็อก loop ระดับวิกฤต
- `globalCircuitBreakerThreshold`: เกณฑ์หยุดแบบ hard stop สำหรับการรันใดๆ ที่ไม่มีความคืบหน้า
- `detectors.genericRepeat`: เตือนเมื่อมีการเรียกใช้เครื่องมือเดิม/อาร์กิวเมนต์เดิมซ้ำ
- `detectors.knownPollNoProgress`: เตือน/บล็อกสำหรับเครื่องมือ poll ที่รู้จัก (`process.poll`, `command_status` ฯลฯ)
- `detectors.pingPong`: เตือน/บล็อกสำหรับรูปแบบคู่สลับไปมาที่ไม่มีความคืบหน้า
- หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบจะล้มเหลว

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // หรือ env `BRAVE_API_KEY`
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // ไม่บังคับ; ไม่ระบุเพื่อ auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

กำหนดค่าการทำความเข้าใจสื่อขาเข้า (ภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: ส่งเพลง/วิดีโอ async ที่เสร็จแล้วไปยังช่องทางโดยตรง
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<Accordion title="ฟิลด์ของ media model entry">

**Provider entry** (`type: "provider"` หรือไม่ระบุ):

- `provider`: API provider id (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
- `model`: การแทนที่ model id
- `profile` / `preferredProfile`: การเลือกโปรไฟล์จาก `auth-profiles.json`

**CLI entry** (`type: "cli"`):

- `command`: executable ที่จะรัน
- `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ)

**ฟิลด์ร่วม:**

- `capabilities`: รายการแบบไม่บังคับ (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนที่ราย entry
- หากล้มเหลวจะ fallback ไปยัง entry ถัดไป

การยืนยันตัวตนของ provider ใช้ลำดับมาตรฐาน: `auth-profiles.json` → env vars → `models.providers.*.apiKey`

**ฟิลด์ของ async completion:**

- `asyncCompletion.directSend`: เมื่อเป็น `true`, งาน `music_generate`
  และ `video_generate` แบบ async ที่เสร็จแล้วจะพยายามส่งไปยังช่องทางโดยตรงก่อน ค่าเริ่มต้น: `false`
  (ใช้เส้นทางเดิมแบบปลุก requester-session/model-delivery)

</Accordion>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

ควบคุมว่าเครื่องมือเซสชัน (`sessions_list`, `sessions_history`, `sessions_send`) จะกำหนดเป้าหมายไปยังเซสชันใดได้บ้าง

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่ถูก spawn จากมัน เช่น subagents)

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

หมายเหตุ:

- `self`: เฉพาะ session key ปัจจุบัน
- `tree`: เซสชันปัจจุบัน + เซสชันที่ถูก spawn โดยเซสชันปัจจุบัน (subagents)
- `agent`: ทุกเซสชันที่เป็นของ agent id ปัจจุบัน (อาจรวมผู้ใช้อื่นหากคุณรันเซสชันแบบ per-sender ภายใต้ agent id เดียวกัน)
- `all`: ทุกเซสชัน อย่างไรก็ตาม การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
- การบีบขอบเขตจาก sandbox: เมื่อเซสชันปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, visibility จะถูกบังคับเป็น `tree` แม้ `tools.sessions.visibility="all"`

### `tools.sessions_spawn`

ควบคุมการรองรับไฟล์แนบแบบอินไลน์สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: ตั้งเป็น true เพื่ออนุญาตไฟล์แนบแบบอินไลน์
        maxTotalBytes: 5242880, // รวมทุกไฟล์สูงสุด 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB ต่อไฟล์
        retainOnSessionKeep: false, // เก็บไฟล์แนบไว้เมื่อ cleanup="keep"
      },
    },
  },
}
```

หมายเหตุ:

- รองรับไฟล์แนบเฉพาะ `runtime: "subagent"` เท่านั้น ส่วน ACP runtime จะปฏิเสธ
- ไฟล์จะถูก materialize ลงใน child workspace ที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
- เนื้อหาไฟล์แนบจะถูกปกปิดจากการเก็บ transcript โดยอัตโนมัติ
- อินพุต Base64 จะถูกตรวจสอบด้วยการเช็ก alphabet/padding อย่างเข้มงวด และมีตัวป้องกันขนาดก่อน decode
- สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
- การ cleanup เป็นไปตามนโยบาย `cleanup`: ค่า `delete` จะลบไฟล์แนบเสมอ; ค่า `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือที่มีมาในตัวแบบทดลอง ค่าเริ่มต้นปิด เว้นแต่กฎเปิดใช้อัตโนมัติของ strict-agentic GPT-5 จะมีผล

```json5
{
  tools: {
    experimental: {
      planTool: true, // เปิดใช้ update_plan แบบทดลอง
    },
  },
}
```

หมายเหตุ:

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือการแทนที่รายเอเจนต์) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรัน OpenAI หรือ OpenAI Codex ตระกูล GPT-5 ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือตั้งเป็น `false` เพื่อคงปิดไว้แม้สำหรับการรัน strict-agentic GPT-5
- เมื่อเปิดใช้ system prompt จะเพิ่มแนวทางการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีเนื้อหาสาระ และคงให้มีอย่างมากหนึ่งขั้นตอนที่เป็น `in_progress`

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: โมเดลเริ่มต้นสำหรับ sub-agents ที่ถูก spawn หากไม่ระบุ sub-agents จะรับช่วงโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ target agent ids สำหรับ `sessions_spawn` เมื่อ requester agent ไม่ได้ตั้ง `subagents.allowAgents` ของตัวเอง (`["*"]` = ได้ทุกตัว; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกใช้เครื่องมือไม่ได้ระบุ `runTimeoutSeconds` ค่า `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือราย subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## Providers แบบกำหนดเองและ base URLs

OpenClaw ใช้แค็ตตาล็อกโมเดลที่มีมาในตัว เพิ่ม providers แบบกำหนดเองผ่าน `models.providers` ใน config หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

```json5
{
  models: {
    mode: "merge", // merge (ค่าเริ่มต้น) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

- ใช้ `authHeader: true` ร่วมกับ `headers` สำหรับความต้องการด้านการยืนยันตัวตนแบบกำหนดเอง
- แทนที่ราก config ของเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ของ environment variable แบบเดิม)
- ลำดับการ merge สำหรับ provider IDs ที่ตรงกัน:
  - ค่า `baseUrl` ใน agent `models.json` ที่ไม่ว่างจะมีผลเหนือกว่า
  - ค่า `apiKey` ใน agent ที่ไม่ว่างจะมีผลเหนือกว่าเฉพาะเมื่อ provider นั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
  - ค่า `apiKey` ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการบันทึก secrets ที่ resolve แล้ว
  - ค่า header ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
  - ค่า `apiKey`/`baseUrl` ของ agent ที่ว่างหรือไม่มี จะ fallback ไปที่ `models.providers` ใน config
  - ค่า `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่าง explicit config และค่า implicit จากแค็ตตาล็อก
  - ค่า `contextTokens` ของโมเดลที่ตรงกันจะคง explicit runtime cap ไว้เมื่อมีอยู่; ใช้สิ่งนี้เมื่อคุณต้องการจำกัด effective context โดยไม่เปลี่ยน metadata ดั้งเดิมของโมเดล
  - ใช้ `models.mode: "replace"` เมื่อต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
  - การคงอยู่ของ marker เป็นไปตามแหล่งที่มาอย่างเคร่งครัด: markers จะถูกเขียนจาก active source config snapshot (ก่อนการ resolve) ไม่ใช่จากค่า runtime secret ที่ resolve แล้ว

### รายละเอียดฟิลด์ของ Provider

- `models.mode`: พฤติกรรมของแค็ตตาล็อก provider (`merge` หรือ `replace`)
- `models.providers`: แผนที่ของ providers แบบกำหนดเอง โดยคีย์เป็น provider id
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเข้าไป `config set` จะปฏิเสธการแทนที่แบบทำลายของเดิม เว้นแต่คุณจะส่ง `--replace`
- `models.providers.*.api`: request adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` ฯลฯ)
- `models.providers.*.apiKey`: ข้อมูลรับรองของ provider (ควรใช้ SecretRef/env substitution)
- `models.providers.*.auth`: กลยุทธ์การยืนยันตัวตน (`api-key`, `token`, `oauth`, `aws-sdk`)
- `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ฉีด `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
- `models.providers.*.authHeader`: บังคับให้ส่งข้อมูลรับรองใน header `Authorization` เมื่อจำเป็น
- `models.providers.*.baseUrl`: upstream API base URL
- `models.providers.*.headers`: headers แบบคงที่เพิ่มเติมสำหรับการกำหนดเส้นทางผ่าน proxy/tenant
- `models.providers.*.request`: transport overrides สำหรับคำขอ HTTP ของ model-provider
  - `request.headers`: headers เพิ่มเติม (merge กับค่าเริ่มต้นของ provider) ค่าต่างๆ รองรับ SecretRef
  - `request.auth`: การแทนที่กลยุทธ์ auth โหมดได้แก่ `"provider-default"` (ใช้ auth ที่มีมาในตัวของ provider), `"authorization-bearer"` (ใช้ร่วมกับ `token`), `"header"` (ใช้ร่วมกับ `headerName`, `value`, และ `prefix` แบบไม่บังคับ)
  - `request.proxy`: การแทนที่ HTTP proxy โหมดได้แก่ `"env-proxy"` (ใช้ env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (ใช้ร่วมกับ `url`) ทั้งสองโหมดรองรับ sub-object `tls` แบบไม่บังคับ
  - `request.tls`: การแทนที่ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์ได้แก่ `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
  - `request.allowPrivateNetwork`: เมื่อเป็น `true` จะอนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve ไปยังช่วง private, CGNAT หรือช่วงลักษณะคล้ายกัน ผ่านตัวป้องกัน HTTP fetch SSRF ของ provider (เป็นการ opt-in โดยผู้ดูแลระบบสำหรับ OpenAI-compatible endpoints แบบ self-hosted ที่เชื่อถือได้) ส่วน WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ผ่าน SSRF gate ของ fetch นี้ ค่าเริ่มต้น `false`
- `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของ provider แบบ explicit
- `models.providers.*.models.*.contextWindow`: metadata ของ native model context window
- `models.providers.*.models.*.contextTokens`: runtime context cap แบบไม่บังคับ ใช้สิ่งนี้เมื่อคุณต้องการ effective context budget ที่เล็กกว่า `contextWindow` ดั้งเดิมของโมเดล
- `models.providers.*.models.*.compat.supportsDeveloperRole`: compatibility hint แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` ที่ไม่ว่างและไม่ใช่แบบเนทีฟ (โฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ในรันไทม์ หาก `baseUrl` ว่างหรือไม่ระบุ จะคงพฤติกรรม OpenAI เริ่มต้นไว้
- `models.providers.*.models.*.compat.requiresStringContent`: compatibility hint แบบไม่บังคับสำหรับ OpenAI-compatible chat endpoints ที่รับได้เฉพาะสตริง เมื่อเป็น `true` OpenClaw จะ flatten `messages[].content` arrays ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
- `plugins.entries.amazon-bedrock.config.discovery`: รากของการตั้งค่า Bedrock auto-discovery
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS region สำหรับ discovery
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบไม่บังคับสำหรับ targeted discovery
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลา polling สำหรับการรีเฟรช discovery
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback context window สำหรับโมเดลที่ค้นพบ
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback max output tokens สำหรับโมเดลที่ค้นพบ

### ตัวอย่าง Provider

<Accordion title="Cerebras (GLM 4.6 / 4.7)">

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: {
        primary: "cerebras/zai-glm-4.7",
        fallbacks: ["cerebras/zai-glm-4.6"],
      },
      models: {
        "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
        "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
          { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
        ],
      },
    },
  },
}
```

ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras; ใช้ `zai/glm-4.7` สำหรับ Z.AI โดยตรง

</Accordion>

<Accordion title="OpenCode">

```json5
{
  agents: {
    defaults: {
      model: { primary: "opencode/claude-opus-4-6" },
      models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
    },
  },
}
```

ตั้ง `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs แบบ `opencode/...` สำหรับ Zen catalog หรือ refs แบบ `opencode-go/...` สำหรับ Go catalog ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

</Accordion>

<Accordion title="Z.AI (GLM-4.7)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "zai/glm-4.7" },
      models: { "zai/glm-4.7": {} },
    },
  },
}
```

ตั้ง `ZAI_API_KEY` โดย `z.ai/*` และ `z-ai/*` เป็น aliases ที่รองรับ ทางลัด: `openclaw onboard --auth-choice zai-api-key`

- endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
- endpoint สำหรับโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
- สำหรับ endpoint ทั่วไป ให้กำหนด provider แบบกำหนดเองพร้อมการแทนที่ base URL

</Accordion>

<Accordion title="Moonshot AI (Kimi)">

```json5
{
  env: { MOONSHOT_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "moonshot/kimi-k2.6" },
      models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      moonshot: {
        baseUrl: "https://api.moonshot.ai/v1",
        apiKey: "${MOONSHOT_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "kimi-k2.6",
            name: "Kimi K2.6",
            reasoning: false,
            input: ["text", "image"],
            cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
            contextWindow: 262144,
            maxTokens: 262144,
          },
        ],
      },
    },
  },
}
```

สำหรับ endpoint ในจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

Moonshot endpoints แบบเนทีฟประกาศความเข้ากันได้ของการใช้ streaming บน transport `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะอิงสิ่งนั้นจากความสามารถของ endpoint มากกว่าจะดูเฉพาะ built-in provider id อย่างเดียว

</Accordion>

<Accordion title="Kimi Coding">

```json5
{
  env: { KIMI_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "kimi/kimi-code" },
      models: { "kimi/kimi-code": { alias: "Kimi Code" } },
    },
  },
}
```

เข้ากันได้กับ Anthropic เป็น built-in provider ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

</Accordion>

<Accordion title="Synthetic (Anthropic-compatible)">

```json5
{
  env: { SYNTHETIC_API_KEY: "sk-..." },
  agents: {
    defaults: {
      model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
      models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
    },
  },
  models: {
    mode: "merge",
    providers: {
      synthetic: {
        baseUrl: "https://api.synthetic.new/anthropic",
        apiKey: "${SYNTHETIC_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "hf:MiniMaxAI/MiniMax-M2.5",
            name: "MiniMax M2.5",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 192000,
            maxTokens: 65536,
          },
        ],
      },
    },
  },
}
```

base URL ควรตัด `/v1` ออก (ไคลเอนต์ Anthropic จะต่อท้ายให้อัตโนมัติ) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

</Accordion>

<Accordion title="MiniMax M2.7 (direct)">

```json5
{
  agents: {
    defaults: {
      model: { primary: "minimax/MiniMax-M2.7" },
      models: {
        "minimax/MiniMax-M2.7": { alias: "Minimax" },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        apiKey: "${MINIMAX_API_KEY}",
        api: "anthropic-messages",
        models: [
          {
            id: "MiniMax-M2.7",
            name: "MiniMax M2.7",
            reasoning: true,
            input: ["text", "image"],
            cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
            contextWindow: 204800,
            maxTokens: 131072,
          },
        ],
      },
    },
  },
}
```

ตั้ง `MINIMAX_API_KEY` ทางลัด:
`openclaw onboard --auth-choice minimax-global-api` หรือ
`openclaw onboard --auth-choice minimax-cn-api`
แค็ตตาล็อกโมเดลจะใช้ค่าเริ่มต้นเป็น M2.7 เท่านั้น
บนเส้นทางสตรีมแบบ Anthropic-compatible, OpenClaw จะปิด thinking ของ MiniMax
โดยค่าเริ่มต้น เว้นแต่คุณจะตั้ง `thinking` เองอย่างชัดเจน `/fast on` หรือ
`params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น
`MiniMax-M2.7-highspeed`

</Accordion>

<Accordion title="โมเดลในเครื่อง (LM Studio)">

ดู [Local Models](/th/gateway/local-models) โดยสรุป: รัน local model ขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง และคง hosted models แบบ merge ไว้สำหรับ fallback

</Accordion>

---

## Skills

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
    },
    entries: {
      "image-lab": {
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // หรือสตริงข้อความล้วน
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

- `allowBundled`: allowlist แบบไม่บังคับสำหรับ bundled skills เท่านั้น (managed/workspace skills ไม่ได้รับผลกระทบ)
- `load.extraDirs`: ราก Skills แบบใช้ร่วมกันเพิ่มเติม (ลำดับความสำคัญต่ำสุด)
- `install.preferBrew`: เมื่อเป็น true จะเลือกใช้ตัวติดตั้งแบบ Homebrew ก่อนเมื่อมี `brew`
  พร้อมใช้งาน แล้วจึง fallback ไปยังชนิดตัวติดตั้งอื่น
- `install.nodeManager`: ค่ากำหนดของตัวติดตั้ง node สำหรับสเปก `metadata.openclaw.install`
  (`npm` | `pnpm` | `yarn` | `bun`)
- `entries.<skillKey>.enabled: false` จะปิดใช้งาน skill แม้จะเป็น bundled/installed อยู่ก็ตาม
- `entries.<skillKey>.apiKey`: ค่าความสะดวกสำหรับ skills ที่ประกาศ primary env var ไว้ (สตริงข้อความล้วนหรือออบเจ็กต์ SecretRef)

---

## Plugins

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: [],
    load: {
      paths: ["~/Projects/oss/voice-call-plugin"],
    },
    entries: {
      "voice-call": {
        enabled: true,
        hooks: {
          allowPromptInjection: false,
        },
        config: { provider: "twilio" },
      },
    },
  },
}
```

- โหลดจาก `~/.openclaw/extensions`, `<workspace>/.openclaw/extensions` และ `plugins.load.paths`
- การค้นหารองรับทั้ง OpenClaw plugins แบบเนทีฟ และ bundles ที่เข้ากันได้กับ Codex และ Claude รวมถึง Claude bundles แบบ default-layout ที่ไม่มี manifest
- **การเปลี่ยนแปลง config ต้องรีสตาร์ต Gateway**
- `allow`: allowlist แบบไม่บังคับ (จะโหลดเฉพาะ plugins ที่อยู่ในรายการ) โดย `deny` มีผลเหนือกว่า
- `plugins.entries.<id>.apiKey`: ฟิลด์อำนวยความสะดวกสำหรับ API key ระดับ Plugin (เมื่อ Plugin นั้นรองรับ)
- `plugins.entries.<id>.env`: แมป env var ที่มีขอบเขตระดับ Plugin
- `plugins.entries.<id>.hooks.allowPromptInjection`: เมื่อเป็น `false`, แกนกลางจะบล็อก `before_prompt_build` และเพิกเฉยต่อฟิลด์ที่เปลี่ยนแปลง prompt จาก `before_agent_start` แบบเดิม ขณะเดียวกันยังคงรักษา `modelOverride` และ `providerOverride` แบบเดิมไว้ มีผลกับ hooks ของ Plugin แบบเนทีฟ และไดเรกทอรี hooks ที่มาจาก bundle ซึ่งรองรับ
- `plugins.entries.<id>.subagent.allowModelOverride`: เชื่อถือ Plugin นี้อย่างชัดเจนให้สามารถร้องขอการ override `provider` และ `model` แบบรายรอบการรันสำหรับ background subagent runs ได้
- `plugins.entries.<id>.subagent.allowedModels`: allowlist แบบไม่บังคับของเป้าหมาย `provider/model` แบบ canonical สำหรับ trusted subagent overrides ใช้ `"*"` เฉพาะเมื่อคุณตั้งใจจะอนุญาตทุกโมเดลจริงๆ
- `plugins.entries.<id>.config`: ออบเจ็กต์ config ที่ Plugin กำหนดเอง (ตรวจสอบโดย schema ของ OpenClaw Plugin แบบเนทีฟเมื่อมี)
- `plugins.entries.firecrawl.config.webFetch`: การตั้งค่า web-fetch provider ของ Firecrawl
  - `apiKey`: Firecrawl API key (รองรับ SecretRef) จะ fallback ไปที่ `plugins.entries.firecrawl.config.webSearch.apiKey`, `tools.web.fetch.firecrawl.apiKey` แบบเดิม หรือ env var `FIRECRAWL_API_KEY`
  - `baseUrl`: Firecrawl API base URL (ค่าเริ่มต้น: `https://api.firecrawl.dev`)
  - `onlyMainContent`: ดึงเฉพาะเนื้อหาหลักของหน้า (ค่าเริ่มต้น: `true`)
  - `maxAgeMs`: อายุแคชสูงสุดเป็นมิลลิวินาที (ค่าเริ่มต้น: `172800000` / 2 วัน)
  - `timeoutSeconds`: request timeout ของการ scrape เป็นวินาที (ค่าเริ่มต้น: `60`)
- `plugins.entries.xai.config.xSearch`: การตั้งค่า xAI X Search (Grok web search)
  - `enabled`: เปิดใช้ X Search provider
  - `model`: โมเดล Grok ที่ใช้ค้นหา (เช่น `"grok-4-1-fast"`)
- `plugins.entries.memory-core.config.dreaming`: การตั้งค่า memory dreaming ดู [Dreaming](/th/concepts/dreaming) สำหรับ phases และ thresholds
  - `enabled`: สวิตช์หลักของ Dreaming (ค่าเริ่มต้น `false`)
  - `frequency`: จังหวะ Cron สำหรับการกวาด dreaming แบบเต็มแต่ละครั้ง (ค่าเริ่มต้น `"0 3 * * *"`)
  - นโยบาย phase และ thresholds เป็นรายละเอียดการทำงานภายใน (ไม่ใช่คีย์ config ที่ให้ผู้ใช้ตั้ง)
- config ของ memory แบบเต็มอยู่ใน [ข้อมูลอ้างอิงการตั้งค่า memory](/th/reference/memory-config):
  - `agents.defaults.memorySearch.*`
  - `memory.backend`
  - `memory.citations`
  - `memory.qmd.*`
  - `plugins.entries.memory-core.config.dreaming`
- Claude bundle plugins ที่เปิดใช้แล้วสามารถเพิ่มค่าเริ่มต้นของ embedded Pi จาก `settings.json` ได้ด้วย โดย OpenClaw จะนำมาใช้เป็นการตั้งค่าเอเจนต์ที่ผ่านการทำให้ปลอดภัยแล้ว ไม่ใช่การแพตช์ config ของ OpenClaw แบบดิบ
- `plugins.slots.memory`: เลือก active memory plugin id หรือ `"none"` เพื่อปิด memory plugins
- `plugins.slots.contextEngine`: เลือก active context engine plugin id; ค่าเริ่มต้นคือ `"legacy"` เว้นแต่คุณจะติดตั้งและเลือก engine อื่น
- `plugins.installs`: เมทาดาทาการติดตั้งที่ CLI จัดการ ใช้โดย `openclaw plugins update`
  - รวม `source`, `spec`, `sourcePath`, `installPath`, `version`, `resolvedName`, `resolvedVersion`, `resolvedSpec`, `integrity`, `shasum`, `resolvedAt`, `installedAt`
  - ให้ถือว่า `plugins.installs.*` เป็นสถานะที่ระบบจัดการ; ควรใช้คำสั่ง CLI มากกว่าการแก้ไขด้วยตนเอง

ดู [Plugins](/th/tools/plugin)

---

## Browser

```json5
{
  browser: {
    enabled: true,
    evaluateEnabled: true,
    defaultProfile: "user",
    ssrfPolicy: {
      // dangerouslyAllowPrivateNetwork: true, // opt in เฉพาะเมื่อเชื่อถือการเข้าถึง private-network
      // allowPrivateNetwork: true, // alias แบบเดิม
      // hostnameAllowlist: ["*.example.com", "example.com"],
      // allowedHostnames: ["localhost"],
    },
    profiles: {
      openclaw: { cdpPort: 18800, color: "#FF4500" },
      work: { cdpPort: 18801, color: "#0066CC" },
      user: { driver: "existing-session", attachOnly: true, color: "#00AA00" },
      brave: {
        driver: "existing-session",
        attachOnly: true,
        userDataDir: "~/Library/Application Support/BraveSoftware/Brave-Browser",
        color: "#FB542B",
      },
      remote: { cdpUrl: "http://10.0.0.42:9222", color: "#00AA00" },
    },
    color: "#FF4500",
    // headless: false,
    // noSandbox: false,
    // extraArgs: [],
    // executablePath: "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    // attachOnly: false,
  },
}
```

- `evaluateEnabled: false` จะปิด `act:evaluate` และ `wait --fn`
- `ssrfPolicy.dangerouslyAllowPrivateNetwork` จะถูกปิดไว้เมื่อไม่ตั้งค่า ดังนั้นการนำทางด้วย browser จะยังคงเข้มงวดโดยค่าเริ่มต้น
- ตั้ง `ssrfPolicy.dangerouslyAllowPrivateNetwork: true` เฉพาะเมื่อคุณตั้งใจเชื่อถือการนำทาง browser ไปยัง private-network
- ในโหมด strict, endpoints ของ remote CDP profiles (`profiles.*.cdpUrl`) จะอยู่ภายใต้การบล็อก private-network แบบเดียวกันระหว่างการตรวจสอบ reachability/discovery
- `ssrfPolicy.allowPrivateNetwork` ยังคงรองรับอยู่ในฐานะ alias แบบเดิม
- ในโหมด strict ใช้ `ssrfPolicy.hostnameAllowlist` และ `ssrfPolicy.allowedHostnames` สำหรับข้อยกเว้นแบบชัดเจน
- remote profiles เป็นแบบ attach-only (ปิด start/stop/reset)
- `profiles.*.cdpUrl` รองรับ `http://`, `https://`, `ws://` และ `wss://`
  ใช้ HTTP(S) เมื่อต้องการให้ OpenClaw ค้นหา `/json/version`; ใช้ WS(S)
  เมื่อผู้ให้บริการของคุณให้ DevTools WebSocket URL โดยตรง
- profiles แบบ `existing-session` ใช้ Chrome MCP แทน CDP และสามารถ attach ได้บน
  โฮสต์ที่เลือกหรือผ่าน browser node ที่เชื่อมต่ออยู่
- profiles แบบ `existing-session` สามารถตั้ง `userDataDir` เพื่อกำหนดเป้าหมายไปยัง
  browser profile ของ Chromium-based browser เฉพาะตัว เช่น Brave หรือ Edge
- profiles แบบ `existing-session` ยังคงมีข้อจำกัด route ของ Chrome MCP ในปัจจุบัน:
  การกระทำแบบอิง snapshot/ref แทนการกำหนดเป้าหมายด้วย CSS-selector, hooks สำหรับอัปโหลดไฟล์ได้ทีละไฟล์,
  ไม่มีการ override dialog timeout, ไม่มี `wait --load networkidle`, และไม่มี
  `responsebody`, การส่งออก PDF, การดักจับการดาวน์โหลด หรือ batch actions
- local managed profiles แบบ `openclaw` จะกำหนด `cdpPort` และ `cdpUrl` ให้อัตโนมัติ; ควร
  ตั้ง `cdpUrl` เองเฉพาะสำหรับ remote CDP
- ลำดับการตรวจหาอัตโนมัติ: default browser หากเป็น Chromium-based → Chrome → Brave → Edge → Chromium → Chrome Canary
- Control service: loopback เท่านั้น (พอร์ตได้มาจาก `gateway.port`, ค่าเริ่มต้น `18791`)
- `extraArgs` ใช้ต่อท้าย launch flags เพิ่มเติมไปยังการเริ่มต้น Chromium ในเครื่อง (เช่น
  `--disable-gpu`, การกำหนดขนาดหน้าต่าง หรือ debug flags)

---

## UI

```json5
{
  ui: {
    seamColor: "#FF4500",
    assistant: {
      name: "OpenClaw",
      avatar: "CB", // อีโมจิ, ข้อความสั้น, image URL หรือ data URI
    },
  },
}
```

- `seamColor`: สีเน้นสำหรับ UI chrome ของแอปเนทีฟ (สีของ Talk Mode bubble เป็นต้น)
- `assistant`: การ override identity ของ Control UI โดยจะ fallback ไปยัง identity ของเอเจนต์ที่กำลังใช้งานอยู่

---

## Gateway

```json5
{
  gateway: {
    mode: "local", // local | remote
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token", // none | token | password | trusted-proxy
      token: "your-token",
      // password: "your-password", // หรือ OPENCLAW_GATEWAY_PASSWORD
      // trustedProxy: { userHeader: "x-forwarded-user" }, // สำหรับ mode=trusted-proxy; ดู /gateway/trusted-proxy-auth
      allowTailscale: true,
      rateLimit: {
        maxAttempts: 10,
        windowMs: 60000,
        lockoutMs: 300000,
        exemptLoopback: true,
      },
    },
    tailscale: {
      mode: "off", // off | serve | funnel
      resetOnExit: false,
    },
    controlUi: {
      enabled: true,
      basePath: "/openclaw",
      // root: "dist/control-ui",
      // embedSandbox: "scripts", // strict | scripts | trusted
      // allowExternalEmbedUrls: false, // อันตราย: อนุญาต absolute external http(s) embed URLs
      // allowedOrigins: ["https://control.example.com"], // จำเป็นสำหรับ Control UI ที่ไม่ใช่ loopback
      // dangerouslyAllowHostHeaderOriginFallback: false, // โหมด fallback จาก Host-header origin ที่อันตราย
      // allowInsecureAuth: false,
      // dangerouslyDisableDeviceAuth: false,
    },
    remote: {
      url: "ws://gateway.tailnet:18789",
      transport: "ssh", // ssh | direct
      token: "your-token",
      // password: "your-password",
    },
    trustedProxies: ["10.0.0.1"],
    // ไม่บังคับ ค่าเริ่มต้น false
    allowRealIpFallback: false,
    tools: {
      // HTTP denies เพิ่มเติมสำหรับ /tools/invoke
      deny: ["browser"],
      // เอาเครื่องมือออกจาก default HTTP deny list
      allow: ["gateway"],
    },
    push: {
      apns: {
        relay: {
          baseUrl: "https://relay.example.com",
          timeoutMs: 10000,
        },
      },
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ของ Gateway">

- `mode`: `local` (รัน Gateway) หรือ `remote` (เชื่อมต่อไปยัง Gateway ระยะไกล) Gateway จะปฏิเสธการเริ่มทำงานเว้นแต่เป็น `local`
- `port`: พอร์ตแบบ multiplex เดียวสำหรับ WS + HTTP ลำดับความสำคัญ: `--port` > `OPENCLAW_GATEWAY_PORT` > `gateway.port` > `18789`
- `bind`: `auto`, `loopback` (ค่าเริ่มต้น), `lan` (`0.0.0.0`), `tailnet` (เฉพาะ Tailscale IP) หรือ `custom`
- **Legacy bind aliases**: ให้ใช้ค่าโหมด bind ใน `gateway.bind` (`auto`, `loopback`, `lan`, `tailnet`, `custom`) ไม่ใช่ host aliases (`0.0.0.0`, `127.0.0.1`, `localhost`, `::`, `::1`)
- **หมายเหตุสำหรับ Docker**: ค่า bind เริ่มต้นแบบ `loopback` จะฟังที่ `127.0.0.1` ภายใน container เมื่อใช้ Docker bridge networking (`-p 18789:18789`) ทราฟฟิกจะเข้าทาง `eth0` ทำให้เข้าถึง gateway ไม่ได้ ให้ใช้ `--network host` หรือตั้ง `bind: "lan"` (หรือ `bind: "custom"` พร้อม `customBindHost: "0.0.0.0"`) เพื่อฟังทุกอินเทอร์เฟซ
- **การยืนยันตัวตน**: จำเป็นโดยค่าเริ่มต้น bind ที่ไม่ใช่ loopback ต้องใช้ Gateway auth ในทางปฏิบัติคือใช้ token/password ร่วมกัน หรือ reverse proxy ที่รับรู้ตัวตนพร้อม `gateway.auth.mode: "trusted-proxy"` โดย onboarding wizard จะสร้าง token ให้เป็นค่าเริ่มต้น
- หากมีการตั้งทั้ง `gateway.auth.token` และ `gateway.auth.password` (รวมถึง SecretRefs) ให้ตั้ง `gateway.auth.mode` อย่างชัดเจนเป็น `token` หรือ `password` ขั้นตอน startup และ flow ติดตั้ง/ซ่อม service จะล้มเหลวเมื่อมีการตั้งทั้งสองอย่างและไม่ได้ตั้ง mode
- `gateway.auth.mode: "none"`: โหมดไม่มี auth แบบชัดเจน ใช้เฉพาะกับการตั้งค่า local loopback ที่เชื่อถือได้เท่านั้น โดยตั้งใจไม่แสดงตัวเลือกนี้ใน onboarding prompts
- `gateway.auth.mode: "trusted-proxy"`: มอบหมาย auth ให้ reverse proxy ที่รับรู้ตัวตน และเชื่อถือ identity headers จาก `gateway.trustedProxies` (ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth)) โหมดนี้คาดหวัง **แหล่ง proxy ที่ไม่ใช่ loopback**; reverse proxy บน loopback เครื่องเดียวกันไม่ถือว่าตรงตาม trusted-proxy auth
- `gateway.auth.allowTailscale`: เมื่อเป็น `true`, headers ระบุตัวตนจาก Tailscale Serve สามารถใช้ยืนยันตัวตน Control UI/WebSocket ได้ (ตรวจสอบผ่าน `tailscale whois`) ส่วน HTTP API endpoints จะ **ไม่** ใช้ Tailscale header auth นี้; จะใช้โหมด HTTP auth ปกติของ gateway แทน flow แบบไม่ใช้ token นี้ถือว่าโฮสต์ของ gateway เชื่อถือได้ ค่าเริ่มต้นเป็น `true` เมื่อ `tailscale.mode = "serve"`
- `gateway.auth.rateLimit`: ตัวจำกัดการยืนยันตัวตนล้มเหลวแบบไม่บังคับ ใช้ต่อ client IP และต่อ auth scope (shared-secret และ device-token ถูกติดตามแยกกัน) คำขอที่ถูกบล็อกจะคืนค่า `429` + `Retry-After`
  - บนเส้นทาง async Tailscale Serve Control UI การพยายามที่ล้มเหลวสำหรับ `{scope, clientIp}` เดียวกันจะถูก serialize ก่อนเขียนความล้มเหลว ดังนั้นคำขอผิดพร้อมกันจาก client เดียวกันอาจชนตัวจำกัดในคำขอที่สอง แทนที่จะหลุดผ่านไปทั้งคู่แบบเป็นเพียงการไม่ตรงกันธรรมดา
  - `gateway.auth.rateLimit.exemptLoopback` มีค่าเริ่มต้นเป็น `true`; ตั้งเป็น `false` เมื่อคุณตั้งใจให้ทราฟฟิกจาก localhost ถูกจำกัดอัตราด้วยเช่นกัน (สำหรับสภาพแวดล้อมทดสอบหรือการติดตั้ง proxy แบบเข้มงวด)
- ความพยายามยืนยันตัวตน WS ที่มาจาก browser origin จะถูกจำกัดอัตราเสมอโดยปิด loopback exemption (เป็น defense-in-depth ต่อการ brute force localhost จากเบราว์เซอร์)
- บน loopback การล็อกเอาต์จาก browser-origin เหล่านั้นจะแยกตามค่า `Origin`
  ที่ถูกทำให้เป็นมาตรฐาน ดังนั้นความล้มเหลวซ้ำจาก localhost origin หนึ่งจะไม่
  ล็อกเอาต์อีก origin หนึ่งโดยอัตโนมัติ
- `tailscale.mode`: `serve` (เฉพาะ tailnet, bind แบบ loopback) หรือ `funnel` (สาธารณะ, ต้องใช้ auth)
- `controlUi.allowedOrigins`: allowlist ของ browser-origin แบบชัดเจนสำหรับการเชื่อมต่อ Gateway WebSocket จำเป็นเมื่อคาดว่าจะมี browser clients จาก origins ที่ไม่ใช่ loopback
- `controlUi.dangerouslyAllowHostHeaderOriginFallback`: โหมดอันตรายที่เปิดใช้ Host-header origin fallback สำหรับ deployment ที่ตั้งใจพึ่งนโยบาย origin จาก Host-header
- `remote.transport`: `ssh` (ค่าเริ่มต้น) หรือ `direct` (ws/wss) สำหรับ `direct`, `remote.url` ต้องเป็น `ws://` หรือ `wss://`
- `OPENCLAW_ALLOW_INSECURE_PRIVATE_WS=1`: การ override แบบฉุกเฉินฝั่งไคลเอนต์ที่อนุญาต `ws://` แบบข้อความล้วนไปยัง IP เครือข่ายส่วนตัวที่เชื่อถือได้; ค่าเริ่มต้นยังคงจำกัด ws แบบข้อความล้วนให้ใช้ได้เฉพาะ loopback
- `gateway.remote.token` / `.password` เป็นฟิลด์ข้อมูลรับรองของ remote-client โดยไม่ได้ตั้งค่า gateway auth ด้วยตัวมันเอง
- `gateway.push.apns.relay.baseUrl`: base HTTPS URL สำหรับ APNs relay ภายนอกที่ iOS builds แบบทางการ/TestFlight ใช้หลังจากเผยแพร่ relay-backed registrations ไปยัง gateway แล้ว URL นี้ต้องตรงกับ relay URL ที่ถูกคอมไพล์ไว้ใน iOS build
- `gateway.push.apns.relay.timeoutMs`: timeout การส่งจาก gateway ไป relay เป็นมิลลิวินาที ค่าเริ่มต้น `10000`
- registrations แบบ relay-backed จะถูกมอบหมายให้กับ gateway identity ที่เจาะจง แอป iOS ที่จับคู่ไว้จะดึง `gateway.identity.get` รวม identity นั้นในการลงทะเบียน relay และส่งต่อ send grant ที่มีขอบเขตระดับ registration ให้ gateway Gateway อื่นจะไม่สามารถนำ registration ที่เก็บไว้นี้ไปใช้ซ้ำได้
- `OPENCLAW_APNS_RELAY_BASE_URL` / `OPENCLAW_APNS_RELAY_TIMEOUT_MS`: env overrides ชั่วคราวสำหรับการตั้งค่า relay ข้างต้น
- `OPENCLAW_APNS_RELAY_ALLOW_HTTP=true`: escape hatch สำหรับงานพัฒนาเท่านั้น สำหรับ loopback HTTP relay URLs ส่วน relay URLs ใน production ควรใช้ HTTPS ต่อไป
- `gateway.channelHealthCheckMinutes`: ช่วงเวลาของ channel health-monitor เป็นนาที ตั้งเป็น `0` เพื่อปิด health-monitor restarts แบบทั่วทั้งระบบ ค่าเริ่มต้น: `5`
- `gateway.channelStaleEventThresholdMinutes`: เกณฑ์ stale-socket เป็นนาที ควรตั้งให้มากกว่าหรือเท่ากับ `gateway.channelHealthCheckMinutes` ค่าเริ่มต้น: `30`
- `gateway.channelMaxRestartsPerHour`: จำนวน health-monitor restarts สูงสุดต่อช่องทาง/บัญชีในหนึ่งชั่วโมงแบบ rolling ค่าเริ่มต้น: `10`
- `channels.<provider>.healthMonitor.enabled`: การ opt-out รายช่องทางสำหรับ health-monitor restarts โดยยังคงเปิด global monitor อยู่
- `channels.<provider>.accounts.<accountId>.healthMonitor.enabled`: การแทนที่รายบัญชีสำหรับช่องทางแบบหลายบัญชี เมื่อมีการตั้งค่า จะมีผลเหนือกว่าการแทนที่ระดับช่องทาง
- เส้นทางการเรียก local gateway สามารถใช้ `gateway.remote.*` เป็น fallback ได้เฉพาะเมื่อ `gateway.auth.*` ไม่ได้ตั้งค่า
- หากมีการตั้ง `gateway.auth.token` / `gateway.auth.password` อย่างชัดเจนผ่าน SecretRef และ resolve ไม่ได้ ระบบจะ fail closed (ไม่มี remote fallback มาปกปิด)
- `trustedProxies`: IP ของ reverse proxy ที่ terminate TLS หรือ inject forwarded-client headers ให้ระบุเฉพาะ proxies ที่คุณควบคุม รายการ loopback ยังคงใช้ได้สำหรับการตั้งค่าแบบ proxy บนโฮสต์เดียวกัน/การตรวจจับในเครื่อง (เช่น Tailscale Serve หรือ local reverse proxy) แต่ **ไม่** ทำให้คำขอ loopback มีสิทธิ์ใช้ `gateway.auth.mode: "trusted-proxy"`
- `allowRealIpFallback`: เมื่อเป็น `true` gateway จะยอมรับ `X-Real-IP` หากไม่มี `X-Forwarded-For` ค่าเริ่มต้น `false` เพื่อพฤติกรรม fail-closed
- `gateway.tools.deny`: ชื่อเครื่องมือเพิ่มเติมที่ถูกบล็อกสำหรับ HTTP `POST /tools/invoke` (ขยายจาก default deny list)
- `gateway.tools.allow`: นำชื่อเครื่องมือออกจาก default HTTP deny list

</Accordion>

### Endpoints ที่เข้ากันได้กับ OpenAI

- Chat Completions: ปิดไว้โดยค่าเริ่มต้น เปิดใช้ด้วย `gateway.http.endpoints.chatCompletions.enabled: true`
- Responses API: `gateway.http.endpoints.responses.enabled`
- การเสริมความปลอดภัยของ URL-input สำหรับ Responses:
  - `gateway.http.endpoints.responses.maxUrlParts`
  - `gateway.http.endpoints.responses.files.urlAllowlist`
  - `gateway.http.endpoints.responses.images.urlAllowlist`
    allowlists ที่ว่างจะถือว่าไม่ได้ตั้งค่า; ใช้ `gateway.http.endpoints.responses.files.allowUrl=false`
    และ/หรือ `gateway.http.endpoints.responses.images.allowUrl=false` เพื่อปิดการดึง URL
- header สำหรับเสริมความปลอดภัยของ response แบบไม่บังคับ:
  - `gateway.http.securityHeaders.strictTransportSecurity` (ตั้งเฉพาะสำหรับ HTTPS origins ที่คุณควบคุม; ดู [Trusted Proxy Auth](/th/gateway/trusted-proxy-auth#tls-termination-and-hsts))

### การแยกหลายอินสแตนซ์

รันหลาย gateways บนโฮสต์เดียวด้วยพอร์ตและ state dirs ที่ไม่ซ้ำกัน:

```bash
OPENCLAW_CONFIG_PATH=~/.openclaw/a.json \
OPENCLAW_STATE_DIR=~/.openclaw-a \
openclaw gateway --port 19001
```

แฟล็กอำนวยความสะดวก: `--dev` (ใช้ `~/.openclaw-dev` + พอร์ต `19001`), `--profile <name>` (ใช้ `~/.openclaw-<name>`)

ดู [Multiple Gateways](/th/gateway/multiple-gateways)

### `gateway.tls`

```json5
{
  gateway: {
    tls: {
      enabled: false,
      autoGenerate: false,
      certPath: "/etc/openclaw/tls/server.crt",
      keyPath: "/etc/openclaw/tls/server.key",
      caPath: "/etc/openclaw/tls/ca-bundle.crt",
    },
  },
}
```

- `enabled`: เปิดใช้ TLS termination ที่ listener ของ gateway (HTTPS/WSS) (ค่าเริ่มต้น: `false`)
- `autoGenerate`: สร้าง cert/key แบบ self-signed ในเครื่องโดยอัตโนมัติเมื่อไม่ได้ตั้งค่าไฟล์ชัดเจน; ใช้สำหรับ local/dev เท่านั้น
- `certPath`: พาธไฟล์ระบบของ TLS certificate
- `keyPath`: พาธไฟล์ระบบของ TLS private key; ควรจำกัดสิทธิ์การเข้าถึง
- `caPath`: พาธ CA bundle แบบไม่บังคับสำหรับการตรวจสอบไคลเอนต์หรือ custom trust chains

### `gateway.reload`

```json5
{
  gateway: {
    reload: {
      mode: "hybrid", // off | restart | hot | hybrid
      debounceMs: 500,
      deferralTimeoutMs: 300000,
    },
  },
}
```

- `mode`: ควบคุมว่าจะนำการแก้ไข config ไปใช้ในรันไทม์อย่างไร
  - `"off"`: เพิกเฉยต่อการแก้ไขแบบสด; การเปลี่ยนแปลงต้องรีสตาร์ตอย่างชัดเจน
  - `"restart"`: รีสตาร์ต process ของ gateway ทุกครั้งเมื่อ config เปลี่ยน
  - `"hot"`: นำการเปลี่ยนแปลงไปใช้ใน process เดิมโดยไม่รีสตาร์ต
  - `"hybrid"` (ค่าเริ่มต้น): ลอง hot reload ก่อน; หากจำเป็นจึง fallback ไปรีสตาร์ต
- `debounceMs`: หน้าต่าง debounce เป็นมิลลิวินาทีก่อนนำการเปลี่ยนแปลง config ไปใช้ (จำนวนเต็มที่ไม่ติดลบ)
- `deferralTimeoutMs`: เวลาสูงสุดเป็นมิลลิวินาทีที่จะรอให้ in-flight operations เสร็จก่อนบังคับรีสตาร์ต (ค่าเริ่มต้น: `300000` = 5 นาที)

---

## Hooks

```json5
{
  hooks: {
    enabled: true,
    token: "shared-secret",
    path: "/hooks",
    maxBodyBytes: 262144,
    defaultSessionKey: "hook:ingress",
    allowRequestSessionKey: true,
    allowedSessionKeyPrefixes: ["hook:", "hook:gmail:"],
    allowedAgentIds: ["hooks", "main"],
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        match: { path: "gmail" },
        action: "agent",
        agentId: "hooks",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}\n{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        model: "openai/gpt-5.4-mini",
      },
    ],
  },
}
```

Auth: `Authorization: Bearer <token>` หรือ `x-openclaw-token: <token>`
ระบบจะปฏิเสธ hook tokens ใน query string

หมายเหตุด้านการตรวจสอบและความปลอดภัย:

- `hooks.enabled=true` ต้องใช้ `hooks.token` ที่ไม่ว่าง
- `hooks.token` ต้อง **ไม่ซ้ำ** กับ `gateway.auth.token`; หากใช้ Gateway token ซ้ำ ระบบจะปฏิเสธ
- `hooks.path` ห้ามเป็น `/`; ควรใช้ subpath เฉพาะ เช่น `/hooks`
- หาก `hooks.allowRequestSessionKey=true` ให้จำกัด `hooks.allowedSessionKeyPrefixes` (เช่น `["hook:"]`)
- หาก mapping หรือ preset ใช้ `sessionKey` แบบเทมเพลต ให้ตั้ง `hooks.allowedSessionKeyPrefixes` และ `hooks.allowRequestSessionKey=true` ส่วนคีย์แบบ static mapping ไม่ต้องใช้การ opt-in นี้

**Endpoints:**

- `POST /hooks/wake` → `{ text, mode?: "now"|"next-heartbeat" }`
- `POST /hooks/agent` → `{ message, name?, agentId?, sessionKey?, wakeMode?, deliver?, channel?, to?, model?, thinking?, timeoutSeconds? }`
  - `sessionKey` จาก request payload จะรับได้เฉพาะเมื่อ `hooks.allowRequestSessionKey=true` (ค่าเริ่มต้น: `false`)
- `POST /hooks/<name>` → resolve ผ่าน `hooks.mappings`
  - ค่า `sessionKey` ของ mapping ที่ render จากเทมเพลตจะถือว่าเป็นค่าที่จัดหาจากภายนอก และต้องใช้ `hooks.allowRequestSessionKey=true` เช่นกัน

<Accordion title="รายละเอียด Mapping">

- `match.path` จับคู่ sub-path หลัง `/hooks` (เช่น `/hooks/gmail` → `gmail`)
- `match.source` จับคู่ฟิลด์ใน payload สำหรับ paths แบบทั่วไป
- เทมเพลตอย่าง `{{messages[0].subject}}` จะอ่านค่าจาก payload
- `transform` สามารถชี้ไปยังโมดูล JS/TS ที่คืนค่า hook action ได้
  - `transform.module` ต้องเป็น relative path และต้องอยู่ภายใน `hooks.transformsDir` (ระบบจะปฏิเสธ absolute paths และการ traversal)
- `agentId` ใช้กำหนดเส้นทางไปยังเอเจนต์ที่ระบุ; IDs ที่ไม่รู้จักจะ fallback ไปยังค่าเริ่มต้น
- `allowedAgentIds`: จำกัดการกำหนดเส้นทางแบบ explicit (`*` หรือไม่ระบุ = อนุญาตทั้งหมด, `[]` = ปฏิเสธทั้งหมด)
- `defaultSessionKey`: session key แบบคงที่ที่ไม่บังคับสำหรับการรัน hook agent ที่ไม่มี `sessionKey` แบบ explicit
- `allowRequestSessionKey`: อนุญาตให้ผู้เรียก `/hooks/agent` และ session keys ของ mapping ที่ขับเคลื่อนด้วยเทมเพลตตั้งค่า `sessionKey` ได้ (ค่าเริ่มต้น: `false`)
- `allowedSessionKeyPrefixes`: prefix allowlist แบบไม่บังคับสำหรับค่า `sessionKey` แบบ explicit (request + mapping) เช่น `["hook:"]` จะกลายเป็นค่าที่จำเป็นเมื่อ mapping หรือ preset ใดใช้ `sessionKey` แบบเทมเพลต
- `deliver: true` จะส่งคำตอบสุดท้ายไปยังช่องทาง; โดย `channel` มีค่าเริ่มต้นเป็น `last`
- `model` ใช้ override LLM สำหรับการรัน hook นี้ (ต้องได้รับอนุญาตหากมีการตั้งค่า model catalog)

</Accordion>

### การผสานรวม Gmail

- Gmail preset ที่มีมาในตัวใช้ `sessionKey: "hook:gmail:{{messages[0].id}}"`
- หากคุณคงการกำหนดเส้นทางแบบรายข้อความนี้ไว้ ให้ตั้ง `hooks.allowRequestSessionKey: true` และจำกัด `hooks.allowedSessionKeyPrefixes` ให้ตรงกับ namespace ของ Gmail เช่น `["hook:", "hook:gmail:"]`
- หากคุณต้องการ `hooks.allowRequestSessionKey: false` ให้แทนที่ preset ด้วย `sessionKey` แบบคงที่แทนค่าเริ่มต้นแบบเทมเพลต

```json5
{
  hooks: {
    gmail: {
      account: "openclaw@gmail.com",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
      model: "openrouter/meta-llama/llama-3.3-70b-instruct:free",
      thinking: "off",
    },
  },
}
```

- Gateway จะเริ่ม `gog gmail watch serve` อัตโนมัติระหว่างบูตเมื่อมีการตั้งค่าไว้ ตั้ง `OPENCLAW_SKIP_GMAIL_WATCHER=1` เพื่อปิดใช้งาน
- อย่ารัน `gog gmail watch serve` แยกต่างหากควบคู่กับ Gateway

---

## Canvas host

```json5
{
  canvasHost: {
    root: "~/.openclaw/workspace/canvas",
    liveReload: true,
    // enabled: false, // หรือ OPENCLAW_SKIP_CANVAS_HOST=1
  },
}
```

- ให้บริการ HTML/CSS/JS และ A2UI ที่เอเจนต์แก้ไขได้ผ่าน HTTP ภายใต้พอร์ตของ Gateway:
  - `http://<gateway-host>:<gateway.port>/__openclaw__/canvas/`
  - `http://<gateway-host>:<gateway.port>/__openclaw__/a2ui/`
- ใช้ในเครื่องเท่านั้น: ควรคง `gateway.bind: "loopback"` (ค่าเริ่มต้น)
- การ bind ที่ไม่ใช่ loopback: routes ของ canvas ต้องใช้ Gateway auth (token/password/trusted-proxy) เช่นเดียวกับพื้นผิว HTTP อื่นๆ ของ Gateway
- โดยทั่วไป Node WebViews จะไม่ส่ง auth headers; หลังจาก node ถูกจับคู่และเชื่อมต่อแล้ว Gateway จะประกาศ capability URLs ที่มีขอบเขตระดับ node สำหรับการเข้าถึง canvas/A2UI
- Capability URLs จะผูกกับ active node WS session และหมดอายุอย่างรวดเร็ว ไม่มีการใช้ fallback แบบอิง IP
- ฉีดไคลเอนต์ live-reload เข้าไปใน HTML ที่ให้บริการ
- สร้าง `index.html` เริ่มต้นอัตโนมัติเมื่อว่างเปล่า
- ให้บริการ A2UI ที่ `/__openclaw__/a2ui/` ด้วย
- การเปลี่ยนแปลงต้องรีสตาร์ต gateway
- ปิด live reload สำหรับไดเรกทอรีขนาดใหญ่หรือเมื่อเกิดข้อผิดพลาด `EMFILE`

---

## Discovery

### mDNS (Bonjour)

```json5
{
  discovery: {
    mdns: {
      mode: "minimal", // minimal | full | off
    },
  },
}
```

- `minimal` (ค่าเริ่มต้น): ละ `cliPath` + `sshPort` ออกจาก TXT records
- `full`: รวม `cliPath` + `sshPort`
- hostname มีค่าเริ่มต้นเป็น `openclaw` แทนที่ได้ด้วย `OPENCLAW_MDNS_HOSTNAME`

### Wide-area (DNS-SD)

```json5
{
  discovery: {
    wideArea: { enabled: true },
  },
}
```

เขียน unicast DNS-SD zone ภายใต้ `~/.openclaw/dns/` สำหรับการค้นหาข้ามเครือข่าย ให้ใช้ร่วมกับ DNS server (แนะนำ CoreDNS) + Tailscale split DNS

การตั้งค่า: `openclaw dns setup --apply`

---

## Environment

### `env` (inline env vars)

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

- inline env vars จะถูกนำไปใช้เฉพาะเมื่อ process env ไม่มีคีย์นั้น
- ไฟล์ `.env`: `.env` ใน CWD + `~/.openclaw/.env` (ทั้งสองที่ไม่ override ตัวแปรที่มีอยู่แล้ว)
- `shellEnv`: นำเข้าคีย์ที่คาดหวังซึ่งยังขาดอยู่จากโปรไฟล์ login shell ของคุณ
- ดู [Environment](/th/help/environment) สำหรับลำดับความสำคัญทั้งหมด

### การแทนที่ด้วย env var

อ้างอิง env vars ในสตริง config ใดๆ ด้วย `${VAR_NAME}`:

```json5
{
  gateway: {
    auth: { token: "${OPENCLAW_GATEWAY_TOKEN}" },
  },
}
```

- จะจับคู่เฉพาะชื่อแบบตัวพิมพ์ใหญ่: `[A-Z_][A-Z0-9_]*`
- ตัวแปรที่หายไป/ว่างจะทำให้เกิดข้อผิดพลาดตอนโหลด config
- escape ด้วย `$${VAR}` เพื่อให้ได้ `${VAR}` แบบข้อความตามตัวอักษร
- ใช้ได้กับ `$include`

---

## Secrets

Secret refs เป็นแบบเพิ่มเติม: ค่าข้อความล้วนยังคงใช้ได้

### `SecretRef`

ใช้ออบเจ็กต์ในรูปแบบเดียว:

```json5
{ source: "env" | "file" | "exec", provider: "default", id: "..." }
```

การตรวจสอบ:

- รูปแบบ `provider`: `^[a-z][a-z0-9_-]{0,63}$`
- รูปแบบ id ของ `source: "env"`: `^[A-Z][A-Z0-9_]{0,127}$`
- `source: "file"` ใช้ id เป็น absolute JSON pointer (เช่น `"/providers/openai/apiKey"`)
- รูปแบบ id ของ `source: "exec"`: `^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$`
- ids ของ `source: "exec"` ต้องไม่มี path segments แบบ `.` หรือ `..` ที่คั่นด้วย slash (เช่น `a/../b` จะถูกปฏิเสธ)

### พื้นผิวข้อมูลรับรองที่รองรับ

- เมทริกซ์มาตรฐาน: [SecretRef Credential Surface](/th/reference/secretref-credential-surface)
- `secrets apply` กำหนดเป้าหมายไปยังพาธข้อมูลรับรองที่รองรับใน `openclaw.json`
- refs ใน `auth-profiles.json` จะรวมอยู่ในการ resolve ตอนรันไทม์และขอบเขตการตรวจสอบด้วย

### การตั้งค่า Secret providers

```json5
{
  secrets: {
    providers: {
      default: { source: "env" }, // env provider แบบ explicit ที่ไม่บังคับ
      filemain: {
        source: "file",
        path: "~/.openclaw/secrets.json",
        mode: "json",
        timeoutMs: 5000,
      },
      vault: {
        source: "exec",
        command: "/usr/local/bin/openclaw-vault-resolver",
        passEnv: ["PATH", "VAULT_ADDR"],
      },
    },
    defaults: {
      env: "default",
      file: "filemain",
      exec: "vault",
    },
  },
}
```

หมายเหตุ:

- provider แบบ `file` รองรับ `mode: "json"` และ `mode: "singleValue"` (`id` ต้องเป็น `"value"` ในโหมด singleValue)
- provider แบบ `exec` ต้องใช้พาธ `command` แบบ absolute และใช้ protocol payloads ผ่าน stdin/stdout
- โดยค่าเริ่มต้น จะปฏิเสธพาธคำสั่งที่เป็น symlink ตั้ง `allowSymlinkCommand: true` เพื่ออนุญาตพาธ symlink โดยยังตรวจสอบพาธเป้าหมายที่ resolve แล้ว
- หากมีการตั้งค่า `trustedDirs` การตรวจสอบ trusted-dir จะมีผลกับพาธเป้าหมายที่ resolve แล้ว
- environment ของ child สำหรับ `exec` จะมีค่าเริ่มต้นแบบน้อยที่สุด; ให้ส่งตัวแปรที่จำเป็นอย่างชัดเจนด้วย `passEnv`
- secret refs จะถูก resolve ตอน activation ไปยัง snapshot ในหน่วยความจำ จากนั้นเส้นทาง request จะอ่านจาก snapshot เท่านั้น
- การกรอง active-surface จะมีผลระหว่าง activation: refs ที่ resolve ไม่ได้บนพื้นผิวที่เปิดใช้งานจะทำให้ startup/reload ล้มเหลว ส่วนพื้นผิวที่ไม่ทำงานจะถูกข้ามพร้อม diagnostics

---

## ที่เก็บ Auth

```json5
{
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai-codex:personal": { provider: "openai-codex", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      "openai-codex": ["openai-codex:personal"],
    },
  },
}
```

- โปรไฟล์รายเอเจนต์จะถูกเก็บไว้ที่ `<agentDir>/auth-profiles.json`
- `auth-profiles.json` รองรับ refs ระดับค่า (`keyRef` สำหรับ `api_key`, `tokenRef` สำหรับ `token`) สำหรับโหมดข้อมูลรับรองแบบคงที่
- โปรไฟล์โหมด OAuth (`auth.profiles.<id>.mode = "oauth"`) ไม่รองรับข้อมูลรับรองใน auth-profile ที่อิง SecretRef
- ข้อมูลรับรอง runtime แบบคงที่มาจาก snapshots ในหน่วยความจำที่ resolve แล้ว; รายการ `auth.json` แบบคงที่เก่าจะถูกล้างเมื่อพบ
- รองรับการนำเข้า OAuth แบบเดิมจาก `~/.openclaw/credentials/oauth.json`
- ดู [OAuth](/th/concepts/oauth)
- พฤติกรรมรันไทม์ของ secrets และเครื่องมือ `audit/configure/apply`: [Secrets Management](/th/gateway/secrets)

### `auth.cooldowns`

```json5
{
  auth: {
    cooldowns: {
      billingBackoffHours: 5,
      billingBackoffHoursByProvider: { anthropic: 3, openai: 8 },
      billingMaxHours: 24,
      authPermanentBackoffMinutes: 10,
      authPermanentMaxMinutes: 60,
      failureWindowHours: 24,
      overloadedProfileRotations: 1,
      overloadedBackoffMs: 0,
      rateLimitedProfileRotations: 1,
    },
  },
}
```

- `billingBackoffHours`: backoff พื้นฐานเป็นชั่วโมงเมื่อโปรไฟล์ล้มเหลวเพราะ
  ข้อผิดพลาด billing/เครดิตไม่พอจริงๆ (ค่าเริ่มต้น: `5`) ข้อความ billing แบบ explicit
  ยังสามารถตกมาที่นี่ได้แม้ตอบกลับเป็น `401`/`403` แต่ text matchers
  เฉพาะ provider จะยังคงจำกัดอยู่ภายใต้ provider ที่เป็นเจ้าของเท่านั้น (เช่น OpenRouter
  `Key limit exceeded`) ส่วนข้อความ `402` ที่ retry ได้เกี่ยวกับ usage-window หรือ
  spend-limit ระดับ organization/workspace จะยังคงอยู่ในเส้นทาง `rate_limit`
  แทน
- `billingBackoffHoursByProvider`: การแทนที่แบบไม่บังคับราย provider สำหรับ billing backoff เป็นชั่วโมง
- `billingMaxHours`: เพดานเป็นชั่วโมงสำหรับการเติบโตแบบเอ็กซ์โปเนนเชียลของ billing backoff (ค่าเริ่มต้น: `24`)
- `authPermanentBackoffMinutes`: backoff พื้นฐานเป็นนาทีสำหรับความล้มเหลว `auth_permanent` ที่มีความเชื่อมั่นสูง (ค่าเริ่มต้น: `10`)
- `authPermanentMaxMinutes`: เพดานเป็นนาทีสำหรับการเติบโตของ backoff แบบ `auth_permanent` (ค่าเริ่มต้น: `60`)
- `failureWindowHours`: หน้าต่างเวลาแบบ rolling เป็นชั่วโมงที่ใช้สำหรับตัวนับ backoff (ค่าเริ่มต้น: `24`)
- `overloadedProfileRotations`: จำนวนการหมุน auth-profile สูงสุดภายใน provider เดียวกันสำหรับข้อผิดพลาดแบบ overloaded ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) รูปแบบ provider-busy เช่น `ModelNotReadyException` จะมาตกที่นี่
- `overloadedBackoffMs`: การหน่วงเวลาแบบคงที่ก่อนลองหมุน overloaded provider/profile ใหม่ (ค่าเริ่มต้น: `0`)
- `rateLimitedProfileRotations`: จำนวนการหมุน auth-profile สูงสุดภายใน provider เดียวกันสำหรับข้อผิดพลาด rate-limit ก่อนสลับไปใช้ model fallback (ค่าเริ่มต้น: `1`) กลุ่ม rate-limit นี้รวมข้อความที่มีลักษณะเฉพาะของ provider เช่น `Too many concurrent requests`, `ThrottlingException`, `concurrency limit reached`, `workers_ai ... quota limit exceeded` และ `resource exhausted`

---

## Logging

```json5
{
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty", // pretty | compact | json
    redactSensitive: "tools", // off | tools
    redactPatterns: ["\\bTOKEN\\b\\s*[=:]\\s*([\"']?)([^\\s\"']+)\\1"],
  },
}
```

- ไฟล์ล็อกเริ่มต้น: `/tmp/openclaw/openclaw-YYYY-MM-DD.log`
- ตั้ง `logging.file` เพื่อใช้พาธคงที่
- `consoleLevel` จะเพิ่มเป็น `debug` เมื่อใช้ `--verbose`
- `maxFileBytes`: ขนาดไฟล์ล็อกสูงสุดเป็นไบต์ก่อนระบบจะระงับการเขียน (จำนวนเต็มบวก; ค่าเริ่มต้น: `524288000` = 500 MB) สำหรับ production deployments ควรใช้ external log rotation

---

## Diagnostics

```json5
{
  diagnostics: {
    enabled: true,
    flags: ["telegram.*"],
    stuckSessionWarnMs: 30000,

    otel: {
      enabled: false,
      endpoint: "https://otel-collector.example.com:4318",
      protocol: "http/protobuf", // http/protobuf | grpc
      headers: { "x-tenant-id": "my-org" },
      serviceName: "openclaw-gateway",
      traces: true,
      metrics: true,
      logs: false,
      sampleRate: 1.0,
      flushIntervalMs: 5000,
    },

    cacheTrace: {
      enabled: false,
      filePath: "~/.openclaw/logs/cache-trace.jsonl",
      includeMessages: true,
      includePrompt: true,
      includeSystem: true,
    },
  },
}
```

- `enabled`: สวิตช์หลักสำหรับเอาต์พุต instrumentation (ค่าเริ่มต้น: `true`)
- `flags`: อาร์เรย์ของสตริงแฟล็กที่เปิดใช้เอาต์พุตล็อกแบบเจาะจงเป้าหมาย (รองรับไวลด์การ์ดเช่น `"telegram.*"` หรือ `"*"`)
- `stuckSessionWarnMs`: เกณฑ์อายุเป็นมิลลิวินาทีสำหรับการปล่อยคำเตือน stuck-session ขณะที่เซสชันยังอยู่ในสถานะกำลังประมวลผล
- `otel.enabled`: เปิดใช้ OpenTelemetry export pipeline (ค่าเริ่มต้น: `false`)
- `otel.endpoint`: collector URL สำหรับ OTel export
- `otel.protocol`: `"http/protobuf"` (ค่าเริ่มต้น) หรือ `"grpc"`
- `otel.headers`: HTTP/gRPC metadata headers เพิ่มเติมที่ส่งไปพร้อมคำขอ OTel export
- `otel.serviceName`: ชื่อ service สำหรับ resource attributes
- `otel.traces` / `otel.metrics` / `otel.logs`: เปิดใช้การส่งออก trace, metrics หรือ logs
- `otel.sampleRate`: อัตรา trace sampling `0`–`1`
- `otel.flushIntervalMs`: ช่วงเวลา flush telemetry แบบเป็นระยะในหน่วยมิลลิวินาที
- `cacheTrace.enabled`: บันทึก cache trace snapshots สำหรับ embedded runs (ค่าเริ่มต้น: `false`)
- `cacheTrace.filePath`: พาธเอาต์พุตสำหรับ cache trace JSONL (ค่าเริ่มต้น: `$OPENCLAW_STATE_DIR/logs/cache-trace.jsonl`)
- `cacheTrace.includeMessages` / `includePrompt` / `includeSystem`: ควบคุมสิ่งที่จะรวมในเอาต์พุตของ cache trace (ทั้งหมดมีค่าเริ่มต้นเป็น `true`)

---

## Update

```json5
{
  update: {
    channel: "stable", // stable | beta | dev
    checkOnStart: true,

    auto: {
      enabled: false,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

- `channel`: release channel สำหรับการติดตั้งแบบ npm/git — `"stable"`, `"beta"` หรือ `"dev"`
- `checkOnStart`: ตรวจสอบอัปเดตของ npm เมื่อ gateway เริ่มทำงาน (ค่าเริ่มต้น: `true`)
- `auto.enabled`: เปิดใช้ background auto-update สำหรับการติดตั้งแบบ package (ค่าเริ่มต้น: `false`)
- `auto.stableDelayHours`: ระยะหน่วงขั้นต่ำเป็นชั่วโมงก่อน auto-apply สำหรับ stable-channel (ค่าเริ่มต้น: `6`; สูงสุด: `168`)
- `auto.stableJitterHours`: หน้าต่างการกระจาย rollout เพิ่มเติมของ stable-channel เป็นชั่วโมง (ค่าเริ่มต้น: `12`; สูงสุด: `168`)
- `auto.betaCheckIntervalHours`: ความถี่ในการตรวจสอบของ beta-channel เป็นชั่วโมง (ค่าเริ่มต้น: `1`; สูงสุด: `24`)

---

## ACP

```json5
{
  acp: {
    enabled: false,
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "main",
    allowedAgents: ["main", "ops"],
    maxConcurrentSessions: 10,

    stream: {
      coalesceIdleMs: 50,
      maxChunkChars: 1000,
      repeatSuppression: true,
      deliveryMode: "live", // live | final_only
      hiddenBoundarySeparator: "paragraph", // none | space | newline | paragraph
      maxOutputChars: 50000,
      maxSessionUpdateChars: 500,
    },

    runtime: {
      ttlMinutes: 30,
    },
  },
}
```

- `enabled`: global ACP feature gate (ค่าเริ่มต้น: `false`)
- `dispatch.enabled`: เกตแยกอิสระสำหรับ ACP session turn dispatch (ค่าเริ่มต้น: `true`) ตั้งเป็น `false` เพื่อคงให้ใช้ ACP commands ได้แต่บล็อกการทำงาน
- `backend`: default ACP runtime backend id (ต้องตรงกับ ACP runtime plugin ที่ลงทะเบียนไว้)
- `defaultAgent`: ACP target agent id แบบ fallback เมื่อการ spawn ไม่ได้ระบุเป้าหมายชัดเจน
- `allowedAgents`: allowlist ของ agent ids ที่อนุญาตสำหรับ ACP runtime sessions; ว่างหมายถึงไม่มีการจำกัดเพิ่มเติม
- `maxConcurrentSessions`: จำนวน ACP sessions ที่ active พร้อมกันได้สูงสุด
- `stream.coalesceIdleMs`: หน้าต่าง idle flush เป็นมิลลิวินาทีสำหรับข้อความสตรีม
- `stream.maxChunkChars`: ขนาด chunk สูงสุดก่อนแยกการฉายบล็อกแบบสตรีม
- `stream.repeatSuppression`: ระงับบรรทัดสถานะ/เครื่องมือที่ซ้ำกันต่อเทิร์น (ค่าเริ่มต้น: `true`)
- `stream.deliveryMode`: `"live"` จะสตรีมแบบค่อยเป็นค่อยไป; `"final_only"` จะบัฟเฟอร์จนถึง terminal events ของเทิร์น
- `stream.hiddenBoundarySeparator`: ตัวคั่นก่อนข้อความที่มองเห็นได้หลัง hidden tool events (ค่าเริ่มต้น: `"paragraph"`)
- `stream.maxOutputChars`: จำนวนอักขระสูงสุดของเอาต์พุต assistant ที่ฉายต่อ ACP turn
- `stream.maxSessionUpdateChars`: จำนวนอักขระสูงสุดสำหรับ ACP status/update lines ที่ฉาย
- `stream.tagVisibility`: บันทึกการแทนที่การมองเห็นของชื่อแท็กเป็นบูลีนสำหรับ streamed events
- `runtime.ttlMinutes`: idle TTL เป็นนาทีสำหรับ ACP session workers ก่อนมีสิทธิ์ถูก cleanup
- `runtime.installCommand`: คำสั่งติดตั้งแบบไม่บังคับที่จะรันเมื่อ bootstrap ACP runtime environment

---

## CLI

```json5
{
  cli: {
    banner: {
      taglineMode: "off", // random | default | off
    },
  },
}
```

- `cli.banner.taglineMode` ควบคุมสไตล์ tagline ของแบนเนอร์:
  - `"random"` (ค่าเริ่มต้น): tagline แบบหมุนเวียน แนวขำ/ตามฤดูกาล
  - `"default"`: tagline กลางๆ แบบคงที่ (`All your chats, one OpenClaw.`)
  - `"off"`: ไม่แสดงข้อความ tagline (ยังคงแสดงชื่อ/เวอร์ชันในแบนเนอร์)
- หากต้องการซ่อนทั้งแบนเนอร์ (ไม่ใช่แค่ taglines) ให้ตั้ง env `OPENCLAW_HIDE_BANNER=1`

---

## Wizard

เมทาดาทาที่ CLI guided setup flows (`onboard`, `configure`, `doctor`) เขียนไว้:

```json5
{
  wizard: {
    lastRunAt: "2026-01-01T00:00:00.000Z",
    lastRunVersion: "2026.1.4",
    lastRunCommit: "abc1234",
    lastRunCommand: "configure",
    lastRunMode: "local",
  },
}
```

---

## Identity

ดูฟิลด์ identity ใน `agents.list` ภายใต้ [ค่าเริ่มต้นของเอเจนต์](#agent-defaults)

---

## Bridge (แบบเดิม, ถูกถอดออกแล้ว)

รุ่นปัจจุบันไม่มี TCP bridge แล้ว ปัจจุบัน nodes เชื่อมต่อผ่าน Gateway WebSocket คีย์ `bridge.*` ไม่เป็นส่วนหนึ่งของ config schema อีกต่อไป (การตรวจสอบจะล้มเหลวจนกว่าจะลบออก; `openclaw doctor --fix` สามารถลบคีย์ที่ไม่รู้จักได้)

<Accordion title="การตั้งค่า bridge แบบเดิม (เพื่ออ้างอิงทางประวัติศาสตร์)">

```json
{
  "bridge": {
    "enabled": true,
    "port": 18790,
    "bind": "tailnet",
    "tls": {
      "enabled": true,
      "autoGenerate": true
    }
  }
}
```

</Accordion>

---

## Cron

```json5
{
  cron: {
    enabled: true,
    maxConcurrentRuns: 2,
    webhook: "https://example.invalid/legacy", // fallback แบบเลิกใช้แล้วสำหรับงาน notify:true ที่เก็บไว้
    webhookToken: "replace-with-dedicated-token", // bearer token แบบไม่บังคับสำหรับ outbound webhook auth
    sessionRetention: "24h", // สตริงระยะเวลา หรือ false
    runLog: {
      maxBytes: "2mb", // ค่าเริ่มต้น 2_000_000 ไบต์
      keepLines: 2000, // ค่าเริ่มต้น 2000
    },
  },
}
```

- `sessionRetention`: ระยะเวลาที่จะเก็บ completed isolated cron run sessions ไว้ก่อน prune ออกจาก `sessions.json` และยังควบคุมการ cleanup ของ archived deleted cron transcripts ด้วย ค่าเริ่มต้น: `24h`; ตั้งเป็น `false` เพื่อปิดใช้งาน
- `runLog.maxBytes`: ขนาดสูงสุดต่อไฟล์ run log (`cron/runs/<jobId>.jsonl`) ก่อน pruning ค่าเริ่มต้น: `2_000_000` ไบต์
- `runLog.keepLines`: จำนวนบรรทัดล่าสุดที่จะเก็บไว้เมื่อเกิดการ prune run-log ค่าเริ่มต้น: `2000`
- `webhookToken`: bearer token ที่ใช้สำหรับการส่ง cron webhook POST (`delivery.mode = "webhook"`); หากไม่ระบุจะไม่ส่ง auth header
- `webhook`: deprecated legacy fallback webhook URL (http/https) ใช้เฉพาะกับงานที่เก็บไว้ซึ่งยังมี `notify: true`

### `cron.retry`

```json5
{
  cron: {
    retry: {
      maxAttempts: 3,
      backoffMs: [30000, 60000, 300000],
      retryOn: ["rate_limit", "overloaded", "network", "timeout", "server_error"],
    },
  },
}
```

- `maxAttempts`: จำนวน retry สูงสุดสำหรับ one-shot jobs เมื่อเกิดข้อผิดพลาดชั่วคราว (ค่าเริ่มต้น: `3`; ช่วง: `0`–`10`)
- `backoffMs`: อาร์เรย์ของระยะหน่วง backoff เป็นมิลลิวินาทีสำหรับแต่ละการ retry (ค่าเริ่มต้น: `[30000, 60000, 300000]`; 1–10 รายการ)
- `retryOn`: ประเภทข้อผิดพลาดที่กระตุ้นการ retry — `"rate_limit"`, `"overloaded"`, `"network"`, `"timeout"`, `"server_error"` หากไม่ระบุจะ retry สำหรับทุกประเภทชั่วคราว

มีผลเฉพาะกับ one-shot cron jobs ส่วน recurring jobs ใช้การจัดการความล้มเหลวแยกต่างหาก

### `cron.failureAlert`

```json5
{
  cron: {
    failureAlert: {
      enabled: false,
      after: 3,
      cooldownMs: 3600000,
      mode: "announce",
      accountId: "main",
    },
  },
}
```

- `enabled`: เปิดใช้การแจ้งเตือนความล้มเหลวสำหรับ cron jobs (ค่าเริ่มต้น: `false`)
- `after`: จำนวนความล้มเหลวติดต่อกันก่อนที่จะมีการแจ้งเตือน (จำนวนเต็มบวก, ขั้นต่ำ: `1`)
- `cooldownMs`: จำนวนมิลลิวินาทีขั้นต่ำระหว่างการแจ้งเตือนซ้ำสำหรับงานเดียวกัน (จำนวนเต็มไม่ติดลบ)
- `mode`: โหมดการส่ง — `"announce"` จะส่งผ่านข้อความในช่องทาง; `"webhook"` จะโพสต์ไปยัง webhook ที่ตั้งค่าไว้
- `accountId`: account หรือ channel id แบบไม่บังคับเพื่อกำหนดขอบเขตการส่งการแจ้งเตือน

### `cron.failureDestination`

```json5
{
  cron: {
    failureDestination: {
      mode: "announce",
      channel: "last",
      to: "channel:C1234567890",
      accountId: "main",
    },
  },
}
```

- ปลายทางเริ่มต้นสำหรับการแจ้งเตือนความล้มเหลวของ cron ครอบคลุมทุกงาน
- `mode`: `"announce"` หรือ `"webhook"`; มีค่าเริ่มต้นเป็น `"announce"` เมื่อมีข้อมูลเป้าหมายเพียงพอ
- `channel`: การแทนที่ช่องทางสำหรับการส่งแบบ announce ค่า `"last"` จะใช้ช่องทางส่งล่าสุดที่ทราบ
- `to`: เป้าหมายแบบ announce หรือ URL ของ webhook แบบ explicit จำเป็นสำหรับโหมด webhook
- `accountId`: การแทนที่บัญชีสำหรับการส่งแบบไม่บังคับ
- `delivery.failureDestination` ระดับรายงานจะ override ค่าเริ่มต้นทั่วทั้งระบบนี้
- เมื่อไม่ได้ตั้งทั้งปลายทางความล้มเหลวระดับทั่วทั้งระบบและรายงาน งานที่ส่งผ่าน `announce` อยู่แล้วจะ fallback ไปยังเป้าหมาย announce หลักนั้นเมื่อเกิดความล้มเหลว
- `delivery.failureDestination` รองรับเฉพาะงาน `sessionTarget="isolated"` เว้นแต่ `delivery.mode` หลักของงานจะเป็น `"webhook"`

ดู [Cron Jobs](/th/automation/cron-jobs) ส่วนการรัน cron แบบ isolated จะถูกติดตามเป็น [background tasks](/th/automation/tasks)

---

## ตัวแปรเทมเพลตของ media model

placeholders ในเทมเพลตที่ขยายใน `tools.media.models[].args`:

| Variable           | Description                                       |
| ------------------ | ------------------------------------------------- |
| `{{Body}}`         | เนื้อหาข้อความขาเข้าทั้งหมด                         |
| `{{RawBody}}`      | เนื้อหาดิบ (ไม่มี wrappers ของ history/sender)             |
| `{{BodyStripped}}` | เนื้อหาที่ตัด group mentions ออกแล้ว                 |
| `{{From}}`         | ตัวระบุผู้ส่ง                                 |
| `{{To}}`           | ตัวระบุปลายทาง                            |
| `{{MessageSid}}`   | id ของข้อความในช่องทาง                                |
| `{{SessionId}}`    | UUID ของเซสชันปัจจุบัน                              |
| `{{IsNewSession}}` | `"true"` เมื่อมีการสร้างเซสชันใหม่                 |
| `{{MediaUrl}}`     | pseudo-URL ของสื่อขาเข้า                          |
| `{{MediaPath}}`    | พาธสื่อในเครื่อง                                  |
| `{{MediaType}}`    | ประเภทสื่อ (image/audio/document/…)               |
| `{{Transcript}}`   | transcript ของเสียง                                  |
| `{{Prompt}}`       | media prompt ที่ resolve แล้วสำหรับ CLI entries             |
| `{{MaxChars}}`     | จำนวนอักขระสูงสุดที่ resolve แล้วสำหรับ CLI entries         |
| `{{ChatType}}`     | `"direct"` หรือ `"group"`                           |
| `{{GroupSubject}}` | หัวข้อของกลุ่ม (best effort)                       |
| `{{GroupMembers}}` | ตัวอย่างสมาชิกของกลุ่ม (best effort)               |
| `{{SenderName}}`   | ชื่อที่แสดงของผู้ส่ง (best effort)                 |
| `{{SenderE164}}`   | หมายเลขโทรศัพท์ของผู้ส่ง (best effort)                 |
| `{{Provider}}`     | คำใบ้ของ provider (whatsapp, telegram, discord ฯลฯ) |

---

## Config includes (`$include`)

แยก config ออกเป็นหลายไฟล์:

```json5
// ~/.openclaw/openclaw.json
{
  gateway: { port: 18789 },
  agents: { $include: "./agents.json5" },
  broadcast: {
    $include: ["./clients/mueller.json5", "./clients/schmidt.json5"],
  },
}
```

**พฤติกรรมการ merge:**

- ไฟล์เดี่ยว: ใช้แทนที่ออบเจ็กต์ที่ครอบอยู่ทั้งหมด
- อาร์เรย์ของไฟล์: deep-merge ตามลำดับ (ไฟล์หลังสุดจะ override ไฟล์ก่อนหน้า)
- คีย์ข้างเคียง: จะถูก merge หลัง includes (override ค่าที่ include มา)
- includes แบบซ้อน: ลึกได้สูงสุด 10 ระดับ
- พาธ: resolve แบบอิงจากไฟล์ที่ include แต่ต้องยังอยู่ภายในไดเรกทอรี config ระดับบนสุด (`dirname` ของ `openclaw.json`) รูปแบบ absolute/`../` อนุญาตได้เฉพาะเมื่อ resolve แล้วยังอยู่ภายในขอบเขตนั้น
- การเขียนที่ OpenClaw เป็นเจ้าของซึ่งเปลี่ยนเฉพาะหนึ่ง top-level section ที่อิง single-file include จะเขียนผ่านไปยังไฟล์ที่ include นั้น ตัวอย่างเช่น `plugins install` จะอัปเดต `plugins: { $include: "./plugins.json5" }` ใน `plugins.json5` และปล่อย `openclaw.json` ไว้เหมือนเดิม
- root includes, include arrays และ includes ที่มี sibling overrides เป็นแบบอ่านอย่างเดียวสำหรับการเขียนที่ OpenClaw เป็นเจ้าของ; การเขียนเหล่านั้นจะ fail closed แทนที่จะ flatten config
- ข้อผิดพลาด: มีข้อความชัดเจนสำหรับกรณีไฟล์หาย parse error และ circular includes

---

_ที่เกี่ยวข้อง: [Configuration](/th/gateway/configuration) · [Configuration Examples](/th/gateway/configuration-examples) · [Doctor](/th/gateway/doctor)_
