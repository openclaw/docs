---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับเซสชัน การส่งข้อความ และพฤติกรรมของโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่าการพูดคุย
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-06T09:12:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: b864cc3985db2f3ab2e82b18bcd1b1590a387d7474f5f0d0da3a1d36d9a276b9
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์
ระดับบนสุดอื่นๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รูทของรีโพสิทอรีแบบไม่บังคับที่แสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยเดินย้อนขึ้นไปจาก workspace

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

- ละ `agents.defaults.skills` เพื่อให้ใช้ Skills ได้ไม่จำกัดตามค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

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

ควบคุมว่าไฟล์ bootstrap ของ workspace จะถูกแทรกเข้าไปใน system prompt เมื่อใด ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นต่อเนื่องที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการแทรก bootstrap ของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction จะยังคงสร้างบริบทใหม่
- `"never"`: ปิดการแทรก bootstrap ของ workspace และไฟล์บริบทในทุกเทิร์น ใช้ค่านี้เฉพาะกับเอเจนต์ที่เป็นเจ้าของวงจรชีวิต prompt ของตนเองอย่างสมบูรณ์ (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทของตนเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ต้องใช้ bootstrap) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการแทรกด้วยเช่นกัน

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์ bootstrap ของ workspace ก่อนตัดทอน ค่าเริ่มต้น: `12000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 12000 } },
}
```

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่แทรกจากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศใน system prompt ที่เอเจนต์มองเห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่แทรกข้อความประกาศการตัดทอนเข้าไปใน system prompt
- `"once"`: แทรกประกาศแบบกระชับหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: แทรกประกาศแบบกระชับทุกครั้งที่รันเมื่อมีการตัดทอน

จำนวนดิบ/จำนวนที่แทรกโดยละเอียดและฟิลด์สำหรับปรับแต่งการกำหนดค่าจะอยู่ใน diagnostics เช่น
รายงานและบันทึก context/status ส่วนบริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับเพียง
ประกาศการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบบริบท

OpenClaw มีงบ prompt/บริบทปริมาณสูงหลายรายการ และจงใจแยกตามระบบย่อย
แทนที่จะให้ทุกอย่างไหลผ่านปุ่มควบคุมทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การแทรก bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude การรันโมเดลแบบครั้งเดียวเมื่อรีเซ็ต/เริ่มต้น รวมถึงไฟล์รายวันล่าสุดใน
  `memory/*.md` คำสั่งแชทเปล่า `/new` และ `/reset` จะได้รับการตอบรับ
  โดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่แทรกเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนรันไทม์แบบมีขอบเขตและบล็อกที่แทรกซึ่งรันไทม์เป็นเจ้าของ
- `memory.qmd.limits.*`:
  snippet การค้นหาหน่วยความจำที่ทำดัชนีแล้วและขนาดการแทรก

ใช้ override ต่อเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องใช้งบที่แตกต่างกัน:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม prelude การเริ่มต้นในเทิร์นแรกที่แทรกในการรันโมเดลเมื่อรีเซ็ต/เริ่มต้น
คำสั่งแชทเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิวบริบทของรันไทม์แบบมีขอบเขต

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
  metadata การตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดที่ใช้สำหรับผลลัพธ์ที่คงไว้และ
  การกู้คืนเมื่อเกินขนาด
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการแทรก
  การรีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

override ต่อเอเจนต์สำหรับปุ่มควบคุม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานทั่วโลกสำหรับรายการ Skills แบบย่อที่แทรกเข้าไปใน system prompt ค่านี้
ไม่มีผลต่อการอ่านไฟล์ `SKILL.md` เมื่อจำเป็น

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

override ต่อเอเจนต์สำหรับงบ prompt ของ Skills

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

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของภาพในบล็อกภาพของ transcript/tool ก่อนเรียก provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
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

