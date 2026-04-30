---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกแบบหลายเอเจนต์
    - การปรับเซสชัน การส่งข้อความ และพฤติกรรมของโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่าการสนทนา
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-04-30T09:50:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 61f2d33ae1d3f4ce07636ae4584b9e344fd14e8e08a2612bb1f39ed71c99c25a
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตต่อเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากของ repository ที่เป็นทางเลือก ซึ่งแสดงในบรรทัด Runtime ของพรอมป์ต์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นด้านบนจากพื้นที่ทำงาน

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist เริ่มต้นที่เป็นทางเลือกสำหรับ Skills สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่ถูกรวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์ bootstrap ของพื้นที่ทำงานโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.contextInjection`

ควบคุมว่าไฟล์ bootstrap ของพื้นที่ทำงานจะถูกฉีดเข้าไปในพรอมป์ต์ระบบเมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการดำเนินต่อที่ปลอดภัย (หลังจากคำตอบของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีด bootstrap ของพื้นที่ทำงานซ้ำ เพื่อลดขนาดพรอมป์ต์ การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งาน bootstrap ของพื้นที่ทำงานและการฉีดไฟล์บริบทในทุกเทิร์น ใช้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิตพรอมป์ต์ของตนเองทั้งหมด (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทของตนเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และการกู้คืนจาก Compaction จะข้ามการฉีดด้วยเช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของพื้นที่ทำงานก่อนการตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของพื้นที่ทำงานทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความเตือนเข้าไปในพรอมป์ต์ระบบ
- `"once"`: ฉีดคำเตือนหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดคำเตือนทุกครั้งที่รันเมื่อมีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบบริบท

OpenClaw มีงบพรอมป์ต์/บริบทปริมาณสูงหลายชุด และถูก
แยกตามระบบย่อยโดยตั้งใจ แทนที่จะให้ทั้งหมดไหลผ่าน
ตัวควบคุมทั่วไปตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของพื้นที่ทำงานตามปกติ
- `agents.defaults.startupContext.*`:
  prelude สำหรับการรันโมเดลตอนรีเซ็ต/เริ่มต้นแบบครั้งเดียว รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับ
  การตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมป์ต์ระบบ
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนของรันไทม์แบบมีขอบเขต และบล็อกที่เป็นของรันไทม์ซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  snippet การค้นหาหน่วยความจำที่ทำดัชนีแล้ว และการกำหนดขนาดการฉีด

ใช้การ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบที่แตกต่าง:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude ตอนเริ่มเทิร์นแรกที่ถูกฉีดในการรันโมเดลเมื่อรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
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

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทรันไทม์แบบมีขอบเขต

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

- `memoryGetMaxChars`: ขีดจำกัดค่าเริ่มต้นของข้อความตัดตอน `memory_get` ก่อนเพิ่ม
  metadata การตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัดค่าเริ่มต้นของ `memory_get` เมื่อมีการละ `lines`
- `toolResultMaxChars`: ขีดจำกัดผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่ถูกบันทึกถาวรและ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: ขีดจำกัดข้อความตัดตอนของ AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การ override ต่อเอเจนต์สำหรับตัวควบคุม `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
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

ขีดจำกัดส่วนกลางสำหรับรายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมป์ต์ระบบ ค่านี้
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

