---
read_when:
    - การกำหนดค่า Plugin ช่องทาง (การยืนยันตัวตน, การควบคุมการเข้าถึง, หลายบัญชี)
    - การแก้ไขปัญหาคีย์การกำหนดค่าต่อช่องทาง
    - การตรวจสอบนโยบาย DM, นโยบายกลุ่ม หรือการควบคุมการเข้าถึงด้วยการกล่าวถึง
summary: 'การกำหนดค่าช่องทาง: การควบคุมการเข้าถึง การจับคู่ คีย์ต่อช่องทางสำหรับ Slack, Discord, Telegram, WhatsApp, Matrix, iMessage และอื่นๆ'
title: การกำหนดค่า — ช่องทาง
x-i18n:
    generated_at: "2026-04-30T16:28:53Z"
    model: gpt-5.5
    provider: openai
    source_hash: aba14cb43e1fe914cc7c03f41bed1b5915cc6b2ad8e0f1d47f58b7e98c1b3915
    source_path: gateway/config-channels.md
    workflow: 16
---

คีย์การกำหนดค่าต่อช่องทางภายใต้ `channels.*` ครอบคลุมการเข้าถึง DM และกลุ่ม,
การตั้งค่าหลายบัญชี, การกำหนดให้ต้อง mention, และคีย์ต่อช่องทางสำหรับ Slack, Discord,
Telegram, WhatsApp, Matrix, iMessage และ Plugin ช่องทางอื่นๆ ที่บันเดิลมา

สำหรับ agents, tools, Gateway runtime และคีย์ระดับบนอื่นๆ โปรดดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ช่องทาง

แต่ละช่องทางจะเริ่มโดยอัตโนมัติเมื่อมีส่วนการกำหนดค่าของช่องทางนั้น (เว้นแต่ตั้งค่า `enabled: false`)

### การเข้าถึง DM และกลุ่ม

ทุกช่องทางรองรับนโยบาย DM และนโยบายกลุ่ม:

| นโยบาย DM           | พฤติกรรม                                                        |
| ------------------- | --------------------------------------------------------------- |
| `pairing` (ค่าเริ่มต้น) | ผู้ส่งที่ไม่รู้จักจะได้รับรหัสจับคู่แบบใช้ครั้งเดียว; เจ้าของต้องอนุมัติ |
| `allowlist`         | เฉพาะผู้ส่งใน `allowFrom` (หรือ store อนุญาตที่จับคู่ไว้)             |
| `open`              | อนุญาต DM ขาเข้าทั้งหมด (ต้องใช้ `allowFrom: ["*"]`)             |
| `disabled`          | ไม่สนใจ DM ขาเข้าทั้งหมด                                          |

| นโยบายกลุ่ม          | พฤติกรรม                                               |
| --------------------- | ------------------------------------------------------ |
| `allowlist` (ค่าเริ่มต้น) | เฉพาะกลุ่มที่ตรงกับ allowlist ที่กำหนดค่าไว้          |
| `open`                | ข้าม allowlist ของกลุ่ม (การกำหนดให้ต้อง mention ยังมีผล) |
| `disabled`            | บล็อกข้อความกลุ่ม/ห้องทั้งหมด                          |

<Note>
`channels.defaults.groupPolicy` ตั้งค่าเริ่มต้นเมื่อไม่ได้ตั้งค่า `groupPolicy` ของ provider
รหัสจับคู่จะหมดอายุหลังจาก 1 ชั่วโมง คำขอจับคู่ DM ที่รอดำเนินการถูกจำกัดไว้ที่ **3 รายการต่อช่องทาง**
หากบล็อก provider หายไปทั้งหมด (ไม่มี `channels.<provider>`) นโยบายกลุ่ม runtime จะย้อนกลับไปใช้ `allowlist` (fail-closed) พร้อมคำเตือนตอนเริ่มต้น
</Note>

### การ override โมเดลของช่องทาง

ใช้ `channels.modelByChannel` เพื่อตรึง ID ช่องทางเฉพาะกับโมเดล ค่ารองรับ `provider/model` หรือ alias ของโมเดลที่กำหนดค่าไว้ การจับคู่ช่องทางจะมีผลเมื่อ session ยังไม่มีการ override โมเดลอยู่แล้ว (ตัวอย่างเช่น ตั้งค่าผ่าน `/model`)

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

