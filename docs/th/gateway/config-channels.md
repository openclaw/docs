---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว, นโยบายกลุ่ม หรือการจำกัดตามการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์ต่อช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-10T19:36:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 841f3cf73b561f2cf171152a323463f6570f3638c4049ec4a174b0cd69faf14d
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การบังคับให้กล่าวถึง, และคีย์รายช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage, และ Plugin ช่องทางอื่นที่รวมมาให้

สำหรับ agent, เครื่องมือ, รันไทม์ Gateway, และคีย์ระดับบนสุดอื่น ๆ โปรดดู
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้น (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | ละเว้น DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การบังคับให้กล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากไม่มีบล็อกผู้ให้บริการเลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มขณะรันไทม์จะถอยกลับไปใช้ `allowlist` (ปิดเมื่อไม่แน่ใจ) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องทางเฉพาะกับโมเดล ค่ารองรับ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับพฤติกรรมนโยบายกลุ่มและ Heartbeat ที่ใช้ร่วมกันข้ามผู้ให้บริการ:

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบททั้งหมดจากการอ้างอิง/เธรด/ประวัติ), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่เก็บบริบทการอ้างอิง/ตอบกลับที่ชัดเจนไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมสภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) โดยจะเริ่มอัตโนมัติเมื่อมีเซสชันที่ลิงก์อยู่

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่ มิฉะนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวเดิมจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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
      apiRoot: "https://api.telegram.org",
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น ไม่รับ symlink) โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือราก Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนท้าย `/bot<TOKEN>` ที่เผลอใส่มา
- `channels.telegram.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้ขาดหายหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [Agent ACP](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานในแชตโดยตรงและแชตกลุ่ม)
- นโยบายการลองซ้ำ: ดู [นโยบายการลองซ้ำ](/th/concepts/retry)

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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก ส่วนการตั้งค่าการลองใหม่/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` ที่เป็นทางเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง; ID ตัวเลขแบบเปล่าจะถูกปฏิเสธ
- สลักกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อแบบสลัก (ไม่มี `#`) แนะนำให้ใช้ ID กิลด์
- ข้อความที่เขียนโดยบอทจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` เปิดใช้งานข้อความเหล่านี้; ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` แมปข้อความ `@handle` ขาออกที่เสถียรกับ ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้เมื่อแคชไดเรกทอรีชั่วคราวว่างอยู่ การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แยกข้อความที่สูงยาวแม้อยู่ต่ำกว่า 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ของ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ของ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีความเคลื่อนไหว หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ของ Discord สำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบทซับเอเจนต์แบบเนทีฟสำหรับการสปอว์นที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์คอมโพเนนต์ Discord v2
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการแทนที่แบบทางเลือกสำหรับการเข้าร่วมอัตโนมัติ + โมเดลภาษาใหญ่ + การแปลงข้อความเป็นเสียง คอนฟิก Discord แบบข้อความเท่านั้นจะปิดเสียงไว้โดยค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกใช้
- `channels.discord.voice.model` แทนที่โมเดลภาษาใหญ่ที่ใช้สำหรับการตอบกลับช่องเสียง Discord ได้ตามต้องการ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ (ค่าเริ่มต้น `30000`)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่การส่งสัญญาณเชื่อมต่อใหม่ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (ค่าเริ่มต้น `15000`)
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะโดยเหตุการณ์เริ่มพูดของผู้ใช้อื่น เพื่อหลีกเลี่ยงลูปฟีดแบ็ก OpenClaw จะละเว้นการจับเสียงใหม่ขณะกำลังเล่นการแปลงข้อความเป็นเสียง
- นอกจากนี้ OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำ ๆ
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความตัวอย่างที่แก้ไขแล้วหนึ่งข้อความ; ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน ค่า `streamMode` แบบเดิมและค่า `streaming` แบบบูลีนยังคงเป็นนามแฝงของรันไทม์; เรียกใช้ `openclaw doctor --fix` เพื่อเขียนคอนฟิกที่บันทึกไว้ใหม่
- `channels.discord.autoPresence` แมปความพร้อมใช้งานของรันไทม์กับสถานะบอท (ปกติ => ออนไลน์, เสื่อมถอย => ไม่ว่าง, หมดโควตา => ห้ามรบกวน) และอนุญาตให้แทนที่ข้อความสถานะได้ตามต้องการ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้ยามฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติ exec จะทำงานเมื่อสามารถระบุผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ
  - `agentFilter`: รายการอนุญาต ID เอเจนต์ที่เป็นทางเลือก ไม่ระบุเพื่อส่งต่อการอนุมัติสำหรับทุกเอเจนต์
  - `sessionFilter`: รูปแบบคีย์เซสชันที่เป็นทางเลือก (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปยังทั้งสองที่ เมื่อเป้าหมายมี `"channel"` ปุ่มจะใช้งานได้เฉพาะโดยผู้อนุมัติที่ระบุได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM อนุมัติหลังจากการอนุมัติ การปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` ในทุกข้อความ)

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

- JSON บัญชีบริการ: แบบอินไลน์ (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของบัญชีบริการด้วย (`serviceAccountRef`)
- ค่าสำรองจากสภาพแวดล้อม: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่พรินซิเพิลอีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้ยามฉุกเฉิน)

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

- **โหมดซ็อกเก็ต** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับค่าสำรองจากสภาพแวดล้อมของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องใช้ `botToken` พร้อม `signingSecret` (ที่รูทหรือต่อบัญชี)
- `socketMode` ส่งผ่านการปรับแต่งทรานสปอร์ต Socket Mode ของ Slack SDK ไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหาไทม์เอาต์ ping/pong หรือพฤติกรรมเว็บซ็อกเก็ตค้าง
- `botToken`, `appToken`, `signingSecret` และ `userToken` ยอมรับสตริงข้อความธรรมดาหรืออ็อบเจ็กต์ SecretRef
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะต่อข้อมูลรับรอง เช่น `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถระบุค่าลับได้
- `configWrites: false` บล็อกการเขียนคอนฟิกที่เริ่มจาก Slack
- `channels.slack.defaultAccount` ที่เป็นทางเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack `channels.slack.streaming.nativeTransport` ควบคุมทรานสปอร์ตสตรีมมิงแบบเนทีฟของ Slack ค่า `streamMode` แบบเดิม, ค่า `streaming` แบบบูลีน และค่า `nativeStreaming` ยังคงเป็นนามแฝงของรันไทม์; เรียกใช้ `openclaw doctor --fix` เพื่อเขียนคอนฟิกที่บันทึกไว้ใหม่
- `unfurlLinks` และ `unfurlMedia` ส่งผ่านบูลีนการแสดงตัวอย่างลิงก์และสื่อของ `chat.postMessage` ของ Slack สำหรับการตอบกลับของบอท ไม่ระบุเพื่อคงพฤติกรรมเริ่มต้นของ Slack; ตั้งค่าที่ `channels.slack.accounts.<accountId>` เพื่อแทนที่ค่าเริ่มต้นระดับบนสุดสำหรับหนึ่งบัญชี
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบต่อเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ของช่องพาเรนต์ไปยังเธรดใหม่

- สตรีมมิงแบบเนทีฟของ Slack ร่วมกับสถานะเธรด "กำลังพิมพ์..." แบบผู้ช่วยของ Slack ต้องมีเป้าหมายเธรดตอบกลับ DM ระดับบนสุดยังคงอยู่นอกเธรดโดยค่าเริ่มต้น ดังนั้นจึงยังสามารถสตรีมผ่านตัวอย่างแบบร่างโพสต์และแก้ไขของ Slack แทนการแสดงตัวอย่างสตรีม/สถานะแบบเนทีฟสไตล์เธรด
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะกำลังเรียกใช้การตอบกลับ แล้วลบออกเมื่อเสร็จสิ้น ใช้ชอร์ตโค้ดอีโมจิของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | รีแอ็กต์ + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือบิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย `openclaw plugins install @openclaw/mattermost` ตรวจสอบ [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) สำหรับ dist-tags ปัจจุบันก่อนปักตรึงเวอร์ชัน

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

โหมดแชต: `oncall` (ตอบสนองเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้คำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยังปลายทาง OpenClaw Gateway และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- คอลแบ็ก slash แบบเนทีฟจะได้รับการยืนยันตัวตนด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งกลับระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มีคำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธคอลแบ็กด้วย `Unauthorized: invalid command token.`
- สำหรับโฮสต์คอลแบ็กแบบ private/tailnet/internal Mattermost อาจต้องให้ `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนคอลแบ็กไว้ด้วย ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบกลับในช่องทาง
- `channels.mattermost.groups.<channelId>.requireMention`: การ override การบังคับ mention รายช่องทาง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่คอนฟิกไว้

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

- `channels.signal.account`: ตรึงการเริ่มต้นช่องทางกับตัวตนบัญชี Signal เฉพาะ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่คอนฟิกไว้

### iMessage

OpenClaw จะสร้าง `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต นี่คือเส้นทางที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อโฮสต์สามารถให้สิทธิ์ฐานข้อมูล Messages และ Automation ได้

การรองรับ BlueBubbles ถูกนำออกแล้ว ย้ายค่าคอนฟิก `channels.bluebubbles` ไปยัง `channels.imessage`; OpenClaw รองรับ iMessage ผ่าน `imsg` เท่านั้น

หาก Gateway ไม่ได้ทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages ให้คง `channels.imessage.enabled=true` และตั้งค่า `channels.imessage.cliPath` เป็น SSH wrapper ที่เรียกใช้ `imsg "$@"` บน Mac เครื่องนั้น พาธ `imsg` แบบ local เริ่มต้นใช้ได้เฉพาะ macOS เท่านั้น

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

- `channels.imessage.defaultAccount` แบบไม่บังคับ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่คอนฟิกไว้

- ต้องมี Full Disk Access ไปยัง Messages DB
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่า host key ของ relay มีอยู่ใน `~/.ssh/known_hosts` แล้ว
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา iMessage กับเซสชัน ACP แบบคงอยู่ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชตแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ร่วม: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง SSH wrapper สำหรับ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix รองรับผ่าน Plugin และคอนฟิกภายใต้ `channels.matrix`

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
- `channels.matrix.proxy` ส่งทราฟฟิก HTTP ของ Matrix ผ่าน HTTP(S) proxy ที่ระบุอย่างชัดเจน บัญชีที่มีชื่อสามารถ override ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver แบบ private/internal `proxy` และ opt-in เครือข่ายนี้เป็นตัวควบคุมที่แยกกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ได้รับเชิญและคำเชิญแบบ DM ใหม่จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งมอบการอนุมัติ exec แบบเนทีฟของ Matrix และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ เว้นไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การ override รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตาม peer ที่ถูก route ขณะที่ `per-room` แยกห้อง DM แต่ละห้อง
- การ probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบาย proxy เดียวกับทราฟฟิกรันไทม์
- ค่าคอนฟิก Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับผ่าน Plugin และคอนฟิกภายใต้ `channels.msteams`

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
- ค่าคอนฟิก Teams แบบเต็ม (ข้อมูลรับรอง, webhook, นโยบาย DM/กลุ่ม, การ override รายทีม/รายช่องทาง) มีเอกสารใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC รองรับผ่าน Plugin และคอนฟิกภายใต้ `channels.irc`

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
- `channels.irc.defaultAccount` แบบไม่บังคับ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่คอนฟิกไว้
- ค่าคอนฟิกช่องทาง IRC แบบเต็ม (โฮสต์/พอร์ต/TLS/ช่องทาง/allowlists/การบังคับ mention) มีเอกสารใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่องทาง)

เรียกใช้หลายบัญชีต่อช่องทาง (แต่ละบัญชีมี `accountId` ของตัวเอง):

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

- `default` ใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การ route)
- โทเค็น env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูก override รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ช่องทาง) ขณะที่ยังใช้ค่าคอนฟิกช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะ promote ค่าบัญชีเดียวระดับบนสุดที่อยู่ใน scope บัญชีไปไว้ในแผนที่บัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังคงทำงานได้ ช่องทางส่วนใหญ่จะย้ายค่าเหล่านั้นไปยัง `channels.<channel>.accounts.default`; Matrix สามารถรักษาเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วแทนได้
- binding ที่มีอยู่เฉพาะช่องทาง (ไม่มี `accountId`) ยังคงจับคู่กับบัญชี default; binding ที่อยู่ใน scope บัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบผสมโดยย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ใน scope บัญชีไปยังบัญชีที่ promote ซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถรักษาเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วแทนได้

