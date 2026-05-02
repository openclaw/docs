---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าสำหรับแต่ละช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการควบคุมการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ คีย์รายช่องทางใน Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-02T10:15:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: ba22187389e0154f6ebe428da63f78d3476b080f81c5224f14d410f2ef66a87c
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การควบคุมด้วยการกล่าวถึง, และคีย์รายช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่นที่มาพร้อมชุดติดตั้ง

สำหรับเอเจนต์, เครื่องมือ, รันไทม์ Gateway, และคีย์ระดับบนอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การควบคุมด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากบล็อกผู้ให้บริการหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มขณะรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดเมื่อไม่แน่ใจ) พร้อมคำเตือนตอนเริ่มทำงาน
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึงรหัสช่องทางเฉพาะกับโมเดล ค่ารองรับ `provider/model` หรือชื่อแทนโมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือนรายการอนุญาตแต่เก็บบริบทการอ้างอิง/ตอบกลับที่ระบุชัดเจนไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมประสิทธิภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) และจะเริ่มทำงานโดยอัตโนมัติเมื่อมีเซสชันที่เชื่อมโยงอยู่

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่; มิฉะนั้นใช้รหัสบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- ตัวเลือก `channels.whatsapp.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ไดเรกทอรีการยืนยันตัวตน Baileys แบบบัญชีเดียวเดิมจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; ปฏิเสธลิงก์สัญลักษณ์), โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` เป็นรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากแบบโฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่เผลอใส่ไว้
- ตัวเลือก `channels.telegram.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (รหัสบัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้ายรหัสซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบบัญญัติใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- ตัวอย่างสตรีม Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ทั้งในการแชทโดยตรงและกลุ่ม)
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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น ส่วนการตั้งค่าการ retry/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกใน runtime snapshot ที่ใช้งานอยู่
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ
- slug ของ guild ใช้ตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; key ของช่องใช้ชื่อแบบ slug (ไม่มี `#`) แนะนำให้ใช้ ID ของ guild
- ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้นตามค่าเริ่มต้น `allowBots: true` จะเปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่ mention บอตเท่านั้น (ยังคงกรองข้อความของตัวเองออก)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการ override ระดับช่อง) จะทิ้งข้อความที่ mention ผู้ใช้หรือ role อื่นแต่ไม่ได้ mention บอต (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` map ข้อความ `@handle` สำหรับการส่งออกที่คงที่ไปยัง ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้สามารถ mention เพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้ cache directory ชั่วคราวจะว่างอยู่ การ override รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแยกข้อความที่สูงมากแม้จะต่ำกว่า 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การ override ของ Discord สำหรับฟีเจอร์ session ที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การ override ของ Discord สำหรับการ auto-unfocus เมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การ override ของ Discord สำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: context subagent แบบ native สำหรับการ spawn ที่ผูกกับเธรด (`"fork"` ตามค่าเริ่มต้น)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่า binding ของ ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ของช่อง/เธรดใน `match.peer.id`) ความหมายของ field ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการ override auto-join + LLM + TTS แบบไม่บังคับ config Discord แบบข้อความเท่านั้นจะปิดเสียงไว้ตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกใช้งาน
- `channels.discord.voice.model` จะแทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (`30000` ตามค่าเริ่มต้น)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่ session เสียงที่ตัดการเชื่อมต่อสามารถเข้าสู่สัญญาณ reconnect ได้ก่อนที่ OpenClaw จะทำลาย session นั้น (`15000` ตามค่าเริ่มต้น)
- OpenClaw จะพยายามกู้คืนการรับเสียงเพิ่มเติมด้วยการออกจาก/เข้าร่วม session เสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำๆ
- `channels.discord.streaming` คือ key โหมด stream มาตรฐาน ค่า legacy `streamMode` และค่า boolean `streaming` จะถูก migrate อัตโนมัติ
- `channels.discord.autoPresence` map ความพร้อมใช้งานของ runtime ไปยัง presence ของบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้ override ข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/tag ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติ exec แบบ native ของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto คำขออนุมัติ exec จะเปิดใช้งานเมื่อ resolve ผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec fallback ไปยัง `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ
  - `agentFilter`: allowlist ของ ID agent แบบไม่บังคับ ไม่ระบุเพื่อ forward คำขออนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: pattern ของ key session แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้ได้เฉพาะผู้อนุมัติที่ resolve แล้วเท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือ timeout

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` ในทุกข้อความ)

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

- JSON ของ service account: แบบ inline (`serviceAccount`) หรือแบบอิงไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของ service account ด้วย (`serviceAccountRef`)
- Env fallback: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ email principal ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)

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

- **Socket mode** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชีเริ่มต้น)
- **HTTP mode** ต้องใช้ `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี)
- `socketMode` ส่งการปรับแต่ง transport ของ Slack SDK Socket Mode ผ่านไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหา ping/pong timeout หรือ websocket ค้าง
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริง plaintext
  หรือ object SecretRef
