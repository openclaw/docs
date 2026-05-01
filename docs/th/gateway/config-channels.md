---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าต่อช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว, นโยบายกลุ่ม หรือการควบคุมการทำงานด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์แยกตามช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-01T10:16:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: ce1571d51e026182d49b935780a986780a90b05afc0acca027b2541b80a1aac2
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม
การตั้งค่าหลายบัญชี การควบคุมด้วยการกล่าวถึง และคีย์รายช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่น ๆ ที่รวมมาให้

สำหรับเอเจนต์ เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่น ๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (ยกเว้น `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือในที่เก็บรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การควบคุมด้วยการกล่าวถึงยังมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากบล็อกผู้ให้บริการหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มตอนรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดเมื่อไม่แน่ใจ) พร้อมคำเตือนตอนเริ่มทำงาน
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อปักหมุด ID ช่องทางเฉพาะกับโมเดล ค่าใช้รูปแบบ `provider/model` หรือชื่อแทนโมเดลที่กำหนดค่าไว้ได้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับนโยบายกลุ่มและพฤติกรรม Heartbeat ที่ใช้ร่วมกันข้ามผู้ให้บริการ:

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่คงบริบทการอ้างคำพูด/ตอบกลับที่ระบุชัดเจนไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมประสิทธิภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) โดยจะเริ่มโดยอัตโนมัติเมื่อมีเซสชันที่ลิงก์อยู่

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่ ไม่เช่นนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- ตัวเลือก `channels.whatsapp.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรีรับรองตัวตน Baileys แบบบัญชีเดียวเดิมถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น symlink จะถูกปฏิเสธ) โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือราก Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากแบบโฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่ติดมาโดยไม่ตั้งใจ
- ตัวเลือก `channels.telegram.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- ตัวอย่างสตรีม Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ในแชตโดยตรงและแชตกลุ่ม)
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ให้ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น ส่วนการตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง ระบบจะปฏิเสธ ID ตัวเลขล้วน
- สลัก guild เป็นตัวพิมพ์เล็กโดยแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อแบบสลัก (ไม่มี `#`) แนะนำให้ใช้ ID ของ guild
- ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้นตามค่าเริ่มต้น `allowBots: true` เปิดใช้งานข้อความเหล่านั้น ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตนี้เท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแบ่งข้อความที่สูงมากแม้มีความยาวต่ำกว่า 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ของ Discord สำหรับฟีเจอร์เซสชันแบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/กำหนดเส้นทางแบบผูก)
  - `idleHours`: การแทนที่ของ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรม เป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ของ Discord สำหรับอายุสูงสุดแบบบังคับ เป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSubagentSessions`: สวิตช์เลือกเปิดสำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ของช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการแทนที่ auto-join + LLM + TTS แบบไม่บังคับ
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น)
- OpenClaw จะพยายามกู้คืนการรับเสียงเพิ่มเติมโดยออก/เข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำ ๆ
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน ค่าเดิม `streamMode` และค่า boolean `streaming` จะถูกย้ายโดยอัตโนมัติ
- `channels.discord.autoPresence` แมปความพร้อมใช้งานของรันไทม์กับสถานะบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะได้แบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติ exec จะทำงานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec ใช้ `commands.ownerAllowFrom` เป็น fallback เมื่อไม่ได้ระบุ
  - `agentFilter`: รายการอนุญาตของ ID เอเจนต์แบบไม่บังคับ ไม่ระบุเพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อเป้าหมายรวม `"channel"` ปุ่มจะใช้งานได้เฉพาะผู้อนุมัติที่ระบุได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` ในทุกข้อความ)

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
- Env fallback: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบฉุกเฉิน)

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

