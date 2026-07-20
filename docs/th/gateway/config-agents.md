---
read_when:
    - การปรับแต่งค่าเริ่มต้นของเอเจนต์ (โมเดล การคิด เวิร์กสเปซ Heartbeat สื่อ Skills)
    - การกำหนดค่าการกำหนดเส้นทางและการผูกสำหรับหลายเอเจนต์
    - การปรับลักษณะการทำงานของเซสชัน การส่งข้อความ และโหมดสนทนา
summary: ค่าเริ่มต้นของเอเจนต์ การกำหนดเส้นทางแบบหลายเอเจนต์ เซสชัน ข้อความ และการกำหนดค่าการพูดคุย
title: การกำหนดค่า — เอเจนต์
x-i18n:
    generated_at: "2026-07-20T15:59:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: b42bd47b953d5e970a125df8250f76ae70891fc5bd12fee3120f03365b5af597
    source_path: gateway/config-agents.md
    workflow: 16
---

คีย์การกำหนดค่าที่มีขอบเขตระดับเอเจนต์ภายใต้ `agents.*`, `multiAgent.*`, `session.*`,
`messages.*` และ `talk.*` สำหรับช่องทาง เครื่องมือ รันไทม์ Gateway และคีย์ระดับบนสุดอื่นๆ
โปรดดู [เอกสารอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference)

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
ไปยังพื้นที่ทำงานที่เมานต์ไว้ เมื่อไม่ต้องการเขียนพาธนั้นลงในการกำหนดค่า

### `agents.defaults.repoRoot`

รูทของรีโพซิทอรีที่เลือกกำหนดได้ ซึ่งจะแสดงในบรรทัด Runtime ของพรอมต์ระบบ หากไม่ได้ตั้งค่า OpenClaw จะตรวจหาโดยอัตโนมัติด้วยการไล่ขึ้นจากพื้นที่ทำงาน

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

- ละเว้น `agents.defaults.skills` เพื่ออนุญาต Skills โดยไม่จำกัดเป็นค่าเริ่มต้น
- ละเว้น `agents.list[].skills` เพื่อสืบทอดค่าเริ่มต้น
- ตั้งค่า `agents.list[].skills: []` เพื่อไม่ใช้ Skills
- รายการ `agents.list[].skills` ที่ไม่ว่างคือชุดสุดท้ายสำหรับเอเจนต์นั้น โดย
  จะไม่ผสานกับค่าเริ่มต้น

### `agents.defaults.skipBootstrap`

