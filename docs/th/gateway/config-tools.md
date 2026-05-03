---
read_when:
    - การกำหนดค่านโยบาย `tools.*`, รายการอนุญาต หรือฟีเจอร์ทดลอง
    - การลงทะเบียนผู้ให้บริการแบบกำหนดเองหรือการแทนที่ URL พื้นฐาน
    - การตั้งค่า endpoints แบบ self-hosted ที่เข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่าเครื่องมือ (นโยบาย, สวิตช์ทดลอง, เครื่องมือที่รองรับโดยผู้ให้บริการ) และการตั้งค่าผู้ให้บริการ/URL ฐานแบบกำหนดเอง
title: การกำหนดค่า — เครื่องมือและผู้ให้บริการแบบกำหนดเอง
x-i18n:
    generated_at: "2026-05-03T21:31:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75a39342f40e9c329a7c61855e805ec43532cbdb89fbe801acc26830fd63b4da
    source_path: gateway/config-tools.md
    workflow: 16
---

คีย์ config `tools.*` และการตั้งค่า provider / base-URL แบบกำหนดเอง สำหรับ agents, channels และคีย์ config ระดับบนสุดอื่น ๆ โปรดดู [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## เครื่องมือ

### โปรไฟล์เครื่องมือ

`tools.profile` ตั้งค่า allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
การเริ่มต้นใช้งานในเครื่องจะตั้งค่าเริ่มต้นของ config ในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อไม่ได้ตั้งค่าไว้ (โปรไฟล์ที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะถูกเก็บไว้)
</Note>

| โปรไฟล์     | ประกอบด้วย                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | เฉพาะ `session_status`                                                                                                           |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ได้ตั้งค่า)                                                                                                  |

### กลุ่มเครื่องมือ

| กลุ่ม              | เครื่องมือ                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับให้เป็น alias ของ `exec`)                                         |
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
| `group:openclaw`   | เครื่องมือในตัวทั้งหมด (ไม่รวม provider plugins)                                                                          |

### `tools.allow` / `tools.deny`

นโยบายอนุญาต/ปฏิเสธเครื่องมือแบบโกลบอล (deny มีผลเหนือกว่า) ไม่แยกตัวพิมพ์เล็กใหญ่ รองรับ wildcard `*` ใช้บังคับแม้เมื่อ Docker sandbox ปิดอยู่

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

`write` และ `apply_patch` เป็น tool ids แยกกัน `allow: ["write"]` จะเปิดใช้ `apply_patch` สำหรับโมเดลที่เข้ากันได้ด้วย แต่ `deny: ["write"]` จะไม่ปฏิเสธ `apply_patch` หากต้องการบล็อกการแก้ไขไฟล์ทั้งหมด ให้ปฏิเสธ `group:fs` หรือระบุเครื่องมือที่เปลี่ยนแปลงไฟล์แต่ละรายการอย่างชัดเจน:

```json5
{
  tools: { deny: ["write", "edit", "apply_patch"] },
}
```

### `tools.byProvider`

จำกัดเครื่องมือเพิ่มเติมสำหรับ providers หรือโมเดลที่ระบุ ลำดับ: โปรไฟล์พื้นฐาน → โปรไฟล์ provider → allow/deny

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

- การ override ราย agent (`agents.list[].tools.elevated`) ทำได้เพียงจำกัดเพิ่มเติมเท่านั้น
- `/elevated on|off|ask|full` เก็บสถานะต่อ session; คำสั่ง inline ใช้กับข้อความเดียว
- `exec` แบบยกระดับจะข้าม sandboxing และใช้ escape path ที่กำหนดค่าไว้ (`gateway` โดยค่าเริ่มต้น หรือ `node` เมื่อเป้าหมาย exec คือ `node`)

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

การตรวจสอบความปลอดภัยของลูปเครื่องมือ **ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ สามารถกำหนดการตั้งค่าแบบโกลบอลได้ใน `tools.loopDetection` และ override ต่อ agent ได้ที่ `agents.list[].tools.loopDetection`

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
  จำนวนประวัติ tool-call สูงสุดที่เก็บไว้สำหรับการวิเคราะห์ลูป