ใช้ `channels.defaults` สำหรับพฤติกรรมนโยบายกลุ่มและ Heartbeat ที่ใช้ร่วมกันระหว่าง provider:

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
- `channels.defaults.contextVisibility`: โหมดการมองเห็นบริบทเสริมเริ่มต้นสำหรับทุกช่องทาง ค่า: `all` (ค่าเริ่มต้น, รวมบริบท quote/thread/history ทั้งหมด), `allowlist` (รวมเฉพาะบริบทจากผู้ส่งที่อยู่ใน allowlist), `allowlist_quote` (เหมือน allowlist แต่คงบริบท quote/reply ที่ระบุชัดเจนไว้) การ override ต่อช่องทาง: `channels.<channel>.contextVisibility`
- `channels.defaults.heartbeat.showOk`: รวมสถานะช่องทางที่ปกติในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.showAlerts`: รวมสถานะ degraded/error ในเอาต์พุต Heartbeat
- `channels.defaults.heartbeat.useIndicator`: แสดงเอาต์พุต Heartbeat แบบ indicator ขนาดกะทัดรัด

### WhatsApp

WhatsApp ทำงานผ่านช่องทางเว็บของ Gateway (Baileys Web) ระบบจะเริ่มโดยอัตโนมัติเมื่อมี session ที่ลิงก์ไว้

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

- คำสั่งขาออกจะใช้บัญชี `default` เป็นค่าเริ่มต้นถ้ามี; ไม่เช่นนั้นจะใช้ id บัญชีแรกที่กำหนดค่าไว้ (เรียงลำดับแล้ว)
- `channels.whatsapp.defaultAccount` ที่เป็นตัวเลือกเสริมจะ override การเลือกบัญชีเริ่มต้นสำรองนั้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ไดเรกทอรี auth ของ Baileys แบบบัญชีเดียวเดิมจะถูก migrate โดย `openclaw doctor` ไปยัง `whatsapp/default`
- การ override ต่อบัญชี: `channels.whatsapp.accounts.<id>.sendReadReceipts`, `channels.whatsapp.accounts.<id>.dmPolicy`, `channels.whatsapp.accounts.<id>.allowFrom`

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

- โทเคนบอต: `channels.telegram.botToken` หรือ `channels.telegram.tokenFile` (เฉพาะไฟล์ปกติเท่านั้น; ปฏิเสธ symlink), โดยใช้ `TELEGRAM_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น
- `apiRoot` คือ root ของ Telegram Bot API เท่านั้น ใช้ `https://api.telegram.org` หรือ root แบบ self-hosted/proxy ของคุณ ไม่ใช่ `https://api.telegram.org/bot<TOKEN>`; `openclaw doctor --fix` จะลบ suffix `/bot<TOKEN>` ที่ต่อท้ายโดยไม่ตั้งใจ
- `channels.telegram.defaultAccount` ที่เป็นตัวเลือกเสริมจะ override การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id บัญชีที่กำหนดค่าไว้
- ในการตั้งค่าหลายบัญชี (id บัญชี 2+ รายการ) ให้ตั้งค่าเริ่มต้นอย่างชัดเจน (`channels.telegram.defaultAccount` หรือ `channels.telegram.accounts.default`) เพื่อหลีกเลี่ยงการ route แบบ fallback; `openclaw doctor` จะเตือนเมื่อค่านี้หายไปหรือไม่ถูกต้อง
- `configWrites: false` จะบล็อกการเขียน config ที่เริ่มจาก Telegram (การ migrate ID ของ supergroup, `/config set|unset`)
- รายการ `bindings[]` ระดับบนที่มี `type: "acp"` กำหนดค่า ACP bindings แบบถาวรสำหรับหัวข้อ forum (ใช้ `chatId:topic:topicId` แบบ canonical ใน `match.peer.id`) ความหมายของ field ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings)
- พรีวิวสตรีมของ Telegram ใช้ `sendMessage` + `editMessageText` (ทำงานในแชต direct และกลุ่ม)
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

