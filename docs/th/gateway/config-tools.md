---
read_when:
    - การกำหนดค่านโยบาย, allowlists หรือฟีเจอร์ทดลองของ `tools.*`
    - การลงทะเบียน custom providers หรือการ override base URLs
    - การตั้งค่า endpoints แบบโฮสต์เองที่เข้ากันได้กับ OpenAI
sidebarTitle: Tools and custom providers
summary: การกำหนดค่า tools (นโยบาย, experimental toggles, tools ที่มีผู้ให้บริการรองรับ) และการตั้งค่า custom provider/base-URL
title: การกำหนดค่า — tools และ custom providers
x-i18n:
    generated_at: "2026-04-26T11:29:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: ef030940b155224e614675a85c7a81567fd3a493e5ec1c25c5956d49cbc11b86
    source_path: gateway/config-tools.md
    workflow: 15
---

คีย์คอนฟิก `tools.*` และการตั้งค่า custom provider / base-URL สำหรับคีย์คอนฟิกระดับบนสุดอื่นๆ เช่น agents, channels และคีย์อื่นๆ ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## Tools

### โปรไฟล์ของ tool

`tools.profile` ใช้กำหนด allowlist พื้นฐานก่อน `tools.allow`/`tools.deny`:

<Note>
local onboarding จะตั้งค่าเริ่มต้นของคอนฟิก local ใหม่เป็น `tools.profile: "coding"` เมื่อยังไม่ได้ตั้งค่าไว้ (โปรไฟล์แบบ explicit ที่มีอยู่เดิมจะยังคงไว้)
</Note>

| โปรไฟล์     | รวม                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` เท่านั้น                                                                                                       |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                       |
| `full`      | ไม่มีข้อจำกัด (เหมือนกับไม่ตั้งค่า)                                                                                              |

### กลุ่มของ tool

| กลุ่ม              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ยอมรับเป็น alias ของ `exec`)                                                 |
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
| `group:openclaw`   | built-in tools ทั้งหมด (ไม่รวม provider plugins)                                                                        |

### `tools.allow` / `tools.deny`

นโยบาย allow/deny ของ tool แบบ global (`deny` มีผลเหนือกว่า) ไม่สนตัวพิมพ์เล็กใหญ่ และรองรับ wildcard `*` มีผลแม้จะปิด Docker sandbox อยู่ก็ตาม

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

จำกัด tools เพิ่มเติมสำหรับผู้ให้บริการหรือ models บางรายการ ลำดับคือ: โปรไฟล์พื้นฐาน → โปรไฟล์ของผู้ให้บริการ → allow/deny

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

ควบคุมการเข้าถึง `exec` แบบ elevated นอก sandbox:

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

- override ต่อเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัดเพิ่มได้เท่านั้น
- `/elevated on|off|ask|full` จะบันทึกสถานะแยกตามเซสชัน; inline directives มีผลกับข้อความเดียว
- `exec` แบบ elevated จะข้าม sandboxing และใช้ escape path ที่กำหนดค่าไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมายของ exec คือ `node`)

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

การตรวจความปลอดภัยสำหรับ tool loop จะ **ปิดใช้งานเป็นค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้งานการตรวจจับ สามารถกำหนดการตั้งค่าแบบ global ใน `tools.loopDetection` และ override ต่อเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

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
  จำนวนประวัติการเรียก tool สูงสุดที่เก็บไว้สำหรับการวิเคราะห์ loop
</ParamField>
<ParamField path="warningThreshold" type="number">
  ค่า threshold ของรูปแบบซ้ำแบบไม่มีความคืบหน้าที่ใช้สำหรับการเตือน
</ParamField>
<ParamField path="criticalThreshold" type="number">
  ค่า threshold ที่สูงกว่าสำหรับการบล็อก critical loops ที่เกิดซ้ำ
</ParamField>
<ParamField path="globalCircuitBreakerThreshold" type="number">
  ค่า threshold สำหรับหยุดแบบ hard stop เมื่อการรันใดๆ ไม่มีความคืบหน้า
</ParamField>
<ParamField path="detectors.genericRepeat" type="boolean">
  เตือนเมื่อมีการเรียก tool เดิม/args เดิมซ้ำ
</ParamField>
<ParamField path="detectors.knownPollNoProgress" type="boolean">
  เตือน/บล็อกเมื่อเป็น poll tools ที่รู้จัก (`process.poll`, `command_status` ฯลฯ)
</ParamField>
<ParamField path="detectors.pingPong" type="boolean">
  เตือน/บล็อกเมื่อเกิดรูปแบบคู่สลับไปมาที่ไม่มีความคืบหน้า
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
        apiKey: "brave_api_key", // หรือ BRAVE_API_KEY env
        maxResults: 5,
        timeoutSeconds: 30,
        cacheTtlMinutes: 15,
      },
      fetch: {
        enabled: true,
        provider: "firecrawl", // ไม่บังคับ; ไม่ระบุเพื่อใช้ auto-detect
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

กำหนดค่าความสามารถทำความเข้าใจสื่อขาเข้า (ภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: ส่งงานเพลง/วิดีโอ async ที่เสร็จแล้วไปยัง channel โดยตรง
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
  <Accordion title="ฟิลด์ของรายการ media model">
    **รายการผู้ให้บริการ** (`type: "provider"` หรือไม่ระบุ):

    - `provider`: id ของผู้ให้บริการ API (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
    - `model`: override ของ model id
    - `profile` / `preferredProfile`: การเลือก profile ใน `auth-profiles.json`

    **รายการ CLI** (`type: "cli"`):

    - `command`: ไฟล์ปฏิบัติการที่จะรัน
    - `args`: args แบบ templated (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น)

    **ฟิลด์ทั่วไป:**

    - `capabilities`: รายการแบบเลือกได้ (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio
    - `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: overrides ต่อรายการ
    - หากล้มเหลวจะ fallback ไปยังรายการถัดไป

    auth ของผู้ให้บริการเป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → env vars → `models.providers.*.apiKey`

    **ฟิลด์ async completion:**

    - `asyncCompletion.directSend`: เมื่อเป็น `true`, งาน `music_generate` และ `video_generate` แบบ async ที่เสร็จสมบูรณ์จะพยายามส่งไปยัง channel โดยตรงก่อน ค่าเริ่มต้น: `false` (เส้นทางเดิมแบบปลุก requester-session/ส่งผ่าน model)

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

