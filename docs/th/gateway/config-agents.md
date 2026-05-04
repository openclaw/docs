---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-04T02:24:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9d339b82b8b3b82e55820ca6568b3ed569fe64135e698515fa7f316c3afbbfd9
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากรีโพซิทอรีที่ไม่บังคับ ซึ่งแสดงในบรรทัด Runtime ของพรอมป์ต์ระบบ หากไม่ได้ตั้งค่าไว้ OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นจากพื้นที่ทำงาน

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นที่ไม่บังคับสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละ `agents.defaults.skills` เพื่อให้อนุญาต Skills ทั้งหมดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น โดยจะ
  ไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์บูตสแตรปของพื้นที่ทำงานโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์พื้นที่ทำงานที่เป็นทางเลือกบางไฟล์ โดยยังคงเขียนไฟล์บูตสแตรปที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมว่าไฟล์บูตสแตรปของพื้นที่ทำงานจะถูกฉีดเข้าไปในพรอมป์ต์ระบบเมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: รอบต่อเนื่องที่ปลอดภัย (หลังจากคำตอบของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีดบูตสแตรปพื้นที่ทำงานซ้ำ เพื่อลดขนาดพรอมป์ต์ การรัน Heartbeat และการลองใหม่หลัง Compaction จะยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งานบูตสแตรปพื้นที่ทำงานและการฉีดไฟล์บริบทในทุกรอบ ใช้ค่านี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิตพรอมป์ต์ของตนเองทั้งหมด (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) รอบ Heartbeat และรอบกู้คืนจาก Compaction จะข้ามการฉีดด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของพื้นที่ทำงานก่อนตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์บูตสแตรปของพื้นที่ทำงานทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศในพรอมป์ต์ระบบที่เอเจนต์มองเห็น เมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความประกาศการตัดทอนเข้าไปในพรอมป์ต์ระบบ
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อซิกเนเจอร์การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอน

จำนวนดิบ/ที่ฉีดโดยละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ในการวินิจฉัย เช่น
รายงานบริบท/สถานะและบันทึก ส่วนบริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะ
ได้รับเฉพาะประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังเจ้าของงบบริบท

OpenClaw มีงบพรอมป์ต์/บริบทปริมาณสูงหลายรายการ และงบเหล่านี้ถูก
แยกตามระบบย่อยโดยตั้งใจ แทนที่จะไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียวทั้งหมด

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปพื้นที่ทำงานตามปกติ
- `agents.defaults.startupContext.*`:
  คำนำการรันโมเดลแบบครั้งเดียวสำหรับการรีเซ็ต/เริ่มต้น รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะ
  ได้รับการตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมป์ต์ระบบ
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนรันไทม์แบบจำกัดขนาดและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  สไนปเป็ตการค้นหาหน่วยความจำที่ทำดัชนีและการกำหนดขนาดการฉีด

ใช้การแทนที่ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องใช้งบที่แตกต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมคำนำเริ่มต้นรอบแรกที่ฉีดเข้าไปในการรันโมเดลแบบรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
โมเดล ดังนั้นจึงไม่โหลดคำนำนี้

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

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทรันไทม์แบบจำกัดขนาด

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
  เมทาดาทาการตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัด `memory_get` เริ่มต้นเมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่คงอยู่และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับปุ่มปรับ `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานส่วนกลางสำหรับรายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมป์ต์ระบบ ค่านี้
ไม่ส่งผลต่อการอ่านไฟล์ `SKILL.md` ตามต้องการ

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

การแทนที่ต่อเอเจนต์สำหรับงบพรอมป์ต์ Skills

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

ค่าที่ต่ำกว่ามักลดการใช้โทเคนวิชันและขนาดเพย์โหลดของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพได้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมป์ต์ระบบ (ไม่ใช่เวลาประทับข้อความ) จะถอยกลับไปใช้เขตเวลาของโฮสต์

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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบอ็อบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลเฟลโอเวอร์แบบเรียงลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นคอนฟิกโมเดลวิชัน
  - ใช้เป็นเส้นทางสำรองด้วยเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้การอ้างอิง `provider/model` แบบชัดเจน รองรับไอดีเปล่าเพื่อความเข้ากันได้ หากไอดีเปล่าตรงกับรายการที่รองรับรูปภาพซึ่งคอนฟิกไว้ใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติมผู้ให้บริการนั้นให้ รายการที่คอนฟิกไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้าผู้ให้บริการอย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกันและพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP แบบพื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้คอนฟิกการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับไอดีผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับไอดีผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้คอนฟิกการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับไอดีผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้คอนฟิกการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่รวมมาด้วยรองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะสำรองไปที่ `imageModel` แล้วจึงไปที่โมเดลเซสชัน/ค่าเริ่มต้นที่แก้ค่าแล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF ค่าเริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดค่าเริ่มต้นที่โหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose ค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือฉบับร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` รายเอเจนต์จะเขียนทับค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็นการใช้เหตุผลค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะเขียนทับค่าเริ่มต้นนี้ ค่าเริ่มต้นการใช้เหตุผลที่คอนฟิกไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการตั้งค่าการใช้เหตุผลแบบรายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วยคีย์ API หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละผู้ให้บริการ OpenClaw จะลองใช้นามแฝงก่อน จากนั้นจึงลองจับคู่ผู้ให้บริการที่คอนฟิกไว้แบบไม่ซ้ำสำหรับไอดีโมเดลนั้นแบบตรงตัว และหลังจากนั้นเท่านั้นจึงสำรองไปยังผู้ให้บริการค่าเริ่มต้นที่คอนฟิกไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่ได้เปิดเผยโมเดลค่าเริ่มต้นที่คอนฟิกไว้อีกต่อไป OpenClaw จะสำรองไปยังผู้ให้บริการ/โมเดลที่คอนฟิกไว้รายการแรก แทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบซึ่งค้างอยู่
- `models`: แค็ตตาล็อกโมเดลที่คอนฟิกไว้และรายการอนุญาตสำหรับ `/model` แต่ละรายการสามารถรวม `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการอนุญาตที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์คอนฟิก/เริ่มใช้งานที่มีขอบเขตตามผู้ให้บริการจะผสานโมเดลผู้ให้บริการที่เลือกเข้ากับแมปนี้ และคงผู้ให้บริการอื่นที่คอนฟิกไว้แล้วซึ่งไม่เกี่ยวข้องไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการแทรก `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อเขียนทับค่าเกณฑ์ ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญในการผสาน `params` (คอนฟิก): `agents.defaults.params` (ฐานส่วนกลาง) จะถูกเขียนทับโดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ไอดีเอเจนต์ที่ตรงกัน) จะเขียนทับตามคีย์ ดูรายละเอียดใน [การแคชพรอมป์](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON ส่งผ่านขั้นสูงที่ผสานเข้ากับบอดีคำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น บอดีเพิ่มเติมจะมีผลเหนือกว่า เส้นทาง completions ที่ไม่ใช่แบบเนทีฟยังคงลบ `store` ที่ใช้เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์เทมเพลตแชตที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้ากับบอดีคำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` เมื่อปิดการคิด Plugin vLLM ที่รวมมาด้วยจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุชัดเจนจะเขียนทับค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับการควบคุมการคิดของ vLLM Qwen ให้ตั้ง `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการระดับความพยายามในการใช้เหตุผลที่เข้ากันได้กับ OpenAI แบบรายโมเดล รวม `"xhigh"` สำหรับเอนด์พอยต์กำหนดเองที่รองรับจริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง, แถวเซสชัน Gateway, การตรวจสอบแพตช์เซสชัน, การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่คอนฟิกไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าที่เฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับการคิดที่เก็บรักษาไว้ เมื่อเปิดใช้และการคิดเปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [การคิดของ Z.AI และการคิดที่เก็บรักษาไว้](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำค่าเริ่มต้น ไอดีที่ละไว้จะใช้ค่าเริ่มต้นเป็น OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ฮาร์เนส PI ในตัว, `id: "auto"` เพื่อให้ฮาร์เนส Plugin ที่ลงทะเบียนไว้เคลมโมเดลที่รองรับและใช้ PI เมื่อไม่มีรายการใดตรงกัน, ไอดีฮาร์เนสที่ลงทะเบียนไว้ เช่น `id: "codex"` เพื่อบังคับใช้ฮาร์เนสนั้น หรือชื่อแฝงแบ็กเอนด์ CLI ที่รองรับ เช่น `id: "claude-cli"` รันไทม์ Plugin ที่ระบุชัดเจนจะล้มเหลวแบบปิดเมื่อฮาร์เนสไม่พร้อมใช้งานหรือล้มเหลว คงการอ้างอิงโมเดลให้เป็นมาตรฐานในรูปแบบ `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และแบ็กเอนด์การดำเนินการอื่นผ่านคอนฟิกรันไทม์แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเดิม ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) เพื่อดูว่าสิ่งนี้แตกต่างจากการเลือกผู้ให้บริการ/โมเดลอย่างไร
- ตัวเขียนคอนฟิกที่เปลี่ยนแปลงฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบตัวสำรอง) จะบันทึกรูปแบบอ็อบเจ็กต์มาตรฐานและคงรายการตัวสำรองที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบอนุกรม) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมตัวดำเนินการระดับต่ำที่จะรันเทิร์นของเอเจนต์ การติดตั้งส่วนใหญ่ควรคงรันไทม์ OpenClaw Pi ค่าเริ่มต้นไว้ ใช้เมื่อ Plugin ที่เชื่อถือได้มีฮาร์เนสเนทีฟ เช่น ฮาร์เนสเซิร์ฟเวอร์แอป Codex ที่รวมมาด้วย หรือเมื่อคุณต้องการแบ็กเอนด์ CLI ที่รองรับ เช่น Claude CLI สำหรับภาพรวมแนวคิด ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, ไอดีฮาร์เนส Plugin ที่ลงทะเบียนไว้ หรือชื่อแฝงแบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาด้วยลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาด้วยให้แบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` อนุญาตให้ฮาร์เนส Plugin ที่ลงทะเบียนไว้เคลมเทิร์นที่รองรับและใช้ PI เมื่อไม่มีฮาร์เนสใดตรงกัน รันไทม์ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` ต้องมีฮาร์เนสนั้นและจะล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือล้มเหลว
- การเขียนทับด้วยสภาพแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะเขียนทับ `id` สำหรับโปรเซสนั้น
- สำหรับการติดตั้งที่ใช้เฉพาะ Codex ให้ตั้ง `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"`
- สำหรับการติดตั้ง Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดลแบบเดิม `claude-cli/claude-opus-4-7` ยังทำงานเพื่อความเข้ากันได้ แต่คอนฟิกใหม่ควรคงการเลือกผู้ให้บริการ/โมเดลให้เป็นมาตรฐานและใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- ตัวเลือกฮาร์เนสจะถูกตรึงตามไอดีเซสชันหลังการรันแบบฝังครั้งแรก การเปลี่ยนแปลงคอนฟิก/สภาพแวดล้อมมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ทรานสคริปต์ที่มีอยู่ เซสชันแบบเดิมที่มีประวัติทรานสคริปต์แต่ไม่มีพินที่บันทึกไว้จะถือว่าถูกตรึงไว้กับ PI `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการเทิร์นเอเจนต์แบบข้อความ การสร้างสื่อ, วิชัน, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตน

**ชื่อแฝงย่อในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| ชื่อแฝง            | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` หรือ `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

ชื่อแฝงที่คุณคอนฟิกไว้จะมีผลเหนือกว่าค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมด thinking โดยอัตโนมัติ เว้นแต่คุณตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
โมเดล Anthropic Claude 4.6 ใช้ `adaptive` thinking เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับ thinking อย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI เพิ่มเติมสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือรายเอเจนต์ (`agents.list[].systemPromptOverride`) ค่ารายเอเจนต์มีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลอง prompt แบบควบคุม

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

prompt overlay ที่ไม่ขึ้นกับผู้ให้บริการ ใช้ตามตระกูลโมเดล ID โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมที่ใช้ร่วมกันข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะชั้นรูปแบบการโต้ตอบที่เป็นมิตร

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้ชั้นรูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้เฉพาะชั้นที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งานอยู่
- ระบบยังอ่าน `plugins.entries.openai.config.personality` แบบเดิมเมื่อยังไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการแทรก `HEARTBEAT.md` ลงในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของเอเจนต์ Heartbeat ก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายตรง `block` ระงับการส่งไปยังเป้าหมายตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดค่าใช้จ่ายโทเคนต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเคน
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปบนเลนที่ยุ่งเพิ่มเติม: งาน subagent หรือคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- รายเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat รันเทิร์นเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้โทเคนมากขึ้น

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

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งส่วนสำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: ID ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่า จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction เดี่ยวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บท้าย transcript ล่าสุดแบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อตั้งค่าไว้อย่างชัดเจน มิฉะนั้นการ Compaction แบบแมนนวลจะเป็น checkpoint แบบเข้มงวด
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุทึบแสงไว้ระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองเพิ่มเติมสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบ retry-on-malformed-output สำหรับสรุป safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดัน tool-loop ของ Pi เพิ่มเติม เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากเพิ่มผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่ง prompt และใช้เส้นทางกู้คืน precheck เดิมซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ใช้ได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ใน AGENTS.md เพิ่มเติมที่จะแทรกกลับหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดการแทรกกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าเป็นคู่ค่าเริ่มต้นนั้นอย่างชัดเจน หัวข้อเดิม `Every Session`/`Safety` จะยังยอมรับเป็น fallback แบบ legacy
- `model`: การ override `provider/model-id` เพิ่มเติมสำหรับการสรุป Compaction เท่านั้น ใช้เมื่อเซสชันหลักควรคงโมเดลหนึ่งไว้ แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์เพิ่มเติม (`number` หรือสตริงเช่น `"20mb"`) ที่ทริกเกอร์ Compaction ภายในปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยัง transcript สืบทอดที่เล็กลง ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งการแจ้งเตือนสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มต้นและเมื่อเสร็จสมบูรณ์ (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ Compaction ทำงานเงียบ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำถาวร ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นงานดูแลนี้ควรคงอยู่บนโมเดลภายใน เครื่อง override นี้ไม่สืบทอด fallback chain ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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
- `ttl` ควบคุมว่าการตัดแต่งจะรันซ้ำได้บ่อยเพียงใด (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเคนที่แน่นอน
- หากมีข้อความผู้ช่วยน้อยกว่า `keepLastAssistants` จะข้ามการตัดแต่ง

</Accordion>

ดู [การตัดแต่งเซสชัน](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

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

- ช่องทางที่ไม่ใช่ Telegram ต้องมี `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบแบบบล็อก
- การ override ระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรรายบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบแบบบล็อก `natural` = 800–2500ms การ override รายเอเจนต์: `agents.list[].humanDelay`

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

- ค่าเริ่มต้น: `instant` สำหรับแชต/การกล่าวถึงโดยตรง, `message` สำหรับแชตกลุ่มที่ไม่ได้กล่าวถึง
- การแทนที่ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

Sandboxing แบบไม่บังคับสำหรับตัวแทนแบบฝัง ดูคู่มือฉบับเต็มได้ที่ [Sandboxing](/th/gateway/sandboxing)

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
- `workspaceRoot`: รูทระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซต่อขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อไปยัง OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวในขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มควบคุมนโยบายคีย์โฮสต์ของ OpenSSH

**ลำดับความสำคัญการยืนยันตัวตน SSH:**

- `identityData` มีลำดับเหนือ `identityFile`
- `certificateData` มีลำดับเหนือ `certificateFile`
- `knownHostsData` มีลำดับเหนือ `knownHostsFile`
- ค่า `*Data` ที่อิง SecretRef จะถูกแก้ค่าจากสแนปช็อตรันไทม์ secrets ที่ใช้งานอยู่ก่อนเริ่มเซสชัน sandbox

**พฤติกรรมของแบ็กเอนด์ SSH:**

- เติมข้อมูลเริ่มต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงให้เวิร์กสเปซ SSH ระยะไกลเป็นแหล่งหลัก
- ส่งต่อ `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ sandbox

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซ sandbox ต่อขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซ sandbox ที่ `/workspace`, เวิร์กสเปซตัวแทนถูกเมานต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เวิร์กสเปซตัวแทนถูกเมานต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + เวิร์กสเปซต่อหนึ่งตัวแทน (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และเวิร์กสเปซที่ใช้ร่วมกัน (ไม่มีการแยกกันระหว่างเซสชัน)

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

- `mirror`: เติมข้อมูลระยะไกลจากภายในเครื่องก่อน exec, ซิงค์กลับหลัง exec; เวิร์กสเปซภายในเครื่องยังคงเป็นแหล่งหลัก
- `remote`: เติมข้อมูลระยะไกลหนึ่งครั้งเมื่อสร้าง sandbox แล้วคงให้เวิร์กสเปซระยะไกลเป็นแหล่งหลัก

ในโหมด `remote` การแก้ไขภายในเครื่องของโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้า sandbox โดยอัตโนมัติหลังขั้นตอนเติมข้อมูลเริ่มต้น
การรับส่งข้อมูลคือ SSH เข้าไปยัง sandbox ของ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิต sandbox และการซิงค์ mirror แบบไม่บังคับ

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, รูทที่เขียนได้, ผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากตัวแทนต้องการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (ใช้เมื่อจำเป็นเท่านั้น)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; binds แบบส่วนกลางและต่อหนึ่งตัวแทนจะถูกรวมเข้าด้วยกัน

**เบราว์เซอร์ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงแบบผู้สังเกตการณ์ noVNC ใช้การยืนยันตัวตน VNC ตามค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชัน sandbox ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อบริดจ์ส่วนกลางอย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์ไปยังช่วง CIDR ได้แบบไม่บังคับ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์ sandbox เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
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
    เปิดใช้ตามค่าเริ่มต้นและปิดใช้งานได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องใช้
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหากเวิร์กโฟลว์ของคุณ
    ต้องพึ่งพาส่วนขยายนั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดโปรเซส
    ค่าเริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือฐานของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

Sandboxing เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout โปรดดู [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบอินไลน์

### `agents.list` (การแทนที่ต่อหนึ่งตัวแทน)

ใช้ `agents.list[].tts` เพื่อให้ตัวแทนมีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด TTS อัตโนมัติของตัวเอง บล็อกตัวแทนจะ deep-merge ทับ
`messages.tts` ส่วนกลาง ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันจึงอยู่ที่เดียวได้ ขณะที่ตัวแทนแต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ การแทนที่ของตัวแทนที่ใช้งานอยู่
มีผลกับการตอบกลับด้วยเสียงอัตโนมัติ, `/tts audio`, `/tts status`, และ
เครื่องมือตัวแทน `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญได้ที่ [การแปลงข้อความเป็นเสียง](/th/tools/tts#per-agent-voice-overrides)

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

- `id`: id ของเอเจนต์ที่เสถียร (ต้องระบุ).
- `default`: เมื่อกำหนดไว้หลายรายการ รายการแรกจะมีผล (มีการบันทึกคำเตือน). หากไม่ได้กำหนด รายการแรกในลิสต์จะเป็นค่าเริ่มต้น.
- `model`: รูปแบบสตริงจะกำหนดโมเดลหลักต่อเอเจนต์แบบเข้มงวดโดยไม่มีโมเดลสำรอง; รูปแบบอ็อบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks`. ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้เอเจนต์นั้นใช้โมเดลสำรองได้ หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเข้มงวดให้ชัดเจน. งาน Cron ที่ override เฉพาะ `primary` ยังคงสืบทอดค่า fallback เริ่มต้น เว้นแต่คุณจะตั้งค่า `fallbacks: []`.
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models`. ใช้สิ่งนี้สำหรับค่า override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature`, หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด.
- `tts`: ค่า override text-to-speech ต่อเอเจนต์แบบไม่บังคับ. บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` แล้วตั้งเฉพาะค่าที่เฉพาะต่อ persona เช่น provider, voice, model, style หรือ auto mode ที่นี่.
- `skills`: รายการอนุญาต skill ต่อเอเจนต์แบบไม่บังคับ. หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนที่จะผสาน และ `[]` หมายถึงไม่มี Skills.
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`). Override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการตั้งค่า override ต่อข้อความหรือเซสชัน. โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ผู้ให้บริการเป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้ใน Gemini 3/3.1, `thinkingBudget: -1` ใน Gemini 2.5).
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`). Override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการตั้งค่า reasoning override ต่อข้อความหรือเซสชัน.
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับ fast mode แบบไม่บังคับ (`true | false`). ใช้เมื่อไม่มีการตั้งค่า override fast-mode ต่อข้อความหรือเซสชัน.
- `agentRuntime`: ค่า override นโยบาย runtime ระดับต่ำต่อเอเจนต์แบบไม่บังคับ. ใช้ `{ id: "codex" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex เท่านั้น ขณะที่เอเจนต์อื่นยังคงใช้ PI fallback เริ่มต้นในโหมด `auto`.
- `runtime`: ตัวบรรยาย runtime ต่อเอเจนต์แบบไม่บังคับ. ใช้ `type: "acp"` ร่วมกับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรมีค่าเริ่มต้นเป็นเซสชัน ACP harness.
- `identity.avatar`: พาธแบบสัมพัทธ์กับเวิร์กสเปซ, URL `http(s)`, หรือ URI `data:`.
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`.
- `subagents.allowAgents`: รายการอนุญาตของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน). รวม id ของผู้ร้องขอเมื่อควรอนุญาตให้เรียก `agentId` ที่ชี้มายังตัวเอง.
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันของผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่มี sandbox.
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false).

