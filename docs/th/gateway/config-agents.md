---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกแบบหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดสนทนา
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-02T10:15:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 559bb427555768c91720bac10ee60bf2ba5a081117b741a02c140b14267ce1bf
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับแชนเนล เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่น ๆ
ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รูทของรีพอสิทอรีที่เป็นตัวเลือกเสริม ซึ่งแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นที่เป็นตัวเลือกเสริมสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละ `agents.defaults.skills` เพื่อให้ใช้ Skills ได้ไม่จำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างเปล่าคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์ bootstrap ของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซที่เป็นตัวเลือกเสริมที่เลือกไว้ โดยยังคงเขียนไฟล์ bootstrap ที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

```json5
{
  agents: {
    defaults: {
      skipOptionalBootstrapFiles: ["SOUL.md", "USER.md"],
    },
  },
}
```

### `agents.defaults.contextInjection`

ควบคุมเวลาที่ไฟล์ bootstrap ของเวิร์กสเปซจะถูกฉีดเข้าไปใน system prompt ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากคำตอบของ assistant เสร็จสมบูรณ์แล้ว) จะข้ามการฉีด bootstrap ของเวิร์กสเปซซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองซ้ำหลัง Compaction ยังคงสร้าง context ใหม่
- `"never"`: ปิดใช้งาน bootstrap ของเวิร์กสเปซและการฉีดไฟล์ context ในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิต prompt ของตนเองทั้งหมดเท่านั้น (เอนจิน context แบบกำหนดเอง, รันไทม์เนทีฟที่สร้าง context เอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และเทิร์นกู้คืนหลัง Compaction จะข้ามการฉีดด้วยเช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของเวิร์กสเปซก่อนถูกตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของเวิร์กสเปซทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นเมื่อ context ของ bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความเตือนเข้าไปใน system prompt
- `"once"`: ฉีดคำเตือนหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดคำเตือนทุกครั้งที่รันเมื่อมีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณ context

OpenClaw มีงบประมาณ prompt/context ปริมาณสูงหลายรายการ และงบประมาณเหล่านี้ถูก
แยกตามระบบย่อยโดยตั้งใจ แทนที่จะไหลผ่านปุ่มควบคุมทั่วไปเพียงปุ่มเดียวทั้งหมด

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของเวิร์กสเปซตามปกติ
- `agents.defaults.startupContext.*`:
  prelude การรันโมเดลแบบครั้งเดียวเมื่อ reset/startup รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชทเปล่า `/new` และ `/reset` จะได้รับ
  การตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบกระชับที่ฉีดเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนรันไทม์ที่มีขอบเขตและบล็อกที่ฉีดซึ่งเป็นของรันไทม์
- `memory.qmd.limits.*`:
  ขนาด snippet การค้นหา memory ที่ทำดัชนีแล้วและการฉีด

ใช้ override รายเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการงบประมาณที่แตกต่าง:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude เริ่มต้นในเทิร์นแรกที่ฉีดเข้าไปในการรันโมเดลเมื่อ reset/startup
คำสั่งแชทเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิว context รันไทม์ที่มีขอบเขต

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

- `memoryGetMaxChars`: เพดานข้อความตัดตอน `memory_get` เริ่มต้นก่อนเพิ่ม
  metadata การตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัด `memory_get` เริ่มต้นเมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดที่ใช้สำหรับผลลัพธ์ที่คงอยู่และ
  การกู้คืนเมื่อเกินขีดจำกัด
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการฉีด
  refresh หลัง Compaction

#### `agents.list[].contextLimits`

override รายเอเจนต์สำหรับปุ่มควบคุม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานส่วนกลางสำหรับรายการ Skills แบบกระชับที่ฉีดเข้าไปใน system prompt สิ่งนี้
ไม่มีผลต่อการอ่านไฟล์ `SKILL.md` ตามต้องการ

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

override รายเอเจนต์สำหรับงบประมาณ prompt ของ Skills

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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/tool ก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มี screenshot จำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับ context ของ system prompt (ไม่ใช่ timestamp ของข้อความ) ถอยกลับไปใช้เขตเวลาของโฮสต์

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
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับเมื่อเกิดความล้มเหลว
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดล vision
  - ใช้เป็นเส้นทางสำรองด้วยเมื่อโมเดลที่เลือก/โมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบยังรับ ID แบบไม่มีผู้ให้บริการเพื่อความเข้ากันได้ หาก ID แบบไม่มีผู้ให้บริการตรงกับรายการที่กำหนดค่าไว้และรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติมผู้ให้บริการนั้นให้ หากมีรายการที่กำหนดค่าไว้ตรงกันหลายรายการ ต้องระบุคำนำหน้าผู้ให้บริการอย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพแบบใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการให้ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังคงอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังคงอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการให้ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังคงอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการให้ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่มาพร้อมชุดรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะสำรองไปที่ `imageModel` แล้วจึงไปที่โมเดลเซสชัน/โมเดลเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ในขณะเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` ค่า `agents.list[].reasoningDefault` รายเอเจนต์จะ override ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกนำไปใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่ได้ตั้งค่า override reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับ elevated-output เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละผู้ให้บริการไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองการจับคู่ผู้ให้บริการที่กำหนดค่าไว้เพียงรายการเดียวสำหรับ ID โมเดลที่ตรงกันนั้น และหลังจากนั้นเท่านั้นจึงสำรองไปที่ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมเพื่อความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่มีโมเดลเริ่มต้นที่กำหนดค่าไว้แล้ว OpenClaw จะสำรองไปที่ผู้ให้บริการ/โมเดลรายการแรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบซึ่งล้าสมัย
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่ทำให้รายการ allowlist ที่มีอยู่ถูกลบ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์การกำหนดค่า/onboarding ที่อยู่ในขอบเขตผู้ให้บริการจะ merge โมเดลผู้ให้บริการที่เลือกเข้าในแผนที่นี้และคงผู้ให้บริการที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะถูกเปิดใช้โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการ inject `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อ override ค่า threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการเริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการ merge ของ `params` (config): `agents.defaults.params` (ฐานส่วนกลาง) จะถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID เอเจนต์ที่ตรงกัน) จะ override ตามคีย์ ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON ส่งผ่านขั้นสูงที่ merge เข้าใน request body ของ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น extra body จะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` ที่มีเฉพาะ OpenAI ออกหลังจากนั้น
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking Plugin vLLM ที่มาพร้อมชุดจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุชัดเจนจะ override ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับการควบคุม Qwen thinking ของ vLLM ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการ reasoning effort รายโมเดลที่เข้ากันได้กับ OpenAI ใส่ `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รองรับจริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบ session patch การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อ backend ต้องการค่าเฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับ thinking ที่เก็บรักษาไว้ เมื่อเปิดใช้และเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [Z.AI thinking and preserved thinking](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำเริ่มต้น หากละ ID ค่าเริ่มต้นคือ OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ harness PI ในตัว, `id: "auto"` เพื่อให้ harness ของ Plugin ที่ลงทะเบียนไว้อ้างสิทธิ์โมเดลที่รองรับ, ID harness ที่ลงทะเบียนไว้ เช่น `id: "codex"` หรือ alias ของ backend CLI ที่รองรับ เช่น `id: "claude-cli"` ตั้งค่า `fallback: "none"` เพื่อปิดการสำรองไปยัง PI โดยอัตโนมัติ รันไทม์ Plugin ที่ระบุชัดเจน เช่น `codex` จะล้มเหลวแบบปิดโดยค่าเริ่มต้น เว้นแต่คุณตั้งค่า `fallback: "pi"` ในขอบเขต override เดียวกัน เก็บการอ้างอิงโมเดลให้เป็นมาตรฐานในรูปแบบ `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และ backend การดำเนินการอื่นผ่าน config รันไทม์แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเดิม ดู [Agent runtimes](/th/concepts/agent-runtimes) เพื่อดูว่าสิ่งนี้ต่างจากการเลือกผู้ให้บริการ/โมเดลอย่างไร
- ตัวเขียน config ที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์มาตรฐานและคงรายการ fallback ที่มีอยู่ไว้เมื่อทำได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบเรียงลำดับ) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมว่าตัวดำเนินการระดับต่ำใดจะรันรอบการทำงานของเอเจนต์ การ deploy ส่วนใหญ่ควรใช้รันไทม์ OpenClaw Pi เริ่มต้นต่อไป ใช้ตัวเลือกนี้เมื่อ Plugin ที่เชื่อถือได้มี harness แบบเนทีฟ เช่น harness app-server ของ Codex ที่มาพร้อมชุด หรือเมื่อคุณต้องการ backend CLI ที่รองรับ เช่น Claude CLI สำหรับ mental model ดู [Agent runtimes](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, ID harness ของ Plugin ที่ลงทะเบียนไว้ หรือ alias ของ backend CLI ที่รองรับ Plugin Codex ที่มาพร้อมชุดลงทะเบียน `codex`; Plugin Anthropic ที่มาพร้อมชุดมี backend CLI `claude-cli`
- `fallback`: `"pi"` หรือ `"none"` ใน `id: "auto"` ค่า fallback ที่ละไว้จะเริ่มต้นเป็น `"pi"` เพื่อให้ config เก่ายังคงใช้ PI ได้เมื่อไม่มี harness ของ Plugin อ้างสิทธิ์การรัน ในโหมดรันไทม์ Plugin แบบชัดเจน เช่น `id: "codex"` ค่า fallback ที่ละไว้จะเริ่มต้นเป็น `"none"` เพื่อให้ harness ที่หายไปล้มเหลวแทนการใช้ PI แบบเงียบ ๆ runtime override จะไม่สืบทอด fallback จากขอบเขตที่กว้างกว่า ตั้งค่า `fallback: "pi"` ควบคู่กับรันไทม์ที่ระบุชัดเจนเมื่อคุณตั้งใจต้องการ fallback เพื่อความเข้ากันได้นั้น ความล้มเหลวของ harness Plugin ที่เลือกจะแสดงโดยตรงเสมอ
- การ override ด้วยสภาพแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` override `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` override fallback สำหรับโปรเซสนั้น
- สำหรับการ deploy ที่ใช้ Codex เท่านั้น ให้ตั้งค่า `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"` คุณอาจตั้งค่า `agentRuntime.fallback: "none"` อย่างชัดเจนเพื่อให้อ่านง่ายด้วยก็ได้ ซึ่งเป็นค่าเริ่มต้นสำหรับรันไทม์ Plugin แบบชัดเจน
- สำหรับการ deploy ที่ใช้ Claude CLI ให้ใช้ `model: "anthropic/claude-opus-4-7"` ร่วมกับ `agentRuntime.id: "claude-cli"` เป็นหลัก การอ้างอิงโมเดล `claude-cli/claude-opus-4-7` แบบเดิมยังใช้งานได้เพื่อความเข้ากันได้ แต่ config ใหม่ควรเก็บการเลือกผู้ให้บริการ/โมเดลให้เป็นมาตรฐานและใส่ backend การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือก harness จะถูกตรึงตาม ID เซสชันหลังการรันแบบฝังครั้งแรก การเปลี่ยนแปลง config/env จะมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ transcript ที่มีอยู่ เซสชันเดิมที่มีประวัติ transcript แต่ไม่มี pin ที่บันทึกไว้จะถูกถือว่าตรึงกับ PI `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการรอบการทำงานของเอเจนต์ข้อความเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตัวเอง

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง              | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

นามแฝงที่คุณกำหนดค่าไว้จะมีสิทธิ์เหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมดการคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตัวเอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดอย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI ทางเลือกสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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

- แบ็กเอนด์ CLI เน้นข้อความก่อนเสมอ เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับเส้นทางไฟล์

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อ agent (`agents.list[].systemPromptOverride`) ค่าต่อ agent มีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีเฉพาะช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลอง prompt แบบควบคุม

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

prompt overlay ที่ไม่ขึ้นกับผู้ให้บริการ ใช้ตามตระกูลโมเดล id โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้เลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้เฉพาะเลเยอร์ที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งานอยู่
- `plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านเมื่อไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าสู่บริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับ turn ของ Heartbeat agent ก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งโดยตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K token
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปบนช่องงานที่ยุ่งเพิ่มเติม: งาน subagent หรือคำสั่งซ้อน ช่องงาน Cron จะเลื่อน Heartbeat ออกไปเสมอ แม้ไม่มี flag นี้
- ต่อ agent: ตั้งค่า `agents.list[].heartbeat` เมื่อ agent ใดก็ตามกำหนด `heartbeat` จะมี **เฉพาะ agent เหล่านั้น** ที่รัน Heartbeat
- Heartbeat จะรัน turn ของ agent แบบเต็ม ช่วงเวลาที่สั้นลงจะใช้ token มากขึ้น

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

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่ง chunk สำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะ fallback ไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction ครั้งเดียวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้าย transcript ล่าสุดแบบ verbatim การ `/compact` แบบ manual จะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น manual compaction จะเป็น checkpoint แบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงไว้ซึ่งตัวระบุแบบทึบไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบทางเลือกสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบ retry-on-malformed-output สำหรับสรุปแบบ safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการ audit
- `midTurnPrecheck`: การตรวจสอบแรงกดดัน tool-loop ของ Pi แบบทางเลือก เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังเพิ่มผลลัพธ์เครื่องมือและก่อนเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่ง prompt และนำเส้นทางกู้คืน precheck ที่มีอยู่กลับมาใช้เพื่อตัดผลลัพธ์เครื่องมือหรือทำ compact แล้วลองใหม่ ทำงานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบทางเลือกที่จะฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้การฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าเป็นคู่ค่าเริ่มต้นนั้นอย่างชัดเจน หัวข้อ `Every Session`/`Safety` แบบเก่าก็จะถูกรับเป็น fallback สำหรับความเข้ากันได้ย้อนหลังด้วย
- `model`: การ override `provider/model-id` แบบทางเลือกสำหรับการสรุป Compaction เท่านั้น ใช้เมื่อเซสชันหลักควรคงไว้ที่โมเดลหนึ่ง แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: threshold แบบ byte ทางเลือก (`number` หรือสตริงอย่าง `"20mb"`) ที่ trigger Compaction แบบ local ปกติก่อนการรันเมื่อ JSONL ที่ active โตเกิน threshold ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยัง transcript ตัวถัดไปที่เล็กกว่าได้ ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ถึงผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: turn แบบ agentic เงียบก่อน auto-compaction เพื่อจัดเก็บความทรงจำถาวร ตั้งค่า `model` เป็น provider/model ที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อ turn งาน housekeeping นี้ควรอยู่บนโมเดล local การ override จะไม่สืบทอด fallback chain ของเซสชันที่ active ข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

### `agents.defaults.contextPruning`

ตัดแต่ง **ผลลัพธ์เครื่องมือเก่า** จากบริบทในหน่วยความจำก่อนส่งไปยัง LLM **ไม่** แก้ไขประวัติเซสชันบนดิสก์

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` เปิดใช้รอบการตัดแต่ง
- `ttl` ควบคุมว่าการตัดแต่งจะรันซ้ำได้บ่อยแค่ไหน (หลังจากแตะ cache ครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวน token ที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัดแต่ง

</Accordion>

ดู [การตัดแต่งเซสชัน](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

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
- การเขียนทับรายช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรรายบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การเขียนทับรายเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรมและการแบ่งชังก์ได้ที่ [การสตรีม](/th/concepts/streaming)

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

- ค่าเริ่มต้น: `instant` สำหรับแชทโดยตรง/การกล่าวถึง, `message` สำหรับแชทกลุ่มที่ไม่ได้กล่าวถึง
- การเขียนทับรายเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำ sandboxing แบบไม่บังคับสำหรับเอเจนต์แบบฝังตัว ดูคู่มือฉบับเต็มที่ [Sandboxing](/th/gateway/sandboxing)

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

- `docker`: รันไทม์ Docker ภายในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่ใช้ SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การกำหนดค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบ absolute ที่ใช้สำหรับเวิร์กสเปซรายสโคป
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw materializes เป็นไฟล์ชั่วคราวตอนรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญการยืนยันตัวตน SSH:**

- `identityData` ชนะ `identityFile`
- `certificateData` ชนะ `certificateFile`
- `knownHostsData` ชนะ `knownHostsFile`
- ค่า `*Data` ที่อ้างอิงผ่าน SecretRef จะถูกแปลงจากสแนปช็อตรันไทม์ secrets ที่ใช้งานอยู่ก่อนที่เซสชัน sandbox จะเริ่ม

**พฤติกรรมแบ็กเอนด์ SSH:**

- seed เวิร์กสเปซระยะไกลหนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นคงให้เวิร์กสเปซ SSH ระยะไกลเป็น canonical
- ส่งเส้นทาง `exec`, เครื่องมือไฟล์ และเส้นทางสื่อผ่าน SSH
- ไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับไปยังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์ sandbox browser

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซ sandbox รายสโคปใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซ sandbox ที่ `/workspace`, เมานต์เวิร์กสเปซเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**สโคป:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซรายเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + เวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และเวิร์กสเปซที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

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

- `mirror`: seed ระยะไกลจากภายในเครื่องก่อน exec, ซิงก์กลับหลัง exec; เวิร์กสเปซภายในเครื่องยังคงเป็น canonical
- `remote`: seed ระยะไกลหนึ่งครั้งเมื่อสร้าง sandbox แล้วคงให้เวิร์กสเปซระยะไกลเป็น canonical

ในโหมด `remote` การแก้ไขภายในเครื่องโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งคือ SSH เข้าไปยัง sandbox ของ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตของ sandbox และการซิงก์ mirror แบบไม่บังคับ

**`setupCommand`** รันหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, รูทที่เขียนได้ และผู้ใช้ root

**คอนเทนเนอร์ใช้ค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; binds ระดับ global และรายเอเจนต์จะถูกผสานกัน

**เบราว์เซอร์แบบ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงผู้สังเกตการณ์ noVNC ใช้การยืนยันตัวตน VNC ตามค่าเริ่มต้น และ OpenClaw จะปล่อย URL token อายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันแบบ sandbox ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` ใช้ค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ global bridge อย่างชัดเจน
- `cdpSourceRange` จำกัด ingress ของ CDP ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์ sandbox browser เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
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
    เปิดใช้ตามค่าเริ่มต้น และปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากต้องใช้ WebGL/3D
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้ง หาก workflow ของคุณ
    พึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดโปรเซส
    เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำ sandboxing สำหรับเบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout โปรดดูคำสั่ง `docker build` แบบอินไลน์ที่ [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การเขียนทับรายเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของตัวเอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันจึงอยู่ที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
เขียนทับเฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ การเขียนทับของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับด้วยเสียงอัตโนมัติ, `/tts audio`, `/tts status`, และ
เครื่องมือเอเจนต์ `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญได้ที่ [ข้อความเป็นเสียงพูด](/th/tools/tts#per-agent-voice-overrides)

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

- `id`: id เอเจนต์ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกชนะ (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้งค่าหลักต่อเอเจนต์แบบเข้มงวดโดยไม่มีโมเดลสำรอง; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้เอเจนต์นั้นใช้การสำรอง หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` ยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้งค่า `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override text-to-speech ต่อเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการร่วมและนโยบาย fallback ไว้ใน `messages.tts` และตั้งค่าเฉพาะค่าที่เฉพาะกับบุคลิก เช่น provider, voice, model, style หรือ auto mode ที่นี่
- `skills`: allowlist ของ Skills ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดเริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกจะควบคุมว่าค่าใดถูกต้อง; สำหรับ Google Gemini, `adaptive` จะคงการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของไว้ (`thinkingLevel` จะถูกละไว้ใน Gemini 3/3.1, `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การมองเห็นเหตุผลเริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override เหตุผลต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับโหมดเร็วแบบไม่บังคับ (`true | false`) ใช้เมื่อไม่มี override โหมดเร็วต่อข้อความหรือเซสชัน
- `agentRuntime`: override นโยบายรันไทม์ระดับต่ำต่อเอเจนต์แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex-only ขณะที่เอเจนต์อื่นยังคง PI fallback เริ่มต้นในโหมด `auto`
- `runtime`: ตัวอธิบายรันไทม์ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธสัมพัทธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` จะอนุมานค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` แบบระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) รวม id ผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่ชี้เข้าตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่มี sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

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

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะใช้ route เป็นค่าเริ่มต้น), `acp` สำหรับ binding การสนทนา ACP แบบคงอยู่
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันพอดี, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"`, OpenClaw จะ resolve ตามตัวตนการสนทนาที่ตรงกันพอดี (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับ route binding ด้านบน

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="การเข้าถึงเต็มรูปแบบ (ไม่มี sandbox)">

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

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (ส่งข้อความเท่านั้น)">

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

