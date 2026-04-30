---
read_when:
    - คุณต้องการระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์วงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบักฮุก
summary: 'ฮุก: ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-04-30T09:34:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6c567ab79fbff8228d174816e9fb4613f0544ea15a99b5917190a4066af0f57
    source_path: automation/hooks.md
    workflow: 16
---

ฮุกคือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางสิ่งเกิดขึ้นภายใน Gateway ฮุกสามารถถูกค้นพบจากไดเรกทอรีและตรวจสอบด้วย `openclaw hooks` ได้ Gateway จะโหลดฮุกภายในหลังจากคุณเปิดใช้งานฮุก หรือกำหนดค่ารายการฮุกอย่างน้อยหนึ่งรายการ ชุดฮุก ตัวจัดการแบบเดิม หรือไดเรกทอรีฮุกเพิ่มเติมเท่านั้น

ฮุกใน OpenClaw มีสองชนิด:

- **ฮุกภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเหตุการณ์ของเอเจนต์เกิดขึ้น เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์วงจรชีวิต
- **Webhooks**: ปลายทาง HTTP ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

ฮุกยังสามารถถูกบันเดิลไว้ภายใน plugins ได้ด้วย `openclaw hooks list` จะแสดงทั้งฮุกแบบสแตนด์อโลนและฮุกที่จัดการโดย Plugin

## เริ่มต้นอย่างรวดเร็ว

```bash
# List available hooks
openclaw hooks list

# Enable a hook
openclaw hooks enable session-memory

# Check hook status
openclaw hooks check

# Get detailed information
openclaw hooks info session-memory
```

## ประเภทเหตุการณ์

| เหตุการณ์                 | เวลาที่ทริกเกอร์                                           |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                     |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                   |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                    |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวฟังทั่วไป)                         |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                          |
| `session:compact:after`  | หลังจาก Compaction เสร็จสิ้น                              |
| `session:patch`          | เมื่อคุณสมบัติของเซสชันถูกแก้ไข                           |
| `agent:bootstrap`        | ก่อนที่จะฉีดไฟล์บูตสแตรปของเวิร์กสเปซ                      |
| `gateway:startup`        | หลังจากช่องทางเริ่มทำงานและโหลดฮุกแล้ว                    |
| `gateway:shutdown`       | เมื่อการปิด Gateway เริ่มต้น                               |
| `gateway:pre-restart`    | ก่อนการรีสตาร์ต Gateway ที่คาดไว้                          |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดๆ                                |
| `message:transcribed`    | หลังจากการถอดเสียงเสร็จสิ้น                               |
| `message:preprocessed`   | หลังจากการประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จสิ้นหรือถูกข้าม |
| `message:sent`           | ส่งข้อความขาออกแล้ว                                       |

## การเขียนฮุก

### โครงสร้างฮุก

แต่ละฮุกคือไดเรกทอรีที่มีไฟล์สองไฟล์:

```
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

### รูปแบบ HOOK.md

```markdown
---
name: my-hook
description: "Short description of what this hook does"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

Detailed documentation goes here.
```

**ฟิลด์เมทาดาทา** (`metadata.openclaw`):

| ฟิลด์       | คำอธิบาย                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่แสดงสำหรับ CLI                              |
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะฟัง                         |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)   |
| `os`       | แพลตฟอร์มที่จำเป็น (เช่น `["darwin", "linux"]`)      |
| `requires` | พาธ `bins`, `anyBins`, `env` หรือ `config` ที่จำเป็น |
| `always`   | ข้ามการตรวจสอบคุณสมบัติการใช้งาน (บูลีน)            |
| `install`  | วิธีการติดตั้ง                                       |

### การติดตั้งใช้งานตัวจัดการ

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send message to user
  event.messages.push("Hook executed!");
};

export default handler;
```

แต่ละเหตุการณ์มี: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งให้ผู้ใช้) และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบทฮุกของเอเจนต์และ Plugin เครื่องมือยังอาจมี `trace` ซึ่งเป็นบริบทการติดตามวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C ซึ่ง plugins อาจส่งต่อไปยังบันทึกแบบมีโครงสร้างเพื่อการเชื่อมโยง OTEL

