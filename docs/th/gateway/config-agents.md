---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, เวิร์กสเปซ, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-12T12:51:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 517aec30ff6c65a269c7e5c8baefb5dc371dabe52d4c38a47a41cae1a1a785e1
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตตามเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ของ Gateway และคีย์ระดับบนสุดอื่นๆ
ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากของคลังเก็บที่ไม่บังคับ ซึ่งแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นที่ไม่บังคับ สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละเว้น `agents.defaults.skills` เพื่อให้ Skills ไม่ถูกจำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่รวมเข้ากับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์บูตสแตรปของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์ workspace ที่ไม่บังคับบางรายการ แต่ยังคงเขียนไฟล์บูตสแตรปที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมว่าไฟล์บูตสแตรปของ workspace จะถูกฉีดเข้าใน system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากคำตอบของผู้ช่วยเสร็จสมบูรณ์แล้ว) จะข้ามการฉีดบูตสแตรปของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดการฉีดบูตสแตรปของ workspace และไฟล์บริบทในทุกเทิร์น ใช้ค่านี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิตของ prompt อย่างเต็มรูปแบบ (เอนจินบริบทแบบกำหนดเอง รันไทม์แบบเนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการฉีดเช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของ workspace ก่อนการตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์บูตสแตรปของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศใน system prompt ที่เอเจนต์มองเห็นเมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความประกาศการตัดทอนเข้าใน system prompt
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่มีการตัดทอน

จำนวนดิบ/จำนวนที่ฉีดโดยละเอียดและฟิลด์สำหรับปรับแต่งการกำหนดค่าจะอยู่ในการวินิจฉัย เช่น
รายงานบริบท/สถานะและบันทึก ส่วนบริบทผู้ใช้/รันไทม์ของ WebChat ตามปกติจะได้รับเฉพาะ
ประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณ prompt/บริบทปริมาณสูงหลายชุด และงบประมาณเหล่านี้ถูก
แยกตามระบบย่อยโดยเจตนา แทนที่จะไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  ส่วนเริ่มต้นของการรันโมเดลแบบรีเซ็ต/เริ่มต้นครั้งเดียว รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะ
  รับทราบการรีเซ็ตโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าใน system prompt
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนของรันไทม์ที่มีขอบเขตและบล็อกที่เป็นของรันไทม์ซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  snippet การค้นหาหน่วยความจำที่ทำดัชนีแล้วและขนาดการฉีด

ใช้การ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมส่วนเริ่มต้นของเทิร์นแรกที่ฉีดในการรันโมเดลแบบรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะรับทราบการรีเซ็ตโดยไม่เรียกใช้
โมเดล ดังนั้นคำสั่งเหล่านี้จะไม่โหลดส่วนเริ่มต้นนี้

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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิวบริบทรันไทม์ที่มีขอบเขต

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
  metadata การตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละเว้น `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่คงไว้และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดานข้อความตัดตอนของ AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การ override ต่อเอเจนต์สำหรับปุ่มปรับ `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอด
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

เพดานทั่วโลกสำหรับรายการ Skills แบบย่อที่ฉีดเข้าใน system prompt ค่านี้
ไม่กระทบต่อการอ่านไฟล์ `SKILL.md` ตามต้องการ

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

การ override ต่อเอเจนต์สำหรับงบประมาณ prompt ของ Skills

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

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบท system prompt (ไม่ใช่ timestamp ของข้อความ) fallback เป็นเขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (การตั้งค่าของ OS)

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

- `model`: ยอมรับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบอ็อบเจ็กต์ตั้งค่าโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: ยอมรับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยพาธเครื่องมือ `image` เป็น config โมเดลวิชัน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/โมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้ refs `provider/model` แบบชัดเจน รองรับ ID แบบไม่มีคำนำหน้าเพื่อความเข้ากันได้ หาก ID แบบไม่มีคำนำหน้าตรงกับรายการที่กำหนดค่าไว้และรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider ให้รายการนั้น รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้า provider อย่างชัดเจน
- `imageGenerationModel`: ยอมรับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบ native, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP แบบพื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth ของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth ได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
- `musicGenerationModel`: ยอมรับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth ได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: ยอมรับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth ได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth/API key ของ provider ที่ตรงกันด้วย
  - provider สร้างวิดีโอ Qwen ที่รวมมาในแพ็กเกจรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider อย่าง `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: ยอมรับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปที่โมเดลเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ในเวลาที่เรียก
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด fallback การแยกข้อมูลในเครื่องมือ `pdf` พิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (ผนวกคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` ราย agent จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ราย agent จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท operator-admin gateway เมื่อไม่มีการตั้งค่า override reasoning ต่อข้อความหรือต่อเซสชัน
- `elevatedDefault`: ระดับเอาต์พุต elevated เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย OpenAI API-key หรือ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นลองรายการที่ตรงกันแบบ provider ที่กำหนดค่าไว้เพียงหนึ่งเดียวสำหรับ ID โมเดลนั้นแบบตรงตัว และหลังจากนั้นจึง fallback ไปยัง provider เริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หาก provider นั้นไม่ expose โมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ที่กำหนดค่าไว้รายการแรกแทนการแสดงค่าเริ่มต้นของ provider ที่ถูกลบออกซึ่งล้าสมัย
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai-codex/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับ provider ที่เลือก โดยไม่ต้องระบุ ID โมเดลทุกรายการด้วยตนเอง
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่ scoped ตาม provider จะ merge โมเดล provider ที่เลือกเข้าในแมปนี้ และคง provider อื่นที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการ inject `context_management` หรือ `params.responsesCompactThreshold` เพื่อ override threshold ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider เริ่มต้นแบบ global ที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการ merge ของ `params` (config): `agents.defaults.params` (ฐาน global) ถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID agent ที่ตรงกัน) จะ override ตาม key ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าใน body คำขอ `api: "openai-completions"` สำหรับ proxy ที่เข้ากันได้กับ OpenAI หากชนกับ key คำขอที่สร้างขึ้น extra body จะชนะ; route completions ที่ไม่ใช่ native ยังคงตัด `store` ที่ใช้เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน body คำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` ที่ปิด thinking อยู่ Plugin vLLM ที่รวมมาในแพ็กเกจจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุอย่างชัดเจนจะ override ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับตัวควบคุม thinking ของ vLLM Qwen ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.thinkingFormat`: สไตล์ payload thinking ที่เข้ากันได้กับ OpenAI ใช้ `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดแบบ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บน backend ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับคำขอ เช่น vLLM OpenClaw แมป thinking ที่ปิดใช้งานเป็น `false` และ thinking ที่เปิดใช้งานเป็น `true`
- `compat.supportedReasoningEfforts`: รายการ effort ของ reasoning ที่เข้ากันได้กับ OpenAI รายโมเดล รวม `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่ยอมรับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบ session patch การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับ provider/model ที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อ backend ต้องการค่าเฉพาะ provider สำหรับระดับ canonical
- `params.preserveThinking`: การ opt-in เฉพาะ Z.AI สำหรับ preserved thinking เมื่อเปิดใช้งานและเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และ replay `reasoning_content` ก่อนหน้า; ดู [Z.AI thinking และ preserved thinking](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: process manager ระดับ provider ที่ไม่บังคับสำหรับเซิร์ฟเวอร์โมเดล local/self-hosted เมื่อโมเดลที่เลือกเป็นของ provider นั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), เริ่ม `command` พร้อม `args` หาก endpoint ใช้งานไม่ได้, รอสูงสุด `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบ absolute `idleStopMs: 0` ทำให้ process ทำงานต่อจนกว่า OpenClaw จะออก; ค่าบวกจะหยุด process ที่ OpenClaw spawn หลังจาก idle เป็นจำนวนมิลลิวินาทีนั้น ดู [บริการโมเดล local](/th/gateway/local-model-services)
- นโยบาย runtime อยู่บน provider หรือโมเดล ไม่ใช่บน `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั้ง provider หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดล agent ของ OpenAI บน provider OpenAI อย่างเป็นทางการจะเลือก Codex โดยค่าเริ่มต้น
- ตัวเขียน config ที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบอ็อบเจ็กต์ canonical และคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรัน agent แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serialize) ค่าเริ่มต้น: 4

