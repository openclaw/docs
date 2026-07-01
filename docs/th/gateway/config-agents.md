---
read_when:
    - ปรับค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, เวิร์กสเปซ, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-07-01T13:28:59Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e73e82e78ea597919a304e5bb4966221c805d2ddd48e1d37b2bf06eb60aaf5c8
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตตามเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `OPENCLAW_WORKSPACE_DIR` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

ค่า `agents.defaults.workspace` ที่ระบุอย่างชัดเจนจะมีลำดับความสำคัญเหนือ
`OPENCLAW_WORKSPACE_DIR` ใช้ตัวแปรสภาพแวดล้อมเพื่อชี้เอเจนต์เริ่มต้นไปยัง
เวิร์กสเปซที่เมานต์ไว้ เมื่อคุณไม่ต้องการเขียนพาธนั้นลงในการกำหนดค่า

### `agents.defaults.repoRoot`

รูทของที่เก็บทางเลือกที่แสดงในบรรทัด Runtime ของพรอมป์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยไล่ขึ้นด้านบนจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นทางเลือกสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละเว้น `agents.defaults.skills` เพื่อให้อนุญาต Skills ได้ไม่จำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น
  และจะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์บูตสแตรปของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซทางเลือกที่เลือกไว้ ขณะที่ยังคงเขียนไฟล์บูตสแตรปที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมว่าไฟล์บูตสแตรปของเวิร์กสเปซจะถูกฉีดเข้าไปในพรอมป์ระบบเมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการดำเนินต่อที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีดบูตสแตรปของเวิร์กสเปซซ้ำ เพื่อลดขนาดพรอมป์ การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งานการฉีดบูตสแตรปของเวิร์กสเปซและไฟล์บริบทในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิตพรอมป์ของตนเองทั้งหมด (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนหลัง Compaction จะข้ามการฉีดด้วยเช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].contextInjection` ค่าที่ละเว้นจะสืบทอด
`agents.defaults.contextInjection`

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของเวิร์กสเปซก่อนตัดทอน ค่าเริ่มต้น: `20000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].bootstrapMaxChars` ค่าที่ละเว้นจะสืบทอด
`agents.defaults.bootstrapMaxChars`

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์บูตสแตรปของเวิร์กสเปซทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].bootstrapTotalMaxChars` ค่าที่ละเว้น
จะสืบทอด `agents.defaults.bootstrapTotalMaxChars`

### การแทนที่โปรไฟล์บูตสแตรปต่อเอเจนต์

ใช้การแทนที่โปรไฟล์บูตสแตรปต่อเอเจนต์เมื่อเอเจนต์หนึ่งต้องการพฤติกรรมการฉีดพรอมป์
ที่ต่างจากค่าเริ่มต้นที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอดจาก
`agents.defaults`

```json5
{
  agents: {
    defaults: {
      contextInjection: "continuation-skip",
      bootstrapMaxChars: 20000,
      bootstrapTotalMaxChars: 60000,
    },
    list: [
      {
        id: "strict-worker",
        contextInjection: "always",
        bootstrapMaxChars: 50000,
        bootstrapTotalMaxChars: 300000,
      },
    ],
  },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศในพรอมป์ระบบที่เอเจนต์มองเห็นได้เมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"always"`

- `"off"`: ไม่ฉีดข้อความแจ้งเตือนการตัดทอนเข้าไปในพรอมป์ระบบเลย
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอน (แนะนำ)

จำนวนแบบดิบ/ที่ฉีดอย่างละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ใน diagnostics เช่น
รายงานสถานะ/บริบทและบันทึก ส่วนบริบทผู้ใช้/รันไทม์ของ WebChat ตามปกติจะได้รับเพียง
ประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมป์/บริบทปริมาณสูงหลายรายการ และตั้งใจแยกตามระบบย่อย
แทนที่จะให้ทั้งหมดไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปของเวิร์กสเปซตามปกติ
- `agents.defaults.startupContext.*`:
  พรีลูดการรันโมเดลแบบครั้งเดียวเมื่อรีเซ็ต/เริ่มต้น รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชทเปล่า `/new` และ `/reset`
  จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมป์ระบบ
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนของรันไทม์แบบมีขอบเขตและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกฉีด
- `memory.qmd.limits.*`:
  ขนาด snippet การค้นหาหน่วยความจำที่ทำดัชนีไว้และการฉีด

