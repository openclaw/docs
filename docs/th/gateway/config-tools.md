---
read_when:
    - การกำหนดค่านโยบาย `tools.*`, รายการอนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL พื้นฐาน
    - การตั้งค่าเอนด์พอยต์ที่โฮสต์เองซึ่งเข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย, ตัวสลับฟีเจอร์ทดลอง, เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/base-URL แบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-05-01T10:16:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 97e6bd8c762f6f7a9985b99ec016dde22c8ea8adc925778b11c2ae5103b887a8
    source_path: gateway/config-tools.md
    workflow: 16
---

คีย์การกำหนดค่า `tools.*` และการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับ agents, channels และคีย์การกำหนดค่าระดับบนสุดอื่นๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
การเริ่มต้นใช้งานแบบ local จะกำหนดค่าเริ่มต้นให้ configs แบบ local ใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ตั้งค่าไว้อย่างชัดเจนเดิมจะถูกคงไว้)
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
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น alias สำหรับ `exec`)                                         |
| `group:fs`         | `read`, `write`, `edit`, `apply_patch`                                                                                  |
| `group:sessions`   | `sessions_list`, `sessions_history`, `sessions_send`, `sessions_spawn`, `sessions_yield`, `subagents`, `session_status` |
| `group:memory`     | `memory_search`, `memory_get`                                                                                           |
| `group:web`        | `web_search`, `x_search`, `web_fetch`                                                                                   |
| `group:ui`         | `browser`, `canvas`                                                                                                     |
| `group:automation` | `cron`, `gateway`                                                                                                       |
| `group:messaging`  | `message`                                                                                                               |
| `group:nodes`      | `nodes`                                                                                                                 |
| `group:agents`     | `agents_list`                                                                                                           |
| `group:media`      | `image`, `image_generate`, `video_generate`, `tts`                                                                      |
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวม Plugin ของผู้ให้บริการ)                                                                          |

### `tools.allow` / `tools.deny`

นโยบาย allow/deny เครื่องมือแบบรวม (deny มีผลเหนือกว่า) ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ รองรับ wildcard `*` ใช้แม้เมื่อ Docker sandbox ปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
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

ควบคุมสิทธิ์ exec แบบยกระดับนอก sandbox:

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

