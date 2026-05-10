---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกแบบหลายเอเจนต์
    - การปรับเซสชัน การส่งข้อความ และพฤติกรรมโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่าการพูดคุย
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-10T19:36:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 455c4f0db2ab42b699f920f90639f18d0d370ed4f98a5fa664f154318db99a11
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าแบบจำกัดขอบเขตเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
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

รูทของรีโพสิทอรีที่ไม่บังคับ ซึ่งแสดงในบรรทัด Runtime ของพรอมป์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นที่ไม่บังคับสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
`agents.list[].skills`.

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
  จะไม่รวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์บูตสแตรปของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซที่เป็นตัวเลือกบางไฟล์ โดยยังคงเขียนไฟล์บูตสแตรปที่จำเป็นอยู่ ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมว่าไฟล์บูตสแตรปของเวิร์กสเปซจะถูกฉีดเข้าไปในพรอมป์ระบบเมื่อใด ค่าเริ่มต้น: `"always"`.

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากคำตอบของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีดบูตสแตรปของเวิร์กสเปซซ้ำ เพื่อลดขนาดพรอมป์ การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งานการฉีดบูตสแตรปของเวิร์กสเปซและไฟล์บริบทในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิตพรอมป์ของตนอย่างสมบูรณ์ (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการฉีดด้วยเช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของเวิร์กสเปซก่อนตัดทอน ค่าเริ่มต้น: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์บูตสแตรปของเวิร์กสเปซทั้งหมด ค่าเริ่มต้น: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศในพรอมป์ระบบที่เอเจนต์มองเห็นเมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`.

- `"off"`: ไม่ฉีดข้อความประกาศการตัดทอนเข้าไปในพรอมป์ระบบ
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อซิกเนเจอร์การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอนอยู่

จำนวนแบบดิบ/ที่ฉีดโดยละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ในข้อมูลวินิจฉัย เช่น
รายงานและล็อกบริบท/สถานะ ส่วนบริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับเฉพาะ
ประกาศการกู้คืนแบบกระชับเท่านั้น

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมป์/บริบทปริมาณสูงหลายชุด และถูกแยกตามระบบย่อย
โดยตั้งใจ แทนที่จะให้ทุกอย่างไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปเวิร์กสเปซตามปกติ
- `agents.defaults.startupContext.*`:
  พรีลูดสำหรับการรันโมเดลเมื่อรีเซ็ต/เริ่มต้นแบบครั้งเดียว รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะถูกตอบรับ
  โดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบกะทัดรัดที่ฉีดเข้าไปในพรอมป์ระบบ
- `agents.defaults.contextLimits.*`:
  ส่วนตัดตอนรันไทม์แบบมีขอบเขตและบล็อกที่ฉีดซึ่งรันไทม์เป็นเจ้าของ
- `memory.qmd.limits.*`:
  ขนาดสไนปเป็ตการค้นหาหน่วยความจำที่ทำดัชนีและการฉีด

ใช้การแทนที่แบบต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่แตกต่างกัน:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมพรีลูดเริ่มต้นในเทิร์นแรกที่ฉีดในการรันโมเดลเมื่อรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
โมเดล ดังนั้นจึงไม่โหลดพรีลูดนี้

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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิวบริบทรันไทม์แบบมีขอบเขต

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

- `memoryGetMaxChars`: เพดานส่วนตัดตอนเริ่มต้นของ `memory_get` ก่อนเพิ่ม
  เมตาดาต้าการตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่คงอยู่และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดานส่วนตัดตอนของ AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับปุ่มปรับ `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานส่วนกลางสำหรับรายการ Skills แบบกะทัดรัดที่ฉีดเข้าไปในพรอมป์ระบบ สิ่งนี้
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

การแทนที่ต่อเอเจนต์สำหรับงบประมาณพรอมป์ Skills

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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของภาพในบล็อกรูปภาพของทรานสคริปต์/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`.

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาดเพย์โหลดคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะเก็บรายละเอียดภาพได้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมป์ระบบ (ไม่ใช่ประทับเวลาข้อความ) หากไม่มีจะย้อนกลับไปใช้เขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาในพรอมป์ระบบ ค่าเริ่มต้น: `auto` (ค่ากำหนดของ OS)

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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบอ็อบเจ็กต์ตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับสำหรับ failover
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นคอนฟิกโมเดลวิชัน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้ ref แบบ `provider/model` ที่ชัดเจน รองรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่รองรับรูปภาพซึ่งคอนฟิกไว้ใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider นั้นให้ หากตรงกับหลายรายการที่คอนฟิกไว้ ต้องใส่ provider prefix อย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย capability สร้างรูปภาพร่วม และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้คอนฟิก auth ของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider สร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย capability สร้างเพลงร่วม และเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider สร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้คอนฟิก auth/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดย capability สร้างวิดีโอร่วม และเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider สร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้คอนฟิก auth/API key ของ provider ที่ตรงกันด้วย
  - provider สร้างวิดีโอ Qwen ที่รวมมา รองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปที่โมเดลเซสชัน/ค่าเริ่มต้นที่ resolve ได้
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF ค่าเริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ขณะเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดค่าเริ่มต้นที่โหมด fallback ของการแยกข้อมูลในเครื่องมือ `pdf` พิจารณา
- `verboseDefault`: ระดับ verbose ค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือ progress-draft ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับแบบมนุษย์ที่กระชับ) หรือ `"raw"` (เพิ่มคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning ค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่คอนฟิกไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการตั้งค่าแทนที่ reasoning ต่อข้อความหรือต่อเซสชัน
- `elevatedDefault`: ระดับเอาต์พุต elevated ค่าเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย OpenAI API-key หรือ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองการจับคู่ provider ที่คอนฟิกไว้และไม่ซ้ำสำหรับ model id นั้นเท่านั้น แล้วจึง fallback ไปที่ provider ค่าเริ่มต้นที่คอนฟิกไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` ที่ชัดเจน) หาก provider นั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่คอนฟิกไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model รายการแรกที่คอนฟิกไว้แทนการแสดงค่าเริ่มต้นของ provider ที่ถูกนำออกและค้างอยู่
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่คอนฟิกไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai-codex/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับ provider ที่เลือก โดยไม่ต้องระบุทุก model id เอง
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding แบบจำกัดขอบเขตตาม provider จะ merge โมเดลของ provider ที่เลือกเข้าไปในแผนที่นี้ และรักษา provider อื่นที่คอนฟิกไว้แล้วโดยไม่เกี่ยวข้อง
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่ threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider ค่าเริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการ merge ของ `params` (คอนฟิก): `agents.defaults.params` (ฐานส่วนกลาง) ถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (ต่อโมเดล) แล้ว `agents.list[].params` (agent id ที่ตรงกัน) จะแทนที่ตาม key ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าไปใน request body ของ `api: "openai-completions"` สำหรับ proxy ที่เข้ากันได้กับ OpenAI หากชนกับ request key ที่สร้างขึ้น extra body จะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` เฉพาะ OpenAI ออกหลังจากนั้น
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าไปใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` ที่ปิด thinking ไว้ Plugin vLLM ที่รวมมาจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับตัวควบคุม thinking ของ vLLM Qwen ให้ตั้ง `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.thinkingFormat`: รูปแบบ payload thinking ที่เข้ากันได้กับ OpenAI ใช้ `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดสไตล์ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนแบ็กเอนด์ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับ request เช่น vLLM OpenClaw จะแมป thinking ที่ปิดไว้เป็น `false` และ thinking ที่เปิดไว้เป็น `true`
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ที่เข้ากันได้กับ OpenAI ต่อโมเดล ใส่ `"xhigh"` สำหรับ endpoint กำหนดเองที่รองรับจริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบ session patch การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับ provider/model ที่คอนฟิกไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะ provider สำหรับระดับมาตรฐาน
- `params.preserveThinking`: ตัวเลือกเปิดใช้เฉพาะ Z.AI สำหรับการเก็บรักษา thinking เมื่อเปิดใช้งานและ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [Z.AI thinking and preserved thinking](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: ตัวจัดการโปรเซสระดับ provider แบบไม่บังคับสำหรับเซิร์ฟเวอร์โมเดล local/self-hosted เมื่อโมเดลที่เลือกเป็นของ provider นั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), เริ่ม `command` พร้อม `args` หาก endpoint ล่ม, รอสูงสุด `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบ absolute `idleStopMs: 0` ทำให้โปรเซสยังมีชีวิตอยู่จนกว่า OpenClaw จะออก ค่าบวกจะหยุดโปรเซสที่ OpenClaw spawn หลังจากว่างเป็นจำนวนมิลลิวินาทีนั้น ดู [บริการโมเดลโลคัล](/th/gateway/local-model-services)
- นโยบาย runtime ควรอยู่บน provider หรือโมเดล ไม่ใช่บน `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั้ง provider หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดลเอเจนต์ OpenAI บน provider OpenAI ทางการจะเลือก Codex เป็นค่าเริ่มต้น
- ตัวเขียนคอนฟิกที่เปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบอ็อบเจ็กต์ canonical และรักษารายการ fallback ที่มีอยู่เมื่อทำได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serialize) ค่าเริ่มต้น: 4

### นโยบาย runtime

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

- `id`: `"auto"`, `"pi"`, id ของ harness Plugin ที่ลงทะเบียนไว้ หรือ alias ของแบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้แบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` อนุญาตให้ harness ของ Plugin ที่ลงทะเบียนไว้อ้างสิทธิ์ turn ที่รองรับ และใช้ PI เมื่อไม่มี harness ที่ตรงกัน runtime ของ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` ต้องใช้ harness นั้น และจะ fail closed หากไม่พร้อมใช้งานหรือล้มเหลว
- คีย์ runtime ทั้งเอเจนต์เป็นแบบ legacy `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, พิน runtime ของเซสชัน และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือก runtime เรียกใช้ `openclaw doctor --fix` เพื่อลบค่าที่ค้างอยู่
- โมเดลเอเจนต์ OpenAI ใช้ harness Codex เป็นค่าเริ่มต้น; `agentRuntime.id: "codex"` ของ provider/model ยังคงใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับการ deploy Claude CLI ให้ใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` แบบจำกัดขอบเขตโมเดล ref โมเดล legacy `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้ แต่คอนฟิกใหม่ควรรักษาการเลือก provider/model ให้เป็น canonical และใส่แบ็กเอนด์การดำเนินการไว้ในนโยบาย runtime ของ provider/model
- ส่วนนี้ควบคุมเฉพาะการดำเนินการ text agent-turn เท่านั้น การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตัวเอง

