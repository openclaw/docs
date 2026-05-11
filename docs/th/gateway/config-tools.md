---
read_when:
    - การกำหนดค่านโยบาย `tools.*` รายการที่อนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการกำหนดทับ URL พื้นฐาน
    - การตั้งค่าเอนด์พอยต์แบบโฮสต์เองที่เข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย สวิตช์เปิด/ปิดเชิงทดลอง เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-05-11T20:30:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9ab0ec823da1e2e8598d9efb998a207c4486ba82dcf4dd65422c6bf90581b46
    source_path: gateway/config-tools.md
    workflow: 16
---

คีย์การกำหนดค่า `tools.*` และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับ agent, channel และคีย์การกำหนดค่าระดับบนสุดอื่น ๆ ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` กำหนดรายการที่อนุญาตพื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
ค่าเริ่มต้นของการเริ่มต้นใช้งานภายในเครื่องจะตั้งค่าการกำหนดค่าภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ระบุไว้ชัดเจนเดิมจะถูกคงไว้)
</Note>

| โปรไฟล์    | รวม                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                         |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                         |

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                               |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็นนามแฝงของ `exec`)                                                  |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `heartbeat_respond`, `cron`, `gateway`                                                                                  |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`, `update_plan`                                                                                            |
| `group:media`      | `image`, `image_generate`, `music_generate`, `video_generate`, `tts`                                                     |
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวม Plugin ของผู้ให้บริการ)                                                                  |

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือแบบส่วนกลาง (การปฏิเสธมีผลเหนือกว่า) ไม่แยกตัวพิมพ์เล็กใหญ่ รองรับไวลด์การ์ด `*` ใช้แม้เมื่อปิดแซนด์บ็อกซ์ Docker

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็นรหัสเครื่องมือแยกกัน `allow: ["write"]` จะเปิดใช้ `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` จะไม่ปฏิเสธ `apply_patch` หากต้องการบล็อกการแก้ไขไฟล์ทั้งหมด ให้ปฏิเสธ `group:fs` หรือระบุเครื่องมือที่แก้ไขแต่ละรายการอย่างชัดเจน:

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

จำกัดเครื่องมือสำหรับตัวตนผู้ร้องขอเฉพาะ นี่เป็นการป้องกันเชิงลึกเพิ่มเติมจากการควบคุมการเข้าถึง channel; ค่า sender ต้องมาจากอะแดปเตอร์ channel ไม่ใช่ข้อความใน message

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

คีย์ใช้คำนำหน้าอย่างชัดเจน: `channel:<channelId>:<senderId>`, `id:<senderId>`, `e164:<phone>`, `username:<handle>`, `name:<displayName>` หรือ `"*"` รหัส channel เป็นรหัสมาตรฐานของ OpenClaw; นามแฝงเช่น `teams` จะถูกปรับให้เป็น `msteams` คีย์แบบเดิมที่ไม่มีคำนำหน้าจะยอมรับเป็น `id:` เท่านั้น ลำดับการจับคู่คือ channel+id, id, e164, username, name แล้วจึงเป็นไวลด์การ์ด

`agents.list[].tools.toolsBySender` ราย agent จะแทนที่การจับคู่ sender แบบส่วนกลางเมื่อจับคู่ได้ แม้จะมีนโยบายว่าง `{}`

### `tools.elevated`

ควบคุมการเข้าถึง exec แบบยกระดับนอกแซนด์บ็อกซ์:

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

