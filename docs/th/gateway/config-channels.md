---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการควบคุมด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์รายช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่น ๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-07-01T13:30:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba84406a296db7a37ce44381b5a1ebccd7f4d3c32375b116f6da3da5def9340b
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม
การตั้งค่าหลายบัญชี การควบคุมด้วยการกล่าวถึง และคีย์รายช่องสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่น ๆ ที่รวมมาให้

สำหรับเอเจนต์ เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนอื่น ๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การควบคุมด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากบล็อกผู้ให้บริการหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดเมื่อผิดพลาด) พร้อมคำเตือนตอนเริ่มทำงาน
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องทางหรือเพียร์ข้อความโดยตรงเฉพาะกับโมเดล ค่ายอมรับรูปแบบ `provider/model` หรือชื่อแทนโมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

สำหรับการสนทนาแบบกลุ่ม/เธรด คีย์คือ ID กลุ่มเฉพาะช่องทาง, ID หัวข้อ หรือชื่อช่องทาง สำหรับการสนทนาแบบข้อความโดยตรง (DM) คีย์คือรหัสระบุตัวตนของเพียร์ที่ได้จากตัวตนผู้ส่งของช่องทาง (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` หรือ `SenderId`) รูปแบบคีย์ที่แน่นอนขึ้นอยู่กับช่องทาง:

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

คีย์เฉพาะ DM จะตรงกันเฉพาะในการสนทนาแบบข้อความโดยตรงเท่านั้น และจะไม่ส่งผลต่อการกำหนดเส้นทางกลุ่ม/เธรด

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น รวมบริบทที่อ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือน allowlist แต่คงบริบทการอ้างอิง/ตอบกลับอย่างชัดเจนไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมคุณภาพ/ผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) และจะเริ่มโดยอัตโนมัติเมื่อมีเซสชันที่เชื่อมโยงอยู่

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

- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับ DM และกลุ่มของ WhatsApp ใช้หมายเลขตรงรูปแบบ E.164 หรือ JID กลุ่ม WhatsApp ใน `match.peer.id` ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่ มิฉะนั้นจะใช้ ID บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวรุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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
      streaming: "partial", // off | partial | block | progress (default: partial)
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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น ไม่ยอมรับ symlink) โดยมี `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่ติดมาโดยไม่ตั้งใจ
- `channels.telegram.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (ID บัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Telegram (การย้าย ID ซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบบัญญัติใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก ส่วนการตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง ระบบจะปฏิเสธ ID ตัวเลขล้วน
- slug ของ guild เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ของช่องใช้ชื่อแบบ slug (ไม่มี `#`) ควรใช้ ID ของ guild
- ข้อความที่บอทเขียนจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` เปิดใช้งานข้อความเหล่านั้น ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น (ข้อความของตัวเองยังคงถูกกรอง)
- ช่องที่รองรับข้อความขาเข้าที่บอทเขียนสามารถใช้ [การป้องกันลูปบอท](/th/channels/bot-loop-protection) ร่วมกันได้ ตั้งค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณคู่พื้นฐาน แล้วค่อยแทนที่เฉพาะช่องหรือบัญชีเมื่อ surface หนึ่งต้องใช้ขีดจำกัดต่างออกไป
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จับคู่ข้อความ `@handle` ขาออกแบบคงที่กับ ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่ การแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แยกข้อความที่สูงมากแม้จะต่ำกว่า 2000 อักขระ
- `channels.discord.suppressEmbeds` มีค่าเริ่มต้นเป็น `true` ดังนั้น URL ขาออกจะไม่ขยายเป็นตัวอย่างลิงก์ของ Discord เว้นแต่จะปิดใช้งาน เพย์โหลด `embeds` ที่ระบุชัดเจนยังคงส่งตามปกติ การเรียกเครื่องมือรายข้อความสามารถแทนที่ด้วย `suppressEmbeds` ได้
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรด Discord:
  - `enabled`: การแทนที่ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/กำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ Discord สำหรับการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีความเคลื่อนไหว หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ Discord สำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` เป็นค่าเริ่มต้น)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [Agent ของ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ components v2 ของ Discord
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่ callback ของ component Discord ที่ส่งไปแล้วยังคงลงทะเบียนอยู่ ค่าเริ่มต้นคือ `1800000` (30 นาที), ค่าสูงสุดคือ `86400000` (24 ชั่วโมง) และการแทนที่รายบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ค่าที่ยาวขึ้นทำให้ปุ่ม/ตัวเลือก/ฟอร์มเก่าใช้งานได้นานขึ้น ดังนั้นควรใช้ TTL ที่สั้นที่สุดที่เหมาะกับ workflow
- `channels.discord.voice` เปิดใช้การสนทนาในช่องเสียง Discord และการเข้าร่วมอัตโนมัติ + LLM + การแทนที่ TTS แบบไม่บังคับ คอนฟิก Discord แบบข้อความเท่านั้นจะปิดเสียงโดยค่าเริ่มต้น ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord ได้แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งต่อไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` โดยค่าเริ่มต้น)
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ (`30000` โดยค่าเริ่มต้น)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ถูกตัดการเชื่อมต่อสามารถใช้เพื่อเข้าสู่สัญญาณ reconnect ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (`15000` โดยค่าเริ่มต้น)
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะด้วยเหตุการณ์เริ่มพูดของผู้ใช้อื่น เพื่อหลีกเลี่ยงลูปป้อนกลับ OpenClaw จะละเว้นการจับเสียงใหม่ระหว่างที่ TTS กำลังเล่น
- OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังจากเกิดความล้มเหลวในการถอดรหัสซ้ำหลายครั้ง
- `channels.discord.streaming` เป็นคีย์โหมดสตรีม canonical Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความตัวอย่างที่แก้ไขข้อความเดียว ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน ค่า `streamMode` แบบ legacy และค่า `streaming` แบบบูลีนยังคงเป็น alias ระดับรันไทม์ เรียกใช้ `openclaw doctor --fix` เพื่อเขียนคอนฟิกที่เก็บไว้ใหม่
- `channels.discord.autoPresence` จับคู่สถานะพร้อมใช้งานของรันไทม์กับ presence ของบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะทำงานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec fallback ไปที่ `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ ไม่ระบุเพื่อส่งต่อการอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมต์อนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อ target รวม `"channel"` ปุ่มจะใช้ได้เฉพาะผู้อนุมัติที่ระบุได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM อนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

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

- JSON ของ service account: แบบ inline (`serviceAccount`) หรือแบบใช้ไฟล์ (`serviceAccountFile`)
- รองรับ SecretRef ของ service account ด้วย (`serviceAccountRef`)
- fallback ของ env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบ break-glass)

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

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องใช้ `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี)
- `socketMode` ส่งการปรับแต่งการขนส่ง Slack SDK Socket Mode ต่อไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหา ping/pong timeout หรือพฤติกรรม websocket ค้างเท่านั้น `clientPingTimeout` มีค่าเริ่มต้นเป็น `15000`; `serverPingTimeout` และ `pingPongLoggingEnabled` จะถูกส่งต่อเฉพาะเมื่อมีการกำหนดค่า
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงแบบข้อความล้วน
  หรืออ็อบเจ็กต์ SecretRef
- สแนปชอตบัญชี Slack แสดงฟิลด์แหล่งที่มา/สถานะรายข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus` `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าลับได้
- `configWrites: false` บล็อกการเขียนคอนฟิกที่เริ่มจาก Slack
- ตัวเลือก `channels.slack.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีม Slack แบบ canonical `channels.slack.streaming.nativeTransport` ควบคุมการขนส่งสตรีมมิงแบบเนทีฟของ Slack ค่าเดิม `streamMode`, `streaming` แบบบูลีน และ `nativeStreaming` ยังคงเป็น alias ในรันไทม์; รัน `openclaw doctor --fix` เพื่อเขียนคอนฟิกที่คงไว้ใหม่
- `unfurlLinks` และ `unfurlMedia` ส่งค่าบูลีนการคลี่ลิงก์และสื่อของ `chat.postMessage` ของ Slack ต่อสำหรับการตอบกลับของบอต `unfurlLinks` มีค่าเริ่มต้นเป็น `false` เพื่อให้ลิงก์บอตขาออกไม่ขยายในบรรทัดเว้นแต่เปิดใช้; `unfurlMedia` จะถูกละไว้เว้นแต่กำหนดค่าไว้ ตั้งค่าใดค่าหนึ่งที่ `channels.slack.accounts.<accountId>` เพื่อแทนที่ค่าระดับบนสุดสำหรับบัญชีเดียว
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นรายเธรด (ค่าเริ่มต้น) หรือแชร์ข้ามช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ช่องหลักไปยังเธรดใหม่