**คำย่อ alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

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

นามแฝงที่คุณกำหนดค่าไว้จะมีผลเหนือกว่าค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมดคิดโดยอัตโนมัติ เว้นแต่คุณตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตนเอง
โมเดล Z.AI เปิดใช้ `tool_stream` ตามค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
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

- แบ็กเอนด์ CLI เน้นข้อความเป็นหลัก เครื่องมือจะถูกปิดใช้อยู่เสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งภาพผ่านเมื่อ `imageArg` ยอมรับพาธไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้แบ็กเอนด์กู้คืนเซสชันที่ถูกทำให้ไม่ถูกต้องอย่างปลอดภัย
  จากส่วนท้ายทรานสคริปต์ดิบของ OpenClaw ที่มีขอบเขต ก่อนที่จะมีสรุป Compaction แรก
  การเปลี่ยนแปลงโปรไฟล์การยืนยันตัวตนหรือยุคของข้อมูลประจำตัว
  ยังคงไม่ทำ raw-reseed

### `agents.defaults.systemPromptOverride`

แทนที่พรอมป์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่ารายเอเจนต์มีผลเหนือกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

โอเวอร์เลย์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการซึ่งใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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
- `"off"` ปิดใช้เฉพาะเลเยอร์ที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้อยู่
- ยังคงอ่าน `plugins.entries.openai.config.personality` รุ่นเดิมเมื่อไม่ได้ตั้งค่าร่วมนี้

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
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมป์ระบบและข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของเอเจนต์ Heartbeat ก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งโดยตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตให้ส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม: งาน subagent หรือคำสั่งแบบซ้อน เลน Cron จะเลื่อน Heartbeat เสมอแม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
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
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนแล้ว เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัด Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดแบบคงข้อความเดิม การ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อถูกตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นจุดตรวจแบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการเก็บรักษาตัวระบุทึบแสงไว้ข้างหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบเสริมสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบที่ลองใหม่เมื่อผลลัพธ์ผิดรูปสำหรับสรุป safeguard เปิดใช้ตามค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของ tool-loop ของ Pi แบบเสริม เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากผนวกผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป ระบบจะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบเสริมที่จะฉีดซ้ำหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้การฉีดซ้ำ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าอย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อรุ่นเก่า `Every Session`/`Safety` จะได้รับการยอมรับเป็น fallback รุ่นเดิมด้วย
- `model`: การแทนที่ `provider/model-id` แบบเสริมสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์แบบเสริม (`number` หรือสตริงอย่าง `"20mb"`) ที่ทริกเกอร์ Compaction ภายในเครื่องแบบปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จหมุนไปยังทรานสคริปต์สืบทอดที่เล็กกว่า ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ไปยังผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้ตามค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การแทนที่นี้จะไม่สืบทอดเชน fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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
- `ttl` ควบคุมว่าการตัดสามารถรันอีกครั้งได้บ่อยเพียงใด (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้ายและแทรก `...` ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัด/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` การตัดจะถูกข้าม

</Accordion>

ดู [การตัดเซสชัน](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

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
- การ override ระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และรูปแบบต่อบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override ต่อ agent: `agents.list[].humanDelay`

ดู [การสตรีม](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรมและการแบ่งชิ้น

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
- การ override ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การ sandbox แบบไม่บังคับสำหรับ agent แบบฝังตัว ดู [การ sandbox](/th/gateway/sandboxing) สำหรับคู่มือฉบับเต็ม

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
- `workspaceRoot`: root ระยะไกลแบบ absolute ที่ใช้สำหรับ workspace ต่อ scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบ inline หรือ SecretRefs ที่ OpenClaw แปลงเป็นไฟล์ชั่วคราวขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีผลเหนือ `identityFile`
- `certificateData` มีผลเหนือ `certificateFile`
- `knownHostsData` มีผลเหนือ `knownHostsFile`
- ค่า `*Data` ที่อิง SecretRef จะถูก resolve จาก snapshot รันไทม์ secrets ที่ใช้งานอยู่ก่อนเริ่มเซสชัน sandbox

**พฤติกรรมของแบ็กเอนด์ SSH:**

- seed workspace ระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงให้ workspace SSH ระยะไกลเป็น canonical
- route `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ sync การเปลี่ยนแปลงระยะไกลกลับไปยัง host โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ sandbox

**การเข้าถึงพื้นที่ทำงาน:**

- `none`: พื้นที่ทำงานแบบ sandbox แยกตามขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: พื้นที่ทำงานแบบ sandbox ที่ `/workspace`, พื้นที่ทำงานของเอเจนต์ถูกเมานต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: พื้นที่ทำงานของเอเจนต์ถูกเมานต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + พื้นที่ทำงานแยกตามเซสชัน
- `agent`: คอนเทนเนอร์ + พื้นที่ทำงานหนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และพื้นที่ทำงานที่ใช้ร่วมกัน (ไม่มีการแยกระหว่างเซสชัน)

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

- `mirror`: seed รีโมตจากโลคัลก่อน exec แล้วซิงค์กลับหลัง exec; พื้นที่ทำงานโลคัลยังคงเป็น canonical
- `remote`: seed รีโมตหนึ่งครั้งเมื่อสร้าง sandbox จากนั้นให้พื้นที่ทำงานรีโมตเป็น canonical

ในโหมด `remote` การแก้ไขบน host-local ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
การรับส่งข้อมูลคือ SSH เข้าไปยัง sandbox OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตของ sandbox และการซิงค์ mirror แบบไม่บังคับ

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้, ผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) ถ้าเอเจนต์ต้องมีการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณตั้งค่าอย่างชัดเจนเป็น
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในพื้นที่ทำงานที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรี host เพิ่มเติม; bind แบบ global และแบบต่อเอเจนต์จะถูกผสานกัน

