---
read_when:
    - การกำหนดค่า plugin ของช่องทาง (auth, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์ config แยกตามช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการกั้นด้วย mention
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง, Pairing, คีย์แยกตามช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่น ๆ'
title: การกำหนดค่า — channels
x-i18n:
    generated_at: "2026-04-25T13:46:57Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8b7071f7cda3f7f71b464e64c2abb8e0b88326606234f0cf7778c80a7ef4b3e0
    source_path: gateway/config-channels.md
    workflow: 15
---

คีย์การกำหนดค่าแยกตามช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม
การตั้งค่าหลายบัญชี การกั้นด้วย mention และคีย์เฉพาะช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ bundled channel plugins อื่น ๆ

สำหรับ agents, tools, runtime ของ Gateway และคีย์ระดับบนอื่น ๆ ดู
[เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## Channels

แต่ละช่องทางจะเริ่มทำงานโดยอัตโนมัติเมื่อมีส่วน config ของมันอยู่ (เว้นแต่ `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM          | พฤติกรรม                                                       |
| ------------------- | -------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัส pairing แบบใช้ครั้งเดียว; owner ต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือ paired allow store)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)          |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                       |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับ allowlist ที่กำหนดไว้              |
| `open`                | ข้าม group allowlists (ยังคงใช้การกั้นด้วย mention)     |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                           |

<Note>
`channels.defaults.groupPolicy` ใช้ตั้งค่าเริ่มต้นเมื่อ `groupPolicy` ของ provider ไม่ได้ตั้งไว้
รหัส Pairing หมดอายุหลัง 1 ชั่วโมง คำขอ pairing DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 ต่อช่องทาง**
หากไม่มีบล็อก provider เลย (`channels.<provider>` ไม่มีอยู่) นโยบายกลุ่มของ runtime จะ fallback ไปเป็น `allowlist` (ปิดไว้ก่อนเพื่อความปลอดภัย) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การ override โมเดลตามช่องทาง

ใช้ `channels.modelByChannel` เพื่อปักหมุด channel IDs เฉพาะให้ใช้โมเดลหนึ่ง ๆ ค่าในนี้รองรับ `provider/model` หรือ model aliases ที่กำหนดค่าไว้ การแมปช่องทางจะมีผลเมื่อเซสชันยังไม่มี model override อยู่แล้ว (เช่น ตั้งผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับพฤติกรรม group-policy และ Heartbeat ที่ใช้ร่วมกันข้าม providers:

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

- `channels.defaults.groupPolicy`: นโยบายกลุ่มแบบ fallback เมื่อไม่ได้ตั้ง `groupPolicy` ระดับ provider
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมค่าเริ่มต้นสำหรับทุกช่องทาง ค่าได้แก่ `all` (ค่าเริ่มต้น รวมบริบท quoted/thread/history ทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่คงบริบท quote/reply แบบ explicit ไว้) การ override รายช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติไว้ในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะ degraded/error ไว้ในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบกะทัดรัดในสไตล์ตัวบ่งชี้

### WhatsApp

WhatsApp ทำงานผ่าน web channel ของ Gateway (Baileys Web) มันจะเริ่มทำงานโดยอัตโนมัติเมื่อมี linked session อยู่

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "pairing", // pairing | allowlist | open | disabled
      allowFrom: ["+15555550123", "+447700900123"],
      textChunkLimit: 4000,
      chunkMode: "length", // length | newline
      mediaMaxMb: 50,
      sendReadReceipts: true, // เครื่องหมายถูกสีน้ำเงิน (false ในโหมด self-chat)
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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นหากมี; มิฉะนั้นจะใช้ account id ตัวแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นแบบ fallback นี้ได้ เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบ single-account รุ่นเก่าจะถูก migrate โดย `openclaw doctor` ไปไว้ที่ `whatsapp/default`
- การ override แยกตามบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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
      streaming: "partial", // off | partial | block | progress (ค่าเริ่มต้น: off; ต้องเปิดใช้อย่างชัดเจนเพื่อหลีกเลี่ยงอัตราจำกัดของ preview-edit)
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
      proxy: "socks5://localhost:9050",
      webhookUrl: "https://example.com/telegram-webhook",
      webhookSecret: "secret",
      webhookPath: "/telegram-webhook",
    },
  },
}
```

- Bot token: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติ; ปฏิเสธ symlinks) โดยมี `TELEGRAM_BOT_TOKEN` เป็น fallback สำหรับบัญชีค่าเริ่มต้น
- `channels.telegram.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (2+ account ids) ให้ตั้งค่า default แบบ explicit (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยง fallback routing; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Telegram (การย้าย supergroup ID, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` ใช้กำหนด persistent ACP bindings สำหรับ forum topics (ใช้ canonical `chatId:topic:topicId` ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- Telegram stream previews ใช้ `sendMessage` + `editMessageText` (ใช้ได้ทั้งในแชตตรงและแชตกลุ่ม)
- นโยบาย retry: ดู [นโยบาย Retry](/th/concepts/retry)

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
      streaming: "off", // off | partial | block | progress (progress จะถูกแมปเป็น partial บน Discord)
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
        spawnSubagentSessions: false, // opt-in สำหรับ sessions_spawn({ thread: true })
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีค่าเริ่มต้น
- การเรียกขาออกโดยตรงที่ระบุ Discord `token` แบบ explicit จะใช้โทเค็นนั้นสำหรับการเรียก; การตั้งค่า retry/policy ของบัญชียังคงมาจากบัญชีที่เลือกใน runtime snapshot ที่กำลังใช้งาน
- `channels.discord.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (guild channel) สำหรับ delivery targets; ระบบจะปฏิเสธ numeric IDs แบบเปล่า
- guild slugs เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; channel keys ใช้ชื่อแบบ slug (ไม่มี `#`) แนะนำให้ใช้ guild IDs
- ข้อความที่บอทเป็นผู้เขียนจะถูกละเลยโดยค่าเริ่มต้น `allowBots: true` จะเปิดให้รับ; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอทที่ mention บอทเท่านั้น (ข้อความของตัวเองยังคงถูกกรองออก)
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการ override ระดับ channel) จะทิ้งข้อความที่ mention ผู้ใช้หรือ role อื่น แต่ไม่ได้ mention บอท (ยกเว้น @everyone/@here)
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแยกข้อความที่สูงมากแม้จะยังไม่เกิน 2000 อักขระ
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับ thread ของ Discord:
  - `enabled`: การ override ของ Discord สำหรับความสามารถของเซสชันแบบผูกกับ thread (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางแบบ bound)
  - `idleHours`: การ override ของ Discord สำหรับการ auto-unfocus จากการไม่มีการใช้งานเป็นชั่วโมง (`0` คือปิดใช้งาน)
  - `maxAgeHours`: การ override ของ Discord สำหรับอายุสูงสุดแบบตายตัวเป็นชั่วโมง (`0` คือปิดใช้งาน)
  - `spawnSubagentSessions`: สวิตช์ opt-in สำหรับการสร้าง/binding thread อัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` ใช้กำหนด persistent ACP bindings สำหรับ channels และ threads (ใช้ channel/thread id ใน `match.peer.id`) ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- `channels.discord.ui.components.accentColor` ตั้งค่าสี accent สำหรับ containers ของ Discord components v2
- `channels.discord.voice` เปิดใช้การสนทนาใน voice channel ของ Discord และการ override แบบไม่บังคับสำหรับ auto-join + LLM + TTS
- `channels.discord.voice.model` ใช้ override โมเดล LLM ที่ใช้สำหรับการตอบกลับใน voice channel ของ Discord ได้แบบไม่บังคับ
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` จะส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (ค่าเริ่มต้นคือ `true` และ `24`)
- OpenClaw ยังพยายามกู้คืนการรับเสียงเพิ่มเติมโดยออกจาก/เข้าร่วม voice session ใหม่หลังเกิด decrypt failures ซ้ำ ๆ
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐานแบบ canonical ค่า `streamMode` แบบเดิมและค่า `streaming` แบบบูลีนจะถูกย้ายให้อัตโนมัติ
- `channels.discord.autoPresence` จับคู่ความพร้อมใช้งานของ runtime กับ presence ของบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้ override ข้อความสถานะแบบไม่บังคับ
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ด้วยชื่อ/tag ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบใช้เมื่อจำเป็นจริง ๆ)
- `channels.discord.execApprovals`: การส่ง exec approval แบบ native ของ Discord และการอนุญาต approver
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะทำงานเมื่อสามารถ resolve approvers ได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Discord user IDs ที่ได้รับอนุญาตให้อนุมัติคำขอ exec หากไม่กำหนด จะ fallback ไปใช้ `commands.ownerAllowFrom`
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ ละไว้เพื่อส่งต่อ approvals สำหรับทุก agents
  - `sessionFilter`: รูปแบบ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง approval prompts `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของ approver, `"channel"` ส่งไปยังช่องทางต้นทาง, `"both"` ส่งไปทั้งสองที่ เมื่อ target มี `"channel"` ปุ่มจะใช้งานได้เฉพาะ approvers ที่ resolve แล้ว
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ approval DMs หลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` บนทุกข้อความ)

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
- รองรับ SecretRef สำหรับ service account ด้วย (`serviceAccountRef`)
- env fallbacks: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับ delivery targets
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ด้วย email principal ที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้แบบใช้เมื่อจำเป็นจริง ๆ)

