---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกแบบหลายเอเจนต์
    - การปรับลักษณะการทำงานของเซสชัน การส่งข้อความ และโหมดการพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-06T17:56:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: e0467260ad61f3d2a0b52cd952154d617a9341a588cdeda38f54bfae5985fa4f
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ของ Gateway และคีย์ระดับบนสุดอื่นๆ
โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากของคลังที่เลือกได้ ซึ่งแสดงในบรรทัด Runtime ของพรอมป์ระบบ หากไม่ได้ตั้งค่าไว้ OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาตของ Skills เริ่มต้นที่เลือกได้สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละ `agents.defaults.skills` เพื่อให้ใช้ Skills ได้โดยไม่จำกัดเป็นค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์บูตสแตรปของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซที่เลือกได้บางไฟล์ ขณะที่ยังคงเขียนไฟล์บูตสแตรปที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมว่าไฟล์บูตสแตรปของเวิร์กสเปซจะถูกฉีดเข้าในพรอมป์ระบบเมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีดบูตสแตรปของเวิร์กสเปซซ้ำ เพื่อลดขนาดพรอมป์ การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดการฉีดบูตสแตรปของเวิร์กสเปซและไฟล์บริบทในทุกเทิร์น ใช้ค่านี้เฉพาะกับเอเจนต์ที่จัดการวงจรชีวิตพรอมป์ของตนเองทั้งหมด (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการฉีดด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของเวิร์กสเปซก่อนตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดข้ามไฟล์บูตสแตรปของเวิร์กสเปซทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศในพรอมป์ระบบที่เอเจนต์มองเห็น เมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความประกาศการตัดทอนเข้าในพรอมป์ระบบ
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อซิกเนเจอร์การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอน

จำนวนดิบ/ที่ฉีดอย่างละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะคงอยู่ในการวินิจฉัย เช่น รายงานบริบท/สถานะและบันทึก ส่วนบริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับเฉพาะประกาศกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบบริบท

OpenClaw มีงบพรอมป์/บริบทปริมาณสูงหลายส่วน และตั้งใจแบ่งตามระบบย่อย
แทนที่จะให้ทั้งหมดไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปเวิร์กสเปซตามปกติ
- `agents.defaults.startupContext.*`:
  บทนำก่อนการรันโมเดลแบบครั้งเดียวสำหรับรีเซ็ต/เริ่มต้น รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตล้วน `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าในพรอมป์ระบบ
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนของรันไทม์ที่มีขอบเขตจำกัด และบล็อกที่ฉีดซึ่งรันไทม์เป็นเจ้าของ
- `memory.qmd.limits.*`:
  ขนาดของสไนปเป็ตการค้นหาหน่วยความจำที่จัดทำดัชนีและการฉีด

ใช้การแทนที่รายเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบที่แตกต่าง:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมบทนำเริ่มต้นเทิร์นแรกที่ฉีดในการรันโมเดลเมื่อรีเซ็ต/เริ่มต้น
คำสั่งแชตล้วน `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
โมเดล ดังนั้นจึงไม่โหลดบทนำนี้

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

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทรันไทม์ที่มีขอบเขตจำกัด

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
  เมตาดาต้าการตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดที่ใช้สำหรับผลลัพธ์ที่คงอยู่และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการฉีดเพื่อรีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่รายเอเจนต์สำหรับปุ่มปรับ `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานส่วนกลางสำหรับรายการ Skills แบบย่อที่ฉีดเข้าในพรอมป์ระบบ ค่านี้
ไม่ส่งผลต่อการอ่านไฟล์ `SKILL.md` เมื่อต้องการ

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

การแทนที่รายเอเจนต์สำหรับงบพรอมป์ของ Skills

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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของทรานสคริปต์/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำลงมักลดการใช้โทเค็นวิชันและขนาดเพย์โหลดคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงขึ้นจะรักษารายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมป์ระบบ (ไม่ใช่เวลาประทับของข้อความ) สำรองเป็นเขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาในพรอมป์ระบบ ค่าเริ่มต้น: `auto` (ค่ากำหนดของระบบปฏิบัติการ)

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
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
      toolProgressDetail: "explain",
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
  - รูปแบบสตริงตั้งเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบออบเจ็กต์ตั้งโมเดลหลักพร้อมโมเดลสำรองแบบมีลำดับสำหรับการสลับเมื่อใช้งานไม่ได้
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยพาธเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบรองรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้ซึ่งรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะกำหนดให้เป็นของผู้ให้บริการนั้น รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้าผู้ให้บริการอย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกันและพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP ที่มีพื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกันและเครื่องมือ `music_generate` ในตัว
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกันและเครื่องมือ `video_generate` ในตัว
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่รวมมาให้รองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะถอยกลับไปใช้ `imageModel` แล้วจึงถอยกลับไปใช้โมเดลของเซสชัน/ค่าเริ่มต้นที่แก้ค่าแล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองสำหรับการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายชื่อแบบกระชับที่มนุษย์อ่านได้) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าจะถูกใช้เฉพาะสำหรับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการตั้งค่าแทนที่ reasoning ต่อข้อความหรือต่อเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วยคีย์ API หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละผู้ให้บริการ OpenClaw จะลอง alias ก่อน จากนั้นลองจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ ID โมเดลนั้นโดยตรง แล้วจึงถอยกลับไปใช้ผู้ให้บริการค่าเริ่มต้นที่กำหนดค่าไว้เท่านั้น (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่ได้เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้ผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนการแสดงค่าเริ่มต้นผู้ให้บริการเก่าที่ถูกนำออกแล้ว
- `models`: แค็ตตาล็อกโมเดลและรายการอนุญาตที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการอนุญาตที่มีอยู่ เว้นแต่คุณส่ง `--replace`
  - โฟลว์กำหนดค่า/onboarding ที่จำกัดขอบเขตตามผู้ให้บริการจะผสานโมเดลผู้ให้บริการที่เลือกเข้ากับแมปนี้ และคงผู้ให้บริการอื่นที่กำหนดค่าไว้แล้วซึ่งไม่เกี่ยวข้องไว้
  - สำหรับโมเดล OpenAI Responses แบบตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือ `params.responsesCompactThreshold` เพื่อแทนที่เกณฑ์ ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นระดับโกลบอลที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญในการผสาน `params` (การกำหนดค่า): `agents.defaults.params` (ฐานโกลบอล) ถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID เอเจนต์ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดใน [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ผสานเข้ากับบอดีคำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น บอดีเพิ่มเติมจะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์เทมเพลตแชตที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้ากับบอดีคำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับตัวควบคุม thinking ของ vLLM Qwen ให้ตั้ง `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการระดับ effort ของ reasoning ที่เข้ากันได้กับ OpenAI แบบรายโมเดล ใส่ `"xhigh"` สำหรับปลายทางแบบกำหนดเองที่รองรับจริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบแพตช์เซสชัน การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่านั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับ thinking ที่คงไว้ เมื่อเปิดใช้และเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [thinking ของ Z.AI และ thinking ที่คงไว้](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำเริ่มต้น ID ที่ละไว้จะใช้ OpenClaw Pi เป็นค่าเริ่มต้น ใช้ `id: "pi"` เพื่อบังคับใช้ฮาร์เนส PI ในตัว, `id: "auto"` เพื่อให้ฮาร์เนส Plugin ที่ลงทะเบียนอ้างสิทธิ์โมเดลที่รองรับและใช้ PI เมื่อไม่มีรายการใดตรงกัน, ID ฮาร์เนสที่ลงทะเบียน เช่น `id: "codex"` เพื่อบังคับใช้ฮาร์เนสนั้น หรือ alias แบ็กเอนด์ CLI ที่รองรับ เช่น `id: "claude-cli"` รันไทม์ Plugin ที่ระบุชัดเจนจะล้มเหลวแบบปิดเมื่อฮาร์เนสไม่พร้อมใช้งานหรือล้มเหลว รักษาการอ้างอิงโมเดลให้เป็นรูปแบบมาตรฐาน `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และแบ็กเอนด์การดำเนินการอื่นผ่านการกำหนดค่ารันไทม์แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเดิม ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สำหรับความแตกต่างจากการเลือกผู้ให้บริการ/โมเดล
- ตัวเขียนการกำหนดค่าที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกเป็นรูปแบบออบเจ็กต์มาตรฐานและคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบเรียงลำดับ) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมตัวดำเนินการระดับต่ำที่จะรันรอบของเอเจนต์ การปรับใช้ส่วนใหญ่ควรคงรันไทม์ OpenClaw Pi ค่าเริ่มต้นไว้ ใช้เมื่อ Plugin ที่เชื่อถือได้มีฮาร์เนสเนทีฟให้ เช่น ฮาร์เนสเซิร์ฟเวอร์แอป Codex ที่รวมมาให้ หรือเมื่อคุณต้องการแบ็กเอนด์ CLI ที่รองรับ เช่น Claude CLI สำหรับโมเดลแนวคิด ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID ฮาร์เนส Plugin ที่ลงทะเบียน หรือ alias แบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้ลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้มีแบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` ให้ฮาร์เนส Plugin ที่ลงทะเบียนอ้างสิทธิ์รอบที่รองรับและใช้ PI เมื่อไม่มีฮาร์เนสที่ตรงกัน รันไทม์ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` ต้องมีฮาร์เนสนั้นและจะล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือล้มเหลว
- การแทนที่ด้วยสภาพแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` แทนที่ `id` สำหรับกระบวนการนั้น
- สำหรับการปรับใช้เฉพาะ Codex ให้ตั้ง `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"`
- สำหรับการปรับใช้ Claude CLI แนะนำให้ใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดล `claude-cli/claude-opus-4-7` แบบเดิมยังใช้งานได้เพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรรักษาการเลือกผู้ให้บริการ/โมเดลให้เป็นมาตรฐาน และใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือกฮาร์เนสจะถูกตรึงตาม ID เซสชันหลังการรันแบบฝังครั้งแรก การเปลี่ยนแปลงการกำหนดค่า/สภาพแวดล้อมมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ทรานสคริปต์ที่มีอยู่ เซสชันรุ่นเก่าที่มีประวัติทรานสคริปต์แต่ไม่มีพินที่บันทึกไว้จะถือว่าถูกพินเป็น PI `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการรอบเอเจนต์ข้อความเท่านั้น การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตัวเอง

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| alias               | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

alias ที่คุณกำหนดค่าไว้จะมีลำดับความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x เปิดใช้โหมดการคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

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

- แบ็กเอนด์ CLI เน้นข้อความเป็นหลัก เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อมีการตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` ยอมรับพาธไฟล์

### `agents.defaults.systemPromptOverride`

แทนที่พรอมป์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์มีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

โอเวอร์เลย์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งใช้ตามตระกูลโมเดล ID โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันในทุกผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะชั้นสไตล์การโต้ตอบที่เป็นมิตรเท่านั้น

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้ชั้นสไตล์การโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้เฉพาะชั้นที่เป็นมิตรเท่านั้น สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งาน
- `plugins.entries.openai.config.personality` แบบเดิมยังคงถูกอ่านเมื่อยังไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตน OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมป์ระบบและข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของเอเจนต์ heartbeat ก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งโดยตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตให้ส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน heartbeat จะใช้บริบทบูตสแตรปแบบเบาและคงไว้เฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน heartbeat จะเลื่อนไปเมื่อมีเลนที่ไม่ว่างเพิ่มเติม: งาน subagent หรือคำสั่งซ้อน เลน Cron จะเลื่อน heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดก็ตามกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน heartbeat
- Heartbeat รันเทิร์นเอเจนต์แบบเต็ม ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

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
- `provider`: ID ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อมีการตั้งค่า จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดแบบคำต่อคำ การ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อมีการตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นเช็กพอยต์แบบตายตัว
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุทึบแสงไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองสำหรับการรักษาตัวระบุที่ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตผิดรูปสำหรับสรุป safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันลูปเครื่องมือของ Pi ทางเลือก เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันบริบทหลังจากเพิ่มผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck เดิมซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ compact แล้วลองใหม่ ใช้งานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md ทางเลือกที่จะฉีดซ้ำหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้งานการฉีดซ้ำ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าอย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อ `Every Session`/`Safety` รุ่นเก่าจะได้รับการยอมรับเป็นทางเลือกย้อนหลังด้วย
- `model`: การแทนที่ `provider/model-id` ทางเลือกสำหรับการสรุป Compaction เท่านั้น ใช้เมื่อเซสชันหลักควรคงโมเดลหนึ่งไว้ แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์ทางเลือก (`number` หรือสตริงอย่าง `"20mb"`) ที่กระตุ้น Compaction ภายในเครื่องตามปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่เติบโตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จหมุนไปยังทรานสคริปต์ตัวถัดไปที่เล็กกว่าได้ ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ถึงผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสมบูรณ์ (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำถาวร ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การแทนที่นี้จะไม่สืบทอดเชน fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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

- `mode: "cache-ttl"` เปิดใช้รอบการตัดแต่ง
- `ttl` ควบคุมว่าการตัดแต่งจะรันซ้ำได้บ่อยแค่ไหน (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือเก่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วยตัวยึดตำแหน่ง

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` การตัดแต่งจะถูกข้าม

</Accordion>

ดูรายละเอียดพฤติกรรมได้ที่ [การตัดแต่งเซสชัน](/th/concepts/session-pruning)

### การสตรีมแบบบล็อก

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

- ช่องทางที่ไม่ใช่ Telegram ต้องใช้ `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การแทนที่ช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การแทนที่ต่อเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรม + การแบ่งชิ้นได้ที่ [การสตรีม](/th/concepts/streaming)

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
- การ override ราย session: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำ sandbox แบบไม่บังคับสำหรับ agent แบบฝังตัว ดูคู่มือฉบับเต็มได้ที่ [Sandboxing](/th/gateway/sandboxing)

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

<Accordion title="รายละเอียด sandbox">

**Backend:**

- `docker`: runtime Docker ภายในเครื่อง (ค่าเริ่มต้น)
- `ssh`: runtime ระยะไกลทั่วไปที่รองรับด้วย SSH
- `openshell`: runtime OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะ runtime จะย้ายไปที่
`plugins.entries.openshell.config`

**การกำหนดค่า backend SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: root ระยะไกลแบบ absolute ที่ใช้สำหรับ workspace ตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหา inline หรือ SecretRefs ที่ OpenClaw ทำให้เป็นไฟล์ชั่วคราวขณะ runtime
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของ auth SSH:**

- `identityData` มีความสำคัญเหนือ `identityFile`
- `certificateData` มีความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีความสำคัญเหนือ `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูก resolve จาก snapshot runtime ของ secrets ที่ใช้งานอยู่ก่อน session sandbox เริ่ม

**พฤติกรรมของ backend SSH:**

- seed workspace ระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคง workspace SSH ระยะไกลให้เป็น canonical
- route `exec`, เครื่องมือไฟล์, และ path ของสื่อผ่าน SSH
- ไม่ sync การเปลี่ยนแปลงระยะไกลกลับมายัง host โดยอัตโนมัติ
- ไม่รองรับ container เบราว์เซอร์ sandbox

**การเข้าถึง workspace:**

- `none`: workspace sandbox ตาม scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: workspace sandbox ที่ `/workspace`, workspace ของ agent mount แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: workspace ของ agent mount แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: container + workspace ต่อ session
- `agent`: container + workspace หนึ่งชุดต่อ agent (ค่าเริ่มต้น)
- `shared`: container และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้าม session)

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

- `mirror`: seed ระยะไกลจาก local ก่อน exec, sync กลับหลัง exec; local workspace ยังคงเป็น canonical
- `remote`: seed ระยะไกลหนึ่งครั้งเมื่อสร้าง sandbox แล้วคง workspace ระยะไกลให้เป็น canonical

ในโหมด `remote` การแก้ไข host-local ที่ทำนอก OpenClaw จะไม่ถูก sync เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
Transport คือ SSH เข้าไปยัง sandbox OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิต sandbox และ mirror sync แบบไม่บังคับ

**`setupCommand`** ทำงานหนึ่งครั้งหลังการสร้าง container (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้, ผู้ใช้ root

**ค่าเริ่มต้นของ container คือ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หาก agent ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกเป็นค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูก staging ไปที่ `media/inbound/*` ใน workspace ที่ใช้งานอยู่

**`docker.binds`** mount ไดเรกทอรี host เพิ่มเติม; bind ระดับ global และต่อ agent จะถูก merge เข้าด้วยกัน

**เบราว์เซอร์ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ใน container URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC observer ใช้ VNC auth เป็นค่าเริ่มต้น และ OpenClaw จะปล่อย token URL อายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อก session sandbox ไม่ให้ target เบราว์เซอร์ของ host
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge ระดับ global อย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบ container เป็นช่วง CIDR ได้แบบไม่บังคับ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` mount ไดเรกทอรี host เพิ่มเติมเข้าไปใน container เบราว์เซอร์ sandbox เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับ container เบราว์เซอร์
- ค่าเริ่มต้นการเปิดใช้งานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับ host แบบ container:
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
  - `--disable-extensions` (เปิดใช้เป็นค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu`
    เปิดใช้เป็นค่าเริ่มต้น และปิดใช้ได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหาก workflow ของคุณ
    พึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งค่า `0` เพื่อใช้
    process limit เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของ image container; ใช้ image เบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของ container

</Accordion>

การทำ sandbox เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้าง image (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดูคำสั่ง `docker build` แบบ inline ได้ที่ [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การ override ต่อ agent)

ใช้ `agents.list[].tts` เพื่อกำหนด provider, voice, model,
style, หรือโหมด auto-TTS ของ TTS ให้ agent นั้นเอง บล็อก agent จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้น credentials ที่ใช้ร่วมกันจึงอยู่ในที่เดียวได้ ขณะที่ agent แต่ละตัว
override เฉพาะฟิลด์ voice หรือ provider ที่ต้องใช้ override ของ agent ที่ใช้งานอยู่
จะมีผลกับการตอบกลับเสียงพูดอัตโนมัติ, `/tts audio`, `/tts status`, และ
เครื่องมือ agent `tts` ดูตัวอย่าง provider และลำดับความสำคัญได้ที่ [Text-to-speech](/th/tools/tts#per-agent-voice-overrides)

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
        agentRuntime: { id: "auto" },
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

- `id`: รหัสเอเจนต์ที่คงที่ (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะมีผล (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้งโมเดลหลักต่อเอเจนต์แบบเข้มงวดโดยไม่มีโมเดลสำรอง; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้เอเจนต์นั้นใช้ fallback ได้ หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเข้มงวดอย่างชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้ค่านี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature`, หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override ข้อความเป็นเสียงต่อเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เจาะจง persona เช่น provider, voice, model, style หรือ auto mode ที่นี่
- `skills`: allowlist ของ Skill ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; ลิสต์ที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นแทนการผสาน และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดเริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้ง override ต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกจะควบคุมว่าค่าใดถูกต้อง; สำหรับ Google Gemini, `adaptive` จะคงการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้ง override reasoning ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์แบบไม่บังคับสำหรับ fast mode (`true | false`) ใช้เมื่อไม่ได้ตั้ง override fast-mode ต่อข้อความหรือเซสชัน
- `agentRuntime`: override นโยบายรันไทม์ระดับต่ำต่อเอเจนต์แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อให้เอเจนต์หนึ่งใช้เฉพาะ Codex ขณะที่เอเจนต์อื่นยังคง fallback เป็น PI เริ่มต้นในโหมด `auto`
- `runtime`: ตัวอธิบายรันไทม์ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธแบบสัมพันธ์กับ workspace, URL `http(s)`, หรือ URI `data:`
- `identity` จะสร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของรหัสเอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุอย่างชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) รวมรหัสของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายเป็นตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางแบบหลายเอเจนต์

รันเอเจนต์แบบแยกหลายตัวภายใน Gateway เดียว ดู [หลายเอเจนต์](/th/concepts/multi-agent)

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

### ฟิลด์จับคู่ของการผูก

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะใช้ค่าเริ่มต้นเป็น route), `acp` สำหรับการผูกบทสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันทุกประการ, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะมีผล

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ตามตัวตนบทสนทนาที่ตรงกันทุกประการ (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับการผูกเส้นทางด้านบน

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="Full access (no sandbox)">

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

<Accordion title="Read-only tools + workspace">

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

<Accordion title="ไม่มีสิทธิ์เข้าถึงระบบไฟล์ (สำหรับการส่งข้อความเท่านั้น)">

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [แซนด์บ็อกซ์และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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

<Accordion title="รายละเอียดฟิลด์ของเซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานในการจัดกลุ่มเซสชันสำหรับบริบทแชทกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันที่แยกจากกันภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางแชร์เซสชันเดียวกัน (ใช้เฉพาะเมื่อตั้งใจให้มีบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดแชร์เซสชันหลัก
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความที่มีผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมปรหัสมาตรฐานกับเพียร์ที่มีคำนำหน้าผู้ให้บริการ เพื่อแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางที่ลิงก์ไว้อีกรายการหนึ่ง ดู [การเชื่อมต่อช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตที่เวลา local ใน `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองอย่างไว้ ค่าที่หมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความสดใหม่ของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, Cron wakeups, การแจ้งเตือน exec และการทำบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่ไม่ทำให้เซสชัน daily/idle สดใหม่อยู่ต่อ
- **`resetByType`**: การแทนที่ตามประเภท (`direct`, `group`, `thread`) ค่าเดิม `dm` ยอมรับเป็นนามแฝงของ `direct`
- **`mainKey`**: ฟิลด์เดิม Runtime ใช้ `"main"` สำหรับบักเก็ตแชทตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ถึงเอเจนต์ (จำนวนเต็ม, ช่วง: `0`–`5`) `0` ปิดการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, โดยมี `dm` เดิมเป็นนามแฝง), `keyPrefix` หรือ `rawKeyPrefix` กฎ deny แรกจะมีผลก่อน
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` ส่งคำเตือนเท่านั้น; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ค้างเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างแบบแบตช์พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษาคลังทรานสคริปต์ `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังล้างตามงบประมาณ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบแข็งตามค่าเริ่มต้นเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตเริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรดของ ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบทซับเอเจนต์เนทีฟเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การแทนที่ต่อช่อง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

การเลือกค่า (ค่าที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่อง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ลำดับค่า `"auto"` สร้างจาก `[{identity.name}]`.

**ตัวแปรเทมเพลต:**

| ตัวแปร           | คำอธิบาย                  | ตัวอย่าง                    |
| ----------------- | -------------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น          | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม       | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ          | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน       | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์ของ Agent    | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่แยกตัวพิมพ์เล็กใหญ่ `{think}` เป็นชื่อแทนของ `{thinkingLevel}`

### ปฏิกิริยารับทราบ

- ค่าเริ่มต้นคือ `identity.emoji` ของ Agent ที่ใช้งานอยู่ มิฉะนั้นใช้ `"👀"` ตั้งค่าเป็น `""` เพื่อปิดใช้งาน
- การแทนที่ต่อช่อง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการเลือกค่า: บัญชี → ช่อง → `messages.ackReaction` → ค่า fallback จากอัตลักษณ์
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบการรับทราบหลังตอบกลับบนช่องที่รองรับปฏิกิริยา เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้ปฏิกิริยาสถานะวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะเปิดใช้ปฏิกิริยาสถานะต่อไปเมื่อปฏิกิริยารับทราบทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้ปฏิกิริยาสถานะวงจรชีวิต

### การหน่วงข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็นเทิร์น Agent เดียว สื่อ/ไฟล์แนบจะส่งออกทันที คำสั่งควบคุมจะข้ามการหน่วงนี้

### TTS (การแปลงข้อความเป็นเสียงพูด)

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

- `auto` ควบคุมโหมด TTS อัตโนมัติเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลใช้งาน
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้)
- คีย์ API fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่มาพร้อมระบบเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รหัสผู้ให้บริการเดิม `edge` ยอมรับเป็นชื่อแทนของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการเลือกค่าคือ config จากนั้น `OPENAI_TTS_BASE_URL` แล้วจึง `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนคลายการตรวจสอบโมเดล/เสียง

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
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime",
          voice: "alloy",
        },
      },
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดผู้ให้บริการโหมดพูดคุยหลายราย
- คีย์โหมดพูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`
- รหัสเสียง fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความล้วนหรืออ็อบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดคีย์ API สำหรับโหมดพูดคุย
- `providers.*.voiceAliases` ช่วยให้คำสั่งโหมดพูดคุยใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือกรีโป Hugging Face ที่ใช้โดยตัวช่วย MLX ภายในเครื่องบน macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่มาพร้อมระบบเมื่อมีอยู่ หรือผ่านไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธตัวช่วยสำหรับการพัฒนา
- `speechLocale` ตั้งค่ารหัส locale แบบ BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของโหมดพูดคุยบน iOS/macOS ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดพูดคุยรอหลังจากผู้ใช้เงียบก่อนส่งทรานสคริปต์ หากไม่ได้ตั้งค่า จะใช้ช่วงหยุดเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
