---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าตามช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว, นโยบายกลุ่ม หรือการควบคุมการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์แยกตามช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-03T21:31:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 366bcee632c649219bbf6cf44d64cc13d966ec813abc74d54088d89de640b47c
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าตามช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การจำกัดด้วยการกล่าวถึง, และคีย์ตามช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางที่มาพร้อมชุดอื่น ๆ

สำหรับเอเจนต์, เครื่องมือ, รันไทม์ของ Gateway และคีย์ระดับบนสุดอื่น ๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (ยกเว้น `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่จัดเก็บอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (ยังคงใช้การจำกัดด้วยการกล่าวถึง) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากไม่มีบล็อกผู้ให้บริการทั้งหมด (`channels.<provider>` ไม่อยู่) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดไว้ก่อนเมื่อผิดพลาด) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลตามช่องทาง

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

ใช้ `channels.defaults` สำหรับนโยบายกลุ่มและลักษณะการทำงานของ Heartbeat ที่ใช้ร่วมกันระหว่างผู้ให้บริการ:

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่เก็บบริบท quote/reply ที่ระบุชัดเจนไว้) การแทนที่ตามช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติดีในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมคุณภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) โดยจะเริ่มทำงานอัตโนมัติเมื่อมีเซสชันที่เชื่อมโยงอยู่

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่ มิฉะนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวรุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่ตามบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น ปฏิเสธ symlink) โดยมี `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบคำต่อท้าย `/bot<TOKEN>` ที่เผลอใส่ไว้
- `channels.telegram.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- พรีวิวสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานในแชทโดยตรงและแชทกลุ่ม)
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น ส่วนการลองใหม่/การตั้งค่านโยบายของบัญชียังคงมาจากบัญชีที่เลือกใน snapshot runtime ที่ใช้งานอยู่
- `channels.discord.defaultAccount` ที่เป็นตัวเลือกเสริมจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ
- slug ของ guild เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ของช่องใช้ชื่อแบบ slug (ไม่มี `#`) แนะนำให้ใช้ ID ของ guild
- ข้อความที่บอทเป็นผู้เขียนจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` จะเปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และ override ของช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จะแมปข้อความ `@handle` ขาออกที่เสถียรไปยัง Discord user IDs ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดซ้ำได้แม้แคชไดเรกทอรีชั่วคราวจะว่างเปล่า override รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแบ่งข้อความที่สูงแม้จะต่ำกว่า 2000 ตัวอักษร
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทาง Discord แบบผูกกับ thread:
  - `enabled`: override ของ Discord สำหรับฟีเจอร์ session แบบผูกกับ thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: override ของ Discord สำหรับการ auto-unfocus เมื่อไม่มีกิจกรรม หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: override ของ Discord สำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูก thread อัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟสำหรับ spawn ที่ผูกกับ thread (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและ threads (ใช้ channel/thread id ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการ auto-join + LLM + TTS override ที่เป็นตัวเลือกเสริม การตั้งค่า Discord แบบข้อความเท่านั้นจะปิดเสียงโดยค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้งาน
- `channels.discord.voice.model` override model LLM ที่ใช้สำหรับการตอบกลับช่องเสียง Discord ได้ตามต้องการ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` โดยค่าเริ่มต้น)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (`30000` โดยค่าเริ่มต้น)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่ session เสียงที่ถูกตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่สัญญาณ reconnect ก่อนที่ OpenClaw จะทำลาย session นั้น (`15000` โดยค่าเริ่มต้น)
- นอกจากนี้ OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วม session เสียงใหม่หลังจากการถอดรหัสล้มเหลวซ้ำๆ
- `channels.discord.streaming` เป็นคีย์โหมด stream หลัก ค่า legacy `streamMode` และค่า boolean `streaming` จะถูก migrate โดยอัตโนมัติ
- `channels.discord.autoPresence` จะแมปความพร้อมใช้งานของ runtime ไปยังสถานะบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้ override ข้อความสถานะได้ตามต้องการ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/tag ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดเข้ากันได้แบบ break-glass)
- `channels.discord.execApprovals`: การส่งมอบการอนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Discord user IDs ที่อนุญาตให้อนุมัติคำขอ exec fallback ไปที่ `commands.ownerAllowFrom` เมื่อละไว้
  - `agentFilter`: allowlist ของ agent ID ที่เป็นตัวเลือกเสริม ละไว้เพื่อส่งต่อการอนุมัติสำหรับ agents ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์ session ที่เป็นตัวเลือกเสริม (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อ target รวม `"channel"` ปุ่มจะใช้งานได้เฉพาะโดยผู้อนุมัติที่ resolve ได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากการอนุมัติ การปฏิเสธ หรือ timeout

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ข้อความทั้งหมด), `allowlist` (จาก `guilds.<id>.users` บนข้อความทั้งหมด)

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
- รองรับ SecretRef ของ service account เช่นกัน (`serviceAccountRef`)
- fallback ของ env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
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