- โทเค็น: `channels.discord.token` โดยมี `DISCORD_BOT_TOKEN` เป็น fallback สำหรับบัญชีเริ่มต้น.
- การเรียกออกโดยตรงที่ระบุ Discord `token` อย่างชัดเจนจะใช้โทเค็นนั้นสำหรับการเรียก; การตั้งค่าการลองใหม่/นโยบายของบัญชียังคงมาจากบัญชีที่เลือกในสแนปช็อตรันไทม์ที่ใช้งานอยู่.
- `channels.discord.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` (ช่อง guild) สำหรับเป้าหมายการส่ง; ID ตัวเลขล้วนจะถูกปฏิเสธ.
- slug ของ guild เป็นตัวพิมพ์เล็กและแทนที่ช่องว่างด้วย `-`; คีย์ช่องใช้ชื่อที่แปลงเป็น slug แล้ว (ไม่มี `#`). แนะนำให้ใช้ ID ของ guild.
- ข้อความที่บอทเป็นผู้เขียนจะถูกละเว้นตามค่าเริ่มต้น. `allowBots: true` จะเปิดใช้งานข้อความเหล่านั้น; ใช้ `allowBots: "mentions"` เพื่อรับเฉพาะข้อความจากบอทที่กล่าวถึงบอทเท่านั้น (ข้อความของตัวเองยังถูกกรองอยู่).
- `channels.discord.guilds.<id>.ignoreOtherMentions` (และการแทนที่ระดับช่อง) จะทิ้งข้อความที่กล่าวถึงผู้ใช้หรือบทบาทอื่นแต่ไม่ได้กล่าวถึงบอท (ยกเว้น @everyone/@here).
- `maxLinesPerMessage` (ค่าเริ่มต้น 17) จะแบ่งข้อความที่ยาวหลายบรรทัดแม้จะมีความยาวต่ำกว่า 2000 อักขระ.
- `channels.discord.threadBindings` ควบคุมการกำหนดเส้นทางแบบผูกกับเธรดของ Discord:
  - `enabled`: การแทนที่ของ Discord สำหรับฟีเจอร์เซสชันแบบผูกกับเธรด (`/focus`, `/unfocus`, `/agents`, `/session idle`, `/session max-age` และการส่ง/การกำหนดเส้นทางที่ผูกไว้)
  - `idleHours`: การแทนที่ของ Discord สำหรับการ auto-unfocus เมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `maxAgeHours`: การแทนที่ของ Discord สำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้งาน)
  - `spawnSubagentSessions`: สวิตช์เลือกเปิดสำหรับการสร้าง/ผูกเธรดอัตโนมัติของ `sessions_spawn({ thread: true })`
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` กำหนดค่า binding ของ ACP แบบถาวรสำหรับช่องและเธรด (ใช้ id ของช่อง/เธรดใน `match.peer.id`). ความหมายของฟิลด์ใช้ร่วมกันใน [ACP Agents](/th/tools/acp-agents#channel-specific-settings).
- `channels.discord.ui.components.accentColor` ตั้งค่าสีเน้นสำหรับคอนเทนเนอร์ components v2 ของ Discord.
- `channels.discord.voice` เปิดใช้การสนทนาในช่องเสียงของ Discord และการ auto-join แบบไม่บังคับ + การแทนที่ LLM + TTS.
- `channels.discord.voice.model` แทนที่โมเดล LLM ที่ใช้สำหรับการตอบกลับในช่องเสียงของ Discord แบบไม่บังคับ.
- `channels.discord.voice.daveEncryption` และ `channels.discord.voice.decryptionFailureTolerance` ส่งผ่านไปยังตัวเลือก DAVE ของ `@discordjs/voice` (`true` และ `24` ตามค่าเริ่มต้น).
- OpenClaw ยังพยายามกู้คืนการรับเสียงด้วยการออกจาก/เข้าร่วมเซสชันเสียงใหม่หลังเกิดการถอดรหัสล้มเหลวซ้ำ.
- `channels.discord.streaming` คือคีย์โหมดสตรีมมาตรฐาน. ค่า legacy `streamMode` และค่า boolean `streaming` จะถูกย้ายข้อมูลโดยอัตโนมัติ.
- `channels.discord.autoPresence` แมปสถานะพร้อมใช้งานของรันไทม์ไปยัง presence ของบอท (healthy => online, degraded => idle, exhausted => dnd) และอนุญาตให้แทนที่ข้อความสถานะได้แบบไม่บังคับ.
- `channels.discord.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ชื่อ/แท็กที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน).
- `channels.discord.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Discord และการให้สิทธิ์ผู้อนุมัติ.
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น). ในโหมด auto การอนุมัติ exec จะเปิดใช้งานเมื่อสามารถ resolve ผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้.
  - `approvers`: ID ผู้ใช้ Discord ที่อนุญาตให้อนุมัติคำขอ exec. fallback ไปยัง `commands.ownerAllowFrom` เมื่อไม่ได้ระบุ.
  - `agentFilter`: allowlist ของ ID agent แบบไม่บังคับ. ไม่ระบุเพื่อส่งต่อการอนุมัติสำหรับ agent ทั้งหมด.
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (substring หรือ regex).
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ. `"dm"` (ค่าเริ่มต้น) ส่งไปยัง DM ของผู้อนุมัติ, `"channel"` ส่งไปยังช่องต้นทาง, `"both"` ส่งไปทั้งสองที่. เมื่อ target มี `"channel"` ปุ่มจะใช้ได้เฉพาะโดยผู้อนุมัติที่ resolve ได้เท่านั้น.
  - `cleanupAfterResolve`: เมื่อเป็น `true` จะลบ DM การอนุมัติหลังจากอนุมัติ ปฏิเสธ หรือหมดเวลา.

**โหมดการแจ้งเตือน reaction:** `off` (ไม่มี), `own` (ข้อความของบอท, ค่าเริ่มต้น), `all` (ทุกข้อความ), `allowlist` (จาก `guilds.<id>.users` ในทุกข้อความ).

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

- JSON ของ service account: แบบ inline (`serviceAccount`) หรือแบบไฟล์ (`serviceAccountFile`).
- รองรับ SecretRef ของ service account ด้วย (`serviceAccountRef`).
- Env fallback: `GOOGLE_CHAT_SERVICE_ACCOUNT` หรือ `GOOGLE_CHAT_SERVICE_ACCOUNT_FILE`.
- ใช้ `spaces/<spaceId>` หรือ `users/<userId>` สำหรับเป้าหมายการส่ง.
- `channels.googlechat.dangerouslyAllowNameMatching` เปิดใช้การจับคู่ principal ของอีเมลที่เปลี่ยนแปลงได้อีกครั้ง (โหมดความเข้ากันได้สำหรับกรณีฉุกเฉิน).

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

- **โหมด Socket** ต้องใช้ทั้ง `botToken` และ `appToken` (`SLACK_BOT_TOKEN` + `SLACK_APP_TOKEN` สำหรับ env fallback ของบัญชีเริ่มต้น).
- **โหมด HTTP** ต้องใช้ `botToken` พร้อม `signingSecret` (ที่ root หรือรายบัญชี).
- `socketMode` ส่งผ่านการปรับแต่ง transport ของ Socket Mode ใน Slack SDK ไปยัง API receiver สาธารณะของ Bolt. ใช้เฉพาะเมื่อตรวจสอบ ping/pong timeout หรือพฤติกรรม websocket ที่ค้างเท่านั้น.
- `botToken`, `appToken`, `signingSecret` และ `userToken` รับสตริง plaintext
  หรืออ็อบเจ็กต์ SecretRef.
- สแนปช็อตบัญชี Slack แสดงฟิลด์ source/status ต่อ credential เช่น
  `botTokenSource`, `botTokenStatus`, `appTokenStatus` และในโหมด HTTP คือ
  `signingSecretStatus`. `configured_unavailable` หมายความว่าบัญชีถูก
  กำหนดค่าผ่าน SecretRef แต่พาธคำสั่ง/รันไทม์ปัจจุบันไม่สามารถ
  resolve ค่า secret ได้.
- `configWrites: false` บล็อกการเขียน config ที่เริ่มจาก Slack.
- `channels.slack.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.
- `channels.slack.streaming.mode` คือคีย์โหมดสตรีมมาตรฐานของ Slack. `channels.slack.streaming.nativeTransport` ควบคุม transport การสตรีมเนทีฟของ Slack. ค่า legacy `streamMode`, ค่า boolean `streaming` และค่า `nativeStreaming` จะถูกย้ายข้อมูลโดยอัตโนมัติ.
- ใช้ `user:<id>` (DM) หรือ `channel:<id>` สำหรับเป้าหมายการส่ง.

