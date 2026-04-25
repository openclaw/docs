---
read_when:
    - การกำหนดค่านโยบาย allowlists หรือฟีเจอร์ทดลองของ `tools.*`
    - การลงทะเบียน custom providers หรือการ override base URLs
    - การตั้งค่า endpoints แบบ self-hosted ที่เข้ากันได้กับ OpenAI
summary: การกำหนดค่า Tools (นโยบาย, การสลับฟีเจอร์ทดลอง, tools ที่รองรับโดยผู้ให้บริการ) และการตั้งค่า custom provider/base-URL
title: การกำหนดค่า — tools และ custom providers
x-i18n:
    generated_at: "2026-04-25T13:46:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: d63b080550a6c95d714d3bb42c2b079368040aa09378d88c2e498ccd5ec113c1
    source_path: gateway/config-tools.md
    workflow: 15
---

คีย์คอนฟิก `tools.*` และการตั้งค่า custom provider / base-URL สำหรับเอเจนต์
channels และคีย์คอนฟิกระดับบนอื่นๆ ดู
[ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## Tools

### โปรไฟล์ Tool

`tools.profile` ใช้ตั้ง base allowlist ก่อน `tools.allow`/`tools.deny`

Onboarding ภายในเครื่องจะตั้งค่าเริ่มต้นของคอนฟิกภายในเครื่องใหม่เป็น `tools.profile: "coding"` เมื่อยังไม่ได้ตั้งค่า (โปรไฟล์ที่ตั้งไว้อย่างชัดเจนอยู่แล้วจะถูกรักษาไว้)

| โปรไฟล์     | รวม                                                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `minimal`   | `session_status` เท่านั้น                                                                                                      |
| `coding`    | `group:fs`, `group:runtime`, `group:web`, `group:sessions`, `group:memory`, `cron`, `image`, `image_generate`, `video_generate` |
| `messaging` | `group:messaging`, `sessions_list`, `sessions_history`, `sessions_send`, `session_status`                                      |
| `full`      | ไม่จำกัด (เหมือนกับไม่ตั้งค่า)                                                                                                 |

### กลุ่ม Tool

| กลุ่ม              | Tools                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| `group:runtime`    | `exec`, `process`, `code_execution` (`bash` ใช้เป็น alias ของ `exec` ได้)                                               |
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
| `group:openclaw`   | Tools ที่มีมาในระบบทั้งหมด (ไม่รวม provider plugins)                                                                   |

### `tools.allow` / `tools.deny`

นโยบาย allow/deny ของ tool แบบ global (deny มีผลเหนือกว่า) ไม่แยกตัวพิมพ์เล็กใหญ่ และรองรับ wildcard `*` โดยจะถูกใช้แม้ปิด Docker sandbox อยู่ก็ตาม

```json5
{
  tools: { deny: ["browser", "canvas"] },
}
```

### `tools.byProvider`

จำกัด tools เพิ่มเติมสำหรับผู้ให้บริการหรือโมเดลเฉพาะ ลำดับคือ: base profile → provider profile → allow/deny

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

- การ override ต่อเอเจนต์ (`agents.list[].tools.elevated`) สามารถจำกัดเพิ่มเติมได้เท่านั้น
- `/elevated on|off|ask|full` จะเก็บสถานะไว้ต่อ session; inline directives จะมีผลกับข้อความเดียว
- `exec` แบบ elevated จะข้าม sandboxing และใช้ escape path ที่กำหนดไว้ (`gateway` เป็นค่าเริ่มต้น หรือ `node` เมื่อเป้าหมายของ exec คือ `node`)

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

การตรวจสอบความปลอดภัยของ tool-loop จะ **ปิดใช้งานโดยค่าเริ่มต้น** ตั้งค่า `enabled: true` เพื่อเปิดใช้การตรวจจับ
สามารถกำหนดการตั้งค่าแบบ global ใน `tools.loopDetection` และ override ต่อเอเจนต์ได้ที่ `agents.list[].tools.loopDetection`

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

- `historySize`: จำนวนประวัติการเรียกใช้ tool สูงสุดที่เก็บไว้เพื่อวิเคราะห์ loop
- `warningThreshold`: เกณฑ์ของรูปแบบซ้ำแบบไม่มีความคืบหน้าที่ใช้สำหรับคำเตือน
- `criticalThreshold`: เกณฑ์ซ้ำที่สูงขึ้นสำหรับบล็อก loop ระดับวิกฤต
- `globalCircuitBreakerThreshold`: เกณฑ์หยุดแบบ hard stop สำหรับการทำงานแบบไม่มีความคืบหน้าใดๆ
- `detectors.genericRepeat`: เตือนเมื่อมีการเรียก tool เดิม/args เดิมซ้ำ
- `detectors.knownPollNoProgress`: เตือน/บล็อกสำหรับ poll tools ที่รู้จัก (`process.poll`, `command_status` เป็นต้น)
- `detectors.pingPong`: เตือน/บล็อกสำหรับรูปแบบคู่สลับไปมาที่ไม่มีความคืบหน้า
- หาก `warningThreshold >= criticalThreshold` หรือ `criticalThreshold >= globalCircuitBreakerThreshold` การตรวจสอบความถูกต้องจะล้มเหลว

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
        provider: "firecrawl", // ทางเลือก; ไม่ระบุเพื่อใช้ auto-detect
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

กำหนดค่าความเข้าใจสื่อขาเข้า (ภาพ/เสียง/วิดีโอ):

```json5
{
  tools: {
    media: {
      concurrency: 2,
      asyncCompletion: {
        directSend: false, // opt-in: ส่ง music/video แบบ async ที่เสร็จแล้วไปยังช่องทางโดยตรง
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

<Accordion title="ฟิลด์ของ media model entry">

**รายการ Provider** (`type: "provider"` หรือไม่ระบุ):

- `provider`: id ของ API provider (`openai`, `anthropic`, `google`/`gemini`, `groq` เป็นต้น)
- `model`: override ของ model id
- `profile` / `preferredProfile`: การเลือกโปรไฟล์จาก `auth-profiles.json`

**รายการ CLI** (`type: "cli"`):

- `command`: executable ที่จะรัน
- `args`: args แบบมีเทมเพลต (รองรับ `{{MediaPath}}`, `{{Prompt}}`, `{{MaxChars}}` เป็นต้น)

**ฟิลด์ทั่วไป:**

- `capabilities`: รายการแบบทางเลือก (`image`, `audio`, `video`) ค่าเริ่มต้น: `openai`/`anthropic`/`minimax` → image, `google` → image+audio+video, `groq` → audio
- `prompt`, `maxChars`, `maxBytes`, `timeoutSeconds`, `language`: override รายรายการ
- หากล้มเหลวจะ fallback ไปยังรายการถัดไป

การยืนยันตัวตนของ provider เป็นไปตามลำดับมาตรฐาน: `auth-profiles.json` → env vars → `models.providers.*.apiKey`

**ฟิลด์ async completion:**

- `asyncCompletion.directSend`: เมื่อเป็น `true` งาน `music_generate`
  และ `video_generate` แบบ async ที่เสร็จสมบูรณ์จะพยายามส่งตรงไปยังช่องทางก่อน ค่าเริ่มต้น: `false`
  (ใช้เส้นทาง requester-session wake/model-delivery แบบ legacy)

</Accordion>

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

ควบคุมว่า sessions ใดสามารถถูกกำหนดเป้าหมายได้โดย session tools (`sessions_list`, `sessions_history`, `sessions_send`)

ค่าเริ่มต้น: `tree` (session ปัจจุบัน + sessions ที่ถูก spawn โดยมัน เช่น subagents)

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

หมายเหตุ:

- `self`: เฉพาะ session key ปัจจุบัน
- `tree`: session ปัจจุบัน + sessions ที่ถูก spawn โดย session ปัจจุบัน (subagents)
- `agent`: session ใดๆ ที่เป็นของ agent id ปัจจุบัน (อาจรวมผู้ใช้อื่นหากคุณรัน sessions แยกตามผู้ส่งภายใต้ agent id เดียวกัน)
- `all`: ทุก session การกำหนดเป้าหมายข้ามเอเจนต์ยังคงต้องใช้ `tools.agentToAgent`
- Sandbox clamp: เมื่อ session ปัจจุบันอยู่ใน sandbox และ `agents.defaults.sandbox.sessionToolsVisibility="spawned"` ระบบจะบังคับ visibility เป็น `tree` แม้ว่า `tools.sessions.visibility="all"` ก็ตาม

### `tools.sessions_spawn`

ควบคุมการรองรับไฟล์แนบแบบ inline สำหรับ `sessions_spawn`

```json5
{
  tools: {
    sessions_spawn: {
      attachments: {
        enabled: false, // opt-in: ตั้งเป็น true เพื่ออนุญาตไฟล์แนบแบบ inline
        maxTotalBytes: 5242880, // รวมทั้งหมด 5 MB สำหรับทุกไฟล์
        maxFiles: 50,
        maxFileBytes: 1048576, // 1 MB ต่อไฟล์
        retainOnSessionKeep: false, // เก็บไฟล์แนบไว้เมื่อ cleanup="keep"
      },
    },
  },
}
```

หมายเหตุ:

- ไฟล์แนบรองรับเฉพาะ `runtime: "subagent"` เท่านั้น ACP runtime จะปฏิเสธไฟล์แนบ
- ไฟล์จะถูกทำให้เป็นจริงใน child workspace ที่ `.openclaw/attachments/<uuid>/` พร้อม `.manifest.json`
- เนื้อหาของไฟล์แนบจะถูกปิดทับอัตโนมัติจาก transcript persistence
- อินพุต Base64 จะถูกตรวจสอบด้วยการตรวจสอบ alphabet/padding แบบเข้มงวดและมีการป้องกันขนาดก่อน decode
- สิทธิ์ของไฟล์เป็น `0700` สำหรับไดเรกทอรีและ `0600` สำหรับไฟล์
- การ cleanup เป็นไปตามนโยบาย `cleanup`: `delete` จะลบไฟล์แนบเสมอ; `keep` จะเก็บไว้เฉพาะเมื่อ `retainOnSessionKeep: true`

<a id="toolsexperimental"></a>

### `tools.experimental`

แฟล็กของ built-in tools แบบทดลอง ปิดโดยค่าเริ่มต้น เว้นแต่จะมี strict-agentic GPT-5 auto-enable rule เข้ามาใช้

```json5
{
  tools: {
    experimental: {
      planTool: true, // เปิดใช้ update_plan แบบทดลอง
    },
  },
}
```

หมายเหตุ:

- `planTool`: เปิดใช้ tool `update_plan` แบบมีโครงสร้างสำหรับติดตามงานหลายขั้นตอนที่ไม่ใช่งานเล็กน้อย
- ค่าเริ่มต้น: `false` เว้นแต่ `agents.defaults.embeddedPi.executionContract` (หรือ override ต่อเอเจนต์) จะถูกตั้งเป็น `"strict-agentic"` สำหรับการรันตระกูล GPT-5 ของ OpenAI หรือ OpenAI Codex ตั้งเป็น `true` เพื่อบังคับเปิดใช้งานนอกขอบเขตนั้น หรือตั้งเป็น `false` เพื่อคงปิดไว้แม้สำหรับการรัน strict-agentic GPT-5
- เมื่อเปิดใช้งาน system prompt จะเพิ่มคำแนะนำการใช้งานด้วย เพื่อให้โมเดลใช้เฉพาะกับงานที่มีสาระสำคัญ และคงสถานะ `in_progress` ไว้ได้มากที่สุดเพียงหนึ่งขั้นตอน

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

- `model`: โมเดลเริ่มต้นสำหรับ sub-agents ที่ถูก spawn หากไม่ระบุ sub-agents จะสืบทอดโมเดลของผู้เรียก
- `allowAgents`: allowlist เริ่มต้นของ target agent ids สำหรับ `sessions_spawn` เมื่อ requester agent ไม่ได้ตั้งค่า `subagents.allowAgents` ของตัวเอง (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น)
- `runTimeoutSeconds`: timeout เริ่มต้น (วินาที) สำหรับ `sessions_spawn` เมื่อการเรียก tool ไม่ได้ระบุ `runTimeoutSeconds` ค่า `0` หมายถึงไม่มี timeout
- นโยบาย tool ต่อ subagent: `tools.subagents.tools.allow` / `tools.subagents.tools.deny`

---

## Custom providers และ base URLs

OpenClaw ใช้แค็ตตาล็อกโมเดลที่มีมาในระบบ เพิ่ม custom providers ได้ผ่าน `models.providers` ในคอนฟิก หรือ `~/.openclaw/agents/<agentId>/agent/models.json`

```json5
{
  models: {
    mode: "merge", // merge (ค่าเริ่มต้น) | replace
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

- ใช้ `authHeader: true` ร่วมกับ `headers` สำหรับความต้องการด้าน auth แบบกำหนดเอง
- Override root ของคอนฟิกเอเจนต์ด้วย `OPENCLAW_AGENT_DIR` (หรือ `PI_CODING_AGENT_DIR` ซึ่งเป็นชื่อแฝงของตัวแปรสภาพแวดล้อมแบบ legacy)
- ลำดับความสำคัญของการ merge สำหรับ provider IDs ที่ตรงกัน:
  - ค่า `baseUrl` ใน `models.json` ของเอเจนต์ที่ไม่ว่างมีผลเหนือกว่า
  - ค่า `apiKey` ของเอเจนต์ที่ไม่ว่างมีผลเหนือกว่าเฉพาะเมื่อ provider นั้นไม่ได้ถูกจัดการด้วย SecretRef ในบริบทคอนฟิก/auth-profile ปัจจุบัน
  - ค่า `apiKey` ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs) แทนการเก็บ secrets ที่ resolve แล้ว
  - ค่า header ของ provider ที่จัดการด้วย SecretRef จะถูกรีเฟรชจาก source markers (`secretref-env:ENV_VAR_NAME` สำหรับ env refs, `secretref-managed` สำหรับ file/exec refs)
  - หาก `apiKey`/`baseUrl` ของเอเจนต์ว่างหรือไม่มีอยู่ จะ fallback ไปยัง `models.providers` ในคอนฟิก
  - ค่า `contextWindow`/`maxTokens` ของโมเดลที่ตรงกันจะใช้ค่าที่สูงกว่าระหว่างคอนฟิกที่ระบุชัดเจนกับค่าจากแค็ตตาล็อกโดยนัย
  - ค่า `contextTokens` ของโมเดลที่ตรงกันจะคง runtime cap ที่ระบุไว้อย่างชัดเจนเมื่อมีอยู่; ใช้สิ่งนี้เพื่อจำกัด effective context โดยไม่เปลี่ยนข้อมูลเมตาเนทีฟของโมเดล
  - ใช้ `models.mode: "replace"` เมื่อคุณต้องการให้คอนฟิกเขียนทับ `models.json` ทั้งหมด
  - การเก็บ marker ยึดตาม source เป็นหลัก: markers จะถูกเขียนจาก snapshot ของ source config ที่ใช้งานอยู่ (ก่อน resolution) ไม่ใช่จากค่า secret ระหว่างรันไทม์ที่ resolve แล้ว

### รายละเอียดฟิลด์ของ provider

- `models.mode`: พฤติกรรมของ provider catalog (`merge` หรือ `replace`)
- `models.providers`: แมปของ custom provider โดยใช้ provider id เป็นคีย์
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set models.providers.<id> '<json>' --strict-json --merge` หรือ `openclaw config set models.providers.<id>.models '<json-array>' --strict-json --merge` สำหรับการอัปเดตแบบเพิ่มข้อมูล `config set` จะปฏิเสธการแทนที่แบบทำลายข้อมูล เว้นแต่คุณจะส่ง `--replace`
- `models.providers.*.api`: request adapter (`openai-completions`, `openai-responses`, `anthropic-messages`, `google-generative-ai` เป็นต้น)
- `models.providers.*.apiKey`: ข้อมูลรับรองของ provider (ควรใช้ SecretRef/env substitution)
- `models.providers.*.auth`: กลยุทธ์ auth (`api-key`, `token`, `oauth`, `aws-sdk`)
- `models.providers.*.injectNumCtxForOpenAICompat`: สำหรับ Ollama + `openai-completions` ให้แทรก `options.num_ctx` ลงในคำขอ (ค่าเริ่มต้น: `true`)
- `models.providers.*.authHeader`: บังคับให้ส่งข้อมูลรับรองผ่าน header `Authorization` เมื่อจำเป็น
- `models.providers.*.baseUrl`: base URL ของ API ต้นทาง
- `models.providers.*.headers`: headers แบบคงที่เพิ่มเติมสำหรับ proxy/tenant routing
- `models.providers.*.request`: overrides ระดับ transport สำหรับคำขอ HTTP ของ model-provider
  - `request.headers`: headers เพิ่มเติม (merge กับค่าเริ่มต้นของ provider) ค่ารองรับ SecretRef
  - `request.auth`: override กลยุทธ์ auth โหมด: `"provider-default"` (ใช้ auth ที่มีมาใน provider), `"authorization-bearer"` (ใช้ร่วมกับ `token`), `"header"` (ใช้ร่วมกับ `headerName`, `value`, และ `prefix` แบบทางเลือก)
  - `request.proxy`: override HTTP proxy โหมด: `"env-proxy"` (ใช้ env vars `HTTP_PROXY`/`HTTPS_PROXY`), `"explicit-proxy"` (ใช้ร่วมกับ `url`) ทั้งสองโหมดรองรับ sub-object `tls` แบบทางเลือก
  - `request.tls`: override TLS สำหรับการเชื่อมต่อโดยตรง ฟิลด์: `ca`, `cert`, `key`, `passphrase` (ทั้งหมดรองรับ SecretRef), `serverName`, `insecureSkipVerify`
  - `request.allowPrivateNetwork`: เมื่อเป็น `true` จะอนุญาต HTTPS ไปยัง `baseUrl` เมื่อ DNS resolve ไปยังช่วง private, CGNAT หรือช่วงคล้ายกัน ผ่าน provider HTTP fetch guard (ต้องให้ผู้ปฏิบัติงานเลือกใช้สำหรับ endpoints แบบ self-hosted ที่เชื่อถือได้และเข้ากันได้กับ OpenAI) WebSocket ใช้ `request` เดียวกันสำหรับ headers/TLS แต่ไม่ได้ใช้ fetch SSRF gate นั้น ค่าเริ่มต้น `false`
- `models.providers.*.models`: รายการแค็ตตาล็อกโมเดลของ provider ที่ระบุอย่างชัดเจน
- `models.providers.*.models.*.contextWindow`: ข้อมูลเมตา native model context window
- `models.providers.*.models.*.contextTokens`: runtime context cap แบบทางเลือก ใช้สิ่งนี้เมื่อคุณต้องการ effective context budget ที่เล็กกว่า `contextWindow` แบบ native ของโมเดล; `openclaw models list` จะแสดงทั้งสองค่าเมื่อแตกต่างกัน
- `models.providers.*.models.*.compat.supportsDeveloperRole`: compatibility hint แบบทางเลือก สำหรับ `api: "openai-completions"` ที่มี `baseUrl` แบบ non-native ที่ไม่ว่าง (host ไม่ใช่ `api.openai.com`) OpenClaw จะบังคับค่านี้เป็น `false` ระหว่างรันไทม์ หาก `baseUrl` ว่าง/ไม่ระบุ จะคงพฤติกรรม OpenAI เริ่มต้นไว้
- `models.providers.*.models.*.compat.requiresStringContent`: compatibility hint แบบทางเลือกสำหรับ endpoints แชตที่เข้ากันได้กับ OpenAI และรองรับเฉพาะ string เมื่อเป็น `true` OpenClaw จะ flatten `messages[].content` arrays ที่เป็นข้อความล้วนให้เป็น plain strings ก่อนส่งคำขอ
- `plugins.entries.amazon-bedrock.config.discovery`: root ของการตั้งค่า Bedrock auto-discovery
- `plugins.entries.amazon-bedrock.config.discovery.enabled`: เปิด/ปิด implicit discovery
- `plugins.entries.amazon-bedrock.config.discovery.region`: AWS region สำหรับการค้นพบ
- `plugins.entries.amazon-bedrock.config.discovery.providerFilter`: ตัวกรอง provider-id แบบทางเลือกสำหรับการค้นพบแบบเจาะจง
- `plugins.entries.amazon-bedrock.config.discovery.refreshInterval`: ช่วงเวลา polling สำหรับรีเฟรชการค้นพบ
- `plugins.entries.amazon-bedrock.config.discovery.defaultContextWindow`: fallback context window สำหรับโมเดลที่ค้นพบ
- `plugins.entries.amazon-bedrock.config.discovery.defaultMaxTokens`: fallback max output tokens สำหรับโมเดลที่ค้นพบ

### ตัวอย่าง provider

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

ตั้งค่า `OPENCODE_API_KEY` (หรือ `OPENCODE_ZEN_API_KEY`) ใช้ refs แบบ `opencode/...` สำหรับแค็ตตาล็อก Zen หรือ `opencode-go/...` สำหรับแค็ตตาล็อก Go ทางลัด: `openclaw onboard --auth-choice opencode-zen` หรือ `openclaw onboard --auth-choice opencode-go`

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

ตั้งค่า `ZAI_API_KEY` โดย `z.ai/*` และ `z-ai/*` เป็น aliases ที่รองรับ ทางลัด: `openclaw onboard --auth-choice zai-api-key`

- endpoint ทั่วไป: `https://api.z.ai/api/paas/v4`
- endpoint สำหรับงานโค้ด (ค่าเริ่มต้น): `https://api.z.ai/api/coding/paas/v4`
- สำหรับ endpoint ทั่วไป ให้กำหนด custom provider พร้อม override `baseUrl`

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

endpoints แบบเนทีฟของ Moonshot ประกาศความเข้ากันได้ของ streaming usage บน transport แบบใช้ร่วมกัน `openai-completions` และ OpenClaw จะอิงตามความสามารถของ endpoint แทนที่จะอิงเพียง provider id ที่มีมาในระบบอย่างเดียว

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

เข้ากันได้กับ Anthropic และเป็น provider ที่มีมาในระบบ ทางลัด: `openclaw onboard --auth-choice kimi-code-api-key`

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

base URL ควรละ `/v1` ออก (ไคลเอนต์ Anthropic จะต่อท้ายให้อัตโนมัติ) ทางลัด: `openclaw onboard --auth-choice synthetic-api-key`

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

ตั้งค่า `MINIMAX_API_KEY` ทางลัด:
`openclaw onboard --auth-choice minimax-global-api` หรือ
`openclaw onboard --auth-choice minimax-cn-api`
แค็ตตาล็อกโมเดลจะใช้ค่าเริ่มต้นเป็น M2.7 เท่านั้น
บนเส้นทางสตรีมมิงที่เข้ากันได้กับ Anthropic OpenClaw จะปิด MiniMax thinking
โดยค่าเริ่มต้น เว้นแต่คุณจะตั้ง `thinking` เองอย่างชัดเจน `/fast on` หรือ
`params.fastMode: true` จะเขียน `MiniMax-M2.7` ใหม่เป็น
`MiniMax-M2.7-highspeed`

</Accordion>

<Accordion title="โมเดลภายในเครื่อง (LM Studio)">

ดู [Local Models](/th/gateway/local-models) สรุปสั้นๆ: รัน local model ขนาดใหญ่ผ่าน LM Studio Responses API บนฮาร์ดแวร์ที่จริงจัง และคง hosted models ไว้แบบ merge เพื่อใช้เป็น fallback

</Accordion>

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ระดับบนอื่นๆ
- [การกำหนดค่า — agents](/th/gateway/config-agents)
- [การกำหนดค่า — channels](/th/gateway/config-channels)
- [Tools และ plugins](/th/tools)
