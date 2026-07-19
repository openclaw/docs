---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน การควบคุมการเข้าถึง หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าสำหรับแต่ละช่องทาง
    - การตรวจสอบนโยบาย DM นโยบายกลุ่ม หรือการจำกัดด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์เฉพาะช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-07-19T07:16:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: c140baf821ecf9ebabebb365d3105d69fad742cd0cce1b6a8b9d8d46bb5e7642
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าสำหรับแต่ละช่องภายใต้ `channels.*`: การเข้าถึง DM และกลุ่ม การตั้งค่าหลายบัญชี การควบคุมด้วยการกล่าวถึง และคีย์เฉพาะช่องสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องอื่นๆ

สำหรับเอเจนต์ เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ โปรดดู[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่อง

แต่ละช่องจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องนั้น (เว้นแต่ `enabled: false`) Telegram และ iMessage รวมอยู่ภายในแพ็กเกจ `openclaw` หลัก ช่องทางการอย่างเป็นทางการอื่นๆ (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost และอื่นๆ) ติดตั้งเป็น Plugin แยกด้วย `openclaw plugins install <spec>`; โปรดดูรายการทั้งหมดและข้อกำหนดการติดตั้งที่[ช่อง](/th/channels)

### การเข้าถึง DM และกลุ่ม

ทุกช่องรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือคลังรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (การควบคุมด้วยการกล่าวถึงยังคงมีผล) |
| `disabled`            | บล็อกข้อความจากกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` กำหนดค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ที่รอดำเนินการจำกัดไว้ที่ **3 รายการต่อบัญชี** (กำหนดขอบเขตตามช่องและรหัสบัญชี)
หากบล็อกของผู้ให้บริการขาดหายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดกั้นเมื่อเกิดความล้มเหลว) พร้อมคำเตือนเมื่อเริ่มต้นระบบ
</Note>

### การแทนที่โมเดลสำหรับแต่ละช่อง

ใช้ `channels.modelByChannel` เพื่อกำหนดโมเดลให้กับรหัสช่องหรือคู่สนทนาในข้อความโดยตรงที่ระบุ ค่าใช้ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ได้ การแมปช่องจะมีผลเฉพาะเมื่อเซสชันยังไม่มีการแทนที่โมเดลที่ใช้งานอยู่ (ตัวอย่างเช่น การตั้งค่าผ่าน `/model`)

สำหรับการสนทนาแบบกลุ่ม/เธรด คีย์คือรหัสกลุ่ม รหัสหัวข้อ หรือชื่อช่องที่เฉพาะเจาะจงกับแต่ละช่อง สำหรับการสนทนาแบบข้อความโดยตรง (DM) คีย์คือตัวระบุคู่สนทนาที่ได้มาจากข้อมูลประจำตัวผู้ส่งของช่อง (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` หรือ `SenderId`) รูปแบบคีย์ที่แน่นอนขึ้นอยู่กับช่อง:

| ช่อง  | รูปแบบคีย์ DM         | ตัวอย่าง                                      |
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

คีย์เฉพาะ DM จะตรงกันเฉพาะในการสนทนาแบบข้อความโดยตรงเท่านั้น และไม่มีผลต่อการกำหนดเส้นทางของกลุ่ม/เธรด

### ค่าเริ่มต้นของช่องและ Heartbeat

ใช้ `channels.defaults` สำหรับนโยบายกลุ่ม การกล่าวถึงโดยนัย และลักษณะการทำงานของ Heartbeat ที่ใช้ร่วมกันระหว่างผู้ให้บริการ:

```json5
{
  channels: {
    defaults: {
      groupPolicy: "allowlist", // open | allowlist | disabled
      contextVisibility: "all", // all | allowlist | allowlist_quote
      implicitMentions: {
        replyToBot: true,
        quotedBot: true,
        threadParticipation: true,
      },
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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่อง ค่า: `all` (ค่าเริ่มต้น รวมบริบทจากข้อความอ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือนรายการอนุญาต แต่เก็บบริบทการอ้างอิง/ตอบกลับที่ระบุชัดเจนไว้) แทนที่สำหรับแต่ละช่อง: `channels.<channel>.contextVisibility`
- `channels.defaults.implicitMentions`: ควบคุมว่าข้อเท็จจริงขาเข้าที่รองรับรายการใดนับเป็นการกล่าวถึง `replyToBot`, `quotedBot` และ `threadParticipation` ต่างมีค่าเริ่มต้นเป็น `true` เพื่อคงลักษณะการทำงานปัจจุบันไว้ แทนที่สำหรับแต่ละช่องด้วย `channels.<channel>.implicitMentions` หรือสำหรับแต่ละบัญชีด้วย `channels.<channel>.accounts.<id>.implicitMentions`; แต่ละแฟล็กจะพิจารณาค่าจากบัญชี -> ช่อง -> ค่าเริ่มต้นอย่างเป็นอิสระ ชื่อเหล่านี้มีความหมายเชิงบวก: ตั้งค่าแฟล็กเป็น `false` เพื่อหยุดไม่ให้ข้อเท็จจริงนั้นข้ามการควบคุมด้วยการกล่าวถึง การกล่าวถึงโดยตรงแบบเนทีฟได้รับอนุญาตเสมอ และแฟล็กจะไม่มีผลเมื่อช่องไม่ได้สร้างข้อเท็จจริงนั้น โปรดดูเมทริกซ์ตัวสร้างปัจจุบันที่[การควบคุมด้วยการกล่าวถึง](/th/channels/groups#mention-gating-default) การตั้งค่าเหล่านี้ไม่เปลี่ยนโหมดการตอบกลับ/เธรดขาออกหรือการจัดการคำสั่งที่ได้รับอนุญาต
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องที่ทำงานเป็นปกติไว้ในเอาต์พุต Heartbeat (ค่าเริ่มต้น `false`)
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะที่ประสิทธิภาพลดลง/ข้อผิดพลาดไว้ในเอาต์พุต Heartbeat (ค่าเริ่มต้น `true`)
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด (ค่าเริ่มต้น `true`)

### WhatsApp

WhatsApp ทำงานผ่านเว็บแชนเนลของ Gateway (Baileys Web) และจะเริ่มทำงานโดยอัตโนมัติเมื่อมีเซสชันที่เชื่อมโยงอยู่

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
- ค่าเริ่มต้นของ `web.reconnect`: `initialMs: 2000`, `maxMs: 30000`, `factor: 1.8`, `jitter: 0.25`, `maxAttempts: 12` โดย `maxAttempts: 0` จะลองใหม่ตลอดไปแทนที่จะยอมแพ้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการผูก ACP แบบถาวรสำหรับ DM และกลุ่ม WhatsApp ใช้หมายเลขโดยตรงรูปแบบ E.164 หรือ JID กลุ่ม WhatsApp ใน `match.peer.id` ความหมายของฟิลด์ใช้ร่วมกันตามที่อธิบายใน[เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี มิฉะนั้นจะใช้รหัสบัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นสำรองดังกล่าว เมื่อตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ไดเรกทอรีการยืนยันตัวตน Baileys แบบบัญชีเดียวรุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่สำหรับแต่ละบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น ไม่รับ symlink) โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าทดแทนสำหรับบัญชีเริ่มต้น
- `apiRoot` เป็นรูทของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรูทที่โฮสต์เอง/รูทพร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่เพิ่มเข้ามาโดยไม่ตั้งใจ
- สำหรับเซิร์ฟเวอร์ Bot API ที่โฮสต์เองในโหมด `--local` นั้น `trustedLocalFileRoots` จะแสดงรายการพาธบนโฮสต์ที่ OpenClaw สามารถอ่านได้ เมานต์โวลุ่มข้อมูลของเซิร์ฟเวอร์บนโฮสต์ OpenClaw และกำหนดค่ารูทข้อมูลหรือไดเรกทอรีแยกตามโทเค็น โดยพาธคอนเทนเนอร์ภายใต้ `/var/lib/telegram-bot-api` จะถูกแมปไปยังรูทเหล่านั้น พาธสัมบูรณ์อื่นๆ ยังคงถูกปฏิเสธ
- `channels.telegram.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าแบบหลายบัญชี (มี ID บัญชีตั้งแต่ 2 รายการขึ้นไป) ให้กำหนดบัญชีเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางแบบทดแทน โดย `openclaw doctor` จะแจ้งเตือนเมื่อไม่มีค่านี้หรือค่าไม่ถูกต้อง
- `configWrites: false` จะบล็อกการเขียนการกำหนดค่าที่เริ่มต้นจาก Telegram (การย้าย ID ของซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการผูก ACP แบบถาวรสำหรับหัวข้อในฟอรัม (ใช้ `chatId:topic:topicId` มาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันตามที่อธิบายใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ใช้งานได้ทั้งในการแชตโดยตรงและการแชตกลุ่ม)
- `network.dnsResultOrder` มีค่าเริ่มต้นเป็น `"ipv4first"` เพื่อหลีกเลี่ยงความล้มเหลวในการดึงข้อมูลผ่าน IPv6 ที่พบบ่อย
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
              systemPrompt: "ตอบแบบสั้นเท่านั้น",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // off | partial | block | progress (ค่าเริ่มต้นของ Discord: progress)
        chunkMode: "length", // length | newline
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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก ส่วนการตั้งค่าการลองใหม่/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่
- `channels.discord.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) เป็นเป้าหมายการส่ง โดยระบบจะปฏิเสธ ID ตัวเลขเปล่า
- สลักของกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-` ส่วนคีย์ช่องใช้ชื่อในรูปแบบสลัก (ไม่มี `#`) แนะนำให้ใช้ ID กิลด์
- ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` จะเปิดใช้งานข้อความเหล่านี้ ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ข้อความของบอตเองยังคงถูกกรอง)
- ช่องที่รองรับข้อความขาเข้าซึ่งบอตเป็นผู้เขียนสามารถใช้ [การป้องกันลูปบอต](/th/channels/bot-loop-protection) ร่วมกันได้ ตั้งค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณพื้นฐานต่อคู่ แล้วแทนที่เฉพาะช่องหรือบัญชีเมื่อพื้นผิวใดพื้นผิวหนึ่งต้องการขีดจำกัดที่แตกต่างกัน
- `channels.discord.guilds.<id>.ignoreOtherMentions` (รวมถึงค่าที่แทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จะแมปข้อความ `@handle` ขาออกแบบคงที่กับ ID ผู้ใช้ Discord ก่อนส่ง ทำให้สามารถกล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอน แม้แคชไดเรกทอรีชั่วคราวจะว่างเปล่า ค่าที่แทนที่รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น `17`) จะแบ่งข้อความที่มีความสูงมาก แม้จะมีความยาวต่ำกว่า 2000 อักขระ
- `channels.discord.suppressEmbeds` มีค่าเริ่มต้นเป็น `true` ดังนั้น URL ขาออกจะไม่ขยายเป็นตัวอย่างลิงก์ของ Discord เว้นแต่จะปิดใช้งาน เพย์โหลด `embeds` ที่ระบุอย่างชัดเจนยังคงส่งได้ตามปกติ และการเรียกเครื่องมือแต่ละข้อความสามารถแทนที่ด้วย `suppressEmbeds`
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรดของ Discord:
  - `enabled`: ค่าที่แทนที่ของ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` รวมถึงการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: ค่าที่แทนที่ของ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: ค่าที่แทนที่ของ Discord สำหรับอายุสูงสุดแบบตายตัว หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติเมื่อ ACP สร้างเธรด (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบทซับเอเจนต์แบบเนทีฟสำหรับการสร้างที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้ ID ช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` กำหนดสีเน้นสำหรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่คอลแบ็กคอมโพเนนต์ Discord ที่ส่งแล้วยังคงลงทะเบียนอยู่ ค่าเริ่มต้น `1800000` (30 นาที) สูงสุด `86400000` (24 ชั่วโมง) ค่าที่แทนที่รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` แนะนำให้ใช้ TTL ที่สั้นที่สุดซึ่งเหมาะกับเวิร์กโฟลว์
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord รวมถึงการเข้าร่วมอัตโนมัติและค่าที่แทนที่สำหรับ LLM + TTS ซึ่งเป็นตัวเลือกเสริม การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงไว้โดยค่าเริ่มต้น ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้งาน
- `channels.discord.voice.model` เป็นตัวเลือกเสริมสำหรับแทนที่โมเดล LLM ที่ใช้ตอบกลับในช่องเสียง Discord
- `channels.discord.voice.daveEncryption` (ค่าเริ่มต้น `true`) และ `channels.discord.voice.decryptionFailureTolerance` (ค่าเริ่มต้น `24`) จะส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice`
- `channels.discord.voice.connectTimeoutMs` ควบคุมระยะเวลารอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายามเข้าร่วมอัตโนมัติ (ค่าเริ่มต้น `30000`)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงซึ่งตัดการเชื่อมต่อสามารถใช้เพื่อเข้าสู่การส่งสัญญาณเชื่อมต่อใหม่ ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (ค่าเริ่มต้น `15000`)
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะโดยเหตุการณ์เริ่มพูดของผู้ใช้อื่น เพื่อหลีกเลี่ยงลูปป้อนกลับ OpenClaw จะละเว้นการจับเสียงใหม่ขณะที่กำลังเล่น TTS
- นอกจากนี้ OpenClaw จะพยายามกู้คืนการรับเสียงด้วยการออกจากแล้วกลับเข้าร่วมเซสชันเสียงอีกครั้ง หลังเกิดความล้มเหลวในการถอดรหัสซ้ำหลายครั้ง
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความตัวอย่างเดียวที่มีการแก้ไข ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน คีย์แบบแบนเดิม (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) จะไม่ถูกอ่านที่รันไทม์อีกต่อไป ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายข้อมูลการกำหนดค่าที่บันทึกไว้
- `channels.discord.autoPresence` จะแมปสถานะความพร้อมใช้งานของรันไทม์กับสถานะของบอต (ปกติ => ออนไลน์, เสื่อมสภาพ => ไม่อยู่, หมดทรัพยากร => ห้ามรบกวน) และอนุญาตให้แทนที่ข้อความสถานะได้ตามต้องการ
- `channels.discord.guilds.<id>.presenceEvents` จะกำหนดเส้นทางการเปลี่ยนสถานะของมนุษย์เป็นพร้อมใช้งานไปยังช่อง Discord ที่กำหนดค่าไว้หนึ่งช่อง ในรูปแบบเหตุการณ์ระบบของเอเจนต์ สมาชิกที่มีสิทธิ์ต้องสามารถดู `channelId` ได้ เธรดสาธารณะจะสืบทอดการมองเห็นจากช่องแม่ ส่วนเธรดส่วนตัวยังกำหนดให้ต้องเป็นสมาชิกหรือมีสิทธิ์ Manage Threads ด้วย `users` สามารถจำกัดกลุ่มเป้าหมายนั้นเพิ่มเติมได้ ฟีเจอร์นี้จะกำหนดสถานะเริ่มต้นของสมาชิกออนไลน์ปัจจุบันจากสแนปช็อต `GUILD_CREATE` ที่สมบูรณ์ กำหนดเส้นทางการเปลี่ยนผ่านจากออฟไลน์เป็นออนไลน์ที่ตรวจพบ และถือว่าสัญญาณออนไลน์ครั้งแรกในภายหลังของสมาชิกที่ไม่เคยพบเป็นการพร้อมใช้งานใหม่ โดยไม่ยืนยันว่าสมาชิกออนไลน์ขึ้นหรือเข้าร่วมหลังสแนปช็อต กิลด์ที่มีสมาชิกเกินขีดจำกัดสแนปช็อต 75,000 คนของ Discord ต้องได้รับการอัปเดตออฟไลน์อย่างชัดเจนก่อน ตัวควบคุมการจำกัดอัตรา: `reconnectSuppressSeconds` (ช่วงพักหลังเริ่มเซสชัน Gateway ใหม่ ขณะที่ระบบสร้างสถานะการแสดงตนของกิลด์ขึ้นใหม่ ค่าเริ่มต้น 300 และ `0` ปิดใช้งาน) และ `burstLimit`/`burstWindowSeconds` (ขีดจำกัดอัตราเหตุการณ์ที่จัดคิวสำเร็จต่อกิลด์ ค่าเริ่มต้น 8 เหตุการณ์ต่อหน้าต่างเลื่อน 60 วินาที) เซสชันที่กลับมาทำงานต่อจะไม่เริ่มช่วงระงับหลังการเชื่อมต่อใหม่ ระยะพักก่อนทักทายผู้ใช้เดิมอีกครั้งยังคงเป็นแปดชั่วโมง ฟีเจอร์นี้ต้องใช้ `channels.discord.intents.presence=true`, Presence Intent แบบมีสิทธิ์พิเศษใน Developer Portal ของ Discord และ Heartbeat ของเอเจนต์ที่เปิดใช้งาน
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติการดำเนินการแบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติการดำเนินการจะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Discord ที่ได้รับอนุญาตให้อนุมัติคำขอดำเนินการ หากละเว้นจะใช้ `commands.ownerAllowFrom` เป็นค่าสำรอง
  - `agentFilter`: รายการอนุญาต ID เอเจนต์ที่เป็นตัวเลือกเสริม ละเว้นเพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันที่เป็นตัวเลือกเสริม (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งพรอมต์การอนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง และ `"both"` ส่งไปยังทั้งสองแห่ง เมื่อเป้าหมายมี `"channel"` เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่สามารถใช้ปุ่มได้
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือนปฏิกิริยา:** `off` (ไม่มี), `own` (ข้อความของบอต ค่าเริ่มต้น), `all` (ข้อความทั้งหมด), `allowlist` (จาก `guilds.<id>.users` ในข้อความทั้งหมด)

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
- ค่าสำรองจากสภาพแวดล้อม: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE` (เฉพาะบัญชีเริ่มต้น)
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` เป็นเป้าหมายการส่ง
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
          systemPrompt: "คำตอบสั้นเท่านั้น",
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
        mode: "partial", // off | partial | block | progress
        chunkMode: "length", // length | newline
        nativeTransport: true, // ใช้ API การสตรีมแบบเนทีฟของ Slack เมื่อ mode=partial
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

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับการใช้ค่าจาก env ของบัญชีเริ่มต้นเป็นทางเลือกสำรอง)
- **โหมด HTTP** ต้องใช้ `botToken` ร่วมกับ `signingSecret` (ที่ระดับรากหรือแยกตามบัญชี)
- **ข้อมูลประจำตัวผู้ใช้** (`identity: "user"`) โพสต์และอ่านในนามบุคคลที่ให้สิทธิ์ โดยต้องใช้ `userToken` ร่วมกับ `appToken` ในโหมด Socket หรือ `userToken` ร่วมกับ `signingSecret` ในโหมด HTTP ไม่จำเป็นต้องมีโทเค็นบอตหรือผู้ใช้บอต ดูขอบเขตสิทธิ์ของผู้ใช้และการสมัครรับเหตุการณ์ได้ที่ [ข้อมูลประจำตัวผู้ใช้](/th/channels/slack#user-identity-post-as-a-real-person)
- `enterpriseOrgInstall: true` เลือกให้บัญชีใช้เส้นทางเหตุการณ์ทั่วทั้งองค์กรของ Slack Enterprise Grid
  เมื่อเริ่มทำงาน ระบบจะตรวจสอบโทเค็นบอตด้วย `auth.test` และ
  ล้มเหลวเมื่อโหมดที่กำหนดค่าไม่ตรงกับข้อมูลประจำตัวการติดตั้งของ Slack
  ต้องปิดใช้งาน DM ระดับ Enterprise หรือใช้ `dmPolicy: "open"` พร้อม
  `allowFrom: ["*"]` ที่มีผล นโยบายช่องและผู้ใช้ต้องใช้ ID ของ Slack ที่คงที่
  ชื่อที่เปลี่ยนแปลงได้และคำนำหน้าช่องที่ไม่รองรับจะทำให้การเริ่มทำงานล้มเหลว V1 รองรับเฉพาะ
  เหตุการณ์ `message` และ `app_mention` ผ่านโหมด Socket โดยตรงหรือ HTTP พร้อมการตอบกลับ
  ทันทีเท่านั้น ส่วนรีเลย์ คำสั่ง การโต้ตอบ App Home ตัวรับฟังเหตุการณ์รีแอ็กชัน
  หมุด เครื่องมือการดำเนินการ การอนุมัติแบบเนทีฟ การเชื่อมโยง การส่งแบบหน่วงเวลา และ
  การส่งเชิงรุกไม่พร้อมใช้งาน การตอบรับที่ตัวรับฟังเป็นเจ้าของ การแสดงสถานะกำลังพิมพ์ และ
  รีแอ็กชันสถานะยังคงใช้ได้กับ `reactions:write`; การแจ้งเตือนรีแอ็กชัน
  ขาเข้าและเครื่องมือการดำเนินการรีแอ็กชันไม่พร้อมใช้งาน ดู
  เวิร์กโฟลว์การตั้งค่า manifest สิทธิ์ขั้นต่ำ และข้อจำกัดทั้งหมดได้ที่
  [การติดตั้งทั่วทั้งองค์กรของ Enterprise Grid](/th/channels/slack#enterprise-grid-org-wide-installs)
- `socketMode` ส่งต่อการปรับแต่งการรับส่งข้อมูลโหมด Socket ของ Slack SDK ไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหาการหมดเวลาของ ping/pong หรือพฤติกรรม websocket ที่ค้าง `clientPingTimeout` มีค่าเริ่มต้นเป็น `15000`; ระบบจะส่ง `serverPingTimeout` และ `pingPongLoggingEnabled` เฉพาะเมื่อมีการกำหนดค่า
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- สแนปชอตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะแยกตามข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus` และในโหมด HTTP คือ `signingSecretStatus`
  `configured_unavailable` หมายความว่าบัญชีได้รับการ
  กำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  แก้ไขค่าข้อมูลลับได้
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มต้นโดย Slack
- `channels.slack.defaultAccount` ซึ่งเป็นทางเลือก จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack (ค่าเริ่มต้น `"partial"`) `channels.slack.streaming.nativeTransport` ควบคุมการรับส่งข้อมูลสตรีมแบบเนทีฟของ Slack (ค่าเริ่มต้น `true`) รันไทม์จะไม่อ่านค่าเดิม `streamMode`, ค่าบูลีน `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` และ `nativeStreaming` อีกต่อไป ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายการกำหนดค่าที่บันทึกไว้ไปยัง `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`
- `unfurlLinks` และ `unfurlMedia` ส่งต่อค่าบูลีน `chat.postMessage` ของ Slack สำหรับการแสดงตัวอย่างลิงก์และสื่อในการตอบกลับของบอต `unfurlLinks` มีค่าเริ่มต้นเป็น `false` เพื่อไม่ให้ลิงก์ขาออกของบอตขยายแบบอินไลน์เว้นแต่เปิดใช้งาน ส่วน `unfurlMedia` จะถูกละเว้นเว้นแต่มีการกำหนดค่า ตั้งค่าใดค่าหนึ่งที่ `channels.slack.accounts.<accountId>` เพื่อแทนที่ค่าระดับบนสุดสำหรับบัญชีหนึ่งบัญชี
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` เป็นเป้าหมายการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` แยกตามเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั่วทั้งช่อง `thread.inheritParent` คัดลอกบทสนทนาของช่องหลักไปยังเธรดใหม่ `thread.initialHistoryLimit` (ค่าเริ่มต้น `20`) จำกัดจำนวนข้อความเธรดที่มีอยู่ซึ่งจะดึงมาเมื่อเริ่มเซสชันเธรดใหม่ ส่วน `0` ปิดใช้งานการดึงประวัติเธรด

- การสตรีมแบบเนทีฟของ Slack และสถานะเธรดแบบผู้ช่วยของ Slack "กำลังพิมพ์..." ต้องมีเป้าหมายเป็นเธรดตอบกลับ DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น ดังนั้นจึงยังสามารถสตรีมผ่านตัวอย่างแบบร่างที่โพสต์แล้วแก้ไขของ Slack แทนการแสดงตัวอย่างสตรีม/สถานะแบบเนทีฟในรูปแบบเธรด
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้ข้อความ Slack ขาเข้าระหว่างที่กำลังประมวลผลการตอบกลับ แล้วนำออกเมื่อเสร็จสิ้น ใช้รหัสย่ออีโมจิของ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งไปยังไคลเอนต์การอนุมัติแบบเนทีฟของ Slack และการให้สิทธิ์ผู้อนุมัติ exec ใช้สคีมาเดียวกับ Discord ได้แก่ `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`) การอนุมัติของ Plugin สามารถใช้เส้นทางไคลเอนต์แบบเนทีฟนี้สำหรับคำขอที่มาจาก Slack เมื่อสามารถระบุผู้อนุมัติของ Plugin Slack ได้ นอกจากนี้ยังสามารถเปิดใช้งานการส่งการอนุมัติของ Plugin แบบเนทีฟของ Slack ผ่าน `approvals.plugin` สำหรับเซสชันที่มาจาก Slack หรือเป้าหมาย Slack ได้ด้วย การอนุมัติของ Plugin ใช้ผู้อนุมัติ Plugin Slack จาก `allowFrom` และการกำหนดเส้นทางเริ่มต้น ไม่ใช่ผู้อนุมัติ exec

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | เพิ่มรีแอ็กชัน + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/ถอนหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการอีโมจิแบบกำหนดเอง      |

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
      chatmode: "oncall", // เมื่อถูกเรียก | ทุกข้อความ | เมื่อขึ้นต้นด้วยอักขระ
      oncharPrefixes: [">", "!"],
      groups: {
        "*": { requireMention: true },
        "team-channel-id": { requireMention: false },
      },
      commands: {
        native: true, // ต้องเลือกเปิดใช้
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL แบบระบุชัดเจนซึ่งเป็นทางเลือกสำหรับการติดตั้งใช้งานผ่าน reverse proxy/สาธารณะ
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

โหมดแชต: `oncall` (ตอบกลับเมื่อมีการ @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้งานคำสั่งแบบเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้องชี้ไปยังปลายทาง Gateway ของ OpenClaw และเซิร์ฟเวอร์ Mattermost ต้องเข้าถึงได้
- คอลแบ็กคำสั่ง slash แบบเนทีฟจะผ่านการยืนยันตัวตนด้วยโทเค็นแยกตามคำสั่งที่ Mattermost ส่งคืน
  ระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดเปิดใช้งาน OpenClaw จะปฏิเสธคอลแบ็กด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์คอลแบ็กแบบส่วนตัว/tailnet/ภายใน Mattermost อาจกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนของคอลแบ็ก
  ให้ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นโดย Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่ข้อกำหนดการ mention แยกตามช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` ซึ่งเป็นทางเลือก จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การผูกบัญชีซึ่งเป็นทางเลือก
      dmPolicy: "pairing",
      allowFrom: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      configWrites: true,
      reactionNotifications: "own", // ปิด | ของตนเอง | ทั้งหมด | รายการอนุญาต
      reactionAllowlist: ["+15551234567", "uuid:123e4567-e89b-12d3-a456-426614174000"],
      historyLimit: 50,
    },
  },
}
```

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

- `channels.signal.account`: ตรึงการเริ่มทำงานของช่องไว้กับข้อมูลประจำตัวบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นโดย Signal
- `channels.signal.defaultAccount` ซึ่งเป็นทางเลือก จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

### iMessage

OpenClaw เริ่มกระบวนการ `imsg rpc` (JSON-RPC ผ่าน stdio) โดยไม่ต้องใช้ดีมอนหรือพอร์ต นี่คือเส้นทางที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่ เมื่อโฮสต์สามารถให้สิทธิ์เข้าถึงฐานข้อมูล Messages และสิทธิ์ Automation

การรองรับ BlueBubbles ถูกนำออกแล้ว `channels.bluebubbles` ไม่ใช่พื้นผิวการกำหนดค่ารันไทม์ที่รองรับใน OpenClaw ปัจจุบัน ให้ย้ายการกำหนดค่าเก่าไปยัง `channels.imessage`; ดูฉบับย่อที่ [การนำ BlueBubbles ออกและเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage) และตารางเทียบทั้งหมดที่ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles)

หาก Gateway ไม่ได้ทำงานอยู่บน Mac ที่ลงชื่อเข้าใช้ Messages ให้คง `channels.imessage.enabled=true` ไว้และตั้งค่า `channels.imessage.cliPath` เป็น wrapper SSH ที่เรียกใช้ `imsg "$@"` บน Mac เครื่องนั้น พาธ `imsg` ภายในเครื่องตามค่าเริ่มต้นรองรับเฉพาะ macOS

ก่อนพึ่งพา wrapper SSH สำหรับการส่งในระบบที่ใช้งานจริง ให้ตรวจสอบ `imsg send` ขาออกผ่าน wrapper นั้นโดยตรง สถานะ TCC บางแบบของ macOS กำหนดสิทธิ์ Messages Automation ให้กับ `/usr/libexec/sshd-keygen-wrapper` ซึ่งอาจทำให้การอ่านและการตรวจสอบทำงานได้ แต่การส่งล้มเหลวด้วย AppleEvents `-1743`; ดูส่วนการแก้ไขปัญหา wrapper SSH ใน [iMessage](/th/channels/imessage)

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

- `channels.imessage.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ต้องมีสิทธิ์ Full Disk Access เพื่อเข้าถึงฐานข้อมูล Messages
- ควรใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้ โดยตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบคีย์โฮสต์อย่างเข้มงวด ดังนั้นต้องแน่ใจว่าคีย์ของโฮสต์รีเลย์มีอยู่ใน `~/.ssh/known_hosts` แล้ว
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก iMessage
- `channels.imessage.sendTransport`: ทรานสปอร์ตการส่ง RPC ของ `imsg` ที่ต้องการสำหรับการตอบกลับขาออกตามปกติ `auto` (ค่าเริ่มต้น) ใช้บริดจ์ IMCore สำหรับแชตที่มีอยู่เมื่อบริดจ์กำลังทำงาน จากนั้นจึงย้อนกลับไปใช้ AppleScript; `bridge` ต้องใช้การส่งผ่าน API ส่วนตัว; `applescript` บังคับใช้พาธการทำงานอัตโนมัติของ Messages แบบสาธารณะ
- `channels.imessage.actions.*`: เปิดใช้งานการดำเนินการผ่าน API ส่วนตัว ซึ่งถูกควบคุมเพิ่มเติมด้วย `imsg status` / `openclaw channels status --probe`
- `channels.imessage.includeAttachments` ปิดอยู่โดยค่าเริ่มต้น ให้ตั้งเป็น `true` ก่อนคาดหวังว่าจะได้รับสื่อขาเข้าในรอบการทำงานของเอเจนต์
- การกู้คืนข้อมูลขาเข้าหลังจากรีสตาร์ตบริดจ์/Gateway เป็นไปโดยอัตโนมัติ (ขจัด GUID ซ้ำและใช้ขอบเขตอายุของงานค้างเก่า) การกำหนดค่า `channels.imessage.catchup.enabled: true` ที่มีอยู่ยังคงได้รับการรองรับในฐานะโปรไฟล์ความเข้ากันได้ที่เลิกใช้แล้ว; `catchup` ถูกปิดใช้งานโดยค่าเริ่มต้น
- `channels.imessage.groups`: รีจิสทรีกลุ่มและการตั้งค่ารายกลุ่ม เมื่อใช้ `groupPolicy: "allowlist"` ให้กำหนดค่าคีย์ `chat_id` แบบระบุชัดเจนหรือรายการไวลด์การ์ด `"*"` เพื่อให้ข้อความกลุ่มผ่านด่านรีจิสทรีได้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิลที่ปรับรูปแบบแล้วหรือเป้าหมายแชตแบบระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง SSH wrapper สำหรับ iMessage">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix รองรับผ่าน Plugin และกำหนดค่าภายใต้ `channels.matrix`

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
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุไว้อย่างชัดเจน บัญชีที่มีชื่อสามารถแทนที่ค่านี้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาตโฮมเซิร์ฟเวอร์ส่วนตัว/ภายใน `proxy` และการยินยอมใช้งานเครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `"off"` ดังนั้นห้องที่ได้รับเชิญและคำเชิญแบบ DM ใหม่จะถูกเพิกเฉยจนกว่าจะตั้งค่า `autoJoin: "allowlist"` ด้วย `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำขออนุมัติการดำเนินการแบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติการดำเนินการจะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: รหัสผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอดำเนินการ
  - `agentFilter`: รายการอนุญาตรหัสเอเจนต์ที่เป็นตัวเลือก หากไม่ระบุ ระบบจะส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันที่เป็นตัวเลือก (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งข้อความแจ้งการอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่ค่ารายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม DM ของ Matrix เป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้เซสชันร่วมกันตามเพียร์ที่กำหนดเส้นทาง ขณะที่ `per-room` แยกแต่ละห้อง DM ออกจากกัน
- การตรวจสอบสถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้นโยบายพร็อกซีเดียวกับทราฟฟิกขณะทำงาน
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่าได้รับการบันทึกไว้ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับผ่าน Plugin และกำหนดค่าภายใต้ `channels.msteams`

```json5
{
  channels: {
    msteams: {
      enabled: true,
      configWrites: true,
      // appId, appPassword, tenantId, webhook, นโยบายทีม/ช่อง:
      // ดู /channels/msteams
    },
  },
}
```

- พาธคีย์หลักที่กล่าวถึงในที่นี้: `channels.msteams`, `channels.msteams.configWrites`
- การกำหนดค่า Teams แบบเต็ม (ข้อมูลประจำตัว, Webhook, นโยบาย DM/กลุ่ม, การแทนที่ค่ารายทีม/รายช่อง) ได้รับการบันทึกไว้ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC รองรับผ่าน Plugin และกำหนดค่าภายใต้ `channels.irc`

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
- `channels.irc.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับรหัสบัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่อง IRC แบบเต็ม (โฮสต์/พอร์ต/TLS/ช่อง/รายการอนุญาต/การควบคุมด้วยการกล่าวถึง) ได้รับการบันทึกไว้ใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การกำหนดเส้นทาง)
- โทเค็นจากสภาพแวดล้อมใช้ได้เฉพาะกับบัญชี **เริ่มต้น** เท่านั้น
- การตั้งค่าพื้นฐานของช่องใช้กับทุกบัญชี เว้นแต่จะถูกแทนที่เป็นรายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่อง) ขณะที่ยังใช้การกำหนดค่าช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะย้ายค่าบัญชีเดียวระดับบนสุดซึ่งมีขอบเขตเฉพาะบัญชีเข้าสู่แมปบัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังคงทำงานได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านี้ไปยัง `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันและมีอยู่แล้วไว้แทน
- การผูกเฉพาะช่องที่มีอยู่ (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น ส่วนการผูกที่มีขอบเขตเฉพาะบัญชียังคงเป็นตัวเลือก
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบผสมด้วยการย้ายค่าบัญชีเดียวระดับบนสุดซึ่งมีขอบเขตเฉพาะบัญชีไปยังบัญชีที่เลื่อนระดับและเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันและมีอยู่แล้วไว้แทน

### ช่อง Plugin อื่นๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารอยู่ในหน้าช่องเฉพาะของตน (ตัวอย่างเช่น Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch และ Zalo)
ดูดัชนีช่องทั้งหมด: [ช่อง](/th/channels)

### การควบคุมแชตกลุ่มด้วยการกล่าวถึง

โดยค่าเริ่มต้น ข้อความกลุ่ม **ต้องมีการกล่าวถึง** (ข้อมูลเมตาการกล่าวถึงหรือรูปแบบนิพจน์ทั่วไปที่ปลอดภัย) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้จะถูกควบคุมแยกต่างหาก โดยค่าเริ่มต้น คำขอโดยตรงจากกลุ่ม ช่อง และ WebChat ภายในตามปกติจะส่งผลลัพธ์สุดท้ายโดยอัตโนมัติ กล่าวคือข้อความสุดท้ายจากผู้ช่วยจะถูกโพสต์ผ่านพาธการตอบกลับที่มองเห็นได้แบบเดิม เลือกใช้ `messages.visibleReplies: "message_tool"` หรือ `messages.groupChat.visibleReplies: "message_tool"` เมื่อต้องการให้การตอบกลับต้นทางที่โมเดลสร้างขึ้นโพสต์หลังจากเอเจนต์เรียก `message(action=send)` แล้วเท่านั้น หากโมเดลส่งคืนคำตอบสุดท้ายที่มีสาระสำคัญโดยไม่เรียกเครื่องมือข้อความในโหมดเฉพาะเครื่องมือที่เลือกใช้ ข้อความสุดท้ายนั้นจะยังคงเป็นส่วนตัว บันทึกแบบละเอียดของ Gateway จะบันทึกข้อมูลเมตาของเพย์โหลดที่ถูกระงับ และ OpenClaw จะเข้าคิวการลองกู้คืนอีกหนึ่งครั้งโดยขอให้โมเดลส่งการตอบกลับเดิมผ่าน `message(action=send)`

นโยบายเฉพาะเครื่องมือควบคุมการตอบกลับต้นทางของผู้ช่วยและสื่อจากเครื่องมือทั่วไป แต่จะไม่ระงับเอาต์พุตปลายทางที่รันไทม์เป็นเจ้าของ เช่น การตอบกลับคำสั่งที่ได้รับอนุญาต การแจ้งเตือนการเสร็จสิ้นแบบถาวร หรืออาร์ติแฟกต์แบบเนทีฟของผู้ให้บริการที่ชุดควบคุมซึ่งเป็นเจ้าของจัดประเภทไว้อย่างชัดเจนว่าโฮสต์เป็นเจ้าของ อาร์ติแฟกต์ที่โฮสต์เป็นเจ้าของจะถูกส่งผ่านพาธการส่งต่อช่องตามปกติ และยังคงเคารพการปฏิเสธขาออกของ `sendPolicy` รอบการทำงาน `room_event` แบบแวดล้อมจะยังคงเงียบ เว้นแต่จะเป็นคำสั่งโดยชัดเจน แม้เอาต์พุตของรันไทม์จะถูกทำเครื่องหมายว่าโฮสต์เป็นเจ้าของก็ตาม

การตอบกลับที่มองเห็นได้แบบเฉพาะเครื่องมือต้องใช้โมเดล/รันไทม์ที่เรียกเครื่องมือได้อย่างเชื่อถือได้ และแนะนำให้ใช้สำหรับห้องร่วมแบบแวดล้อมกับโมเดลรุ่นล่าสุด เช่น GPT-5.6 Sol โมเดลที่ด้อยกว่าบางรุ่นสามารถตอบด้วยข้อความสุดท้ายได้ แต่ไม่เข้าใจว่าเอาต์พุตที่ต้นทางมองเห็นได้ต้องส่งด้วย `message(action=send)` โดยค่าเริ่มต้น OpenClaw จะกู้คืนกรณีทั่วไปที่ข้อความสุดท้ายค้างอยู่ เฉพาะเมื่อข้อความสุดท้ายมีสาระสำคัญ รอบการทำงานต้นทางไม่ใช่เหตุการณ์ในห้อง นโยบายการส่งไม่ได้ปฏิเสธการส่ง และยังไม่มีการส่งการตอบกลับไปยังต้นทาง การกู้คืนถูกจำกัดไว้ที่การลองใหม่หนึ่งครั้ง โดยจะระงับการบันทึกถาวรสำหรับพรอมต์ลองใหม่สังเคราะห์ และแยกการลองใหม่นั้นออกจากการจัดชุดแบบรวบรวม เพื่อไม่ให้รวมกับพรอมต์อื่นที่ไม่เกี่ยวข้องในคิว หากการลองใหม่ยังค้างหรือไม่สามารถเข้าคิวได้ OpenClaw จะส่งเฉพาะข้อความวินิจฉัยที่ผ่านการทำให้ปลอดภัยแล้ว เช่น "ฉันสร้างคำตอบแล้ว แต่ไม่สามารถส่งไปยังแชตนี้ได้ โปรดลองอีกครั้ง" ข้อความสุดท้ายส่วนตัวต้นฉบับจะไม่ถูกทำเครื่องหมายสำหรับการส่งไปยังต้นทางโดยอัตโนมัติ สำหรับโมเดลที่ปล่อยให้การตอบกลับค้างซ้ำๆ ให้ใช้ `"automatic"` เพื่อให้รอบการทำงานสุดท้ายของผู้ช่วยเป็นพาธการตอบกลับที่มองเห็นได้ เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่า ตรวจสอบบันทึกแบบละเอียดของ Gateway เพื่อดูสรุปเพย์โหลดที่ถูกระงับ หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อใช้การตอบกลับสุดท้ายที่มองเห็นได้สำหรับทุกคำขอจากกลุ่ม/ช่อง

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะย้อนกลับไปใช้การตอบกลับที่มองเห็นได้โดยอัตโนมัติแทนการระงับคำตอบโดยไม่แจ้งให้ทราบ `openclaw doctor` จะแจ้งเตือนเกี่ยวกับความไม่สอดคล้องนี้

กฎนี้ใช้กับข้อความสุดท้ายตามปกติของเอเจนต์ การผูกการสนทนาที่ Plugin เป็นเจ้าของจะใช้การตอบกลับที่ Plugin เจ้าของส่งคืนเป็นคำตอบที่มองเห็นได้สำหรับรอบการทำงานของเธรดที่ผูกไว้และถูกอ้างสิทธิ์ Plugin ไม่จำเป็นต้องเรียก `message(action=send)` สำหรับการตอบกลับจากการผูกเหล่านั้น

**การแก้ไขปัญหา: การ @กล่าวถึงในกลุ่มทำให้แสดงสถานะกำลังพิมพ์แล้วเงียบ (ไม่มีข้อผิดพลาด)**

อาการ: การ @กล่าวถึงในกลุ่ม/ช่องแสดงตัวบ่งชี้กำลังพิมพ์ และบันทึก Gateway รายงาน `dispatch complete (queuedFinal=false, replies=0)` แต่ไม่มีข้อความปรากฏในห้อง DM ที่ส่งถึงเอเจนต์เดียวกันตอบกลับได้ตามปกติ

สาเหตุ: โหมดการตอบกลับที่มองเห็นได้ของกลุ่ม/ช่องถูกกำหนดเป็น `"message_tool"` ดังนั้น OpenClaw จะดำเนินเทิร์น แต่ระงับข้อความสุดท้ายของผู้ช่วย เว้นแต่เอเจนต์จะเรียก `message(action=send)` โหมดนี้ไม่มีสัญญา `NO_REPLY`; หากไม่มีการเรียกเครื่องมือส่งข้อความ ข้อความสุดท้ายเดิมจะเป็นแบบส่วนตัว สำหรับเทิร์นต้นทางที่มีเนื้อหาสำคัญ ตอนนี้ OpenClaw จะพยายามกู้คืนด้วยการลองใหม่แบบมีการป้องกันหนึ่งครั้ง โดยจะไม่ลองใหม่สำหรับบันทึกสั้น ๆ การระบุให้เงียบอย่างชัดเจน เหตุการณ์ในห้อง เทิร์นที่ถูกนโยบายการส่งปฏิเสธ และเทิร์นที่ส่งแล้ว เทิร์นกลุ่มและช่องตามปกติมีค่าเริ่มต้นเป็น `"automatic"` ดังนั้นอาการนี้จะปรากฏเฉพาะเมื่อตั้งค่า `messages.groupChat.visibleReplies` (หรือ `messages.visibleReplies` ส่วนกลาง) เป็น `"message_tool"` อย่างชัดเจนเท่านั้น Harness `defaultVisibleReplies` ไม่มีผลในกรณีนี้ — ตัวแก้ค่าของกลุ่ม/ช่องจะไม่สนใจค่านี้ โดยมีผลเฉพาะกับแชตโดยตรง/แชตต้นทางเท่านั้น (Codex harness ใช้วิธีนี้ระงับข้อความสุดท้ายของแชตโดยตรง)

วิธีแก้: เลือกโมเดลที่เรียกใช้เครื่องมือได้มีประสิทธิภาพกว่า ลบการแทนที่ `"message_tool"` ที่กำหนดไว้อย่างชัดเจนเพื่อย้อนกลับไปใช้ค่าเริ่มต้น `"automatic"` หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อบังคับให้ทุกคำขอของกลุ่ม/ช่องมีการตอบกลับที่มองเห็นได้ ข้อความสุดท้ายที่มีเนื้อหาสำคัญซึ่งค้างอยู่ไม่ควรจบลงด้วยความสำเร็จแบบเงียบอีกต่อไป แต่ควรกู้คืนผ่านการลองใหม่ `message(action=send)` หนึ่งครั้ง หรือแสดงการวินิจฉัยความล้มเหลวในการส่งที่ผ่านการลบข้อมูลละเอียดอ่อนแล้ว Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบร้อนหลังจากบันทึกไฟล์ ให้รีสตาร์ต Gateway เฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้เท่านั้น

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงจากเมทาดาทา**: @-mention แบบเนทีฟของแพลตฟอร์ม ระบบจะไม่สนใจในโหมดแชตกับตนเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบนิพจน์ทั่วไปที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` ระบบจะไม่สนใจรูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนที่ไม่ปลอดภัย
- การจำกัดด้วยการกล่าวถึงจะมีผลเฉพาะเมื่อสามารถตรวจจับได้ (การกล่าวถึงแบบเนทีฟหรือมีอย่างน้อยหนึ่งรูปแบบ)

```json5
{
  messages: {
    visibleReplies: "automatic", // บังคับใช้การตอบกลับสุดท้ายแบบอัตโนมัติเดิมสำหรับแชตโดยตรง/แชตต้นทาง
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // การสนทนาในห้องที่ไม่ได้กล่าวถึงและเปิดตลอดเวลาจะกลายเป็นบริบทแบบเงียบ
      visibleReplies: "message_tool", // เลือกใช้; ต้องใช้ message(action=send) เพื่อให้การตอบกลับในห้องมองเห็นได้
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` กำหนดค่าเริ่มต้นส่วนกลาง ช่องสามารถแทนที่ด้วย `channels.<channel>.historyLimit` (หรือต่อบัญชี) ตั้งค่า `0` เพื่อปิดใช้งาน

`messages.groupChat.unmentionedInbound: "room_event"` ส่งข้อความกลุ่ม/ช่องแบบเปิดตลอดเวลาที่ไม่ได้กล่าวถึงเป็นบริบทห้องแบบเงียบบนช่องที่รองรับ ข้อความที่มีการกล่าวถึง คำสั่ง และข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้ ดูตัวอย่างฉบับสมบูรณ์สำหรับ Discord, Slack และ Telegram ได้ที่ [เหตุการณ์แวดล้อมในห้อง](/th/channels/ambient-room-events)

`messages.visibleReplies` คือค่าเริ่มต้นของเหตุการณ์ต้นทางส่วนกลาง ส่วน `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับเหตุการณ์ต้นทางของกลุ่ม/ช่อง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` แชตโดยตรง/แชตต้นทางจะใช้ค่าเริ่มต้นของรันไทม์หรือ Harness ที่เลือก แต่เทิร์นโดยตรงของ WebChat ภายในจะใช้การส่งข้อความสุดท้ายแบบอัตโนมัติเพื่อให้พรอมต์ของ Pi/Codex สอดคล้องกัน ตั้งค่า `messages.visibleReplies: "message_tool"` เพื่อกำหนดให้ต้องใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้โดยตั้งใจ รายการอนุญาตของช่องและการจำกัดด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่าจะประมวลผลเหตุการณ์หรือไม่

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

ลำดับการกำหนดค่า: การแทนที่ต่อ DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่จำกัด (เก็บไว้ทั้งหมด)

ตัวแก้ค่านี้อ่าน `channels.<provider>.dmHistoryLimit` และ `channels.<provider>.dms.<id>.historyLimit` สำหรับทุกช่องที่คีย์เซสชันเป็นไปตามรูปแบบมาตรฐาน `provider:direct:<id>` (หรือรูปแบบเดิม `provider:dm:<id>`) จึงใช้งานได้ทั้งกับช่องแบบรวมมาให้และช่อง Plugin ไม่ได้จำกัดอยู่เพียงรายการตายตัว

#### โหมดแชตกับตนเอง

เพิ่มหมายเลขของตนเองใน `allowFrom` เพื่อเปิดใช้โหมดแชตกับตนเอง (ไม่สนใจ @-mention แบบเนทีฟ และตอบสนองเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งที่มีมาให้ในตัวและแบบรวมมาให้ในปัจจุบัน โปรดดู [คำสั่งแบบสแลช](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่อง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าของช่อง/Plugin ที่เกี่ยวข้อง รวมถึง [คำสั่งแบบสแลช](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความ **แยกเดี่ยว** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดใช้คำสั่งแบบเนทีฟสำหรับ Discord/Telegram และคง Slack ไว้เป็นปิด
- `nativeSkills: "auto"` เปิดใช้คำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และคง Slack ไว้เป็นปิด
- แทนที่ค่าต่อช่องด้วย `channels.discord.commands.native` (ค่าบูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งแบบเนทีฟระหว่างการเริ่มต้น
- แทนที่การลงทะเบียน Skills แบบเนทีฟต่อช่องด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียนแบบถาวรผ่าน `/config set|unset` ยังต้องใช้ `operator.admin`; ส่วน `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ผู้ดำเนินการทั่วไปที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา การติดตั้ง และการควบคุมเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าต่อช่อง (ค่าเริ่มต้น: true)
- สำหรับช่องที่มีหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่มุ่งไปยังบัญชีนั้นด้วย (ตัวอย่างเช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และคำขอรีสตาร์ต `SIGUSR1` จากภายนอก ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตของเจ้าของที่กำหนดไว้อย่างชัดเจนสำหรับคำสั่งที่ใช้ได้เฉพาะเจ้าของและการดำเนินการของช่องที่ควบคุมโดยเจ้าของ โดยแยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮช ID เจ้าของในพรอมต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นค่าต่อผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งการให้สิทธิ์ **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงได้เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนผังเอกสารคำสั่ง:
  - แค็ตตาล็อกที่มีมาให้ในตัวและแบบรวมมาให้: [คำสั่งแบบสแลช](/th/tools/slash-commands)
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