**โหมดการแจ้งเตือน reaction:** `off`, `own` (ค่าเริ่มต้น), `all`, `allowlist` (จาก `reactionAllowlist`).

**การแยกเซสชันเธรด:** `thread.historyScope` เป็นแบบต่อเธรด (ค่าเริ่มต้น) หรือใช้ร่วมกันทั่วทั้งช่อง. `thread.inheritParent` คัดลอก transcript ของช่องแม่ไปยังเธรดใหม่.

- การสตรีมเนทีฟของ Slack พร้อมสถานะเธรดแบบผู้ช่วยของ Slack "is typing..." ต้องใช้เป้าหมายเป็นเธรดตอบกลับ. DM ระดับบนสุดจะอยู่นอกเธรดตามค่าเริ่มต้น ดังนั้นจึงใช้ `typingReaction` หรือการส่งแบบปกติแทนพรีวิวแบบเธรด.
- `typingReaction` เพิ่ม reaction ชั่วคราวให้กับข้อความ Slack ขาเข้าขณะกำลังตอบกลับ จากนั้นลบออกเมื่อเสร็จสิ้น. ใช้ shortcode อีโมจิ Slack เช่น `"hourglass_flowing_sand"`.
- `channels.slack.execApprovals`: การส่งการอนุมัติ exec แบบเนทีฟของ Slack และการให้สิทธิ์ผู้อนุมัติ. schema เดียวกับ Discord: `enabled` (`true`/`false`/`"auto"`), `approvers` (ID ผู้ใช้ Slack), `agentFilter`, `sessionFilter` และ `target` (`"dm"`, `"channel"` หรือ `"both"`).

| กลุ่มการกระทำ | ค่าเริ่มต้น | หมายเหตุ                  |
| ------------ | ------- | ---------------------- |
| reactions    | enabled | React + แสดงรายการ reactions |
| messages     | enabled | อ่าน/ส่ง/แก้ไข/ลบ  |
| pins         | enabled | Pin/unpin/แสดงรายการ         |
| memberInfo   | enabled | ข้อมูลสมาชิก            |
| emojiList    | enabled | รายการอีโมจิแบบกำหนดเอง      |

### Mattermost

Mattermost มาพร้อมเป็น Plugin ที่รวมอยู่ใน OpenClaw release ปัจจุบัน. บิลด์ที่เก่ากว่าหรือ
บิลด์แบบกำหนดเองสามารถติดตั้งแพ็กเกจ npm ปัจจุบันด้วย
`openclaw plugins install @openclaw/mattermost`; หาก npm รายงานว่าแพ็กเกจที่
OpenClaw เป็นเจ้าของถูก deprecated ให้ใช้ Plugin ที่มาพร้อมกันหรือ checkout ในเครื่อง
จนกว่าจะเผยแพร่แพ็กเกจ npm ที่ใหม่กว่า.

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

