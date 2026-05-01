---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการเชื่อมโยงสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่าการสนทนา
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-01T10:16:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 12a3c0c4a79d6753c7cebdb366e3a0272571841f3eaa0e08ded21fe54f485ca8
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตระดับ Agent ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ของ Gateway และคีย์
ระดับบนสุดอื่น ๆ โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของ Agent

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากของคลังที่เลือกได้ ซึ่งแสดงในบรรทัด Runtime ของพรอมป์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับอัตโนมัติโดยไล่ขึ้นจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist Skills ค่าเริ่มต้นที่เลือกได้สำหรับ Agent ที่ไม่ได้ตั้งค่า
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
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับ Agent นั้น และ
  จะไม่ถูกรวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์บูตสแตรปของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซที่เลือกได้บางไฟล์ ขณะที่ยังเขียนไฟล์บูตสแตรปที่จำเป็นอยู่ ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมเวลาที่ไฟล์บูตสแตรปของเวิร์กสเปซจะถูกฉีดเข้าไปในพรอมป์ระบบ ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการทำต่อที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการฉีดบูตสแตรปของเวิร์กสเปซซ้ำ เพื่อลดขนาดพรอมป์ การรัน Heartbeat และการลองใหม่หลัง Compaction จะยังสร้างบริบทใหม่
