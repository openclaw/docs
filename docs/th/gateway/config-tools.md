---
read_when:
    - การกำหนดค่านโยบาย `tools.*`, รายการที่อนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL ฐาน
    - การตั้งค่าเอนด์พอยต์ที่โฮสต์เองซึ่งเข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย ตัวสลับฟีเจอร์ทดลอง เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-05-10T19:36:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: c02dad1d895afe90baf99487b37d29968ebd944890075511e1cb057776b29ec6
    source_path: gateway/config-tools.md
    workflow: 16
---

คีย์การกำหนดค่า `tools.*` และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับเอเจนต์ ช่องทาง และคีย์การกำหนดค่าระดับบนสุดอื่นๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
ค่าเริ่มต้นของการเริ่มต้นใช้งานในเครื่องจะตั้งค่า config ในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ระบุไว้ชัดเจนเดิมจะถูกคงไว้)
</Note>

| โปรไฟล์     | รวม                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                  |

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (ยอมรับ `bash` เป็นนามแฝงของ `exec`)                                         |
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
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวม Plugin ของผู้ให้บริการ)                                                                          |

### `tools.allow` / `tools.deny`

นโยบาย allow/deny เครื่องมือส่วนกลาง (deny มีผลเหนือกว่า) ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ รองรับไวลด์การ์ด `*` ใช้แม้เมื่อ Docker sandbox ปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็นรหัสเครื่องมือแยกกัน `allow: ["write"]` ยังเปิดใช้ `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` จะไม่ปฏิเสธ `apply_patch` หากต้องการบล็อกการแก้ไขไฟล์ทั้งหมด ให้ deny `group:fs` หรือระบุเครื่องมือที่เปลี่ยนแปลงไฟล์แต่ละรายการอย่างชัดเจน:

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

### `tools.elevated`

ควบคุมการเข้าถึง exec แบบยกระดับนอก sandbox:

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

