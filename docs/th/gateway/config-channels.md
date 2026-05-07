---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าแยกตามช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว นโยบายกลุ่ม หรือการควบคุมด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์แยกตามแต่ละช่องทางใน Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-07T01:52:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f94d41a347ade8b9447e9f31e48d46830b2faac2202823480a68b7986107176e
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าต่อช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การควบคุมด้วยการ mention, และคีย์ต่อช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางที่รวมมาอื่น ๆ

สำหรับ agent, เครื่องมือ, รันไทม์ Gateway และคีย์ระดับบนอื่น ๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้นอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (default) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือที่เก็บ allow ของการจับคู่)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | เพิกเฉยต่อ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (default) | เฉพาะกลุ่มที่ตรงกับ allowlist ที่กำหนดค่าไว้          |
| `open`                | ข้าม allowlist ของกลุ่ม (การควบคุมด้วย mention ยังมีผลอยู่) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของ provider
รหัสจับคู่หมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง**
หากไม่มีบล็อก provider ทั้งหมด (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มของรันไทม์จะย้อนกลับไปใช้ `allowlist` (ปิดไว้ก่อนเมื่อผิดพลาด) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องทางเฉพาะกับโมเดล ค่าใช้ได้ทั้ง `provider/model` หรือ alias โมเดลที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อ session ยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับพฤติกรรมนโยบายกลุ่มและ Heartbeat ที่ใช้ร่วมกันข้าม provider:

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

- `channels.defaults.groupPolicy`: นโยบายกลุ่มสำรองเมื่อไม่ได้ตั้งค่า `groupPolicy` ระดับ provider
- `channels.defaults.contextVisibility`: โหมดการมองเห็น context เสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น รวม context ทั้งหมดจาก quote/thread/history), `allowlist` (รวมเฉพาะ context จากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่เก็บ context ของ quote/reply ที่ระบุชัดเจนไว้) การแทนที่ต่อช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะเสื่อมคุณภาพ/ผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้ขนาดกะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) โดยจะเริ่มโดยอัตโนมัติเมื่อมี session ที่ลิงก์อยู่

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมีอยู่ มิฉะนั้นจะใช้ id บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวเดิมจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
- การแทนที่ต่อบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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

