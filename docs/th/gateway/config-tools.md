---
read_when:
    - การกำหนดค่านโยบาย `tools.*`, รายการอนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL พื้นฐาน
    - การตั้งค่าปลายทางที่โฮสต์ด้วยตนเองที่เข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย, ตัวเลือกเปิด/ปิดเชิงทดลอง, เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-04-30T09:51:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1790c92ecaf822c837326d8e22e9d72cc44e5d4cc0bcc00c154ba5160975002a
    source_path: gateway/config-tools.md
    workflow: 16
---

`tools.*` คีย์การกำหนดค่าและการตั้งค่าผู้ให้บริการแบบกำหนดเอง / base-URL สำหรับเอเจนต์ ช่องทาง และคีย์การกำหนดค่าระดับบนสุดอื่นๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
การเริ่มต้นใช้งานภายในเครื่องจะตั้งค่าเริ่มต้นของการกำหนดค่าภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ระบุไว้อย่างชัดเจนอยู่แล้วจะถูกคงไว้)
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
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับให้เป็น alias ของ `exec`)                                             |
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
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวม Plugin ของผู้ให้บริการ)                                                                 |

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือทั่วทั้งระบบ (การปฏิเสธมีผลเหนือกว่า) ไม่สนตัวพิมพ์เล็กใหญ่ รองรับ wildcard `*` ใช้บังคับแม้เมื่อ Docker sandbox ปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับผู้ให้บริการหรือโมเดลที่ระบุ ลำดับ: โปรไฟล์พื้นฐาน → โปรไฟล์ผู้ให้บริการ → อนุญาต/ปฏิเสธ

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