</ParamField>
<ParamField path="warningThreshold" type="number">
  ค่า threshold ของรูปแบบ no-progress ที่เกิดซ้ำสำหรับคำเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  ค่า threshold การเกิดซ้ำที่สูงขึ้นสำหรับการบล็อกลูปวิกฤต
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  ค่า threshold สำหรับหยุดทันทีสำหรับการรันแบบ no-progress ใด ๆ
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียกเครื่องมือเดิม/อาร์กิวเมนต์เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกเมื่อใช้เครื่องมือ poll ที่รู้จัก (`process.poll`, `command_status` เป็นต้น)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกเมื่อมีรูปแบบคู่สลับกันแบบ no-progress
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
  <Accordion title="Media model entry fields">
    **รายการ Provider** (`type: "provider"` หรือละไว้):

    - `provider`: ID ผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` ฯลฯ)
    - `model`: การแทนที่ ID โมเดล
    - `profile` / `preferredProfile`: การเลือกโปรไฟล์ `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะรัน
    - `args`: อาร์กิวเมนต์แบบเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` ฯลฯ; `openclaw doctor --fix` จะย้าย placeholder `{input}` ที่เลิกใช้แล้วไปเป็น `{{MediaPath}}`)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการเสริม (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → รูปภาพ, `google` → รูปภาพ+เสียง+วิดีโอ, `groq` → เสียง
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: การแทนค่าต่อรายการ
    - รายการ `tools.media.image.timeoutSeconds` และ `timeoutSeconds` ของโมเดลรูปภาพที่ตรงกันจะมีผลเมื่อ agent เรียกใช้เครื่องมือ `image` อย่างชัดเจนด้วย
    - หากล้มเหลว ระบบจะถอยกลับไปยังรายการถัดไป

    การยืนยันตัวตนของ Provider ใช้ลำดับมาตรฐาน: `auth-profiles.json` → ตัวแปร env → `models.providers.*.apiKey`

    **ฟิลด์การเสร็จสิ้นแบบอะซิงก์:**

    - `asyncCompletion.directSend`: เมื่อเป็น `true` งานสื่อแบบอะซิงก์ที่เสร็จแล้วและรองรับการส่งมอบการเสร็จสิ้นโดยตรงจะพยายามส่งมอบไปยังช่องทางโดยตรงก่อน ค่าเริ่มต้น: `false` (เส้นทางปลุกเซสชันผู้ร้องขอ/ส่งมอบโมเดล) ปัจจุบันใช้กับ `video_generate` แบบอะซิงก์ ส่วนการเสร็จสิ้นของ `music_generate` แบบอะซิงก์ยังคงผ่านเซสชันผู้ร้องขอ แม้เปิดใช้งานตัวเลือกนี้ก็ตาม

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
  <Accordion title="Visibility scopes">
    - `self`: เฉพาะคีย์เซสชันปัจจุบันเท่านั้น
    - `tree`: เซสชันปัจจุบัน + เซสชันที่เซสชันปัจจุบันสร้างขึ้น (subagents)
    - `agent`: เซสชันใดก็ตามที่เป็นของ ID agent ปัจจุบัน (อาจรวมผู้ใช้อื่นด้วย หากคุณรันเซสชันต่อผู้ส่งภายใต้ ID agent เดียวกัน)
    - `all`: เซสชันใดก็ได้ การกำหนดเป้าหมายข้าม agent ยังต้องใช้ `tools.agentToAgent`
    - การบีบขอบเขตของ sandbox: เมื่อเซสชันปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` การมองเห็นจะถูกบังคับเป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม

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
    - รองรับไฟล์แนบเฉพาะสำหรับ `runtime: "subagent"` เท่านั้น รันไทม์ ACP จะปฏิเสธไฟล์แนบเหล่านี้
    - ไฟล์จะถูกสร้างเป็นไฟล์จริงใน workspace ลูกที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - เนื้อหาไฟล์แนบจะถูกปกปิดโดยอัตโนมัติจากการคงอยู่ของ transcript
    - อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจตัวอักษร/การเติม padding อย่างเข้มงวด และมีตัวป้องกันขนาดก่อนถอดรหัส
    - สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การล้างข้อมูลเป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กเครื่องมือในตัวแบบทดลอง ค่าเริ่มต้นคือปิด เว้นแต่จะเข้าเกณฑ์กฎเปิดใช้อัตโนมัติของ GPT-5 แบบ strict-agentic

