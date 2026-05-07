---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่ารายช่องทาง
    - การตรวจสอบนโยบายข้อความส่วนตัว นโยบายกลุ่ม หรือการควบคุมการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ และคีย์รายช่องทางใน Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่น ๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-05-07T13:17:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 10ff37f804fe3a2443372c4b195c00a4ee427ebd4c602bfb13e5040bddfaab93
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่ารายช่องภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม
การตั้งค่าหลายบัญชี การกำหนดให้ต้องเมนชัน และคีย์รายช่องสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องที่รวมมาด้วยอื่นๆ

สำหรับ agents, tools, runtime ของ gateway และคีย์ระดับบนสุดอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่อง

แต่ละช่องจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องนั้นอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM          | พฤติกรรม                                                       |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือ store อนุญาตที่จับคู่แล้ว)     |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องมี `allowFrom: ["*"]`)             |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                      |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับ allowlist ที่กำหนดค่าไว้          |
| `open`                | ข้าม allowlist ของกลุ่ม (การกำหนดให้ต้องเมนชันยังคงมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของ provider
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่อง**
หากไม่มีบล็อก provider อยู่เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มขณะรันไทม์จะย้อนกลับไปใช้ `allowlist` (fail-closed) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การแทนที่โมเดลของช่อง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องเฉพาะกับโมเดล ค่ารับรูปแบบ `provider/model` หรือนามแฝงโมเดลที่กำหนดค่าไว้ การแมปช่องจะมีผลเมื่อ session ยังไม่มีการแทนที่โมเดลอยู่แล้ว (เช่น ตั้งค่าผ่าน `/model`)

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมค่าเริ่มต้นสำหรับทุกช่อง ค่า: `all` (ค่าเริ่มต้น รวมบริบทที่อ้างอิง/thread/ประวัติทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่คงบริบท quote/reply ที่ระบุชัดเจนไว้) การแทนที่รายช่อง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะที่เสื่อมคุณภาพ/ผิดพลาดในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบตัวบ่งชี้กะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่อง web ของ gateway (Baileys Web) โดยจะเริ่มทำงานอัตโนมัติเมื่อมี session ที่เชื่อมโยงอยู่

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

<Accordion title="Multi-account WhatsApp">

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
- `channels.whatsapp.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีค่าเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- auth dir ของ Baileys แบบบัญชีเดียวเดิมจะถูกย้ายโดย `openclaw doctor` ไปยัง `whatsapp/default`
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

- Bot token: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (ต้องเป็นไฟล์ปกติเท่านั้น ปฏิเสธ symlink) โดยใช้ `TELEGRAM_BOT_TOKEN` เป็นค่าสำรองสำหรับบัญชีค่าเริ่มต้น
- `apiRoot` คือ root ของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือ root แบบ self-hosted/proxy ของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบ suffix `/bot<TOKEN>` ที่เผลอต่อท้ายออก
- `channels.telegram.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีค่าเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (id บัญชี 2 รายการขึ้นไป) ให้ตั้งค่า default อย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการกำหนดเส้นทางสำรอง; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Telegram (การย้าย ID ของ supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่า ACP bindings แบบคงอยู่สำหรับหัวข้อ forum (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- ตัวอย่างสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานได้ในแชตโดยตรงและแชตกลุ่ม)
- นโยบาย retry: ดู [นโยบาย retry](/th/concepts/retry)

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

- โทเค็น: `channels.discord.token` โดยใช้ `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น.
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียกนั้น ส่วนการตั้งค่าการลองซ้ำ/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่.
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่องกิลด์) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ.
- สลักกิลด์เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อที่แปลงเป็นสลักแล้ว (ไม่มี `#`). ควรใช้ ID กิลด์.
- ข้อความที่บอตเขียนจะถูกละเว้นตามค่าเริ่มต้น. `allowBots: true` เปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อยอมรับเฉพาะข้อความจากบอตที่กล่าวถึงบอตเท่านั้น (ยังคงกรองข้อความของตัวเองออก).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอต (ยกเว้น @everyone/@here).
- `channels.discord.mentionAliases` แมปข้อความ `@handle` ขาออกที่เสถียรไปยัง ID ผู้ใช้ Discord ก่อนส่ง เพื่อให้กล่าวถึงเพื่อนร่วมทีมที่รู้จักได้อย่างกำหนดแน่นอนแม้แคชไดเรกทอรีชั่วคราวจะว่างอยู่. การแทนที่ต่อบัญชีอยู่ใต้ `channels.discord.accounts.<accountId>.mentionAliases`.
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแยกข้อความที่สูงมากแม้อยู่ต่ำกว่า 2000 อักขระ.
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทาง Discord ที่ผูกกับเธรด:
  - `enabled`: การแทนที่ Discord สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางแบบผูก)
  - `idleHours`: การแทนที่ Discord สำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ Discord สำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSessions`: สวิตช์สำหรับ `sessions_spawn({ thread: true })` และการสร้าง/ผูกเธรดอัตโนมัติของ ACP thread-spawn (ค่าเริ่มต้น: `true`)
  - `defaultSpawnContext`: บริบท subagent เนทีฟสำหรับการสร้างที่ผูกกับเธรด (ค่าเริ่มต้นคือ `"fork"`)
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่า ACP bindings แบบถาวรสำหรับช่องและเธรด (ใช้ id ช่อง/เธรดใน `match.peer.id`). ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings).
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ Discord components v2.
- `channels.discord.voice` เปิดใช้งานการสนทนาในช่องเสียง Discord และการแทนที่ auto-join + LLM + TTS แบบไม่บังคับ. การกำหนดค่า Discord แบบข้อความเท่านั้นจะปิดเสียงไว้ตามค่าเริ่มต้น; ตั้งค่า `channels.discord.voice.enabled=true` เพื่อเลือกเปิดใช้.
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับคำตอบในช่องเสียง Discord ได้แบบไม่บังคับ.
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น).
- `channels.discord.voice.connectTimeoutMs` ควบคุมการรอ Ready เริ่มต้นของ `@discordjs/voice` สำหรับ `/vc join` และความพยายาม auto-join (`30000` ตามค่าเริ่มต้น).
- `channels.discord.voice.reconnectGraceMs` ควบคุมระยะเวลาที่เซสชันเสียงที่ตัดการเชื่อมต่ออาจใช้เพื่อเข้าสู่สัญญาณการเชื่อมต่อใหม่ ก่อนที่ OpenClaw จะทำลายเซสชันนั้น (`15000` ตามค่าเริ่มต้น).
- การเล่นเสียง Discord จะไม่ถูกขัดจังหวะโดยเหตุการณ์เริ่มพูดของผู้ใช้อื่น. เพื่อหลีกเลี่ยงลูปเสียงย้อนกลับ OpenClaw จะละเว้นการจับเสียงใหม่ขณะ TTS กำลังเล่น.
- OpenClaw ยังพยายามกู้คืนการรับเสียงโดยออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังจากถอดรหัสล้มเหลวซ้ำ.
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน. Discord มีค่าเริ่มต้นเป็น `streaming.mode: "progress"` เพื่อให้ความคืบหน้าของเครื่องมือ/งานปรากฏในข้อความพรีวิวที่แก้ไขข้อความเดียว; ตั้งค่า `streaming.mode: "off"` เพื่อปิดใช้งาน. ค่าเดิม `streamMode` และค่า `streaming` แบบบูลีนยังคงเป็นนามแฝงรันไทม์; รัน `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่.
- `channels.discord.autoPresence` แมปความพร้อมใช้งานของรันไทม์ไปยังสถานะบอต (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตการแทนที่ข้อความสถานะแบบไม่บังคับ.
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้กรณีฉุกเฉิน).
- `channels.discord.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ.
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น). ในโหมดอัตโนมัติ คำอนุมัติ exec จะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้.
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec. fallback ไปยัง `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ.
  - `agentFilter`: allowlist ID เอเจนต์แบบไม่บังคับ. ละไว้เพื่อส่งต่อคำอนุมัติสำหรับเอเจนต์ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมป์อนุมัติ. `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่. เมื่อ target มี `"channel"` ปุ่มจะใช้ได้เฉพาะผู้อนุมัติที่ระบุได้เท่านั้น.
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM อนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา.

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off` (ไม่มี), `own` (ข้อความของบอต, ค่าเริ่มต้น), `all` (ข้อความทั้งหมด), `allowlist` (จาก `guilds.<id>.users` ในข้อความทั้งหมด).

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

- JSON ของบัญชีบริการ: แบบอินไลน์ (`serviceAccount`) หรือแบบอิงไฟล์ (`serviceAccountFile`).
- รองรับ SecretRef ของบัญชีบริการด้วย (`serviceAccountRef`).
- Env fallback: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง.
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้งานการจับคู่ principal อีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้กรณีฉุกเฉิน).

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

