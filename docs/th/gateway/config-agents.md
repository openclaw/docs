---
read_when:
    - การปรับค่าเริ่มต้นของเอเจนต์ (โมเดล, การคิด, พื้นที่ทำงาน, Heartbeat, สื่อ, Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับเซสชัน การส่งข้อความ และพฤติกรรมโหมดพูดคุย
summary: ค่าเริ่มต้นของเอเจนต์, การกำหนดเส้นทางแบบหลายเอเจนต์, เซสชัน, ข้อความ และการกำหนดค่าการสนทนา
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-05-12T23:30:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08ddc1b36f4b9408ebaa5f071693b1c1333cedc9b00f75df93f12e73081e1033
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าระดับ Agent ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ของ Gateway และคีย์ระดับบนสุดอื่นๆ
ดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของ Agent

### `agents.defaults.workspace`

ค่าเริ่มต้น: `~/.openclaw/workspace`

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

### `agents.defaults.repoRoot`

รากของที่เก็บแบบไม่บังคับที่แสดงในบรรทัด Runtime ของ system prompt หากไม่ได้ตั้งค่า OpenClaw จะตรวจจับโดยอัตโนมัติด้วยการไล่ขึ้นจาก workspace

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

allowlist Skills เริ่มต้นแบบไม่บังคับสำหรับ agent ที่ไม่ได้ตั้งค่า
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

- ละ `agents.defaults.skills` เพื่อให้ใช้ skills ได้ไม่จำกัดโดยค่าเริ่มต้น
- ละ `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ให้มี skills
- รายการ `agents.list[].skills` ที่ไม่ว่างเปล่าคือชุดสุดท้ายสำหรับ agent นั้น และ
  จะไม่รวมกับค่าเริ่มต้น

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

ควบคุมเวลาที่ไฟล์ bootstrap ของ workspace ถูกฉีดเข้าไปใน system prompt ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการต่อเนื่องที่ปลอดภัย (หลังจากคำตอบของ assistant เสร็จสมบูรณ์) จะข้ามการฉีด bootstrap ของ workspace ซ้ำ เพื่อลดขนาด prompt การรัน Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งาน bootstrap ของ workspace และการฉีดไฟล์บริบทในทุกเทิร์น ใช้ค่านี้เฉพาะกับ agent ที่ควบคุมวงจรชีวิต prompt ของตนเองอย่างสมบูรณ์ (เอนจินบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทของตนเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ต้องใช้ bootstrap) เทิร์น Heartbeat และเทิร์นกู้คืนหลัง Compaction ก็จะข้ามการฉีดด้วย

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

จำนวนอักขระรวมสูงสุดที่ฉีดจากไฟล์ bootstrap ของ workspace ทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

### `agents.defaults.bootstrapPromptTruncationWarning`

ควบคุมประกาศใน system prompt ที่ agent มองเห็นเมื่อบริบท bootstrap ถูกตัดทอน
ค่าเริ่มต้น: `"once"`

- `"off"`: ไม่ฉีดข้อความแจ้งการตัดทอนเข้าไปใน system prompt
- `"once"`: ฉีดประกาศแบบกระชับหนึ่งครั้งต่อ signature การตัดทอนที่ไม่ซ้ำกัน (แนะนำ)
- `"always"`: ฉีดประกาศแบบกระชับในทุกการรันเมื่อมีการตัดทอน

จำนวน raw/ที่ฉีดโดยละเอียดและฟิลด์ปรับแต่งการกำหนดค่าจะอยู่ใน diagnostics เช่น
รายงานบริบท/สถานะและล็อก ส่วนบริบทผู้ใช้/รันไทม์ของ WebChat ตามปกติจะได้รับเฉพาะ
ประกาศกู้คืนแบบกระชับเท่านั้น

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "once" } }, // off | once | always
}
```

### แผนผังเจ้าของงบบริบท

OpenClaw มีงบ prompt/บริบทปริมาณสูงหลายส่วน และตั้งใจแยกตามระบบย่อย
แทนที่จะให้ทั้งหมดไหลผ่านปุ่มปรับทั่วไปเพียงตัวเดียว

- `agents.defaults.bootstrapMaxChars` /
  `agents.defaults.bootstrapTotalMaxChars`:
  การฉีด bootstrap ของ workspace ตามปกติ
- `agents.defaults.startupContext.*`:
  prelude สำหรับการรันโมเดลแบบ one-shot เมื่อ reset/startup รวมถึงไฟล์
  `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการตอบรับ
  โดยไม่เรียกโมเดล
- `skills.limits.*`:
  รายการ skills แบบย่อที่ฉีดเข้าไปใน system prompt
- `agents.defaults.contextLimits.*`:
  excerpt ของรันไทม์ที่มีขอบเขตและบล็อกที่ฉีดซึ่งรันไทม์เป็นเจ้าของ
- `memory.qmd.limits.*`:
  snippet ค้นหาหน่วยความจำแบบจัดทำดัชนีและขนาดการฉีด

ใช้ override ราย agent ที่ตรงกันเฉพาะเมื่อ agent หนึ่งต้องใช้งบที่แตกต่างออกไป:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุม startup prelude ของเทิร์นแรกที่ฉีดในการรันโมเดลแบบ reset/startup
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการ reset โดยไม่เรียกโมเดล
ดังนั้นจึงไม่โหลด prelude นี้

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

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทรันไทม์ที่มีขอบเขต

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
  metadata การตัดทอนและประกาศการต่อเนื่อง
- `memoryGetDefaultLines`: หน้าต่างบรรทัดเริ่มต้นของ `memory_get` เมื่อ
  ละ `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือแบบสดที่ใช้สำหรับผลลัพธ์ที่บันทึกถาวรและ
  การกู้คืน overflow
- `postCompactionMaxChars`: เพดาน excerpt ของ AGENTS.md ที่ใช้ระหว่างการฉีด
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

override ราย agent สำหรับ knob `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
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

เพดานทั่วโลกสำหรับรายการ skills แบบย่อที่ฉีดเข้าไปใน system prompt ค่านี้
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

override ราย agent สำหรับงบ skills prompt

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

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของ transcript/tool ก่อนเรียก provider
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้ vision-token และขนาด payload ของคำขอสำหรับการรันที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะรักษารายละเอียดภาพได้มากขึ้น

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบท system prompt (ไม่ใช่ timestamp ของข้อความ) fallback ไปที่เขตเวลาของ host

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
  - รูปแบบสตริงตั้งค่าเฉพาะโมเดลหลักเท่านั้น
  - รูปแบบอ็อบเจ็กต์ตั้งค่าโมเดลหลักพร้อมโมเดล failover ตามลำดับ
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลวิชัน
  - ใช้เป็นการกำหนดเส้นทางสำรองด้วยเมื่อโมเดลที่เลือก/โมเดลเริ่มต้นรับอินพุตรูปภาพไม่ได้
  - ควรใช้ ref `provider/model` แบบชัดเจน ID เปล่าจะยังรับได้เพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้และรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติม provider นั้นให้ ID ดังกล่าว รายการที่กำหนดค่าไว้ซึ่งตรงกันแบบกำกวมต้องใช้คำนำหน้า provider แบบชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างรูปภาพแบบใช้ร่วมกัน และพื้นผิวเครื่องมือ/Plugin ในอนาคตที่สร้างรูปภาพ
  - ค่าทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพ Gemini แบบ native, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต OpenAI PNG/WebP พื้นหลังโปร่งใส
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth ของ provider ที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider การสร้างรูปภาพที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างเพลงแบบใช้ร่วมกัน และเครื่องมือในตัว `music_generate`
  - ค่าทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider การสร้างเพลงที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth/API key ของ provider ที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถสร้างวิดีโอแบบใช้ร่วมกัน และเครื่องมือในตัว `video_generate`
  - ค่าทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของ provider ที่มี auth รองรับได้ โดยจะลอง provider เริ่มต้นปัจจุบันก่อน จากนั้นจึงลอง provider การสร้างวิดีโอที่ลงทะเบียนไว้ที่เหลือตามลำดับ provider-id
  - หากคุณเลือก provider/model โดยตรง ให้กำหนดค่า auth/API key ของ provider ที่ตรงกันด้วย
  - provider การสร้างวิดีโอ Qwen ที่รวมมารองรับวิดีโอเอาต์พุตได้สูงสุด 1 รายการ, รูปภาพอินพุต 1 รายการ, วิดีโออินพุต 4 รายการ, ระยะเวลา 10 วินาที และตัวเลือกระดับ provider ได้แก่ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะ fallback ไปที่ `imageModel` แล้วจึงไปที่โมเดลเซสชัน/โมเดลเริ่มต้นที่ resolve แล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ตอนเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมด fallback ของการแยกข้อมูลในเครื่องมือ `pdf` พิจารณา
- `verboseDefault`: ระดับ verbose เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือแบบ progress-draft ค่า: `"explain"` (ค่าเริ่มต้น, ป้ายกำกับสำหรับมนุษย์แบบกระชับ) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียด raw เมื่อมี) `agents.list[].toolProgressDetail` ราย agent จะ override ค่าเริ่มต้นนี้
- `reasoningDefault`: การมองเห็น reasoning เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ราย agent จะ override ค่าเริ่มต้นนี้ ค่าเริ่มต้นของ reasoning ที่กำหนดค่าไว้จะถูกใช้เฉพาะสำหรับ owner, sender ที่ได้รับอนุญาต หรือบริบท operator-admin ของ Gateway เมื่อไม่มีการตั้งค่า override reasoning รายข้อความหรือรายเซสชัน
- `elevatedDefault`: ระดับเอาต์พุต elevated เริ่มต้นสำหรับ agent ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.5` สำหรับการเข้าถึงด้วย OpenAI API-key หรือ Codex OAuth) หากคุณละ provider ไว้ OpenClaw จะลอง alias ก่อน จากนั้นจึงลองรายการที่ตรงกันแบบ configured-provider เดียวสำหรับ model id นั้นแบบตรงตัว แล้วจึง fallback ไปที่ provider เริ่มต้นที่กำหนดค่าไว้ (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หาก provider นั้นไม่เผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะ fallback ไปยัง provider/model แรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของ removed-provider ที่ค้างอยู่
- `models`: แค็ตตาล็อกโมเดลและ allowlist ที่กำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะ provider เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai-codex/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับ provider ที่เลือกโดยไม่ต้องระบุ model id ทุกตัวด้วยตนเอง
  - การแก้ไขที่ปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่จะลบรายการ allowlist ที่มีอยู่ เว้นแต่คุณจะส่ง `--replace`
  - โฟลว์ configure/onboarding ที่ scope ตาม provider จะ merge โมเดลของ provider ที่เลือกเข้าใน map นี้ และคง provider ที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้วไว้
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้อัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการ inject `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อ override threshold ดู [OpenAI server-side compaction](/th/providers/openai#server-side-compaction-responses-api)
- `params`: พารามิเตอร์ provider เริ่มต้นแบบ global ที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญการ merge ของ `params` (config): `agents.defaults.params` (ฐาน global) จะถูก override โดย `agents.defaults.models["provider/model"].params` (รายโมเดล) จากนั้น `agents.list[].params` (agent id ที่ตรงกัน) จะ override ตาม key ดูรายละเอียดใน [Prompt Caching](/th/reference/prompt-caching)
- `params.extra_body`/`params.extraBody`: JSON pass-through ขั้นสูงที่ merge เข้าใน request body ของ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับ key ของ request ที่สร้างขึ้น extra body จะเป็นฝ่ายชนะ เส้นทาง completions ที่ไม่ใช่ native จะยังตัด `store` เฉพาะ OpenAI ออกหลังจากนั้น
- `params.chat_template_kwargs`: อาร์กิวเมนต์ chat-template ที่เข้ากันได้กับ vLLM/OpenAI ซึ่ง merge เข้าใน request body ระดับบนสุดของ `api: "openai-completions"` สำหรับ `vllm/nemotron-3-*` ที่ปิด thinking อยู่ Plugin vLLM ที่รวมมาจะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ `chat_template_kwargs` แบบชัดเจนจะ override ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังมีลำดับความสำคัญสุดท้าย สำหรับการควบคุม thinking ของ vLLM Qwen ให้ตั้งค่า `params.qwenThinkingFormat` เป็น `"chat-template"` หรือ `"top-level"` ในรายการโมเดลนั้น
- `compat.thinkingFormat`: รูปแบบ payload thinking ที่เข้ากันได้กับ OpenAI ใช้ `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดแบบ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บน backend ตระกูล Qwen ที่รองรับ kwargs ของ chat-template ระดับ request เช่น vLLM OpenClaw map thinking ที่ปิดไว้เป็น `false` และ thinking ที่เปิดไว้เป็น `true`
- `compat.supportedReasoningEfforts`: รายการ reasoning effort ที่เข้ากันได้กับ OpenAI รายโมเดล ใส่ `"xhigh"` สำหรับ endpoint แบบกำหนดเองที่รับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง, แถวเซสชันของ Gateway, การตรวจสอบ session patch, การตรวจสอบ agent CLI และการตรวจสอบ `llm-task` สำหรับ provider/model ที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อ backend ต้องการค่าเฉพาะ provider สำหรับระดับ canonical
- `params.preserveThinking`: การ opt-in เฉพาะ Z.AI สำหรับ preserved thinking เมื่อเปิดใช้และ thinking เปิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และ replay `reasoning_content` ก่อนหน้า ดู [Z.AI thinking and preserved thinking](/th/providers/zai#thinking-and-preserved-thinking)
- `localService`: process manager ระดับ provider แบบไม่บังคับสำหรับเซิร์ฟเวอร์โมเดล local/self-hosted เมื่อโมเดลที่เลือกเป็นของ provider นั้น OpenClaw จะ probe `healthUrl` (หรือ `baseUrl + "/models"`), start `command` พร้อม `args` หาก endpoint ใช้งานไม่ได้, รอสูงสุด `readyTimeoutMs` แล้วจึงส่ง request โมเดล `command` ต้องเป็น path แบบ absolute `idleStopMs: 0` จะทำให้ process คงอยู่จนกว่า OpenClaw จะ exit ค่าบวกจะหยุด process ที่ OpenClaw spawn หลังจาก idle เป็นจำนวนมิลลิวินาทีนั้น ดู [Local model services](/th/gateway/local-model-services)
- นโยบาย runtime อยู่บน provider หรือโมเดล ไม่ใช่บน `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎทั้ง provider หรือ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล โมเดล agent ของ OpenAI บน provider OpenAI อย่างเป็นทางการจะเลือก Codex เป็นค่าเริ่มต้น
- config writer ที่ mutate ฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่ง fallback add/remove) จะบันทึกรูปแบบอ็อบเจ็กต์ canonical และคงรายการ fallback ที่มีอยู่ไว้เมื่อทำได้
- `maxConcurrent`: จำนวนการรัน agent แบบขนานสูงสุดข้ามเซสชัน (แต่ละเซสชันยังคงทำงานแบบ serialized) ค่าเริ่มต้น: 4

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

- `id`: `"auto"`, `"pi"`, id ของ harness ของ Plugin ที่ลงทะเบียนไว้ หรือ alias ของ CLI backend ที่รองรับ Plugin Codex ที่รวมมาลงทะเบียน `codex`; Plugin Anthropic ที่รวมมามี CLI backend `claude-cli`
- `id: "auto"` ให้ harness ของ Plugin ที่ลงทะเบียนไว้อ้างสิทธิ์ turn ที่รองรับ และใช้ PI เมื่อไม่มี harness ที่ตรงกัน runtime ของ Plugin แบบชัดเจน เช่น `id: "codex"` ต้องใช้ harness นั้นและ fail closed หากไม่พร้อมใช้งานหรือทำงานล้มเหลว
- key runtime ทั้ง agent เป็น legacy `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, session runtime pins และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นโดยการเลือก runtime รัน `openclaw doctor --fix` เพื่อลบค่าค้างเก่า
- โมเดล agent ของ OpenAI ใช้ harness Codex เป็นค่าเริ่มต้น; `agentRuntime.id: "codex"` ระดับ provider/model ยังคงใช้ได้เมื่อคุณต้องการระบุให้ชัดเจน
- สำหรับ deployment ของ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-7"` พร้อม `agentRuntime.id: "claude-cli"` ที่ scope ตามโมเดล ref โมเดล legacy `claude-cli/claude-opus-4-7` ยังใช้ได้เพื่อความเข้ากันได้ แต่ config ใหม่ควรคงการเลือก provider/model ให้เป็น canonical และใส่ execution backend ไว้ในนโยบาย runtime ระดับ provider/model
- สิ่งนี้ควบคุมเฉพาะการประมวลผล turn ของ agent แบบข้อความเท่านั้น การสร้างสื่อ, วิชัน, PDF, เพลง, วิดีโอ และ TTS ยังคงใช้การตั้งค่า provider/model ของตัวเอง

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

นามแฝงที่คุณกำหนดไว้จะมีผลเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x จะเปิดใช้งานโหมดคิดโดยอัตโนมัติ เว้นแต่คุณจะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` เอง
โมเดล Z.AI เปิดใช้งาน `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
โมเดล Anthropic Claude 4.6 ใช้การคิดแบบ `adaptive` เป็นค่าเริ่มต้นเมื่อไม่ได้ตั้งค่าระดับการคิดอย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI ทางเลือกสำหรับการรันสำรองแบบข้อความเท่านั้น (ไม่มีการเรียกเครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` รับพาธไฟล์ได้
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้แบ็กเอนด์กู้คืนเซสชันที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัยจากส่วนท้ายของทรานสคริปต์ดิบ OpenClaw แบบจำกัดขนาด ก่อนที่จะมีสรุป Compaction แรก การเปลี่ยนโปรไฟล์ยืนยันตัวตนหรือ credential-epoch จะยังไม่ raw-reseed

### `agents.defaults.systemPromptOverride`

แทนที่พรอมป์ระบบทั้งหมดที่ OpenClaw ประกอบขึ้นด้วยสตริงคงที่ ตั้งค่าได้ที่ระดับค่าเริ่มต้น (`agents.defaults.systemPromptOverride`) หรือต่อเอเจนต์ (`agents.list[].systemPromptOverride`) ค่าต่อเอเจนต์มีลำดับความสำคัญสูงกว่า ค่าว่างหรือค่าที่มีแต่ช่องว่างจะถูกละเว้น มีประโยชน์สำหรับการทดลองพรอมป์แบบควบคุม

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

โอเวอร์เลย์พรอมป์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งนำไปใช้ตามตระกูลโมเดล รหัสโมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมร่วมกันข้ามผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตรเท่านั้น

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
- `"off"` ปิดใช้งานเฉพาะเลเยอร์ที่เป็นมิตร สัญญาพฤติกรรม GPT-5 ที่ติดแท็กยังคงเปิดใช้งานอยู่
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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตน OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมป์ระบบและข้ามการฉีด `HEARTBEAT.md` เข้าไปในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการรัน Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตให้เทิร์นของเอเจนต์ Heartbeat ทำงานก่อนถูกยกเลิก เว้นว่างไว้เพื่อใช้ `agents.defaults.timeoutSeconds`
- `directPolicy`: นโยบายการส่งแบบตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและส่งออก `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การรัน Heartbeat จะใช้บริบทบูตสแตรปแบบเบา และคงไว้เฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของพื้นที่ทำงาน
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะรันในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า รูปแบบการแยกเดียวกับ cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จากประมาณ 100K เหลือประมาณ 2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การรัน Heartbeat จะเลื่อนออกไปเมื่อเลนที่ยุ่งเพิ่มเติมของเอเจนต์นั้นกำลังทำงาน ได้แก่ ซับเอเจนต์ตามคีย์เซสชันของตนเองหรืองานคำสั่งแบบซ้อน เลน Cron จะเลื่อน Heartbeat ออกไปเสมอ แม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อมีเอเจนต์ใดกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** จะรัน Heartbeat
- Heartbeat รันเทิร์นเอเจนต์เต็มรูปแบบ — ช่วงเวลาที่สั้นลงใช้โทเค็นมากขึ้น

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
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตให้การดำเนินการ Compaction ครั้งเดียวทำงาน ก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `900`
- `keepRecentTokens`: งบประมาณจุดตัด Pi สำหรับเก็บส่วนท้ายของทรานสคริปต์ล่าสุดแบบคำต่อคำ `/compact` แบบแมนนวลจะเคารพค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบแมนนวลจะเป็นเช็กพอยต์แบบตายตัว
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` `strict` จะเติมคำแนะนำในตัวสำหรับการคงตัวระบุแบบทึบไว้ข้างหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองทางเลือกสำหรับการรักษาตัวระบุ ใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจ retry-on-malformed-output สำหรับสรุปแบบ safeguard เปิดใช้งานเป็นค่าเริ่มต้นในโหมด safeguard ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจแรงกดดัน tool-loop ของ Pi แบบทางเลือก เมื่อ `enabled: true` OpenClaw จะตรวจแรงกดดันของบริบทหลังจากเพิ่มผลลัพธ์เครื่องมือแล้วและก่อนการเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป จะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมป์ และใช้เส้นทางกู้คืน precheck ที่มีอยู่ซ้ำ เพื่อตัดทอนผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานได้กับทั้งโหมด Compaction `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postCompactionSections`: ชื่อส่วน H2/H3 ของ AGENTS.md แบบทางเลือกที่จะฉีดกลับเข้าไปหลัง Compaction ค่าเริ่มต้นคือ `["Session Startup", "Red Lines"]`; ตั้งค่า `[]` เพื่อปิดใช้งานการฉีดกลับ เมื่อไม่ได้ตั้งค่าหรือตั้งค่าอย่างชัดเจนเป็นคู่ค่าเริ่มต้นนั้น หัวข้อ `Every Session`/`Safety` แบบเก่าจะถูกยอมรับเป็น fallback เดิมด้วย
- `model`: การแทนที่ `provider/model-id` ทางเลือกสำหรับการสรุป Compaction เท่านั้น ใช้ค่านี้เมื่อเซสชันหลักควรคงโมเดลหนึ่งไว้ แต่สรุป Compaction ควรรันบนอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `maxActiveTranscriptBytes`: เกณฑ์ไบต์ทางเลือก (`number` หรือสตริงอย่าง `"20mb"`) ที่ทริกเกอร์ Compaction ภายในปกติก่อนการรัน เมื่อ JSONL ที่ใช้งานอยู่โตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนไปยังทรานสคริปต์ถัดไปที่เล็กกว่า ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อเป็น `true` จะส่งการแจ้งสั้น ๆ ให้ผู้ใช้เมื่อ Compaction เริ่มและเมื่อเสร็จสิ้น (เช่น "Compacting context..." และ "Compaction complete") ปิดใช้งานเป็นค่าเริ่มต้นเพื่อให้ Compaction เงียบ
- `memoryFlush`: เทิร์นเอเจนต์แบบเงียบก่อน auto-compaction เพื่อเก็บความจำถาวร ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อเทิร์นดูแลระบบนี้ควรอยู่บนโมเดล local เท่านั้น การแทนที่นี้จะไม่สืบทอดลำดับ fallback ของเซสชันที่ใช้งานอยู่ ข้ามเมื่อพื้นที่ทำงานเป็นแบบอ่านอย่างเดียว

### `agents.defaults.runRetries`

ขอบเขตการวนซ้ำ retry ของลูปรันชั้นนอกสำหรับรันเนอร์ Pi แบบฝัง เพื่อป้องกันลูปการดำเนินการไม่สิ้นสุดระหว่างการกู้คืนจากความล้มเหลว โปรดทราบว่าการตั้งค่านี้ในปัจจุบันใช้กับรันไทม์เอเจนต์แบบฝังเท่านั้น ไม่ใช่รันไทม์ ACP หรือ CLI

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

- `base`: จำนวนพื้นฐานของการวนซ้ำ retry การรันสำหรับลูปรันชั้นนอก ค่าเริ่มต้น: `24`
- `perProfile`: จำนวนการวนซ้ำ retry การรันเพิ่มเติมที่ให้ต่อผู้สมัครโปรไฟล์ fallback ค่าเริ่มต้น: `8`
- `min`: ขีดจำกัดสัมบูรณ์ขั้นต่ำสำหรับการวนซ้ำ retry การรัน ค่าเริ่มต้น: `32`
- `max`: ขีดจำกัดสัมบูรณ์สูงสุดสำหรับการวนซ้ำ retry การรัน เพื่อป้องกันการดำเนินการหลุดควบคุม ค่าเริ่มต้น: `160`

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

- `mode: "cache-ttl"` เปิดใช้รอบการตัดทอน
- `ttl` ควบคุมความถี่ที่การตัดทอนจะรันได้อีกครั้ง (หลังการแตะ cache ล่าสุด)
- การตัดทอนจะ soft-trim ผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินก่อน แล้วจึง hard-clear ผลลัพธ์เครื่องมือที่เก่ากว่าหากจำเป็น

**Soft-trim** เก็บส่วนต้น + ส่วนท้ายไว้ และแทรก `...` ไว้ตรงกลาง

**Hard-clear** แทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วย placeholder

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัดทอน/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวน token ที่แน่นอน
- หากมีข้อความของ assistant น้อยกว่า `keepLastAssistants` จะข้ามการตัดทอน

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

- ช่องทางที่ไม่ใช่ Telegram ต้องตั้งค่า `*.blockStreaming: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก
- การแทนที่ค่าระดับช่องทาง: `channels.<channel>.blockStreamingCoalesce` (และตัวแปรแยกตามบัญชี) Signal/Slack/Discord/Google Chat มีค่าเริ่มต้น `minChars: 1500`
- `humanDelay`: การหยุดพักแบบสุ่มระหว่างการตอบกลับแบบบล็อก `natural` = 800-2500ms การแทนที่ค่าระดับ agent: `agents.list[].humanDelay`

ดูรายละเอียดพฤติกรรม + การแบ่ง chunk ที่ [การสตรีม](/th/concepts/streaming)

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
- การแทนที่ค่าต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

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

- `docker`: รันไทม์ Docker ในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่มี SSH รองรับ
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปที่
`plugins.entries.openshell.config`

**การตั้งค่า backend SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: root ระยะไกลแบบ absolute ที่ใช้สำหรับ workspace แยกตาม scope
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ในเครื่องที่มีอยู่ซึ่งส่งต่อให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหา inline หรือ SecretRefs ที่ OpenClaw แปลงเป็นไฟล์ชั่วคราวในขณะรัน
- `strictHostKeyChecking` / `updateHostKeys`: ตัวปรับนโยบาย host-key ของ OpenSSH

**ลำดับความสำคัญการยืนยันตัวตน SSH:**

- `identityData` มีสิทธิ์เหนือกว่า `identityFile`
- `certificateData` มีสิทธิ์เหนือกว่า `certificateFile`
- `knownHostsData` มีสิทธิ์เหนือกว่า `knownHostsFile`
- ค่า `*Data` ที่รองรับด้วย SecretRef จะถูก resolve จากสแนปช็อตรันไทม์ secrets ที่ใช้งานอยู่ก่อนเริ่มเซสชัน sandbox

**พฤติกรรมของ backend SSH:**

- seed workspace ระยะไกลหนึ่งครั้งหลังสร้างหรือสร้างใหม่
- จากนั้นคงให้ workspace SSH ระยะไกลเป็นแหล่งจริง
- ส่ง `exec`, เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ sync การเปลี่ยนแปลงระยะไกลกลับมายัง host โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ sandbox

**การเข้าถึง workspace:**

- `none`: workspace sandbox แยกตาม scope ใต้ `~/.openclaw/sandboxes`
- `ro`: workspace sandbox ที่ `/workspace`, mount workspace ของ agent แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: mount workspace ของ agent แบบอ่าน/เขียนที่ `/workspace`

**Scope:**

- `session`: คอนเทนเนอร์ + workspace แยกต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์ + workspace ต่อ agent (ค่าเริ่มต้น)
- `shared`: คอนเทนเนอร์และ workspace ที่ใช้ร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

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

- `mirror`: seed ระยะไกลจาก local ก่อน exec, sync กลับหลัง exec; workspace ในเครื่องยังเป็นแหล่งจริง
- `remote`: seed ระยะไกลหนึ่งครั้งเมื่อสร้าง sandbox แล้วคงให้ workspace ระยะไกลเป็นแหล่งจริง

ในโหมด `remote` การแก้ไขบน host-local ที่ทำนอก OpenClaw จะไม่ถูก sync เข้า sandbox โดยอัตโนมัติหลังขั้นตอน seed
การขนส่งคือ SSH เข้าไปยัง sandbox ของ OpenShell แต่ Plugin เป็นเจ้าของวงจรชีวิตของ sandbox และการ sync แบบ mirror ที่เป็นตัวเลือก

**`setupCommand`** รันหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมี network egress, root ที่เขียนได้, ผู้ใช้ root

**ค่าเริ่มต้นของคอนเทนเนอร์คือ `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่าย bridge แบบกำหนดเอง) หาก agent ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก `"container:<id>"` ถูกบล็อกโดยค่าเริ่มต้น เว้นแต่คุณจะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (break-glass)

**ไฟล์แนบขาเข้า** จะถูกจัดวางไว้ใน `media/inbound/*` ใน workspace ที่ใช้งานอยู่

**`docker.binds`** mount ไดเรกทอรี host เพิ่มเติม; binds ระดับ global และต่อ agent จะถูก merge

**เบราว์เซอร์ sandbox** (`sandbox.browser.enabled`): Chromium + CDP ในคอนเทนเนอร์ URL noVNC ถูกฉีดเข้า system prompt ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC observer ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะสร้าง URL token อายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่ใช้ร่วมกัน)

- `allowHostControl: false` (ค่าเริ่มต้น) บล็อกเซสชัน sandbox ไม่ให้เล็งไปที่เบราว์เซอร์ของ host
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่าย bridge เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อคุณต้องการการเชื่อมต่อ bridge ระดับ global อย่างชัดเจน
- `cdpSourceRange` จำกัด ingress ของ CDP ที่ขอบคอนเทนเนอร์เป็นช่วง CIDR ได้ตามต้องการ (เช่น `172.21.0.1/32`)
- `sandbox.browser.binds` mount ไดเรกทอรี host เพิ่มเติมเข้าเฉพาะคอนเทนเนอร์เบราว์เซอร์ sandbox เมื่อตั้งค่า (รวมถึง `[]`) จะใช้แทน `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- ค่าเริ่มต้นการเปิดใช้งานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับ host คอนเทนเนอร์:
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
  - `--disable-3d-apis`, `--disable-software-rasterizer`, และ `--disable-gpu` ถูก
    เปิดใช้ตามค่าเริ่มต้น และสามารถปิดได้ด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D ต้องการ
  - `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` เปิดใช้ extensions อีกครั้ง หาก workflow ของคุณ
    ต้องพึ่งพาสิ่งเหล่านั้น
  - `--renderer-process-limit=2` เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>`; ตั้งเป็น `0` เพื่อใช้ขีดจำกัด process
    ค่าเริ่มต้นของ Chromium
  - รวมถึง `--no-sandbox` เมื่อเปิดใช้ `noSandbox`
  - ค่าเริ่มต้นคือ baseline ของ image คอนเทนเนอร์; ใช้ image เบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเองเพื่อเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์

</Accordion>

การ sandbox เบราว์เซอร์และ `sandbox.docker.binds` ใช้ได้เฉพาะ Docker

สร้าง images (จาก source checkout):

```bash
scripts/sandbox-setup.sh           # main sandbox image
scripts/sandbox-browser-setup.sh   # optional browser image
```

สำหรับการติดตั้ง npm ที่ไม่มี source checkout ดูคำสั่ง `docker build` แบบ inline ที่ [Sandboxing § Images and setup](/th/gateway/sandboxing#images-and-setup)

### `agents.list` (การแทนที่ค่าต่อ agent)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด TTS อัตโนมัติของเอเจนต์เอง บล็อกเอเจนต์จะ deep-merge ทับ
`messages.tts` ระดับโกลบอล ดังนั้นข้อมูลรับรองที่ใช้ร่วมกันจึงอยู่ในที่เดียวได้ ขณะที่เอเจนต์แต่ละตัว
override เฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ override ของเอเจนต์ที่ใช้งานอยู่
จะมีผลกับการตอบกลับแบบพูดโดยอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` ดูตัวอย่างผู้ให้บริการและลำดับความสำคัญได้ที่ [ข้อความเป็นเสียง](/th/tools/tts#per-agent-voice-overrides)

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
- `model`: รูปแบบสตริงจะตั้ง primary แบบเคร่งครัดต่อเอเจนต์โดยไม่มี model fallback; รูปแบบอ็อบเจกต์ `{ primary }` ก็เคร่งครัดเช่นกัน เว้นแต่คุณจะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้เอเจนต์นั้นเลือกใช้ fallback หรือ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเคร่งครัดอย่างชัดเจน งาน Cron ที่ override เฉพาะ `primary` จะยังคงสืบทอด fallback เริ่มต้น เว้นแต่คุณจะตั้ง `fallbacks: []`
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ merge ทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สิ่งนี้สำหรับ override เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแคตตาล็อกโมเดลทั้งหมด
- `tts`: override ข้อความเป็นเสียงต่อเอเจนต์แบบไม่บังคับ บล็อกนี้จะ deep-merge ทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองผู้ให้บริการที่ใช้ร่วมกันและนโยบาย fallback ไว้ใน `messages.tts` และตั้งเฉพาะค่าที่ขึ้นกับบุคลิก เช่น ผู้ให้บริการ เสียง โมเดล สไตล์ หรือโหมดอัตโนมัติไว้ที่นี่
- `skills`: allowlist ของ Skills ต่อเอเจนต์แบบไม่บังคับ หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งค่าไว้; ลิสต์ที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นแทนการ merge และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดเริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`off | minimal | low | medium | high | xhigh | adaptive | max`) override `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้ง override ต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกจะควบคุมว่าค่าใดใช้ได้; สำหรับ Google Gemini, `adaptive` จะคงการคิดแบบไดนามิกที่ผู้ให้บริการเป็นเจ้าของไว้ (`thinkingLevel` จะถูกละไว้บน Gemini 3/3.1, `thinkingBudget: -1` บน Gemini 2.5)
- `reasoningDefault`: การแสดงผล reasoning เริ่มต้นต่อเอเจนต์แบบไม่บังคับ (`on | off | stream`) override `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้ง override reasoning ต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์แบบไม่บังคับสำหรับโหมดเร็ว (`true | false`) ใช้เมื่อไม่ได้ตั้ง override โหมดเร็วต่อข้อความหรือเซสชัน
- `models`: override แคตตาล็อกโมเดล/รันไทม์ต่อเอเจนต์แบบไม่บังคับ โดยใช้ full `provider/model` ids เป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้นรันไทม์ต่อเอเจนต์
- `runtime`: descriptor รันไทม์ต่อเอเจนต์แบบไม่บังคับ ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชัน harness ของ ACP เป็นค่าเริ่มต้น
- `identity.avatar`: พาธที่สัมพันธ์กับ workspace, URL `http(s)` หรือ URI `data:`
- `identity` จะอนุมานค่าเริ่มต้น: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: allowlist ของ id เอเจนต์สำหรับเป้าหมาย `sessions_spawn.agentId` แบบชัดเจน (`["*"]` = ใดก็ได้; ค่าเริ่มต้น: เอเจนต์เดียวกันเท่านั้น) ใส่ id ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่ชี้มายังตัวเอง
- ตัวป้องกันการสืบทอด sandbox: หากเซสชันผู้ร้องขออยู่ใน sandbox, `sessions_spawn` จะปฏิเสธเป้าหมายที่จะรันแบบไม่มี sandbox
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

### ฟิลด์การจับคู่ของ binding

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (type ที่หายไปจะมีค่าเริ่มต้นเป็น route), `acp` สำหรับ binding การสนทนา ACP แบบ persistent
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; ละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะ channel)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันพอดี ไม่มี peer/guild/team)
5. `match.accountId: "*"` (ครอบคลุมทั้ง channel)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะชนะ

สำหรับรายการ `type: "acp"` OpenClaw จะ resolve ด้วยตัวตนการสนทนาที่ตรงกันพอดี (`match.channel` + account + `match.peer.id`) และไม่ใช้ลำดับระดับ route binding ข้างต้น

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

ดูรายละเอียดลำดับความสำคัญได้ที่ [Sandbox และเครื่องมือหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้รับเซสชันที่แยกกันภายในบริบทช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อตั้งใจให้มีบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่ม DM
  - `main`: DM ทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม ID ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องขาเข้าที่มีผู้ใช้หลายคน)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: แมป ID ตามบัญญัติไปยังเพียร์ที่นำหน้าด้วยผู้ให้บริการสำหรับการแชร์เซสชันข้ามช่องทาง คำสั่ง dock เช่น `/dock_discord` ใช้แมปเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ช่องทางที่ลิงก์ไว้อีกรายการหนึ่ง ดู [การ dock ช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` รีเซ็ตที่เวลาโลคัล `atHour`; `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งคู่ รายการที่หมดอายุก่อนจะชนะ ความสดใหม่ของการรีเซ็ตแบบรายวันใช้ `sessionStartedAt` ของแถวเซสชัน; ความสดใหม่ของการรีเซ็ตเมื่อว่างใช้ `lastInteractionAt` การเขียนเบื้องหลัง/เหตุการณ์ระบบ เช่น Heartbeat, การปลุก Cron, การแจ้งเตือน exec และงานบัญชีของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่ไม่ได้ทำให้เซสชันแบบรายวัน/ว่างยังคงสดใหม่
- **`resetByType`**: การแทนที่รายประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมเป็น alias ของ `direct`
- **`mainKey`**: ฟิลด์แบบเดิม Runtime ใช้ `"main"` สำหรับบัคเก็ตแชตตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับไปมาสูงสุดระหว่างเอเจนต์ระหว่างการแลกเปลี่ยน agent-to-agent (จำนวนเต็ม, ช่วง: `0`-`20`, ค่าเริ่มต้น: `5`) `0` ปิดการต่อเชน ping-pong
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel`, พร้อม alias แบบเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธรายการแรกจะชนะ
- **`maintenance`**: การล้าง session-store + การควบคุมการเก็บรักษา
  - `mode`: `warn` แสดงเฉพาะคำเตือน; `enforce` ใช้การล้างข้อมูล
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการเก่า (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการสูงสุดใน `sessions.json` (ค่าเริ่มต้น `500`) Runtime เขียนการล้างข้อมูลแบบแบตช์พร้อมบัฟเฟอร์ high-water ขนาดเล็กสำหรับขีดจำกัดระดับโปรดักชัน; `openclaw sessions cleanup --enforce` ใช้ขีดจำกัดทันที
  - `rotateBytes`: เลิกใช้แล้วและถูกละเว้น; `openclaw doctor --fix` นำออกจาก config รุ่นเก่า
  - `resetArchiveRetention`: การเก็บรักษาอาร์ไคฟ์ transcript `*.reset.<timestamp>` ค่าเริ่มต้นเป็น `pruneAfter`; ตั้งค่าเป็น `false` เพื่อปิด
  - `maxDiskBytes`: งบดิสก์ของไดเรกทอรีเซสชันที่ไม่บังคับ ในโหมด `warn` จะบันทึกคำเตือน; ในโหมด `enforce` จะลบ artifact/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายที่ไม่บังคับหลังการล้างข้อมูลงบ ค่าเริ่มต้นเป็น `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับฟีเจอร์เซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์ค่าเริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้; Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: การยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีกิจกรรมเป็นชั่วโมงตามค่าเริ่มต้น (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบบังคับเป็นชั่วโมงตามค่าเริ่มต้น (`0` ปิดใช้งาน; ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: gate เริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และ ACP thread spawns ค่าเริ่มต้นเป็น `true` เมื่อเปิดใช้งาน thread bindings; ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบท subagent แบบเนทีฟเริ่มต้นสำหรับการ spawn ที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นเป็น `"fork"`

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

การแก้ค่า (รายการที่เจาะจงที่สุดชนะ): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดใช้งานและหยุด cascade `"auto"` ได้มาจาก `[{identity.name}]`.

**ตัวแปรเทมเพลต:**

| ตัวแปร            | คำอธิบาย                | ตัวอย่าง                    |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม    | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ        | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน    | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์ของเอเจนต์ | (เหมือนกับ `"auto"`)        |

ตัวแปรไม่แยกตัวพิมพ์ใหญ่เล็ก `{think}` เป็น alias ของ `{thinkingLevel}`.

### รีแอ็กชันรับทราบ

- ค่าเริ่มต้นเป็น `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ มิฉะนั้นเป็น `"👀"` ตั้งค่า `""` เพื่อปิดใช้งาน
- การแทนที่รายช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`.
- ลำดับการแก้ค่า: บัญชี → ช่องทาง → `messages.ackReaction` → fallback ของอัตลักษณ์
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all`
- `removeAckAfterReply`: นำการรับทราบออกหลังการตอบกลับบนช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้งานรีแอ็กชันสถานะตามวงจรชีวิตบน Slack, Discord และ Telegram
  บน Slack และ Discord หากไม่ตั้งค่าไว้ จะคงการเปิดใช้งานรีแอ็กชันสถานะเมื่อรีแอ็กชันรับทราบทำงานอยู่
  บน Telegram ให้ตั้งค่าเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานรีแอ็กชันสถานะตามวงจรชีวิต

### ดีบาวซ์ขาเข้า

รวมข้อความแบบมีแต่ข้อความที่เข้ามาอย่างรวดเร็วจากผู้ส่งคนเดียวกันให้เป็นเทิร์นเอเจนต์เดียว สื่อ/ไฟล์แนบจะ flush ทันที คำสั่งควบคุมจะข้ามการดีบาวซ์

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

- `auto` ควบคุมโหมด auto-TTS เริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` `/tts on|off` สามารถแทนที่ prefs โลคัลได้ และ `/tts status` แสดงสถานะที่มีผลจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับ auto-summary
- `modelOverrides` เปิดใช้งานเป็นค่าเริ่มต้น; `modelOverrides.allowProvider` มีค่าเริ่มต้นเป็น `false` (เลือกเปิดใช้งาน)
- API keys fallback ไปที่ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาเป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ผู้ให้บริการ TTS แต่ละรายการที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS รองรับ ID ผู้ให้บริการแบบเดิม `edge` เป็น alias ของ `microsoft`
- `providers.openai.baseUrl` แทนที่ endpoint TTS ของ OpenAI ลำดับการแก้ค่าคือ config จากนั้น `OPENAI_TTS_BASE_URL` จากนั้น `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยัง endpoint ที่ไม่ใช่ OpenAI, OpenClaw จะถือว่าเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

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

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการพูดคุยหลายราย
- คีย์พูดคุยแบบแบนเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียน config ที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`
- Voice IDs fallback ไปที่ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID`
- `providers.*.apiKey` รองรับสตริง plaintext หรืออ็อบเจ็กต์ SecretRef
- fallback ของ `ELEVENLABS_API_KEY` ใช้เฉพาะเมื่อไม่ได้กำหนดค่า Talk API key
- `providers.*.voiceAliases` ช่วยให้คำสั่งพูดคุยใช้ชื่อที่เป็นมิตรได้
- `providers.mlx.modelId` เลือก repo Hugging Face ที่ตัวช่วย MLX โลคัลของ macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาเมื่อมีอยู่ หรือ executable บน `PATH`; `OPENCLAW_MLX_TTS_BIN` แทนที่เส้นทางตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการรันเอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก Control UI Talk realtime `openclaw_agent_consult` เว้นว่างไว้เพื่อคงพฤติกรรมเซสชัน/โมเดลปกติ
- `consultFastMode` ตั้งค่าการแทนที่ fast-mode แบบ one-shot สำหรับ consults ของ Control UI Talk realtime โดยไม่เปลี่ยนการตั้งค่า fast-mode ปกติของเซสชัน
- `speechLocale` ตั้งค่า ID โลเคล BCP 47 ที่ใช้โดยการรู้จำเสียงพูดของ iOS/macOS Talk เว้นว่างไว้เพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดพูดคุยรอหลังผู้ใช้เงียบก่อนส่ง transcript หากไม่ตั้งค่าไว้จะคงหน้าต่างหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms บน macOS และ Android, 900 ms บน iOS`)
- `realtime.instructions` ผนวกคำสั่งระบบที่หันไปหาผู้ให้บริการเข้ากับพรอมป์ realtime ในตัวของ OpenClaw เพื่อให้กำหนดค่าสไตล์เสียงได้โดยไม่สูญเสียแนวทาง `openclaw_agent_consult` เริ่มต้น

---

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์ config อื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
