---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว, นโยบายกลุ่ม หรือการจำกัดด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์รายช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-11T20:29:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4199725cdf1216f639ee1c02d5f510e1373edfecacf56977ac3a15d63f207f41
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าต่อช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การควบคุมด้วยการกล่าวถึง, และคีย์ต่อช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางที่รวมมาอื่นๆ.

สำหรับเอเจนต์, เครื่องมือ, รันไทม์ Gateway, และคีย์ระดับบนสุดอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (ยกเว้น `enabled: false`).

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM          | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่จัดเก็บรายการอนุญาตที่จับคู่แล้ว) |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                      |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การควบคุมด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ.
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง. คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**.
หากบล็อกผู้ให้บริการหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะถอยกลับไปใช้ `allowlist` (ปิดไว้ก่อนเมื่อผิดพลาด) พร้อมคำเตือนตอนเริ่มทำงาน.
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อปักหมุด ID ช่องทางเฉพาะกับโมเดล ค่ายอมรับ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`).

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

- `channels.defaults.groupPolicy`: นโยบายกลุ่มสำรองเมื่อไม่ได้ตั้งค่า `groupPolicy` ระดับผู้ให้บริการ.
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทที่ยกคำพูด/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่คงบริบทการยกคำพูด/ตอบกลับที่ระบุชัดเจนไว้). การแทนที่ต่อช่องทาง: `channels.<channel>.contextVisibility`.
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat.
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมคุณภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat.
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด.

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web). ช่องทางนี้จะเริ่มโดยอัตโนมัติเมื่อมีเซสชันที่ลิงก์อยู่.

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่; มิฉะนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว).
- `channels.whatsapp.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้.
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวเดิมจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`.
- การแทนที่ต่อบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`.

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

- โทเคนบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น; ปฏิเสธ symlink), โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น.
- `apiRoot` คือรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากแบบโฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนท้าย `/bot<TOKEN>` ที่เผลอใส่เข้ามา.
- `channels.telegram.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้.
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป), ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง.
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`).
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`). ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings).
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานในแชตโดยตรงและแชตกลุ่ม).
- นโยบายการลองใหม่: ดู [นโยบายการลองใหม่](/th/concepts/retry).

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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น.
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก; การตั้งค่าการลองใหม่/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อต runtime ที่ใช้งานอยู่.
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ.
- slug ของกิลด์เป็นตัวพิมพ์เล็กโดยแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อแบบ slug (ไม่มี `#`). แนะนำให้ใช้ ID กิลด์.
- ข้อความที่บอทเป็นผู้เขียนจะถูกละเว้นโดยค่าเริ่มต้น. `allowBots: true` เปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความบอทที่กล่าวถึงบอทเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการ override ระดับช่อง) จะตัดข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอทออก (ยกเว้น @everyone/@here).
- `channels.discord.mentionAliases` แมปข้อความขาออก `@handle` ที่เสถียรไปยัง ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้สามารถกล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดซ้ำได้แม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่. การ override รายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แยกข้อความที่สูงเป็นหลายส่วนแม้มีความยาวต่ำกว่า 2000 อักขระ.
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทาง Discord ที่ผูกกับเธรด:
  - `enabled`: การ override ของ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age`, และการส่ง/กำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การ override ของ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การ override ของ Discord สำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` โดยค่าเริ่มต้น)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ช่อง/เธรดใน `match.peer.id`). ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ตั้งค่าสี accent สำหรับคอนเทนเนอร์ Discord components v2.
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการ override แบบไม่บังคับสำหรับ auto-join + LLM + TTS. การกำหนดค่า Discord แบบข้อความอย่างเดียวจะปิดเสียงโดยค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้งาน.
- `channels.discord.voice.model` สามารถ override โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord.
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` โดยค่าเริ่มต้น).
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (`30000` โดยค่าเริ่มต้น).
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงซึ่งตัดการเชื่อมต่อสามารถเข้าสู่สัญญาณการเชื่อมต่อใหม่ได้ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (`15000` โดยค่าเริ่มต้น).
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะโดยเหตุการณ์เริ่มพูดของผู้ใช้อื่น. เพื่อหลีกเลี่ยงลูป feedback, OpenClaw จะละเว้นการจับเสียงใหม่ระหว่างที่ TTS กำลังเล่น.
- OpenClaw ยังพยายามกู้คืนการรับเสียงด้วยการออก/เข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำ ๆ.
- `channels.discord.streaming` คือคีย์โหมดสตรีมตามมาตรฐาน. Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความพรีวิวที่แก้ไขเพียงข้อความเดียว; ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน. ค่า legacy `streamMode` และค่า boolean `streaming` ยังคงเป็น alias ใน runtime; รัน `openclaw doctor --fix` เพื่อเขียน config ที่คงอยู่ใหม่.
- `channels.discord.autoPresence` แมปความพร้อมใช้งานของ runtime ไปยัง presence ของบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้ override ข้อความสถานะได้แบบไม่บังคับ.
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบฉุกเฉิน).
- `channels.discord.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ.
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น). ในโหมด auto, การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`.
  - `approvers`: ID ผู้ใช้ Discord ที่ได้รับอนุญาตให้อนุมัติคำขอ exec. fallback เป็น `commands.ownerAllowFrom` เมื่อไม่ระบุ.
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ. ละไว้เพื่อส่งต่อการอนุมัติสำหรับ agent ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมต์อนุมัติ. `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปยังทั้งสองที่. เมื่อ target มี `"channel"` ปุ่มจะใช้งานได้เฉพาะผู้อนุมัติที่ resolve ได้เท่านั้น.
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM อนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา.

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` บนทุกข้อความ).

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

- JSON ของ service account: แบบ inline (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`).
- รองรับ SecretRef ของ service account ด้วย (`serviceAccountRef`).
- fallback ของ env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง.
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ email principal ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบฉุกเฉิน).

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

