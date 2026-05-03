---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว นโยบายกลุ่ม หรือการควบคุมการเข้าถึงด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง, การจับคู่, คีย์เฉพาะแต่ละช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-03T10:11:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5ec4aad94a844f6e2f936b2e0d208343ea264c9a4c74f7fc610c516e0353b53b
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าแยกตามช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การควบคุมด้วยการกล่าวถึง, และคีย์แยกตามช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่นๆ ที่มาพร้อมระบบ

สำหรับเอเจนต์, เครื่องมือ, รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้น (ยกเว้น `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การควบคุมด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากไม่มีบล็อกผู้ให้บริการทั้งบล็อก (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดไว้ก่อนเมื่อผิดพลาด) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องทางเฉพาะไว้กับโมเดล ค่ารองรับ `provider/model` หรือ alias ของโมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับพฤติกรรมนโยบายกลุ่มและ Heartbeat ที่ใช้ร่วมกันระหว่างผู้ให้บริการ:

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่เก็บบริบท quote/reply ที่ระบุชัดเจนไว้) การแทนที่แยกตามช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมคุณภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) โดยจะเริ่มทำงานโดยอัตโนมัติเมื่อมีเซสชันที่เชื่อมโยงอยู่

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

<Accordion title="WhatsApp หลายบัญชี">

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
- `channels.whatsapp.defaultAccount` ที่ไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวรุ่นเก่าถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่แยกตามบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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

- โทเค็นบอท: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; symlink ถูกปฏิเสธ), โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` เป็น root ของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือ root แบบ self-hosted/proxy ของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบ suffix `/bot<TOKEN>` ที่ต่อท้ายโดยไม่ตั้งใจ
- `channels.telegram.defaultAccount` ที่ไม่บังคับจะใช้แทนการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนค่ากำหนดที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่า binding ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ในแชตโดยตรงและแชตกลุ่ม)
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

- โทเคน: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็นทางเลือกสำรองสำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเคนนั้นสำหรับการเรียกนั้น การตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะเขียนทับการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (ข้อความส่วนตัว) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง รหัสตัวเลขล้วนจะถูกปฏิเสธ
- สลักของกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-` คีย์ช่องใช้ชื่อแบบสลัก (ไม่มี `#`) แนะนำให้ใช้รหัสกิลด์
- ข้อความที่เขียนโดยบอตจะถูกละเว้นตามค่าเริ่มต้น `allowBots: true` เปิดใช้งานข้อความเหล่านี้ ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการเขียนทับระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้อื่นหรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` แมปข้อความ `@handle` ขาออกที่เสถียรไปยังรหัสผู้ใช้ Discord ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่ การเขียนทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แบ่งข้อความที่สูงออก แม้จะต่ำกว่า 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การเขียนทับของ Discord สำหรับฟีเจอร์เซสชันแบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การเขียนทับของ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การเขียนทับของ Discord สำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติเมื่อสร้างเธรด ACP (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบทซับเอเจนต์เนทีฟสำหรับการสร้างแบบผูกกับเธรด (`"fork"` ตามค่าเริ่มต้น)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบคงอยู่สำหรับช่องและเธรด (ใช้รหัสช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ส่วนประกอบ Discord v2
- `channels.discord.voice` เปิดใช้งานการสนทนาช่องเสียงของ Discord และการเข้าร่วมอัตโนมัติพร้อมการเขียนทับ LLM และ TTS แบบตัวเลือกเสริม การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงตามค่าเริ่มต้น ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกใช้งาน
- `channels.discord.voice.model` เขียนทับโมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord ได้แบบตัวเลือกเสริม
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ (`30000` ตามค่าเริ่มต้น)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ตัดการเชื่อมต่อสามารถใช้เพื่อเข้าสู่การส่งสัญญาณเชื่อมต่อใหม่ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (`15000` ตามค่าเริ่มต้น)
- OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังจากการถอดรหัสล้มเหลวซ้ำ ๆ
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน ค่าเดิม `streamMode` และค่า `streaming` แบบบูลีนจะถูกย้ายข้อมูลอัตโนมัติ
- `channels.discord.autoPresence` แมปความพร้อมใช้งานของรันไทม์ไปยังสถานะของบอต (สมบูรณ์ => ออนไลน์, เสื่อมคุณภาพ => ว่าง, ใช้หมด => ห้ามรบกวน) และอนุญาตให้เขียนทับข้อความสถานะแบบตัวเลือกเสริมได้
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดเข้ากันได้แบบฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถแปลงผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: รหัสผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec ถ้าไม่ได้ระบุ จะถอยไปใช้ `commands.ownerAllowFrom`
  - `agentFilter`: รายการอนุญาตรหัสเอเจนต์แบบตัวเลือกเสริม ไม่ต้องระบุเพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบตัวเลือกเสริม (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยังข้อความส่วนตัวของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปยังทั้งสองที่ เมื่อเป้าหมายมี `"channel"` ปุ่มจะใช้ได้เฉพาะผู้อนุมัติที่แปลงได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบข้อความส่วนตัวการอนุมัติหลังอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือนปฏิกิริยา:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` บนทุกข้อความ)

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