- **Socket mode** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ fallback env ของบัญชีเริ่มต้น)
- **HTTP mode** ต้องใช้ `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี)
- `socketMode` ส่งต่อการปรับแต่ง transport ของ Slack SDK Socket Mode ไปยัง API receiver สาธารณะของ Bolt ใช้เฉพาะเมื่อตรวจสอบ timeout ของ ping/pong หรือพฤติกรรม websocket ที่ค้าง
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริง plaintext
  หรือออบเจกต์ SecretRef
- snapshot ของบัญชี Slack แสดงฟิลด์ source/status ราย credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และใน HTTP mode
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่ path ของ command/runtime ปัจจุบันไม่สามารถ
  resolve ค่าลับได้
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` ที่เป็นตัวเลือกเสริมจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` เป็นคีย์โหมด stream หลักของ Slack `channels.slack.streaming.nativeTransport` ควบคุม transport streaming แบบเนทีฟของ Slack ค่า legacy `streamMode`, boolean `streaming` และค่า `nativeStreaming` จะถูก migrate โดยอัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยก session ของ thread:** `thread.historyScope` เป็นแบบต่อ thread (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่อง `thread.inheritParent` คัดลอก transcript ของช่อง parent ไปยัง thread ใหม่

- การ streaming แบบเนทีฟของ Slack พร้อมสถานะ thread แบบผู้ช่วยของ Slack ที่ว่า "is typing..." ต้องมีเป้าหมาย thread สำหรับตอบกลับ DM ระดับบนสุดยังคงไม่อยู่ใน thread โดยค่าเริ่มต้น ดังนั้นยังสามารถ stream ผ่าน preview แบบโพสต์ draft แล้วแก้ไขของ Slack แทนการแสดง preview ของ stream/status แบบเนทีฟสไตล์ thread ได้
- `typingReaction` เพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าในขณะที่การตอบกลับกำลังทำงาน แล้วลบออกเมื่อเสร็จสิ้น ใช้ shortcode emoji ของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งมอบการอนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่ม action | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | React + แสดงรายการ reactions |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | pin/unpin/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการ emoji แบบกำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin ที่ bundled ใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือ
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

โหมดแชต: `oncall` (ตอบสนองเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย prefix trigger)

เมื่อเปิดใช้งาน command แบบเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw Gateway และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- slash callback แบบ native จะ authenticate ด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งกลับมา
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับ callback host แบบ private/tailnet/internal, Mattermost อาจกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` ต้องมี callback host/domain อยู่ด้วย
  ให้ใช้ค่า host/domain ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: override การควบคุมด้วย mention รายช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่านั้นตรงกับ id ของบัญชีที่ตั้งค่าไว้

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

- `channels.signal.account`: กำหนดให้การเริ่มต้นช่องผูกกับตัวตนบัญชี Signal ที่เจาะจง
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่านั้นตรงกับ id ของบัญชีที่ตั้งค่าไว้

### BlueBubbles

BlueBubbles คือเส้นทาง iMessage ที่แนะนำ (มี Plugin รองรับ และตั้งค่าใต้ `channels.bluebubbles`)

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
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่านั้นตรงกับ id ของบัญชีที่ตั้งค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles กับเซสชัน ACP แบบถาวรได้ ใช้ handle ของ BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- การตั้งค่าช่อง BlueBubbles ฉบับเต็มมีเอกสารอยู่ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw จะ spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่านั้นตรงกับ id ของบัญชีที่ตั้งค่าไว้

- ต้องมี Full Disk Access ไปยัง DB ของ Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้ ให้ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key อย่างเข้มงวด ดังนั้นต้องแน่ใจว่าคีย์ของ relay host มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage กับเซสชัน ACP แบบถาวรได้ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชตแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix มี Plugin รองรับและตั้งค่าใต้ `channels.matrix`

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

- การ auth ด้วยโทเค็นใช้ `accessToken`; การ auth ด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` route ทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถ override ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver แบบ private/internal `proxy` และการ opt-in เครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในชุดตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ได้รับเชิญและคำเชิญแบบ DM ใหม่จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งการอนุมัติ exec แบบ native ของ Matrix และการ authorize ผู้อนุมัติ
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ ละเว้นเพื่อส่งต่อการอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: pattern คีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`
  - override รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม Matrix DM เป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม peer ที่ถูก route ส่วน `per-room` จะแยกแต่ละห้อง DM ออกจากกัน