ควบคุมว่า session ใดบ้างที่สามารถถูกกำหนดเป้าหมายได้ด้วย session tools (`sessions_list`, `sessions_history`, `sessions_send`)

ค่าเริ่มต้น: `tree` (เซสชันปัจจุบัน + เซสชันที่ถูก spawn โดยมัน เช่น subagents)

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
    - `self`: เฉพาะ session key ปัจจุบันเท่านั้น
    - `tree`: เซสชันปัจจุบัน + เซสชันที่ถูก spawn โดยเซสชันปัจจุบัน (subagents)
    - `agent`: ทุกเซสชันที่อยู่ภายใต้ agent id ปัจจุบัน (อาจรวมผู้ใช้อื่นหากคุณรันเซสชันแยกตามผู้ส่งภายใต้ agent id เดียวกัน)
    - `all`: ทุกเซสชัน การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
    - การบีบขอบเขตจาก sandbox: เมื่อเซสชันปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"`, ระบบจะบังคับ visibility เป็น `tree` แม้ `tools.sessions.visibility="all"` ก็ตาม
  </Accordion>
</AccordionGroup>

### `tools.sessions_spawn`

ควบคุมการรองรับ inline attachments สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: ตั้งเป็น true เพื่ออนุญาต inline file attachments
        maxTotalBytes: 5242880, // รวมทุกไฟล์ได้สูงสุด 5 MB
        maxFiles: 50,
        maxFileBytes: 1048576, // สูงสุด 1 MB ต่อไฟล์
        retainOnSessionKeep: false, // เก็บ attachments ไว้เมื่อ cleanup="keep"
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="หมายเหตุเกี่ยวกับ attachments">
    - attachments รองรับเฉพาะ `runtime: "subagent"` เท่านั้น ส่วน ACP runtime จะปฏิเสธ
    - ไฟล์จะถูกสร้างเป็นรูปธรรมใน child workspace ที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
    - เนื้อหาของ attachment จะถูก redacted ออกจากการบันทึก transcript โดยอัตโนมัติ
    - อินพุตแบบ Base64 จะถูกตรวจสอบด้วยการตรวจตัวอักษร/padding อย่างเข้มงวดและมีตัวป้องกันขนาดก่อน decode
    - สิทธิ์ไฟล์คือ `0700` สำหรับไดเรกทอรี และ `0600` สำหรับไฟล์
    - การ cleanup เป็นไปตามนโยบาย `cleanup`: `delete` จะลบ attachments เสมอ; `keep` จะเก็บไว้ก็ต่อเมื่อ `retainOnSessionKeep: true`
  </Accordion>