### Slack

```json5
{
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      appToken: "xapp-...",
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
        nativeTransport: true, // ใช้ Slack native streaming API เมื่อ mode=partial
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

- **Socket mode** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` เป็น env fallback สำหรับบัญชีค่าเริ่มต้น)
- **HTTP mode** ต้องใช้ `botToken` ร่วมกับ `signingSecret` (ที่ root หรือแยกตามบัญชี)
- `botToken`, `appToken`, `signingSecret` และ `userToken` รองรับทั้งสตริง plaintext
  หรือออบเจ็กต์ SecretRef
- snapshots ของบัญชี Slack จะแสดงฟิลด์แหล่งที่มา/สถานะแยกตาม credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP
  `signingSecretStatus` ค่า `configured_unavailable` หมายความว่าบัญชีนั้น
  ถูกกำหนดค่าผ่าน SecretRef แต่เส้นทางคำสั่ง/runtime ปัจจุบันไม่สามารถ
  resolve ค่าซีเคร็ตได้
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Slack
- `channels.slack.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานแบบ canonical ของ Slack `channels.slack.streaming.nativeTransport` ควบคุม transport การสตรีมแบบ native ของ Slack ค่า `streamMode` แบบเดิม ค่า `streaming` แบบบูลีน และค่า `nativeStreaming` จะถูกย้ายให้อัตโนมัติ
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับ delivery targets

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`)