- การ probe สถานะ Matrix และการ lookup ไดเรกทอรีแบบ live ใช้นโยบายพร็อกซีเดียวกับทราฟฟิก runtime
- การตั้งค่า Matrix ฉบับเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารอยู่ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams มี Plugin รองรับและตั้งค่าใต้ `channels.msteams`

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
- config ของ Teams ฉบับเต็ม (credentials, webhook, นโยบาย DM/group, override รายทีม/รายช่อง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC มี Plugin รองรับและตั้งค่าใต้ `channels.irc`

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
- `channels.irc.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่านั้นตรงกับ id ของบัญชีที่ตั้งค่าไว้
- การตั้งค่าช่อง IRC ฉบับเต็ม (host/port/TLS/channels/allowlists/การควบคุมด้วย mention) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การ route)
- โทเค็น env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่าช่องพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูก override รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยัง agent อื่น
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ช่อง) ขณะที่ยังใช้ config ช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะ promote ค่าระดับบนสุดแบบบัญชีเดียวที่อยู่ใน scope บัญชีเข้าไปในแผนที่บัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านั้นเข้าไปที่ `channels.<channel>.accounts.default`; Matrix สามารถรักษาเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วไว้แทนได้
- binding ที่มีอยู่ซึ่งระบุเฉพาะช่อง (ไม่มี `accountId`) จะยัง match กับบัญชี default; binding ที่อยู่ใน scope บัญชียังคงเป็นตัวเลือก
- `openclaw doctor --fix` ยังซ่อมรูปแบบผสมด้วยการย้ายค่าระดับบนสุดแบบบัญชีเดียวที่อยู่ใน scope บัญชีเข้าไปในบัญชีที่ถูก promote สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถรักษาเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วไว้แทนได้

### ช่อง Plugin อื่น

ช่อง Plugin จำนวนมากตั้งค่าเป็น `channels.<id>` และมีเอกสารอยู่ในหน้าช่องเฉพาะของตน (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องฉบับเต็ม: [ช่อง](/th/channels)

### การควบคุมด้วย mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (metadata mention หรือ pattern regex ที่ปลอดภัย) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องแบบ group/channel มีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผล turn แต่การตอบกลับสุดท้ายปกติจะยังเป็น private และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรม legacy ที่การตอบกลับปกติถูกโพสต์กลับไปยังห้อง หากต้องการใช้พฤติกรรม visible-reply แบบ tool-only เดียวกันกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; harness ของ Codex ยังใช้พฤติกรรม tool-only นั้นเป็นค่าเริ่มต้นของแชตโดยตรงเมื่อไม่ได้ตั้งค่าไว้ด้วย

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะ fallback ไปใช้การตอบกลับที่มองเห็นได้แบบ automatic แทนที่จะ suppress การตอบสนองอย่างเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะ hot-reload config `messages` หลังจากบันทึกไฟล์ restart เฉพาะเมื่อ file watching หรือการ reload config ถูกปิดใช้งานในการ deploy

**ประเภท mention:**

- **Metadata mentions**: @-mention แบบ native ของแพลตฟอร์ม ถูกละเว้นในโหมด self-chat ของ WhatsApp
- **Text patterns**: pattern regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` pattern ที่ไม่ถูกต้องและการทำซ้ำแบบ nested ที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุมด้วย mention จะถูกบังคับใช้เฉพาะเมื่อการตรวจจับเป็นไปได้เท่านั้น (native mention หรืออย่างน้อยหนึ่ง pattern)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องทางสามารถเขียนทับได้ด้วย `channels.<channel>.historyLimit` (หรือกำหนดต่อบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของ source-turn; `messages.groupChat.visibleReplies` เขียนทับค่านี้สำหรับ source turns ของกลุ่ม/ช่องทาง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` harness สามารถระบุค่าเริ่มต้น direct/source ของตัวเองได้; harness ของ Codex มีค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของช่องทางและการกำหนดให้กล่าวถึงยังคงเป็นตัวตัดสินว่า turn จะถูกประมวลผลหรือไม่

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

การแก้ค่า: การเขียนทับต่อ DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตนเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตนเอง (ไม่สนใจ @-mentions แบบเนทีฟ และตอบกลับเฉพาะรูปแบบข้อความเท่านั้น):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน โปรดดู [Slash Commands](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิง config-key** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/Plugin ของคำสั่งนั้น ๆ รวมถึง [Slash Commands](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวล้วน** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปล่อยให้ Slack ปิดอยู่
- `nativeSkills: "auto"` เปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปล่อยให้ Slack ปิดอยู่
- เขียนทับต่อช่องทาง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งเนทีฟระหว่างเริ่มต้น
- เขียนทับการลงทะเบียน Skills แบบเนทีฟต่อช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้งาน `! <cmd>` สำหรับ shell ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรยังต้องมี `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ operator ที่มีขอบเขตการเขียนปกติ
- `mcp: true` เปิดใช้งาน `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้งาน `/plugins` สำหรับการค้นพบ Plugin การติดตั้ง และการควบคุมเปิด/ปิด
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลง config ต่อช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่เจาะจงบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการทำงานของเครื่องมือรีสตาร์ท Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตของเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือสำหรับเจ้าของเท่านั้น แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮช owner ids ใน system prompt ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นรายผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องทางและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบาย access-group เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนผังเอกสารคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [Slash Commands](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [Channels](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [Pairing](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