การ override ต่อเอเจนต์สำหรับงบพรอมป์ต์ Skills

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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/เครื่องมือก่อนการเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะคงรายละเอียดภาพไว้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมป์ต์ระบบ (ไม่ใช่ timestamp ของข้อความ) จะ fallback เป็นเขตเวลาของ host

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาในพรอมป์ต์ระบบ ค่าเริ่มต้น: `auto` (การตั้งค่าของ OS)

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
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับเมื่อสลับใช้งานเมื่อขัดข้อง
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - ควรใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบยอมรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่รองรับรูปภาพซึ่งกำหนดค่าไว้ใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติมคุณสมบัติให้เป็นผู้ให้บริการนั้น หากตรงกับค่าที่กำหนดไว้หลายรายการอย่างคลุมเครือ ต้องใช้คำนำหน้าผู้ให้บริการแบบชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพแบบใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกัน และเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกัน และเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่รวมมาให้รองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะถอยกลับไปใช้ `imageModel` แล้วจึงใช้โมเดลที่แก้ค่าแล้วของเซสชัน/ค่าเริ่มต้น
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF ค่าเริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดค่าเริ่มต้นที่โหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose ค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `reasoningDefault`: การมองเห็น reasoning ค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` ค่า `agents.list[].reasoningDefault` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการตั้งค่าแทนที่ reasoning รายข้อความหรือเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตยกระดับค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วยคีย์ API หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละผู้ให้บริการไว้ OpenClaw จะลอง alias ก่อน จากนั้นลองจับคู่ผู้ให้บริการที่กำหนดไว้ซึ่งมีโมเดล ID ตรงกันแบบไม่ซ้ำ และจึงค่อยถอยกลับไปใช้ผู้ให้บริการค่าเริ่มต้นที่กำหนดไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้ผู้ให้บริการ/โมเดลที่กำหนดไว้รายการแรก แทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการเก่าที่ถูกนำออกแล้ว
- `models`: แคตตาล็อกโมเดลและ allowlist ที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่ทำให้รายการ allowlist เดิมถูกลบ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์การกำหนดค่า/เริ่มใช้งานที่มีขอบเขตตามผู้ให้บริการจะผสานโมเดลของผู้ให้บริการที่เลือกเข้าในแผนที่นี้ และคงผู้ให้บริการที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้อัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่ threshold ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นแบบโกลบอลที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการผสาน `params` (การกำหนดค่า): `agents.defaults.params` (ฐานโกลบอล) ถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID เอเจนต์ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ผสานเข้าใน body คำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น extra body จะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` ที่ใช้เฉพาะกับ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้าใน body คำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking แล้ว Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีลำดับความสำคัญสุดท้าย สำหรับการควบคุม thinking ของ vLLM Qwen ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการ reasoning effort รายโมเดลที่เข้ากันได้กับ OpenAI ใส่ `"xhigh"` สำหรับปลายทางแบบกำหนดเองที่รองรับจริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบแพตช์เซสชัน การตรวจสอบ CLI เอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่านั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับ thinking ที่เก็บรักษาไว้ เมื่อเปิดใช้งานและเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [thinking ของ Z.AI และ thinking ที่เก็บรักษาไว้](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำค่าเริ่มต้น หากละ ID ค่าเริ่มต้นคือ OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ฮาร์เนส PI ในตัว, `id: "auto"` เพื่อให้ฮาร์เนส Plugin ที่ลงทะเบียนอ้างสิทธิ์โมเดลที่รองรับ, ID ฮาร์เนสที่ลงทะเบียน เช่น `id: "codex"` หรือ alias แบ็กเอนด์ CLI ที่รองรับ เช่น `id: "claude-cli"` ตั้งค่า `fallback: "none"` เพื่อปิดการถอยกลับอัตโนมัติไปยัง PI รันไทม์ Plugin แบบชัดเจน เช่น `codex` จะล้มเหลวแบบปิดโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า `fallback: "pi"` ในขอบเขตการแทนที่เดียวกัน คงการอ้างอิงโมเดลให้เป็นรูปแบบมาตรฐาน `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และแบ็กเอนด์การดำเนินการอื่นๆ ผ่านการกำหนดค่ารันไทม์แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเดิม ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) เพื่อทำความเข้าใจว่าสิ่งนี้ต่างจากการเลือกผู้ให้บริการ/โมเดลอย่างไร
- ตัวเขียนการกำหนดค่าที่เปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์มาตรฐาน และคงรายการ fallback เดิมไว้เมื่อทำได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงถูกทำให้เป็นลำดับเดียวกัน) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมตัวดำเนินการระดับต่ำที่จะรัน turn ของเอเจนต์ การปรับใช้ส่วนใหญ่ควรคงรันไทม์ OpenClaw Pi ค่าเริ่มต้นไว้ ใช้เมื่อ Plugin ที่เชื่อถือได้มีฮาร์เนสเนทีฟ เช่น ฮาร์เนส app-server ของ Codex ที่รวมมาให้ หรือเมื่อคุณต้องการแบ็กเอนด์ CLI ที่รองรับ เช่น Claude CLI สำหรับโมเดลแนวคิด ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, ID ฮาร์เนส Plugin ที่ลงทะเบียน หรือ alias แบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้ลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้มีแบ็กเอนด์ CLI `claude-cli`
- `fallback`: `"pi"` หรือ `"none"` ใน `id: "auto"` fallback ที่ละไว้จะมีค่าเริ่มต้นเป็น `"pi"` เพื่อให้การกำหนดค่าเก่ายังใช้ PI ได้เมื่อไม่มีฮาร์เนส Plugin ใดอ้างสิทธิ์การรัน ในโหมดรันไทม์ Plugin แบบชัดเจน เช่น `id: "codex"` fallback ที่ละไว้จะมีค่าเริ่มต้นเป็น `"none"` เพื่อให้ฮาร์เนสที่ขาดหายล้มเหลวแทนที่จะใช้ PI อย่างเงียบๆ การแทนที่รันไทม์จะไม่สืบทอด fallback จากขอบเขตที่กว้างกว่า ให้ตั้งค่า `fallback: "pi"` ควบคู่กับรันไทม์แบบชัดเจนเมื่อคุณต้องการ fallback เพื่อความเข้ากันได้นั้นโดยตั้งใจ ความล้มเหลวของฮาร์เนส Plugin ที่เลือกจะแสดงโดยตรงเสมอ
- การแทนที่ด้วยสภาพแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะแทนที่ `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` จะแทนที่ fallback สำหรับโปรเซสนั้น
- สำหรับการปรับใช้ที่ใช้ Codex เท่านั้น ให้ตั้งค่า `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"` คุณอาจตั้งค่า `agentRuntime.fallback: "none"` อย่างชัดเจนเพื่อให้อ่านง่ายได้ด้วย ซึ่งเป็นค่าเริ่มต้นสำหรับรันไทม์ Plugin แบบชัดเจน
- สำหรับการปรับใช้ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดลแบบเดิม `claude-cli/claude-opus-4-7` ยังทำงานเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรคงการเลือกผู้ให้บริการ/โมเดลให้เป็นรูปแบบมาตรฐาน และใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- ตัวเลือกฮาร์เนสจะถูกตรึงตาม ID เซสชันหลังการรันแบบฝังครั้งแรก การเปลี่ยนแปลง config/env มีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ transcript ที่มีอยู่แล้ว เซสชันเดิมที่มีประวัติ transcript แต่ไม่มี pin ที่บันทึกไว้จะถือว่าถูกตรึงไว้กับ PI `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการ turn ของเอเจนต์ข้อความเท่านั้น การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตนเอง

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง               | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

นามแฝงที่คุณกำหนดค่าจะมีผลเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้งานโหมดคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI จะเปิดใช้งาน `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI เสริมสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกเครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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

- แบ็กเอนด์ CLI ให้ความสำคัญกับข้อความก่อนเสมอ เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อมีการตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์ได้

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

โอเวอร์เลย์ prompt ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งนำไปใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมที่ใช้ร่วมกันข้ามผู้ให้บริการ `personality` ควบคุมเฉพาะชั้นสไตล์การโต้ตอบที่เป็นมิตรเท่านั้น

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้งานชั้นสไตล์การโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้งานเฉพาะชั้นที่เป็นมิตรเท่านั้น สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งานอยู่
- `plugins.entries.openai.config.personality` แบบเดิมจะยังคงถูกอ่านเมื่อไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับหนึ่งรอบของ Heartbeat agent ก่อนที่จะถูกยกเลิก หากไม่ได้ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปในเลนที่ยุ่งเพิ่มเติม: งาน subagent หรืองานคำสั่งแบบซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ต่อ agent: ตั้งค่า `agents.list[].heartbeat` เมื่อ agent ใดก็ตามกำหนด `heartbeat` **เฉพาะ agent เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat จะรันรอบ agent เต็มรูปแบบ ช่วงเวลาที่สั้นกว่าจะใช้โทเค็นมากกว่า

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
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อกำหนดไว้ จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้ระบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction ครั้งเดียวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัด Pi สำหรับเก็บส่วนท้าย transcript ล่าสุดไว้ตามต้นฉบับ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อมีการตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็น checkpoint แบบตายตัว
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุแบบ opaque ไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองเสริมสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตผิดรูปสำหรับสรุป safeguard เปิดใช้งานเป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบเสริมที่จะฉีดกลับหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าเป็นคู่ค่าเริ่มต้นนั้นอย่างชัดเจน หัวข้อ `Every Session`/`Safety` แบบเก่าจะได้รับการยอมรับเป็น fallback สำหรับ legacy ด้วย
- `model`: การ override `provider/model-id` แบบเสริมสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรคงใช้โมเดลหนึ่ง แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์จำนวนไบต์แบบเสริม (`number` หรือสตริงอย่าง `"20mb"`) ที่กระตุ้น Compaction ภายในเครื่องตามปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่มีขนาดเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยัง transcript ถัดไปที่เล็กกว่าได้ ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งการแจ้งสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มต้นและเมื่อเสร็จสิ้น (ตัวอย่างเช่น "กำลังย่อบริบท..." และ "Compaction เสร็จสมบูรณ์") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction ทำงานเงียบ
- `memoryFlush`: รอบ agentic แบบเงียบก่อน auto-compaction เพื่อจัดเก็บความจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อรอบดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การ override จะไม่สืบทอดลำดับ fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

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

<Accordion title="พฤติกรรมโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้งานรอบการตัดแต่ง
- `ttl` ควบคุมความถี่ที่การตัดแต่งสามารถรันซ้ำได้ (หลังการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บจุดเริ่มต้น + จุดสิ้นสุด และแทรก `...` ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` การตัดแต่งจะถูกข้าม

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

- ช่องทางที่ไม่ใช่ Telegram ต้องใช้ `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้งานการตอบกลับแบบบล็อก
- การ override ระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override ต่อ agent: `agents.list[].humanDelay`

ดู [การสตรีม](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรม + การแบ่งชิ้น

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
- การเขียนทับรายเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำแซนด์บ็อกซ์แบบไม่บังคับสำหรับเอเจนต์ที่ฝังอยู่ ดูคู่มือฉบับเต็มที่ [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

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
- `workspaceRoot`: รูทรระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซตามขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw ทำให้เป็นไฟล์ชั่วคราวในขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบายคีย์โฮสต์ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` ชนะ `identityFile`
- `certificateData` ชนะ `certificateFile`
- `knownHostsData` ชนะ `knownHostsFile`
- ค่าที่อิง SecretRef ของ `*Data` จะถูกแก้ค่าจากสแนปช็อตรันไทม์ของความลับที่ใช้งานอยู่ก่อนเซสชันแซนด์บ็อกซ์เริ่มต้น

**พฤติกรรมแบ็กเอนด์ SSH:**

- ป้อนข้อมูลเริ่มต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงให้เวิร์กสเปซ SSH ระยะไกลเป็นแหล่งอ้างอิงหลัก
- ส่ง `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์ตามขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เวิร์กสเปซเอเจนต์ถูกเมานต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เวิร์กสเปซเอเจนต์ถูกเมานต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซต่อเซสชัน
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

- `mirror`: ป้อนข้อมูลจากภายในเครื่องไปยังระยะไกลก่อน exec แล้วซิงค์กลับหลัง exec; เวิร์กสเปซภายในเครื่องยังเป็นแหล่งอ้างอิงหลัก
- `remote`: ป้อนข้อมูลไปยังระยะไกลหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ แล้วคงให้เวิร์กสเปซระยะไกลเป็นแหล่งอ้างอิงหลัก

ในโหมด `remote` การแก้ไขบนโฮสต์ภายในเครื่องที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้าไปในแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนป้อนข้อมูลเริ่มต้น
ทรานสปอร์ตคือ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตแซนด์บ็อกซ์และการซิงค์แบบมิเรอร์ที่เป็นทางเลือก

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมีทางออกเครือข่าย, รูทรที่เขียนได้, ผู้ใช้ root

**ค่าเริ่มต้นของคอนเทนเนอร์คือ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกตามค่าเริ่มต้น เว้นแต่คุณตั้ง
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (สำหรับกรณีฉุกเฉิน)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; การผูกแบบส่วนกลางและต่อเอเจนต์จะถูกผสานกัน

**เบราว์เซอร์ในแซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้าในพรอมป์ระบบ ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC แบบผู้สังเกตการณ์ใช้การยืนยันตัวตน VNC ตามค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันในแซนด์บ็อกซ์ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อบริดจ์แบบทั่วโลกอย่างชัดเจน
- `cdpSourceRange` จำกัดทางเข้าของ CDP ที่ขอบคอนเทนเนอร์ให้เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) จะใช้แทน `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นการเริ่มทำงานถูกกำหนดใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับโฮสต์คอนเทนเนอร์:
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
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` ถูก
    เปิดใช้ตามค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหากเวิร์กโฟลว์ของคุณ
    พึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดกระบวนการ
    เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือค่าฐานของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (การเขียนทับต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด TTS อัตโนมัติเป็นของตัวเอง บล็อกเอเจนต์จะผสานเชิงลึกทับ
`messages.tts` ส่วนกลาง ดังนั้นข้อมูลประจำตัวที่แชร์สามารถอยู่ในที่เดียว ขณะที่เอเจนต์แต่ละตัว
เขียนทับเฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ การเขียนทับของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับแบบพูดอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญที่ [ข้อความเป็นเสียงพูด](/th/tools/tts#per-agent-voice-overrides)

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

- `id`: รหัส agent ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้งค่า primary ต่อ agent แบบเข้มงวดโดยไม่มีการ fallback ของโมเดล; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้ agent นั้นใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเข้มงวดอย่างชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณตั้งค่า `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อ agent ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับ override เฉพาะ agent เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำสำเนาแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override text-to-speech ต่อ agent แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรอง provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` แล้วตั้งเฉพาะค่าที่เจาะจง persona เช่น provider, voice, model, style หรือโหมด auto ที่นี่
- `skills`: allowlist ของ skill ต่อ agent แบบไม่บังคับ หากละไว้ agent จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; ลิสต์ที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นแทนการผสาน และ `[]` หมายถึงไม่มี skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อ agent แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับ agent นี้เมื่อไม่มี override ต่อข้อความหรือ session ตั้งไว้ โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดถูกต้อง; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้ใน Gemini 3/3.1, `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การแสดง reasoning เริ่มต้นต่อ agent แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับ agent นี้เมื่อไม่มี override reasoning ต่อข้อความหรือ session ตั้งไว้
- `fastModeDefault`: ค่าเริ่มต้นต่อ agent สำหรับโหมดเร็วแบบไม่บังคับ (`true | false`) ใช้เมื่อไม่มี override fast-mode ต่อข้อความหรือ session ตั้งไว้
- `agentRuntime`: override นโยบาย runtime ระดับต่ำต่อ agent แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้ agent หนึ่งเป็น Codex เท่านั้น ขณะที่ agent อื่นยังคง fallback PI เริ่มต้นในโหมด `auto`
- `runtime`: ตัวอธิบาย runtime ต่อ agent แบบไม่บังคับ ใช้ `type: "acp"` ร่วมกับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อ agent ควรมีค่าเริ่มต้นเป็น session ของ ACP harness
- `identity.avatar`: พาธแบบสัมพันธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` สืบทอดค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของรหัส agent สำหรับเป้าหมาย `sessions_spawn.agentId` แบบชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: agent เดียวกันเท่านั้น) รวมรหัส requester เมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายตนเอง
- ตัวป้องกันการสืบทอด sandbox: หาก session ของ requester อยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่ sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับเลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางแบบหลาย agent

รัน agent ที่แยกกันหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะใช้ค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบคงอยู่
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะ channel)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการ match แบบกำหนดตายตัว:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันเป๊ะ ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้ง channel)
6. agent เริ่มต้น

ภายในแต่ละชั้น รายการ `bindings` รายการแรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะแก้ค่าโดยใช้ตัวตนการสนทนาที่ตรงกันเป๊ะ (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับชั้น route binding ข้างต้น

### โปรไฟล์การเข้าถึงต่อ agent

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

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (เฉพาะการส่งข้อความ)">

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

## Session

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

<Accordion title="รายละเอียดฟิลด์ Session">

- **`scope`**: กลยุทธ์การจัดกลุ่ม session พื้นฐานสำหรับบริบท group-chat
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้รับ session ที่แยกกันภายในบริบท channel
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบท channel ใช้ session เดียวร่วมกัน (ใช้เฉพาะเมื่อมีเจตนาให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้ session หลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้าม channel
  - `per-channel-peer`: แยกตาม channel + ผู้ส่ง (แนะนำสำหรับกล่องข้อความหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + channel + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: map รหัส canonical ไปยัง peer ที่มีคำนำหน้า provider สำหรับการใช้ session ร่วมกันข้าม channel คำสั่ง dock เช่น `/dock_discord` ใช้ map เดียวกันเพื่อสลับ reply route ของ session ที่ใช้งานอยู่ไปยัง peer ของ channel ที่ลิงก์อีกช่องหนึ่ง; ดู [Channel docking](/th/concepts/channel-docking)
- **`reset`**: นโยบาย reset หลัก `daily` จะ reset ที่เวลาท้องถิ่น `atHour`; `idle` จะ reset หลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองอย่าง ตัวใดหมดอายุก่อนจะชนะ ความสดของ daily reset ใช้ `sessionStartedAt` ของแถว session; ความสดของ idle reset ใช้ `lastInteractionAt` การเขียนจากพื้นหลัง/เหตุการณ์ระบบ เช่น Heartbeat, การปลุก Cron, การแจ้งเตือน exec และการทำบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้ session แบบ daily/idle ยังสดอยู่
- **`resetByType`**: override ต่อประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบ legacy เป็น alias ของ `direct`
- **`parentForkMaxTokens`**: `totalTokens` สูงสุดของ parent-session ที่อนุญาตเมื่อสร้าง session thread ที่ fork (ค่าเริ่มต้น `100000`)
  - หาก `totalTokens` ของ parent สูงกว่าค่านี้ OpenClaw จะเริ่ม session thread ใหม่แทนการสืบทอดประวัติ transcript ของ parent
  - ตั้งค่า `0` เพื่อปิดตัวป้องกันนี้และอนุญาต parent forking เสมอ
- **`mainKey`**: ฟิลด์ legacy Runtime ใช้ `"main"` สำหรับ bucket ของ direct-chat หลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวน turn การตอบกลับไปมาสูงสุดระหว่าง agent ระหว่างการแลกเปลี่ยนแบบ agent-to-agent (จำนวนเต็ม ช่วง: `0`–`5`) `0` ปิดการ chaining แบบ ping-pong
- **`sendPolicy`**: match ตาม `channel`, `chatType` (`direct|group|channel` พร้อม alias legacy `dm`), `keyPrefix` หรือ `rawKeyPrefix` deny แรกจะชนะ
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างแบบ batch พร้อม buffer high-water ขนาดเล็กสำหรับ cap ขนาด production; `openclaw sessions cleanup --enforce` ใช้ cap ทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจาก config เก่า
  - `resetArchiveRetention`: ระยะเวลาการเก็บรักษา archive transcript `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้ง `false` เพื่อปิด
  - `maxDiskBytes`: งบพื้นที่ดิสก์ของไดเรกทอรี sessions แบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/session ที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นทั่วทั้งระบบสำหรับฟีเจอร์ session ที่ผูกกับ thread
  - `enabled`: สวิตช์เริ่มต้นหลัก (provider สามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของ auto-unfocus เมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิด; provider สามารถ override ได้)
  - `maxAgeHours`: อายุสูงสุดแบบ hard ตามค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิด; provider สามารถ override ได้)

</Accordion>

---

## Messages

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

การแทนที่แยกตามช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

การตัดสินค่า (รายการที่เฉพาะเจาะจงที่สุดชนะ): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ต่อ `"auto"` สร้างค่าจาก `[{identity.name}]`.

**ตัวแปรเทมเพลต:**

| ตัวแปร             | คำอธิบาย                | ตัวอย่าง                    |
| ------------------ | ----------------------- | --------------------------- |
| `{model}`          | ชื่อโมเดลแบบสั้น        | `claude-opus-4-6`           |
| `{modelFull}`      | ตัวระบุโมเดลแบบเต็ม     | `anthropic/claude-opus-4-6` |
| `{provider}`       | ชื่อผู้ให้บริการ        | `anthropic`                 |
| `{thinkingLevel}`  | ระดับการคิดปัจจุบัน     | `high`, `low`, `off`        |
| `{identity.name}`  | ชื่ออัตลักษณ์ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่แยกตัวพิมพ์ใหญ่เล็ก `{think}` เป็นนามแฝงของ `{thinkingLevel}`.

### ปฏิกิริยารับทราบ

- ค่าเริ่มต้นเป็น `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งค่า `""` เพื่อปิดใช้งาน
- การแทนที่แยกตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- ลำดับการตัดสินค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่าสำรองจากอัตลักษณ์
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: ลบการรับทราบหลังตอบกลับในช่องทางที่รองรับปฏิกิริยา เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้งานปฏิกิริยาสถานะวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่า จะยังเปิดใช้ปฏิกิริยาสถานะเมื่อปฏิกิริยารับทราบทำงานอยู่
  บน Telegram ให้ตั้งค่านี้เป็น `true` อย่างชัดเจนเพื่อเปิดใช้ปฏิกิริยาสถานะวงจรชีวิต

### การดีบาวซ์ขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งมาอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็นเทิร์นเอเจนต์เดียว สื่อ/ไฟล์แนบจะทำให้ส่งทันที คำสั่งควบคุมจะข้ามการดีบาวซ์

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลใช้งานจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้)
- คีย์ API จะถอยกลับไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละรายการที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รหัสผู้ให้บริการเดิม `edge` ยอมรับเป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการตัดสินค่าคือ config แล้วตามด้วย `OPENAI_TTS_BASE_URL` แล้วตามด้วย `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าปลายทางนั้นเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

---

## พูดคุย

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการพูดคุยหลายราย
- คีย์พูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- รหัสเสียงจะถอยกลับไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความธรรมดาหรืออ็อบเจ็กต์ SecretRef
- ค่าสำรอง `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับพูดคุย
- `providers.*.voiceAliases` ช่วยให้คำสั่งกำกับการพูดคุยใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือกรีโพ Hugging Face ที่ใช้โดยตัวช่วย MLX ในเครื่องของ macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่เส้นทางตัวช่วยสำหรับการพัฒนา
- `speechLocale` ตั้งค่ารหัสโลแคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของการพูดคุยบน iOS/macOS เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมว่าโหมดพูดคุยจะรอนานเท่าใดหลังจากผู้ใช้เงียบก่อนส่งทรานสคริปต์ หากไม่ได้ตั้งค่า จะคงช่วงหยุดเริ่มต้นของแพลตฟอร์มไว้ (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าแบบรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