- โทเค็นบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ไฟล์ปกติเท่านั้น; ไม่รับ symlink) โดยมี `TELEGRAM_BOT_TOKEN` เป็นตัวสำรองสำหรับบัญชีเริ่มต้น
- `apiRoot` คือรูท Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือรูท self-hosted/proxy ของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบ suffix `/bot<TOKEN>` ที่ต่อท้ายมาโดยไม่ตั้งใจ
- `channels.telegram.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (id บัญชี 2+ รายการ) ให้ตั้งค่าเริ่มต้นที่ชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Telegram (การย้าย ID supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่า binding ACP แบบถาวรสำหรับหัวข้อ forum (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- พรีวิวสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ทั้งในแชตโดยตรงและแชตกลุ่ม)
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็นค่าทดแทนสำหรับบัญชีเริ่มต้น.
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น; การตั้งค่าการลองใหม่/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่.
- `channels.discord.defaultAccount` ที่เป็นทางเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง; รหัสตัวเลขล้วนจะถูกปฏิเสธ.
- slug ของกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อที่แปลงเป็น slug แล้ว (ไม่มี `#`). ควรใช้รหัสกิลด์.
- ข้อความที่เขียนโดยบอทจะถูกละเว้นตามค่าเริ่มต้น. `allowBots: true` เปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น (ยังคงกรองข้อความของตัวเอง).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here).
- `channels.discord.mentionAliases` จับคู่ข้อความขาออก `@handle` ที่เสถียรกับรหัสผู้ใช้ Discord ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่. การแทนที่รายบัญชีอยู่ภายใต้ `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) แยกข้อความที่สูงออกแม้จะต่ำกว่า 2000 อักขระ.
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ของ Discord สำหรับฟีเจอร์เซสชันแบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ของ Discord สำหรับการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ของ Discord สำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติจากการสร้างเธรด ACP (`true` ตามค่าเริ่มต้น)
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟสำหรับการสร้างที่ผูกกับเธรด (`"fork"` ตามค่าเริ่มต้น)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่าการผูก ACP แบบถาวรสำหรับช่องและเธรด (ใช้รหัสช่อง/เธรดใน `match.peer.id`). ความหมายของฟิลด์ใช้ร่วมกันใน [เอเจนต์ ACP](/th/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2.
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการแทนที่ auto-join + LLM + TTS ที่เป็นทางเลือก. การกำหนดค่า Discord แบบข้อความอย่างเดียวจะปิดเสียงตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกใช้.
- `channels.discord.voice.model` จะแทนที่โมเดล LLM ที่ใช้สำหรับการตอบสนองในช่องเสียง Discord ได้ถ้ามี.
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น).
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (`30000` ตามค่าเริ่มต้น).
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ถูกตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่สัญญาณการเชื่อมต่อใหม่ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (`15000` ตามค่าเริ่มต้น).
- OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังเกิดความล้มเหลวในการถอดรหัสซ้ำ ๆ.
- `channels.discord.streaming` เป็นคีย์โหมดสตรีมแบบบัญญัติ. Discord ใช้ค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความตัวอย่างที่แก้ไขหนึ่งข้อความ; ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน. ค่า `streamMode` แบบเดิมและค่า `streaming` แบบบูลีนยังคงเป็น alias ระดับรันไทม์; เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่.
- `channels.discord.autoPresence` จับคู่ความพร้อมใช้งานของรันไทม์กับสถานะบอท (ปกติ => ออนไลน์, เสื่อมประสิทธิภาพ => ไม่ได้ใช้งาน, หมดโควตา => ห้ามรบกวน) และอนุญาตให้แทนที่ข้อความสถานะได้ถ้ามี.
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน).
- `channels.discord.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Discord และการอนุญาตผู้อนุมัติ.
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น). ในโหมดอัตโนมัติ คำอนุมัติ exec จะทำงานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้.
  - `approvers`: รหัสผู้ใช้ Discord ที่ได้รับอนุญาตให้อุนุมัติคำขอ exec. ถ้าไม่ระบุ จะถอยไปใช้ `commands.ownerAllowFrom`.
  - `agentFilter`: allowlist รหัสเอเจนต์ที่เป็นทางเลือก. ไม่ต้องระบุเพื่อส่งต่อคำอนุมัติสำหรับเอเจนต์ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันที่เป็นทางเลือก (สตริงย่อยหรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ. `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปยังทั้งสองที่. เมื่อเป้าหมายรวม `"channel"` ปุ่มจะใช้ได้เฉพาะโดยผู้อนุมัติที่ระบุได้เท่านั้น.
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM อนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา.

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ข้อความทั้งหมด), `allowlist` (จาก `guilds.<id>.users` ในข้อความทั้งหมด).

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

- JSON ของบัญชีบริการ: แบบอินไลน์ (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`).
- รองรับ SecretRef ของบัญชีบริการด้วย (`serviceAccountRef`).
- ค่าทดแทนจาก env: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง.
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน).

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

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับค่าทดแทน env ของบัญชีเริ่มต้น).
- **โหมด HTTP** ต้องใช้ `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี).
- `socketMode` ส่งผ่านการปรับแต่งการขนส่ง Slack SDK Socket Mode ไปยัง API ตัวรับ Bolt สาธารณะ. ใช้เฉพาะเมื่อกำลังตรวจสอบ timeout ของ ping/pong หรือพฤติกรรม websocket ที่ค้าง.
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริง plaintext
  หรือออบเจ็กต์ SecretRef.
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะรายข้อมูลประจำตัว เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus`. `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้.
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Slack.
- `channels.slack.defaultAccount` ที่เป็นทางเลือกจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้.
- `channels.slack.streaming.mode` เป็นคีย์โหมดสตรีม Slack แบบบัญญัติ. `channels.slack.streaming.nativeTransport` ควบคุมการขนส่งสตรีมมิงเนทีฟของ Slack. ค่า `streamMode` แบบเดิม, ค่า `streaming` แบบบูลีน และค่า `nativeStreaming` ยังเป็น alias ระดับรันไทม์; เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง.

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`).

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นรายเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่อง. `thread.inheritParent` คัดลอก transcript ของช่องหลักไปยังเธรดใหม่.

