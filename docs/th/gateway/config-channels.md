---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน การควบคุมการเข้าถึง หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าแยกตามช่องทาง
    - การตรวจสอบนโยบาย DM นโยบายกลุ่ม หรือการควบคุมด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์เฉพาะช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-07-16T19:05:08Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 8d2363844e203e0c44ad9fe5d7a6a994fc654517e0488cffb836ddc9d1cdcb29
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องภายใต้ `channels.*`: การเข้าถึง DM และกลุ่ม การตั้งค่าหลายบัญชี การจำกัดด้วยการกล่าวถึง และคีย์รายช่องสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่นๆ

สำหรับเอเจนต์ เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้น (เว้นแต่ `enabled: false`) Telegram และ iMessage จัดส่งมาในแพ็กเกจ `openclaw` หลัก ช่องทางอย่างเป็นทางการอื่นๆ (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost และอื่นๆ) ติดตั้งเป็น Plugin แยกต่างหากด้วย `openclaw plugins install <spec>`; ดูรายการทั้งหมดและข้อกำหนดการติดตั้งได้ที่ [ช่องทาง](/th/channels)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บรายการอนุญาตซึ่งจับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | ละเว้น DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตซึ่งกำหนดไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การจำกัดด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความจากกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` กำหนดค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อบัญชี** (กำหนดขอบเขตตามช่องทางและรหัสบัญชี)
หากไม่มีบล็อกของผู้ให้บริการเลย (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดกั้นเมื่อเกิดข้อผิดพลาด) พร้อมคำเตือนเมื่อเริ่มต้น
</Note>

### การแทนที่โมเดลตามช่องทาง

ใช้ `channels.modelByChannel` เพื่อกำหนดโมเดลให้กับรหัสช่องทางหรือคู่สนทนาในข้อความโดยตรงที่ระบุ ค่าใช้ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ได้ การแมปช่องทางจะมีผลเฉพาะเมื่อเซสชันยังไม่มีการแทนที่โมเดลที่ใช้งานอยู่ (ตัวอย่างเช่น ค่าที่ตั้งผ่าน `/model`)

สำหรับการสนทนาแบบกลุ่ม/เธรด คีย์คือรหัสกลุ่ม รหัสหัวข้อ หรือชื่อช่องทางที่เฉพาะเจาะจงกับแต่ละช่องทาง สำหรับการสนทนาแบบข้อความโดยตรง (DM) คีย์คือตัวระบุคู่สนทนาที่ได้มาจากข้อมูลระบุตัวตนของผู้ส่งในช่องทาง (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` หรือ `SenderId`) รูปแบบคีย์ที่แน่นอนขึ้นอยู่กับช่องทาง:

| ช่องทาง  | รูปแบบคีย์ DM         | ตัวอย่าง                                      |
| -------- | ------------------- | -------------------------------------------- |
| Discord  | รหัสผู้ใช้ดิบ         | `987654321`                                  |
| Feishu   | `feishu:ou_...`     | `feishu:ou_a8b6cab7e945387de5f253775d9b4d85` |
| Matrix   | รหัสผู้ใช้ Matrix      | `@user:matrix.org`                           |
| Slack    | `user:U...`         | `user:U12345`                                |
| Telegram | รหัสผู้ใช้ดิบ         | `123456789`                                  |
| WhatsApp | หมายเลขโทรศัพท์หรือ JID | `15551234567`                                |

