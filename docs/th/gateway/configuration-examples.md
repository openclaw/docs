---
read_when:
    - เรียนรู้วิธีกำหนดค่า OpenClaw
    - กำลังมองหาตัวอย่างการกำหนดค่า
    - การตั้งค่า OpenClaw เป็นครั้งแรก
summary: ตัวอย่างการกำหนดค่าที่ตรงตามสคีมาสำหรับการตั้งค่า OpenClaw ทั่วไป
title: ตัวอย่างการกำหนดค่า
x-i18n:
    generated_at: "2026-07-16T19:14:07Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 67a669f3da2392aa8d2953fa124c43447afe3da971d5f5e497d6c2ec3bf88c6a
    source_path: gateway/configuration-examples.md
    workflow: 16
---

ตัวอย่างด้านล่างสอดคล้องกับสคีมาการกำหนดค่าปัจจุบัน สำหรับเอกสารอ้างอิงฉบับสมบูรณ์และหมายเหตุของแต่ละฟิลด์ โปรดดู[การกำหนดค่า](/th/gateway/configuration)

## เริ่มต้นอย่างรวดเร็ว

### ขั้นต่ำสุด

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: { whatsapp: { allowFrom: ["+15555550123"] } },
}
```

บันทึกไว้ที่ `~/.openclaw/openclaw.json` แล้วคุณจะส่งข้อความส่วนตัวถึงบอตจากหมายเลขดังกล่าวได้

### การตั้งค่าเริ่มต้นที่แนะนำ

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "anthropic/claude-sonnet-4-6" },
    },
    list: [
      {
        id: "main",
        identity: {
          name: "Clawd",
          theme: "helpful assistant",
          emoji: "🦞",
        },
      },
    ],
  },
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },
  },
  messages: {
    visibleReplies: "automatic",
    groupChat: {
      visibleReplies: "message_tool", // เลือกใช้; เอาต์พุตที่มองเห็นได้ต้องใช้ message(action=send)
      unmentionedInbound: "room_event",
    },
  },
}
```

## ตัวอย่างแบบขยาย (ตัวเลือกหลัก)

> JSON5 อนุญาตให้ใช้ความคิดเห็นและเครื่องหมายจุลภาคต่อท้ายได้ JSON ปกติก็ใช้ได้เช่นกัน

