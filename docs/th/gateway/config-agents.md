---
read_when:
    - ปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, เวิร์กสเปซ, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่า talk
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-06-27T17:32:32Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3e5e5e1301e331b1a5dbf42e2396ee92d36297159015181f6263dcd59c8cd33c
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตตามเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ Gateway runtime และคีย์ระดับบนสุดอื่นๆ
ดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `OPENCLAW_WORKSPACE_DIR` เมื่อตั้งค่าไว้ มิฉะนั้นเป็น `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

ค่า `agents.defaults.workspace` ที่ระบุอย่างชัดเจนจะมีลำดับความสำคัญเหนือ
`OPENCLAW_WORKSPACE_DIR` ใช้ตัวแปรสภาพแวดล้อมเพื่อชี้เอเจนต์เริ่มต้น
ไปยัง workspace ที่เมานต์ไว้ เมื่อคุณไม่ต้องการเขียนพาธนั้นลงในการกำหนดค่า

### `agents.defaults.repoRoot`

รากของ repository ที่เป็นทางเลือก ซึ่งแสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาตของ skill เริ่มต้นที่เป็นทางเลือกสำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละเว้น `agents.defaults.skills` เพื่ออนุญาต skills แบบไม่จำกัดโดยค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ skills
- รายการ `agents.list[].skills` ที่ไม่ว่างเปล่าคือชุดสุดท้ายสำหรับเอเจนต์นั้น
  และจะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์ workspace ที่เป็นทางเลือกบางไฟล์ แต่ยังคงเขียนไฟล์ bootstrap ที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีด bootstrap ของ workspace ซ้ำ ซึ่งช่วยลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งานการฉีด bootstrap ของ workspace และไฟล์บริบทในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่ควบคุมวงจรชีวิต prompt ของตนเองทั้งหมด (เครื่องมือบริบทแบบกำหนดเอง, runtime ดั้งเดิมที่สร้างบริบทเอง หรือ workflow เฉพาะทางที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และการกู้คืนหลัง Compaction จะข้ามการฉีดด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].contextInjection` ค่าที่ละเว้นจะสืบทอด
`agents.defaults.contextInjection`

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของ workspace ก่อนตัดทอน ค่าเริ่มต้น: `20000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].bootstrapMaxChars` ค่าที่ละเว้นจะสืบทอด
`agents.defaults.bootstrapMaxChars`

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].bootstrapTotalMaxChars` ค่าที่ละเว้น
จะสืบทอด `agents.defaults.bootstrapTotalMaxChars`

### การแทนที่โปรไฟล์ bootstrap ต่อเอเจนต์

ใช้การแทนที่โปรไฟล์ bootstrap ต่อเอเจนต์เมื่อเอเจนต์หนึ่งต้องการพฤติกรรมการฉีด prompt
ที่แตกต่างจากค่าเริ่มต้นร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอดจาก
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

ควบคุมประกาศใน system prompt ที่เอเจนต์มองเห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"always"`

- `"off"`: ไม่ฉีดข้อความประกาศการตัดทอนเข้าไปใน system prompt
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน
- `"always"`: ฉีดประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอน (แนะนำ)

จำนวนดิบ/ที่ฉีดโดยละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ในการวินิจฉัย เช่น
รายงานและบันทึกบริบท/สถานะ ส่วนบริบทผู้ใช้/runtime ของ WebChat ตามปกติจะได้รับ
เฉพาะประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // off | once | always
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณ prompt/บริบทปริมาณสูงหลายชุด และตั้งใจแยกตาม subsystem
แทนที่จะให้ทั้งหมดไหลผ่าน knob ทั่วไปตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude ของการรันโมเดลแบบครั้งเดียวสำหรับ reset/startup รวมถึงไฟล์รายวันล่าสุด
  `memory/*.md` คำสั่งแชทเปล่า `/new` และ `/reset` จะได้รับการตอบรับ
  โดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ skills แบบย่อที่ฉีดเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอน runtime แบบมีขอบเขตและบล็อกที่ runtime เป็นเจ้าของซึ่งถูกฉีดเข้าไป
- `memory.qmd.limits.*`:
  snippet การค้นหาหน่วยความจำแบบทำดัชนีและการกำหนดขนาดการฉีด

ใช้การแทนที่ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการงบประมาณที่แตกต่าง:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude เริ่มต้นของเทิร์นแรกที่ฉีดในการรันโมเดลแบบ reset/startup
คำสั่งแชทเปล่า `/new` และ `/reset` จะตอบรับการ reset โดยไม่เรียกใช้
โมเดล ดังนั้นจะไม่โหลด prelude นี้

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

ค่าเริ่มต้นร่วมกันสำหรับพื้นผิวบริบท runtime แบบมีขอบเขต

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

