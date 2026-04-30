---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการควบคุมการเข้าถึงด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ คีย์ต่อช่องทางใน Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-04-30T09:50:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: e16ab50020711aac8e06cd234739ac7b566420cf7ce8621c0aca12c22484f07f
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าต่อช่องภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การกั้นด้วยการกล่าวถึง, และคีย์ต่อช่องสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องอื่นๆ ที่รวมมาให้

สำหรับเอเจนต์, เครื่องมือ, รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## ช่อง

แต่ละช่องจะเริ่มโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องนั้นอยู่ (เว้นแต่ `enabled: false`).

### การเข้าถึง DM และกลุ่ม

ทุกช่องรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่จัดเก็บอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การกั้นด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่อง**
หากบล็อกผู้ให้บริการหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (fail-closed) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลของช่อง

ใช้ `channels.modelByChannel` เพื่อปักหมุด ID ช่องเฉพาะกับโมเดล ค่าใช้รูปแบบ `provider/model` หรือ alias โมเดลที่กำหนดค่าไว้ได้ การแมปช่องจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งผ่าน `/model`).

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

### ค่าเริ่มต้นของช่องและ Heartbeat

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่อง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทคำพูดอ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่เก็บบริบทคำพูดอ้างอิง/การตอบกลับที่ระบุชัดเจนไว้) การแทนที่ต่อช่อง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมประสิทธิภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องเว็บของ Gateway (Baileys Web) และจะเริ่มโดยอัตโนมัติเมื่อมีเซสชันที่ลิงก์อยู่

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่; มิฉะนั้นใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวเดิมถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; ปฏิเสธ symlink) โดยมี `TELEGRAM_BOT_TOKEN` เป็นตัวสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือรูท Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรูทที่โฮสต์เอง/ผ่านพร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่เพิ่มเข้ามาโดยไม่ตั้งใจ
- `channels.telegram.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานในแชตโดยตรงและแชตกลุ่ม)
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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น ส่วนการตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปชอตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ
- สลักกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อแบบสลัก (ไม่มี `#`) แนะนำให้ใช้ ID กิลด์
- ข้อความที่บอทเขียนจะถูกละเว้นตามค่าเริ่มต้น `allowBots: true` เปิดใช้ข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทนี้เท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here)
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแยกข้อความที่สูงมากแม้มีความยาวต่ำกว่า 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรม หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ Discord สำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSubagentSessions`: สวิตช์เลือกเปิดสำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2
- `channels.discord.voice` เปิดใช้การสนทนาในช่องเสียงของ Discord และการเข้าร่วมอัตโนมัติ + การแทนที่ LLM + TTS แบบไม่บังคับ
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียงของ Discord แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น)
- OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังเกิดความล้มเหลวในการถอดรหัสซ้ำๆ
- `channels.discord.streaming` เป็นคีย์โหมดสตรีมหลัก ค่าเดิม `streamMode` และค่า `streaming` แบบบูลีนจะถูกย้ายให้อัตโนมัติ
- `channels.discord.autoPresence` แมปสถานะความพร้อมใช้งานของรันไทม์ไปยังสถานะบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับเหตุฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติ exec จะทำงานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec ย้อนกลับไปใช้ `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ ไม่ต้องระบุเพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้งานได้เฉพาะผู้อนุมัติที่ระบุได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังอนุมัติ ปฏิเสธ หรือหมดเวลา

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

- JSON ของบัญชีบริการ: แบบอินไลน์ (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของบัญชีบริการด้วย (`serviceAccountRef`)
- ค่าสำรองจาก env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับเหตุฉุกเฉิน)

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