- **โหมด Socket** ต้องมีทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชีเริ่มต้น).
- **โหมด HTTP** ต้องมี `botToken` พร้อม `signingSecret` (ที่รากหรือรายบัญชี).
- `socketMode` ส่งผ่านการปรับแต่งการขนส่ง Socket Mode ของ Slack SDK ไปยัง Bolt receiver API สาธารณะ. ใช้เฉพาะเมื่อกำลังตรวจสอบปัญหา ping/pong timeout หรือพฤติกรรม websocket ค้าง.
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริงข้อความธรรมดา
  หรืออ็อบเจกต์ SecretRef.
- สแนปช็อตบัญชี Slack เปิดเผยฟิลด์แหล่งที่มา/สถานะต่อข้อมูลรับรอง เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus`. `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่าความลับได้.
- `configWrites: false` บล็อกการเขียนการกำหนดค่าที่เริ่มจาก Slack.
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack. `channels.slack.streaming.nativeTransport` ควบคุมการขนส่งสตรีมมิงเนทีฟของ Slack. ค่าเดิม `streamMode`, ค่า `streaming` แบบบูลีน และค่า `nativeStreaming` ยังคงเป็นนามแฝงรันไทม์; รัน `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง.

**โหมดการแจ้งเตือนรีแอ็กชัน:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`).

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบต่อเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั้งช่อง. `thread.inheritParent` คัดลอกทรานสคริปต์ของช่องแม่ไปยังเธรดใหม่.