### นโยบาย Runtime

```json5
{
  models: {
    providers: {
      openai: {
        agentRuntime: { id: "codex" },
      },
    },
  },
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      models: {
        "anthropic/claude-opus-4-7": {
          agentRuntime: { id: "claude-cli" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID harness ของ Plugin ที่ลงทะเบียนไว้ หรือ alias ของ CLI backend ที่รองรับ Plugin Codex ที่รวมมาในแพ็กเกจลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาในแพ็กเกจให้ CLI backend `claude-cli`
- `id: "auto"` ให้ harness ของ Plugin ที่ลงทะเบียนไว้ claim turn ที่รองรับ และใช้ PI เมื่อไม่มี harness ที่ตรงกัน runtime ของ Plugin แบบชัดเจน เช่น `id: "codex"` ต้องใช้ harness นั้นและ fail closed หากไม่พร้อมใช้งานหรือทำงานล้มเหลว
- key runtime ทั้ง agent เป็นของ legacy `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือก runtime รัน `openclaw doctor --fix` เพื่อลบค่าที่ล้าสมัย
- โมเดล agent ของ OpenAI ใช้ harness Codex โดยค่าเริ่มต้น; `agentRuntime.id: "codex"` ระดับ provider/model ยังใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับการ deploy Claude CLI แนะนำให้ใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` ที่ scoped ตามโมเดล ref โมเดล legacy `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้ แต่ config ใหม่ควรคงการเลือก provider/model ให้เป็น canonical และใส่ backend การประมวลผลไว้ในนโยบาย runtime ของ provider/model
- สิ่งนี้ควบคุมเฉพาะการประมวลผล turn ของ agent แบบข้อความเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตัวเอง

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง               | โมเดล                                  |
| ------------------- | -------------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`            |
| `sonnet`            | `anthropic/claude-sonnet-4-6`          |
| `gpt`               | `openai/gpt-5.5`                       |
| `gpt-mini`          | `openai/gpt-5.4-mini`                  |
| `gpt-nano`          | `openai/gpt-5.4-nano`                  |
| `gemini`            | `google/gemini-3.1-pro-preview`        |
| `gemini-flash`      | `google/gemini-3-flash-preview`        |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview` |