```json5
{
  channels: {
    modelByChannel: {
      discord: {
        "123456789012345678": "anthropic/claude-opus-4-6",
      },
      slack: {
        C1234567890: "openai/gpt-5.6-sol",
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

คีย์เฉพาะ DM จะตรงกันเฉพาะในการสนทนาแบบข้อความโดยตรงเท่านั้น และไม่ส่งผลต่อการกำหนดเส้นทางของกลุ่ม/เธรด

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น รวมบริบทจากข้อความอ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือนรายการอนุญาต แต่คงบริบทจากการอ้างอิง/ตอบกลับโดยตรงไว้) การแทนที่รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat (ค่าเริ่มต้น `false`)
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะที่มีประสิทธิภาพลดลง/เกิดข้อผิดพลาดในเอาต์พุต Heartbeat (ค่าเริ่มต้น `true`)
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้ที่กระชับ (ค่าเริ่มต้น `true`)

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
      maxMs: 30000,
      factor: 1.8,
      jitter: 0.25,
      maxAttempts: 12, // 0 = retry forever
    },
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
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

- `web.whatsapp.keepAliveIntervalMs` (ค่าเริ่มต้น `25000`), `connectTimeoutMs` (ค่าเริ่มต้น `60000`) และ `defaultQueryTimeoutMs` (ค่าเริ่มต้น `60000`) ใช้ปรับแต่งซ็อกเก็ต Baileys
- ค่าเริ่มต้นของ `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12` โดย `maxAttempts: 0` จะลองใหม่ตลอดไปแทนที่จะยุติ
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการเชื่อมโยง ACP แบบถาวรสำหรับ DM และกลุ่มของ WhatsApp ใช้หมายเลขโดยตรงในรูปแบบ E.164 หรือ JID กลุ่ม WhatsApp ใน `match.peer.id` ความหมายของฟิลด์ใช้ร่วมกันตามที่อธิบายใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี มิฉะนั้นจะใช้รหัสบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นสำรองดังกล่าว เมื่อตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ไดเรกทอรีการยืนยันตัวตน Baileys แบบบัญชีเดียวรุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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
      streaming: { mode: "partial" }, // off | partial | block | progress (default: partial)
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
      trustedLocalFileRoots: ["/srv/telegram-bot-api-data"],
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น ไม่ยอมรับลิงก์สัญลักษณ์) โดยมี `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` เป็นเฉพาะรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/ผ่านพร็อกซี ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่เพิ่มโดยไม่ตั้งใจ
- สำหรับเซิร์ฟเวอร์ Bot API ที่โฮสต์เองในโหมด `--local` ค่า `trustedLocalFileRoots` ระบุพาธบนโฮสต์ที่ OpenClaw อ่านได้ เมานต์วอลุ่มข้อมูลของเซิร์ฟเวอร์บนโฮสต์ OpenClaw และกำหนดค่ารากข้อมูลหรือไดเรกทอรีรายโทเค็น พาธคอนเทนเนอร์ภายใต้ `/var/lib/telegram-bot-api` จะถูกแมปไปยังรากเหล่านั้น พาธสัมบูรณ์อื่นๆ ยังคงถูกปฏิเสธ
- `channels.telegram.defaultAccount` ที่เป็นตัวเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (รหัสบัญชี 2 รายการขึ้นไป) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง โดย `openclaw doctor` จะแจ้งเตือนเมื่อไม่มีค่าหรือค่าไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มต้นโดย Telegram (การย้ายรหัสซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการเชื่อมโยง ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันตามที่อธิบายใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ทั้งในแชตโดยตรงและแชตกลุ่ม)
- `network.dnsResultOrder` มีค่าเริ่มต้นเป็น `"ipv4first"` เพื่อหลีกเลี่ยงความล้มเหลวในการดึงข้อมูลผ่าน IPv6 ที่พบได้บ่อย
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
      replyToMode: "off", // ปิด | รายการแรก | ทั้งหมด | เป็นชุด
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
              systemPrompt: "ตอบสั้น ๆ เท่านั้น",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // ปิด | บางส่วน | บล็อก | ความคืบหน้า (ค่าเริ่มต้นของ Discord: ความคืบหน้า)
        chunkMode: "length", // ความยาว | ขึ้นบรรทัดใหม่
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
        target: "dm", // dm | ช่อง | ทั้งคู่
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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็นค่าทดแทนสำหรับบัญชีเริ่มต้น
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก ส่วนการตั้งค่าการลองใหม่/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง ระบบจะปฏิเสธ ID ตัวเลขเปล่า
- Slug ของกิลด์เป็นตัวพิมพ์เล็กโดยแทนที่ช่องว่างด้วย `-` ส่วนคีย์ช่องใช้ชื่อที่แปลงเป็น slug แล้ว (ไม่มี `#`) ควรใช้ ID กิลด์
- ข้อความที่บอตสร้างจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` จะเปิดใช้งานข้อความเหล่านั้น ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ข้อความของบอตเองยังคงถูกกรอง)
- ช่องที่รองรับข้อความขาเข้าซึ่งบอตสร้างสามารถใช้[การป้องกันลูปของบอต](/th/channels/bot-loop-protection)ร่วมกันได้ ตั้งค่า `channels.defaults.botLoopProtection` สำหรับโควตาพื้นฐานของแต่ละคู่ แล้วจึงแทนที่ค่าที่ช่องหรือบัญชีเฉพาะเมื่อส่วนติดต่อใดส่วนติดต่อหนึ่งต้องใช้ขีดจำกัดที่ต่างออกไป
- `channels.discord.guilds.<id>.ignoreOtherMentions` (รวมถึงค่าที่แทนที่ในระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่น แต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จะแมปข้อความ `@handle` ขาออกที่คงที่กับ ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้สามารถกล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างแน่นอน แม้แคชไดเรกทอรีชั่วคราวจะว่างเปล่า ค่าที่แทนที่สำหรับแต่ละบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น `17`) จะแบ่งข้อความที่มีหลายบรรทัด แม้จะมีความยาวน้อยกว่า 2000 อักขระ
- `channels.discord.suppressEmbeds` มีค่าเริ่มต้นเป็น `true` ดังนั้น URL ขาออกจะไม่ขยายเป็นตัวอย่างลิงก์ของ Discord เว้นแต่จะปิดใช้งาน พayload `embeds` ที่ระบุอย่างชัดเจนยังคงส่งได้ตามปกติ การเรียกเครื่องมือรายข้อความสามารถแทนที่ค่าได้ด้วย `suppressEmbeds`
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรดของ Discord:
  - `enabled`: ค่าที่แทนที่ของ Discord สำหรับคุณสมบัติเซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` รวมถึงการส่ง/กำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: ค่าที่แทนที่ของ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรม โดยมีหน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: ค่าที่แทนที่ของ Discord สำหรับอายุสูงสุดแบบตายตัว โดยมีหน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })` และการสร้างเธรดของ ACP (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบทซับเอเจนต์แบบเนทีฟสำหรับการสร้างที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` จะกำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ ID ช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน[เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` กำหนดสีเน้นสำหรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่คอลแบ็กของคอมโพเนนต์ Discord ที่ส่งแล้วจะยังคงลงทะเบียนอยู่ ค่าเริ่มต้น `1800000` (30 นาที) ค่าสูงสุด `86400000` (24 ชั่วโมง) ค่าที่แทนที่สำหรับแต่ละบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ควรใช้ TTL ที่สั้นที่สุดซึ่งเหมาะกับเวิร์กโฟลว์
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord รวมถึงตัวเลือกการเข้าร่วมอัตโนมัติ + LLM + การแทนที่ TTS การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงไว้โดยค่าเริ่มต้น ให้ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้งาน
- `channels.discord.voice.model` สามารถแทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียง Discord ได้
- `channels.discord.voice.daveEncryption` (ค่าเริ่มต้น `true`) และ `channels.discord.voice.decryptionFailureTolerance` (ค่าเริ่มต้น `24`) จะส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice`
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready ครั้งแรกของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ (ค่าเริ่มต้น `30000`)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงซึ่งตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่การส่งสัญญาณเชื่อมต่อใหม่ ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (ค่าเริ่มต้น `15000`)
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะจากเหตุการณ์เริ่มพูดของผู้ใช้รายอื่น เพื่อหลีกเลี่ยงลูปป้อนกลับ OpenClaw จะละเว้นการจับเสียงใหม่ขณะที่กำลังเล่น TTS
- นอกจากนี้ OpenClaw จะพยายามกู้คืนการรับเสียงโดยออกจากเซสชันเสียงแล้วเข้าร่วมใหม่หลังจากถอดรหัสล้มเหลวซ้ำหลายครั้ง
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความตัวอย่างที่แก้ไขเพียงข้อความเดียว ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน ระบบจะไม่อ่านคีย์แบบแบนรุ่นเก่า (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) ที่รันไทม์อีกต่อไป ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายการกำหนดค่าที่บันทึกไว้
- `channels.discord.autoPresence` จะแมปความพร้อมใช้งานของรันไทม์กับสถานะของบอต (ปกติ => ออนไลน์, ประสิทธิภาพลดลง => ไม่ได้ใช้งาน, ทรัพยากรหมด => ห้ามรบกวน) และรองรับการแทนที่ข้อความสถานะซึ่งเป็นตัวเลือกเสริม
- `channels.discord.guilds.<id>.presenceEvents` จะกำหนดเส้นทางการปรากฏตัวของมนุษย์ที่พร้อมใช้งานไปยังช่อง Discord ที่กำหนดค่าไว้หนึ่งช่องในรูปแบบเหตุการณ์ระบบของเอเจนต์ สมาชิกที่มีสิทธิ์ต้องสามารถดู `channelId` ได้ เธรดสาธารณะจะสืบทอดการมองเห็นจากช่องแม่ ส่วนเธรดส่วนตัวยังกำหนดให้ต้องเป็นสมาชิกหรือมีสิทธิ์ Manage Threads ด้วย `users` สามารถจำกัดกลุ่มเป้าหมายนี้เพิ่มเติมได้ ระบบจะตั้งต้นสมาชิกออนไลน์ปัจจุบันจากสแนปช็อต `GUILD_CREATE` ที่สมบูรณ์ กำหนดเส้นทางการเปลี่ยนสถานะจากออฟไลน์เป็นออนไลน์ที่ตรวจพบ และถือว่าสัญญาณออนไลน์ครั้งแรกในภายหลังของสมาชิกที่ไม่เคยพบมาก่อนหมายถึงพร้อมใช้งานใหม่ โดยไม่ยืนยันว่าบุคคลนั้นออนไลน์ขึ้นมาหรือเข้าร่วมหลังจากสแนปช็อต กิลด์ที่มีสมาชิกเกินขีดจำกัดสแนปช็อต 75,000 คนของ Discord ต้องได้รับการอัปเดตออฟไลน์อย่างชัดเจนก่อน ตัวควบคุมการจำกัดอัตรา: `reconnectSuppressSeconds` (ช่วงเงียบหลังจากเซสชัน Gateway ใหม่ ขณะที่สถานะการแสดงตัวของกิลด์กำลังสร้างใหม่ ค่าเริ่มต้น 300 และ `0` ปิดใช้งาน) และ `burstLimit`/`burstWindowSeconds` (ขีดจำกัดอัตราเหตุการณ์ที่เข้าคิวสำเร็จต่อกิลด์ ค่าเริ่มต้น 8 เหตุการณ์ต่อหน้าต่างเลื่อน 60 วินาที) เซสชันที่ดำเนินต่อจะไม่เริ่มช่วงระงับการเชื่อมต่อใหม่ ระยะพักก่อนทักทายผู้ใช้รายเดิมอีกครั้งยังคงเป็นแปดชั่วโมง คุณสมบัตินี้ต้องใช้ `channels.discord.intents.presence=true`, Presence Intent แบบมีสิทธิ์ใน Developer Portal ของ Discord และ Heartbeat ของเอเจนต์ที่เปิดใช้งาน
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติการดำเนินการแบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติการดำเนินการจะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Discord ที่ได้รับอนุญาตให้อนุมัติคำขอดำเนินการ หากละเว้นจะใช้ `commands.ownerAllowFrom` แทน
  - `agentFilter`: รายการอนุญาต ID เอเจนต์ซึ่งเป็นตัวเลือกเสริม ละเว้นเพื่อส่งต่อคำขออนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันซึ่งเป็นตัวเลือกเสริม (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งข้อความแจ้งคำขออนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ `"channel"` ส่งไปยังช่องต้นทาง และ `"both"` ส่งไปทั้งสองแห่ง เมื่อเป้าหมายมี `"channel"` ปุ่มจะใช้ได้เฉพาะผู้อนุมัติที่ระบุได้เท่านั้น
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM คำขออนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือนปฏิกิริยา:** `off` (ไม่มี), `own` (ข้อความของบอต ค่าเริ่มต้น), `all` (ข้อความทั้งหมด), `allowlist` (จาก `guilds.<id>.users` ในข้อความทั้งหมด)

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // URL แอป | หมายเลขโปรเจกต์
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
- ค่าทดแทนจากสภาพแวดล้อม: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (เฉพาะบัญชีเริ่มต้น)
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ตัวตนอีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)

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
        C123: { enabled: true, requireMention: true, allowBots: false },
        "#general": {
          enabled: true,
          requireMention: true,
          allowBots: false,
          users: ["U123"],
          skills: ["docs"],
          systemPrompt: "ตอบสั้น ๆ เท่านั้น",
        },
      },
      historyLimit: 50,
      allowBots: false,
      reactionNotifications: "own",
      reactionAllowlist: ["U123"],
      replyToMode: "off", // ปิด | แรก | ทั้งหมด | แบบชุด
      thread: {
        historyScope: "thread", // เธรด | ช่อง
        inheritParent: false,
        initialHistoryLimit: 20,
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
      streaming: {
        mode: "partial", // ปิด | บางส่วน | บล็อก | ความคืบหน้า
        chunkMode: "length", // ความยาว | ขึ้นบรรทัดใหม่
        nativeTransport: true, // ใช้ API การสตรีมแบบเนทีฟของ Slack เมื่อ mode=partial
      },
      mediaMaxMb: 20,
      execApprovals: {
        enabled: "auto", // true | false | "auto"
        approvers: ["U123"],
        agentFilter: ["default"],
        sessionFilter: ["slack:"],
        target: "dm", // dm | ช่อง | ทั้งสอง
      },
    },
  },
}
```

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับการใช้ค่าสำรองจากสภาพแวดล้อมของบัญชีเริ่มต้น)
- **โหมด HTTP** ต้องใช้ `botToken` ร่วมกับ `signingSecret` (ที่ระดับรากหรือแยกตามบัญชี)
- `enterpriseOrgInstall: true` เลือกให้บัญชีใช้เส้นทางอีเวนต์ทั่วทั้งองค์กรของ Slack Enterprise Grid
  เมื่อเริ่มทำงาน ระบบจะตรวจสอบโทเค็นบอตด้วย `auth.test` และ
  จะล้มเหลวเมื่อโหมดที่กำหนดค่าไม่ตรงกับข้อมูลประจำตัวการติดตั้งของ Slack
  ต้องปิดใช้งาน DM ของ Enterprise หรือใช้ `dmPolicy: "open"` ร่วมกับ
  `allowFrom: ["*"]` ที่มีผลบังคับใช้ นโยบายช่องและผู้ใช้ต้องใช้ ID ของ Slack ที่คงที่
  ชื่อที่เปลี่ยนแปลงได้และคำนำหน้าช่องที่ไม่รองรับจะทำให้การเริ่มทำงานล้มเหลว V1 รองรับเฉพาะ
  Socket Mode โดยตรงหรืออีเวนต์ HTTP `message` และ `app_mention` ที่ตอบกลับทันที
  รีเลย์ คำสั่ง การโต้ตอบ App Home ตัวรับฟังอีเวนต์รีแอ็กชัน
  หมุด เครื่องมือการดำเนินการ การอนุมัติแบบเนทีฟ การผูก การส่งแบบหน่วงเวลา และ
  การส่งเชิงรุกไม่พร้อมใช้งาน การรับทราบที่ผู้รับฟังเป็นเจ้าของ การแสดงสถานะกำลังพิมพ์ และ
  รีแอ็กชันสถานะยังคงพร้อมใช้งานผ่าน `reactions:write`; การแจ้งเตือนรีแอ็กชันขาเข้า
  และเครื่องมือการดำเนินการรีแอ็กชันไม่พร้อมใช้งาน ดู
  [การติดตั้งทั่วทั้งองค์กรของ Enterprise Grid](/th/channels/slack#enterprise-grid-org-wide-installs)
  สำหรับไฟล์ manifest ที่ใช้สิทธิ์น้อยที่สุด เวิร์กโฟลว์การตั้งค่า และข้อจำกัดทั้งหมด
- `socketMode` ส่งต่อการปรับแต่งทรานสปอร์ต Socket Mode ของ Slack SDK ไปยัง API ตัวรับ Bolt แบบสาธารณะ ใช้เฉพาะเมื่อตรวจสอบการหมดเวลาของ ping/pong หรือพฤติกรรม websocket ที่ค้างเท่านั้น `clientPingTimeout` มีค่าเริ่มต้นเป็น `15000`; ระบบจะส่ง `serverPingTimeout` และ `pingPongLoggingEnabled` เฉพาะเมื่อมีการกำหนดค่า
- `botToken`, `appToken`, `signingSecret` และ `userToken` ยอมรับ
  สตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- สแนปช็อตบัญชี Slack แสดงฟิลด์แหล่งที่มา/สถานะแยกตามข้อมูลประจำตัว เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus` ความหมายของ `configured_unavailable` คือบัญชี
  ได้รับการกำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  แก้ไขค่าข้อมูลลับได้
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มต้นจาก Slack
- `channels.slack.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับ ID บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีม Slack มาตรฐาน (ค่าเริ่มต้น `"partial"`) `channels.slack.streaming.nativeTransport` ควบคุมทรานสปอร์ตการสตรีมแบบเนทีฟของ Slack (ค่าเริ่มต้น `true`) รันไทม์จะไม่อ่านค่าเดิม `streamMode`, ค่าบูลีน `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` และ `nativeStreaming` อีกต่อไป ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายการกำหนดค่าที่จัดเก็บไว้ไปยัง `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`
- `unfurlLinks` และ `unfurlMedia` ส่งต่อค่าบูลีนสำหรับการคลี่ลิงก์และสื่อ `chat.postMessage` ของ Slack เพื่อใช้กับการตอบกลับของบอต `unfurlLinks` มีค่าเริ่มต้นเป็น `false` เพื่อไม่ให้ลิงก์ขาออกของบอตขยายในบรรทัด เว้นแต่เปิดใช้งาน ส่วน `unfurlMedia` จะถูกละเว้นหากไม่ได้กำหนดค่า ตั้งค่าใดค่าหนึ่งที่ `channels.slack.accounts.<accountId>` เพื่อแทนที่ค่าระดับบนสุดสำหรับบัญชีหนึ่ง
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` แยกตามเธรด (ค่าเริ่มต้น) หรือแชร์ทั่วทั้งช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ของช่องแม่ไปยังเธรดใหม่ `thread.initialHistoryLimit` (ค่าเริ่มต้น `20`) จำกัดจำนวนข้อความเดิมในเธรดที่จะดึงเมื่อเริ่มเซสชันเธรดใหม่ ส่วน `0` ปิดใช้งานการดึงประวัติเธรด