โหมดแชต: `oncall` (ตอบเมื่อมี @-mention, ค่าเริ่มต้น), `onmessage` (ทุกข้อความ), `onchar` (ข้อความที่เริ่มต้นด้วย prefix ทริกเกอร์).

เมื่อเปิดใช้คำสั่งเนทีฟของ Mattermost:

- `commands.callbackPath` ต้องเป็นพาธ (เช่น `/api/channels/mattermost/command`) ไม่ใช่ URL แบบเต็ม.
- `commands.callbackUrl` ต้อง resolve ไปยังปลายทาง Gateway ของ OpenClaw และเข้าถึงได้จากเซิร์ฟเวอร์ Mattermost.
- slash callback แบบเนทีฟได้รับการยืนยันตัวตนด้วยโทเค็นต่อคำสั่งที่ Mattermost ส่งคืน
  ระหว่างการลงทะเบียน slash command. หากการลงทะเบียนล้มเหลวหรือไม่มี
  คำสั่งที่เปิดใช้งาน OpenClaw จะปฏิเสธ callback ด้วย
  `Unauthorized: invalid command token.`
- สำหรับโฮสต์ callback แบบ private/tailnet/internal, Mattermost อาจต้องให้
  `ServiceSettings.AllowedUntrustedInternalConnections` รวมโฮสต์/โดเมนของ callback.
  ใช้ค่าโฮสต์/โดเมน ไม่ใช่ URL แบบเต็ม.
- `channels.mattermost.configWrites`: อนุญาตหรือปฏิเสธการเขียน config ที่เริ่มจาก Mattermost.
- `channels.mattermost.requireMention`: ต้องมี `@mention` ก่อนตอบกลับในช่อง.
- `channels.mattermost.groups.<channelId>.requireMention`: การแทนที่ mention-gating ต่อช่อง (`"*"` สำหรับค่าเริ่มต้น).
- `channels.mattermost.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับ id ของบัญชีที่กำหนดค่าไว้.

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

- `channels.signal.account`: ตรึงการเริ่มต้นช่องทางเข้ากับตัวตนบัญชี Signal ที่ระบุ
- `channels.signal.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก Signal
- `channels.signal.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้

### BlueBubbles

BlueBubbles คือเส้นทาง iMessage ที่แนะนำ (รองรับด้วย Plugin และกำหนดค่าภายใต้ `channels.bluebubbles`)

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
- `channels.bluebubbles.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา BlueBubbles เข้ากับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิล BlueBubbles หรือสตริงเป้าหมาย (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)
- การกำหนดค่าช่องทาง BlueBubbles ฉบับเต็มมีเอกสารไว้ใน [BlueBubbles](/th/channels/bluebubbles)

### iMessage

OpenClaw เรียกใช้ `imsg rpc` (JSON-RPC ผ่าน stdio) ไม่ต้องใช้ดีมอนหรือพอร์ต

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