- การแทนที่ต่อเอเจนต์ (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดให้เข้มงวดขึ้นเท่านั้น
- `/elevated on|off|ask|full` จัดเก็บสถานะต่อเซสชัน คำสั่ง inline จะใช้กับข้อความเดียว
- `exec` แบบยกระดับจะข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดค่าไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

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
      applyPatch: {
        enabled: false,
        allowModels: ["gpt-5.5"],
      },
    },
  },
}
```

### `tools.loopDetection`

การตรวจสอบความปลอดภัยของ tool-loop ถูก**ปิดใช้งานตามค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ สามารถกำหนดการตั้งค่าได้แบบส่วนกลางใน `tools.loopDetection` และแทนที่ต่อเอเจนต์ที่ `agents.list[].tools.loopDetection`

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
  ประวัติ tool-call สูงสุดที่เก็บไว้สำหรับการวิเคราะห์ลูป
</ParamField>
<ParamField path="warningThreshold" type="number">
  เกณฑ์รูปแบบที่ทำซ้ำโดยไม่มีความคืบหน้าสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  เกณฑ์การทำซ้ำที่สูงขึ้นสำหรับการบล็อกลูปวิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  เกณฑ์หยุดแบบเด็ดขาดสำหรับการรันที่ไม่มีความคืบหน้าใดๆ
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียกเครื่องมือเดียวกัน/อาร์กิวเมนต์เดียวกันซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกเครื่องมือ poll ที่รู้จัก (`process.poll`, `command_status` ฯลฯ)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกรูปแบบคู่สลับที่ไม่มีความคืบหน้า
</ParamField>

<Warning>
หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบจะล้มเหลว
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
  <Accordion title="ฟิลด์ของรายการโมเดลสื่อ">
    **รายการ Provider** (`type: "provider"` หรือละไว้):

    - `provider`: id ผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
    - `model`: การแทนที่ id โมเดล
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะเรียกใช้
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ; `openclaw doctor --fix` จะย้าย placeholder `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการเสริม (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → รูปภาพ, `google` → รูปภาพ+เสียง+วิดีโอ, `groq` → เสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนค่าต่อรายการ
    - `tools.media.image.timeoutSeconds` และรายการ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลด้วยเมื่อ agent เรียกใช้เครื่องมือ `image` อย่างชัดเจน
    - เมื่อเกิดความล้มเหลว จะถอยกลับไปยังรายการถัดไป

    การตรวจสอบสิทธิ์ Provider ใช้ลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปร env → `models.providers.*.apiKey`

    **ฟิลด์การเสร็จสิ้นแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: แฟล็กความเข้ากันได้ที่เลิกใช้แล้ว งานสื่อแบบอะซิงโครนัสที่เสร็จสมบูรณ์จะยังผ่านการไกล่เกลี่ยโดยเซสชันของผู้ร้องขอ เพื่อให้ agent ได้รับผลลัพธ์ ตัดสินใจว่าจะบอกผู้ใช้อย่างไร และใช้เครื่องมือข้อความเมื่อการส่งจากแหล่งที่มาต้องใช้

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

ควบคุมว่าเซสชันใดสามารถถูกกำหนดเป้าหมายโดยเครื่องมือเซสชัน (`sessions_list`, `sessions_history`, `sessions_send`) ได้

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่เซสชันนี้สร้างขึ้น เช่น subagents)

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
    - `tree`: เซสชันปัจจุบัน + เซสชันที่สร้างโดยเซสชันปัจจุบัน (subagents)
    - `agent`: เซสชันใดๆ ที่เป็นของ id agent ปัจจุบัน (อาจรวมผู้ใช้อื่นๆ หากคุณเรียกใช้เซสชันต่อผู้ส่งภายใต้ id agent เดียวกัน)
    - `all`: เซสชันใดๆ การกำหนดเป้าหมายข้าม agent ยังคงต้องใช้ `tools.agentToAgent`
    - การจำกัดของ sandbox: เมื่อเซสชันปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"`

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
    - รองรับไฟล์แนบเฉพาะสำหรับ `runtime: "subagent"` เท่านั้น รันไทม์ ACP จะปฏิเสธไฟล์แนบเหล่านี้
    - ไฟล์จะถูกสร้างเป็นรูปธรรมในพื้นที่ทำงานลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - เนื้อหาไฟล์แนบจะถูกลบข้อมูลอ่อนไหวโดยอัตโนมัติจากการคงอยู่ของทรานสคริปต์
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจสอบตัวอักษร/แพดดิ้งอย่างเข้มงวด และมีตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลเป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ปิดโดยค่าเริ่มต้น เว้นแต่จะเข้าเงื่อนไขการเปิดใช้งานอัตโนมัติของ GPT-5 แบบ strict-agentic

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับการติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือการแทนที่รายเอเจนต์) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล GPT-5 ของ OpenAI หรือ OpenAI Codex ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือตั้งเป็น `false` เพื่อปิดไว้แม้ในการรัน GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้งาน พรอมป์ระบบจะเพิ่มแนวทางการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญ และคงขั้นตอนที่เป็น `in_progress` ไว้ไม่เกินหนึ่งขั้นตอน

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
        archiveAfterMinutes: 60,
      },
    },
  },
}
```

- `model`: โมเดลเริ่มต้นสำหรับเอเจนต์ย่อยที่ถูกสร้าง หากละไว้ เอเจนต์ย่อยจะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของรหัสเอเจนต์เป้าหมายสำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- `runTimeoutSeconds`: ไทม์เอาต์เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือละ `runTimeoutSeconds` ค่า `0` หมายถึงไม่มีไทม์เอาต์
- นโยบายเครื่องมือรายเอเจนต์ย่อย: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการแบบกำหนดเองและ URL ฐาน

OpenClaw ใช้แค็ตตาล็อกโมเดลในตัว เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ในคอนฟิก หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

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
  <Accordion title="การตรวจสอบสิทธิ์และลำดับความสำคัญในการผสาน">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการการตรวจสอบสิทธิ์แบบกำหนดเอง
    - แทนที่รูทคอนฟิกเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็นนามแฝงตัวแปรสภาพแวดล้อมรุ่นเก่า)
    - ลำดับความสำคัญในการผสานสำหรับรหัสผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ใน `models.json` ของเอเจนต์ที่ไม่ว่างจะชนะ
      - ค่า `apiKey` ของเอเจนต์ที่ไม่ว่างจะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการโดย SecretRef ในบริบทคอนฟิก/โปรไฟล์การตรวจสอบสิทธิ์ปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์ต้นทาง (`ENV_VAR_NAME` สำหรับการอ้างอิง env, `secretref-managed` สำหรับการอ้างอิง file/exec) แทนการคงค่าความลับที่ resolve แล้ว
      - ค่าส่วนหัวของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์ต้นทาง (`secretref-env:ENV_VAR_NAME` สำหรับการอ้างอิง env, `secretref-managed` สำหรับการอ้างอิง file/exec)
      - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือขาดหายจะย้อนกลับไปใช้ `models.providers` ในคอนฟิก
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่างคอนฟิกแบบชัดเจนกับค่าแค็ตตาล็อกโดยนัย
      - `contextTokens` ของโมเดลที่ตรงกันจะรักษาขีดจำกัดรันไทม์แบบชัดเจนไว้เมื่อมีอยู่; ใช้ค่านี้เพื่อจำกัดบริบทที่มีผลโดยไม่เปลี่ยนเมตาดาทาโมเดลเนทีฟ
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้คอนฟิกเขียน `models.json` ใหม่ทั้งหมด
      - การคงอยู่ของมาร์กเกอร์ถือว่าต้นทางเป็นสิทธิ์ตัดสินสูงสุด: มาร์กเกอร์จะถูกเขียนจากสแนปช็อตคอนฟิกต้นทางที่ใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่าความลับรันไทม์ที่ resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ผู้ให้บริการ

<AccordionGroup>
  <Accordion title="แค็ตตาล็อกระดับบนสุด">
    - `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: แมปผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็นคีย์
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเติม `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณส่ง `--replace`

  </Accordion>
  <Accordion title="การเชื่อมต่อและการตรวจสอบสิทธิ์ของผู้ให้บริการ">
    - `models.providers.*.api`: อะแดปเตอร์คำขอ (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` ฯลฯ) สำหรับแบ็กเอนด์ `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ภายในที่เข้ากันได้กับ OpenAI ส่วนใหญ่ ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้ง `openai-responses` เฉพาะเมื่อแบ็กเอนด์รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: ข้อมูลประจำตัวของผู้ให้บริการ (แนะนำให้ใช้การแทนที่ SecretRef/env)
    - `models.providers.*.auth`: กลยุทธ์การตรวจสอบสิทธิ์ (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: หน้าต่างบริบทเนทีฟเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้ง `contextWindow`
    - `models.providers.*.contextTokens`: ขีดจำกัดบริบทรันไทม์ที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้ง `contextTokens`
    - `models.providers.*.maxTokens`: ขีดจำกัดโทเค็นเอาต์พุตเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้ง `maxTokens`
    - `models.providers.*.timeoutSeconds`: ไทม์เอาต์คำขอ HTTP ของโมเดลรายผู้ให้บริการแบบไม่บังคับเป็นวินาที รวมถึงการเชื่อมต่อ ส่วนหัว เนื้อหา และการจัดการยกเลิกคำขอรวม
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ฉีด `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับให้ส่งข้อมูลประจำตัวในส่วนหัว `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API ต้นทาง
    - `models.providers.*.headers`: ส่วนหัวสแตติกเพิ่มเติมสำหรับการกำหนดเส้นทางพร็อกซี/ผู้เช่า

  </Accordion>
  <Accordion title="การแทนที่การส่งคำขอ">
    `models.providers.*.request`: การแทนที่การส่งคำขอสำหรับคำขอ HTTP ของผู้ให้บริการโมเดล

    - `request.headers`: ส่วนหัวเพิ่มเติม (ผสานกับค่าเริ่มต้นของผู้ให้บริการ) ค่ายอมรับ SecretRef
    - `request.auth`: การแทนที่กลยุทธ์การตรวจสอบสิทธิ์ โหมด: `"provider-default"` (ใช้การตรวจสอบสิทธิ์ในตัวของผู้ให้บริการ), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบไม่บังคับ)
    - `request.proxy`: การแทนที่พร็อกซี HTTP โหมด: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับอ็อบเจกต์ย่อย `tls` แบบไม่บังคับ
    - `request.tls`: การแทนที่ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve ไปยังช่วง private, CGNAT หรือช่วงที่คล้ายกัน ผ่านตัวป้องกัน fetch HTTP ของผู้ให้บริการ (ผู้ปฏิบัติการเลือกเปิดใช้เองสำหรับปลายทางที่โฮสต์เองและเข้ากันได้กับ OpenAI ที่เชื่อถือได้) URL สตรีมของผู้ให้บริการโมเดลแบบ loopback เช่น `localhost`, `127.0.0.1` และ `[::1]` จะได้รับอนุญาตโดยอัตโนมัติ เว้นแต่ว่าตั้งค่านี้เป็น `false` อย่างชัดเจน; โฮสต์ LAN, tailnet และ private DNS ยังต้องเลือกเปิดใช้ WebSocket ใช้ `request` เดียวกันสำหรับส่วนหัว/TLS แต่ไม่ใช้เกต SSRF ของ fetch นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="รายการแค็ตตาล็อกโมเดล">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของผู้ให้บริการแบบชัดเจน
    - `models.providers.*.models.*.input`: รูปแบบอินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดลข้อความเท่านั้น และ `["text", "image"]` สำหรับโมเดลภาพ/วิชันแบบเนทีฟ ไฟล์แนบภาพจะถูกฉีดเข้าไปในเทิร์นของเอเจนต์เฉพาะเมื่อโมเดลที่เลือกถูกระบุว่ารองรับภาพ
    - `models.providers.*.models.*.contextWindow`: เมตาดาทาหน้าต่างบริบทเนทีฟของโมเดล ค่านี้จะแทนที่ `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: ขีดจำกัดบริบทรันไทม์แบบไม่บังคับ ค่านี้จะแทนที่ `contextTokens` ระดับผู้ให้บริการ; ใช้เมื่อคุณต้องการงบบริบทที่มีผลเล็กกว่า `contextWindow` เนทีฟของโมเดล; `openclaw models list` จะแสดงทั้งสองค่าเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: คำใบ้ความเข้ากันได้แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบไม่ว่างและไม่ใช่เนทีฟ (โฮสต์ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ตอนรันไทม์ `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรม OpenAI เริ่มต้นไว้
    - `models.providers.*.models.*.compat.requiresStringContent`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับปลายทางแชทที่เข้ากันได้กับ OpenAI แบบสตริงเท่านั้น เมื่อเป็น `true` OpenClaw จะแปลงอาร์เรย์ `messages[].content` ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.strictMessageKeys`: คำใบ้ความเข้ากันได้แบบไม่บังคับสำหรับปลายทางแชทที่เข้ากันได้กับ OpenAI แบบเข้มงวด เมื่อเป็น `true` OpenClaw จะตัดอ็อบเจกต์ข้อความ Chat Completions ขาออกให้เหลือ `role` และ `content` ก่อนส่งคำขอ
    - `models.providers.*.models.*.compat.thinkingFormat`: คำใบ้เพย์โหลดการคิดแบบไม่บังคับ ใช้ `"qwen"` สำหรับ `enable_thinking` ระดับบนสุด หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนเซิร์ฟเวอร์ที่เข้ากันได้กับ OpenAI ตระกูล Qwen ซึ่งรองรับ kwargs ของเทมเพลตแชทระดับคำขอ เช่น vLLM

  </Accordion>
  <Accordion title="การค้นหา Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: รูทการตั้งค่าการค้นหาอัตโนมัติของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นหาโดยนัย
    - `plugins.entries.amazon-bedrock.config.discovery.region`: ภูมิภาค AWS สำหรับการค้นหา
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรองรหัสผู้ให้บริการแบบไม่บังคับสำหรับการค้นหาแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการโพลสำหรับรีเฟรชการค้นหา
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: หน้าต่างบริบทสำรองสำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: โทเค็นเอาต์พุตสูงสุดสำรองสำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การเริ่มต้นใช้งานผู้ให้บริการแบบกำหนดเองแบบโต้ตอบจะอนุมานอินพุตภาพสำหรับรหัสโมเดลวิชันทั่วไป เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่รู้ว่าเป็นข้อความเท่านั้น รหัสโมเดลที่ไม่รู้จักยังคงถามเรื่องการรองรับภาพ การเริ่มต้นใช้งานแบบไม่โต้ตอบใช้การอนุมานเดียวกัน; ส่ง `--custom-image-input` เพื่อบังคับเมตาดาทาที่รองรับภาพ หรือ `--custom-text-input` เพื่อบังคับเมตาดาทาแบบข้อความเท่านั้น

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการ `cerebras` ที่รวมมาด้วยสามารถกำหนดค่าสิ่งนี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้คอนฟิกผู้ให้บริการแบบชัดเจนเฉพาะเมื่อแทนที่ค่าเริ่มต้น

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

    ใช้ `cerebras/zai-glm-4.7` สำหรับ Cerebras; ใช้ `zai/glm-4.7` สำหรับ Z.AI โดยตรง

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

    เข้ากันได้กับ Anthropic และเป็นผู้ให้บริการในตัว ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    ดู [โมเดลในเครื่อง](/th/gateway/local-models) สรุปสั้นๆ: รันโมเดลในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง; คงโมเดลที่โฮสต์ไว้แบบผสานไว้สำหรับ fallback
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

    สำหรับ endpoint ประเทศจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    endpoint ดั้งเดิมของ Moonshot ประกาศความเข้ากันได้ของการใช้งานแบบสตรีมมิงบนทรานสปอร์ต `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะพิจารณาจากความสามารถของ endpoint แทนที่จะดูแค่รหัสผู้ให้บริการในตัวเท่านั้น

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

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ ref `opencode/...` สำหรับแค็ตตาล็อก Zen หรือ ref `opencode-go/...` สำหรับแค็ตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

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

    URL ฐานควรละ `/v1` (ไคลเอนต์ Anthropic จะเติมให้เอง) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

    ตั้งค่า `ZAI_API_KEY` ยอมรับ `z.ai/*` และ `z-ai/*` เป็น alias ด้วย ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
    - endpoint สำหรับการเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับ endpoint ทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมการแทนที่ URL ฐาน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนอื่นๆ
- [เครื่องมือและ plugins](/th/tools)