- การสตรีมแบบเนทีฟของ Slack และสถานะเธรดแบบผู้ช่วยของ Slack "is typing..." ต้องมีเป้าหมายเป็นเธรดตอบกลับ DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น ดังนั้นจึงยังสามารถสตรีมผ่านตัวอย่างร่างของ Slack ที่โพสต์แล้วแก้ไข แทนการแสดงตัวอย่างสตรีม/สถานะแบบเนทีฟในรูปแบบเธรด
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวไปยังข้อความ Slack ขาเข้าระหว่างที่กำลังประมวลผลคำตอบ แล้วนำออกเมื่อเสร็จสิ้น ใช้ shortcode อีโมจิของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งไคลเอนต์อนุมัติแบบเนทีฟของ Slack และการให้สิทธิ์ผู้อนุมัติการดำเนินการ ใช้สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`) การอนุมัติของ Plugin สามารถใช้เส้นทางไคลเอนต์แบบเนทีฟนี้สำหรับคำขอที่มาจาก Slack เมื่อสามารถระบุผู้อนุมัติ Plugin ของ Slack ได้ และยังสามารถเปิดใช้งานการส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ผ่าน `approvals.plugin` สำหรับเซสชันที่มาจาก Slack หรือเป้าหมาย Slack ได้ด้วย การอนุมัติของ Plugin ใช้ผู้อนุมัติ Plugin ของ Slack จาก `allowFrom` และการกำหนดเส้นทางเริ่มต้น ไม่ใช่ผู้อนุมัติการดำเนินการ

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ                         |
| ----------------- | ----------- | -------------------------------- |
| reactions         | เปิดใช้งาน  | เพิ่มรีแอ็กชัน + แสดงรายการรีแอ็กชัน |
| messages          | เปิดใช้งาน  | อ่าน/ส่ง/แก้ไข/ลบ                |
| pins              | เปิดใช้งาน  | ปักหมุด/เลิกปักหมุด/แสดงรายการ    |
| memberInfo        | เปิดใช้งาน  | ข้อมูลสมาชิก                      |
| emojiList         | เปิดใช้งาน  | รายการอีโมจิกำหนดเอง              |

### Mattermost

Mattermost ติดตั้งเป็น Plugin แยกต่างหาก เช่นเดียวกับ Discord, Slack และ WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

ตรวจสอบ dist-tags ปัจจุบันที่ [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) ก่อนตรึงเวอร์ชัน

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
        native: true, // เลือกเปิดใช้งาน
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL ที่ระบุอย่างชัดเจนซึ่งเป็นตัวเลือกเสริมสำหรับการติดตั้งแบบ reverse-proxy/สาธารณะ
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

โหมดแชต: `oncall` (ตอบเมื่อมีการ @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้งานคำสั่งแบบเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้องแก้ไขไปยังปลายทาง Gateway ของ OpenClaw และเซิร์ฟเวอร์ Mattermost ต้องเข้าถึงได้
- คอลแบ็กคำสั่ง slash แบบเนทีฟได้รับการยืนยันตัวตนด้วยโทเค็นแยกตามคำสั่งที่
  Mattermost ส่งคืนระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดเปิดใช้งาน OpenClaw จะปฏิเสธคอลแบ็กด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์คอลแบ็กแบบส่วนตัว/tailnet/ภายใน Mattermost อาจกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` ต้องรวมโฮสต์/โดเมนของคอลแบ็ก
  ให้ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่การบังคับ mention แยกตามช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับ ID บัญชีที่กำหนดค่าไว้

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การผูกบัญชีซึ่งเป็นตัวเลือกเสริม
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // ปิด | ของตนเอง | ทั้งหมด | รายการที่อนุญาต
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ตรึงการเริ่มต้นช่องกับข้อมูลประจำตัวบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก Signal
- `channels.signal.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับ ID บัญชีที่กำหนดค่าไว้

### iMessage

OpenClaw เรียกใช้ `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ดีมอนหรือพอร์ต นี่คือเส้นทางที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่ เมื่อโฮสต์สามารถให้สิทธิ์เข้าถึงฐานข้อมูล Messages และสิทธิ์ Automation ได้