- สตรีมมิงเนทีฟของ Slack ร่วมกับสถานะเธรดแบบผู้ช่วยของ Slack ที่ว่า "is typing..." ต้องมีเป้าหมายเธรดสำหรับตอบกลับ. DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น จึงยังสามารถสตรีมผ่านพรีวิวแบบโพสต์ฉบับร่างแล้วแก้ไขของ Slack แทนการแสดงพรีวิวสตรีม/สถานะแบบเนทีฟสไตล์เธรด.
- `typingReaction` เพิ่มรีแอ็กชันชั่วคราวให้กับข้อความ Slack ขาเข้าขณะกำลังสร้างคำตอบ แล้วลบออกเมื่อเสร็จสิ้น. ใช้ชอร์ตโค้ดอีโมจิ Slack เช่น `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Slack และการให้สิทธิ์ผู้อนุมัติ. ใช้สคีมาเดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`).

| กลุ่มการดำเนินการ | ค่าเริ่มต้น | หมายเหตุ              |
| ------------ | ------- | ---------------------- |
| reactions    | เปิดใช้งาน | รีแอ็กชัน + แสดงรายการรีแอ็กชัน |
| messages     | เปิดใช้งาน | อ่าน/ส่ง/แก้ไข/ลบ      |
| pins         | เปิดใช้งาน | ปักหมุด/เลิกปักหมุด/แสดงรายการ |
| memberInfo   | เปิดใช้งาน | ข้อมูลสมาชิก           |
| emojiList    | เปิดใช้งาน | รายการอีโมจิกำหนดเอง  |

### Mattermost

Mattermost มาพร้อมเป็น Plugin แบบ bundled ใน OpenClaw รุ่นปัจจุบัน. บิลด์ที่เก่ากว่าหรือ
บิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost`. ตรวจสอบ
[npmjs.com/package/@openclaw/mattermost](https://www.npmjs.com/package/@openclaw/mattermost)
สำหรับ dist-tags ปัจจุบันก่อนตรึงเวอร์ชัน.

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

โหมดแชท: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วยคำนำหน้าทริกเกอร์)

เมื่อเปิดใช้คำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw Gateway และต้องเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost
- callback แบบ slash เนทีฟจะยืนยันตัวตนด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งกลับ
  ระหว่างการลงทะเบียนคำสั่ง slash หากการลงทะเบียนล้มเหลวหรือไม่มีการเปิดใช้งาน
  คำสั่งใด OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบส่วนตัว/tailnet/internal Mattermost อาจต้องกำหนดให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนของ callback
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่ากำหนดที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง
- `channels.mattermost.groups.<channelId>.requireMention`: การ override การกั้นด้วย mention รายช่อง (`"*"` สำหรับค่าเริ่มต้น)
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

- `channels.signal.account`: ตรึงการเริ่มต้นช่องกับตัวตนบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่ากำหนดที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ ID บัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles คือบริดจ์ iMessage แบบเดิม (รองรับด้วย Plugin, กำหนดค่าภายใต้ `channels.bluebubbles`) การตั้งค่าที่มีอยู่ยังคงรองรับอยู่ แต่การ deploy OpenClaw iMessage ใหม่ควรใช้ `channels.imessage` เมื่อ `imsg` สามารถทำงานบนโฮสต์ Messages ได้

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
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา BlueBubbles กับเซสชัน ACP แบบคงอยู่ ใช้ handle ของ BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)
- ค่ากำหนดช่อง BlueBubbles แบบเต็มและเหตุผลในการเลิกใช้มีบันทึกไว้ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw สร้าง `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต นี่คือเส้นทางที่แนะนำสำหรับการตั้งค่า OpenClaw iMessage ใหม่เมื่อโฮสต์สามารถให้สิทธิ์ฐานข้อมูล Messages และ Automation ได้

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