- การ override ราย agent (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดให้เข้มงวดขึ้นเท่านั้น
- `/elevated on|off|ask|full` เก็บสถานะต่อ session; directives แบบ inline ใช้กับข้อความเดียว
- `exec` แบบยกระดับจะข้าม sandboxing และใช้เส้นทาง escape ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

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

การตรวจสอบความปลอดภัยของ tool-loop จะ **ปิดอยู่โดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้งานการตรวจจับ การตั้งค่าสามารถกำหนดแบบรวมได้ใน `tools.loopDetection` และ override ต่อ agent ได้ที่ `agents.list[].tools.loopDetection`

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
  ประวัติการเรียกเครื่องมือสูงสุดที่เก็บไว้สำหรับการวิเคราะห์ loop
</ParamField>
<ParamField path="warningThreshold" type="number">
  เกณฑ์ของรูปแบบการทำซ้ำที่ไม่มีความคืบหน้าสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  เกณฑ์การทำซ้ำที่สูงขึ้นสำหรับการบล็อก loop ระดับ critical
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  เกณฑ์หยุดทันทีสำหรับการรันใดๆ ที่ไม่มีความคืบหน้า
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียกเครื่องมือเดิม/อาร์กิวเมนต์เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกเมื่อใช้เครื่องมือ poll ที่รู้จัก (`process.poll`, `command_status` เป็นต้น)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกเมื่อมีรูปแบบคู่สลับที่ไม่มีความคืบหน้า
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
        directSend: false, // opt-in: send finished async video directly to the channel
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
    **รายการผู้ให้บริการ** (`type: "provider"` หรือไม่ระบุ):

    - `provider`: รหัสผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
    - `model`: รหัสโมเดลที่ใช้แทนค่าเริ่มต้น
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ใน `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะรัน
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น; `openclaw doctor --fix` ย้ายตัวยึดตำแหน่ง `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการเสริม (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio.
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนค่าระดับแต่ละรายการ
    - รายการ `tools.media.image.timeoutSeconds` และ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลด้วยเมื่อเอเจนต์เรียกเครื่องมือ `image` โดยตรง
    - เมื่อเกิดความล้มเหลว ระบบจะถอยไปใช้รายการถัดไป

    การยืนยันตัวตนของผู้ให้บริการทำตามลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปรสภาพแวดล้อม → `models.providers.*.apiKey`

    **ฟิลด์การเสร็จสิ้นแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: เมื่อเป็น `true` งานสื่อแบบอะซิงโครนัสที่เสร็จสมบูรณ์และรองรับการส่งผลลัพธ์โดยตรงจะลองส่งไปยังช่องทางโดยตรงก่อน ค่าเริ่มต้น: `false` (เส้นทางปลุกเซสชันผู้ร้องขอ/ส่งผ่านโมเดล) ปัจจุบันมีผลกับ `video_generate` แบบอะซิงโครนัส; การเสร็จสิ้นของ `music_generate` แบบอะซิงโครนัสยังคงผ่านเซสชันของผู้ร้องขอเป็นตัวกลาง แม้จะเปิดใช้งานค่านี้ก็ตาม

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

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันนั้น เช่น เอเจนต์ย่อย)

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
    - `self`: เฉพาะคีย์ของเซสชันปัจจุบัน
    - `tree`: เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันปัจจุบัน (เอเจนต์ย่อย)
    - `agent`: เซสชันใดๆ ที่เป็นของรหัสเอเจนต์ปัจจุบัน (อาจรวมผู้ใช้อื่นด้วยหากคุณรันเซสชันแยกตามผู้ส่งภายใต้รหัสเอเจนต์เดียวกัน)
    - `all`: เซสชันใดๆ การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
    - การจำกัดของแซนด์บ็อกซ์: เมื่อเซสชันปัจจุบันอยู่ในแซนด์บ็อกซ์และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม

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
    - รองรับไฟล์แนบเฉพาะสำหรับ `runtime: "subagent"` รันไทม์ ACP จะปฏิเสธไฟล์แนบเหล่านี้
    - ไฟล์จะถูกสร้างเป็นไฟล์จริงในเวิร์กสเปซลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - เนื้อหาไฟล์แนบจะถูกปกปิดโดยอัตโนมัติเมื่อบันทึกทรานสคริปต์แบบถาวร
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจชุดอักขระ/แพดดิงอย่างเข้มงวด และมีตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลทำตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ค่าเริ่มต้นคือปิด เว้นแต่มีกฎเปิดใช้อัตโนมัติของ GPT-5 แบบเอเจนต์เคร่งครัดที่มีผล

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: เปิดใช้งานเครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับการติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือการแทนที่ราย agent) จะตั้งเป็น `"strict-agentic"` สำหรับการรัน OpenAI หรือ OpenAI Codex ตระกูล GPT-5 ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนี้นอกขอบเขตดังกล่าว หรือตั้งเป็น `false` เพื่อปิดไว้แม้ในการรัน GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้งานแล้ว system prompt จะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญ และคงขั้นตอน `in_progress` ไว้ไม่เกินหนึ่งขั้นตอน

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