**การแยกเซสชันตาม thread:** `thread.historyScope` เป็นแบบต่อ thread (ค่าเริ่มต้น) หรือแชร์ร่วมกันทั้ง channel `thread.inheritParent` จะคัดลอก transcript ของ parent channel ไปยัง threads ใหม่

- การสตรีมแบบ native ของ Slack และสถานะ thread แบบ “is typing...” สไตล์ผู้ช่วยของ Slack ต้องมีเป้าหมายการตอบกลับเป็น thread DM ระดับบนสุดจะยังคงอยู่นอก thread โดยค่าเริ่มต้น จึงใช้ `typingReaction` หรือการส่งปกติแทน preview แบบสไตล์ thread
- `typingReaction` จะเพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าขณะที่กำลังรันการตอบกลับ แล้วลบออกเมื่อเสร็จสิ้น ใช้ Slack emoji shortcode เช่น `"hourglass_flowing_sand"`
- `channels.slack.execApprovals`: การส่ง exec approval แบบ native ของ Slack และการอนุญาต approver schema เหมือนกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (Slack user IDs), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`)

| กลุ่ม action | ค่าเริ่มต้น | หมายเหตุ                    |
| ------------ | ------------ | --------------------------- |
| reactions    | เปิดใช้งาน   | React + แสดงรายการ reactions |
| messages     | เปิดใช้งาน   | อ่าน/ส่ง/แก้ไข/ลบ           |
| pins         | เปิดใช้งาน   | ปักหมุด/เลิกปักหมุด/แสดงรายการ |
| memberInfo   | เปิดใช้งาน   | ข้อมูลสมาชิก                |
| emojiList    | เปิดใช้งาน   | รายการอีโมจิแบบกำหนดเอง     |

### Mattermost

Mattermost มาในรูปแบบ Plugin: `openclaw plugins install @openclaw/mattermost`

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
        // URL แบบ explicit ที่ไม่บังคับสำหรับการดีพลอยผ่าน reverse-proxy/public
        callbackUrl: "https://gateway.example.com/api/channels/mattermost/command",
      },
      textChunkLimit: 4000,
      chunkMode: "length",
    },
  },
}
```