- สตรีมมิงเนทีฟของ Slack พร้อมสถานะเธรดแบบผู้ช่วยของ Slack อย่าง "is typing..." ต้องใช้เป้าหมายเธรดสำหรับการตอบกลับ DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น จึงยังสามารถสตรีมผ่านตัวอย่างแบบร่างโพสต์และแก้ไขของ Slack แทนการแสดงตัวอย่างสตรีม/สถานะแบบเธรดเนทีฟได้
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้ข้อความ Slack ขาเข้าขณะกำลังเรียกใช้การตอบกลับ แล้วลบออกเมื่อเสร็จสิ้น ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่ง approval-client แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ exec ใช้สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`) การอนุมัติ Plugin สามารถใช้เส้นทางไคลเอนต์เนทีฟนี้สำหรับคำขอที่มาจาก Slack เมื่อ resolve ผู้อนุมัติ Plugin ของ Slack ได้; การส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ยังเปิดใช้ผ่าน `approvals.plugin` ได้สำหรับเซสชันที่มาจาก Slack หรือเป้าหมาย Slack การอนุมัติ Plugin ใช้ผู้อนุมัติ Plugin ของ Slack จาก `allowFrom` และการกำหนดเส้นทางเริ่มต้น ไม่ใช่ผู้อนุมัติ exec

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้ | รีแอ็กต์ + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้ | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้ | ปักหมุด/ถอนปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้ | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้ | รายการอีโมจิแบบกำหนดเอง      |

### Mattermost

Mattermost มาพร้อมเป็น Plugin ที่ bundled ใน OpenClaw รุ่นปัจจุบัน บิลด์เก่าหรือ
บิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost` ตรวจสอบ
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
สำหรับ dist-tags ปัจจุบันก่อนปักเวอร์ชัน

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