- JSON บัญชีบริการ: แบบอินไลน์ (`serviceAccount`) หรือแบบอิงไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของบัญชีบริการด้วย (`serviceAccountRef`)
- ทางเลือกสำรองจากสภาพแวดล้อม: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดเข้ากันได้แบบฉุกเฉิน)

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

- **โหมดซ็อกเก็ต** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับทางเลือกสำรองจากสภาพแวดล้อมของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่รากหรือรายบัญชี)
- `socketMode` ส่งผ่านการปรับแต่งการขนส่ง Socket Mode ของ Slack SDK ไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหา timeout ของ ping/pong หรือพฤติกรรม websocket ค้าง
- `botToken`, `appToken`, `signingSecret` และ `userToken` ยอมรับสตริงข้อความธรรมดาหรือวัตถุ SecretRef
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะรายข้อมูลรับรอง เช่น `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูกกำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถแปลงค่าลับได้
- `configWrites: false` บล็อกการเขียนค่ากำหนดที่เริ่มต้นจาก Slack
- `channels.slack.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะเขียนทับการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีม Slack มาตรฐาน `channels.slack.streaming.nativeTransport` ควบคุมการขนส่งสตรีมมิงเนทีฟของ Slack ค่าเดิม `streamMode`, ค่า `streaming` แบบบูลีน และค่า `nativeStreaming` จะถูกย้ายข้อมูลอัตโนมัติ
- ใช้ `user:<id>` (ข้อความส่วนตัว) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนปฏิกิริยา:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบรายเธรด (ค่าเริ่มต้น) หรือแชร์ทั่วทั้งช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ช่องหลักไปยังเธรดใหม่

