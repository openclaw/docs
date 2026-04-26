---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล thinking workspace Heartbeat สื่อ และ Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกแบบ Multi-Agent
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมด talk
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบ Multi-Agent การตั้งค่าเซสชัน ข้อความ และ talk
title: การตั้งค่า — เอเจนต์
x-i18n:
    generated_at: "2026-04-26T11:28:52Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e99e1548c708e62156b3743028eaa5ee705b5f4967bffdab59c3cb342dfa724
    source_path: gateway/config-agents.md
    workflow: 15
---

คีย์การตั้งค่าในขอบเขตเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับ channel, เครื่องมือ, runtime ของ gateway และคีย์ระดับบนอื่น ๆ
โปรดดู [ข้อมูลอ้างอิงการตั้งค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

ราก repository แบบเลือกได้ที่แสดงในบรรทัด Runtime ของ system prompt หากไม่ตั้งค่า OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นไปจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist ของ Skills เริ่มต้นแบบเลือกได้สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // รับช่วง github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

- ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดเป็นค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อรับช่วงค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` หากไม่ต้องการ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างจะเป็นชุดสุดท้ายสำหรับเอเจนต์นั้น โดย
  จะไม่รวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมว่าไฟล์ bootstrap ของ workspace จะถูก inject เข้าไปใน system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลัง assistant ตอบเสร็จสมบูรณ์) จะข้ามการ inject bootstrap ของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการ retry หลัง Compaction จะยังคงสร้างบริบทใหม่
- `"never"`: ปิดการ inject bootstrap ของ workspace และไฟล์บริบทในทุกเทิร์น ใช้สิ่งนี้เฉพาะกับเอเจนต์ที่จัดการวงจรชีวิตของ prompt เองทั้งหมด (เอนจินบริบทแบบกำหนดเอง, runtime แบบ native ที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และเทิร์นกู้คืนหลัง Compaction จะข้ามการ inject เช่นกัน

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

ควบคุมข้อความคำเตือนที่เอเจนต์มองเห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ inject ข้อความคำเตือนเข้าไปใน system prompt เลย
- `"once"`: inject คำเตือนหนึ่งครั้งต่อ truncation signature ที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: inject คำเตือนทุกครั้งที่มีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณ prompt/context ปริมาณสูงหลายส่วน และตั้งใจแยก
ตาม subsystem แทนที่จะไหลผ่านปุ่มควบคุมทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การ inject bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude ตอนเริ่มต้นแบบครั้งเดียวของ `/new` และ `/reset` รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด
- `skills.limits.*`:
  รายการ Skills แบบกระชับที่ inject เข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  ส่วนตัดตอน runtime ที่มีขอบเขตจำกัดและบล็อกที่ runtime เป็นเจ้าของซึ่งถูก inject
- `memory.qmd.limits.*`:
  การกำหนดขนาด snippet และการ inject ของการค้นหา Memory แบบจัดทำดัชนี

ใช้ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อมีเอเจนต์หนึ่งตัวที่ต้องการ
งบประมาณต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ของเทิร์นแรกที่ถูก inject สำหรับการรัน `/new` และ `/reset` แบบเปล่า

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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิวบริบท runtime แบบมีขอบเขตจำกัด

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

- `memoryGetMaxChars`: เพดานส่วนตัดตอนเริ่มต้นของ `memory_get` ก่อนจะเพิ่ม
  metadata การตัดทอนและข้อความแจ้งว่ามีข้อมูลต่อ
- `memoryGetDefaultLines`: หน้าต่างจำนวนบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ
  `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์ของเครื่องมือแบบ live ที่ใช้กับผลลัพธ์ที่จัดเก็บถาวร
  และการกู้คืนเมื่อข้อมูลล้น
- `postCompactionMaxChars`: เพดานส่วนตัดตอนของ `AGENTS.md` ที่ใช้ระหว่างการ inject เพื่อรีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

override ต่อเอเจนต์สำหรับปุ่มควบคุม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะรับช่วง
จาก `agents.defaults.contextLimits`

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

เพดานรวมระดับส่วนกลางสำหรับรายการ Skills แบบกระชับที่ inject เข้าไปใน system prompt ค่านี้
ไม่มีผลกับการอ่านไฟล์ `SKILL.md` ตามต้องการ

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

override ต่อเอเจนต์สำหรับงบประมาณ prompt ของ Skills

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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/tool ก่อนเรียกใช้ provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักช่วยลดการใช้ vision token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะคงรายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

Timezone สำหรับบริบทใน system prompt (ไม่ใช่ timestamp ของข้อความ) หากไม่มีจะ fallback ไปยัง timezone ของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (ค่ากำหนดของ OS)

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
      params: { cacheRetention: "long" }, // provider params ส่วนกลางค่าเริ่มต้น
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลัก
  - รูปแบบอ็อบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นคอนฟิก vision-model
  - ใช้เป็นการกำหนดเส้นทาง fallback ด้วยเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างภาพที่ใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างภาพ
  - ค่าที่ใช้กันทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างภาพแบบ native ของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP แบบพื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตนของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละเว้นไว้ `image_generate` ยังสามารถอนุมาน provider ค่าเริ่มต้นที่รองรับการยืนยันตัวตนได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างภาพอื่นที่ลงทะเบียนไว้ตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกัน และเครื่องมือ `music_generate` ที่มาพร้อมในชุด
  - ค่าที่ใช้กันทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละเว้นไว้ `music_generate` ยังสามารถอนุมาน provider ค่าเริ่มต้นที่รองรับการยืนยันตัวตนได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างเพลงอื่นที่ลงทะเบียนไว้ตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกัน และเครื่องมือ `video_generate` ที่มาพร้อมในชุด
  - ค่าที่ใช้กันทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละเว้นไว้ `video_generate` ยังสามารถอนุมาน provider ค่าเริ่มต้นที่รองรับการยืนยันตัวตนได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างวิดีโออื่นที่ลงทะเบียนไว้ตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - provider สร้างวิดีโอ Qwen ที่มาพร้อมในชุดรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ความยาว 10 วินาที และตัวเลือก `size`, `aspectRatio`, `resolution`, `audio` และ `watermark` ในระดับ provider
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละเว้นไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปที่โมเดล session/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้งาน
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด extraction fallback ของเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `elevatedDefault`: ระดับเอาต์พุต elevated เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละเว้น provider, OpenClaw จะลอง alias ก่อน จากนั้นลองการจับคู่ configured-provider แบบไม่ซ้ำสำหรับ model id นั้นโดยตรง และหลังจากนั้นจึง fallback ไปยัง provider ค่าเริ่มต้นที่ตั้งค่าไว้ (เป็นพฤติกรรมความเข้ากันได้แบบเลิกใช้แล้ว ดังนั้นควรระบุ `provider/model` ให้ชัดเจน) หาก provider นั้นไม่ได้เปิดให้ใช้โมเดลค่าเริ่มต้นที่ตั้งค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ตัวแรกที่ตั้งค่าไว้แทนที่จะแสดงค่าเริ่มต้นของ provider ที่ล้าสมัยและถูกถอดออกแล้ว
- `models`: แค็ตตาล็อกโมเดลและ allowlist สำหรับ `/model` ที่ตั้งค่าไว้ แต่ละรายการอาจมี `alias` (ชื่อย่อ) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ซึ่งจะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่อยู่ในขอบเขต provider จะ merge โมเดล provider ที่เลือกลงในแผนที่นี้ และเก็บ provider อื่นที่ตั้งค่าไว้แล้วและไม่เกี่ยวข้องไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง จะเปิด Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุด inject `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อ override threshold ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider ค่าเริ่มต้นแบบส่วนกลางที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญในการ merge ของ `params` (คอนฟิก): `agents.defaults.params` (ฐานส่วนกลาง) จะถูก override โดย `agents.defaults.models["provider/model"].params` (ต่อโมเดล) แล้ว `agents.list[].params` (ตาม agent id ที่ตรงกัน) จะ override ต่อคีย์ ดู [Prompt Caching](/th/reference/prompt-caching) สำหรับรายละเอียด
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าไปใน request body ของ `api: "openai-completions"` สำหรับ proxy ที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่ระบบสร้างขึ้น extra body จะมีสิทธิ์เหนือกว่า; เส้นทาง completions ที่ไม่ใช่ native จะยังคงลบ `store` ที่เป็น OpenAI-only ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าไปใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` ที่ปิด thinking อยู่ OpenClaw จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` ให้อัตโนมัติ; `chat_template_kwargs` ที่ระบุชัดเจนจะ override ค่าเริ่มต้นเหล่านั้น และ `extra_body.chat_template_kwargs` ยังคงมีสิทธิ์สูงสุดท้ายสุด
- `params.preserveThinking`: การเลือกใช้ preserved thinking สำหรับ Z.AI เท่านั้น เมื่อเปิดใช้งานและเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า; ดู [thinking และ preserved thinking ของ Z.AI](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบาย runtime ระดับล่างของเอเจนต์โดยค่าเริ่มต้น หากละเว้น id จะใช้ OpenClaw Pi เป็นค่าเริ่มต้น ใช้ `id: "pi"` เพื่อบังคับใช้ PI harness ที่มาพร้อมในชุด, `id: "auto"` เพื่อให้ plugin harness ที่ลงทะเบียนไว้เข้ามารับช่วงโมเดลที่รองรับ, ใช้ harness id ที่ลงทะเบียนไว้ เช่น `id: "codex"` หรือใช้ alias ของ CLI backend ที่รองรับ เช่น `id: "claude-cli"` ตั้งค่า `fallback: "none"` เพื่อปิด automatic PI fallback runtime ของ Plugin แบบชัดเจน เช่น `codex` จะ fail closed เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallback: "pi"` ในขอบเขต override เดียวกัน ให้คงการอ้างอิงโมเดลในรูปแบบ canonical เป็น `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และ execution backend อื่น ๆ ผ่านคอนฟิก runtime แทน prefix provider แบบ legacy ดู [Agent runtimes](/th/concepts/agent-runtimes) เพื่อทำความเข้าใจว่าสิ่งนี้ต่างจากการเลือก provider/model อย่างไร
- ตัวเขียนคอนฟิกที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกเป็นรูปแบบอ็อบเจ็กต์ canonical และคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์พร้อมกันสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงถูกจัดลำดับทีละรายการ) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมว่า executor ระดับล่างตัวใดจะรันเทิร์นของเอเจนต์ การติดตั้งใช้งานส่วนใหญ่ควรคง runtime OpenClaw Pi ค่าเริ่มต้นไว้ ใช้ค่านี้เมื่อ Plugin ที่เชื่อถือได้มี native harness ให้ เช่น Codex app-server harness ที่มาพร้อมในชุด หรือเมื่อคุณต้องการใช้ CLI backend ที่รองรับ เช่น Claude CLI สำหรับกรอบความคิด โปรดดู [Agent runtimes](/th/concepts/agent-runtimes)

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, harness id ของ Plugin ที่ลงทะเบียนไว้ หรือ alias ของ CLI backend ที่รองรับ Plugin Codex ที่มาพร้อมในชุดจะลงทะเบียน `codex`; Plugin Anthropic ที่มาพร้อมในชุดจะมี CLI backend `claude-cli`
- `fallback`: `"pi"` หรือ `"none"` ในโหมด `id: "auto"` หากละเว้น fallback จะมีค่าเริ่มต้นเป็น `"pi"` เพื่อให้คอนฟิกเก่ายังคงใช้ PI ได้เมื่อไม่มี plugin harness ตัวใดรับช่วงการรัน ในโหมด runtime ของ Plugin แบบชัดเจน เช่น `id: "codex"` หากละเว้น fallback จะมีค่าเริ่มต้นเป็น `"none"` เพื่อให้ harness ที่หายไปล้มเหลวแทนการใช้ PI แบบเงียบ ๆ runtime override จะไม่รับช่วง fallback จากขอบเขตที่กว้างกว่า; ให้ตั้ง `fallback: "pi"` ควบคู่กับ runtime แบบชัดเจนเมื่อคุณต้องการ compatibility fallback นั้นโดยตั้งใจ ความล้มเหลวของ plugin harness ที่ถูกเลือกจะแสดงผลโดยตรงเสมอ
- การ override ผ่านตัวแปรแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะ override `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` จะ override fallback สำหรับโพรเซสนั้น
- สำหรับการติดตั้งที่ใช้ Codex เท่านั้น ให้ตั้ง `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"` คุณอาจตั้ง `agentRuntime.fallback: "none"` แบบชัดเจนเพื่อให้อ่านง่ายขึ้นได้เช่นกัน; นี่คือค่าเริ่มต้นสำหรับ runtime ของ Plugin แบบชัดเจน
- สำหรับการติดตั้งที่ใช้ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` ร่วมกับ `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดลแบบ legacy เช่น `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้ แต่คอนฟิกใหม่ควรเก็บการเลือก provider/model ไว้ในรูปแบบ canonical และย้าย execution backend ไปไว้ใน `agentRuntime.id`
- คีย์นโยบาย runtime รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือก harness จะถูกปักหมุดต่อ session id หลังจากการรันแบบ embedded ครั้งแรก การเปลี่ยนแปลงคอนฟิก/env จะมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ตแล้ว ไม่ใช่กับ transcript ที่มีอยู่เดิม เซสชันเก่าที่มีประวัติ transcript แต่ไม่มีการบันทึกการปักหมุดไว้จะถือว่าใช้ PI อยู่ `/status` จะแสดง runtime ที่มีผลจริง เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- ค่านี้ควบคุมเฉพาะการรันเทิร์นเอเจนต์แบบข้อความเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตัวเอง

**ชื่อย่อ alias ที่มาพร้อมในชุด** (มีผลเฉพาะเมื่อโมเดลนั้นอยู่ใน `agents.defaults.models`):

| Alias               | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

alias ที่คุณตั้งค่าเองจะมีสิทธิ์เหนือกว่าค่าเริ่มต้นเสมอ

โมเดล GLM-4.x ของ Z.AI จะเปิดโหมด thinking โดยอัตโนมัติ เว้นแต่คุณจะตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดลของ Z.AI จะเปิด `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีม tool call ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 จะใช้ thinking แบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งระดับ thinking ไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

CLI backend แบบเลือกได้สำหรับการรัน fallback แบบข้อความล้วน (ไม่มี tool call) มีประโยชน์เป็นตัวสำรองเมื่อ API provider ล้มเหลว

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
          // หรือใช้ systemPromptFileArg เมื่อ CLI รองรับแฟล็กสำหรับไฟล์ prompt
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- CLI backend เป็นแบบ text-first; เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อมีการตั้งค่า `sessionArg`
- รองรับ image pass-through เมื่อ `imageArg` รับ path ของไฟล์ได้

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์จะมีสิทธิ์เหนือกว่า; ค่าที่ว่างเปล่าหรือมีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลอง prompt แบบควบคุม

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

prompt overlay ที่ไม่ขึ้นกับ provider และใช้ตามตระกูลโมเดล model id ในตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมแบบใช้ร่วมกันข้าม provider; `personality` จะควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` จะเปิดเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` จะปิดเฉพาะเลเยอร์ที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 แบบติดแท็กยังคงเปิดอยู่
- ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบ legacy เมื่อยังไม่ได้ตั้งค่าร่วมนี้

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
        includeSystemPromptSection: true, // ค่าเริ่มต้น: true; false จะละเว้นส่วน Heartbeat จาก system prompt
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จากไฟล์ bootstrap ของ workspace
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะรัน Heartbeat แต่ละครั้งในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วย API key) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการ inject `HEARTBEAT.md` เข้าไปในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นเอเจนต์ของ Heartbeat ก่อนจะถูกยกเลิก หากไม่ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบ direct/DM `allow` (ค่าเริ่มต้น) อนุญาตให้ส่งตรงไปยังเป้าหมายได้ `block` จะระงับการส่งตรงและส่ง `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่ที่ไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกแบบเดียวกับ cron `sessionTarget: "isolated"` ช่วยลดต้นทุน token ต่อ Heartbeat จากประมาณ ~100K เหลือ ~2-5K token
- ต่อเอเจนต์: ตั้งค่าผ่าน `agents.list[].heartbeat` เมื่อเอเจนต์ใดก็ตามกำหนด `heartbeat` ไว้ จะมี **เฉพาะเอเจนต์เหล่านั้นเท่านั้น** ที่รัน Heartbeat
- Heartbeat จะรันเทิร์นเอเจนต์เต็มรูปแบบ — ช่วงเวลาที่สั้นลงจะใช้ token มากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id ของ Plugin provider Compaction ที่ลงทะเบียนไว้ (เลือกได้)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // ใช้เมื่อ identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        postCompactionSections: ["Session Startup", "Red Lines"], // [] จะปิดการ inject ซ้ำ
        model: "openrouter/anthropic/claude-sonnet-4-6", // override โมเดลเฉพาะ Compaction แบบเลือกได้
        notifyUser: true, // ส่งข้อความสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มต้นและเสร็จสิ้น (ค่าเริ่มต้น: false)
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

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งส่วนสำหรับประวัติที่ยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ Plugin provider Compaction ที่ลงทะเบียนไว้ เมื่อกำหนดค่านี้ ระบบจะเรียก `summarize()` ของ provider แทนการสรุปด้วย LLM ที่มาพร้อมในชุด หากล้มเหลวจะ fallback กลับไปใช้ของที่มาพร้อมในชุด การตั้ง provider จะบังคับให้ใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการทำ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณ cut-point ของ Pi สำหรับเก็บส่วนท้าย transcript ล่าสุดไว้แบบคำต่อคำ `/compact` แบบ manual จะใช้ค่านี้เมื่อมีการตั้งไว้อย่างชัดเจน; มิฉะนั้น manual Compaction จะเป็น hard checkpoint
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` ค่า `strict` จะเติมคำแนะนำการคง opaque identifier ที่มาพร้อมในชุดไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบเลือกได้สำหรับการคง identifier ซึ่งใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบ retry-on-malformed-output สำหรับสรุปแบบ safeguard เปิดอยู่เป็นค่าเริ่มต้นในโหมด safeguard; ตั้ง `enabled: false` เพื่อข้ามการตรวจสอบนี้
- `postCompactionSections`: รายชื่อส่วน H2/H3 ใน `AGENTS.md` แบบเลือกได้ที่จะ inject ซ้ำหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งเป็น `[]` เพื่อปิดการ inject ซ้ำ เมื่อไม่ตั้งค่าไว้หรือกำหนดไว้เป็นคู่ค่าเริ่มต้นดังกล่าว ระบบจะยอมรับหัวข้อ `Every Session`/`Safety` แบบเก่าเป็น fallback เพื่อความเข้ากันได้ด้วย
- `model`: override `provider/model-id` แบบเลือกได้ที่ใช้เฉพาะการสรุป Compaction ใช้สิ่งนี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่ง แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง; หากไม่ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `notifyUser`: เมื่อเป็น `true` จะส่งข้อความสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มต้นและเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นเอเจนต์แบบเงียบก่อน auto-compaction เพื่อจัดเก็บหน่วยความจำแบบถาวร จะถูกข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