**เบราว์เซอร์แบบ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC สำหรับผู้สังเกตการณ์ใช้การยืนยันตัวตน VNC โดยค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเคนอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันแบบ sandbox ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของ host
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบ global อย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรี host เพิ่มเติมเข้าไปเฉพาะคอนเทนเนอร์เบราว์เซอร์ sandbox เมื่อตั้งค่า (รวมถึง `[]`) จะใช้ค่านี้แทน `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
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
  - `--disable-extensions` (เปิดใช้โดยค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu`
    เปิดใช้โดยค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` ถ้าการใช้งาน WebGL/3D ต้องใช้
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งถ้า workflow ของคุณ
    ต้องพึ่งพาสิ่งเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัด process
    ค่าเริ่มต้นของ Chromium
  - เพิ่ม `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นเป็น baseline ของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำ sandbox ให้เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm โดยไม่มี source checkout โปรดดู [การทำ Sandbox § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

### `agents.list` (การ override ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของตัวเอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` แบบ global ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันจึงอยู่รวมในที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
override เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ การ override ของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับแบบพูดอัตโนมัติ, `/tts audio`, `/tts status`, และ
เครื่องมือเอเจนต์ `tts` ดู [การแปลงข้อความเป็นเสียง](/th/tools/tts#per-agent-voice-overrides)
สำหรับตัวอย่างผู้ให้บริการและลำดับความสำคัญ

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

- `id`: รหัส Agent ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้งค่า primary แบบเข้มงวดต่อ Agent โดยไม่มี model สำรอง; รูปแบบอ็อบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้ Agent นั้นใช้ fallback ได้ หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังสืบทอด fallback ค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อ Agent ที่ merge ทับรายการ model ที่เลือกใน `agents.defaults.models` ใช้ค่านี้สำหรับ override เฉพาะ Agent เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำทั้งแค็ตตาล็อก model
- `tts`: override การแปลงข้อความเป็นเสียงต่อ Agent แบบไม่บังคับ บล็อกนี้ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรอง provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เฉพาะกับ persona เช่น provider, voice, model, style หรือ auto mode ที่นี่
- `skills`: allowlist ของ skill ต่อ Agent แบบไม่บังคับ หากละไว้ Agent จะสืบทอด `agents.defaults.skills` เมื่อตั้งไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี skills
- `thinkingDefault`: ระดับ thinking ค่าเริ่มต้นต่อ Agent แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) Override `agents.defaults.thinkingDefault` สำหรับ Agent นี้เมื่อไม่มี override ต่อข้อความหรือต่อเซสชัน โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดถูกต้อง; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning ค่าเริ่มต้นต่อ Agent แบบไม่บังคับ (`on | off | stream`) Override `agents.defaults.reasoningDefault` สำหรับ Agent นี้เมื่อไม่มี override reasoning ต่อข้อความหรือต่อเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อ Agent สำหรับ fast mode แบบไม่บังคับ (`true | false`) ใช้เมื่อไม่มี override fast-mode ต่อข้อความหรือต่อเซสชัน
- `models`: override แค็ตตาล็อก model/runtime ต่อ Agent แบบไม่บังคับ โดยใช้รหัส `provider/model` เต็มเป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้น runtime ต่อ Agent
- `runtime`: descriptor ของ runtime ต่อ Agent แบบไม่บังคับ ใช้ `type: "acp"` กับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อ Agent ควรมีค่าเริ่มต้นเป็นเซสชัน ACP harness
- `identity.avatar`: พาธสัมพัทธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของรหัส Agent สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: Agent เดียวกันเท่านั้น) รวมรหัสผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่ชี้มายังตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขอถูก sandbox ไว้ `sessions_spawn` จะปฏิเสธเป้าหมายที่จะทำงานแบบไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true ให้บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลาย Agent