---

## การกำหนดเส้นทางหลายเอเจนต์

รันเอเจนต์ที่แยกจากกันหลายตัวภายใน Gateway เดียว. ดู [หลายเอเจนต์](/th/concepts/multi-agent).

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

- `type` (แบบไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะใช้ค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร.
- `match.channel` (ต้องระบุ)
- `match.accountId` (แบบไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (แบบไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (แบบไม่บังคับ; เฉพาะช่องทาง)
- `acp` (แบบไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ครอบคลุมทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะมีผล.

สำหรับรายการ `type: "acp"`, OpenClaw จะ resolve ตามตัวตนการสนทนาแบบ exact (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับ route binding ข้างต้น.

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

<Accordion title="เครื่องมือแบบอ่านอย่างเดียว + เวิร์กสเปซ">

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

<Accordion title="ไม่มีสิทธิ์เข้าถึงระบบไฟล์ (เฉพาะการส่งข้อความ)">

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [แซนด์บ็อกซ์และเครื่องมือแบบหลาย Agent](/th/tools/multi-agent-sandbox-tools)

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

- **`scope`**: กลยุทธ์พื้นฐานสำหรับการจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันที่แยกจากกันภายในบริบทช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อต้องการบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม ID ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความที่มีผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: จับคู่ ID ตามบัญญัติกับเพียร์ที่มีคำนำหน้าผู้ให้บริการ เพื่อแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แผนที่เดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางอื่นที่ลิงก์ไว้ ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดทั้งคู่ ค่าใดหมดอายุก่อนจะมีผลก่อน ความใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความใหม่ของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, การปลุกของ Cron, การแจ้งเตือน exec และการทำบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่ไม่ได้ทำให้เซสชันรายวัน/ไม่ได้ใช้งานยังสดอยู่
- **`resetByType`**: การแทนที่รายประเภท (`direct`, `group`, `thread`) ค่าเดิม `dm` ยอมรับเป็นนามแฝงของ `direct`
- **`mainKey`**: ฟิลด์เดิม Runtime ใช้ `"main"` สำหรับบักเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่าง Agent ระหว่างการแลกเปลี่ยนแบบ Agent ต่อ Agent (จำนวนเต็ม ช่วง: `0`–`5`) `0` ปิดการเชื่อมลูกโซ่แบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` พร้อมนามแฝงเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธครั้งแรกจะมีผล
- **`maintenance`**: ตัวควบคุมการล้างและการเก็บรักษา session-store
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลแบบแบตช์พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า
  - `resetArchiveRetention`: ระยะเวลาการเก็บรักษาคลังบันทึก transcript แบบ `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นแบบรวมสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรม หน่วยเป็นชั่วโมง (`0` ปิดใช้; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบแข็งเป็นค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดใช้; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตค่าเริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรด ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟค่าเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การแทนที่ระดับช่อง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

การแก้ค่าที่ใช้ (ค่าที่เฉพาะเจาะจงที่สุดชนะ): บัญชี → ช่อง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ต่อ `"auto"` อนุมานจาก `[{identity.name}]`.

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย                | ตัวอย่าง                    |
| ----------------- | ----------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น        | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม     | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ        | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน     | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของ Agent | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่แยกตัวพิมพ์เล็กใหญ่ `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### รีแอ็กชันตอบรับ

- ค่าเริ่มต้นเป็น `identity.emoji` ของ Agent ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งค่าเป็น `""` เพื่อปิดใช้งาน
- การแทนที่ระดับช่อง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการแก้ค่าที่ใช้: บัญชี → ช่อง → `messages.ackReaction` → ค่าถอยกลับของ identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบการตอบรับหลังจากตอบกลับในช่องที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้งานรีแอ็กชันสถานะวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะยังเปิดใช้รีแอ็กชันสถานะเมื่อรีแอ็กชันตอบรับทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานรีแอ็กชันสถานะวงจรชีวิต

### การหน่วงรวมขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งติดกันอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็นรอบ Agent เดียว สื่อ/ไฟล์แนบจะส่งออกทันที คำสั่งควบคุมจะข้ามการหน่วงรวม

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (เลือกเปิดใช้เอง)
- คีย์ API ถอยกลับไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รองรับรหัสผู้ให้บริการเดิม `edge` เป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการแก้ค่าคือ config แล้วจึงเป็น `OPENAI_TTS_BASE_URL` แล้วจึงเป็น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าปลายทางนั้นเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อมีการกำหนดค่าผู้ให้บริการ Talk หลายตัว
- คีย์ Talk แบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายเข้าไปใน `talk.providers.<provider>` โดยอัตโนมัติ
- รหัสเสียงถอยกลับไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รองรับสตริงข้อความธรรมดาหรืออ็อบเจ็กต์ SecretRef
- ค่าถอยกลับ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API ของ Talk
- `providers.*.voiceAliases` ช่วยให้คำสั่ง Talk ใช้ชื่อที่จำง่ายได้
- `providers.mlx.modelId` เลือกรีโป Hugging Face ที่ใช้โดยตัวช่วย MLX ภายในเครื่องของ macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธของตัวช่วยสำหรับการพัฒนา
- `speechLocale` ตั้งค่ารหัสโลแคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของ Talk บน iOS/macOS ไม่ต้องตั้งค่าเพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังจากผู้ใช้เงียบ ก่อนส่งข้อความถอดเสียง หากไม่ได้ตั้งค่าไว้ จะคงช่วงหยุดพักเริ่มต้นของแพลตฟอร์มไว้ (`700 ms on macOS and Android, 900 ms on iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