- ต้องใช้ Full Disk Access สำหรับฐานข้อมูล Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชท
- `cliPath` สามารถชี้ไปยัง wrapper ของ SSH ได้; ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host-key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่าคีย์ของโฮสต์ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่ากำหนดที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกบทสนทนา iMessage กับเซสชัน ACP แบบคงอยู่ ใช้ handle ที่ normalize แล้วหรือเป้าหมายแชทแบบระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#persistent-channel-bindings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

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

- การยืนยันตัวตนด้วยโทเค็นใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` จะส่งทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุอย่างชัดเจน บัญชีที่มีชื่อสามารถเขียนทับได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการเลือกใช้เครือข่ายนี้เป็นตัวควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการใช้ในการตั้งค่าแบบหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญเข้ามาและคำเชิญแบบ DM ใหม่จะถูกละเว้นจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งมอบการอนุมัติ exec แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: ID ผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ID ของ agent แบบไม่บังคับ ละไว้เพื่อส่งต่อการอนุมัติสำหรับทุก agent
  - `sessionFilter`: รูปแบบคีย์ session แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การเขียนทับรายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix ถูกจัดกลุ่มเป็น session: `per-user` (ค่าเริ่มต้น) แชร์ตาม peer ที่ถูก route ส่วน `per-room` แยกแต่ละห้อง DM ออกจากกัน
- การ probe สถานะ Matrix และการค้นหาไดเรกทอรีแบบ live ใช้นโยบายพร็อกซีเดียวกับทราฟฟิก runtime
- การกำหนดค่า Matrix ทั้งหมด กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารอยู่ใน [Matrix](/th/channels/matrix)

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
- การกำหนดค่า Teams ทั้งหมด (credentials, Webhook, นโยบาย DM/กลุ่ม, การเขียนทับรายทีม/รายช่อง) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

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
- `channels.irc.defaultAccount` แบบไม่บังคับจะเขียนทับการเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่อง IRC ทั้งหมด (host/port/TLS/channels/allowlists/mention gating) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่อง)

เรียกใช้หลายบัญชีต่อช่อง (แต่ละบัญชีมี `accountId` ของตัวเอง):

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + routing)
- โทเค็นจาก env ใช้กับบัญชี **default** เท่านั้น
- การตั้งค่าช่องพื้นฐานใช้กับทุกบัญชี เว้นแต่จะถูกเขียนทับรายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อ route แต่ละบัญชีไปยัง agent ที่ต่างกัน
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการ onboarding ช่อง) ขณะที่ยังใช้การกำหนดค่าช่องระดับบนแบบบัญชีเดียว OpenClaw จะเลื่อนค่าบัญชีเดียวระดับบนที่อยู่ในขอบเขตบัญชีเข้าไปในแผนที่บัญชีของช่องก่อน เพื่อให้บัญชีเดิมยังทำงานต่อไปได้ ช่องส่วนใหญ่จะย้ายค่าเหล่านี้ไปยัง `channels.<channel>.accounts.default`; Matrix สามารถคง target ที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วแทนได้
- binding ที่มีอยู่เฉพาะช่อง (ไม่มี `accountId`) จะยังจับคู่กับบัญชีเริ่มต้นต่อไป; binding ที่อยู่ในขอบเขตบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมแซมรูปแบบที่ผสมกันด้วยการย้ายค่าบัญชีเดียวระดับบนที่อยู่ในขอบเขตบัญชีเข้าไปในบัญชีที่ถูกเลื่อนระดับซึ่งเลือกไว้สำหรับช่องนั้น ช่องส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคง target ที่มีชื่อ/ค่าเริ่มต้นซึ่งตรงกันอยู่แล้วแทนได้

### ช่อง Plugin อื่นๆ

ช่อง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารอยู่ในหน้าช่องเฉพาะของตัวเอง (ตัวอย่างเช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทั้งหมด: [Channels](/th/channels)

### การควบคุมการกล่าวถึงในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการกล่าวถึง** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้จะถูกควบคุมแยกต่างหาก ห้องกลุ่ม/ช่องมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผลรอบนั้น แต่การตอบกลับสุดท้ายตามปกติจะยังเป็นส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่การตอบกลับตามปกติถูกโพสต์กลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`; ฮาร์เนส Codex ยังใช้พฤติกรรมแบบใช้เครื่องมือเท่านั้นนั้นเป็นค่าเริ่มต้นของแชตโดยตรงเมื่อไม่ได้ตั้งค่าเช่นกัน