### ช่องทาง Plugin อื่นๆ

ช่องทาง Plugin จำนวนมากคอนฟิกเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตัวเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมด: [ช่องทาง](/th/channels)

### การบังคับ mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องทางมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผล turn แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่โพสต์การตอบกลับตามปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; Codex harness ยังใช้พฤติกรรมแบบใช้เครื่องมือเท่านั้นนั้นเป็นค่าเริ่มต้นของแชตโดยตรงเมื่อไม่ได้ตั้งค่า

การตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นต้องใช้ model/runtime ที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หากบันทึกเซสชันแสดงข้อความผู้ช่วยพร้อม `didSendViaMessagingTool: false` แสดงว่า model สร้างคำตอบสุดท้ายแบบส่วนตัวแทนการเรียกใช้เครื่องมือส่งข้อความ ให้สลับไปใช้ model ที่เรียกใช้เครื่องมือได้แข็งแรงกว่าสำหรับช่องทางนั้น หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อคืนค่าการตอบกลับสุดท้ายที่มองเห็นได้แบบเดิม

หากเครื่องมือส่งข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการกดการตอบสนองไว้เงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์ รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงแบบ metadata**: การ @-mention ดั้งเดิมของแพลตฟอร์ม จะถูกละเว้นในโหมดแชตกับตัวเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนกันที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุมด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (การกล่าวถึงดั้งเดิมหรือมีอย่างน้อยหนึ่งรูปแบบ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องสามารถเขียนทับได้ด้วย `channels.<channel>.historyLimit` (หรือแบบรายบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของ source-turn; `messages.groupChat.visibleReplies` เขียนทับค่านี้สำหรับ source turn ของกลุ่ม/ช่อง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` harness สามารถระบุค่าเริ่มต้น direct/source ของตัวเองได้; Codex harness ใช้ค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของช่องและการควบคุมด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่า turn จะถูกประมวลผลหรือไม่

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

การแก้ค่า: การเขียนทับราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมดแชตกับตัวเอง (ละเว้นการ @-mention ดั้งเดิม ตอบกลับเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่มาพร้อมชุดปัจจุบัน ดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่อง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าช่อง/Plugin ของตนเอง รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดใช้คำสั่งดั้งเดิมสำหรับ Discord/Telegram และปิด Slack ไว้
- `nativeSkills: "auto"` เปิดใช้คำสั่ง skill ดั้งเดิมสำหรับ Discord/Telegram และปิด Slack ไว้
- เขียนทับตามช่อง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งดั้งเดิมระหว่างเริ่มต้น
- เขียนทับการลงทะเบียน skill ดั้งเดิมตามช่องด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ Gateway `chat.send` การเขียน `/config set|unset` แบบถาวรยังต้องมี `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ operator ขอบเขตการเขียนปกติ
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ Plugin, การติดตั้ง และการควบคุมเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าตามช่อง (ค่าเริ่มต้น: true)
- สำหรับช่องแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่มีเป้าหมายเป็นบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการกระทำของเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นรายผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัว + ที่มาพร้อมชุด: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่อง: [ช่อง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - หน่วยความจำ Dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวมช่อง](/th/channels)