- `"never"`: ปิดใช้งานการฉีดบูตสแตรปของเวิร์กสเปซและไฟล์บริบทในทุกเทิร์น ใช้เฉพาะกับ Agent ที่ควบคุมวงจรชีวิตของพรอมป์เองทั้งหมด (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการฉีดด้วย

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

ควบคุมข้อความเตือนที่ Agent มองเห็นเมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความเตือนเข้าไปในพรอมป์ระบบ
- `"once"`: ฉีดคำเตือนหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดคำเตือนในทุกการรันเมื่อมีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่ความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมป์/บริบทปริมาณสูงหลายชุด และถูก
แยกตามระบบย่อยโดยตั้งใจ แทนที่จะให้ทั้งหมดไหลผ่านปุ่มควบคุมทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีดบูตสแตรปเวิร์กสเปซปกติ
- `agents.defaults.startupContext.*`:
  พรีลูดการรันโมเดลตอนรีเซ็ต/เริ่มต้นแบบครั้งเดียว รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะ
  ยืนยันการรีเซ็ตโดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบกะทัดรัดที่ฉีดเข้าไปในพรอมป์ระบบ
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอนรันไทม์แบบมีขอบเขตและบล็อกที่เจ้าของรันไทม์ฉีดเข้าไป
- `memory.qmd.limits.*`:
  ขนาดสแนิปเพ็ตการค้นหาหน่วยความจำที่ทำดัชนีและการฉีด

ใช้การแทนที่ต่อ Agent ที่ตรงกันเฉพาะเมื่อ Agent หนึ่งต้องใช้งบประมาณต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมพรีลูดเริ่มต้นในเทิร์นแรกที่ฉีดในการรันโมเดลตอนรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะยืนยันการรีเซ็ตโดยไม่เรียกใช้
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

- `memoryGetMaxChars`: เพดานข้อความตัดตอน `memory_get` ค่าเริ่มต้นก่อนเพิ่ม
  เมทาดาทาการตัดทอนและประกาศการทำต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัด `memory_get` ค่าเริ่มต้นเมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่เก็บถาวรและ
  การกู้คืนเมื่อเกินขีดจำกัด
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการฉีด
  การรีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อ Agent สำหรับปุ่มควบคุม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละไว้จะสืบทอด
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

การแทนที่ต่อ Agent สำหรับงบประมาณพรอมป์ Skills

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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของภาพในบล็อกภาพของทรานสคริปต์/เครื่องมือก่อนการเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้โทเคนวิชันและขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพได้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมป์ระบบ (ไม่ใช่ timestamp ของข้อความ) ถอยกลับไปใช้เขตเวลาของโฮสต์

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
        fallback: "pi", // pi | none
      },
      pdfMaxBytesMb: 10,
      pdfMaxPages: 20,
      thinkingDefault: "low",
      verboseDefault: "off",
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
  - รูปแบบอ็อบเจ็กต์ตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับสำหรับกรณีเปลี่ยนเส้นทางเมื่อใช้งานไม่ได้
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ใช้เป็นการกำหนดเส้นทางสำรองด้วยเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - ควรใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบรองรับ ID เปล่าสำหรับความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้ซึ่งรองรับรูปภาพอย่างไม่ซ้ำใน `models.providers.*.models` OpenClaw จะเติม provider ให้รายการนั้น รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้า provider ที่ชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพแบบใช้ร่วมกันและพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตนของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกันและเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกันและเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มีการยืนยันตัวตนรองรับได้ โดยจะลอง provider ค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider สร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ ID ของ provider
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่าการยืนยันตัวตน/API key ของ provider ที่ตรงกันด้วย
  - provider สร้างวิดีโอ Qwen ที่รวมมาให้รองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะถอยกลับไปใช้ `imageModel` แล้วจึงใช้โมเดลเซสชัน/ค่าเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ในเวลาที่เรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"stream"` ค่า `agents.list[].reasoningDefault` ราย agent จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้น reasoning ที่กำหนดค่าไว้จะถูกนำไปใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ระดับผู้ดูแลระบบของ operator เมื่อไม่มีการตั้งค่า override reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย API key หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองการจับคู่ provider ที่กำหนดค่าไว้ซึ่งไม่ซ้ำสำหรับ ID โมเดลนั้นโดยตรง และหลังจากนั้นเท่านั้นจึงถอยกลับไปใช้ provider ค่าเริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หาก provider นั้นไม่ได้เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปใช้ provider/model รายการแรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของ provider ที่ถูกลบไปแล้วซึ่งล้าสมัย
- `models`: แคตตาล็อกโมเดลที่กำหนดค่าไว้และ allowlist สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณส่ง `--replace`
  - โฟลว์ configure/onboarding ตามขอบเขต provider จะผสานโมเดล provider ที่เลือกลงในแมปนี้และคง provider อื่นที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้ว
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้โดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการฉีด `context_management` หรือ `params.responsesCompactThreshold` เพื่อ override threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider เริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการผสาน `params` (การกำหนดค่า): `agents.defaults.params` (ฐานส่วนกลาง) ถูกแทนที่ด้วย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (ID agent ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ผสานเข้าไปใน body คำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น extra body จะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟจะยังลบ `store` เฉพาะ OpenAI ออกหลังจากนั้น
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้าไปใน body คำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` เมื่อปิด thinking แล้ว Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ ค่า `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีความสำคัญสุดท้าย สำหรับการควบคุม thinking ของ vLLM Qwen ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการ reasoning effort รายโมเดลที่เข้ากันได้กับ OpenAI ใส่ `"xhigh"` สำหรับ endpoint กำหนดเองที่รับค่านี้ได้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบความถูกต้องของแพตช์เซสชัน การตรวจสอบความถูกต้องของ agent CLI และการตรวจสอบความถูกต้องของ `llm-task` สำหรับ provider/model ที่กำหนดค่านั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะ provider สำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกเปิดใช้งานเฉพาะ Z.AI สำหรับ thinking ที่ถูกเก็บรักษาไว้ เมื่อเปิดใช้และ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [Z.AI thinking and preserved thinking](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์ agent ระดับต่ำเริ่มต้น ID ที่ละไว้จะมีค่าเริ่มต้นเป็น OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ PI harness ในตัว, `id: "auto"` เพื่อให้ Plugin harness ที่ลงทะเบียนไว้อ้างสิทธิ์โมเดลที่รองรับ, ID harness ที่ลงทะเบียนไว้ เช่น `id: "codex"` หรือ alias แบ็กเอนด์ CLI ที่รองรับ เช่น `id: "claude-cli"` ตั้งค่า `fallback: "none"` เพื่อปิดใช้งานการถอยกลับไป PI โดยอัตโนมัติ รันไทม์ Plugin แบบชัดเจน เช่น `codex` จะปิดแบบล้มเหลวโดยค่าเริ่มต้น เว้นแต่คุณตั้งค่า `fallback: "pi"` ในขอบเขต override เดียวกัน เก็บการอ้างอิงโมเดลให้เป็นรูปแบบมาตรฐาน `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และแบ็กเอนด์การดำเนินการอื่นผ่านการกำหนดค่ารันไทม์แทนคำนำหน้า provider ของรันไทม์แบบเก่า ดู [Agent runtimes](/th/concepts/agent-runtimes) เพื่อทำความเข้าใจว่าสิ่งนี้ต่างจากการเลือก provider/model อย่างไร
- ตัวเขียนการกำหนดค่าที่เปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบอ็อบเจ็กต์มาตรฐานและคงรายการ fallback ที่มีอยู่ไว้เมื่อทำได้
- `maxConcurrent`: จำนวนการรัน agent พร้อมกันสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบเรียงลำดับ) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุม executor ระดับต่ำที่จะรัน turn ของ agent การปรับใช้ส่วนใหญ่ควรคงรันไทม์ OpenClaw Pi เริ่มต้นไว้ ใช้เมื่อ Plugin ที่เชื่อถือได้มี harness แบบเนทีฟ เช่น harness app-server Codex ที่รวมมาให้ หรือเมื่อคุณต้องการแบ็กเอนด์ CLI ที่รองรับ เช่น Claude CLI สำหรับกรอบความเข้าใจ ดู [Agent runtimes](/th/concepts/agent-runtimes)