```json5
{
  // สภาพแวดล้อม + เชลล์
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },

  // ข้อมูลเมตาของโปรไฟล์การยืนยันตัวตน (ข้อมูลลับอยู่ใน auth-profiles.json)
  auth: {
    profiles: {
      "anthropic:default": { provider: "anthropic", mode: "api_key" },
      "anthropic:work": { provider: "anthropic", mode: "api_key" },
      "openai:default": { provider: "openai", mode: "api_key" },
      "openai:personal": { provider: "openai", mode: "oauth" },
    },
    order: {
      anthropic: ["anthropic:default", "anthropic:work"],
      openai: ["openai:personal", "openai:default"],
    },
  },

  // ข้อมูลประจำตัวกำหนดแยกตามเอเจนต์ — ตั้งค่าใน agents.list[].identity ด้านล่าง

  // การบันทึก日志
  logging: {
    level: "info",
    file: "/tmp/openclaw/openclaw.log",
    consoleLevel: "info",
    consoleStyle: "pretty",
    redactSensitive: "tools",
  },

  // การจัดรูปแบบข้อความ
  messages: {
    messagePrefix: "[openclaw]",
    visibleReplies: "automatic",
    responsePrefix: ">",
    ackReaction: "👀",
    ackReactionScope: "group-mentions",
    groupChat: {
      historyLimit: 50,
      visibleReplies: "message_tool", // เลือกใช้สำหรับห้องที่ใช้ร่วมกันกับโมเดลที่เรียกใช้เครื่องมือได้อย่างเชื่อถือได้
      unmentionedInbound: "room_event",
    },
    queue: {
      mode: "followup",
      debounceMs: 500,
      cap: 20,
      drop: "summarize",
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
        discord: "collect",
        slack: "collect",
        signal: "followup",
        imessage: "followup",
        webchat: "followup",
      },
    },
  },

  // เครื่องมือ
  tools: {
    media: {
      audio: {
        enabled: true,
        maxBytes: 20971520,
        models: [
          { provider: "openai", model: "gpt-4o-transcribe" },
          // CLI สำรองที่เลือกใช้ได้ (ไบนารี Whisper):
          // { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] }
        ],
        timeoutSeconds: 120,
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },

  // ลักษณะการทำงานของเซสชัน
  session: {
    scope: "per-sender",
    dmScope: "per-channel-peer", // แนะนำสำหรับกล่องข้อความที่มีผู้ใช้หลายคน
    reset: {
      mode: "daily",
      atHour: 4,
      idleMinutes: 60,
    },
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 10080 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/main/sessions/sessions.json",
    maintenance: {
      mode: "warn",
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // ระยะเวลาหรือ false
      maxDiskBytes: "500mb", // ไม่บังคับ
      highWaterBytes: "400mb", // ไม่บังคับ (ค่าเริ่มต้นคือ 80% ของ maxDiskBytes)
    },
    typingIntervalSeconds: 5,
    sendPolicy: {
      default: "allow",
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
    },
  },

  // ช่องทาง
  channels: {
    whatsapp: {
      dmPolicy: "pairing",
      allowFrom: ["+15555550123"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["+15555550123"],
      groups: { "*": { requireMention: true } },
    },

    telegram: {
      enabled: true,
      botToken: "YOUR_TELEGRAM_BOT_TOKEN",
      allowFrom: ["123456789"],
      groupPolicy: "allowlist",
      groupAllowFrom: ["123456789"],
      groups: { "*": { requireMention: true } },
    },

    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678"] },
      guilds: {
        "123456789012345678": {
          slug: "friends-of-openclaw",
          requireMention: false,
          channels: {
            general: { enabled: true },
            help: { enabled: true, requireMention: true },
          },
        },
      },
    },

    slack: {
      enabled: true,
      botToken: "xoxb-REPLACE_ME",
      appToken: "xapp-REPLACE_ME",
      channels: {
        "#general": { enabled: true, requireMention: true },
      },
      dm: { enabled: true, allowFrom: ["U123"] },
      slashCommand: {
        enabled: true,
        name: "openclaw",
        sessionPrefix: "slack:slash",
        ephemeral: true,
      },
    },
  },

  // รันไทม์ของเอเจนต์
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      userTimezone: "America/Chicago",
      model: {
        primary: "anthropic/claude-sonnet-4-6",
        fallbacks: ["anthropic/claude-opus-4-6", "openai/gpt-5.4"],
      },
      imageModel: {
        primary: "openrouter/anthropic/claude-sonnet-4-6",
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "anthropic/claude-sonnet-4-6": { alias: "sonnet" },
        "openai/gpt-5.4": { alias: "gpt" },
      },
      skills: ["github", "weather"], // เอเจนต์ที่ละเว้น list[].skills จะรับค่านี้สืบทอดไป
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
      reasoningDefault: "off",
      elevatedDefault: "on",
      blockStreamingDefault: "off",
      blockStreamingBreak: "text_end",
      blockStreamingChunk: {
        minChars: 800,
        maxChars: 1200,
        breakPreference: "paragraph",
      },
      blockStreamingCoalesce: {
        idleMs: 1000,
      },
      humanDelay: {
        mode: "natural",
      },
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      typingIntervalSeconds: 5,
      maxConcurrent: 3,
      heartbeat: {
        every: "30m",
        model: "anthropic/claude-sonnet-4-6",
        target: "last",
        directPolicy: "allow", // allow (ค่าเริ่มต้น) | block
        to: "+15555550123",
        prompt: "HEARTBEAT",
        ackMaxChars: 300,
      },
      memorySearch: {
        provider: "gemini",
        model: "gemini-embedding-001",
        remote: {
          apiKey: "${GEMINI_API_KEY}",
        },
        extraPaths: ["../team-docs", "/srv/shared-notes"],
      },
      sandbox: {
        mode: "non-main",
        scope: "session", // แนะนำให้ใช้แทน perSession: true แบบเดิม
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
        },
        browser: {
          enabled: false,
        },
      },
    },
    list: [
      {
        id: "main",
        default: true,
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
        },
        // รับค่า defaults.skills สืบทอดมา -> github, weather
        groupChat: {
          mentionPatterns: ["@openclaw", "openclaw"],
        },
        thinkingDefault: "high", // แทนที่การตั้งค่าการคิดสำหรับเอเจนต์นี้
        reasoningDefault: "on", // การแสดงผลการให้เหตุผลสำหรับเอเจนต์นี้
        fastModeDefault: false, // โหมดเร็วสำหรับเอเจนต์นี้
      },
      {
        id: "quick",
        skills: [], // ไม่มี Skills สำหรับเอเจนต์นี้
        fastModeDefault: true, // เอเจนต์นี้ทำงานในโหมดเร็วเสมอ
        thinkingDefault: "off",
      },
    ],
  },

  tools: {
    allow: ["exec", "process", "read", "write", "edit", "apply_patch"],
    deny: ["browser", "canvas"],
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
    },
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        telegram: ["123456789"],
        discord: ["123456789012345678"],
        slack: ["U123"],
        signal: ["+15555550123"],
        imessage: ["user@example.com"],
        webchat: ["session:demo"],
      },
    },
  },

  // ผู้ให้บริการโมเดลแบบกำหนดเอง
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-responses",
        authHeader: true,
        headers: { "X-Proxy-Region": "us-west" },
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            api: "openai-responses",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },

  // งาน Cron
  cron: {
    enabled: true,
    store: "~/.openclaw/cron/jobs.json",
    maxConcurrentRuns: 8, // ค่าเริ่มต้น; การส่งงาน Cron + การดำเนินการรอบเอเจนต์ Cron แบบแยกส่วน
    sessionRetention: "24h",
  },

  // Webhook
  hooks: {
    enabled: true,
    path: "/hooks",
    token: "shared-secret",
    presets: ["gmail"],
    transformsDir: "~/.openclaw/hooks/transforms",
    mappings: [
      {
        id: "gmail-hook",
        match: { path: "gmail" },
        action: "agent",
        wakeMode: "now",
        name: "Gmail",
        sessionKey: "hook:gmail:{{messages[0].id}}",
        messageTemplate: "From: {{messages[0].from}}\nSubject: {{messages[0].subject}}",
        textTemplate: "{{messages[0].snippet}}",
        deliver: true,
        channel: "last",
        to: "+15555550123",
        thinking: "low",
        timeoutSeconds: 300,
        transform: {
          module: "gmail.js",
          export: "transformGmail",
        },
      },
    ],
    gmail: {
      account: "openclaw@gmail.com",
      label: "INBOX",
      topic: "projects/<project-id>/topics/gog-gmail-watch",
      subscription: "gog-gmail-watch-push",
      pushToken: "shared-push-token",
      hookUrl: "http://127.0.0.1:18789/hooks/gmail",
      includeBody: true,
      maxBytes: 20000,
      renewEveryMinutes: 720,
      serve: { bind: "127.0.0.1", port: 8788, path: "/" },
      tailscale: { mode: "funnel", path: "/gmail-pubsub" },
    },
  },

  // Gateway + เครือข่าย
  gateway: {
    mode: "local",
    port: 18789,
    bind: "loopback",
    controlUi: { enabled: true, basePath: "/openclaw" },
    auth: {
      mode: "token",
      token: "gateway-token",
      allowTailscale: true,
    },
    tailscale: { mode: "serve", resetOnExit: false },
    remote: { url: "ws://gateway-host.ts.net:18789", token: "remote-token" },
    reload: { mode: "hybrid", debounceMs: 300 },
  },

  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills"],
      allowSymlinkTargets: ["~/Projects/agent-scripts/skills"],
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: { GEMINI_API_KEY: "GEMINI_KEY_HERE" },
      },
      peekaboo: { enabled: true },
    },
  },
}
```