- `commands.callbackPath` ต้องเป็น path (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw Gateway และเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback ของ slash แบบเนทีฟถูกตรวจสอบสิทธิ์ด้วยโทเค็นรายคำสั่งที่
  Mattermost ส่งกลับระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบส่วนตัว/tailnet/internal Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมน callback
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนคอนฟิกที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การกั้นด้วย mention รายช่อง (`"*"` สำหรับค่าเริ่มต้น)
- ตัวเลือก `channels.mattermost.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

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

- `channels.signal.account`: ตรึงการเริ่มช่องไว้กับตัวตนบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนคอนฟิกที่เริ่มจาก Signal
- ตัวเลือก `channels.signal.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### iMessage

OpenClaw spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือ port นี่คือเส้นทางที่แนะนำสำหรับการตั้งค่า iMessage ใหม่ของ OpenClaw เมื่อโฮสต์สามารถให้สิทธิ์ฐานข้อมูล Messages และ Automation ได้

การรองรับ BlueBubbles ถูกลบแล้ว `channels.bluebubbles` ไม่ใช่พื้นผิวคอนฟิกรันไทม์ที่รองรับบน OpenClaw ปัจจุบัน ย้ายคอนฟิกเก่าไปที่ `channels.imessage`; ใช้ [การลบ BlueBubbles และเส้นทาง imsg iMessage](/th/announcements/bluebubbles-imessage) สำหรับเวอร์ชันย่อ และ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles) สำหรับตารางแปลเต็ม

