---
read_when:
    - ปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับลักษณะการทำงานของเซสชัน การส่งข้อความ และโหมดสนทนา
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-11T20:29:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: fbc8f9ff61cb1780dc038c71e3b2f2dd2d5d9fe6582ddf76d44a7dba21d13908
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่กำหนดขอบเขตตามเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่น ๆ
ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference).

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`.

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รูทของ repository ที่เลือกได้ ซึ่งแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจาก workspace.

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist Skills ค่าเริ่มต้นที่เลือกได้สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละเว้น `agents.defaults.skills` เพื่ออนุญาต Skills แบบไม่จำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์บูตสแตรปของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`).

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์ workspace ที่เลือกได้บางไฟล์ ขณะที่ยังเขียนไฟล์บูตสแตรปที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`.

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

ควบคุมเวลาที่ไฟล์บูตสแตรปของ workspace ถูกฉีดเข้าไปใน system prompt ค่าเริ่มต้น: `"always"`.

- `"continuation-skip"`: เทิร์นการดำเนินต่อที่ปลอดภัย (หลังจาก assistant ตอบเสร็จแล้ว) จะข้ามการฉีดบูตสแตรปของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองซ้ำหลัง Compaction จะยังสร้าง context ใหม่
- `"never"`: ปิดการฉีดบูตสแตรปของ workspace และไฟล์ context ในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิต prompt อย่างเต็มรูปแบบ (เอนจิน context แบบกำหนดเอง รันไทม์เนทีฟที่สร้าง context เอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการฉีดด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของ workspace ก่อนถูกตัดทอน ค่าเริ่มต้น: `12000`.

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์บูตสแตรปของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`.

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศใน system prompt ที่เอเจนต์มองเห็นเมื่อ context บูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`.

- `"off"`: ไม่ฉีดข้อความแจ้งการตัดทอนเข้าไปใน system prompt
- `"once"`: ฉีดประกาศสั้น ๆ หนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศสั้น ๆ ทุกครั้งที่รันเมื่อมีการตัดทอนอยู่

จำนวนดิบ/ที่ฉีดโดยละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะยังอยู่ในการวินิจฉัย เช่น
รายงาน context/status และบันทึก ส่วน context ผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับเพียง
ประกาศกู้คืนแบบสั้น

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณ context

OpenClaw มีงบประมาณ prompt/context ปริมาณสูงหลายชุด และตั้งใจแยกตามระบบย่อย
แทนที่จะให้ทั้งหมดไหลผ่าน knob ทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude สำหรับการรันโมเดลแบบ reset/startup ครั้งเดียว รวมถึงไฟล์รายวันล่าสุด
  `memory/*.md` คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  excerpt รันไทม์แบบมีขอบเขตและบล็อกที่ฉีดซึ่งรันไทม์เป็นเจ้าของ
- `memory.qmd.limits.*`:
  ขนาด snippet การค้นหาหน่วยความจำแบบจัดทำดัชนีและการฉีด

ใช้ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องใช้งบประมาณต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ในเทิร์นแรกที่ฉีดในการรันโมเดลตอน reset/startup
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการ reset โดยไม่เรียกใช้โมเดล
จึงไม่โหลด prelude นี้

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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิว context รันไทม์แบบมีขอบเขต

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

- `memoryGetMaxChars`: เพดาน excerpt เริ่มต้นของ `memory_get` ก่อนเพิ่ม
  metadata การตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่คงอยู่และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดาน excerpt ของ AGENTS.md ที่ใช้ระหว่างการฉีด refresh หลัง Compaction

#### `agents.list[].contextLimits`

override ต่อเอเจนต์สำหรับ knob `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอด
จาก `agents.defaults.contextLimits`.

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

เพดานสากลสำหรับรายการ Skills แบบย่อที่ฉีดเข้าไปใน system prompt สิ่งนี้
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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของภาพในบล็อกภาพ transcript/tool ก่อนเรียก provider
ค่าเริ่มต้น: `1200`.

ค่าที่ต่ำลงมักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงขึ้นจะรักษารายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับ context ของ system prompt (ไม่ใช่ timestamp ของข้อความ) จะ fallback ไปที่เขตเวลาของ host.

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (การตั้งค่าของ OS).

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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลเฟลโอเวอร์ที่เรียงลำดับไว้
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลด้านวิชัน
  - ใช้เป็นการกำหนดเส้นทางสำรองด้วยเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตภาพได้
  - แนะนำให้ใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบยังรับ ID แบบไม่มี prefix เพื่อความเข้ากันได้ หาก ID แบบไม่มี prefix ตรงกับรายการที่กำหนดค่าไว้และรองรับภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะระบุผู้ให้บริการให้รายการนั้น การจับคู่ที่กำหนดค่าไว้แบบกำกวมต้องใช้คำนำหน้าผู้ให้บริการแบบชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างภาพแบบใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP แบบพื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการให้ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการให้ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของผู้ให้บริการให้ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่รวมมาให้รองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, ภาพอินพุต 1 ภาพ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะย้อนกลับไปใช้ `imageModel` จากนั้นจึงใช้โมเดลเซสชัน/ค่าเริ่มต้นที่ resolve ได้
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับมนุษย์แบบกระชับ) หรือ `"raw"` (ผนวกคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` ราย agent จะ override ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ราย agent จะ override ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการตั้งค่า override reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตยกระดับเริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย OpenAI API key หรือ Codex OAuth) หากคุณละผู้ให้บริการ OpenClaw จะลอง alias ก่อน จากนั้นลองการจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ ID โมเดลนั้นโดยตรง และหลังจากนั้นจึงย้อนกลับไปใช้ผู้ให้บริการค่าเริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับไปใช้ผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นเก่าของผู้ให้บริการที่ถูกนำออกไปแล้ว
- `models`: แค็ตตาล็อกโมเดลที่กำหนดค่าไว้และ allowlist สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai-codex/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับผู้ให้บริการที่เลือก โดยไม่ต้องระบุ ID โมเดลทุกรายการด้วยตนเอง
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่อยู่ในขอบเขตผู้ให้บริการจะ merge โมเดลผู้ให้บริการที่เลือกเข้าใน map นี้ และคงผู้ให้บริการที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง จะเปิดใช้ Compaction ฝั่งเซิร์ฟเวอร์โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือ `params.responsesCompactThreshold` เพื่อ override เกณฑ์ ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นแบบทั่วโลกที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับ precedence ของการ merge `params` (การกำหนดค่า): `agents.defaults.params` (ฐานทั่วโลก) ถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID agent ที่ตรงกัน) จะ override ตาม key ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าใน body คำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับ key คำขอที่สร้างขึ้น extra body จะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน body คำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking แล้ว Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` แบบชัดเจนจะ override ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมี precedence สุดท้าย สำหรับการควบคุม thinking ของ vLLM Qwen ให้ตั้ง `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.thinkingFormat`: รูปแบบ payload thinking ที่เข้ากันได้กับ OpenAI ใช้ `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดแบบ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนแบ็กเอนด์ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับคำขอ เช่น vLLM OpenClaw จะแมปการปิด thinking เป็น `false` และการเปิด thinking เป็น `true`
- `compat.supportedReasoningEfforts`: รายการ reasoning effort รายโมเดลที่เข้ากันได้กับ OpenAI รวม `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบ session patch การตรวจสอบ CLI ของ agent และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าที่เฉพาะกับผู้ให้บริการสำหรับระดับ canonical
- `params.preserveThinking`: opt-in เฉพาะ Z.AI สำหรับ thinking ที่คงไว้ เมื่อเปิดใช้และเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [Z.AI thinking and preserved thinking](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: ตัวจัดการกระบวนการระดับผู้ให้บริการแบบไม่บังคับสำหรับเซิร์ฟเวอร์โมเดลในเครื่อง/โฮสต์เอง เมื่อโมเดลที่เลือกอยู่ในผู้ให้บริการนั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), เริ่ม `command` พร้อม `args` หาก endpoint ล่ม, รอสูงสุด `readyTimeoutMs` จากนั้นจึงส่งคำขอโมเดล `command` ต้องเป็น path แบบสัมบูรณ์ `idleStopMs: 0` จะคงกระบวนการไว้จนกว่า OpenClaw จะออก ค่าบวกจะหยุดกระบวนการที่ OpenClaw spawn หลังจาก idle เป็นจำนวนมิลลิวินาทีนั้น ดู [Local model services](/th/gateway/local-model-services)
- นโยบายรันไทม์ควรอยู่บนผู้ให้บริการหรือโมเดล ไม่ใช่บน `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั้งผู้ให้บริการ หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดล agent ของ OpenAI บนผู้ให้บริการ OpenAI ทางการจะเลือก Codex เป็นค่าเริ่มต้น
- ตัวเขียน config ที่กลายพันธุ์ฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์ canonical และคงรายการ fallback ที่มีอยู่เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรัน agent แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serialized) ค่าเริ่มต้น: 4

### นโยบายรันไทม์

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

- `id`: `"auto"`, `"pi"`, ID harness ของ Plugin ที่ลงทะเบียนไว้ หรือ alias แบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้จะลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้จะจัดหาแบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` ให้ harness ของ Plugin ที่ลงทะเบียนไว้อ้างสิทธิ์ turn ที่รองรับ และใช้ Pi เมื่อไม่มี harness ที่ตรงกัน รันไทม์ Plugin แบบชัดเจน เช่น `id: "codex"` ต้องมี harness นั้น และจะล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือล้มเหลว
- key รันไทม์ทั้ง agent เป็น legacy `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือก runtime รัน `openclaw doctor --fix` เพื่อลบค่าเก่า
- โมเดล agent ของ OpenAI ใช้ harness Codex เป็นค่าเริ่มต้น; `agentRuntime.id: "codex"` ระดับผู้ให้บริการ/โมเดลยังคงใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับการปรับใช้ Claude CLI แนะนำให้ใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` ที่อยู่ในขอบเขตโมเดล การอ้างอิงโมเดล `claude-cli/claude-opus-4-7` แบบ legacy ยังคงใช้งานได้เพื่อความเข้ากันได้ แต่ config ใหม่ควรรักษาการเลือกผู้ให้บริการ/โมเดลให้เป็น canonical และใส่แบ็กเอนด์การดำเนินการไว้ในนโยบาย runtime ของผู้ให้บริการ/โมเดล
- สิ่งนี้ควบคุมเฉพาะการดำเนินการ turn ของ agent แบบข้อความเท่านั้น การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตัวเอง

**ชอร์ตแฮนด์ alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

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

นามแฝงที่คุณกำหนดค่าไว้จะมีสิทธิ์เหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมดการคิดโดยอัตโนมัติ เว้นแต่คุณตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตัวเอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

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

- แบ็กเอนด์ CLI เน้นข้อความเป็นอันดับแรก เครื่องมือจะถูกปิดใช้เสมอ
- รองรับเซสชันเมื่อมีการตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้แบ็กเอนด์กู้คืนเซสชันที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัย
  จากส่วนท้ายทรานสคริปต์ OpenClaw ดิบที่มีขอบเขต ก่อนที่จะมีสรุป Compaction
  ครั้งแรก การเปลี่ยนแปลงโปรไฟล์การยืนยันตัวตนหรือ credential-epoch
  จะยังไม่มีวัน reseed จากข้อมูลดิบ

### `agents.defaults.systemPromptOverride`

แทนที่พรอมป์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์มีสิทธิ์เหนือกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

โอเวอร์เลย์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะชั้นรูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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
- `"off"` ปิดใช้เฉพาะชั้นที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้อยู่
- `plugins.entries.openai.config.personality` แบบเดิมจะยังถูกอ่านเมื่อยังไม่ได้ตั้งค่าร่วมนี้

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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตน OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมป์ระบบ และข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นเอเจนต์ Heartbeat ก่อนจะถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบท bootstrap แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true Heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม: งาน subagent หรือคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat ออกไปเสมอ แม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดก็ตามกำหนด `heartbeat` จะมี **เฉพาะเอเจนต์เหล่านั้น** ที่รัน Heartbeat
- Heartbeat รันเป็นเทิร์นเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้โทเค็นมากขึ้น

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
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนแล้ว เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการบังคับให้ใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction เดี่ยว ก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดไว้แบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อตั้งค่าไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นเช็กพอยต์แบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการรักษาตัวระบุทึบแสงไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการเก็บรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบเพื่อลองใหม่เมื่อเอาต์พุตผิดรูปแบบสำหรับสรุปแบบ safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของลูปเครื่องมือ Pi แบบไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากผนวกผลลัพธ์เครื่องมือแล้วและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้กับโหมด Compaction ทั้ง `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบไม่บังคับที่จะฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้การฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งไว้อย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อ `Every Session`/`Safety` แบบเก่าจะถูกยอมรับเป็นทางเลือกสำรองแบบ legacy ด้วย
- `model`: การแทนที่ `provider/model-id` แบบไม่บังคับสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์แบบไม่บังคับ (`number` หรือสตริงเช่น `"20mb"`) ที่ทริกเกอร์ Compaction ภายในเครื่องแบบปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์ตัวสืบทอดที่เล็กกว่าได้ ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มต้นและเมื่อเสร็จสมบูรณ์ (เช่น "กำลังทำ Compaction บริบท..." และ "Compaction เสร็จสมบูรณ์") ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นเอเจนต์แบบเงียบก่อน auto-compaction เพื่อจัดเก็บความทรงจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การแทนที่นี้ไม่สืบทอดเชนสำรองของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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
- `ttl` ควบคุมว่าการตัดแต่งจะรันซ้ำได้บ่อยแค่ไหน (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินก่อน จากนั้นจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดแต่ง/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความผู้ช่วยน้อยกว่า `keepLastAssistants` การตัดแต่งจะถูกข้าม

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

- ช่องที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การแทนที่ค่าระดับช่อง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรแยกตามบัญชี) ค่าเริ่มต้นของ Signal/Slack/Discord/Google Chat คือ `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การแทนที่ค่าระดับเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรมและการแบ่งชิ้นส่วนได้ที่ [การสตรีม](/th/concepts/streaming)

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
- การแทนที่ค่าระดับเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำแซนด์บ็อกซ์แบบเลือกใช้สำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มได้ที่ [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

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

**การตั้งค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทรันไทม์ระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซแยกตามขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวในขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับแต่งนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีผลเหนือ `identityFile`
- `certificateData` มีผลเหนือ `certificateFile`
- `knownHostsData` มีผลเหนือ `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูกแก้ค่าจากสแนปช็อตรันไทม์ของ secrets ที่ใช้งานอยู่ก่อนเริ่มเซสชันแซนด์บ็อกซ์

**พฤติกรรมของแบ็กเอนด์ SSH:**

- seed เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงเวิร์กสเปซ SSH ระยะไกลไว้เป็นแหล่งอ้างอิงหลัก
- ส่ง `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงก์การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์แยกตามขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เมานต์เวิร์กสเปซของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซแยกตามเซสชัน
- `agent`: คอนเทนเนอร์ + เวิร์กสเปซหนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และเวิร์กสเปซที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

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

- `mirror`: seed รีโมตจากในเครื่องก่อน exec แล้วซิงก์กลับหลัง exec; เวิร์กสเปซในเครื่องยังเป็นแหล่งอ้างอิงหลัก
- `remote`: seed รีโมตหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ จากนั้นคงเวิร์กสเปซระยะไกลไว้เป็นแหล่งอ้างอิงหลัก

ในโหมด `remote` การแก้ไขบนโฮสต์ในเครื่องที่ทำนอก OpenClaw จะไม่ถูกซิงก์เข้าแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งใช้ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตของแซนด์บ็อกซ์และการซิงก์แบบ mirror ที่เลือกใช้ได้

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, รูทที่เขียนได้, และผู้ใช้ root

**คอนเทนเนอร์ตั้งค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม โดยรวม binds ระดับโกลบอลและระดับเอเจนต์เข้าด้วยกัน

**เบราว์เซอร์แบบแซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงผู้สังเกตการณ์ noVNC ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกไม่ให้เซสชันแบบแซนด์บ็อกซ์กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบโกลบอลอย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
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
  - `--disable-extensions` (เปิดใช้เป็นค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu`
    เปิดใช้เป็นค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ extensions อีกครั้งหากเวิร์กโฟลว์ของคุณ
    พึ่งพา extensions เหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งค่า `0` เพื่อใช้ค่า
    ขีดจำกัดโปรเซสเริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นเป็นค่าพื้นฐานของอิมเมจคอนเทนเนอร์ ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ให้ดูคำสั่ง `docker build` แบบอินไลน์ที่ [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การแทนที่ค่าต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของเอเจนต์เอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับโกลบอล ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันสามารถอยู่ในที่เดียว ขณะที่เอเจนต์แต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ การแทนที่ค่าของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับแบบพูดอัตโนมัติ, `/tts audio`, `/tts status`, และ
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
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่ได้ตั้งค่าไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้งค่าหลักแบบเคร่งครัดต่อเอเจนต์โดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เคร่งครัดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้เอเจนต์นั้นใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเคร่งครัดให้ชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังคงสืบทอด fallback ค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ผสานทับรายการ model ที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อก model ทั้งหมด
- `tts`: override แปลงข้อความเป็นเสียงต่อเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งค่าเฉพาะที่เกี่ยวกับบุคลิก เช่น ผู้ให้บริการ เสียง model สไตล์ หรือโหมดอัตโนมัติไว้ที่นี่เท่านั้น
- `skills`: allowlist ของ Skills ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่า; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการผสาน และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้ เมื่อไม่มีการตั้งค่า override ต่อข้อความหรือต่อเซสชัน โปรไฟล์ผู้ให้บริการ/model ที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง thinking แบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้ เมื่อไม่มีการตั้งค่า override reasoning ต่อข้อความหรือต่อเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับโหมดเร็วแบบไม่บังคับ (`true | false`) ใช้เมื่อไม่มีการตั้งค่า override fast-mode ต่อข้อความหรือต่อเซสชัน
- `models`: override แค็ตตาล็อก model/runtime ต่อเอเจนต์แบบไม่บังคับ โดยใช้ id `provider/model` แบบเต็มเป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้น runtime ต่อเอเจนต์
- `runtime`: ตัวอธิบาย runtime ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธที่สัมพันธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) รวม id ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายมายังตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่มี sandbox
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

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่หายไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันพอดี, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ด้วยตัวตนการสนทนาที่ตรงกันพอดี (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับ route binding ข้างต้น

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

ดูรายละเอียดลำดับความสำคัญที่ [Sandbox และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันแยกภายในบริบทช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อจงใจให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความแบบผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แม็ปรหัสมาตรฐานไปยังเพียร์ที่มีคำนำหน้าผู้ให้บริการสำหรับการใช้เซสชันร่วมกันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แม็ปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางที่ลิงก์ไว้อีกช่องทางหนึ่ง ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองไว้ ค่าใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนแบบเบื้องหลัง/เหตุการณ์ระบบ เช่น heartbeat, cron wakeups, การแจ้งเตือน exec และการทำบัญชีของ gateway สามารถอัปเดต `updatedAt` ได้ แต่ไม่ได้ทำให้เซสชันรายวัน/ไม่ได้ใช้งานยังสดใหม่อยู่
- **`resetByType`**: การแทนที่แยกตามประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็นนามแฝงของ `direct`
- **`mainKey`**: ฟิลด์เดิม Runtime ใช้ `"main"` สำหรับบักเก็ตแชทตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ต่อเอเจนต์ (จำนวนเต็ม, ช่วง: `0`-`20`, ค่าเริ่มต้น: `5`) `0` ปิดการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, พร้อมนามแฝงเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธรายการแรกมีผลก่อน
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลเป็นชุดพร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับ production; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกเพิกเฉย; `openclaw doctor --fix` จะลบออกจาก config เก่า
  - `resetArchiveRetention`: การเก็บรักษาไฟล์เก็บ transcript `*.reset.<timestamp>` ค่าเริ่มต้นคือ `pruneAfter`; ตั้งเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifacts/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นแบบโกลบอลสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรม หน่วยเป็นชั่วโมง (`0` ปิด; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบแข็งค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิด; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตค่าเริ่มต้นสำหรับการสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และ ACP thread spawns ค่าเริ่มต้นคือ `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟค่าเริ่มต้นสำหรับ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

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

การแก้ค่า (ค่าที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่องทาง → โกลบอล `""` ปิดและหยุดการไล่ค่า `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย             | ตัวอย่าง                    |
| ----------------- | -------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น     | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม  | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ     | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### ปฏิกิริยารับทราบ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งค่า `""` เพื่อปิด
- การแทนที่แยกตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการแก้ค่า: บัญชี → ช่องทาง → `messages.ackReaction` → fallback ของ identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับบนช่องทางที่รองรับ reaction เช่น Slack, Discord, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้ reaction สถานะตามวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่าไว้ จะยังเปิดใช้ reaction สถานะเมื่อ reaction รับทราบทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้ reaction สถานะตามวงจรชีวิต

### การ debounce ขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งเร็วจากผู้ส่งเดียวกันให้เป็น agent turn เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมข้ามการ debounce

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

- `auto` ควบคุมโหมด auto-TTS ค่าเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ prefs ในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้ตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิด)
- คีย์ API fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่บันเดิลมาถูก Plugin เป็นเจ้าของ หากตั้งค่า `plugins.allow` ให้ใส่ Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รหัสผู้ให้บริการเดิม `edge` รองรับเป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint ของ OpenAI TTS ลำดับการแก้ค่าคือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
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
- คีย์ Talk แบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) ใช้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`
- Voice ID fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริง plaintext หรืออ็อบเจ็กต์ SecretRef
- fallback `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่า API key ของ Talk
- `providers.*.voiceAliases` ทำให้คำสั่ง Talk ใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo ของ Hugging Face ที่ใช้โดยตัวช่วย MLX ในเครื่องของ macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นกลับ MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่บันเดิลมาเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก Control UI Talk realtime `openclaw_agent_consult` ปล่อยว่างไว้เพื่อคงพฤติกรรมเซสชัน/โมเดลตามปกติ
- `consultFastMode` ตั้งค่าการแทนที่ fast-mode แบบครั้งเดียวสำหรับ Control UI Talk realtime consult โดยไม่เปลี่ยนการตั้งค่า fast-mode ปกติของเซสชัน
- `speechLocale` ตั้งค่า id โลแคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของ iOS/macOS Talk ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่าไว้ จะคงช่วงหยุดชั่วคราวค่าเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `realtime.instructions` เพิ่มคำสั่งระบบที่ส่งถึงผู้ให้บริการต่อท้าย prompt realtime ในตัวของ OpenClaw เพื่อให้กำหนดค่าสไตล์เสียงได้โดยไม่สูญเสียคำแนะนำ `openclaw_agent_consult` ค่าเริ่มต้น

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