- **โหมด Socket** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ fallback ของ env บัญชีเริ่มต้น).
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่ระดับ root หรือรายบัญชี).
- `socketMode` ส่งผ่านการปรับแต่ง transport ของ Slack SDK Socket Mode ไปยัง Bolt receiver API สาธารณะ. ใช้เฉพาะเมื่อตรวจสอบ timeout ของ ping/pong หรือพฤติกรรม websocket ที่ค้าง.
- `botToken`, `appToken`, `signingSecret`, และ `userToken` รับสตริง plaintext
  หรืออ็อบเจกต์ SecretRef.
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะราย credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus`, และในโหมด HTTP คือ
  `signingSecretStatus`. `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่ path ของคำสั่ง/runtime ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้.
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack.
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้.
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมของ Slack ตามมาตรฐาน. `channels.slack.streaming.nativeTransport` ควบคุม transport สตรีมมิงแบบเนทีฟของ Slack. ค่า legacy `streamMode`, ค่า boolean `streaming`, และค่า `nativeStreaming` ยังคงเป็น alias ใน runtime; รัน `openclaw doctor --fix` เพื่อเขียน config ที่คงอยู่ใหม่.
- `unfurlLinks` และ `unfurlMedia` ส่งผ่าน boolean สำหรับ link และ media unfurl ของ `chat.postMessage` ใน Slack สำหรับการตอบกลับของบอท. ละไว้เพื่อคงพฤติกรรมเริ่มต้นของ Slack; ตั้งค่าที่ `channels.slack.accounts.<accountId>` เพื่อ override ค่าเริ่มต้นระดับบนสุดสำหรับบัญชีหนึ่งบัญชี.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง.

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`).

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบรายเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั่วทั้งช่อง. `thread.inheritParent` คัดลอก transcript ของช่องแม่ไปยังเธรดใหม่.

- การสตรีมแบบเนทีฟของ Slack ร่วมกับสถานะเธรด "is typing..." แบบผู้ช่วยของ Slack ต้องมีเป้าหมายเธรดตอบกลับ. DM ระดับบนสุดยังคงอยู่นอกเธรดโดยค่าเริ่มต้น จึงยังสามารถสตรีมผ่านพรีวิวแบบโพสต์ฉบับร่างแล้วแก้ไขของ Slack แทนการแสดงพรีวิวสตรีม/สถานะแบบเนทีฟสไตล์เธรด.
- `typingReaction` เพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่การตอบกลับกำลังทำงาน แล้วลบออกเมื่อเสร็จสิ้น. ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ. ใช้ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter`, และ `target` (`"dm"`, `"channel"`, หรือ `"both"`).

| กลุ่ม action | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + แสดงรายการ reaction |
| messages     | enabled | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | enabled | ปักหมุด/ถอนหมุด/แสดงรายการ         |
| memberInfo   | enabled | ข้อมูลสมาชิก            |
| emojiList    | enabled | รายการอีโมจิที่กำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin ที่บันเดิลมาใน OpenClaw รุ่นปัจจุบัน. บิลด์เก่าหรือ
บิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost`. ตรวจสอบ
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
สำหรับ dist-tag ปัจจุบันก่อน pin เวอร์ชัน.

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

โหมดแชท: `oncall` (ตอบกลับเมื่อถูก @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้งานคำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยังปลายทาง Gateway ของ OpenClaw และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback แบบ slash เนทีฟจะตรวจสอบสิทธิ์ด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งคืน
  ระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบส่วนตัว/tailnet/ภายใน Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนของ callback
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่องทาง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การ gate ด้วย mention ต่อช่องทาง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

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

- `channels.signal.account`: ปักการเริ่มต้นช่องทางไว้กับตัวตนบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มจาก Signal
- `channels.signal.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### iMessage