หาก Gateway ไม่ได้รันบน Mac ที่ลงชื่อเข้าใช้ Messages ให้คง `channels.imessage.enabled=true` และตั้ง `channels.imessage.cliPath` เป็น SSH wrapper ที่รัน `imsg "$@"` บน Mac เครื่องนั้น path `imsg` แบบ local เริ่มต้นใช้ได้เฉพาะ macOS

ก่อนพึ่งพา SSH wrapper สำหรับการส่งในโปรดักชัน ให้ตรวจสอบ `imsg send` ขาออกผ่าน wrapper ตัวนั้นจริง ๆ สถานะ TCC บางแบบของ macOS กำหนด Messages Automation ให้กับ `/usr/libexec/sshd-keygen-wrapper` ซึ่งทำให้อ่านและ probe ได้ แต่การส่งล้มเหลวด้วย AppleEvents `-1743`; ดู [การส่งผ่าน SSH wrapper ล้มเหลวด้วย AppleEvents -1743](/th/channels/imessage#ssh-wrapper-sends-fail-with-appleevents-1743)

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

- ตัวเลือก `channels.imessage.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องใช้ Full Disk Access ไปยัง Messages DB
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้ง `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัด path ไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจให้แน่ใจว่า host key ของ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนคอนฟิกที่เริ่มจาก iMessage
- `channels.imessage.sendTransport`: การขนส่งการส่ง RPC `imsg` ที่ต้องการสำหรับการตอบกลับขาออกปกติ `auto` (ค่าเริ่มต้น) ใช้บริดจ์ IMCore สำหรับแชตที่มีอยู่เมื่อบริดจ์กำลังรันอยู่ จากนั้น fallback ไปยัง AppleScript; `bridge` ต้องใช้การส่งผ่าน private API; `applescript` บังคับใช้เส้นทาง Automation ของ Messages แบบสาธารณะ
- `channels.imessage.actions.*`: เปิดใช้การกระทำ private API ที่ถูกกั้นด้วย `imsg status` / `openclaw channels status --probe` ด้วย
- `channels.imessage.includeAttachments` ปิดอยู่ตามค่าเริ่มต้น; ตั้งเป็น `true` ก่อนคาดหวังสื่อขาเข้าใน turn ของ agent
- การกู้คืนขาเข้าหลังรีสตาร์ต bridge/gateway เป็นอัตโนมัติ (GUID dedupe พร้อมขอบเขตอายุ stale-backlog) คอนฟิก `channels.imessage.catchup.enabled: true` ที่มีอยู่ยังคงถูกเคารพในฐานะโปรไฟล์ compatibility ที่เลิกใช้แล้ว
- `channels.imessage.groups`: รีจิสทรีกลุ่มและการตั้งค่ารายกลุ่ม เมื่อใช้ `groupPolicy: "allowlist"` ให้กำหนดค่าคีย์ `chat_id` แบบชัดเจนหรือรายการ wildcard `"*"` เพื่อให้ข้อความกลุ่มผ่านด่านรีจิสทรีได้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถ bind การสนทนา iMessage กับเซสชัน ACP แบบคงอยู่ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชตแบบชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix รองรับโดย Plugin และกำหนดค่าภายใต้ `channels.matrix`

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

- การยืนยันตัวตนด้วยโทเค็นใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`.
- `channels.matrix.proxy` ส่งทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ค่านี้ได้ด้วย `channels.matrix.accounts.<id>.proxy`.
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการเลือกใช้เครือข่ายนี้เป็นการควบคุมคนละส่วนกัน.
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในชุดค่าหลายบัญชี.
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่ได้รับเชิญและคำเชิญใหม่แบบ DM จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`.
- `channels.matrix.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ.
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น). ในโหมดอัตโนมัติ การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`.
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec.
  - `agentFilter`: รายการอนุญาต ID เอเจนต์แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`.
  - การแทนที่รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`.
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม DM ของ Matrix เป็นเซสชัน: `per-user` (ค่าเริ่มต้น) แชร์ตามเพียร์ที่ถูกกำหนดเส้นทาง ส่วน `per-room` แยกแต่ละห้อง DM ออกจากกัน.
- โพรบสถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้กฎพร็อกซีเดียวกับทราฟฟิกขณะรัน.
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารใน [Matrix](/th/channels/matrix).

### Microsoft Teams

Microsoft Teams รองรับด้วย Plugin และกำหนดค่าใต้ `channels.msteams`.

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
- การกำหนดค่า Teams แบบเต็ม (ข้อมูลประจำตัว, Webhook, นโยบาย DM/กลุ่ม, การแทนที่รายทีม/รายช่อง) มีเอกสารใน [Microsoft Teams](/th/channels/msteams).

### IRC

IRC รองรับด้วย Plugin และกำหนดค่าใต้ `channels.irc`.

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
- `channels.irc.defaultAccount` แบบไม่บังคับแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้.
- การกำหนดค่าช่อง IRC แบบเต็ม (โฮสต์/พอร์ต/TLS/ช่อง/รายการอนุญาต/การกั้นตามการกล่าวถึง) มีเอกสารใน [IRC](/th/channels/irc).

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

- `default` ใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การกำหนดเส้นทาง).
- โทเค็น env ใช้กับบัญชี **default** เท่านั้น.
- การตั้งค่าช่องพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่รายบัญชี.
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว.
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่องทาง) ขณะที่ยังใช้การกำหนดค่าช่องระดับบนแบบบัญชีเดียว OpenClaw จะเลื่อนค่าระดับบนแบบบัญชีเดียวที่อยู่ในขอบเขตบัญชีเข้าไปในแผนที่บัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานต่อไปได้ ช่องส่วนใหญ่ย้ายค่าเหล่านั้นไปที่ `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นเดิมที่ตรงกันไว้แทนได้.
- การผูกระดับช่องที่มีอยู่แล้ว (ไม่มี `accountId`) ยังคงจับคู่บัญชีเริ่มต้น; การผูกที่อยู่ในขอบเขตบัญชียังคงเป็นทางเลือก.
- `openclaw doctor --fix` ยังซ่อมแซมรูปทรงที่ผสมกันโดยย้ายค่าระดับบนแบบบัญชีเดียวที่อยู่ในขอบเขตบัญชีเข้าไปในบัญชีที่ถูกเลื่อนซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นเดิมที่ตรงกันไว้แทนได้.

### ช่องทาง Plugin อื่นๆ

ช่องทาง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตน (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat, และ Twitch).
ดูดัชนีช่องทางฉบับเต็ม: [ช่องทาง](/th/channels).

### การกั้นตามการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** (การกล่าวถึงจากเมทาดาทาหรือรูปแบบ regex ที่ปลอดภัย). ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat, และ iMessage.

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกกัน คำขอโดยตรงจากกลุ่มปกติ ช่อง และ WebChat ภายในมีค่าเริ่มต้นเป็นการส่งผลลัพธ์สุดท้ายอัตโนมัติ: ข้อความสุดท้ายของผู้ช่วยจะโพสต์ผ่านเส้นทางการตอบกลับที่มองเห็นได้แบบเดิม เลือกใช้ `messages.visibleReplies: "message_tool"` หรือ `messages.groupChat.visibleReplies: "message_tool"` เมื่อเอาต์พุตที่มองเห็นได้ควรโพสต์หลังจากเอเจนต์เรียก `message(action=send)` เท่านั้น หากโมเดลส่งคืนข้อความสุดท้ายโดยไม่เรียกเครื่องมือข้อความในโหมดเฉพาะเครื่องมือที่เลือกใช้ ข้อความสุดท้ายนั้นจะยังเป็นส่วนตัว และบันทึกแบบละเอียดของ Gateway จะบันทึกเมทาดาทาเพย์โหลดที่ถูกระงับไว้.

การตอบกลับที่มองเห็นได้แบบเฉพาะเครื่องมือต้องใช้โมเดล/รันไทม์ที่เรียกเครื่องมือได้อย่างเชื่อถือได้ และแนะนำสำหรับห้องร่วมแบบแวดล้อมบนโมเดลรุ่นล่าสุด เช่น GPT 5.5 โมเดลที่อ่อนกว่าบางตัวสามารถตอบข้อความสุดท้ายได้ แต่ไม่เข้าใจว่าเอาต์พุตที่มองเห็นได้จากแหล่งที่มาต้องถูกส่งด้วย `message(action=send)` สำหรับโมเดลเหล่านั้น ให้ใช้ `"automatic"` เพื่อให้เทิร์นสุดท้ายของผู้ช่วยเป็นเส้นทางการตอบกลับที่มองเห็นได้ หากบันทึกเซสชันแสดงข้อความผู้ช่วยพร้อม `didSendViaMessagingTool: false` แสดงว่าโมเดลสร้างข้อความสุดท้ายแบบส่วนตัวแทนการเรียกเครื่องมือข้อความ ให้เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้แข็งแรงกว่าสำหรับช่องนั้น ตรวจสอบบันทึกแบบละเอียดของ Gateway เพื่อดูสรุปเพย์โหลดที่ถูกระงับ หรือกำหนด `messages.groupChat.visibleReplies: "automatic"` เพื่อใช้การตอบกลับสุดท้ายที่มองเห็นได้สำหรับทุกคำขอแบบกลุ่ม/ช่อง.

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนที่จะระงับคำตอบอย่างเงียบๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่สอดคล้องนี้.

กฎนี้ใช้กับข้อความสุดท้ายของเอเจนต์ปกติ การผูกบทสนทนาที่ Plugin เป็นเจ้าของใช้การตอบกลับที่ Plugin เจ้าของส่งคืนเป็นคำตอบที่มองเห็นได้สำหรับเทิร์นเธรดที่ถูกผูกและอ้างสิทธิ์; Plugin ไม่จำเป็นต้องเรียก `message(action=send)` สำหรับการตอบกลับของการผูกเหล่านั้น.

**การแก้ไขปัญหา: การ @mention ในกลุ่มทำให้แสดงว่ากำลังพิมพ์แล้วเงียบ (ไม่มีข้อผิดพลาด)**

อาการ: การ @mention ในกลุ่ม/ช่องแสดงตัวบ่งชี้ว่ากำลังพิมพ์ และบันทึก Gateway รายงาน `dispatch complete (queuedFinal=false, replies=0)` แต่ไม่มีข้อความไปถึงห้อง DM ไปยังเอเจนต์เดียวกันตอบกลับตามปกติ.

สาเหตุ: โหมดการตอบกลับที่มองเห็นได้ของกลุ่ม/ช่องถูกแก้เป็น `"message_tool"` ดังนั้น OpenClaw จึงเรียกเทิร์นแต่ระงับข้อความสุดท้ายของผู้ช่วย เว้นแต่เอเจนต์จะเรียก `message(action=send)` ไม่มีสัญญา `NO_REPLY` ในโหมดนี้; การไม่เรียกเครื่องมือข้อความหมายถึงไม่มีการตอบกลับไปยังแหล่งที่มา ไม่มีข้อผิดพลาดเพราะการระงับคือพฤติกรรมที่กำหนดค่าไว้ เทิร์นกลุ่มและช่องปกติมีค่าเริ่มต้นเป็น `"automatic"` ดังนั้นอาการนี้จะปรากฏเฉพาะเมื่อ `messages.groupChat.visibleReplies` (หรือ `messages.visibleReplies` แบบทั่วโลก) ถูกตั้งค่าเป็น `"message_tool"` อย่างชัดเจน `defaultVisibleReplies` ของ harness ไม่มีผลที่นี่ — ตัวแก้ค่ากลุ่ม/ช่องจะละเว้นค่านี้; ค่านี้มีผลเฉพาะแชตโดยตรง/แชตแหล่งที่มา (Codex harness ระงับผลลัพธ์สุดท้ายของแชตโดยตรงด้วยวิธีนั้น).

วิธีแก้: เลือกโมเดลที่เรียกเครื่องมือได้แข็งแรงกว่า ลบการแทนที่ `"message_tool"` ที่ระบุชัดเจนเพื่อถอยกลับไปใช้ค่าเริ่มต้น `"automatic"` หรือกำหนด `messages.groupChat.visibleReplies: "automatic"` เพื่อบังคับการตอบกลับที่มองเห็นได้สำหรับทุกคำขอแบบกลุ่ม/ช่อง Gateway โหลดค่ากำหนด `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์; รีสตาร์ท Gateway เฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดค่ากำหนดใหม่ถูกปิดใช้งานในการปรับใช้.

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงจากเมทาดาทา**: @-mentions แบบเนทีฟของแพลตฟอร์ม ถูกละเว้นในโหมดแชตกับตัวเองของ WhatsApp.
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น.
- การกั้นตามการกล่าวถึงจะบังคับใช้เฉพาะเมื่อการตรวจจับเป็นไปได้ (การกล่าวถึงแบบเนทีฟหรือมีรูปแบบอย่างน้อยหนึ่งรายการ).

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