การรองรับ BlueBubbles ถูกนำออกแล้ว `channels.bluebubbles` ไม่ใช่พื้นผิวการกำหนดค่ารันไทม์ที่รองรับใน OpenClaw ปัจจุบัน ย้ายการกำหนดค่าเก่าไปยัง `channels.imessage`; ดูฉบับย่อที่ [การนำ BlueBubbles ออกและเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage) และตารางการแปลงฉบับเต็มที่ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles)

หาก Gateway ไม่ได้ทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages ให้คง `channels.imessage.enabled=true` ไว้และตั้งค่า `channels.imessage.cliPath` เป็น wrapper SSH ที่เรียกใช้ `imsg "$@"` บน Mac เครื่องนั้น พาธ `imsg` ภายในเครื่องตามค่าเริ่มต้นรองรับเฉพาะ macOS

ก่อนพึ่งพา wrapper SSH สำหรับการส่งในระบบที่ใช้งานจริง ให้ตรวจสอบ `imsg send` ขาออกผ่าน wrapper นั้นโดยตรง สถานะ TCC บางแบบของ macOS จะกำหนดสิทธิ์ Messages Automation ให้กับ `/usr/libexec/sshd-keygen-wrapper` ซึ่งอาจทำให้การอ่านและการตรวจสอบทำงานได้ แต่การส่งล้มเหลวด้วย AppleEvents `-1743`; ดูส่วนการแก้ไขปัญหา wrapper SSH ที่ [iMessage](/th/channels/imessage)

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