- สตรีมมิงเนทีฟของ Slack พร้อมสถานะเธรดแบบผู้ช่วยของ Slack ที่ว่า "กำลังพิมพ์..." ต้องใช้เป้าหมายเธรดตอบกลับ. DM ระดับบนสุดยังอยู่นอกเธรดตามค่าเริ่มต้น จึงยังสามารถสตรีมผ่านตัวอย่างแบบโพสต์ฉบับร่างแล้วแก้ไขของ Slack แทนการแสดงตัวอย่างสตรีม/สถานะแบบเธรดเนทีฟ.
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวไปยังข้อความ Slack ขาเข้าระหว่างที่กำลังตอบกลับ จากนั้นลบออกเมื่อเสร็จสิ้น. ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Slack และการอนุญาตผู้อนุมัติ. ใช้สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (รหัสผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`).

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | React + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ         |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก            |
| emojiList    | เปิดใช้งาน | รายการอีโมจิกำหนดเอง      |

### Mattermost

Mattermost จัดส่งเป็น Plugin ที่ bundled ใน OpenClaw รุ่นปัจจุบัน. บิลด์ที่เก่ากว่าหรือ
กำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost`. ตรวจสอบ
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
สำหรับ dist-tags ปัจจุบันก่อน pin เวอร์ชัน.

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

โหมดแชต: `oncall` (ตอบกลับเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้คำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL เต็ม
- `commands.callbackUrl` ต้องชี้ไปยัง endpoint ของ OpenClaw gateway และเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- คอลแบ็ก slash แบบเนทีฟจะตรวจสอบสิทธิ์ด้วยโทเค็นรายคำสั่งที่ Mattermost ส่งกลับระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลวหรือไม่มีคำสั่งใดถูกเปิดใช้ OpenClaw จะปฏิเสธคอลแบ็กด้วย `Unauthorized: invalid command token.`
- สำหรับโฮสต์คอลแบ็กแบบส่วนตัว/tailnet/ภายใน Mattermost อาจต้องให้ `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนคอลแบ็กไว้ด้วย ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL เต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่องทาง
- `channels.mattermost.groups.<channelId>.requireMention`: การ override การควบคุมด้วยการกล่าวถึงรายช่องทาง (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

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

- `channels.signal.account`: ตรึงการเริ่มต้นช่องทางไว้กับตัวตนบัญชี Signal ที่เฉพาะเจาะจง
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles เป็นบริดจ์ iMessage รุ่นเดิม (รองรับด้วย Plugin, กำหนดค่าภายใต้ `channels.bluebubbles`) การตั้งค่าที่มีอยู่ยังคงรองรับอยู่ แต่การปรับใช้ OpenClaw iMessage ใหม่ควรเลือกใช้ `channels.imessage` เมื่อ `imsg` สามารถทำงานบนโฮสต์ Messages ได้

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
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles กับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิล BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- การกำหนดค่าช่องทาง BlueBubbles แบบเต็มและเหตุผลการเลิกใช้มีบันทึกไว้ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw เรียก `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต นี่คือแนวทางที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อโฮสต์สามารถให้สิทธิ์ฐานข้อมูล Messages และ Automation ได้

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้

- ต้องมี Full Disk Access ไปยัง DB ของ Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่าคีย์ของโฮสต์รีเลย์มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage กับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิลที่ทำให้เป็นรูปแบบมาตรฐานแล้วหรือเป้าหมายแชตแบบระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

```bash
#!/usr/bin/env bash
exec ssh -T gateway-host imsg "$@"
```

</Accordion>

### Matrix

Matrix รองรับด้วย Plugin และกำหนดค่าภายใต้ `channels.matrix`

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
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถ override ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver แบบส่วนตัว/ภายใน `proxy` และการเลือกเข้าร่วมเครือข่ายนี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญแบบ DM ใหม่จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Matrix และการให้สิทธิ์ผู้อนุมัติ
  - `enabled`: `true`, `false`, หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto คำอนุมัติ exec จะเปิดใช้เมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID agent แบบไม่บังคับ ละไว้เพื่อส่งต่อคำอนุมัติสำหรับ agent ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง), หรือ `"both"`
  - การ override รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมว่า Matrix DM จะจัดกลุ่มเป็นเซสชันอย่างไร: `per-user` (ค่าเริ่มต้น) แชร์ตาม peer ที่กำหนดเส้นทาง ส่วน `per-room` แยกแต่ละห้อง DM
- การ probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบายพร็อกซีเดียวกับทราฟฟิก runtime
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีบันทึกไว้ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับด้วย Plugin และกำหนดค่าภายใต้ `channels.msteams`

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
- config ของ Teams แบบเต็ม (credentials, Webhook, นโยบาย DM/กลุ่ม, การ override รายทีม/รายช่องทาง) มีบันทึกไว้ใน [Microsoft Teams](/th/channels/msteams)

### IRC

IRC รองรับด้วย Plugin และกำหนดค่าภายใต้ `channels.irc`

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
- `channels.irc.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่องทาง IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) มีบันทึกไว้ใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การกำหนดเส้นทาง)
- โทเค็น env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูก override รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยัง agent คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ default ผ่าน `openclaw channels add` (หรือการ onboarding ช่องทาง) ขณะที่ยังอยู่บน config ช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะยกระดับค่าบัญชีเดียวระดับบนสุดที่อยู่ใน scope ของบัญชีเข้าไปในแมปบัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องทางส่วนใหญ่จะย้ายค่าเหล่านั้นไปยัง `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/default เดิมซึ่งตรงกันไว้แทนได้
- binding ที่มีอยู่แบบช่องทางเท่านั้น (ไม่มี `accountId`) ยังคงตรงกับบัญชี default; binding ที่อยู่ใน scope ของบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมแซมรูปทรงแบบผสมด้วยการย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ใน scope ของบัญชีเข้าไปในบัญชีที่ถูกยกระดับซึ่งเลือกไว้สำหรับช่องทางนั้น ช่องทางส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/default เดิมซึ่งตรงกันไว้แทนได้

### ช่องทาง Plugin อื่น ๆ

ช่องทาง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีบันทึกไว้ในหน้าช่องทางเฉพาะของตัวเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมด: [ช่องทาง](/th/channels)

### การควบคุมการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** (การกล่าวถึงแบบ metadata หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องทางมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผล turn นั้น แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมแบบเดิมที่โพสต์การตอบกลับปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; harness ของ Codex ก็ใช้พฤติกรรมแบบใช้เครื่องมือเท่านั้นนั้นเป็นค่าเริ่มต้นของแชตโดยตรงเมื่อไม่ได้ตั้งค่าเช่นกัน

การตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นต้องใช้โมเดล/runtime ที่เรียกเครื่องมือได้อย่างน่าเชื่อถือ หากบันทึกเซสชันแสดงข้อความ assistant ที่มี `didSendViaMessagingTool: false` แสดงว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนการเรียกเครื่องมือข้อความ ให้เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่าสำหรับช่องทางนั้น หรือตั้งค่า `messages.groupChat.visibleReplies: "automatic"` เพื่อคืนค่าการตอบกลับสุดท้ายที่มองเห็นได้แบบเดิม

หากเครื่องมือข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนการระงับการตอบกลับอย่างเงียบ ๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะโหลดค่ากำหนด `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์แล้ว รีสตาร์ตเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดค่ากำหนดใหม่ถูกปิดใช้งานในการติดตั้งใช้งาน

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงแบบเมตาดาตา**: การ @-mention แบบเนทีฟของแพลตฟอร์ม จะถูกละเว้นในโหมดแชตกับตัวเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนแบบไม่ปลอดภัยจะถูกละเว้น
- การบังคับใช้เงื่อนไขการกล่าวถึงจะทำเฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (การกล่าวถึงแบบเนทีฟหรือมีรูปแบบอย่างน้อยหนึ่งรายการ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง Channel สามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของเทิร์นจากแหล่งที่มา; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับเทิร์นจากแหล่งที่มาแบบกลุ่ม/Channel เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` harness สามารถให้ค่าเริ่มต้นของตัวเองสำหรับแชตโดยตรง/แหล่งที่มาได้; harness ของ Codex มีค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของ Channel และการบังคับใช้เงื่อนไขการกล่าวถึงยังคงเป็นตัวกำหนดว่าเทิร์นจะถูกประมวลผลหรือไม่

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

ลำดับการตัดสินค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้นการ @-mention แบบเนทีฟ และตอบกลับเฉพาะรูปแบบข้อความเท่านั้น):

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

