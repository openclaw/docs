---
read_when:
    - การปรับค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับเซสชัน การส่งข้อความ และพฤติกรรมของโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-07T13:16:41Z"
    model: gpt-5.5
    provider: openai
    source_hash: 287b832cda451900ff184546ee38313e1304ffc9bb52bacae6b1f457c64f4c08
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตเฉพาะเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับแชนเนล เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
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

รูทรายการเก็บข้อมูลแบบไม่บังคับที่แสดงในบรรทัด Runtime ของพรอมต์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นแบบไม่บังคับสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น
  และจะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้การสร้างไฟล์บูตสแตรปของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซแบบไม่บังคับที่เลือกไว้ ขณะที่ยังเขียนไฟล์บูตสแตรปที่จำเป็น ค่าใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมเวลาที่ไฟล์บูตสแตรปของเวิร์กสเปซถูกฉีดเข้าไปในพรอมต์ระบบ ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีดบูตสแตรปของเวิร์กสเปซซ้ำ เพื่อลดขนาดพรอมต์ การรัน Heartbeat และการลองซ้ำหลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้การฉีดบูตสแตรปของเวิร์กสเปซและไฟล์บริบทในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิตพรอมต์ทั้งหมดเอง (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทของตนเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการฉีดด้วยเช่นกัน

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

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์บูตสแตรปของเวิร์กสเปซทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศในพรอมต์ระบบที่เอเจนต์เห็นเมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความแจ้งการตัดทอนเข้าไปในพรอมต์ระบบ
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อซิกเนเจอร์การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอน

จำนวนดิบ/ที่ฉีดอย่างละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ในข้อมูลวินิจฉัย เช่น
รายงานและบันทึกบริบท/สถานะ ส่วนบริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับเฉพาะ
ประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมต์/บริบทปริมาณมากหลายรายการ และงบประมาณเหล่านี้ถูก
แบ่งตามระบบย่อยโดยตั้งใจ แทนที่จะไหลผ่านปุ่มควบคุมทั่วไปเพียงปุ่มเดียวทั้งหมด

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปของเวิร์กสเปซตามปกติ
- `agents.defaults.startupContext.*`:
  พรีลูดการรันโมเดลแบบครั้งเดียวเมื่อรีเซ็ต/เริ่มต้น รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการยืนยัน
  โดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมต์ระบบ
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนรันไทม์แบบมีขอบเขตและบล็อกที่ฉีดซึ่งรันไทม์เป็นเจ้าของ
- `memory.qmd.limits.*`:
  ขนาดสนิปเป็ตการค้นหาหน่วยความจำที่จัดทำดัชนีและการฉีด

ใช้การแทนที่ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่แตกต่าง:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมพรีลูดเริ่มต้นในเทิร์นแรกที่ฉีดเมื่อรันโมเดลจากการรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะยืนยันการรีเซ็ตโดยไม่เรียกใช้
โมเดล จึงไม่โหลดพรีลูดนี้

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

- `memoryGetMaxChars`: เพดานข้อความตัดตอนเริ่มต้นของ `memory_get` ก่อนเพิ่ม
  เมทาดาทาการตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่คงไว้และ
  การกู้คืนส่วนเกิน
- `postCompactionMaxChars`: เพดานข้อความตัดตอนของ AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับปุ่มควบคุม `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานส่วนกลางสำหรับรายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมต์ระบบ ค่านี้
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

การแทนที่ต่อเอเจนต์สำหรับงบประมาณพรอมต์ Skills

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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของทรานสคริปต์/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้โทเค็นวิชันและขนาดเพย์โหลดคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมต์ระบบ (ไม่ใช่เวลาประทับของข้อความ) จะถอยกลับไปใช้เขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาในพรอมต์ระบบ ค่าเริ่มต้น: `auto` (ค่ากำหนดของ OS)

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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งเฉพาะโมเดลหลัก
  - รูปแบบอ็อบเจกต์จะตั้งโมเดลหลักพร้อมโมเดลเฟลโอเวอร์ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นค่ากำหนดโมเดลวิชันของเครื่องมือนั้น
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/โมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - ควรใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบยอมรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้ซึ่งรองรับรูปภาพเพียงรายการเดียวใน `models.providers.*.models` OpenClaw จะเติมผู้ให้บริการนั้นให้ ID นั้น รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้าผู้ให้บริการแบบชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างรูปภาพแบบใช้ร่วมกันและพื้นผิวเครื่องมือ/Plugin ในอนาคตใดๆ ที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างเพลงแบบใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างวิดีโอแบบใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่รวมมาในชุดรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะสำรองไปที่ `imageModel` แล้วจึงไปที่โมเดลเซสชัน/ค่าเริ่มต้นที่แก้ค่าได้แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองการดึงข้อมูลของเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับรายละเอียดเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือในร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (เพิ่มคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็นเหตุผลเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้นของเหตุผลที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการแทนที่เหตุผลรายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วยคีย์ API ของ OpenAI หรือ Codex OAuth) หากคุณละผู้ให้บริการ OpenClaw จะลองนามแฝงก่อน จากนั้นลองรายการผู้ให้บริการที่กำหนดค่าไว้ซึ่งตรงกับ ID โมเดลนั้นแบบไม่ซ้ำ และจึงค่อยสำรองไปที่ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะสำรองไปที่ผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้วและค้างอยู่
- `models`: แคตตาล็อกโมเดลที่กำหนดค่าไว้และรายการอนุญาตสำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการอนุญาตที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์กำหนดค่า/เริ่มใช้งานแบบจำกัดขอบเขตผู้ให้บริการจะผสานโมเดลผู้ให้บริการที่เลือกลงในแมปนี้และเก็บผู้ให้บริการอื่นที่กำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการแทรก `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่เกณฑ์ ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการเริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล ตั้งที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการผสาน `params` (ค่ากำหนด): `agents.defaults.params` (ฐานส่วนกลาง) จะถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID เอเจนต์ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON ส่งผ่านขั้นสูงที่ผสานลงในเนื้อหาคำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น เนื้อหาเสริมจะชนะ เส้นทางคอมพลีชันที่ไม่ใช่เนทีฟยังคงลบ `store` ที่ใช้เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์เทมเพลตแชตที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานลงในเนื้อหาคำขอระดับบนสุด `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` เมื่อปิดการคิด Plugin vLLM ที่รวมมาในชุดจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่กำหนดชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีความสำคัญสุดท้าย สำหรับการควบคุมการคิดของ vLLM Qwen ให้ตั้ง `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการระดับความพยายามด้านเหตุผลที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับเอนด์พอยต์กำหนดเองที่ยอมรับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง, แถวเซสชัน Gateway, การตรวจสอบแพตช์เซสชัน, การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าที่เฉพาะกับผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกเปิดเฉพาะ Z.AI สำหรับการคงการคิดไว้ เมื่อเปิดใช้งานและการคิดเปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [การคิดและการคงการคิดไว้ของ Z.AI](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำเริ่มต้น ID ที่ละไว้จะมีค่าเริ่มต้นเป็น OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ฮาร์เนส PI ในตัว, `id: "auto"` เพื่อให้ฮาร์เนส Plugin ที่ลงทะเบียนอ้างสิทธิ์โมเดลที่รองรับและใช้ PI เมื่อไม่มีรายการใดตรง, ID ฮาร์เนสที่ลงทะเบียน เช่น `id: "codex"` เพื่อบังคับใช้ฮาร์เนสนั้น หรือชื่อแทนแบ็กเอนด์ CLI ที่รองรับ เช่น `id: "claude-cli"` รันไทม์ Plugin แบบระบุชัดเจนจะล้มเหลวแบบปิดเมื่อฮาร์เนสไม่พร้อมใช้งานหรือล้มเหลว เก็บการอ้างอิงโมเดลให้เป็นมาตรฐานในรูปแบบ `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และแบ็กเอนด์การดำเนินการอื่นผ่านค่ากำหนดรันไทม์แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเดิม ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) เพื่อดูว่าสิ่งนี้ต่างจากการเลือกผู้ให้บริการ/โมเดลอย่างไร
- ตัวเขียนค่ากำหนดที่เปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบตัวสำรอง) จะบันทึกรูปแบบอ็อบเจกต์มาตรฐานและเก็บรายการสำรองที่มีอยู่เมื่อทำได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบเรียงลำดับ) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมตัวดำเนินการระดับต่ำที่รันเทิร์นของเอเจนต์ การใช้งานส่วนใหญ่ควรคงรันไทม์ OpenClaw Pi เริ่มต้นไว้ ใช้ค่านี้เมื่อ Plugin ที่เชื่อถือได้ให้ฮาร์เนสเนทีฟ เช่นฮาร์เนสเซิร์ฟเวอร์แอป Codex ที่รวมมาในชุด หรือเมื่อคุณต้องการแบ็กเอนด์ CLI ที่รองรับ เช่น Claude CLI สำหรับโมเดลแนวคิด ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, ID ฮาร์เนส Plugin ที่ลงทะเบียน หรือชื่อแทนแบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาในชุดลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาในชุดให้แบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` ให้ฮาร์เนส Plugin ที่ลงทะเบียนอ้างสิทธิ์เทิร์นที่รองรับและใช้ PI เมื่อไม่มีฮาร์เนสใดตรงกัน รันไทม์ Plugin แบบระบุชัดเจน เช่น `id: "codex"` ต้องใช้ฮาร์เนสนั้นและล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือล้มเหลว
- การแทนที่ด้วยสภาพแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะแทนที่ `id` สำหรับโปรเซสนั้น
- โมเดลเอเจนต์ OpenAI ใช้ฮาร์เนส Codex โดยค่าเริ่มต้น; `agentRuntime.id: "codex"` ยังคงใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับการใช้งาน Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดลแบบเดิม `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้ แต่ค่ากำหนดใหม่ควรคงการเลือกผู้ให้บริการ/โมเดลให้อยู่ในรูปแบบมาตรฐาน และใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือกฮาร์เนสจะถูกตรึงตาม ID เซสชันหลังจากการรันแบบฝังครั้งแรก การเปลี่ยนค่ากำหนด/สภาพแวดล้อมจะมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ทรานสคริปต์ที่มีอยู่ เซสชัน OpenAI แบบเดิมที่มีประวัติทรานสคริปต์แต่ไม่มีพินที่บันทึกไว้จะใช้ Codex; พิน OpenAI PI ที่ค้างอยู่สามารถซ่อมได้ด้วย `openclaw doctor --fix` `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการเทิร์นเอเจนต์แบบข้อความเท่านั้น การสร้างสื่อ, วิชัน, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตน

**ชื่อแทนย่อในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง             | โมเดล                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

นามแฝงที่คุณกำหนดค่าไว้จะชนะค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x เปิดใช้โหมดคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 มีค่าเริ่มต้นเป็นการคิดแบบ `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI แบบไม่บังคับสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
- รองรับการส่งต่อรูปภาพเมื่อ `imageArg` รับเส้นทางไฟล์

