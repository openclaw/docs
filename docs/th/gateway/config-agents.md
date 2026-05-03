---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกแบบหลายเอเจนต์
    - การปรับลักษณะการทำงานของเซสชัน การนำส่งข้อความ และโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่าการสนทนา
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-03T10:10:57Z"
    model: gpt-5.5
    provider: openai
    source_hash: b25371c34b9f8b0cacce021879e43e6a65b86d626dc87d5bfa05dcae80ac32e4
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ Gateway runtime และคีย์ระดับบนสุดอื่นๆ
ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากของที่เก็บโค้ดแบบไม่บังคับที่แสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาอัตโนมัติโดยไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist เริ่มต้นแบบไม่บังคับสำหรับ Skills ของเอเจนต์ที่ไม่ได้ตั้งค่า
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

- ละ `agents.defaults.skills` เพื่อให้ใช้ Skills ได้ไม่จำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น และ
  จะไม่รวมกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์ bootstrap ของ workspace โดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์ workspace แบบไม่บังคับที่เลือกไว้ ขณะที่ยังคงเขียนไฟล์ bootstrap ที่จำเป็น ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

- `"continuation-skip"`: เทิร์นการดำเนินต่อที่ปลอดภัย (หลังจากคำตอบของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการแทรก bootstrap ของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction จะยังคงสร้าง context ใหม่
- `"never"`: ปิดใช้งาน bootstrap ของ workspace และการแทรกไฟล์ context ในทุกเทิร์น ใช้ค่านี้เฉพาะกับเอเจนต์ที่จัดการวงจรชีวิต prompt ของตนเองทั้งหมด (เอนจิน context แบบกำหนดเอง runtime แบบเนทีฟที่สร้าง context เอง หรือ workflow เฉพาะที่ไม่ใช้ bootstrap) เทิร์น Heartbeat และเทิร์นกู้คืนหลัง Compaction จะข้ามการแทรกด้วย

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

ควบคุมข้อความเตือนที่เอเจนต์มองเห็นเมื่อ bootstrap context ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่แทรกข้อความเตือนเข้าไปใน system prompt
- `"once"`: แทรกคำเตือนหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: แทรกคำเตือนทุกครั้งที่รันเมื่อมีการตัดทอน

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนที่เจ้าของงบประมาณ Context

OpenClaw มีงบประมาณ prompt/context ปริมาณมากหลายส่วน และจงใจ
แยกตามระบบย่อยแทนที่จะให้ทั้งหมดไหลผ่าน knob ทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การแทรก bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude แบบครั้งเดียวสำหรับการรันโมเดลตอน reset/startup รวมถึงไฟล์รายวันล่าสุด
  `memory/*.md` คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการตอบรับ
  โดยไม่เรียกใช้โมเดล
- `skills.limits.*`:
  รายการ Skills แบบย่อที่แทรกเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  ข้อความตัดตอน runtime ที่มีขอบเขตและบล็อกที่ runtime เป็นเจ้าของซึ่งถูกแทรก
- `memory.qmd.limits.*`:
  การกำหนดขนาด snippet และการแทรกสำหรับการค้นหา memory ที่ทำดัชนีไว้

ใช้ override ระดับเอเจนต์ที่ตรงกันเฉพาะเมื่อเอเจนต์หนึ่งต้องการ
งบประมาณที่แตกต่าง:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ในเทิร์นแรกที่แทรกในการรันโมเดลตอน reset/startup
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการ reset โดยไม่เรียกใช้
โมเดล จึงไม่โหลด prelude นี้

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

ค่าเริ่มต้นที่ใช้ร่วมกันสำหรับพื้นผิว context ของ runtime ที่มีขอบเขต

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

- `memoryGetMaxChars`: เพดานเริ่มต้นของข้อความตัดตอน `memory_get` ก่อนเพิ่ม
  metadata การตัดทอนและประกาศการดำเนินต่อ
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อไม่ได้ระบุ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบ live ที่ใช้กับผลลัพธ์ที่เก็บถาวรและ
  การกู้คืนเมื่อมี overflow
- `postCompactionMaxChars`: เพดานข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการแทรก
  refresh หลัง Compaction

#### `agents.list[].contextLimits`

override ระดับเอเจนต์สำหรับ knob `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานส่วนกลางสำหรับรายการ Skills แบบย่อที่แทรกเข้าไปใน system prompt ค่านี้
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

override ระดับเอเจนต์สำหรับงบประมาณ prompt ของ Skills

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
ค่าที่สูงกว่าจะคงรายละเอียดภาพไว้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับ context ของ system prompt (ไม่ใช่ timestamp ของข้อความ) หากไม่มีจะ fallback ไปใช้เขตเวลาของ host

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
      agentRuntime: {
        id: "pi", // pi | auto | registered harness id, e.g. codex
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
  - รูปแบบสตริงจะตั้งค่าเฉพาะโมเดลหลัก
  - รูปแบบอ็อบเจ็กต์จะตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับเมื่อเกิดการล้มเหลว
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือก/ค่าเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - แนะนำให้ใช้การอ้างอิง `provider/model` อย่างชัดเจน ยอมรับรหัสแบบไม่มีคำนำหน้าเพื่อความเข้ากันได้ หากรหัสแบบไม่มีคำนำหน้าตรงกับรายการที่รองรับรูปภาพซึ่งกำหนดค่าไว้ใน `models.providers.*.models` ได้เพียงรายการเดียว OpenClaw จะเติมผู้ให้บริการนั้นให้ครบถ้วน รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้าผู้ให้บริการอย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างรูปภาพร่วมกันและพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบเนทีฟ, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP ที่มีพื้นหลังโปร่งใส
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างเพลงร่วมกันและเครื่องมือ `music_generate` ในตัว
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถการสร้างวิดีโอร่วมกันและเครื่องมือ `video_generate` ในตัว
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการค่าเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับรหัสผู้ให้บริการ
  - หากคุณเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - ผู้ให้บริการสร้างวิดีโอ Qwen ที่รวมมาให้รองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะถอยกลับไปใช้ `imageModel` จากนั้นถอยกลับไปยังโมเดลเซสชัน/ค่าเริ่มต้นที่แก้ไขได้แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่พิจารณาโดยโหมดสำรองการแยกข้อมูลในเครื่องมือ `pdf`
- `verboseDefault`: ระดับรายละเอียดเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `reasoningDefault`: การมองเห็นเหตุผลเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` รายเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้นของเหตุผลที่กำหนดค่าไว้จะถูกใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่มีการตั้งค่าทับเหตุผลรายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วยคีย์ API หรือ `openai-codex/gpt-5.5` สำหรับ Codex OAuth) หากคุณละผู้ให้บริการ OpenClaw จะลองนามแฝงก่อน จากนั้นจึงลองการจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับรหัสโมเดลที่ตรงกันนั้น และหลังจากนั้นจึงถอยกลับไปยังผู้ให้บริการค่าเริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` อย่างชัดเจน) หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลค่าเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะถอยกลับไปยังผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกนำออกแล้วซึ่งล้าสมัย
- `models`: แค็ตตาล็อกโมเดลและรายการอนุญาตที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการอนุญาตที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์การกำหนดค่า/การเริ่มใช้งานที่มีขอบเขตตามผู้ให้บริการจะผสานโมเดลผู้ให้บริการที่เลือกเข้าไปในแมปนี้ และคงผู้ให้บริการที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง การ Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการแทรก `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่เกณฑ์ ดู [การ Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ผู้ให้บริการค่าเริ่มต้นแบบโกลบอลที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการผสาน `params` (การกำหนดค่า): `agents.defaults.params` (ฐานโกลบอล) จะถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (รหัสเอเจนต์ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดที่ [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON ส่งผ่านขั้นสูงที่ผสานเข้าไปในบอดีคำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น บอดีส่วนเพิ่มจะชนะ เส้นทาง completions ที่ไม่ใช่เนทีฟยังคงลบ `store` ที่เป็นเฉพาะ OpenAI ออกภายหลัง
- `params.chat_template_kwargs`: อาร์กิวเมนต์เทมเพลตแชตที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้าไปในบอดีคำขอระดับบนสุด `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` เมื่อปิดการคิด Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีลำดับความสำคัญสุดท้าย สำหรับตัวควบคุมการคิดของ vLLM Qwen ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.supportedReasoningEfforts`: รายการระดับความพยายามด้านเหตุผลที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับปลายทางแบบกำหนดเองที่ยอมรับจริงๆ จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชัน Gateway การตรวจสอบแพตช์เซสชัน การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่านั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: การเลือกใช้เฉพาะ Z.AI สำหรับการคงการคิดไว้ เมื่อเปิดใช้งานและเปิดการคิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู [การคิดของ Z.AI และการคงการคิดไว้](/th/providers/zai#thinking-and-preserved-thinking)
- `agentRuntime`: นโยบายรันไทม์เอเจนต์ระดับต่ำเริ่มต้น รหัสที่ละไว้จะตั้งค่าเริ่มต้นเป็น OpenClaw Pi ใช้ `id: "pi"` เพื่อบังคับใช้ฮาร์เนส PI ในตัว, `id: "auto"` เพื่อให้ฮาร์เนส Plugin ที่ลงทะเบียนไว้รับโมเดลที่รองรับและใช้ PI เมื่อไม่มีรายการใดตรงกัน, รหัสฮาร์เนสที่ลงทะเบียนไว้ เช่น `id: "codex"` เพื่อบังคับใช้ฮาร์เนสนั้น หรือชื่อแทนแบ็กเอนด์ CLI ที่รองรับ เช่น `id: "claude-cli"` รันไทม์ Plugin ที่ระบุชัดเจนจะล้มเหลวแบบปิดเมื่อฮาร์เนสไม่พร้อมใช้งานหรือล้มเหลว คงการอ้างอิงโมเดลให้เป็นรูปแบบมาตรฐาน `provider/model`; เลือก Codex, Claude CLI, Gemini CLI และแบ็กเอนด์การดำเนินการอื่นๆ ผ่านการกำหนดค่ารันไทม์แทนคำนำหน้าผู้ให้บริการรันไทม์แบบเก่า ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes) สำหรับความแตกต่างจากการเลือกผู้ให้บริการ/โมเดล
- ตัวเขียนการกำหนดค่าที่ปรับเปลี่ยนฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบ fallback) จะบันทึกรูปแบบอ็อบเจ็กต์มาตรฐาน และคงรายการ fallback ที่มีอยู่ไว้เมื่อเป็นไปได้
- `maxConcurrent`: จำนวนรันเอเจนต์แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงถูกทำแบบอนุกรม) ค่าเริ่มต้น: 4

### `agents.defaults.agentRuntime`

`agentRuntime` ควบคุมตัวดำเนินการระดับต่ำที่จะรันรอบของเอเจนต์ การใช้งานส่วนใหญ่ควรคงรันไทม์ OpenClaw Pi ค่าเริ่มต้นไว้ ใช้เมื่อ Plugin ที่เชื่อถือได้มีฮาร์เนสเนทีฟ เช่น ฮาร์เนสเซิร์ฟเวอร์แอป Codex ที่รวมมาให้ หรือเมื่อคุณต้องการแบ็กเอนด์ CLI ที่รองรับ เช่น Claude CLI สำหรับโมเดลทางความคิด ดู [รันไทม์เอเจนต์](/th/concepts/agent-runtimes)

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

- `id`: `"auto"`, `"pi"`, รหัสฮาร์เนส Plugin ที่ลงทะเบียนไว้ หรือชื่อแทนแบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้ลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้มีแบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` อนุญาตให้ฮาร์เนส Plugin ที่ลงทะเบียนไว้รับรอบที่รองรับ และใช้ PI เมื่อไม่มีฮาร์เนสที่ตรงกัน รันไทม์ Plugin ที่ระบุชัดเจน เช่น `id: "codex"` จะต้องมีฮาร์เนสนั้น และจะล้มเหลวแบบปิดหากไม่พร้อมใช้งานหรือล้มเหลว
- การแทนที่จากสภาพแวดล้อม: `OPENCLAW_AGENT_RUNTIME=<id|auto|pi>` แทนที่ `id` สำหรับโปรเซสนั้น
- สำหรับการปรับใช้เฉพาะ Codex ให้ตั้งค่า `model: "openai/gpt-5.5"` และ `agentRuntime.id: "codex"`
- สำหรับการปรับใช้ Claude CLI แนะนำให้ใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` การอ้างอิงโมเดลแบบเก่า `claude-cli/claude-opus-4-7` ยังคงทำงานเพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรคงการเลือกผู้ให้บริการ/โมเดลให้เป็นมาตรฐาน และใส่แบ็กเอนด์การดำเนินการไว้ใน `agentRuntime.id`
- คีย์นโยบายรันไทม์แบบเก่าจะถูกเขียนใหม่เป็น `agentRuntime` โดย `openclaw doctor --fix`
- การเลือกฮาร์เนสจะถูกตรึงตามรหัสเซสชันหลังจากการรันแบบฝังตัวครั้งแรก การเปลี่ยนแปลงการกำหนดค่า/สภาพแวดล้อมมีผลกับเซสชันใหม่หรือเซสชันที่รีเซ็ต ไม่ใช่ทรานสคริปต์ที่มีอยู่ เซสชันเก่าที่มีประวัติทรานสคริปต์แต่ไม่มีพินที่บันทึกไว้จะถือว่าถูกตรึงกับ PI `/status` รายงานรันไทม์ที่มีผล เช่น `Runtime: OpenClaw Pi Default` หรือ `Runtime: OpenAI Codex`
- สิ่งนี้ควบคุมเฉพาะการดำเนินการรอบเอเจนต์แบบข้อความเท่านั้น การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตน

**ชอร์ตแฮนด์นามแฝงในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง            | โมเดล                                      |
| ------------------- | ------------------------------------------ |
| `opus`              | `anthropic/claude-opus-4-6`                |
| `sonnet`            | `anthropic/claude-sonnet-4-6`              |
| `gpt`               | `openai/gpt-5.5` or `openai-codex/gpt-5.5` |
| `gpt-mini`          | `openai/gpt-5.4-mini`                      |
| `gpt-nano`          | `openai/gpt-5.4-nano`                      |
| `gemini`            | `google/gemini-3.1-pro-preview`            |
| `gemini-flash`      | `google/gemini-3-flash-preview`            |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite-preview`     |

นามแฝงที่คุณกำหนดค่าไว้จะชนะค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้โหมด thinking โดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตนเอง
โมเดล Z.AI เปิดใช้ `tool_stream` ตามค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
โมเดล Anthropic Claude 4.6 ใช้ thinking แบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับ thinking อย่างชัดเจน

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

- แบ็กเอนด์ CLI เน้นข้อความเป็นหลัก เครื่องมือจะถูกปิดใช้อยู่เสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์ได้

### `agents.defaults.systemPromptOverride`

แทนที่พรอมต์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือแยกตามตัวแทน (`agents.list[].systemPromptOverride`) ค่ารายตัวแทนมีลำดับความสำคัญเหนือกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมต์แบบควบคุม

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

โอเวอร์เลย์พรอมต์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งนำไปใช้ตามตระกูลโมเดล รหัสโมเดลในตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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
- ระบบยังอ่าน `plugins.entries.openai.config.personality` แบบเดิมเมื่อไม่ได้ตั้งค่าการตั้งค่าร่วมนี้

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
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมต์ระบบและข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับเทิร์นของตัวแทน Heartbeat ก่อนถูกยกเลิก หากไม่ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและส่งออก `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true Heartbeat แต่ละครั้งจะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเคนต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเคน
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อมีเลนที่ยุ่งเพิ่มเติม ได้แก่ งาน subagent หรือคำสั่งแบบซ้อน เลน Cron จะเลื่อน Heartbeat ออกไปเสมอ แม้ไม่มีแฟล็กนี้
- รายตัวแทน: ตั้งค่า `agents.list[].heartbeat` เมื่อมีตัวแทนใดก็ตามกำหนด `heartbeat` **เฉพาะตัวแทนเหล่านั้น** เท่านั้นที่จะรัน Heartbeat
- Heartbeat รันเทิร์นตัวแทนเต็มรูปแบบ ช่วงเวลาที่สั้นลงจะใช้โทเคนมากขึ้น

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
- `provider`: รหัสของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่าแล้ว จะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัดของ Pi สำหรับเก็บส่วนท้ายทรานสคริปต์ล่าสุดแบบคงคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นเช็กพอยต์แบบแข็ง
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุแบบทึบแสงไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบแบบลองใหม่เมื่อเอาต์พุตมีรูปแบบไม่ถูกต้องสำหรับสรุปแบบ safeguard เปิดใช้ตามค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดของลูปเครื่องมือ Pi แบบไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดของบริบทหลังจากผนวกผลลัพธ์เครื่องมือแล้วและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป ระบบจะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมต์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำเพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบไม่บังคับที่จะฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าอย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อ `Every Session`/`Safety` รุ่นเก่าก็ยังถูกรับเป็นทางเลือกสำรองเพื่อความเข้ากันได้
- `model`: การแทนที่ `provider/model-id` แบบไม่บังคับสำหรับการสรุป Compaction เท่านั้น ใช้เมื่อต้องการให้เซสชันหลักคงใช้โมเดลหนึ่ง แต่ให้สรุป Compaction รันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์จำนวนไบต์แบบไม่บังคับ (`number` หรือสตริงเช่น `"20mb"`) ที่จะทริกเกอร์ Compaction ภายในเครื่องแบบปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์ตัวถัดไปที่เล็กกว่าได้ ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งการแจ้งเตือนสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้ตามค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์น agentic แบบเงียบก่อน auto-compaction เพื่อเก็บความทรงจำที่คงทน ตั้งค่า `model` เป็น provider/model ที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดลภายในเครื่อง การแทนที่นี้ไม่สืบทอดเชน fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อเวิร์กสเปซเป็นแบบอ่านอย่างเดียว

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
- `ttl` ควบคุมความถี่ที่การตัดจะรันซ้ำได้ (หลังจากการแตะแคชครั้งล่าสุด)
- การตัดจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าเมื่อจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้าย และแทรก `...` ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วยข้อความ placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัด/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเคนที่แน่นอน
- หากมีข้อความ assistant น้อยกว่า `keepLastAssistants` ระบบจะข้ามการตัด

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
- การแทนที่ตามช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และรูปแบบแยกตามบัญชี) Signal/Slack/Discord/Google Chat ใช้ค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหน่วงแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800–2500ms การแทนที่รายตัวแทน: `agents.list[].humanDelay`

ดู [การสตรีม](/th/concepts/streaming) สำหรับรายละเอียดพฤติกรรม + การแบ่งชิ้น

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

การทำแซนด์บ็อกซ์แบบไม่บังคับสำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มที่ [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

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

**การกำหนดค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซต่อขอบเขต
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวขณะรัน
- `strictHostKeyChecking` / `updateHostKeys`: ปุ่มปรับนโยบายคีย์โฮสต์ของ OpenSSH

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` ชนะ `identityFile`
- `certificateData` ชนะ `certificateFile`
- `knownHostsData` ชนะ `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูกแก้ค่าจากสแนปช็อตรันไทม์ความลับที่ใช้งานอยู่ก่อนเซสชันแซนด์บ็อกซ์เริ่มต้น

**พฤติกรรมแบ็กเอนด์ SSH:**

- เติมข้อมูลเริ่มต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นคงให้เวิร์กสเปซ SSH ระยะไกลเป็นแหล่งอ้างอิงหลัก
- ส่งเส้นทาง `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับไปยังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซแซนด์บ็อกซ์ต่อขอบเขตภายใต้ `~/.openclaw/sandboxes`
- `ro`: เวิร์กสเปซแซนด์บ็อกซ์ที่ `/workspace`, เมานต์เวิร์กสเปซของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์ + เวิร์กสเปซต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + เวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
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

- `mirror`: เติมข้อมูลเริ่มต้นไปยังระยะไกลจากภายในเครื่องก่อน exec, ซิงค์กลับหลัง exec; เวิร์กสเปซภายในเครื่องยังคงเป็นแหล่งอ้างอิงหลัก
- `remote`: เติมข้อมูลเริ่มต้นไปยังระยะไกลหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ จากนั้นคงให้เวิร์กสเปซระยะไกลเป็นแหล่งอ้างอิงหลัก

ในโหมด `remote` การแก้ไขภายในเครื่องของโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้าไปในแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนการเติมข้อมูลเริ่มต้น
การขนส่งคือ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตแซนด์บ็อกซ์และการซิงค์มิเรอร์แบบไม่บังคับ

**`setupCommand`** ทำงานหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมีทางออกเครือข่าย, รูทที่เขียนได้, ผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (ทางเลือกฉุกเฉิน)

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม; การผูกระดับสากลและต่อเอเจนต์จะถูกรวมเข้าด้วยกัน

**เบราว์เซอร์แบบแซนด์บ็อกซ์** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกแทรกเข้าไปในพรอมต์ระบบ ไม่ต้องมี `browser.enabled` ใน `openclaw.json`
การเข้าถึงผู้สังเกตการณ์ noVNC ใช้การยืนยันตัวตน VNC โดยค่าเริ่มต้น และ OpenClaw จะปล่อย URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชันแบบแซนด์บ็อกซ์ไม่ให้กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อบริดจ์ระดับสากลอย่างชัดเจน
- `cdpSourceRange` จำกัดทางเข้า CDP ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้แบบไม่บังคับ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเข้าไปในคอนเทนเนอร์เบราว์เซอร์แซนด์บ็อกซ์เท่านั้น เมื่อกำหนดค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
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
  - `--disable-extensions` (เปิดใช้งานโดยค่าเริ่มต้น)
  - `--disable-3d-apis`, `--disable-software-rasterizer` และ `--disable-gpu` จะ
    เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดใช้งานได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องใช้
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้งานส่วนขยายอีกครั้ง หากเวิร์กโฟลว์ของคุณ
    ขึ้นอยู่กับส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` สามารถเปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้ง `0` เพื่อใช้ขีดจำกัดกระบวนการ
    เริ่มต้นของ Chromium
  - บวก `--no-sandbox` เมื่อเปิดใช้งาน `noSandbox`
  - ค่าเริ่มต้นเป็นบรรทัดฐานของอิมเมจคอนเทนเนอร์; ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    จุดเริ่มต้นแบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` รองรับเฉพาะ Docker เท่านั้น

สร้างอิมเมจ (จากเช็กเอาต์ซอร์ส):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm โดยไม่มีเช็กเอาต์ซอร์ส ดู [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบอินไลน์

### `agents.list` (การแทนที่ต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด auto-TTS ของเอเจนต์เอง บล็อกเอเจนต์จะผสานเชิงลึกทับ
`messages.tts` ระดับสากล เพื่อให้ข้อมูลประจำตัวที่ใช้ร่วมกันอยู่ในที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
แทนที่เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องการ การแทนที่ของเอเจนต์ที่ใช้งานอยู่
ใช้กับการตอบกลับเสียงอัตโนมัติ, `/tts audio`, `/tts status` และ
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

- `id`: id ของ agent ที่เสถียร (จำเป็น)
- `default`: เมื่อตั้งไว้หลายรายการ รายการแรกจะมีผล (บันทึกคำเตือน) หากไม่ได้ตั้งไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงจะตั้ง primary ต่อ agent แบบเข้มงวดโดยไม่มี model fallback; รูปแบบออบเจ็กต์ `{ primary }` ก็เข้มงวดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อเลือกให้ agent นั้นใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อทำให้พฤติกรรมแบบเข้มงวดชัดเจน Cron jobs ที่ override เฉพาะ `primary` จะยังสืบทอด default fallbacks เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อ agent ที่ merge ทับรายการ model ที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะ agent เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำทั้ง model catalog
- `tts`: override text-to-speech ต่อ agent แบบไม่บังคับ บล็อกนี้ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรอง provider ที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่เจาะจง persona เช่น provider, voice, model, style หรือ auto mode ที่นี่
- `skills`: allowlist ของ skill ต่อ agent แบบไม่บังคับ หากละไว้ agent จะสืบทอด `agents.defaults.skills` เมื่อตั้งไว้; ลิสต์ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับ thinking เริ่มต้นต่อ agent แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับ agent นี้เมื่อไม่ได้ตั้ง override ต่อข้อความหรือ session โปรไฟล์ provider/model ที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคง dynamic thinking ที่ provider เป็นเจ้าของไว้ (`thinkingLevel` ถูกละไว้ใน Gemini 3/3.1, `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นต่อ agent แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับ agent นี้เมื่อไม่ได้ตั้ง override reasoning ต่อข้อความหรือ session
- `fastModeDefault`: ค่าเริ่มต้นต่อ agent แบบไม่บังคับสำหรับ fast mode (`true | false`) ใช้เมื่อไม่ได้ตั้ง override fast-mode ต่อข้อความหรือ session
- `agentRuntime`: override นโยบาย runtime ระดับต่ำต่อ agent แบบไม่บังคับ ใช้ `{ id: "codex" }` เพื่อทำให้ agent หนึ่งเป็นแบบ Codex-only ขณะที่ agent อื่นยังคง fallback PI เริ่มต้นในโหมด `auto`
- `runtime`: descriptor ของ runtime ต่อ agent แบบไม่บังคับ ใช้ `type: "acp"` กับค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อ agent ควรใช้ session ของ ACP harness เป็นค่าเริ่มต้น
- `identity.avatar`: path แบบสัมพันธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` สร้างค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ agent ids สำหรับ target `sessions_spawn.agentId` ที่ระบุชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: agent เดียวกันเท่านั้น) รวม requester id เมื่อควรอนุญาตการเรียก `agentId` ที่ target ตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หาก session ของ requester อยู่ใน sandbox, `sessions_spawn` จะปฏิเสธ target ที่จะรันแบบไม่อยู่ใน sandbox
- `subagents.requireAgentId`: เมื่อเป็น true จะบล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)

---

## การกำหนดเส้นทางหลาย agent

รัน agent ที่แยกกันหลายตัวภายใน Gateway เดียว ดู [Multi-Agent](/th/concepts/multi-agent)

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

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่หายไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding ของการสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะ channel)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันแบบ exact, ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ทั้ง channel)
6. agent เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะมีผล

สำหรับรายการ `type: "acp"`, OpenClaw จะแก้ด้วย identity ของการสนทนาแบบ exact (`match.channel` + account + `match.peer.id`) และจะไม่ใช้ลำดับระดับ route binding ข้างต้น

### โปรไฟล์การเข้าถึงต่อ agent

<Accordion title="สิทธิ์เข้าถึงเต็มรูปแบบ (ไม่มี sandbox)">

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

<Accordion title="เครื่องมืออ่านอย่างเดียว + workspace">

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

ดู [แซนด์บ็อกซ์และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools) สำหรับรายละเอียดลำดับความสำคัญ

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
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้เซสชันที่แยกจากกันภายในบริบทช่องทางหนึ่ง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางหนึ่งใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อมีเจตนาให้ใช้บริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่มข้อความส่วนตัว
  - `main`: ข้อความส่วนตัวทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความที่มีผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมปรหัสมาตรฐานกับ peer ที่มีคำนำหน้าผู้ให้บริการ เพื่อแชร์เซสชันข้ามช่องทาง คำสั่ง Dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยัง peer ของช่องทางอื่นที่ลิงก์ไว้ ดู [การ Dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` จะรีเซ็ตที่เวลาในเครื่องตาม `atHour`; `idle` จะรีเซ็ตหลังผ่าน `idleMinutes` เมื่อกำหนดค่าทั้งคู่ ค่าใดหมดอายุก่อนจะมีผลก่อน ความสดของการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดของการรีเซ็ตเมื่อไม่ได้ใช้งานใช้ `lastInteractionAt` การเขียนจากเหตุการณ์พื้นหลัง/ระบบ เช่น Heartbeat, การปลุก Cron, การแจ้งเตือน exec และการทำบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันแบบรายวัน/ไม่ได้ใช้งานคงความสดไว้
- **`resetByType`**: การแทนที่ตามประเภท (`direct`, `group`, `thread`) ค่าเดิม `dm` ยอมรับเป็นนามแฝงของ `direct`
- **`mainKey`**: ฟิลด์เดิม รันไทม์จะใช้ `"main"` สำหรับบัคเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับไปมาสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยนแบบเอเจนต์ถึงเอเจนต์ (จำนวนเต็ม, ช่วง: `0`–`5`) `0` ปิดการต่อเนื่องของการตอบกลับไปมา
- **`sendPolicy`**: จับคู่ด้วย `channel`, `chatType` (`direct|group|channel`, โดยมี `dm` เดิมเป็นนามแฝง), `keyPrefix` หรือ `rawKeyPrefix` กฎปฏิเสธแรกจะมีผล
- **`maintenance`**: การล้างข้อมูลที่เก็บเซสชันและการควบคุมการเก็บรักษา
  - `mode`: `warn` ส่งคำเตือนเท่านั้น; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่เก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) รันไทม์จะเขียนการล้างข้อมูลแบบแบตช์พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` จะลบออกจากคอนฟิกเก่า
  - `resetArchiveRetention`: ระยะเวลาเก็บรักษาอาร์ไคฟ์ทรานสคริปต์ `*.reset.<timestamp>` ค่าเริ่มต้นคือ `pruneAfter`; ตั้งเป็น `false` เพื่อปิดใช้งาน
  - `maxDiskBytes`: งบประมาณดิสก์ของไดเรกทอรีเซสชันแบบไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายแบบไม่บังคับหลังการล้างข้อมูลตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์หลักค่าเริ่มต้น (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับการเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: ค่าเริ่มต้นสำหรับอายุสูงสุดแบบบังคับ หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: ประตูค่าเริ่มต้นสำหรับการสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการ spawn เธรด ACP ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้งานการผูกเธรด; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟค่าเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

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

การแทนที่ต่อช่อง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`.

การตัดสินค่า (ค่าที่เจาะจงที่สุดชนะ): บัญชี → ช่อง → ส่วนกลาง `""` ปิดใช้งานและหยุดการไล่ลำดับต่อ `"auto"` สร้างจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย            | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม    | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ       | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน    | `high`, `low`, `off`        |
| `{identity.name}` | ชื่อข้อมูลประจำตัวของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่แยกตัวพิมพ์ใหญ่เล็ก `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### รีแอ็กชันรับทราบ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นใช้ `"👀"` ตั้งเป็น `""` เพื่อปิดใช้งาน
- การแทนที่ต่อช่อง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการตัดสินค่า: บัญชี → ช่อง → `messages.ackReaction` → ค่าสำรองจากข้อมูลประจำตัว
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: ลบการรับทราบหลังตอบกลับบนช่องที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ BlueBubbles
- `messages.statusReactions.enabled`: เปิดใช้รีแอ็กชันสถานะวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ได้ตั้งค่าไว้ จะคงรีแอ็กชันสถานะให้เปิดใช้งานเมื่อรีแอ็กชันรับทราบเปิดใช้งานอยู่
  บน Telegram ให้ตั้งค่านี้เป็น `true` อย่างชัดเจนเพื่อเปิดใช้รีแอ็กชันสถานะวงจรชีวิต

### การหน่วงรวมข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่เข้ามาอย่างรวดเร็วจากผู้ส่งเดียวกันเป็นเทิร์นเอเจนต์เดียว สื่อ/ไฟล์แนบจะส่งผ่านทันที คำสั่งควบคุมจะข้ามการหน่วงรวมข้อความ

### TTS (การแปลงข้อความเป็นเสียงพูด)

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

- `auto` ควบคุมโหมด auto-TTS ค่าเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (ต้องเลือกเปิดใช้)
- คีย์ API สำรองไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่มาพร้อมระบบเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละตัวที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รองรับรหัสผู้ให้บริการเดิม `edge` เป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการตัดสินค่าคือการกำหนดค่า จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

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
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการพูดคุยหลายราย
- คีย์พูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น และจะย้ายอัตโนมัติไปยัง `talk.providers.<provider>`
- รหัสเสียงสำรองไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รับสตริงข้อความล้วนหรือออบเจ็กต์ SecretRef
- ค่าสำรอง `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับพูดคุย
- `providers.*.voiceAliases` ช่วยให้คำสั่งพูดคุยใช้ชื่อที่จำง่ายได้
- `providers.mlx.modelId` เลือกรีโป Hugging Face ที่ใช้โดยตัวช่วย MLX ภายในเครื่องบน macOS หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่มาพร้อมระบบเมื่อมีอยู่ หรือไฟล์ปฏิบัติการบน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่พาธตัวช่วยสำหรับการพัฒนา
- `speechLocale` ตั้งค่ารหัสโลแคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของโหมดพูดคุยบน iOS/macOS ปล่อยว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดพูดคุยรอหลังผู้ใช้เงียบ ก่อนส่งข้อความถอดเสียง หากไม่ตั้งค่าไว้ จะคงช่วงหยุดชั่วคราวค่าเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์การกำหนดค่าอื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
