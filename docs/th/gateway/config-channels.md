---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน การควบคุมการเข้าถึง หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าของแต่ละช่องทาง
    - การตรวจสอบนโยบาย DM นโยบายกลุ่ม หรือการควบคุมด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์แยกตามช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-07-20T05:56:00Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e1c32077ec770c04bdf3c49aa187572a271a954bccec7b31fef776f768a6ed9b
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าของแต่ละช่องภายใต้ `channels.*`: การเข้าถึง DM และกลุ่ม การตั้งค่าหลายบัญชี การกำหนดให้ต้องมีการกล่าวถึง และคีย์เฉพาะช่องสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องอื่นๆ

สำหรับเอเจนต์ เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ โปรดดู[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่อง

แต่ละช่องเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องนั้น (เว้นแต่ `enabled: false`) Telegram และ iMessage รวมอยู่ภายในแพ็กเกจหลัก `openclaw` ส่วนช่องทางการอื่นๆ (Discord, Slack, WhatsApp, Matrix, Microsoft Teams, IRC, Google Chat, Signal, Mattermost และอื่นๆ) จะติดตั้งเป็น Plugin แยกต่างหากด้วย `openclaw plugins install <spec>`; โปรดดูรายการทั้งหมดและข้อกำหนดการติดตั้งที่[ช่อง](/th/channels)

### การเข้าถึง DM และกลุ่ม

ทุกช่องรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | ลักษณะการทำงาน                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือคลังรายการอนุญาตที่จับคู่แล้ว)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | ลักษณะการทำงาน                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับรายการอนุญาตที่กำหนดค่าไว้          |
| `open`                | ข้ามรายการอนุญาตของกลุ่ม (ยังคงใช้การกำหนดให้ต้องมีการกล่าวถึง) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` กำหนดค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของผู้ให้บริการ
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ที่รอดำเนินการจำกัดไว้ที่ **3 รายการต่อบัญชี** (กำหนดขอบเขตตามช่องและรหัสบัญชี)
หากไม่มีบล็อกของผู้ให้บริการทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดเพื่อความปลอดภัย) พร้อมคำเตือนเมื่อเริ่มต้นระบบ
</Note>

### การแทนที่โมเดลตามช่อง

ใช้ `channels.modelByChannel` เพื่อตรึงรหัสช่องหรือคู่สนทนาในข้อความส่วนตัวบางรายการไว้กับโมเดล ค่ารองรับ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ การแมปช่องจะมีผลเฉพาะเมื่อเซสชันยังไม่มีการแทนที่โมเดลที่ใช้งานอยู่แล้ว (ตัวอย่างเช่น การแทนที่ที่ตั้งผ่าน `/model`)

สำหรับการสนทนาแบบกลุ่ม/เธรด คีย์คือรหัสกลุ่ม รหัสหัวข้อ หรือชื่อช่องที่เฉพาะเจาะจงกับแต่ละช่อง สำหรับการสนทนาด้วยข้อความส่วนตัว (DM) คีย์คือตัวระบุคู่สนทนาที่ได้มาจากข้อมูลประจำตัวของผู้ส่งในช่อง (`nativeDirectUserId`, `origin.from`, `origin.to`, `OriginatingTo`, `From` หรือ `SenderId`) รูปแบบคีย์ที่แน่นอนขึ้นอยู่กับช่อง:

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

คีย์เฉพาะ DM จะตรงกันเฉพาะในการสนทนาด้วยข้อความส่วนตัวเท่านั้น และไม่มีผลต่อการกำหนดเส้นทางของกลุ่ม/เธรด

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่อง ค่า: `all` (ค่าเริ่มต้น รวมบริบทจากคำพูดอ้างอิง/เธรด/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งในรายการอนุญาต), `allowlist_quote` (เหมือนรายการอนุญาต แต่คงบริบทคำพูดอ้างอิง/การตอบกลับที่ระบุไว้อย่างชัดเจน) การแทนที่ตามช่อง: `channels.<channel>.contextVisibility`
- `channels.defaults.implicitMentions`: ควบคุมว่าข้อเท็จจริงขาเข้าประเภทใดที่รองรับจะนับเป็นการกล่าวถึง `replyToBot`, `quotedBot` และ `threadParticipation` มีค่าเริ่มต้นเป็น `true` แต่ละรายการเพื่อคงลักษณะการทำงานปัจจุบันไว้ แทนที่ตามช่องด้วย `channels.<channel>.implicitMentions` หรือตามบัญชีด้วย `channels.<channel>.accounts.<id>.implicitMentions`; แต่ละแฟล็กจะหาค่าแยกกันตามลำดับ บัญชี -> ช่อง -> ค่าเริ่มต้น ชื่อมีความหมายเชิงบวก: ตั้งค่าแฟล็กเป็น `false` เพื่อไม่ให้ข้อเท็จจริงนั้นข้ามการกำหนดให้ต้องมีการกล่าวถึง การกล่าวถึงแบบเนทีฟที่ระบุไว้อย่างชัดเจนจะได้รับอนุญาตเสมอ และแฟล็กจะไม่มีผลเมื่อช่องไม่สร้างข้อเท็จจริงนั้น โปรดดูเมทริกซ์ผู้สร้างปัจจุบันที่[การกำหนดให้ต้องมีการกล่าวถึง](/th/channels/groups#mention-gating-default) การตั้งค่าเหล่านี้ไม่เปลี่ยนโหมดการตอบกลับ/เธรดขาออกหรือการจัดการคำสั่งที่ได้รับอนุญาต
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องที่สมบูรณ์ในผลลัพธ์ Heartbeat (ค่าเริ่มต้น `false`)
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะที่เสื่อมประสิทธิภาพ/ข้อผิดพลาดในผลลัพธ์ Heartbeat (ค่าเริ่มต้น `true`)
- `channels.defaults.heartbeat.useIndicator`: แสดงผลลัพธ์ Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด (ค่าเริ่มต้น `true`)

### WhatsApp

WhatsApp ทำงานผ่านช่องเว็บของ Gateway (Baileys Web) โดยจะเริ่มทำงานโดยอัตโนมัติเมื่อมีเซสชันที่เชื่อมโยงแล้ว

```json5
{
  web: {
    enabled: true,
  },
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" }, // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // เครื่องหมายถูกสีน้ำเงิน (เป็น false ในโหมดแชตกับตนเอง)
      groups: {
        "*": { requireMention: true },
      },
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15551234567"],
    },
  },
}
```

- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการเชื่อมโยง ACP แบบถาวรสำหรับ DM และกลุ่มของ WhatsApp ใช้หมายเลขโดยตรงในรูปแบบ E.164 หรือ JID ของกลุ่ม WhatsApp ใน `match.peer.id` ความหมายของฟิลด์ใช้ร่วมกันใน[เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

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

- คำสั่งขาออกใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี มิฉะนั้นจะใช้รหัสบัญชีแรกที่กำหนดค่าไว้ (หลังเรียงลำดับ)
- `channels.whatsapp.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้น เมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ไดเรกทอรีการยืนยันตัวตน Baileys แบบบัญชีเดียวรุ่นเก่าจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น ไม่รับ symlink) โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` เป็นรากของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรากที่โฮสต์เอง/พร็อกซีของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบส่วนต่อท้าย `/bot<TOKEN>` ที่เพิ่มมาโดยไม่ตั้งใจ
- สำหรับเซิร์ฟเวอร์ Bot API ที่โฮสต์เองในโหมด `--local` ค่า `trustedLocalFileRoots` จะแสดงรายการพาธบนโฮสต์ที่ OpenClaw สามารถอ่านได้ เมานต์วอลุ่มข้อมูลของเซิร์ฟเวอร์บนโฮสต์ OpenClaw และกำหนดค่ารากข้อมูลหรือไดเรกทอรีแยกตามโทเค็น พาธคอนเทนเนอร์ภายใต้ `/var/lib/telegram-bot-api` จะถูกแมปไปยังรากเหล่านั้น พาธสัมบูรณ์อื่นๆ ยังคงถูกปฏิเสธ
- `channels.telegram.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้น เมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (รหัสบัญชี 2+ รายการ) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะแจ้งเตือนเมื่อไม่มีค่านี้หรือค่าไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มต้นโดย Telegram (การย้ายรหัสซูเปอร์กรุ๊ป, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการเชื่อมโยง ACP แบบถาวรสำหรับหัวข้อฟอรัม (ใช้ `chatId:topic:topicId` แบบมาตรฐานใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน[เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ทั้งในแชตส่วนตัวและแชตกลุ่ม)
- `network.dnsResultOrder` มีค่าเริ่มต้นเป็น `"ipv4first"` เพื่อหลีกเลี่ยงความล้มเหลวในการดึงข้อมูลผ่าน IPv6 ที่พบบ่อย
- นโยบายการลองใหม่: โปรดดู[นโยบายการลองใหม่](/th/concepts/retry)

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
      replyToMode: "off", // ปิด | แรก | ทั้งหมด | แบบกลุ่ม
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
              systemPrompt: "ตอบสั้นเท่านั้น",
            },
          },
        },
      },
      historyLimit: 20,
      textChunkLimit: 2000,
      suppressEmbeds: true,
      streaming: {
        mode: "progress", // ปิด | บางส่วน | บล็อก | ความคืบหน้า (ค่าเริ่มต้นของ Discord: ความคืบหน้า)
        chunkMode: "length", // ความยาว | บรรทัดใหม่
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
        target: "dm", // dm | ช่อง | ทั้งสอง
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
- `channels.discord.defaultAccount` ซึ่งเป็นตัวเลือกเสริมจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) เป็นปลายทางการส่ง ไม่ยอมรับรหัสตัวเลขเปล่า
- Slug ของกิลด์ใช้ตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-` ส่วนคีย์ช่องใช้ชื่อที่แปลงเป็น slug แล้ว (ไม่มี `#`) ควรใช้รหัสกิลด์
- ข้อความที่บอตเป็นผู้เขียนจะถูกละเว้นโดยค่าเริ่มต้น `allowBots: true` เปิดใช้งานข้อความเหล่านั้น ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ข้อความของบอตเองยังคงถูกกรองออก)
- ช่องที่รองรับข้อความขาเข้าซึ่งบอตเป็นผู้เขียนสามารถใช้ [การป้องกันลูปของบอต](/th/channels/bot-loop-protection) ที่ใช้ร่วมกันได้ ตั้งค่า `channels.defaults.botLoopProtection` สำหรับงบประมาณพื้นฐานของแต่ละคู่ แล้วแทนที่ค่าระดับช่องหรือบัญชีเฉพาะเมื่อพื้นผิวใดพื้นผิวหนึ่งต้องใช้ขีดจำกัดที่ต่างออกไป
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และค่าที่แทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่น แต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here)
- `channels.discord.mentionAliases` จับคู่ข้อความ `@handle` ขาออกที่คงที่กับรหัสผู้ใช้ Discord ก่อนส่ง เพื่อให้สามารถกล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างเปล่า ค่าที่แทนที่สำหรับแต่ละบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.mentionAliases`
- `maxLinesPerMessage` (ค่าเริ่มต้น `17`) แบ่งข้อความที่ยาวในแนวตั้งแม้มีความยาวต่ำกว่า 2000 อักขระ
- `channels.discord.suppressEmbeds` มีค่าเริ่มต้นเป็น `true` ดังนั้น URL ขาออกจะไม่ขยายเป็นตัวอย่างลิงก์ของ Discord เว้นแต่จะปิดใช้งาน พayload `embeds` ที่ระบุชัดเจนยังคงส่งได้ตามปกติ และการเรียกใช้เครื่องมือรายข้อความสามารถแทนที่ค่าได้ด้วย `suppressEmbeds`
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางที่ผูกกับเธรดของ Discord:
  - `enabled`: ค่าที่แทนที่ของ Discord สำหรับคุณสมบัติเซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: ค่าที่แทนที่ของ Discord สำหรับการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: ค่าที่แทนที่ของ Discord สำหรับอายุสูงสุดแบบตายตัว หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })` และการสร้างเธรดของ ACP (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบทซับเอเจนต์แบบเนทีฟสำหรับการสร้างที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` ใช้กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้รหัสช่อง/เธรดใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)
- `channels.discord.ui.components.accentColor` กำหนดสีเน้นสำหรับคอนเทนเนอร์คอมโพเนนต์ v2 ของ Discord
- `channels.discord.agentComponents.ttlMs` ควบคุมระยะเวลาที่คอลแบ็กของคอมโพเนนต์ Discord ที่ส่งแล้วยังคงลงทะเบียนอยู่ ค่าเริ่มต้น `1800000` (30 นาที) ค่าสูงสุด `86400000` (24 ชั่วโมง) ค่าที่แทนที่สำหรับแต่ละบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.agentComponents.ttlMs` ควรใช้ TTL ที่สั้นที่สุดซึ่งเพียงพอกับเวิร์กโฟลว์
- `channels.discord.voice` เปิดใช้การสนทนาในช่องเสียงของ Discord รวมถึงตัวเลือกเสริมสำหรับการเข้าร่วมอัตโนมัติและการแทนที่ LLM กับ TTS การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงไว้โดยค่าเริ่มต้น ให้ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้
- `channels.discord.voice.model` สามารถแทนที่โมเดล LLM ที่ใช้ตอบกลับในช่องเสียงของ Discord ได้
- `channels.discord.voice.daveEncryption` (ค่าเริ่มต้น `true`) และ `channels.discord.voice.decryptionFailureTolerance` (ค่าเริ่มต้น `24`) จะส่งต่อไปยังตัวเลือก DAVE ของ `@discordjs/voice`
- `channels.discord.voice.connectTimeoutMs` ควบคุมระยะเวลารอ Ready ครั้งแรกของ `@discordjs/voice` สำหรับ `/vc join` และการพยายามเข้าร่วมอัตโนมัติ (ค่าเริ่มต้น `30000`)
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงซึ่งตัดการเชื่อมต่อสามารถใช้เพื่อเข้าสู่การส่งสัญญาณเชื่อมต่อใหม่ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (ค่าเริ่มต้น `15000`)
- การเล่นเสียงของ Discord จะไม่ถูกขัดจังหวะโดยเหตุการณ์เริ่มพูดของผู้ใช้อื่น เพื่อหลีกเลี่ยงลูปป้อนกลับ OpenClaw จะละเว้นการจับเสียงใหม่ระหว่างที่ TTS กำลังเล่น
- นอกจากนี้ OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจากแล้วกลับเข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำหลายครั้ง
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานแสดงในข้อความตัวอย่างที่แก้ไขเพียงข้อความเดียว ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน คีย์แบบแบนเดิม (`streamMode`, `chunkMode`, `blockStreaming`, `draftChunk`, `blockStreamingCoalesce`) จะไม่ถูกอ่านในรันไทม์อีกต่อไป ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายการกำหนดค่าที่บันทึกไว้
- `channels.discord.autoPresence` จับคู่ความพร้อมใช้งานของรันไทม์กับสถานะของบอต (ปกติ => ออนไลน์, เสื่อมประสิทธิภาพ => ไม่อยู่, หมดทรัพยากร => ห้ามรบกวน) และอนุญาตให้แทนที่ข้อความสถานะได้ตามต้องการ
- `channels.discord.guilds.<id>.presenceEvents` กำหนดเส้นทางการปรากฏตัวของผู้ใช้ที่พร้อมใช้งานไปยังช่อง Discord ที่กำหนดค่าไว้หนึ่งช่องในรูปแบบเหตุการณ์ระบบของเอเจนต์ สมาชิกที่มีสิทธิ์ต้องสามารถดู `channelId` ได้ เธรดสาธารณะรับช่วงการมองเห็นจากช่องหลัก ส่วนเธรดส่วนตัวยังต้องเป็นสมาชิกหรือมีสิทธิ์ Manage Threads เพิ่มเติม `users` สามารถจำกัดกลุ่มเป้าหมายนี้ให้แคบลงได้อีก ระบบจะตั้งต้นสมาชิกที่ออนไลน์อยู่ในปัจจุบันจากสแนปช็อต `GUILD_CREATE` ที่สมบูรณ์ กำหนดเส้นทางการเปลี่ยนสถานะจากออฟไลน์เป็นออนไลน์ที่ตรวจพบ และถือว่าสัญญาณออนไลน์ครั้งแรกในภายหลังของสมาชิกที่ไม่เคยเห็นหมายถึงพร้อมใช้งานใหม่ โดยไม่ยืนยันว่าพวกเขาออนไลน์ขึ้นมาหรือเข้าร่วมหลังจากสแนปช็อต กิลด์ที่มีสมาชิกเกินขีดจำกัดสแนปช็อต 75,000 คนของ Discord ต้องได้รับการอัปเดตสถานะออฟไลน์อย่างชัดเจนก่อน ตัวควบคุมการจำกัดอัตรา: `reconnectSuppressSeconds` (ช่วงเงียบหลังจากเซสชัน Gateway ใหม่ ขณะที่กำลังสร้างสถานะการปรากฏตัวของกิลด์ใหม่ ค่าเริ่มต้น 300 และ `0` ปิดใช้งาน) และ `burstLimit`/`burstWindowSeconds` (ขีดจำกัดอัตราเหตุการณ์ที่เข้าคิวสำเร็จต่อกิลด์ ค่าเริ่มต้น 8 เหตุการณ์ต่อกรอบเวลาเลื่อน 60 วินาที) เซสชันที่ดำเนินต่อจะไม่เริ่มช่วงระงับหลังการเชื่อมต่อใหม่ ช่วงพักการทักซ้ำต่อผู้ใช้ที่มีอยู่ยังคงเป็นแปดชั่วโมง คุณสมบัตินี้ต้องใช้ `channels.discord.intents.presence=true`, Presence Intent แบบมีสิทธิ์พิเศษใน Developer Portal ของ Discord และ Heartbeat ของเอเจนต์ที่เปิดใช้งาน
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้ฉุกเฉิน)
- `channels.discord.execApprovals`: การส่งคำขออนุมัติการดำเนินการแบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติการดำเนินการจะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: รหัสผู้ใช้ Discord ที่ได้รับอนุญาตให้อนุมัติคำขอดำเนินการ หากละไว้จะใช้ `commands.ownerAllowFrom` แทน
  - `agentFilter`: รายการอนุญาตรหัสเอเจนต์ที่เป็นตัวเลือกเสริม ละไว้เพื่อส่งต่อการอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันที่เป็นตัวเลือกเสริม (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งข้อความแจ้งขออนุมัติ `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง และ `"both"` ส่งไปยังทั้งสองแห่ง เมื่อเป้าหมายมี `"channel"` เฉพาะผู้อนุมัติที่ระบุได้เท่านั้นที่สามารถใช้ปุ่มได้
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือนปฏิกิริยา:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ข้อความทั้งหมด), `allowlist` (จาก `guilds.<id>.users` ในข้อความทั้งหมด)

### Google Chat

```json5
{
  channels: {
    googlechat: {
      enabled: true,
      serviceAccountFile: "/path/to/service-account.json",
      audienceType: "app-url", // URL ของแอป | หมายเลขโปรเจกต์
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
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` เป็นปลายทางการส่ง
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่พรินซิเพิลอีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้ฉุกเฉิน)

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
          systemPrompt: "ตอบแบบสั้นเท่านั้น",
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

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับการใช้ตัวแปรสภาพแวดล้อมของบัญชีเริ่มต้นเป็นทางเลือกสำรอง)
- **โหมด HTTP** ต้องใช้ `botToken` ร่วมกับ `signingSecret` (ที่ระดับรากหรือแยกตามบัญชี)
- **ข้อมูลประจำตัวผู้ใช้** (`identity: "user"`) โพสต์และอ่านในนามมนุษย์ผู้ให้สิทธิ์ ต้องใช้ `userToken` ร่วมกับ `appToken` ในโหมด Socket หรือ `userToken` ร่วมกับ `signingSecret` ในโหมด HTTP โดยไม่ต้องใช้โทเค็นบอตหรือผู้ใช้บอต ดูขอบเขตสิทธิ์ผู้ใช้และการสมัครรับเหตุการณ์ได้ที่ [ข้อมูลประจำตัวผู้ใช้](/th/channels/slack#user-identity-post-as-a-real-person)
- `enterpriseOrgInstall: true` กำหนดให้บัญชีเข้าร่วมเส้นทางเหตุการณ์ทั่วทั้งองค์กรของ Slack Enterprise Grid
  เมื่อเริ่มต้น ระบบจะตรวจสอบโทเค็นบอตด้วย `auth.test` และ
  ล้มเหลวเมื่อโหมดที่กำหนดค่าไม่ตรงกับข้อมูลประจำตัวการติดตั้งของ Slack
  ต้องปิดใช้ DM ระดับองค์กร หรือใช้ `dmPolicy: "open"` ร่วมกับ
  `allowFrom: ["*"]` ที่มีผลบังคับใช้ นโยบายช่องและผู้ใช้ต้องใช้ ID ของ Slack ที่คงที่
  ชื่อที่เปลี่ยนแปลงได้และคำนำหน้าช่องที่ไม่รองรับจะทำให้การเริ่มต้นล้มเหลว V1 รองรับเฉพาะ
  เหตุการณ์ `message` และ `app_mention` ผ่านโหมด Socket โดยตรงหรือ HTTP พร้อมการตอบกลับ
  ทันทีเท่านั้น โดยไม่มีรีเลย์ คำสั่ง การโต้ตอบ App Home ตัวรับฟังเหตุการณ์รีแอ็กชัน
  หมุด เครื่องมือดำเนินการ การอนุมัติแบบเนทีฟ การเชื่อมโยง การส่งแบบหน่วงเวลา และ
  การส่งเชิงรุก การตอบรับ ตัวบ่งชี้การพิมพ์ และรีแอ็กชันสถานะที่ตัวรับฟังเป็นเจ้าของ
  ยังคงใช้ได้กับ `reactions:write` แต่การแจ้งเตือนรีแอ็กชันขาเข้า
  และเครื่องมือดำเนินการรีแอ็กชันจะใช้ไม่ได้ ดู
  [การติดตั้งทั่วทั้งองค์กรของ Enterprise Grid](/th/channels/slack#enterprise-grid-org-wide-installs)
  สำหรับไฟล์ manifest ที่ใช้สิทธิ์น้อยที่สุด ขั้นตอนการตั้งค่า และข้อจำกัดทั้งหมด
- `socketMode` ส่งต่อการปรับแต่งการรับส่งข้อมูลโหมด Socket ของ Slack SDK ไปยัง API ตัวรับ Bolt สาธารณะ ใช้เฉพาะเมื่อตรวจสอบปัญหาการหมดเวลาของ ping/pong หรือพฤติกรรม websocket ที่ค้างอยู่เท่านั้น `clientPingTimeout` มีค่าเริ่มต้นเป็น `15000`; ระบบจะส่ง `serverPingTimeout` และ `pingPongLoggingEnabled` เฉพาะเมื่อมีการกำหนดค่า
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับสตริงข้อความธรรมดา
  หรือออบเจ็กต์ SecretRef
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะแยกตามข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `userTokenSource`, `userTokenStatus`,
  `appTokenStatus` และในโหมด HTTP คือ `signingSecretStatus`
  `configured_unavailable` หมายความว่าบัญชีได้รับ
  การกำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  แก้ไขค่าความลับได้
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มต้นจาก Slack
- `channels.slack.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับ ID บัญชีที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack (ค่าเริ่มต้น `"partial"`) `channels.slack.streaming.nativeTransport` ควบคุมการรับส่งข้อมูลการสตรีมแบบเนทีฟของ Slack (ค่าเริ่มต้น `true`) รันไทม์จะไม่อ่านค่าเดิม `streamMode`, ค่าบูลีน `streaming`, `chunkMode`, `blockStreaming`, `blockStreamingCoalesce` และ `nativeStreaming` อีกต่อไป ให้เรียกใช้ `openclaw doctor --fix` เพื่อย้ายการกำหนดค่าที่บันทึกไว้ไปยัง `streaming.{mode,chunkMode,block.enabled,block.coalesce,nativeTransport}`
- `unfurlLinks` และ `unfurlMedia` ส่งต่อค่าบูลีนสำหรับการคลี่ลิงก์และสื่อ `chat.postMessage` ของ Slack สำหรับการตอบกลับของบอต `unfurlLinks` มีค่าเริ่มต้นเป็น `false` เพื่อไม่ให้ลิงก์ขาออกของบอตขยายแบบอินไลน์เว้นแต่จะเปิดใช้ และจะละเว้น `unfurlMedia` เว้นแต่มีการกำหนดค่า ตั้งค่าใดค่าหนึ่งที่ `channels.slack.accounts.<accountId>` เพื่อแทนที่ค่าระดับบนสุดสำหรับบัญชีหนึ่งบัญชี
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` เป็นปลายทางการส่ง

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันเธรด:** `thread.historyScope` แยกตามเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั่วทั้งช่อง `thread.inheritParent` คัดลอกทรานสคริปต์ของช่องแม่ไปยังเธรดใหม่ `thread.initialHistoryLimit` (ค่าเริ่มต้น `20`) จำกัดจำนวนข้อความเธรดที่มีอยู่ซึ่งจะดึงมาเมื่อเซสชันเธรดใหม่เริ่มต้น ส่วน `0` ปิดใช้การดึงประวัติเธรด

- การสตรีมแบบเนทีฟของ Slack และสถานะเธรดแบบผู้ช่วย "กำลังพิมพ์..." ของ Slack ต้องมีเป้าหมายเป็นเธรดตอบกลับ โดยค่าเริ่มต้น DM ระดับบนสุดจะอยู่นอกเธรด จึงยังสามารถสตรีมผ่านตัวอย่างร่างโพสต์และแก้ไขของ Slack แทนการแสดงตัวอย่างสตรีม/สถานะแบบเนทีฟในรูปแบบเธรด
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้ข้อความ Slack ขาเข้าระหว่างที่กำลังสร้างคำตอบ แล้วนำออกเมื่อเสร็จสิ้น ใช้รหัสย่ออีโมจิ Slack เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่งผ่านไคลเอนต์การอนุมัติแบบเนทีฟของ Slack และการให้สิทธิ์ผู้อนุมัติการดำเนินการ ใช้สคีมาเดียวกับ Discord ได้แก่ `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`) การอนุมัติ Plugin สามารถใช้เส้นทางไคลเอนต์แบบเนทีฟนี้สำหรับคำขอที่มาจาก Slack เมื่อสามารถระบุผู้อนุมัติ Plugin ของ Slack ได้ และยังสามารถเปิดใช้การส่งการอนุมัติ Plugin แบบเนทีฟของ Slack ผ่าน `approvals.plugin` สำหรับเซสชันที่มาจาก Slack หรือเป้าหมาย Slack ได้ด้วย การอนุมัติ Plugin ใช้ผู้อนุมัติ Plugin ของ Slack จาก `allowFrom` และการกำหนดเส้นทางเริ่มต้น ไม่ใช่ผู้อนุมัติการดำเนินการ

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้ | เพิ่มรีแอ็กชัน + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้ | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้ | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้ | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้ | รายการอีโมจิที่กำหนดเอง      |

### Mattermost

Mattermost ติดตั้งเป็น Plugin แยกต่างหาก เช่นเดียวกับ Discord, Slack และ WhatsApp:

```bash
openclaw plugins install @openclaw/mattermost
```

ตรวจสอบ dist-tag ปัจจุบันที่ [npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost) ก่อนตรึงเวอร์ชัน

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
        native: true, // ต้องเลือกเปิดใช้
        nativeSkills: true,
        callbackPath: "/api/channels/mattermost/command",
        // URL แบบระบุชัดเจนซึ่งเป็นตัวเลือกเสริมสำหรับการติดตั้งผ่านพร็อกซีย้อนกลับ/สาธารณะ
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      streaming: { chunkMode: "length" },
    },
  },
}
```

โหมดแชต: `oncall` (ตอบเมื่อมีการกล่าวถึงด้วย @ ซึ่งเป็นค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้คำสั่งแบบเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (ตัวอย่างเช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้องชี้ไปยังเอนด์พอยต์ Gateway ของ OpenClaw และเซิร์ฟเวอร์ Mattermost ต้องเข้าถึงได้
- คอลแบ็กคำสั่งแบบสแลชเนทีฟได้รับการยืนยันตัวตนด้วยโทเค็นแยกตามคำสั่งที่
  Mattermost ส่งคืนระหว่างการลงทะเบียนคำสั่งแบบสแลช หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งใดเปิดใช้งาน OpenClaw จะปฏิเสธคอลแบ็กด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์คอลแบ็กแบบส่วนตัว/tailnet/ภายใน Mattermost อาจกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` ต้องมีโฮสต์/โดเมนของคอลแบ็ก
  ให้ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก Mattermost
- `channels.mattermost.requireMention`: กำหนดให้ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่ข้อกำหนดการกล่าวถึงแยกตามช่อง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับ ID บัญชีที่กำหนดค่าไว้

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การเชื่อมโยงบัญชีแบบตัวเลือกเสริม
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

- `channels.signal.account`: ตรึงการเริ่มต้นช่องไว้กับข้อมูลประจำตัวบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก Signal
- `channels.signal.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อตรงกับ ID บัญชีที่กำหนดค่าไว้

### iMessage

OpenClaw เรียกใช้ `imsg rpc` (JSON-RPC ผ่าน stdio) โดยไม่ต้องใช้ดีมอนหรือพอร์ต นี่คือเส้นทางที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อโฮสต์สามารถให้สิทธิ์เข้าถึงฐานข้อมูล Messages และสิทธิ์ Automation ได้

การรองรับ BlueBubbles ถูกนำออกแล้ว `channels.bluebubbles` ไม่ใช่พื้นผิวการกำหนดค่ารันไทม์ที่รองรับใน OpenClaw ปัจจุบัน ให้ย้ายการกำหนดค่าเก่าไปยัง `channels.imessage`; ดูฉบับย่อที่ [การนำ BlueBubbles ออกและเส้นทาง imsg สำหรับ iMessage](/th/announcements/bluebubbles-imessage) และดูตารางการแปลงฉบับเต็มที่ [การย้ายมาจาก BlueBubbles](/th/channels/imessage-from-bluebubbles)

หาก Gateway ไม่ได้ทำงานบน Mac ที่ลงชื่อเข้าใช้ Messages ให้คง `channels.imessage.enabled=true` ไว้และตั้งค่า `channels.imessage.cliPath` เป็นตัวครอบ SSH ที่เรียกใช้ `imsg "$@"` บน Mac เครื่องนั้น พาธ `imsg` ภายในเครื่องซึ่งเป็นค่าเริ่มต้นรองรับเฉพาะ macOS เท่านั้น

ก่อนใช้ SSH wrapper สำหรับการส่งในระบบใช้งานจริง ให้ตรวจสอบการส่งออก `imsg send` ผ่าน wrapper เดียวกันนั้น บางสถานะ TCC ของ macOS กำหนดสิทธิ์ Messages Automation ให้กับ `/usr/libexec/sshd-keygen-wrapper` ซึ่งอาจทำให้การอ่านและการตรวจสอบทำงานได้ แต่การส่งล้มเหลวด้วย AppleEvents `-1743`; โปรดดูส่วนการแก้ไขปัญหา SSH wrapper ใน [iMessage](/th/channels/imessage)

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

- `channels.imessage.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- ต้องมีสิทธิ์ Full Disk Access สำหรับฐานข้อมูล Messages
- ควรใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบคีย์โฮสต์อย่างเข้มงวด ดังนั้นโปรดตรวจสอบว่าคีย์ของโฮสต์รีเลย์มีอยู่ใน `~/.ssh/known_hosts` แล้ว
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนการกำหนดค่าที่เริ่มต้นจาก iMessage
- `channels.imessage.sendTransport`: ทรานสปอร์ตการส่ง RPC ของ `imsg` ที่ต้องการสำหรับการตอบกลับขาออกตามปกติ `auto` (ค่าเริ่มต้น) ใช้บริดจ์ IMCore สำหรับแชตที่มีอยู่เมื่อบริดจ์กำลังทำงาน แล้วจึงย้อนกลับไปใช้ AppleScript; `bridge` ต้องใช้การส่งผ่าน API ส่วนตัว; `applescript` บังคับใช้เส้นทางระบบอัตโนมัติสาธารณะของ Messages
- `channels.imessage.actions.*`: เปิดใช้การดำเนินการผ่าน API ส่วนตัว ซึ่งยังถูกควบคุมโดย `imsg status` / `openclaw channels status --probe` ด้วย
- `channels.imessage.includeAttachments` ปิดอยู่ตามค่าเริ่มต้น; ตั้งค่าเป็น `true` ก่อนคาดหวังให้มีสื่อขาเข้าในเทิร์นของเอเจนต์
- การกู้คืนข้อความขาเข้าหลังรีสตาร์ตบริดจ์/Gateway เป็นไปโดยอัตโนมัติ (การขจัดรายการซ้ำด้วย GUID พร้อมขอบเขตอายุของงานค้างเก่า) การกำหนดค่า `channels.imessage.catchup.enabled: true` ที่มีอยู่ยังคงได้รับการรองรับในฐานะโปรไฟล์ความเข้ากันได้ที่เลิกใช้แล้ว; `catchup` ปิดใช้งานตามค่าเริ่มต้น
- `channels.imessage.groups`: รีจิสทรีกลุ่มและการตั้งค่ารายกลุ่ม เมื่อใช้ `groupPolicy: "allowlist"` ให้กำหนดค่าคีย์ `chat_id` แบบระบุชัดเจน หรือรายการไวลด์การ์ด `"*"` เพื่อให้ข้อความกลุ่มผ่านเกตรีจิสทรีได้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบคงอยู่ได้ ใช้แฮนเดิลที่ปรับรูปแบบแล้วหรือเป้าหมายแชตแบบระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง SSH wrapper ของ iMessage">

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
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุไว้ บัญชีที่มีชื่อสามารถแทนที่ค่านี้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการเลือกรับเครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `"off"` ดังนั้นห้องที่ได้รับคำเชิญและคำเชิญใหม่ในรูปแบบ DM จะถูกละเว้นจนกว่าจะตั้งค่า `autoJoin: "allowlist"` ด้วย `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำขออนุมัติการดำเนินการแบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติการดำเนินการจะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอดำเนินการ
  - `agentFilter`: รายการอนุญาต ID เอเจนต์แบบเลือกได้ หากละไว้ ระบบจะส่งต่อคำขออนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบเลือกได้ (สตริงย่อยหรือนิพจน์ทั่วไป)
  - `target`: ตำแหน่งที่จะส่งพรอมต์ขออนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนค่ารายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีจัดกลุ่ม DM ของ Matrix เป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้เซสชันร่วมกันตามเพียร์ที่กำหนดเส้นทาง ขณะที่ `per-room` แยกห้อง DM แต่ละห้องออกจากกัน
- การตรวจสอบสถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้นโยบายพร็อกซีเดียวกับทราฟฟิกขณะทำงาน
- การกำหนดค่า Matrix ฉบับเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีอธิบายไว้ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับผ่าน Plugin และกำหนดค่าภายใต้ `channels.msteams`

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

- พาธคีย์หลักที่กล่าวถึงในส่วนนี้: `channels.msteams`, `channels.msteams.configWrites`
- การกำหนดค่า Teams ฉบับเต็ม (ข้อมูลประจำตัว, Webhook, นโยบาย DM/กลุ่ม, การแทนค่ารายทีม/รายช่อง) มีอธิบายไว้ใน [Microsoft Teams](/th/channels/msteams)

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

- พาธคีย์หลักที่กล่าวถึงในส่วนนี้: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` ซึ่งเป็นตัวเลือกเสริม จะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่อง IRC ฉบับเต็ม (โฮสต์/พอร์ต/TLS/ช่อง/รายการอนุญาต/เกตการกล่าวถึง) มีอธิบายไว้ใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อละ `accountId` (CLI + การกำหนดเส้นทาง)
- โทเค็นจากตัวแปรสภาพแวดล้อมใช้กับบัญชี **เริ่มต้น** เท่านั้น
- การตั้งค่าพื้นฐานของช่องใช้กับทุกบัญชี เว้นแต่จะถูกแทนค่ารายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยังเอเจนต์ที่ต่างกัน
- หากเพิ่มบัญชีที่ไม่ใช่บัญชีเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่อง) ขณะที่ยังใช้การกำหนดค่าช่องระดับบนสุดแบบบัญชีเดียว OpenClaw จะย้ายค่าระดับบนสุดแบบบัญชีเดียวที่มีขอบเขตบัญชีเข้าไปในแมปบัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังคงทำงานได้ ช่องส่วนใหญ่ย้ายค่าเหล่านั้นเข้าไปใน `channels.<channel>.accounts.default`; Matrix สามารถรักษาเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันและมีอยู่แล้วไว้แทน
- การผูกเฉพาะช่องที่มีอยู่ (ไม่มี `accountId`) ยังคงจับคู่กับบัญชีเริ่มต้น; การผูกที่มีขอบเขตบัญชียังคงเป็นตัวเลือกเสริม
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบผสมด้วยการย้ายค่าระดับบนสุดแบบบัญชีเดียวที่มีขอบเขตบัญชีไปยังบัญชีที่เลื่อนระดับซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถรักษาเป้าหมายที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันและมีอยู่แล้วไว้แทน

### ช่อง Plugin อื่นๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องเฉพาะของแต่ละช่อง (ตัวอย่างเช่น Feishu, LINE, Nextcloud Talk, Nostr, QQ Bot, Synology Chat, Twitch และ Zalo)
ดูดัชนีช่องฉบับเต็ม: [ช่อง](/th/channels)

### เกตการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องกล่าวถึง** (การกล่าวถึงผ่านข้อมูลเมตาหรือรูปแบบนิพจน์ทั่วไปที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ควบคุมแยกต่างหาก คำขอโดยตรงจากกลุ่ม ช่อง และ WebChat ภายในตามปกติมีค่าเริ่มต้นเป็นการส่งผลลัพธ์สุดท้ายโดยอัตโนมัติ: ข้อความสุดท้ายของผู้ช่วยจะถูกโพสต์ผ่านเส้นทางการตอบกลับที่มองเห็นได้แบบเดิม เลือกใช้ `messages.visibleReplies: "message_tool"` หรือ `messages.groupChat.visibleReplies: "message_tool"` เมื่อการตอบกลับต้นทางที่โมเดลสร้างควรถูกโพสต์หลังจากเอเจนต์เรียก `message(action=send)` แล้วเท่านั้น หากโมเดลส่งคืนคำตอบสุดท้ายที่มีเนื้อหาสาระโดยไม่เรียกเครื่องมือข้อความในโหมดเฉพาะเครื่องมือที่เลือกใช้ ข้อความสุดท้ายนั้นจะยังคงเป็นส่วนตัว บันทึกแบบละเอียดของ Gateway จะบันทึกข้อมูลเมตาของเพย์โหลดที่ถูกระงับ และ OpenClaw จะจัดคิวการลองกู้คืนหนึ่งครั้งเพื่อขอให้โมเดลส่งคำตอบเดิมผ่าน `message(action=send)`

นโยบายเฉพาะเครื่องมือควบคุมการตอบกลับต้นทางของผู้ช่วยและสื่อจากเครื่องมือทั่วไป โดยไม่ระงับเอาต์พุตปลายทางที่รันไทม์เป็นเจ้าของ เช่น การตอบกลับคำสั่งที่ได้รับอนุญาต การแจ้งเตือนการเสร็จสิ้นแบบคงอยู่ หรืออาร์ติแฟกต์เนทีฟของผู้ให้บริการที่ชุดควบคุมซึ่งเป็นเจ้าของจัดประเภทไว้อย่างชัดเจนว่าโฮสต์เป็นเจ้าของ อาร์ติแฟกต์ที่โฮสต์เป็นเจ้าของจะถูกส่งผ่านเส้นทางการส่งต่อช่องตามปกติ และยังคงเคารพการปฏิเสธขาออก `sendPolicy` เทิร์น `room_event` แบบแวดล้อมจะยังคงเงียบ เว้นแต่เป็นคำสั่งที่ระบุชัดเจน แม้ว่าเอาต์พุตรันไทม์จะถูกทำเครื่องหมายว่าโฮสต์เป็นเจ้าของก็ตาม

การตอบกลับที่มองเห็นได้แบบเฉพาะเครื่องมือต้องใช้โมเดล/รันไทม์ที่เรียกเครื่องมือได้อย่างเชื่อถือได้ และแนะนำสำหรับห้องแวดล้อมที่ใช้ร่วมกันบนโมเดลรุ่นล่าสุด เช่น GPT-5.6 Sol โมเดลที่ด้อยกว่าบางรุ่นสามารถตอบด้วยข้อความสุดท้ายได้ แต่ไม่เข้าใจว่าต้องส่งเอาต์พุตที่มองเห็นได้จากต้นทางด้วย `message(action=send)` OpenClaw กู้คืนกรณีทั่วไปที่คำตอบสุดท้ายติดค้างตามค่าเริ่มต้นเฉพาะเมื่อคำตอบสุดท้ายมีเนื้อหาสาระ เทิร์นต้นทางไม่ใช่เหตุการณ์ในห้อง นโยบายการส่งไม่ได้ปฏิเสธการส่ง และยังไม่มีการส่งคำตอบต้นทาง การกู้คืนจำกัดไว้ที่การลองใหม่หนึ่งครั้ง; ระบบจะระงับการคงอยู่สำหรับพรอมต์ลองใหม่สังเคราะห์ และไม่นำการลองใหม่นั้นเข้าไปรวมในแบตช์การรวบรวม เพื่อไม่ให้รวมกับพรอมต์ในคิวอื่นที่ไม่เกี่ยวข้อง หากการลองใหม่ยังคงติดค้างหรือไม่สามารถเข้าคิวได้ OpenClaw จะส่งเฉพาะข้อความวินิจฉัยที่ผ่านการกรองแล้ว เช่น "ฉันสร้างคำตอบแล้วแต่ไม่สามารถส่งไปยังแชตนี้ได้ โปรดลองอีกครั้ง" ข้อความสุดท้ายส่วนตัวต้นฉบับจะไม่ถูกทำเครื่องหมายให้ส่งไปยังต้นทางโดยอัตโนมัติ สำหรับโมเดลที่ทำให้คำตอบติดค้างซ้ำๆ ให้ใช้ `"automatic"` เพื่อให้เทิร์นสุดท้ายของผู้ช่วยเป็นเส้นทางการตอบกลับที่มองเห็นได้ เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่า ตรวจสอบบันทึกแบบละเอียดของ Gateway เพื่อดูสรุปเพย์โหลดที่ถูกระงับ หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อใช้การตอบกลับสุดท้ายที่มองเห็นได้สำหรับทุกคำขอจากกลุ่ม/ช่อง

หากเครื่องมือส่งข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะเปลี่ยนไปใช้การตอบกลับที่มองเห็นได้โดยอัตโนมัติแทนการระงับการตอบกลับโดยไม่แจ้งให้ทราบ `openclaw doctor` จะเตือนเกี่ยวกับความไม่สอดคล้องนี้

กฎนี้ใช้กับข้อความสุดท้ายตามปกติของเอเจนต์ การเชื่อมโยงบทสนทนาที่ Plugin เป็นเจ้าของจะใช้การตอบกลับที่ Plugin เจ้าของส่งคืนเป็นการตอบกลับที่มองเห็นได้สำหรับเทิร์นของเธรดที่เชื่อมโยงซึ่งถูกรับไปจัดการ โดย Plugin ไม่จำเป็นต้องเรียก `message(action=send)` สำหรับการตอบกลับจากการเชื่อมโยงเหล่านั้น

**การแก้ไขปัญหา: การ @mention ในกลุ่มทำให้แสดงสถานะกำลังพิมพ์แล้วเงียบ (ไม่มีข้อผิดพลาด)**

อาการ: การ @mention ในกลุ่ม/ช่องแสดงตัวบ่งชี้กำลังพิมพ์ และบันทึกของ Gateway รายงาน `dispatch complete (queuedFinal=false, replies=0)` แต่ไม่มีข้อความส่งถึงห้อง ขณะที่ DM ถึงเอเจนต์เดียวกันได้รับการตอบกลับตามปกติ

สาเหตุ: โหมดการตอบกลับที่มองเห็นได้ของกลุ่ม/ช่องถูกกำหนดเป็น `"message_tool"` ดังนั้น OpenClaw จึงเรียกใช้เทิร์นแต่ระงับข้อความสุดท้ายของผู้ช่วย เว้นแต่เอเจนต์จะเรียก `message(action=send)` โหมดนี้ไม่มีสัญญา `NO_REPLY` การไม่เรียกเครื่องมือส่งข้อความหมายความว่าข้อความสุดท้ายเดิมเป็นส่วนตัว สำหรับเทิร์นต้นทางที่มีเนื้อหาสำคัญ ขณะนี้ OpenClaw จะพยายามกู้คืนซ้ำแบบมีการป้องกันหนึ่งครั้ง ส่วนบันทึกสั้น ๆ การระบุให้เงียบอย่างชัดเจน เหตุการณ์ในห้อง เทิร์นที่ถูกปฏิเสธโดยนโยบายการส่ง และเทิร์นที่ส่งแล้ว จะไม่ถูกลองซ้ำ เทิร์นกลุ่มและช่องตามปกติมีค่าเริ่มต้นเป็น `"automatic"` ดังนั้นอาการนี้จะปรากฏเฉพาะเมื่อกำหนด `messages.groupChat.visibleReplies` (หรือ `messages.visibleReplies` ส่วนกลาง) เป็น `"message_tool"` อย่างชัดเจน `defaultVisibleReplies` ของชุดทดสอบไม่ใช้ในกรณีนี้ — ตัวแก้ค่าของกลุ่ม/ช่องจะไม่สนใจค่านี้ โดยมีผลเฉพาะกับแชตโดยตรง/แชตต้นทางเท่านั้น (ชุดทดสอบ Codex ใช้วิธีนี้เพื่อระงับข้อความสุดท้ายของแชตโดยตรง)

วิธีแก้: เลือกโมเดลที่เรียกเครื่องมือได้ดีกว่า นำการแทนที่ `"message_tool"` ที่กำหนดไว้อย่างชัดเจนออกเพื่อกลับไปใช้ค่าเริ่มต้น `"automatic"` หรือกำหนด `messages.groupChat.visibleReplies: "automatic"` เพื่อบังคับให้ทุกคำขอของกลุ่ม/ช่องมีการตอบกลับที่มองเห็นได้ ข้อความสุดท้ายที่มีเนื้อหาสำคัญซึ่งตกค้างไม่ควรจบลงด้วยความสำเร็จแบบเงียบอีกต่อไป โดยควรกู้คืนผ่านการลองซ้ำ `message(action=send)` หนึ่งครั้ง หรือแสดงข้อความวินิจฉัยความล้มเหลวในการส่งที่ผ่านการทำให้ปลอดภัยแล้ว Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบทันทีหลังบันทึกไฟล์ ให้รีสตาร์ต Gateway เฉพาะเมื่อปิดใช้งานการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ในการนำไปใช้งานเท่านั้น

**ประเภทของการกล่าวถึง:**

- **การกล่าวถึงผ่านเมทาดาทา**: การ @mention แบบเนทีฟของแพลตฟอร์ม ระบบจะไม่สนใจในโหมดแชตกับตนเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบนิพจน์ทั่วไปที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` ระบบจะไม่สนใจรูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนที่ไม่ปลอดภัย
- การควบคุมด้วยการกล่าวถึงจะบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (การกล่าวถึงแบบเนทีฟหรือมีอย่างน้อยหนึ่งรูปแบบ)

```json5
{
  messages: {
    visibleReplies: "automatic", // บังคับใช้การตอบกลับสุดท้ายอัตโนมัติแบบเก่าสำหรับแชตโดยตรง/แชตต้นทาง
    groupChat: {
      historyLimit: 50,
      unmentionedInbound: "room_event", // การสนทนาในห้องแบบเปิดตลอดที่ไม่ได้กล่าวถึงจะกลายเป็นบริบทแบบเงียบ
      visibleReplies: "message_tool", // ต้องเลือกใช้; กำหนดให้ใช้ message(action=send) สำหรับการตอบกลับในห้องที่มองเห็นได้
    },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` กำหนดค่าเริ่มต้นส่วนกลาง ช่องสามารถแทนที่ด้วย `channels.<channel>.historyLimit` (หรือกำหนดแยกตามบัญชี) กำหนด `0` เพื่อปิดใช้งาน

`messages.groupChat.unmentionedInbound: "room_event"` ส่งข้อความกลุ่ม/ช่องแบบเปิดตลอดที่ไม่ได้กล่าวถึงเป็นบริบทห้องแบบเงียบในช่องที่รองรับ ข้อความที่มีการกล่าวถึง คำสั่ง และข้อความโดยตรงยังคงเป็นคำขอของผู้ใช้ ดูตัวอย่าง Discord, Slack และ Telegram แบบครบถ้วนได้ที่ [เหตุการณ์ห้องแวดล้อม](/th/channels/ambient-room-events)

`messages.visibleReplies` เป็นค่าเริ่มต้นของเหตุการณ์ต้นทางส่วนกลาง ส่วน `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับเหตุการณ์ต้นทางจากกลุ่ม/ช่อง เมื่อไม่ได้กำหนด `messages.visibleReplies` แชตโดยตรง/แชตต้นทางจะใช้ค่าเริ่มต้นของรันไทม์หรือชุดทดสอบที่เลือก แต่เทิร์นโดยตรงของ WebChat ภายในจะใช้การส่งข้อความสุดท้ายอัตโนมัติเพื่อให้พรอมต์ของ Pi/Codex สอดคล้องกัน กำหนด `messages.visibleReplies: "message_tool"` เพื่อตั้งใจบังคับให้ใช้ `message(action=send)` สำหรับเอาต์พุตที่มองเห็นได้ รายการอนุญาตของช่องและการควบคุมด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่าจะประมวลผลเหตุการณ์หรือไม่

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

ลำดับการกำหนดค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่จำกัด (เก็บไว้ทั้งหมด)

ตัวแก้ค่านี้อ่าน `channels.<provider>.dmHistoryLimit` และ `channels.<provider>.dms.<id>.historyLimit` สำหรับทุกช่องที่คีย์เซสชันเป็นไปตามรูปแบบมาตรฐาน `provider:direct:<id>` (หรือรูปแบบเดิม `provider:dm:<id>`) จึงทำงานได้กับทั้งช่องที่รวมมาให้และช่องจาก Plugin ไม่ได้จำกัดอยู่เพียงรายการที่กำหนดไว้ตายตัว

#### โหมดแชตกับตนเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมดแชตกับตนเอง (ไม่สนใจการ @mention แบบเนทีฟ และตอบสนองเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัวและที่รวมมาให้ในปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่อง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าของช่อง/Plugin นั้น ๆ รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความ **เดี่ยวแยกต่างหาก** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งแบบเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- `nativeSkills: "auto"` เปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปิดไว้สำหรับ Slack
- แทนค่ารายช่องด้วย: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนและการล้างคำสั่งแบบเนทีฟระหว่างเริ่มต้นระบบ
- แทนค่าการลงทะเบียน Skills แบบเนทีฟรายช่องด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียน `/config set|unset` แบบถาวรต้องมี `operator.admin` ด้วย ส่วน `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ผู้ดำเนินการทั่วไปที่มีขอบเขตการเขียน
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ควบคุมการแก้ไขการกำหนดค่ารายช่อง (ค่าเริ่มต้น: true)
- สำหรับช่องที่มีหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่มีเป้าหมายเป็นบัญชีนั้นด้วย (ตัวอย่างเช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้ `/restart` และคำขอรีสตาร์ต `SIGUSR1` จากภายนอก ค่าเริ่มต้น: `true`
- `ownerAllowFrom` เป็นรายการอนุญาตของเจ้าของที่ระบุอย่างชัดเจนสำหรับคำสั่งที่ใช้ได้เฉพาะเจ้าของและการดำเนินการของช่องที่จำกัดเฉพาะเจ้าของ โดยแยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมต์ระบบ กำหนด `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` กำหนดแยกตามผู้ให้บริการ เมื่อตั้งค่าแล้ว ค่านี้จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (ระบบจะไม่สนใจรายการอนุญาต/การจับคู่ของช่องและ `useAccessGroups`)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้กำหนด `allowFrom`
- แผนผังเอกสารคำสั่ง:
  - แค็ตตาล็อกในตัวและที่รวมมาให้: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่อง: [ช่อง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - Dreaming ของหน่วยความจำ: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่อง](/th/channels)
