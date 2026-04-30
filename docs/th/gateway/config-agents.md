---
read_when:
    - การปรับค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดสนทนา
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่าการพูดคุย
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-04-30T16:27:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6a38f42c35c6c6e46d6d00ad710c6c80d78703e0b7e3388f5631cf91eb17084
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าตามขอบเขตเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ของ Gateway และคีย์ระดับบนสุดอื่นๆ
ดู [การอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รูทของคลังเก็บที่ระบุได้ ซึ่งจะแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist เริ่มต้นของ Skills ที่ระบุได้ สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // inherits github, weather
      { id: "docs", skills: ["docs-search"] }, // replaces defaults
      { id: "locked-down", skills: [] }, // no skills
    ],
  },
}
```

- ละ `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่ถูกรวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมเวลาที่ไฟล์ bootstrap ของ workspace ถูกฉีดเข้าไปใน system prompt ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการดำเนินต่อที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสิ้นแล้ว) จะข้ามการฉีด bootstrap ของ workspace ซ้ำ ช่วยลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction จะยังคงสร้างบริบทใหม่
- `"never"`: ปิดการฉีด bootstrap ของ workspace และไฟล์บริบทในทุกเทิร์น ใช้ค่านี้เฉพาะกับเอเจนต์ที่ควบคุมวงจรชีวิตของ prompt เองทั้งหมด (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ต้องใช้ bootstrap) เทิร์น Heartbeat และการกู้คืนจาก Compaction จะข้ามการฉีดด้วยเช่นกัน

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

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์เห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความเตือนเข้าไปใน system prompt
- `"once"`: ฉีดคำเตือนหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดคำเตือนทุกครั้งที่รันเมื่อมีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณ prompt/บริบทปริมาณสูงหลายส่วน และมีการ
แยกตามระบบย่อยอย่างตั้งใจ แทนที่จะให้ทั้งหมดไหลผ่านสวิตช์ทั่วไปตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude ของการรันโมเดลแบบครั้งเดียวสำหรับ reset/startup รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชทเปล่า `/new` และ `/reset` จะ
  ถูกตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบกะทัดรัดที่ฉีดเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  ส่วนคัดย่อรันไทม์ที่มีขอบเขตและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  ขนาด snippet ของการค้นหาหน่วยความจำที่ทำดัชนีแล้วและขนาดการฉีด

ใช้ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการงบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude เริ่มต้นของเทิร์นแรกที่ฉีดเข้าไปในการรันโมเดลแบบ reset/startup
คำสั่งแชทเปล่า `/new` และ `/reset` จะตอบรับการ reset โดยไม่เรียกใช้
โมเดล ดังนั้นจึงไม่โหลด prelude นี้

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

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทรันไทม์ที่มีขอบเขต

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

- `memoryGetMaxChars`: ขีดจำกัดส่วนคัดย่อเริ่มต้นของ `memory_get` ก่อนเพิ่ม
  เมตาดาต้าการตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ `lines`
- `toolResultMaxChars`: ขีดจำกัดผลลัพธ์เครื่องมือแบบสดที่ใช้กับผลลัพธ์ที่บันทึกไว้และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: ขีดจำกัดส่วนคัดย่อ AGENTS.md ที่ใช้ระหว่างการฉีด
  การรีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

