---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของ Agent, การกำหนดเส้นทางแบบหลาย Agent, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-07-03T17:47:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1eb3f5d217738a8eebc3c94b61261ca34221b13ac08ffdba9cad61c9a48ed1ac
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่กำหนดขอบเขตตาม Agent ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของ Agent

### `agents.defaults.workspace`

ค่าเริ่มต้น: `OPENCLAW_WORKSPACE_DIR` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

ค่า `agents.defaults.workspace` ที่ระบุชัดเจนจะมีลำดับความสำคัญเหนือ
`OPENCLAW_WORKSPACE_DIR` ใช้ตัวแปรสภาพแวดล้อมเพื่อชี้ Agent เริ่มต้น
ไปยัง workspace ที่เมานต์ไว้ เมื่อคุณไม่ต้องการเขียนพาธนั้นลงในการกำหนดค่า

### `agents.defaults.repoRoot`

รูทของ repository แบบไม่บังคับที่แสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist ของ skill เริ่มต้นแบบไม่บังคับสำหรับ Agent ที่ไม่ได้ตั้งค่า
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

- ละเว้น `agents.defaults.skills` เพื่อให้ใช้ skills ได้ไม่จำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับ Agent นั้น และ
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์ workspace แบบไม่บังคับที่เลือกไว้ ขณะที่ยังเขียนไฟล์ bootstrap ที่จำเป็นอยู่ ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมว่าไฟล์ bootstrap ของ workspace จะถูกฉีดเข้าไปใน system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์น continuation ที่ปลอดภัย (หลังจากการตอบกลับของ assistant เสร็จสิ้น) จะข้ามการฉีด bootstrap ของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction จะยังสร้างบริบทใหม่
- `"never"`: ปิดใช้งาน bootstrap ของ workspace และการฉีดไฟล์บริบทในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับ Agent ที่เป็นเจ้าของวงจรชีวิต prompt ของตัวเองทั้งหมด (เอนจินบริบทแบบกำหนดเอง, รันไทม์ native ที่สร้างบริบทเอง, หรือเวิร์กโฟลว์เฉพาะที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และเทิร์นกู้คืนหลัง Compaction จะข้ามการฉีดด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

การ override ต่อ Agent: `agents.list[].contextInjection` ค่าที่ละเว้นจะสืบทอดจาก
`agents.defaults.contextInjection`

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของ workspace ก่อนตัดทอน ค่าเริ่มต้น: `20000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

การ override ต่อ Agent: `agents.list[].bootstrapMaxChars` ค่าที่ละเว้นจะสืบทอดจาก
`agents.defaults.bootstrapMaxChars`

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

การ override ต่อ Agent: `agents.list[].bootstrapTotalMaxChars` ค่าที่ละเว้นจะ
สืบทอดจาก `agents.defaults.bootstrapTotalMaxChars`

### การ override โปรไฟล์ bootstrap ต่อ Agent

ใช้การ override โปรไฟล์ bootstrap ต่อ Agent เมื่อ Agent หนึ่งต้องการพฤติกรรม
การฉีด prompt ที่ต่างจากค่าเริ่มต้นร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอดจาก
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

ควบคุมประกาศใน system prompt ที่ Agent มองเห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"always"`

- `"off"`: ไม่ฉีดข้อความประกาศการตัดทอนเข้าไปใน system prompt
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน
- `"always"`: ฉีดประกาศแบบกระชับในทุกการรันเมื่อมีการตัดทอน (แนะนำ)

จำนวน raw/injected โดยละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ใน diagnostics เช่น
รายงาน context/status และ log; บริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับเฉพาะ
ประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณ prompt/บริบทปริมาณสูงหลายส่วน และตั้งใจแยกตามระบบย่อย
แทนที่จะให้ทั้งหมดไหลผ่าน knob ทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude แบบครั้งเดียวสำหรับการรันโมเดลเมื่อ reset/startup รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะ
  รับทราบการ reset โดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ skills แบบกระชับที่ฉีดเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  excerpt ของรันไทม์แบบจำกัดขอบเขตและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  ขนาด snippet ของการค้นหา memory ที่ทำดัชนีไว้และการฉีด

ใช้การ override ต่อ Agent ที่ตรงกันเฉพาะเมื่อ Agent หนึ่งต้องการงบประมาณที่ต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude สำหรับ startup ในเทิร์นแรกที่ฉีดในการรันโมเดลเมื่อ reset/startup
คำสั่งแชตเปล่า `/new` และ `/reset` จะรับทราบการ reset โดยไม่เรียกใช้
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

ค่าเริ่มต้นร่วมกันสำหรับพื้นผิวบริบทรันไทม์แบบจำกัดขอบเขต

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

- `memoryGetMaxChars`: เพดาน excerpt เริ่มต้นของ `memory_get` ก่อนเพิ่ม
  metadata การตัดทอนและประกาศ continuation
- `memoryGetDefaultLines`: ช่วงบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละเว้น `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดขั้นสูงที่ใช้สำหรับผลลัพธ์
  ที่คงไว้และการกู้คืนเมื่อเกินขนาด เว้นว่างไว้เพื่อใช้เพดานอัตโนมัติของบริบทโมเดล:
  `16000` อักขระเมื่อต่ำกว่า 100K tokens, `32000` อักขระเมื่อ 100K+ tokens และ `64000`
  อักขระเมื่อ 200K+ tokens ยอมรับค่าที่ระบุชัดเจนได้ถึง `1000000` สำหรับ
  โมเดล long-context แต่เพดานที่มีผลยังถูกจำกัดไว้ที่ประมาณ 30% ของ
  หน้าต่างบริบทของโมเดล `openclaw doctor --deep` จะแสดงเพดานที่มีผล
  และ doctor จะเตือนเฉพาะเมื่อการ override ที่ระบุชัดเจนล้าสมัยหรือไม่มีผล
- `postCompactionMaxChars`: เพดาน excerpt ของ AGENTS.md ที่ใช้ระหว่างการฉีด
  refresh หลัง Compaction

#### `agents.list[].contextLimits`

การ override ต่อ Agent สำหรับ knob `contextLimits` ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอด
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

เพดานทั่วโลกสำหรับรายการ skills แบบกระชับที่ฉีดเข้าไปใน system prompt ตัวเลือกนี้
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

การ override ต่อ Agent สำหรับงบประมาณ prompt ของ skills

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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/เครื่องมือก่อนเรียก provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มี screenshot จำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพได้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ค่ากำหนดการบีบอัด/รายละเอียดของเครื่องมือรูปภาพสำหรับรูปภาพที่โหลดจากพาธไฟล์, URL และการอ้างอิง media
ค่าเริ่มต้น: `auto`

OpenClaw ปรับลำดับขั้นการ resize ให้เข้ากับโมเดลรูปภาพที่เลือก ตัวอย่างเช่น Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL และโมเดล vision ของ Llama 4 ที่โฮสต์อยู่สามารถใช้รูปภาพขนาดใหญ่กว่าเส้นทาง vision high-detail รุ่นเก่า/ค่าเริ่มต้น ขณะที่เทิร์นที่มีหลายรูปภาพจะถูกบีบอัดอย่างเข้มงวดขึ้นในโหมด `auto` เพื่อควบคุมต้นทุน token และ latency

ค่า:

- `auto`: ปรับตามขีดจำกัดของโมเดลและจำนวนรูปภาพ
- `efficient`: เน้นรูปภาพขนาดเล็กลงเพื่อลดการใช้ token และ byte
- `balanced`: ใช้ลำดับขั้นมาตรฐานแบบกึ่งกลาง
- `high`: รักษารายละเอียดมากขึ้นสำหรับ screenshot, diagram และรูปภาพเอกสาร

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
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
  - รูปแบบสตริงตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบออบเจ็กต์ตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับสำหรับการสลับเมื่อใช้ไม่ได้
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ใช้เป็นการกำหนดเส้นทางสำรองด้วย เมื่อโมเดลที่เลือก/โมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้การอ้างอิง `provider/model` อย่างชัดเจน ระบบยอมรับ ID แบบไม่มีคำนำหน้าเพื่อความเข้ากันได้ หาก ID แบบไม่มีคำนำหน้าตรงกับรายการที่รองรับรูปภาพที่กำหนดค่าไว้ใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider นั้นให้ ID ดังกล่าว รายการที่กำหนดค่าไว้แล้วแต่กำกวมต้องใช้คำนำหน้า provider อย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างรูปภาพร่วม และพื้นผิวเครื่องมือ/Plugin ใด ๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตนของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider การสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างเพลงร่วมและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider การสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างวิดีโอร่วมและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider การสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - Plugin การสร้างวิดีโอ Qwen อย่างเป็นทางการรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะถอยกลับไปใช้ `imageModel` แล้วจึงใช้โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve ได้
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` รายเอเจนต์จะเขียนทับค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะเขียนทับค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่ได้ตั้งค่าการเขียนทับ reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย OpenAI API-key หรือ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นลองจับคู่ provider ที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ ID โมเดลนั้นแบบตรงตัว และหลังจากนั้นจึงถอยกลับไปใช้ provider เริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` อย่างชัดเจน) หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้ provider/model ที่กำหนดค่าไว้รายการแรกแทนการแสดงค่าเริ่มต้นของ provider ที่ถูกลบและล้าสมัย
- `models`: แคตตาล็อกโมเดลที่กำหนดค่าไว้และ allowlist สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, การกำหนดเส้นทาง `provider` ของ OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับ provider ที่เลือก โดยไม่ต้องระบุ ID โมเดลทุกรายการด้วยตนเอง
  - เพิ่ม `agentRuntime` ลงในรายการ `provider/*` เมื่อโมเดลที่ค้นพบแบบไดนามิกทุกรายการสำหรับ provider นั้นควรใช้รันไทม์เดียวกัน นโยบายรันไทม์แบบตรงตัว `provider/model` ยังมีสิทธิ์เหนือ wildcard
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding แบบจำกัดขอบเขตตาม provider จะรวมโมเดลของ provider ที่เลือกเข้าในแผนที่นี้ และคง provider อื่นที่กำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้อัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อเขียนทับค่า threshold ดู [Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์เริ่มต้นของ provider แบบทั่วโลกที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการ merge ของ `params` (config): `agents.defaults.params` (ฐานทั่วโลก) ถูกเขียนทับโดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID เอเจนต์ที่ตรงกัน) เขียนทับตาม key ดูรายละเอียดใน [การแคชพรอมป์](/th/reference/prompt-caching)
- `models.providers.openrouter.params.provider`: นโยบายการกำหนดเส้นทาง provider เริ่มต้นทั่วทั้ง OpenRouter OpenClaw ส่งต่อนี้ไปยังออบเจ็กต์ `provider` ในคำขอของ OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` รายโมเดลและพารามิเตอร์ของเอเจนต์จะเขียนทับตาม key ดู [การกำหนดเส้นทาง provider ของ OpenRouter](/th/providers/openrouter#advanced-configuration)
- `params.extra_body`/`params.extraBody`: JSON ส่งผ่านขั้นสูงที่ merge เข้าใน body คำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับ key คำขอที่สร้างขึ้น extra body จะมีสิทธิ์เหนือกว่า; เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` ที่ใช้เฉพาะ OpenAI ออกหลังจากนั้น
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน body คำขอระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` ที่ปิด thinking อยู่ Plugin vLLM ที่บันเดิลมาจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุชัดเจนจะเขียนทับค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีสิทธิ์สุดท้าย โมเดล thinking ของ vLLM Qwen และ Nemotron ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) แทนบันได effort หลายระดับ
- `compat.thinkingFormat`: สไตล์ payload thinking ที่เข้ากันได้กับ OpenAI ใช้ `"together"` สำหรับ `reasoning.enabled` สไตล์ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดสไตล์ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนแบ็กเอนด์ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับคำขอ เช่น vLLM OpenClaw จะแมป thinking ที่ปิดใช้งานเป็น `false` และ thinking ที่เปิดใช้งานเป็น `true` และโมเดล vLLM Qwen ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารีสำหรับรูปแบบเหล่านี้
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่ยอมรับค่านั้นจริง ๆ; จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบ session patch การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับ provider/model ที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าที่เฉพาะ provider สำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับ thinking ที่เก็บรักษาไว้ เมื่อเปิดใช้งานและ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า; ดู [thinking และ thinking ที่เก็บรักษาไว้ของ Z.AI](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: ตัวจัดการกระบวนการระดับ provider แบบไม่บังคับสำหรับเซิร์ฟเวอร์โมเดล local/self-hosted เมื่อโมเดลที่เลือกเป็นของ provider นั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), เริ่ม `command` พร้อม `args` หาก endpoint ล่ม, รอสูงสุด `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบ absolute `idleStopMs: 0` จะคงกระบวนการไว้จนกว่า OpenClaw จะออก; ค่าบวกจะหยุดกระบวนการที่ OpenClaw สร้างขึ้นหลังจากว่างเป็นจำนวนมิลลิวินาทีดังกล่าว ดู [บริการโมเดล local](/th/gateway/local-model-services)
- นโยบายรันไทม์ควรอยู่บน provider หรือโมเดล ไม่ใช่บน `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั่วทั้ง provider หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดลเอเจนต์ OpenAI บน provider OpenAI อย่างเป็นทางการจะเลือก Codex เป็นค่าเริ่มต้น
- ตัวเขียน config ที่เปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์มาตรฐานและคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบลำดับเดียว) ค่าเริ่มต้น: 4

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

- `id`: `"auto"`, `"openclaw"`, id ของ harness Plugin ที่ลงทะเบียนไว้ หรือ alias ของ backend CLI ที่รองรับ Plugin Codex ที่มาพร้อมแพ็กเกจจะลงทะเบียน `codex`; Plugin Anthropic ที่มาพร้อมแพ็กเกจให้ backend CLI `claude-cli`
- `id: "auto"` อนุญาตให้ harness Plugin ที่ลงทะเบียนไว้รับช่วง turn ที่รองรับ และใช้ OpenClaw เมื่อไม่มี harness ใดตรงกัน รันไทม์ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` ต้องมี harness นั้นและจะล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือล้มเหลว
- `id: "pi"` ยอมรับเฉพาะในฐานะ alias ที่เลิกใช้แล้วของ `openclaw` เพื่อรักษาการกำหนดค่าที่เผยแพร่ไปแล้วจาก v2026.5.22 และก่อนหน้า การกำหนดค่าใหม่ควรใช้ `openclaw`
- ลำดับความสำคัญของรันไทม์คือ policy ของโมเดลแบบตรงตัวก่อน (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` หรือ `models.providers.<provider>.models[]`) จากนั้นจึงเป็น `agents.list[]` / `agents.defaults.models["provider/*"]` แล้วจึงเป็น policy ทั้ง provider ที่ `models.providers.<provider>.agentRuntime`
- คีย์รันไทม์ระดับ agent ทั้งตัวเป็นของเดิม `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, การปักรันไทม์ของ session และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือกรันไทม์ ให้รัน `openclaw doctor --fix` เพื่อลบค่าที่ค้างเก่า
- โมเดล agent ของ OpenAI ใช้ harness Codex เป็นค่าเริ่มต้น; provider/model `agentRuntime.id: "codex"` ยังคงใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับการปรับใช้ Claude CLI แนะนำให้ใช้ `model: "anthropic/claude-opus-4-8"` พร้อม `agentRuntime.id: "claude-cli"` ที่ผูกกับขอบเขตโมเดล refs โมเดลเดิม `claude-cli/claude-opus-4-7` ยังทำงานเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรรักษาการเลือก provider/model ให้เป็นแบบมาตรฐาน และใส่ backend การประมวลผลไว้ใน policy รันไทม์ของ provider/model
- สิ่งนี้ควบคุมเฉพาะการประมวลผล turn ของ agent แบบข้อความเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตนเอง

**รูปย่อ alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

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

alias ที่คุณกำหนดค่าไว้จะมีผลเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมดคิดโดยอัตโนมัติ เว้นแต่คุณตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
Anthropic Claude Opus 4.8 ปิดการคิดไว้เป็นค่าเริ่มต้นใน OpenClaw; เมื่อเปิดใช้การคิดแบบปรับตัวอย่างชัดเจน ค่าเริ่มต้นของ effort ที่ provider ของ Anthropic เป็นเจ้าของคือ `high` โมเดล Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดอย่างชัดเจน

### `agents.defaults.cliBackends`

backend CLI เสริมสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อ provider API ล้มเหลว

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

- backend CLI เน้นข้อความเป็นหลัก; เครื่องมือจะถูกปิดใช้เสมอ
- รองรับ session เมื่อมีการตั้งค่า `sessionArg`
- รองรับการส่งต่อรูปภาพเมื่อ `imageArg` รับพาธไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` อนุญาตให้ backend กู้คืน session ที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัย
  จากส่วนท้าย transcript ดิบของ OpenClaw ที่มีขอบเขตก่อนที่จะมี
  สรุป compaction แรก การเปลี่ยนแปลงโปรไฟล์ auth หรือ credential-epoch
  จะยังไม่มีการ reseed จากข้อมูลดิบเสมอ

### `agents.defaults.promptOverlays`

prompt overlay ที่ไม่ขึ้นกับ provider ซึ่งใช้ตามตระกูลโมเดลบนพื้นผิวพรอมป์ที่ OpenClaw ประกอบขึ้น id โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันในเส้นทาง OpenClaw/provider; `personality` ควบคุมเฉพาะชั้นรูปแบบการโต้ตอบที่เป็นมิตร เส้นทาง app-server ของ Codex แบบ native จะคงคำสั่งฐาน/โมเดลที่ Codex เป็นเจ้าของไว้แทน overlay GPT-5 ของ OpenClaw นี้ และ OpenClaw จะปิดใช้ personality ในตัวของ Codex สำหรับ thread แบบ native

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
- `"off"` ปิดใช้เฉพาะชั้นที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้
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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (auth ด้วยคีย์ API) หรือ `1h` (auth ด้วย OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้
- `includeSystemPromptSection`: เมื่อเป็น false จะตัดส่วน Heartbeat ออกจาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าในบริบท bootstrap ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับ turn ของ agent heartbeat ก่อนที่จะถูกยกเลิก เว้นว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds` เมื่อมีการตั้งค่า มิฉะนั้นจะใช้ cadence ของ heartbeat ที่จำกัดไว้ที่ 600 วินาที
- `directPolicy`: policy การส่งแบบตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน heartbeat จะใช้บริบท bootstrap แบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true แต่ละ heartbeat จะรันใน session ใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ heartbeat จากประมาณ 100K เหลือประมาณ 2-5K token
- `skipWhenBusy`: เมื่อเป็น true การรัน heartbeat จะเลื่อนไปเมื่อ lane งานยุ่งเพิ่มเติมของ agent นั้นทำงานอยู่ ได้แก่ subagent ที่ผูกกับคีย์ session ของตนเองหรืองานคำสั่งแบบซ้อน lane ของ Cron จะเลื่อน heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ต่อ agent: ตั้งค่า `agents.list[].heartbeat` เมื่อ agent ใดก็ตามกำหนด `heartbeat` **เฉพาะ agent เหล่านั้น** เท่านั้นที่จะรัน heartbeat
- Heartbeat จะรัน turn ของ agent เต็มรูปแบบ — ช่วงเวลาที่สั้นลงจะใช้ token มากขึ้น

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
- `provider`: id ของ Plugin ผู้ให้บริการ compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่าแล้ว ระบบจะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `180`
- `keepRecentTokens`: งบประมาณจุดตัดของเอเจนต์สำหรับเก็บส่วนท้ายของ transcript ล่าสุดแบบคำต่อคำ `/compact` แบบแมนนวลจะใช้ค่านี้เมื่อมีการตั้งค่าอย่างชัดเจน มิฉะนั้น compaction แบบแมนนวลจะเป็นจุดตรวจสอบแบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุแบบทึบไว้ด้านหน้าระหว่างการสรุป compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการคงตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตมีรูปแบบผิดสำหรับสรุปแบบ safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard; ตั้ง `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจแรงกดของลูปเครื่องมือแบบไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจแรงกดของบริบทหลังจากผนวกผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป ระบบจะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมต์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำเพื่อตัดผลลัพธ์เครื่องมือ หรือทำ compaction แล้วลองใหม่ ทำงานได้กับโหมด compaction ทั้ง `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบไม่บังคับเพื่อฉีดกลับเข้ามาหลัง compaction การฉีดกลับจะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือตั้งเป็น `[]` การตั้งค่าอย่างชัดเจนเป็น `["Session Startup", "Red Lines"]` จะเปิดใช้คู่นั้นและคง fallback แบบเดิม `Every Session`/`Safety` เปิดใช้เฉพาะเมื่อบริบทเพิ่มเติมคุ้มกับความเสี่ยงของการทำซ้ำคำแนะนำโปรเจกต์ที่ถูกบันทึกไว้ในสรุป compaction แล้ว
- `model`: `provider/model-id` แบบไม่บังคับ หรือ alias เปล่าจาก `agents.defaults.models` สำหรับการสรุป compaction เท่านั้น alias เปล่าจะถูก resolve ก่อน dispatch; model ID แบบ literal ที่กำหนดค่าไว้ยังคงมีลำดับความสำคัญเมื่อชนกัน ใช้ค่านี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่ง แต่สรุป compaction ควรรันบนอีกโมเดลหนึ่ง; เมื่อไม่ได้ตั้งค่า compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์จำนวนไบต์แบบไม่บังคับ (`number` หรือสตริงเช่น `"20mb"`) ที่ทริกเกอร์ compaction ภายในเครื่องตามปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ compaction ที่สำเร็จสามารถหมุนไปยัง transcript ตัวต่อที่เล็กกว่าได้ ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งการแจ้งเตือนสั้น ๆ ให้ผู้ใช้เมื่อ compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "กำลัง compact บริบท..." และ "Compaction เสร็จสมบูรณ์") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ compaction เงียบ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อจัดเก็บความจำที่คงทน ตั้ง `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นงานดูแลนี้ควรอยู่บนโมเดลภายในเครื่อง; override จะไม่สืบทอด fallback chain ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อ workspace เป็นแบบอ่านอย่างเดียว

### `agents.defaults.runRetries`

ขอบเขตการวนซ้ำของการลองใหม่ในลูปรันชั้นนอกสำหรับรันไทม์เอเจนต์แบบฝัง เพื่อป้องกันลูปการทำงานไม่สิ้นสุดระหว่างการกู้คืนจากความล้มเหลว โปรดทราบว่าการตั้งค่านี้ปัจจุบันใช้กับรันไทม์เอเจนต์แบบฝังเท่านั้น ไม่ใช่รันไทม์ ACP หรือ CLI

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

- `base`: จำนวนพื้นฐานของรอบการลองรันใหม่สำหรับลูปรันชั้นนอก ค่าเริ่มต้น: `24`
- `perProfile`: จำนวนรอบการลองรันใหม่เพิ่มเติมที่มอบให้ต่อผู้สมัครโปรไฟล์ fallback ค่าเริ่มต้น: `8`
- `min`: ขีดจำกัดสัมบูรณ์ขั้นต่ำสำหรับรอบการลองรันใหม่ ค่าเริ่มต้น: `32`
- `max`: ขีดจำกัดสัมบูรณ์สูงสุดสำหรับรอบการลองรันใหม่เพื่อป้องกันการทำงานหลุดควบคุม ค่าเริ่มต้น: `160`

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

- `mode: "cache-ttl"` เปิดใช้รอบการตัด
- `ttl` ควบคุมว่าการตัดจะรันอีกครั้งได้บ่อยเพียงใด (หลังการแตะแคชครั้งล่าสุด)
- การตัดจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น
- `softTrimRatio` และ `hardClearRatio` รับค่าตั้งแต่ `0.0` ถึง `1.0`; การตรวจสอบ config จะปฏิเสธค่าที่อยู่นอกช่วงนั้น

**Soft-trim** จะเก็บส่วนต้น + ส่วนท้าย และแทรก `...` ตรงกลาง

**Hard-clear** จะแทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูก trim/clear
- สัดส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความของ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัด

</Accordion>

ดูรายละเอียดพฤติกรรมที่ [การตัดแต่งเซสชัน](/th/concepts/session-pruning)

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

- ช่องทางที่ไม่ใช่ Telegram ต้องมี `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การ override ระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และรูปแบบแยกตามบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override ต่อเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรม + การแบ่งชิ้นที่ [การสตรีม](/th/concepts/streaming)

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

การทำ sandbox แบบไม่บังคับสำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มที่ [การทำ Sandbox](/th/gateway/sandboxing)

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
- `ssh`: รันไทม์ระยะไกลทั่วไปที่รองรับด้วย SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**config ของแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: root ระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับ workspace แยกตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อไปยัง OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหา inline หรือ SecretRefs ที่ OpenClaw materialize เป็นไฟล์ชั่วคราวในรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` ชนะ `identityFile`
- `certificateData` ชนะ `certificateFile`
- `knownHostsData` ชนะ `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูก resolve จาก snapshot รันไทม์ secrets ที่ใช้งานอยู่ก่อนเซสชัน sandbox เริ่ม

**พฤติกรรมของแบ็กเอนด์ SSH:**

- seed workspace ระยะไกลหนึ่งครั้งหลัง create หรือ recreate
- จากนั้นคง workspace SSH ระยะไกลเป็น canonical
- route `exec`, เครื่องมือไฟล์ และเส้นทางสื่อผ่าน SSH
- ไม่ sync การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ sandbox

**การเข้าถึง workspace:**

- `none`: workspace sandbox แยกตาม scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: workspace sandbox ที่ `/workspace`, workspace ของเอเจนต์ถูกเมานต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: workspace ของเอเจนต์ถูกเมานต์แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: คอนเทนเนอร์ + workspace ต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + workspace ต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**config ของ Plugin OpenShell:**

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

- `mirror`: เริ่มต้นรีโมตจากโลคัลก่อน exec แล้วซิงก์กลับหลัง exec; เวิร์กสเปซโลคัลยังเป็นแหล่งข้อมูลหลัก
- `remote`: เริ่มต้นรีโมตครั้งเดียวเมื่อสร้าง sandbox แล้วให้เวิร์กสเปซรีโมตเป็นแหล่งข้อมูลหลักต่อไป

ในโหมด `remote` การแก้ไขบนโฮสต์โลคัลที่ทำนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอนเริ่มต้น
การขนส่งคือ SSH เข้าไปยัง sandbox ของ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตของ sandbox และการซิงก์ mirror แบบเลือกได้

**`setupCommand`** รันหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้, ผู้ใช้ root

**ค่าเริ่มต้นของคอนเทนเนอร์คือ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกตามค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)
เทิร์น Codex app-server ใน sandbox ของ OpenClaw ที่ทำงานอยู่ใช้การตั้งค่า egress เดียวกันนี้สำหรับการเข้าถึงเครือข่ายโหมดโค้ดแบบเนทีฟ

**ไฟล์แนบขาเข้า** ถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ทำงานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; binds ระดับ global และต่อเอเจนต์จะถูกผสานกัน

**เบราว์เซอร์ใน sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL ของ noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC สำหรับผู้สังเกตใช้การยืนยันตัวตน VNC ตามค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเคนอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันใน sandbox ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge ทั่วทั้งระบบอย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์ไปยังช่วง CIDR ได้แบบเลือกได้ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปยังคอนเทนเนอร์เบราว์เซอร์ sandbox เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) จะใช้แทน `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นในการเปิดใช้งานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับโฮสต์คอนเทนเนอร์:
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
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu`
    เปิดใช้ตามค่าเริ่มต้น และสามารถปิดใช้ได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหากเวิร์กโฟลว์ของคุณ
    พึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดโปรเซส
    ค่าเริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำ sandbox เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้างอิมเมจ (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm โดยไม่มี source checkout ดู [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

### `agents.list` (การแทนที่ค่าต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของเอเจนต์เอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้นข้อมูลรับรองที่แชร์จึงอยู่รวมในที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ การแทนที่ของเอเจนต์ที่ทำงานอยู่
มีผลกับการตอบกลับแบบพูดอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` ดู [ข้อความเป็นเสียง](/th/tools/tts#per-agent-voice-overrides)
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
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกชนะ (บันทึกคำเตือน) หากไม่ตั้งไว้ รายการแรกในลิสต์คือค่าเริ่มต้น
- `model`: รูปแบบสตริงตั้งค่า primary ต่อเอเจนต์แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจกต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้เอเจนต์นั้นเลือกใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมเข้มงวดให้ชัดเจน งาน Cron ที่แทนที่เฉพาะ `primary` ยังคงสืบทอด fallback ค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: stream params ต่อเอเจนต์ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับการแทนค่าเฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: การแทนที่ข้อความเป็นเสียงต่อเอเจนต์แบบเลือกได้ บล็อกนี้ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่แชร์และนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เฉพาะกับบุคลิก เช่น ผู้ให้บริการ, เสียง, โมเดล, สไตล์ หรือโหมดอัตโนมัติที่นี่
- `skills`: allowlist Skills ต่อเอเจนต์แบบเลือกได้ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งค่าไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการผสาน และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อเอเจนต์แบบเลือกได้ (`off | minimal | low | medium | high | xhigh | adaptive | max`) แทนที่ `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการแทนที่ต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ผู้ให้บริการเป็นเจ้าของ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อเอเจนต์แบบเลือกได้ (`on | off | stream`) แทนที่ `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการแทนที่ reasoning ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์แบบเลือกได้สำหรับ fast mode (`"auto" | true | false`) ใช้เมื่อไม่มีการแทนที่ fast-mode ต่อข้อความหรือเซสชัน
- `models`: การแทนที่แค็ตตาล็อกโมเดล/รันไทม์ต่อเอเจนต์แบบเลือกได้ โดยใช้ id `provider/model` แบบเต็มเป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้นรันไทม์ต่อเอเจนต์
- `runtime`: ตัวอธิบายรันไทม์ต่อเอเจนต์แบบเลือกได้ ใช้ `type: "acp"` กับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน harness ของ ACP เป็นค่าเริ่มต้น
- `identity.avatar`: พาธสัมพันธ์กับเวิร์กสเปซ, URL `http(s)` หรือ URI `data:`
- ไฟล์รูปภาพ `identity.avatar` แบบสัมพันธ์กับเวิร์กสเปซโลคัลจำกัดที่ 2 MB URL `http(s)` และ URI `data:` จะไม่ถูกตรวจด้วยขีดจำกัดขนาดไฟล์โลคัล
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์ที่กำหนดค่าไว้สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = เป้าหมายที่กำหนดค่าไว้ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) รวม id ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายตนเอง รายการค้างที่ config เอเจนต์ถูกลบแล้วจะถูก `sessions_spawn` ปฏิเสธและละไว้จาก `agents_list`; รัน `openclaw doctor --fix` เพื่อล้างรายการเหล่านั้น หรือเพิ่มรายการ `agents.list[]` ขั้นต่ำหากเป้าหมายนั้นควรยัง spawn ได้ขณะสืบทอดค่าเริ่มต้น
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันนอก sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

รันเอเจนต์แยกหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

- `type` (เลือกได้): `route` สำหรับการกำหนดเส้นทางปกติ (เมื่อไม่มี type จะใช้ค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (เลือกได้; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (เลือกได้; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (เลือกได้; เฉพาะช่องทาง)
- `acp` (เลือกได้; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่ที่กำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกัน exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั่วทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะแก้ไขตามตัวตนการสนทนาแบบ exact (`match.channel` + บัญชี + `match.peer.id`) และไม่ใช้ลำดับระดับ route binding ด้านบน

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [Sandbox และเครื่องมือแบบหลาย Agent](/th/tools/multi-agent-sandbox-tools)

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

<Accordion title="รายละเอียดฟิลด์เซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับการจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้รับเซสชันแยกภายในบริบทช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เมื่อมีเจตนาให้ใช้บริบทร่วมกันเท่านั้น)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม id ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความแบบหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: จับคู่ id มาตรฐานกับ peer ที่มีคำนำหน้าผู้ให้บริการ เพื่อใช้เซสชันร่วมกันข้ามช่องทาง คำสั่ง dock เช่น `/dock_discord` ใช้แผนที่เดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยัง peer ช่องทางอื่นที่ลิงก์ไว้ ดู [การ dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตที่เวลาท้องถิ่น `atHour`; `idle` รีเซ็ตหลัง `idleMinutes` เมื่อกำหนดค่าทั้งคู่ รายการที่หมดอายุก่อนจะมีผล ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความสดใหม่ของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, การปลุก Cron, การแจ้งเตือน exec และงานบันทึกบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันรายวัน/เมื่อไม่ได้ใช้งานยังสดใหม่อยู่
- **`resetByType`**: การเขียนทับรายประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็น alias ของ `direct`
- **`mainKey`**: ฟิลด์แบบเดิม Runtime ใช้ `"main"` สำหรับบัคเก็ตแชตโดยตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่าง agent ระหว่างการแลกเปลี่ยน agent-to-agent (จำนวนเต็ม, ช่วง: `0`-`20`, ค่าเริ่มต้น: `5`) `0` ปิดใช้งานการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` พร้อม alias แบบเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธแรกจะมีผล
- **`maintenance`**: การควบคุมการล้าง + การเก็บรักษา session-store
  - `mode`: `enforce` ใช้การล้างและเป็นค่าเริ่มต้น; `warn` แสดงเฉพาะคำเตือน
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ค้าง (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างเป็นชุดพร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับ production; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - เซสชัน probe การรันโมเดลระยะสั้นของ Gateway ใช้การเก็บรักษาคงที่ `24h` แต่การล้างถูกควบคุมด้วยแรงกดดัน: จะลบเฉพาะแถว probe การรันโมเดลแบบ strict ที่ค้าง เมื่อถึงแรงกดดันจากการบำรุงรักษา/ขีดจำกัดรายการเซสชันเท่านั้น เฉพาะคีย์ probe แบบ explicit strict ที่ตรงกับ `agent:*:explicit:model-run-<uuid>` เท่านั้นที่มีสิทธิ์; เซสชัน direct, group, thread, Cron, hook, Heartbeat, ACP และ sub-agent ปกติจะไม่สืบทอดการเก็บรักษา 24 ชั่วโมงนี้ เมื่อการล้าง model-run ทำงาน จะทำงานก่อนการล้างรายการค้างตาม `pruneAfter` ที่กว้างกว่าและขีดจำกัด `maxEntries`
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจาก config รุ่นเก่า
  - `resetArchiveRetention`: การเก็บรักษาคลัง transcript `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับ thread
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถเขียนทับได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของการเลิกโฟกัสอัตโนมัติเมื่อไม่ใช้งานในหน่วยชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถเขียนทับได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวตามค่าเริ่มต้นในหน่วยชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถเขียนทับได้)
  - `spawnSessions`: gate เริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับ thread จาก `sessions_spawn` และ ACP thread spawns ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้งาน thread bindings; ผู้ให้บริการ/บัญชีสามารถเขียนทับได้
  - `defaultSpawnContext`: บริบท subagent แบบ native เริ่มต้นสำหรับ spawn ที่ผูกกับ thread (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การเขียนทับต่อช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การตัดสินค่า (รายการที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุด cascade `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น      | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม   | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ      | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน   | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของ Agent | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ `{think}` เป็น alias ของ `{thinkingLevel}`

### ปฏิกิริยา Ack

- ค่าเริ่มต้นคือ `identity.emoji` ของ agent ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้ง `""` เพื่อปิดใช้งาน
- การเขียนทับต่อช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการตัดสินค่า: บัญชี → ช่องทาง → `messages.ackReaction` → identity fallback
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังการตอบกลับบนช่องทางที่รองรับ reaction เช่น Slack, Discord, Signal, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้งาน lifecycle status reactions บน Slack, Discord, Signal, Telegram และ WhatsApp
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะยังเปิดใช้งาน status reactions เมื่อ ack reactions ทำงานอยู่
  บน Signal, Telegram และ WhatsApp ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งาน lifecycle status reactions
- `messages.statusReactions.emojis`: เขียนทับคีย์ emoji ของ lifecycle:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` และ `stallHard`
  Telegram อนุญาตเฉพาะชุด reaction คงที่ ดังนั้น emoji ที่กำหนดค่าไว้แต่ไม่รองรับจะ fallback
  ไปยังตัวแปร status ที่รองรับซึ่งใกล้เคียงที่สุดสำหรับแชตนั้น

### Debounce ขาเข้า

รวมข้อความแบบข้อความล้วนที่เข้ามาอย่างรวดเร็วจากผู้ส่งเดียวกันเป็น agent turn เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมข้ามการ debounce

### TTS (text-to-speech)

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลใช้งานจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานโดยค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (เลือกเปิดใช้เอง)
- API keys จะ fallback ไปยัง `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้ใส่ Plugin ผู้ให้บริการ TTS แต่ละตัวที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS โดย id ผู้ให้บริการแบบเดิม `edge` จะยอมรับเป็น alias ของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint OpenAI TTS ลำดับการ resolve คือ config จากนั้น `OPENAI_TTS_BASE_URL` แล้วจึงเป็น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนคลายการตรวจสอบความถูกต้องของ model/voice

---

## การพูดคุย

ค่าเริ่มต้นสำหรับโหมดการพูดคุย (macOS/iOS/Android)

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

- `talk.provider` ต้องตรงกับ key ใน `talk.providers` เมื่อมีการกำหนดค่าผู้ให้บริการการพูดคุยหลายตัว
- key การพูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่คงอยู่ใหม่เป็น `talk.providers.<provider>`
- Voice IDs จะ fallback ไปยัง `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริง plaintext หรือออบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่า API key สำหรับการพูดคุย
- `providers.*.voiceAliases` ทำให้ directive ของการพูดคุยใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ใช้โดยตัวช่วย MLX ภายในเครื่องของ macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่ path ของตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก Control UI Talk realtime `openclaw_agent_consult` ปล่อยว่างไว้เพื่อรักษาพฤติกรรม session/model ปกติ
- `consultFastMode` ตั้งค่า override fast-mode แบบครั้งเดียวสำหรับ consult ของ Control UI Talk realtime โดยไม่เปลี่ยนการตั้งค่า fast-mode ปกติของ session
- `speechLocale` ตั้งค่า locale id แบบ BCP 47 ที่ใช้โดยการรู้จำเสียงพูด Talk ของ iOS/macOS ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังจากผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่าจะคงกรอบเวลาหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms on macOS and Android, 900 ms on iOS`)
- `realtime.instructions` ต่อท้ายคำสั่งระบบที่ส่งให้ผู้ให้บริการเข้ากับ prompt realtime ในตัวของ OpenClaw เพื่อให้กำหนดค่าสไตล์เสียงได้โดยไม่สูญเสียคำแนะนำ `openclaw_agent_consult` เริ่มต้น
- `realtime.consultRouting` ควบคุม fallback ของ Gateway relay เมื่อผู้ให้บริการ realtime สร้าง transcript ผู้ใช้สุดท้ายโดยไม่มี `openclaw_agent_consult`: `provider-direct` คงคำตอบจากผู้ให้บริการโดยตรงไว้ ขณะที่ `force-agent-consult` ส่งคำขอที่ finalize แล้วผ่าน OpenClaw

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — key config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
