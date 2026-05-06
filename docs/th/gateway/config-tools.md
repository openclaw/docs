---
read_when:
    - การกำหนดค่านโยบาย `tools.*`, รายการอนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL พื้นฐาน
    - การตั้งค่าปลายทางที่โฮสต์เองซึ่งเข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย สวิตช์ทดลอง เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-05-06T09:12:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7230354339e14ce25ad1fc232528634d92ba86125d908450c1ee5e04b4434e9
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` คีย์การกำหนดค่าและการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับ agents, channels และคีย์การกำหนดค่าระดับบนสุดอื่น ๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
ค่าเริ่มต้นของการเริ่มใช้งานในเครื่องจะตั้งค่าคอนฟิกภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ระบุไว้อย่างชัดเจนเดิมจะถูกรักษาไว้)
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
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็นนามแฝงของ `exec`)                                         |
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

นโยบายอนุญาต/ปฏิเสธเครื่องมือแบบส่วนกลาง (การปฏิเสธมีสิทธิ์เหนือกว่า) ไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ รองรับไวลด์การ์ด `*` ใช้แม้เมื่อ Docker sandbox ปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็น id เครื่องมือแยกกัน `allow: ["write"]` จะเปิดใช้งาน `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` จะไม่ปฏิเสธ `apply_patch` หากต้องการบล็อกการแก้ไขไฟล์ทั้งหมด ให้ปฏิเสธ `group:fs` หรือระบุเครื่องมือที่แก้ไขได้แต่ละรายการอย่างชัดเจน:

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

- การแทนที่ต่อ agent (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดให้มากขึ้นเท่านั้น
- `/elevated on|off|ask|full` เก็บสถานะต่อ session; คำสั่งกำกับแบบ inline ใช้กับข้อความเดียว
- `exec` แบบยกระดับจะข้าม sandboxing และใช้ escape path ที่กำหนดค่าไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

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

การตรวจสอบความปลอดภัยของลูปเครื่องมือถูก**ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ สามารถกำหนดการตั้งค่าแบบส่วนกลางใน `tools.loopDetection` และแทนที่ต่อ agent ได้ที่ `agents.list[].tools.loopDetection`

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
  เกณฑ์รูปแบบไม่มีความคืบหน้าซ้ำสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  เกณฑ์การซ้ำที่สูงขึ้นสำหรับการบล็อกลูปวิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  เกณฑ์หยุดทันทีสำหรับการทำงานที่ไม่มีความคืบหน้าใด ๆ
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียกเครื่องมือเดิม/อาร์กิวเมนต์เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกเครื่องมือ polling ที่รู้จัก (`process.poll`, `command_status` ฯลฯ)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกรูปแบบคู่สลับที่ไม่มีความคืบหน้า
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
  <Accordion title="Media model entry fields">
    **รายการ Provider** (`type: "provider"` หรือไม่ระบุ):

    - `provider`: รหัสผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
    - `model`: ค่าแทนที่รหัสโมเดล
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะรัน
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น; `openclaw doctor --fix` ย้าย placeholder `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการเสริม (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → รูปภาพ, `google` → รูปภาพ+เสียง+วิดีโอ, `groq` → เสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ค่าแทนที่ต่อรายการ
    - `tools.media.image.timeoutSeconds` และรายการ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลด้วยเมื่อเอเจนต์เรียกเครื่องมือ `image` อย่างชัดเจน
    - ความล้มเหลวจะถอยไปใช้รายการถัดไป

    การยืนยันตัวตนของผู้ให้บริการเป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปรสภาพแวดล้อม → `models.providers.*.apiKey`

    **ฟิลด์การทำให้เสร็จแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: แฟล็กความเข้ากันได้ที่เลิกใช้แล้ว งานสื่ออะซิงโครนัสที่เสร็จสมบูรณ์ยังคงถูกจัดการผ่านเซสชันผู้ร้องขอ เพื่อให้เอเจนต์ได้รับผลลัพธ์ ตัดสินใจว่าจะบอกผู้ใช้อย่างไร และใช้เครื่องมือส่งข้อความเมื่อการส่งจากแหล่งที่มาต้องใช้

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
  <Accordion title="Visibility scopes">
    - `self`: เฉพาะคีย์เซสชันปัจจุบันเท่านั้น
    - `tree`: เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันปัจจุบัน (subagents)
    - `agent`: เซสชันใดก็ตามที่เป็นของรหัสเอเจนต์ปัจจุบัน (อาจรวมถึงผู้ใช้อื่น หากคุณรันเซสชันแยกตามผู้ส่งภายใต้รหัสเอเจนต์เดียวกัน)
    - `all`: เซสชันใดก็ได้ การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
    - การจำกัดของ Sandbox: เมื่อเซสชันปัจจุบันอยู่ใน Sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม

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
    - รองรับไฟล์แนบเฉพาะสำหรับ `runtime: "subagent"` เท่านั้น ACP runtime จะปฏิเสธไฟล์แนบเหล่านี้
    - ไฟล์จะถูกสร้างเป็นวัตถุจริงในพื้นที่ทำงานลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - เนื้อหาของไฟล์แนบจะถูกปกปิดโดยอัตโนมัติจากการบันทึก transcript แบบถาวร
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจตัวอักษร/การ padding แบบเข้มงวด และมีตัวป้องกันขนาดก่อน decode
    - สิทธิ์ของไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลเป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ปิดเป็นค่าเริ่มต้น เว้นแต่มีกฎเปิดใช้อัตโนมัติสำหรับ GPT-5 แบบ strict-agentic

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
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือการ override ต่อ agent) จะตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล OpenAI หรือ OpenAI Codex GPT-5 ตั้งเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือ `false` เพื่อปิดไว้แม้ในการรัน GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้ system prompt จะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญ และคงขั้นตอน `in_progress` ไว้ไม่เกินหนึ่งขั้นตอน

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

