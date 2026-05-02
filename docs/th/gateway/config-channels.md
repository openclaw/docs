---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าต่อช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการควบคุมการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ คีย์แยกตามช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-02T22:19:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5231efba32fab480313c05dfd5dcec12e32020a79001c4a72df4c3844966e65e
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าต่อช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การควบคุมด้วยการเมนชัน, และคีย์ต่อช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่น ๆ ที่รวมมาให้

สำหรับเอเจนต์, เครื่องมือ, รันไทม์ของ Gateway และคีย์ระดับบนอื่น ๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้น (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (ยังคงใช้การควบคุมด้วยการเมนชัน) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากไม่มีบล็อกผู้ให้บริการทั้งหมด (`channels.<provider>` ไม่อยู่) นโยบายกลุ่มของรันไทม์จะถอยกลับไปใช้ `allowlist` (ปิดเมื่อไม่แน่ใจ) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องทางเฉพาะกับโมเดล ค่าใช้รูปแบบ `provider/model` หรือชื่อแทนโมเดลที่กำหนดค่าไว้ได้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (ตัวอย่างเช่น ตั้งผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับนโยบายกลุ่มและพฤติกรรม Heartbeat ที่ใช้ร่วมกันระหว่างผู้ให้บริการ:

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทอ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือนกับ allowlist แต่คงบริบทการอ้างอิง/ตอบกลับที่ระบุชัดเจนไว้) การแทนที่ต่อช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมสภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงผลเอาต์พุต Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) โดยจะเริ่มทำงานโดยอัตโนมัติเมื่อมีเซสชันที่ลิงก์ไว้

```json5
{
  web: {
    whatsapp: {
      keepAliveIntervalMs: 25000,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่; มิฉะนั้นจะใช้ ID บัญชีที่กำหนดค่าไว้รายการแรก (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวรุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่ต่อบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; ปฏิเสธ symlink) โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่ fallback สำหรับบัญชีเริ่มต้น
- `apiRoot` คือรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบคำต่อท้าย `/bot<TOKEN>` ที่เผลอใส่ไว้
- `channels.telegram.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางแบบ fallback; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID ซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานในแชตโดยตรงและแชตกลุ่ม)
- นโยบายการลองใหม่: ดู [นโยบายการลองใหม่](/th/concepts/retry)

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

- Token: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็นค่า fallback สำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้ token นั้นสำหรับการเรียกนั้น การตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกใน snapshot runtime ที่ใช้งานอยู่
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ
- slug ของ guild เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; key ของช่องใช้ชื่อแบบ slug (ไม่มี `#`) ควรใช้ ID ของ guild
- ข้อความที่เขียนโดยบอทจะถูกละเว้นตามค่าเริ่มต้น `allowBots: true` เปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือ role อื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จับคู่ข้อความ `@handle` ขาออกที่คงที่กับ ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้สามารถกล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้เมื่อแคชไดเรกทอรีชั่วคราวว่างเปล่า การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แยกข้อความที่สูงออกเป็นหลายส่วนแม้จะต่ำกว่า 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ของ Discord สำหรับฟีเจอร์เซสชันแบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ของ Discord สำหรับการ auto-unfocus เมื่อไม่มีความเคลื่อนไหว หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ของ Discord สำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent แบบ native สำหรับการ spawn ที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่า ACP binding แบบถาวรสำหรับช่องและเธรด (ใช้ id ช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียงของ Discord และการ auto-join แบบไม่บังคับพร้อมการแทนที่ LLM + TTS การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงไว้ตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้งาน
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord ได้แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (ค่าเริ่มต้นคือ `30000`)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ถูกตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่สัญญาณ reconnect ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (ค่าเริ่มต้นคือ `15000`)
- OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำ
- `channels.discord.streaming` คือ key โหมดสตรีมมาตรฐาน ค่า legacy `streamMode` และค่า boolean `streaming` จะถูกย้ายข้อมูลอัตโนมัติ
- `channels.discord.autoPresence` จับคู่ความพร้อมใช้งานของ runtime กับ presence ของบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตการแทนที่ข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/tag ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดเข้ากันได้แบบ break-glass)
- `channels.discord.execApprovals`: การส่งคำอนุมัติ exec แบบ native ของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะทำงานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec ใช้ fallback เป็น `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: รูปแบบ key เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปยังทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้ได้เฉพาะโดยผู้อนุมัติที่ resolve ได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` ในทุกข้อความ)

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