OpenClaw จะ spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต นี่คือพาธที่แนะนำสำหรับการตั้งค่า iMessage ใหม่ของ OpenClaw เมื่อโฮสต์สามารถให้สิทธิ์ฐานข้อมูล Messages และ Automation ได้

การรองรับ BlueBubbles ถูกลบออกแล้ว `channels.bluebubbles` ไม่ใช่พื้นผิว config runtime ที่รองรับบน OpenClaw ปัจจุบัน ย้าย config เก่าไปที่ `channels.imessage`; ใช้ [การลบ BlueBubbles และพาธ imsg iMessage](/th/announcements/bluebubbles-imessage) สำหรับเวอร์ชันสั้น และ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางแปลแบบเต็ม

หาก Gateway ไม่ได้รันบน Mac ที่ลงชื่อเข้าใช้ Messages ให้คง `channels.imessage.enabled=true` ไว้และตั้ง `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg "$@"` บน Mac เครื่องนั้น พาธ `imsg` ในเครื่องตามค่าเริ่มต้นใช้ได้เฉพาะ macOS เท่านั้น

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
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
      catchup: {
        enabled: false,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องใช้ Full Disk Access ไปยัง Messages DB
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชท
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้ง `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่า key ของ relay host มีอยู่ใน `~/.ssh/known_hosts` แล้ว
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มจาก iMessage
- `channels.imessage.actions.*`: เปิดใช้งานการกระทำ private API ที่ยังถูก gate โดย `imsg status` / `openclaw channels status --probe`
- `channels.imessage.includeAttachments` ปิดอยู่ตามค่าเริ่มต้น; ตั้งเป็น `true` ก่อนคาดหวังสื่อขาเข้าในรอบของเอเจนต์
- `channels.imessage.catchup.enabled`: opt in เพื่อ replay ข้อความขาเข้าที่มาถึงระหว่างที่ Gateway ไม่ทำงาน
- `channels.imessage.groups`: registry ของกลุ่มและการตั้งค่าต่อกลุ่ม เมื่อใช้ `groupPolicy: "allowlist"` ให้กำหนดค่าคีย์ `chat_id` แบบชัดเจนหรือรายการ wildcard `"*"` เพื่อให้ข้อความกลุ่มผ่าน gate ของ registry ได้
- รายการระดับบนสุด `bindings[]` ที่มี `type: "acp"` สามารถ bind การสนทนา iMessage เข้ากับเซสชัน ACP แบบถาวร ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชทแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

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

- การ auth ด้วยโทเค็นใช้ `accessToken`; การ auth ด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` route ทราฟฟิก HTTP ของ Matrix ผ่าน proxy HTTP(S) ที่ระบุชัดเจน บัญชีที่ตั้งชื่อไว้สามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการ opt-in เครือข่ายนี้เป็นคอนโทรลที่เป็นอิสระจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ถูกเชิญและคำเชิญใหม่แบบ DM จะถูกละเว้นจนกว่าคุณจะตั้ง `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้ออกการอนุมัติคำขอ exec
  - `agentFilter`: allowlist ID เอเจนต์ที่เป็นตัวเลือก ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบ key ของเซสชันที่เป็นตัวเลือก (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`
  - การแทนที่ต่อบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix รวมเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม peer ที่ route แล้ว ส่วน `per-room` แยกแต่ละห้อง DM ออกจากกัน
- probe สถานะ Matrix และการค้นหา directory แบบ live ใช้นโยบาย proxy เดียวกับทราฟฟิก runtime
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
- config Teams แบบเต็ม (ข้อมูลรับรอง, webhook, นโยบาย DM/กลุ่ม, การแทนที่ต่อทีม/ต่อช่องทาง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

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
- `channels.irc.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่องทาง IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่องทาง)

รันหลายบัญชีต่อช่องทาง (แต่ละบัญชีมี `accountId` ของตัวเอง):

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

- ใช้ `default` เมื่อไม่ได้ระบุ `accountId` (CLI + routing)
- โทเค็น env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานใช้กับทุกบัญชี เว้นแต่ถูกแทนที่ต่อบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยังเอเจนต์ต่างกัน
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือ onboarding ช่องทาง) ขณะที่ยังอยู่บน config ช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะ promote ค่าบัญชีเดียวระดับบนสุดที่ scoped กับบัญชีเข้าไปใน map บัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อไป ช่องทางส่วนใหญ่จะย้ายค่าเหล่านั้นไปที่ `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นเดิมที่ตรงกันไว้แทนได้
- binding ที่มีอยู่แบบเฉพาะช่องทาง (ไม่มี `accountId`) ยังคง match กับบัญชี default; binding ที่ scoped กับบัญชียังคงเป็นตัวเลือก
- `openclaw doctor --fix` ยังซ่อมรูปทรงแบบผสมด้วยการย้ายค่าบัญชีเดียวระดับบนสุดที่ scoped กับบัญชีเข้าไปในบัญชีที่ถูก promote ซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่ตั้งชื่อไว้/ค่าเริ่มต้นเดิมที่ตรงกันไว้แทนได้

### ช่องทาง Plugin อื่นๆ

ช่องทาง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตนเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมด: [ช่องทาง](/th/channels)

### การ gate mention ในแชทกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (mention จาก metadata หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชทกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้จะถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผลเทิร์นนั้น แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นแบบส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่าเป็น `"automatic"` เฉพาะเมื่อต้องการพฤติกรรมแบบเดิมที่โพสต์การตอบกลับปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นกับแชทโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; ฮาร์เนส Codex ยังใช้พฤติกรรมแบบใช้เครื่องมือเท่านั้นนั้นเป็นค่าเริ่มต้นของแชทโดยตรงเมื่อไม่ได้ตั้งค่า

การตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นต้องใช้โมเดล/รันไทม์ที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หากบันทึกเซสชันแสดงข้อความจากผู้ช่วยพร้อม `didSendViaMessagingTool: false` แสดงว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนการเรียกใช้เครื่องมือส่งข้อความ ให้เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่าสำหรับช่องนั้น หรือกำหนด `messages.groupChat.visibleReplies: "automatic"` เพื่อคืนค่าการตอบกลับสุดท้ายแบบเดิมที่มองเห็นได้

หากเครื่องมือส่งข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะย้อนกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติ แทนที่จะระงับการตอบกลับอย่างเงียบ ๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะโหลดคอนฟิก `messages` ใหม่แบบฮอตรีโหลดหลังจากบันทึกไฟล์ รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดคอนฟิกใหม่ถูกปิดใช้งานในการปรับใช้

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงแบบเมทาดาทา**: @-mention ดั้งเดิมของแพลตฟอร์ม ถูกละเว้นในโหมดแชทกับตนเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุมด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (การกล่าวถึงดั้งเดิมหรือมีรูปแบบอย่างน้อยหนึ่งรายการ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องต่าง ๆ สามารถเขียนทับด้วย `channels.<channel>.historyLimit` (หรือต่อบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` เป็นค่าเริ่มต้นส่วนกลางสำหรับเทิร์นจากแหล่งที่มา; `messages.groupChat.visibleReplies` จะเขียนทับค่านี้สำหรับเทิร์นจากแหล่งที่มาแบบกลุ่ม/ช่อง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` ฮาร์เนสสามารถให้ค่าเริ่มต้นของแหล่งที่มา/แชทโดยตรงของตนเองได้; ฮาร์เนส Codex มีค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของช่องและการควบคุมด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่าจะประมวลผลเทิร์นนั้นหรือไม่

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

การเลือกค่า: การเขียนทับต่อ DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชทกับตนเอง

รวมหมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมดแชทกับตนเอง (ละเว้น @-mention ดั้งเดิม ตอบสนองเฉพาะรูปแบบข้อความ):

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

### คำสั่ง (การจัดการคำสั่งแชท)

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแคตตาล็อกคำสั่งในตัวและแบบบันเดิลปัจจุบัน โปรดดู [คำสั่งสแลช](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์คอนฟิก** ไม่ใช่แคตตาล็อกคำสั่งฉบับเต็ม คำสั่งที่ช่อง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone`, และ Talk `/voice` มีเอกสารอยู่ในหน้าช่อง/Plugin ของตน รวมถึง [คำสั่งสแลช](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวทั้งข้อความ** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งดั้งเดิมสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills ดั้งเดิมสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- เขียนทับต่อช่อง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งดั้งเดิมระหว่างเริ่มต้น
- เขียนทับการลงทะเบียน Skills ดั้งเดิมต่อช่องด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอท Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ Gateway `chat.send` การเขียน `/config set|unset` แบบถาวรต้องมี `operator.admin` ด้วย; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ตัวดำเนินการปกติที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับคอนฟิกเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ Plugin การติดตั้ง และการควบคุมเปิด/ปิด
- `channels.<provider>.configWrites` ควบคุมการกลายคอนฟิกต่อช่อง (ค่าเริ่มต้น: true)
- สำหรับช่องแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่เล็งไปยังบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการดำเนินการเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` เป็นรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือเฉพาะเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบต่อผู้ให้บริการ เมื่อตั้งค่าแล้ว จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่อง และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แคตตาล็อกในตัวและแบบบันเดิล: [คำสั่งสแลช](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่อง: [ช่อง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - Dreaming ของหน่วยความจำ: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่อง](/th/channels)