- **โหมด Socket** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องมี `botToken` และ `signingSecret` (ที่ root หรือแยกตามบัญชี)
- `socketMode` ส่งผ่านการปรับแต่งการขนส่ง Slack SDK Socket Mode ไปยัง Bolt receiver API สาธารณะ ใช้เฉพาะเมื่อกำลังตรวจสอบ ping/pong timeout หรือพฤติกรรม websocket ค้าง
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจกต์ SecretRef
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะแยกตามข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่คำสั่ง/เส้นทางรันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้
- `configWrites: false` บล็อกการเขียนค่ากำหนดที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack `channels.slack.streaming.nativeTransport` ควบคุมการขนส่งสตรีมมิงเนทีฟของ Slack ค่าเดิม `streamMode`, ค่า boolean `streaming` และค่า `nativeStreaming` จะถูกย้ายโดยอัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบแยกตามเธรด (ค่าเริ่มต้น) หรือแชร์ทั้งช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ของช่องแม่ไปยังเธรดใหม่

- สตรีมมิงเนทีฟของ Slack ร่วมกับสถานะเธรดแบบผู้ช่วยของ Slack ที่ว่า "กำลังพิมพ์..." ต้องมีเป้าหมายเป็นเธรดตอบกลับ DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น จึงใช้ `typingReaction` หรือการส่งปกติแทนพรีวิวแบบเธรด
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะกำลังสร้างคำตอบ จากนั้นลบออกเมื่อเสร็จสิ้น ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Slack และการให้สิทธิ์ผู้อนุมัติ ใช้ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ              |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | รีแอ็กชัน + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin ที่รวมมาให้ใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือ
บิลด์กำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost`; หาก npm รายงานว่า
แพ็กเกจที่ OpenClaw เป็นเจ้าของถูกเลิกใช้งานแล้ว ให้ใช้ Plugin ที่รวมมาให้หรือ checkout ในเครื่อง
จนกว่าจะมีการเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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

โหมดแชท: `oncall` (ตอบเมื่อ @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้งานคำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็น path (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้อง resolve ไปยังเอนด์พอยต์ Gateway ของ OpenClaw และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback แบบ slash เนทีฟจะยืนยันตัวตนด้วยโทเค็นแยกตามคำสั่งที่ Mattermost ส่งคืน
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบ private/tailnet/internal Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนของ callback
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่ากำหนดที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่ mention-gating แยกตามช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้

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

- `channels.signal.account`: ตรึงการเริ่มต้นช่องทางไว้กับข้อมูลประจำตัวบัญชี Signal ที่เฉพาะเจาะจง
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มจาก Signal
- `channels.signal.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles เป็นเส้นทาง iMessage ที่แนะนำ (รองรับด้วย Plugin และกำหนดค่าใต้ `channels.bluebubbles`)

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

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles เข้ากับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิล BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- การกำหนดค่าช่องทาง BlueBubbles แบบเต็มมีเอกสารใน [BlueBubbles](/th/channels/bluebubbles)

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