### ที่เก็บ Skills ข้างเคียงที่เชื่อมด้วยลิงก์สัญลักษณ์

ใช้วิธีนี้เมื่อรูทของ Skills ในตัวมีลิงก์สัญลักษณ์ไปยังที่เก็บข้างเคียง เช่น
`~/.agents/skills/manager -> ~/Projects/manager/skills`

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

- `extraDirs` สแกนที่เก็บข้างเคียงเป็นรูท Skills ที่ระบุไว้อย่างชัดเจน
- `allowSymlinkTargets` อนุญาตให้โฟลเดอร์ Skills ที่เชื่อมด้วยลิงก์สัญลักษณ์ชี้ไปยัง
  รูทเป้าหมายจริงที่เชื่อถือได้ โดยไม่อนุญาตให้ลิงก์สัญลักษณ์หลุดออกไปยังตำแหน่งอื่นโดยพลการ
- หากต้องการให้ Skill Workshop เขียนผ่านเป้าหมายลิงก์สัญลักษณ์ที่เชื่อถือได้เดียวกัน
  ให้ตั้งค่า `skills.workshop.allowSymlinkTargetWrites: true`

## รูปแบบทั่วไป

### ค่าพื้นฐานของ Skills ที่ใช้ร่วมกัน พร้อมการแทนที่หนึ่งรายการ

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      skills: ["github", "weather"],
    },
    list: [
      { id: "main", default: true },
      { id: "docs", workspace: "~/.openclaw/workspace-docs", skills: ["docs-search"] },
    ],
  },
}
```

- `agents.defaults.skills` เป็นค่าพื้นฐานที่ใช้ร่วมกัน
- `agents.list[].skills` จะแทนที่ค่าพื้นฐานดังกล่าวสำหรับเอเจนต์หนึ่งตัว
- ใช้ `skills: []` เมื่อไม่ต้องการให้เอเจนต์เห็น Skills ใดๆ

### การตั้งค่าหลายแพลตฟอร์ม

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
  channels: {
    whatsapp: { allowFrom: ["+15555550123"] },
    telegram: {
      enabled: true,
      botToken: "YOUR_TOKEN",
      allowFrom: ["123456789"],
    },
    discord: {
      enabled: true,
      token: "YOUR_TOKEN",
      dm: { allowFrom: ["123456789012345678"] },
    },
  },
}
```