- `channels.imessage.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้

- ต้องใช้ Full Disk Access สำหรับฐานข้อมูล Messages
- แนะนำให้ใช้เป้าหมาย `chat_id:<id>` ใช้ `imsg chats --limit 20` เพื่อแสดงรายการแชต
- `cliPath` สามารถชี้ไปยัง SSH wrapper ได้ ตั้งค่า `remoteHost` (`host` หรือ `user@host`) สำหรับการดึงไฟล์แนบด้วย SCP
- `attachmentRoots` และ `remoteAttachmentRoots` จำกัดพาธไฟล์แนบขาเข้า (ค่าเริ่มต้น: `/Users/*/Library/Messages/Attachments`)
- SCP ใช้การตรวจสอบ host key แบบเข้มงวด ดังนั้นตรวจสอบให้แน่ใจว่า host key ของ relay มีอยู่ใน `~/.ssh/known_hosts` แล้ว
- `channels.imessage.configWrites`: อนุญาตหรือปฏิเสธการเขียนค่าคอนฟิกที่เริ่มจาก iMessage
- รายการ `bindings[]` ระดับบนสุดที่มี `type: "acp"` สามารถผูกการสนทนา iMessage เข้ากับเซสชัน ACP แบบถาวรได้ ใช้แฮนเดิลที่ปรับรูปแบบแล้วหรือเป้าหมายแชตที่ระบุชัดเจน (`chat_id:*`, `chat_guid:*`, `chat_identifier:*`) ใน `match.peer.id` ความหมายของฟิลด์ที่ใช้ร่วมกัน: [เอเจนต์ ACP](/th/tools/acp-agents#channel-specific-settings)

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

- การยืนยันตัวตนด้วยโทเค็นใช้ `accessToken`; การยืนยันตัวตนด้วยรหัสผ่านใช้ `userId` + `password`
- `channels.matrix.proxy` ส่งทราฟฟิก HTTP ของ Matrix ผ่านพร็อกซี HTTP(S) ที่ระบุชัดเจน บัญชีที่มีชื่อสามารถแทนที่ค่านี้ด้วย `channels.matrix.accounts.<id>.proxy`
- `channels.matrix.network.dangerouslyAllowPrivateNetwork` อนุญาต homeserver ส่วนตัว/ภายใน `proxy` และการเลือกใช้เครือข่ายนี้เป็นตัวควบคุมที่แยกกัน
- `channels.matrix.defaultAccount` เลือกบัญชีที่ต้องการในการตั้งค่าหลายบัญชี
- `channels.matrix.autoJoin` มีค่าเริ่มต้นเป็น `off` ดังนั้นห้องที่เชิญและคำเชิญแบบ DM ใหม่จะถูกเพิกเฉยจนกว่าคุณจะตั้งค่า `autoJoin: "allowlist"` พร้อม `autoJoinAllowlist` หรือ `autoJoin: "always"`
- `channels.matrix.execApprovals`: การส่งคำอนุมัติ exec แบบเนทีฟของ Matrix และการอนุญาตผู้อนุมัติ
  - `enabled`: `true`, `false` หรือ `"auto"` (ค่าเริ่มต้น) ในโหมดอัตโนมัติ คำอนุมัติ exec จะเปิดใช้งานเมื่อสามารถระบุผู้อนุมัติจาก `approvers` หรือ `commands.ownerAllowFrom` ได้
  - `approvers`: รหัสผู้ใช้ Matrix (เช่น `@owner:example.org`) ที่อนุญาตให้อนุมัติคำขอ exec
  - `agentFilter`: allowlist รหัสเอเจนต์แบบไม่บังคับ ละไว้เพื่อส่งต่อคำอนุมัติสำหรับเอเจนต์ทั้งหมด
  - `sessionFilter`: รูปแบบคีย์เซสชันแบบไม่บังคับ (สตริงย่อยหรือ regex)
  - `target`: ตำแหน่งที่จะส่งพรอมป์การอนุมัติ `"dm"` (ค่าเริ่มต้น), `"channel"` (ห้องต้นทาง) หรือ `"both"`
  - การแทนที่รายบัญชี: `channels.matrix.accounts.<id>.execApprovals`
- `channels.matrix.dm.sessionScope` ควบคุมวิธีที่ DM ของ Matrix จัดกลุ่มเป็นเซสชัน: `per-user` (ค่าเริ่มต้น) ใช้ร่วมกันตามเพียร์ที่ถูกเราต์ ขณะที่ `per-room` แยกแต่ละห้อง DM
- โพรบสถานะ Matrix และการค้นหาไดเรกทอรีแบบสดใช้นโยบายพร็อกซีเดียวกับทราฟฟิกขณะรันไทม์
- การกำหนดค่า Matrix ฉบับเต็ม กฎการกำหนดเป้าหมาย และตัวอย่างการตั้งค่ามีเอกสารไว้ใน [Matrix](/th/channels/matrix)

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
- คอนฟิก Teams ฉบับเต็ม (ข้อมูลรับรอง, webhook, นโยบาย DM/กลุ่ม, การแทนที่รายทีม/รายช่องทาง) มีเอกสารไว้ใน [Microsoft Teams](/th/channels/msteams)

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
- `channels.irc.defaultAccount` แบบไม่บังคับจะแทนที่การเลือกบัญชีเริ่มต้นเมื่อค่าตรงกับรหัสบัญชีที่กำหนดค่าไว้
- การกำหนดค่าช่องทาง IRC ฉบับเต็ม (โฮสต์/พอร์ต/TLS/ช่องทาง/allowlist/การควบคุมด้วยการ mention) มีเอกสารไว้ใน [IRC](/th/channels/irc)

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

- `default` จะถูกใช้เมื่อไม่ได้ระบุ `accountId` (CLI + การเราต์)
- โทเค็น env มีผลกับบัญชี **default** เท่านั้น
- การตั้งค่าช่องทางพื้นฐานมีผลกับทุกบัญชี เว้นแต่จะถูกแทนที่รายบัญชี
- ใช้ `bindings[].match.accountId` เพื่อเราต์แต่ละบัญชีไปยังเอเจนต์คนละตัว
- หากคุณเพิ่มบัญชีที่ไม่ใช่ค่าเริ่มต้นผ่าน `openclaw channels add` (หรือการเริ่มต้นใช้งานช่องทาง) ขณะที่ยังใช้คอนฟิกช่องทางระดับบนสุดแบบบัญชีเดียว OpenClaw จะเลื่อนค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีเข้าไปในแมปบัญชีของช่องทางก่อน เพื่อให้บัญชีเดิมยังทำงานต่อได้ ช่องทางส่วนใหญ่จะย้ายค่าเหล่านี้เข้าไปใน `channels.<channel>.accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วแทนได้
- binding ที่มีเฉพาะช่องทางซึ่งมีอยู่แล้ว (ไม่มี `accountId`) จะยังจับคู่กับบัญชีเริ่มต้นต่อไป; binding ที่อยู่ในขอบเขตบัญชียังคงเป็นแบบไม่บังคับ
- `openclaw doctor --fix` ยังซ่อมรูปแบบผสมโดยย้ายค่าบัญชีเดียวระดับบนสุดที่อยู่ในขอบเขตบัญชีเข้าไปในบัญชีที่เลื่อนระดับแล้วซึ่งเลือกสำหรับช่องทางนั้น ช่องทางส่วนใหญ่ใช้ `accounts.default`; Matrix สามารถคงเป้าหมายที่มีชื่อ/ค่าเริ่มต้นที่ตรงกันซึ่งมีอยู่แล้วแทนได้

### ช่องทาง Plugin อื่น ๆ

ช่องทาง Plugin จำนวนมากกำหนดค่าเป็น `channels.<id>` และมีเอกสารในหน้าช่องทางเฉพาะของตัวเอง (เช่น Feishu, Matrix, LINE, Nostr, Zalo, Nextcloud Talk, Synology Chat และ Twitch)
ดูดัชนีช่องทางทั้งหมด: [ช่องทาง](/th/channels)

### การควบคุมการ mention ในแชตกลุ่ม

ข้อความกลุ่มมีค่าเริ่มต้นเป็น **ต้องมีการ mention** (metadata mention หรือรูปแบบ regex ที่ปลอดภัย) ใช้กับแชตกลุ่ม WhatsApp, Telegram, Discord, Google Chat และ iMessage

การตอบกลับที่มองเห็นได้ถูกควบคุมแยกกัน ห้องกลุ่ม/ช่องทางมีค่าเริ่มต้นเป็น `messages.groupChat.visibleReplies: "message_tool"`: OpenClaw ยังคงประมวลผลเทิร์น แต่คำตอบสุดท้ายปกติจะยังเป็นส่วนตัว และเอาต์พุตในห้องที่มองเห็นได้ต้องใช้ `message(action=send)` ตั้งค่า `"automatic"` เฉพาะเมื่อคุณต้องการพฤติกรรมเดิมที่โพสต์คำตอบปกติกลับไปยังห้อง หากต้องการใช้พฤติกรรมการตอบกลับที่มองเห็นได้ผ่านเครื่องมือเท่านั้นกับแชตโดยตรงด้วย ให้ตั้งค่า `messages.visibleReplies: "message_tool"`

Gateway จะ hot-reload คอนฟิก `messages` หลังจากบันทึกไฟล์ รีสตาร์ทเฉพาะเมื่อการเฝ้าดูไฟล์หรือการโหลดคอนฟิกใหม่ถูกปิดใช้งานในการปรับใช้

**ประเภทการ mention:**

- **Metadata mention**: การ @-mention แบบเนทีฟของแพลตฟอร์ม ถูกเพิกเฉยในโหมดแชตกับตัวเองของ WhatsApp
- **รูปแบบข้อความ**: รูปแบบ regex ที่ปลอดภัยใน `agents.list[].groupChat.mentionPatterns` รูปแบบที่ไม่ถูกต้องและการทำซ้ำซ้อนที่ไม่ปลอดภัยจะถูกเพิกเฉย
- การควบคุมด้วยการ mention จะบังคับใช้เฉพาะเมื่อสามารถตรวจจับได้ (การ mention แบบเนทีฟหรือมีรูปแบบอย่างน้อยหนึ่งรายการ)

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

`messages.visibleReplies` คือค่าเริ่มต้นส่วนกลางของเทิร์นต้นทาง; `messages.groupChat.visibleReplies` จะแทนที่ค่านี้สำหรับเทิร์นต้นทางแบบกลุ่ม/ช่องทาง allowlist ของช่องทางและการควบคุมด้วยการ mention ยังคงตัดสินว่าจะประมวลผลเทิร์นหรือไม่

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

การแก้ค่า: การแทนที่ราย DM → ค่าเริ่มต้นของผู้ให้บริการ → ไม่มีขีดจำกัด (เก็บทั้งหมดไว้)

รองรับ: `telegram`, `whatsapp`, `discord`, `slack`, `signal`, `imessage`, `msteams`

#### โหมดแชตกับตัวเอง

ใส่หมายเลขของคุณเองใน `allowFrom` เพื่อเปิดใช้งานโหมดแชตกับตัวเอง (เพิกเฉยต่อการ @-mention แบบเนทีฟ และตอบกลับเฉพาะรูปแบบข้อความเท่านั้น):

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

- บล็อกนี้กำหนดค่าพื้นผิวคำสั่ง สำหรับแค็ตตาล็อกคำสั่งในตัว + ที่รวมมาพร้อมกันปัจจุบัน โปรดดู [คำสั่ง Slash](/th/tools/slash-commands)
- หน้านี้เป็น**ข้อมูลอ้างอิงคีย์การกำหนดค่า** ไม่ใช่แค็ตตาล็อกคำสั่งทั้งหมด คำสั่งที่ช่องทาง/Plugin เป็นเจ้าของ เช่น QQ Bot `/bot-ping` `/bot-help` `/bot-logs`, LINE `/card`, การจับคู่อุปกรณ์ `/pair`, หน่วยความจำ `/dreaming`, การควบคุมโทรศัพท์ `/phone` และ Talk `/voice` มีเอกสารอยู่ในหน้าช่องทาง/Plugin ของตน รวมถึง [คำสั่ง Slash](/th/tools/slash-commands)
- คำสั่งข้อความต้องเป็นข้อความแบบ**แยกเดี่ยว**ที่ขึ้นต้นด้วย `/`
- `native: "auto"` เปิดคำสั่งเนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- `nativeSkills: "auto"` เปิดคำสั่ง Skills เนทีฟสำหรับ Discord/Telegram และปล่อย Slack ปิดไว้
- แทนที่เป็นรายช่องทาง: `channels.discord.commands.native` (บูลีนหรือ `"auto"`) `false` จะล้างคำสั่งที่ลงทะเบียนไว้ก่อนหน้า
- แทนที่การลงทะเบียน Skills เนทีฟเป็นรายช่องทางด้วย `channels.<provider>.commands.nativeSkills`
- `channels.telegram.customCommands` เพิ่มรายการเมนูบอต Telegram เพิ่มเติม
- `bash: true` เปิดใช้ `! <cmd>` สำหรับเชลล์โฮสต์ ต้องมี `tools.elevated.enabled` และผู้ส่งอยู่ใน `tools.elevated.allowFrom.<channel>`
- `config: true` เปิดใช้ `/config` (อ่าน/เขียน `openclaw.json`) สำหรับไคลเอนต์ `chat.send` ของ Gateway การเขียนแบบถาวรด้วย `/config set|unset` ต้องมี `operator.admin` ด้วย ส่วน `/config show` แบบอ่านอย่างเดียวยังคงพร้อมใช้งานสำหรับไคลเอนต์โอเปอเรเตอร์ขอบเขตเขียนปกติ
- `mcp: true` เปิดใช้ `/mcp` สำหรับการกำหนดค่าเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการภายใต้ `mcp.servers`
- `plugins: true` เปิดใช้ `/plugins` สำหรับการค้นพบ Plugin, การติดตั้ง และตัวควบคุมการเปิด/ปิดใช้งาน
- `channels.<provider>.configWrites` ควบคุมการเปลี่ยนแปลงการกำหนดค่าตามช่องทาง (ค่าเริ่มต้น: true)
- สำหรับช่องทางหลายบัญชี `channels.<provider>.accounts.<id>.configWrites` จะควบคุมการเขียนที่มุ่งไปยังบัญชีนั้นด้วย (เช่น `/allowlist --config --account <id>` หรือ `/config set channels.<provider>.accounts.<id>...`)
- `restart: false` ปิดใช้งาน `/restart` และการทำงานของเครื่องมือรีสตาร์ต Gateway ค่าเริ่มต้น: `true`
- `ownerAllowFrom` คือ allowlist เจ้าของแบบระบุชัดเจนสำหรับคำสั่ง/เครื่องมือเฉพาะเจ้าของ โดยแยกจาก `allowFrom`
- `ownerDisplay: "hash"` แฮชรหัสเจ้าของใน system prompt ตั้งค่า `ownerDisplaySecret` เพื่อควบคุมการแฮช
- `allowFrom` เป็นแบบรายผู้ให้บริการ เมื่อกำหนดค่าแล้ว ค่านี้จะเป็นแหล่งอนุญาต**เพียงแหล่งเดียว** (allowlist/การจับคู่ของช่องทาง และ `useAccessGroups` จะถูกละเว้น)
- `useAccessGroups: false` อนุญาตให้คำสั่งข้ามนโยบายกลุ่มการเข้าถึงได้เมื่อไม่ได้ตั้งค่า `allowFrom`
- แผนผังเอกสารคำสั่ง:
  - แค็ตตาล็อกในตัว + ที่รวมมาพร้อมกัน: [คำสั่ง Slash](/th/tools/slash-commands)
  - พื้นผิวคำสั่งเฉพาะช่องทาง: [ช่องทาง](/th/channels)
  - คำสั่ง QQ Bot: [QQ Bot](/th/channels/qqbot)
  - คำสั่งการจับคู่: [การจับคู่](/th/channels/pairing)
  - คำสั่งการ์ด LINE: [LINE](/th/channels/line)
  - หน่วยความจำ Dreaming: [Dreaming](/th/concepts/dreaming)

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุด
- [การกำหนดค่า — เอเจนต์](/th/gateway/config-agents)
- [ภาพรวมช่องทาง](/th/channels)