ใช้การแทนที่ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการงบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมพรีลูดเริ่มต้นเทิร์นแรกที่ฉีดในการรันโมเดลเมื่อรีเซ็ต/เริ่มต้น
คำสั่งแชทเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิวบริบทของรันไทม์แบบมีขอบเขต

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
        memoryGetDefaultLines: 120,
        postCompactionMaxChars: 1800,
      },
    },
  },
}
```

- `memoryGetMaxChars`: เพดานข้อความตัดตอน `memory_get` เริ่มต้นก่อนเพิ่ม
  metadata การตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัด `memory_get` เริ่มต้นเมื่อ
  ละเว้น `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดขั้นสูงที่ใช้สำหรับผลลัพธ์ที่คงอยู่
  และการกู้คืนเมื่อล้น ปล่อยไว้ไม่ตั้งค่าสำหรับเพดานอัตโนมัติของบริบทโมเดล:
  `16000` อักขระต่ำกว่า 100K โทเคน, `32000` อักขระที่ 100K+ โทเคน และ `64000`
  อักขระที่ 200K+ โทเคน ยอมรับค่าที่ระบุชัดเจนได้สูงสุด `1000000` สำหรับ
  โมเดลบริบทยาว แต่เพดานที่มีผลจริงยังคงจำกัดไว้ที่ประมาณ 30% ของหน้าต่างบริบท
  ของโมเดล `openclaw doctor --deep` จะแสดงเพดานที่มีผลจริง และ doctor จะเตือน
  เฉพาะเมื่อการแทนที่ที่ระบุชัดเจนล้าสมัยหรือไม่มีผล
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการฉีดรีเฟรช
  หลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับปุ่มปรับ `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอด
จาก `agents.defaults.contextLimits`

```json5
{
  agents: {
    defaults: {
      contextLimits: {
        memoryGetMaxChars: 12000,
      },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // advanced ceiling for this agent
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

เพดานส่วนกลางสำหรับรายการ Skills แบบย่อที่ฉีดเข้าไปในพรอมป์ระบบ สิ่งนี้
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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้โทเคนวิชันและขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพไว้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ค่ากำหนดการบีบอัด/รายละเอียดของเครื่องมือรูปภาพสำหรับรูปภาพที่โหลดจากพาธไฟล์ URL และการอ้างอิงสื่อ
ค่าเริ่มต้น: `auto`

OpenClaw ปรับลำดับขั้นการย่อขนาดให้เข้ากับโมเดลรูปภาพที่เลือก ตัวอย่างเช่น Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL และโมเดลวิชัน Llama 4 แบบโฮสต์ สามารถใช้รูปภาพขนาดใหญ่กว่าเส้นทางวิชันรายละเอียดสูงรุ่นเก่า/ค่าเริ่มต้นได้ ขณะที่เทิร์นที่มีหลายรูปภาพจะถูกบีบอัดอย่างเข้มงวดขึ้นในโหมด `auto` เพื่อควบคุมต้นทุนโทเคนและเวลาแฝง

ค่า:

- `auto`: ปรับตามขีดจำกัดของโมเดลและจำนวนรูปภาพ
- `efficient`: เลือกรูปภาพขนาดเล็กกว่าเพื่อลดการใช้โทเคนและไบต์
- `balanced`: ใช้ลำดับขั้นมาตรฐานแบบกึ่งกลาง
- `high`: รักษารายละเอียดมากขึ้นสำหรับภาพหน้าจอ แผนภาพ และรูปภาพเอกสาร

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมป์ระบบ (ไม่ใช่ timestamp ของข้อความ) fallback เป็นเขตเวลาของโฮสต์

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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลัก
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยพาธเครื่องมือ `image` เป็นคอนฟิกโมเดล vision
  - ใช้เป็นการกำหนดเส้นทางสำรองด้วยเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้ ref แบบ `provider/model` ที่ระบุชัดเจน Bare ID ยังรับได้เพื่อความเข้ากันได้ หาก Bare ID ตรงกับรายการที่รองรับรูปภาพซึ่งคอนฟิกไว้ใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider นั้นให้ รายการที่คอนฟิกไว้และตรงกันแบบกำกวมต้องมีคำนำหน้า provider ที่ชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพที่ใช้ร่วมกัน และ surface ของเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบ native ของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้คอนฟิก auth ของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider สร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงที่ใช้ร่วมกัน และเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider สร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้คอนฟิก auth/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอที่ใช้ร่วมกัน และเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider สร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้คอนฟิก auth/API key ของ provider ที่ตรงกันด้วย
  - Plugin สร้างวิดีโอ Qwen อย่างเป็นทางการรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปยังโมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve ได้
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้งาน
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด fallback สำหรับการดึงข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบ progress-draft ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (แนบคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` รายเอเจนต์จะ override ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะ override ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่คอนฟิกไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway แบบ operator-admin เมื่อไม่ได้ตั้งค่า override reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุต elevated เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย OpenAI API-key หรือ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นลองหา provider ที่คอนฟิกไว้ซึ่งตรงกับ model id นั้นแบบไม่ซ้ำ และสุดท้ายจึง fallback ไปที่ provider ค่าเริ่มต้นที่คอนฟิกไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว จึงควรใช้ `provider/model` ที่ระบุชัดเจน) หาก provider นั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่คอนฟิกไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model รายการแรกที่คอนฟิกไว้แทนการแสดงค่าเริ่มต้นของ provider ที่ถูกนำออกแล้วและค้างอยู่
- `models`: แคตตาล็อกโมเดลและ allowlist ที่คอนฟิกไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, การกำหนดเส้นทาง `provider` ของ OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับ provider ที่เลือกโดยไม่ต้องไล่ระบุ model id ทุกตัวเอง
  - เพิ่ม `agentRuntime` ให้รายการ `provider/*` เมื่อโมเดลที่ค้นพบแบบไดนามิกทุกตัวของ provider นั้นควรใช้ runtime เดียวกัน นโยบาย runtime แบบ `provider/model` ที่ตรงเป๊ะยังมีผลเหนือ wildcard
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ตามขอบเขต provider จะ merge โมเดลของ provider ที่เลือกเข้าไปใน map นี้ และเก็บ provider อื่นที่คอนฟิกไว้แล้วซึ่งไม่เกี่ยวข้องไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการ inject `context_management` หรือ `params.responsesCompactThreshold` เพื่อ override threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider ค่าเริ่มต้นแบบ global ที่ใช้กับโมเดลทั้งหมด ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญของการ merge `params` (คอนฟิก): `agents.defaults.params` (ฐาน global) จะถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะ override ตาม key ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `models.providers.openrouter.params.provider`: นโยบายกำหนดเส้นทาง provider ค่าเริ่มต้นระดับ OpenRouter OpenClaw จะส่งต่อค่านี้ไปยังออบเจ็กต์ `provider` ของคำขอ OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` รายโมเดลและ params ของเอเจนต์จะ override ตาม key ดู [การกำหนดเส้นทาง provider ของ OpenRouter](/th/providers/openrouter#advanced-configuration)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าใน request body ของ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับ key ของคำขอที่สร้างขึ้น extra body จะมีผลเหนือกว่า; routes completions ที่ไม่ใช่ native จะยังลบ `store` เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking, Plugin vLLM ที่ bundled มาจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุชัดเจนจะ override ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย โมเดล thinking ของ vLLM Qwen และ Nemotron ที่คอนฟิกไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) แทนบันได effort หลายระดับ
- `compat.thinkingFormat`: รูปแบบ payload thinking ที่เข้ากันได้กับ OpenAI ใช้ `"together"` สำหรับ `reasoning.enabled` แบบ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดแบบ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บน backend ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับคำขอ เช่น vLLM OpenClaw จะแมป thinking ที่ปิดใช้งานเป็น `false` และ thinking ที่เปิดใช้งานเป็น `true` และโมเดล vLLM Qwen ที่คอนฟิกไว้จะแสดงตัวเลือก `/think` แบบไบนารีสำหรับรูปแบบเหล่านี้
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง, แถวเซสชัน Gateway, การตรวจสอบ session patch, การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับ provider/model ที่คอนฟิกไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อ backend ต้องการค่าเฉพาะ provider สำหรับระดับ canonical
- `params.preserveThinking`: opt-in เฉพาะ Z.AI สำหรับ thinking ที่เก็บรักษาไว้ เมื่อเปิดใช้งานและ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า; ดู [Z.AI thinking และ thinking ที่เก็บรักษาไว้](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: ตัวจัดการโปรเซสระดับ provider แบบไม่บังคับสำหรับเซิร์ฟเวอร์โมเดล local/self-hosted เมื่อโมเดลที่เลือกเป็นของ provider นั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), เริ่ม `command` พร้อม `args` หาก endpoint down, รอสูงสุด `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบ absolute `idleStopMs: 0` จะคงโปรเซสไว้จนกว่า OpenClaw จะออก; ค่าบวกจะหยุดโปรเซสที่ OpenClaw spawn หลังจาก idle เป็นจำนวนมิลลิวินาทีนั้น ดู [บริการโมเดล Local](/th/gateway/local-model-services)
- นโยบาย Runtime ควรอยู่บน provider หรือโมเดล ไม่ใช่บน `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั้ง provider หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดลเอเจนต์ OpenAI บน provider OpenAI อย่างเป็นทางการจะเลือก Codex เป็นค่าเริ่มต้น
- ตัวเขียนคอนฟิกที่ mutate ฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์ canonical และเก็บรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวน agent run แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serialize อยู่) ค่าเริ่มต้น: 4

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
        "anthropic/claude-opus-4-8": {
          agentRuntime: { id: "claude-cli" },
        },
        "vllm/*": {
          agentRuntime: { id: "openclaw" },
        },
      },
    },
  },
}
```

- `id`: `"auto"`, `"openclaw"`, id ของ harness ของ Plugin ที่ลงทะเบียนไว้ หรือ alias ของ backend CLI ที่รองรับ Plugin Codex ที่รวมมาให้ลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้มี backend CLI `claude-cli`
- `id: "auto"` อนุญาตให้ harness ของ Plugin ที่ลงทะเบียนไว้อ้างสิทธิ์ turn ที่รองรับ และใช้ OpenClaw เมื่อไม่มี harness ใดตรงกัน runtime ของ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` ต้องมี harness นั้น และจะล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือทำงานล้มเหลว
- `id: "pi"` ยอมรับเฉพาะในฐานะ alias ที่เลิกใช้แล้วของ `openclaw` เพื่อรักษา config ที่ส่งมอบไปแล้วจาก v2026.5.22 และก่อนหน้า config ใหม่ควรใช้ `openclaw`
- ลำดับความสำคัญของ runtime คือ policy ของโมเดลแบบตรงตัวก่อน (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` หรือ `models.providers.<provider>.models[]`) จากนั้น `agents.list[]` / `agents.defaults.models["provider/*"]` แล้วจึงเป็น policy ระดับ provider ที่ `models.providers.<provider>.agentRuntime`
- คีย์ runtime ทั้ง agent เป็น legacy `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือก runtime ให้รัน `openclaw doctor --fix` เพื่อลบค่าที่ค้างอยู่
- โมเดล agent ของ OpenAI ใช้ harness Codex เป็นค่าเริ่มต้น; provider/model `agentRuntime.id: "codex"` ยังคงใช้ได้เมื่อคุณต้องการทำให้ระบุชัดเจน
- สำหรับการ deploy Claude CLI ให้เลือก `model: "anthropic/claude-opus-4-8"` พร้อม `agentRuntime.id: "claude-cli"` ที่ scoped ตามโมเดล model refs แบบ legacy อย่าง `claude-cli/claude-opus-4-7` ยังทำงานเพื่อความเข้ากันได้ แต่ config ใหม่ควรคงการเลือก provider/model ให้เป็น canonical และวาง backend การดำเนินการไว้ใน runtime policy ของ provider/model
- ส่วนนี้ควบคุมเฉพาะการดำเนินการ agent-turn แบบข้อความเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตัวเอง

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| Alias               | โมเดล                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

alias ที่คุณกำหนดไว้จะมีความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้งานโหมด thinking โดยอัตโนมัติ เว้นแต่คุณตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้งาน `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีม tool call ตั้ง `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
Anthropic Claude Opus 4.8 ปิด thinking เป็นค่าเริ่มต้นใน OpenClaw; เมื่อเปิดใช้งาน adaptive thinking อย่างชัดเจน ค่า effort เริ่มต้นที่ provider ของ Anthropic เป็นเจ้าของคือ `high` โมเดล Claude 4.6 มีค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งระดับ thinking อย่างชัดเจน

### `agents.defaults.cliBackends`

backend CLI แบบไม่บังคับสำหรับการรัน fallback แบบข้อความเท่านั้น (ไม่มี tool calls) มีประโยชน์เป็นตัวสำรองเมื่อ provider API ล้มเหลว

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
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

- backend CLI เน้นข้อความเป็นหลัก; tools จะถูกปิดใช้งานเสมอ
- รองรับ session เมื่อมีการตั้ง `sessionArg`
- รองรับการส่งรูปภาพผ่านเมื่อ `imageArg` รับ path ของไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้ backend กู้คืน session ที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัย
  จากส่วนท้าย transcript ดิบของ OpenClaw แบบมีขอบเขต ก่อนที่จะมี
  สรุป Compaction แรก การเปลี่ยน auth profile หรือ credential-epoch
  ยังคงไม่ทำ raw-reseed เด็ดขาด

### `agents.defaults.promptOverlays`

prompt overlays ที่ไม่ขึ้นกับ provider ซึ่งใช้ตามตระกูลโมเดลบนพื้นผิว prompt ที่ OpenClaw ประกอบขึ้น id โมเดลตระกูล GPT-5 ได้รับ contract พฤติกรรมร่วมกันข้ามเส้นทาง OpenClaw/provider; `personality` ควบคุมเฉพาะชั้นรูปแบบการโต้ตอบที่เป็นมิตร route app-server ของ Codex แบบ native จะเก็บคำสั่งพื้นฐาน/โมเดลที่ Codex เป็นเจ้าของไว้แทน overlay GPT-5 ของ OpenClaw นี้ และ OpenClaw จะปิด personality ในตัวของ Codex สำหรับ thread แบบ native

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้งานชั้นรูปแบบการโต้ตอบที่เป็นมิตร
- `"off"` ปิดใช้งานเฉพาะชั้นที่เป็นมิตร; contract พฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งาน
- legacy `plugins.entries.openai.config.personality` ยังคงถูกอ่านเมื่อไม่ได้ตั้งค่าร่วมนี้

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
        skipWhenBusy: false, // default: false; true also waits for this agent's subagent/nested lanes
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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (auth ด้วย API key) หรือ `1h` (auth ด้วย OAuth) ตั้งเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าใน bootstrap context ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของ tool ระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับ turn ของ agent Heartbeat ก่อนจะถูกยกเลิก เว้นว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้นใช้ cadence ของ Heartbeat ที่จำกัดสูงสุดไว้ที่ 600 วินาที
- `directPolicy`: policy การส่งแบบ direct/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมาย direct `block` ระงับการส่งไปยังเป้าหมาย direct และปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้ bootstrap context แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันใน session ใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K tokens
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปตาม lane ที่ยุ่งเพิ่มเติมของ agent นั้น: งาน subagent ที่ใช้ session key ของตัวเองหรืองานคำสั่งซ้อน lane ของ Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มี flag นี้
- ต่อ agent: ตั้ง `agents.list[].heartbeat` เมื่อ agent ใดก็ตามกำหนด `heartbeat` **เฉพาะ agent เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat รัน turn ของ agent แบบเต็ม ช่วงเวลาที่สั้นลงใช้ token มากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // id of a registered compaction provider plugin (optional)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "Preserve deployment IDs, ticket IDs, and host:port pairs exactly.", // used when identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // optional tool-loop pressure check
        postCompactionSections: ["Session Startup", "Red Lines"], // opt in to AGENTS.md section reinjection
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

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งชิ้นสำหรับประวัติที่ยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ Plugin ผู้ให้บริการ compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่าไว้ จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะถอยกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ compaction ครั้งเดียวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `180`
- `keepRecentTokens`: งบประมาณจุดตัดของ agent สำหรับเก็บส่วนท้าย transcript ล่าสุดแบบคำต่อคำ Manual `/compact` จะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น manual compaction จะเป็นจุด checkpoint แบบตายตัว
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำการคงตัวระบุแบบทึบในตัวไว้ข้างหน้าระหว่างการสรุป compaction
- `identifierInstructions`: ข้อความกำหนดเองเพิ่มเติมสำหรับการสงวนตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตมีรูปแบบผิดสำหรับสรุป safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard; ตั้ง `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของ tool-loop เพิ่มเติม เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของ context หลังจากผนวกผลลัพธ์เครื่องมือและก่อนเรียกโมเดลครั้งถัดไป หาก context ไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่ง prompt และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำเพื่อตัดทอนผลลัพธ์เครื่องมือ หรือ compact แล้วลองใหม่ ใช้ได้กับโหมด compaction ทั้ง `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md เพิ่มเติมที่จะฉีดกลับหลัง compaction การฉีดกลับจะปิดใช้เมื่อไม่ได้ตั้งค่าหรือตั้งเป็น `[]` การตั้งค่าอย่างชัดเจนเป็น `["Session Startup", "Red Lines"]` จะเปิดใช้คู่นั้นและคง fallback ดั้งเดิม `Every Session`/`Safety` ไว้ เปิดใช้เฉพาะเมื่อ context เพิ่มเติมคุ้มกับความเสี่ยงของการทำซ้ำคำแนะนำโปรเจกต์ที่ถูกจับไว้แล้วในสรุป compaction
- `model`: `provider/model-id` เพิ่มเติม หรือ alias เปล่าจาก `agents.defaults.models` สำหรับการสรุป compaction เท่านั้น alias เปล่าจะ resolve ก่อน dispatch; model ID แบบ literal ที่กำหนดค่าไว้จะยังคงมีลำดับความสำคัญเมื่อชนกัน ใช้ค่านี้เมื่อ session หลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป compaction ควรรันบนอีกโมเดลหนึ่ง; เมื่อไม่ได้ตั้งค่า compaction จะใช้โมเดลหลักของ session
- `maxActiveTranscriptBytes`: เกณฑ์ byte เพิ่มเติม (`number` หรือสตริงเช่น `"20mb"`) ที่ทริกเกอร์ local compaction ปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ compaction ที่สำเร็จสามารถหมุนไปยัง transcript ตัวถัดไปที่เล็กกว่าได้ ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ถึงผู้ใช้เมื่อ compaction เริ่มและเมื่อเสร็จสมบูรณ์ (เช่น "กำลัง compact context..." และ "Compaction เสร็จสมบูรณ์") ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ compaction เงียบ
- `memoryFlush`: agentic turn แบบเงียบก่อน auto-compaction เพื่อเก็บความจำถาวร ตั้ง `model` เป็นผู้ให้บริการ/โมเดลแบบแน่นอน เช่น `ollama/qwen3:8b` เมื่อ housekeeping turn นี้ควรอยู่บนโมเดล local; override จะไม่สืบทอด fallback chain ของ session ที่ใช้งานอยู่ ข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

### `agents.defaults.runRetries`

ขอบเขต iteration การลองใหม่ของ outer run loop สำหรับ agent runtime แบบฝัง เพื่อป้องกัน loop การดำเนินงานไม่สิ้นสุดระหว่างการกู้คืนจากความล้มเหลว โปรดทราบว่าการตั้งค่านี้ขณะนี้ใช้กับ agent runtime แบบฝังเท่านั้น ไม่ใช่ ACP หรือ CLI runtimes

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
        runRetries: { max: 50 }, // การ override ราย agent เพิ่มเติม
      },
    ],
  },
}
```

- `base`: จำนวน iteration การลองใหม่พื้นฐานสำหรับ outer run loop ค่าเริ่มต้น: `24`
- `perProfile`: iteration การลองใหม่เพิ่มเติมที่ให้ต่อ fallback profile candidate ค่าเริ่มต้น: `8`
- `min`: ขีดจำกัดสัมบูรณ์ขั้นต่ำสำหรับ iteration การลองใหม่ ค่าเริ่มต้น: `32`
- `max`: ขีดจำกัดสัมบูรณ์สูงสุดสำหรับ iteration การลองใหม่ เพื่อป้องกันการดำเนินงานหลุดการควบคุม ค่าเริ่มต้น: `160`

### `agents.defaults.contextPruning`

ตัด **ผลลัพธ์เครื่องมือเก่า** ออกจาก context ในหน่วยความจำก่อนส่งไปยัง LLM **ไม่** แก้ไขประวัติ session บนดิสก์

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยเริ่มต้น: นาที
        keepLastAssistants: 3,
        softTrimRatio: 0.3,
        hardClearRatio: 0.5,
        minPrunableToolChars: 50000,
        softTrim: { maxChars: 4000, headChars: 1500, tailChars: 1500 },
        hardClear: { enabled: true, placeholder: "[ล้างเนื้อหาผลลัพธ์เครื่องมือเก่าแล้ว]" },
        tools: { deny: ["browser", "canvas"] },
      },
    },
  },
}
```

<Accordion title="พฤติกรรมโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้ pass การตัดแต่ง
- `ttl` ควบคุมว่าการตัดแต่งสามารถรันซ้ำได้บ่อยแค่ไหน (หลังจากแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินไปก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น
- `softTrimRatio` และ `hardClearRatio` รับค่าตั้งแต่ `0.0` ถึง `1.0`; การตรวจสอบ config จะปฏิเสธค่านอกช่วงนั้น

**Soft-trim** เก็บต้น + ท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดแต่ง/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวน token ที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัดแต่ง

</Accordion>

ดู [Session Pruning](/th/concepts/session-pruning) สำหรับรายละเอียดพฤติกรรม

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

- ช่องทางที่ไม่ใช่ Telegram ต้องมี `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การ override ต่อช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรรายบัญชี) ค่าเริ่มต้นของ Signal/Slack/Discord/Google Chat คือ `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override ต่อ agent: `agents.list[].humanDelay`

ดู [Streaming](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรม + การแบ่งชิ้น

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
- การ override ต่อ session: `session.typingMode`, `session.typingIntervalSeconds`

ดู [Typing Indicators](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

sandboxing เพิ่มเติมสำหรับ agent แบบฝัง ดูคู่มือฉบับเต็มที่ [Sandboxing](/th/gateway/sandboxing)

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
          // รองรับ SecretRefs / เนื้อหา inline ด้วย:
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

- `docker`: runtime Docker แบบ local (ค่าเริ่มต้น)
- `ssh`: runtime ระยะไกลทั่วไปที่อิง SSH
- `openshell`: runtime OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะ runtime จะย้ายไปที่
`plugins.entries.openshell.config`

**config ของ backend SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่ง client SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: root ระยะไกลแบบ absolute ที่ใช้สำหรับ workspace ราย scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ local ที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหา inline หรือ SecretRefs ที่ OpenClaw materialize เป็นไฟล์ชั่วคราวตอน runtime
- `strictHostKeyChecking` / `updateHostKeys`: knob นโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของ auth SSH:**

- `identityData` ชนะ `identityFile`
- `certificateData` ชนะ `certificateFile`
- `knownHostsData` ชนะ `knownHostsFile`
- ค่า `*Data` ที่อิง SecretRef จะถูก resolve จาก snapshot ของ secrets runtime ที่ใช้งานอยู่ก่อน session sandbox เริ่ม

**พฤติกรรม backend SSH:**

- seed workspace ระยะไกลหนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นคง workspace SSH ระยะไกลเป็น canonical
- route `exec`, เครื่องมือไฟล์ และเส้นทาง media ผ่าน SSH
- ไม่ sync การเปลี่ยนแปลงระยะไกลกลับไปยัง host โดยอัตโนมัติ
- ไม่รองรับ container browser ของ sandbox

**การเข้าถึง workspace:**

- `none`: workspace sandbox ราย scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: workspace sandbox ที่ `/workspace`, workspace ของ agent ถูก mount แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: workspace ของ agent ถูก mount แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: container + workspace ราย session
- `agent`: หนึ่ง container + workspace ต่อ agent (ค่าเริ่มต้น)
- `shared`: container และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้าม session)

**config Plugin OpenShell:**

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

- `mirror`: เติมข้อมูลระยะไกลจากเครื่องภายในก่อน exec แล้วซิงก์กลับหลัง exec; workspace ภายในเครื่องยังเป็นแหล่งข้อมูลหลัก
- `remote`: เติมข้อมูลระยะไกลครั้งเดียวเมื่อสร้างแซนด์บ็อกซ์ จากนั้นให้ workspace ระยะไกลเป็นแหล่งข้อมูลหลัก

ในโหมด `remote` การแก้ไขบนโฮสต์ภายในเครื่องที่ทำนอก OpenClaw จะไม่ถูกซิงก์เข้าแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนเติมข้อมูลเริ่มต้น
ทรานสปอร์ตคือ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตแซนด์บ็อกซ์และการซิงก์ mirror ที่เป็นตัวเลือก

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้ และผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (ใช้เมื่อจำเป็นจริงเท่านั้น)
เทิร์น app-server ของ Codex ในแซนด์บ็อกซ์ OpenClaw ที่ active ใช้การตั้งค่า egress เดียวกันนี้สำหรับการเข้าถึงเครือข่ายของโหมดโค้ดแบบ native

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ใน workspace ที่ active

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; bind ระดับ global และต่อเอเจนต์จะถูกผสานเข้าด้วยกัน

**เบราว์เซอร์ในแซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC observer ใช้การยืนยันตัวตน VNC โดยค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเคนที่มีอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อก session ในแซนด์บ็อกซ์ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อบริดจ์แบบ global อย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปเฉพาะในคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์ เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
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
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` ถูก
    เปิดใช้โดยค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้งานส่วนขยายอีกครั้งหาก workflow ของคุณ
    ต้องพึ่งพาสิ่งเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดกระบวนการ
    เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้เฉพาะ Docker เท่านั้น

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout โปรดดู [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

### `agents.list` (การ override ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มีผู้ให้บริการ TTS, voice, model,
style หรือโหมด auto-TTS ของตนเอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้น credential ที่ใช้ร่วมกันจึงอยู่ที่เดียวได้ ในขณะที่เอเจนต์แต่ละตัว
override เฉพาะฟิลด์ voice หรือ provider ที่ต้องการ override ของเอเจนต์ที่ active
มีผลกับการตอบกลับด้วยเสียงอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` ดู [Text-to-speech](/th/tools/tts#per-agent-voice-overrides)
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
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
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
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (มีการบันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกใน list จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงตั้งค่า primary ต่อเอเจนต์แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้เอเจนต์นั้นใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` ยังสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้ค่านี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำทั้งแค็ตตาล็อกโมเดล
- `tts`: override text-to-speech ต่อเอเจนต์แบบตัวเลือก บล็อกนี้ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บ credential ผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เจาะจง persona เช่น provider, voice, model, style หรือโหมด auto ที่นี่
- `skills`: allowlist Skills ต่อเอเจนต์แบบตัวเลือก หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งค่าไว้; list ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบตัวเลือก (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ต่อข้อความหรือ session โปรไฟล์ provider/model ที่เลือกควบคุมว่าค่าใดถูกต้อง; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของ (`thinkingLevel` ถูกละไว้ใน Gemini 3/3.1, `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบตัวเลือก (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override reasoning ต่อข้อความหรือ session
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับ fast mode แบบตัวเลือก (`"auto" | true | false`) ใช้เมื่อไม่มี override fast-mode ต่อข้อความหรือ session
- `models`: แค็ตตาล็อกโมเดล/override runtime ต่อเอเจนต์แบบตัวเลือก โดย key เป็น id `provider/model` แบบเต็ม ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้น runtime ต่อเอเจนต์
- `runtime`: descriptor runtime ต่อเอเจนต์แบบตัวเลือก ใช้ `type: "acp"` กับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรมีค่าเริ่มต้นเป็น session ของ harness ACP
- `identity.avatar`: path ที่สัมพันธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- ไฟล์รูปภาพ `identity.avatar` ภายในเครื่องที่สัมพันธ์กับ workspace จำกัดไว้ที่ 2 MB URL `http(s)` และ URI `data:` จะไม่ถูกตรวจด้วยขีดจำกัดขนาดไฟล์ภายในเครื่อง
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์ที่กำหนดค่าไว้สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = เป้าหมายที่กำหนดค่าไว้ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) รวม id ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายมาที่ตนเอง รายการค้างที่ config เอเจนต์ถูกลบแล้วจะถูก `sessions_spawn` ปฏิเสธและถูกละไว้จาก `agents_list`; รัน `openclaw doctor --fix` เพื่อล้างรายการเหล่านั้น หรือเพิ่มรายการ `agents.list[]` ขั้นต่ำหากเป้าหมายนั้นควรยัง spawn ได้ขณะสืบทอดค่าเริ่มต้น
- ตัวป้องกันการสืบทอดแซนด์บ็อกซ์: หาก session ผู้ร้องขออยู่ในแซนด์บ็อกซ์ `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่อยู่ในแซนด์บ็อกซ์
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

- `type` (ตัวเลือก): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่หายไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบ persistent
- `match.channel` (จำเป็น)
- `match.accountId` (ตัวเลือก; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ตัวเลือก; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ตัวเลือก; เฉพาะช่องทาง)
- `acp` (ตัวเลือก; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่ที่กำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันพอดี ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะแก้โดยตัวตนการสนทนาที่ตรงกันพอดี (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับ route binding ข้างต้น

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

<Accordion title="No filesystem access (messaging only)">

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [Sandbox และเครื่องมือแบบหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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
      mode: "enforce", // enforce (default) | warn
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

<Accordion title="Session field details">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับการจัดกลุ่มเซสชันในบริบทแชทกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้รับเซสชันที่แยกจากกันภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้แชร์บริบท)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม ID ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความเข้าของผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป ID มาตรฐานไปยังเพียร์ที่มีคำนำหน้าผู้ให้บริการสำหรับการแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางที่ลิงก์ไว้อีกรายการหนึ่ง ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตที่เวลาท้องถิ่น `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองอย่าง รายการที่หมดอายุก่อนจะมีผล ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อว่างใช้ `lastInteractionAt` การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, การปลุกของ Cron, การแจ้งเตือน exec และการทำบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันรายวัน/เมื่อว่างยังคงสดใหม่
- **`resetByType`**: การแทนที่แยกตามประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็นนามแฝงของ `direct`
- **`mainKey`**: ฟิลด์เดิม Runtime ใช้ `"main"` สำหรับบัคเก็ตแชทโดยตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบการตอบกลับสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ถึงเอเจนต์ (จำนวนเต็ม, ช่วง: `0`-`20`, ค่าเริ่มต้น: `5`) `0` ปิดใช้งานการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, โดยมี `dm` แบบเดิมเป็นนามแฝง), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธรายการแรกจะมีผล
- **`maintenance`**: การควบคุมการล้างข้อมูลและการเก็บรักษาของที่เก็บเซสชัน
  - `mode`: `enforce` ใช้การล้างข้อมูลและเป็นค่าเริ่มต้น; `warn` แสดงเฉพาะคำเตือน
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ค้าง (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลแบบแบตช์พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - เซสชันตรวจสอบการรันโมเดลของ Gateway ที่มีอายุสั้นใช้การเก็บรักษาคงที่ `24h` แต่การล้างข้อมูลถูกควบคุมด้วยแรงกดดัน: จะลบเฉพาะแถวตรวจสอบการรันโมเดลแบบเข้มงวดที่ค้างเมื่อถึงแรงกดดันจากการบำรุงรักษา/ขีดจำกัดรายการเซสชัน เฉพาะคีย์ตรวจสอบที่ชัดเจนแบบเข้มงวดซึ่งตรงกับ `agent:*:explicit:model-run-<uuid>` เท่านั้นที่เข้าเกณฑ์; เซสชัน direct, group, thread, Cron, hook, Heartbeat, ACP และซับเอเจนต์ปกติจะไม่สืบทอดการเก็บรักษา 24 ชั่วโมงนี้ เมื่อการล้างข้อมูล model-run ทำงาน จะทำงานก่อนการล้างข้อมูลรายการค้าง `pruneAfter` ที่กว้างกว่าและขีดจำกัด `maxEntries`
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า
  - `resetArchiveRetention`: การเก็บรักษาอาร์ไคฟ์ทรานสคริปต์ `*.reset.<timestamp>` ค่าเริ่มต้นคือ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันที่ไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายที่ไม่บังคับหลังการล้างข้อมูลงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวเริ่มต้นเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตเริ่มต้นสำหรับการสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรด ACP ค่าเริ่มต้นคือ `true` เมื่อเปิดใช้งานการผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบทซับเอเจนต์เนทีฟเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

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
      mode: "followup", // steer | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
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

การแก้ค่า (รายการที่เฉพาะเจาะจงที่สุดจะมีผล): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ลำดับ `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น      | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม   | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ      | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน   | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อเอกลักษณ์เอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### ปฏิกิริยาตอบรับ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ หรือ `"👀"` ตั้ง `""` เพื่อปิดใช้งาน
- การแทนที่แยกตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการแก้ค่า: บัญชี → ช่องทาง → `messages.ackReaction` → fallback ของ identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังการตอบกลับบนช่องทางที่รองรับปฏิกิริยา เช่น Slack, Discord, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้งานปฏิกิริยาสถานะตามวงจรชีวิตบน Slack, Discord, Telegram และ WhatsApp
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะยังคงเปิดใช้งานปฏิกิริยาสถานะเมื่อปฏิกิริยา ack ทำงานอยู่
  บน Telegram และ WhatsApp ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานปฏิกิริยาสถานะตามวงจรชีวิต
- `messages.statusReactions.emojis`: แทนที่คีย์อีโมจิตามวงจรชีวิต:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` และ `stallHard`
  Telegram อนุญาตเฉพาะชุดปฏิกิริยาคงที่ ดังนั้นอีโมจิที่กำหนดค่าแต่ไม่รองรับจะ fallback
  ไปยังตัวแปรสถานะที่รองรับใกล้เคียงที่สุดสำหรับแชทนั้น

### การหน่วงข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่มาถี่จากผู้ส่งเดียวกันให้เป็นรอบเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้ามการหน่วง

### TTS (ข้อความเป็นเสียงพูด)

```json5
{
  messages: {
    tts: {
      auto: "always", // off | always | inbound | tagged
      mode: "final", // final | all
      provider: "elevenlabs",
      summaryModel: "openai/gpt-5.4-mini",
      modelOverrides: { enabled: true },
      maxTextLength: 4000,
      timeoutMs: 30000,
      prefsPath: "~/.openclaw/settings/tts.json",
      providers: {
        elevenlabs: {
          apiKey: "elevenlabs_api_key",
          baseUrl: "https://api.elevenlabs.io",
          speakerVoiceId: "voice_id",
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
          speakerVoice: "en-US-AvaMultilingualNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "alloy",
        },
      },
    },
  },
}
```

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` จะแสดงสถานะที่มีผลอยู่
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (เลือกใช้เอง)
- คีย์ API จะย้อนกลับไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาในตัวเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รหัสผู้ให้บริการเดิม `edge` ยังยอมรับเป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการแก้ค่าคือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าปลายทางนั้นเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบ model/voice

---

## พูดคุย

ค่าเริ่มต้นสำหรับโหมดพูดคุย (macOS/iOS/Android)

```json5
{
  talk: {
    provider: "elevenlabs",
    providers: {
      elevenlabs: {
        speakerVoiceId: "elevenlabs_voice_id",
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
          speakerVoice: "cedar",
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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการ Talk หลายตัว
- คีย์ Talk แบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`
- รหัสเสียงจะย้อนกลับไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความธรรมดาหรืออ็อบเจกต์ SecretRef
- การย้อนกลับไปใช้ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API ของ Talk
- `providers.*.voiceAliases` ช่วยให้คำสั่ง Talk ใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ตัวช่วย MLX ภายในเครื่องของ macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาในตัวเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรันเอเจนต์ OpenClaw เต็มรูปแบบที่อยู่เบื้องหลังการเรียก Control UI Talk แบบเรียลไทม์ `openclaw_agent_consult` ปล่อยว่างไว้เพื่อคงพฤติกรรม session/model ปกติ
- `consultFastMode` ตั้งค่าการแทนที่ fast-mode แบบใช้ครั้งเดียวสำหรับการ consult แบบเรียลไทม์ของ Control UI Talk โดยไม่เปลี่ยนการตั้งค่า fast-mode ปกติของ session
- `speechLocale` ตั้งค่ารหัส locale BCP 47 ที่การรู้จำเสียงพูดของ iOS/macOS Talk ใช้ ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังจากผู้ใช้เงียบก่อนส่ง transcript หากไม่ได้ตั้งค่าไว้ จะคงช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms on macOS and Android, 900 ms on iOS`)
- `realtime.instructions` ต่อท้ายคำสั่งระบบที่ส่งให้ผู้ให้บริการเข้ากับพรอมป์เรียลไทม์ในตัวของ OpenClaw เพื่อให้กำหนดค่าสไตล์เสียงได้โดยไม่สูญเสียคำแนะนำเริ่มต้นของ `openclaw_agent_consult`
- `realtime.consultRouting` ควบคุม fallback ของ Gateway relay เมื่อผู้ให้บริการเรียลไทม์สร้าง transcript ผู้ใช้ขั้นสุดท้ายโดยไม่มี `openclaw_agent_consult`: `provider-direct` จะคงการตอบกลับโดยตรงจากผู้ให้บริการไว้ ขณะที่ `force-agent-consult` จะส่งคำขอที่สรุปแล้วผ่าน OpenClaw

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