- JSON ของ service account: แบบ inline (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของ service account ด้วย (`serviceAccountRef`)
- ค่า fallback จาก env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดเข้ากันได้แบบ break-glass)

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

- **โหมด Socket** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ fallback env ของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี)
- `socketMode` ส่งผ่านการปรับแต่ง transport ของ Slack SDK Socket Mode ไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบ timeout ping/pong หรือพฤติกรรม websocket ค้างเท่านั้น
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริง plaintext
  หรือออบเจกต์ SecretRef
- snapshot บัญชี Slack แสดงฟิลด์แหล่งที่มา/สถานะราย credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/runtime ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือ key โหมดสตรีมมาตรฐานของ Slack `channels.slack.streaming.nativeTransport` ควบคุม transport สตรีมมิง native ของ Slack ค่า legacy `streamMode`, ค่า boolean `streaming` และค่า `nativeStreaming` จะถูกย้ายข้อมูลอัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบรายเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่อง `thread.inheritParent` คัดลอก transcript ของช่องแม่ไปยังเธรดใหม่

- สตรีมมิง native ของ Slack พร้อมสถานะเธรดแบบผู้ช่วยของ Slack ที่ว่า "is typing..." ต้องมีเป้าหมายเธรดตอบกลับ DM ระดับบนสุดอยู่นอกเธรดตามค่าเริ่มต้น จึงใช้ `typingReaction` หรือการส่งตามปกติแทน preview แบบเธรด
- `typingReaction` เพิ่ม reaction ชั่วคราวให้ข้อความ Slack ขาเข้าขณะกำลังตอบกลับ จากนั้นลบเมื่อเสร็จสิ้น ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำอนุมัติ exec แบบ native ของ Slack และการอนุญาตผู้อนุมัติ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่ม action | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + แสดงรายการ reactions |
| messages     | enabled | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | enabled | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | enabled | ข้อมูลสมาชิก            |
| emojiList    | enabled | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost มาพร้อมเป็น Plugin ที่ bundled ใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือ
build แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost` ตรวจสอบ
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
สำหรับ dist-tags ปัจจุบันก่อน pin เวอร์ชัน

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

โหมดแชต: `oncall` (ตอบเมื่อถูก @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย prefix ทริกเกอร์)

เมื่อเปิดใช้งานคำสั่ง native ของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw gateway และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback แบบ slash ดั้งเดิมจะถูกยืนยันตัวตนด้วยโทเคนต่อคำสั่งที่ Mattermost ส่งกลับมา
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบ private/tailnet/internal Mattermost อาจต้องกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมน callback ไว้ด้วย
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มโดย Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่ mention-gating ต่อช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

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

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ตรึงการเริ่มต้นช่องกับตัวตนบัญชี Signal เฉพาะ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มโดย Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles เป็นพาธ iMessage ที่แนะนำ (รองรับด้วย Plugin และกำหนดค่าใต้ `channels.bluebubbles`)

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

- พาธคีย์หลักที่ครอบคลุมที่นี่: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles กับเซสชัน ACP แบบถาวรได้ ใช้ handle ของ BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- การกำหนดค่าช่อง BlueBubbles ฉบับเต็มมีเอกสารใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw เรียกใช้ `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องมี Full Disk Access สำหรับ DB ของ Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่า key ของโฮสต์ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มโดย iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage กับเซสชัน ACP แบบถาวรได้ ใช้ handle ที่ทำให้เป็นรูปแบบมาตรฐานแล้วหรือเป้าหมายแชตที่ระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix รองรับด้วย Plugin และกำหนดค่าใต้ `channels.matrix`

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

- การยืนยันตัวตนด้วยโทเคนใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการ opt-in เครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญใหม่แบบ DM จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งมอบการอนุมัติ exec แบบ native ของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่ต่อบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ Matrix DM จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตาม peer ที่กำหนดเส้นทาง ส่วน `per-room` แยกแต่ละห้อง DM ออกจากกัน
- การ probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบายพร็อกซีเดียวกับทราฟฟิกรันไทม์
- การกำหนดค่า Matrix ฉบับเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับด้วย Plugin และกำหนดค่าใต้ `channels.msteams`

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