- `memoryGetMaxChars`: เพดานข้อความตัดตอนเริ่มต้นของ `memory_get` ก่อนเพิ่ม
  metadata การตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละเว้น `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดขั้นสูงที่ใช้สำหรับผลลัพธ์ที่คงอยู่
  และการกู้คืนส่วนเกิน ปล่อยให้ไม่ได้ตั้งค่าสำหรับเพดานอัตโนมัติของบริบทโมเดล:
  `16000` อักขระต่ำกว่า 100K token, `32000` อักขระที่ 100K+ token และ `64000`
  อักขระที่ 200K+ token ค่าที่ระบุชัดเจนสูงสุด `1000000` จะยอมรับสำหรับ
  โมเดลบริบทยาว แต่เพดานที่มีผลจริงยังถูกจำกัดไว้ที่ประมาณ 30% ของหน้าต่าง
  บริบทโมเดล `openclaw doctor --deep` จะแสดงเพดานที่มีผล และ doctor จะเตือน
  เฉพาะเมื่อการแทนที่ที่ระบุชัดเจนล้าสมัยหรือไม่มีผล
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการฉีด
  refresh หลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับ knobs `contextLimits` ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอด
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

เพดานรวมสำหรับรายการ skills แบบย่อที่ฉีดเข้าไปใน system prompt สิ่งนี้
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

การแทนที่ต่อเอเจนต์สำหรับงบประมาณ prompt ของ skills

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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพ transcript/tool ก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพไว้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ค่ากำหนดการบีบอัด/รายละเอียดของ image-tool สำหรับรูปภาพที่โหลดจากพาธไฟล์, URL และการอ้างอิงสื่อ
ค่าเริ่มต้น: `auto`

OpenClaw ปรับลำดับขั้นการปรับขนาดให้เข้ากับโมเดลรูปภาพที่เลือก ตัวอย่างเช่น Claude Opus 4.8, OpenAI GPT-5.5, Qwen VL และโมเดล vision ของ Llama 4 ที่โฮสต์อยู่สามารถใช้รูปภาพขนาดใหญ่กว่าเส้นทาง vision รายละเอียดสูงรุ่นเก่า/ค่าเริ่มต้น ขณะที่เทิร์นที่มีหลายรูปจะถูกบีบอัดอย่างเข้มงวดมากขึ้นในโหมด `auto` เพื่อควบคุมต้นทุน token และ latency

ค่า:

- `auto`: ปรับตามขีดจำกัดโมเดลและจำนวนรูปภาพ
- `efficient`: เลือกรูปภาพขนาดเล็กกว่าเพื่อลดการใช้ token และ byte
- `balanced`: ใช้ลำดับขั้นมาตรฐานระดับกลาง
- `high`: รักษารายละเอียดมากขึ้นสำหรับภาพหน้าจอ ไดอะแกรม และรูปภาพเอกสาร

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบท system prompt (ไม่ใช่ timestamp ของข้อความ) จะ fallback เป็นเขตเวลาของโฮสต์

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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลัก
  - รูปแบบอ็อบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับสำหรับกรณีล้มเหลว
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ใช้เป็นการกำหนดเส้นทางสำรองด้วย เมื่อโมเดลที่เลือก/โมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้ refs แบบ `provider/model` อย่างชัดเจน รองรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้และรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider นั้นให้ ID ดังกล่าว รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องระบุ provider prefix อย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างรูปภาพร่วมกันและพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP พื้นหลังโปร่งใสของ OpenAI
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตนของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังคงอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider การสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างเพลงร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังคงอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider การสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างวิดีโอร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังคงอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider การสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - Plugin การสร้างวิดีโอ Qwen อย่างเป็นทางการรองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` จากนั้นไปที่โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve ได้
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด fallback สำหรับการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` ต่อเอเจนต์จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ต่อเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้นของ reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท operator-admin Gateway เมื่อไม่ได้ตั้งค่า reasoning override ต่อข้อความหรือเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย API-key ของ OpenAI หรือ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นลองรายการ provider ที่กำหนดค่าไว้ซึ่งตรงกับ model id นั้นพอดีแบบไม่ซ้ำ และหลังจากนั้นเท่านั้นจึง fallback ไปยัง provider เริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` อย่างชัดเจน) หาก provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model ที่กำหนดค่าไว้รายการแรกแทนการแสดงค่าเริ่มต้นของ provider ที่ถูกลบและล้าสมัย
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, การกำหนดเส้นทาง OpenRouter `provider`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลทั้งหมดที่ค้นพบสำหรับ provider ที่เลือก โดยไม่ต้องระบุ model id ทุกรายการด้วยตนเอง
  - เพิ่ม `agentRuntime` ในรายการ `provider/*` เมื่อโมเดลที่ค้นพบแบบไดนามิกทั้งหมดสำหรับ provider นั้นควรใช้รันไทม์เดียวกัน นโยบายรันไทม์ `provider/model` แบบเจาะจงยังคงชนะ wildcard
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่มีขอบเขตตาม provider จะ merge โมเดล provider ที่เลือกเข้าในแผนที่นี้ และเก็บ provider ที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง การทำ compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้อัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่ threshold ดู [การทำ compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider เริ่มต้นระดับ global ที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญในการ merge ของ `params` (config): `agents.defaults.params` (ฐาน global) จะถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (ต่อโมเดล) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะแทนที่ตาม key ดูรายละเอียดใน [Prompt Caching](/th/reference/prompt-caching)
- `models.providers.openrouter.params.provider`: นโยบายการกำหนดเส้นทาง provider เริ่มต้นทั่วทั้ง OpenRouter OpenClaw จะส่งต่อนี้ไปยังอ็อบเจ็กต์คำขอ `provider` ของ OpenRouter; `agents.defaults.models["openrouter/<model>"].params.provider` ต่อโมเดลและ params ของเอเจนต์จะแทนที่ตาม key ดู [การกำหนดเส้นทาง provider ของ OpenRouter](/th/providers/openrouter#advanced-configuration)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าใน request bodies ของ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับ key ของคำขอที่สร้างขึ้น extra body จะชนะ; เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงตัด `store` ที่ใช้เฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน request bodies ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking, Plugin vLLM ที่ bundled จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีลำดับความสำคัญสุดท้าย โมเดล thinking ของ vLLM Qwen และ Nemotron ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) แทนบันได effort หลายระดับ
- `compat.thinkingFormat`: รูปแบบเพย์โหลด thinking ที่เข้ากันได้กับ OpenAI ใช้ `"together"` สำหรับ `reasoning.enabled` สไตล์ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดสไตล์ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนแบ็กเอนด์ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับคำขอ เช่น vLLM OpenClaw จะแมป thinking ที่ปิดใช้งานเป็น `false` และ thinking ที่เปิดใช้งานเป็น `true` และโมเดล vLLM Qwen ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารีสำหรับรูปแบบเหล่านี้
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ต่อโมเดลที่เข้ากันได้กับ OpenAI รวม `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รับค่านี้ได้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง, แถวเซสชัน Gateway, การตรวจสอบ session patch, การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับ provider/model ที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าที่เฉพาะกับ provider สำหรับระดับ canonical
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับ thinking ที่คงไว้ เมื่อเปิดใช้งานและเปิด thinking อยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และ replay `reasoning_content` ก่อนหน้า; ดู [thinking และ thinking ที่คงไว้ของ Z.AI](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: ตัวจัดการกระบวนการระดับ provider แบบเลือกได้สำหรับเซิร์ฟเวอร์โมเดล local/self-hosted เมื่อโมเดลที่เลือกเป็นของ provider นั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), เริ่ม `command` พร้อม `args` หาก endpoint down, รอสูงสุด `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบ absolute `idleStopMs: 0` จะคงกระบวนการไว้จนกว่า OpenClaw จะออก; ค่าบวกจะหยุดกระบวนการที่ OpenClaw spawn หลังจาก idle เป็นจำนวนมิลลิวินาทีดังกล่าว ดู [บริการโมเดล local](/th/gateway/local-model-services)
- นโยบายรันไทม์อยู่ที่ provider หรือโมเดล ไม่ใช่ที่ `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั่วทั้ง provider หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดลเอเจนต์ OpenAI บน provider OpenAI อย่างเป็นทางการจะเลือก Codex เป็นค่าเริ่มต้น
- ตัวเขียน config ที่เปลี่ยนแปลงฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบอ็อบเจ็กต์ canonical และเก็บรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวน agent runs แบบ parallel สูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serial) ค่าเริ่มต้น: 4

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

- `id`: `"auto"`, `"openclaw"`, id ของ plugin harness ที่ลงทะเบียนไว้ หรือ alias ของ backend CLI ที่รองรับ Plugin Codex ที่รวมมาในตัวลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาในตัวให้ backend CLI ชื่อ `claude-cli`
- `id: "auto"` ให้ plugin harness ที่ลงทะเบียนไว้รับช่วง turn ที่รองรับ และใช้ OpenClaw เมื่อไม่มี harness ใดตรงกัน runtime ของ Plugin แบบระบุชัด เช่น `id: "codex"` ต้องใช้ harness นั้น และจะล้มเหลวแบบปิดหาก harness ไม่พร้อมใช้งานหรือล้มเหลว
- `id: "pi"` ยอมรับเฉพาะในฐานะ alias ที่เลิกใช้แล้วของ `openclaw` เพื่อคง config ที่เผยแพร่แล้วจาก v2026.5.22 และก่อนหน้า config ใหม่ควรใช้ `openclaw`
- ลำดับความสำคัญของ runtime เริ่มจากนโยบาย model แบบตรงตัวก่อน (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` หรือ `models.providers.<provider>.models[]`) จากนั้น `agents.list[]` / `agents.defaults.models["provider/*"]` แล้วจึงเป็นนโยบายระดับ provider ที่ `models.providers.<provider>.agentRuntime`
- คีย์ runtime ทั้ง agent เป็นแบบ legacy `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, การ pin runtime ของ session และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือก runtime ให้รัน `openclaw doctor --fix` เพื่อลบค่าที่ค้างอยู่
- model ของ agent OpenAI ใช้ harness Codex เป็นค่าเริ่มต้น; provider/model `agentRuntime.id: "codex"` ยังใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับการ deploy Claude CLI แนะนำให้ใช้ `model: "anthropic/claude-opus-4-8"` พร้อม `agentRuntime.id: "claude-cli"` ที่กำหนดตามขอบเขต model model refs แบบ legacy `claude-cli/claude-opus-4-7` ยังใช้งานได้เพื่อความเข้ากันได้ แต่ config ใหม่ควรรักษาการเลือก provider/model ให้เป็น canonical และใส่ backend การรันไว้ในนโยบาย runtime ของ provider/model
- สิ่งนี้ควบคุมเฉพาะการรัน turn ของ agent แบบข้อความ การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตนเอง

**alias shorthands ในตัว** (ใช้เฉพาะเมื่อ model อยู่ใน `agents.defaults.models`):

| Alias               | Model                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-6`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.5`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

alias ที่คุณกำหนดไว้จะมีผลเหนือค่าเริ่มต้นเสมอ

model Z.AI GLM-4.x จะเปิดใช้โหมด thinking โดยอัตโนมัติ เว้นแต่คุณตั้ง `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
model Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการ streaming การเรียก tool ตั้ง `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
Anthropic Claude Opus 4.8 ปิด thinking เป็นค่าเริ่มต้นใน OpenClaw; เมื่อเปิดใช้ adaptive thinking อย่างชัดเจน ค่าเริ่มต้น effort ที่ provider ของ Anthropic เป็นเจ้าของคือ `high` model Claude 4.6 มีค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งระดับ thinking อย่างชัดเจน

### `agents.defaults.cliBackends`

backend CLI ทางเลือกสำหรับการรัน fallback แบบข้อความเท่านั้น (ไม่มีการเรียก tool) มีประโยชน์เป็นสำรองเมื่อ provider API ล้มเหลว

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

- backend CLI เน้นข้อความก่อนเสมอ; tool จะถูกปิดใช้งานเสมอ
- รองรับ session เมื่อตั้ง `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับ path ของไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` ให้ backend กู้คืน session ที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัย
  จากส่วนท้าย transcript ดิบของ OpenClaw ที่มีขอบเขต ก่อนที่จะมีสรุป Compaction
  ครั้งแรก การเปลี่ยนแปลง auth profile หรือ credential-epoch
  จะไม่ reseed จากข้อมูลดิบอยู่ดี

### `agents.defaults.promptOverlays`

prompt overlays ที่ไม่ขึ้นกับ provider ซึ่งใช้ตามตระกูล model บนพื้นผิว prompt ที่ OpenClaw ประกอบขึ้น model ids ในตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้ามเส้นทาง OpenClaw/provider; `personality` ควบคุมเฉพาะชั้นรูปแบบการโต้ตอบที่เป็นมิตร เส้นทาง app-server แบบ native ของ Codex จะคงคำสั่ง base/model ที่ Codex เป็นเจ้าของแทน overlay GPT-5 ของ OpenClaw นี้ และ OpenClaw จะปิด personality ในตัวของ Codex สำหรับ thread แบบ native

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
- `"off"` ปิดเฉพาะชั้นที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้
- legacy `plugins.entries.openai.config.personality` ยังคงถูกอ่านเมื่อยังไม่ได้ตั้งค่าร่วมนี้

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
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จาก system prompt และข้ามการฉีด `HEARTBEAT.md` เข้าไปใน bootstrap context ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับ payload คำเตือนข้อผิดพลาดของ tool ระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับ turn ของ agent ใน Heartbeat ก่อนถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds` เมื่อตั้งค่าไว้ มิฉะนั้นจะใช้ cadence ของ Heartbeat โดยจำกัดสูงสุดที่ 600 วินาที
- `directPolicy`: นโยบายการส่งแบบ direct/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมาย direct `block` ระงับการส่งไปยังเป้าหมาย direct และปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้ bootstrap context แบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์ bootstrap ของ workspace
- `isolatedSession`: เมื่อเป็น true Heartbeat แต่ละครั้งจะรันใน session ใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุน token ต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K tokens
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อ agent นั้นมี lane ที่ยุ่งเพิ่มเติม: งาน subagent ที่ผูกกับ session key ของตัวเอง หรืองาน command แบบ nested lane ของ Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มี flag นี้
- ราย agent: ตั้ง `agents.list[].heartbeat` เมื่อ agent ใดก็ตามกำหนด `heartbeat` **เฉพาะ agent เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat รัน turn ของ agent แบบเต็ม ยิ่ง interval สั้นยิ่งใช้ token มากขึ้น

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

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งชิ้นสำหรับประวัติที่ยาว) ดู [Compaction](/th/concepts/compaction).
- `provider`: id ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction).
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `180`.
- `keepRecentTokens`: งบประมาณจุดตัดของเอเจนต์สำหรับเก็บส่วนท้ายล่าสุดของทรานสคริปต์ไว้แบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อถูกตั้งค่าไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นจุดตรวจสอบแบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำการเก็บรักษาตัวระบุทึบแสงในตัวไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตผิดรูปสำหรับสรุปแบบ safeguard เปิดใช้งานโดยค่าเริ่มต้นในโหมด safeguard; ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของลูปเครื่องมือแบบไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากเพิ่มผลลัพธ์เครื่องมือแล้วและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป ระบบจะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่เพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ใช้ได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบไม่บังคับเพื่อฉีดกลับเข้าไปหลัง Compaction การฉีดกลับจะปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือตั้งเป็น `[]` การตั้งค่า `["Session Startup", "Red Lines"]` อย่างชัดเจนจะเปิดใช้งานคู่นั้นและคง fallback แบบเดิม `Every Session`/`Safety` ไว้ เปิดใช้งานเฉพาะเมื่อบริบทเพิ่มเติมคุ้มกับความเสี่ยงในการทำซ้ำคำแนะนำโปรเจกต์ที่ถูกจับไว้แล้วในสรุป Compaction
- `model`: `provider/model-id` แบบไม่บังคับหรือ alias เปล่าจาก `agents.defaults.models` สำหรับการสรุป Compaction เท่านั้น alias เปล่าจะถูก resolve ก่อน dispatch; ID โมเดล literal ที่กำหนดค่าไว้จะคงลำดับความสำคัญเมื่อเกิดการชนกัน ใช้ค่านี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง; เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์แบบไม่บังคับ (`number` หรือสตริงเช่น `"20mb"`) ที่ทริกเกอร์ Compaction ภายในปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์ถัดไปที่เล็กกว่า ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งการแจ้งเตือนสั้น ๆ ไปยังผู้ใช้เมื่อ Compaction เริ่มต้นและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานโดยค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นแบบ agentic ที่เงียบก่อน auto-compaction เพื่อจัดเก็บความทรงจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลแบบตรงตัว เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายใน; การ override นี้ไม่สืบทอดห่วงโซ่ fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