- **โหมดซ็อกเก็ต** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับค่าสำรอง env ของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่รากหรือรายบัญชี)
- `socketMode` ส่งต่อการปรับแต่งทรานสปอร์ต Socket Mode ของ Slack SDK ไปยัง API receiver Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหา ping/pong timeout หรือพฤติกรรม websocket ค้าง
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- สแนปชอตบัญชี Slack แสดงฟิลด์ source/status รายข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่พาธคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าลับได้
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` เป็นคีย์โหมดสตรีมหลักของ Slack `channels.slack.streaming.nativeTransport` ควบคุมทรานสปอร์ตสตรีมมิงเนทีฟของ Slack ค่าเดิม `streamMode`, ค่า `streaming` แบบบูลีน และค่า `nativeStreaming` จะถูกย้ายให้อัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นรายเธรด (ค่าเริ่มต้น) หรือแชร์ทั่วช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ของช่องหลักไปยังเธรดใหม่

- สตรีมมิงเนทีฟของ Slack พร้อมสถานะเธรดแบบผู้ช่วยของ Slack "is typing..." ต้องมีเป้าหมายเธรดตอบกลับ DM ระดับบนสุดอยู่นอกเธรดตามค่าเริ่มต้น ดังนั้นจะใช้ `typingReaction` หรือการส่งปกติแทนพรีวิวแบบเธรด
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าระหว่างที่คำตอบกำลังทำงาน แล้วลบออกเมื่อเสร็จสมบูรณ์ ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | รีแอ็กต์ + แสดงรายการรีแอ็กชัน |
| messages     | enabled | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | enabled | ปักหมุด/ยกเลิกปักหมุด/แสดงรายการ         |
| memberInfo   | enabled | ข้อมูลสมาชิก            |
| emojiList    | enabled | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost มาพร้อมเป็น Plugin ที่รวมอยู่ใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือ
บิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันได้ด้วย
`openclaw plugins install @openclaw/mattermost`; หาก npm รายงานว่าแพ็กเกจ
ที่ OpenClaw เป็นเจ้าของเลิกใช้แล้ว ให้ใช้ Plugin ที่รวมมาให้หรือ checkout ในเครื่อง
จนกว่าจะเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า

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

โหมดแชต: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้คำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint Gateway ของ OpenClaw และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback ของ slash แบบเนทีฟยืนยันตัวตนด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งกลับ
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback ส่วนตัว/tailnet/ภายใน Mattermost อาจต้องการให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมน callback
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การกำหนดเงื่อนไขการกล่าวถึงรายช่อง (`"*"` สำหรับค่าเริ่มต้น)
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

**โหมดการแจ้งเตือนปฏิกิริยา:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ตรึงการเริ่มต้นช่องทางไว้กับข้อมูลประจำตัวบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนคอนฟิกที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

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
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles กับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิล BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ตัวแทน ACP](/th/tools/acp-agents#channel-specific-settings)
- การกำหนดค่าช่องทาง BlueBubbles ฉบับเต็มมีเอกสารใน [BlueBubbles](/th/channels/bluebubbles)

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

- ต้องใช้ Full Disk Access กับฐานข้อมูล Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้ ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดเส้นทางไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่าโฮสต์คีย์ของ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนคอนฟิกที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage กับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิลที่ทำให้เป็นรูปแบบมาตรฐานแล้วหรือเป้าหมายแชตที่ระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ตัวแทน ACP](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="ตัวอย่าง SSH wrapper สำหรับ iMessage">

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
- `channels.matrix.proxy` ส่งทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการยินยอมให้ใช้เครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญแบบ DM ใหม่จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำอนุมัติ exec แบบ Matrix-native และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ คำอนุมัติ exec จะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: รายการอนุญาต ID agent แบบไม่บังคับ ละไว้เพื่อส่งต่อคำอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`
  - การแทนที่รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix รวมกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม peer ที่ถูก route ในขณะที่ `per-room` แยกแต่ละห้อง DM ออกจากกัน
- การ probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้นโยบายพร็อกซีเดียวกับทราฟฟิกรันไทม์
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

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.msteams`, `channels.msteams.configWrites`
- คอนฟิก Teams ฉบับเต็ม (ข้อมูลประจำตัว, Webhook, นโยบาย DM/กลุ่ม, การแทนที่รายทีม/รายช่องทาง) มีเอกสารใน [Microsoft Teams](/th/channels/msteams)

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
- `channels.irc.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่องทาง IRC ฉบับเต็ม (host/port/TLS/channels/allowlists/mention gating) มีเอกสารใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การ route)
- โทเค็น env ใช้กับบัญชี **เริ่มต้น** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยัง agent คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ช่องทาง) ขณะที่ยังใช้คอนฟิกช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีเข้าไปในแผนที่บัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องทางส่วนใหญ่จะย้ายค่าเหล่านั้นเข้าไปใน `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วแทนได้
- bindings ที่มีอยู่เฉพาะช่องทาง (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น; bindings ที่อยู่ในขอบเขตบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบที่ปะปนกันโดยย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีเข้าไปในบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วแทนได้

### ช่องทาง Plugin อื่นๆ

ช่องทาง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตัวเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางฉบับเต็ม: [ช่องทาง](/th/channels)

### การควบคุมการ mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้อง mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องทางมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผล turn แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และเอาต์พุตห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่การตอบกลับปกติถูกโพสต์กลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`

**ประเภท mention:**

- **Metadata mentions**: @-mentions ดั้งเดิมของแพลตฟอร์ม ถูกละเว้นในโหมด self-chat ของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
- การควบคุม mention จะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (native mentions หรืออย่างน้อยหนึ่งรูปแบบ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องทางสามารถแทนที่ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี) ตั้งค่า `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นแบบ source-turn ส่วนกลาง; `messages.groupChat.visibleReplies` จะแทนที่สำหรับ source turns ของกลุ่ม/ช่องทาง รายการอนุญาตของช่องทางและการควบคุม mention ยังคงตัดสินว่า turn จะถูกประมวลผลหรือไม่

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

การแก้ลำดับค่า: การแทนที่ราย DM → ค่าเริ่มต้นของ provider → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมด self-chat

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมด self-chat (ละเว้น native @-mentions และตอบสนองเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่รวมมาในปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น**เอกสารอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` จะมีเอกสารอยู่ในหน้าช่องทาง/Plugin ของตัวเอง รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ**แยกเดี่ยว**ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- `nativeSkills: "auto"` เปิดคำสั่ง Skills เนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- แทนที่ค่าเป็นรายช่องทาง: `channels.discord.commands.native` (bool หรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้า
- แทนที่การลงทะเบียน Skills เนทีฟเป็นรายช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์โฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ Gateway `chat.send` การเขียน `/config set|unset` แบบถาวรยังต้องมี `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ผู้ดำเนินการที่มีขอบเขตเขียนตามปกติ
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าเป็นรายช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่ระบุเป้าหมายไปยังบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการทำงานของเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ allowlist เจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือเฉพาะเจ้าของ แยกต่างหากจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบรายผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งการอนุญาต**เพียงแหล่งเดียว** (allowlist/การจับคู่ของช่องทาง และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัว + ที่รวมมา: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