</AccordionGroup>

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟลกของ built-in tools แบบทดลอง ค่าเริ่มต้นคือปิด เว้นแต่จะมีการใช้กฎ auto-enable สำหรับ strict-agentic GPT-5

```json5
{
  tools: {
    experimental: {
      planTool: true, // เปิดใช้ update_plan แบบทดลอง
    },
  },
}
```

- `planTool`: เปิดใช้ tool แบบมีโครงสร้าง `update_plan` สำหรับการติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือ override ต่อเอเจนต์) ถูกตั้งเป็น `"strict-agentic"` สำหรับการรัน GPT-5 family ของ OpenAI หรือ OpenAI Codex ตั้ง `true` เพื่อบังคับเปิดใช้งานนอกขอบเขตนั้น หรือ `false` เพื่อคงปิดไว้แม้สำหรับการรัน strict-agentic GPT-5
- เมื่อเปิดใช้งาน system prompt จะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้มันเฉพาะกับงานที่มีสาระสำคัญ และให้มีขั้นตอน `in_progress` ได้มากสุดเพียงหนึ่งขั้นตอน

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

- `model`: model ค่าเริ่มต้นสำหรับ sub-agents ที่ถูก spawn หากไม่กำหนด sub-agents จะสืบทอด model ของผู้เรียก
- `allowAgents`: allowlist ค่าเริ่มต้นของ target agent ids สำหรับ `sessions_spawn` เมื่อเอเจนต์ผู้ร้องขอไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = อะไรก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น)
- `runTimeoutSeconds`: timeout ค่าเริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียก tool ไม่ได้ระบุ `runTimeoutSeconds` ค่า `0` หมายถึงไม่มี timeout
- นโยบาย tool ต่อ subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## custom providers และ base URLs

OpenClaw ใช้ model catalog แบบ built-in เพิ่ม custom providers ผ่าน `models.providers` ในคอนฟิก หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

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
  <Accordion title="ลำดับความสำคัญของ auth และ merge">
    - ใช้ `authHeader: true` + `headers` สำหรับความต้องการ auth แบบกำหนดเอง
    - override รากคอนฟิกของเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็น environment variable alias แบบเดิม)
    - ลำดับความสำคัญของ merge สำหรับ provider IDs ที่ตรงกัน:
      - ค่า `baseUrl` ที่ไม่ว่างใน `models.json` ของเอเจนต์จะมีผลเหนือกว่า
      - ค่า `apiKey` ที่ไม่ว่างของเอเจนต์จะมีผลเหนือกว่าเฉพาะเมื่อผู้ให้บริการนั้นไม่ได้ถูกจัดการแบบ SecretRef ในบริบท config/auth-profile ปัจจุบัน
      - ค่า `apiKey` ของผู้ให้บริการที่ถูกจัดการแบบ SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการเก็บ secrets ที่ resolve แล้ว
      - ค่า header ของผู้ให้บริการที่ถูกจัดการแบบ SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
      - `apiKey`/`baseUrl` ของเอเจนต์ที่ว่างหรือไม่มีอยู่จะ fallback ไปที่ `models.providers` ในคอนฟิก
      - ค่า `contextWindow`/`maxTokens` ของ model ที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่างคอนฟิกแบบ explicit และค่า catalog แบบ implicit
      - ค่า `contextTokens` ของ model ที่ตรงกันจะคง runtime cap แบบ explicit ไว้เมื่อมีอยู่; ใช้สิ่งนี้เพื่อจำกัด effective context โดยไม่ต้องเปลี่ยน metadata ดั้งเดิมของ model
      - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้คอนฟิกเขียน `models.json` ทับทั้งหมด
      - การคงค่า marker ยึดตามแหล่งที่มาเป็นหลัก: markers จะถูกเขียนจาก snapshot คอนฟิกของแหล่งที่มาที่ใช้งานอยู่ (ก่อนการ resolve) ไม่ใช่จากค่า runtime secret ที่ resolve แล้ว
  </Accordion>