### `agents.defaults.contextPruning`

ลบ **ผลลัพธ์เครื่องมือเก่า** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติเซสชันบนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยค่าเริ่มต้น: นาที
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

- `mode: "cache-ttl"` จะเปิดใช้การลบข้อมูลเป็นรอบ ๆ
- `ttl` ควบคุมว่าจะสามารถรันการลบอีกครั้งได้บ่อยแค่ไหน (หลังจากการแตะแคชครั้งล่าสุด)
- การลบข้อมูลจะเริ่มจาก soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากยังจำเป็น

**Soft-trim** จะเก็บส่วนต้น + ส่วนท้ายไว้ และแทรก `...` ตรงกลาง

**Hard-clear** จะแทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนต่าง ๆ คิดตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวน token แบบเป๊ะ
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการลบข้อมูล

</Accordion>

ดู [การลบข้อมูลเซสชัน](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

### การสตรีมแบบบล็อก

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

- channel ที่ไม่ใช่ Telegram ต้องเปิด `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดการตอบแบบบล็อก
- override ระดับ channel: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) โดยค่าเริ่มต้นของ Signal/Slack/Discord/Google Chat คือ `minChars: 1500`
- `humanDelay`: ช่วงหยุดแบบสุ่มระหว่างการตอบแบบบล็อก `natural` = 800–2500ms override ต่อเอเจนต์: `agents.list[].humanDelay`

ดู [การสตรีม](/th/concepts/streaming) สำหรับพฤติกรรมและรายละเอียดการแบ่งก้อน

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

- ค่าเริ่มต้น: `instant` สำหรับแชตส่วนตัว/การ mention โดยตรง, `message` สำหรับแชตกลุ่มที่ไม่มีการ mention
- override ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandbox แบบเลือกได้สำหรับเอเจนต์แบบ embedded ดู [Sandboxing](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม

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
          // รองรับ SecretRef / เนื้อหาแบบ inline ด้วย:
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

<Accordion title="รายละเอียด Sandbox">

**Backend:**

- `docker`: runtime Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: runtime ระยะไกลทั่วไปที่รองรับผ่าน SSH
- `openshell`: runtime ของ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะ runtime จะย้ายไปอยู่ที่
`plugins.entries.openshell.config`

**การตั้งค่า backend แบบ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งของไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รากแบบสัมบูรณ์บนเครื่องปลายทางที่ใช้สำหรับ workspace ต่อ scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่แล้วซึ่งส่งผ่านไปยัง OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบ inline หรือ SecretRef ที่ OpenClaw จะสร้างเป็นไฟล์ชั่วคราวขณะ runtime
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มควบคุมนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีสิทธิ์เหนือกว่า `identityFile`
- `certificateData` มีสิทธิ์เหนือกว่า `certificateFile`
- `knownHostsData` มีสิทธิ์เหนือกว่า `knownHostsFile`
- ค่า `*Data` ที่อ้างอิงด้วย SecretRef จะถูก resolve จาก snapshot runtime ของ secrets ที่ใช้งานอยู่ก่อนเซสชัน sandbox จะเริ่มต้น

**พฤติกรรมของ backend แบบ SSH:**

- เตรียม workspace ระยะไกลหนึ่งครั้งหลังจาก create หรือ recreate
- จากนั้นเก็บ SSH workspace ระยะไกลให้เป็นต้นฉบับหลัก
- กำหนดเส้นทาง `exec`, เครื่องมือไฟล์ และ path ของสื่อผ่าน SSH
- ไม่ซิงก์การเปลี่ยนแปลงจากระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์ browser แบบ sandbox

**การเข้าถึง Workspace:**

- `none`: sandbox workspace ต่อ scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: sandbox workspace ที่ `/workspace`, และ mount workspace ของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: mount workspace ของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: คอนเทนเนอร์ + workspace ต่อเซสชัน
- `agent`: คอนเทนเนอร์ + workspace หนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**การตั้งค่า Plugin OpenShell:**

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
          gateway: "lab", // เลือกได้
          gatewayEndpoint: "https://lab.example", // เลือกได้
          policy: "strict", // OpenShell policy id แบบเลือกได้
          providers: ["openai"], // เลือกได้
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมด OpenShell:**

- `mirror`: เตรียม remote จาก local ก่อน exec และซิงก์กลับหลัง exec; local workspace ยังคงเป็นต้นฉบับหลัก
- `remote`: เตรียม remote หนึ่งครั้งเมื่อสร้าง sandbox จากนั้นเก็บ remote workspace ให้เป็นต้นฉบับหลัก

ในโหมด `remote` การแก้ไขบนโฮสต์ในเครื่องที่ทำภายนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอนการเตรียมข้อมูล
การส่งผ่านใช้ SSH เข้าไปยัง OpenShell sandbox แต่ Plugin จะเป็นเจ้าของวงจรชีวิตของ sandbox และการซิงก์แบบ mirror ที่เป็นตัวเลือก

**`setupCommand`** จะรันหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์แล้ว (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้ และผู้ใช้ root

**ค่าเริ่มต้นของคอนเทนเนอร์คือ `network: "none"`** — ให้ตั้งเป็น `"bridge"` (หรือ bridge network แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก ส่วน `"container:<id>"` ถูกบล็อกเป็นค่าเริ่มต้น เว้นแต่คุณจะตั้ง
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ภายใน workspace ที่กำลังใช้งาน

**`docker.binds`** จะ mount ไดเรกทอรีโฮสต์เพิ่มเติม; bind ระดับส่วนกลางและต่อเอเจนต์จะถูก merge เข้าด้วยกัน

**Sandboxed browser** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ ระบบจะ inject URL ของ noVNC เข้าไปใน system prompt ไม่ต้องเปิด `browser.enabled` ใน `openclaw.json`
การเข้าถึงแบบสังเกตการณ์ผ่าน noVNC จะใช้การยืนยันตัวตนแบบ VNC เป็นค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) จะบล็อกไม่ให้เซสชันที่อยู่ใน sandbox ไปควบคุม browser ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (bridge network เฉพาะ) ให้ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบทั่วไประดับโกลบอลอย่างชัดเจน
- `cdpSourceRange` สามารถใช้จำกัด CDP ingress ที่ขอบคอนเทนเนอร์ตามช่วง CIDR ได้ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` จะ mount ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปเฉพาะในคอนเทนเนอร์ browser ของ sandbox เท่านั้น เมื่อมีการตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์ browser
- ค่าการเปิดใช้งานเริ่มต้นถูกกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับจูนมาสำหรับโฮสต์คอนเทนเนอร์:
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
  - `--disable-extensions` (เปิดใช้งานตามค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` จะ
    เปิดใช้เป็นค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้ WebGL/3D ต้องการเช่นนั้น
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` จะเปิด extensions กลับมา หากเวิร์กโฟลว์ของคุณ
    ต้องพึ่งพามัน
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้
    ขีดจำกัดโพรเซสเริ่มต้นของ Chromium
  - และจะเพิ่ม `--no-sandbox` เมื่อเปิด `noSandbox`
  - ค่าเริ่มต้นเหล่านี้เป็น baseline ของ image คอนเทนเนอร์; ใช้ browser image แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเอง หากต้องการเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำ sandbox ให้ Browser และ `sandbox.docker.binds` รองรับเฉพาะ Docker เท่านั้น

สร้าง image:

```bash
scripts/sandbox-setup.sh           # image sandbox หลัก
scripts/sandbox-browser-setup.sh   # image browser แบบเลือกได้
```

### `agents.list` (override ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มี provider, voice, model,
style หรือโหมด auto-TTS เป็นของตัวเอง บล็อกของเอเจนต์จะ deep-merge ทับ
`messages.tts` ส่วนกลาง ดังนั้นข้อมูลรับรองที่ใช้ร่วมกันสามารถเก็บไว้ที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว override เฉพาะฟิลด์ voice หรือ provider ที่ต้องใช้
override ของเอเจนต์ที่ใช้งานอยู่จะมีผลกับการตอบกลับแบบเสียงอัตโนมัติ, `/tts audio`, `/tts status` และเครื่องมือเอเจนต์ `tts` ดู [Text-to-speech](/th/tools/tts#per-agent-voice-overrides)
สำหรับตัวอย่าง provider และลำดับความสำคัญ

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
        thinkingDefault: "high", // override ระดับ thinking ต่อเอเจนต์
        reasoningDefault: "on", // override การมองเห็น reasoning ต่อเอเจนต์
        fastModeDefault: false, // override fast mode ต่อเอเจนต์
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // override params ของ defaults.models ที่ตรงกันตามคีย์
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // แทนที่ agents.defaults.skills เมื่อมีการตั้งค่า
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
- `default`: เมื่อมีการตั้งหลายตัว ระบบจะเลือกตัวแรก (และบันทึกคำเตือน) หากไม่มีการตั้งไว้ ระบบจะใช้รายการแรกใน list เป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะ override เฉพาะ `primary`; รูปแบบอ็อบเจ็กต์ `{ primary, fallbacks }` จะ override ทั้งคู่ (`[]` จะปิด global fallback) งาน cron ที่ override เฉพาะ `primary` จะยังคงรับช่วง fallback ค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: stream params ต่อเอเจนต์ที่ merge ทับบนรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override text-to-speech ต่อเอเจนต์แบบเลือกได้ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรอง provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` แล้วตั้งเฉพาะค่าที่ขึ้นกับ persona เช่น provider, voice, model, style หรือโหมดอัตโนมัติที่นี่
- `skills`: allowlist ของ Skills ต่อเอเจนต์แบบเลือกได้ หากละเว้นไว้ เอเจนต์จะรับช่วง `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; รายการที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบเลือกได้ (`off | minimal | low | medium | high | xhigh | adaptive | max`) จะ override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ระดับข้อความหรือเซสชัน ค่าที่ใช้ได้จะขึ้นกับโปรไฟล์ provider/model ที่เลือก; สำหรับ Google Gemini ค่า `adaptive` จะคงการคิดแบบไดนามิกที่ provider เป็นเจ้าของไว้ (`thinkingLevel` จะถูกละเว้นบน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบเลือกได้ (`on | off | stream`) จะมีผลเมื่อไม่มี override reasoning ระดับข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์แบบเลือกได้สำหรับโหมด fast (`true | false`) จะมีผลเมื่อไม่มี override fast-mode ระดับข้อความหรือเซสชัน
- `agentRuntime`: override นโยบาย runtime ระดับล่างต่อเอเจนต์แบบเลือกได้ ใช้ `{ id: "codex" }` เพื่อทำให้เอเจนต์หนึ่งตัวใช้ Codex เท่านั้น ขณะที่เอเจนต์อื่นยังคงใช้ PI fallback เริ่มต้นในโหมด `auto`
- `runtime`: ตัวบอกรายละเอียด runtime ต่อเอเจนต์แบบเลือกได้ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์นั้นควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: path ที่อิงกับ workspace, URL แบบ `http(s)` หรือ URI แบบ `data:`
- `identity` จะอนุมานค่าเริ่มต้นให้: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ agent id สำหรับ `sessions_spawn` (`["*"]` = ได้ทุกตัว; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน)
- ตัวป้องกันการรับช่วง sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่ทำงานแบบไม่มี sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละเว้น `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางแบบ Multi-Agent

รันเอเจนต์ที่แยกจากกันหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

### ฟิลด์การจับคู่ของ Binding

- `type` (เลือกได้): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะถือเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (เลือกได้; `*` = ทุกบัญชี; หากละเว้น = บัญชีค่าเริ่มต้น)
- `match.peer` (เลือกได้; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (เลือกได้; เฉพาะบาง channel)
- `acp` (เลือกได้; ใช้ได้เฉพาะ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ครอบคลุมทั้ง channel)
6. เอเจนต์ค่าเริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` ตัวแรกที่ตรงจะเป็นผู้ชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ตาม identity ของการสนทนาแบบ exact (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับของ route binding ข้างต้น

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="เข้าถึงได้เต็มรูปแบบ (ไม่มี sandbox)">

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

<Accordion title="เครื่องมือและ workspace แบบอ่านอย่างเดียว">

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

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (ส่งข้อความอย่างเดียว)">

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
    parentForkMaxTokens: 100000, // ข้ามการ fork thread จาก parent หากเกินจำนวน token นี้ (0 คือปิดใช้งาน)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      rotateBytes: "10mb",
      resetArchiveRetention: "30d", // ระยะเวลา หรือ false
      maxDiskBytes: "500mb", // hard budget แบบเลือกได้
      highWaterBytes: "400mb", // เป้าหมายการล้างข้อมูลแบบเลือกได้
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // การเลิกโฟกัสอัตโนมัติเมื่อไม่ใช้งานตามค่าเริ่มต้นเป็นชั่วโมง (`0` คือปิดใช้งาน)
      maxAgeHours: 0, // อายุสูงสุดแบบตายตัวตามค่าเริ่มต้นเป็นชั่วโมง (`0` คือปิดใช้งาน)
    },
    mainKey: "main", // แบบเก่า (runtime ใช้ "main" เสมอ)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์ของเซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานในการจัดกลุ่มเซสชันสำหรับบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้เซสชันที่แยกจากกันภายในบริบท channel เดียวกัน
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบท channel เดียวกันจะใช้เซสชันเดียวกัน (ใช้เฉพาะเมื่อคุณต้องการบริบทร่วมกันเท่านั้น)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม sender id ข้าม channel
  - `per-channel-peer`: แยกตาม channel + ผู้ส่ง (แนะนำสำหรับกล่องข้อความหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + channel + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แผนที่จาก canonical id ไปยัง peer ที่มี prefix ตาม provider เพื่อใช้เซสชันร่วมกันข้าม channel
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` จะรีเซ็ตตาม `atHour` ตามเวลาท้องถิ่น; `idle` จะรีเซ็ตหลัง `idleMinutes` เมื่อมีการตั้งค่าทั้งคู่ ระบบจะใช้ตัวที่หมดอายุก่อน ความใหม่ล่าสุดของการรีเซ็ตรายวันจะใช้ `sessionStartedAt` ของแถวเซสชัน; ความใหม่ล่าสุดของการรีเซ็ตเมื่อว่างงานจะใช้ `lastInteractionAt` การเขียนข้อมูลเบื้องหลัง/เหตุการณ์ของระบบ เช่น Heartbeat, การปลุกจาก cron, การแจ้งเตือน exec และการทำบัญชีของ gateway อาจอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันแบบรายวัน/เมื่อว่างงานยังใหม่อยู่
- **`resetByType`**: override ตามประเภท (`direct`, `group`, `thread`) ระบบยังยอมรับ `dm` แบบเก่าเป็น alias ของ `direct`
- **`parentForkMaxTokens`**: จำนวน `totalTokens` สูงสุดของ parent session ที่อนุญาตเมื่อสร้างเซสชัน thread แบบ fork (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของ parent สูงกว่าค่านี้ OpenClaw จะเริ่มเซสชัน thread ใหม่ แทนการรับช่วงประวัติ transcript ของ parent
  - ตั้งเป็น `0` เพื่อปิดตัวป้องกันนี้และอนุญาตการ fork จาก parent เสมอ
- **`mainKey`**: ฟิลด์แบบเก่า runtime จะใช้ `"main"` สำหรับบักเก็ตแชตส่วนตัวหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนเทิร์นตอบกลับสูงสุดระหว่างเอเจนต์ในการสื่อสารระหว่างเอเจนต์ (จำนวนเต็ม ช่วง: `0`–`5`) ค่า `0` จะปิดการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` โดยรองรับ alias แบบเก่า `dm`), `keyPrefix` หรือ `rawKeyPrefix` กฎ deny ตัวแรกที่ตรงจะมีผล
- **`maintenance`**: การล้างข้อมูลและการเก็บรักษา session-store
  - `mode`: `warn` จะส่งเฉพาะคำเตือน; `enforce` จะลงมือทำการล้างข้อมูล
  - `pruneAfter`: ขีดตัดตามอายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`)
  - `rotateBytes`: หมุนเวียน `sessions.json` เมื่อเกินขนาดนี้ (ค่าเริ่มต้น `10mb`)
  - `resetArchiveRetention`: ระยะเวลาการเก็บ archive transcript แบบ `*.reset.<timestamp>` ค่าเริ่มต้นจะใช้ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบเลือกได้ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายหลังการล้างข้อมูลงบประมาณแบบเลือกได้ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับ thread
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (provider สามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: การเลิกโฟกัสอัตโนมัติเมื่อไม่ใช้งานตามค่าเริ่มต้นเป็นชั่วโมง (`0` คือปิดใช้งาน; provider สามารถ override ได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวตามค่าเริ่มต้นเป็นชั่วโมง (`0` คือปิดใช้งาน; provider สามารถ override ได้)

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

### คำนำหน้าการตอบกลับ

override ต่อ channel/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

ลำดับการ resolve (เฉพาะเจาะจงที่สุดชนะ): account → channel → global ค่า `""` จะปิดใช้งานและหยุดการไล่ cascade ค่า `"auto"` จะอนุมานเป็น `[{identity.name}]`

**ตัวแปรใน template:**

| ตัวแปร            | คำอธิบาย               | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม    | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อ provider          | `anthropic`                 |
| `{thinkingLevel}` | ระดับ thinking ปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`)       |

ตัวแปรไม่สนตัวพิมพ์เล็กใหญ่ `{think}` เป็น alias ของ `{thinkingLevel}`

### Ack reaction

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่กำลังใช้งานอยู่ มิฉะนั้นจะเป็น `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- override ต่อ channel: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการ resolve: account → channel → `messages.ackReaction` → fallback จาก identity
- Scope: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับใน channel ที่รองรับ reaction เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้ reaction สถานะตามวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่าไว้ ระบบจะคง status reactions เปิดไว้เมื่อมี ack reactions ทำงานอยู่
  บน Telegram ต้องตั้งเป็น `true` อย่างชัดเจนเพื่อเปิด lifecycle status reactions

### Inbound debounce

รวมข้อความแบบข้อความล้วนที่ส่งมาอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็นเทิร์นเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้ามการ debounce

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
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกใช้เอง)
- API key จะ fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- provider เสียงพูดที่มาพร้อมในชุดเป็นของ Plugin หากมีการตั้ง `plugins.allow` ให้รวม Plugin provider TTS แต่ละตัวที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS ระบบยังยอมรับ provider id แบบเก่า `edge` เป็น alias ของ `microsoft`
- `providers.openai.baseUrl` จะ override ปลายทาง OpenAI TTS ลำดับการ resolve คือคอนฟิก จากนั้น `OPENAI_TTS_BASE_URL` แล้วจึง `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และจะผ่อนปรนการตรวจสอบ model/voice

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
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
  },
}
```

- `talk.provider` ต้องตรงกับคีย์หนึ่งใน `talk.providers` เมื่อมีการตั้งค่า Talk provider หลายตัว
- คีย์ Talk แบบแบนรุ่นเก่า (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- Voice ID จะ fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รองรับทั้งสตริงข้อความล้วนหรืออ็อบเจ็กต์ SecretRef
- การ fallback ของ `ELEVENLABS_API_KEY` จะมีผลเฉพาะเมื่อยังไม่ได้ตั้งค่า Talk API key
- `providers.*.voiceAliases` ช่วยให้คำสั่ง Talk ใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` ใช้เลือก Hugging Face repo ที่ตัวช่วย MLX ในเครื่องบน macOS จะใช้ หากไม่ตั้งค่า macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS จะรันผ่านตัวช่วย `openclaw-mlx-tts` ที่มาพร้อมในชุดเมื่อมี หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` จะ override path ของตัวช่วยสำหรับงานพัฒนา
- `speechLocale` กำหนด locale id แบบ BCP 47 ที่ใช้โดยระบบรู้จำเสียงพูดในโหมด Talk บน iOS/macOS หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk จะรอหลังจากผู้ใช้เงียบ ก่อนจะส่ง transcript หากไม่ตั้งค่า จะใช้ช่วงหยุดเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการตั้งค่า](/th/gateway/configuration-reference) — คีย์การตั้งค่าอื่นทั้งหมด
- [การตั้งค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการตั้งค่า](/th/gateway/configuration-examples)