รูปแบบเวลาใน system prompt ค่าเริ่มต้น: `auto` (ค่าตามระบบปฏิบัติการ)

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
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบออบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดล vision
  - ยังใช้เป็นการกำหนดเส้นทาง fallback เมื่อโมเดลที่เลือกหรือโมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - ควรใช้การอ้างอิง `provider/model` แบบชัดเจน Bare ID ได้รับการยอมรับเพื่อความเข้ากันได้ หาก Bare ID ตรงกับรายการที่รองรับรูปภาพซึ่งกำหนดค่าไว้ใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider ให้รายการนั้น การจับคู่ที่กำหนดค่าไว้ซึ่งกำกวมต้องใช้ prefix ของ provider แบบชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างรูปภาพที่ใช้ร่วมกันและพื้นผิวเครื่องมือ/plugin ใด ๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP ที่มีพื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตนของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider การสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างเพลงที่ใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider การสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างวิดีโอที่ใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน แล้วจึงลอง provider การสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - provider การสร้างวิดีโอ Qwen ที่บันเดิลมารองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปที่โมเดลของเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด fallback ของการดึงข้อมูลในเครื่องมือ `pdf` พิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือในร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายชื่อแบบย่อสำหรับมนุษย์) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` ราย agent จะ override ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ราย agent จะ override ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะกับ owner, ผู้ส่งที่ได้รับอนุญาต หรือบริบท gateway operator-admin เมื่อไม่ได้ตั้งค่า override reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุต elevated เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน แล้วจึงลองการจับคู่ provider ที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ model id นั้นทุกประการ และหลังจากนั้นเท่านั้นจึง fallback ไปที่ provider เริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หาก provider นั้นไม่ expose โมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปที่ provider/model รายการแรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของ provider ที่ถูกลบไปแล้วซึ่งล้าสมัย
- `models`: แค็ตตาล็อกโมเดลที่กำหนดค่าไว้และ allowlist สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์การ configure/onboarding ตามขอบเขต provider จะ merge โมเดลของ provider ที่เลือกเข้าใน map นี้และคง provider ที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง การทำ Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อ override threshold ดู [การทำ Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider เริ่มต้นแบบ global ที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการ merge ของ `params` (config): `agents.defaults.params` (ฐาน global) ถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะ override ตาม key ดูรายละเอียดที่ [การแคชพรอมป์](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าไปใน request body ของ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับ request key ที่สร้างขึ้น extra body จะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟจะยังคงตัด `store` เฉพาะ OpenAI ออกหลังจากนั้น
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าไปใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking plugin vLLM ที่บันเดิลมาจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุอย่างชัดเจนจะ override ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีลำดับความสำคัญสุดท้าย สำหรับการควบคุม thinking ของ vLLM Qwen ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รับค่านั้นจริง ๆ จากนั้น OpenClaw จะ expose `/think xhigh` ในเมนูคำสั่ง, แถวเซสชันของ Gateway, การตรวจสอบ session patch, การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับ provider/model ที่กำหนดค่านั้น ใช้ `compat.reasoningEffortMap` เมื่อ backend ต้องการค่าเฉพาะ provider สำหรับระดับ canonical
- `params.preserveThinking`: opt-in เฉพาะ Z.AI สำหรับ thinking ที่เก็บรักษาไว้ เมื่อเปิดใช้งานและ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [thinking และ thinking ที่เก็บรักษาไว้ของ Z.AI](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบาย runtime ระดับต่ำเริ่มต้นของ agent id ที่ละไว้จะมีค่าเริ่มต้นเป็น OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ harness PI ในตัว, `id: "auto"` เพื่อให้ harness plugin ที่ลงทะเบียนไว้ claim โมเดลที่รองรับและใช้ PI เมื่อไม่มีตัวใดตรงกัน, harness id ที่ลงทะเบียนไว้ เช่น `id: "codex"` เพื่อบังคับใช้ harness นั้น หรือ alias ของ backend CLI ที่รองรับ เช่น `id: "claude-cli"` runtime plugin ที่ระบุอย่างชัดเจนจะ fail closed เมื่อ harness ไม่พร้อมใช้งานหรือล้มเหลว เก็บการอ้างอิงโมเดลให้เป็น canonical เป็น `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และ backend การดำเนินการอื่น ๆ ผ่าน config runtime แทน prefix provider runtime แบบ legacy ดู [runtime ของ agent](/th/concepts/agent-runtimes) เพื่อดูว่าสิ่งนี้ต่างจากการเลือก provider/model อย่างไร
- ตัวเขียน config ที่ mutate ฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบออบเจ็กต์แบบ canonical และคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนการรัน agent แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคง serialize) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุม executor ระดับต่ำที่จะรัน turn ของ agent การ deploy ส่วนใหญ่ควรคง runtime OpenClaw Pi เริ่มต้นไว้ ใช้เมื่อ plugin ที่เชื่อถือได้ให้ harness แบบเนทีฟ เช่น harness app-server ของ Codex ที่บันเดิลมา หรือเมื่อคุณต้องการ backend CLI ที่รองรับ เช่น Claude CLI สำหรับโมเดลความคิด ดู [runtime ของ agent](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, harness id ของ plugin ที่ลงทะเบียนไว้ หรือ alias ของ backend CLI ที่รองรับ plugin Codex ที่บันเดิลมาลงทะเบียน `codex`; plugin Anthropic ที่บันเดิลมาให้ backend CLI `claude-cli`
- `id: "auto"` ให้ harness plugin ที่ลงทะเบียนไว้ claim turn ที่รองรับและใช้ PI เมื่อไม่มี harness ใดตรงกัน runtime plugin ที่ระบุอย่างชัดเจน เช่น `id: "codex"` ต้องใช้ harness นั้นและจะ fail closed หากไม่พร้อมใช้งานหรือล้มเหลว
- Environment override: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` override `id` สำหรับ process นั้น
- สำหรับการ deploy ที่ใช้ Codex เท่านั้น ให้ตั้งค่า `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"`
- สำหรับการ deploy ที่ใช้ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดล legacy `claude-cli/claude-opus-4-7` ยังคงใช้งานได้เพื่อความเข้ากันได้ แต่ config ใหม่ควรเก็บการเลือก provider/model ให้เป็น canonical และใส่ backend การดำเนินการไว้ใน `agentRuntime.id`
- key นโยบาย runtime รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือก harness จะถูกตรึงตาม session id หลังจากการรันแบบ embedded ครั้งแรก การเปลี่ยนแปลง config/env มีผลกับเซสชันใหม่หรือเซสชันที่ reset แล้ว ไม่ใช่ transcript ที่มีอยู่ เซสชัน legacy ที่มีประวัติ transcript แต่ไม่มี pin ที่บันทึกไว้จะถือว่าถูก pin เป็น PI `/status` รายงาน runtime ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการ turn ของ agent แบบข้อความเท่านั้น การสร้างสื่อ, vision, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตน

**ชวเลข alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| Alias               | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

alias ที่คุณกำหนดค่าไว้จะชนะค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้งานโหมดคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้งาน `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI เสริมสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นแผนสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
- รองรับการส่งต่อรูปภาพเมื่อ `imageArg` รับเส้นทางไฟล์ได้

### `agents.defaults.systemPromptOverride`

แทนที่พรอมต์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์มีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมต์แบบควบคุม

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

โอเวอร์เลย์พรอมต์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบปฏิสัมพันธ์ที่เป็นมิตร

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

- `"friendly"` (ค่าเริ่มต้น) และ `"on"` เปิดใช้งานเลเยอร์รูปแบบปฏิสัมพันธ์ที่เป็นมิตร
- `"off"` ปิดใช้งานเฉพาะเลเยอร์ที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งานอยู่
- ค่าเดิม `plugins.entries.openai.config.personality` ยังถูกอ่านเมื่อยังไม่ได้ตั้งค่าร่วมนี้

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
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมต์ระบบ และข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของเอเจนต์ Heartbeat ก่อนจะถูกยกเลิก เว้นว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและปล่อย `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่ที่ไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเคนต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเคน
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม เช่น งานซับเอเจนต์หรือคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อมีเอเจนต์ใดกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat จะรันเทิร์นเอเจนต์เต็มรูปแบบ ช่วงเวลาที่สั้นลงใช้โทเคนมากขึ้น

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
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนแล้ว เมื่อตั้งค่าไว้ จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะถอยกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดแบบคำต่อคำ การใช้ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นจุดตรวจแบบตายตัว
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุแบบทึบไว้ข้างหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองเสริมสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตมีรูปแบบไม่ถูกต้องสำหรับสรุปแบบ safeguard เปิดใช้งานเป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของลูปเครื่องมือ Pi เสริม เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากผนวกผลลัพธ์เครื่องมือ และก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมต์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่เพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ใน AGENTS.md เสริมเพื่อฉีดกลับหลัง Compaction ค่าเริ่มต้นเป็น `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าอย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อเก่า `Every Session`/`Safety` จะถูกยอมรับเป็น fallback แบบเดิมด้วย
- `model`: การแทนที่ `provider/model-id` เสริมสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรคงใช้โมเดลหนึ่ง แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์เสริม (`number` หรือสตริงอย่าง `"20mb"`) ที่กระตุ้น Compaction ภายในเครื่องแบบปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จหมุนไปยังทรานสคริปต์สืบทอดที่เล็กกว่าได้ ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นเชิงเอเจนต์แบบเงียบก่อน Compaction อัตโนมัติเพื่อจัดเก็บความทรงจำถาวร ตั้งค่า `model` เป็น provider/model ที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นงานดูแลนี้ควรอยู่บนโมเดลภายในเครื่อง การแทนที่นี้จะไม่สืบทอดเชน fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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

<Accordion title="พฤติกรรมของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้งานรอบการตัดแต่ง
- `ttl` ควบคุมความถี่ที่การตัดแต่งจะรันซ้ำได้ (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินไปก่อน จากนั้น hard-clear ผลลัพธ์เครื่องมือเก่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดแต่ง/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเคนที่แน่นอน
- หากมีข้อความผู้ช่วยน้อยกว่า `keepLastAssistants` จะข้ามการตัดแต่ง

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

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้งานการตอบกลับแบบบล็อก
- การแทนที่ตามช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรต่อบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การแทนที่ต่อเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรมและการแบ่งชิ้นที่ [การสตรีม](/th/concepts/streaming)

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
- การแทนที่เฉพาะเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำ sandbox แบบไม่บังคับสำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มได้ที่ [การทำ Sandbox](/th/gateway/sandboxing)

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

<Accordion title="รายละเอียด Sandbox">

**แบ็กเอนด์:**

- `docker`: รันไทม์ Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่ใช้ SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การกำหนดค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รากระยะไกลแบบ absolute ที่ใช้สำหรับ workspace ตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบ inline หรือ SecretRefs ที่ OpenClaw แปลงเป็นไฟล์ชั่วคราวขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญการยืนยันตัวตน SSH:**

- `identityData` มีผลเหนือกว่า `identityFile`
- `certificateData` มีผลเหนือกว่า `certificateFile`
- `knownHostsData` มีผลเหนือกว่า `knownHostsFile`
- ค่า `*Data` ที่อิง SecretRef จะถูก resolve จากสแนปช็อตรันไทม์ secrets ที่ใช้งานอยู่ก่อนเซสชัน sandbox เริ่ม

**พฤติกรรมของแบ็กเอนด์ SSH:**

- เตรียม workspace ระยะไกลหนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นคงให้ workspace SSH ระยะไกลเป็นแหล่งข้อมูลหลัก
- ส่งต่อ `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับไปยังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ sandbox

**การเข้าถึง workspace:**

- `none`: workspace sandbox ตาม scope ใต้ `~/.openclaw/sandboxes`
- `ro`: workspace sandbox ที่ `/workspace`, workspace ของเอเจนต์ถูก mount แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: workspace ของเอเจนต์ถูก mount แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: คอนเทนเนอร์ + workspace ต่อเซสชัน
- `agent`: คอนเทนเนอร์ + workspace หนึ่งชุดต่อเอเจนต์ (ค่าเริ่มต้น)
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

- `mirror`: เตรียมข้อมูลระยะไกลจากในเครื่องก่อน exec, ซิงค์กลับหลัง exec; workspace ในเครื่องยังคงเป็นแหล่งข้อมูลหลัก
- `remote`: เตรียมข้อมูลระยะไกลหนึ่งครั้งเมื่อสร้าง sandbox แล้วคงให้ workspace ระยะไกลเป็นแหล่งข้อมูลหลัก

ในโหมด `remote` การแก้ไขในเครื่องโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้า sandbox โดยอัตโนมัติหลังขั้นตอนเตรียมข้อมูล
การขนส่งคือ SSH เข้าไปยัง sandbox ของ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิต sandbox และการซิงค์ mirror แบบไม่บังคับ

**`setupCommand`** รันหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องใช้ network egress, root ที่เขียนได้, ผู้ใช้ root

**คอนเทนเนอร์ใช้ค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) ถ้าเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกเป็นค่าเริ่มต้น เว้นแต่คุณตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (สำหรับกรณีฉุกเฉิน)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ใน workspace ที่ใช้งานอยู่