</AccordionGroup>

### รายละเอียดฟิลด์ของ provider

<AccordionGroup>
  <Accordion title="catalog ระดับบนสุด">
    - `models.mode`: พฤติกรรมของ provider catalog (`merge` หรือ `replace`)
    - `models.providers`: แมป custom provider ที่มีคีย์เป็น provider id
      - การแก้ไขอย่างปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบ additive `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณจะส่ง `--replace`
  </Accordion>
  <Accordion title="การเชื่อมต่อและ auth ของ provider">
    - `models.providers.*.api`: request adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` เป็นต้น)
    - `models.providers.*.apiKey`: credential ของ provider (ควรใช้ SecretRef/env substitution)
    - `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
    - `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้ inject `options.num_ctx` เข้าไปใน request (ค่าเริ่มต้น: `true`)
    - `models.providers.*.authHeader`: บังคับส่ง credential ใน `Authorization` header เมื่อจำเป็น
    - `models.providers.*.baseUrl`: base URL ของ upstream API
    - `models.providers.*.headers`: static headers เพิ่มเติมสำหรับการกำหนดเส้นทาง proxy/tenant
  </Accordion>
  <Accordion title="overrides ของ request transport">
    `models.providers.*.request`: overrides ของ transport สำหรับ HTTP requests ของ model-provider

    - `request.headers`: headers เพิ่มเติม (merge กับค่าเริ่มต้นของ provider) รองรับค่าแบบ SecretRef
    - `request.auth`: override ของกลยุทธ์ auth โหมดที่รองรับ: `"provider-default"` (ใช้ auth แบบ built-in ของ provider), `"authorization-bearer"` (พร้อม `token`), `"header"` (พร้อม `headerName`, `value`, และ `prefix` แบบเลือกได้)
    - `request.proxy`: override ของ HTTP proxy โหมดที่รองรับ: `"env-proxy"` (ใช้ env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (พร้อม `url`) ทั้งสองโหมดยอมรับ sub-object `tls` แบบเลือกได้
    - `request.tls`: override ของ TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
    - `request.allowPrivateNetwork`: เมื่อเป็น `true` อนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve ไปยัง private, CGNAT หรือช่วงลักษณะใกล้เคียง ผ่านตัวป้องกัน HTTP fetch ของ provider (operator ต้อง opt in สำหรับ trusted self-hosted endpoints ที่เข้ากันได้กับ OpenAI) ส่วน WebSocket จะใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`

  </Accordion>
  <Accordion title="รายการ model catalog">
    - `models.providers.*.models`: รายการ explicit ของ provider model catalog
    - `models.providers.*.models.*.contextWindow`: metadata ของ native model context window
    - `models.providers.*.models.*.contextTokens`: runtime context cap แบบเลือกได้ ใช้เมื่อต้องการ effective context budget ที่เล็กกว่า `contextWindow` ดั้งเดิมของ model; `openclaw models list` จะแสดงทั้งสองค่าเมื่อแตกต่างกัน
    - `models.providers.*.models.*.compat.supportsDeveloperRole`: compatibility hint แบบเลือกได้ สำหรับ `api: "openai-completions"` ร่วมกับ `baseUrl` ที่ไม่ใช่ native และไม่ว่าง (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับให้ค่านี้เป็น `false` ระหว่าง runtime ส่วน `baseUrl` ที่ว่าง/ไม่ระบุจะคงพฤติกรรม OpenAI ปกติไว้
    - `models.providers.*.models.*.compat.requiresStringContent`: compatibility hint แบบเลือกได้สำหรับ chat endpoints ที่เข้ากันได้กับ OpenAI และรองรับเฉพาะสตริง เมื่อเป็น `true` OpenClaw จะ flatten อาร์เรย์ `messages[].content` ที่เป็นข้อความล้วนให้เป็นสตริงธรรมดาก่อนส่ง request
  </Accordion>
  <Accordion title="การค้นพบ Amazon Bedrock">
    - `plugins.entries.amazon-bedrock.config.discovery`: รากการตั้งค่า auto-discovery ของ Bedrock
    - `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
    - `plugins.entries.amazon-bedrock.config.discovery.region`: AWS region สำหรับ discovery
    - `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบเลือกได้สำหรับการค้นพบแบบเจาะจง
    - `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลาการ polling เพื่อรีเฟรช discovery
    - `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: context window fallback สำหรับ models ที่ค้นพบ
    - `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: max output tokens fallback สำหรับ models ที่ค้นพบ
  </Accordion>
</AccordionGroup>

### ตัวอย่าง provider

<AccordionGroup>
  <Accordion title="Cerebras (GLM 4.6 / 4.7)">
    ```json5
    {
      env: { CEREBRAS_API_KEY: "sk-..." },
      agents: {
        defaults: {
          model: {
            primary: "cerebras/zai-glm-4.7",
            fallbacks: ["cerebras/zai-glm-4.6"],
          },
          models: {
            "cerebras/zai-glm-4.7": { alias: "GLM 4.7 (Cerebras)" },
            "cerebras/zai-glm-4.6": { alias: "GLM 4.6 (Cerebras)" },
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
              { id: "zai-glm-4.6", name: "GLM 4.6 (Cerebras)" },
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

    ผู้ให้บริการแบบเข้ากันได้กับ Anthropic ที่มีมาในระบบ ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

  </Accordion>
  <Accordion title="Local models (LM Studio)">
    ดู [Local Models](/th/gateway/local-models) สรุปสั้นๆ: รัน local model ขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์จริงจัง; และคง hosted models ที่ merge แล้วไว้เพื่อใช้เป็น fallback
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

    ตั้งค่า `MINIMAX_API_KEY` ทางลัด: `openclaw onboard --auth-choice minimax-global-api` หรือ `openclaw onboard --auth-choice minimax-cn-api` โดยค่าเริ่มต้น model catalog จะมีเฉพาะ M2.7 เท่านั้น บนเส้นทางการสตรีมแบบเข้ากันได้กับ Anthropic OpenClaw จะปิด MiniMax thinking เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้ง `thinking` เองอย่างชัดเจน `/fast on` หรือ `params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น `MiniMax-M2.7-highspeed`

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

    สำหรับ endpoint ในจีน: `baseUrl: "https://api.moonshot.cn/v1"` หรือ `openclaw onboard --auth-choice moonshot-api-key-cn`

    endpoints ของ Moonshot แบบเนทีฟประกาศความเข้ากันได้ของการใช้งานแบบสตรีมมิงบน transport `openai-completions` แบบใช้ร่วมกัน และ OpenClaw อิงสิ่งนั้นจากความสามารถของ endpoint แทนที่จะอิงจาก built-in provider id เพียงอย่างเดียว

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

    ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs แบบ `opencode/...` สำหรับ Zen catalog หรือ refs แบบ `opencode-go/...` สำหรับ Go catalog ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

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

    base URL ควรไม่รวม `/v1` (ไคลเอนต์ของ Anthropic จะต่อท้ายให้อัตโนมัติ) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

    ตั้งค่า `ZAI_API_KEY` โดย `z.ai/*` และ `z-ai/*` เป็น aliases ที่ยอมรับได้ ทางลัด: `openclaw onboard --auth-choice zai-api-key`

    - endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
    - endpoint สำหรับงานโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
    - สำหรับ endpoint ทั่วไป ให้กำหนด custom provider พร้อม override base URL

  </Accordion>
</AccordionGroup>

---

## ที่เกี่ยวข้อง

- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนสุดอื่นๆ
- [Tools และ plugins](/th/tools)