ดู [Sandbox และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดลำดับความสำคัญ

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

- **`scope`**: กลยุทธ์การจัดกลุ่มเซสชันพื้นฐานสำหรับบริบทแชทกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันแยกต่างหากภายในบริบทช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม id ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความแบบหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป id มาตรฐานกับเพียร์ที่มีคำนำหน้าผู้ให้บริการสำหรับการแชร์เซสชันข้ามช่องทาง คำสั่งด็อก เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางการตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางอื่นที่ลิงก์ไว้; ดู [การด็อกช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตที่เวลาท้องถิ่น `atHour`; `idle` รีเซ็ตหลังผ่านไป `idleMinutes` เมื่อกำหนดค่าทั้งคู่ ตัวใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, Cron wakeup, การแจ้งเตือน exec และงานบันทึกสถานะของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันรายวัน/เมื่อไม่ได้ใช้งานยังคงสดใหม่
- **`resetByType`**: การแทนที่รายประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็นนามแฝงของ `direct`
- **`mainKey`**: ฟิลด์แบบเดิม Runtime ใช้ `"main"` สำหรับบักเก็ตแชทตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบการตอบกลับไปมาสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ต่อเอเจนต์ (จำนวนเต็ม, ช่วง: `0`–`5`) `0` ปิดการเชื่อมต่อแบบปิงปอง
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, พร้อมนามแฝงแบบเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธแรกมีผลก่อน
- **`maintenance`**: ตัวควบคุมการล้าง session-store + การเก็บรักษา
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลเป็นชุดพร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษา transcript archive แบบ `*.reset.<timestamp>` ค่าเริ่มต้นคือ `pruneAfter`; ตั้งเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: เวลาไม่มีกิจกรรมเริ่มต้นสำหรับการยกเลิกโฟกัสอัตโนมัติเป็นชั่วโมง (`0` ปิด; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวเริ่มต้นเป็นชั่วโมง (`0` ปิด; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตเริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรดของ ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบท subagent แบบ native เริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

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

การแทนที่รายช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การเลือกค่า (ค่าที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดและหยุดการไล่ค่าต่อ `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย            | ตัวอย่าง                    |
| ----------------- | ------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น    | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ    | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อข้อมูลประจำตัวของเอเจนต์ | (เหมือนกับ `"auto"`)          |

ตัวแปรไม่สนตัวพิมพ์เล็กใหญ่ `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### รีแอ็กชันรับทราบ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้ง `""` เพื่อปิด
- การแทนที่รายช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการเลือกค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่าสำรองจากข้อมูลประจำตัว
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบรีแอ็กชันรับทราบหลังตอบกลับบนช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้รีแอ็กชันสถานะวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่าไว้ จะเปิดใช้รีแอ็กชันสถานะเมื่อรีแอ็กชันรับทราบใช้งานอยู่
  บน Telegram ให้ตั้งเป็น `true` อย่างชัดเจนเพื่อเปิดใช้รีแอ็กชันสถานะวงจรชีวิต

### การหน่วงข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่เข้ามาเร็วจากผู้ส่งคนเดียวกันเป็นรอบเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมข้ามการหน่วง

### TTS (ข้อความเป็นเสียงพูด)

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผล
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกใช้)
- API key fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่บันเดิลมาด้วยเป็นของ Plugin หากตั้ง `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รองรับ id ผู้ให้บริการแบบเดิม `edge` เป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint TTS ของ OpenAI ลำดับการเลือกค่าคือคอนฟิก จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนคลายการตรวจสอบโมเดล/เสียง

---

## โหมดพูดคุย

ค่าเริ่มต้นสำหรับโหมดพูดคุย (macOS/iOS/Android)

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการโหมดพูดคุยหลายตัว
- คีย์โหมดพูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น และถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- Voice ID fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความธรรมดาหรืออ็อบเจกต์ SecretRef
- `ELEVENLABS_API_KEY` fallback ใช้เฉพาะเมื่อไม่ได้กำหนดค่า API key สำหรับโหมดพูดคุย
- `providers.*.voiceAliases` ช่วยให้ directive ของโหมดพูดคุยใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo ของ Hugging Face ที่ helper MLX ในเครื่องของ macOS ใช้ หากไม่ระบุ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่าน helper `openclaw-mlx-tts` ที่บันเดิลมาด้วยเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธ helper สำหรับการพัฒนา
- `speechLocale` ตั้งค่า id โลแคล BCP 47 ที่การรู้จำเสียงพูดโหมดพูดคุยของ iOS/macOS ใช้ หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดพูดคุยรอหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่า จะใช้หน้าต่างพักเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์คอนฟิกอื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