โหมดแชต: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่ขึ้นต้นด้วย trigger prefix)

เมื่อเปิดใช้คำสั่ง native ของ Mattermost:

- `commands.callbackPath` ต้องเป็น path (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม
- `commands.callbackUrl` ต้อง resolve ไปยัง endpoint ของ OpenClaw Gateway และ Mattermost server ต้องเข้าถึงได้
- native slash callbacks จะยืนยันตัวตนด้วยโทเค็นแยกตามคำสั่งที่ Mattermost ส่งกลับมา
  ระหว่างการลงทะเบียน slash command หากการลงทะเบียนล้มเหลว หรือไม่มี
  คำสั่งใดถูกเปิดใช้งาน OpenClaw จะปฏิเสธ callbacks พร้อมข้อความ
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบ private/tailnet/internal Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวม host/domain ของ callback ไว้ด้วย
  ให้ใช้ค่า host/domain ไม่ใช่ URL แบบเต็ม
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับใน channels
- `channels.mattermost.groups.<channelId>.requireMention`: override การกั้นด้วย mention แยกตาม channel (`"*"` สำหรับค่าเริ่มต้น)
- `channels.mattermost.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้

### Signal

```json5
{
  channels: {
    signal: {
      enabled: true,
      account: "+15555550123", // การผูกบัญชีแบบไม่บังคับ
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

- `channels.signal.account`: ปักหมุดการเริ่มต้นช่องทางให้ใช้ identity ของบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles คือเส้นทาง iMessage ที่แนะนำ (รองรับด้วย Plugin และกำหนดค่าใต้ `channels.bluebubbles`)

```json5
{
  channels: {
    bluebubbles: {
      enabled: true,
      dmPolicy: "pairing",
      // serverUrl, password, webhookPath, group controls และ advanced actions:
      // ดู /channels/bluebubbles
    },
  },
}
```

- พาธคีย์หลักที่ครอบคลุมที่นี่: `channels.bluebubbles`, `channels.bluebubbles.dmPolicy`
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` สามารถ bind การสนทนาของ BlueBubbles เข้ากับ ACP sessions แบบ persistent ได้ ใช้ BlueBubbles handle หรือ target string (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- การกำหนดค่าช่องทาง BlueBubbles แบบเต็มมีเอกสารอยู่ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw spawn `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ daemon หรือพอร์ต

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

- `channels.imessage.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้

- ต้องมี Full Disk Access สำหรับฐานข้อมูล Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้; ตั้ง `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบผ่าน SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธของไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้ strict host-key checking ดังนั้นให้แน่ใจว่าคีย์โฮสต์ของ relay มีอยู่แล้วใน `~/.ssh/known_hosts`
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` สามารถ bind การสนทนาของ iMessage เข้ากับ ACP sessions แบบ persistent ได้ ใช้ handle ที่ทำให้เป็นมาตรฐานแล้วหรือ explicit chat target (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [ACP Agents](/th/tools/acp-agents#channel-specific-settings)

<Accordion title="ตัวอย่าง iMessage SSH wrapper">

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

- auth แบบ token ใช้ `accessToken`; auth แบบรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` กำหนดเส้นทางทราฟฟิก HTTP ของ Matrix ผ่าน HTTP(S) proxy แบบ explicit บัญชีที่ตั้งชื่อสามารถ override ได้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeservers แบบ private/internal ค่า `proxy` และ network opt-in นี้เป็นการควบคุมที่แยกจากกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการใช้เป็นหลักในชุดหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญสไตล์ DM ใหม่จะถูกละเลยจนกว่าคุณจะตั้ง `autoJoin: "allowlist"` ร่วมกับ `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่ง exec approval แบบ native ของ Matrix และการอนุญาต approver
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมด auto การอนุมัติ exec จะทำงานเมื่อสามารถ resolve approvers ได้จาก `approvers` หรือ `commands.ownerAllowFrom`
  - `approvers`: Matrix user IDs (เช่น `@owner:example.org`) ที่ได้รับอนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist ของ agent ID แบบไม่บังคับ ละไว้เพื่อส่งต่อ approvals สำหรับทุก agents
  - `sessionFilter`: รูปแบบ session key แบบไม่บังคับ (substring หรือ regex)
  - `target`: ตำแหน่งที่จะส่ง approval prompts `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การ override แยกตามบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมว่า Matrix DMs จะถูกรวมเป็น sessions อย่างไร: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตาม routed peer ขณะที่ `per-room` จะแยกแต่ละห้อง DM ออกจากกัน
- status probes และ live directory lookups ของ Matrix ใช้นโยบาย proxy เดียวกับทราฟฟิก runtime
- การกำหนดค่า Matrix แบบเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่า มีเอกสารอยู่ใน [Matrix](/th/channels/matrix)

### Microsoft Teams

Microsoft Teams รองรับด้วย Plugin และกำหนดค่าใต้ `channels.msteams`

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

- พาธคีย์หลักที่ครอบคลุมที่นี่: `channels.msteams`, `channels.msteams.configWrites`
- config ของ Teams แบบเต็ม (ข้อมูลรับรอง, webhook, นโยบาย DM/กลุ่ม, การ override แยกตาม team/channel) มีเอกสารอยู่ใน [Microsoft Teams](/th/channels/msteams)

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

- พาธคีย์หลักที่ครอบคลุมที่นี่: `channels.irc`, `channels.irc.dmPolicy`, `channels.irc.configWrites`, `channels.irc.nickserv.*`
- `channels.irc.defaultAccount` แบบไม่บังคับสามารถ override การเลือกบัญชีค่าเริ่มต้นได้เมื่อค่าตรงกับ account id ที่กำหนดค่าไว้
- การกำหนดค่าช่องทาง IRC แบบเต็ม (host/port/TLS/channels/allowlists/mention gating) มีเอกสารอยู่ใน [IRC](/th/channels/irc)

### หลายบัญชี (ทุกช่องทาง)

รันหลายบัญชีต่อช่องทาง (แต่ละบัญชีมี `accountId` ของตัวเอง):

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
- env tokens ใช้ได้เฉพาะกับบัญชี **default** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานจะมีผลกับทุกบัญชี เว้นแต่จะมีการ override แยกตามบัญชี
- ใช้ `bindings[].match.accountId` เพื่อกำหนดเส้นทางแต่ละบัญชีไปยัง agent คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือ channel onboarding) ขณะที่ยังใช้ config ช่องทางแบบ single-account ระดับบน OpenClaw จะย้ายค่าระดับบนแบบ single-account ที่อยู่ในขอบเขตบัญชีไปยัง account map ของช่องทางนั้นก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ส่วนใหญ่ช่องทางจะย้ายค่าเหล่านั้นไปไว้ที่ `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมาย named/default ที่มีอยู่และตรงกันไว้แทนได้
- bindings ที่มีอยู่เดิมแบบ channel-only (ไม่มี `accountId`) จะยังคงจับคู่กับบัญชีค่าเริ่มต้น; bindings แบบ account-scoped ยังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` จะซ่อมโครงสร้างแบบผสมด้วย โดยย้ายค่าระดับบนแบบ single-account ที่อยู่ในขอบเขตบัญชีไปยัง promoted account ที่เลือกสำหรับช่องทางนั้น ส่วนใหญ่ช่องทางจะใช้ `accounts.default`; Matrix สามารถคงเป้าหมาย named/default ที่มีอยู่และตรงกันไว้แทนได้

### ช่องทาง Plugin อื่น ๆ

หลายช่องทางแบบ Plugin ถูกกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตนเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมดได้ที่: [Channels](/th/channels)

### การกั้นด้วย mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการ mention** (metadata mention หรือรูปแบบ safe regex) ใช้กับแชตกลุ่มของ WhatsApp, Telegram, Discord, Google Chat และ iMessage

**ประเภทของ mention:**

- **Metadata mentions**: @-mentions แบบ native ของแพลตฟอร์ม จะถูกละเลยในโหมด self-chat ของ WhatsApp
- **Text patterns**: รูปแบบ safe regex ใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและ nested repetition ที่ไม่ปลอดภัยจะถูกละเลย
- การกั้นด้วย mention จะถูกบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้เท่านั้น (native mentions หรือมีอย่างน้อยหนึ่ง pattern)

```json5
{
  messages: {
    groupChat: { historyLimit: 50 },
  },
  agents: {
    list: [{ id: "main", groupChat: { mentionPatterns: ["@openclaw", "openclaw"] } }],
  },
}
```

`messages.groupChat.historyLimit` ตั้งค่าค่าเริ่มต้นส่วนกลาง ช่องทางต่าง ๆ สามารถ override ได้ด้วย `channels.<channel>.historyLimit` (หรือแยกตามบัญชี) ตั้งค่าเป็น `0` เพื่อปิดใช้งาน

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

ลำดับการ resolve: override ราย DM → ค่าเริ่มต้นของ provider → ไม่จำกัด (เก็บทั้งหมด)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมด self-chat

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้โหมด self-chat (ละเลย native @-mentions และตอบเฉพาะ text patterns):

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
    native: "auto", // ลงทะเบียนคำสั่ง native เมื่อรองรับ
    nativeSkills: "auto", // ลงทะเบียนคำสั่ง Skills แบบ native เมื่อรองรับ
    text: true, // parse /commands ในข้อความแชต
    bash: false, // อนุญาต ! (alias: /bash)
    bashForegroundMs: 2000,
    config: false, // อนุญาต /config
    mcp: false, // อนุญาต /mcp
    plugins: false, // อนุญาต /plugins
    debug: false, // อนุญาต /debug
    restart: true, // อนุญาต /restart + tool รีสตาร์ต gateway
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

- บล็อกนี้ใช้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่ง built-in + bundled ปัจจุบัน ดู [Slash Commands](/th/tools/slash-commands)
- หน้านี้เป็น **เอกสารอ้างอิงคีย์ config** ไม่ใช่แค็ตตาล็อกคำสั่งแบบเต็ม คำสั่งที่เป็นของช่องทาง/plugin เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, device-pair `/pair`, memory `/dreaming`, phone-control `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/plugin ของตัวเองและใน [Slash Commands](/th/tools/slash-commands)
- คำสั่งแบบข้อความต้องเป็นข้อความ **เดี่ยว ๆ** ที่ขึ้นต้นด้วย `/`
- `native: "auto"` จะเปิดคำสั่ง native สำหรับ Discord/Telegram และปล่อย Slack ไว้เป็นปิด
- `nativeSkills: "auto"` จะเปิดคำสั่ง Skills แบบ native สำหรับ Discord/Telegram และปล่อย Slack ไว้เป็นปิด
- override แยกตามช่องทางได้ด้วย `channels.discord.commands.native` (bool หรือ `"auto"`) ค่า `false` จะล้างคำสั่งที่เคยลงทะเบียนไว้ก่อนหน้า
- override การลงทะเบียน native skill แยกตามช่องทางได้ด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอทของ Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับ shell ของโฮสต์ ต้องใช้ `tools.elevated.enabled` และผู้ส่งต้องอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ gateway การเขียนแบบถาวรผ่าน `/config set|unset` ยังต้องใช้ `operator.admin`; ส่วน `/config show` แบบอ่านอย่างเดียวยังใช้ได้สำหรับไคลเอนต์ operator ทั่วไปที่มีสิทธิ์ระดับ write
- `mcp: true` เปิดใช้ `/mcp` สำหรับ config ของ MCP server ที่ OpenClaw จัดการ ภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นหา ติดตั้ง และควบคุมการเปิด/ปิด Plugin
- `channels.<provider>.configWrites` ใช้กั้นการเปลี่ยนแปลง config แยกตามช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางแบบหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะใช้กั้นการเขียนที่มุ่งไปยังบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดการใช้งาน `/restart` และการทำงานของ tool รีสตาร์ต gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ owner allowlist แบบ explicit สำหรับคำสั่ง/tools ที่ใช้ได้เฉพาะ owner แยกจาก `allowFrom`
- `ownerDisplay: "hash"` จะ hash owner ids ใน system prompt ตั้ง `ownerDisplaySecret` เพื่อควบคุมการ hash
- `allowFrom` เป็นแบบแยกตาม provider เมื่อมีการตั้งค่านี้ไว้ มันจะกลายเป็นแหล่งการอนุญาต **เพียงแหล่งเดียว** (allowlists/pairing ของช่องทางและ `useAccessGroups` จะถูกละเลย)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบาย access-group ได้เมื่อไม่ได้ตั้ง `allowFrom`
- แผนที่เอกสารคำสั่ง:
  - แค็ตตาล็อก built-in + bundled: [Slash Commands](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [Channels](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่ง pairing: [Pairing](/th/channels/pairing)
  - คำสั่ง card ของ LINE: [LINE](/th/channels/line)
  - memory dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบน
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [ภาพรวม Channels](/th/channels)