- snapshot บัญชี Slack เปิดเผย field แหล่งที่มา/สถานะราย credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และใน HTTP mode คือ
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่ path ของคำสั่ง/runtime ปัจจุบันไม่สามารถ
  resolve ค่า secret ได้
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือ key โหมด stream มาตรฐานของ Slack `channels.slack.streaming.nativeTransport` ควบคุม transport streaming แบบ native ของ Slack ค่า legacy `streamMode`, boolean `streaming` และ `nativeStreaming` จะถูก migrate อัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยก session ของเธรด:** `thread.historyScope` เป็นรายเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่อง `thread.inheritParent` คัดลอก transcript ของช่องแม่ไปยังเธรดใหม่

- Slack native streaming พร้อมสถานะเธรดแบบ Slack assistant-style "is typing..." ต้องมีเป้าหมายเธรดตอบกลับ DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น จึงใช้ `typingReaction` หรือการส่งแบบปกติแทน preview แบบเธรด
- `typingReaction` เพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าระหว่างที่การตอบกลับกำลังทำงาน แล้วลบออกเมื่อเสร็จสิ้น ใช้ shortcode emoji ของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำขออนุมัติ exec แบบ native ของ Slack และการอนุญาตผู้อนุมัติ ใช้ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่ม action | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + แสดงรายการ reaction |
| messages     | enabled | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | enabled | Pin/unpin/แสดงรายการ         |
| memberInfo   | enabled | ข้อมูลสมาชิก            |
| emojiList    | enabled | รายการ emoji แบบกำหนดเอง      |

### Mattermost

Mattermost มาพร้อมเป็น Plugin ที่ bundled ใน OpenClaw release ปัจจุบัน release รุ่นเก่าหรือ
build แบบกำหนดเองสามารถติดตั้ง package npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost`; หาก npm รายงานว่า
package ที่ OpenClaw เป็นเจ้าของถูก deprecated ให้ใช้ Plugin ที่ bundled หรือ checkout ภายในเครื่อง
จนกว่าจะเผยแพร่ package npm รุ่นใหม่กว่า

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

โหมดแชท: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย prefix trigger)

เมื่อเปิดใช้งานคำสั่ง native ของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw gateway และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback แบบ slash ดั้งเดิมได้รับการยืนยันตัวตนด้วย token ต่อคำสั่งที่ Mattermost ส่งคืน
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบส่วนตัว/tailnet/ภายใน Mattermost อาจกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมน callback ไว้ด้วย
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มโดย Mattermost
- `channels.mattermost.requireMention`: กำหนดให้มี `@mention` ก่อนตอบกลับใน channel
- `channels.mattermost.groups.<channelId>.requireMention`: การ override การกำหนด mention-gating ต่อ channel (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

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

- `channels.signal.account`: ผูกการเริ่มต้น channel ไว้กับตัวตนบัญชี Signal เฉพาะ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มโดย Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles คือพาธ iMessage ที่แนะนำ (มี Plugin รองรับ กำหนดค่าภายใต้ `channels.bluebubbles`)

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
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา BlueBubbles กับเซสชัน ACP ถาวรได้ ใช้ handle ของ BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ร่วม: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- การกำหนดค่า channel BlueBubbles แบบเต็มมีบันทึกไว้ใน [BlueBubbles](/th/channels/bluebubbles)

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

- ต้องมี Full Disk Access สำหรับ Messages DB
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง wrapper ของ SSH ได้ ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบด้วย SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key อย่างเข้มงวด ดังนั้นให้ตรวจสอบว่า host key ของ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มโดย iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา iMessage กับเซสชัน ACP ถาวรได้ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชตที่ระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ร่วม: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="iMessage SSH wrapper example">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix มี Plugin รองรับและกำหนดค่าภายใต้ `channels.matrix`

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
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่าน proxy HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถ override ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการ opt-in เครือข่ายนี้เป็นตัวควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในชุดหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญแบบ DM ใหม่จะถูกเพิกเฉยจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งการอนุมัติ exec แบบ native ของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การ override ต่อบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตาม peer ที่ถูก route ขณะที่ `per-room` แยกแต่ละห้อง DM ออกจากกัน
- การ probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบาย proxy เดียวกับทราฟฟิก runtime
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีบันทึกไว้ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams มี Plugin รองรับและกำหนดค่าภายใต้ `channels.msteams`

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
- config แบบเต็มของ Teams (ข้อมูลประจำตัว, Webhook, นโยบาย DM/กลุ่ม, การ override ต่อทีม/ต่อ channel) มีบันทึกไว้ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC มี Plugin รองรับและกำหนดค่าภายใต้ `channels.irc`

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
- `channels.irc.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- การกำหนดค่า channel IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) มีบันทึกไว้ใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุก channel)

รันหลายบัญชีต่อ channel (แต่ละบัญชีมี `accountId` ของตัวเอง):

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