### `agents.defaults.runRetries`

ขอบเขตรอบการลองใหม่ของลูปการรันชั้นนอกสำหรับรันไทม์เอเจนต์แบบฝัง เพื่อป้องกันลูปการดำเนินการไม่สิ้นสุดระหว่างการกู้คืนจากความล้มเหลว โปรดทราบว่าการตั้งค่านี้ในปัจจุบันใช้กับรันไทม์เอเจนต์แบบฝังเท่านั้น ไม่ใช่รันไทม์ ACP หรือ CLI

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

- `base`: จำนวนพื้นฐานของรอบการลองรันใหม่สำหรับลูปการรันชั้นนอก ค่าเริ่มต้น: `24`.
- `perProfile`: รอบการลองรันใหม่เพิ่มเติมที่ให้ต่อผู้สมัครโปรไฟล์ fallback ค่าเริ่มต้น: `8`.
- `min`: ขีดจำกัดสัมบูรณ์ขั้นต่ำสำหรับรอบการลองรันใหม่ ค่าเริ่มต้น: `32`.
- `max`: ขีดจำกัดสัมบูรณ์สูงสุดสำหรับรอบการลองรันใหม่เพื่อป้องกันการดำเนินการหลุดควบคุม ค่าเริ่มต้น: `160`.

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