การตอบกลับที่มองเห็นได้แบบใช้เครื่องมือเท่านั้นต้องใช้โมเดล/รันไทม์ที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้ หาก
บันทึกเซสชันแสดงข้อความของผู้ช่วยพร้อม `didSendViaMessagingTool: false`
แปลว่าโมเดลสร้างคำตอบสุดท้ายแบบส่วนตัวแทนที่จะเรียกเครื่องมือส่งข้อความ
เปลี่ยนไปใช้โมเดลที่เรียกเครื่องมือได้ดีกว่าสำหรับช่องนั้น หรือกำหนด
`messages.groupChat.visibleReplies: "automatic"` เพื่อคืนค่าการตอบกลับสุดท้ายที่มองเห็นได้แบบเดิม

หากเครื่องมือส่งข้อความไม่พร้อมใช้งานภายใต้นโยบายเครื่องมือที่ใช้งานอยู่ OpenClaw จะถอยกลับไปใช้การตอบกลับที่มองเห็นได้แบบอัตโนมัติแทนที่จะระงับการตอบสนองอย่างเงียบ ๆ `openclaw doctor` จะเตือนเกี่ยวกับความไม่ตรงกันนี้

Gateway จะโหลดการกำหนดค่า `messages` ใหม่แบบ hot-reload หลังจากบันทึกไฟล์แล้ว รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดการกำหนดค่าใหม่ถูกปิดใช้งานในการปรับใช้

**ประเภทการกล่าวถึง:**

- **การกล่าวถึงจากเมทาดาทา**: การ @-mention แบบเนทีฟของแพลตฟอร์ม จะถูกละเว้นในโหมดแชตกับตัวเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำแบบซ้อนที่ไม่ปลอดภัยจะถูกละเว้น
- การกั้นด้วยการกล่าวถึงจะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (การกล่าวถึงแบบเนทีฟหรือมีรูปแบบอย่างน้อยหนึ่งรายการ)

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

`messages.groupChat.historyLimit` ตั้งค่าเริ่มต้นส่วนกลาง ช่องสามารถแทนที่ได้ด้วย `channels.<channel>.historyLimit` (หรือรายบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางสำหรับรอบจากต้นทาง; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับรอบจากต้นทางแบบกลุ่ม/ช่อง เมื่อไม่ได้ตั้งค่า `messages.visibleReplies` ฮาร์เนสสามารถให้ค่าเริ่มต้นของตนเองสำหรับโดยตรง/ต้นทางได้; ฮาร์เนส Codex มีค่าเริ่มต้นเป็น `message_tool` รายการอนุญาตของช่องและการกั้นด้วยการกล่าวถึงยังคงเป็นตัวตัดสินว่ารอบหนึ่งจะถูกประมวลผลหรือไม่

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

การตัดสินค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บไว้ทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (ละเว้น @-mention แบบเนทีฟ ตอบกลับเฉพาะรูปแบบข้อความ):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่บันเดิลมาในปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น **ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่อง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารในหน้าช่อง/Plugin ของตัวเองรวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ **เดี่ยวล้วน** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills แบบเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- แทนที่รายช่อง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) สำหรับ Discord, `false` จะข้ามการลงทะเบียนคำสั่งเนทีฟและการล้างข้อมูลระหว่างเริ่มต้น
- แทนที่การลงทะเบียน Skills แบบเนทีฟรายช่องด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์โฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ Gateway `chat.send` การเขียนถาวรของ `/config set|unset` ยังต้องใช้ `operator.admin`; `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์ตัวดำเนินการที่มีขอบเขตเขียนตามปกติ
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` กั้นการเปลี่ยนแปลงการกำหนดค่าตามช่อง (ค่าเริ่มต้น: true)
- สำหรับช่องหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะกั้นการเขียนที่กำหนดเป้าหมายบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการกระทำของเครื่องมือรีสตาร์ท Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือรายการอนุญาตเจ้าของแบบชัดเจนสำหรับคำสั่ง/เครื่องมือเฉพาะเจ้าของ แยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของในพรอมป์ต์ระบบ ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นรายผู้ให้บริการ เมื่อตั้งค่าแล้ว จะเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (รายการอนุญาต/การจับคู่ของช่องและ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงเมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อกในตัว + ที่บันเดิลมา: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่อง: [ช่อง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวมช่อง](/th/channels)