ปิดใช้งานการสร้างไฟล์บูตสแตรปของพื้นที่ทำงานโดยอัตโนมัติ (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`)

```json5
{
  agents: { defaults: { skipBootstrap: true } },
}
```

### `agents.defaults.skipOptionalBootstrapFiles`

ข้ามการสร้างไฟล์พื้นที่ทำงานเสริมที่เลือกไว้ โดยยังคงเขียนไฟล์บูตสแตรปที่จำเป็น (`AGENTS.md`, `TOOLS.md`, `BOOTSTRAP.md`) ค่าที่ใช้ได้: `SOUL.md`, `USER.md`, `HEARTBEAT.md` และ `IDENTITY.md`

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

ควบคุมเวลาที่จะแทรกไฟล์บูตสแตรปของพื้นที่ทำงานลงในพรอมต์ระบบ ค่าเริ่มต้น: `"always"`

- `"continuation-skip"`: เทิร์นการดำเนินการต่อที่ปลอดภัย (หลังการตอบกลับของผู้ช่วยเสร็จสมบูรณ์) จะข้ามการแทรกบูตสแตรปของพื้นที่ทำงานซ้ำ ซึ่งช่วยลดขนาดพรอมต์ การทำงานของ Heartbeat และการลองใหม่หลัง Compaction ยังคงสร้างบริบทใหม่
- `"never"`: ปิดใช้งานการแทรกบูตสแตรปของพื้นที่ทำงานและไฟล์บริบทในทุกเทิร์น ใช้ตัวเลือกนี้เฉพาะกับเอเจนต์ที่ควบคุมวงจรชีวิตพรอมต์ของตนเองทั้งหมด (กลไกบริบทแบบกำหนดเอง รันไทม์เนทีฟที่สร้างบริบทของตนเอง หรือเวิร์กโฟลว์เฉพาะทางที่ไม่ใช้บูตสแตรป) เทิร์น Heartbeat และเทิร์นกู้คืนจาก Compaction จะข้ามการแทรกด้วย

```json5
{
  agents: { defaults: { contextInjection: "continuation-skip" } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].contextInjection` ค่าที่ละเว้นจะสืบทอด
`agents.defaults.contextInjection`

### `agents.defaults.bootstrapMaxChars`

จำนวนอักขระสูงสุดต่อไฟล์บูตสแตรปของพื้นที่ทำงานก่อนตัดทอน ค่าเริ่มต้น: `20000`

```json5
{
  agents: { defaults: { bootstrapMaxChars: 20000 } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].bootstrapMaxChars` ค่าที่ละเว้นจะสืบทอด
`agents.defaults.bootstrapMaxChars`

### `agents.defaults.bootstrapTotalMaxChars`

จำนวนอักขระรวมสูงสุดที่แทรกจากไฟล์บูตสแตรปของพื้นที่ทำงานทั้งหมด ค่าเริ่มต้น: `60000`

```json5
{
  agents: { defaults: { bootstrapTotalMaxChars: 60000 } },
}
```

การแทนที่ต่อเอเจนต์: `agents.list[].bootstrapTotalMaxChars` ค่าที่ละเว้น
จะสืบทอด `agents.defaults.bootstrapTotalMaxChars`

### การแทนที่โปรไฟล์บูตสแตรปต่อเอเจนต์

ใช้การแทนที่โปรไฟล์บูตสแตรปต่อเอเจนต์เมื่อเอเจนต์หนึ่งต้องการพฤติกรรม
การแทรกพรอมต์ที่แตกต่างจากค่าเริ่มต้นร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอดจาก
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

ควบคุมข้อความแจ้งในพรอมต์ระบบที่เอเจนต์มองเห็นเมื่อบริบทบูตสแตรปถูกตัดทอน
ค่าเริ่มต้น: `"always"`

- `"off"`: ไม่แทรกข้อความแจ้งการตัดทอนลงในพรอมต์ระบบ
- `"once"`: แทรกข้อความแจ้งแบบกระชับหนึ่งครั้งต่อลายเซ็นการตัดทอนที่ไม่ซ้ำกัน
- `"always"`: แทรกข้อความแจ้งแบบกระชับทุกครั้งที่ทำงานเมื่อมีการตัดทอน (แนะนำ)

จำนวนดิบ/จำนวนที่แทรกโดยละเอียดและฟิลด์สำหรับปรับแต่งการกำหนดค่าจะยังคงอยู่ในการวินิจฉัย เช่น
รายงานบริบท/สถานะและบันทึก ส่วนบริบทผู้ใช้/รันไทม์ WebChat ตามปกติจะได้รับ
เฉพาะข้อความแจ้งการกู้คืนแบบกระชับ

```json5
{
  agents: { defaults: { bootstrapPromptTruncationWarning: "always" } }, // ปิด | หนึ่งครั้ง | ทุกครั้ง
}
```

### แผนผังความเป็นเจ้าของงบประมาณบริบท

OpenClaw มีงบประมาณพรอมต์/บริบทปริมาณสูงหลายรายการ และมีการ
แยกตามระบบย่อยโดยเจตนา แทนที่จะให้ทั้งหมดไหลผ่าน
ตัวควบคุมทั่วไปเพียงตัวเดียว

| งบประมาณ                                                         | ครอบคลุม                                                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `agents.defaults.bootstrapMaxChars` / `bootstrapTotalMaxChars` | การแทรกบูตสแตรปของพื้นที่ทำงานตามปกติ                                                                                                                            |
| `agents.defaults.startupContext.*`                             | คำนำการเรียกใช้โมเดลแบบครั้งเดียวสำหรับการรีเซ็ต/เริ่มต้นระบบ รวมถึงไฟล์ `memory/*.md` รายวันล่าสุด คำสั่งแชตเปล่า `/new` และ `/reset` จะได้รับการตอบรับโดยไม่เรียกใช้โมเดล |
| `skills.limits.*`                                              | รายการ Skills แบบกระชับที่แทรกลงในพรอมต์ระบบ                                                                                                         |
| `agents.defaults.contextLimits.*`                              | ข้อความตัดตอนของรันไทม์ที่จำกัดขนาดและบล็อกที่รันไทม์เป็นเจ้าของซึ่งถูกแทรก                                                                                                      |
| `memory.qmd.limits.*`                                          | การกำหนดขนาดส่วนย่อยและการแทรกสำหรับการค้นหาหน่วยความจำที่จัดทำดัชนี                                                                                                              |

การแทนที่ต่อเอเจนต์ที่สอดคล้องกัน:

- `agents.list[].skillsLimits.maxSkillsPromptChars`
- `agents.list[].contextInjection`
- `agents.list[].bootstrapMaxChars`
- `agents.list[].bootstrapTotalMaxChars`
- `agents.list[].contextLimits.*`

#### `agents.defaults.startupContext`

ควบคุมคำนำการเริ่มต้นระบบในเทิร์นแรกที่แทรกในการเรียกใช้โมเดลเมื่อรีเซ็ต/เริ่มต้นระบบ
คำสั่งแชตเปล่า `/new` และ `/reset` จะตอบรับการรีเซ็ตโดยไม่เรียกใช้
โมเดล จึงไม่โหลดคำนำนี้

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

ค่าเริ่มต้นร่วมกันสำหรับพื้นผิวบริบทของรันไทม์ที่จำกัดขนาด

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

- `memoryGetMaxChars`: ขีดจำกัดเริ่มต้นของข้อความตัดตอน `memory_get` ก่อนเพิ่มข้อมูลเมตา
  การตัดทอนและข้อความแจ้งการดำเนินการต่อ
- `memoryGetDefaultLines`: ช่วงบรรทัดเริ่มต้นของ `memory_get` เมื่อละเว้น
  `lines`
- `toolResultMaxChars`: เพดานผลลัพธ์เครื่องมือสดขั้นสูงที่ใช้กับผลลัพธ์
  ที่จัดเก็บถาวรและการกู้คืนเมื่อเกินขีดจำกัด ปล่อยไว้โดยไม่ตั้งค่าสำหรับขีดจำกัดอัตโนมัติตามบริบทโมเดล:
  `16000` อักขระเมื่อมีโทเค็นต่ำกว่า 100K, `32000` อักขระเมื่อมีโทเค็น 100K+ และ `64000`
  อักขระเมื่อมีโทเค็น 200K+ ยอมรับค่าที่ระบุอย่างชัดเจนได้สูงสุด `1000000` สำหรับ
  โมเดลบริบทยาว แต่ขีดจำกัดที่มีผลยังคงถูกจำกัดไว้ที่ประมาณ 30% ของ
  หน้าต่างบริบทโมเดล `openclaw doctor --deep` จะแสดงขีดจำกัดที่มีผล
  และ doctor จะเตือนเฉพาะเมื่อการแทนที่ที่ระบุอย่างชัดเจนล้าสมัยหรือไม่มีผล
- `postCompactionMaxChars`: ขีดจำกัดข้อความตัดตอน AGENTS.md ที่ใช้ระหว่างการแทรก
  การรีเฟรชหลัง Compaction

#### `agents.list[].contextLimits`

การแทนที่ต่อเอเจนต์สำหรับตัวควบคุม `contextLimits` ที่ใช้ร่วมกัน ฟิลด์ที่ละเว้นจะสืบทอด
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

ขีดจำกัดส่วนกลางสำหรับรายการ Skills แบบกระชับที่แทรกลงในพรอมต์ระบบ ขีดจำกัดนี้
ไม่มีผลต่อการอ่านไฟล์ `SKILL.md` ตามความต้องการ

```json5
{
  skills: { limits: { maxSkillsPromptChars: 18000 } },
}
```

#### `agents.list[].skillsLimits.maxSkillsPromptChars`

การแทนที่งบประมาณพรอมต์ Skills ต่อเอเจนต์

```json5
{
  agents: {
    list: [{ id: "tiny-local", skillsLimits: { maxSkillsPromptChars: 6000 } }],
  },
}
```

### `agents.defaults.imageMaxDimensionPx`

ขนาดพิกเซลสูงสุดสำหรับด้านที่ยาวที่สุดของรูปภาพในบล็อกรูปภาพจากทรานสคริปต์/เครื่องมือก่อนเรียกผู้ให้บริการ
ค่าเริ่มต้น: `1200`

ค่าที่ต่ำกว่ามักลดการใช้โทเค็นภาพและขนาดเพย์โหลดคำขอสำหรับการทำงานที่มีภาพหน้าจอจำนวนมาก
ค่าที่สูงกว่าจะคงรายละเอียดภาพไว้มากกว่า

```json5
{
  agents: { defaults: { imageMaxDimensionPx: 1200 } },
}
```

### `agents.defaults.imageQuality`

ค่ากำหนดการบีบอัด/รายละเอียดของเครื่องมือรูปภาพสำหรับรูปภาพที่โหลดจากพาธไฟล์ URL และการอ้างอิงสื่อ
ค่าเริ่มต้น: `auto`

OpenClaw ปรับลำดับขั้นการปรับขนาดตามโมเดลรูปภาพที่เลือก ตัวอย่างเช่น Claude Opus 4.8, OpenAI GPT-5.6 Sol, Qwen VL และโมเดลภาพ Llama 4 ที่โฮสต์ไว้สามารถใช้รูปภาพขนาดใหญ่กว่าพาธภาพรายละเอียดสูงรุ่นเก่า/ค่าเริ่มต้น ขณะที่เทิร์นที่มีหลายรูปภาพจะถูกบีบอัดอย่างเข้มข้นขึ้นในโหมด `auto` เพื่อควบคุมต้นทุนโทเค็นและเวลาแฝง

ค่า:

- `auto`: ปรับตามขีดจำกัดของโมเดลและจำนวนรูปภาพ
- `efficient`: เลือกใช้รูปภาพขนาดเล็กกว่าเพื่อลดการใช้โทเค็นและไบต์
- `balanced`: ใช้ลำดับขั้นมาตรฐานที่สมดุล
- `high`: รักษารายละเอียดเพิ่มเติมสำหรับภาพหน้าจอ แผนภาพ และรูปภาพเอกสาร

```json5
{
  agents: { defaults: { imageQuality: "auto" } },
}
```

### `agents.defaults.userTimezone`

เขตเวลาสำหรับบริบทของพรอมต์ระบบ (ไม่ใช่การประทับเวลาข้อความ) หากไม่มีจะใช้เขตเวลาของโฮสต์

```json5
{
  agents: { defaults: { userTimezone: "America/Chicago" } },
}
```

### `agents.defaults.timeFormat`

รูปแบบเวลาในพรอมต์ระบบ ค่าเริ่มต้น: `auto` (ค่ากำหนดของระบบปฏิบัติการ)

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
        fallbacks: ["google/gemini-3.1-flash-image"],
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

- `model`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - รูปแบบสตริงกำหนดเฉพาะโมเดลหลัก
  - รูปแบบอ็อบเจกต์กำหนดโมเดลหลักพร้อมโมเดลสำรองตามลำดับ
- `utilityModel`: การอ้างอิงหรือชื่อแทน `provider/model` ที่ไม่บังคับสำหรับงานภายในขนาดสั้น ปัจจุบันใช้สร้างชื่อเซสชันใน Control UI, ชื่อหัวข้อ DM ของ Telegram, ชื่อเธรดอัตโนมัติของ Discord และ[คำบรรยายแบบร่างความคืบหน้า](/th/concepts/progress-drafts#narrated-status) เมื่อไม่ได้กำหนด OpenClaw จะใช้ค่าเริ่มต้นของโมเดลขนาดเล็กที่ผู้ให้บริการหลักประกาศไว้ หากมี (OpenAI → `gpt-5.6-luna`, Anthropic → `claude-haiku-4-5`); มิฉะนั้น งานตั้งชื่อจะใช้โมเดลหลักของเอเจนต์ และคำบรรยายจะยังคงปิดอยู่ หากโมเดลอรรถประโยชน์แยกต่างหากไม่สามารถเตรียมหรือสร้างชื่อให้เสร็จได้ OpenClaw จะลองสร้างชื่อนั้นอีกครั้งด้วยโมเดลหลัก สำหรับชื่อแดชบอร์ด การหาโมเดลอรรถประโยชน์โดยอัตโนมัติและการใช้โมเดลสำรองตามปกติจะใช้ผู้ให้บริการและโปรไฟล์การยืนยันตัวตนที่มีผลกับเซสชัน ส่วนโมเดลอรรถประโยชน์ที่ระบุอย่างชัดเจนจะคงผู้ให้บริการและการยืนยันตัวตนตามที่กำหนดไว้ ตั้งค่า `utilityModel: ""` เพื่อข้ามเส้นทางโมเดลอรรถประโยชน์ทางเลือก โดยการสร้างชื่อแดชบอร์ดจะยังดำเนินต่อโดยตรงด้วยโมเดลเซสชันปกติ `agents.list[].utilityModel` จะแทนที่ค่าเริ่มต้น และการแทนที่โมเดลเฉพาะการดำเนินการจะมีลำดับความสำคัญเหนือทั้งสองค่า งานอรรถประโยชน์จะเรียกโมเดลแยกต่างหากและส่งเนื้อหาเฉพาะงานไปยังผู้ให้บริการโมเดลที่เลือก การสร้างชื่อแดชบอร์ดจะส่งอักขระไม่เกิน 1,000 ตัวแรกของข้อความแรกที่ไม่ใช่คำสั่ง ส่วนคำบรรยายจะส่งคำขอขาเข้าพร้อมสรุปเครื่องมือแบบกระชับที่ปกปิดข้อมูลสำคัญแล้ว เลือกผู้ให้บริการที่ตรงกับข้อกำหนดด้านค่าใช้จ่ายและการจัดการข้อมูล
- `imageModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - เส้นทางเครื่องมือ `image` ใช้ค่านี้เป็นการกำหนดค่าโมเดลการมองเห็นเมื่อโมเดลที่ใช้งานอยู่ไม่รองรับรูปภาพ ส่วนโมเดลที่รองรับการมองเห็นโดยตรงจะได้รับไบต์ของรูปภาพที่โหลดแล้วโดยตรง
  - นอกจากนี้ยังใช้เป็นเส้นทางสำรองเมื่อโมเดลที่เลือกหรือโมเดลเริ่มต้นไม่รองรับอินพุตรูปภาพ
  - ควรใช้การอ้างอิง `provider/model` แบบระบุชัดเจน ระบบยอมรับ ID เปล่าเพื่อความเข้ากันได้ หาก ID เปล่าตรงกับรายการที่กำหนดค่าไว้และรองรับรูปภาพใน `models.providers.*.models` เพียงรายการเดียว OpenClaw จะเติมผู้ให้บริการให้ หากตรงกับรายการที่กำหนดค่าไว้หลายรายการ ต้องระบุคำนำหน้าผู้ให้บริการอย่างชัดเจน
- `imageGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถร่วมสำหรับการสร้างรูปภาพและพื้นผิวเครื่องมือ/Plugin ใดๆ ในอนาคตที่สร้างรูปภาพ
  - ค่าที่ใช้โดยทั่วไป: `google/gemini-3.1-flash-image` สำหรับการสร้างรูปภาพแบบเนทีฟของ Gemini, `fal/fal-ai/flux/dev` สำหรับ fal, `openai/gpt-image-2` สำหรับ OpenAI Images หรือ `openai/gpt-image-1.5` สำหรับเอาต์พุต PNG/WebP ของ OpenAI ที่มีพื้นหลังโปร่งใส
  - หากเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตนของผู้ให้บริการที่ตรงกันด้วย (ตัวอย่างเช่น `GEMINI_API_KEY` หรือ `GOOGLE_API_KEY` สำหรับ `google/*`, `OPENAI_API_KEY` หรือ OpenAI Codex OAuth สำหรับ `openai/gpt-image-2` / `openai/gpt-image-1.5`, `FAL_KEY` สำหรับ `fal/*`)
  - หากละไว้ `image_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างรูปภาพที่ลงทะเบียนไว้อื่นๆ ตามลำดับ ID ผู้ให้บริการ
- `musicGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถร่วมสำหรับการสร้างเพลงและเครื่องมือ `music_generate` ในตัว
  - ค่าที่ใช้โดยทั่วไป: `google/lyria-3-clip-preview`, `google/lyria-3-pro-preview` หรือ `minimax/music-2.6`
  - หากละไว้ `music_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างเพลงที่ลงทะเบียนไว้อื่นๆ ตามลำดับ ID ผู้ให้บริการ
  - หากเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
- `videoGenerationModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยความสามารถร่วมสำหรับการสร้างวิดีโอและเครื่องมือ `video_generate` ในตัว
  - ค่าที่ใช้โดยทั่วไป: `qwen/wan2.6-t2v`, `qwen/wan2.6-i2v`, `qwen/wan2.6-r2v`, `qwen/wan2.6-r2v-flash` หรือ `qwen/wan2.7-r2v`
  - หากละไว้ `video_generate` ยังสามารถอนุมานค่าเริ่มต้นของผู้ให้บริการที่มีการยืนยันตัวตนรองรับได้ โดยจะลองผู้ให้บริการเริ่มต้นปัจจุบันก่อน จากนั้นจึงลองผู้ให้บริการสร้างวิดีโอที่ลงทะเบียนไว้อื่นๆ ตามลำดับ ID ผู้ให้บริการ
  - หากเลือกผู้ให้บริการ/โมเดลโดยตรง ให้กำหนดค่าการยืนยันตัวตน/คีย์ API ของผู้ให้บริการที่ตรงกันด้วย
  - Plugin สร้างวิดีโอ Qwen อย่างเป็นทางการรองรับวิดีโอเอาต์พุตสูงสุด 1 รายการ รูปภาพอินพุต 1 รูป วิดีโออินพุต 4 รายการ ระยะเวลา 10 วินาที และตัวเลือกระดับผู้ให้บริการ `size`, `aspectRatio`, `resolution`, `audio` และ `watermark`
- `pdfModel`: รับได้ทั้งสตริง (`"provider/model"`) หรืออ็อบเจกต์ (`{ primary, fallbacks }`)
  - ใช้โดยเครื่องมือ `pdf` สำหรับกำหนดเส้นทางโมเดล
  - หากละไว้ เครื่องมือ PDF จะใช้ `imageModel` เป็นตัวสำรอง จากนั้นจึงใช้โมเดลเซสชัน/โมเดลเริ่มต้นที่แก้ไขแล้ว
- `pdfMaxBytesMb`: ขีดจำกัดขนาด PDF เริ่มต้นสำหรับเครื่องมือ `pdf` เมื่อไม่ได้ส่ง `maxBytesMb` ขณะเรียกใช้
- `pdfMaxPages`: จำนวนหน้าสูงสุดเริ่มต้นที่โหมดสำรองสำหรับการแยกข้อมูลของเครื่องมือ `pdf` จะพิจารณา
- `verboseDefault`: ระดับความละเอียดเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"full"` ค่าเริ่มต้น: `"off"`
- `toolProgressDetail`: โหมดรายละเอียดสำหรับสรุปเครื่องมือ `/verbose` และบรรทัดเครื่องมือในแบบร่างความคืบหน้า ค่า: `"explain"` (ค่าเริ่มต้น ป้ายกำกับที่มนุษย์อ่านได้แบบกระชับ) หรือ `"raw"` (ต่อท้ายคำสั่ง/รายละเอียดดิบเมื่อมี) `agents.list[].toolProgressDetail` ต่อเอเจนต์จะแทนที่ค่าเริ่มต้นนี้
- `reasoningDefault`: การแสดงผลการให้เหตุผลเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"stream"` `agents.list[].reasoningDefault` ต่อเอเจนต์จะแทนที่ค่าเริ่มต้นนี้ ค่าเริ่มต้นการให้เหตุผลที่กำหนดไว้จะใช้เฉพาะกับเจ้าของ ผู้ส่งที่ได้รับอนุญาต หรือบริบท Gateway ของผู้ดูแลระบบปฏิบัติการ เมื่อไม่ได้ตั้งค่าการแทนที่การให้เหตุผลต่อข้อความหรือต่อเซสชัน
- `elevatedDefault`: ระดับเอาต์พุตแบบยกระดับเริ่มต้นสำหรับเอเจนต์ ค่า: `"off"`, `"on"`, `"ask"`, `"full"` ค่าเริ่มต้น: `"on"`
- `model.primary`: รูปแบบ `provider/model` (เช่น `openai/gpt-5.6-sol` สำหรับการเข้าถึงด้วย Codex OAuth) หากละผู้ให้บริการ OpenClaw จะลองชื่อแทนก่อน จากนั้นจึงค้นหาผู้ให้บริการที่กำหนดค่าไว้ซึ่งตรงกับ ID โมเดลนั้นพอดีและมีเพียงรายการเดียว แล้วจึงใช้ผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้เป็นตัวสำรอง (เป็นพฤติกรรมความเข้ากันได้ที่เลิกแนะนำแล้ว ดังนั้นควรระบุ `provider/model` อย่างชัดเจน) หากผู้ให้บริการนั้นไม่มีโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw จะใช้ผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนที่จะรายงานค่าเริ่มต้นเก่าของผู้ให้บริการที่ถูกนำออก
- `models`: ชื่อแทนและการตั้งค่าต่อโมเดลที่กำหนดไว้ แต่ละรายการสามารถมี `alias` (ทางลัด) และ `params` (เฉพาะผู้ให้บริการ ตัวอย่างเช่น `temperature`, `maxTokens`, `cacheRetention`, `context1m`, `responsesServerCompaction`, `responsesCompactThreshold`, การกำหนดเส้นทาง `provider` ของ OpenRouter, `chat_template_kwargs`, `extra_body`/`extraBody`) การเพิ่มรายการไม่จำกัดการแทนที่โมเดล
  - ใช้รายการ `provider/*` เช่น `"openai/*": {}` หรือ `"vllm/*": {}` เพื่อแสดงโมเดลทั้งหมดที่ค้นพบสำหรับผู้ให้บริการที่เลือก โดยไม่ต้องระบุ ID ของทุกโมเดลด้วยตนเอง
  - เพิ่ม `agentRuntime` ลงในรายการ `provider/*` เมื่อโมเดลทั้งหมดที่ค้นพบแบบไดนามิกสำหรับผู้ให้บริการนั้นควรใช้รันไทม์เดียวกัน นโยบายรันไทม์ `provider/model` แบบตรงกันทุกประการยังคงมีลำดับความสำคัญเหนือไวลด์การ์ด
  - การแก้ไขข้อมูลเมตาอย่างปลอดภัย: ใช้ `openclaw config set agents.defaults.models '<json>' --strict-json --merge` เพื่อเพิ่มรายการ `config set` จะปฏิเสธการแทนที่ที่ทำให้รายการเดิมถูกนำออก เว้นแต่จะส่ง `--replace`
- `modelPolicy.allow`: รายการอนุญาตสำหรับการแทนที่ที่ระบุอย่างชัดเจน รองรับชื่อแทน การอ้างอิง `provider/model` แบบตรงกันทุกประการ และไวลด์การ์ดคำนำหน้าที่ส่วนท้าย เช่น `openai/*` หรือ `clawrouter/anthropic/*` ละไว้หรือใช้ `[]` เพื่ออนุญาตทุกโมเดล `agents.list[].modelPolicy.allow` จะแทนที่นโยบายเริ่มต้นสำหรับเอเจนต์นั้น รายการว่างที่ระบุอย่างชัดเจนจะกำหนดให้เอเจนต์นั้นอนุญาตทุกโมเดล
  - ขั้นตอนการกำหนดค่า/เริ่มต้นใช้งานที่จำกัดขอบเขตตามผู้ให้บริการจะผสานโมเดลของผู้ให้บริการที่เลือกลงในแมปนี้ และคงผู้ให้บริการอื่นที่ไม่เกี่ยวข้องซึ่งกำหนดค่าไว้แล้ว
  - สำหรับโมเดล OpenAI Responses โดยตรง Compaction ฝั่งเซิร์ฟเวอร์จะเปิดใช้งานโดยอัตโนมัติ ใช้ `params.responsesServerCompaction: false` เพื่อหยุดการแทรก `context_management` หรือ `params.responsesCompactThreshold` เพื่อแทนที่เกณฑ์ ดู[Compaction ฝั่งเซิร์ฟเวอร์ของ OpenAI](/th/providers/openai#advanced-configuration)
- `params`: พารามิเตอร์ผู้ให้บริการเริ่มต้นส่วนกลางที่ใช้กับทุกโมเดล กำหนดที่ `agents.defaults.params` (เช่น `{ cacheRetention: "long" }`)
- ลำดับความสำคัญในการผสาน `params` (การกำหนดค่า): `agents.defaults.params` (ฐานส่วนกลาง) จะถูกแทนที่ด้วย `agents.defaults.models["provider/model"].params` (ต่อโมเดล) จากนั้น `agents.list[].params` (ID เอเจนต์ที่ตรงกัน) จะแทนที่ตามคีย์ ดูรายละเอียดที่[การแคชพรอมต์](/th/reference/prompt-caching)
- `models.providers.openrouter.params.provider`: นโยบายกำหนดเส้นทางผู้ให้บริการเริ่มต้นทั่วทั้ง OpenRouter OpenClaw จะส่งค่านี้ต่อไปยังอ็อบเจกต์ `provider` ของคำขอ OpenRouter โดย `agents.defaults.models["openrouter/<model>"].params.provider` ต่อโมเดลและพารามิเตอร์เอเจนต์จะแทนที่ตามคีย์ ดู[การกำหนดเส้นทางผู้ให้บริการ OpenRouter](/th/providers/openrouter#advanced-configuration)
- `params.extra_body`/`params.extraBody`: JSON ส่งผ่านขั้นสูงที่ผสานลงในเนื้อหาคำขอ `api: "openai-completions"` สำหรับพร็อกซีที่เข้ากันได้กับ OpenAI หากชนกับคีย์คำขอที่สร้างขึ้น เนื้อหาเพิ่มเติมจะมีลำดับความสำคัญเหนือกว่า หลังจากนั้นเส้นทาง completions ที่ไม่ใช่แบบเนทีฟจะยังคงตัด `store` ที่ใช้เฉพาะกับ OpenAI ออก
- `params.chat_template_kwargs`: อาร์กิวเมนต์เทมเพลตแชตที่เข้ากันได้กับ vLLM/OpenAI ซึ่งผสานลงในเนื้อหาคำขอ `api: "openai-completions"` ระดับบนสุด สำหรับ `vllm/nemotron-3-*` ที่ปิดการคิด Plugin vLLM ที่รวมมาให้จะส่ง `enable_thinking: false` และ `force_nonempty_content: true` โดยอัตโนมัติ; `chat_template_kwargs` ที่ระบุชัดเจนจะแทนที่ค่าเริ่มต้นที่สร้างขึ้น และ `extra_body.chat_template_kwargs` ยังคงมีลำดับความสำคัญสุดท้าย โมเดลการคิด Qwen และ Nemotron ของ vLLM ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารี (`off`, `on`) แทนระดับความพยายามหลายขั้น
- `compat.thinkingFormat`: รูปแบบเพย์โหลดการคิดที่เข้ากันได้กับ OpenAI ใช้ `"together"` สำหรับ `reasoning.enabled` แบบ Together, `"qwen"` สำหรับ `enable_thinking` ระดับบนสุดแบบ Qwen หรือ `"qwen-chat-template"` สำหรับ `chat_template_kwargs.enable_thinking` บนแบ็กเอนด์ตระกูล Qwen ที่รองรับ kwargs ของเทมเพลตแชตระดับคำขอ เช่น vLLM OpenClaw จะแมปการปิดการคิดเป็น `false` และการเปิดการคิดเป็น `true` และโมเดล Qwen ของ vLLM ที่กำหนดค่าไว้จะแสดงตัวเลือก `/think` แบบไบนารีสำหรับรูปแบบเหล่านี้
- `compat.supportedReasoningEfforts`: รายการระดับความพยายามในการให้เหตุผลที่เข้ากันได้กับ OpenAI ต่อโมเดล เพิ่ม `"xhigh"` สำหรับปลายทางแบบกำหนดเองที่รองรับค่านี้จริง จากนั้น OpenClaw จะแสดง `/think xhigh` ในเมนูคำสั่ง แถวเซสชันของ Gateway การตรวจสอบการแพตช์เซสชัน การตรวจสอบ CLI ของเอเจนต์ และการตรวจสอบ `llm-task` สำหรับผู้ให้บริการ/โมเดลที่กำหนดค่าไว้นั้น ใช้ `compat.reasoningEffortMap` เมื่อแบ็กเอนด์ต้องการค่าเฉพาะผู้ให้บริการสำหรับระดับมาตรฐาน
- `params.preserveThinking`: ตัวเลือกเฉพาะ Z.AI สำหรับเปิดใช้การเก็บรักษาการคิด เมื่อเปิดใช้งานและเปิดการคิด OpenClaw จะส่ง `thinking.clear_thinking: false` และเล่น `reasoning_content` ก่อนหน้าซ้ำ ดู[การคิดและการเก็บรักษาการคิดของ Z.AI](/th/providers/zai#advanced-configuration)
- `localService`: ตัวจัดการกระบวนการระดับผู้ให้บริการที่เป็นทางเลือกสำหรับเซิร์ฟเวอร์โมเดลภายในเครื่อง/ที่โฮสต์เอง เมื่อโมเดลที่เลือกเป็นของผู้ให้บริการนั้น OpenClaw จะตรวจสอบ `healthUrl` (หรือ `baseUrl + "/models"`) หากปลายทางไม่ทำงาน จะเริ่ม `command` พร้อม `args` รอสูงสุด `readyTimeoutMs` แล้วจึงส่งคำขอโมเดล `command` ต้องเป็นพาธแบบสัมบูรณ์ `idleStopMs: 0` จะคงกระบวนการไว้จนกว่า OpenClaw จะออก ส่วนค่าบวกจะหยุดกระบวนการที่ OpenClaw เริ่มขึ้นหลังจากไม่มีการใช้งานเป็นเวลาตามจำนวนมิลลิวินาทีนั้น ดู[บริการโมเดลภายในเครื่อง](/th/gateway/local-model-services)
- นโยบายรันไทม์ควรอยู่ที่ผู้ให้บริการหรือโมเดล ไม่ใช่ที่ `agents.defaults` ใช้ `models.providers.<provider>.agentRuntime` สำหรับกฎที่ใช้กับผู้ให้บริการทั้งหมด หรือใช้ `agents.defaults.models["provider/model"].agentRuntime` / `agents.list[].models["provider/model"].agentRuntime` สำหรับกฎเฉพาะโมเดล คำนำหน้าผู้ให้บริการ/โมเดลเพียงอย่างเดียวจะไม่เลือกชุดควบคุมการทำงาน เมื่อไม่ได้ตั้งค่ารันไทม์หรือกำหนดเป็น `auto` OpenAI อาจเลือก Codex โดยปริยายได้เฉพาะกับเส้นทาง HTTPS อย่างเป็นทางการของ Platform Responses หรือ ChatGPT Responses ที่ตรงกันทุกประการและไม่มีการกำหนดค่าทับในคำขอ ดู[รันไทม์เอเจนต์โดยปริยายของ OpenAI](/th/providers/openai#implicit-agent-runtime)
- ตัวเขียนการกำหนดค่าที่แก้ไขฟิลด์เหล่านี้ (เช่น `/models set`, `/models set-image` และคำสั่งเพิ่ม/ลบทางเลือกสำรอง) จะบันทึกในรูปแบบออบเจ็กต์มาตรฐานและรักษารายการทางเลือกสำรองเดิมไว้เมื่อทำได้
- `maxConcurrent`: จำนวนสูงสุดของการเรียกใช้เอเจนต์แบบขนานระหว่างเซสชัน (แต่ละเซสชันยังคงทำงานตามลำดับ) ค่าเริ่มต้น: `4`.

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

- `id`: `"auto"`, `"openclaw"`, ID ฮาร์เนสของ Plugin ที่ลงทะเบียนไว้ หรือนามแฝงแบ็กเอนด์ CLI ที่รองรับ Plugin Codex ที่รวมมาให้จะลงทะเบียน `codex`; ส่วน Plugin Anthropic ที่รวมมาให้จะมีแบ็กเอนด์ CLI `claude-cli`
- `id: "auto"` ช่วยให้ฮาร์เนส Plugin ที่ลงทะเบียนไว้รับเส้นทางที่มีผลซึ่งประกาศหรือเป็นไปตามสัญญาการรองรับ และใช้ OpenClaw เมื่อไม่มีฮาร์เนสที่ตรงกัน รันไทม์ Plugin ที่ระบุอย่างชัดเจน เช่น `id: "codex"` ต้องมีฮาร์เนสดังกล่าวและเส้นทางที่มีผลซึ่งเข้ากันได้ โดยจะปฏิเสธการทำงานเพื่อความปลอดภัยหากไม่มีอย่างใดอย่างหนึ่ง หรือหากการดำเนินการล้มเหลว
- `id: "pi"` ยอมรับเฉพาะในฐานะนามแฝงที่เลิกใช้แล้วสำหรับ `openclaw` เพื่อรักษาความเข้ากันได้กับการกำหนดค่าที่เผยแพร่ใน v2026.5.22 และเวอร์ชันก่อนหน้า การกำหนดค่าใหม่ควรใช้ `openclaw`
- ลำดับความสำคัญของรันไทม์คือใช้นโยบายของโมเดลที่ตรงกันทุกประการก่อน (`agents.list[].models["provider/model"]`, `agents.defaults.models["provider/model"]` หรือ `models.providers.<provider>.models[]`) ตามด้วย `agents.list[]` / `agents.defaults.models["provider/*"]` แล้วจึงใช้นโยบายทั่วทั้งผู้ให้บริการที่ `models.providers.<provider>.agentRuntime`
- คีย์รันไทม์ระดับเอเจนต์ทั้งหมดเป็นแบบเก่า `agents.defaults.agentRuntime`, `agents.list[].agentRuntime`, การตรึงรันไทม์ของเซสชัน และ `OPENCLAW_AGENT_RUNTIME` จะถูกละเว้นในการเลือกรันไทม์ เรียกใช้ `openclaw doctor --fix` เพื่อลบค่าที่ล้าสมัย
- เส้นทาง OpenAI Responses/ChatGPT อย่างเป็นทางการผ่าน HTTPS ที่ตรงกันทุกประการและมีคุณสมบัติเหมาะสม ซึ่งไม่มีการเขียนการแทนที่คำขอไว้ อาจใช้ฮาร์เนส Codex โดยปริยาย `agentRuntime.id: "codex"` ระดับผู้ให้บริการ/โมเดลทำให้ Codex เป็นข้อกำหนดที่ต้องปฏิเสธการทำงานเพื่อความปลอดภัยเมื่อไม่พร้อมใช้งาน แต่ไม่ได้ทำให้เส้นทางที่เข้ากันไม่ได้กลายเป็นเข้ากันได้
- สำหรับการปรับใช้ Claude CLI ควรใช้ `model: "anthropic/claude-opus-4-8"` ร่วมกับ `agentRuntime.id: "claude-cli"` ที่กำหนดขอบเขตระดับโมเดล การอ้างอิง `claude-cli/<model>` แบบเก่ายังคงใช้ได้เพื่อความเข้ากันได้ แต่การกำหนดค่าใหม่ควรรักษาการเลือกผู้ให้บริการ/โมเดลให้อยู่ในรูปแบบมาตรฐาน และกำหนดแบ็กเอนด์การดำเนินการไว้ในนโยบายรันไทม์ระดับผู้ให้บริการ/โมเดล
- ส่วนนี้ควบคุมเฉพาะการดำเนินการเทิร์นของเอเจนต์แบบข้อความ การสร้างสื่อ วิชัน PDF เพลง วิดีโอ และ TTS ยังคงใช้การตั้งค่าผู้ให้บริการ/โมเดลของแต่ละส่วน

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

โมเดล Z.AI GLM-4.x จะเปิดใช้งานโหมดการคิดโดยอัตโนมัติ เว้นแต่จะตั้งค่า `--thinking off` หรือกำหนด `agents.defaults.models["zai/<model>"].params.thinking` ด้วยตนเอง
โมเดล Z.AI เปิดใช้งาน `tool_stream` เป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือ ตั้งค่า `agents.defaults.models["zai/<model>"].params.tool_stream` เป็น `false` เพื่อปิดใช้งาน
Anthropic Claude Opus 4.8 ปิดการคิดเป็นค่าเริ่มต้นใน OpenClaw เมื่อเปิดใช้งานการคิดแบบปรับตัวอย่างชัดเจน ค่าเริ่มต้นของระดับความพยายามที่ Anthropic เป็นผู้กำหนดคือ `high` โมเดล Claude 4.6 ใช้ค่าเริ่มต้นเป็น `adaptive` เมื่อไม่ได้กำหนดระดับการคิดอย่างชัดเจน

### `agents.defaults.cliBackends`

แบ็กเอนด์ CLI ทางเลือกสำหรับการเรียกใช้สำรองแบบข้อความเท่านั้น (ไม่มีการเรียกใช้เครื่องมือ) มีประโยชน์เป็นตัวสำรองเมื่อผู้ให้บริการ API ล้มเหลว

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

- แบ็กเอนด์ CLI เน้นข้อความเป็นหลัก โดยเครื่องมือจะถูกปิดใช้งานเสมอ
- รองรับเซสชันเมื่อตั้งค่า `sessionArg`
- รองรับการส่งผ่านรูปภาพเมื่อ `imageArg` ยอมรับพาธไฟล์
- `reseedFromRawTranscriptWhenUncompacted: true` ช่วยให้แบ็กเอนด์สามารถกู้คืนเซสชันที่ถูกทำให้ใช้ไม่ได้อย่างปลอดภัย
  จากส่วนท้ายของทรานสคริปต์ OpenClaw ดิบที่มีขอบเขตจำกัด ก่อนที่จะมีข้อมูลสรุป
  Compaction ครั้งแรก การเปลี่ยนโปรไฟล์การยืนยันตัวตนหรือยุคของข้อมูลประจำตัว
  ยังคงไม่ทำการป้อนข้อมูลดิบซ้ำโดยเด็ดขาด

### `agents.defaults.promptOverlays`

โอเวอร์เลย์พรอมต์ที่ไม่ขึ้นกับผู้ให้บริการ ซึ่งนำไปใช้ตามตระกูลโมเดลบนพื้นผิวพรอมต์ที่ OpenClaw ประกอบขึ้น ID โมเดลตระกูล GPT-5 จะได้รับสัญญาพฤติกรรมที่ใช้ร่วมกันในเส้นทาง OpenClaw/ผู้ให้บริการ ส่วน `personality` ควบคุมเฉพาะเลเยอร์รูปแบบการโต้ตอบที่เป็นมิตร เส้นทางแอปเซิร์ฟเวอร์ Codex แบบเนทีฟจะคงคำสั่งพื้นฐาน/ระดับโมเดลที่ Codex เป็นผู้กำหนดไว้แทนโอเวอร์เลย์ GPT-5 ของ OpenClaw นี้ และ OpenClaw จะปิดบุคลิกในตัวของ Codex สำหรับเธรดแบบเนทีฟ

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
- `"off"` ปิดใช้งานเฉพาะเลเยอร์ที่เป็นมิตร โดยสัญญาพฤติกรรม GPT-5 ที่ติดแท็กไว้ยังคงเปิดใช้งาน
- ระบบยังคงอ่าน `plugins.entries.openai.config.personality` แบบเก่าเมื่อไม่ได้ตั้งค่าการตั้งค่าที่ใช้ร่วมกันนี้

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
        lightContext: false, // ค่าเริ่มต้น: false; true จะเก็บเฉพาะ HEARTBEAT.md จากไฟล์บูตสแตรปของเวิร์กสเปซ
        isolatedSession: false, // ค่าเริ่มต้น: false; true จะเรียกใช้แต่ละ Heartbeat ในเซสชันใหม่ (ไม่มีประวัติการสนทนา)
        skipWhenBusy: false, // ค่าเริ่มต้น: false; true จะรอเลนของเอเจนต์ย่อย/งานซ้อนของเอเจนต์นี้ด้วย
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

- `every`: สตริงระยะเวลา (ms/s/m/h) ค่าเริ่มต้น: `30m` (การยืนยันตัวตนด้วยคีย์ API) หรือ `1h` (การยืนยันตัวตนด้วย OAuth) ตั้งค่าเป็น `0m` เพื่อปิดใช้งาน
- `includeSystemPromptSection`: เมื่อเป็น false จะละเว้นส่วน Heartbeat จากพรอมต์ระบบและข้ามการแทรก `HEARTBEAT.md` ลงในบริบทบูตสแตรป ค่าเริ่มต้น: `true`
- `suppressToolErrorWarnings`: เมื่อเป็น true จะระงับเพย์โหลดคำเตือนข้อผิดพลาดของเครื่องมือระหว่างการเรียกใช้ Heartbeat
- `timeoutSeconds`: เวลาสูงสุดเป็นวินาทีที่อนุญาตให้เทิร์นของเอเจนต์ Heartbeat ทำงานก่อนถูกยกเลิก หากไม่ตั้งค่า จะใช้ `agents.defaults.timeoutSeconds` เมื่อมีการตั้งค่าไว้ มิฉะนั้นจะใช้รอบเวลา Heartbeat โดยจำกัดสูงสุดที่ 600 วินาที
- `directPolicy`: นโยบายการส่งโดยตรง/DM `allow` (ค่าเริ่มต้น) อนุญาตการส่งไปยังเป้าหมายโดยตรง `block` ระงับการส่งไปยังเป้าหมายโดยตรงและส่ง `reason=dm-blocked`
- `lightContext`: เมื่อเป็น true การเรียกใช้ Heartbeat จะใช้บริบทบูตสแตรปแบบเบาและเก็บเฉพาะ `HEARTBEAT.md` จากไฟล์บูตสแตรปของเวิร์กสเปซ
- `isolatedSession`: เมื่อเป็น true Heartbeat แต่ละครั้งจะทำงานในเซสชันใหม่โดยไม่มีประวัติการสนทนาก่อนหน้า ใช้รูปแบบการแยกเดียวกับ Cron `sessionTarget: "isolated"` ลดต้นทุนโทเค็นต่อ Heartbeat จาก ~100K เหลือ ~2-5K โทเค็น
- `skipWhenBusy`: เมื่อเป็น true การเรียกใช้ Heartbeat จะเลื่อนออกไปเมื่อเลนงานเพิ่มเติมของเอเจนต์นั้นไม่ว่าง ได้แก่ งานเอเจนต์ย่อยที่ผูกกับคีย์เซสชันของตนเองหรืองานคำสั่งซ้อน เลน Cron จะเลื่อน Heartbeat เสมอ แม้ไม่มีแฟล็กนี้
- ระดับต่อเอเจนต์: ตั้งค่า `agents.list[].heartbeat` เมื่อเอเจนต์ใดก็ตามกำหนด `heartbeat` **เฉพาะเอเจนต์เหล่านั้น** เท่านั้นที่จะเรียกใช้ Heartbeat
- Heartbeat จะเรียกใช้เทิร์นของเอเจนต์แบบเต็ม — ช่วงเวลาที่สั้นลงจะใช้โทเค็นมากขึ้น

### `agents.defaults.compaction`

```json5
{
  agents: {
    defaults: {
      compaction: {
        mode: "safeguard", // default | safeguard
        provider: "my-provider", // ID ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ (ไม่บังคับ)
        thinkingLevel: "low", // การแทนที่การคิดสำหรับ Compaction เท่านั้น (ไม่บังคับ)
        timeoutSeconds: 180,
        keepRecentTokens: 50000,
        recentTurnsPreserve: 3,
        identifierPolicy: "strict", // strict | off | custom
        identifierInstructions: "รักษา ID การปรับใช้ ID ทิกเก็ต และคู่ host:port ไว้ทุกประการ", // ใช้เมื่อ identifierPolicy=custom
        qualityGuard: { enabled: true, maxRetries: 1 },
        midTurnPrecheck: { enabled: false }, // การตรวจสอบแรงกดดันของลูปเครื่องมือที่เป็นตัวเลือก
        postIndexSync: "async", // off | async | await
        postCompactionSections: ["Session Startup", "Red Lines"], // เลือกเปิดใช้งานการแทรกส่วน AGENTS.md ซ้ำ
        model: "openrouter/anthropic/claude-sonnet-4-6", // การแทนที่โมเดลสำหรับ Compaction เท่านั้น (ไม่บังคับ)
        truncateAfterCompaction: true, // หมุนไปใช้ JSONL ตัวถัดไปที่มีขนาดเล็กลงหลัง Compaction
        maxActiveTranscriptBytes: "20mb", // ทริกเกอร์ Compaction ภายในก่อนเริ่มทำงาน (ไม่บังคับ)
        notifyUser: true, // แจ้งเตือนเมื่อ Compaction เริ่มต้น/เสร็จสมบูรณ์ และเมื่อการฟลัชหน่วยความจำลดระดับลง (ค่าเริ่มต้น: false)
        memoryFlush: {
          enabled: true,
          model: "ollama/qwen3:8b", // การแทนที่โมเดลสำหรับการฟลัชหน่วยความจำเท่านั้น (ไม่บังคับ)
          softThresholdTokens: 6000,
          forceFlushTranscriptBytes: "2mb",
          systemPrompt: "เซสชันใกล้เข้าสู่ Compaction ให้จัดเก็บความทรงจำที่คงทนตอนนี้",
          prompt: "เขียนบันทึกที่ควรเก็บรักษาไว้ลงใน memory/YYYY-MM-DD.md; หากไม่มีสิ่งใดต้องจัดเก็บ ให้ตอบด้วยโทเค็นเงียบ NO_REPLY ทุกประการ",
        },
      },
    },
  },
}
```

- `mode`: `default` หรือ `safeguard` (การสรุปแบบแบ่งส่วนสำหรับประวัติที่ยาว) ดู [Compaction](/th/concepts/compaction)
- `provider`: id ของ Plugin ผู้ให้บริการ Compaction ที่ลงทะเบียนไว้ เมื่อตั้งค่า ระบบจะเรียก `summarize()` ของผู้ให้บริการแทนการสรุปด้วย LLM ในตัว หากล้มเหลวจะย้อนกลับไปใช้แบบในตัว การตั้งค่าผู้ให้บริการจะบังคับใช้ `mode: "safeguard"` ดู [Compaction](/th/concepts/compaction)
- `thinkingLevel`: ระดับการคิดแบบไม่บังคับที่ใช้เฉพาะกับสรุป Compaction แบบฝังตัวของ OpenClaw (`off`, `minimal`, `low`, `medium`, `high`, `xhigh`, `adaptive`, `max` หรือ `ultra`) ค่านี้จะแทนที่ระดับการคิดปัจจุบันของเซสชันและถูกจำกัดให้อยู่ในขอบเขตของโมเดล/รันไทม์ Compaction ที่เลือก เว้นว่างไว้เพื่อสืบทอดระดับของเซสชัน Compaction ของแอปเซิร์ฟเวอร์ Codex แบบเนทีฟจะไม่ใช้การตั้งค่านี้ เนื่องจากคำขอ compact แบบเนทีฟไม่มีการแทนที่ระดับการคิดรายปฏิบัติการ OpenClaw จะบันทึกคำเตือนเมื่อมีการกำหนดค่า
- `timeoutSeconds`: จำนวนวินาทีสูงสุดที่อนุญาตสำหรับการดำเนินการ Compaction หนึ่งครั้งก่อนที่ OpenClaw จะยกเลิก ค่าเริ่มต้น: `180`
- `keepRecentTokens`: งบประมาณจุดตัดของเอเจนต์สำหรับเก็บส่วนท้ายล่าสุดของทรานสคริปต์ไว้ตามต้นฉบับ `/compact` แบบดำเนินการเองจะใช้ค่านี้เมื่อตั้งไว้อย่างชัดเจน มิฉะนั้น Compaction แบบดำเนินการเองจะเป็นจุดตรวจสอบแบบตายตัว
- `recentTurnsPreserve`: จำนวนรอบสนทนาล่าสุดระหว่างผู้ใช้/ผู้ช่วยที่เก็บไว้ตามต้นฉบับนอกการสรุปเพื่อป้องกัน ค่าเริ่มต้น: `3`
- `identifierPolicy`: `strict` (ค่าเริ่มต้น), `off` หรือ `custom` โดย `strict` จะเติมคำแนะนำในตัวเกี่ยวกับการคงตัวระบุแบบทึบไว้ด้านหน้าระหว่างการสรุป Compaction
- `identifierInstructions`: ข้อความกำหนดเองแบบไม่บังคับสำหรับการรักษาตัวระบุ ซึ่งใช้เมื่อ `identifierPolicy=custom`
- `qualityGuard`: การตรวจสอบเพื่อให้ลองใหม่เมื่อเอาต์พุตของสรุปเพื่อป้องกันมีรูปแบบไม่ถูกต้อง เปิดใช้งานโดยค่าเริ่มต้นในโหมดป้องกัน ตั้งค่า `enabled: false` เพื่อข้ามการตรวจสอบ
- `midTurnPrecheck`: การตรวจสอบแรงกดดันจากลูปเครื่องมือแบบไม่บังคับ เมื่อ `enabled: true` OpenClaw จะตรวจสอบแรงกดดันของบริบทหลังเพิ่มผลลัพธ์เครื่องมือและก่อนเรียกโมเดลครั้งถัดไป หากบริบทไม่สามารถรองรับได้อีก ระบบจะยกเลิกความพยายามปัจจุบันก่อนส่งพรอมต์ และนำเส้นทางกู้คืนจากการตรวจสอบล่วงหน้าที่มีอยู่มาใช้เพื่อตัดผลลัพธ์เครื่องมือหรือทำ Compaction แล้วลองใหม่ ทำงานร่วมกับโหมด Compaction ทั้ง `default` และ `safeguard` ค่าเริ่มต้น: ปิดใช้งาน
- `postIndexSync`: โหมดจัดทำดัชนีหน่วยความจำเซสชันใหม่หลัง Compaction ค่าเริ่มต้น: `"async"` ใช้ `"await"` เพื่อความสดใหม่สูงสุด, `"async"` เพื่อลดเวลาแฝงของ Compaction หรือ `"off"` เฉพาะเมื่อมีการจัดการซิงค์หน่วยความจำเซสชันที่อื่น
- `postCompactionSections`: ชื่อส่วน H2/H3 ใน AGENTS.md แบบไม่บังคับที่จะฉีดกลับเข้าไปหลัง Compaction การฉีดกลับจะถูกปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือตั้งเป็น `[]` การตั้ง `["Session Startup", "Red Lines"]` อย่างชัดเจนจะเปิดใช้คู่นั้นและคงการย้อนกลับไปใช้ `Every Session`/`Safety` แบบเดิมไว้ เปิดใช้ตัวเลือกนี้เฉพาะเมื่อบริบทเพิ่มเติมคุ้มกับความเสี่ยงที่จะทำให้คำแนะนำโครงการซึ่งบันทึกไว้แล้วในสรุป Compaction ซ้ำซ้อน
- `model`: `provider/model-id` หรือชื่อแทนเปล่าจาก `agents.defaults.models` แบบไม่บังคับสำหรับการสรุป Compaction เท่านั้น ชื่อแทนเปล่าจะถูกแก้ค่าก่อนส่งงาน หากชนกัน id โมเดลแบบค่าตรงที่กำหนดไว้จะมีลำดับความสำคัญสูงกว่า ใช้ตัวเลือกนี้เมื่อเซสชันหลักควรใช้โมเดลหนึ่ง แต่สรุป Compaction ควรทำงานด้วยอีกโมเดลหนึ่ง เมื่อไม่ได้ตั้งค่า Compaction จะใช้โมเดลหลักของเซสชัน
- `truncateAfterCompaction`: หมุนเวียนทรานสคริปต์ของเซสชันที่ใช้งานอยู่หลัง Compaction เพื่อให้รอบสนทนาในอนาคตโหลดเฉพาะสรุปและส่วนท้ายที่ยังไม่ได้สรุป ขณะที่ทรานสคริปต์ฉบับเต็มก่อนหน้ายังคงถูกเก็บถาวร ป้องกันไม่ให้ทรานสคริปต์ที่ใช้งานอยู่เติบโตอย่างไร้ขอบเขตในเซสชันที่ทำงานเป็นเวลานาน ค่าเริ่มต้น: `false`
- `maxActiveTranscriptBytes`: เกณฑ์จำนวนไบต์แบบไม่บังคับ (`number` หรือสตริง เช่น `"20mb"`) ที่เรียกใช้ Compaction ภายในตามปกติก่อนการทำงาน เมื่อประวัติทรานสคริปต์เติบโตเกินเกณฑ์ ต้องใช้ `truncateAfterCompaction` เพื่อให้ Compaction ที่สำเร็จสามารถหมุนเวียนไปยังทรานสคริปต์ฉบับต่อที่มีขนาดเล็กกว่า ปิดใช้งานเมื่อไม่ได้ตั้งค่าหรือเป็น `0`
- `notifyUser`: เมื่อ `true` จะส่งการแจ้งเตือนสั้น ๆ เกี่ยวกับการบำรุงรักษาบริบทให้ผู้ใช้ ได้แก่ เมื่อ Compaction เริ่มต้นและเสร็จสิ้น (เช่น "กำลังกระชับบริบท..." และ "Compaction เสร็จสมบูรณ์") และเมื่อการถ่ายหน่วยความจำก่อน Compaction ใช้ความพยายามจนหมด ทำให้การตอบกลับดำเนินต่อในสถานะที่ลดประสิทธิภาพ (เช่น "การบำรุงรักษาหน่วยความจำล้มเหลวชั่วคราว กำลังดำเนินการตอบกลับต่อ") ปิดใช้งานโดยค่าเริ่มต้นเพื่อไม่ให้แสดงการแจ้งเตือนเหล่านี้
- `memoryFlush`: รอบการทำงานแบบเอเจนต์ที่ไม่แสดงผลก่อน Compaction อัตโนมัติ เพื่อจัดเก็บหน่วยความจำระยะยาว ตั้ง `model` เป็นผู้ให้บริการ/โมเดลที่แน่นอน เช่น `ollama/qwen3:8b` เมื่อรอบการดูแลรักษานี้ควรใช้โมเดลภายในต่อไป การแทนที่นี้จะไม่สืบทอดห่วงโซ่การย้อนกลับของเซสชันที่ใช้งานอยู่ `forceFlushTranscriptBytes` จะบังคับถ่ายหน่วยความจำเมื่อขนาดทรานสคริปต์ถึงเกณฑ์ แม้ว่าตัวนับโทเค็นจะไม่เป็นปัจจุบัน ข้ามการทำงานเมื่อพื้นที่ทำงานเป็นแบบอ่านอย่างเดียว

### `agents.defaults.contextPruning`

ตัด **ผลลัพธ์เครื่องมือเก่า** ออกจากบริบทในหน่วยความจำก่อนส่งไปยัง LLM โดย **ไม่** แก้ไขประวัติเซสชันบนดิสก์ ปิดใช้งานโดยค่าเริ่มต้น ตั้ง `mode: "cache-ttl"` เพื่อเปิดใช้งาน

```json5
{
  agents: {
    defaults: {
      contextPruning: {
        mode: "cache-ttl", // ปิด (ค่าเริ่มต้น) | cache-ttl
      },
    },
  },
}
```

<Accordion title="ลักษณะการทำงานของโหมด cache-ttl">

- `mode: "cache-ttl"` เปิดใช้งานรอบการตัด
- ขั้นแรก การตัดจะตัดผลลัพธ์เครื่องมือที่มีขนาดใหญ่เกินไปแบบอ่อน จากนั้นล้างผลลัพธ์เครื่องมือที่เก่ากว่าแบบตายตัวหากจำเป็น

**การตัดแบบอ่อน** จะเก็บส่วนต้น + ส่วนท้าย และแทรก `...` ตรงกลาง

**การล้างแบบตายตัว** จะแทนที่ผลลัพธ์เครื่องมือทั้งหมดด้วยตัวแทนข้อความ

หมายเหตุ:

- บล็อกรูปภาพจะไม่ถูกตัด/ล้าง
- อัตราส่วนอิงตามจำนวนอักขระ (โดยประมาณ) ไม่ใช่จำนวนโทเค็นที่แน่นอน
- ข้อความล่าสุดของผู้ช่วยจะถูกเก็บรักษาไว้

</Accordion>

ดูรายละเอียดลักษณะการทำงานที่ [การตัดเซสชัน](/th/concepts/session-pruning)

### การสตรีมแบบบล็อก

```json5
{
  agents: {
    defaults: {
      blockStreamingDefault: "off", // เปิด | ปิด
      blockStreamingBreak: "text_end", // text_end | message_end
      blockStreamingChunk: { minChars: 800, maxChars: 1200, breakPreference: "paragraph" },
      blockStreamingCoalesce: { idleMs: 1000 },
      humanDelay: { mode: "natural" }, // ปิด (ค่าเริ่มต้น) | natural | custom (ใช้ minMs/maxMs)
    },
  },
}
```

- ช่องทางที่ไม่ใช่ Telegram ต้องกำหนด `*.streaming.block.enabled: true` อย่างชัดเจนเพื่อเปิดใช้การตอบกลับแบบบล็อก QQ Bot เป็นข้อยกเว้น โดยไม่มีคีย์ `streaming.block` และจะสตรีมการตอบกลับแบบบล็อก เว้นแต่ `channels.qqbot.streaming.mode` จะเป็น `"off"`
- การแทนที่รายช่องทาง: `channels.<channel>.streaming.block.coalesce` (รวมถึงรูปแบบรายบัญชี) Discord, Google Chat, Mattermost, MS Teams, Signal และ Slack ใช้ค่าเริ่มต้นเป็น `minChars: 1500` / `idleMs: 1000`
- `blockStreamingChunk.breakPreference`: ขอบเขตส่วนข้อมูลที่ต้องการ (`"paragraph" | "newline" | "sentence"`)
- `humanDelay`: การหยุดชั่วคราวแบบสุ่มระหว่างการตอบกลับแบบบล็อก ค่าเริ่มต้น: `off` โดย `natural` = 800-2500ms ส่วน `custom` ใช้ `minMs`/`maxMs` (ย้อนกลับไปใช้ช่วงธรรมชาติสำหรับขอบเขตที่ไม่ได้ตั้งค่า) การแทนที่รายเอเจนต์: `agents.list[].humanDelay`

ดูรายละเอียดลักษณะการทำงาน + การแบ่งส่วนข้อมูลที่ [การสตรีม](/th/concepts/streaming)

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
- การแทนที่รายเซสชัน: `session.typingMode`

ดู [ตัวบ่งชี้การพิมพ์](/th/concepts/typing-indicators)

<a id="agentsdefaultssandbox"></a>

### `agents.defaults.sandbox`

การทำแซนด์บ็อกซ์แบบไม่บังคับสำหรับเอเจนต์แบบฝังตัว ดูคู่มือฉบับเต็มที่ [การทำแซนด์บ็อกซ์](/th/gateway/sandboxing)

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main", // off (default) | non-main | all
        backend: "docker", // docker (default) | ssh | openshell
        scope: "agent", // session | agent (default) | shared
        workspaceAccess: "none", // none (default) | ro | rw
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

ค่าเริ่มต้นที่แสดงด้านบน (อิมเมจ `off`/`docker`/`agent`/`none`/`bookworm-slim`/เครือข่าย `none`/ฯลฯ) เป็นค่าเริ่มต้นจริงของ OpenClaw ไม่ใช่เพียงค่าตัวอย่าง

<Accordion title="รายละเอียดแซนด์บ็อกซ์">

**แบ็กเอนด์:**

- `docker`: รันไทม์ Docker ภายในเครื่อง (ค่าเริ่มต้น)
- `ssh`: รันไทม์ระยะไกลทั่วไปที่ใช้ SSH
- `openshell`: รันไทม์ OpenShell

เมื่อเลือก `backend: "openshell"` การตั้งค่าเฉพาะรันไทม์จะย้ายไปยัง
`plugins.entries.openshell.config`

**การกำหนดค่าแบ็กเอนด์ SSH:**

- `target`: เป้าหมาย SSH ในรูปแบบ `user@host[:port]`
- `command`: คำสั่งไคลเอ็นต์ SSH (ค่าเริ่มต้น: `ssh`)
- `workspaceRoot`: รากระยะไกลแบบสัมบูรณ์ที่ใช้สำหรับพื้นที่ทำงานแยกตามขอบเขต (ค่าเริ่มต้น: `/tmp/openclaw-sandboxes`)
- `identityFile` / `certificateFile` / `knownHostsFile`: ไฟล์ภายในเครื่องที่มีอยู่ซึ่งส่งให้ OpenSSH
- `identityData` / `certificateData` / `knownHostsData`: เนื้อหาแบบอินไลน์หรือ SecretRefs ที่ OpenClaw สร้างเป็นไฟล์ชั่วคราวขณะรัน
- `strictHostKeyChecking` / `updateHostKeys`: ตัวเลือกนโยบายคีย์โฮสต์ของ OpenSSH (ทั้งคู่มีค่าเริ่มต้นเป็น `true`)

**ลำดับความสำคัญของการยืนยันตัวตน SSH:**

- `identityData` มีลำดับความสำคัญเหนือ `identityFile`
- `certificateData` มีลำดับความสำคัญเหนือ `certificateFile`
- `knownHostsData` มีลำดับความสำคัญเหนือ `knownHostsFile`
- ค่าของ `*Data` ที่อ้างอิง SecretRef จะถูกแก้ค่าจากสแนปช็อตรันไทม์ของข้อมูลลับที่ใช้งานอยู่ก่อนเริ่มเซสชันแซนด์บ็อกซ์

**ลักษณะการทำงานของแบ็กเอนด์ SSH:**

- ตั้งต้นพื้นที่ทำงานระยะไกลหนึ่งครั้งหลังการสร้างหรือสร้างใหม่
- จากนั้นคงพื้นที่ทำงาน SSH ระยะไกลไว้เป็นแหล่งข้อมูลหลัก
- กำหนดเส้นทาง `exec` เครื่องมือไฟล์ และพาธสื่อผ่าน SSH
- ไม่ซิงค์การเปลี่ยนแปลงระยะไกลกลับมายังโฮสต์โดยอัตโนมัติ
- ไม่รองรับคอนเทนเนอร์เบราว์เซอร์แบบแซนด์บ็อกซ์

**การเข้าถึงพื้นที่ทำงาน:**

- `none`: พื้นที่ทำงานแซนด์บ็อกซ์แยกตามขอบเขตภายใต้ `~/.openclaw/sandboxes` (ค่าเริ่มต้น)
- `ro`: พื้นที่ทำงานแซนด์บ็อกซ์ที่ `/workspace` โดยเมานต์พื้นที่ทำงานของเอเจนต์แบบอ่านอย่างเดียวที่ `/agent`
- `rw`: เมานต์พื้นที่ทำงานของเอเจนต์แบบอ่าน/เขียนที่ `/workspace`

**ขอบเขต:**

- `session`: คอนเทนเนอร์และพื้นที่ทำงานแยกต่อเซสชัน
- `agent`: หนึ่งคอนเทนเนอร์และหนึ่งพื้นที่ทำงานต่อเอเจนต์ (ค่าเริ่มต้น)
- `shared`: ใช้คอนเทนเนอร์และพื้นที่ทำงานร่วมกัน (ไม่มีการแยกข้ามเซสชัน)

**การกำหนดค่า Plugin OpenShell:**

```json5
{
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          mode: "mirror", // มิเรอร์ (ค่าเริ่มต้น) | ระยะไกล
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

- `mirror`: ตั้งต้นระยะไกลจากภายในเครื่องก่อนดำเนินการ และซิงค์กลับหลังดำเนินการ โดยพื้นที่ทำงานภายในเครื่องยังคงเป็นแหล่งข้อมูลหลัก
- `remote`: ตั้งต้นระยะไกลหนึ่งครั้งเมื่อสร้างแซนด์บ็อกซ์ จากนั้นคงพื้นที่ทำงานระยะไกลไว้เป็นแหล่งข้อมูลหลัก

ในโหมด `remote` การแก้ไขภายในเครื่องโฮสต์ที่ทำนอก OpenClaw จะไม่ถูกซิงค์เข้าแซนด์บ็อกซ์โดยอัตโนมัติหลังขั้นตอนการตั้งต้น
การรับส่งข้อมูลใช้ SSH เข้าไปยังแซนด์บ็อกซ์ OpenShell แต่ Plugin เป็นผู้จัดการวงจรชีวิตของแซนด์บ็อกซ์และการซิงค์มิเรอร์ที่ไม่บังคับ

**`setupCommand`** ทำงานหนึ่งครั้งหลังสร้างคอนเทนเนอร์ (ผ่าน `sh -lc`) ต้องมีการเชื่อมต่อเครือข่ายขาออก รากที่เขียนได้ และผู้ใช้ root

**คอนเทนเนอร์มีค่าเริ่มต้นเป็น `network: "none"`** — ตั้งเป็น `"bridge"` (หรือเครือข่ายบริดจ์แบบกำหนดเอง) หากเอเจนต์ต้องการการเข้าถึงขาออก
`"host"` ถูกบล็อก โดยค่าเริ่มต้น `"container:<id>"` จะถูกบล็อกด้วย เว้นแต่จะตั้งค่า
`sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true` อย่างชัดเจน (ใช้เมื่อฉุกเฉิน)
เทิร์นของเซิร์ฟเวอร์แอป Codex ในแซนด์บ็อกซ์ OpenClaw ที่ใช้งานอยู่จะใช้การตั้งค่าการเชื่อมต่อขาออกเดียวกันนี้สำหรับการเข้าถึงเครือข่ายในโหมดโค้ดแบบเนทีฟ

**ไฟล์แนบขาเข้า** จะถูกจัดเตรียมไว้ใน `media/inbound/*` ภายในพื้นที่ทำงานที่ใช้งานอยู่

**`docker.binds`** เมานต์ไดเรกทอรีโฮสต์เพิ่มเติม โดยผสานการผูกแบบส่วนกลางและแบบต่อเอเจนต์เข้าด้วยกัน

**เบราว์เซอร์แบบแซนด์บ็อกซ์** (`sandbox.browser.enabled` ค่าเริ่มต้น `false`): Chromium + CDP ในคอนเทนเนอร์ โดยแทรก URL ของ noVNC ลงในพรอมต์ระบบ ไม่ต้องใช้ `browser.enabled` ใน `openclaw.json`
การเข้าถึงสำหรับผู้สังเกตการณ์ผ่าน noVNC ใช้การยืนยันตัวตน VNC เป็นค่าเริ่มต้น และ OpenClaw จะสร้าง URL โทเค็นอายุสั้น (แทนการเปิดเผยรหัสผ่านใน URL ที่แชร์)

- `allowHostControl: false` (ค่าเริ่มต้น) ป้องกันไม่ให้เซสชันแบบแซนด์บ็อกซ์กำหนดเป้าหมายไปยังเบราว์เซอร์ของโฮสต์
- `network` มีค่าเริ่มต้นเป็น `openclaw-sandbox-browser` (เครือข่ายบริดจ์เฉพาะ) ตั้งเป็น `bridge` เฉพาะเมื่อต้องการการเชื่อมต่อบริดจ์ส่วนกลางอย่างชัดเจน ที่นี่ `"host"` ก็ถูกบล็อกเช่นกัน
- `cdpSourceRange` จำกัดการรับส่งข้อมูลขาเข้า CDP ที่ขอบคอนเทนเนอร์ให้อยู่ในช่วง CIDR ได้โดยไม่บังคับ (ตัวอย่างเช่น `172.21.0.1/32`)
- `sandbox.browser.binds` เมานต์ไดเรกทอรีโฮสต์เพิ่มเติมเฉพาะในคอนเทนเนอร์เบราว์เซอร์แบบแซนด์บ็อกซ์ เมื่อตั้งค่า (รวมถึง `[]`) ค่านี้จะแทนที่ `docker.binds` สำหรับคอนเทนเนอร์เบราว์เซอร์
- Chromium ของคอนเทนเนอร์เบราว์เซอร์แบบแซนด์บ็อกซ์จะเริ่มทำงานพร้อม `--no-sandbox --disable-setuid-sandbox` เสมอ (คอนเทนเนอร์ไม่มีองค์ประกอบพื้นฐานของเคอร์เนลที่แซนด์บ็อกซ์ของ Chrome ต้องใช้) และไม่มีตัวเลือกการกำหนดค่าสำหรับเปลี่ยนพฤติกรรมนี้
- ค่าเริ่มต้นในการเริ่มทำงานกำหนดไว้ใน `scripts/sandbox-browser-entrypoint.sh` และปรับแต่งสำหรับโฮสต์คอนเทนเนอร์:
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
    เปิดใช้งานเป็นค่าเริ่มต้น และสามารถปิดใช้งานด้วย
    `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0` หากการใช้ WebGL/3D จำเป็นต้องทำเช่นนั้น
  - `--disable-extensions` (เปิดใช้งานเป็นค่าเริ่มต้น); `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0`
    เปิดใช้งานส่วนขยายอีกครั้ง หากเวิร์กโฟลว์ของคุณต้องพึ่งพาส่วนขยายเหล่านั้น
  - `--renderer-process-limit=2` เป็นค่าเริ่มต้น; เปลี่ยนได้ด้วย
    `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` และตั้ง `0` เพื่อใช้ขีดจำกัด
    กระบวนการเริ่มต้นของ Chromium
  - `--headless=new` เฉพาะเมื่อเปิดใช้งาน `headless`
  - ค่าเริ่มต้นเหล่านี้เป็นค่าพื้นฐานของอิมเมจคอนเทนเนอร์ หากต้องการเปลี่ยนค่าเริ่มต้นของคอนเทนเนอร์ ให้ใช้อิมเมจเบราว์เซอร์แบบกำหนดเองพร้อม
    จุดเริ่มต้นแบบกำหนดเอง

</Accordion>

การทำแซนด์บ็อกซ์เบราว์เซอร์และ `sandbox.docker.binds` รองรับเฉพาะ Docker

สร้างอิมเมจ (จากการเช็กเอาต์ซอร์ส):

```bash
scripts/sandbox-setup.sh           # อิมเมจแซนด์บ็อกซ์หลัก
scripts/sandbox-browser-setup.sh   # อิมเมจเบราว์เซอร์ที่ไม่บังคับ
```

สำหรับการติดตั้ง npm โดยไม่มีการเช็กเอาต์ซอร์ส โปรดดู [การทำแซนด์บ็อกซ์ § อิมเมจและการตั้งค่า](/th/gateway/sandboxing#images-and-setup) สำหรับคำสั่ง `docker build` แบบอินไลน์

### `agents.list` (การแทนค่าต่อเอเจนต์)

ใช้ `agents.list[].tts` เพื่อกำหนดผู้ให้บริการ TTS, เสียง, โมเดล,
สไตล์ หรือโหมด TTS อัตโนมัติให้แต่ละเอเจนต์ บล็อกของเอเจนต์จะผสานเชิงลึกทับ
`messages.tts` ส่วนกลาง ดังนั้นข้อมูลประจำตัวที่ใช้ร่วมกันจึงเก็บไว้ในที่เดียวได้ ขณะที่แต่ละ
เอเจนต์แทนค่าเฉพาะฟิลด์เสียงหรือผู้ให้บริการที่จำเป็น ค่าที่แทนของเอเจนต์ที่ใช้งานอยู่
มีผลกับการตอบกลับด้วยเสียงอัตโนมัติ, `/tts audio`, `/tts status` และ
เครื่องมือเอเจนต์ `tts` โปรดดูตัวอย่างผู้ให้บริการและลำดับความสำคัญที่
[การแปลงข้อความเป็นเสียงพูด](/th/tools/tts#per-agent-voice-overrides)

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
        model: "anthropic/claude-opus-4-6", // หรือ { primary, fallbacks }
        utilityModel: "openai/gpt-5.4-mini",
        thinkingDefault: "high", // แทนค่าระดับการคิดต่อเอเจนต์
        reasoningDefault: "on", // แทนค่าการแสดงเหตุผลต่อเอเจนต์
        fastModeDefault: false, // แทนค่าโหมดรวดเร็วต่อเอเจนต์
        params: { cacheRetention: "none" }, // แทนค่าพารามิเตอร์ defaults.models ที่ตรงกันตามคีย์
        tts: {
          providers: {
            elevenlabs: { speakerVoiceId: "EXAVITQu4vr4xnSDxMaL" },
          },
        },
        skills: ["docs-search"], // แทนที่ agents.defaults.skills เมื่อตั้งค่า
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

- `id`: รหัสเอเจนต์แบบคงที่ (จำเป็น)
- `default`: เมื่อตั้งค่าไว้หลายรายการ รายการแรกจะมีผล (มีการบันทึกคำเตือน) หากไม่ได้ตั้งค่าไว้ รายการแรกในลิสต์จะเป็นค่าเริ่มต้น
- `model`: รูปแบบสตริงกำหนดโมเดลหลักแบบเคร่งครัดต่อเอเจนต์โดยไม่มีโมเดลสำรอง ส่วนรูปแบบออบเจ็กต์ `{ primary }` ก็เคร่งครัดเช่นกัน เว้นแต่จะเพิ่ม `fallbacks` ใช้ `{ primary, fallbacks: [...] }` เพื่อให้เอเจนต์นั้นใช้โมเดลสำรองได้ หรือใช้ `{ primary, fallbacks: [] }` เพื่อระบุพฤติกรรมแบบเคร่งครัดอย่างชัดเจน งาน Cron ที่เขียนทับเฉพาะ `primary` จะยังคงสืบทอดโมเดลสำรองเริ่มต้น เว้นแต่จะตั้งค่า `fallbacks: []`
- `utilityModel`: ตัวเลือกเขียนทับต่อเอเจนต์สำหรับงานภายในระยะสั้น เช่น ชื่อเซสชันและเธรดที่สร้างขึ้น หากไม่มีจะย้อนกลับไปใช้ `agents.defaults.utilityModel` แล้วจึงใช้ค่าเริ่มต้นของโมเดลขนาดเล็กที่ประกาศโดยผู้ให้บริการซึ่งมีผลกับเซสชัน ชื่อบนแดชบอร์ดจะลองอีกครั้งหนึ่งโดยใช้โมเดลเซสชันปกติที่มีผล สตริงว่างจะข้ามเส้นทางยูทิลิตีทางเลือกสำหรับเอเจนต์นี้โดยไม่ปิดการสร้างชื่อบนแดชบอร์ด
- `params`: พารามิเตอร์สตรีมต่อเอเจนต์ที่ผสานทับรายการโมเดลที่เลือกใน `agents.defaults.models` ใช้สำหรับการเขียนทับเฉพาะเอเจนต์ เช่น `cacheRetention`, `temperature` หรือ `maxTokens` โดยไม่ต้องทำซ้ำแค็ตตาล็อกโมเดลทั้งหมด
- `tts`: ตัวเลือกเขียนทับการแปลงข้อความเป็นเสียงพูดต่อเอเจนต์ บล็อกนี้ผสานแบบลึกทับ `messages.tts` ดังนั้นให้เก็บข้อมูลประจำตัวของผู้ให้บริการที่ใช้ร่วมกันและนโยบายสำรองไว้ใน `messages.tts` และตั้งค่าเฉพาะค่าที่เจาะจงกับบุคลิก เช่น ผู้ให้บริการ เสียง โมเดล สไตล์ หรือโหมดอัตโนมัติไว้ที่นี่
- `skills`: รายการอนุญาต Skills ต่อเอเจนต์ที่เป็นตัวเลือก หากละไว้ เอเจนต์จะสืบทอด `agents.defaults.skills` เมื่อมีการตั้งค่าไว้ รายการที่ระบุอย่างชัดเจนจะแทนที่ค่าเริ่มต้นแทนการผสาน และ `[]` หมายถึงไม่มี Skills
- `thinkingDefault`: ระดับการคิดเริ่มต้นต่อเอเจนต์ที่เป็นตัวเลือก (`off | minimal | low | medium | high | xhigh | adaptive | max`) เขียนทับ `agents.defaults.thinkingDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้งค่าการเขียนทับต่อข้อความหรือเซสชัน โปรไฟล์ผู้ให้บริการ/โมเดลที่เลือกเป็นตัวกำหนดว่าค่าใดใช้ได้ สำหรับ Google Gemini ค่า `adaptive` จะคงการคิดแบบไดนามิกที่ผู้ให้บริการควบคุมไว้ (`thinkingLevel` จะถูกละไว้ใน Gemini 3/3.1 และ `thinkingBudget: -1` ใน Gemini 2.5)
- `reasoningDefault`: การมองเห็นเหตุผลเริ่มต้นต่อเอเจนต์ที่เป็นตัวเลือก (`on | off | stream`) เขียนทับ `agents.defaults.reasoningDefault` สำหรับเอเจนต์นี้เมื่อไม่ได้ตั้งค่าการเขียนทับเหตุผลต่อข้อความหรือเซสชัน
- `fastModeDefault`: ค่าเริ่มต้นต่อเอเจนต์สำหรับโหมดเร็วที่เป็นตัวเลือก (`"auto" | true | false`) มีผลเมื่อไม่ได้ตั้งค่าการเขียนทับโหมดเร็วต่อข้อความหรือเซสชัน
- `models`: ตัวเลือกเขียนทับแค็ตตาล็อกโมเดล/รันไทม์ต่อเอเจนต์ โดยใช้รหัส `provider/model` แบบเต็มเป็นคีย์ ใช้ `models["provider/model"].agentRuntime` สำหรับข้อยกเว้นรันไทม์ต่อเอเจนต์
- `runtime`: ตัวอธิบายรันไทม์ต่อเอเจนต์ที่เป็นตัวเลือก ใช้ `type: "acp"` พร้อมค่าเริ่มต้น `runtime.acp` (`agent`, `backend`, `mode`, `cwd`) เมื่อเอเจนต์ควรใช้เซสชันชุดควบคุม ACP เป็นค่าเริ่มต้น
- `identity.avatar`: พาธที่สัมพันธ์กับเวิร์กสเปซ, URL `http(s)` หรือ URI `data:`
- ไฟล์รูปภาพ `identity.avatar` ในเครื่องที่มีพาธสัมพันธ์กับเวิร์กสเปซจำกัดขนาดไว้ที่ 2 MB ส่วน URL `http(s)` และ URI `data:` จะไม่ถูกตรวจสอบเทียบกับขีดจำกัดขนาดไฟล์ในเครื่อง
- `identity` อนุมานค่าเริ่มต้นดังนี้: `ackReaction` จาก `emoji`, `mentionPatterns` จาก `name`/`emoji`
- `subagents.allowAgents`: รายการอนุญาตรหัสเอเจนต์ที่กำหนดค่าไว้สำหรับเป้าหมาย `sessions_spawn.agentId` ที่ระบุอย่างชัดเจน (`["*"]` = เป้าหมายที่กำหนดค่าไว้ใดๆ; ค่าเริ่มต้น: เฉพาะเอเจนต์เดียวกัน) ให้รวมรหัสผู้ร้องขอเมื่อควรอนุญาตการเรียก `agentId` ที่กำหนดเป้าหมายเป็นตัวเอง รายการเก่าที่การกำหนดค่าเอเจนต์ถูกลบไปแล้วจะถูก `sessions_spawn` ปฏิเสธและไม่รวมอยู่ใน `agents_list`; เรียกใช้ `openclaw doctor --fix` เพื่อล้างรายการเหล่านั้น หรือเพิ่มรายการ `agents.list[]` ขั้นต่ำ หากเป้าหมายนั้นควรยังสร้างได้พร้อมสืบทอดค่าเริ่มต้น
- ตัวป้องกันการสืบทอดแซนด์บ็อกซ์: หากเซสชันผู้ร้องขออยู่ในแซนด์บ็อกซ์ `sessions_spawn` จะปฏิเสธเป้าหมายที่จะทำงานนอกแซนด์บ็อกซ์
- `subagents.requireAgentId`: เมื่อเป็นจริง ให้บล็อกการเรียก `sessions_spawn` ที่ละ `agentId` (บังคับให้เลือกโปรไฟล์อย่างชัดเจน; ค่าเริ่มต้น: false)
- `subagents.maxConcurrent`: จำนวนสูงสุดของการทำงานของเอเจนต์ลูกพร้อมกันในการดำเนินงานของเอเจนต์ย่อย ค่าเริ่มต้น: `8`
- `subagents.maxChildrenPerAgent`: จำนวนเอเจนต์ลูกที่ใช้งานอยู่สูงสุดซึ่งเซสชันเอเจนต์หนึ่งเซสชันสามารถสร้างได้ ค่าเริ่มต้น: `5`
- `subagents.maxSpawnDepth`: ความลึกการซ้อนสูงสุดสำหรับการสร้างเอเจนต์ย่อย (`1`-`5`) ค่าเริ่มต้น: `1` (ไม่มีการซ้อน)
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

### ฟิลด์การจับคู่การผูก

- `type` (ไม่บังคับ): `route` สำหรับการกำหนดเส้นทางปกติ (หากไม่มีชนิดจะใช้ route เป็นค่าเริ่มต้น), `acp` สำหรับการผูกบทสนทนา ACP แบบคงอยู่
- `match.channel` (จำเป็น)
- `match.accountId` (ไม่บังคับ; `*` = บัญชีใดก็ได้; หากละไว้ = บัญชีเริ่มต้น)
- `match.peer` (ไม่บังคับ; `{ kind: direct|group|channel, id }`)
- `match.guildId` / `match.teamId` (ไม่บังคับ; เฉพาะช่องทาง)
- `acp` (ไม่บังคับ; สำหรับ `type: "acp"` เท่านั้น): `{ mode, label, cwd, backend }`

**ลำดับการจับคู่แบบกำหนดแน่นอน:**

1. `match.peer`
2. `match.guildId`
3. `match.teamId`
4. `match.accountId` (ตรงกันทุกประการ ไม่มีเพียร์/กิลด์/ทีม)
5. `match.accountId: "*"` (ทั้งช่องทาง)
6. เอเจนต์เริ่มต้น

ภายในแต่ละระดับ รายการ `bindings` แรกที่ตรงกันจะมีผล

สำหรับรายการ `type: "acp"` OpenClaw จะจับคู่ตามข้อมูลประจำตัวบทสนทนาที่ตรงกันทุกประการ (`match.channel` + บัญชี + `match.peer.id`) และไม่ใช้ลำดับระดับการผูกเส้นทางด้านบน

### โปรไฟล์การเข้าถึงต่อเอเจนต์

<Accordion title="สิทธิ์เข้าถึงเต็มรูปแบบ (ไม่มีแซนด์บ็อกซ์)">

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

<Accordion title="เครื่องมือแบบอ่านอย่างเดียว + เวิร์กสเปซ">

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

ดูรายละเอียดลำดับความสำคัญที่ [แซนด์บ็อกซ์และเครื่องมือสำหรับหลายเอเจนต์](/th/tools/multi-agent-sandbox-tools)

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
    sendPolicy: {
      rules: [{ action: "deny", match: { channel: "discord", chatType: "group" } }],
      default: "allow",
    },
  },
}
```

<Accordion title="รายละเอียดฟิลด์เซสชัน">

- **`scope`**: กลยุทธ์พื้นฐานสำหรับจัดกลุ่มเซสชันในบริบทแชตกลุ่ม
  - `per-sender` (ค่าเริ่มต้น): ผู้ส่งแต่ละรายมีเซสชันแยกกันภายในบริบทของช่องทาง
  - `global`: ผู้เข้าร่วมทั้งหมดในบริบทของช่องทางใช้เซสชันเดียวร่วมกัน (ใช้เฉพาะเมื่อต้องการบริบทร่วมกัน)
- **`dmScope`**: วิธีจัดกลุ่มข้อความส่วนตัว
  - `main`: ข้อความส่วนตัวทั้งหมดใช้เซสชันหลักร่วมกัน
  - `per-peer`: แยกตาม ID ผู้ส่งข้ามช่องทาง
  - `per-channel-peer`: แยกตามช่องทาง + ผู้ส่ง (แนะนำสำหรับกล่องข้อความที่มีผู้ใช้หลายราย)
  - `per-account-channel-peer`: แยกตามบัญชี + ช่องทาง + ผู้ส่ง (แนะนำสำหรับหลายบัญชี)
- **`identityLinks`**: จับคู่ ID มาตรฐานกับเพียร์ที่มีคำนำหน้าผู้ให้บริการเพื่อใช้เซสชันร่วมกันข้ามช่องทาง คำสั่งเชื่อมต่อ เช่น `/dock_discord` ใช้แผนผังเดียวกันเพื่อสลับเส้นทางตอบกลับของเซสชันที่ใช้งานอยู่ไปยังเพียร์ของช่องทางอื่นที่เชื่อมโยงไว้ โปรดดู [การเชื่อมต่อช่องทาง](/th/concepts/channel-docking)
- **`reset`**: นโยบายรีเซ็ตหลัก `none` ปิดการรีเซ็ตอัตโนมัติและเป็นค่าเริ่มต้น โดย Compaction จะจำกัดบริบทที่ใช้งานอยู่แทน `daily` รีเซ็ต ณ เวลา `atHour` ตามเวลาท้องถิ่น ส่วน `idle` รีเซ็ตหลังจาก `idleMinutes` เมื่อกำหนดค่าทั้งสองอย่าง ค่าที่หมดเวลาก่อนจะมีผลเหนือกว่า `/new` และ `/reset` ยังคงใช้ได้ในทุกโหมด ความสดใหม่สำหรับการรีเซ็ตรายวันใช้ `sessionStartedAt` ของแถวเซสชัน ส่วนความสดใหม่สำหรับการรีเซ็ตเมื่อไม่มีการใช้งานใช้ `lastInteractionAt` การเขียนจากเหตุการณ์เบื้องหลัง/ระบบ เช่น Heartbeat, การปลุกโดย Cron, การแจ้งเตือนการดำเนินการ และการบันทึกข้อมูลของ Gateway สามารถอัปเดต `updatedAt` ได้ แต่จะไม่ทำให้เซสชันรายวัน/ไม่มีการใช้งานยังคงสดใหม่
- **`resetByType`**: การแทนที่ตามประเภท (`direct`, `group`, `thread`) รองรับ `dm` แบบเดิมในฐานะนามแฝงของ `direct`
- **`resetByChannel`**: การแทนที่การรีเซ็ตตามช่องทาง โดยใช้ ID ผู้ให้บริการ/ช่องทางเป็นคีย์ เมื่อช่องทางของเซสชันมีรายการที่ตรงกัน รายการนั้นจะมีผลเหนือ `resetByType`/`reset` สำหรับเซสชันนั้นโดยสมบูรณ์ ใช้เฉพาะเมื่อช่องทางหนึ่งต้องการลักษณะการรีเซ็ตที่แตกต่างจากนโยบายระดับประเภท
- **`mainKey`**: ฟิลด์แบบเดิม รันไทม์ใช้ `"main"` สำหรับกลุ่มแชตส่วนตัวหลักเสมอ
- **`sendPolicy`**: จับคู่ตาม `channel`, `chatType` (`direct|group|channel` พร้อมนามแฝงแบบเดิม `dm`), `keyPrefix` หรือ `rawKeyPrefix` การปฏิเสธรายการแรกมีผลเหนือกว่า
- **`maintenance`**: การควบคุมการล้างและระยะเวลาการเก็บรักษาที่เก็บเซสชัน
  - `mode`: `enforce` ใช้การล้างข้อมูลและเป็นค่าเริ่มต้น ส่วน `warn` แสดงเฉพาะคำเตือน
  - `pruneAfter`: เกณฑ์อายุสำหรับรายการที่ล้าสมัย (ค่าเริ่มต้น `30d`)
  - `maxEntries`: จำนวนสูงสุดของรายการเซสชัน SQLite (ค่าเริ่มต้น `500`) การเขียนขณะรันไทม์จะล้างข้อมูลเป็นชุดโดยมีบัฟเฟอร์ขีดจำกัดสูงขนาดเล็กสำหรับขีดจำกัดระดับการใช้งานจริง ส่วน `openclaw sessions cleanup --enforce` จะใช้ขีดจำกัดทันที
  - เซสชันตรวจสอบการรันโมเดลของ Gateway ที่มีอายุสั้นใช้ระยะเวลาการเก็บรักษาคงที่ `24h` แต่การล้างข้อมูลจะทำงานเมื่อมีแรงกดดันเท่านั้น กล่าวคือจะลบแถวการตรวจสอบการรันโมเดลแบบเคร่งครัดที่ล้าสมัยเฉพาะเมื่อถึงเกณฑ์การบำรุงรักษา/ขีดจำกัดรายการเซสชัน เฉพาะคีย์การตรวจสอบแบบระบุชัดเจนที่ตรงกับ `agent:*:explicit:model-run-<uuid>` อย่างเคร่งครัดเท่านั้นที่เข้าเกณฑ์ เซสชันส่วนตัว กลุ่ม เธรด Cron ฮุก Heartbeat, ACP และเอเจนต์ย่อยตามปกติจะไม่สืบทอดระยะเวลาการเก็บรักษา 24h นี้ เมื่อการล้างข้อมูลการรันโมเดลทำงาน ระบบจะดำเนินการก่อนการล้างรายการล้าสมัย `pruneAfter` ในวงกว้างและขีดจำกัด `maxEntries`
  - สคีมาปัจจุบันปฏิเสธ `rotateBytes` แบบเดิม โดย `openclaw doctor --fix` จะลบค่านี้ออกจากการกำหนดค่ารุ่นเก่า
  - `resetArchiveRetention`: การเก็บรักษาตามอายุสำหรับไฟล์เก็บถาวรของบทสนทนาที่รีเซ็ต/ลบ โดยค่าเริ่มต้น ไฟล์เก็บถาวรจะยังคงอยู่จนกว่าจะถูกนำออกตามงบประมาณดิสก์ กำหนดระยะเวลาเพื่อเลือกใช้การลบตามเวลาจริง หรือกำหนด `false` เพื่อปิดอย่างชัดเจน
  - `maxDiskBytes`: งบประมาณดิสก์สำหรับไดเรกทอรีเซสชันที่ไม่บังคับ ในโหมด `warn` ระบบจะบันทึกคำเตือน ส่วนในโหมด `enforce` ระบบจะลบอาร์ติแฟกต์/เซสชันที่เก่าที่สุดก่อน
  - `highWaterBytes`: เป้าหมายที่ไม่บังคับหลังการล้างตามงบประมาณ ค่าเริ่มต้นคือ `80%` ของ `maxDiskBytes`
- **`threadBindings`**: ค่าเริ่มต้นส่วนกลางสำหรับคุณลักษณะเซสชันที่ผูกกับเธรด
  - `enabled`: สวิตช์เริ่มต้นหลัก (ผู้ให้บริการสามารถแทนที่ได้ Discord ใช้ `channels.discord.threadBindings.enabled`)
  - `idleHours`: ค่าเริ่มต้นสำหรับยกเลิกการโฟกัสอัตโนมัติเมื่อไม่มีการใช้งาน หน่วยเป็นชั่วโมง (`0` ปิดการทำงาน ผู้ให้บริการสามารถแทนที่ได้)
  - `maxAgeHours`: อายุสูงสุดแบบตายตัวโดยค่าเริ่มต้น หน่วยเป็นชั่วโมง (`0` ปิดการทำงาน ผู้ให้บริการสามารถแทนที่ได้)
  - `spawnSessions`: เงื่อนไขเริ่มต้นสำหรับสร้างเซสชันงานที่ผูกกับเธรดจาก `sessions_spawn` และการสร้างเธรด ACP ค่าเริ่มต้นคือ `true` เมื่อเปิดใช้งานการผูกเธรด ผู้ให้บริการ/บัญชีสามารถแทนที่ได้
  - `defaultSpawnContext`: บริบทเอเจนต์ย่อยแบบเนทีฟโดยค่าเริ่มต้นสำหรับการสร้างที่ผูกกับเธรด (`"fork"` หรือ `"isolated"`) ค่าเริ่มต้นคือ `"fork"`

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
      debounceMs: 2000, // 0 ปิดการทำงาน
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

ลำดับการตัดสินค่า (ค่าที่เฉพาะเจาะจงที่สุดมีผลเหนือกว่า): บัญชี → ช่องทาง → ส่วนกลาง `""` ปิดการทำงานและหยุดการไล่ระดับ `"auto"` สร้างค่าจาก `[{identity.name}]`

**ตัวแปรเทมเพลต:**

| ตัวแปร          | คำอธิบาย            | ตัวอย่าง                     |
| ----------------- | ---------------------- | --------------------------- |
| `{model}`         | ชื่อย่อของโมเดล       | `claude-opus-4-6`           |
| `{modelFull}`     | ตัวระบุโมเดลแบบเต็ม  | `anthropic/claude-opus-4-6` |
| `{provider}`      | ชื่อผู้ให้บริการ          | `anthropic`                 |
| `{thinkingLevel}` | ระดับการคิดปัจจุบัน | `high`, `low`, `off`        |
| `{identity.name}` | ชื่ออัตลักษณ์ของเอเจนต์    | (เหมือนกับ `"auto"`)          |

ตัวแปรไม่แยกตัวพิมพ์เล็กและตัวพิมพ์ใหญ่ `{think}` เป็นนามแฝงของ `{thinkingLevel}`

### รีแอ็กชันตอบรับ

- ค่าเริ่มต้นคือ `identity.emoji` ของเอเจนต์ที่ใช้งานอยู่ หากไม่มีให้ใช้ `"👀"` กำหนด `""` เพื่อปิดการทำงาน
- การแทนที่ตามช่องทาง: `channels.<channel>.ackReaction`, `channels.<channel>.accounts.<id>.ackReaction`
- ลำดับการตัดสินค่า: บัญชี → ช่องทาง → `messages.ackReaction` → ค่าอัตลักษณ์สำรอง
- ขอบเขต: `group-mentions` (ค่าเริ่มต้น), `group-all`, `direct`, `all` หรือ `off`/`none` (ปิดรีแอ็กชันตอบรับทั้งหมด)
- `removeAckAfterReply`: ลบรีแอ็กชันตอบรับหลังตอบกลับในช่องทางที่รองรับรีแอ็กชัน เช่น Slack, Discord, Signal, Telegram, WhatsApp และ iMessage
- `messages.statusReactions.enabled`: เปิดใช้งานรีแอ็กชันสถานะวงจรชีวิตบน Slack, Discord, Signal, Telegram และ WhatsApp
  บน Discord หากไม่ได้กำหนดค่า รีแอ็กชันสถานะจะยังคงเปิดใช้งานเมื่อรีแอ็กชันตอบรับทำงานอยู่
  บน Slack, Signal, Telegram และ WhatsApp ให้กำหนดเป็น `true` อย่างชัดเจนเพื่อเปิดใช้งานรีแอ็กชันสถานะวงจรชีวิต
  โดยค่าเริ่มต้น Slack ใช้สถานะเธรดผู้ช่วยแบบเนทีฟและข้อความแสดงการโหลดแบบหมุนเวียนเพื่อแสดงความคืบหน้า พร้อมคงรีแอ็กชันตอบรับที่กำหนดค่าไว้ให้คงที่
- `messages.statusReactions.emojis`: แทนที่คีย์อีโมจิวงจรชีวิต:
  `queued`, `thinking`, `compacting`, `tool`, `coding`, `web`, `deploy`, `build`,
  `concierge`, `done`, `error`, `stallSoft` และ `stallHard`
  Telegram อนุญาตเฉพาะชุดรีแอ็กชันที่กำหนดไว้ ดังนั้นอีโมจิที่กำหนดค่าแต่ไม่รองรับจะใช้
  รูปแบบสถานะที่รองรับและใกล้เคียงที่สุดสำหรับแชตนั้นแทน

### คิว

- `mode`: กลยุทธ์คิวสำหรับข้อความขาเข้าที่มาถึงขณะเซสชันกำลังทำงาน ค่าเริ่มต้น: `"steer"`
  - `steer`: แทรกพรอมต์ใหม่ลงในการทำงานที่กำลังดำเนินอยู่
  - `followup`: เรียกใช้พรอมต์ใหม่หลังจากการทำงานปัจจุบันเสร็จสิ้น
  - `collect`: รวมข้อความที่เข้ากันได้เป็นชุดและเรียกใช้พร้อมกันในภายหลัง
  - `interrupt`: ยกเลิกการทำงานปัจจุบันก่อนเริ่มพรอมต์ล่าสุด
- `debounceMs`: ระยะหน่วงก่อนส่งข้อความที่อยู่ในคิว/ถูกกำกับ ค่าเริ่มต้น: `500`
- `cap`: จำนวนข้อความในคิวสูงสุดก่อนใช้นโยบายการทิ้ง ค่าเริ่มต้น: `20`
- `drop`: กลยุทธ์เมื่อเกินขีดจำกัด `"summarize"` (ค่าเริ่มต้น) ทิ้งรายการเก่าที่สุดแต่เก็บสรุปแบบกระชับไว้ `"old"` ทิ้งรายการเก่าที่สุดโดยไม่เก็บสรุป ส่วน `"new"` ปฏิเสธรายการใหม่ล่าสุด
- `byChannel`: การแทนที่ `mode` ตามช่องทาง โดยใช้ ID ผู้ให้บริการเป็นคีย์
- `debounceMsByChannel`: การแทนที่ `debounceMs` ตามช่องทาง โดยใช้ ID ผู้ให้บริการเป็นคีย์

### การหน่วงรวมข้อความขาเข้า

รวมข้อความแบบข้อความล้วนที่ส่งต่อเนื่องอย่างรวดเร็วจากผู้ส่งรายเดียวกันเป็นหนึ่งรอบการทำงานของเอเจนต์ สื่อ/ไฟล์แนบจะส่งออกทันที คำสั่งควบคุมจะข้ามการหน่วงรวมข้อความ ค่าเริ่มต้น `debounceMs`: `2000`

### คีย์ข้อความอื่นๆ

- `channels.whatsapp.messagePrefix`: คำนำหน้าสำหรับ WhatsApp เท่านั้น ซึ่งเติมไว้หน้าข้อความผู้ใช้ขาเข้าก่อนถึงรันไทม์ของเอเจนต์
- `messages.visibleReplies`: ควบคุมการตอบกลับแหล่งที่มาที่มองเห็นได้ในการสนทนาแบบส่วนตัว กลุ่ม และช่องทาง (`"message_tool"` ต้องใช้ `message(action=send)` เพื่อแสดงผลลัพธ์ที่มองเห็นได้ ส่วน `"automatic"` โพสต์การตอบกลับตามปกติเช่นเดิม)
- `messages.usageTemplate` / `messages.responseUsage`: เทมเพลตส่วนท้าย `/usage` แบบกำหนดเองและโหมดการใช้งานเริ่มต้นต่อการตอบกลับ (`off | tokens | full` พร้อมนามแฝงแบบเดิม `on` สำหรับ `tokens`)
- `messages.groupChat.mentionPatterns` / `historyLimit`: ทริกเกอร์การกล่าวถึงในข้อความกลุ่มและการกำหนดขนาดหน้าต่างประวัติ
- `messages.suppressToolErrors`: เมื่อเป็น `true` จะระงับคำเตือนข้อผิดพลาดเครื่องมือ `⚠️` ที่แสดงต่อผู้ใช้ (เอเจนต์ยังคงเห็นข้อผิดพลาดในบริบทและลองใหม่ได้) ค่าเริ่มต้น: `false`

### TTS (การแปลงข้อความเป็นเสียงพูด)

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

- `auto` ควบคุมโหมด TTS อัตโนมัติเริ่มต้น: `off`, `always`, `inbound` หรือ `tagged` โดย `/tts on|off` สามารถแทนที่ค่ากำหนดภายในเครื่อง และ `/tts status` จะแสดงสถานะที่มีผล
- `summaryModel` แทนที่ `agents.defaults.model.primary` สำหรับการสรุปอัตโนมัติ
- `modelOverrides` เปิดใช้งานตามค่าเริ่มต้น (`enabled !== false`); ส่วน `modelOverrides.allowProvider` ต้องเลือกเปิดใช้งาน
- คีย์ API จะย้อนกลับไปใช้ `ELEVENLABS_API_KEY`/`XI_API_KEY` และ `OPENAI_API_KEY`
- ผู้ให้บริการเสียงพูดที่รวมมาให้เป็นของ Plugin หากตั้งค่า `plugins.allow` ให้รวม Plugin ของผู้ให้บริการ TTS แต่ละรายที่ต้องการใช้ ตัวอย่างเช่น `microsoft` สำหรับ Edge TTS โดยยอมรับรหัสผู้ให้บริการแบบเดิม `edge` เป็นนามแฝงของ `microsoft`
- `providers.openai.baseUrl` แทนที่ปลายทาง OpenAI TTS ลำดับการแก้ไขค่าคือการกำหนดค่า ตามด้วย `OPENAI_TTS_BASE_URL` แล้วจึง `https://api.openai.com/v1`
- เมื่อ `providers.openai.baseUrl` ชี้ไปยังปลายทางที่ไม่ใช่ OpenAI OpenClaw จะถือว่าปลายทางดังกล่าวเป็นเซิร์ฟเวอร์ TTS ที่เข้ากันได้กับ OpenAI และผ่อนปรนการตรวจสอบโมเดล/เสียง

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
- คีย์การสนทนาแบบแบนรุ่นเดิม (`talk.voiceId`, `talk.voiceAliases`, `talk.modelId`, `talk.outputFormat`, `talk.apiKey`) มีไว้เพื่อความเข้ากันได้เท่านั้น เรียกใช้ `openclaw doctor --fix` เพื่อเขียนการกำหนดค่าที่บันทึกไว้ใหม่เป็น `talk.providers.<provider>`
- รหัสเสียงจะย้อนกลับไปใช้ `ELEVENLABS_VOICE_ID` หรือ `SAG_VOICE_ID` (ลักษณะการทำงานของไคลเอนต์การสนทนาบน macOS)
- `providers.*.apiKey` รองรับสตริงข้อความธรรมดาหรือออบเจ็กต์ SecretRef
- การย้อนกลับไปใช้ `ELEVENLABS_API_KEY` จะมีผลเฉพาะเมื่อไม่ได้กำหนดค่าคีย์ API สำหรับการสนทนา
- `providers.*.voiceAliases` ช่วยให้คำสั่งการสนทนาใช้ชื่อที่เข้าใจง่ายได้
- `providers.mlx.modelId` เลือกรีโพ Hugging Face ที่ตัวช่วย MLX ภายในเครื่องของ macOS ใช้ หากละไว้ macOS จะใช้ `mlx-community/Soprano-80M-bf16`
- การเล่นเสียง MLX บน macOS ทำงานผ่านตัวช่วย `openclaw-mlx-tts` ที่รวมมาให้เมื่อมีอยู่ หรือผ่านไฟล์ปฏิบัติการใน `PATH`; `OPENCLAW_MLX_TTS_BIN` จะแทนที่พาธตัวช่วยสำหรับการพัฒนา
- `consultThinkingLevel` ควบคุมระดับการคิดสำหรับการเรียกใช้เอเจนต์ OpenClaw แบบเต็มที่อยู่เบื้องหลังการเรียก `openclaw_agent_consult` แบบเรียลไทม์ของการสนทนาใน Control UI ปล่อยไว้โดยไม่ตั้งค่าเพื่อคงลักษณะการทำงานปกติของเซสชัน/โมเดล
- `consultFastMode` ตั้งค่าการแทนที่โหมดเร็วแบบใช้ครั้งเดียวสำหรับการปรึกษาแบบเรียลไทม์ของการสนทนาใน Control UI โดยไม่เปลี่ยนการตั้งค่าโหมดเร็วปกติของเซสชัน
- `speechLocale` ตั้งค่ารหัสโลแคล BCP 47 ที่การรู้จำเสียงพูดของการสนทนาบน Android, iOS และ macOS ใช้ Android ยังใช้องค์ประกอบภาษาของรหัสดังกล่าวเพื่อช่วยกำกับการถอดเสียงอินพุตแบบเรียลไทม์ ปล่อยไว้โดยไม่ตั้งค่าเพื่อใช้ค่าเริ่มต้นของอุปกรณ์
- `silenceTimeoutMs` ควบคุมระยะเวลาที่โหมดการสนทนารอหลังจากผู้ใช้เงียบก่อนส่งข้อความถอดเสียง หากไม่ตั้งค่าจะใช้ช่วงหยุดชั่วคราวเริ่มต้นของแพลตฟอร์ม (`700 ms on macOS and Android, 900 ms on iOS`)
- `realtime.instructions` เพิ่มคำสั่งระบบสำหรับผู้ให้บริการต่อท้ายพรอมต์เรียลไทม์ในตัวของ OpenClaw เพื่อให้กำหนดค่ารูปแบบเสียงได้โดยไม่สูญเสียคำแนะนำเริ่มต้น `openclaw_agent_consult`
- `realtime.vadThreshold` ตั้งค่าเกณฑ์กิจกรรมเสียงของผู้ให้บริการตั้งแต่ `0` (ไวที่สุด) ถึง `1` (ไวน้อยที่สุด) หากไม่ตั้งค่าจะใช้ค่าเริ่มต้นของผู้ให้บริการ
- `realtime.silenceDurationMs` ตั้งค่าช่วงความเงียบที่เป็นจำนวนเต็มบวกก่อนที่ผู้ให้บริการจะยืนยันรอบการโต้ตอบแบบเรียลไทม์ของผู้ใช้ หากไม่ตั้งค่าจะใช้ค่าเริ่มต้นของผู้ให้บริการ
- `realtime.prefixPaddingMs` ตั้งค่าปริมาณเสียงที่เป็นจำนวนเต็มไม่ติดลบซึ่งเก็บไว้ก่อนเริ่มตรวจพบเสียงพูด หากไม่ตั้งค่าจะใช้ค่าเริ่มต้นของผู้ให้บริการ
- `realtime.reasoningEffort` ตั้งค่าระดับการให้เหตุผลเฉพาะของผู้ให้บริการสำหรับเซสชันเรียลไทม์ หากไม่ตั้งค่าจะใช้ค่าเริ่มต้นของผู้ให้บริการ
- `realtime.consultRouting`: `"provider-direct"` (ค่าเริ่มต้น) จะคงคำตอบโดยตรงจากผู้ให้บริการไว้ เมื่อผู้ให้บริการเรียลไทม์สร้างข้อความถอดเสียงสุดท้ายของผู้ใช้โดยไม่มี `openclaw_agent_consult` ส่วน `"force-agent-consult"` จะส่งคำขอที่เสร็จสมบูรณ์ผ่าน OpenClaw แทน

---

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference) — คีย์การกำหนดค่าอื่นทั้งหมด
- [การกำหนดค่า](/th/gateway/configuration) — งานทั่วไปและการตั้งค่าอย่างรวดเร็ว
- [ตัวอย่างการกำหนดค่า](/th/gateway/configuration-examples)