```json5
{
  tools: {
    experimental: {
      planTool: true, // enable experimental update_plan
    },
  },
}
```

- `planTool`: เปิดใช้งานเครื่องมือ `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ธรรมดา
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือการ override ราย agent) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล GPT-5 ของ OpenAI หรือ OpenAI Codex ตั้งค่าเป็น `true` เพื่อบังคับเปิดเครื่องมือนี้นอกขอบเขตนั้น หรือ `false` เพื่อคงสถานะปิดไว้แม้สำหรับการรัน GPT-5 แบบ strict-agentic
- เมื่อเปิดใช้งาน system prompt จะเพิ่มแนวทางการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญและมีขั้นตอน `in_progress` ได้มากที่สุดหนึ่งขั้นตอน

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

- `model`: โมเดลเริ่มต้นสำหรับ sub-agent ที่ถูกสร้าง หากละไว้ sub-agent จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ id agent เป้าหมายสำหรับ `sessions_spawn` เมื่อ requester agent ไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: agent เดียวกันเท่านั้น)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียกเครื่องมือละ `runTimeoutSeconds` ไว้ `0` หมายถึงไม่มี timeout
- นโยบายเครื่องมือต่อ sub-agent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## Provider แบบกำหนดเองและ URL ฐาน

OpenClaw ใช้แค็ตตาล็อกโมเดลในตัว เพิ่ม provider แบบกำหนดเองผ่าน `models.providers` ใน config หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

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
    - Override root config ของ agent ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น alias ของตัวแปรสภาพแวดล้อมเดิม)
    - ลำดับความสำคัญของการ merge สำหรับ ID provider ที่ตรงกัน:
      - ค่า `baseUrl` ใน agent `models.json` ที่ไม่ว่างจะชนะ
      - ค่า `apiKey` ใน agent ที่ไม่ว่างจะชนะเฉพาะเมื่อ provider นั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบท config/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก marker ต้นทาง (`ENV_VAR_NAME` สำหรับ env ref, `secretref-managed` สำหรับ file/exec ref) แทนการคง secret ที่ resolve แล้ว
      - ค่า header ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก marker ต้นทาง (`secretref-env:ENV_VAR_NAME` สำหรับ env ref, `secretref-managed` สำหรับ file/exec ref)
      - `apiKey`/`baseUrl` ของ agent ที่ว่างหรือหายไปจะ fallback ไปยัง `models.providers` ใน config
      - `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่าง config ที่ระบุชัดเจนกับค่าจากแค็ตตาล็อกโดยนัย
      - `contextTokens` ของโมเดลที่ตรงกันจะรักษาขีดจำกัด runtime ที่ระบุชัดเจนไว้เมื่อมีอยู่ ใช้ค่านี้เพื่อจำกัด context ที่มีผลจริงโดยไม่เปลี่ยน metadata โมเดลเดิม
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้ config เขียน `models.json` ใหม่ทั้งหมด
      - การคงอยู่ของ marker ยึดต้นทางเป็น authoritative: marker จะถูกเขียนจาก snapshot config ต้นทางที่ active อยู่ (ก่อน resolution) ไม่ใช่จากค่า secret ของ runtime ที่ resolve แล้ว

  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ Provider