### `agents.defaults.systemPromptOverride`

แทนที่ system prompt ทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือแยกตาม agent (`agents.list[].systemPromptOverride`) ค่าระดับ agent จะมีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีเพียงช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลอง prompt แบบควบคุม

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

prompt overlays ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งนำไปใช้ตามตระกูลโมเดล ID โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร

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
- `"off"` ปิดใช้เฉพาะเลเยอร์ที่เป็นมิตร ส่วนสัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งาน
- ค่าเดิม `plugins.entries.openai.config.personality` ยังคงถูกอ่านเมื่อยังไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อตั้งเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อตั้งเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับหนึ่งเทิร์นของ Heartbeat agent ก่อนถูกยกเลิก เว้นว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตให้ส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อตั้งเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อตั้งเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K token
- `skipWhenBusy`: เมื่อตั้งเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม ได้แก่ งาน subagent หรืองานคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- แยกตาม agent: ตั้งค่า `agents.list[].heartbeat` เมื่อมี agent ใดกำหนด `heartbeat` **เฉพาะ agent เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat รันเป็นเทิร์น agent เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้ token มากขึ้น

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
- `provider`: ID ของ Compaction provider plugin ที่ลงทะเบียนไว้ เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะถอยกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้ง ก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้าย transcript ล่าสุดไว้แบบคำต่อคำ การใช้ `/compact` ด้วยตนเองจะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบทำเองจะเป็น checkpoint แบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเพิ่มคำแนะนำในตัวสำหรับการคงตัวระบุแบบ opaque ไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบ retry-on-malformed-output สำหรับสรุป safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้ง `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของ tool-loop ของ Pi แบบไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากต่อท้ายผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พออีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่ง prompt และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ใช้งานได้ทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบไม่บังคับสำหรับฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้ง `[]` เพื่อปิดการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งอย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อเก่า `Every Session`/`Safety` จะยอมรับเป็น fallback แบบ legacy ด้วย
- `model`: การ override `provider/model-id` แบบไม่บังคับสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรคงโมเดลหนึ่งไว้ แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์แบบไม่บังคับ (`number` หรือสตริงอย่าง `"20mb"`) ที่กระตุ้น Compaction ภายในเครื่องแบบปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จหมุนไปยัง transcript ตัวถัดไปที่เล็กกว่าได้ ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "กำลัง Compact บริบท..." และ "Compaction เสร็จสมบูรณ์") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำที่คงทน ตั้ง `model` เป็น provider/model ที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อต้องการให้เทิร์นงานบำรุงรักษานี้อยู่บนโมเดล local; การ override นี้ไม่สืบทอด chain fallback ของเซสชันที่ใช้งานอยู่ จะถูกข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

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

<Accordion title="ลักษณะการทำงานของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้รอบการตัดแต่ง
- `ttl` ควบคุมความถี่ที่การตัดแต่งสามารถรันซ้ำได้ (หลังจากการแตะ cache ครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินไปก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดแต่ง/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวน token ที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` การตัดแต่งจะถูกข้าม