- การ override รายเอเจนต์ (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดเพิ่มเติมเท่านั้น
- `/elevated on|off|ask|full` เก็บสถานะเป็นรายเซสชัน; คำสั่งกำกับแบบ inline มีผลกับข้อความเดียว
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

การตรวจสอบความปลอดภัยของลูปเครื่องมือถูก **ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ สามารถกำหนดการตั้งค่าแบบทั่วทั้งระบบใน `tools.loopDetection` และ override รายเอเจนต์ที่ `agents.list[].tools.loopDetection`

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
  จำนวนประวัติการเรียกเครื่องมือสูงสุดที่เก็บไว้สำหรับการวิเคราะห์ลูป
</ParamField>
<ParamField path="warningThreshold" type="number">
  เกณฑ์ของรูปแบบที่ทำซ้ำโดยไม่มีความคืบหน้าสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  เกณฑ์การทำซ้ำที่สูงกว่าสำหรับบล็อกลูปวิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  เกณฑ์หยุดทันทีสำหรับการรันใดๆ ที่ไม่มีความคืบหน้า
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียกเครื่องมือเดียวกัน/อาร์กิวเมนต์เดียวกันซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกสำหรับเครื่องมือ poll ที่รู้จัก (`process.poll`, `command_status` ฯลฯ)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกเมื่อมีรูปแบบคู่ที่สลับกันโดยไม่มีความคืบหน้า
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
        directSend: false, // opt-in: send finished async music/video directly to the channel
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
    **รายการ Provider** (`type: "provider"` หรือเว้นไว้):

    - `provider`: id ของผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
    - `model`: ระบุ id ของโมเดลทับค่าเดิม
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะรัน
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ; `openclaw doctor --fix` จะย้าย placeholder `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการที่ไม่บังคับ (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → รูปภาพ, `google` → รูปภาพ+เสียง+วิดีโอ, `groq` → เสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: ค่าทับรายรายการ
    - `tools.media.image.timeoutSeconds` และรายการ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลด้วยเมื่อเอเจนต์เรียกเครื่องมือ `image` แบบชัดเจน
    - เมื่อเกิดความล้มเหลว จะย้อนกลับไปใช้รายการถัดไป

    การตรวจสอบสิทธิ์ของ Provider ทำตามลำดับมาตรฐาน: `auth-profiles.json` → env vars → `models.providers.*.apiKey`

    **ฟิลด์การทำงานเสร็จแบบอะซิงโครนัส:**

    - `asyncCompletion.directSend`: เมื่อเป็น `true` งาน `music_generate` และ `video_generate` แบบอะซิงโครนัสที่เสร็จแล้วจะพยายามส่งตรงไปยังช่องทางก่อน ค่าเริ่มต้น: `false` (เส้นทางเดิมแบบปลุกเซสชันผู้ร้องขอ/ส่งมอบผ่านโมเดล)

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
    - `self`: เฉพาะคีย์เซสชันปัจจุบัน
    - `tree`: เซสชันปัจจุบัน + เซสชันที่ถูกสร้างโดยเซสชันปัจจุบัน (subagents)
    - `agent`: เซสชันใดก็ตามที่เป็นของ id เอเจนต์ปัจจุบัน (อาจรวมผู้ใช้อื่นได้หากคุณรันเซสชันแยกตามผู้ส่งภายใต้ id เอเจนต์เดียวกัน)
    - `all`: เซสชันใดก็ได้ การกำหนดเป้าหมายข้ามเอเจนต์ยังต้องใช้ `tools.agentToAgent`
    - การจำกัดของ sandbox: เมื่อเซสชันปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` visibility จะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม

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
    - ไฟล์แนบรองรับเฉพาะ `runtime: "subagent"` เท่านั้น runtime ของ ACP จะปฏิเสธไฟล์แนบเหล่านี้
    - ไฟล์จะถูกสร้างเป็นวัตถุใน workspace ลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - เนื้อหาไฟล์แนบจะถูกปกปิดจากการคงอยู่ของทรานสคริปต์โดยอัตโนมัติ
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจสอบตัวอักษร/การ padding อย่างเข้มงวด และมีตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรีและ `0600` สำหรับไฟล์
    - การล้างข้อมูลทำตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

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

- `planTool`: เปิดใช้เครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ใช่งานง่าย ๆ
- ค่าเริ่มต้น: `false` เว้นแต่ตั้งค่า `agents.defaults.embeddedPi.executionContract` (หรือการเขียนทับรายเอเจนต์) เป็น `"strict-agentic"` สำหรับการรัน OpenAI หรือ OpenAI Codex ตระกูล GPT-5 ตั้งค่าเป็น `true` เพื่อบังคับเปิดเครื่องมือนอกขอบเขตนั้น หรือ `false` เพื่อปิดไว้แม้กับการรัน GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้ พรอมป์ระบบจะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานขนาดใหญ่ และคงไว้ไม่เกินหนึ่งขั้นตอนเป็น `in_progress`

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

- `model`: โมเดลเริ่มต้นสำหรับเอเจนต์ย่อยที่ถูกสร้าง หากไม่ระบุ เอเจนต์ย่อยจะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของรหัสเอเจนต์ปลายทางสำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือไม่ระบุ `runTimeoutSeconds` ค่า `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือต่อเอเจนต์ย่อย: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

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
  <Accordion title="Auth and merge precedence">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการการยืนยันตัวตนแบบกำหนดเอง
    - เขียนทับราก config ของเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ตัวแปรสภาพแวดล้อมเดิม)
    - ลำดับความสำคัญของการ merge สำหรับ ID ผู้ให้บริการที่ตรงกัน:
      - ค่า `baseUrl` ของ `models.json` ในเอเจนต์ที่ไม่ว่างจะมีผลเหนือกว่า
      - ค่า `apiKey` ของเอเจนต์ที่ไม่ว่างจะมีผลเหนือกว่าเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์แหล่งที่มา (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการคง secret ที่ resolve แล้วไว้
      - ค่า header ของผู้ให้บริการที่จัดการด้วย SecretRef จะถูกรีเฟรชจากมาร์กเกอร์แหล่งที่มา (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
      - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือขาดหายจะ fallback ไปยัง `models.providers` ใน config
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่าง config ที่ระบุชัดเจนกับค่าจากแค็ตตาล็อกโดยนัย
      - `contextTokens` ของโมเดลที่ตรงกันจะรักษา runtime cap ที่ระบุชัดเจนเมื่อมีอยู่ ใช้ค่านี้เพื่อจำกัดบริบทที่มีผลโดยไม่เปลี่ยน metadata ดั้งเดิมของโมเดล
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
      - การคงมาร์กเกอร์ไว้ยึดแหล่งที่มาเป็นหลัก: มาร์กเกอร์ถูกเขียนจาก snapshot config แหล่งที่มาที่ใช้งานอยู่ (ก่อน resolution) ไม่ใช่จากค่า secret runtime ที่ resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ของผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: พฤติกรรมแค็ตตาล็อกผู้ให้บริการ (`merge` หรือ `replace`)
    - `models.providers`: แผนที่ผู้ให้บริการแบบกำหนดเองที่ใช้รหัสผู้ให้บริการเป็น key
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเข้าไป `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณส่ง `--replace`

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adapter คำขอ (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` ฯลฯ) สำหรับ backend `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ local ส่วนใหญ่ที่เข้ากันได้กับ OpenAI ให้ใช้ `openai-completions` ผู้ให้บริการแบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้งค่า `openai-responses` เฉพาะเมื่อ backend รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: credential ของผู้ให้บริการ (แนะนำให้ใช้ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์การยืนยันตัวตน (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: หน้าต่างบริบทดั้งเดิมเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: runtime context cap ที่มีผลเริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: output-token cap เริ่มต้นสำหรับโมเดลภายใต้ผู้ให้บริการนี้ เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: timeout คำขอ HTTP ของโมเดลต่อผู้ให้บริการแบบเลือกได้ หน่วยเป็นวินาที รวมถึงการเชื่อมต่อ, header, body และการจัดการยกเลิกคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ฉีด `options.num_ctx` ลงในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่ง credential ใน header `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ API upstream
    - `models.providers.*.headers`: header คงที่เพิ่มเติมสำหรับ proxy/tenant routing

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: การเขียนทับ transport สำหรับคำขอ HTTP ของผู้ให้บริการโมเดล

    - `request.headers`: header เพิ่มเติม (merge กับค่าเริ่มต้นของผู้ให้บริการ) ค่ารองรับ SecretRef
    - `request.auth`: การเขียนทับกลยุทธ์การยืนยันตัวตน โหมด: `"provider-default"` (ใช้การยืนยันตัวตนในตัวของผู้ให้บริการ), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบเลือกได้)
    - `request.proxy`: การเขียนทับ HTTP proxy โหมด: `"env-proxy"` (ใช้ตัวแปร env `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับ sub-object `tls` แบบเลือกได้
    - `request.tls`: การเขียนทับ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve เป็นช่วง private, CGNAT หรือช่วงที่คล้ายกัน ผ่าน guard การ fetch HTTP ของผู้ให้บริการ (การ opt-in ของผู้ดำเนินการสำหรับ endpoint ที่โฮสต์เองซึ่งเชื่อถือได้และเข้ากันได้กับ OpenAI) URL stream ของผู้ให้บริการโมเดลแบบ loopback เช่น `localhost`, `127.0.0.1` และ `[::1]` จะได้รับอนุญาตโดยอัตโนมัติ เว้นแต่ตั้งค่านี้เป็น `false` อย่างชัดเจน; โฮสต์ LAN, tailnet และ private DNS ยังต้อง opt-in WebSocket ใช้ `request` เดียวกันสำหรับ header/TLS แต่ไม่ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของผู้ให้บริการที่ระบุชัดเจน
    - `models.providers.*.models.*.input`: modality อินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดล text-only และ `["text", "image"]` สำหรับโมเดลภาพ/vision ดั้งเดิม ไฟล์แนบรูปภาพจะถูกฉีดเข้าไปในรอบของเอเจนต์เฉพาะเมื่อโมเดลที่เลือกถูกทำเครื่องหมายว่ารองรับรูปภาพ
    - `models.providers.*.models.*.contextWindow`: metadata หน้าต่างบริบทดั้งเดิมของโมเดล ค่านี้เขียนทับ `contextWindow` ระดับผู้ให้บริการสำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: runtime context cap แบบเลือกได้ ค่านี้เขียนทับ `contextTokens` ระดับผู้ให้บริการ ใช้เมื่อคุณต้องการงบประมาณบริบทที่มีผลเล็กกว่า `contextWindow` ดั้งเดิมของโมเดล; `openclaw models list` จะแสดงทั้งสองค่าเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: compatibility hint แบบเลือกได้ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` ที่ไม่ว่างและไม่ใช่ native (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ขณะ runtime `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรม OpenAI เริ่มต้น
    - `models.providers.*.models.*.compat.requiresStringContent`: compatibility hint แบบเลือกได้สำหรับ chat endpoint แบบ string-only ที่เข้ากันได้กับ OpenAI เมื่อเป็น `true` OpenClaw จะ flatten อาร์เรย์ `messages[].content` ที่เป็นข้อความล้วนให้เป็น string ธรรมดาก่อนส่งคำขอ

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: รากการตั้งค่า auto-discovery ของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิดการค้นหาโดยนัย
    - `plugins.entries.amazon-bedrock.config.discovery.region`: ภูมิภาค AWS สำหรับ discovery
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบเลือกได้สำหรับ discovery แบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการ polling สำหรับรีเฟรช discovery
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: หน้าต่างบริบท fallback สำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: max output tokens แบบ fallback สำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การ onboard ผู้ให้บริการแบบกำหนดเองแบบโต้ตอบจะอนุมานอินพุตรูปภาพสำหรับ ID โมเดล vision ที่พบบ่อย เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่าเป็น text-only ID โมเดลที่ไม่รู้จักยังคงถามเรื่องการรองรับรูปภาพ การ onboard แบบไม่โต้ตอบใช้การอนุมานเดียวกัน; ส่ง `--custom-image-input` เพื่อบังคับ metadata ที่รองรับรูปภาพ หรือ `--custom-text-input` เพื่อบังคับ metadata แบบ text-only

### ตัวอย่างผู้ให้บริการ

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin ผู้ให้บริการ `cerebras` ที่รวมมาให้สามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้ config ผู้ให้บริการที่ระบุชัดเจนเฉพาะเมื่อเขียนทับค่าเริ่มต้น

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

    เข้ากันได้กับ Anthropic และเป็นผู้ให้บริการในตัว Shortcut: `openclaw onboard --auth-choice kimi-code-api-key`.

  </Accordion>
  <Accordion title="โมเดลในเครื่อง (LM Studio)">
    ดู [โมเดลในเครื่อง](/th/gateway/local-models) สรุปสั้น ๆ: รันโมเดลในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์จริงจัง; เก็บโมเดลแบบโฮสต์ไว้แบบผสานเพื่อใช้เป็น fallback.
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

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แค็ตตาล็อกโมเดลมีค่าเริ่มต้นเป็น M2.7 เท่านั้น บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic, OpenClaw จะปิดการคิดของ MiniMax เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    สำหรับ endpoint ของจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    endpoint ของ Moonshot แบบ native ประกาศความเข้ากันได้ของการใช้งานสตรีมมิงบน transport `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw อ้างอิงความสามารถของ endpoint แทนที่จะอ้างอิงเฉพาะ id ของ provider ในตัวเท่านั้น

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

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs `opencode/...` สำหรับแค็ตตาล็อก Zen หรือ refs `opencode-go/...` สำหรับแค็ตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

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

    Base URL ควรละ `/v1` (ไคลเอนต์ Anthropic จะต่อท้ายให้) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

    ตั้งค่า `ZAI_API_KEY` `z.ai/*` และ `z-ai/*` เป็น alias ที่ยอมรับได้ ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
    - endpoint สำหรับการเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับ endpoint ทั่วไป ให้กำหนด provider แบบกำหนดเองพร้อมการ override Base URL

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนอื่น ๆ
- [เครื่องมือและ plugins](/th/tools)