**`docker.binds`** mount ไดเรกทอรีโฮสต์เพิ่มเติม; bind ระดับ global และต่อเอเจนต์จะถูกรวมเข้าด้วยกัน

**เบราว์เซอร์ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC จะถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงผู้สังเกตการณ์ noVNC ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะส่ง URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชัน sandbox ไม่ให้กำหนดเป้าหมายเบราว์เซอร์ของโฮสต์
- `network` ค่าเริ่มต้นคือ `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge แบบ global อย่างชัดเจน
- `cdpSourceRange` จำกัด CDP ingress ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` mount ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์ sandbox เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) จะใช้แทน `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นการเปิดใช้งานถูกกำหนดใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งมาสำหรับโฮสต์คอนเทนเนอร์:
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
    เปิดใช้เป็นค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากต้องใช้ WebGL/3D
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหาก workflow ของคุณ
    ต้องพึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้ขีดจำกัดกระบวนการ
    เริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของ image คอนเทนเนอร์; ใช้ image เบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำ sandbox สำหรับเบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้กับ Docker เท่านั้น

สร้าง image (จาก checkout ซอร์ส):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี checkout ซอร์ส ดูคำสั่ง `docker build` แบบ inline ได้ที่ [การทำ Sandbox § Image และการตั้งค่า](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การแทนที่ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของเอเจนต์เอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับ global ดังนั้น credentials ที่ใช้ร่วมกันจึงอยู่ที่เดียวได้ ในขณะที่เอเจนต์แต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ การแทนที่ของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับเสียงพูดอัตโนมัติ, `/tts audio`, `/tts status` และ
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
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะชนะ (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงตั้งค่าตัวหลักแบบเข้มงวดต่อเอเจนต์โดยไม่มีโมเดลสำรอง รูปแบบอ็อบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้เอเจนต์นั้นใช้ตัวสำรอง หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมเข้มงวดชัดเจน งาน Cron ที่ override เฉพาะ `primary` ยังคงสืบทอดตัวสำรองค่าเริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้ค่านี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: override ข้อความเป็นเสียงพูดต่อเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบายสำรองไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เจาะจงกับบุคลิก เช่น provider, voice, model, style หรือโหมดอัตโนมัติไว้ที่นี่
- `skills`: allowlist ของ skill ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งไว้ รายการที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี skills
- `thinkingDefault`: ระดับการคิดค่าเริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override ต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกจะควบคุมว่าค่าใดใช้ได้ สำหรับ Google Gemini, `adaptive` จะคงการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็นเหตุผลค่าเริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มี override การให้เหตุผลต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับโหมดเร็วแบบไม่บังคับ (`true | false`) ใช้เมื่อไม่มี override โหมดเร็วต่อข้อความหรือเซสชัน
- `agentRuntime`: override นโยบายรันไทม์ระดับต่ำต่อเอเจนต์แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้เอเจนต์หนึ่งใช้เฉพาะ Codex ขณะที่เอเจนต์อื่นยังคงใช้ตัวสำรอง PI ค่าเริ่มต้นในโหมด `auto`
- `runtime`: descriptor ของรันไทม์ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` กับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: พาธแบบสัมพันธ์กับพื้นที่ทำงาน, URL `http(s)` หรือ URI `data:`
- `identity` ได้ค่าเริ่มต้นมาจาก: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) ใส่ id ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่ชี้กลับมาหาตัวเอง
- ตัวป้องกันการสืบทอดแซนด์บ็อกซ์: หากเซสชันผู้ร้องขออยู่ในแซนด์บ็อกซ์ `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่อยู่ในแซนด์บ็อกซ์
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

### ฟิลด์การจับคู่การผูก

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มี type จะใช้ route เป็นค่าเริ่มต้น), `acp` สำหรับการผูกการสนทนา ACP แบบถาวร
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
6. เอเจนต์ค่าเริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ด้วยตัวตนการสนทนาที่ตรงกันพอดี (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับการผูก route ข้างต้น

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="การเข้าถึงเต็มรูปแบบ (ไม่มีแซนด์บ็อกซ์)">

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

<Accordion title="เครื่องมืออ่านอย่างเดียว + พื้นที่ทำงาน">

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

<Accordion title="ไม่มีการเข้าถึงระบบไฟล์ (ส่งข้อความเท่านั้น)">

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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

- **`scope`**: กลยุทธ์พื้นฐานสำหรับการจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะมีเซสชันที่แยกจากกันภายในบริบทช่องทางหนึ่ง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางหนึ่งใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความขาเข้าที่มีผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมปรหัสมาตรฐานไปยังเพียร์ที่มีคำนำหน้าผู้ให้บริการเพื่อแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางอื่นที่ลิงก์ไว้ ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตที่เวลา local `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งคู่ เงื่อนไขใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความสดใหม่ของการรีเซ็ตเมื่อว่างใช้ `lastInteractionAt` การเขียนจากพื้นหลัง/เหตุการณ์ระบบ เช่น Heartbeat, Cron wakeup, การแจ้งเตือน exec และงานบันทึกบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันแบบรายวัน/เมื่อว่างยังคงสดใหม่
- **`resetByType`**: การแทนที่ตามชนิด (`direct`, `group`, `thread`) ยอมรับ `dm` แบบ legacy เป็น alias ของ `direct`
- **`mainKey`**: ฟิลด์ legacy Runtime จะใช้ `"main"` สำหรับบัคเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ถึงเอเจนต์ (จำนวนเต็ม, ช่วง: `0`–`5`) `0` ปิดใช้งานการ chaining แบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, พร้อม alias legacy `dm`), `keyPrefix` หรือ `rawKeyPrefix` กฎ deny แรกที่ตรงกันจะมีผล
- **`maintenance`**: การล้างข้อมูล session-store + ตัวควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ดำเนินการล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการค้างเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลแบบ batch พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับเพดานระดับ production; `openclaw sessions cleanup --enforce` ใช้เพดานทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะนำออกจาก config รุ่นเก่า
  - `resetArchiveRetention`: การเก็บรักษา archive transcript แบบ `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างข้อมูลตามงบประมาณ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นระดับ global สำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถ override ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นของการ auto-unfocus เมื่อไม่มีกิจกรรมเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถ override ได้)
  - `maxAgeHours`: อายุสูงสุดแบบ hard max เริ่มต้นเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถ override ได้)
  - `spawnSessions`: gate เริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และ ACP thread spawns ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้การผูกเธรด; ผู้ให้บริการ/บัญชีสามารถ override ได้
  - `defaultSpawnContext`: บริบท subagent แบบ native เริ่มต้นสำหรับ spawns ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การแทนที่รายช่อง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

การแก้ค่า (รายการที่เฉพาะเจาะจงที่สุดชนะ): บัญชี → ช่อง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ลำดับต่อ `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร           | คำอธิบาย                 | ตัวอย่าง                    |
| ----------------- | ------------------------ | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น         | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม      | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ         | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน      | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กใหญ่ `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### รีแอ็กชัน Ack

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งค่าเป็น `""` เพื่อปิดใช้งาน
- การแทนที่รายช่อง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการแก้ค่า: บัญชี → ช่อง → `messages.ackReaction` → ค่าถอยกลับของอัตลักษณ์
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังตอบกลับในช่องที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้งานรีแอ็กชันสถานะตามวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะยังเปิดใช้งานรีแอ็กชันสถานะเมื่อรีแอ็กชัน ack ทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานรีแอ็กชันสถานะตามวงจรชีวิต

### การหน่วงข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งติดกันอย่างรวดเร็วจากผู้ส่งเดียวกันให้เป็นเทิร์นเดียวของเอเจนต์ สื่อ/ไฟล์แนบจะส่งผ่านทันที คำสั่งควบคุมจะข้ามการหน่วง

### TTS (แปลงข้อความเป็นเสียง)

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่การตั้งค่าภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้)
- คีย์ API จะถอยกลับไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่มาพร้อมระบบเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละรายการที่คุณต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS ตัวระบุผู้ให้บริการเดิม `edge` ยอมรับเป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่เอนด์พอยต์ TTS ของ OpenAI ลำดับการแก้ค่าคือคอนฟิก ตามด้วย `OPENAI_TTS_BASE_URL` แล้วจึงเป็น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังเอนด์พอยต์ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการโหมดพูดคุยหลายราย
- คีย์โหมดพูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น และจะถูกย้ายไปยัง `talk.providers.<provider>` โดยอัตโนมัติ
- ID เสียงจะถอยกลับไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` ยอมรับสตริงข้อความธรรมดาหรืออ็อบเจ็กต์ SecretRef
- ค่าถอยกลับ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับโหมดพูดคุย
- `providers.*.voiceAliases` ให้คำสั่งกำกับโหมดพูดคุยใช้ชื่อที่จำง่ายได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ใช้โดยตัวช่วย MLX ภายในเครื่องของ macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่มาพร้อมระบบเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธตัวช่วยสำหรับการพัฒนา
- `speechLocale` ตั้งค่า ID โลแคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของโหมดพูดคุยบน iOS/macOS หากไม่ตั้งค่าไว้ จะใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดพูดคุยรอหลังจากผู้ใช้เงียบ ก่อนส่งทรานสคริปต์ หากไม่ได้ตั้งค่าไว้ จะคงช่วงหยุดตามค่าเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์คอนฟิกอื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