- การแทนที่ราย agent (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดเพิ่มเติมเท่านั้น
- `/elevated on|off|ask|full` เก็บสถานะต่อ session; คำสั่งแบบแทรกในบรรทัดมีผลกับข้อความเดียว
- `exec` แบบยกระดับจะข้ามแซนด์บ็อกซ์และใช้เส้นทางออกที่กำหนดค่าไว้ (`gateway` ตามค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

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

การตรวจสอบความปลอดภัยของลูปเครื่องมือถูก**ปิดใช้งานตามค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้งานการตรวจจับ สามารถกำหนดการตั้งค่าแบบโกลบอลได้ใน `tools.loopDetection` และแทนที่แบบรายเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

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
  ประวัติการเรียกเครื่องมือสูงสุดที่เก็บไว้สำหรับการวิเคราะห์ลูป
</ParamField>
<ParamField path="warningThreshold" type="number">
  ค่าเกณฑ์รูปแบบการทำซ้ำที่ไม่มีความคืบหน้าสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  ค่าเกณฑ์การทำซ้ำที่สูงขึ้นสำหรับบล็อกลูปวิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  ค่าเกณฑ์หยุดเด็ดขาดสำหรับการทำงานที่ไม่มีความคืบหน้าใดๆ
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียกเครื่องมือเดิม/อาร์กิวเมนต์เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกเมื่อใช้เครื่องมือโพลที่รู้จัก (`process.poll`, `command_status` ฯลฯ)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกเมื่อพบรูปแบบคู่สลับกันที่ไม่มีความคืบหน้า
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
    **รายการผู้ให้บริการ** (`type: "provider"` หรือละไว้):

    - `provider`: รหัสผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
    - `model`: การแทนที่รหัสโมเดล
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะรัน
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ; `openclaw doctor --fix` จะย้าย placeholder แบบเลิกใช้แล้ว `{input}` ไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการเสริม (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → รูปภาพ, `google` → รูปภาพ+เสียง+วิดีโอ, `groq` → เสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนที่ต่อรายการ
    - รายการ `tools.media.image.timeoutSeconds` และรายการ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลเช่นกันเมื่อเอเจนต์เรียกเครื่องมือ `image` อย่างชัดเจน
    - เมื่อเกิดความล้มเหลว จะถอยไปใช้รายการถัดไป

    การยืนยันตัวตนของผู้ให้บริการเป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปร env → `models.providers.*.apiKey`

    **ฟิลด์การทำให้เสร็จแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: แฟล็กความเข้ากันได้ที่เลิกใช้แล้ว งานสื่ออะซิงโครนัสที่เสร็จสมบูรณ์จะยังคงผ่านเซสชันผู้ร้องขอโดยมีเอเจนต์เป็นตัวกลาง เพื่อให้เอเจนต์ได้รับผลลัพธ์ ตัดสินใจว่าจะบอกผู้ใช้อย่างไร และใช้เครื่องมือข้อความเมื่อการส่งจากแหล่งที่มาต้องใช้

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

ควบคุมว่าเซสชันใดสามารถเป็นเป้าหมายของเครื่องมือเซสชัน (`sessions_list`, `sessions_history`, `sessions_send`) ได้

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันนี้ เช่น เอเจนต์ย่อย)

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
    - `tree`: เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันปัจจุบัน (เอเจนต์ย่อย)
    - `agent`: เซสชันใดๆ ที่เป็นของรหัสเอเจนต์ปัจจุบัน (อาจรวมผู้ใช้อื่นหากคุณรันเซสชันต่อผู้ส่งภายใต้รหัสเอเจนต์เดียวกัน)
    - `all`: เซสชันใดๆ การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
    - การบีบขอบเขตของแซนด์บ็อกซ์: เมื่อเซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"`

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
  <Accordion title="Attachment notes">
    - รองรับไฟล์แนบเฉพาะสำหรับ `runtime: "subagent"` เท่านั้น รันไทม์ ACP จะปฏิเสธไฟล์แนบเหล่านั้น
    - ไฟล์จะถูกสร้างเป็นไฟล์จริงในพื้นที่ทำงานลูกที่ `.openclaw/attachments/<uuid>/` พร้อมกับ `.manifest.json`
    - เนื้อหาไฟล์แนบจะถูกปกปิดจากการคงอยู่ของ transcript โดยอัตโนมัติ
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจตัวอักษร/แพดดิ้งอย่างเข้มงวด และมีตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลเป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ ส่วน `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ปิดเป็นค่าเริ่มต้น เว้นแต่จะตรงกับกฎเปิดอัตโนมัติของ strict-agentic GPT-5

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ใช่งานง่าย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือการตั้งค่าทับเฉพาะเอเจนต์) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล OpenAI หรือ OpenAI Codex GPT-5 ตั้งค่าเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือ `false` เพื่อให้ปิดต่อไปแม้ในการรัน strict-agentic GPT-5
- เมื่อเปิดใช้ prompt ระบบจะเพิ่มแนวทางการใช้งานด้วย เพื่อให้โมเดลใช้เครื่องมือนี้เฉพาะกับงานที่มีสาระสำคัญ และคงไว้ไม่เกินหนึ่งขั้นตอนที่เป็น `in_progress`

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

- `model`: โมเดลเริ่มต้นสำหรับ sub-agent ที่ถูกสร้าง หากละไว้ sub-agent จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ id เอเจนต์ปลายทางสำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือละเว้น `runTimeoutSeconds` ค่า `0` หมายถึงไม่มี timeout
- `announceTimeoutMs`: timeout ต่อการเรียก (มิลลิวินาที) สำหรับความพยายามส่งประกาศ `agent` ของ Gateway ค่าเริ่มต้น: `120000` การลองใหม่ชั่วคราวอาจทำให้เวลารอประกาศรวมยาวกว่า timeout ที่กำหนดหนึ่งครั้ง
- นโยบายเครื่องมือต่อ subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## Provider แบบกำหนดเองและ URL ฐาน

OpenClaw ใช้แค็ตตาล็อกโมเดลในตัว เพิ่ม Provider แบบกำหนดเองผ่าน `models.providers` ใน config หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

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
  <Accordion title="Auth and merge precedence">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการ auth แบบกำหนดเอง
    - ตั้งค่าทับ root ของ config เอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ของตัวแปรสภาพแวดล้อมแบบเดิม)
    - ลำดับความสำคัญของการ merge สำหรับ Provider ID ที่ตรงกัน:
      - ค่า `baseUrl` ใน `models.json` ของเอเจนต์ที่ไม่ว่างจะชนะ
      - ค่า `apiKey` ของเอเจนต์ที่ไม่ว่างจะชนะเฉพาะเมื่อ Provider นั้นไม่ได้ถูกจัดการโดย SecretRef ในบริบท config/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของ Provider ที่ถูกจัดการโดย SecretRef จะถูกรีเฟรชจากเครื่องหมายแหล่งที่มา (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคงค่า secret ที่ resolve แล้ว
      - ค่า header ของ Provider ที่ถูกจัดการโดย SecretRef จะถูกรีเฟรชจากเครื่องหมายแหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
      - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือหายไปจะ fallback ไปที่ `models.providers` ใน config
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันใช้ค่าที่สูงกว่าระหว่าง config ที่ระบุชัดเจนกับค่า implicit จากแค็ตตาล็อก
      - `contextTokens` ของโมเดลที่ตรงกันจะรักษาเพดานรันไทม์ที่ระบุชัดเจนเมื่อมีอยู่ ใช้ค่านี้เพื่อจำกัด context ที่มีผลโดยไม่เปลี่ยน metadata ดั้งเดิมของโมเดล
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
      - การคงอยู่ของ marker ยึดแหล่งที่มาเป็นหลัก: marker ถูกเขียนจาก snapshot ของ config แหล่งที่มาที่ใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่า secret รันไทม์ที่ resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ Provider

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: พฤติกรรมแค็ตตาล็อก Provider (`merge` หรือ `replace`)
    - `models.providers`: map Provider แบบกำหนดเองที่ใช้ provider id เป็นคีย์
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเติม `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณส่ง `--replace`

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adapter คำขอ (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` ฯลฯ) สำหรับ backend `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ local ที่เข้ากันได้กับ OpenAI ส่วนใหญ่ ให้ใช้ `openai-completions` Provider แบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้งค่า `openai-responses` เฉพาะเมื่อ backend รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: credential ของ Provider (แนะนำให้ใช้ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: context window ดั้งเดิมเริ่มต้นสำหรับโมเดลภายใต้ Provider นี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: เพดาน context รันไทม์ที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ Provider นี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: เพดาน output-token เริ่มต้นสำหรับโมเดลภายใต้ Provider นี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: timeout คำขอ HTTP ของโมเดลต่อ Provider แบบไม่บังคับ หน่วยเป็นวินาที รวมถึง connect, headers, body และการจัดการ abort ของคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่ง credential ใน header `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API upstream
    - `models.providers.*.headers`: header คงที่เพิ่มเติมสำหรับการกำหนดเส้นทาง proxy/tenant

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: การตั้งค่าทับ transport สำหรับคำขอ HTTP ไปยัง model-provider

    - `request.headers`: header เพิ่มเติม (merge กับค่าเริ่มต้นของ Provider) ค่ายอมรับ SecretRef
    - `request.auth`: การตั้งค่าทับกลยุทธ์ auth โหมด: `"provider-default"` (ใช้ auth ในตัวของ Provider), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบไม่บังคับ)
    - `request.proxy`: การตั้งค่าทับ HTTP proxy โหมด: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับ sub-object `tls` แบบไม่บังคับ
    - `request.tls`: การตั้งค่าทับ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve เป็น private, CGNAT หรือช่วงที่คล้ายกัน ผ่าน provider HTTP fetch guard (ผู้ปฏิบัติการต้อง opt-in สำหรับ endpoint ที่โฮสต์เองและเข้ากันได้กับ OpenAI ที่เชื่อถือได้) URL stream ของ model-provider แบบ loopback เช่น `localhost`, `127.0.0.1` และ `[::1]` ได้รับอนุญาตโดยอัตโนมัติ เว้นแต่ค่านี้ถูกตั้งเป็น `false` อย่างชัดเจน; โฮสต์ LAN, tailnet และ private DNS ยังคงต้อง opt-in WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของ Provider ที่ระบุชัดเจน
    - `models.providers.*.models.*.input`: modality อินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดล text-only และ `["text", "image"]` สำหรับโมเดล image/vision แบบ native ไฟล์แนบภาพจะถูก inject เข้าไปใน turn ของเอเจนต์เฉพาะเมื่อโมเดลที่เลือกถูกทำเครื่องหมายว่ารองรับภาพ
    - `models.providers.*.models.*.contextWindow`: metadata ของ context window ดั้งเดิมของโมเดล ค่านี้ตั้งทับ `contextWindow` ระดับ Provider สำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: เพดาน context รันไทม์แบบไม่บังคับ ค่านี้ตั้งทับ `contextTokens` ระดับ Provider; ใช้เมื่อคุณต้องการงบประมาณ context ที่มีผลเล็กกว่า `contextWindow` ดั้งเดิมของโมเดล; `openclaw models list` แสดงทั้งสองค่าเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: คำใบ้ความเข้ากันได้แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบ non-native ที่ไม่ว่าง (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ในรันไทม์ `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรม OpenAI เริ่มต้น
    - `models.providers.*.models.*.compat.requiresStringContent`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับ endpoint แชตที่เข้ากันได้กับ OpenAI แต่รองรับเฉพาะสตริง เมื่อเป็น `true` OpenClaw จะแบน array `messages[].content` ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.strictMessageKeys`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับ endpoint แชตที่เข้ากันได้กับ OpenAI แบบเข้มงวด เมื่อเป็น `true` OpenClaw จะตัด object ข้อความ Chat Completions ขาออกให้เหลือ `role` และ `content` ก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.thinkingFormat`: คำใบ้ payload การคิดแบบไม่บังคับ ใช้ `"qwen"` สำหรับ `enable_thinking` ระดับบนสุด หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนเซิร์ฟเวอร์ตระกูล Qwen ที่เข้ากันได้กับ OpenAI และรองรับ chat-template kwargs ระดับคำขอ เช่น vLLM

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: root ของการตั้งค่า auto-discovery ของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
    - `plugins.entries.amazon-bedrock.config.discovery.region`: ภูมิภาค AWS สำหรับ discovery
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบไม่บังคับสำหรับ discovery แบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการ polling สำหรับการรีเฟรช discovery
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback สำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: โทเคนเอาต์พุตสูงสุด fallback สำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองในโหมดโต้ตอบจะอนุมานอินพุตรูปภาพสำหรับ ID โมเดลด้านการมองเห็นที่พบบ่อย เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่าเป็นแบบข้อความเท่านั้น ID โมเดลที่ไม่รู้จักจะยังคงถามเรื่องการรองรับรูปภาพ การเริ่มต้นใช้งานแบบไม่โต้ตอบใช้การอนุมานเดียวกัน ให้ส่ง `--custom-image-input` เพื่อบังคับใช้เมตาดาต้าที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับใช้เมตาดาต้าแบบข้อความเท่านั้น

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้สามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ได้ ใช้การกำหนดค่าผู้ให้บริการแบบชัดเจนเฉพาะเมื่อจะแทนที่ค่าเริ่มต้นเท่านั้น

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

    ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras และ `zai/glm-4.7` สำหรับ Z.AI โดยตรง

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

    ผู้ให้บริการในตัวที่เข้ากันได้กับ Anthropic ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    ดู [โมเดลภายในเครื่อง](/th/gateway/local-models) สรุปสั้น ๆ: เรียกใช้โมเดลภายในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์จริงจัง และคงโมเดลที่โฮสต์ไว้ให้ผสานอยู่เพื่อใช้เป็นตัวสำรอง
  </Accordion>
  <Accordion title="MiniMax M2.7 (direct)">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "minimax/MiniMax-M2.7" },
          models: {
            "minimax/MiniMax-M2.7": { alias: "Minimax" },
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
                id: "MiniMax-M2.7",
                name: "MiniMax M2.7",
                reasoning: true,
                input: ["text"],
                cost: { input: 0.3, output: 1.2, cacheRead: 0.06, cacheWrite: 0.375 },
                contextWindow: 204800,
                maxTokens: 131072,
              },
            ],
          },
        },
      },
    }
    ```

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แค็ตตาล็อกโมเดลมีค่าเริ่มต้นเป็น M2.7 เท่านั้น บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดการคิดของ MiniMax ตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    สำหรับปลายทางในจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    ปลายทาง Moonshot แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานสตรีมมิงบนทรานสปอร์ต `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะอิงสิ่งนั้นจากความสามารถของปลายทาง แทนที่จะอิงเพียง ID ผู้ให้บริการในตัว

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

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้การอ้างอิง `opencode/...` สำหรับแค็ตตาล็อก Zen หรือการอ้างอิง `opencode-go/...` สำหรับแค็ตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

  </Accordion>
  <Accordion title="Synthetic (Anthropic-compatible)">
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

    URL ฐานควรละ `/v1` ไว้ (ไคลเอนต์ Anthropic จะเติมเอง) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

    ตั้งค่า `ZAI_API_KEY` ยอมรับ `z.ai/*` และ `z-ai/*` เป็นนามแฝง ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - ปลายทางทั่วไป: `https://api.z.ai/api/paas/v4`
    - ปลายทางสำหรับเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับปลายทางทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมการแทนที่ URL ฐาน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่น ๆ
- [เครื่องมือและ Plugin](/th/tools)