นามแฝงที่คุณกำหนดค่าไว้จะมีความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้งานโหมดคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตัวเอง
โมเดล Z.AI เปิดใช้งาน `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

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
- รองรับเซสชันเมื่อมีการตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์ได้
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้แบ็กเอนด์กู้คืนเซสชันที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัยได้
  จากส่วนท้ายทรานสคริปต์ดิบของ OpenClaw ที่มีขอบเขตกำหนดไว้ ก่อนที่จะมี
  สรุปการ Compaction ครั้งแรก การเปลี่ยนแปลงโปรไฟล์การตรวจสอบสิทธิ์หรือ credential-epoch
  ยังคงไม่ reseed จากข้อมูลดิบโดยเด็ดขาด

### `agents.defaults.systemPromptOverride`

แทนที่พรอมป์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อ agent (`agents.list[].systemPromptOverride`) ค่าราย agent มีความสำคัญเหนือกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

โอเวอร์เลย์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้งานเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้งานเฉพาะเลเยอร์ที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งานอยู่
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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การตรวจสอบสิทธิ์ด้วยคีย์ API) หรือ `1h` (การตรวจสอบสิทธิ์ OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมป์ระบบและข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตให้เทิร์นของ Heartbeat agent ทำงานก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเหมือนกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม: งาน subagent หรือคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ต่อ agent: ตั้งค่า `agents.list[].heartbeat` เมื่อมี agent ใดก็ตามกำหนด `heartbeat` **เฉพาะ agent เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat จะรันเทิร์น agent แบบเต็ม ช่วงเวลาที่สั้นกว่าจะใช้โทเค็นมากกว่า

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

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งเป็นชิ้นสำหรับประวัติยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อกำหนดไว้ จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction ครั้งเดียวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดแบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อมีการตั้งค่าไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นจุดตรวจแบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการรักษาตัวระบุแบบทึบไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองเสริมสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบ retry-on-malformed-output สำหรับสรุปแบบ safeguard เปิดใช้งานเป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดัน tool-loop ของ Pi แบบเสริม เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากต่อท้ายผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่เพื่อย่อผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ใช้งานได้กับโหมด Compaction ทั้ง `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบเสริมสำหรับฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้งานการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าเป็นคู่ค่าเริ่มต้นนั้นอย่างชัดเจน หัวข้อ `Every Session`/`Safety` แบบเก่าจะถูกยอมรับเป็น fallback แบบ legacy ด้วย
- `model`: การ override `provider/model-id` แบบเสริมสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรคงโมเดลหนึ่งไว้ แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์เสริม (`number` หรือสตริงเช่น `"20mb"`) ที่กระตุ้น Compaction ภายในเครื่องตามปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์สืบทอดที่เล็กกว่าได้ ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ถึงผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (ตัวอย่างเช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction ทำงานเงียบ ๆ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำระยะยาว ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การ override จะไม่สืบทอด fallback chain ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

### `agents.defaults.runRetries`

ขอบเขตจำนวนรอบ retry ของลูปรันภายนอกสำหรับ runner Pi แบบฝัง เพื่อป้องกันลูปการดำเนินการไม่รู้จบระหว่างการกู้คืนจากความล้มเหลว โปรดทราบว่าการตั้งค่านี้ในปัจจุบันมีผลเฉพาะกับรันไทม์ agent แบบฝังเท่านั้น ไม่ใช่รันไทม์ ACP หรือ CLI

```json5
{
  agents: {
    defaults: {
      runRetries: {
        base: 24,
        perProfile: 8,
        min: 32,
        max: 160,
      },
    },
    list: [
      {
        id: "main",
        runRetries: { max: 50 }, // optional per-agent overrides
      },
    ],
  },
}
```

- `base`: จำนวนพื้นฐานของรอบ retry การรันสำหรับลูปรันภายนอก ค่าเริ่มต้น: `24`
- `perProfile`: จำนวนรอบ retry การรันเพิ่มเติมที่ให้ต่อผู้สมัครโปรไฟล์ fallback ค่าเริ่มต้น: `8`
- `min`: ขีดจำกัดสัมบูรณ์ขั้นต่ำสำหรับจำนวนรอบ retry การรัน ค่าเริ่มต้น: `32`
- `max`: ขีดจำกัดสัมบูรณ์สูงสุดสำหรับจำนวนรอบ retry การรันเพื่อป้องกันการดำเนินการที่หลุดควบคุม ค่าเริ่มต้น: `160`

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

<Accordion title="cache-ttl mode behavior">

- `mode: "cache-ttl"` เปิดใช้งานรอบการตัดทอน
- `ttl` ควบคุมความถี่ที่การตัดทอนจะสามารถทำงานซ้ำได้อีกครั้ง (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดทอนจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินไปก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้ายไว้ และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดทอน/ล้าง
- อัตราส่วนอิงตามอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความของ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัดทอน

</Accordion>

ดูรายละเอียดพฤติกรรมที่ [การตัดทอนเซสชัน](/th/concepts/session-pruning)

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

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้งานการตอบกลับแบบบล็อก
- การ override ต่อช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรแบบต่อบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override ต่อ agent: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรม + การแบ่งชิ้นส่วนที่ [การสตรีม](/th/concepts/streaming)

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

- ค่าเริ่มต้น: `instant` สำหรับแชทโดยตรง/การ mention, `message` สำหรับแชทกลุ่มที่ไม่ได้ mention
- การ override ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การ sandbox แบบไม่บังคับสำหรับ agent แบบฝังตัว ดูคู่มือฉบับเต็มที่ [Sandboxing](/th/gateway/sandboxing)

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

- `docker`: รันไทม์ Docker ภายในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่ใช้ SSH รองรับ
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การกำหนดค่า backend SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: root ระยะไกลแบบ absolute ที่ใช้สำหรับ workspace ต่อขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหา inline หรือ SecretRefs ที่ OpenClaw materialize เป็นไฟล์ชั่วคราวตอนรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีสิทธิ์เหนือกว่า `identityFile`
- `certificateData` มีสิทธิ์เหนือกว่า `certificateFile`
- `knownHostsData` มีสิทธิ์เหนือกว่า `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูก resolve จาก snapshot รันไทม์ secrets ที่ใช้งานอยู่ก่อนที่เซสชัน sandbox จะเริ่ม

**พฤติกรรมของ backend SSH:**

- seed workspace ระยะไกลหนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นคงให้ workspace SSH ระยะไกลเป็น canonical
- route `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ sync การเปลี่ยนแปลงระยะไกลกลับไปยัง host โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ sandbox

**การเข้าถึง workspace:**

- `none`: workspace sandbox ต่อขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: workspace sandbox ที่ `/workspace`, workspace ของ agent ถูก mount แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: workspace ของ agent ถูก mount แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + workspace ต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + workspace ต่อ agent (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

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

- `mirror`: seed ระยะไกลจากภายในเครื่องก่อน exec, sync กลับหลัง exec; workspace ภายในเครื่องยังคงเป็น canonical
- `remote`: seed ระยะไกลหนึ่งครั้งเมื่อสร้าง sandbox แล้วคงให้ workspace ระยะไกลเป็น canonical

ในโหมด `remote` การแก้ไขภายในเครื่องของ host ที่ทำนอก OpenClaw จะไม่ถูก sync เข้าสู่ sandbox โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งคือ SSH เข้าไปยัง sandbox ของ OpenShell แต่ Plugin เป็นเจ้าของ lifecycle ของ sandbox และ mirror sync แบบไม่บังคับ

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้, ผู้ใช้ root

**ค่าเริ่มต้นของคอนเทนเนอร์คือ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หาก agent ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ใน workspace ที่ใช้งานอยู่

**`docker.binds`** mount ไดเรกทอรี host เพิ่มเติม; binds ระดับ global และต่อ agent จะถูก merge เข้าด้วยกัน

**เบราว์เซอร์แบบ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้าไปใน system prompt ไม่ต้องมี `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC observer ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะ emit URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันแบบ sandbox ไม่ให้กำหนดเป้าหมายไปที่เบราว์เซอร์ของ host
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบ global อย่างชัดเจน
- `cdpSourceRange` จำกัด ingress ของ CDP ที่ edge ของคอนเทนเนอร์ไปยังช่วง CIDR ได้แบบไม่บังคับ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` mount ไดเรกทอรี host เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์ sandbox เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นการเปิดใช้งานถูกกำหนดใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับ host คอนเทนเนอร์:
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
  - `--disable-extensions` (เปิดใช้งานเป็นค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu` ถูก
    เปิดใช้งานเป็นค่าเริ่มต้น และสามารถปิดใช้งานได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้งานส่วนขยายอีกครั้ง หาก workflow ของคุณ
    พึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดโปรเซส
    เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้งาน `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของ image คอนเทนเนอร์; ใช้ image เบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การ sandbox เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้าง images (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout โปรดดูคำสั่ง `docker build` แบบ inline ที่ [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การ override ต่อ agent)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล, สไตล์ หรือโหมด auto-TTS เฉพาะให้กับเอเจนต์ บล็อกของเอเจนต์จะ deep-merge ทับ `messages.tts` ส่วนกลาง ดังนั้นข้อมูลรับรองที่ใช้ร่วมกันจึงอยู่ในที่เดียวได้ ในขณะที่เอเจนต์แต่ละตัว override เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ override ของเอเจนต์ที่ใช้งานอยู่จะมีผลกับคำตอบแบบพูดอัตโนมัติ, `/tts audio`, `/tts status` และเครื่องมือเอเจนต์ `tts` ดู [ข้อความเป็นเสียงพูด](/th/tools/tts#per-agent-voice-overrides) สำหรับตัวอย่างผู้ให้บริการและลำดับความสำคัญ

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

- `id`: id ของเอเจนต์ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้ง primary เฉพาะเอเจนต์แบบเข้มงวดโดยไม่มี model fallback; รูปแบบอ็อบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้เอเจนต์นั้นเลือกใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมเฉพาะเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้ค่านี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override ข้อความเป็นเสียงพูดแบบเฉพาะเอเจนต์ที่ไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เจาะจงตามบุคลิก เช่น ผู้ให้บริการ เสียง โมเดล สไตล์ หรือโหมดอัตโนมัติไว้ที่นี่
- `skills`: allowlist ของ Skills เฉพาะเอเจนต์ที่ไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนที่จะ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นเฉพาะเอเจนต์ที่ไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ต่อข้อความหรือต่อเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง thinking แบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นเฉพาะเอเจนต์ที่ไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override reasoning ต่อข้อความหรือต่อเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นเฉพาะเอเจนต์สำหรับ fast mode ที่ไม่บังคับ (`true | false`) ใช้เมื่อไม่มี override fast-mode ต่อข้อความหรือต่อเซสชัน
- `models`: override แค็ตตาล็อกโมเดล/รันไทม์เฉพาะเอเจนต์ที่ไม่บังคับ โดยใช้ id แบบเต็ม `provider/model` เป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้นรันไทม์เฉพาะเอเจนต์
- `runtime`: descriptor รันไทม์เฉพาะเอเจนต์ที่ไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้นของ `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน harness ของ ACP เป็นค่าเริ่มต้น
- `identity.avatar`: พาธแบบสัมพัทธ์กับเวิร์กสเปซ, URL `http(s)` หรือ URI `data:`
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) รวม id ของผู้ร้องขอเมื่อควรอนุญาตให้เรียก `agentId` ที่ชี้มาที่ตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันของผู้ร้องขอถูก sandbox ไว้ `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่มี sandbox
- `subagents.requireAgentId`: เมื่อเป็น true ให้บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

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

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (เมื่อไม่มี type จะใช้ route เป็นค่าเริ่มต้น), `acp` สำหรับ binding การสนทนา ACP แบบ persistent
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ด้วย identity การสนทนาแบบ exact (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับ route binding ข้างต้น

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

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (เฉพาะข้อความเท่านั้น)">

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

- **`scope`**: กลยุทธ์พื้นฐานในการจัดกลุ่มเซสชันสำหรับบริบทแชตกลุ่ม.
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้รับเซสชันที่แยกออกจากกันภายในบริบทของช่องทาง.
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางจะแชร์เซสชันเดียวกัน (ใช้เฉพาะเมื่อตั้งใจให้แชร์บริบท).
- **`dmScope`**: วิธีจัดกลุ่มข้อความส่วนตัว.
  - `main`: ข้อความส่วนตัวทั้งหมดแชร์เซสชันหลัก.
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง.
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความเข้าหลายผู้ใช้).
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี).
- **`identityLinks`**: แมปรหัสมาตรฐานไปยังเพียร์ที่มีคำนำหน้าผู้ให้บริการเพื่อแชร์เซสชันข้ามช่องทาง. คำสั่งเชื่อมโยง เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางอื่นที่ลิงก์ไว้; ดู [การเชื่อมช่องทาง](/th/concepts/channel-docking).
- **`reset`**: นโยบายรีเซ็ตหลัก. `daily` รีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes`. เมื่อตั้งค่าทั้งสองแบบ รายการที่หมดอายุก่อนจะมีผล. ความสดใหม่สำหรับการรีเซ็ตแบบรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่สำหรับการรีเซ็ตแบบไม่มีการใช้งานใช้ `lastInteractionAt`. การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, การปลุกของ Cron, การแจ้งเตือนการรันคำสั่ง และงานบันทึกบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่สิ่งเหล่านี้ไม่ทำให้เซสชัน `daily`/`idle` ถูกนับว่ายังสดใหม่.
- **`resetByType`**: การแทนที่รายประเภท (`direct`, `group`, `thread`). `dm` รุ่นเดิมยอมรับเป็นนามแฝงของ `direct`.
- **`mainKey`**: ฟิลด์เดิม. รันไทม์ใช้ `"main"` สำหรับบัคเก็ตแชตโดยตรงหลักเสมอ.
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบการตอบกลับไปมาสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ต่อเอเจนต์ (จำนวนเต็ม, ช่วง: `0`-`20`, ค่าเริ่มต้น: `5`). `0` ปิดใช้การเชื่อมต่อเนื่องแบบตอบกลับไปมา.
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, พร้อมนามแฝงรุ่นเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix`. กฎปฏิเสธรายการแรกมีผล.
- **`maintenance`**: การล้างข้อมูลที่จัดเก็บเซสชัน + การควบคุมการเก็บรักษา.
  - `mode`: `warn` แสดงคำเตือนเท่านั้น; `enforce` ใช้การล้างข้อมูล.
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ล้าสมัย (ค่าเริ่มต้น `30d`).
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`). รันไทม์จะเขียนการล้างข้อมูลแบบแบตช์พร้อมบัฟเฟอร์เผื่อเหนือขีดจำกัดเล็กน้อยสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที.
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากการกำหนดค่ารุ่นเก่า.
  - `resetArchiveRetention`: การเก็บรักษาอาร์ไคฟ์บทถอดความ `*.reset.<timestamp>`. ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งค่าเป็น `false` เพื่อปิดใช้.
  - `maxDiskBytes`: โควตาดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ. ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน.
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างข้อมูลตามโควตา. ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`.
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด.
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: การเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมงตามค่าเริ่มต้น (`0` ปิดใช้; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวเป็นชั่วโมงตามค่าเริ่มต้น (`0` ปิดใช้; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตเริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการสร้างเธรดของ ACP. ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้.
  - `defaultSpawnContext`: บริบทเอเจนต์ย่อยเนทีฟเริ่มต้นสำหรับการสร้างที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`). ค่าเริ่มต้นเป็น `"fork"`.

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

การแทนที่รายช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

ลำดับการตัดสินค่า (รายการที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่องทาง → ส่วนกลาง. `""` ปิดใช้และหยุดการไล่ลำดับ. `"auto"` สร้างจาก `[{identity.name}]`.

**ตัวแปรเทมเพลต:**

| ตัวแปร             | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม    | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ       | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน    | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์เอเจนต์   | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กใหญ่. `{think}` เป็นนามแฝงของ `{thinkingLevel}`.

### รีแอ็กชันรับทราบ

- ค่าเริ่มต้นเป็น `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"`. ตั้งค่า `""` เพื่อปิดใช้.
- การแทนที่รายช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- ลำดับการตัดสินค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่า fallback จากอัตลักษณ์.
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`.
- `removeAckAfterReply`: ลบการรับทราบหลังตอบกลับบนช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ iMessage.
- `messages.statusReactions.enabled`: เปิดใช้รีแอ็กชันสถานะตามวงจรชีวิตบน Slack, Discord และ Telegram.
  บน Slack และ Discord หากไม่ตั้งค่า จะยังเปิดใช้รีแอ็กชันสถานะเมื่อรีแอ็กชันรับทราบทำงานอยู่.
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้รีแอ็กชันสถานะตามวงจรชีวิต.

### การหน่วงรวมข้อความขาเข้า

รวมชุดข้อความแบบข้อความเท่านั้นที่ส่งถี่จากผู้ส่งรายเดียวกันให้เป็นรอบเอเจนต์เดียว. สื่อ/ไฟล์แนบจะส่งออกทันที. คำสั่งควบคุมจะข้ามการหน่วงรวม.

### TTS (ข้อความเป็นเสียง)

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

- `auto` ควบคุมโหมด TTS อัตโนมัติเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged`. `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่อง และ `/tts status` แสดงสถานะที่มีผลจริง.
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ.
- `modelOverrides` เปิดใช้ตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้).
- คีย์ API จะสำรองกลับไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`.
- ผู้ให้บริการเสียงพูดที่รวมมาอยู่ภายใต้ความรับผิดชอบของ Plugin. หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS. รหัสผู้ให้บริการรุ่นเดิม `edge` ยอมรับเป็นนามแฝงของ `microsoft`.
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS. ลำดับการตัดสินค่าคือการกำหนดค่า จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`.
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนคลายการตรวจสอบโมเดล/เสียง.

---

## พูดคุย

ค่าเริ่มต้นสำหรับโหมดพูดคุย (macOS/iOS/Android).

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
    consultThinkingLevel: "low",
    consultFastMode: true,
    speechLocale: "ru-RU",
    silenceTimeoutMs: 1500,
    interruptOnSpeech: true,
    realtime: {
      provider: "openai",
      providers: {
        openai: {
          model: "gpt-realtime-2",
          voice: "cedar",
        },
      },
      instructions: "Speak warmly and keep answers brief.",
      mode: "realtime",
      transport: "webrtc",
      brain: "agent-consult",
    },
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการโหมดพูดคุยหลายราย.
- คีย์โหมดพูดคุยแบบแบนรุ่นเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น. รัน `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`.
- รหัสเสียงจะสำรองกลับไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`.
- `providers.*.apiKey` รับสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef.
- การสำรองกลับไปใช้ `ELEVENLABS_API_KEY` จะใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับโหมดพูดคุย.
- `providers.*.voiceAliases` ทำให้คำสั่งโหมดพูดคุยใช้ชื่อที่เป็นมิตรได้.
- `providers.mlx.modelId` เลือกรีโพสิตอรี Hugging Face ที่ตัวช่วย MLX ภายในเครื่องบน macOS ใช้. หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`.
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน PATH; `OPENCLAW_MLX_TTS_BIN` แทนที่เส้นทางตัวช่วยสำหรับการพัฒนา.
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบเรียลไทม์ของอินเทอร์เฟซควบคุมโหมดพูดคุย. ปล่อยว่างไว้เพื่อคงพฤติกรรมเซสชัน/โมเดลปกติ.
- `consultFastMode` ตั้งค่าการแทนที่โหมดเร็วแบบใช้ครั้งเดียวสำหรับการเรียกปรึกษาแบบเรียลไทม์ของอินเทอร์เฟซควบคุมโหมดพูดคุย โดยไม่เปลี่ยนการตั้งค่าโหมดเร็วปกติของเซสชัน.
- `speechLocale` ตั้งค่ารหัสโลแคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของโหมดพูดคุยบน iOS/macOS. ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์.
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดพูดคุยรอหลังจากผู้ใช้เงียบ ก่อนส่งบทถอดความ. หากไม่ตั้งค่า จะคงกรอบเวลาหยุดพักค่าเริ่มต้นของแพลตฟอร์มไว้ (`700 ms on macOS and Android, 900 ms on iOS`).
- `realtime.instructions` ผนวกคำสั่งระบบสำหรับผู้ให้บริการเข้ากับพรอมป์เรียลไทม์ในตัวของ OpenClaw เพื่อให้กำหนดค่าสไตล์เสียงได้โดยไม่สูญเสียแนวทาง `openclaw_agent_consult` เริ่มต้น.

---

## ที่เกี่ยวข้อง

- [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์กำหนดค่าอื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