เรียกใช้ Agent ที่แยกจากกันหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

### ฟิลด์การจับคู่ Binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่หายไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดได้แน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. Agent ค่าเริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะแก้ไขโดยใช้ตัวตนการสนทนาแบบตรงกัน exact (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับ route binding ด้านบน

### โปรไฟล์การเข้าถึงต่อ Agent

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

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (รับส่งข้อความเท่านั้น)">

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
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันแยกภายในบริบทช่องทางหนึ่ง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางหนึ่งใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม ID ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความแบบผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป ID ตามรูปแบบมาตรฐานไปยัง peer ที่มีคำนำหน้าผู้ให้บริการสำหรับการแชร์เซสชันข้ามช่องทาง คำสั่ง dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยัง peer ช่องทางอื่นที่ลิงก์ไว้ ดู [การ dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` จะรีเซ็ตที่เวลาท้องถิ่น `atHour`; `idle` จะรีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองไว้ รายการใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อไม่มีการใช้งานใช้ `lastInteractionAt` การเขียนเบื้องหลัง/เหตุการณ์ระบบ เช่น heartbeat, การปลุกจาก cron, การแจ้งเตือน exec และงานบันทึก bookkeeping ของ gateway อาจอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชัน daily/idle ยังคงสดใหม่
- **`resetByType`**: การแทนที่แยกตามประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็น alias ของ `direct`
- **`mainKey`**: ฟิลด์เดิม Runtime จะใช้ `"main"` สำหรับ bucket แชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบการตอบกลับไปมาสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ต่อเอเจนต์ (จำนวนเต็ม ช่วง: `0`–`5`) `0` จะปิดการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ด้วย `channel`, `chatType` (`direct|group|channel`, พร้อม alias เดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` กฎ deny แรกที่ตรงกันจะมีผล
- **`maintenance`**: การล้าง session-store + ตัวควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ใช้การล้างข้อมูลจริง
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime จะเขียนการล้างแบบ batch พร้อม buffer high-water ขนาดเล็กสำหรับขีดจำกัดระดับ production; `openclaw sessions cleanup --enforce` จะใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจาก config เก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษา archive transcript `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นรวมสำหรับฟีเจอร์เซสชันที่ผูกกับ thread
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการ auto-unfocus เมื่อไม่มีการใช้งานในหน่วยชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบ hard max เริ่มต้นในหน่วยชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: gate เริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับ thread จาก `sessions_spawn` และการ spawn thread ของ ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้ thread bindings; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบท subagent native เริ่มต้นสำหรับการ spawn ที่ผูกกับ thread (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การแทนที่แยกตามช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การเลือกค่า (ค่าที่เจาะจงที่สุดชนะ): บัญชี → ช่องทาง → ค่าส่วนกลาง `""` จะปิดใช้งานและหยุด cascade `"auto"` จะได้ค่าจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร          | คำอธิบาย            | ตัวอย่าง                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม  | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ          | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์    | (เหมือนกับ `"auto"`)          |

ตัวแปรไม่คำนึงถึงตัวพิมพ์ใหญ่เล็ก `{think}` เป็น alias ของ `{thinkingLevel}`

### ปฏิกิริยา ack

- ค่าเริ่มต้นเป็น `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- การแทนที่แยกตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการเลือกค่า: บัญชี → ช่องทาง → `messages.ackReaction` → fallback จาก identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับบนช่องทางที่รองรับปฏิกิริยา เช่น Slack, Discord, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้งานปฏิกิริยาสถานะตามวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่า จะคงปฏิกิริยาสถานะไว้เมื่อปฏิกิริยา ack เปิดใช้งานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานปฏิกิริยาสถานะตามวงจรชีวิต

### Debounce ขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งมาเร็วจากผู้ส่งคนเดียวกันให้เป็นรอบเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้าม debouncing

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ prefs ภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้)
- API keys fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการ speech ที่ bundled มาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS ID ผู้ให้บริการเดิม `edge` รองรับเป็น alias ของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint OpenAI TTS ลำดับการเลือกค่าคือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนคลายการตรวจสอบโมเดล/เสียง

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการ Talk หลายราย
- คีย์ Talk แบบ flat เดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่ persist ไว้ใหม่เป็น `talk.providers.<provider>`
- Voice IDs fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริง plaintext หรือออบเจ็กต์ SecretRef
- fallback `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่า API key ของ Talk
- `providers.*.voiceAliases` ช่วยให้ directive ของ Talk ใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ helper MLX ภายในเครื่องของ macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่าน helper `openclaw-mlx-tts` ที่ bundled มาเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่ path ของ helper สำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก Control UI Talk realtime `openclaw_agent_consult` ไม่ต้องตั้งค่าเพื่อคงพฤติกรรมเซสชัน/โมเดลตามปกติ
- `consultFastMode` ตั้งค่า one-shot fast-mode override สำหรับการปรึกษาแบบ realtime ของ Control UI Talk โดยไม่เปลี่ยนการตั้งค่า fast-mode ปกติของเซสชัน
- `speechLocale` ตั้งค่า ID locale แบบ BCP 47 ที่การรู้จำเสียงพูดของ iOS/macOS Talk ใช้ ไม่ต้องตั้งค่าเพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่า จะคงหน้าต่างหยุดพักเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `realtime.instructions` ต่อท้ายคำสั่งระบบที่หันไปยังผู้ให้บริการเข้ากับ prompt realtime ในตัวของ OpenClaw เพื่อให้กำหนดสไตล์เสียงได้โดยไม่สูญเสียคำแนะนำ `openclaw_agent_consult` เริ่มต้น

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าแบบรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