<AccordionGroup>
  <Accordion title="Top-level catalog">
    - `models.mode`: พฤติกรรมแค็ตตาล็อก provider (`merge` หรือ `replace`)
    - `models.providers`: map ของ provider แบบกำหนดเองที่ใช้ provider id เป็น key
      - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มเข้าไป `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณส่ง `--replace`

  </Accordion>
  <Accordion title="Provider connection and auth">
    - `models.providers.*.api`: adapter สำหรับคำขอ (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` ฯลฯ) สำหรับ backend `/v1/chat/completions` ที่โฮสต์เอง เช่น MLX, vLLM, SGLang และเซิร์ฟเวอร์ local ส่วนใหญ่ที่เข้ากันได้กับ OpenAI ให้ใช้ `openai-completions` provider แบบกำหนดเองที่มี `baseUrl` แต่ไม่มี `api` จะใช้ค่าเริ่มต้นเป็น `openai-completions`; ตั้งเป็น `openai-responses` เฉพาะเมื่อ backend รองรับ `/v1/responses`
    - `models.providers.*.apiKey`: credential ของ provider (แนะนำให้ใช้ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.contextWindow`: context window เดิมเริ่มต้นสำหรับโมเดลภายใต้ provider นี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextWindow`
    - `models.providers.*.contextTokens`: ขีดจำกัด context ของ runtime ที่มีผลจริงเริ่มต้นสำหรับโมเดลภายใต้ provider นี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `contextTokens`
    - `models.providers.*.maxTokens`: ขีดจำกัด output-token เริ่มต้นสำหรับโมเดลภายใต้ provider นี้เมื่อรายการโมเดลไม่ได้ตั้งค่า `maxTokens`
    - `models.providers.*.timeoutSeconds`: timeout ของคำขอ HTTP ต่อโมเดลระดับ provider แบบเลือกได้ เป็นวินาที รวมถึงการเชื่อมต่อ headers, body และการจัดการ abort ของคำขอทั้งหมด
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปในคำขอ (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับขนส่ง credential ใน header `Authorization` เมื่อจำเป็น
    - `models.providers.*.baseUrl`: URL ฐานของ upstream API
    - `models.providers.*.headers`: header คงที่เพิ่มเติมสำหรับการ route proxy/tenant

  </Accordion>
  <Accordion title="Request transport overrides">
    `models.providers.*.request`: การ override การขนส่งสำหรับคำขอ HTTP ของ model-provider

    - `request.headers`: header เพิ่มเติม (merge กับค่าเริ่มต้นของ provider) ค่ายอมรับ SecretRef
    - `request.auth`: override กลยุทธ์ auth โหมด: `"provider-default"` (ใช้ auth ในตัวของ provider), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, `prefix` แบบเลือกได้)
    - `request.proxy`: override HTTP proxy โหมด: `"env-proxy"` (ใช้ตัวแปรสภาพแวดล้อม `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับ sub-object `tls` แบบเลือกได้
    - `request.tls`: override TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดยอมรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve เป็นช่วง private, CGNAT หรือช่วงที่คล้ายกัน ผ่าน guard การ fetch HTTP ของ provider (การ opt-in ของ operator สำหรับ endpoint ที่โฮสต์เองและเชื่อถือได้ซึ่งเข้ากันได้กับ OpenAI) URL stream ของ model-provider แบบ loopback เช่น `localhost`, `127.0.0.1` และ `[::1]` จะได้รับอนุญาตโดยอัตโนมัติ เว้นแต่ค่านี้ถูกตั้งเป็น `false` อย่างชัดเจน; โฮสต์ LAN, tailnet และ private DNS ยังต้อง opt-in WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="Model catalog entries">
    - `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของ provider ที่ระบุชัดเจน
    - `models.providers.*.models.*.input`: modalities อินพุตของโมเดล ใช้ `["text"]` สำหรับโมเดลข้อความเท่านั้น และ `["text", "image"]` สำหรับโมเดลภาพ/vision แบบ native ไฟล์แนบภาพจะถูก inject เข้าไปใน turn ของ agent เฉพาะเมื่อโมเดลที่เลือกถูกทำเครื่องหมายว่ารองรับภาพ
    - `models.providers.*.models.*.contextWindow`: metadata context window เดิมของโมเดล ค่านี้ override `contextWindow` ระดับ provider สำหรับโมเดลนั้น
    - `models.providers.*.models.*.contextTokens`: ขีดจำกัด context ของ runtime แบบเลือกได้ ค่านี้ override `contextTokens` ระดับ provider; ใช้เมื่อคุณต้องการงบ context ที่มีผลจริงเล็กกว่า `contextWindow` เดิมของโมเดล; `openclaw models list` แสดงทั้งสองค่าเมื่อค่าต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: hint ความเข้ากันได้แบบเลือกได้ สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบไม่ native และไม่ว่าง (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ขณะ runtime `baseUrl` ที่ว่าง/ละไว้จะคงพฤติกรรมเริ่มต้นของ OpenAI
    - `models.providers.*.models.*.compat.requiresStringContent`: hint ความเข้ากันได้แบบเลือกได้สำหรับ endpoint chat ที่เข้ากันได้กับ OpenAI แต่รองรับเฉพาะ string เมื่อเป็น `true` OpenClaw จะ flatten array `messages[].content` ที่เป็นข้อความล้วนให้เป็น string ธรรมดาก่อนส่งคำขอ

  </Accordion>
  <Accordion title="Amazon Bedrock discovery">
    - `plugins.entries.amazon-bedrock.config.discovery`: root การตั้งค่า auto-discovery ของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
    - `plugins.entries.amazon-bedrock.config.discovery.region`: region ของ AWS สำหรับ discovery
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: filter provider-id แบบเลือกได้สำหรับ discovery แบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: interval การ polling สำหรับรีเฟรช discovery
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback สำหรับโมเดลที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: max output tokens fallback สำหรับโมเดลที่ค้นพบ

  </Accordion>
</AccordionGroup>

การ onboarding provider แบบกำหนดเองเชิงโต้ตอบจะอนุมานอินพุตภาพสำหรับ ID โมเดล vision ที่พบบ่อย เช่น GPT-4o, Claude, Gemini, Qwen-VL, LLaVA, Pixtral, InternVL, Mllama, MiniCPM-V และ GLM-4V และข้ามคำถามเพิ่มเติมสำหรับตระกูลที่ทราบว่าเป็นข้อความเท่านั้น ID โมเดลที่ไม่รู้จักจะยัง prompt ให้ระบุการรองรับภาพ การ onboarding แบบไม่โต้ตอบใช้การอนุมานเดียวกัน; ส่ง `--custom-image-input` เพื่อบังคับ metadata ที่รองรับภาพ หรือ `--custom-text-input` เพื่อบังคับ metadata แบบข้อความเท่านั้น

### ตัวอย่าง Provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.7 / GPT OSS)">
    Plugin provider `cerebras` ที่ bundle มาด้วยสามารถกำหนดค่านี้ผ่าน `openclaw onboard --auth-choice cerebras-api-key` ใช้ config provider ที่ระบุชัดเจนเฉพาะเมื่อ override ค่าเริ่มต้น

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
          model: { primary: "kimi/kimi-code" },
          models: { "kimi/kimi-code": { alias: "Kimi Code" } },
        },
      },
    }
    ```

    เข้ากันได้กับ Anthropic และเป็นผู้ให้บริการในตัว ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    ดู [โมเดลภายในเครื่อง](/th/gateway/local-models) สรุปสั้นๆ: เรียกใช้โมเดลภายในเครื่องขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ประสิทธิภาพสูง; รวมโมเดลที่โฮสต์ไว้เพื่อใช้เป็นทางสำรอง
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

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` แค็ตตาล็อกโมเดลมีค่าเริ่มต้นเป็น M2.7 เท่านั้น บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic นั้น OpenClaw จะปิดการคิดของ MiniMax เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `thinking` เองอย่างชัดเจน `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    ปลายทาง Moonshot แบบเนทีฟประกาศความเข้ากันได้กับการใช้งานสตรีมมิงบนทรานสปอร์ต `openai-completions` ที่ใช้ร่วมกัน และ OpenClaw อ้างอิงสิ่งนั้นจากความสามารถของปลายทางแทนที่จะดูเฉพาะ id ผู้ให้บริการในตัว

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

    Base URL ควรละ `/v1` (ไคลเอนต์ Anthropic จะเติมให้) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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
    - ปลายทางสำหรับการเขียนโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับปลายทางทั่วไป ให้กำหนดผู้ให้บริการแบบกำหนดเองพร้อมการแทนที่ Base URL

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนอื่นๆ
- [เครื่องมือและ plugins](/th/tools)