override ต่อเอเจนต์สำหรับสวิตช์ `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
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

ขีดจำกัดส่วนกลางสำหรับรายการ Skills แบบกะทัดรัดที่ฉีดเข้าไปใน system prompt ค่านี้
ไม่กระทบการอ่านไฟล์ `SKILL.md` ตามต้องการ

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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/tool ก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำลงมักลดการใช้โทเค็นวิชันและขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงขึ้นจะเก็บรายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบท system prompt (ไม่ใช่ timestamp ของข้อความ) หากไม่มีจะ fallback ไปยังเขตเวลาของโฮสต์

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
      params: { cacheRetention: "long" }, // global default provider params
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      reasoningDefault: "off",
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
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับสำหรับการสลับเมื่อเกิดข้อผิดพลาด
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นคอนฟิกโมเดลวิชัน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - ควรใช้ refs แบบ `provider/model` ที่ระบุชัดเจน รองรับ ID แบบสั้นเพื่อความเข้ากันได้; หาก ID แบบสั้นตรงกับรายการที่คอนฟิกไว้ซึ่งรองรับรูปภาพใน `models.providers.*.models` แบบไม่ซ้ำ OpenClaw จะเติมผู้ให้บริการนั้นให้ รายการที่คอนฟิกไว้ซึ่งตรงกันแบบกำกวมต้องมีคำนำหน้าผู้ให้บริการที่ระบุชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพแบบแชร์และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้คอนฟิกการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนที่เหลือตามลำดับรหัสผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงแบบแชร์และเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับรหัสผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้คอนฟิกการยืนยันตัวตน/API key ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอแบบแชร์และเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนที่เหลือตามลำดับรหัสผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้คอนฟิกการยืนยันตัวตน/API key ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่บันเดิลมารองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะถอยกลับไปใช้ `imageModel` แล้วจึงใช้โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve ได้
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ในเวลาที่เรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองของการแยกข้อมูลในเครื่องมือ `pdf` พิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` ค่า `agents.list[].reasoningDefault` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่คอนฟิกไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่ได้ตั้งค่า override reasoning ระดับข้อความหรือเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละผู้ให้บริการ OpenClaw จะลอง alias ก่อน จากนั้นลองรายการตรงกันของผู้ให้บริการที่คอนฟิกไว้แบบไม่ซ้ำสำหรับรหัสโมเดลที่ตรงกันพอดี และหลังจากนั้นเท่านั้นจึงถอยกลับไปใช้ผู้ให้บริการเริ่มต้นที่คอนฟิกไว้ (พฤติกรรมเพื่อความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` ที่ระบุชัดเจน) หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่คอนฟิกไว้แล้ว OpenClaw จะถอยกลับไปใช้ผู้ให้บริการ/โมเดลแรกที่คอนฟิกไว้ แทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้วซึ่งค้างอยู่
- `models`: แค็ตตาล็อกโมเดลที่คอนฟิกไว้และรายการอนุญาตสำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการอนุญาตที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่ scoped ตามผู้ให้บริการจะผสานโมเดลของผู้ให้บริการที่เลือกเข้าในแมปนี้ และคงผู้ให้บริการอื่นที่คอนฟิกไว้แล้วซึ่งไม่เกี่ยวข้องไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการ inject `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อ override threshold ดู [OpenAI Compaction ฝั่งเซิร์ฟเวอร์](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นแบบ global ที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญของการผสาน `params` (คอนฟิก): `agents.defaults.params` (ฐาน global) จะถูกแทนที่ด้วย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (รหัสเอเจนต์ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดที่ [การแคชพรอมป์](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ผสานเข้าใน request body ของ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์ request ที่สร้างขึ้น extra body จะชนะ; เส้นทาง completions ที่ไม่ใช่เนทีฟจะยังคงตัด `store` ที่มีเฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้าใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` ที่ปิด thinking, Plugin vLLM ที่บันเดิลมาจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับตัวควบคุม thinking ของ vLLM Qwen ให้ตั้ง `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รองรับจริง; จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง, แถวเซสชัน Gateway, การตรวจสอบ session patch, การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่คอนฟิกนั้น ใช้ `compat.reasoningEffortMap` เมื่อ backend ต้องการค่าที่เฉพาะผู้ให้บริการสำหรับระดับ canonical
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับ preserved thinking เมื่อเปิดใช้และ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และ replay `reasoning_content` ก่อนหน้า; ดู [thinking และ preserved thinking ของ Z.AI](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำเริ่มต้น รหัสที่ละไว้จะใช้ OpenClaw Pi เป็นค่าเริ่มต้น ใช้ `id: "pi"` เพื่อบังคับใช้ PI harness ในตัว, `id: "auto"` เพื่อให้ plugin harness ที่ลงทะเบียนอ้างสิทธิ์โมเดลที่รองรับ, รหัส harness ที่ลงทะเบียน เช่น `id: "codex"` หรือ alias ของ CLI backend ที่รองรับ เช่น `id: "claude-cli"` ตั้งค่า `fallback: "none"` เพื่อปิด fallback อัตโนมัติเป็น PI รันไทม์ Plugin ที่ระบุชัดเจน เช่น `codex` จะ fail closed เป็นค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallback: "pi"` ในขอบเขต override เดียวกัน คง refs โมเดลให้อยู่ในรูป canonical เป็น `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และ execution backend อื่นผ่านคอนฟิกรันไทม์ แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเดิม ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สำหรับความแตกต่างจากการเลือกผู้ให้บริการ/โมเดล
- ตัวเขียนคอนฟิกที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์ canonical และคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์ขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serialize อยู่) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุม executor ระดับต่ำที่จะรัน turn ของเอเจนต์ การใช้งานส่วนใหญ่
ควรคงรันไทม์ OpenClaw Pi ค่าเริ่มต้นไว้ ใช้เมื่อ Plugin ที่เชื่อถือได้
มี native harness เช่น Codex app-server harness ที่บันเดิลมา
หรือเมื่อคุณต้องการ CLI backend ที่รองรับ เช่น Claude CLI สำหรับภาพรวมแนวคิด
ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, รหัส plugin harness ที่ลงทะเบียน หรือ alias ของ CLI backend ที่รองรับ Plugin Codex ที่บันเดิลมาจะลงทะเบียน `codex`; Plugin Anthropic ที่บันเดิลมามี CLI backend `claude-cli`
- `fallback`: `"pi"` หรือ `"none"` ใน `id: "auto"` ค่า fallback ที่ละไว้จะใช้ `"pi"` เป็นค่าเริ่มต้น เพื่อให้คอนฟิกเก่ายังใช้ PI ได้เมื่อไม่มี plugin harness ใดอ้างสิทธิ์การรัน ในโหมดรันไทม์ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` ค่า fallback ที่ละไว้จะใช้ `"none"` เป็นค่าเริ่มต้น เพื่อให้ harness ที่ขาดหายล้มเหลว แทนการใช้ PI อย่างเงียบๆ Runtime override จะไม่สืบทอด fallback จากขอบเขตที่กว้างกว่า; ตั้ง `fallback: "pi"` พร้อมกับรันไทม์ที่ระบุชัดเจนเมื่อคุณตั้งใจต้องการ fallback เพื่อความเข้ากันได้นั้น ความล้มเหลวของ plugin harness ที่เลือกจะแสดงโดยตรงเสมอ
- Environment overrides: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะแทนที่ `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` จะแทนที่ fallback สำหรับ process นั้น
- สำหรับ deployment ที่ใช้ Codex เท่านั้น ให้ตั้ง `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"` คุณอาจตั้ง `agentRuntime.fallback: "none"` อย่างชัดเจนด้วยเพื่อให้อ่านง่าย; ค่านี้เป็นค่าเริ่มต้นสำหรับรันไทม์ Plugin ที่ระบุชัดเจน
- สำหรับ deployment ที่ใช้ Claude CLI ให้ใช้ `model: "anthropic/claude-opus-4-7"` ร่วมกับ `agentRuntime.id: "claude-cli"` refs โมเดลแบบเดิม `claude-cli/claude-opus-4-7` ยังคงทำงานเพื่อความเข้ากันได้ แต่คอนฟิกใหม่ควรคงการเลือกผู้ให้บริการ/โมเดลไว้เป็น canonical และใส่ execution backend ใน `agentRuntime.id`
- คีย์ runtime-policy รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือก harness จะถูกตรึงตามรหัสเซสชันหลังจากการรัน embedded ครั้งแรก การเปลี่ยนแปลงคอนฟิก/env จะมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ transcript ที่มีอยู่ เซสชันแบบเดิมที่มีประวัติ transcript แต่ไม่มี pin ที่บันทึกไว้จะถือว่าถูก pin เป็น PI `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการ text agent-turn การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตน

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง               | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

นามแฝงที่คุณกำหนดค่าไว้จะมีผลเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมดการคิดโดยอัตโนมัติ เว้นแต่คุณตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งระดับการคิดไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI ทางเลือกสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกเครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
          // Or use systemPromptFileArg when the CLI accepts a prompt file flag.
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- แบ็กเอนด์ CLI เน้นข้อความเป็นหลัก เครื่องมือจะถูกปิดใช้เสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์ได้

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือรายเอเจนต์ (`agents.list[].systemPromptOverride`) ค่ารายเอเจนต์มีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

โอเวอร์เลย์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์สไตล์การโต้ตอบที่เป็นมิตรเท่านั้น

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้เลเยอร์สไตล์การโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้เฉพาะเลเยอร์ที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้อยู่
- ค่าเดิม `plugins.entries.openai.config.personality` จะยังถูกอ่านเมื่อยังไม่ได้ตั้งค่าร่วมนี้

### `agents.defaults.heartbeat`

การรัน Heartbeat เป็นระยะ

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m disables
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // default: true; false omits the Heartbeat section from the system prompt
        lightContext: false, // default: false; true keeps only HEARTBEAT.md from workspace bootstrap files
        isolatedSession: false, // default: false; true runs each heartbeat in a fresh session (no conversation history)
        skipWhenBusy: false, // default: false; true also waits for subagent/nested lanes
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (default) | block
        target: "none", // default: none | options: last | whatsapp | telegram | discord | ...
        prompt: "Read HEARTBEAT.md if it exists...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตน OAuth) ตั้งเป็น `0m` เพื่อปิดใช้
- `includeSystemPromptSection`: เมื่อเป็น false จะละส่วน Heartbeat ออกจาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของเอเจนต์ Heartbeat ก่อนจะถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งโดยตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและส่งออก `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม: งานคำสั่งย่อยหรือคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- รายเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดก็ตามกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat รันเทิร์นเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้โทเค็นมากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 900,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional Pi tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // [] disables reinjection
        model: "openrouter/anthropic/claude-sonnet-4-6", // optional compaction-only model override
        truncateAfterCompaction: true, // rotate to a smaller successor JSONL after compaction
        maxActiveTranscriptBytes: "20mb", // optional preflight local compaction trigger
        notifyUser: true, // send brief notices when compaction starts and completes (default: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // optional memory-flush-only model override
          softThresholdTokens: 6000,
          systemPrompt: "Session nearing compaction. Store durable memories now.",
          prompt: "Write any lasting notes to memory/YYYY-MM-DD.md; reply with the exact silent token NO_REPLY if nothing to store.",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งชิ้นสำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่า จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction ครั้งเดียวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดแบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นจุดตรวจแบบตายตัว
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเพิ่มคำแนะนำในตัวสำหรับการเก็บรักษาตัวระบุแบบทึบไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองทางเลือกสำหรับการรักษาตัวระบุ ซึ่งใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตมีรูปแบบผิดสำหรับสรุป safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของ tool-loop ของ Pi แบบทางเลือก เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากต่อผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำ เพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ใน AGENTS.md แบบทางเลือกที่จะฉีดกลับหลัง Compaction ค่าเริ่มต้นเป็น `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งไว้อย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อเก่า `Every Session`/`Safety` จะยังยอมรับเป็น fallback แบบเดิมด้วย
- `model`: การ override `provider/model-id` ทางเลือกสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์จำนวนไบต์ทางเลือก (`number` หรือสตริงอย่าง `"20mb"`) ที่กระตุ้น Compaction ภายในเครื่องแบบปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์รุ่นต่อที่เล็กกว่าได้ ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้นๆ ไปยังผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "กำลังบีบอัดบริบท..." และ "Compaction เสร็จสิ้น") ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นเอเจนต์แบบเงียบก่อน auto-compaction เพื่อจัดเก็บความทรงจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลแบบตรง เช่น `ollama/qwen3:8b` เมื่อเทิร์นงานดูแลนี้ควรอยู่บนโมเดลภายในเครื่อง การ override จะไม่สืบทอด fallback chain ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

### `agents.defaults.contextPruning`

ตัด **ผลลัพธ์เครื่องมือเก่า** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM **ไม่** แก้ไขประวัติเซสชันบนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // duration (ms/s/m/h), default unit: minutes
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

<Accordion title="พฤติกรรมโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้รอบการตัด
- `ttl` ควบคุมว่าการตัดจะรันซ้ำได้บ่อยแค่ไหน (หลังการแตะแคชครั้งล่าสุด)
- การตัดจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือเก่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัด/ล้าง
- อัตราส่วนอิงตามตัวอักษร (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความผู้ช่วยน้อยกว่า `keepLastAssistants` ข้อความ การตัดจะถูกข้าม

</Accordion>

ดู [การตัดเซสชัน](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

### การสตรีมบล็อก

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200 },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off | natural | custom (use minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การแทนที่ค่าระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การแทนที่ค่าต่อเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรมและการแบ่งชิ้นข้อความได้ที่ [Streaming](/th/concepts/streaming)

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

- ค่าเริ่มต้น: `instant` สำหรับแชตโดยตรง/การกล่าวถึง, `message` สำหรับแชตกลุ่มที่ไม่ได้กล่าวถึง
- การแทนที่ค่าต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [Typing Indicators](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำแซนด์บ็อกซ์เสริมสำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มได้ที่ [Sandboxing](/th/gateway/sandboxing)

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
          // SecretRefs / inline contents also supported:
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

<Accordion title="Sandbox details">

**แบ็กเอนด์:**

- `docker`: รันไทม์ Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่รองรับด้วย SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การกำหนดค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซต่อขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวตอนรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบายคีย์โฮสต์ของ OpenSSH

**ลำดับความสำคัญการยืนยันตัวตน SSH:**

- `identityData` ชนะ `identityFile`
- `certificateData` ชนะ `certificateFile`
- `knownHostsData` ชนะ `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูกแก้ค่าจากสแนปช็อตรันไทม์ความลับที่ใช้งานอยู่ก่อนเริ่มเซสชันแซนด์บ็อกซ์

**พฤติกรรมแบ็กเอนด์ SSH:**

- ป้อนข้อมูลตั้งต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นรักษาเวิร์กสเปซ SSH ระยะไกลให้เป็นแหล่งหลัก
- ส่ง `exec`, เครื่องมือไฟล์ และเส้นทางสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับไปยังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์ต่อขอบเขตใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เมานต์เวิร์กสเปซเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์และเวิร์กสเปซต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์และเวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และเวิร์กสเปซที่ใช้ร่วมกัน (ไม่มีการแยกโดดเดี่ยวข้ามเซสชัน)

**การกำหนดค่า Plugin OpenShell:**

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
          gateway: "lab", // optional
          gatewayEndpoint: "https://lab.example", // optional
          policy: "strict", // optional OpenShell policy id
          providers: ["openai"], // optional
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมด OpenShell:**

- `mirror`: ป้อนข้อมูลจากเครื่องในพื้นที่ไปยังระยะไกลก่อน exec, ซิงค์กลับหลัง exec; เวิร์กสเปซในพื้นที่ยังคงเป็นแหล่งหลัก
- `remote`: ป้อนข้อมูลระยะไกลหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ จากนั้นรักษาเวิร์กสเปซระยะไกลให้เป็นแหล่งหลัก

ในโหมด `remote` การแก้ไขในเครื่องโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้าแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนการป้อนข้อมูลตั้งต้น
การขนส่งใช้ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตแซนด์บ็อกซ์และการซิงค์แบบ mirror ที่เป็นทางเลือก

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมีการเชื่อมต่อเครือข่ายออก, รูทที่เขียนได้, ผู้ใช้ root

**คอนเทนเนอร์ใช้ค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องเข้าถึงภายนอก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (ทางเลือกฉุกเฉิน)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; การผูกแบบส่วนกลางและต่อเอเจนต์จะถูกรวมกัน

**เบราว์เซอร์แซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้าไปในพรอมป์ต์ระบบ ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงแบบผู้สังเกตการณ์ noVNC ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะออก URL โทเคนที่มีอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันแซนด์บ็อกซ์ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` ใช้ค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อบริดจ์ส่วนกลางอย่างชัดเจน
- `cdpSourceRange` จำกัดการรับเข้า CDP ที่ขอบคอนเทนเนอร์ให้เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นการเปิดใช้งานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับโฮสต์คอนเทนเนอร์:
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
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu`
    เปิดใช้ตามค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องใช้
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหากเวิร์กโฟลว์ของคุณ
    ต้องพึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดกระบวนการ
    ค่าเริ่มต้นของ Chromium
  - เพิ่ม `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือฐานของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (การแทนที่ค่าต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของตัวเอง บล็อกเอเจนต์จะ deep-merge ทับค่า
`messages.tts` ส่วนกลาง ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันจึงอยู่ในที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ การแทนที่ค่าของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับด้วยเสียงอัตโนมัติ, `/tts audio`, `/tts status`, และ
เครื่องมือเอเจนต์ `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญได้ที่ [Text-to-speech](/th/tools/tts#per-agent-voice-overrides)

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
        model: "anthropic/claude-opus-4-6", // or { primary, fallbacks }
        thinkingDefault: "high", // per-agent thinking level override
        reasoningDefault: "on", // per-agent reasoning visibility override
        fastModeDefault: false, // per-agent fast mode override
        agentRuntime: { id: "auto", fallback: "pi" },
        params: { cacheRetention: "none" }, // overrides matching defaults.models params by key
        tts: {
          providers: {
            elevenlabs: { voiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // replaces agents.defaults.skills when set
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

- `id`: รหัสเอเจนต์ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะมีผล (มีการบันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้งค่า primary เฉพาะเอเจนต์แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้เอเจนต์นั้นเลือกใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเข้มงวดให้ชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมเฉพาะเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override text-to-speech เฉพาะเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองของ provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` แล้วตั้งเฉพาะค่าที่เกี่ยวกับ persona เช่น provider, voice, model, style หรือ auto mode ไว้ที่นี่
- `skills`: allowlist ของ Skills เฉพาะเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนที่จะ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นเฉพาะเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้งค่า override ต่อข้อความหรือต่อเซสชัน โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้ใน Gemini 3/3.1, `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นเฉพาะเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้งค่า override reasoning ต่อข้อความหรือต่อเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นเฉพาะเอเจนต์สำหรับ fast mode แบบไม่บังคับ (`true | false`) ใช้เมื่อไม่ได้ตั้งค่า override fast-mode ต่อข้อความหรือต่อเซสชัน
- `agentRuntime`: override นโยบาย runtime ระดับต่ำเฉพาะเอเจนต์แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex-only ขณะที่เอเจนต์อื่นยังคงใช้ PI fallback เริ่มต้นในโหมด `auto`
- `runtime`: ตัวบรรยาย runtime เฉพาะเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรมีค่าเริ่มต้นเป็นเซสชัน ACP harness
- `identity.avatar`: พาธที่สัมพันธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` สร้างค่าเริ่มต้นจาก: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของรหัสเอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) รวมรหัสผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่ชี้กลับไปยังตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true ให้บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางแบบหลายเอเจนต์

รันเอเจนต์ที่แยกกันหลายตัวภายใน Gateway เดียว ดู [หลายเอเจนต์](/th/concepts/multi-agent)

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

### ฟิลด์การจับคู่ binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่ขาดหายไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันทุกประการ ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้ง channel)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะมีผล

สำหรับรายการ `type: "acp"`, OpenClaw จะ resolve ด้วย identity ของการสนทนาที่ตรงกันทุกประการ (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับ route binding ด้านบน

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)">

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

<Accordion title="เครื่องมือแบบอ่านอย่างเดียว + workspace">

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [Sandbox และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
    maintenance: {
      mode: "warn", // warn | enforce
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // duration or false
      maxDiskBytes: "500mb", // optional hard budget
      highWaterBytes: "400mb", // optional cleanup target
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // default inactivity auto-unfocus in hours (`0` disables)
      maxAgeHours: 0, // default hard max age in hours (`0` disables)
    },
    mainKey: "main", // legacy (runtime always uses "main")
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์เซสชัน">

- **`scope`**: กลยุทธ์การจัดกลุ่มเซสชันพื้นฐานสำหรับบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้รับเซสชันแยกภายในบริบทช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องจดหมายผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: จับคู่รหัส canonical กับ peer ที่มีคำนำหน้าผู้ให้บริการ เพื่อแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แผนที่เดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยัง peer ช่องทางอื่นที่เชื่อมโยงไว้ ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดทั้งสองอย่าง ค่าใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อไม่มีการใช้งานใช้ `lastInteractionAt` การเขียนจากพื้นหลัง/เหตุการณ์ระบบ เช่น heartbeat, cron wakeups, การแจ้งเตือน exec และการจัดเก็บข้อมูลของ gateway สามารถอัปเดต `updatedAt` ได้ แต่ไม่ได้ทำให้เซสชัน daily/idle คงความสดใหม่
- **`resetByType`**: การ override แยกตามประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็น alias ของ `direct`
- **`parentForkMaxTokens`**: ค่า `totalTokens` สูงสุดของเซสชันแม่ที่อนุญาตเมื่อสร้างเซสชันเธรดแบบ fork (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของเซสชันแม่สูงกว่าค่านี้ OpenClaw จะเริ่มเซสชันเธรดใหม่แทนการสืบทอดประวัติ transcript ของเซสชันแม่
  - ตั้งเป็น `0` เพื่อปิด guard นี้และอนุญาตให้ fork จากเซสชันแม่เสมอ
- **`mainKey`**: ฟิลด์เดิม Runtime ใช้ `"main"` สำหรับบัคเก็ตแชตโดยตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับไปมาสูงสุดระหว่าง agent ระหว่างการแลกเปลี่ยน agent-to-agent (จำนวนเต็ม, ช่วง: `0`–`5`) `0` ปิดการเชื่อมโยงแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` พร้อม alias เดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธแรกมีผลก่อน
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงคำเตือนเท่านั้น; `enforce` ใช้การล้างข้อมูลจริง
  - `pruneAfter`: ขีดจำกัดอายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลแบบ batch พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับเพดานระดับ production; `openclaw sessions cleanup --enforce` ใช้เพดานทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจาก config เก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษา archive transcript `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifacts/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของการ auto-unfocus เมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถ override ได้)
  - `maxAgeHours`: อายุสูงสุดแบบบังคับค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถ override ได้)

</Accordion>

---

## ข้อความ

```json5
{
  messages: {
    responsePrefix: "🦞", // or "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer | queue (legacy one-at-a-time) | followup | collect | steer-backlog | steer+backlog | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "steer",
        telegram: "steer",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 disables
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### คำนำหน้าการตอบกลับ

การ override แยกตามช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การเลือกค่า (ค่าที่เฉพาะเจาะจงที่สุดมีผลก่อน): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุด cascade `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปร Template:**

| ตัวแปร            | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | --------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น      | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม   | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ      | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน   | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของ agent | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่สนตัวพิมพ์เล็กใหญ่ `{think}` เป็น alias ของ `{thinkingLevel}`

### Reaction รับทราบ

- ค่าเริ่มต้นเป็น `identity.emoji` ของ agent ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- การ override แยกตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการเลือกค่า: บัญชี → ช่องทาง → `messages.ackReaction` → fallback จาก identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับบนช่องทางที่รองรับ reaction เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้งาน reaction สถานะ lifecycle บน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่า จะคงการเปิดใช้งาน reaction สถานะไว้เมื่อ ack reaction ทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งาน reaction สถานะ lifecycle

### Debounce ขาเข้า

รวมข้อความตัวอักษรล้วนที่เข้ามาอย่างรวดเร็วจากผู้ส่งเดียวกันให้เป็น agent turn เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมข้ามการ debounce

### TTS (แปลงข้อความเป็นเสียงพูด)

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถ override prefs ภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` override `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานโดยค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้อง opt-in)
- API key fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่มาพร้อมระบบเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รหัสผู้ให้บริการเดิม `edge` รองรับเป็น alias ของ `microsoft`
- `providers.openai.baseUrl` override endpoint OpenAI TTS ลำดับการเลือกค่าคือ config, จากนั้น `OPENAI_TTS_BASE_URL`, จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบ model/voice

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

- `talk.provider` ต้องตรงกับ key ใน `talk.providers` เมื่อกำหนดผู้ให้บริการ Talk หลายตัว
- key Talk แบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อความเข้ากันได้เท่านั้น และจะถูก auto-migrate ไปยัง `talk.providers.<provider>`
- Voice ID fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับ string แบบ plaintext หรือ object SecretRef
- fallback `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนด Talk API key
- `providers.*.voiceAliases` ให้คำสั่ง Talk ใช้ชื่อที่อ่านง่ายได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ helper MLX ภายในเครื่องของ macOS ใช้ หากไม่ได้ระบุ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่าน helper `openclaw-mlx-tts` ที่มาพร้อมระบบเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` override path ของ helper สำหรับการพัฒนา
- `speechLocale` ตั้งค่า id locale BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของ Talk บน iOS/macOS เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ได้ตั้งค่าจะคงช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — key config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าแบบรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
