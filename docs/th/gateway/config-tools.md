---
read_when:
    - การกำหนดค่านโยบาย `tools.*` รายการอนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL ฐาน
    - การตั้งค่าเอ็นด์พอยต์แบบโฮสต์เองที่เข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย สวิตช์ทดลอง เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-06-27T17:32:23Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 65de2ec00c28128071b6c1468417b1025d46be6d189a07ade995e050dde6445f
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` คีย์การกำหนดค่าและการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับ agents, channels และคีย์การกำหนดค่าระดับบนสุดอื่นๆ ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่ารายการอนุญาตพื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
การเริ่มต้นใช้งานภายในเครื่องจะตั้งค่าเริ่มต้นของการกำหนดค่าภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ระบุไว้ชัดเจนอยู่แล้วจะยังคงเดิม)
</Note>

| โปรไฟล์     | รวม                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                                             |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `skill_workshop`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                                         |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                                    |

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ได้รับการยอมรับเป็นชื่อแทนของ `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                    |
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวม provider plugins)                                                                          |
| `group:plugins`    | เครื่องมือที่เป็นของ plugins ที่โหลดแล้ว รวมถึงเซิร์ฟเวอร์ MCP ที่กำหนดค่าและเปิดเผยผ่าน `bundle-mcp`                            |

### เครื่องมือ MCP และ Plugin ภายในนโยบายเครื่องมือ sandbox

เซิร์ฟเวอร์ MCP ที่กำหนดค่าไว้จะถูกเปิดเผยเป็นเครื่องมือที่เป็นของ Plugin ภายใต้ id ของ Plugin `bundle-mcp` โปรไฟล์เครื่องมือปกติสามารถอนุญาตได้ แต่ `tools.sandbox.tools` เป็นด่านเพิ่มเติมสำหรับเซสชันที่อยู่ใน sandbox หากโหมด sandbox เป็น `"all"` หรือ `"non-main"` ให้ใส่หนึ่งในรายการเหล่านี้ในรายการอนุญาตเครื่องมือ sandbox เมื่อควรให้เครื่องมือ MCP/Plugin มองเห็นได้:

- `bundle-mcp` สำหรับเซิร์ฟเวอร์ MCP ที่ OpenClaw จัดการจาก `mcp.servers`
- id ของ Plugin สำหรับ native plugin เฉพาะ
- `group:plugins` สำหรับเครื่องมือทั้งหมดที่เป็นของ Plugin ที่โหลดแล้ว
- ชื่อเครื่องมือเซิร์ฟเวอร์ MCP แบบตรงตัวหรือ glob ของเซิร์ฟเวอร์ เช่น `outlook__send_mail` หรือ `outlook__*` เมื่อคุณต้องการเพียงเซิร์ฟเวอร์เดียว

glob ของเซิร์ฟเวอร์ใช้คำนำหน้าเซิร์ฟเวอร์ MCP ที่ปลอดภัยสำหรับผู้ให้บริการ ไม่จำเป็นต้องเป็นคีย์ `mcp.servers` ดิบ อักขระที่ไม่ใช่ `[A-Za-z0-9_-]` จะกลายเป็น `-`, ชื่อที่ไม่ได้ขึ้นต้นด้วยตัวอักษรจะได้รับคำนำหน้า `mcp-` และคำนำหน้าที่ยาวหรือซ้ำกันอาจถูกตัดทอนหรือเติมคำต่อท้าย ตัวอย่างเช่น `mcp.servers["Outlook Graph"]` ใช้ glob เช่น `outlook-graph__*`

```json5
{
  agents: { defaults: { sandbox: { mode: "all" } } },
  mcp: {
    servers: {
      outlook: { command: "node", args: ["./outlook-mcp.js"] },
    },
  },
  tools: {
    sandbox: {
      tools: {
        alsoAllow: ["web_search", "web_fetch", "memory_search", "memory_get", "bundle-mcp"],
      },
    },
  },
}
```

