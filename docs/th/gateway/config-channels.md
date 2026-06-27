---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการควบคุมด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ คีย์แยกตามช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-06-27T17:32:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bdc9c0b3c55f2ad6a7d6874022cdac6abbe8d0219feda3c8c9710c08e4d8fb7
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การบังคับให้กล่าวถึง, และคีย์รายช่องสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่นที่รวมมาให้

สำหรับตัวแทน, เครื่องมือ, รันไทม์ Gateway และคีย์ระดับบนอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การบังคับให้กล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากบล็อกผู้ให้บริการหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดไว้ก่อนเมื่อผิดพลาด) พร้อมคำเตือนเมื่อเริ่มทำงาน
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อปักหมุด ID ช่องทางเฉพาะหรือเพียร์ข้อความโดยตรงให้กับโมเดล ค่าใช้งานได้ทั้ง `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

สำหรับการสนทนาแบบกลุ่ม/เธรด คีย์คือ ID กลุ่มเฉพาะช่องทาง, ID หัวข้อ หรือชื่อช่องทาง สำหรับการสนทนาแบบข้อความโดยตรง (DM) คีย์คือตัวระบุเพียร์ที่ได้จากตัวตนผู้ส่งของช่องทาง (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` หรือ `SenderId`) รูปแบบคีย์ที่แน่นอนขึ้นอยู่กับช่องทาง:

| ช่องทาง  | รูปแบบคีย์ DM         | ตัวอย่าง                                      |
| -------- | ------------------- | -------------------------------------------- |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | ID ผู้ใช้ดิบ         | `123456789`                                  |
| Discord  | ID ผู้ใช้ดิบ         | `987654321`                                  |
| WhatsApp | หมายเลขโทรศัพท์หรือ JID | `15551234567`                                |
| Matrix   | ID ผู้ใช้ Matrix      | `@user:matrix.org`                           |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.5",
        "user:U12345": "openai/gpt-5.4-mini",
      },
      telegram: {
        "-1001234567890": "openai/gpt-5.4-mini",
        "-1001234567890:topic:99": "anthropic/claude-sonnet-4-6",
        "123456789": "openai/gpt-4.1",
      },
    },
  },
}
```

คีย์เฉพาะ DM จะจับคู่เฉพาะในการสนทนาแบบข้อความโดยตรงเท่านั้น; คีย์เหล่านี้ไม่มีผลต่อการกำหนดเส้นทางกลุ่ม/เธรด

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่เก็บบริบทการอ้างอิง/ตอบกลับอย่างชัดเจนไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติดีในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมคุณภาพ/ข้อผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

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

- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับ DM และกลุ่มของ WhatsApp ใช้หมายเลขตรงแบบ E.164 หรือ JID กลุ่ม WhatsApp ใน `match.peer.id` ความหมายของฟิลด์ใช้ร่วมกันใน [ตัวแทน ACP](/th/tools/acp-agents#persistent-channel-bindings)

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี; มิฉะนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- ตัวเลือก `channels.whatsapp.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
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

- โทเคนบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; ปฏิเสธ symlink) โดยมี `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่หลงติดมาโดยไม่ตั้งใจ
- ตัวเลือก `channels.telegram.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนค่ากำหนดที่เริ่มจาก Telegram (การย้าย ID ซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ตัวแทน ACP](/th/tools/acp-agents#persistent-channel-bindings)
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
      suppressEmbeds: true,
      chunkMode: "length", // length | newline
      streaming: {
        mode: "progress", // off | partial | block | progress (Discord default: progress)
        progress: {
          label: "auto",
          maxLines: 8,
          maxLineChars: 120,
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น ส่วนการตั้งค่า retry/policy ของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` แบบไม่บังคับจะเขียนทับการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง ระบบจะปฏิเสธรหัสตัวเลขล้วน
- slug ของ guild เป็นตัวพิมพ์เล็กและแทนช่องว่างด้วย `-`; คีย์ของช่องใช้ชื่อแบบ slug (ไม่มี `#`) แนะนำให้ใช้รหัส guild
- ข้อความที่บอตเขียนจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` จะเปิดใช้ข้อความเหล่านั้น ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- ช่องที่รองรับข้อความขาเข้าที่บอตเขียนสามารถใช้ [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ร่วมกันได้ ตั้งค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณคู่พื้นฐาน จากนั้นจึงเขียนทับที่ช่องหรือบัญชีเฉพาะเมื่อพื้นผิวนั้นต้องใช้ขีดจำกัดต่างออกไป
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการเขียนทับระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือ role อื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จะแมปข้อความขาออก `@handle` ที่เสถียรไปยังรหัสผู้ใช้ Discord ก่อนส่ง เพื่อให้สามารถกล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่ การเขียนทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแยกข้อความที่สูงมากแม้จะต่ำกว่า 2000 อักขระ
- `channels.discord.suppressEmbeds` มีค่าเริ่มต้นเป็น `true` ดังนั้น URL ขาออกจะไม่ขยายเป็นตัวอย่างลิงก์ของ Discord เว้นแต่จะปิดใช้งาน payload `embeds` ที่ระบุชัดเจนยังคงส่งตามปกติ การเรียกเครื่องมือรายข้อความสามารถเขียนทับด้วย `suppressEmbeds`
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรดของ Discord:
  - `enabled`: การเขียนทับของ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/กำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การเขียนทับของ Discord สำหรับ auto-unfocus เมื่อไม่มีความเคลื่อนไหวเป็นจำนวนชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การเขียนทับของ Discord สำหรับอายุสูงสุดแบบบังคับเป็นจำนวนชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent แบบ native สำหรับการ spawn ที่ผูกกับเธรด (`"fork"` เป็นค่าเริ่มต้น)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้รหัสช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ตัวแทน ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่ callback ของคอมโพเนนต์ Discord ที่ส่งแล้วยังคงลงทะเบียนอยู่ ค่าเริ่มต้นคือ `1800000` (30 นาที) ค่าสูงสุดคือ `86400000` (24 ชั่วโมง) และการเขียนทับรายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ค่าที่ยาวขึ้นทำให้ปุ่ม/select/form เก่ายังใช้งานได้นานขึ้น ดังนั้นควรใช้ TTL ที่สั้นที่สุดที่เหมาะกับ workflow
- `channels.discord.voice` เปิดใช้การสนทนาในช่องเสียง Discord และการเขียนทับ auto-join + LLM + TTS แบบไม่บังคับ การกำหนดค่า Discord แบบข้อความล้วนจะปิดเสียงไว้โดยค่าเริ่มต้น ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกใช้
- `channels.discord.voice.model` เขียนทับโมเดล LLM ที่ใช้สำหรับคำตอบในช่องเสียง Discord ได้แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (`30000` ตามค่าเริ่มต้น)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ถูกตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่การส่งสัญญาณ reconnect ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (`15000` ตามค่าเริ่มต้น)
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะโดยเหตุการณ์เริ่มพูดของผู้ใช้อื่น เพื่อหลีกเลี่ยง feedback loop OpenClaw จะละเว้นการจับเสียงใหม่ขณะ TTS กำลังเล่น
- OpenClaw ยังพยายามกู้คืนการรับเสียงเพิ่มเติมโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำ
- `channels.discord.streaming` คือคีย์โหมดสตรีมตาม canonical Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความตัวอย่างที่แก้ไขข้อความเดียว ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน ค่า `streamMode` แบบ legacy และค่า boolean `streaming` ยังคงเป็น alias ของรันไทม์ เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่คงอยู่ใหม่
- `channels.discord.autoPresence` จะแมปความพร้อมใช้งานของรันไทม์เป็นสถานะของบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้เขียนทับข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำอนุมัติ exec แบบ native ของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto คำอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: รหัสผู้ใช้ Discord ที่ได้รับอนุญาตให้ออนุมัติคำขอ exec จะ fallback ไปที่ `commands.ownerAllowFrom` เมื่อละไว้
  - `agentFilter`: allowlist รหัสตัวแทนแบบไม่บังคับ ละไว้เพื่อส่งต่อคำอนุมัติสำหรับตัวแทนทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง prompt การอนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปยังทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้งานได้เฉพาะโดยผู้อนุมัติที่ resolve แล้วเท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

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
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)

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

- **โหมด Socket** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับการใช้ env สำรองของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่ระดับรากหรือรายบัญชี)
- `socketMode` ส่งการปรับแต่งการขนส่ง Slack SDK Socket Mode ผ่านไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบ timeout ของ ping/pong หรือพฤติกรรม websocket ที่ค้างอยู่เท่านั้น `clientPingTimeout` มีค่าเริ่มต้นเป็น `15000`; `serverPingTimeout` และ `pingPongLoggingEnabled` จะถูกส่งผ่านเมื่อกำหนดค่าไว้เท่านั้น
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- สแนปชอตบัญชี Slack แสดงฟิลด์แหล่งที่มา/สถานะรายข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่พาธคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีม Slack แบบ canonical `channels.slack.streaming.nativeTransport` ควบคุมการขนส่งสตรีมมิงแบบเนทีฟของ Slack ค่า legacy `streamMode`, boolean `streaming` และ `nativeStreaming` ยังคงเป็น alias ของรันไทม์; รัน `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่
- `unfurlLinks` และ `unfurlMedia` ส่ง boolean สำหรับการ unfurl ลิงก์และสื่อของ `chat.postMessage` ของ Slack ผ่านไปสำหรับการตอบกลับของบอท `unfurlLinks` มีค่าเริ่มต้นเป็น `false` เพื่อให้ลิงก์ขาออกของบอทไม่ขยายแบบ inline เว้นแต่จะเปิดใช้; `unfurlMedia` จะถูกละไว้เว้นแต่กำหนดค่าไว้ ตั้งค่าใดค่าหนึ่งที่ `channels.slack.accounts.<accountId>` เพื่อแทนที่ค่าระดับบนสุดสำหรับบัญชีหนึ่งบัญชี
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนด้วย reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยก session ของ thread:** `thread.historyScope` เป็นแบบราย thread (ค่าเริ่มต้น) หรือแชร์ทั้ง channel `thread.inheritParent` คัดลอก transcript ของ channel แม่ไปยัง thread ใหม่

- Slack native streaming พร้อมสถานะ thread แบบผู้ช่วยของ Slack "is typing..." ต้องมีเป้าหมาย thread สำหรับตอบกลับ DM ระดับบนสุดจะยังอยู่นอก thread ตามค่าเริ่มต้น ดังนั้นยังสามารถสตรีมผ่านตัวอย่าง draft แบบโพสต์แล้วแก้ไขของ Slack ได้แทนที่จะแสดงตัวอย่าง native stream/status แบบ thread
- `typingReaction` เพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าระหว่างที่การตอบกลับกำลังทำงาน แล้วลบออกเมื่อเสร็จสิ้น ใช้ shortcode emoji ของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่ง approval-client แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ exec ใช้ schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`) การอนุมัติ Plugin สามารถใช้พาธ native-client นี้สำหรับคำขอที่มีต้นทางจาก Slack เมื่อ resolve ผู้อนุมัติ Slack plugin ได้; การส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ยังสามารถเปิดใช้ผ่าน `approvals.plugin` สำหรับ session ที่มีต้นทางจาก Slack หรือเป้าหมาย Slack ได้ การอนุมัติ Plugin ใช้ผู้อนุมัติ Slack plugin จาก `allowFrom` และการกำหนดเส้นทางเริ่มต้น ไม่ใช่ผู้อนุมัติ exec

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | React + แสดงรายการ reactions |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการ emoji กำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin แบบ bundled ใน OpenClaw รุ่นปัจจุบัน รุ่นเก่าหรือ
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

โหมดแชท: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย prefix ทริกเกอร์)

เมื่อเปิดใช้คำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw gateway และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback slash แบบเนทีฟจะ authenticate ด้วยโทเคนรายคำสั่งที่ Mattermost ส่งกลับ
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบ private/tailnet/internal Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมน callback ไว้
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับใน channel
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การ gate ด้วย mention ราย channel (`"*"` สำหรับค่าเริ่มต้น)
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

**โหมดการแจ้งเตือนด้วย reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: pin การเริ่มต้น channel กับ identity บัญชี Signal ที่เฉพาะเจาะจง
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### iMessage

OpenClaw สร้าง `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต นี่คือพาธที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อโฮสต์สามารถให้สิทธิ์ฐานข้อมูล Messages และ Automation ได้

การรองรับ BlueBubbles ถูกนำออกแล้ว `channels.bluebubbles` ไม่ใช่พื้นผิว config รันไทม์ที่รองรับบน OpenClaw ปัจจุบัน ย้าย config เก่าไปยัง `channels.imessage`; ใช้ [การนำ BlueBubbles ออกและพาธ imsg iMessage](/th/announcements/bluebubbles-imessage) สำหรับเวอร์ชันสั้น และ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางแปลเต็ม

หาก Gateway ไม่ได้ทำงานบน Messages Mac ที่ลงชื่อเข้าใช้ ให้คง `channels.imessage.enabled=true` และตั้ง `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg "$@"` บน Mac เครื่องนั้น พาธ `imsg` ภายในเครื่องตามค่าเริ่มต้นใช้ได้เฉพาะ macOS

ก่อนพึ่งพา SSH wrapper สำหรับการส่งใน production ให้ตรวจสอบ `imsg send` ขาออกผ่าน wrapper เดียวกันนั้นก่อน สถานะ macOS TCC บางแบบกำหนด Messages Automation ให้กับ `/usr/libexec/sshd-keygen-wrapper` ซึ่งอาจทำให้การอ่านและ probe ทำงานได้ แต่การส่งล้มเหลวด้วย AppleEvents `-1743`; ดู [การส่งผ่าน SSH wrapper ล้มเหลวด้วย AppleEvents -1743](/th/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)

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
      sendTransport: "auto",
      region: "US",
      actions: {
        reactions: true,
        edit: true,
        unsend: true,
        reply: true,
        sendWithEffect: true,
        sendAttachment: true,
      },
    },
  },
}
```

- `channels.imessage.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องมี Full Disk Access ไปยัง Messages DB
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชท
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้ง `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจให้แน่ใจว่า host key ของ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- `channels.imessage.sendTransport`: การขนส่งการส่ง RPC ของ `imsg` ที่ต้องการสำหรับการตอบกลับขาออกปกติ `auto` (ค่าเริ่มต้น) ใช้ IMCore bridge สำหรับแชทที่มีอยู่เมื่อกำลังทำงานอยู่ แล้ว fallback ไปยัง AppleScript; `bridge` ต้องใช้การส่งผ่าน private-API; `applescript` บังคับใช้พาธ Automation ของ Messages สาธารณะ
- `channels.imessage.actions.*`: เปิดใช้การกระทำ private API ที่ถูก gate ด้วย `imsg status` / `openclaw channels status --probe` ด้วย
- `channels.imessage.includeAttachments` ปิดตามค่าเริ่มต้น; ตั้งเป็น `true` ก่อนคาดหวังสื่อขาเข้าใน turn ของ agent
- การกู้คืนขาเข้าหลัง bridge/gateway restart เป็นอัตโนมัติ (GUID dedupe พร้อม stale-backlog age fence) config `channels.imessage.catchup.enabled: true` ที่มีอยู่ยังคงได้รับการรองรับในฐานะโปรไฟล์ compatibility ที่ deprecated แล้ว
- `channels.imessage.groups`: registry กลุ่มและการตั้งค่ารายกลุ่ม เมื่อใช้ `groupPolicy: "allowlist"` ให้กำหนดค่าคีย์ `chat_id` ที่ระบุชัดเจนหรือ entry wildcard `"*"` เพื่อให้ข้อความกลุ่มผ่าน registry gate ได้
- entry ระดับบนสุด `bindings[]` ที่มี `type: "acp"` สามารถ bind การสนทนา iMessage กับ session ACP แบบถาวรได้ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชทที่ระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง SSH wrapper สำหรับ iMessage">

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

- การตรวจสอบสิทธิ์ด้วยโทเค็นใช้ `accessToken`; การตรวจสอบสิทธิ์ด้วยรหัสผ่านใช้ `userId` + `password`.
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ได้ด้วย `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการเลือกใช้เครือข่ายนี้เป็นการควบคุมที่แยกจากกัน.
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี.
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญมาและคำเชิญแบบ DM ใหม่จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`.
- `channels.matrix.execApprovals`: การส่งมอบการอนุมัติ exec แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ.
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น). ในโหมดอัตโนมัติ การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้.
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อุนมัติคำขอ exec.
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`.
  - การแทนที่รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตามเพียร์ที่กำหนดเส้นทาง ขณะที่ `per-room` แยกแต่ละห้อง DM.
- โพรบสถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้ policy พร็อกซีเดียวกับทราฟฟิก runtime.
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารอยู่ใน [Matrix](/th/channels/matrix).

### Microsoft Teams

Microsoft Teams มี Plugin รองรับและกำหนดค่าภายใต้ `channels.msteams`.

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

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.msteams`, `channels.msteams.configWrites`.
- การกำหนดค่า Teams แบบเต็ม (ข้อมูลประจำตัว, webhook, policy ของ DM/กลุ่ม, การแทนที่รายทีม/รายช่อง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams).

### IRC

IRC มี Plugin รองรับและกำหนดค่าภายใต้ `channels.irc`.

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

- เส้นทางคีย์หลักที่ครอบคลุมที่นี่: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`.
- `channels.irc.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้.
- การกำหนดค่าช่อง IRC แบบเต็ม (โฮสต์/พอร์ต/TLS/ช่อง/allowlist/การควบคุม mention) มีเอกสารอยู่ใน [IRC](/th/channels/irc).

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การกำหนดเส้นทาง).
- โทเค็น env มีผลกับบัญชี **เริ่มต้น** เท่านั้น.
- การตั้งค่าช่องพื้นฐานมีผลกับทุกบัญชี เว้นแต่จะถูกแทนที่รายบัญชี.
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์ที่ต่างกัน.
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่อง) ขณะที่ยังอยู่บนการกำหนดค่าช่องระดับบนแบบบัญชีเดียว OpenClaw จะโปรโมตค่าบัญชีเดียวระดับบนที่อยู่ในขอบเขตบัญชีเข้าไปในแมปบัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านั้นไปที่ `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่เดิมแทนได้.
- binding เฉพาะช่องที่มีอยู่ (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีเริ่มต้น; binding ที่อยู่ในขอบเขตบัญชียังคงเป็นแบบไม่บังคับ.
- `openclaw doctor --fix` ยังซ่อมแซมรูปทรงผสมโดยย้ายค่าบัญชีเดียวระดับบนที่อยู่ในขอบเขตบัญชีเข้าไปในบัญชีที่โปรโมตซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายแบบมีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่เดิมแทนได้.

### ช่อง Plugin อื่นๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องเฉพาะของตน (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch).
ดูดัชนีช่องทั้งหมด: [ช่อง](/th/channels).

### การควบคุม mention ในแชทกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมี mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย). ใช้กับแชทกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage.

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก คำขอโดยตรงแบบกลุ่ม ช่อง และ WebChat ภายในตามปกติมีค่าเริ่มต้นเป็นการส่งมอบผลลัพธ์สุดท้ายอัตโนมัติ: ข้อความสุดท้ายของผู้ช่วยจะโพสต์ผ่านเส้นทางตอบกลับที่มองเห็นได้แบบ legacy เลือกใช้ `messages.visibleReplies: "message_tool"` หรือ `messages.groupChat.visibleReplies: "message_tool"` เมื่อเอาต์พุตที่มองเห็นได้ควรโพสต์หลังจากเอเจนต์เรียก `message(action=send)` เท่านั้น หากโมเดลส่งคืนข้อความสุดท้ายโดยไม่เรียกเครื่องมือ message ในโหมด tool-only ที่เลือกใช้ ข้อความสุดท้ายนั้นจะเป็นส่วนตัว และบันทึก verbose ของ gateway จะบันทึก metadata ของ payload ที่ถูกระงับ.

การตอบกลับที่มองเห็นได้แบบ tool-only ต้องใช้โมเดล/runtime ที่เรียก tools ได้อย่างน่าเชื่อถือ และแนะนำสำหรับห้องที่แชร์ร่วมกันบนโมเดลรุ่นล่าสุด เช่น GPT 5.5 โมเดลที่อ่อนกว่าบางตัวสามารถตอบข้อความสุดท้ายได้ แต่ไม่เข้าใจว่าเอาต์พุตที่มองเห็นโดยต้นทางต้องถูกส่งด้วย `message(action=send)` สำหรับโมเดลเหล่านั้น ให้ใช้ `"automatic"` เพื่อให้เทิร์นสุดท้ายของผู้ช่วยเป็นเส้นทางตอบกลับที่มองเห็นได้ หากบันทึกเซสชันแสดงข้อความผู้ช่วยพร้อม `didSendViaMessagingTool: false` แปลว่าโมเดลสร้างข้อความสุดท้ายแบบส่วนตัวแทนที่จะเรียกเครื่องมือ message ให้เปลี่ยนไปใช้โมเดลที่เรียก tool ได้ดีกว่าสำหรับช่องนั้น ตรวจสอบบันทึก verbose ของ gateway เพื่อดูสรุป payload ที่ถูกระงับ หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อใช้การตอบกลับสุดท้ายที่มองเห็นได้สำหรับทุกคำขอกลุ่ม/ช่อง.

หากเครื่องมือ message ไม่พร้อมใช้งานภายใต้ policy เครื่องมือที่ใช้งานอยู่ OpenClaw จะ fallback ไปใช้การตอบกลับที่มองเห็นได้อัตโนมัติแทนการระงับการตอบสนองแบบเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้.

กฎนี้ใช้กับข้อความสุดท้ายของเอเจนต์ตามปกติ binding การสนทนาที่ Plugin เป็นเจ้าของจะใช้การตอบกลับที่ Plugin เจ้าของส่งคืนเป็นการตอบสนองที่มองเห็นได้สำหรับเทิร์น bound-thread ที่อ้างสิทธิ์; Plugin ไม่จำเป็นต้องเรียก `message(action=send)` สำหรับการตอบกลับของ binding เหล่านั้น.

**การแก้ปัญหา: group @mention เรียก typing แล้วเงียบ (ไม่มีข้อผิดพลาด)**

อาการ: @mention ในกลุ่ม/ช่องแสดงตัวบ่งชี้การพิมพ์ และบันทึก gateway รายงาน `dispatch complete (queuedFinal=false, replies=0)` แต่ไม่มีข้อความไปถึงในห้อง DM ไปยังเอเจนต์เดียวกันตอบกลับตามปกติ.

สาเหตุ: โหมดการตอบกลับที่มองเห็นได้ของกลุ่ม/ช่อง resolve เป็น `"message_tool"` ดังนั้น OpenClaw จะรันเทิร์น แต่ระงับข้อความสุดท้ายของผู้ช่วย เว้นแต่เอเจนต์จะเรียก `message(action=send)` ไม่มีสัญญา `NO_REPLY` ในโหมดนี้; ไม่มีการเรียก message-tool หมายถึงไม่มีการตอบกลับไปยังต้นทาง ไม่มีข้อผิดพลาดเพราะการระงับคือพฤติกรรมที่กำหนดค่าไว้ เทิร์นกลุ่มและช่องตามปกติมีค่าเริ่มต้นเป็น `"automatic"` ดังนั้นอาการนี้จะปรากฏเฉพาะเมื่อ `messages.groupChat.visibleReplies` (หรือ `messages.visibleReplies` แบบ global) ถูกตั้งค่าอย่างชัดเจนเป็น `"message_tool"` Harness `defaultVisibleReplies` ไม่มีผลที่นี่ — resolver ของกลุ่ม/ช่องจะละเว้นค่านี้; มีผลเฉพาะกับแชท direct/source (Codex harness ระงับผลลัพธ์สุดท้ายของ direct-chat ด้วยวิธีนั้น).

วิธีแก้: เลือกโมเดลที่เรียก tool ได้ดีกว่า, ลบการแทนที่ `"message_tool"` ที่ระบุชัดเจนเพื่อกลับไปใช้ค่าเริ่มต้น `"automatic"`, หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อบังคับการตอบกลับที่มองเห็นได้สำหรับทุกคำขอกลุ่ม/ช่อง Gateway จะ hot-reload การกำหนดค่า `messages` หลังจากบันทึกไฟล์; รีสตาร์ท Gateway เฉพาะเมื่อการเฝ้าดูไฟล์หรือการ reload config ถูกปิดใช้งานในการปรับใช้เท่านั้น.

**ประเภท mention:**

- **Metadata mentions**: @-mentions แบบเนทีฟของแพลตฟอร์ม ถูกละเว้นในโหมด self-chat ของ WhatsApp.
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนกันที่ไม่ปลอดภัยจะถูกละเว้น.
- การควบคุม mention จะบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (mention แบบเนทีฟหรืออย่างน้อยหนึ่งรูปแบบ).

```json5
{
  messages: {
    visibleReplies: "automatic", // force old automatic final replies for direct/source chats
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // always-on unmentioned room chatter becomes quiet context
      visibleReplies: "message_tool", // opt-in; require message(action=send) for visible room replies
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นแบบ global ช่องสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี). ตั้งค่า `0` เพื่อปิดใช้งาน.

`messages.groupChat.unmentionedInbound: "room_event"` ส่งข้อความกลุ่ม/ช่องแบบ always-on ที่ไม่ถูก mention เป็นบริบทห้องแบบเงียบบนช่องที่รองรับ ข้อความที่ถูก mention, คำสั่ง และข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้ ดูตัวอย่าง Discord, Slack และ Telegram แบบครบถ้วนได้ที่ [เหตุการณ์ห้องแบบ ambient](/th/channels/ambient-room-events).

`messages.visibleReplies` คือค่าเริ่มต้นของ source-event แบบ global; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับ source event แบบกลุ่ม/ช่อง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` แชท direct/source จะใช้ค่าเริ่มต้นของ runtime หรือ harness ที่เลือก แต่เทิร์น direct ของ WebChat ภายในจะใช้การส่งมอบผลลัพธ์สุดท้ายอัตโนมัติเพื่อให้พรอมป์ Pi/Codex เทียบเท่ากัน ตั้งค่า `messages.visibleReplies: "message_tool"` เพื่อจงใจกำหนดให้ต้องใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้ allowlist ของช่องและการควบคุม mention ยังเป็นตัวตัดสินว่า event จะถูกประมวลผลหรือไม่.

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

การ resolve: การแทนที่ราย DM → ค่าเริ่มต้นของ provider → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด).

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### โหมด self-chat

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมด self-chat (ละเว้น @-mentions แบบเนทีฟ ตอบสนองเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่บันเดิลมาปัจจุบัน ดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone`, และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/Plugin ของคำสั่งนั้น รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยว standalone** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดใช้คำสั่งเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- `nativeSkills: "auto"` เปิดใช้คำสั่ง Skills เนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- เขียนทับต่อช่องทาง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนคำสั่งเนทีฟและการล้างข้อมูลระหว่างเริ่มต้น
- เขียนทับการลงทะเบียน Skills เนทีฟต่อช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์โฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรต้องมี `operator.admin` ด้วย ส่วน `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ operator ปกติที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ Plugin การติดตั้ง และการควบคุมเปิด/ปิด
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าต่อช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่เจาะจงบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการดำเนินการเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ allowlist เจ้าของแบบชัดเจนสำหรับคำสั่งเฉพาะเจ้าของและการดำเนินการช่องทางที่ถูกจำกัดด้วยเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบรายผู้ให้บริการ เมื่อตั้งค่าแล้ว จะเป็นแหล่งการอนุญาต **เดียวเท่านั้น** (allowlist/การจับคู่ของช่องทางและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัว + ที่บันเดิลมา: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