### ไฮไลต์บริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`)

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์บูตสแตรป** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แพตช์เซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยนแปลง), `context.cfg` เฉพาะไคลเอนต์ที่มีสิทธิ์พิเศษเท่านั้นที่ทริกเกอร์เหตุการณ์แพตช์ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` สังเกตว่าผู้ใช้ออกคำสั่ง `/stop`; นี่คือวงจรชีวิตของการยกเลิก/คำสั่ง ไม่ใช่เกตการสรุปงานของเอเจนต์ Plugins ที่ต้องตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้เอเจนต์ทำอีกหนึ่งรอบควรใช้ฮุก Plugin แบบมีชนิด `before_agent_finalize` แทน ดู [ฮุก Plugin](/th/plugins/hooks)

**เหตุการณ์วงจรชีวิตของ Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และทริกเกอร์เมื่อการปิด Gateway เริ่มต้น `gateway:pre-restart` มีบริบทเดียวกัน แต่จะทริกเกอร์เฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการรีสตาร์ตที่คาดไว้และมีการระบุค่า `restartExpectedMs` แบบจำกัดเท่านั้น ระหว่างการปิด การรอฮุกวงจรชีวิตแต่ละรายการเป็นแบบพยายามให้ดีที่สุดและถูกจำกัดเวลา เพื่อให้การปิดดำเนินต่อไปหากตัวจัดการค้าง

## การค้นพบฮุก

ฮุกถูกค้นพบจากไดเรกทอรีเหล่านี้ ตามลำดับความสำคัญของการแทนที่จากน้อยไปมาก:

1. **ฮุกที่บันเดิลมาให้**: มาพร้อมกับ OpenClaw
2. **ฮุก Plugin**: ฮุกที่บันเดิลไว้ภายใน plugins ที่ติดตั้งแล้ว
3. **ฮุกที่จัดการแล้ว**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันระหว่างเวิร์กสเปซ) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ความสำคัญระดับนี้ร่วมกัน
4. **ฮุกของเวิร์กสเปซ**: `<workspace>/hooks/` (ต่อเอเจนต์ ปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

ฮุกของเวิร์กสเปซสามารถเพิ่มชื่อฮุกใหม่ได้ แต่ไม่สามารถแทนที่ฮุกที่บันเดิลมาให้ ฮุกที่จัดการแล้ว หรือฮุกที่ plugins จัดเตรียมไว้ซึ่งมีชื่อเดียวกันได้

Gateway จะข้ามการค้นพบฮุกภายในเมื่อเริ่มต้นจนกว่าจะมีการกำหนดค่าฮุกภายใน เปิดใช้งานฮุกที่บันเดิลมาให้หรือฮุกที่จัดการแล้วด้วย `openclaw hooks enable <name>` ติดตั้งชุดฮุก หรือกำหนด `hooks.internal.enabled=true` เพื่อเลือกใช้งาน เมื่อคุณเปิดใช้งานฮุกที่มีชื่อหนึ่งรายการ Gateway จะโหลดเฉพาะตัวจัดการของฮุกนั้น; `hooks.internal.enabled=true`, ไดเรกทอรีฮุกเพิ่มเติม และตัวจัดการแบบเดิมจะเลือกใช้การค้นพบแบบกว้าง

### ชุดฮุก

ชุดฮุกคือแพ็กเกจ npm ที่ export ฮุกผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

สเปก Npm เป็นแบบรีจิสทรีเท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันตรงตัวหรือ dist-tag ที่ไม่บังคับ) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ

## ฮุกที่มาพร้อมระบบ

| ฮุก                   | เหตุการณ์                       | สิ่งที่ทำ                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`         |
| bootstrap-extra-files | `agent:bootstrap`              | แทรกไฟล์ bootstrap เพิ่มเติมจากรูปแบบ glob           |
| command-logger        | `command`                      | บันทึกคำสั่งทั้งหมดไปยัง `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน          |

เปิดใช้งานฮุกที่มาพร้อมระบบใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความผู้ใช้/ผู้ช่วย 15 รายการล่าสุด สร้าง slug ชื่อไฟล์เชิงพรรณนาด้วย LLM และบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-slug.md` โดยใช้วันที่ภายในเครื่องของโฮสต์ ต้องกำหนดค่า `workspace.dir` ไว้