- `default` จะถูกใช้เมื่อไม่ระบุ `accountId` (CLI + routing)
- token จาก env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่า channel พื้นฐานใช้กับทุกบัญชี เว้นแต่จะ override ต่อบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยัง agent ที่ต่างกัน
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ของ channel) ขณะที่ยังอยู่บน config channel ระดับบนสุดแบบบัญชีเดียว OpenClaw จะ promote ค่า single-account ระดับบนสุดที่ scoped กับบัญชีเข้าไปในแผนที่บัญชีของ channel ก่อน เพื่อให้บัญชีเดิมยังทำงานต่อไปได้ channel ส่วนใหญ่ย้ายค่าเหล่านั้นเข้าไปใน `channels.<channel>.accounts.default`; Matrix สามารถเก็บเป้าหมายชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่เดิมไว้แทนได้
- binding ที่มีอยู่เฉพาะ channel (ไม่มี `accountId`) จะยังจับคู่กับบัญชีเริ่มต้นต่อไป; binding ที่ scoped กับบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมรูปร่างแบบผสมโดยย้ายค่า single-account ระดับบนสุดที่ scoped กับบัญชีเข้าไปในบัญชีที่ promote ซึ่งเลือกไว้สำหรับ channel นั้น channel ส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถเก็บเป้าหมายชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่เดิมไว้แทนได้

### channel Plugin อื่นๆ

channel Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีบันทึกไว้ในหน้า channel เฉพาะของตัวเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนี channel แบบเต็ม: [Channels](/th/channels)

### การ gate mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (mention จาก metadata หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/channel มีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังประมวลผล turn อยู่ แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่โพสต์การตอบกลับปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้เฉพาะผ่าน tool เดียวกันกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; harness ของ Codex ก็ใช้พฤติกรรมเฉพาะ tool นั้นเป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าสำหรับแชตโดยตรงเช่นกัน

หาก message tool ไม่พร้อมใช้งานภายใต้นโยบาย tool ที่ใช้งานอยู่ OpenClaw จะ fallback เป็นการตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการระงับการตอบกลับอย่างเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะ hot-reload config `messages` หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลด config ใหม่ถูกปิดใช้งานในการ deploy

**ประเภท mention:**

- **mention จาก metadata**: @-mention แบบ native ของแพลตฟอร์ม ถูกเพิกเฉยในโหมด self-chat ของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกเพิกเฉย
- mention gating จะถูกบังคับใช้เฉพาะเมื่อการตรวจจับเป็นไปได้ (mention แบบ native หรือมีอย่างน้อยหนึ่งรูปแบบ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง Channels สามารถเขียนทับได้ด้วย `channels.<channel>.historyLimit` (หรือกำหนดต่อบัญชี) ตั้งเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของ source-turn; `messages.groupChat.visibleReplies` เขียนทับค่านี้สำหรับ source turns ของกลุ่ม/Channel เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` harness สามารถให้ค่าเริ่มต้น direct/source ของตัวเองได้; harness ของ Codex มีค่าเริ่มต้นเป็น `message_tool` allowlist ของ Channel และการกำหนดเงื่อนไขการ mention ยังคงตัดสินว่าจะประมวลผล turn หรือไม่

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

การแก้ค่า: การเขียนทับต่อ DM → ค่าเริ่มต้นของ provider → ไม่มีขีดจำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้น @-mentions แบบ native และตอบเฉพาะรูปแบบข้อความ):

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

### คำสั่ง (การจัดการคำสั่งในแชต)

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

- บล็อกนี้กำหนดค่าพื้นผิวของคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน โปรดดู [คำสั่งแบบ Slash](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ Channel/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone`, และ Talk `/voice` มีเอกสารอยู่ในหน้า Channel/Plugin ของคำสั่งนั้น ๆ รวมถึง [คำสั่งแบบ Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดใช้คำสั่ง native สำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- `nativeSkills: "auto"` เปิดใช้คำสั่ง Skills แบบ native สำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- เขียนทับต่อ Channel: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้า
- เขียนทับการลงทะเบียน Skills แบบ native ต่อ Channel ด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนู Telegram bot เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับ shell ของโฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับ client ของ Gateway `chat.send` การเขียนแบบถาวรด้วย `/config set|unset` ยังต้องใช้ `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับ client operator ปกติที่มี scope การเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่า server MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ Plugin การติดตั้ง และตัวควบคุมเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าต่อ Channel (ค่าเริ่มต้น: true)
- สำหรับ Channel หลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่มีเป้าหมายเป็นบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการทำงานของเครื่องมือ restart Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ allowlist เจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือสำหรับเจ้าของเท่านั้น โดยแยกจาก `allowFrom`
- `ownerDisplay: "hash"` hash owner ids ใน system prompt ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการ hash
- `allowFrom` เป็นแบบต่อ provider เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งอนุญาต **เพียงแหล่งเดียว** (จะละเว้น allowlist/การจับคู่ของ Channel และ `useAccessGroups`)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบาย access-group เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [คำสั่งแบบ Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะ Channel: [Channels](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory Dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวม Channels](/th/channels)
