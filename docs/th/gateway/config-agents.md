---
read_when:
    - การปรับค่าเริ่มต้นของเอเจนต์ (โมเดล การคิด พื้นที่ทำงาน Heartbeat สื่อ Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับพฤติกรรมของเซสชัน การส่งข้อความ และโหมดสนทนา
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่าการสนทนา
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-07-16T19:00:39Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 61e6d6b6db806b05f5354a86a4d937a0e16b9f656b22ae4f3185a1674d2ee21a
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ของ Gateway และคีย์ระดับบนสุดอื่นๆ
โปรดดู [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

## ค่าเริ่มต้นของเอเจนต์

### `agents.defaults.workspace`

ค่าเริ่มต้น: `OPENCLAW_WORKSPACE_DIR` เมื่อตั้งค่าไว้ มิฉะนั้นใช้ `~/.openclaw/workspace` (หรือ `~/.openclaw/workspace-<profile>` เมื่อตั้งค่า `OPENCLAW_PROFILE` เป็นโปรไฟล์ที่ไม่ใช่ค่าเริ่มต้น)

```json5
{
  agents: { defaults: { workspace: "~/.openclaw/workspace" } },
}
```

ค่า `agents.defaults.workspace` ที่ระบุอย่างชัดเจนมีลำดับความสำคัญเหนือ
`OPENCLAW_WORKSPACE_DIR` ใช้ตัวแปรสภาพแวดล้อมเพื่อชี้เอเจนต์เริ่มต้น
ไปยังเวิร์กสเปซที่เมานต์ไว้ เมื่อไม่ต้องการเขียนพาธนั้นลงในการกำหนดค่า

### `agents.defaults.repoRoot`

รูทของรีโพซิทอรีที่เลือกกำหนดได้ ซึ่งแสดงในบรรทัด Runtime ของพรอมต์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจากเวิร์กสเปซ

```json5
{
  agents: { defaults: { repoRoot: "~/Projects/openclaw" } },
}
```

### `agents.defaults.skills`

รายการอนุญาต Skills เริ่มต้นที่เลือกกำหนดได้ สำหรับเอเจนต์ที่ไม่ได้ตั้งค่า
`agents.list[].skills`

```json5
{
  agents: {
    defaults: { skills: ["github", "weather"] },
    list: [
      { id: "writer" }, // สืบทอด github, weather
      { id: "docs", skills: ["docs-search"] }, // แทนที่ค่าเริ่มต้น
      { id: "locked-down", skills: [] }, // ไม่มี Skills
    ],
  },
}
```

- ละ `agents.defaults.skills` ไว้เพื่อไม่จำกัด Skills โดยค่าเริ่มต้น
- ละ `agents.list[].skills` ไว้เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น โดย
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์บูตสแตรปของเวิร์กสเปซโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์เวิร์กสเปซเสริมที่เลือกไว้ โดยยังคงเขียนไฟล์บูตสแตรปที่จำเป็น (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมเวลาที่จะแทรกไฟล์บูตสแตรปของเวิร์กสเปซลงในพรอมต์ระบบ ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการดำเนินการต่อที่ปลอดภัย (หลังจากการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการแทรกบูตสแตรปของเวิร์กสเปซซ้ำ ซึ่งช่วยลดขนาดพรอมต์ การทำงานของ Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งานการแทรกบูตสแตรปของเวิร์กสเปซและไฟล์บริบทในทุกเทิร์น ใช้เฉพาะกับเอเจนต์ที่จัดการวงจรชีวิตของพรอมต์เองทั้งหมด (กลไกบริบทแบบกำหนดเอง รันไทม์แบบเนทีฟที่สร้างบริบทเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์นของ Heartbeat และการกู้คืนจาก Compaction จะข้ามการแทรกด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

การแทนที่รายเอเจนต์: `agents.list[].contextInjection` ค่าที่ละไว้จะสืบทอด
`agents.defaults.contextInjection`

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของเวิร์กสเปซก่อนตัดทอน ค่าเริ่มต้น: `20000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

การแทนที่รายเอเจนต์: `agents.list[].bootstrapMaxChars` ค่าที่ละไว้จะสืบทอด
`agents.defaults.bootstrapMaxChars`

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่แทรกจากไฟล์บูตสแตรปของเวิร์กสเปซทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

การแทนที่รายเอเจนต์: `agents.list[].bootstrapTotalMaxChars` ค่าที่ละไว้
จะสืบทอด `agents.defaults.bootstrapTotalMaxChars`

### การแทนที่โปรไฟล์บูตสแตรปรายเอเจนต์

ใช้การแทนที่โปรไฟล์บูตสแตรปรายเอเจนต์ เมื่อเอเจนต์หนึ่งต้องการพฤติกรรมการแทรกพรอมต์
ที่แตกต่างจากค่าเริ่มต้นร่วม ฟิลด์ที่ละไว้จะสืบทอดจาก
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

ควบคุมข้อความแจ้งในพรอมต์ระบบที่เอเจนต์มองเห็น เมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"always"`

- `"off"`: ไม่แทรกข้อความแจ้งการตัดทอนลงในพรอมต์ระบบ
- `"once"`: แทรกข้อความแจ้งแบบกระชับหนึ่งครั้งต่อลายเซ็นการตัดทอนที่ไม่ซ้ำกัน
- `"always"`: แทรกข้อความแจ้งแบบกระชับในการทำงานทุกครั้งเมื่อมีการตัดทอน (แนะนำ)

จำนวนดิบ/จำนวนที่แทรกโดยละเอียดและฟิลด์สำหรับปรับแต่งการกำหนดค่าจะยังอยู่ในการวินิจฉัย เช่น
รายงานบริบท/สถานะและบันทึก ส่วนบริบทผู้ใช้/รันไทม์ของ WebChat ตามปกติจะได้รับ
เฉพาะข้อความแจ้งการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // ปิด | ครั้งเดียว | ทุกครั้ง
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมต์/บริบทปริมาณสูงหลายรายการ และตั้งใจ
แบ่งตามระบบย่อย แทนที่จะให้ทั้งหมดไหลผ่านตัวควบคุมทั่วไป
เพียงตัวเดียว

| งบประมาณ                                                         | ครอบคลุม                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | การแทรกบูตสแตรปของเวิร์กสเปซตามปกติ                                                                                                                            |
| `agents.defaults.startupContext.*`                             | บทนำของการเรียกใช้โมเดลครั้งเดียวเมื่อรีเซ็ต/เริ่มต้น รวมถึงไฟล์ `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล |
| `skills.limits.*`                                              | รายการ Skills แบบกระชับที่แทรกลงในพรอมต์ระบบ                                                                                                         |
| `agents.defaults.contextLimits.*`                              | ส่วนข้อความตัดตอนของรันไทม์แบบจำกัดขอบเขตและบล็อกที่แทรกซึ่งรันไทม์เป็นเจ้าของ                                                                                                      |
| `memory.qmd.limits.*`                                          | การกำหนดขนาดส่วนย่อยของการค้นหาหน่วยความจำแบบมีดัชนีและการแทรก                                                                                                              |

การแทนที่รายเอเจนต์ที่สอดคล้องกัน:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมบทนำการเริ่มต้นของเทิร์นแรกที่แทรกในการเรียกใช้โมเดลเมื่อรีเซ็ต/เริ่มต้น
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
โมเดล จึงไม่โหลดบทนำนี้

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

ค่าเริ่มต้นร่วมสำหรับพื้นผิวบริบทรันไทม์แบบจำกัดขอบเขต

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

- `memoryGetMaxChars`: ขีดจำกัดข้อความตัดตอน `memory_get` เริ่มต้น ก่อนเพิ่มข้อมูลเมตา
  การตัดทอนและข้อความแจ้งการดำเนินการต่อ
- `memoryGetDefaultLines`: ช่วงบรรทัด `memory_get` เริ่มต้น เมื่อละ `lines`
  ไว้
- `toolResultMaxChars`: เพดานขั้นสูงของผลลัพธ์เครื่องมือแบบสด ซึ่งใช้กับผลลัพธ์
  ที่บันทึกถาวรและการกู้คืนจากข้อมูลล้น ปล่อยไว้โดยไม่ตั้งค่าเพื่อใช้ขีดจำกัดอัตโนมัติตามบริบทโมเดล:
  `16000` อักขระเมื่อต่ำกว่า 100K โทเค็น, `32000` อักขระเมื่อมี 100K+ โทเค็น และ `64000`
  อักขระเมื่อมี 200K+ โทเค็น ยอมรับค่าที่ระบุอย่างชัดเจนได้สูงสุด `1000000` สำหรับ
  โมเดลบริบทยาว แต่ขีดจำกัดที่มีผลยังถูกจำกัดไว้ที่ประมาณ 30% ของ
  หน้าต่างบริบทของโมเดล `openclaw doctor --deep` จะแสดงขีดจำกัดที่มีผล
  และ doctor จะเตือนเฉพาะเมื่อการแทนที่ที่ระบุอย่างชัดเจนล้าสมัยหรือไม่มีผล
- `postCompactionMaxChars`: ขีดจำกัดข้อความตัดตอนของ AGENTS.md ที่ใช้ระหว่างการแทรก
  รีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่รายเอเจนต์สำหรับตัวควบคุม `contextLimits` ร่วม ฟิลด์ที่ละไว้จะสืบทอด
จาก `agents.defaults.contextLimits`

```json5
{
  agents: {
    defaults: {
      contextLimits: { memoryGetMaxChars: 12000 },
    },
    list: [
      {
        id: "tiny-local",
        contextLimits: {
          memoryGetMaxChars: 6000,
          toolResultMaxChars: 8000, // เพดานขั้นสูงสำหรับเอเจนต์นี้
        },
      },
    ],
  },
}
```

#### `skills.limits.maxSkillsPromptChars`

ขีดจำกัดส่วนกลางสำหรับรายการ Skills แบบกระชับที่แทรกลงในพรอมต์ระบบ การตั้งค่านี้
ไม่ส่งผลต่อการอ่านไฟล์ `SKILL.md` ตามต้องการ

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

การแทนที่รายเอเจนต์สำหรับงบประมาณพรอมต์ Skills

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

ขนาดพิกเซลสูงสุดของด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพของทรานสคริปต์/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้โทเค็นสำหรับการมองเห็นและขนาดเพย์โหลดคำขอในการทำงานที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะคงรายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

การตั้งค่าการบีบอัด/รายละเอียดของเครื่องมือรูปภาพสำหรับรูปภาพที่โหลดจากพาธไฟล์, URL และการอ้างอิงสื่อ
ค่าเริ่มต้น: `auto`

OpenClaw จะปรับลำดับขั้นการปรับขนาดตามโมเดลรูปภาพที่เลือก ตัวอย่างเช่น Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL และโมเดลการมองเห็น Llama 4 ที่โฮสต์ไว้สามารถใช้รูปภาพขนาดใหญ่กว่าพาธการมองเห็นรายละเอียดสูงรุ่นเก่า/ค่าเริ่มต้น ขณะที่เทิร์นที่มีหลายรูปภาพจะถูกบีบอัดอย่างเข้มงวดมากขึ้นในโหมด `auto` เพื่อควบคุมต้นทุนโทเค็นและเวลาแฝง

ค่า:

- `auto`: ปรับตามขีดจำกัดของโมเดลและจำนวนรูปภาพ
- `efficient`: เลือกใช้รูปภาพขนาดเล็กกว่าเพื่อลดการใช้โทเค็นและไบต์
- `balanced`: ใช้ลำดับขั้นมาตรฐานที่สมดุล
- `high`: คงรายละเอียดเพิ่มเติมสำหรับภาพหน้าจอ แผนภาพ และรูปภาพเอกสาร

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทพรอมต์ระบบ (ไม่ใช่การประทับเวลาของข้อความ) หากไม่มีจะใช้เขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาในพรอมต์ระบบ ค่าเริ่มต้น: `auto` (ตามค่ากำหนดของระบบปฏิบัติการ)

```json5
{
  agents: { defaults: { timeFormat: "auto" } }, // อัตโนมัติ | 12 | 24
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
      utilityModel: "openai/gpt-5.4-mini",
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
      params: { cacheRetention: "long" }, // พารามิเตอร์เริ่มต้นส่วนกลางของผู้ให้บริการ
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
      maxConcurrent: 4,
    },
  },
}
```

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงตั้งค่าเฉพาะโมเดลหลัก
  - รูปแบบออบเจ็กต์ตั้งค่าโมเดลหลักพร้อมโมเดลสำรองตามลำดับ
- `utilityModel`: การอ้างอิงหรือชื่อแทน `provider/model` ซึ่งไม่บังคับ สำหรับงานภายในระยะสั้น ปัจจุบันใช้สร้างชื่อเซสชันของ Control UI, ชื่อหัวข้อ DM ของ Telegram, ชื่อเธรดอัตโนมัติของ Discord และ[คำบรรยายฉบับร่างความคืบหน้า](/th/concepts/progress-drafts#narrated-status) เมื่อไม่ได้ตั้งค่า OpenClaw จะอนุมานค่าเริ่มต้นของโมเดลขนาดเล็กที่ผู้ให้บริการหลักประกาศไว้ หากมี (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); มิฉะนั้น งานตั้งชื่อจะย้อนกลับไปใช้โมเดลหลักของเอเจนต์ และคำบรรยายจะยังคงปิดอยู่ ตั้งค่า `utilityModel: ""` เพื่อปิดการกำหนดเส้นทางงานอรรถประโยชน์ทั้งหมด `agents.list[].utilityModel` จะแทนที่ค่าเริ่มต้น (ค่าระดับเอเจนต์ที่เป็นค่าว่างจะปิดใช้งานสำหรับเอเจนต์นั้น) และการแทนที่โมเดลเฉพาะการดำเนินการมีลำดับความสำคัญเหนือทั้งสองค่า งานอรรถประโยชน์จะเรียกโมเดลแยกต่างหากและส่งเนื้อหาเฉพาะงานไปยังผู้ให้บริการโมเดลที่เลือก การสร้างชื่อแดชบอร์ดจะส่งอักขระไม่เกิน 1,000 ตัวแรกของข้อความแรกที่ไม่ใช่คำสั่ง ส่วนคำบรรยายจะส่งคำขอขาเข้าพร้อมสรุปเครื่องมือแบบย่อที่ปกปิดข้อมูลแล้ว เลือกผู้ให้บริการที่สอดคล้องกับข้อกำหนดด้านค่าใช้จ่ายและการจัดการข้อมูล
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเส้นทางเครื่องมือ `image` เป็นการกำหนดค่าโมเดลการมองเห็น เมื่อโมเดลที่ใช้งานอยู่ไม่สามารถรับรูปภาพได้ โมเดลที่รองรับการมองเห็นโดยตรงจะได้รับไบต์รูปภาพที่โหลดแล้วโดยตรงแทน
  - ยังใช้เป็นการกำหนดเส้นทางสำรองเมื่อโมเดลที่เลือกหรือโมเดลเริ่มต้นไม่สามารถรับอินพุตรูปภาพได้
  - ควรใช้การอ้างอิง `provider/model` แบบชัดเจน ระบบยอมรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้และรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติมผู้ให้บริการให้ ID นั้น หากตรงกับรายการที่กำหนดค่าไว้หลายรายการอย่างกำกวม ต้องระบุคำนำหน้าผู้ให้บริการอย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถร่วมสำหรับการสร้างรูปภาพและพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าที่ใช้ทั่วไป: `google/gemini-3.1-flash-image-preview` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP พื้นหลังโปร่งใสของ OpenAI
  - หากเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (เช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้รายอื่นตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถร่วมสำหรับการสร้างเพลงและเครื่องมือ `music_generate` ในตัว
  - ค่าที่ใช้ทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้รายอื่นตามลำดับ ID ผู้ให้บริการ
  - หากเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถร่วมสำหรับการสร้างวิดีโอและเครื่องมือ `video_generate` ในตัว
  - ค่าที่ใช้ทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน แล้วจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้รายอื่นตามลำดับ ID ผู้ให้บริการ
  - หากเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - Plugin สร้างวิดีโอ Qwen อย่างเป็นทางการรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ รูปภาพอินพุต 1 รูป วิดีโออินพุต 4 รายการ ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรือออบเจ็กต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับการกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะย้อนกลับไปใช้ `imageModel` แล้วจึงใช้โมเดลของเซสชัน/โมเดลเริ่มต้นที่แก้ไขค่าแล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ขณะเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองสำหรับการแยกข้อมูลของเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับความละเอียดเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือในฉบับร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น ป้ายกำกับสำหรับมนุษย์แบบย่อ) หรือ `"raw"` (เพิ่มคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` ระดับเอเจนต์จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การเปิดเผยกระบวนการใช้เหตุผลเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ระดับเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้นการใช้เหตุผลที่กำหนดค่าไว้จะใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่ได้ตั้งค่าการแทนที่การใช้เหตุผลระดับข้อความหรือเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.6-sol` สำหรับการเข้าถึง Codex OAuth) หากละผู้ให้บริการ OpenClaw จะลองชื่อแทนก่อน จากนั้นหาผู้ให้บริการที่กำหนดค่าไว้เพียงรายเดียวซึ่งตรงกับ ID โมเดลนั้นทุกประการ และจึงย้อนกลับไปใช้ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้เป็นลำดับสุดท้าย (พฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรใช้ `provider/model` แบบชัดเจน) หากผู้ให้บริการนั้นไม่เปิดให้ใช้โมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะย้อนกลับไปใช้ผู้ให้บริการ/โมเดลแรกที่กำหนดค่าไว้ แทนที่จะแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบและล้าสมัย
- `models`: แค็ตตาล็อกโมเดลและรายการที่อนุญาตซึ่งกำหนดค่าไว้สำหรับ `/model` แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ เช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, การกำหนดเส้นทาง `provider` ของ OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`)
  - ใช้รายการ `provider/*` เช่น `"openai/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลที่ค้นพบทั้งหมดสำหรับผู้ให้บริการที่เลือก โดยไม่ต้องระบุ ID โมเดลทุกรายการด้วยตนเอง
  - เพิ่ม `agentRuntime` ไปยังรายการ `provider/*` เมื่อโมเดลทุกตัวที่ค้นพบแบบไดนามิกสำหรับผู้ให้บริการนั้นควรใช้รันไทม์เดียวกัน นโยบายรันไทม์ `provider/model` ที่ตรงกันทุกประการยังคงมีลำดับความสำคัญเหนือไวลด์การ์ด
  - การแก้ไขอย่างปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่ทำให้รายการอนุญาตเดิมถูกลบ เว้นแต่จะส่ง `--replace`
  - ขั้นตอนการกำหนดค่า/เริ่มต้นใช้งานที่จำกัดขอบเขตตามผู้ให้บริการจะผสานโมเดลของผู้ให้บริการที่เลือกลงในแมปนี้ และคงผู้ให้บริการอื่นที่กำหนดค่าไว้แล้วโดยไม่เกี่ยวข้อง
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการแทรก `context_management` หรือใช้ `params.responsesCompactThreshold` เพื่อแทนที่เกณฑ์ ดู[Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#advanced-configuration)
- `params`: พารามิเตอร์ผู้ให้บริการเริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล ตั้งค่าที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญในการผสาน `params` (การกำหนดค่า): `agents.defaults.params` (ฐานส่วนกลาง) ถูกแทนที่โดย `agents.defaults.models["provider/model"].params` (ต่อโมเดล) จากนั้น `agents.list[].params` (ตรงกับ ID เอเจนต์) จะแทนที่ตามคีย์ ดูรายละเอียดที่[การแคชพรอมต์](/th/reference/prompt-caching)
- `models.providers.openrouter.params.provider`: นโยบายเริ่มต้นสำหรับการกำหนดเส้นทางผู้ให้บริการทั่วทั้ง OpenRouter OpenClaw จะส่งต่อนโยบายนี้ไปยังออบเจ็กต์ `provider` ของคำขอ OpenRouter โดย `agents.defaults.models["openrouter/<model>"].params.provider` ต่อโมเดลและพารามิเตอร์เอเจนต์จะแทนที่ตามคีย์ ดู[การกำหนดเส้นทางผู้ให้บริการของ OpenRouter](/th/providers/openrouter#advanced-configuration)
- `params.extra_body`/`params.extraBody`: JSON ขั้นสูงแบบส่งผ่านที่ผสานเข้าในเนื้อหาคำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น เนื้อหาเพิ่มเติมจะมีลำดับความสำคัญเหนือกว่า หลังจากนั้น เส้นทาง completions ที่ไม่ใช่แบบเนทีฟจะยังคงตัด `store` ซึ่งใช้เฉพาะกับ OpenAI ออก
- `params.chat_template_kwargs`: อาร์กิวเมนต์เทมเพลตแชตที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานเข้าในเนื้อหาคำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` เมื่อปิดการคิด Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีลำดับความสำคัญสุดท้าย โมเดลการคิด Qwen และ Nemotron ของ vLLM ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) แทนระดับความพยายามหลายระดับ
- `compat.thinkingFormat`: รูปแบบเพย์โหลดการคิดที่เข้ากันได้กับ OpenAI ใช้ `"together"` สำหรับ `reasoning.enabled` แบบ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดแบบ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนแบ็กเอนด์ตระกูล Qwen ที่รองรับ kwargs ของเทมเพลตแชตระดับคำขอ เช่น vLLM OpenClaw จะแมปการปิดการคิดเป็น `false` และการเปิดการคิดเป็น `true` และโมเดล Qwen ของ vLLM ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารีสำหรับรูปแบบเหล่านี้
- `compat.supportedReasoningEfforts`: รายการระดับความพยายามในการใช้เหตุผลที่เข้ากันได้กับ OpenAI ต่อโมเดล รวม `"xhigh"` สำหรับเอนด์พอยต์แบบกำหนดเองที่รองรับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชันของ Gateway การตรวจสอบแพตช์เซสชัน การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: ตัวเลือกเปิดใช้เฉพาะ Z.AI สำหรับการคงข้อมูลการคิดไว้ เมื่อเปิดใช้งานและเปิดการคิดอยู่ OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่นซ้ำ `reasoning_content` ก่อนหน้า ดู[การคิดและการคงข้อมูลการคิดของ Z.AI](/th/providers/zai#advanced-configuration)
- `localService`: ตัวจัดการโพรเซสระดับผู้ให้บริการซึ่งไม่บังคับ สำหรับเซิร์ฟเวอร์โมเดลในเครื่อง/โฮสต์เอง เมื่อโมเดลที่เลือกเป็นของผู้ให้บริการนั้น OpenClaw จะตรวจสอบ `healthUrl` (หรือ `baseUrl + "/models"`) เริ่ม `command` ด้วย `args` หากเอนด์พอยต์ไม่ทำงาน รอไม่เกิน `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบสัมบูรณ์ `idleStopMs: 0` จะทำให้โพรเซสทำงานต่อจนกว่า OpenClaw จะออก; ค่าบวกจะหยุดโพรเซสที่ OpenClaw เริ่มหลังจากไม่มีการใช้งานเป็นเวลาตามจำนวนมิลลิวินาทีนั้น ดู[บริการโมเดลภายในเครื่อง](/th/gateway/local-model-services)
- นโยบายรันไทม์ต้องกำหนดไว้ที่ผู้ให้บริการหรือโมเดล ไม่ใช่ที่ `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎที่ใช้กับผู้ให้บริการทั้งหมด หรือใช้ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล คำนำหน้าผู้ให้บริการ/โมเดลเพียงอย่างเดียวจะไม่เลือกชุดควบคุมการทำงาน เมื่อไม่ได้ตั้งค่ารันไทม์หรือกำหนดเป็น `auto` OpenAI อาจเลือก Codex โดยปริยายได้เฉพาะเส้นทาง HTTPS อย่างเป็นทางการที่ตรงกันทุกประการสำหรับ Platform Responses หรือ ChatGPT Responses และไม่มีการเขียนค่าทับในคำขอ ดู[รันไทม์เอเจนต์โดยปริยายของ OpenAI](/th/providers/openai#implicit-agent-runtime)
- ตัวเขียนการกำหนดค่าที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบทางเลือกสำรอง) จะบันทึกในรูปแบบอ็อบเจ็กต์มาตรฐานและเก็บรักษารายการทางเลือกสำรองที่มีอยู่ไว้เมื่อทำได้
- `maxConcurrent`: จำนวนสูงสุดของการรันเอเจนต์แบบขนานข้ามเซสชัน (แต่ละเซสชันยังคงทำงานตามลำดับ) ค่าเริ่มต้น: `4`.

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
      model: "openai/gpt-5.6-sol",
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

- `id`: `"auto"`, `"openclaw"`, ID ฮาร์เนส Plugin ที่ลงทะเบียนแล้ว หรือนามแฝงแบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้ลงทะเบียน `codex`; Plugin Anthropic ที่รวมมาให้มีแบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` ช่วยให้ฮาร์เนส Plugin ที่ลงทะเบียนแล้วรับช่วงเส้นทางที่มีผลซึ่งประกาศหรือเป็นไปตามสัญญาการรองรับของตน และใช้ OpenClaw เมื่อไม่มีฮาร์เนสใดตรงกัน รันไทม์ Plugin ที่ระบุอย่างชัดเจน เช่น `id: "codex"` จำเป็นต้องมีฮาร์เนสดังกล่าวและเส้นทางที่มีผลซึ่งเข้ากันได้ โดยจะปิดกั้นเมื่อไม่พร้อมใช้งานหากขาดสิ่งใดสิ่งหนึ่งหรือการดำเนินการล้มเหลว
- `id: "pi"` ยอมรับเฉพาะในฐานะนามแฝงที่เลิกใช้แล้วของ `openclaw` เพื่อรักษาการกำหนดค่าที่เผยแพร่ใน v2026.5.22 และก่อนหน้า การกำหนดค่าใหม่ควรใช้ `openclaw`
- ลำดับความสำคัญของรันไทม์คือนโยบายโมเดลแบบตรงทั้งหมดก่อน (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` หรือ `models.providers.<provider>.models[]`) จากนั้น `agents.list[]` / `agents.defaults.models["provider/*"]` แล้วจึงเป็นนโยบายระดับผู้ให้บริการที่ `models.providers.<provider>.agentRuntime`
- คีย์รันไทม์ระดับเอเจนต์ทั้งหมดเป็นแบบเดิม `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, การปักหมุดรันไทม์ของเซสชัน และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นระหว่างการเลือกรันไทม์ เรียกใช้ `openclaw doctor --fix` เพื่อลบค่าที่ล้าสมัย
- เส้นทาง OpenAI Responses/ChatGPT ผ่าน HTTPS อย่างเป็นทางการแบบตรงทั้งหมดที่มีสิทธิ์และไม่มีการเขียนทับคำขอไว้ อาจใช้ฮาร์เนส Codex โดยปริยาย `agentRuntime.id: "codex"` ของผู้ให้บริการ/โมเดลทำให้ Codex เป็นข้อกำหนดที่ปิดกั้นเมื่อไม่พร้อมใช้งาน แต่ไม่ได้ทำให้เส้นทางที่เข้ากันไม่ได้กลายเป็นเข้ากันได้
- สำหรับการปรับใช้ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-8"` ร่วมกับ `agentRuntime.id: "claude-cli"` ที่จำกัดขอบเขตตามโมเดล การอ้างอิง `claude-cli/<model>` แบบเดิมยังคงใช้งานได้เพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรคงการเลือกผู้ให้บริการ/โมเดลให้อยู่ในรูปแบบมาตรฐาน และระบุแบ็กเอนด์การดำเนินการไว้ในนโยบายรันไทม์ของผู้ให้บริการ/โมเดล
- ส่วนนี้ควบคุมเฉพาะการดำเนินการในรอบการทำงานของเอเจนต์ข้อความเท่านั้น การสร้างสื่อ การมองเห็น PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของตน

**รูปแบบย่อนามแฝงในตัว** (ใช้เฉพาะเมื่อโมเดลอยู่ใน `agents.defaults.models`):

| นามแฝง               | โมเดล                           |
| ------------------- | ------------------------------- |
| `opus`              | `anthropic/claude-opus-4-8`     |
| `sonnet`            | `anthropic/claude-sonnet-4-6`   |
| `gpt`               | `openai/gpt-5.4`                |
| `gpt-mini`          | `openai/gpt-5.4-mini`           |
| `gpt-nano`          | `openai/gpt-5.4-nano`           |
| `gemini`            | `google/gemini-3.1-pro-preview` |
| `gemini-flash`      | `google/gemini-3-flash-preview` |
| `gemini-flash-lite` | `google/gemini-3.1-flash-lite`  |

นามแฝงที่กำหนดค่าไว้จะมีลำดับความสำคัญเหนือค่าเริ่มต้นเสมอ

โมเดล Z.AI GLM-4.x เปิดใช้โหมดการคิดโดยอัตโนมัติ เว้นแต่จะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตนเอง
โมเดล Z.AI เปิดใช้ `tool_stream` โดยค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้
Anthropic Claude Opus 4.8 ปิดการคิดไว้โดยค่าเริ่มต้นใน OpenClaw; เมื่อเปิดใช้การคิดแบบปรับตัวอย่างชัดเจน ค่าเริ่มต้นของระดับความพยายามที่ผู้ให้บริการ Anthropic เป็นเจ้าของคือ `high` โมเดล Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้ตั้งค่าระดับการคิดอย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI ทางเลือกสำหรับการเรียกใช้สำรองแบบข้อความเท่านั้น (ไม่มีการเรียกเครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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
          // หรือใช้ systemPromptFileArg เมื่อ CLI รองรับแฟล็กไฟล์พรอมต์
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
        },
      },
    },
  },
}
```

- แบ็กเอนด์ CLI เน้นข้อความเป็นหลัก; เครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` ยอมรับพาธไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้แบ็กเอนด์กู้คืนเซสชันที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัย
  จากส่วนท้ายของทรานสคริปต์ OpenClaw แบบดิบที่มีขอบเขตจำกัด ก่อนจะมีสรุป
  Compaction ครั้งแรก การเปลี่ยนแปลงโปรไฟล์การตรวจสอบสิทธิ์หรือยุคข้อมูลประจำตัว
  จะไม่ทำการป้อนข้อมูลดิบเริ่มต้นใหม่เสมอ

### `agents.defaults.promptOverlays`

โอเวอร์เลย์พรอมต์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งใช้ตามตระกูลโมเดลบนพื้นผิวพรอมต์ที่ OpenClaw ประกอบขึ้น ID โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมที่ใช้ร่วมกันในเส้นทาง OpenClaw/ผู้ให้บริการ; `personality` ควบคุมเฉพาะชั้นรูปแบบการโต้ตอบที่เป็นมิตร เส้นทางแอปเซิร์ฟเวอร์ Codex แบบเนทีฟจะคงคำสั่งพื้นฐาน/โมเดลที่ Codex เป็นเจ้าของแทนโอเวอร์เลย์ GPT-5 ของ OpenClaw นี้ และ OpenClaw จะปิดบุคลิกภาพในตัวของ Codex สำหรับเธรดแบบเนทีฟ

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
- `"off"` ปิดใช้เฉพาะชั้นที่เป็นมิตร; สัญญาพฤติกรรม GPT-5 ที่ติดแท็กยังคงเปิดใช้งานอยู่
- ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบเดิมเมื่อไม่ได้ตั้งค่าการตั้งค่าที่ใช้ร่วมกันนี้

### `agents.defaults.heartbeat`

การเรียกใช้ Heartbeat เป็นระยะ

```json5
{
  agents: {
    defaults: {
      heartbeat: {
        every: "30m", // 0m ปิดใช้งาน
        model: "openai/gpt-5.4-mini",
        includeReasoning: false,
        includeSystemPromptSection: true, // ค่าเริ่มต้น: true; false จะละเว้นส่วน Heartbeat จากพรอมต์ระบบ
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จากไฟล์บูตสแตรปพื้นที่ทำงาน
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะเรียกใช้แต่ละ Heartbeat ในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        skipWhenBusy: false, // ค่าเริ่มต้น: false; true จะรอเลนเอเจนต์ย่อย/เลนซ้อนของเอเจนต์นี้ด้วย
        session: "main",
        to: "+15555550123",
        directPolicy: "allow", // allow (ค่าเริ่มต้น) | block
        target: "none", // ค่าเริ่มต้น: none | ตัวเลือก: last | whatsapp | telegram | discord | ...
        prompt: "อ่าน HEARTBEAT.md หากมีอยู่...",
        ackMaxChars: 300,
        suppressToolErrorWarnings: false,
        timeoutSeconds: 45,
      },
    },
  },
}
```

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การตรวจสอบสิทธิ์ด้วยคีย์ API) หรือ `1h` (การตรวจสอบสิทธิ์ด้วย OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมต์ระบบและข้ามการแทรก `HEARTBEAT.md` ลงในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการเรียกใช้ Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตสำหรับรอบการทำงานของเอเจนต์ Heartbeat ก่อนที่จะถูกยุติ หากไม่ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds` เมื่อตั้งค่าไว้ มิฉะนั้นจะใช้รอบเวลา Heartbeat โดยจำกัดสูงสุดที่ 600 วินาที
- `directPolicy`: นโยบายการส่งโดยตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและส่ง `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การเรียกใช้ Heartbeat จะใช้บริบทบูตสแตรปแบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปพื้นที่ทำงาน
- `isolatedSession`: เมื่อเป็น true แต่ละ Heartbeat จะทำงานในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จาก ~100K เหลือ ~2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การเรียกใช้ Heartbeat จะเลื่อนออกไปเมื่อเลนงานเพิ่มเติมของเอเจนต์นั้นไม่ว่าง ได้แก่ งานเอเจนต์ย่อยที่ผูกกับคีย์เซสชันของตนเองหรืองานคำสั่งที่ซ้อนกัน เลน Cron จะเลื่อน Heartbeat เสมอแม้ไม่มีแฟล็กนี้
- ต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะเรียกใช้ Heartbeat
- Heartbeat จะเรียกใช้รอบการทำงานของเอเจนต์แบบเต็ม — ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // ID ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนแล้ว (ไม่บังคับ)
        timeoutSeconds: 180,
        reserveTokensFloor: 24000,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        maxHistoryShare: 0.7,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "รักษา ID การปรับใช้ ID ตั๋ว และคู่ host:port ให้ตรงตามต้นฉบับทุกประการ", // ใช้เมื่อ identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // การตรวจสอบแรงกดดันของลูปเครื่องมือระหว่างรอบที่เป็นทางเลือก
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // เลือกใช้การแทรกส่วน AGENTS.md ซ้ำ
        model: "openrouter/anthropic/claude-sonnet-4-6", // การเขียนทับโมเดลเฉพาะ Compaction ที่เป็นทางเลือก
        truncateAfterCompaction: true, // หมุนไปยัง JSONL ตัวถัดไปที่เล็กกว่าหลัง Compaction
        maxActiveTranscriptBytes: "20mb", // ทริกเกอร์ Compaction ภายในเครื่องก่อนดำเนินการที่เป็นทางเลือก
        notifyUser: true, // แจ้งเมื่อ Compaction เริ่มต้น/เสร็จสิ้น และเมื่อการล้างหน่วยความจำเสื่อมประสิทธิภาพ (ค่าเริ่มต้น: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // การเขียนทับโมเดลเฉพาะการล้างหน่วยความจำที่เป็นทางเลือก
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "เซสชันใกล้ถึง Compaction โปรดจัดเก็บความทรงจำที่คงทนตอนนี้",
          prompt: "เขียนบันทึกที่ควรเก็บไว้ลงใน memory/YYYY-MM-DD.md; หากไม่มีสิ่งที่ต้องจัดเก็บ ให้ตอบด้วยโทเค็นเงียบ NO_REPLY ตามนี้ทุกประการ",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งส่วนสำหรับประวัติที่ยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: ID ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่า ระบบจะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้ระบบในตัว การตั้งค่าผู้ให้บริการจะบังคับใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้ง ก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `180`
- `reserveTokens`: พื้นที่โทเค็นสำรองที่เก็บไว้สำหรับเอาต์พุตของโมเดลและผลลัพธ์ของเครื่องมือในอนาคตหลังจาก Compaction เมื่อทราบขนาดหน้าต่างบริบทของโมเดล OpenClaw จะจำกัดปริมาณสำรองที่มีผลเพื่อไม่ให้ใช้โควตางบประมาณพรอมต์
- `reserveTokensFloor`: ปริมาณสำรองขั้นต่ำที่รันไทม์แบบฝังกำหนดไว้ ตั้งค่า `0` เพื่อปิดใช้ค่าขั้นต่ำนี้ ค่าขั้นต่ำยังคงอยู่ภายใต้ขีดจำกัดของหน้าต่างบริบทที่ใช้งานอยู่
- `keepRecentTokens`: งบประมาณจุดตัดของเอเจนต์สำหรับเก็บส่วนท้ายล่าสุดของทรานสคริปต์ไว้แบบคำต่อคำ `/compact` แบบดำเนินการด้วยตนเองจะใช้ค่านี้เมื่อตั้งค่าไว้อย่างชัดเจน มิฉะนั้น Compaction แบบดำเนินการด้วยตนเองจะเป็นจุดตรวจสอบแบบตายตัว
- `recentTurnsPreserve`: จำนวนรอบสนทนาระหว่างผู้ใช้/ผู้ช่วยล่าสุดที่เก็บไว้แบบคำต่อคำนอกการสรุปเพื่อป้องกันความเสียหาย ค่าเริ่มต้น: `3`
- `maxHistoryShare`: สัดส่วนสูงสุดของงบประมาณบริบททั้งหมดที่อนุญาตให้ใช้กับประวัติที่เก็บไว้หลัง Compaction (ช่วง `0.1`-`0.9`)
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` โดย `strict` จะเติมคำแนะนำในตัวสำหรับการเก็บรักษาตัวระบุที่ไม่โปร่งใสไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองที่ไม่บังคับสำหรับการรักษาตัวระบุ ซึ่งใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบเพื่อทำซ้ำเมื่อเอาต์พุตผิดรูปสำหรับสรุปที่ใช้ป้องกันความเสียหาย เปิดใช้เป็นค่าเริ่มต้นในโหมดป้องกันความเสียหาย ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันจากลูปเครื่องมือที่ไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังผนวกผลลัพธ์ของเครื่องมือและก่อนเรียกโมเดลครั้งถัดไป หากบริบทไม่พอดีอีกต่อไป ระบบจะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมต์ และใช้เส้นทางการกู้คืนจากการตรวจสอบล่วงหน้าที่มีอยู่เพื่อตัดผลลัพธ์ของเครื่องมือ หรือทำ Compaction แล้วลองใหม่ ใช้งานได้กับโหมด Compaction ทั้ง `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้
- `postIndexSync`: โหมดจัดทำดัชนีหน่วยความจำเซสชันใหม่หลัง Compaction ค่าเริ่มต้น: `"async"` ใช้ `"await"` เพื่อให้ข้อมูลใหม่ที่สุด ใช้ `"async"` เพื่อลดเวลาแฝงของ Compaction หรือใช้ `"off"` เฉพาะเมื่อมีการจัดการซิงก์หน่วยความจำเซสชันที่อื่น
- `postCompactionSections`: ชื่อส่วน H2/H3 ใน AGENTS.md ที่ไม่บังคับ ซึ่งจะใส่กลับเข้ามาหลัง Compaction การใส่กลับจะปิดใช้เมื่อไม่ได้ตั้งค่าหรือตั้งเป็น `[]` การตั้งค่า `["Session Startup", "Red Lines"]` อย่างชัดเจนจะเปิดใช้คู่นั้นและคงการย้อนกลับแบบเดิมของ `Every Session`/`Safety` เปิดใช้เฉพาะเมื่อบริบทเพิ่มเติมคุ้มกับความเสี่ยงที่จะทำให้คำแนะนำโครงการซึ่งบันทึกไว้แล้วในสรุป Compaction ซ้ำกัน
- `model`: `provider/model-id` ที่ไม่บังคับหรือนามแฝงเปล่าจาก `agents.defaults.models` สำหรับการสรุป Compaction เท่านั้น นามแฝงเปล่าจะถูกแปลงก่อนส่งงาน ส่วน ID โมเดลแบบข้อความตรงที่กำหนดค่าไว้จะมีลำดับความสำคัญเหนือกว่าเมื่อเกิดชื่อชนกัน ใช้ตัวเลือกนี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่ง แต่สรุป Compaction ควรทำงานด้วยอีกโมเดลหนึ่ง หากไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `truncateAfterCompaction`: หมุนเวียนทรานสคริปต์เซสชันที่ใช้งานอยู่หลัง Compaction เพื่อให้รอบสนทนาในอนาคตโหลดเฉพาะสรุปและส่วนท้ายที่ยังไม่ได้สรุป ขณะที่ทรานสคริปต์ฉบับเต็มก่อนหน้ายังคงถูกเก็บถาวร ป้องกันไม่ให้ทรานสคริปต์ที่ใช้งานอยู่เติบโตอย่างไม่จำกัดในเซสชันที่ทำงานเป็นเวลานาน ค่าเริ่มต้น: `false`
- `maxActiveTranscriptBytes`: เกณฑ์จำนวนไบต์ที่ไม่บังคับ (`number` หรือสตริง เช่น `"20mb"`) ซึ่งจะเรียกใช้ Compaction ภายในตามปกติก่อนการทำงาน เมื่อประวัติทรานสคริปต์มีขนาดเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนเวียนไปยังทรานสคริปต์ถัดไปที่มีขนาดเล็กกว่า ปิดใช้เมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อ `true` ระบบจะส่งข้อความแจ้งการบำรุงรักษาบริบทสั้น ๆ ให้ผู้ใช้ เมื่อ Compaction เริ่มต้นและเสร็จสมบูรณ์ (ตัวอย่างเช่น "กำลังกระชับบริบท..." และ "Compaction เสร็จสมบูรณ์") และเมื่อการล้างหน่วยความจำก่อน Compaction ใช้ความพยายามจนหมด ทำให้การตอบดำเนินต่อในสถานะที่มีประสิทธิภาพลดลง (ตัวอย่างเช่น "การบำรุงรักษาหน่วยความจำล้มเหลวชั่วคราว กำลังตอบกลับต่อ") ปิดใช้เป็นค่าเริ่มต้นเพื่อไม่ให้แสดงข้อความแจ้งเหล่านี้
- `memoryFlush`: รอบการทำงานของเอเจนต์แบบเงียบก่อน Compaction อัตโนมัติ เพื่อจัดเก็บหน่วยความจำที่คงทน ตั้งค่า `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อรอบการดูแลระบบนี้ควรใช้โมเดลภายในต่อไป ค่าที่กำหนดทับจะไม่สืบทอดสายการย้อนกลับของเซสชันที่ใช้งานอยู่ `forceFlushTranscriptBytes` จะบังคับให้ล้างข้อมูลเมื่อขนาดทรานสคริปต์ถึงเกณฑ์ แม้ว่าตัวนับโทเค็นจะล้าสมัย ข้ามขั้นตอนนี้เมื่อพื้นที่ทำงานเป็นแบบอ่านอย่างเดียว

### `agents.defaults.runRetries`

ขอบเขตจำนวนรอบการลองใหม่ของลูปการทำงานชั้นนอกสำหรับรันไทม์เอเจนต์แบบฝัง เพื่อป้องกันลูปการดำเนินงานไม่รู้จบระหว่างการกู้คืนจากความล้มเหลว การตั้งค่านี้ใช้กับรันไทม์เอเจนต์แบบฝังเท่านั้น ไม่ใช้กับรันไทม์ ACP หรือ CLI

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
        runRetries: { max: 50 }, // ค่ากำหนดทับต่อเอเจนต์ที่ไม่บังคับ
      },
    ],
  },
}
```

- `base`: จำนวนรอบพื้นฐานสำหรับการลองดำเนินงานใหม่ในลูปการทำงานชั้นนอก ค่าเริ่มต้น: `24`
- `perProfile`: จำนวนรอบการลองดำเนินงานใหม่เพิ่มเติมที่มอบให้ต่อโปรไฟล์ตัวเลือกสำรองแต่ละรายการ ค่าเริ่มต้น: `8`
- `min`: ขีดจำกัดสัมบูรณ์ขั้นต่ำสำหรับจำนวนรอบการลองดำเนินงานใหม่ ค่าเริ่มต้น: `32`
- `max`: ขีดจำกัดสัมบูรณ์สูงสุดสำหรับจำนวนรอบการลองดำเนินงานใหม่ เพื่อป้องกันการดำเนินงานที่ควบคุมไม่ได้ ค่าเริ่มต้น: `160`

### `agents.defaults.contextPruning`

ตัด **ผลลัพธ์เก่าของเครื่องมือ** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติเซสชันบนดิสก์ ปิดใช้เป็นค่าเริ่มต้น ตั้งค่า `mode: "cache-ttl"` เพื่อเปิดใช้

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // off (ค่าเริ่มต้น) | cache-ttl
        ttl: "1h", // ระยะเวลา (ms/s/m/h), หน่วยเริ่มต้น: นาที; ค่าเริ่มต้น: 5m
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

<Accordion title="ลักษณะการทำงานของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้รอบการตัด
- `ttl` ควบคุมว่าการตัดจะทำงานอีกครั้งได้บ่อยเพียงใด (หลังการแตะแคชครั้งล่าสุด) ค่าเริ่มต้น: `5m`
- การตัดจะลดขนาดผลลัพธ์ของเครื่องมือที่ใหญ่เกินไปแบบนุ่มนวลก่อน จากนั้นจึงล้างผลลัพธ์เก่าของเครื่องมือทั้งหมดหากจำเป็น
- `softTrimRatio` และ `hardClearRatio` ยอมรับค่าตั้งแต่ `0.0` ถึง `1.0` การตรวจสอบความถูกต้องของการกำหนดค่าจะปฏิเสธค่าที่อยู่นอกช่วงดังกล่าว

**การลดขนาดแบบนุ่มนวล** จะเก็บส่วนต้น + ส่วนท้ายไว้ และแทรก `...` ไว้ตรงกลาง

**การล้างทั้งหมด** จะแทนที่ผลลัพธ์ทั้งหมดของเครื่องมือด้วยข้อความตัวแทน

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกลดขนาดหรือล้าง
- อัตราส่วนคำนวณจากจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- หากมีข้อความของผู้ช่วยน้อยกว่า `keepLastAssistants` ข้อ ระบบจะข้ามการตัด

</Accordion>

ดูรายละเอียดลักษณะการทำงานได้ที่ [การตัดเซสชัน](/th/concepts/session-pruning)

### การสตรีมแบบบล็อก

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // on | off
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // off (ค่าเริ่มต้น) | natural | custom (ใช้ minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องกำหนด `*.streaming.block.enabled: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก QQ Bot เป็นข้อยกเว้น เพราะไม่มีคีย์ `streaming.block` และจะสตรีมการตอบกลับแบบบล็อก เว้นแต่ `channels.qqbot.streaming.mode` จะเป็น `"off"`
- ค่ากำหนดทับของช่องทาง: `channels.<channel>.streaming.block.coalesce` (รวมถึงรูปแบบต่อบัญชี) Discord, Google Chat, Mattermost, MS Teams, Signal และ Slack ใช้ค่าเริ่มต้น `minChars: 1500` / `idleMs: 1000`
- `blockStreamingChunk.breakPreference`: ขอบเขตการแบ่งส่วนที่ต้องการ (`"paragraph" | "newline" | "sentence"`)
- `humanDelay`: การหยุดชั่วคราวแบบสุ่มระหว่างการตอบกลับแบบบล็อก ค่าเริ่มต้น: `off` โดย `natural` = 800-2500ms และ `custom` ใช้ `minMs`/`maxMs` (จะย้อนกลับไปใช้ช่วงตามธรรมชาติสำหรับขอบเขตที่ไม่ได้ตั้งค่า) ค่ากำหนดทับต่อเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดลักษณะการทำงานและการแบ่งส่วนได้ที่ [การสตรีม](/th/concepts/streaming)

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

- ค่าเริ่มต้น: `instant` สำหรับแชตโดยตรง/การกล่าวถึง และ `message` สำหรับแชตกลุ่มที่ไม่มีการกล่าวถึง
- ค่าเริ่มต้นของ `typingIntervalSeconds`: `6`
- ค่ากำหนดทับต่อเซสชัน: `session.typingMode`, `session.typingIntervalSeconds`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การแซนด์บ็อกซ์ที่ไม่บังคับสำหรับเอเจนต์แบบฝัง ดูคู่มือฉบับเต็มได้ที่ [การแซนด์บ็อกซ์](/th/gateway/sandboxing)

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (ค่าเริ่มต้น) | non-main | all
        backend: "docker", // docker (ค่าเริ่มต้น) | ssh | openshell
        scope: "agent", // session | agent (ค่าเริ่มต้น) | shared
        workspaceAccess: "none", // none (ค่าเริ่มต้น) | ro | rw
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
          gpus: "all",
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
          // รองรับ SecretRefs / เนื้อหาแบบอินไลน์ด้วย:
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

ค่าเริ่มต้นที่แสดงด้านบน (`off`/`docker`/`agent`/`none`/อิมเมจ `bookworm-slim` เครือข่าย `none`/ฯลฯ) เป็นค่าเริ่มต้นจริงของ OpenClaw ไม่ใช่เพียงค่าตัวอย่าง

<Accordion title="รายละเอียด Sandbox">

**แบ็กเอนด์:**

- `docker`: รันไทม์ Docker ภายในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่ใช้ SSH เป็นแบ็กเอนด์
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปยัง
`plugins.entries.openshell.config`

**การกำหนดค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอนต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รูทระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับเวิร์กสเปซแยกตามขอบเขต (ค่าเริ่มต้น: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวขณะรันไทม์
- `strictHostKeyChecking` / `updateHostKeys`: ตัวเลือกนโยบายคีย์โฮสต์ของ OpenSSH (ทั้งคู่มีค่าเริ่มต้นเป็น `true`)

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีลำดับความสำคัญเหนือ `identityFile`
- `certificateData` มีลำดับความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีลำดับความสำคัญเหนือ `knownHostsFile`
- ค่า `*Data` ที่ใช้ SecretRef เป็นแบ็กเอนด์จะถูกแก้ไขจากสแนปช็อตรันไทม์ข้อมูลลับที่ใช้งานอยู่ก่อนเริ่มเซสชัน Sandbox

**ลักษณะการทำงานของแบ็กเอนด์ SSH:**

- เติมข้อมูลเริ่มต้นให้เวิร์กสเปซระยะไกลหนึ่งครั้งหลังจากสร้างหรือสร้างใหม่
- จากนั้นให้เวิร์กสเปซ SSH ระยะไกลเป็นแหล่งข้อมูลหลัก
- กำหนดเส้นทาง `exec` เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงจากระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์ของ Sandbox

**การเข้าถึงเวิร์กสเปซ:**

- `none`: เวิร์กสเปซ Sandbox แยกตามขอบเขตภายใต้ `~/.openclaw/sandboxes` (ค่าเริ่มต้น)
- `ro`: เวิร์กสเปซ Sandbox ที่ `/workspace` โดยเมานต์เวิร์กสเปซของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์เวิร์กสเปซของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์และเวิร์กสเปซแยกต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์และหนึ่งเวิร์กสเปซต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: ใช้คอนเทนเนอร์และเวิร์กสเปซร่วมกัน (ไม่มีการแยกระหว่างเซสชัน)

**การกำหนดค่า Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // mirror (ค่าเริ่มต้น) | remote
          command: "openshell",
          from: "openclaw",
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
          gateway: "lab", // ไม่บังคับ
          gatewayEndpoint: "https://lab.example", // ไม่บังคับ
          policy: "strict", // รหัสนโยบาย OpenShell ที่ไม่บังคับ
          providers: ["openai"], // ไม่บังคับ
          autoProviders: true,
          timeoutSeconds: 120,
        },
      },
    },
  },
}
```

**โหมด OpenShell:**

- `mirror`: เติมข้อมูลระยะไกลจากภายในเครื่องก่อน exec และซิงค์กลับหลัง exec โดยเวิร์กสเปซภายในเครื่องยังคงเป็นแหล่งข้อมูลหลัก
- `remote`: เติมข้อมูลระยะไกลหนึ่งครั้งเมื่อสร้าง Sandbox จากนั้นให้เวิร์กสเปซระยะไกลเป็นแหล่งข้อมูลหลัก

ในโหมด `remote` การแก้ไขภายในโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้า Sandbox โดยอัตโนมัติหลังขั้นตอนเติมข้อมูลเริ่มต้น
การรับส่งข้อมูลใช้ SSH เข้าไปยัง Sandbox ของ OpenShell แต่ Plugin เป็นผู้จัดการวงจรชีวิตของ Sandbox และการซิงค์แบบมิเรอร์ที่เป็นตัวเลือก

**`setupCommand`** ทำงานหนึ่งครั้งหลังจากสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมีการเชื่อมต่อเครือข่ายขาออก รูทที่เขียนได้ และผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องการเข้าถึงเครือข่ายขาออก
`"host"` ถูกบล็อก โดยค่าเริ่มต้น `"container:<id>"` จะถูกบล็อกด้วย เว้นแต่จะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (ใช้ในกรณีฉุกเฉิน)
เทิร์นของ Codex app-server ใน Sandbox ของ OpenClaw ที่ใช้งานอยู่จะใช้การตั้งค่าการเชื่อมต่อขาออกเดียวกันนี้สำหรับการเข้าถึงเครือข่ายในโหมดโค้ดแบบเนทีฟ

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ภายในเวิร์กสเปซที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีเพิ่มเติมจากโฮสต์ โดยจะรวมการผูกแบบส่วนกลางและแบบต่อเอเจนต์เข้าด้วยกัน

**เบราว์เซอร์ใน Sandbox** (`sandbox.browser.enabled` ค่าเริ่มต้น `false`): Chromium + CDP ในคอนเทนเนอร์ โดยแทรก URL ของ noVNC ลงในพรอมต์ระบบ และไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึง noVNC สำหรับผู้สังเกตการณ์ใช้การยืนยันตัวตน VNC โดยค่าเริ่มต้น และ OpenClaw จะออก URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) ป้องกันไม่ให้เซสชันใน Sandbox กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อต้องการการเชื่อมต่อบริดจ์ส่วนกลางอย่างชัดเจนเท่านั้น `"host"` ถูกบล็อกที่นี่ด้วย
- `cdpSourceRange` สามารถจำกัดการรับส่งข้อมูล CDP ขาเข้าที่ขอบคอนเทนเนอร์ให้อยู่ในช่วง CIDR ได้ (ตัวอย่างเช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีเพิ่มเติมจากโฮสต์เข้าไปในคอนเทนเนอร์เบราว์เซอร์ของ Sandbox เท่านั้น เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- Chromium ของคอนเทนเนอร์เบราว์เซอร์ใน Sandbox จะเปิดใช้งานด้วย `--no-sandbox --disable-setuid-sandbox` เสมอ (คอนเทนเนอร์ไม่มีองค์ประกอบพื้นฐานของเคอร์เนลที่ Sandbox ของ Chrome ต้องใช้) และไม่มีตัวเลือกการกำหนดค่าสำหรับสลับค่านี้
- ค่าเริ่มต้นในการเปิดใช้งานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับให้เหมาะกับโฮสต์คอนเทนเนอร์:
  - `--remote-debugging-address=127.0.0.1`
  - `--remote-debugging-port=<derived from OPENCLAW_BROWSER_CDP_PORT>`
  - `--user-data-dir=${HOME}/.chrome`
  - `--no-first-run`
  - `--no-default-browser-check`
  - `--disable-dev-shm-usage`
  - `--disable-background-networking`
  - `--disable-breakpad`
  - `--disable-crash-reporter`
  - `--no-zygote`
  - `--metrics-recording-only`
  - `--password-store=basic`
  - `--use-mock-keychain`
  - `--disable-3d-apis`, `--disable-gpu` และ `--disable-software-rasterizer`
    เปิดใช้งานโดยค่าเริ่มต้น และสามารถปิดใช้งานด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้งาน WebGL/3D จำเป็นต้องใช้
  - `--disable-extensions` (เปิดใช้งานโดยค่าเริ่มต้น); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    เปิดใช้งานส่วนขยายอีกครั้ง หากเวิร์กโฟลว์ต้องพึ่งพาส่วนขยาย
  - `--renderer-process-limit=2` โดยค่าเริ่มต้น เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` หรือตั้ง `0` เพื่อใช้
    ขีดจำกัดโพรเซสเริ่มต้นของ Chromium
  - `--headless=new` เฉพาะเมื่อเปิดใช้งาน `headless`
  - ค่าเริ่มต้นเป็นค่าพื้นฐานของอิมเมจคอนเทนเนอร์ หากต้องการเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์ ให้ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    entrypoint แบบกำหนดเอง

</Accordion>

การใช้ Sandbox กับเบราว์เซอร์และ `sandbox.docker.binds` รองรับเฉพาะ Docker

สร้างอิมเมจ (จากการเช็กเอาต์ซอร์ส):

```bash
scripts/sandbox-setup.sh           # อิมเมจ Sandbox หลัก
scripts/sandbox-browser-setup.sh   # อิมเมจเบราว์เซอร์ที่ไม่บังคับ
```

สำหรับการติดตั้ง npm โดยไม่มีการเช็กเอาต์ซอร์ส โปรดดู [Sandboxing § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบอินไลน์

### `agents.list` (การเขียนทับค่าต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS เสียง โมเดล
สไตล์ หรือโหมด TTS อัตโนมัติให้เอเจนต์แต่ละตัว บล็อกเอเจนต์จะผสานแบบลึกทับค่า
`messages.tts` ส่วนกลาง จึงสามารถเก็บข้อมูลรับรองที่ใช้ร่วมกันไว้ในที่เดียว ขณะที่เอเจนต์
แต่ละตัวเขียนทับเฉพาะฟิลด์เสียงหรือผู้ให้บริการที่ต้องใช้ การเขียนทับค่าของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับด้วยเสียงอัตโนมัติ `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` โปรดดูตัวอย่างผู้ให้บริการและลำดับความสำคัญที่
[การแปลงข้อความเป็นเสียงพูด](/th/tools/tts#per-agent-voice-overrides)

```json5
{
  agents: {
    list: [
      {
        id: "main",
        default: true,
        name: "เอเจนต์หลัก",
        workspace: "~/.openclaw/workspace",
        agentDir: "~/.openclaw/agents/main/agent",
        model: "anthropic/claude-opus-4-6", // หรือ { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // แทนที่ระดับการคิดสำหรับแต่ละเอเจนต์
        reasoningDefault: "on", // แทนที่การแสดงผลการให้เหตุผลสำหรับแต่ละเอเจนต์
        fastModeDefault: false, // แทนที่โหมดเร็วสำหรับแต่ละเอเจนต์
        params: { cacheRetention: "none" }, // แทนที่พารามิเตอร์ defaults.models ที่มีคีย์ตรงกัน
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // แทนที่ agents.defaults.skills เมื่อตั้งค่า
        identity: {
          name: "Samantha",
          theme: "สลอธที่พร้อมช่วยเหลือ",
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
            mode: "persistent", // persistent | oneshot
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

- `id`: ID เอเจนต์ที่คงที่ (จำเป็น)
- `default`: เมื่อตั้งค่าหลายรายการ รายการแรกจะมีผล (มีการบันทึกคำเตือน) หากไม่ได้ตั้งค่า รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงกำหนดโมเดลหลักเฉพาะเอเจนต์แบบเคร่งครัดโดยไม่มีโมเดลสำรอง ส่วนรูปแบบอ็อบเจ็กต์ `{ primary }` ก็เคร่งครัดเช่นกัน เว้นแต่จะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่ออนุญาตให้เอเจนต์นั้นใช้โมเดลสำรอง หรือใช้ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเคร่งครัดอย่างชัดเจน งาน Cron ที่แทนที่เฉพาะ `primary` จะยังสืบทอดโมเดลสำรองเริ่มต้น เว้นแต่จะตั้งค่า `fallbacks: []`
- `utilityModel`: การแทนที่สำหรับแต่ละเอเจนต์ที่เป็นทางเลือกสำหรับงานภายในระยะสั้น เช่น ชื่อเซสชันและเธรดที่สร้างขึ้น โดยจะถอยไปใช้ `agents.defaults.utilityModel` จากนั้นใช้ค่าเริ่มต้นของโมเดลขนาดเล็กที่ผู้ให้บริการหลักประกาศไว้ แล้วจึงใช้โมเดลหลักของเอเจนต์นี้ สตริงว่างจะปิดใช้งานการกำหนดเส้นทางยูทิลิตีสำหรับเอเจนต์นี้
- `params`: พารามิเตอร์สตรีมสำหรับแต่ละเอเจนต์ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับการแทนที่เฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: การแทนที่การอ่านออกเสียงข้อความสำหรับแต่ละเอเจนต์ที่เป็นทางเลือก บล็อกนี้จะผสานแบบลึกทับ `messages.tts` ดังนั้นให้เก็บข้อมูลรับรองของผู้ให้บริการที่ใช้ร่วมกันและนโยบายสำรองไว้ใน `messages.tts` และตั้งค่าเฉพาะค่าของบุคลิก เช่น ผู้ให้บริการ เสียง โมเดล สไตล์ หรือโหมดอัตโนมัติไว้ที่นี่
- `skills`: รายการอนุญาต Skills สำหรับแต่ละเอเจนต์ที่เป็นทางเลือก หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อตั้งค่าไว้ รายการที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นแทนการผสาน และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดเริ่มต้นสำหรับแต่ละเอเจนต์ที่เป็นทางเลือก (`off | minimal | low | medium | high | xhigh | adaptive | max`) แทนที่ `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการแทนที่ระดับข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกเป็นตัวกำหนดว่าค่าใดใช้ได้ สำหรับ Google Gemini ค่า `adaptive` จะคงการคิดแบบไดนามิกที่ผู้ให้บริการควบคุมไว้ (`thinkingLevel` ถูกละไว้ใน Gemini 3/3.1 และ `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การแสดงผลการให้เหตุผลเริ่มต้นสำหรับแต่ละเอเจนต์ที่เป็นทางเลือก (`on | off | stream`) แทนที่ `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่มีการแทนที่การให้เหตุผลระดับข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นของโหมดเร็วสำหรับแต่ละเอเจนต์ที่เป็นทางเลือก (`"auto" | true | false`) มีผลเมื่อไม่มีการแทนที่โหมดเร็วระดับข้อความหรือเซสชัน
- `models`: การแทนที่แค็ตตาล็อกโมเดล/รันไทม์สำหรับแต่ละเอเจนต์ที่เป็นทางเลือก โดยใช้ ID `provider/model` แบบเต็มเป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้นรันไทม์ของแต่ละเอเจนต์
- `runtime`: ตัวอธิบายรันไทม์สำหรับแต่ละเอเจนต์ที่เป็นทางเลือก ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชันชุดควบคุม ACP เป็นค่าเริ่มต้น
- `identity.avatar`: พาธที่สัมพันธ์กับเวิร์กสเปซ, URL `http(s)` หรือ URI `data:`
- ไฟล์รูปภาพ `identity.avatar` ภายในเครื่องที่มีพาธสัมพันธ์กับเวิร์กสเปซถูกจำกัดไว้ที่ 2 MB ส่วน URL `http(s)` และ URI `data:` จะไม่ถูกตรวจสอบกับขีดจำกัดขนาดไฟล์ภายในเครื่อง
- `identity` สร้างค่าเริ่มต้นดังนี้: `ackReaction` จาก `emoji` และ `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: รายการอนุญาตของ ID เอเจนต์ที่กำหนดค่าไว้สำหรับเป้าหมาย `sessions_spawn.agentId` แบบชัดเจน (`["*"]` = เป้าหมายที่กำหนดค่าไว้ใดก็ได้; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) รวม ID ของผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายเป็นตนเอง รายการเก่าที่ลบการกำหนดค่าเอเจนต์ไปแล้วจะถูก `sessions_spawn` ปฏิเสธและละออกจาก `agents_list` ให้เรียกใช้ `openclaw doctor --fix` เพื่อล้างรายการเหล่านั้น หรือเพิ่มรายการ `agents.list[]` ขั้นต่ำ หากเป้าหมายนั้นควรยังคงสร้างได้พร้อมสืบทอดค่าเริ่มต้น
- ตัวป้องกันการสืบทอด Sandbox: หากเซสชันของผู้ร้องขอทำงานใน Sandbox แล้ว `sessions_spawn` จะปฏิเสธเป้าหมายที่จะทำงานนอก Sandbox
- `subagents.requireAgentId`: เมื่อเป็น true ให้บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)
- `subagents.maxConcurrent`: จำนวนการทำงานพร้อมกันสูงสุดของเอเจนต์ลูกทั้งหมดในการเรียกใช้เอเจนต์ย่อย ค่าเริ่มต้น: `8`
- `subagents.maxChildrenPerAgent`: จำนวนเอเจนต์ลูกที่ทำงานอยู่สูงสุดซึ่งเซสชันเอเจนต์เดียวสามารถสร้างได้ ค่าเริ่มต้น: `5`
- `subagents.maxSpawnDepth`: ความลึกสูงสุดของการซ้อนสำหรับการสร้างเอเจนต์ย่อย (`1`-`5`) ค่าเริ่มต้น: `1` (ไม่มีการซ้อน)
- `subagents.archiveAfterMinutes`: ระยะเวลาก่อนเก็บสถานะเอเจนต์ย่อยที่เสร็จสมบูรณ์เข้าคลัง ค่าเริ่มต้น: `60`

---

## การกำหนดเส้นทางแบบหลายเอเจนต์

เรียกใช้เอเจนต์ที่แยกจากกันหลายตัวภายใน Gateway เดียว ดู [หลายเอเจนต์](/th/concepts/multi-agent)

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

### ฟิลด์จับคู่การเชื่อมโยง

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มีชนิด ค่าเริ่มต้นคือ route), `acp` สำหรับการเชื่อมโยงบทสนทนา ACP แบบถาวร
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; หากละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะแต่ละช่องทาง)
- `acp` (ไม่บังคับ; เฉพาะสำหรับ `type: "acp"`): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันทุกประการ ไม่มีเพียร์/กิลด์/ทีม)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะมีผล

สำหรับรายการ `type: "acp"` OpenClaw จะจับคู่ด้วยข้อมูลประจำตัวบทสนทนาที่ตรงกันทุกประการ (`match.channel` + บัญชี + `match.peer.id`) และไม่ใช้ลำดับระดับการเชื่อมโยงเส้นทางข้างต้น

### โปรไฟล์การเข้าถึงสำหรับแต่ละเอเจนต์

<Accordion title="การเข้าถึงเต็มรูปแบบ (ไม่มี Sandbox)">

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

<Accordion title="เครื่องมือและเวิร์กสเปซแบบอ่านอย่างเดียว">

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

<Accordion title="ไม่มีสิทธิ์เข้าถึงระบบไฟล์ (ส่งข้อความเท่านั้น)">

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
    resetByChannel: {
      discord: { mode: "idle", idleMinutes: 30 },
    },
    resetTriggers: ["/new", "/reset"],
    store: "~/.openclaw/agents/{agentId}/sessions/sessions.json",
    maintenance: {
      mode: "enforce", // enforce (ค่าเริ่มต้น) | warn
      pruneAfter: "30d",
      maxEntries: 500,
      resetArchiveRetention: "30d", // ระยะเวลาหรือ false
      maxDiskBytes: "500mb", // งบประมาณสูงสุดแบบบังคับที่เป็นทางเลือก
      highWaterBytes: "400mb", // เป้าหมายการล้างข้อมูลที่เป็นทางเลือก
    },
    writeLock: {
      acquireTimeoutMs: 60000,
      staleMs: 1800000,
      maxHoldMs: 300000,
    },
    threadBindings: {
      enabled: true,
      idleHours: 24, // เลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานตามค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
      maxAgeHours: 0, // อายุสูงสุดแบบบังคับตามค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน)
    },
    mainKey: "main", // แบบเดิม (รันไทม์ใช้ "main" เสมอ)
    agentToAgent: { maxPingPongTurns: 5 },
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์เซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายจะได้รับเซสชันแยกต่างหากภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อต้องการบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่มข้อความส่วนตัว
  - `main`: ข้อความส่วนตัวทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตามรหัสผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความที่มีผู้ใช้หลายราย)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับการใช้งานหลายบัญชี)
- **`identityLinks`**: จับคู่รหัสมาตรฐานกับเพียร์ที่มีคำนำหน้าผู้ให้บริการเพื่อใช้เซสชันร่วมกันข้ามช่องทาง คำสั่งเชื่อมช่องทาง เช่น `/dock_discord` ใช้การจับคู่เดียวกันเพื่อเปลี่ยนเส้นทางการตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ของช่องทางอื่นที่เชื่อมโยงกัน โปรดดู[การเชื่อมช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `daily` จะรีเซ็ตเมื่อถึงเวลา `atHour` ตามเวลาท้องถิ่น ส่วน `idle` จะรีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองอย่าง ค่าที่หมดอายุก่อนจะมีผล ความใหม่สำหรับการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความใหม่สำหรับการรีเซ็ตเมื่อไม่มีการใช้งานใช้ `lastInteractionAt` การเขียนจากเหตุการณ์เบื้องหลัง/ระบบ เช่น Heartbeat, การปลุกโดย Cron, การแจ้งเตือนการดำเนินการ และการทำบัญชีของ Gateway อาจอัปเดต `updatedAt` แต่จะไม่ทำให้เซสชันรายวันหรือเซสชันที่ไม่มีการใช้งานยังคงใหม่อยู่
- **`resetByType`**: การแทนที่ตามประเภท (`direct`, `group`, `thread`) ยอมรับ `dm` แบบเดิมเป็นชื่อแทนของ `direct`
- **`resetByChannel`**: การแทนที่การรีเซ็ตตามช่องทาง โดยใช้รหัสผู้ให้บริการ/ช่องทางเป็นคีย์ เมื่อช่องทางของเซสชันมีรายการที่ตรงกัน ค่านั้นจะมีผลเหนือ `resetByType`/`reset` สำหรับเซสชันนั้นโดยสมบูรณ์ ใช้เฉพาะเมื่อช่องทางหนึ่งต้องการลักษณะการรีเซ็ตที่แตกต่างจากนโยบายระดับประเภท
- **`mainKey`**: ฟิลด์แบบเดิม รันไทม์จะใช้ `"main"` สำหรับบักเก็ตแชตโดยตรงหลักเสมอ
- **`agentToAgent.maxPingPongTurns`**: จำนวนรอบตอบกลับสูงสุดระหว่างเอเจนต์ในการสื่อสารระหว่างเอเจนต์ (จำนวนเต็ม ช่วง: `0`-`20` ค่าเริ่มต้น: `5`) `0` จะปิดใช้งานการเชื่อมต่อแบบโต้ตอบไปมา
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` โดยมี `dm` แบบเดิมเป็นชื่อแทน), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธรายการแรกจะมีผล
- **`maintenance`**: ตัวควบคุมการล้างข้อมูลและการเก็บรักษาสำหรับที่เก็บเซสชัน
  - `mode`: `enforce` จะดำเนินการล้างข้อมูลและเป็นค่าเริ่มต้น ส่วน `warn` จะแสดงเฉพาะคำเตือน
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ล้าสมัย (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนรายการเซสชัน SQLite สูงสุด (ค่าเริ่มต้น `500`) การเขียนของรันไทม์จะล้างข้อมูลเป็นชุดโดยมีบัฟเฟอร์ขีดจำกัดสูงขนาดเล็กสำหรับเพดานที่รองรับระดับการใช้งานจริง ส่วน `openclaw sessions cleanup --enforce` จะบังคับใช้เพดานทันที
  - เซสชันตรวจสอบการรันโมเดลของ Gateway ที่มีอายุสั้นใช้ระยะเวลาการเก็บรักษาคงที่ `24h` แต่การล้างข้อมูลจะเกิดขึ้นเฉพาะเมื่อมีแรงกดดัน กล่าวคือจะลบแถวตรวจสอบการรันโมเดลแบบเข้มงวดที่ล้าสมัยเฉพาะเมื่อถึงจุดที่ต้องบำรุงรักษารายการเซสชันหรือมีแรงกดดันจากเพดานเท่านั้น เฉพาะคีย์ตรวจสอบที่ระบุชัดเจนแบบเข้มงวดซึ่งตรงกับ `agent:*:explicit:model-run-<uuid>` เท่านั้นที่เข้าเกณฑ์ เซสชันโดยตรง กลุ่ม เธรด Cron ฮุก Heartbeat ACP และเอเจนต์ย่อยตามปกติจะไม่สืบทอดระยะเวลาการเก็บรักษา 24h นี้ เมื่อการล้างข้อมูลการรันโมเดลทำงาน ระบบจะดำเนินการก่อนการล้างรายการล้าสมัยแบบกว้างตาม `pruneAfter` และเพดาน `maxEntries`
  - สคีมาปัจจุบันปฏิเสธ `rotateBytes` แบบเดิม โดย `openclaw doctor --fix` จะนำค่านี้ออกจากการกำหนดค่ารุ่นเก่า
  - `resetArchiveRetention`: การเก็บรักษาตามอายุสำหรับไฟล์เก็บถาวรของบทสนทนาที่รีเซ็ต/ลบแล้ว โดยค่าเริ่มต้น ไฟล์เก็บถาวรจะยังคงอยู่จนกว่าจะถูกขับออกเนื่องจากงบประมาณดิสก์ กำหนดระยะเวลาเพื่อเลือกใช้การลบตามเวลาจริง หรือใช้ `false` เพื่อปิดใช้งานอย่างชัดเจน
  - `maxDiskBytes`: งบประมาณดิสก์ที่เลือกกำหนดได้สำหรับไดเรกทอรีเซสชัน ในโหมด `warn` ระบบจะบันทึกคำเตือน ส่วนในโหมด `enforce` ระบบจะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายที่เลือกกำหนดได้หลังการล้างตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`writeLock`**: ตัวควบคุมล็อกการเขียนบทสนทนาของเซสชัน ปรับแต่งเฉพาะเมื่องานเตรียมบทสนทนา การล้างข้อมูล Compaction หรือการทำมิเรอร์ที่ถูกต้องแย่งใช้ทรัพยากรกันนานกว่านโยบายเริ่มต้น
  - `acquireTimeoutMs`: จำนวนมิลลิวินาทีที่รอขณะรับล็อก ก่อนรายงานว่าเซสชันไม่ว่าง ค่าเริ่มต้น: `60000`; การแทนที่ด้วยตัวแปรสภาพแวดล้อม `OPENCLAW_SESSION_WRITE_LOCK_ACQUIRE_TIMEOUT_MS`
  - `staleMs`: จำนวนมิลลิวินาทีก่อนถือว่าล็อกที่มีอยู่ล้าสมัยและเรียกคืน ค่าเริ่มต้น: `1800000`; การแทนที่ด้วยตัวแปรสภาพแวดล้อม `OPENCLAW_SESSION_WRITE_LOCK_STALE_MS`
  - `maxHoldMs`: จำนวนมิลลิวินาทีที่ล็อกภายในกระบวนการซึ่งถูกยึดไว้อาจคงอยู่ ก่อนที่ตัวเฝ้าระวังจะปล่อยล็อก ค่าเริ่มต้น: `300000`; การแทนที่ด้วยตัวแปรสภาพแวดล้อม `OPENCLAW_SESSION_WRITE_LOCK_MAX_HOLD_MS`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับคุณลักษณะเซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์เริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้ Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: การยกเลิกโฟกัสอัตโนมัติเมื่อไม่มีการใช้งานโดยค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวโดยค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดใช้งาน ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เกตเริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการสร้างเธรด ACP ค่าเริ่มต้นคือ `true` เมื่อเปิดใช้การผูกเธรด ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบทเอเจนต์ย่อยแบบเนทีฟเริ่มต้นสำหรับการสร้างที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

</Accordion>

---

## ข้อความ

```json5
{
  messages: {
    responsePrefix: "🦞", // หรือ "auto"
    ackReaction: "👀",
    ackReactionScope: "group-mentions", // group-mentions | group-all | direct | all | off | none
    removeAckAfterReply: false,
    queue: {
      mode: "steer", // steer (ค่าเริ่มต้น) | followup | collect | interrupt
      debounceMs: 500,
      cap: 20,
      drop: "summarize", // old | new | summarize (ค่าเริ่มต้น)
      byChannel: {
        whatsapp: "followup",
        telegram: "followup",
      },
    },
    inbound: {
      debounceMs: 2000, // 0 ปิดใช้งาน
      byChannel: {
        whatsapp: 5000,
        slack: 1500,
      },
    },
  },
}
```

### คำนำหน้าการตอบกลับ

การแทนที่ตามช่องทาง/บัญชี: `channels.<channel>.responsePrefix`, `channels.<channel>.accounts.<id>.responsePrefix`

ลำดับการตัดสินค่า (ค่าที่เฉพาะเจาะจงที่สุดมีผล): บัญชี → ช่องทาง → ส่วนกลาง `""` จะปิดใช้งานและหยุดการไล่ระดับ `"auto"` จะอนุมาน `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร          | คำอธิบาย            | ตัวอย่าง                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อโมเดลแบบสั้น       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม  | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ          | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์ของเอเจนต์    | (เหมือนกับ `"auto"`)          |

ตัวแปรไม่คำนึงถึงตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ `{think}` เป็นชื่อแทนของ `{thinkingLevel}`

### รีแอ็กชันตอบรับ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ หรือใช้ `"👀"` หากไม่มี กำหนด `""` เพื่อปิดใช้งาน
- การแทนที่ตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการตัดสินค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่าสำรองจากอัตลักษณ์
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all` หรือ `off`/`none` (ปิดใช้งานรีแอ็กชันตอบรับทั้งหมด)
- `removeAckAfterReply`: นำรีแอ็กชันตอบรับออกหลังตอบกลับในช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Signal, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้งานรีแอ็กชันสถานะวงจรชีวิตบน Slack, Discord, Signal, Telegram และ WhatsApp
  บน Discord การไม่กำหนดค่าจะยังคงเปิดใช้รีแอ็กชันสถานะเมื่อรีแอ็กชันตอบรับทำงานอยู่
  บน Slack, Signal, Telegram และ WhatsApp ต้องกำหนดค่านี้เป็น `true` อย่างชัดเจนเพื่อเปิดใช้รีแอ็กชันสถานะวงจรชีวิต
  โดยค่าเริ่มต้น Slack ใช้สถานะเธรดผู้ช่วยแบบเนทีฟและข้อความกำลังโหลดที่หมุนเวียนเพื่อแสดงความคืบหน้า พร้อมคงรีแอ็กชันตอบรับที่กำหนดค่าไว้ให้คงที่
- `messages.statusReactions.emojis`: แทนที่คีย์อีโมจิของวงจรชีวิต:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` และ `stallHard`
  Telegram อนุญาตเฉพาะชุดรีแอ็กชันที่กำหนดไว้ ดังนั้นอีโมจิที่กำหนดค่าแต่ไม่รองรับจะย้อนกลับ
  ไปใช้รูปแบบสถานะที่รองรับซึ่งใกล้เคียงที่สุดสำหรับแชตนั้น

### คิว

- `mode`: กลยุทธ์คิวสำหรับข้อความขาเข้าที่มาถึงขณะการรันเซสชันยังทำงานอยู่ ค่าเริ่มต้น: `"steer"`
  - `steer`: แทรกพรอมต์ใหม่ลงในการรันที่ใช้งานอยู่
  - `followup`: รันพรอมต์ใหม่หลังจากการรันที่ใช้งานอยู่เสร็จสิ้น
  - `collect`: จัดข้อความที่เข้ากันได้เป็นชุดและรันร่วมกันภายหลัง
  - `interrupt`: ยกเลิกการรันที่ใช้งานอยู่ก่อนเริ่มพรอมต์ล่าสุด
- `debounceMs`: ระยะหน่วงก่อนส่งข้อความที่เข้าคิว/ถูกกำกับ ค่าเริ่มต้น: `500`
- `cap`: จำนวนข้อความในคิวสูงสุดก่อนใช้นโยบายทิ้ง ค่าเริ่มต้น: `20`
- `drop`: กลยุทธ์เมื่อเกินเพดาน `"summarize"` (ค่าเริ่มต้น) จะทิ้งรายการที่เก่าที่สุดแต่เก็บสรุปแบบย่อไว้ `"old"` จะทิ้งรายการที่เก่าที่สุดโดยไม่มีสรุป ส่วน `"new"` จะปฏิเสธรายการใหม่ล่าสุด
- `byChannel`: การแทนที่ `mode` ตามช่องทาง โดยใช้รหัสผู้ให้บริการเป็นคีย์
- `debounceMsByChannel`: การแทนที่ `debounceMs` ตามช่องทาง โดยใช้รหัสผู้ให้บริการเป็นคีย์

### การหน่วงรวมข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งติดกันอย่างรวดเร็วจากผู้ส่งรายเดียวกันเป็นรอบเอเจนต์เดียว สื่อ/ไฟล์แนบจะบังคับส่งทันที คำสั่งควบคุมจะข้ามการหน่วงรวม ค่าเริ่มต้น `debounceMs`: `2000`

### คีย์ข้อความอื่นๆ

- `messages.messagePrefix`: ข้อความคำนำหน้าที่เติมไว้หน้าข้อความผู้ใช้ขาเข้าก่อนส่งถึงรันไทม์ของเอเจนต์ ใช้เท่าที่จำเป็นสำหรับเครื่องหมายบริบทของช่องทาง
- `messages.visibleReplies`: ควบคุมการตอบกลับต้นทางที่มองเห็นได้ในบทสนทนาโดยตรง กลุ่ม และช่องทาง (`"message_tool"` ต้องใช้ `message(action=send)` เพื่อให้มีเอาต์พุตที่มองเห็นได้ ส่วน `"automatic"` จะโพสต์คำตอบตามปกติเช่นเดิม)
- `messages.usageTemplate` / `messages.responseUsage`: เทมเพลตส่วนท้าย `/usage` แบบกำหนดเองและโหมดการใช้งานเริ่มต้นต่อคำตอบ (`off | tokens | full` รวมถึง `on` แบบเดิมซึ่งเป็นชื่อแทนของ `tokens`)
- `messages.groupChat.mentionPatterns` / `historyLimit`: ทริกเกอร์การกล่าวถึงในข้อความกลุ่มและการกำหนดขนาดหน้าต่างประวัติ
- `messages.suppressToolErrors`: เมื่อเป็น `true` จะระงับคำเตือนข้อผิดพลาดของเครื่องมือ `⚠️` ที่แสดงต่อผู้ใช้ (เอเจนต์ยังคงเห็นข้อผิดพลาดในบริบทและลองใหม่ได้) ค่าเริ่มต้น: `false`

### TTS (การแปลงข้อความเป็นเสียง)

```json5
{
  messages: {
    tts: {
      auto: "off", // off (ค่าเริ่มต้น) | always | inbound | tagged
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
          speakerVoice: "en-US-MichelleNeural",
          lang: "en-US",
          outputFormat: "audio-24khz-48kbitrate-mono-mp3",
        },
        openai: {
          apiKey: "openai_api_key",
          baseUrl: "https://api.openai.com/v1",
          model: "gpt-4o-mini-tts",
          speakerVoice: "coral",
        },
      },
    },
  },
}
```

- `auto` ควบคุมโหมด TTS อัตโนมัติเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` โดย `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่องได้ และ `/tts status` จะแสดงสถานะที่มีผลใช้งานจริง
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานโดยค่าเริ่มต้น (`enabled !== false`); ส่วน `modelOverrides.allowProvider` ต้องเลือกเปิดใช้งาน
- คีย์ API จะใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY` เป็นค่าทดแทน
- ผู้ให้บริการเสียงพูดที่รวมมาให้เป็นกรรมสิทธิ์ของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ของผู้ให้บริการ TTS แต่ละรายที่ต้องการใช้ เช่น `microsoft` สำหรับ Edge TTS โดยยอมรับรหัสผู้ให้บริการเดิม `edge` เป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง TTS ของ OpenAI ลำดับการเลือกใช้คือการกำหนดค่า จากนั้น `OPENAI_TTS_BASE_URL` แล้วจึง `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI ระบบ OpenClaw จะถือว่าปลายทางนั้นเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

---

## การสนทนา

ค่าเริ่มต้นสำหรับโหมดการสนทนา (macOS/iOS/Android และ Control UI บนเบราว์เซอร์)

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
        modelId: "eleven_multilingual_v2",
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
          model: "gpt-realtime-2.1",
          speakerVoice: "cedar",
        },
      },
      instructions: "พูดด้วยน้ำเสียงอบอุ่นและตอบให้กระชับ",
      mode: "realtime", // realtime | stt-tts | transcription
      transport: "webrtc", // webrtc | provider-websocket | gateway-relay | managed-room
      vadThreshold: 0.5,
      silenceDurationMs: 500,
      prefixPaddingMs: 300,
      reasoningEffort: "medium",
      brain: "agent-consult", // agent-consult | direct-tools | none
    },
  },
}
```

- `talk.provider` ต้องตรงกับคีย์ใน `talk.providers` เมื่อกำหนดค่าผู้ให้บริการการสนทนาหลายราย
- คีย์การสนทนาแบบแบนรุ่นเก่า (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้อีกครั้งให้อยู่ในรูปแบบ `talk.providers.<provider>`
- รหัสเสียงจะใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID` เป็นค่าทดแทน (ลักษณะการทำงานของไคลเอนต์การสนทนาบน macOS)
- `providers.*.apiKey` รองรับสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- ค่าทดแทน `ELEVENLABS_API_KEY` จะมีผลเฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับการสนทนา
- `providers.*.voiceAliases` ช่วยให้คำสั่งการสนทนาใช้ชื่อที่เข้าใจง่ายได้
- `providers.mlx.modelId` เลือกรีโพซิทอรี Hugging Face ที่ตัวช่วย MLX ภายในเครื่องบน macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS จะทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาให้เมื่อมีอยู่ หรือผ่านไฟล์ปฏิบัติการใน `PATH`; ส่วน `OPENCLAW_MLX_TTS_BIN` จะแทนที่พาธของตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการเรียกใช้เอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบเรียลไทม์ของการสนทนาใน Control UI หากไม่ตั้งค่า จะคงลักษณะการทำงานปกติของเซสชัน/โมเดลไว้
- `consultFastMode` ตั้งค่าการแทนที่โหมดเร็วแบบใช้ครั้งเดียวสำหรับการปรึกษาแบบเรียลไทม์ของการสนทนาใน Control UI โดยไม่เปลี่ยนการตั้งค่าโหมดเร็วปกติของเซสชัน
- `speechLocale` ตั้งค่ารหัสภาษาตามมาตรฐาน BCP 47 ที่การรู้จำเสียงพูดของการสนทนาบน iOS/macOS ใช้ หากไม่ตั้งค่า จะใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดการสนทนารอหลังจากผู้ใช้เงียบก่อนส่งข้อความถอดเสียง หากไม่ตั้งค่า จะคงช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์มไว้ (`700 ms on macOS and Android, 900 ms on iOS`)
- `realtime.instructions` เพิ่มคำสั่งระบบที่ส่งไปยังผู้ให้บริการต่อท้ายพรอมต์เรียลไทม์ในตัวของ OpenClaw เพื่อให้กำหนดค่ารูปแบบเสียงได้โดยไม่สูญเสียแนวทางเริ่มต้น `openclaw_agent_consult`
- `realtime.vadThreshold` ตั้งค่าเกณฑ์กิจกรรมเสียงของผู้ให้บริการตั้งแต่ `0` (ไวที่สุด) ถึง `1` (ไวน้อยที่สุด) หากไม่ตั้งค่า จะคงค่าเริ่มต้นของผู้ให้บริการไว้
- `realtime.silenceDurationMs` ตั้งค่าช่วงความเงียบเป็นจำนวนเต็มบวกก่อนที่ผู้ให้บริการจะยืนยันรอบการพูดของผู้ใช้แบบเรียลไทม์ หากไม่ตั้งค่า จะคงค่าเริ่มต้นของผู้ให้บริการไว้
- `realtime.prefixPaddingMs` ตั้งค่าปริมาณเสียงเป็นจำนวนเต็มที่ไม่ติดลบซึ่งเก็บไว้ก่อนเริ่มตรวจพบเสียงพูด หากไม่ตั้งค่า จะคงค่าเริ่มต้นของผู้ให้บริการไว้
- `realtime.reasoningEffort` ตั้งค่าระดับการใช้เหตุผลเฉพาะผู้ให้บริการสำหรับเซสชันแบบเรียลไทม์ หากไม่ตั้งค่า จะคงค่าเริ่มต้นของผู้ให้บริการไว้
- `realtime.consultRouting`: `"provider-direct"` (ค่าเริ่มต้น) จะคงการตอบกลับโดยตรงจากผู้ให้บริการไว้ เมื่อผู้ให้บริการแบบเรียลไทม์สร้างข้อความถอดเสียงสุดท้ายของผู้ใช้โดยไม่มี `openclaw_agent_consult` ส่วน `"force-agent-consult"` จะส่งคำขอที่เสร็จสมบูรณ์ผ่าน OpenClaw แทน

---

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์การกำหนดค่าอื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