<a id="bootstrap-extra-files"></a>

### การกำหนดค่า bootstrap-extra-files

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "bootstrap-extra-files": {
          "enabled": true,
          "paths": ["packages/*/AGENTS.md", "packages/*/TOOLS.md"]
        }
      }
    }
  }
}
```

พาธจะถูกแก้ไขโดยอิงจากเวิร์กสเปซ โหลดเฉพาะ basename ของ bootstrap ที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึก slash command ทุกคำสั่งไปยัง `~/.openclaw/logs/commands.log`

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จากเวิร์กสเปซที่ใช้งานอยู่เมื่อ Gateway เริ่มทำงาน

## ฮุกของ Plugin

Plugin สามารถลงทะเบียนฮุกที่มีชนิดกำกับผ่าน Plugin SDK เพื่อการผสานการทำงานที่ลึกขึ้น:
การดักจับการเรียกเครื่องมือ การแก้ไข prompt การควบคุมลำดับข้อความ และอื่นๆ
ใช้ฮุกของ plugin เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือฮุกวงจรชีวิตแบบ in-process อื่นๆ

ดูเอกสารอ้างอิงฮุกของ plugin ฉบับสมบูรณ์ได้ที่ [ฮุกของ Plugin](/th/plugins/hooks)

## การกำหนดค่า

```json
{
  "hooks": {
    "internal": {
      "enabled": true,
      "entries": {
        "session-memory": { "enabled": true },
        "command-logger": { "enabled": false }
      }
    }
  }
}
```

ตัวแปรสภาพแวดล้อมแยกตามฮุก:

```json
{
  "hooks": {
    "internal": {
      "entries": {
        "my-hook": {
          "enabled": true,
          "env": { "MY_CUSTOM_VAR": "value" }
        }
      }
    }
  }
}
```

ไดเรกทอรีฮุกเพิ่มเติม:

```json
{
  "hooks": {
    "internal": {
      "load": {
        "extraDirs": ["/path/to/more/hooks"]
      }
    }
  }
}
```

<Note>
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` แบบเดิมยังรองรับอยู่เพื่อความเข้ากันได้ย้อนหลัง แต่ฮุกใหม่ควรใช้ระบบแบบ discovery-based
</Note>

## เอกสารอ้างอิง CLI

```bash
# List all hooks (add --eligible, --verbose, or --json)
openclaw hooks list

# Show detailed info about a hook
openclaw hooks info <hook-name>

# Show eligibility summary
openclaw hooks check

# Enable/disable
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## แนวทางปฏิบัติที่ดีที่สุด

- **ทำให้ handler ทำงานเร็ว** ฮุกจะทำงานระหว่างการประมวลผลคำสั่ง ให้ส่งงานหนักไปทำแบบ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างนุ่มนวล** ครอบการดำเนินการที่มีความเสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handler อื่นๆ ทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่เนิ่นๆ** คืนค่าทันทีหากชนิด/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลด overhead

## การแก้ไขปัญหา

### ไม่พบฮุก

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### ฮุกไม่เข้าเกณฑ์

```bash
openclaw hooks info my-hook
```

ตรวจสอบ binary ที่ขาดหายไป (PATH), ตัวแปรสภาพแวดล้อม, ค่าการกำหนดค่า หรือความเข้ากันได้ของ OS

### ฮุกไม่ทำงาน

1. ตรวจสอบว่าฮุกเปิดใช้งานอยู่: `openclaw hooks list`
2. รีสตาร์ทกระบวนการ Gateway ของคุณเพื่อให้ฮุกโหลดใหม่
3. ตรวจสอบบันทึก Gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: ฮุก](/th/cli/hooks)
- [Webhook](/th/automation/cron-jobs#webhooks)
- [ฮุกของ Plugin](/th/plugins/hooks) — ฮุกวงจรชีวิตของ Plugin ภายในโปรเซส
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