### การอนุมัติอัตโนมัติสำหรับเครือข่าย Node ที่เชื่อถือได้

ให้จับคู่อุปกรณ์ด้วยตนเองต่อไป เว้นแต่คุณจะควบคุมเส้นทางเครือข่าย สำหรับซับเน็ต
ห้องปฏิบัติการหรือ tailnet โดยเฉพาะ คุณสามารถเลือกเปิดใช้การอนุมัติอุปกรณ์ Node
โดยอัตโนมัติเมื่อเชื่อมต่อครั้งแรกด้วย CIDR หรือ IP ที่ระบุอย่างเจาะจงได้:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24", "fd00:1234:5678::/64"],
      },
    },
  },
}
```

หากไม่ได้ตั้งค่า คุณสมบัตินี้จะยังคงปิดอยู่ โดยจะใช้กับการจับคู่ `role: node` ใหม่
ที่ไม่ได้ขอขอบเขตสิทธิ์เท่านั้น ไคลเอนต์ของผู้ปฏิบัติงาน/เบราว์เซอร์ รวมถึงการอัปเกรดบทบาท ขอบเขตสิทธิ์ เมทาดาทา
หรือกุญแจสาธารณะ ยังคงต้องได้รับการอนุมัติด้วยตนเอง

### โหมด DM ที่ปลอดภัย (กล่องข้อความที่ใช้ร่วมกัน / DM แบบหลายผู้ใช้)

หากมีผู้ใช้มากกว่าหนึ่งคนที่สามารถส่ง DM ถึงบอตของคุณได้ (มีหลายรายการใน `allowFrom` มีการอนุมัติการจับคู่สำหรับหลายคน หรือ `dmPolicy: "open"`) ให้เปิดใช้ **โหมด DM ที่ปลอดภัย** เพื่อไม่ให้ DM จากผู้ส่งต่างกันใช้บริบทร่วมกันโดยค่าเริ่มต้น:

```json5
{
  // โหมด DM ที่ปลอดภัย (แนะนำสำหรับเอเจนต์ DM แบบหลายผู้ใช้หรือที่จัดการข้อมูลละเอียดอ่อน)
  session: { dmScope: "per-channel-peer" },

  channels: {
    // ตัวอย่าง: กล่องข้อความ WhatsApp แบบหลายผู้ใช้
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15555550123", "+15555550124"],
    },

    // ตัวอย่าง: กล่องข้อความ Discord แบบหลายผู้ใช้
    discord: {
      enabled: true,
      token: "YOUR_DISCORD_BOT_TOKEN",
      dm: { enabled: true, allowFrom: ["123456789012345678", "987654321098765432"] },
    },
  },
}
```

สำหรับ Discord/Google Chat/IRC/Mattermost/Microsoft Teams/Slack การอนุญาตผู้ส่งจะใช้ ID เป็นหลักโดยค่าเริ่มต้น
ให้เปิดใช้การจับคู่ชื่อ/อีเมล/ชื่อเล่นโดยตรงซึ่งสามารถเปลี่ยนแปลงได้ด้วย `dangerouslyAllowNameMatching: true` ของแต่ละช่องทาง เฉพาะเมื่อคุณยอมรับความเสี่ยงดังกล่าวอย่างชัดเจนเท่านั้น

### คีย์ API ของ Anthropic + MiniMax สำรอง

```json5
{
  auth: {
    profiles: {
      "anthropic:api": {
        provider: "anthropic",
        mode: "api_key",
      },
    },
    order: {
      anthropic: ["anthropic:api"],
    },
  },
  models: {
    providers: {
      minimax: {
        baseUrl: "https://api.minimax.io/anthropic",
        api: "anthropic-messages",
        apiKey: "${MINIMAX_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
    },
  },
}
```

### บอตสำหรับงาน (จำกัดการเข้าถึง)

```json5
{
  agents: {
    defaults: {
      workspace: "~/work-openclaw",
      elevatedDefault: "off",
    },
    list: [
      {
        id: "main",
        identity: {
          name: "WorkBot",
          theme: "professional assistant",
        },
      },
    ],
  },
  channels: {
    slack: {
      enabled: true,
      botToken: "xoxb-...",
      channels: {
        "#engineering": { enabled: true, requireMention: true },
        "#general": { enabled: true, requireMention: true },
      },
    },
  },
}
```

### โมเดลภายในเครื่องเท่านั้น

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
      model: { primary: "lmstudio/my-local-model" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      lmstudio: {
        baseUrl: "http://127.0.0.1:1234/v1",
        apiKey: "lmstudio",
        api: "openai-responses",
        models: [
          {
            id: "my-local-model",
            name: "Local Model",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 196608,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
}
```

## เคล็ดลับ

- หากคุณตั้งค่า `dmPolicy: "open"` รายการ `allowFrom` ที่ตรงกันต้องมี `"*"`
- ID ของผู้ให้บริการมีรูปแบบแตกต่างกัน (หมายเลขโทรศัพท์ ID ผู้ใช้ ID ช่องทาง) โปรดดูเอกสารของผู้ให้บริการเพื่อยืนยันรูปแบบ
- ส่วนเสริมที่สามารถเพิ่มในภายหลัง: `web`, `browser`, `ui`, `discovery`, `plugins`, `talk`, `signal`, `imessage`
- ดูหมายเหตุการตั้งค่าเชิงลึกเพิ่มเติมได้ที่ [ผู้ให้บริการ](/th/providers) และ [การแก้ไขปัญหา](/th/gateway/troubleshooting)

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)
- [การกำหนดค่า](/th/gateway/configuration)