- ตัวเลือก `channels.imessage.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ต้องมีสิทธิ์เข้าถึงดิสก์แบบเต็มสำหรับฐานข้อมูล Messages
- ควรใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยังตัวหุ้ม SSH ได้ ให้ตั้งค่า `remoteHost` (`host` หรือ `user@host`) เพื่อดึงไฟล์แนบด้วย SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบคีย์โฮสต์อย่างเคร่งครัด ดังนั้นโปรดตรวจสอบว่าคีย์ของโฮสต์รีเลย์มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก iMessage
- `channels.imessage.sendTransport`: ทรานสปอร์ตการส่ง RPC ของ `imsg` ที่ต้องการสำหรับการตอบกลับขาออกตามปกติ `auto` (ค่าเริ่มต้น) ใช้บริดจ์ IMCore สำหรับแชตที่มีอยู่เมื่อบริดจ์กำลังทำงาน แล้วจึงถอยกลับไปใช้ AppleScript; `bridge` กำหนดให้ส่งผ่าน API ส่วนตัว; `applescript` บังคับใช้เส้นทางระบบอัตโนมัติ Messages แบบสาธารณะ
- `channels.imessage.actions.*`: เปิดใช้การดำเนินการผ่าน API ส่วนตัวที่ยังถูกควบคุมโดย `imsg status` / `openclaw channels status --probe`
- `channels.imessage.includeAttachments` ปิดอยู่โดยค่าเริ่มต้น ให้ตั้งเป็น `true` ก่อนคาดหวังให้สื่อขาเข้าปรากฏในการทำงานของเอเจนต์
- การกู้คืนขาเข้าหลังจากรีสตาร์ตบริดจ์/Gateway เป็นไปโดยอัตโนมัติ (การขจัดรายการซ้ำด้วย GUID พร้อมขอบเขตอายุของงานค้างที่ล้าสมัย) การกำหนดค่า `channels.imessage.catchup.enabled: true` ที่มีอยู่ยังคงได้รับการรองรับในฐานะโปรไฟล์ความเข้ากันได้ที่เลิกแนะนำแล้ว; `catchup` ปิดอยู่โดยค่าเริ่มต้น
- `channels.imessage.groups`: รีจิสทรีกลุ่มและการตั้งค่ารายกลุ่ม เมื่อใช้ `groupPolicy: "allowlist"` ให้กำหนดค่าคีย์ `chat_id` แบบระบุชัดเจนหรือรายการไวลด์การ์ด `"*"` เพื่อให้ข้อความกลุ่มผ่านเกตรีจิสทรีได้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิลที่ปรับเป็นรูปแบบมาตรฐานหรือเป้าหมายแชตที่ระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่างตัวหุ้ม SSH สำหรับ iMessage">

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

- การยืนยันตัวตนด้วยโทเค็นใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุ บัญชีที่มีชื่อสามารถแทนที่ค่านี้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาตโฮมเซิร์ฟเวอร์ส่วนตัว/ภายใน `proxy` และการเลือกเข้าร่วมเครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `"off"` ดังนั้นห้องที่ได้รับคำเชิญและคำเชิญใหม่ในรูปแบบ DM จะถูกละเว้นจนกว่าจะตั้งค่า `autoJoin: "allowlist"` ด้วย `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งการอนุมัติการดำเนินการแบบเนทีฟของ Matrix และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติการดำเนินการจะทำงานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: รหัสผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอดำเนินการ
  - `agentFilter`: รายการอนุญาตรหัสเอเจนต์แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งข้อความแจ้งขออนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่ค่ารายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม DM ของ Matrix เป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตามเพียร์ที่กำหนดเส้นทาง ขณะที่ `per-room` แยกแต่ละห้อง DM ออกจากกัน
- โพรบสถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้นโยบายพร็อกซีเดียวกับทราฟฟิกรันไทม์
- การกำหนดค่า Matrix ฉบับเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่า มีเอกสารอยู่ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับโดย Plugin และกำหนดค่าภายใต้ `channels.msteams`

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, team/channel policies:
      // ดู /channels/msteams
    },
  },
}
```

- พาธคีย์หลักที่กล่าวถึงในที่นี้: `channels.msteams`, `channels.msteams.configWrites`
- การกำหนดค่า Teams ฉบับเต็ม (ข้อมูลประจำตัว, Webhook, นโยบาย DM/กลุ่ม, การแทนที่ค่ารายทีม/รายช่อง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC รองรับโดย Plugin และกำหนดค่าภายใต้ `channels.irc`

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

- พาธคีย์หลักที่กล่าวถึงในที่นี้: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- ตัวเลือก `channels.irc.defaultAccount` จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่อง IRC ฉบับเต็ม (โฮสต์/พอร์ต/TLS/ช่อง/รายการอนุญาต/เกตการกล่าวถึง) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อละ `accountId` ไว้ (CLI + การกำหนดเส้นทาง)
- โทเค็นจากสภาพแวดล้อมใช้กับบัญชี **เริ่มต้น** เท่านั้น
- การตั้งค่าพื้นฐานของช่องใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่เป็นรายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่อง) ขณะที่ยังใช้การกำหนดค่าช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะย้ายค่าบัญชีเดียวระดับบนสุดที่มีขอบเขตบัญชีเข้าสู่แมปบัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังคงทำงานได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านั้นไปยัง `channels.<channel>.accounts.default`; ส่วน Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันและมีอยู่แล้วไว้แทน
- การผูกเฉพาะช่องที่มีอยู่ (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น การผูกที่มีขอบเขตบัญชียังคงเป็นตัวเลือก
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบผสมด้วยการย้ายค่าบัญชีเดียวระดับบนสุดที่มีขอบเขตบัญชีเข้าสู่บัญชีที่ได้รับการเลื่อนระดับซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; ส่วน Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันและมีอยู่แล้วไว้แทน

### ช่อง Plugin อื่นๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารอยู่ในหน้าช่องเฉพาะของแต่ละช่อง (ตัวอย่างเช่น Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch และ Zalo)
ดูดัชนีช่องทั้งหมด: [ช่อง](/th/channels)

### เกตการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** (การกล่าวถึงในข้อมูลเมตาหรือรูปแบบนิพจน์ทั่วไปที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก คำขอโดยตรงแบบกลุ่ม ช่อง และ WebChat ภายในตามปกติมีค่าเริ่มต้นให้ส่งผลลัพธ์สุดท้ายโดยอัตโนมัติ: ข้อความสุดท้ายของผู้ช่วยจะโพสต์ผ่านเส้นทางการตอบกลับที่มองเห็นได้แบบเดิม เลือกใช้ `messages.visibleReplies: "message_tool"` หรือ `messages.groupChat.visibleReplies: "message_tool"` เมื่อควรโพสต์ผลลัพธ์ที่มองเห็นได้หลังจากเอเจนต์เรียก `message(action=send)` เท่านั้น หากโมเดลส่งคืนคำตอบสุดท้ายที่มีสาระโดยไม่เรียกเครื่องมือข้อความในโหมดเฉพาะเครื่องมือที่เลือกใช้ ข้อความสุดท้ายนั้นจะยังคงเป็นส่วนตัว บันทึกแบบละเอียดของ Gateway จะบันทึกข้อมูลเมตาของเพย์โหลดที่ถูกระงับ และ OpenClaw จะเข้าคิวการลองกู้คืนอีกหนึ่งครั้งเพื่อขอให้โมเดลส่งคำตอบเดิมผ่าน `message(action=send)`

การตอบกลับที่มองเห็นได้แบบเฉพาะเครื่องมือต้องใช้โมเดล/รันไทม์ที่เรียกเครื่องมือได้อย่างน่าเชื่อถือ และแนะนำสำหรับห้องส่วนกลางที่ใช้ร่วมกันบนโมเดลรุ่นล่าสุด เช่น GPT-5.6 Sol โมเดลที่อ่อนกว่าบางรุ่นสามารถตอบเป็นข้อความสุดท้ายได้ แต่ไม่เข้าใจว่าต้องส่งผลลัพธ์ที่มองเห็นได้จากต้นทางด้วย `message(action=send)` โดยค่าเริ่มต้น OpenClaw จะกู้คืนกรณีทั่วไปที่ข้อความสุดท้ายค้างอยู่เฉพาะเมื่อข้อความสุดท้ายนั้นมีสาระ เทิร์นต้นทางไม่ใช่เหตุการณ์ในห้อง นโยบายการส่งไม่ได้ปฏิเสธการส่ง และยังไม่มีการส่งคำตอบไปยังต้นทาง การกู้คืนถูกจำกัดไว้ที่การลองซ้ำหนึ่งครั้ง โดยระงับการบันทึกถาวรสำหรับพรอมต์ลองซ้ำสังเคราะห์ และแยกการลองซ้ำนั้นออกจากการจัดชุดแบบรวบรวมเพื่อไม่ให้รวมกับพรอมต์อื่นที่เข้าคิวและไม่เกี่ยวข้องกัน หากการลองซ้ำยังค้างอยู่หรือไม่สามารถเข้าคิวได้ OpenClaw จะส่งเฉพาะข้อความวินิจฉัยที่ผ่านการล้างข้อมูลแล้ว เช่น "ฉันสร้างคำตอบแล้วแต่ไม่สามารถส่งไปยังแชตนี้ได้ โปรดลองอีกครั้ง" ข้อความสุดท้ายส่วนตัวต้นฉบับจะไม่ถูกทำเครื่องหมายให้ส่งไปยังต้นทางโดยอัตโนมัติ สำหรับโมเดลที่ปล่อยให้คำตอบค้างซ้ำๆ ให้ใช้ `"automatic"` เพื่อให้เทิร์นสุดท้ายของผู้ช่วยเป็นเส้นทางการตอบกลับที่มองเห็นได้ เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่า ตรวจสอบบันทึกแบบละเอียดของ Gateway เพื่อดูสรุปเพย์โหลดที่ถูกระงับ หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` ให้ใช้การตอบกลับสุดท้ายที่มองเห็นได้สำหรับทุกคำขอแบบกลุ่ม/ช่อง

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้โดยอัตโนมัติ แทนที่จะระงับการตอบกลับโดยไม่แจ้งให้ทราบ `openclaw doctor` จะแจ้งเตือนเกี่ยวกับความไม่สอดคล้องนี้