<Accordion title="Command details">

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัวและที่มาพร้อมชุดปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์ค่ากำหนด** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ Channel/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้า Channel/Plugin ของคำสั่งนั้น ๆ รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวล้วน** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปิด Slack ไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปิด Slack ไว้
- แทนที่ราย Channel: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord ค่า `false` จะข้ามการลงทะเบียนคำสั่งเนทีฟและการล้างข้อมูลระหว่างเริ่มต้นระบบ
- แทนที่การลงทะเบียน Skills แบบเนทีฟราย Channel ด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้งาน `! <cmd>` สำหรับเชลล์ของโฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้งาน `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ Gateway `chat.send` การเขียน `/config set|unset` แบบถาวรต้องมี `operator.admin` ด้วย; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ตัวดำเนินการที่มีขอบเขตการเขียนตามปกติ
- `mcp: true` เปิดใช้งาน `/mcp` สำหรับค่ากำหนดเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้งาน `/plugins` สำหรับการค้นพบ Plugin การติดตั้ง และตัวควบคุมเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงค่ากำหนดราย Channel (ค่าเริ่มต้น: true)
- สำหรับ Channel หลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่มีเป้าหมายเป็นบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการทำงานของเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือเฉพาะเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นรายผู้ให้บริการ เมื่อตั้งค่าแล้ว จะเป็นแหล่งที่มาของการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของ Channel และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงได้เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัวและที่มาพร้อมชุด: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะ Channel: [Channel](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - Dreaming ของหน่วยความจำ: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงค่ากำหนด](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [ค่ากำหนด — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวม Channel](/th/channels)