หากไม่มีรายการในชั้น sandbox นั้น เซิร์ฟเวอร์ MCP ยังสามารถโหลดสำเร็จได้ แต่เครื่องมือของเซิร์ฟเวอร์จะถูกกรองออกก่อนคำขอไปยังผู้ให้บริการ ใช้ `openclaw doctor` เพื่อตรวจจับรูปแบบนี้สำหรับเซิร์ฟเวอร์ที่ OpenClaw จัดการใน `mcp.servers` เซิร์ฟเวอร์ MCP ที่โหลดจาก manifest ของ bundled plugin หรือ Claude `.mcp.json` ใช้ด่าน sandbox เดียวกัน แต่การวินิจฉัยนี้ยังไม่ได้แจกแจงแหล่งเหล่านั้น ใช้รายการอนุญาตแบบเดียวกันหากเครื่องมือของแหล่งเหล่านั้นหายไปในรอบการทำงานที่อยู่ใน sandbox

### `tools.codeMode`

`tools.codeMode` เปิดใช้งานพื้นผิว code-mode ทั่วไปของ OpenClaw เมื่อเปิดใช้งาน
สำหรับการรันที่มีเครื่องมือ โมเดลจะเห็นเฉพาะ `exec` และ `wait`; เครื่องมือ OpenClaw
ปกติจะย้ายไปอยู่หลังสะพานแค็ตตาล็อก `tools.*` ภายใน sandbox และเครื่องมือ MCP จะ
พร้อมใช้งานผ่านเนมสเปซ `MCP` ที่สร้างขึ้น

```json5
{
  tools: {
    codeMode: {
      enabled: true,
    },
  },
}
```

รองรับรูปแบบย่อด้วยเช่นกัน:

```json5
{
  tools: { codeMode: true },
}
```

การประกาศ MCP จะถูกเปิดเผยผ่านพื้นผิวไฟล์ API เสมือนแบบอ่านอย่างเดียวใน
code mode โค้ด guest สามารถเรียก `API.list("mcp")` และ
`API.read("mcp/<server>.d.ts")` เพื่อตรวจสอบลายเซ็นสไตล์ TypeScript ก่อน
เรียก `MCP.<server>.<tool>()` ดู [Code mode](/th/reference/code-mode) สำหรับ
สัญญา runtime, ขีดจำกัด และขั้นตอนการดีบัก

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือแบบรวมทั้งระบบ (deny ชนะ) ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ รองรับ wildcard `*` มีผลแม้เมื่อ Docker sandbox ปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็น tool ids แยกกัน `allow: ["write"]` จะเปิดใช้งาน `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` จะไม่ปฏิเสธ `apply_patch` หากต้องการบล็อกการแก้ไขไฟล์ทั้งหมด ให้ปฏิเสธ `group:fs` หรือระบุเครื่องมือที่ทำการเปลี่ยนแปลงแต่ละรายการอย่างชัดเจน:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับผู้ให้บริการหรือโมเดลเฉพาะ ลำดับ: โปรไฟล์พื้นฐาน → โปรไฟล์ผู้ให้บริการ → allow/deny

```json5
{
  tools: {
    profile: "coding",
    byProvider: {
      "google-antigravity": { profile: "minimal" },
      "openai/gpt-5.4": { allow: ["group:fs", "sessions_list"] },
    },
  },
}
```

### `tools.toolsBySender`

จำกัดเครื่องมือสำหรับตัวตนผู้ขอเฉพาะ นี่คือการป้องกันเชิงลึกเพิ่มเติมจากการควบคุมการเข้าถึงช่องทาง; ค่า sender ต้องมาจาก channel adapter ไม่ใช่ข้อความ

```json5
{
  tools: {
    toolsBySender: {
      "channel:discord:1234567890123": { alsoAllow: ["group:fs"] },
      "id:guest-user-id": { deny: ["group:runtime", "group:fs"] },
      "*": { deny: ["exec", "process", "write", "edit", "apply_patch"] },
    },
  },
}
```