กฎนี้ใช้กับข้อความสุดท้ายตามปกติของเอเจนต์ การผูกการสนทนาที่ Plugin เป็นเจ้าของจะใช้คำตอบที่ Plugin เจ้าของส่งคืนเป็นการตอบกลับที่มองเห็นได้สำหรับเทิร์นของเธรดที่ผูกไว้ซึ่งถูกอ้างสิทธิ์ Plugin ไม่จำเป็นต้องเรียก `message(action=send)` สำหรับการตอบกลับจากการผูกเหล่านั้น

**การแก้ไขปัญหา: การกล่าวถึง @ ในกลุ่มทำให้แสดงสถานะกำลังพิมพ์แล้วเงียบ (ไม่มีข้อผิดพลาด)**

อาการ: การกล่าวถึง @ ในกลุ่ม/ช่องแสดงตัวบ่งชี้ว่ากำลังพิมพ์ และบันทึกของ Gateway รายงาน `dispatch complete (queuedFinal=false, replies=0)` แต่ไม่มีข้อความส่งถึงห้อง DM ที่ส่งถึงเอเจนต์เดียวกันตอบกลับได้ตามปกติ

สาเหตุ: โหมดการตอบกลับที่มองเห็นได้ของกลุ่ม/ช่องทางถูกกำหนดเป็น `"message_tool"` ดังนั้น OpenClaw จึงดำเนินการรอบสนทนา แต่ระงับข้อความสุดท้ายจากผู้ช่วย เว้นแต่เอเจนต์จะเรียก `message(action=send)` โหมดนี้ไม่มีสัญญา `NO_REPLY`; หากไม่มีการเรียกเครื่องมือส่งข้อความ ข้อความสุดท้ายเดิมจะเป็นแบบส่วนตัว สำหรับรอบสนทนาต้นทางที่มีเนื้อหาสำคัญ ขณะนี้ OpenClaw จะพยายามกู้คืนแบบมีการป้องกันอีกหนึ่งครั้ง; หมายเหตุสั้นๆ การระบุให้เงียบอย่างชัดเจน เหตุการณ์ในห้อง รอบสนทนาที่ถูกนโยบายการส่งปฏิเสธ และรอบสนทนาที่ส่งสำเร็จแล้วจะไม่ถูกลองใหม่ รอบสนทนาปกติของกลุ่มและช่องทางมีค่าเริ่มต้นเป็น `"automatic"` ดังนั้นอาการนี้จะปรากฏเฉพาะเมื่อกำหนด `messages.groupChat.visibleReplies` (หรือ `messages.visibleReplies` ส่วนกลาง) เป็น `"message_tool"` อย่างชัดเจนเท่านั้น `defaultVisibleReplies` ของชุดทดสอบไม่ใช้กับกรณีนี้ — ตัวแก้ไขค่าของกลุ่ม/ช่องทางจะเพิกเฉยต่อค่านี้; ค่านี้มีผลเฉพาะกับแชตโดยตรง/แชตต้นทาง (ชุดทดสอบ Codex ใช้วิธีนี้เพื่อระงับข้อความสุดท้ายของแชตโดยตรง)