</Accordion>

ดู [การตัดแต่งเซสชัน](/th/concepts/session-pruning) สำหรับรายละเอียดลักษณะการทำงาน

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

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การ override ตามช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรแยกตามบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override แยกตาม agent: `agents.list[].humanDelay`

ดู [การสตรีม](/th/concepts/streaming) สำหรับรายละเอียดลักษณะการทำงาน + การแบ่งชิ้น

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
- การแทนที่ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำแซนด์บ็อกซ์แบบไม่บังคับสำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มได้ที่ [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

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

**Backend:**

- `docker`: รันไทม์ Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่รองรับด้วย SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การกำหนดค่า SSH backend:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซตามแต่ละขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีสิทธิเหนือกว่า `identityFile`
- `certificateData` มีสิทธิเหนือกว่า `certificateFile`
- `knownHostsData` มีสิทธิเหนือกว่า `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูก resolve จากสแนปช็อตรันไทม์ของความลับที่ใช้งานอยู่ก่อนเริ่มเซสชันแซนด์บ็อกซ์

**พฤติกรรมของ SSH backend:**

- เติมข้อมูลเริ่มต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงเวิร์กสเปซ SSH ระยะไกลเป็นแหล่งหลัก
- ส่งต่อ `exec`, เครื่องมือไฟล์ และเส้นทางสื่อผ่าน SSH
- ไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์ตามแต่ละขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เมานต์เวิร์กสเปซของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + เวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และเวิร์กสเปซที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

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

- `mirror`: เติมข้อมูลระยะไกลจากในเครื่องก่อน exec, ซิงก์กลับหลัง exec; เวิร์กสเปซในเครื่องยังคงเป็นแหล่งหลัก
- `remote`: เติมข้อมูลระยะไกลหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ จากนั้นคงเวิร์กสเปซระยะไกลเป็นแหล่งหลัก

ในโหมด `remote` การแก้ไขในเครื่องโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงก์เข้าแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนเติมข้อมูลเริ่มต้น
การขนส่งคือ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตแซนด์บ็อกซ์และการซิงก์แบบ mirror ที่ไม่บังคับ

**`setupCommand`** รันหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, รูทที่เขียนได้, ผู้ใช้ root

**ค่าเริ่มต้นของคอนเทนเนอร์คือ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หากเอเจนต์ต้องมีการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่าอย่างชัดเจน
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (ใช้เมื่อจำเป็นจริง ๆ)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; การ bind ระดับ global และต่อเอเจนต์จะถูกรวมเข้าด้วยกัน

**เบราว์เซอร์แซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC จะถูกฉีดเข้าไปใน system prompt ไม่จำเป็นต้องมี `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC แบบผู้สังเกตการณ์ใช้การยืนยันตัวตน VNC ตามค่าเริ่มต้น และ OpenClaw จะออก URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกไม่ให้เซสชันแซนด์บ็อกซ์กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- ค่าเริ่มต้นของ `network` คือ `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบ global อย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์ไว้ที่ช่วง CIDR ได้ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นการเปิดใช้งานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับให้เหมาะกับโฮสต์คอนเทนเนอร์:
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
    เปิดใช้งานตามค่าเริ่มต้น และปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D จำเป็นต้องใช้
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้งานส่วนขยายอีกครั้งหากเวิร์กโฟลว์ของคุณ
    พึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งค่า `0` เพื่อใช้
    ขีดจำกัดกระบวนการเริ่มต้นของ Chromium
  - และเพิ่ม `--no-sandbox` เมื่อเปิดใช้งาน `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้เฉพาะ Docker

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดูคำสั่ง `docker build` แบบอินไลน์ได้ที่ [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การแทนที่ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS เฉพาะสำหรับเอเจนต์ บล็อกของเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันจึงอยู่รวมไว้ที่เดียวได้ ในขณะที่
เอเจนต์แต่ละตัวแทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ การแทนที่ของเอเจนต์ที่ใช้งานอยู่
จะมีผลกับการตอบกลับเสียงพูดอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญได้ที่ [แปลงข้อความเป็นเสียง](/th/tools/tts#per-agent-voice-overrides)

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

- `id`: id เอเจนต์ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่ได้ตั้งไว้เลย รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงตั้งค่า primary ต่อเอเจนต์แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเปิด fallback ให้เอเจนต์นั้น หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังสืบทอด fallback ค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้ค่านี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override text-to-speech ต่อเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บ credential ของ provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เฉพาะกับ persona เช่น provider, voice, model, style หรือ auto mode ที่นี่
- `skills`: allowlist ของ skill ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ต่อข้อความหรือเซสชัน โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override reasoning ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับ fast mode แบบไม่บังคับ (`true | false`) ใช้เมื่อไม่มี override fast-mode ต่อข้อความหรือเซสชัน
- `agentRuntime`: override นโยบาย runtime ระดับต่ำต่อเอเจนต์แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้เอเจนต์หนึ่งเป็น Codex-only ขณะที่เอเจนต์อื่นยังคง fallback PI เริ่มต้นในโหมด `auto`
- `runtime`: descriptor ของ runtime ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรตั้งค่าเริ่มต้นเป็นเซสชัน ACP harness
- `identity.avatar`: พาธแบบ relative กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` อนุมานค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) รวม id ของ requester เมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายมายังตัวเอง
- guard การสืบทอด sandbox: หากเซสชัน requester อยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

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

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (เมื่อไม่มี type จะใช้ route เป็นค่าเริ่มต้น), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะ channel)
- `acp` (ไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบ deterministic:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันทุกประการ, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้ง channel)
6. เอเจนต์เริ่มต้น

ภายในแต่ละ tier รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ด้วย identity การสนทนาที่ตรงกันทุกประการ (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับ tier ของ route binding ด้านบน

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

<Accordion title="รายละเอียดฟิลด์เซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับการจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้เซสชันที่แยกออกจากกันภายในบริบทช่องทางหนึ่ง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางหนึ่งใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้มีบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความแบบหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมปรหัสมาตรฐานไปยังเพียร์ที่มีคำนำหน้าผู้ให้บริการสำหรับการใช้เซสชันร่วมกันข้ามช่องทาง คำสั่ง dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางอื่นที่เชื่อมโยงไว้; ดู [การ dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` จะรีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` จะรีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองอย่าง ค่าใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อไม่มีการใช้งานใช้ `lastInteractionAt` การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, Cron wakeups, การแจ้งเตือน exec และการทำบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันแบบรายวัน/ไม่มีการใช้งานยังสดใหม่อยู่
- **`resetByType`**: การเขียนทับรายประเภท (`direct`, `group`, `thread`) ยอมรับ `dm` แบบเดิมเป็น alias ของ `direct`
- **`mainKey`**: ฟิลด์เดิม Runtime ใช้ `"main"` สำหรับบัคเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ถึงเอเจนต์ (จำนวนเต็ม, ช่วง: `0`–`5`) `0` ปิดใช้การเชื่อมลูกโซ่แบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, พร้อม alias เดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธรายการแรกจะมีผล
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงคำเตือนเท่านั้น; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ค้างเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลเป็นชุดพร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับเพดานขนาดใช้งานจริง; `openclaw sessions cleanup --enforce` ใช้เพดานทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจาก config รุ่นเก่า
  - `resetArchiveRetention`: การเก็บรักษาคลัง transcript `*.reset.<timestamp>` ค่าเริ่มต้นคือ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถเขียนทับได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้; ผู้ให้บริการสามารถเขียนทับได้)
  - `maxAgeHours`: ค่าเริ่มต้นสำหรับอายุสูงสุดแบบบังคับเป็นชั่วโมง (`0` ปิดใช้; ผู้ให้บริการสามารถเขียนทับได้)
  - `spawnSessions`: เกตเริ่มต้นสำหรับการสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรด ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถเขียนทับได้
  - `defaultSpawnContext`: บริบท subagent เนทีฟเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

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

การแทนที่ต่อช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

การแก้ค่า (รายการที่เจาะจงที่สุดมีผล): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ลำดับค่า `"auto"` สร้างจาก `[{identity.name}]`.

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย             | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม    | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ       | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน    | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ `{think}` เป็นชื่อแทนของ `{thinkingLevel}`

### รีแอกชันรับทราบ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งค่าเป็น `""` เพื่อปิดใช้งาน
- การแทนที่ต่อช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการแก้ค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่า fallback จากอัตลักษณ์
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบการรับทราบหลังตอบกลับบนช่องทางที่รองรับรีแอกชัน เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้งานรีแอกชันสถานะตามวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะยังคงเปิดใช้งานรีแอกชันสถานะเมื่อรีแอกชันรับทราบทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานรีแอกชันสถานะตามวงจรชีวิต

### การหน่วงรับข้อความเข้า

รวมข้อความแบบข้อความล้วนที่ส่งมาอย่างรวดเร็วจากผู้ส่งเดียวกันให้เป็นเทิร์นเอเจนต์เดียว สื่อ/ไฟล์แนบจะส่งออกทันที คำสั่งควบคุมข้ามการหน่วงนี้

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; ค่าเริ่มต้นของ `modelOverrides.allowProvider` คือ `false` (ต้องเลือกเปิดใช้)
- คีย์ API fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS ตัวระบุผู้ให้บริการเดิม `edge` ยอมรับเป็นชื่อแทนของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการแก้ค่าคือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

---

## การพูดคุย

ค่าเริ่มต้นสำหรับโหมดการพูดคุย (macOS/iOS/Android)

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการการพูดคุยหลายราย
- คีย์การพูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`
- ตัวระบุเสียง fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับการพูดคุย
- `providers.*.voiceAliases` ทำให้คำสั่งการพูดคุยใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ helper MLX ภายในเครื่องบน macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่าน helper `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่เส้นทาง helper สำหรับการพัฒนา
- `speechLocale` ตั้งค่าตัวระบุภาษา BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของการพูดคุยบน iOS/macOS ไม่ต้องตั้งค่าเพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมว่าโหมดการพูดคุยจะรอนานเพียงใดหลังผู้ใช้เงียบก่อนส่งบันทึกถอดเสียง หากไม่ได้ตั้งค่าไว้ จะใช้ช่วงพักเริ่มต้นของแพลตฟอร์ม (`700 ms on macOS and Android, 900 ms on iOS`)

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