- `model`: โมเดลเริ่มต้นสำหรับ sub-agent ที่ถูกสร้างขึ้น หากไม่ระบุ sub-agent จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ ID agent เป้าหมายสำหรับ `sessions_spawn` เมื่อ agent ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะ agent เดียวกัน)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือไม่ระบุ `runTimeoutSeconds` ค่า `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือต่อ subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการแบบกำหนดเองและ URL ฐาน

OpenClaw ใช้แค็ตตาล็อกโมเดลในตัว เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ใน config หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

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
  <Accordion title="การตรวจสอบสิทธิ์และลำดับความสำคัญของการผสาน">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการด้านการตรวจสอบสิทธิ์แบบกำหนดเอง
    - แทนที่ root ของ config agent ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ตัวแปรสภาพแวดล้อมแบบเดิม)
    - ลำดับความสำคัญของการผสานสำหรับ ID ผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ใน `models.json` ของ agent ที่ไม่ว่างจะชนะ
      - ค่า `apiKey` ของ agent ที่ไม่ว่างจะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการโดย SecretRef ในบริบท config/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจาก marker ต้นทาง (`ENV_VAR_NAME` สำหรับการอ้างอิง env, `secretref-managed` สำหรับการอ้างอิง file/exec) แทนการคง secret ที่ถูก resolve แล้ว
      - ค่า header ของผู้ให้บริการที่จัดการโดย SecretRef จะถูกรีเฟรชจาก marker ต้นทาง (`secretref-env:ENV_VAR_NAME` สำหรับการอ้างอิง env, `secretref-managed` สำหรับการอ้างอิง file/exec)
      - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือขาดหายไปจะ fallback ไปยัง `models.providers` ใน config
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันใช้ค่าที่สูงกว่าระหว่าง config แบบ explicit และค่าแค็ตตาล็อกแบบ implicit
      - `contextTokens` ของโมเดลที่ตรงกันจะคงขีดจำกัด runtime แบบ explicit ไว้เมื่อมีอยู่ ใช้มันเพื่อจำกัดบริบทที่มีผลโดยไม่เปลี่ยน metadata โมเดลดั้งเดิม
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
      - การคงอยู่ของ marker ยึดต้นทางเป็นแหล่งอ้างอิง: marker ถูกเขียนจาก snapshot config ต้นทางที่ใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่า secret runtime ที่ถูก resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ผู้ให้บริการ

<AccordionGroup>
  <Accordion title="แค็ตตาล็อกระดับบนสุด">
    - `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: แผนที่ผู้ให้บริการแบบกำหนดเองที่ keyed ด้วย ID ผู้ให้บริการ
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเข้าไป `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณจะส่ง `--replace`

  </Accordion>
  <Accordion title="การเชื่อมต่อผู้ให้บริการและการตรวจสอบสิทธิ์">
    - `models.providers.*.api`: adapter คำขอ (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` เป็นต้น) สำหรับ backend `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ local ที่เข้ากันได้กับ OpenAI ส่วนใหญ่ ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้ง `openai-responses` เฉพาะเมื่อ backend รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: credential ของผู้ให้บริการ (แนะนำ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์การตรวจสอบสิทธิ์ (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: หน้าต่างบริบทดั้งเดิมเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: ขีดจำกัดบริบท runtime ที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: ขีดจำกัด token เอาต์พุตเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: timeout คำขอ HTTP ของโมเดลต่อผู้ให้บริการแบบไม่บังคับ หน่วยเป็นวินาที รวมถึงการเชื่อมต่อ, headers, body และการจัดการยกเลิกคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่ง credential ใน header `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API upstream
    - `models.providers.*.headers`: header แบบคงที่เพิ่มเติมสำหรับการ route proxy/tenant

  </Accordion>
  <Accordion title="การแทนที่การขนส่งคำขอ">
    `models.providers.*.request`: การแทนที่การขนส่งสำหรับคำขอ HTTP ของผู้ให้บริการโมเดล

    - `request.headers`: header เพิ่มเติม (ผสานกับค่าเริ่มต้นของผู้ให้บริการ) ค่ายอมรับ SecretRef
    - `request.auth`: การแทนที่กลยุทธ์การตรวจสอบสิทธิ์ โหมด: `"provider-default"` (ใช้การตรวจสอบสิทธิ์ในตัวของผู้ให้บริการ), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบไม่บังคับ)
    - `request.proxy`: การแทนที่ HTTP proxy โหมด: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับอ็อบเจ็กต์ย่อย `tls` แบบไม่บังคับ
    - `request.tls`: การแทนที่ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve เป็นช่วง private, CGNAT หรือช่วงคล้ายกัน ผ่านตัวป้องกัน HTTP fetch ของผู้ให้บริการ (operator opt-in สำหรับ endpoint ที่โฮสต์เองและเข้ากันได้กับ OpenAI ที่เชื่อถือได้) URL stream ของผู้ให้บริการโมเดลแบบ loopback เช่น `localhost`, `127.0.0.1` และ `[::1]` จะได้รับอนุญาตโดยอัตโนมัติ เว้นแต่ค่านี้จะถูกตั้งเป็น `false` อย่างชัดเจน; โฮสต์ LAN, tailnet และ private DNS ยังต้อง opt-in WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ได้ใช้ gate SSRF ของ fetch นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="รายการแค็ตตาล็อกโมเดล">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของผู้ให้บริการแบบ explicit
    - `models.providers.*.models.*.input`: modality อินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดลข้อความเท่านั้น และ `["text", "image"]` สำหรับโมเดลรูปภาพ/วิชันดั้งเดิม ไฟล์แนบรูปภาพจะถูก inject เข้าไปใน turn ของ agent เฉพาะเมื่อโมเดลที่เลือกถูกทำเครื่องหมายว่ารองรับรูปภาพ
    - `models.providers.*.models.*.contextWindow`: metadata หน้าต่างบริบทดั้งเดิมของโมเดล ค่านี้แทนที่ `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: ขีดจำกัดบริบท runtime แบบไม่บังคับ ค่านี้แทนที่ `contextTokens` ระดับผู้ให้บริการ ใช้เมื่อคุณต้องการงบบริบทที่มีผลเล็กกว่า `contextWindow` ดั้งเดิมของโมเดล; `openclaw models list` จะแสดงค่าทั้งสองเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: hint ความเข้ากันได้แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบไม่ว่างและไม่ใช่ดั้งเดิม (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ที่ runtime `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรม OpenAI เริ่มต้น
    - `models.providers.*.models.*.compat.requiresStringContent`: hint ความเข้ากันได้แบบไม่บังคับสำหรับ endpoint แชตที่เข้ากันได้กับ OpenAI และรองรับเฉพาะ string เมื่อเป็น `true` OpenClaw จะแปลง array `messages[].content` ที่เป็นข้อความล้วนให้เป็น string ธรรมดาก่อนส่งคำขอ

  </Accordion>
  <Accordion title="การค้นพบ Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: root การตั้งค่าการค้นพบอัตโนมัติของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นพบแบบ implicit
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region ของ AWS สำหรับการค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบไม่บังคับสำหรับการค้นพบแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลา polling สำหรับการรีเฟรชการค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: หน้าต่างบริบท fallback สำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token เอาต์พุตสูงสุด fallback สำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การ onboarding ผู้ให้บริการแบบกำหนดเองแบบโต้ตอบจะอนุมานอินพุตรูปภาพสำหรับ ID โมเดลวิชันทั่วไป เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่าเป็นข้อความเท่านั้น ID โมเดลที่ไม่รู้จักยังคง prompt สำหรับการรองรับรูปภาพ การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน ส่ง `--custom-image-input` เพื่อบังคับ metadata ที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับ metadata แบบข้อความเท่านั้น

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการ `cerebras` ที่มาพร้อม OpenClaw สามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้ config ผู้ให้บริการแบบ explicit เฉพาะเมื่อต้องการแทนที่ค่าเริ่มต้น

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    เข้ากันได้กับ Anthropic เป็นผู้ให้บริการในตัว ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="โมเดลภายในเครื่อง (LM Studio)">
    ดู [โมเดลภายในเครื่อง](/th/gateway/local-models) สรุปสั้นๆ: เรียกใช้โมเดลภายในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง และคงโมเดลแบบโฮสต์ไว้รวมอยู่เพื่อใช้เป็นตัวสำรอง
  </Accordion>
  <Accordion title="MiniMax M2.7 (โดยตรง)">
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

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แคตตาล็อกโมเดลมีค่าเริ่มต้นเป็น M2.7 เท่านั้น บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic OpenClaw จะปิดการคิดของ MiniMax เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    สำหรับเอ็นด์พอยต์ในจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    เอ็นด์พอยต์ Moonshot แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานสตรีมมิงบนทรานสปอร์ต `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw จะอิงสิ่งนั้นจากความสามารถของเอ็นด์พอยต์ แทนที่จะอิงเฉพาะ id ของผู้ให้บริการในตัว

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

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs แบบ `opencode/...` สำหรับแคตตาล็อก Zen หรือ refs แบบ `opencode-go/...` สำหรับแคตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

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

    URL ฐานควรละ `/v1` ไว้ (ไคลเอนต์ Anthropic จะเติมให้) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

    - เอ็นด์พอยต์ทั่วไป: `https://api.z.ai/api/paas/v4`
    - เอ็นด์พอยต์สำหรับการเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับเอ็นด์พอยต์ทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมการแทนที่ URL ฐาน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนอื่นๆ
- [เครื่องมือและ plugins](/th/tools)