คีย์ใช้คำนำหน้าที่ชัดเจน: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` หรือ `"*"` Channel ids เป็น id ตามมาตรฐานของ OpenClaw; ชื่อแทน เช่น `teams` จะ normalize เป็น `msteams` คีย์เดิมที่ไม่มีคำนำหน้าจะยอมรับเป็น `id:` เท่านั้น ลำดับการจับคู่คือ channel+id, id, e164, username, name แล้วจึง wildcard

`agents.list[].tools.toolsBySender` แบบต่อ agent จะ override การจับคู่ sender แบบ global เมื่อจับคู่ได้ แม้จะมีนโยบายว่าง `{}`

### `tools.elevated`

ควบคุมการเข้าถึง exec ระดับยกระดับภายนอก sandbox:

```json5
{
  tools: {
    elevated: {
      enabled: true,
      allowFrom: {
        whatsapp: ["+15555550123"],
        discord: ["1234567890123", "987654321098765432"],
      },
    },
  },
}
```

- การ override ต่อ agent (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดให้เข้มงวดยิ่งขึ้น
- `/elevated on|off|ask|full` จัดเก็บสถานะต่อเซสชัน; directive แบบ inline มีผลกับข้อความเดียว
- `exec` แบบ elevated ข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

### `tools.exec`

```json5
{
  tools: {
    exec: {
      backgroundMs: 10000,
      timeoutSec: 1800,
      cleanupMs: 1800000,
      notifyOnExit: true,
      notifyOnExitEmptySuccess: false,
      commandHighlighting: false,
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

การตรวจสอบความปลอดภัยของ tool-loop จะ **ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ สามารถกำหนดการตั้งค่าแบบ global ใน `tools.loopDetection` และ override ต่อ agent ได้ที่ `agents.list[].tools.loopDetection`

```json5
{
  tools: {
    loopDetection: {
      enabled: true,
      historySize: 30,
      warningThreshold: 10,
      criticalThreshold: 20,
      globalCircuitBreakerThreshold: 30,
      detectors: {
        genericRepeat: true,
        knownPollNoProgress: true,
        pingPong: true,
      },
    },
  },
}
```

<ParamField path="historySize" type="number">
  ประวัติ tool-call สูงสุดที่เก็บไว้สำหรับการวิเคราะห์ loop
</ParamField>
<ParamField path="warningThreshold" type="number">
  เกณฑ์ของรูปแบบการทำซ้ำที่ไม่มีความคืบหน้าสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  เกณฑ์การทำซ้ำที่สูงขึ้นสำหรับการบล็อก loop วิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  เกณฑ์หยุดแบบเด็ดขาดสำหรับการรันใดๆ ที่ไม่มีความคืบหน้า
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียก tool เดิม/args เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกบนเครื่องมือ poll ที่รู้จัก (`process.poll`, `command_status` เป็นต้น)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกบนรูปแบบคู่สลับที่ไม่มีความคืบหน้า
</ParamField>

<Warning>
หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบความถูกต้องจะล้มเหลว
</Warning>

### `tools.web`

```json5
{
  tools: {
    web: {
      search: {
        enabled: true,
        apiKey: "brave_api_key", // or BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // optional; omit for auto-detect
        maxChars: 50000,
        maxCharsCap: 50000,
        maxResponseBytes: 2000000,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
        maxRedirects: 3,
        readability: true,
        userAgent: "custom-ua",
      },
    },
  },
}
```

### `tools.media`

กำหนดค่าการทำความเข้าใจสื่อขาเข้า (รูปภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // deprecated: completions stay agent-mediated
      },
      audio: {
        enabled: true,
        maxBytes: 20971520,
        scope: {
          default: "deny",
          rules: [{ action: "allow", match: { chatType: "direct" } }],
        },
        models: [
          { provider: "openai", model: "gpt-4o-mini-transcribe" },
          { type: "cli", command: "whisper", args: ["--model", "base", "{{MediaPath}}"] },
        ],
      },
      image: {
        enabled: true,
        timeoutSeconds: 180,
        models: [{ provider: "ollama", model: "gemma4:26b", timeoutSeconds: 300 }],
      },
      video: {
        enabled: true,
        maxBytes: 52428800,
        models: [{ provider: "google", model: "gemini-3-flash-preview" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ฟิลด์รายการโมเดลสื่อ">
    **รายการผู้ให้บริการ** (`type: "provider"` หรือเว้นไว้):

    - `provider`: รหัสผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
    - `model`: การแทนที่รหัสโมเดล
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะเรียกใช้
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ; `openclaw doctor --fix` ย้าย placeholder `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการที่ไม่บังคับ (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → รูปภาพ, `google` → รูปภาพ+เสียง+วิดีโอ, `groq` → เสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนค่ารายรายการ
    - รายการ `tools.media.image.timeoutSeconds` และ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันยังมีผลเมื่อเอเจนต์เรียกเครื่องมือ `image` โดยตรงด้วย สำหรับการทำความเข้าใจรูปภาพ timeout นี้มีผลกับคำขอเอง และจะไม่ถูกลดลงจากงานเตรียมการก่อนหน้า
    - หากล้มเหลว จะถอยไปใช้รายการถัดไป

    การยืนยันตัวตนของผู้ให้บริการเป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปรสภาพแวดล้อม → `models.providers.*.apiKey`

    **ฟิลด์การเสร็จสิ้นแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: แฟล็กความเข้ากันได้ที่เลิกใช้แล้ว งานสื่อแบบอะซิงโครนัสที่เสร็จแล้วจะยังผ่านเซสชันของผู้ร้องขอ เพื่อให้เอเจนต์ได้รับผลลัพธ์ ตัดสินใจว่าจะบอกผู้ใช้อย่างไร และใช้เครื่องมือข้อความเมื่อการส่งจากต้นทางต้องใช้เครื่องมือนั้น

  </Accordion>
</AccordionGroup>

### `tools.agentToAgent`

```json5
{
  tools: {
    agentToAgent: {
      enabled: false,
      allow: ["home", "work"],
    },
  },
}
```

### `tools.sessions`

ควบคุมว่าเซสชันใดสามารถเป็นเป้าหมายของเครื่องมือเซสชันได้ (`sessions_list`, `sessions_history`, `sessions_send`)

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันนี้ เช่น subagents)

```json5
{
  tools: {
    sessions: {
      // "self" | "tree" | "agent" | "all"
      visibility: "tree",
    },
  },
}
```

<AccordionGroup>
  <Accordion title="ขอบเขตการมองเห็น">
    - `self`: เฉพาะคีย์เซสชันปัจจุบัน
    - `tree`: เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันปัจจุบัน (subagents)
    - `agent`: เซสชันใดๆ ที่เป็นของรหัสเอเจนต์ปัจจุบัน (อาจรวมผู้ใช้อื่นด้วย หากคุณเรียกใช้เซสชันแยกตามผู้ส่งภายใต้รหัสเอเจนต์เดียวกัน)
    - `all`: เซสชันใดๆ การกำหนดเป้าหมายข้ามเอเจนต์ยังต้องใช้ `tools.agentToAgent`
    - การบีบขอบเขตของแซนด์บ็อกซ์: เมื่อเซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม
    - เมื่อไม่ใช่ `all` `sessions_list` จะมีฟิลด์ `visibility` แบบกะทัดรัด
      ที่อธิบายโหมดที่มีผลจริง และคำเตือนว่าเซสชันบางรายการอาจถูก
      ละไว้หากอยู่นอกขอบเขตปัจจุบัน

  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

ควบคุมการรองรับไฟล์แนบแบบอินไลน์สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: set true to allow inline file attachments
        maxTotalBytes: 5242880, // 5 MB total across all files
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB per file
        retainOnSessionKeep: false, // keep attachments when cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับไฟล์แนบ">
    - ไฟล์แนบต้องใช้ `enabled: true`
    - ไฟล์แนบของ subagent จะถูกสร้างเป็นไฟล์จริงในพื้นที่ทำงานลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - ไฟล์แนบ ACP รองรับเฉพาะรูปภาพ และจะถูกส่งต่อแบบอินไลน์ไปยังรันไทม์ ACP หลังจากผ่านขีดจำกัดจำนวนไฟล์ ขนาดต่อไฟล์ และขนาดรวมแบบเดียวกันแล้ว
    - เนื้อหาไฟล์แนบจะถูกปกปิดจากการเก็บถาวรทรานสคริปต์โดยอัตโนมัติ
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจตัวอักษร/การเติมท้ายอย่างเข้มงวด และมีตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ไฟล์แนบของ subagent คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลของ subagent เป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวเชิงทดลอง ค่าเริ่มต้นปิด เว้นแต่มีกฎเปิดใช้อัตโนมัติของ GPT-5 แบบ strict-agentic

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับการติดตามงานหลายขั้นตอนที่ไม่เล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedAgent.executionContract` (หรือการแทนค่ารายเอเจนต์) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล GPT-5 ของ OpenAI หรือ OpenAI Codex ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือ `false` เพื่อปิดไว้แม้ในการรัน GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้ prompt ระบบจะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญ และมีขั้นตอน `in_progress` ได้อย่างมากหนึ่งขั้นตอน

### `agents.defaults.subagents`

```json5
{
  agents: {
    defaults: {
      subagents: {
        allowAgents: ["research"],
        model: "minimax/MiniMax-M2.7",
        maxConcurrent: 8,
        runTimeoutSeconds: 900,
        announceTimeoutMs: 120000,
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: โมเดลเริ่มต้นสำหรับ sub-agents ที่ถูกสร้างขึ้น หากละไว้ sub-agents จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของรหัสเอเจนต์เป้าหมายที่กำหนดค่าไว้สำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตนเอง (`["*"]` = เป้าหมายที่กำหนดค่าไว้ใดๆ; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) รายการเก่าที่การกำหนดค่าเอเจนต์ถูกลบแล้วจะถูก `sessions_spawn` ปฏิเสธและถูกละไว้จาก `agents_list`; เรียกใช้ `openclaw doctor --fix` เพื่อล้างรายการเหล่านี้
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` `0` หมายถึงไม่มี timeout
- `announceTimeoutMs`: timeout รายการเรียกต่อครั้ง (มิลลิวินาที) สำหรับความพยายามส่งประกาศ `agent` ของ Gateway ค่าเริ่มต้น: `120000` การลองใหม่แบบชั่วคราวอาจทำให้เวลารอประกาศรวมยาวกว่า timeout ที่กำหนดค่าไว้หนึ่งครั้ง
- นโยบายเครื่องมือราย subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการแบบกำหนดเองและ URL ฐาน

Plugin ผู้ให้บริการเผยแพร่แถวแคตตาล็อกโมเดลของตนเอง เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ในการกำหนดค่า หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

การกำหนดค่า `baseUrl` ของผู้ให้บริการแบบกำหนดเอง/ภายในเครื่องยังเป็นการตัดสินใจความน่าเชื่อถือของเครือข่ายอย่างแคบสำหรับคำขอ HTTP ของโมเดลด้วย: OpenClaw อนุญาต origin `scheme://host:port` นั้นแบบตรงตัวผ่านเส้นทาง fetch ที่มีการป้องกัน โดยไม่เพิ่มตัวเลือกการกำหนดค่าแยกต่างหากหรือเชื่อถือ origin ส่วนตัวอื่น

```json5
{
  models: {
    mode: "merge", // merge (default) | replace
    providers: {
      "custom-proxy": {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "LITELLM_KEY",
        api: "openai-completions", // openai-completions | openai-responses | anthropic-messages | google-generative-ai
        models: [
          {
            id: "llama-3.1-8b",
            name: "Llama 3.1 8B",
            reasoning: false,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 128000,
            contextTokens: 96000,
            maxTokens: 32000,
          },
        ],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="การยืนยันตัวตนและลำดับความสำคัญในการรวม">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการการยืนยันตัวตนแบบกำหนดเอง
    - แทนที่รากการกำหนดค่าเอเจนต์ด้วย `OPENCLAW_AGENT_DIR`
    - ลำดับความสำคัญในการรวมสำหรับ ID ผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ใน `models.json` ของเอเจนต์ที่ไม่ว่างจะชนะ
      - ค่า `apiKey` ของเอเจนต์ที่ไม่ว่างจะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการโดย SecretRef ในบริบทการกำหนดค่า/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่ถูกจัดการโดย SecretRef จะถูกรีเฟรชจากตัวทำเครื่องหมายต้นทาง (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคงความลับที่ resolve แล้วไว้
      - ค่าส่วนหัวของผู้ให้บริการที่ถูกจัดการโดย SecretRef จะถูกรีเฟรชจากตัวทำเครื่องหมายต้นทาง (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
      - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือขาดหายจะถอยไปใช้ `models.providers` ในการกำหนดค่า
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่างการกำหนดค่าแบบชัดเจนกับค่าแคตตาล็อกโดยนัย
      - `contextTokens` ของโมเดลที่ตรงกันจะคงขีดจำกัดรันไทม์แบบชัดเจนเมื่อมีอยู่; ใช้เพื่อจำกัด context ที่มีผลโดยไม่เปลี่ยน metadata ของโมเดลโดยกำเนิด
      - แคตตาล็อกของ provider-plugin จะถูกจัดเก็บเป็น shard แคตตาล็อกที่สร้างขึ้นและมี Plugin เป็นเจ้าของภายใต้สถานะ Plugin ของเอเจนต์
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้การกำหนดค่าเขียน `models.json` และ shard แคตตาล็อก Plugin ที่ใช้งานอยู่ใหม่ทั้งหมด
      - การคงตัวทำเครื่องหมายยึดต้นทางเป็นหลัก: ตัวทำเครื่องหมายจะถูกเขียนจาก snapshot การกำหนดค่าต้นทางที่ใช้งานอยู่ (ก่อน resolve) ไม่ใช่จากค่าความลับของรันไทม์ที่ resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ผู้ให้บริการ

<AccordionGroup>
  <Accordion title="แคตตาล็อกระดับบนสุด">
    - `models.mode`: พฤติกรรมแคตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: แมปผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเท่านั้น `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณส่ง `--replace`

  </Accordion>
  <Accordion title="การเชื่อมต่อและการตรวจสอบสิทธิ์ของผู้ให้บริการ">
    - `models.providers.*.api`: อะแดปเตอร์คำขอ (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` เป็นต้น) สำหรับแบ็กเอนด์ `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ภายในที่เข้ากันได้กับ OpenAI ส่วนใหญ่ ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้งค่า `openai-responses` เฉพาะเมื่อแบ็กเอนด์รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: ข้อมูลรับรองของผู้ให้บริการ (แนะนำให้ใช้ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์การตรวจสอบสิทธิ์ (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: หน้าต่างบริบทแบบเนทีฟเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: เพดานบริบทขณะรันที่มีผลจริงเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: เพดานโทเคนเอาต์พุตเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: เวลาไทม์เอาต์คำขอ HTTP ของโมเดลต่อผู้ให้บริการแบบไม่บังคับ หน่วยเป็นวินาที รวมถึงการเชื่อมต่อ ส่วนหัว เนื้อหา และการจัดการยกเลิกคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ฉีด `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่งข้อมูลรับรองในส่วนหัว `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API ต้นทาง
    - `models.providers.*.headers`: ส่วนหัวแบบคงที่เพิ่มเติมสำหรับการกำหนดเส้นทางพร็อกซี/ผู้เช่า

  </Accordion>
  <Accordion title="การแทนที่การขนส่งคำขอ">
    `models.providers.*.request`: การแทนที่การขนส่งสำหรับคำขอ HTTP ของผู้ให้บริการโมเดล

    - `request.headers`: ส่วนหัวเพิ่มเติม (รวมกับค่าเริ่มต้นของผู้ให้บริการ) ค่ายอมรับ SecretRef
    - `request.auth`: การแทนที่กลยุทธ์การตรวจสอบสิทธิ์ โหมด: `"provider-default"` (ใช้การตรวจสอบสิทธิ์ในตัวของผู้ให้บริการ), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, และ `prefix` แบบไม่บังคับ)
    - `request.proxy`: การแทนที่พร็อกซี HTTP โหมด: `"env-proxy"` (ใช้ตัวแปรสภาพแวดล้อม `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับออบเจ็กต์ย่อย `tls` แบบไม่บังคับ
    - `request.tls`: การแทนที่ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาตให้คำขอ HTTP ของผู้ให้บริการโมเดลไปยังช่วงเครือข่ายส่วนตัว, CGNAT หรือช่วงที่คล้ายกันผ่านการ์ด HTTP fetch ของผู้ให้บริการ URL ฐานของผู้ให้บริการแบบกำหนดเอง/ภายในจะเชื่อถือต้นทางที่กำหนดค่าไว้อย่างแน่นอนอยู่แล้ว ยกเว้นต้นทาง metadata/link-local ซึ่งยังคงถูกบล็อกหากไม่เลือกเปิดใช้อย่างชัดเจน ตั้งค่านี้เป็น `false` เพื่อเลือกไม่ใช้ความเชื่อถือต้นทางแบบตรงตัว WebSocket ใช้ `request` เดียวกันสำหรับส่วนหัว/TLS แต่ไม่ใช้ด่าน SSRF ของ fetch นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="รายการแคตตาล็อกโมเดล">
    - `models.providers.*.models`: รายการแคตตาล็อกโมเดลของผู้ให้บริการแบบระบุชัดเจน
    - `models.providers.*.models.*.input`: รูปแบบอินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดลข้อความเท่านั้น และ `["text", "image"]` สำหรับโมเดลรูปภาพ/วิชันแบบเนทีฟ ไฟล์แนบรูปภาพจะถูกฉีดเข้าไปในรอบของเอเจนต์เฉพาะเมื่อโมเดลที่เลือกถูกทำเครื่องหมายว่ารองรับรูปภาพ
    - `models.providers.*.models.*.contextWindow`: เมทาดาทาหน้าต่างบริบทแบบเนทีฟของโมเดล ค่านี้แทนที่ `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: เพดานบริบทขณะรันแบบไม่บังคับ ค่านี้แทนที่ `contextTokens` ระดับผู้ให้บริการ; ใช้เมื่อคุณต้องการงบบริบทที่มีผลจริงเล็กกว่า `contextWindow` แบบเนทีฟของโมเดล; `openclaw models list` แสดงทั้งสองค่าเมื่อค่าแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: คำใบ้ความเข้ากันได้แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` ไม่ว่างและไม่ใช่เนทีฟ (โฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ขณะรัน `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรม OpenAI เริ่มต้น
    - `models.providers.*.models.*.compat.requiresStringContent`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับปลายทางแชตที่เข้ากันได้กับ OpenAI และรับเฉพาะสตริง เมื่อเป็น `true` OpenClaw จะแปลงอาร์เรย์ `messages[].content` ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.strictMessageKeys`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับปลายทางแชตที่เข้ากันได้กับ OpenAI แบบเข้มงวด เมื่อเป็น `true` OpenClaw จะตัดออบเจ็กต์ข้อความ Chat Completions ขาออกให้เหลือ `role` และ `content` ก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.thinkingFormat`: คำใบ้เพย์โหลดการคิดแบบไม่บังคับ ใช้ `"together"` สำหรับ `reasoning.enabled` แบบ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุด หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนเซิร์ฟเวอร์ตระกูล Qwen ที่เข้ากันได้กับ OpenAI และรองรับ kwargs ของเทมเพลตแชตระดับคำขอ เช่น vLLM โมเดล vLLM Qwen ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) สำหรับรูปแบบเหล่านี้
    - `models.providers.*.models.*.compat.requiresReasoningContentOnAssistantMessages`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับแบ็กเอนด์ Chat Completions แบบ DeepSeek ที่กำหนดให้ข้อความผู้ช่วยก่อนหน้ายังคงมี `reasoning_content` ระหว่างการเล่นซ้ำ เมื่อเป็น `true` OpenClaw จะรักษาฟิลด์นั้นไว้ในข้อความผู้ช่วยขาออก ใช้ค่านี้เมื่อเชื่อมพร็อกซีแบบกำหนดเองที่เข้ากันได้กับ DeepSeek และปฏิเสธคำขอหลังจากลบเหตุผลออก ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="การค้นพบ Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: รูทการตั้งค่าการค้นพบอัตโนมัติของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นพบโดยนัย
    - `plugins.entries.amazon-bedrock.config.discovery.region`: รีเจียน AWS สำหรับการค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบไม่บังคับสำหรับการค้นพบแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการโพลสำหรับการรีเฟรชการค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: หน้าต่างบริบทสำรองสำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: โทเคนเอาต์พุตสูงสุดสำรองสำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองแบบโต้ตอบจะอนุมานอินพุตรูปภาพสำหรับรหัสโมเดลวิชันที่พบบ่อย เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่าเป็นข้อความเท่านั้น รหัสโมเดลที่ไม่รู้จักยังคงถามเรื่องการรองรับรูปภาพ การเริ่มต้นใช้งานแบบไม่โต้ตอบใช้การอนุมานเดียวกัน; ส่ง `--custom-image-input` เพื่อบังคับเมทาดาทาที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับเมทาดาทาแบบข้อความเท่านั้น

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการภายนอกอย่างเป็นทางการ `cerebras` สามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้การกำหนดค่าผู้ให้บริการแบบระบุชัดเจนเฉพาะเมื่อต้องการแทนที่ค่าเริ่มต้น

    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/gpt-oss-120b"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/gpt-oss-120b": { alias: "GPT OSS 120B (Cerebras)" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          cerebras: {
            baseUrl: "https://api.cerebras.ai/v1",
            apiKey: "${CEREBRAS_API_KEY}",
            api: "openai-completions",
            models: [
              { id: "zai-glm-4.7", name: "GLM 4.7 (Cerebras)" },
              { id: "gpt-oss-120b", name: "GPT OSS 120B (Cerebras)" },
            ],
          },
        },
      },
    }
    ```

    ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras; `zai/glm-4.7` สำหรับ Z.AI โดยตรง

  </Accordion>
  <Accordion title="Kimi Coding">
    ```json5
    {
      env: { KIMI_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "kimi/kimi-for-coding" },
          models: { "kimi/kimi-for-coding": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    เข้ากันได้กับ Anthropic เป็นผู้ให้บริการในตัว ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="โมเดลภายใน (LM Studio)">
    ดู [โมเดลภายใน](/th/gateway/local-models) สรุปสั้น: รันโมเดลภายในขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง; คงการรวมโมเดลที่โฮสต์ไว้สำหรับการสำรอง
  </Accordion>
  <Accordion title="MiniMax M3 (โดยตรง)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M3" },
          models: {
            "minimax/MiniMax-M3": { alias: "Minimax" },
          },
        },
      },
      models: {
        mode: "merge",
        providers: {
          minimax: {
            baseUrl: "https://api.minimax.io/anthropic",
            apiKey: "${MINIMAX_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "MiniMax-M3",
                name: "MiniMax M3",
                reasoning: true,
                input: ["text", "image"],
                cost: { input: 0.6, output: 2.4, cacheRead: 0.12, cacheWrite: 0 },
                contextWindow: 1000000,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แคตตาล็อกโมเดลใช้ค่าเริ่มต้นเป็น M3 และยังรวมตัวแปร M2.7 ด้วย บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic OpenClaw จะปิดการคิดของ MiniMax M2.x เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน; MiniMax-M3 (และ M3.x) จะคงอยู่บนเส้นทางการคิดแบบละไว้/ปรับตัวได้ของผู้ให้บริการตามค่าเริ่มต้น `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

  </Accordion>
  <Accordion title="Moonshot AI (Kimi)">
    ```json5
    {
      env: { MOONSHOT_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "moonshot/kimi-k2.6" },
          models: { "moonshot/kimi-k2.6": { alias: "Kimi K2.6" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          moonshot: {
            baseUrl: "https://api.moonshot.ai/v1",
            apiKey: "${MOONSHOT_API_KEY}",
            api: "openai-completions",
            models: [
              {
                id: "kimi-k2.6",
                name: "Kimi K2.6",
                reasoning: false,
                input: ["text", "image"],
                cost: { input: 0.95, output: 4, cacheRead: 0.16, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
              },
            ],
          },
        },
      },
    }
    ```

    สำหรับปลายทางจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    ปลายทาง Moonshot แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานสตรีมมิงบนการขนส่ง `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะอิงค่านั้นจากความสามารถของปลายทางแทนที่จะอิงเฉพาะรหัสผู้ให้บริการในตัว

  </Accordion>
  <Accordion title="OpenCode">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "opencode/claude-opus-4-6" },
          models: { "opencode/claude-opus-4-6": { alias: "Opus" } },
        },
      },
    }
    ```

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ ref `opencode/...` สำหรับแคตตาล็อก Zen หรือ ref `opencode-go/...` สำหรับแคตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

  </Accordion>
  <Accordion title="Synthetic (เข้ากันได้กับ Anthropic)">
    ```json5
    {
      env: { SYNTHETIC_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: { primary: "synthetic/hf:MiniMaxAI/MiniMax-M2.5" },
          models: { "synthetic/hf:MiniMaxAI/MiniMax-M2.5": { alias: "MiniMax M2.5" } },
        },
      },
      models: {
        mode: "merge",
        providers: {
          synthetic: {
            baseUrl: "https://api.synthetic.new/anthropic",
            apiKey: "${SYNTHETIC_API_KEY}",
            api: "anthropic-messages",
            models: [
              {
                id: "hf:MiniMaxAI/MiniMax-M2.5",
                name: "MiniMax M2.5",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 192000,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```

    URL ฐานควรละ `/v1` (ไคลเอนต์ Anthropic จะเติมให้) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

  </Accordion>
  <Accordion title="Z.AI (GLM-4.7)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "zai/glm-4.7" },
          models: { "zai/glm-4.7": {} },
        },
      },
    }
    ```

    ตั้งค่า `ZAI_API_KEY` การอ้างอิงโมเดลใช้ ID ผู้ให้บริการ `zai/*` แบบมาตรฐาน ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - เอนด์พอยต์ทั่วไป: `https://api.z.ai/api/paas/v4`
    - เอนด์พอยต์สำหรับการเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับเอนด์พอยต์ทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมการแทนที่ URL ฐาน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่นๆ
- [เครื่องมือและ plugins](/th/tools)