- `mode: "cache-ttl"` เปิดใช้งานรอบการตัดแต่ง
- `ttl` ควบคุมว่าการตัดแต่งสามารถรันอีกครั้งได้บ่อยแค่ไหน (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น
- `softTrimRatio` และ `hardClearRatio` รับค่าตั้งแต่ `0.0` ถึง `1.0`; การตรวจสอบคอนฟิกจะปฏิเสธค่านอกช่วงนั้น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดแต่ง/ล้าง
- อัตราส่วนอิงตามอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
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

- ช่องทางที่ไม่ใช่ Telegram ต้องมี `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้งานการตอบกลับแบบบล็อก
- การ override รายช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`.
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การ override ต่อเอเจนต์: `agents.list[].humanDelay`.

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

- ค่าเริ่มต้น: `instant` สำหรับแชทตรง/การ mention, `message` สำหรับแชทกลุ่มที่ไม่ได้ mention
- การ override ต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`.

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

**แบ็กเอนด์:**

- `docker`: รันไทม์ Docker ภายใน (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่รองรับด้วย SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**คอนฟิกแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซต่อ scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในที่มีอยู่ซึ่งส่งให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบ inline หรือ SecretRefs ที่ OpenClaw materialize เป็นไฟล์ชั่วคราวขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีสิทธิ์เหนือ `identityFile`
- `certificateData` มีสิทธิ์เหนือ `certificateFile`
- `knownHostsData` มีสิทธิ์เหนือ `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูก resolve จากสแนปช็อตรันไทม์ secrets ที่ใช้งานอยู่ก่อนที่เซสชันแซนด์บ็อกซ์จะเริ่ม

**พฤติกรรมแบ็กเอนด์ SSH:**

- seed เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงเวิร์กสเปซ SSH ระยะไกลเป็น canonical
- route `exec`, เครื่องมือไฟล์ และเส้นทางสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์ต่อ scope ภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เวิร์กสเปซเอเจนต์ถูกเมานต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เวิร์กสเปซเอเจนต์ถูกเมานต์แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + เวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และเวิร์กสเปซที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**คอนฟิก Plugin OpenShell:**

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

- `mirror`: ตั้งต้นรีโมตจากเครื่องโลคัลก่อน exec แล้วซิงก์กลับหลัง exec; พื้นที่ทำงานโลคัลยังคงเป็นแหล่งหลัก
- `remote`: ตั้งต้นรีโมตหนึ่งครั้งเมื่อสร้าง sandbox แล้วให้พื้นที่ทำงานรีโมตเป็นแหล่งหลักต่อไป

ในโหมด `remote` การแก้ไขบนโฮสต์โลคัลที่ทำนอก OpenClaw จะไม่ถูกซิงก์เข้า sandbox โดยอัตโนมัติหลังขั้นตอนตั้งต้น
Transport คือ SSH เข้าไปยัง OpenShell sandbox แต่ Plugin เป็นเจ้าของวงจรชีวิตของ sandbox และการซิงก์ mirror แบบเลือกใช้ได้

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้, ผู้ใช้ root

**คอนเทนเนอร์ใช้ค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกเป็นค่าเริ่มต้น เว้นแต่คุณตั้งค่าอย่างชัดเจนเป็น
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` (break-glass)
รอบของ Codex app-server ใน OpenClaw sandbox ที่ใช้งานอยู่ใช้การตั้งค่า egress เดียวกันนี้สำหรับการเข้าถึงเครือข่าย native code-mode

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ในพื้นที่ทำงานที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; bind ระดับ global และต่อเอเจนต์จะถูกรวมกัน

**เบราว์เซอร์ใน sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC observer ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะออก URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันใน sandbox ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบ global อย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ (เช่น `172.21.0.1/32`)
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
  - `--disable-extensions` (เปิดใช้เป็นค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu`
    เปิดใช้เป็นค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องใช้
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้ง หากเวิร์กโฟลว์ของคุณ
    ต้องพึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดโปรเซส
    เริ่มต้นของ Chromium
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

สำหรับการติดตั้ง npm โดยไม่มี source checkout โปรดดู [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบ inline

### `agents.list` (การ override ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อให้เอเจนต์มีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของตนเอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้นข้อมูลรับรองที่ใช้ร่วมกันจึงอยู่ที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
override เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ override ของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับแบบพูดอัตโนมัติ, `/tts audio`, `/tts status` และ
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

- `id`: id เอเจนต์ที่คงที่ (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกชนะ (บันทึก warning) หากไม่ได้ตั้ง รายการแรกใน list จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงตั้ง primary ต่อเอเจนต์แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้เอเจนต์นั้นเลือกใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` ยังสืบทอด fallback ค่าเริ่มต้น เว้นแต่คุณตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำ catalog โมเดลทั้งหมด
- `tts`: override text-to-speech ต่อเอเจนต์แบบเลือกใช้ได้ บล็อกนี้ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เฉพาะกับ persona เช่น ผู้ให้บริการ, เสียง, โมเดล, สไตล์ หรือโหมดอัตโนมัติไว้ที่นี่
- `skills`: allowlist Skills ต่อเอเจนต์แบบเลือกใช้ได้ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งค่าไว้; list ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking ค่าเริ่มต้นต่อเอเจนต์แบบเลือกใช้ได้ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้ง override ต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ผู้ให้บริการเป็นเจ้าของ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning ค่าเริ่มต้นต่อเอเจนต์แบบเลือกใช้ได้ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้ง reasoning override ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับ fast mode แบบเลือกใช้ได้ (`"auto" | true | false`) มีผลเมื่อไม่ได้ตั้ง fast-mode override ต่อข้อความหรือเซสชัน
- `models`: override catalog โมเดล/รันไทม์ต่อเอเจนต์แบบเลือกใช้ได้ โดยใช้ id เต็ม `provider/model` เป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้นรันไทม์ต่อเอเจนต์
- `runtime`: descriptor รันไทม์ต่อเอเจนต์แบบเลือกใช้ได้ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธที่อ้างอิงจากพื้นที่ทำงาน, URL `http(s)` หรือ URI `data:`
- ไฟล์รูปภาพ `identity.avatar` แบบโลคัลที่อ้างอิงจากพื้นที่ทำงานจำกัดไว้ที่ 2 MB URL `http(s)` และ URI `data:` จะไม่ถูกตรวจด้วยขีดจำกัดขนาดไฟล์โลคัล
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์ที่กำหนดค่าสำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = เป้าหมายที่กำหนดค่าใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) ใส่ id ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายตัวเอง รายการเก่าที่ config เอเจนต์ถูกลบจะถูก `sessions_spawn` ปฏิเสธและถูกละจาก `agents_list`; รัน `openclaw doctor --fix` เพื่อล้างรายการเหล่านั้น หรือเพิ่มรายการ `agents.list[]` ขั้นต่ำหากเป้าหมายนั้นควรยัง spawn ได้ขณะสืบทอดค่าเริ่มต้น
- guard การสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลายเอเจนต์

รันเอเจนต์ที่แยกจากกันหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

- `type` (เลือกใช้ได้): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่หายไปมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบ persistent
- `match.channel` (จำเป็น)
- `match.accountId` (เลือกใช้ได้; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (เลือกใช้ได้; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (เลือกใช้ได้; เฉพาะ channel)
- `acp` (เลือกใช้ได้; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ครอบคลุมทั้ง channel)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะแก้ค่าโดยใช้ตัวตนการสนทนาแบบ exact (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับ route binding ด้านบน

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

<Accordion title="ไม่มีสิทธิ์เข้าถึงระบบไฟล์ (รับส่งข้อความเท่านั้น)">

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

- **`scope`**: กลยุทธ์การจัดกลุ่มเซสชันพื้นฐานสำหรับบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันแยกภายในบริบทช่องทางหนึ่ง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางหนึ่งใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อต้องการบริบทร่วม)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม id ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป id ตามแบบแผนไปยังเพียร์ที่มีคำนำหน้าผู้ให้บริการ เพื่อแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางที่ลิงก์ไว้อีกราย ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งคู่ไว้ รายการที่หมดอายุก่อนจะมีผล ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความสดใหม่ของการรีเซ็ตเมื่อว่างใช้ `lastInteractionAt` การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, Cron wakeups, การแจ้งเตือน exec และการบันทึกงานของ Gateway อาจอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันรายวัน/เมื่อว่างยังสดใหม่อยู่
- **`resetByType`**: การกำหนดทับเป็นรายประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเก่าเป็น alias ของ `direct`
- **`mainKey`**: ฟิลด์เก่า Runtime ใช้ `"main"` สำหรับบัคเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับไปมาสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ต่อเอเจนต์ (จำนวนเต็ม, ช่วง: `0`-`20`, ค่าเริ่มต้น: `5`) `0` ปิดการเชนแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` พร้อม alias เก่า `dm`), `keyPrefix` หรือ `rawKeyPrefix` รายการ deny แรกจะชนะ
- **`maintenance`**: การล้าง session store + การควบคุมการเก็บรักษา
  - `mode`: `enforce` ใช้การล้างและเป็นค่าเริ่มต้น; `warn` แสดงเฉพาะคำเตือน
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างแบบแบตช์พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับเพดานระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้เพดานทันที
  - เซสชัน probe สำหรับ model-run ของ Gateway ที่มีอายุสั้นใช้การเก็บรักษาคงที่ `24h` แต่การล้างถูกควบคุมด้วยแรงกดดัน: จะลบเฉพาะแถว probe ของ model-run แบบ strict ที่เก่าแล้วเมื่อถึงแรงกดดันจากการบำรุงรักษา/เพดานรายการเซสชัน เฉพาะคีย์ probe แบบ explicit strict ที่ตรงกับ `agent:*:explicit:model-run-<uuid>` เท่านั้นที่เข้าเกณฑ์; เซสชัน direct, group, thread, Cron, hook, Heartbeat, ACP และ sub-agent ปกติจะไม่รับช่วงการเก็บรักษา 24h นี้ เมื่อการล้าง model-run ทำงาน จะทำงานก่อนการล้างรายการเก่าตาม `pruneAfter` ที่กว้างกว่าและเพดาน `maxEntries`
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษาไฟล์เก็บถาวรทรานสคริปต์ `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบอาร์ติแฟกต์/เซสชันเก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถกำหนดทับได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถกำหนดทับได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวค่าเริ่มต้นเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถกำหนดทับได้)
  - `spawnSessions`: เกตค่าเริ่มต้นสำหรับการสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรด ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้ thread bindings; ผู้ให้บริการ/บัญชีสามารถกำหนดทับได้
  - `defaultSpawnContext`: บริบท subagent แบบ native ค่าเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การกำหนดทับต่อช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การแก้ค่า (รายการที่เฉพาะเจาะจงที่สุดชนะ): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุดการส่งต่อค่า `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น      | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม   | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ      | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน   | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่แยกตัวพิมพ์ใหญ่-เล็ก `{think}` เป็น alias ของ `{thinkingLevel}`

### รีแอ็กชันรับทราบ

- ค่าเริ่มต้นเป็น `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- การกำหนดทับต่อช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการแก้ค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่า fallback จาก identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับบนช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้รีแอ็กชันสถานะตามวงจรชีวิตบน Slack, Discord, Telegram และ WhatsApp
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะเปิดใช้รีแอ็กชันสถานะเมื่อรีแอ็กชัน ack ทำงานอยู่
  บน Telegram และ WhatsApp ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้รีแอ็กชันสถานะตามวงจรชีวิต
- `messages.statusReactions.emojis`: กำหนดทับคีย์ emoji ตามวงจรชีวิต:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` และ `stallHard`
  Telegram อนุญาตเฉพาะชุดรีแอ็กชันที่ตายตัว ดังนั้น emoji ที่กำหนดค่าไว้แต่ไม่รองรับจะ fallback
  ไปยังสถานะเวอร์ชันที่รองรับซึ่งใกล้เคียงที่สุดสำหรับแชตนั้น

### การ debounce ขาเข้า

รวมข้อความเฉพาะข้อความล้วนที่ส่งถี่จากผู้ส่งเดียวกันให้เป็นรอบเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้ามการ debounce

### TTS (แปลงข้อความเป็นเสียงพูด)

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลอยู่
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (เลือกเปิดเอง)
- คีย์ API จะ fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้ใส่ Plugin ผู้ให้บริการ TTS แต่ละรายการที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS id ผู้ให้บริการเดิม `edge` ยอมรับเป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint ของ OpenAI TTS ลำดับการ resolve คือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนคลายการตรวจสอบ model/voice

---

## การสนทนา

ค่าเริ่มต้นสำหรับโหมด Talk (macOS/iOS/Android)

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อมีการกำหนดค่าผู้ให้บริการ Talk หลายราย
- คีย์ Talk แบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่คงอยู่ใหม่เป็น `talk.providers.<provider>`
- Voice ID จะ fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความธรรมดาหรืออ็อบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API ของ Talk
- `providers.*.voiceAliases` ให้ directive ของ Talk ใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ใช้โดยตัวช่วย MLX ภายในเครื่องของ macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรัน agent ของ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบเรียลไทม์ของ Control UI Talk ปล่อยว่างไว้เพื่อคงพฤติกรรม session/model ตามปกติ
- `consultFastMode` ตั้งค่าการแทนที่ fast-mode แบบครั้งเดียวสำหรับการ consult แบบเรียลไทม์ของ Control UI Talk โดยไม่เปลี่ยนการตั้งค่า fast-mode ปกติของ session
- `speechLocale` ตั้งค่า id locale แบบ BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของ iOS/macOS Talk ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมว่าโหมด Talk จะรอนานเท่าใดหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ได้ตั้งค่า จะคงหน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms on macOS and Android, 900 ms on iOS`)
- `realtime.instructions` ต่อท้ายคำสั่งระบบที่หันเข้าหาผู้ให้บริการเข้ากับ prompt เรียลไทม์ในตัวของ OpenClaw เพื่อให้กำหนดค่าสไตล์เสียงได้โดยไม่สูญเสียคำแนะนำเริ่มต้นของ `openclaw_agent_consult`
- `realtime.consultRouting` ควบคุม fallback ของ Gateway relay เมื่อผู้ให้บริการเรียลไทม์สร้าง transcript ผู้ใช้สุดท้ายโดยไม่มี `openclaw_agent_consult`: `provider-direct` คงการตอบกลับจากผู้ให้บริการโดยตรงไว้ ส่วน `force-agent-consult` จะ route คำขอที่สรุปแล้วผ่าน OpenClaw

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