- สตรีมมิงเนทีฟของ Slack รวมถึงสถานะเธรดแบบผู้ช่วยของ Slack ที่ว่า "is typing..." ต้องมีเป้าหมายเธรดตอบกลับ ข้อความส่วนตัวระดับบนสุดยังคงอยู่นอกเธรดตามค่าเริ่มต้น จึงยังสามารถสตรีมผ่านการแสดงตัวอย่างแบบโพสต์ฉบับร่างและแก้ไขของ Slack แทนการแสดงตัวอย่างสตรีม/สถานะแบบเนทีฟชนิดเธรด
- `typingReaction` เพิ่มปฏิกิริยาชั่วคราวให้กับข้อความ Slack ขาเข้าในขณะที่การตอบกลับกำลังทำงาน แล้วลบออกเมื่อเสร็จสิ้น ใช้รหัสย่ออีโมจิของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ ใช้สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (รหัสผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | ตอบสนอง + แสดงรายการปฏิกิริยา |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost มาพร้อมเป็น Plugin แบบบันเดิลใน OpenClaw รุ่นปัจจุบัน บิลด์เก่าหรือบิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย `openclaw plugins install @openclaw/mattermost` ตรวจสอบ [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) สำหรับ dist-tags ปัจจุบันก่อนตรึงเวอร์ชัน

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

โหมดแชต: `oncall` (ตอบกลับเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้งานคำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยังปลายทาง Gateway ของ OpenClaw และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- คอลแบ็ก slash แบบเนทีฟจะถูกยืนยันตัวตนด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งกลับ
  ระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธคอลแบ็กด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์คอลแบ็กแบบส่วนตัว/tailnet/ภายใน Mattermost อาจต้องกำหนด
  `ServiceSettings.AllowedUntrustedInternalConnections` ให้รวมโฮสต์/โดเมนคอลแบ็กไว้ด้วย
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: override การควบคุม mention รายช่อง (`"*"` สำหรับค่าเริ่มต้น)
- ตัวเลือก `channels.mattermost.defaultAccount` จะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

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

- `channels.signal.account`: ปักการเริ่มต้นช่องไว้กับข้อมูลระบุตัวตนบัญชี Signal เฉพาะ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- ตัวเลือก `channels.signal.defaultAccount` จะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles เป็นพาธ iMessage ที่แนะนำ (รองรับโดย Plugin และกำหนดค่าใต้ `channels.bluebubbles`)

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
- ตัวเลือก `channels.bluebubbles.defaultAccount` จะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles กับเซสชัน ACP ถาวรได้ ใช้ handle ของ BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- การกำหนดค่าช่อง BlueBubbles แบบเต็มมีเอกสารอยู่ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต

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

- ตัวเลือก `channels.imessage.defaultAccount` จะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องมี Full Disk Access สำหรับ Messages DB
- ควรใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้ ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่า key ของโฮสต์ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage กับเซสชัน ACP ถาวรได้ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชตแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง SSH wrapper สำหรับ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix รองรับโดย Plugin และกำหนดค่าใต้ `channels.matrix`

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
- `channels.matrix.proxy` route ทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถ override ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการ opt-in เครือข่ายนี้เป็นตัวควบคุมคนละส่วนกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญใหม่แบบ DM จะถูกละเว้นจนกว่าคุณจะตั้ง `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto คำอนุมัติ exec จะเปิดใช้งานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ เว้นไว้เพื่อส่งต่อคำอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: pattern คีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt คำอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`
  - override รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตาม peer ที่ route แล้ว ส่วน `per-room` แยกแต่ละห้อง DM
- probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบาย proxy เดียวกับทราฟฟิก runtime
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารอยู่ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับโดย Plugin และกำหนดค่าใต้ `channels.msteams`

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
- config ของ Teams แบบเต็ม (credentials, Webhook, นโยบาย DM/group, override รายทีม/รายช่อง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC รองรับโดย Plugin และกำหนดค่าใต้ `channels.irc`

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
- ตัวเลือก `channels.irc.defaultAccount` จะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่อง IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่อง)

เรียกใช้หลายบัญชีต่อช่อง (แต่ละบัญชีมี `accountId` ของตัวเอง):

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

- `default` จะถูกใช้เมื่อไม่มีการระบุ `accountId` (CLI + routing)
- โทเค็น env ใช้ได้เฉพาะกับบัญชี **default** เท่านั้น
- การตั้งค่าช่องพื้นฐานใช้กับทุกบัญชี เว้นแต่จะ override รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยัง agent ที่ต่างกัน
- หากคุณเพิ่มบัญชีที่ไม่ใช่ default ผ่าน `openclaw channels add` (หรือการ onboarding ช่อง) ขณะที่ยังใช้ config ช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะโปรโมตค่าระดับบนสุดแบบบัญชีเดียวที่อยู่ใน scope ของบัญชีเข้าไปใน map บัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านั้นไปที่ `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/default ที่ตรงกันอยู่เดิมไว้แทนได้
- binding ที่มีอยู่เดิมแบบเฉพาะช่อง (ไม่มี `accountId`) จะยัง match กับบัญชี default; binding ที่อยู่ใน scope ของบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบที่ผสมกันโดยย้ายค่าระดับบนสุดแบบบัญชีเดียวที่อยู่ใน scope ของบัญชีเข้าไปในบัญชีที่โปรโมตซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/default ที่ตรงกันอยู่เดิมไว้แทนได้

### ช่อง Plugin อื่นๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารอยู่ในหน้าช่องเฉพาะของแต่ละช่อง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทั้งหมด: [ช่อง](/th/channels)

### การควบคุมด้วย mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (mention จาก metadata หรือ pattern regex ที่ปลอดภัย) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผล turn แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และผลลัพธ์ในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่โพสต์การตอบกลับปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นกับแชตโดยตรงด้วย ให้ตั้ง `messages.visibleReplies: "message_tool"`; harness ของ Codex ก็ใช้พฤติกรรมแบบใช้เครื่องมือเท่านั้นนี้เป็นค่าเริ่มต้นของแชตโดยตรงเมื่อไม่ได้ตั้งค่าไว้เช่นกัน

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะ fallback ไปเป็นการตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนที่จะระงับการตอบกลับอย่างเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะ hot-reload config `messages` หลังจากบันทึกไฟล์แล้ว restart เฉพาะเมื่อการเฝ้าดูไฟล์หรือการ reload config ถูกปิดใช้งานในการ deploy

**ประเภท mention:**

- **Metadata mentions**: @-mentions แบบเนทีฟของแพลตฟอร์ม ถูกละเว้นในโหมด self-chat ของ WhatsApp
- **Text patterns**: pattern regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` pattern ที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุม mention จะบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (mention แบบเนทีฟหรืออย่างน้อยหนึ่ง pattern)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องทางสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี) ตั้งเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของรอบต้นทาง; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับรอบต้นทางแบบกลุ่ม/ช่องทาง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` ชุดทดสอบสามารถระบุค่าเริ่มต้นสำหรับ direct/source ของตัวเองได้; ชุดทดสอบ Codex ใช้ค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของช่องทางและการกำหนดให้กล่าวถึงยังคงเป็นตัวตัดสินว่าจะประมวลผลรอบนั้นหรือไม่

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

ลำดับการเลือกค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้นการกล่าวถึง @ แบบเนทีฟ และตอบเฉพาะกับรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแคตตาล็อกคำสั่งในตัว + ที่บันเดิลในปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แคตตาล็อกคำสั่งทั้งหมด คำสั่งที่เป็นของช่องทาง/Plugin เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone`, และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/Plugin ของแต่ละรายการ รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวล้วน** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills เนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- แทนที่รายช่องทาง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้
- แทนที่การลงทะเบียน Skills เนทีฟรายช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้งาน `! <cmd>` สำหรับเชลล์โฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรยังต้องใช้ `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ operator ที่มีขอบเขตการเขียนตามปกติ
- `mcp: true` เปิดใช้งาน `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้งาน `/plugins` สำหรับการค้นหา Plugin, การติดตั้ง, และการควบคุมเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ควบคุมการกลายพันธุ์ของการกำหนดค่ารายช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่เล็งไปยังบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการกระทำของเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือเฉพาะเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮช ID เจ้าของในพรอมป์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบรายผู้ให้บริการ เมื่อตั้งค่าแล้ว จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องทางและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แคตตาล็อกในตัว + ที่บันเดิล: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - Dreaming ของหน่วยความจำ: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