```json5
{
  agents: {
    defaults: {
      model: "openai/gpt-5.5",
      agentRuntime: {
        id: "codex",
        fallback: "none",
      },
    },
  },
}
```

- `id`: `"auto"`, `"pi"`, ID harness ของ Plugin ที่ลงทะเบียนไว้ หรือ alias แบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้ลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้มีแบ็กเอนด์ CLI `claude-cli`
- `fallback`: `"pi"` หรือ `"none"` ใน `id: "auto"` ค่า fallback ที่ละไว้จะมีค่าเริ่มต้นเป็น `"pi"` เพื่อให้การกำหนดค่าเก่ายังคงใช้ PI ได้เมื่อไม่มี Plugin harness อ้างสิทธิ์การรัน ในโหมดรันไทม์ Plugin แบบชัดเจน เช่น `id: "codex"` ค่า fallback ที่ละไว้จะมีค่าเริ่มต้นเป็น `"none"` เพื่อให้ harness ที่ขาดหายไปล้มเหลวแทนการใช้ PI แบบเงียบๆ การ override รันไทม์ไม่สืบทอด fallback จากขอบเขตที่กว้างกว่า ให้ตั้งค่า `fallback: "pi"` ควบคู่กับรันไทม์แบบชัดเจนเมื่อคุณตั้งใจต้องการ fallback เพื่อความเข้ากันได้นั้น ความล้มเหลวของ Plugin harness ที่เลือกจะแสดงโดยตรงเสมอ
- การ override ด้วย environment: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` จะแทนที่ `id`; `OPENCLAW_AGENT_HARNESS_FALLBACK=pi|none` จะแทนที่ fallback สำหรับโปรเซสนั้น
- สำหรับการปรับใช้เฉพาะ Codex ให้ตั้งค่า `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"` คุณอาจตั้งค่า `agentRuntime.fallback: "none"` อย่างชัดเจนเพื่อให้อ่านง่ายด้วยก็ได้ ซึ่งเป็นค่าเริ่มต้นสำหรับรันไทม์ Plugin แบบชัดเจน
- สำหรับการปรับใช้ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดลแบบเก่า `claude-cli/claude-opus-4-7` ยังคงทำงานเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรคงการเลือก provider/model ให้เป็นมาตรฐานและใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์รุ่นเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- ตัวเลือก harness จะถูกตรึงตาม ID เซสชันหลังจากการรันแบบฝังครั้งแรก การเปลี่ยนแปลงการกำหนดค่า/env จะมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ตแล้ว ไม่ใช่ transcript ที่มีอยู่ เซสชันเก่าที่มีประวัติ transcript แต่ไม่มี pin ที่บันทึกไว้จะถือว่าถูกตรึงเป็น PI `/status` จะรายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการ turn ของ agent แบบข้อความเท่านั้น การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตัวเอง

**ชอร์ตแฮนด์ alias ในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| ชื่อแทน             | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

ชื่อแทนที่คุณกำหนดค่าจะมีลำดับความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมดคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้ `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดไว้อย่างชัดเจน

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

- แบ็กเอนด์ CLI ให้ความสำคัญกับข้อความก่อนเสมอ เครื่องมือจะถูกปิดใช้เสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งต่อรูปภาพเมื่อ `imageArg` รับพาธไฟล์

### `agents.defaults.systemPromptOverride`

แทนที่พรอมป์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์จะมีลำดับความสำคัญเหนือกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

เลเยอร์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการซึ่งใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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
- ค่าเดิม `plugins.entries.openai.config.personality` ยังถูกอ่านเมื่อไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งเป็น `0m` เพื่อปิดใช้
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมป์ระบบ และข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของเอเจนต์ Heartbeat ก่อนจะถูกยกเลิก ปล่อยว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและส่งออก `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบา และเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม: งานของซับเอเจนต์หรือคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดก็ตามกำหนด `heartbeat` ไว้ **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat จะรันเทิร์นเอเจนต์เต็มรูปแบบ — ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

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
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะถอยกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction ครั้งเดียวก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายของทรานสคริปต์ล่าสุดแบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อกำหนดไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นจุดตรวจสอบแบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำการเก็บรักษาตัวระบุแบบทึบในตัวไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความแบบกำหนดเองเพิ่มเติมสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตผิดรูปสำหรับสรุปแบบ safeguard เปิดใช้เป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันของลูปเครื่องมือ Pi เพิ่มเติม เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังจากผนวกผลลัพธ์เครื่องมือและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืนพรีเช็กเดิมซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้ทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md เพิ่มเติมที่จะฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้การฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าเป็นคู่ค่าเริ่มต้นนั้นอย่างชัดเจน หัวข้อเดิม `Every Session`/`Safety` จะยังถูกรับเป็นทางเลือกสำรองสำหรับความเข้ากันได้ย้อนหลัง
- `model`: การแทนที่ `provider/model-id` เพิ่มเติมสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่งต่อไป แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์เพิ่มเติม (`number` หรือสตริงอย่าง `"20mb"`) ที่ทริกเกอร์ Compaction ภายในเครื่องแบบปกติก่อนการรันเมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์ถัดไปที่เล็กกว่าได้ ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งประกาศสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสมบูรณ์ (เช่น "กำลังบีบอัดบริบท..." และ "Compaction เสร็จสมบูรณ์") ปิดใช้เป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นเอเจนต์แบบเงียบก่อน Compaction อัตโนมัติเพื่อจัดเก็บความทรงจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่ตรงเป๊ะ เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การแทนที่นี้จะไม่สืบทอดเชนสำรองของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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
- `ttl` ควบคุมว่าการตัดแต่งจะรันอีกครั้งได้บ่อยแค่ไหน (หลังการแตะแคชครั้งล่าสุด)
- การตัดแต่งจะ soft-trim ผลลัพธ์เครื่องมือที่ใหญ่เกินไปก่อน จากนั้นจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดแต่ง/ล้าง
- อัตราส่วนอิงตามตัวอักษร (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แม่นยำ
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

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การแทนที่ค่าระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และรูปแบบรายบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การแทนที่ค่ารายเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรมและการแบ่งชิ้นส่วนได้ที่ [Streaming](/th/concepts/streaming)

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
- การแทนที่ค่ารายเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำแซนด์บ็อกซ์แบบไม่บังคับสำหรับเอเจนต์แบบฝัง ดูคำแนะนำฉบับเต็มที่ [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

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

**การตั้งค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบพาธสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซรายขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อไปยัง OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวในขณะรัน
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบายคีย์โฮสต์ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีลำดับความสำคัญเหนือ `identityFile`
- `certificateData` มีลำดับความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีลำดับความสำคัญเหนือ `knownHostsFile`
- ค่า `*Data` ที่ใช้ SecretRef จะถูกแปลงจากสแนปช็อตรันไทม์ของความลับที่ใช้งานอยู่ก่อนเริ่มเซสชันแซนด์บ็อกซ์

**พฤติกรรมแบ็กเอนด์ SSH:**

- เติมข้อมูลเริ่มต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นให้เวิร์กสเปซ SSH ระยะไกลเป็นแหล่งอ้างอิงหลัก
- ส่ง `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับไปยังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์รายขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เมานต์เวิร์กสเปซเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์และเวิร์กสเปซรายเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์และหนึ่งเวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
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

- `mirror`: เติมข้อมูลระยะไกลจากภายในเครื่องก่อน exec, ซิงค์กลับหลัง exec; เวิร์กสเปซภายในเครื่องยังเป็นแหล่งอ้างอิงหลัก
- `remote`: เติมข้อมูลระยะไกลหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ จากนั้นให้เวิร์กสเปซระยะไกลเป็นแหล่งอ้างอิงหลัก

ในโหมด `remote` การแก้ไขภายในเครื่องของโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้าแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนการเติมข้อมูล
การขนส่งคือ SSH เข้าไปในแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตของแซนด์บ็อกซ์และการซิงค์แบบมิเรอร์ที่เลือกใช้ได้

**`setupCommand`** ทำงานหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมีการออกเครือข่าย, รูทที่เขียนได้, และผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งค่าเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม โดยจะรวม binds ระดับโกลบอลและรายเอเจนต์เข้าด้วยกัน

**เบราว์เซอร์แซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกแทรกเข้าไปในพรอมป์ระบบ ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC สำหรับผู้สังเกตการณ์ใช้การยืนยันตัวตน VNC โดยค่าเริ่มต้น และ OpenClaw จะออก URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันแซนด์บ็อกซ์ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งค่าเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อบริดจ์โกลบอลอย่างชัดเจน
- `cdpSourceRange` จำกัดการรับเข้า CDP ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์เท่านั้น เมื่อตั้งค่าไว้ (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
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
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu` ถูก
    เปิดใช้โดยค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ส่วนขยายอีกครั้งหากเวิร์กโฟลว์ของคุณ
    ต้องพึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งค่า `0` เพื่อใช้ขีดจำกัดกระบวนการ
    เริ่มต้นของ Chromium
  - เพิ่ม `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้เฉพาะ Docker เท่านั้น

สร้างอิมเมจ:

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

### `agents.list` (การแทนที่ค่ารายเอเจนต์)

ใช้ `agents.list[].tts` เพื่อใหเอเจนต์มีผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์, หรือโหมด auto-TTS ของตัวเอง บล็อกเอเจนต์จะ deep-merge ทับค่าโกลบอล
`messages.tts` ดังนั้นข้อมูลรับรองที่ใช้ร่วมกันจึงอยู่ในที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ การแทนที่ค่าของเอเจนต์ที่ใช้งานอยู่
จะมีผลกับการตอบกลับเสียงพูดอัตโนมัติ, `/tts audio`, `/tts status`, และ
เครื่องมือเอเจนต์ `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญได้ที่ [Text-to-speech](/th/tools/tts#per-agent-voice-overrides)

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
        agentRuntime: { id: "auto", fallback: "pi" },
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

- `id`: ID Agent ที่คงที่ (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะมีผล (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกใน list จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงตั้งค่า primary ต่อ Agent แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้ Agent นั้นใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมเข้มงวดชัดเจน Cron jobs ที่ override เฉพาะ `primary` ยังคงสืบทอด default fallbacks เว้นแต่คุณตั้งค่า `fallbacks: []`
- `params`: พารามิเตอร์ stream ต่อ Agent ที่ merge ทับรายการ model ที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะ Agent เช่น `cacheRetention`, `temperature`, หรือ `maxTokens` โดยไม่ต้องทำซ้ำ catalog model ทั้งหมด
- `tts`: override text-to-speech ต่อ Agent แบบไม่บังคับ block นี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บ credentials ของ provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เจาะจง persona เช่น provider, voice, model, style หรือ auto mode ที่นี่
- `skills`: allowlist skill ต่อ Agent แบบไม่บังคับ หากละไว้ Agent จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้ รายการที่ระบุชัดเจนจะแทนที่ defaults แทนที่จะ merge และ `[]` หมายถึงไม่มี skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อ Agent แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) Override `agents.defaults.thinkingDefault` สำหรับ Agent นี้เมื่อไม่มี override ต่อข้อความหรือ session โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดใช้ได้ สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อ Agent แบบไม่บังคับ (`on | off | stream`) Override `agents.defaults.reasoningDefault` สำหรับ Agent นี้เมื่อไม่มี override reasoning ต่อข้อความหรือ session
- `fastModeDefault`: ค่าเริ่มต้นต่อ Agent แบบไม่บังคับสำหรับ fast mode (`true | false`) ใช้เมื่อไม่มี override fast-mode ต่อข้อความหรือ session
- `agentRuntime`: override นโยบาย runtime ระดับต่ำต่อ Agent แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้ Agent หนึ่งเป็น Codex-only ขณะที่ Agent อื่นยังคง fallback เป็น PI เริ่มต้นในโหมด `auto`
- `runtime`: descriptor ของ runtime ต่อ Agent แบบไม่บังคับ ใช้ `type: "acp"` พร้อม defaults ของ `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อ Agent ควรมีค่าเริ่มต้นเป็น sessions ของ ACP harness
- `identity.avatar`: path สัมพัทธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` ได้รับ defaults: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ Agent ids สำหรับเป้าหมาย `sessions_spawn.agentId` แบบชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: Agent เดียวกันเท่านั้น) ใส่ requester id เมื่อควรอนุญาตการเรียก `agentId` ที่ชี้มาที่ตัวเอง
- ตัวป้องกันการสืบทอด Sandbox: หาก requester session อยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันโดยไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การ routing แบบ Multi-agent

รัน Agent แยกหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

### ฟิลด์ match ของ Binding

- `type` (ไม่บังคับ): `route` สำหรับ routing ปกติ (type ที่ขาดไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบ persistent
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะ channel)
- `acp` (ไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับ match แบบ deterministic:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันพอดี ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้ง channel)
6. Agent เริ่มต้น

ภายในแต่ละ tier รายการ `bindings` แรกที่ match จะมีผล

สำหรับรายการ `type: "acp"`, OpenClaw จะ resolve โดยใช้ identity การสนทนาที่ตรงกันพอดี (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับ tier ของ route binding ข้างต้น

### โปรไฟล์การเข้าถึงต่อ Agent

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

ดู [Multi-Agent Sandbox & Tools](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดลำดับความสำคัญ

---

## Session

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
    parentForkMaxTokens: 100000, // skip parent-thread fork above this token count (0 disables)
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

<Accordion title="Session field details">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละคนจะได้เซสชันแยกภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อจงใจให้มีบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม ID ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความหลายผู้ใช้)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป ID แบบ canonical ไปยัง peer ที่มีคำนำหน้าผู้ให้บริการสำหรับการใช้เซสชันร่วมกันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยัง peer ช่องทางอื่นที่ลิงก์ไว้ ดู [การ dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตตามเวลาท้องถิ่นที่ `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดทั้งสองค่าไว้ ค่าใดหมดอายุก่อนจะมีผลก่อน ความสดใหม่ของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนจากเบื้องหลัง/เหตุการณ์ระบบ เช่น heartbeat, cron wakeups, การแจ้งเตือน exec และการทำบัญชีของ gateway สามารถอัปเดต `updatedAt` ได้ แต่ไม่ได้ทำให้เซสชันแบบรายวัน/ไม่ได้ใช้งานยังสดใหม่อยู่
- **`resetByType`**: การแทนที่ตามประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบ legacy เป็น alias ของ `direct`
- **`parentForkMaxTokens`**: ค่า `totalTokens` สูงสุดของเซสชันแม่ที่อนุญาตเมื่อสร้างเซสชันเธรดแบบ fork (ค่าเริ่มต้น `100000`)
  - ถ้า `totalTokens` ของเซสชันแม่สูงกว่าค่านี้ OpenClaw จะเริ่มเซสชันเธรดใหม่แทนการสืบทอดประวัติ transcript จากเซสชันแม่
  - ตั้งเป็น `0` เพื่อปิด guard นี้และอนุญาตให้ fork จากเซสชันแม่เสมอ
- **`mainKey`**: ฟิลด์แบบ legacy ขณะรันไทม์จะใช้ `"main"` สำหรับบัคเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ถึงเอเจนต์ (จำนวนเต็ม ช่วง: `0`–`5`) `0` ปิดการเชื่อมต่อแบบ ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` พร้อม alias แบบ legacy `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธแรกมีผลก่อน
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงคำเตือนเท่านั้น; `enforce` ใช้การล้างจริง
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) รันไทม์เขียนการล้างแบบเป็นชุดพร้อมบัฟเฟอร์ high-water เล็กน้อยสำหรับเพดานขนาด production; `openclaw sessions cleanup --enforce` ใช้เพดานทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจาก config รุ่นเก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษา archive transcript แบบ `*.reset.<timestamp>` ค่าเริ่มต้นคือ `pruneAfter`; ตั้งเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบเลือกได้ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบเลือกได้หลังการล้างตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรม เป็นชั่วโมง (`0` ปิด; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: ค่าเริ่มต้นอายุสูงสุดแบบตายตัว เป็นชั่วโมง (`0` ปิด; ผู้ให้บริการสามารถแทนที่ได้)

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

การแทนที่รายช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

การ resolve (ค่าที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุด cascade `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย              | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น      | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม   | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ       | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน   | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อ identity ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่สนใจตัวพิมพ์ใหญ่เล็ก `{think}` เป็น alias ของ `{thinkingLevel}`

### รีแอ็กชัน Ack

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นใช้ `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- การแทนที่รายช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการ resolve: บัญชี → ช่องทาง → `messages.ackReaction` → fallback จาก identity
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบ ack หลังการตอบกลับบนช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้รีแอ็กชันสถานะ lifecycle บน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะเปิดใช้รีแอ็กชันสถานะเมื่อรีแอ็กชัน ack ทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้รีแอ็กชันสถานะ lifecycle

### Inbound debounce

รวมข้อความแบบข้อความล้วนที่ส่งถี่จากผู้ส่งคนเดียวกันให้เป็น agent turn เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้ามการ debounce

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ prefs ภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้)
- คีย์ API fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS ID ผู้ให้บริการแบบ legacy `edge` รองรับเป็น alias ของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint ของ OpenAI TTS ลำดับการ resolve คือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดผู้ให้บริการ Talk หลายตัว
- คีย์ Talk แบบแบน legacy (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้นและจะถูกย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- ID เสียง fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริง plaintext หรือออบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดคีย์ API ของ Talk
- `providers.*.voiceAliases` ให้ directive ของ Talk ใช้ชื่อที่อ่านง่ายได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ตัวช่วย MLX ภายในเครื่องของ macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่ path ของตัวช่วยสำหรับการพัฒนา
- `speechLocale` ตั้งค่า ID locale แบบ BCP 47 ที่ระบบรู้จำเสียงพูดของ Talk บน iOS/macOS ใช้ เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมด Talk รอหลังจากผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่าไว้ จะคงช่วงหยุดเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