- พาธคีย์หลักที่ครอบคลุมที่นี่: `channels.msteams`, `channels.msteams.configWrites`
- การกำหนดค่า Teams ฉบับเต็ม (credentials, Webhook, นโยบาย DM/กลุ่ม, การแทนที่ต่อทีม/ต่อช่อง) มีเอกสารใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC รองรับด้วย Plugin และกำหนดค่าใต้ `channels.irc`

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

- พาธคีย์หลักที่ครอบคลุมที่นี่: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่อง IRC ฉบับเต็ม (host/port/TLS/channels/allowlists/mention gating) มีเอกสารใน [IRC](/th/channels/irc)

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
- โทเคน env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่าช่องพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่ต่อบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ช่อง) ขณะที่ยังใช้ config ช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะโปรโมตค่าบัญชีเดียวระดับบนสุดที่เป็นขอบเขตบัญชีเข้าไปในแผนที่บัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานต่อไป ช่องส่วนใหญ่จะย้ายค่าเหล่านั้นไปที่ `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันที่มีอยู่แทนได้
- binding แบบช่องเท่านั้นที่มีอยู่ (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น; binding ที่มีขอบเขตบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมรูปร่างแบบผสมโดยย้ายค่าบัญชีเดียวระดับบนสุดที่มีขอบเขตบัญชีเข้าไปในบัญชีที่โปรโมตซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันที่มีอยู่แทนได้

### ช่อง Plugin อื่น ๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องเฉพาะของตน (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องฉบับเต็ม: [ช่อง](/th/channels)

### Mention gating ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังประมวลผล turn แต่การตอบกลับสุดท้ายปกติจะยังคงเป็นส่วนตัว และเอาต์พุตห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่โพสต์การตอบกลับปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้ tool เท่านั้นเดียวกันกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; harness ของ Codex ยังใช้พฤติกรรมแบบใช้ tool เท่านั้นนั้นเป็นค่าเริ่มต้นของแชตโดยตรงเมื่อไม่ได้ตั้งค่า

หาก message tool ไม่พร้อมใช้งานภายใต้นโยบาย tool ที่ใช้งานอยู่ OpenClaw จะ fallback เป็นการตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนที่จะระงับคำตอบอย่างเงียบ ๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

gateway hot-reload config `messages` หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการ reload config ถูกปิดใช้งานในการปรับใช้

**ประเภท mention:**

- **Metadata mentions**: @-mentions แบบ native ของแพลตฟอร์ม ถูกละเว้นในโหมด self-chat ของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบ nested ที่ไม่ปลอดภัยจะถูกละเว้น
- Mention gating จะถูกบังคับใช้เฉพาะเมื่อการตรวจจับทำได้ (native mentions หรืออย่างน้อยหนึ่งรูปแบบ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง Channel สามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือแบบรายบัญชี) ตั้งเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของ source-turn; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับ source turn ของกลุ่ม/Channel เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` harness สามารถให้ค่าเริ่มต้น direct/source ของตัวเองได้; Codex harness มีค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของ Channel และการควบคุมด้วยการ mention ยังเป็นตัวตัดสินว่า turn จะถูกประมวลผลหรือไม่

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

การแก้ค่า: การแทนที่ต่อ DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตนเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมดแชตกับตนเอง (ละเว้น @-mentions แบบเนทีฟ และตอบเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่บันเดิลมาปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ Channel/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้า Channel/Plugin ของตนเอง รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- แทนที่ต่อ Channel: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้า
- แทนที่การลงทะเบียน Skills แบบเนทีฟต่อ Channel ด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์โฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรยังต้องใช้ `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ operator ที่มีขอบเขตการเขียนปกติ
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการ ภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าต่อ Channel (ค่าเริ่มต้น: true)
- สำหรับ Channel หลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่มุ่งเป้าไปยังบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการกระทำของเครื่องมือรีสตาร์ท Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาต owner แบบชัดเจนสำหรับคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะ owner เท่านั้น แยกจาก `allowFrom`
- `ownerDisplay: "hash"` จะแฮช owner ids ใน system prompt ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบต่อผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้คือแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของ Channel และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัว + ที่บันเดิลมา: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะ Channel: [Channel](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวม Channel](/th/channels)