วิธีแก้: เลือกโมเดลที่เรียกใช้เครื่องมือได้ดีกว่า นำการเขียนทับ `"message_tool"` ที่กำหนดไว้อย่างชัดเจนออกเพื่อย้อนกลับไปใช้ค่าเริ่มต้น `"automatic"` หรือกำหนด `messages.groupChat.visibleReplies: "automatic"` เพื่อบังคับให้ทุกคำขอของกลุ่ม/ช่องทางมีการตอบกลับที่มองเห็นได้ ข้อความสุดท้ายที่มีเนื้อหาสำคัญแต่ค้างอยู่ไม่ควรจบลงด้วยความสำเร็จแบบเงียบอีกต่อไป; ระบบควรกู้คืนผ่านการลอง `message(action=send)` อีกหนึ่งครั้ง หรือแสดงข้อมูลวินิจฉัยความล้มเหลวในการส่งที่ผ่านการล้างข้อมูลแล้ว Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบทันทีหลังจากบันทึกไฟล์; ให้รีสตาร์ต Gateway เฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้เท่านั้น

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงจากข้อมูลเมตา**: @-mention แบบเนทีฟของแพลตฟอร์ม ระบบจะเพิกเฉยในโหมดแชตกับตนเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบนิพจน์ทั่วไปที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` ระบบจะเพิกเฉยต่อรูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัย
- การควบคุมด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (การกล่าวถึงแบบเนทีฟหรือมีอย่างน้อยหนึ่งรูปแบบ)

```json5
{
  messages: {
    visibleReplies: "automatic", // บังคับใช้การตอบกลับสุดท้ายแบบอัตโนมัติดั้งเดิมสำหรับแชตโดยตรง/แชตต้นทาง
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // การสนทนาในห้องที่ไม่ได้กล่าวถึงและเปิดตลอดเวลาจะกลายเป็นบริบทแบบเงียบ
      visibleReplies: "message_tool", // เลือกใช้; ต้องมี message(action=send) สำหรับการตอบกลับในห้องที่มองเห็นได้
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` กำหนดค่าเริ่มต้นส่วนกลาง ช่องทางสามารถเขียนทับด้วย `channels.<channel>.historyLimit` (หรือกำหนดแยกตามบัญชี) กำหนด `0` เพื่อปิดใช้งาน

`messages.groupChat.unmentionedInbound: "room_event"` ส่งข้อความกลุ่ม/ช่องทางแบบเปิดตลอดเวลาที่ไม่ได้กล่าวถึงเข้ามาเป็นบริบทห้องแบบเงียบในช่องทางที่รองรับ ข้อความที่มีการกล่าวถึง คำสั่ง และข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้ ดูตัวอย่างฉบับสมบูรณ์สำหรับ Discord, Slack และ Telegram ได้ที่ [เหตุการณ์แวดล้อมในห้อง](/th/channels/ambient-room-events)

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางสำหรับเหตุการณ์ต้นทาง; `messages.groupChat.visibleReplies` จะเขียนทับค่านี้สำหรับเหตุการณ์ต้นทางของกลุ่ม/ช่องทาง เมื่อไม่ได้กำหนด `messages.visibleReplies` แชตโดยตรง/แชตต้นทางจะใช้ค่าเริ่มต้นของรันไทม์หรือชุดทดสอบที่เลือก แต่รอบสนทนาโดยตรงภายใน WebChat จะใช้การส่งข้อความสุดท้ายแบบอัตโนมัติเพื่อให้พรอมต์ของ Pi/Codex สอดคล้องกัน กำหนด `messages.visibleReplies: "message_tool"` เมื่อต้องการบังคับให้ใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้ รายการอนุญาตของช่องทางและการควบคุมด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่าจะประมวลผลเหตุการณ์หรือไม่

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

ลำดับการกำหนดค่า: การเขียนทับราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

ตัวแก้ไขค่านี้อ่าน `channels.<provider>.dmHistoryLimit` และ `channels.<provider>.dms.<id>.historyLimit` สำหรับทุกช่องทางที่คีย์เซสชันเป็นไปตามรูปแบบมาตรฐาน `provider:direct:<id>` (หรือรูปแบบเดิม `provider:dm:<id>`) ดังนั้นจึงใช้ได้กับทั้งช่องทางที่รวมมาให้และช่องทางแบบ Plugin ไม่ได้จำกัดอยู่เพียงรายการตายตัว

#### โหมดแชตกับตนเอง

เพิ่มหมายเลขของตนเองใน `allowFrom` เพื่อเปิดใช้โหมดแชตกับตนเอง (เพิกเฉยต่อ @-mention แบบเนทีฟ และตอบสนองเฉพาะรูปแบบข้อความ):

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
    native: "auto", // ลงทะเบียนคำสั่งแบบเนทีฟเมื่อรองรับ
    nativeSkills: "auto", // ลงทะเบียนคำสั่ง Skills แบบเนทีฟเมื่อรองรับ
    text: true, // แยกวิเคราะห์ /commands ในข้อความแชต
    bash: false, // อนุญาต ! (นามแฝง: /bash)
    bashForegroundMs: 2000,
    config: false, // อนุญาต /config
    mcp: false, // อนุญาต /mcp
    plugins: false, // อนุญาต /plugins
    debug: false, // อนุญาต /debug
    restart: true, // อนุญาต /restart + คำขอรีสตาร์ต SIGUSR1 จากภายนอก
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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัวและคำสั่งที่รวมมาให้ในปัจจุบัน โปรดดู [คำสั่งแบบสแลช](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งฉบับสมบูรณ์ คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าของช่องทาง/Plugin นั้นๆ รวมถึง [คำสั่งแบบสแลช](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความ **แบบแยกเดี่ยว** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดใช้คำสั่งแบบเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- `nativeSkills: "auto"` เปิดใช้คำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- เขียนทับแยกตามช่องทางด้วย: `channels.discord.commands.native` (ค่าบูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งแบบเนทีฟระหว่างการเริ่มต้น
- เขียนทับการลงทะเบียน Skills แบบเนทีฟแยกตามช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรต้องมี `operator.admin` ด้วย; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ผู้ปฏิบัติงานทั่วไปที่มีขอบเขตสิทธิ์เขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา การติดตั้ง และการควบคุมเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการแก้ไขการกำหนดค่าแยกตามช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` ยังควบคุมการเขียนที่มีบัญชีนั้นเป็นเป้าหมายด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และคำขอรีสตาร์ต `SIGUSR1` จากภายนอก ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่งที่ใช้ได้เฉพาะเจ้าของและการดำเนินการของช่องทางที่ควบคุมโดยเจ้าของ ซึ่งแยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมต์ระบบ กำหนด `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` กำหนดแยกตามผู้ให้บริการ เมื่อกำหนดค่าแล้ว ค่านี้จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องทางและ `useAccessGroups` จะถูกเพิกเฉย)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้กำหนด `allowFrom`
- แผนผังเอกสารคำสั่ง:
  - แค็ตตาล็อกในตัวและที่รวมมาให้: [คำสั่งแบบสแลช](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - Dreaming ของหน่วยความจำ: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