`messages.groupChat.historyLimit` กำหนดค่าเริ่มต้นทั่วโลก ช่องทางสามารถแทนที่ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี). ตั้งค่าเป็น `0` เพื่อปิดใช้งาน.

`messages.groupChat.unmentionedInbound: "room_event"` ส่งข้อความกลุ่ม/ช่องแบบเปิดตลอดที่ไม่ได้กล่าวถึงเป็นบริบทห้องแบบเงียบบนช่องทางที่รองรับ ข้อความที่มีการกล่าวถึง คำสั่ง และข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้ ดู [เหตุการณ์ห้องแบบแวดล้อม](/th/channels/ambient-room-events) สำหรับตัวอย่าง Discord, Slack, และ Telegram แบบครบถ้วน.

`messages.visibleReplies` คือค่าเริ่มต้นทั่วโลกของเหตุการณ์แหล่งที่มา; `messages.groupChat.visibleReplies` แทนที่ค่านี้สำหรับเหตุการณ์แหล่งที่มาแบบกลุ่ม/ช่อง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` แชตโดยตรง/แหล่งที่มาใช้ค่าเริ่มต้นของรันไทม์หรือ harness ที่เลือก แต่เทิร์นโดยตรงของ WebChat ภายในใช้การส่งผลลัพธ์สุดท้ายอัตโนมัติเพื่อให้พรอมป์ของ Pi/Codex เทียบเท่ากัน ตั้งค่า `messages.visibleReplies: "message_tool"` เพื่อบังคับใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้โดยตั้งใจ รายการอนุญาตของช่องทางและการกั้นตามการกล่าวถึงยังคงตัดสินว่าเหตุการณ์จะถูกประมวลผลหรือไม่.

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

การแก้ค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บทั้งหมด).

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`.

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้น @-mentions แบบเนทีฟ ตอบกลับเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น**ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารในหน้าช่องทาง/Plugin ของตน รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ**เดี่ยว**ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดใช้คำสั่ง native สำหรับ Discord/Telegram และปล่อย Slack ไว้ปิด
- `nativeSkills: "auto"` เปิดใช้คำสั่ง Skills แบบ native สำหรับ Discord/Telegram และปล่อย Slack ไว้ปิด
- แทนที่ต่อช่องทาง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนคำสั่ง native และการล้างข้อมูลระหว่างเริ่มต้น
- แทนที่การลงทะเบียน Skills แบบ native ต่อช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ gateway `chat.send` การเขียน `/config set|unset` แบบถาวรยังต้องมี `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้สำหรับไคลเอนต์ผู้ปฏิบัติการปกติที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าต่อช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่กำหนดเป้าหมายบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และการกระทำเครื่องมือรีสตาร์ท Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ allowlist เจ้าของแบบชัดเจนสำหรับคำสั่งเฉพาะเจ้าของและการกระทำช่องทางที่มีเจ้าของเป็นตัวควบคุม แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮช id เจ้าของใน system prompt ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบต่อ provider เมื่อตั้งค่าแล้ว จะเป็นแหล่งสิทธิ์อนุญาต**เพียงแหล่งเดียว** (allowlist/การจับคู่ของช่องทาง และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