- `channels.imessage.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องมี Full Disk Access ไปยังฐานข้อมูล Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยังตัวห่อ SSH ได้ ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบด้วย SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดเส้นทางไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่าคีย์โฮสต์รีเลย์มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิลที่ทำให้เป็นรูปแบบมาตรฐานแล้วหรือเป้าหมายแชตแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="ตัวอย่างตัวห่อ SSH สำหรับ iMessage">

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

- การตรวจสอบสิทธิ์ด้วยโทเค็นใช้ `accessToken`; การตรวจสอบสิทธิ์ด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` ส่งทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุอย่างชัดเจน บัญชีที่มีชื่อสามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการเลือกเข้าร่วมเครือข่ายนี้เป็นการควบคุมที่แยกกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ได้รับคำเชิญและคำเชิญใหม่แบบ DM จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งมอบการอนุมัติ exec แบบเนทีฟของ Matrix และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถแก้ไขผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID เอเจนต์ที่ไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันที่ไม่บังคับ (สตริงย่อยหรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่ต่อบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม DM ของ Matrix เป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม peer ที่ถูกกำหนดเส้นทาง ขณะที่ `per-room` แยกแต่ละห้อง DM
- การตรวจสถานะ Matrix และการค้นหาไดเรกทอรีสดใช้พร็อกซี policy เดียวกับทราฟฟิกรันไทม์
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารใน [Matrix](/th/channels/matrix)

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

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.msteams`, `channels.msteams.configWrites`
- การกำหนดค่า Teams แบบเต็ม (ข้อมูลประจำตัว, Webhook, policy ของ DM/กลุ่ม, การแทนที่ต่อทีม/ต่อช่องทาง) มีเอกสารใน [Microsoft Teams](/th/channels/msteams)

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

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` ที่ไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่องทาง IRC แบบเต็ม (host/port/TLS/channels/allowlists/การควบคุมด้วยการกล่าวถึง) มีเอกสารใน [IRC](/th/channels/irc)

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

- `default` ถูกใช้เมื่อเว้น `accountId` ไว้ (CLI + การกำหนดเส้นทาง)
- โทเค็น Env ใช้กับบัญชี **เริ่มต้น** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่ต่อบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์ที่แตกต่างกัน
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่องทาง) ขณะที่ยังใช้การกำหนดค่าช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะยกระดับค่าระดับบนสุดแบบบัญชีเดียวที่อยู่ในขอบเขตบัญชีเข้าไปยังแผนที่บัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องทางส่วนใหญ่จะย้ายค่าเหล่านี้เข้าไปใน `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วไว้แทน
- binding เฉพาะช่องทางที่มีอยู่แล้ว (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น; binding ที่อยู่ในขอบเขตบัญชียังคงเป็นทางเลือก
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบที่ผสมกันโดยย้ายค่าระดับบนสุดแบบบัญชีเดียวที่อยู่ในขอบเขตบัญชีเข้าไปยังบัญชีที่ยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วไว้แทน

### ช่องทาง Plugin อื่นๆ

ช่องทาง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตัวเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมด: [ช่องทาง](/th/channels)

### การควบคุมการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องกล่าวถึง** (การกล่าวถึงในเมทาดาทาหรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องทางมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผลเทิร์น แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และเอาต์พุตห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่โพสต์การตอบกลับปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบเฉพาะเครื่องมือเดียวกันกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้ tool policy ที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการระงับคำตอบอย่างเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์แล้ว รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงในเมทาดาทา**: @-mentions แบบเนทีฟของแพลตฟอร์ม ถูกละเว้นในโหมดแชตกับตัวเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุมด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (การกล่าวถึงแบบเนทีฟหรือมีรูปแบบอย่างน้อยหนึ่งรายการ)

```json5
{
  messages: {
    visibleReplies: "automatic", // global default for direct/source chats
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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องทางสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือต่อบัญชี) ตั้งค่า `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของ source-turn; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับ source turn ของกลุ่ม/ช่องทาง allowlist ของช่องทางและการควบคุมด้วยการกล่าวถึงยังคงตัดสินว่าเทิร์นจะถูกประมวลผลหรือไม่

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

ลำดับการแก้ไขค่า: การแทนที่ต่อ DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้น @-mentions แบบเนทีฟ ตอบสนองเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัวปัจจุบันและคำสั่งที่รวมมาให้ ดู [คำสั่งแบบสแลช](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งฉบับเต็ม คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/Plugin ของตนเอง รวมถึง [คำสั่งแบบสแลช](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวๆ** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปิด Slack ไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปิด Slack ไว้
- เขียนทับต่อช่องทางได้: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้า
- เขียนทับการลงทะเบียน Skills แบบเนทีฟต่อช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียนแบบถาวรด้วย `/config set|unset` ต้องมี `operator.admin` ด้วย ส่วน `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ผู้ปฏิบัติการปกติที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าต่อช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่กำหนดเป้าหมายบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการทำงานของเครื่องมือรีสตาร์ท Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือที่ใช้ได้เฉพาะเจ้าของเท่านั้น แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` แยกตามผู้ให้บริการ เมื่อตั้งค่าแล้ว จะเป็นแหล่งที่มาของการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องทางและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัวและที่รวมมาให้: [คำสั่งแบบสแลช](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