- `model`: โมเดลเริ่มต้นสำหรับ sub-agent ที่ถูกสร้างขึ้น หากละไว้ sub-agent จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ id agent เป้าหมายสำหรับ `sessions_spawn` เมื่อ agent ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: agent เดียวกันเท่านั้น)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือละ `runTimeoutSeconds` ไว้ `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือต่อ subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## ผู้ให้บริการแบบกำหนดเองและ base URL

OpenClaw ใช้แคตตาล็อกโมเดลในตัว เพิ่มผู้ให้บริการแบบกำหนดเองผ่าน `models.providers` ใน config หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

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
  <Accordion title="การยืนยันตัวตนและลำดับความสำคัญในการ merge">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการ auth แบบกำหนดเอง
    - override root ของ agent config ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ของตัวแปรสภาพแวดล้อมแบบ legacy)
    - ลำดับความสำคัญในการ merge สำหรับ ID ผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ใน `models.json` ของ agent ที่ไม่ว่างจะชนะ
      - ค่า `apiKey` ของ agent ที่ไม่ว่างจะชนะเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูก refresh จาก source marker (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคง secrets ที่ resolve แล้วไว้
      - ค่า header ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูก refresh จาก source marker (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
      - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือขาดหายจะ fallback ไปที่ `models.providers` ใน config
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่าง config ที่ระบุชัดเจนกับค่า implicit จากแคตตาล็อก
      - `contextTokens` ของโมเดลที่ตรงกันจะรักษาค่า runtime cap ที่ระบุชัดเจนไว้เมื่อมีอยู่; ใช้ค่านี้เพื่อจำกัด context ที่มีผลโดยไม่เปลี่ยน metadata ดั้งเดิมของโมเดล
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
      - การคงอยู่ของ marker ยึด source เป็นอำนาจตัดสิน: marker จะถูกเขียนจาก snapshot config แหล่งที่ใช้งานอยู่ (ก่อน resolution) ไม่ใช่จากค่า secret ของ runtime ที่ resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ของผู้ให้บริการ

<AccordionGroup>
  <Accordion title="แคตตาล็อกระดับบนสุด">
    - `models.mode`: พฤติกรรมของแคตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: map ผู้ให้บริการแบบกำหนดเองที่ keyed ด้วย provider id
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มข้อมูล `config set` จะปฏิเสธการแทนที่ที่ทำลายข้อมูล เว้นแต่คุณจะส่ง `--replace`

  </Accordion>
  <Accordion title="การเชื่อมต่อและ auth ของผู้ให้บริการ">
    - `models.providers.*.api`: request adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai`, ฯลฯ) สำหรับ backend `/v1/chat/completions` ที่ host เอง เช่น MLX, vLLM, SGLang และ local server ส่วนใหญ่ที่เข้ากันได้กับ OpenAI ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้ง `openai-responses` เฉพาะเมื่อ backend รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: credential ของผู้ให้บริการ (แนะนำให้ใช้ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: context window ดั้งเดิมเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้ง `contextWindow`
    - `models.providers.*.contextTokens`: runtime context cap ที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้ง `contextTokens`
    - `models.providers.*.maxTokens`: output-token cap เริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้ง `maxTokens`
    - `models.providers.*.timeoutSeconds`: timeout ของคำขอ HTTP โมเดลต่อผู้ให้บริการแบบไม่บังคับ หน่วยเป็นวินาที รวมถึง connect, headers, body และการจัดการ abort ของคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่ง credential ผ่าน header `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: base URL ของ upstream API
    - `models.providers.*.headers`: header static เพิ่มเติมสำหรับการ routing proxy/tenant

  </Accordion>
  <Accordion title="การ override request transport">
    `models.providers.*.request`: การ override transport สำหรับคำขอ HTTP ของ model-provider

    - `request.headers`: header เพิ่มเติม (merge กับค่าเริ่มต้นของผู้ให้บริการ) ค่ารองรับ SecretRef
    - `request.auth`: override กลยุทธ์ auth โหมด: `"provider-default"` (ใช้ auth ในตัวของผู้ให้บริการ), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบไม่บังคับ)
    - `request.proxy`: override HTTP proxy โหมด: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับ sub-object `tls` แบบไม่บังคับ
    - `request.tls`: override TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve เป็นช่วง private, CGNAT หรือช่วงที่คล้ายกัน ผ่าน fetch guard HTTP ของผู้ให้บริการ (operator opt-in สำหรับ endpoint ที่ host เองและเชื่อถือได้ซึ่งเข้ากันได้กับ OpenAI) URL สตรีมของ model-provider แบบ loopback เช่น `localhost`, `127.0.0.1` และ `[::1]` จะได้รับอนุญาตโดยอัตโนมัติ เว้นแต่นี่จะถูกตั้งเป็น `false` อย่างชัดเจน; host แบบ LAN, tailnet และ private DNS ยังคงต้อง opt-in WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="รายการแคตตาล็อกโมเดล">
    - `models.providers.*.models`: รายการแคตตาล็อกโมเดลของผู้ให้บริการที่ระบุชัดเจน
    - `models.providers.*.models.*.input`: modality อินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดล text-only และ `["text", "image"]` สำหรับโมเดล native image/vision ไฟล์แนบรูปภาพจะถูก inject เข้าไปใน turn ของ agent เฉพาะเมื่อโมเดลที่เลือกถูกทำเครื่องหมายว่ารองรับรูปภาพ
    - `models.providers.*.models.*.contextWindow`: metadata context window ดั้งเดิมของโมเดล ค่านี้ override `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: runtime context cap แบบไม่บังคับ ค่านี้ override `contextTokens` ระดับผู้ให้บริการ; ใช้เมื่อต้องการงบ context ที่มีผลเล็กกว่า `contextWindow` ดั้งเดิมของโมเดล; `openclaw models list` แสดงทั้งสองค่าเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: hint ความเข้ากันได้แบบไม่บังคับ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบไม่ว่างและไม่ใช่ native (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ตอน runtime `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรมเริ่มต้นของ OpenAI
    - `models.providers.*.models.*.compat.requiresStringContent`: hint ความเข้ากันได้แบบไม่บังคับสำหรับ endpoint แชตที่เข้ากันได้กับ OpenAI และรองรับเฉพาะ string เมื่อเป็น `true` OpenClaw จะแปลง array `messages[].content` ที่เป็นข้อความล้วนให้เป็น string ธรรมดาก่อนส่งคำขอ

  </Accordion>
  <Accordion title="การค้นพบ Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: root การตั้งค่า auto-discovery ของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นพบแบบ implicit
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region ของ AWS สำหรับการค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id แบบไม่บังคับสำหรับการค้นพบแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: polling interval สำหรับการ refresh การค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback สำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: token เอาต์พุตสูงสุด fallback สำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การ onboarding ผู้ให้บริการแบบกำหนดเองแบบโต้ตอบจะอนุมานอินพุตรูปภาพสำหรับ ID โมเดล vision ทั่วไป เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่าเป็น text-only ID โมเดลที่ไม่รู้จักจะยังคง prompt เรื่องการรองรับรูปภาพ การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน; ส่ง `--custom-image-input` เพื่อบังคับ metadata ที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับ metadata แบบ text-only

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการ `cerebras` ที่ bundle มาด้วยสามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้ config ผู้ให้บริการที่ระบุชัดเจนเฉพาะเมื่อ override ค่าเริ่มต้นเท่านั้น

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
  <Accordion title="การเขียนโค้ดด้วย Kimi">
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

    ผู้ให้บริการในตัวที่เข้ากันได้กับ Anthropic ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="โมเดลภายในเครื่อง (LM Studio)">
    ดู [โมเดลภายในเครื่อง](/th/gateway/local-models) สรุปสั้น ๆ: เรียกใช้โมเดลภายในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์จริงจัง; เก็บโมเดลที่โฮสต์ไว้รวมอยู่ด้วยเพื่อใช้เป็นตัวสำรอง
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

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แค็ตตาล็อกโมเดลตั้งค่าเริ่มต้นเป็น M2.7 เท่านั้น บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดการคิดของ MiniMax ตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    สำหรับเอนด์พอยต์จีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    เอนด์พอยต์ดั้งเดิมของ Moonshot ระบุความเข้ากันได้ของการใช้งานสตรีมมิงบนทรานสปอร์ต `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw อ้างอิงความสามารถของเอนด์พอยต์นั้น แทนที่จะอ้างอิงเฉพาะ id ผู้ให้บริการในตัวเท่านั้น

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

    ตั้งค่า `ZAI_API_KEY` ยอมรับ `z.ai/*` และ `z-ai/*` เป็นนามแฝงด้วย ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - เอนด์พอยต์ทั่วไป: `https://api.z.ai/api/paas/v4`
    - เอนด์พอยต์การเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับเอนด์พอยต์ทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองโดยแทนที่ URL ฐาน

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่น ๆ
- [เครื่องมือและ plugins](/th/tools)
