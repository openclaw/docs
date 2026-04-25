---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล การคิด workspace Heartbeat สื่อ Skills)
    - การกำหนดค่าการกำหนดเส้นทางหลายเอเจนต์และ bindings
    - การปรับแต่งเซสชัน การส่งข้อความ และพฤติกรรมโหมดพูด
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-04-25T13:46:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1601dc5720f6a82fb947667ed9c0b4612c5187572796db5deb7a28dd13be3528
    source_path: gateway/config-agents.md
    workflow: 15
---

คีย์การกำหนดค่าระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ runtime ของ Gateway และคีย์ระดับบนสุดอื่น ๆ ดู [Configuration reference](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รูทของรีโพแบบเลือกได้ ซึ่งจะแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยไล่ขึ้นไปจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist ของ Skills เริ่มต้นแบบเลือกได้ สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

- ละเว้น `agents.defaults.skills` หากต้องการให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` หากไม่ต้องการ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างจะเป็นชุดสุดท้ายสำหรับเอเจนต์นั้น โดย
  จะไม่ถูกรวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมเวลาที่ไฟล์ bootstrap ของ workspace จะถูก inject เข้าไปใน system prompt ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์น continuation ที่ปลอดภัย (หลังจาก assistant ตอบเสร็จแล้ว) จะข้ามการ inject bootstrap ของ workspace ซ้ำ เพื่อลดขนาด prompt ส่วนการรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้าง context ใหม่
- `"never"`: ปิดการ inject ไฟล์ bootstrap ของ workspace และไฟล์ context ในทุกเทิร์น ใช้เฉพาะกับเอเจนต์ที่จัดการวงจรชีวิตของ prompt ด้วยตนเองทั้งหมด (เอนจิน context แบบกำหนดเอง, runtime แบบเนทีฟที่สร้าง context เอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และการกู้คืนจาก Compaction ก็จะข้ามการ inject เช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของ workspace ก่อนถูกตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ inject ได้จากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นได้เมื่อ context ของ bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ inject ข้อความเตือนเข้าไปใน system prompt เลย
- `"once"`: inject คำเตือนหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: inject คำเตือนทุกครั้งที่มีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบประมาณ context

OpenClaw มีงบประมาณ prompt/context ปริมาณมากหลายส่วน และตั้งใจแยกออกตาม subsystem แทนที่จะไหลผ่านตัวควบคุมทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การ inject bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude ตอนเริ่มต้นแบบครั้งเดียวสำหรับการรัน `/new` และ `/reset`
  รวมถึงไฟล์ `memory/*.md` รายวันล่าสุด
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ถูก inject เข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  excerpt ของ runtime ที่มีขอบเขต และบล็อกที่ runtime เป็นเจ้าของซึ่งถูก inject
- `memory.qmd.limits.*`:
  ขนาด snippet และการ inject สำหรับการค้นหาหน่วยความจำที่ทำดัชนีไว้

ใช้การแทนที่ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ของเทิร์นแรกที่ถูก inject ในการรัน `/new` และ `/reset` แบบเปล่า

```json5
{
  agents: {
    defaults: {
      startupContext: {
        enabled: true,
        applyOn: ["new", "reset"],
        dailyMemoryDays: 2,
        maxFileBytes: 16384,
        maxFileChars: 1200,
        maxTotalChars: 2800,
      },
    },
  },
}
```

#### `agents.defaults.contextLimits`

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิว context ของ runtime ที่มีขอบเขต

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        toolResultMaxChars: 16000,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: ขีดจำกัด excerpt เริ่มต้นของ `memory_get` ก่อนเพิ่ม metadata การตัดทอนและประกาศ continuation
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ `lines`
- `toolResultMaxChars`: ขีดจำกัดผลลัพธ์ของ tool แบบสดที่ใช้กับผลลัพธ์ที่ถูกเก็บไว้และการกู้คืนเมื่อเกิด overflow
- `postCompactionMaxChars`: ขีดจำกัด excerpt ของ AGENTS.md ที่ใช้ระหว่างการ inject รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับตัวควบคุม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอดจาก `agents.defaults.contextLimits`

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        toolResultMaxChars: 16000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000,
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

ขีดจำกัดแบบ global สำหรับรายการ Skills แบบย่อที่ inject เข้าไปใน system prompt
ค่านี้ไม่กระทบกับการอ่านไฟล์ `SKILL.md` ตามต้องการ

```json5
{
  skills: {
    limits: {
      maxSkillsPromptChars: 18000,
    },
  },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

การแทนที่ต่อเอเจนต์สำหรับงบประมาณ prompt ของ Skills

```json5
{
  agents: {
    list: [
      {
        id: "tiny-local",
        skillsLimits: {
          maxSkillsPromptChars: 6000,
        },
      },
    ],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/tool ก่อนเรียก provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะคงรายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับ context ของ system prompt (ไม่ใช่เวลาประทับของข้อความ) หากไม่ตั้งค่า จะ fallback ไปใช้เขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (ตามค่ากำหนดของระบบปฏิบัติการ)

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // auto | 12 | 24
}
```

### `agents.defaults.model`

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-6": { alias: "opus" },
        "minimax/MiniMax-M2.7": { alias: "minimax" },
      },
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["minimax/MiniMax-M2.7"],
      },
      imageModel: {
        primary: "openrouter/qwen/qwen-2.5-vl-72b-instruct:free",
        fallbacks: ["openrouter/google/gemini-2.0-flash-vision:free"],
      },
      imageGenerationModel: {
        primary: "openai/gpt-image-2",
        fallbacks: ["google/gemini-3.1-flash-image-preview"],
      },
      videoGenerationModel: {
        primary: "qwen/wan2.6-t2v",
        fallbacks: ["qwen/wan2.6-i2v"],
      },
      pdfModel: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["openai/gpt-5.4-mini"],
      },
      params: { cacheRetention: "long" }, // พารามิเตอร์ provider เริ่มต้นแบบ global
      embeddedHarness: {
        runtime: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      elevatedDefault: "on",
      timeoutSeconds: 600,
      mediaMaxMb: 5,
      contextTokens: 200000,
      maxConcurrent: 3,
    },
  },
}
```

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลัก
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทาง tool `image` เป็น config ของโมเดล vision
  - ใช้เป็นเส้นทาง fallback ด้วยเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างภาพที่ใช้ร่วมกัน และพื้นผิว tool/Plugin ในอนาคตที่สร้างภาพ
  - ค่าที่พบบ่อย: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal หรือ `openai/gpt-image-2` สำหรับ OpenAI Images
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตนของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละเว้น `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่รองรับ auth ได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างภาพที่ลงทะเบียนไว้ตัวอื่นตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกันและ tool `music_generate` ในตัว
  - ค่าที่พบบ่อย: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละเว้น `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่รองรับ auth ได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างเพลงที่ลงทะเบียนไว้ตัวอื่นตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกันและ tool `video_generate` ในตัว
  - ค่าที่พบบ่อย: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละเว้น `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่รองรับ auth ได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างวิดีโอที่ลงทะเบียนไว้ตัวอื่นตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - provider สร้างวิดีโอ Qwen ที่มากับระบบรองรับวิดีโอผลลัพธ์ได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลาสูงสุด 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย tool `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละเว้น tool PDF จะ fallback ไปที่ `imageModel` จากนั้นจึงไปยังโมเดลเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับ tool `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด extraction fallback ใน tool `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `elevatedDefault`: ระดับผลลัพธ์แบบ elevated เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.4` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละเว้น provider, OpenClaw จะลอง alias ก่อน จากนั้นจึงลองจับคู่ configured-provider ที่ไม่กำกวมสำหรับ model id นั้นแบบตรงตัว และค่อย fallback ไปยัง provider เริ่มต้นที่กำหนดไว้ (เป็นพฤติกรรมเพื่อความเข้ากันได้แบบเลิกใช้แล้ว ดังนั้นควรระบุ `provider/model` ให้ชัดเจน) หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ที่กำหนดค่าไว้ตัวแรกแทนการแสดงค่าเริ่มต้นที่ล้าสมัยของ provider ที่ถูกลบออก
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่กำหนดไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่อยู่ในขอบเขต provider จะรวมโมเดลของ provider ที่เลือกเข้ามาในแมปนี้ และเก็บ provider อื่นที่กำหนดไว้แล้วซึ่งไม่เกี่ยวข้องไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง การทำ Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้อัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการ inject `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่ threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider เริ่มต้นแบบ global ที่ใช้กับทุกโมเดล ตั้งไว้ที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับการ merge ของ `params` (config): `agents.defaults.params` (ฐาน global) จะถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (ต่อโมเดล) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะ override ตามคีย์ ดู [Prompt Caching](/th/reference/prompt-caching) สำหรับรายละเอียด
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่จะถูก merge เข้าใน request body ของ `api: "openai-completions"` สำหรับ proxy ที่เข้ากันได้กับ OpenAI หากชนกับคีย์ request ที่ระบบสร้างขึ้น extra body จะชนะ; เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` ที่เป็น OpenAI-only ออกภายหลัง
- `embeddedHarness`: นโยบาย runtime ของเอเจนต์แบบฝังตัวระดับล่างเริ่มต้น หากไม่ระบุ runtime จะใช้ OpenClaw Pi เป็นค่าเริ่มต้น ใช้ `runtime: "pi"` เพื่อบังคับใช้ PI harness ในตัว, `runtime: "auto"` เพื่อให้ harness ของ Plugin ที่ลงทะเบียนไว้เข้ามารับการรันที่รองรับ หรือใช้ registered harness id เช่น `runtime: "codex"` ตั้งค่า `fallback: "none"` เพื่อปิดการ fallback ไปยัง PI แบบอัตโนมัติ runtime ของ Plugin แบบระบุชัดเจน เช่น `codex` จะ fail closed ตามค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallback: "pi"` ในขอบเขต override เดียวกัน เก็บ model ref ให้อยู่ในรูป canonical แบบ `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และ backend การประมวลผลอื่นผ่าน config ของ runtime แทน legacy runtime provider prefix ดู [Agent runtimes](/th/concepts/agent-runtimes) เพื่อเข้าใจความต่างจากการเลือก provider/model
- ตัวเขียน config ที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกเป็นรูปแบบออบเจ็กต์ canonical และพยายามคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงถูกจัดลำดับแบบอนุกรม) ค่าเริ่มต้น: 4

### `agents.defaults.embeddedHarness`

`embeddedHarness` ควบคุมว่า executor ระดับล่างตัวใดจะรันเทิร์นของเอเจนต์แบบฝังตัว
การติดตั้งใช้งานส่วนใหญ่ควรใช้ OpenClaw Pi runtime ค่าเริ่มต้นต่อไป
ใช้ตัวเลือกนี้เมื่อ Plugin ที่เชื่อถือได้มี native harness ให้ เช่น
Codex app-server harness ที่มากับระบบ สำหรับกรอบความเข้าใจ ดู
[Agent runtimes](/th/concepts/agent-runtimes)

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      embeddedHarness: {
        runtime: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `runtime`: `"auto"`, `"pi"` หรือ registered plugin harness id โดย Codex Plugin ที่มากับระบบจะลงทะเบียน `codex`
- `fallback`: `"pi"` หรือ `"none"` ใน `runtime: "auto"` หากละเว้น fallback จะมีค่าเริ่มต้นเป็น `"pi"` เพื่อให้ config เก่ายังใช้ PI ได้เมื่อไม่มี plugin harness ตัวใดรับงาน ในโหมด runtime ของ Plugin แบบระบุชัดเจน เช่น `runtime: "codex"` หากละเว้น fallback จะมีค่าเริ่มต้นเป็น `"none"` เพื่อให้ harness ที่หายไปล้มเหลวแทนที่จะใช้ PI แบบเงียบ ๆ override ของ runtime จะไม่สืบทอด fallback จากขอบเขตที่กว้างกว่า; ให้ตั้ง `fallback: "pi"` คู่กับ runtime ที่ระบุชัดเจนเมื่อคุณตั้งใจให้มี fallback เพื่อความเข้ากันได้นั้น ความล้มเหลวของ plugin harness ที่ถูกเลือกจะถูกแสดงโดยตรงเสมอ
- การแทนที่ผ่าน environment: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะ override `runtime`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` จะ override fallback สำหรับโปรเซสนั้น
- สำหรับการติดตั้งใช้งานแบบ Codex-only ให้ตั้ง `model: "openai/gpt-5.5"` และ `embeddedHarness.runtime: "codex"` คุณอาจตั้ง `embeddedHarness.fallback: "none"` อย่างชัดเจนเพื่อให้อ่านง่ายขึ้นได้ด้วย; นี่คือค่าเริ่มต้นสำหรับ runtime ของ Plugin แบบระบุชัดเจน
- การเลือก harness จะถูกปักหมุดต่อ session id หลังจากการรันแบบฝังตัวครั้งแรก การเปลี่ยนแปลง config/env จะมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ตแล้ว ไม่ใช่ transcript ที่มีอยู่เดิม เซสชัน legacy ที่มีประวัติ transcript แต่ไม่มีการบันทึกค่าปักหมุดไว้จะถือว่าถูกปักหมุดกับ PI `/status` จะแสดง runtime ที่มีผลจริง เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- ตัวเลือกนี้ควบคุมเฉพาะ chat harness แบบฝังตัวเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตนเอง

**alias shorthand ในตัว** (มีผลเฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| Alias               | Model                                              |
| ------------------- | -------------------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`                        |
| `sonnet`            | `anthropic/claude-sonnet-4-6`                      |
| `gpt`               | `openai/gpt-5.4` หรือ GPT-5.5 ของ Codex OAuth ที่กำหนดค่าไว้ |
| `gpt-mini`          | `openai/gpt-5.4-mini`                              |
| `gpt-nano`          | `openai/gpt-5.4-nano`                              |
| `gemini`            | `google/gemini-3.1-pro-preview`                    |
| `gemini-flash`      | `google/gemini-3-flash-preview`                    |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`             |

alias ที่คุณกำหนดค่าไว้เองจะมีผลเหนือกว่าค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดโหมดการคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตนเอง
โมเดล Z.AI จะเปิด `tool_stream` ตามค่าเริ่มต้นสำหรับการสตรีมการเรียก tool ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 จะใช้การคิดแบบ `adaptive` ตามค่าเริ่มต้นเมื่อไม่ได้ตั้งระดับการคิดไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

CLI backend แบบเลือกได้สำหรับการรัน fallback แบบข้อความล้วน (ไม่มีการเรียก tool) มีประโยชน์เป็นตัวสำรองเมื่อ API provider ล้มเหลว

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          modelArg: "--model",
          sessionArg: "--session",
          sessionMode: "existing",
          systemPromptArg: "--system",
          // หรือใช้ systemPromptFileArg หาก CLI รับแฟล็กไฟล์ prompt
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend เน้นข้อความเป็นหลัก; tool จะถูกปิดเสมอ
- รองรับเซสชันเมื่อมีการตั้ง `sessionArg`
- รองรับ image pass-through เมื่อ `imageArg` รับพาธไฟล์

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือรายเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์มีลำดับความสำคัญสูงกว่า; ค่าว่างหรือมีแต่ช่องว่างจะถูกละเลย มีประโยชน์สำหรับการทดลอง prompt แบบควบคุม

```json5
{
  agents: {
    defaults: {
      systemPromptOverride: "You are a helpful assistant.",
    },
  },
}
```

### `agents.defaults.promptOverlays`

prompt overlay ที่ไม่ขึ้นกับ provider และใช้ตามตระกูลโมเดล model id ในตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้าม provider; `personality` ควบคุมเฉพาะชั้นของรูปแบบการโต้ตอบที่เป็นมิตร

```json5
{
  agents: {
    defaults: {
      promptOverlays: {
        gpt5: {
          personality: "friendly", // friendly | on | off
        },
      },
    },
  },
}
```

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` จะเปิดชั้นรูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` จะปิดเฉพาะชั้นที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 แบบติดแท็กยังคงเปิดใช้งานอยู่
- ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบเดิมเมื่อยังไม่ได้ตั้งค่าร่วมนี้

### `agents.defaults.heartbeat`

การรัน Heartbeat เป็นระยะ

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m คือปิดใช้งาน
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // ค่าเริ่มต้น: true; false จะละส่วน Heartbeat ออกจาก system prompt
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จากไฟล์ bootstrap ของ workspace
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรันแต่ละ heartbeat ในเซสชันใหม่เสมอ (ไม่มีประวัติการสนทนา)
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (ค่าเริ่มต้น) | block
        target: "none", // ค่าเริ่มต้น: none | ตัวเลือก: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนแบบ API key) หรือ `1h` (การยืนยันตัวตนแบบ OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละส่วน Heartbeat ออกจาก system prompt และข้ามการ inject `HEARTBEAT.md` เข้าไปใน bootstrap context ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของ tool ระหว่างการรัน heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นเอเจนต์ของ heartbeat ก่อนจะถูกยกเลิก หากไม่ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบ direct/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` จะระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน heartbeat จะใช้ bootstrap context แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า เป็นรูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ช่วยลดต้นทุนโทเค็นต่อ heartbeat จากประมาณ ~100K เหลือ ~2-5K โทเค็น
- ต่อเอเจนต์: ตั้งค่าผ่าน `agents.list[].heartbeat` เมื่อมีเอเจนต์ใดกำหนด `heartbeat`, จะมี **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่รัน heartbeat
- Heartbeat จะรันเป็นเทิร์นเอเจนต์เต็มรูปแบบ — ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id ของ Plugin provider สำหรับ Compaction ที่ลงทะเบียนไว้ (ไม่บังคับ)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // ใช้เมื่อ identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] คือปิดการ inject ซ้ำ
        model: "openrouter/anthropic/claude-sonnet-4-6", // ตัวเลือกแทนที่โมเดลเฉพาะ Compaction
        notifyUser: true, // ส่งข้อความสั้นแจ้งผู้ใช้เมื่อ Compaction เริ่มและเสร็จ (ค่าเริ่มต้น: false)
        memoryFlush: {
          enabled: true,
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (การสรุปแบบเป็นช่วงสำหรับประวัติที่ยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ Plugin provider สำหรับ Compaction ที่ลงทะเบียนไว้ เมื่อกำหนดค่าไว้ จะเรียก `summarize()` ของ provider แทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะ fallback กลับไปใช้แบบในตัว การตั้ง provider จะบังคับใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับการทำ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายล่าสุดของ transcript แบบ verbatim คำสั่ง `/compact` แบบ manual จะใช้ค่านี้เมื่อมีการตั้งไว้อย่างชัดเจน; มิฉะนั้นการทำ Compaction แบบ manual จะเป็น hard checkpoint
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` โดย `strict` จะ prepend คำแนะนำในตัวเพื่อเก็บ opaque identifier ระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบเลือกได้สำหรับการเก็บรักษา identifier ซึ่งใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบและลองใหม่เมื่อผลลัพธ์ไม่เป็นรูปแบบที่ถูกต้องสำหรับสรุปแบบ safeguard เปิดใช้งานตามค่าเริ่มต้นในโหมด safeguard; ตั้ง `enabled: false` เพื่อข้ามการตรวจสอบ
- `postCompactionSections`: ชื่อ section H2/H3 ของ AGENTS.md แบบเลือกได้ที่จะ inject ซ้ำหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งเป็น `[]` เพื่อปิดการ inject ซ้ำ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าเป็นคู่นี้อย่างชัดเจน ระบบจะยอมรับหัวข้อเดิม `Every Session`/`Safety` เป็น fallback แบบ legacy ด้วย
- `model`: การแทนที่ `provider/model-id` แบบเลือกได้สำหรับการสรุป Compaction เท่านั้น ใช้เมื่อเซสชันหลักควรใช้โมเดลหนึ่ง แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง; หากไม่ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `notifyUser`: เมื่อเป็น `true` จะส่งข้อความสั้นแจ้งผู้ใช้เมื่อ Compaction เริ่มและเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานตามค่าเริ่มต้นเพื่อให้ Compaction ทำงานแบบเงียบ
- `memoryFlush`: เทิร์นเอเจนต์แบบเงียบก่อน auto-compaction เพื่อเก็บหน่วยความจำที่คงทน จะถูกข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

### `agents.defaults.contextPruning`

ตัด **ผลลัพธ์ของ tool เก่า** ออกจาก context ในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติเซสชันบนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยเริ่มต้น: นาที
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[Old tool result content cleared]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="พฤติกรรมของโหมด cache-ttl">

- `mode: "cache-ttl"` จะเปิดใช้รอบการตัดทอน
- `ttl` ควบคุมว่าจะสามารถรันการตัดทอนได้อีกครั้งบ่อยแค่ไหน (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดทอนจะเริ่มจาก soft-trim ผลลัพธ์ของ tool ที่มีขนาดใหญ่เกินไปก่อน จากนั้นหากจำเป็นจึง hard-clear ผลลัพธ์ของ tool ที่เก่ากว่า

**Soft-trim** จะเก็บต้น + ท้ายไว้ และแทรก `...` ตรงกลาง

**Hard-clear** จะแทนที่ผลลัพธ์ของ tool ทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนคำนวณตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นแบบตรงตัว
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัดทอน

</Accordion>

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

### Block streaming

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (ใช้ minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้ง `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดการตอบกลับแบบบล็อก
- การแทนที่ต่อช่องทาง: `channels.<channel>.blockStreamingCoalesce` (รวมถึงตัวแปรต่อบัญชี) โดย Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหน่วงแบบสุ่มระหว่างการตอบกลับแต่ละบล็อก `natural` = 800–2500ms การแทนที่ต่อเอเจนต์: `agents.list[].humanDelay`

ดู [Streaming](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรม + การแบ่ง chunk

### ตัวบ่งชี้การพิมพ์

```json5
{
  agents: {
    defaults: {
      typingMode: "instant", // never | instant | thinking | message
      typingIntervalSeconds: 6,
    },
  },
}
```

- ค่าเริ่มต้น: `instant` สำหรับแชต direct/ข้อความ mention และ `message` สำหรับแชตกลุ่มที่ไม่มีการ mention
- การแทนที่ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [Typing Indicators](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandbox แบบเลือกได้สำหรับเอเจนต์แบบฝังตัว ดูคู่มือเต็มได้ที่ [Sandboxing](/th/gateway/sandboxing)

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off | non-main | all
        backend: "docker", // docker | ssh | openshell
        scope: "agent", // session | agent | shared
        workspaceAccess: "none", // none | ro | rw
        workspaceRoot: "~/.openclaw/sandboxes",
        docker: {
          image: "openclaw-sandbox:bookworm-slim",
          containerPrefix: "openclaw-sbx-",
          workdir: "/workspace",
          readOnlyRoot: true,
          tmpfs: ["/tmp", "/var/tmp", "/run"],
          network: "none",
          user: "1000:1000",
          capDrop: ["ALL"],
          env: { LANG: "C.UTF-8" },
          setupCommand: "apt-get update && apt-get install -y git curl jq",
          pidsLimit: 256,
          memory: "1g",
          memorySwap: "2g",
          cpus: 1,
          ulimits: {
            nofile: { soft: 1024, hard: 2048 },
            nproc: 256,
          },
          seccompProfile: "/path/to/seccomp.json",
          apparmorProfile: "openclaw-sandbox",
          dns: ["1.1.1.1", "8.8.8.8"],
          extraHosts: ["internal.service:10.0.0.5"],
          binds: ["/home/user/source:/source:rw"],
        },
        ssh: {
          target: "user@gateway-host:22",
          command: "ssh",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // รองรับ SecretRef / เนื้อหาแบบอินไลน์ด้วย:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
        browser: {
          enabled: false,
          image: "openclaw-sandbox-browser:bookworm-slim",
          network: "openclaw-sandbox-browser",
          cdpPort: 9222,
          cdpSourceRange: "172.21.0.1/32",
          vncPort: 5900,
          noVncPort: 6080,
          headless: false,
          enableNoVnc: true,
          allowHostControl: false,
          autoStart: true,
          autoStartTimeoutMs: 12000,
        },
        prune: {
          idleHours: 24,
          maxAgeDays: 7,
        },
      },
    },
  },
  tools: {
    sandbox: {
      tools: {
        allow: [
          "exec",
          "process",
          "read",
          "write",
          "edit",
          "apply_patch",
          "sessions_list",
          "sessions_history",
          "sessions_send",
          "sessions_spawn",
          "session_status",
        ],
        deny: ["browser", "canvas", "nodes", "cron", "discord", "gateway"],
      },
    },
  },
}
```

<Accordion title="รายละเอียดของ sandbox">

**Backend:**

- `docker`: Docker runtime ภายในเครื่อง (ค่าเริ่มต้น)
- `ssh`: remote runtime ทั่วไปที่ทำงานผ่าน SSH
- `openshell`: OpenShell runtime

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะ runtime จะย้ายไปอยู่ที่
`plugins.entries.openshell.config`

**การกำหนดค่า SSH backend:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบ absolute ที่ใช้สำหรับ workspace ต่อขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่แล้ว ซึ่งจะถูกส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRef ที่ OpenClaw จะ materialize เป็นไฟล์ชั่วคราวขณะ runtime
- `strictHostKeyChecking` / `updateHostKeys`: ตัวควบคุมนโยบาย host key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีผลเหนือกว่า `identityFile`
- `certificateData` มีผลเหนือกว่า `certificateFile`
- `knownHostsData` มีผลเหนือกว่า `knownHostsFile`
- ค่า `*Data` ที่อ้างอิง SecretRef จะถูก resolve จาก snapshot ของ secrets runtime ที่ใช้งานอยู่ก่อนเริ่มเซสชัน sandbox

**พฤติกรรมของ SSH backend:**

- seed workspace ระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นจะถือว่า workspace SSH ระยะไกลเป็น canonical
- กำหนดเส้นทาง `exec`, file tool และพาธสื่อผ่าน SSH
- จะไม่ซิงก์การเปลี่ยนแปลงบน remote กลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับ container ของ browser ภายใน sandbox

**การเข้าถึง workspace:**

- `none`: workspace ของ sandbox ต่อขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: workspace ของ sandbox ที่ `/workspace`, และ mount workspace ของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: mount workspace ของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: container + workspace ต่อเซสชัน
- `agent`: container + workspace หนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: ใช้ container และ workspace ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**การกำหนดค่า OpenShell Plugin:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror | remote
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // ไม่บังคับ
          gatewayEndpoint: "https://lab.example", // ไม่บังคับ
          policy: "strict", // policy id ของ OpenShell แบบไม่บังคับ
          providers: ["openai"], // ไม่บังคับ
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมด OpenShell:**

- `mirror`: seed remote จาก local ก่อน `exec`, ซิงก์กลับหลัง `exec`; workspace local ยังคงเป็น canonical
- `remote`: seed remote หนึ่งครั้งเมื่อสร้าง sandbox แล้วถือว่า workspace remote เป็น canonical ต่อไป

ในโหมด `remote` การแก้ไขบนโฮสต์ที่ทำภายนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งใช้ SSH เข้า sandbox ของ OpenShell แต่ Plugin จะเป็นเจ้าของวงจรชีวิตของ sandbox และการซิงก์แบบ mirror ตามตัวเลือก

**`setupCommand`** จะรันหนึ่งครั้งหลังสร้าง container (ผ่าน `sh -lc`) ต้องการ network egress, root ที่เขียนได้ และผู้ใช้ root

**container มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` จะถูกบล็อก ส่วน `"container:<id>"` จะถูกบล็อกตามค่าเริ่มต้น เว้นแต่คุณจะตั้ง
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกพักไว้ใน `media/inbound/*` ภายใน workspace ที่ใช้งานอยู่

**`docker.binds`** จะ mount ไดเรกทอรีของโฮสต์เพิ่มเติม; ระบบจะ merge bind แบบ global และต่อเอเจนต์เข้าด้วยกัน

**browser แบบ sandboxed** (`sandbox.browser.enabled`): Chromium + CDP ภายใน container โดย URL ของ noVNC จะถูก inject เข้าไปใน system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงแบบสังเกตการณ์ผ่าน noVNC ใช้ VNC auth ตามค่าเริ่มต้น และ OpenClaw จะปล่อย URL token อายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) จะบล็อกไม่ให้เซสชันภายใน sandbox กำหนดเป้าหมายไปยัง browser ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบ global อย่างชัดเจน
- `cdpSourceRange` สามารถใช้จำกัด CDP ingress ที่ขอบ container ตามช่วง CIDR ได้ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` จะ mount ไดเรกทอรีของโฮสต์เพิ่มเติมเข้าเฉพาะ container browser ของ sandbox เมื่อมีการตั้งค่า (รวมถึง `[]`) จะใช้แทน `docker.binds` สำหรับ container browser
- ค่าเริ่มต้นของการเปิดใช้งานถูกกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับจูนมาสำหรับโฮสต์แบบ container:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-3d-apis`
  - `--disable-gpu`
  - `--disable-software-rasterizer`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-features=TranslateUI`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--renderer-process-limit=2`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--disable-extensions` (เปิดใช้ตามค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` จะ
    เปิดใช้งานตามค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้ WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` จะเปิดใช้ extensions อีกครั้งหากเวิร์กโฟลว์ของคุณ
    ต้องพึ่งพา extensions เหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้
    ขีดจำกัด process เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นเหล่านี้เป็น baseline ของอิมเมจ container; ใช้อิมเมจ browser แบบกำหนดเองพร้อม custom
    entrypoint หากต้องการเปลี่ยนค่าเริ่มต้นของ container

</Accordion>

sandbox ของ browser และ `sandbox.docker.binds` ใช้ได้เฉพาะกับ Docker เท่านั้น

สร้างอิมเมจ:

```bash
scripts/sandbox-setup.sh           # อิมเมจ sandbox หลัก
scripts/sandbox-browser-setup.sh   # อิมเมจ browser แบบเลือกได้
```

### `agents.list` (การแทนที่ต่อเอเจนต์)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "Main Agent",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // หรือ { primary, fallbacks }
        thinkingDefault: "high", // การแทนที่ระดับการคิดต่อเอเจนต์
        reasoningDefault: "on", // การแทนที่การมองเห็น reasoning ต่อเอเจนต์
        fastModeDefault: false, // การแทนที่ fast mode ต่อเอเจนต์
        embeddedHarness: { runtime: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // override params ของ defaults.models ที่ตรงกันตามคีย์
        skills: ["docs-search"], // ใช้แทน agents.defaults.skills เมื่อมีการตั้งค่า
        identity: {
          name: "Samantha",
          theme: "helpful sloth",
          emoji: "🦥",
          avatar: "avatars/samantha.png",
        },
        groupChat: { mentionPatterns: ["@openclaw"] },
        sandbox: { mode: "off" },
        runtime: {
          type: "acp",
          acp: {
            agent: "codex",
            backend: "acpx",
            mode: "persistent",
            cwd: "/workspace/openclaw",
          },
        },
        subagents: { allowAgents: ["*"] },
        tools: {
          profile: "coding",
          allow: ["browser"],
          deny: ["canvas"],
          elevated: { enabled: true },
        },
      },
    ],
  },
}
```

- `id`: agent id แบบคงที่ (จำเป็น)
- `default`: หากตั้งหลายตัว ตัวแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่มีการตั้งเลย รายการแรกใน list จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะ override เฉพาะ `primary`; รูปแบบออบเจ็กต์ `{ primary, fallbacks }` จะ override ทั้งสองค่า (`[]` จะปิด global fallback) งาน Cron ที่ override แค่ `primary` จะยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: stream params ต่อเอเจนต์ ซึ่ง merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำสำเนาแค็ตตาล็อกโมเดลทั้งหมด
- `skills`: allowlist ของ Skills ต่อเอเจนต์แบบเลือกได้ หากละเว้น เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; รายการแบบชัดเจนจะใช้แทนค่าเริ่มต้นแทนที่จะ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดเริ่มต้นต่อเอเจนต์แบบเลือกได้ (`off | minimal | low | medium | high | xhigh | adaptive | max`) จะ override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการ override ต่อข้อความหรือเซสชัน โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคงการคิดแบบไดนามิกที่ provider เป็นเจ้าของ (`thinkingLevel` จะถูกละเว้นบน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบเลือกได้ (`on | off | stream`) ใช้เมื่อไม่มีการ override reasoning ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นของ fast mode ต่อเอเจนต์แบบเลือกได้ (`true | false`) ใช้เมื่อไม่มีการ override fast-mode ต่อข้อความหรือเซสชัน
- `embeddedHarness`: การแทนที่นโยบาย harness ระดับล่างต่อเอเจนต์แบบเลือกได้ ใช้ `{ runtime: "codex" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex-only ขณะที่เอเจนต์อื่นยังคงใช้ PI fallback เริ่มต้นในโหมด `auto`
- `runtime`: ตัวอธิบาย runtime ต่อเอเจนต์แบบเลือกได้ ใช้ `type: "acp"` พร้อมค่าเริ่มต้นใน `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness ตามค่าเริ่มต้น
- `identity.avatar`: พาธที่อ้างอิงจาก workspace, URL แบบ `http(s)` หรือ URI แบบ `data:`
- `identity` จะอนุมานค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ agent id สำหรับ `sessions_spawn` (`["*"]` = ได้ทุกตัว; ค่าเริ่มต้น: ได้เฉพาะเอเจนต์เดียวกัน)
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่ทำให้รันโดยไม่มี sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละเว้น `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

รันเอเจนต์ที่แยกออกจากกันหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

```json5
{
  agents: {
    list: [
      { id: "home", default: true, workspace: "~/.openclaw/workspace-home" },
      { id: "work", workspace: "~/.openclaw/workspace-work" },
    ],
  },
  bindings: [
    { agentId: "home", match: { channel: "whatsapp", accountId: "personal" } },
    { agentId: "work", match: { channel: "whatsapp", accountId: "biz" } },
  ],
}
```

### ฟิลด์ match ของ binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะถือเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; หากละเว้น = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะบางช่องทาง)
- `acp` (ไม่บังคับ; ใช้เฉพาะ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงตัว, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ระดับทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` ที่ตรงกันตัวแรกจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ตามตัวตนการสนทนาแบบตรงตัว (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับของ route binding ข้างต้น

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="สิทธิ์เต็มรูปแบบ (ไม่มี sandbox)">

```json5
{
  agents: {
    list: [
      {
        id: "personal",
        workspace: "~/.openclaw/workspace-personal",
        sandbox: { mode: "off" },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="เครื่องมือ + workspace แบบอ่านอย่างเดียว">

```json5
{
  agents: {
    list: [
      {
        id: "family",
        workspace: "~/.openclaw/workspace-family",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "ro" },
        tools: {
          allow: [
            "read",
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
          ],
          deny: ["write", "edit", "apply_patch", "exec", "process", "browser"],
        },
      },
    ],
  },
}
```

</Accordion>

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (เฉพาะการรับส่งข้อความ)">

```json5
{
  agents: {
    list: [
      {
        id: "public",
        workspace: "~/.openclaw/workspace-public",
        sandbox: { mode: "all", scope: "agent", workspaceAccess: "none" },
        tools: {
          allow: [
            "sessions_list",
            "sessions_history",
            "sessions_send",
            "sessions_spawn",
            "session_status",
            "whatsapp",
            "telegram",
            "slack",
            "discord",
            "gateway",
          ],
          deny: [
            "read",
            "write",
            "edit",
            "apply_patch",
            "exec",
            "process",
            "browser",
            "canvas",
            "nodes",
            "cron",
            "gateway",
            "image",
          ],
        },
      },
    ],
  },
}
```

</Accordion>

ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดลำดับความสำคัญ

---

## เซสชัน

```json5
{
  session: {
    scope: "per-sender",
    dmScope: "main", // main | per-peer | per-channel-peer | per-account-channel-peer
    identityLinks: {
      alice: ["telegram:123456789", "discord:987654321012345678"],
    },
    reset: {
      mode: "daily", // daily | idle
      atHour: 4,
      idleMinutes: 60,
    },
    resetByType: {
      thread: { mode: "daily", atHour: 4 },
      direct: { mode: "idle", idleMinutes: 240 },
      group: { mode: "idle", idleMinutes: 120 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    parentForkMaxTokens: 100000, // ข้าม parent-thread fork หากเกินจำนวนโทเค็นนี้ (0 คือปิดใช้งาน)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // ระยะเวลา หรือ false
      maxDiskBytes: "500mb", // hard budget แบบไม่บังคับ
      highWaterBytes: "400mb", // เป้าหมายหลัง cleanup แบบไม่บังคับ
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // การเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน เป็นชั่วโมง (`0` คือปิดใช้งาน)
      maxAgeHours: 0, // อายุสูงสุดแบบ hard limit เป็นชั่วโมง (`0` คือปิดใช้งาน)
    },
    mainKey: "main", // แบบเดิม (runtime ใช้ "main" เสมอ)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ของเซสชัน">

- **`scope`**: กลยุทธ์การจัดกลุ่มเซสชันพื้นฐานสำหรับบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้เซสชันแยกกันภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางจะแชร์เซสชันเดียวกัน (ใช้เฉพาะเมื่อคุณตั้งใจให้ใช้ context ร่วมกัน)
- **`dmScope`**: วิธีการจัดกลุ่ม DM
  - `main`: DM ทั้งหมดแชร์เซสชันหลัก
  - `per-peer`: แยกตาม sender id ข้ามทุกช่องทาง
  - `per-channel-peer`: แยกต่อช่องทาง + ผู้ส่ง (แนะนำสำหรับ inbox ที่มีหลายผู้ใช้)
  - `per-account-channel-peer`: แยกต่อบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป canonical id ไปยัง peer ที่มีคำนำหน้า provider เพื่อแชร์เซสชันข้ามช่องทาง
- **`reset`**: นโยบาย reset หลัก โดย `daily` จะรีเซ็ตตามเวลา `atHour` ในเวลาท้องถิ่น; `idle` จะรีเซ็ตหลัง `idleMinutes` หากกำหนดทั้งสองอย่าง ตัวที่หมดอายุก่อนจะมีผล
- **`resetByType`**: การแทนที่ตามประเภท (`direct`, `group`, `thread`) โดย `dm` แบบเดิมยังรับเป็น alias ของ `direct`
- **`parentForkMaxTokens`**: จำนวน `totalTokens` สูงสุดของ parent-session ที่อนุญาตเมื่อสร้างเซสชันเธรดแบบ forked (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของ parent สูงกว่าค่านี้ OpenClaw จะเริ่มเซสชันเธรดใหม่แทนการสืบทอดประวัติ transcript ของ parent
  - ตั้งเป็น `0` เพื่อปิด guard นี้และอนุญาต parent forking เสมอ
- **`mainKey`**: ฟิลด์แบบเดิม runtime ใช้ `"main"` เสมอสำหรับบัคเก็ตแชต direct หลัก
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบการตอบกลับไปมาระหว่างเอเจนต์สูงสุดระหว่างการแลกเปลี่ยนแบบ agent-to-agent (จำนวนเต็ม ช่วง: `0`–`5`) โดย `0` คือปิดการเชื่อมโยง ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` โดยมี alias แบบเดิมคือ `dm`), `keyPrefix` หรือ `rawKeyPrefix` กฎ deny ตัวแรกที่ตรงกันจะชนะ
- **`maintenance`**: ตัวควบคุม cleanup + retention ของที่เก็บเซสชัน
  - `mode`: `warn` จะแค่ปล่อยคำเตือน; `enforce` จะทำการ cleanup
  - `pruneAfter`: เกณฑ์อายุตัดสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`)
  - `rotateBytes`: หมุน `sessions.json` เมื่อเกินขนาดนี้ (ค่าเริ่มต้น `10mb`)
  - `resetArchiveRetention`: ระยะเวลาเก็บ archive transcript แบบ `*.reset.<timestamp>` ค่าเริ่มต้นจะใช้ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าสุดก่อน
  - `highWaterBytes`: เป้าหมายหลัง cleanup ตามงบประมาณแบบไม่บังคับ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นแบบ global สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (provider สามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน เป็นชั่วโมง (`0` คือปิดใช้งาน; provider สามารถ override ได้)
  - `maxAgeHours`: ค่าเริ่มต้นของอายุสูงสุดแบบ hard limit เป็นชั่วโมง (`0` คือปิดใช้งาน; provider สามารถ override ได้)

</Accordion>

---

## ข้อความ

```json5
{
  messages: {
    responsePrefix: "🦞", // หรือ "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "collect", // steer | followup | collect | steer-backlog | steer+backlog | queue | interrupt
      debounceMs: 1000,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "collect",
        telegram: "collect",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 คือปิดใช้งาน
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### คำนำหน้าคำตอบ

การแทนที่ต่อช่องทาง/ต่อบัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การ resolve (ตัวที่เจาะจงที่สุดชนะ): account → channel → global ค่า `""` จะปิดใช้งานและหยุดการไล่ต่อ `"auto"` จะอนุมานเป็น `[{identity.name}]`

**ตัวแปรของ template:**

| ตัวแปร            | คำอธิบาย                 | ตัวอย่าง                    |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น         | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม      | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อ provider            | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน      | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`)       |

ตัวแปรไม่สนใจตัวพิมพ์เล็ก-ใหญ่ `{think}` เป็น alias ของ `{thinkingLevel}`

### Ack reaction

- ค่าเริ่มต้นจะใช้ `identity.emoji` ของเอเจนต์ที่กำลังใช้งานอยู่ มิฉะนั้นจะเป็น `"👀"` ตั้งค่าเป็น `""` เพื่อปิดใช้งาน
- การแทนที่ต่อช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการ resolve: account → channel → `messages.ackReaction` → identity fallback
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับบน Slack, Discord และ Telegram
- `messages.statusReactions.enabled`: เปิดใช้งาน status reaction ตาม lifecycle บน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่า จะยังคงเปิด status reaction ไว้เมื่อ ack reaction ทำงานอยู่
  บน Telegram ต้องตั้งเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งาน status reaction ตาม lifecycle

### Inbound debounce

รวมข้อความแบบ text-only ที่มาถี่ ๆ จากผู้ส่งคนเดียวกันให้เป็นเทิร์นเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที ส่วนคำสั่งควบคุมจะข้ามการ debounce

### TTS (text-to-speech)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-4.1-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          voiceId: "voice_id",
          modelId: "eleven_multilingual_v2",
          seed: 42,
          applyTextNormalization: "auto",
          languageCode: "en",
          voiceSettings: {
            stability: 0.5,
            similarityBoost: 0.75,
            style: 0.0,
            useSpeakerBoost: true,
            speed: 1.0,
          },
        },
        microsoft: {
          voice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          voice: "alloy",
        },
      },
    },
  },
}
```

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` โดย `/tts on|off` สามารถ override ค่ากำหนดในเครื่องได้ และ `/tts status` จะแสดงสถานะที่มีผลจริง
- `summaryModel` จะ override `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดเอง)
- API key จะ fallback ไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- speech provider ที่มากับระบบเป็นของ Plugin หากมีการตั้งค่า `plugins.allow` ให้รวม Plugin provider ของ TTS แต่ละตัวที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS โดยระบบยังคงยอมรับ provider id แบบเดิม `edge` เป็น alias ของ `microsoft`
- `providers.openai.baseUrl` จะ override endpoint ของ OpenAI TTS ลำดับการ resolve คือ config, จากนั้น `OPENAI_TTS_BASE_URL`, จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และจะผ่อนคลายการตรวจสอบ model/voice

---

## Talk

ค่าเริ่มต้นสำหรับโหมด Talk (macOS/iOS/Android)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        voiceId: "elevenlabs_voice_id",
        voiceAliases: {
          Clawd: "EXAVITQu4vr4xnSDxMaL",
          Roger: "CwhRBWXzGAHq8TQ4Fs17",
        },
        modelId: "eleven_v3",
        outputFormat: "mp3_44100_128",
        apiKey: "elevenlabs_api_key",
      },
      mlx: {
        modelId: "mlx-community/Soprano-80M-bf16",
      },
      system: {},
    },
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อมีการกำหนดค่า Talk provider หลายตัว
- คีย์ Talk แบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- Voice ID จะ fallback ไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รองรับสตริง plaintext หรือออบเจ็กต์ SecretRef
- การ fallback ไปใช้ `ELEVENLABS_API_KEY` จะใช้เฉพาะเมื่อไม่มีการกำหนดค่า Talk API key
- `providers.*.voiceAliases` ช่วยให้ directive ของ Talk ใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` ใช้เลือกรีโพ Hugging Face ที่ตัวช่วย MLX ภายในเครื่องของ macOS จะใช้ หากไม่ตั้งค่า macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS จะรันผ่านตัวช่วย `openclaw-mlx-tts` ที่มากับระบบเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` ใช้ override พาธของตัวช่วยสำหรับการพัฒนา
- `silenceTimeoutMs` ควบคุมว่าโหมด Talk จะรอนานเท่าใดหลังจากผู้ใช้เงียบ ก่อนส่ง transcript หากไม่ตั้งค่า จะใช้ช่วงหยุดเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [Configuration reference](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [Configuration](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [Configuration examples](/th/gateway/configuration-examples)
