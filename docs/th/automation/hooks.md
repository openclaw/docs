---
read_when:
    - คุณต้องการระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับ `/new`, `/reset`, `/stop` และเหตุการณ์ในวงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบัก hooks
summary: 'Hooks: ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์ในวงจรชีวิต'
title: Hooks
x-i18n:
    generated_at: "2026-04-26T11:22:51Z"
    model: gpt-5.4
    provider: openai
    source_hash: cf40a64449347ef750b4b0e0a83b80e2e8fdef87d92daa71f028d2bf6a3d3d22
    source_path: automation/hooks.md
    workflow: 15
---

hooks คือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway ระบบสามารถค้นพบ hooks ได้จากไดเรกทอรีต่างๆ และตรวจสอบได้ด้วย `openclaw hooks` Gateway จะโหลด internal hooks ก็ต่อเมื่อคุณเปิดใช้งาน hooks หรือกำหนดค่าอย่างน้อยหนึ่งรายการของ hook entry, hook pack, legacy handler หรือไดเรกทอรี hook เพิ่มเติม

ใน OpenClaw มี hooks อยู่สองประเภท:

- **Internal hooks** (หน้านี้): ทำงานภายใน Gateway เมื่อเกิดเหตุการณ์ของเอเจนต์ เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์ในวงจรชีวิต
- **Webhooks**: ปลายทาง HTTP ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

hooks ยังสามารถถูกรวมมาใน plugins ได้ด้วย `openclaw hooks list` จะแสดงทั้ง hooks แบบสแตนด์อโลนและ hooks ที่จัดการโดย plugin

## เริ่มต้นอย่างรวดเร็ว

```bash
# แสดงรายการ hooks ที่พร้อมใช้งาน
openclaw hooks list

# เปิดใช้งาน hook
openclaw hooks enable session-memory

# ตรวจสอบสถานะ hook
openclaw hooks check

# ดูข้อมูลโดยละเอียด
openclaw hooks info session-memory
```

## ประเภทเหตุการณ์

| เหตุการณ์                | เวลาที่ทริกเกอร์                              |
| ------------------------ | --------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                         |
| `command:reset`          | มีการออกคำสั่ง `/reset`                       |
| `command:stop`           | มีการออกคำสั่ง `/stop`                        |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวฟังทั่วไป)              |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ              |
| `session:compact:after`  | หลังจาก Compaction เสร็จสมบูรณ์               |
| `session:patch`          | เมื่อมีการแก้ไขพร็อพเพอร์ตีของเซสชัน         |
| `agent:bootstrap`        | ก่อนฉีดไฟล์ bootstrap ของ workspace           |
| `gateway:startup`        | หลังจาก channels เริ่มทำงานและโหลด hooks แล้ว |
| `message:received`       | ข้อความขาเข้าจาก channel ใดๆ                 |
| `message:transcribed`    | หลังการถอดเสียงเสียงพูดเสร็จสมบูรณ์          |
| `message:preprocessed`   | หลังจากประมวลผลสื่อและทำความเข้าใจลิงก์ครบแล้ว |
| `message:sent`           | ส่งข้อความขาออกสำเร็จแล้ว                    |

## การเขียน hooks

### โครงสร้างของ hook

แต่ละ hook เป็นไดเรกทอรีที่มีสองไฟล์:

```
my-hook/
├── HOOK.md          # ข้อมูลเมตา + เอกสารประกอบ
└── handler.ts       # การติดตั้งใช้งาน handler
```

### รูปแบบ HOOK.md

```markdown
---
name: my-hook
description: "คำอธิบายสั้นๆ ว่า hook นี้ทำอะไร"
metadata:
  { "openclaw": { "emoji": "🔗", "events": ["command:new"], "requires": { "bins": ["node"] } } }
---

# My Hook

ใส่เอกสารประกอบโดยละเอียดที่นี่
```

**ฟิลด์ข้อมูลเมตา** (`metadata.openclaw`):

| ฟิลด์      | คำอธิบาย                                              |
| ---------- | ----------------------------------------------------- |
| `emoji`    | อีโมจิที่ใช้แสดงใน CLI                                |
| `events`   | อาร์เรย์ของเหตุการณ์ที่ต้องการรับฟัง                  |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)    |
| `os`       | แพลตฟอร์มที่ต้องใช้ (เช่น `["darwin", "linux"]`)      |
| `requires` | `bins`, `anyBins`, `env` หรือพาธ `config` ที่จำเป็น   |
| `always`   | ข้ามการตรวจสอบคุณสมบัติการใช้งาน (boolean)           |
| `install`  | วิธีการติดตั้ง                                         |

### การติดตั้งใช้งาน handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // ตรรกะของคุณที่นี่

  // จะส่งข้อความถึงผู้ใช้ด้วยก็ได้
  event.messages.push("Hook executed!");
};

export default handler;
```

แต่ละ event จะประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งถึงผู้ใช้) และ `context` (ข้อมูลเฉพาะของ event) บริบทของ plugin hook สำหรับเอเจนต์และเครื่องมือยังอาจมี `trace` ซึ่งเป็นบริบทการติดตามวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C โดย plugins สามารถส่งต่อเข้า structured logs เพื่อทำ OTEL correlation ได้

### ไฮไลต์ของ event context

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการรวมถึง `senderId`, `senderName`, `guildId`)

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่ได้รับการเสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์ bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์ session patch** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` มีเพียงไคลเอนต์ที่มีสิทธิพิเศษเท่านั้นที่ทริกเกอร์ patch events ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` ส่วน `session:compact:after` จะเพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` ใช้สังเกตว่าผู้ใช้ออกคำสั่ง `/stop`; นี่คือวงจรชีวิตของการยกเลิก/คำสั่ง ไม่ใช่จุดกั้นการปิดงานขั้นสุดท้ายของเอเจนต์ plugins ที่ต้องการตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้เอเจนต์ทำอีกหนึ่งรอบ ควรใช้ typed plugin hook `before_agent_finalize` แทน ดู [Plugin hooks](/th/plugins/hooks)

## การค้นพบ hook

ระบบจะค้นพบ hooks จากไดเรกทอรีเหล่านี้ โดยเรียงลำดับจากลำดับความสำคัญในการแทนที่ที่ต่ำไปสูง:

1. **Bundled hooks**: มาพร้อมกับ OpenClaw
2. **Plugin hooks**: hooks ที่รวมอยู่ใน plugins ที่ติดตั้งแล้ว
3. **Managed hooks**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันข้าม workspaces) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` จะมีลำดับความสำคัญระดับเดียวกัน
4. **Workspace hooks**: `<workspace>/hooks/` (ต่อเอเจนต์หนึ่งตัว ปิดใช้งานเป็นค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

Workspace hooks สามารถเพิ่มชื่อ hook ใหม่ได้ แต่ไม่สามารถแทนที่ bundled, managed หรือ plugin-provided hooks ที่ใช้ชื่อเดียวกันได้

Gateway จะข้ามการค้นพบ internal hooks ตอนเริ่มต้นจนกว่าจะมีการกำหนดค่า internal hooks เปิดใช้ bundled หรือ managed hook ด้วย `openclaw hooks enable <name>`, ติดตั้ง hook pack หรือกำหนด `hooks.internal.enabled=true` เพื่อ opt in เมื่อคุณเปิดใช้ named hook หนึ่งรายการ Gateway จะโหลดเฉพาะ handler ของ hook นั้น ส่วน `hooks.internal.enabled=true`, ไดเรกทอรี hook เพิ่มเติม และ legacy handlers จะเป็นการ opt in เข้าสู่การค้นพบแบบกว้าง

### Hook packs

Hook packs คือแพ็กเกจ npm ที่ export hooks ผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

สเปก npm รองรับเฉพาะ registry เท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันแบบระบุแน่นอนหรือ dist-tag แบบเลือกได้) ไม่รองรับและจะถูกปฏิเสธสำหรับสเปกแบบ Git/URL/file และ semver ranges

## Bundled hooks

| Hook                  | เหตุการณ์                       | สิ่งที่ทำ                                                  |
| --------------------- | ------------------------------ | ---------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`               |
| bootstrap-extra-files | `agent:bootstrap`              | ฉีดไฟล์ bootstrap เพิ่มเติมจากรูปแบบ glob                  |
| command-logger        | `command`                      | บันทึกทุกคำสั่งลงใน `~/.openclaw/logs/commands.log`        |
| boot-md               | `gateway:startup`              | รัน `BOOT.md` เมื่อ gateway เริ่มทำงาน                     |

เปิดใช้งาน bundled hook ใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียดของ session-memory

ดึงข้อความล่าสุด 15 รายการของผู้ใช้/ผู้ช่วย สร้าง slug ชื่อไฟล์ที่สื่อความหมายผ่าน LLM และบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-slug.md` ต้องมีการกำหนดค่า `workspace.dir`

<a id="bootstrap-extra-files"></a>

### ค่ากำหนดของ bootstrap-extra-files

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

พาธจะอ้างอิงสัมพันธ์กับ workspace ระบบจะโหลดเฉพาะ bootstrap basenames ที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียดของ command-logger

บันทึกทุก slash command ลงใน `~/.openclaw/logs/commands.log`

<a id="boot-md"></a>

### รายละเอียดของ boot-md

รัน `BOOT.md` จาก workspace ที่ใช้งานอยู่เมื่อ gateway เริ่มต้น

## Plugin hooks

Plugins สามารถลงทะเบียน typed hooks ผ่าน Plugin SDK เพื่อผสานการทำงานได้ลึกขึ้น:
สกัดกั้นการเรียกใช้เครื่องมือ แก้ไข prompt ควบคุมการไหลของข้อความ และอื่นๆ
ใช้ plugin hooks เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือ hooks ในวงจรชีวิตใน process อื่นๆ

สำหรับข้อมูลอ้างอิง plugin hook แบบครบถ้วน ดู [Plugin hooks](/th/plugins/hooks)

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

ตัวแปรสภาพแวดล้อมต่อ hook:

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

ไดเรกทอรี hook เพิ่มเติม:

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
ยังรองรับรูปแบบคอนฟิกอาร์เรย์ `hooks.internal.handlers` แบบเดิมเพื่อความเข้ากันได้ย้อนหลัง แต่ hooks ใหม่ควรใช้ระบบแบบอิงการค้นพบ
</Note>

## ข้อมูลอ้างอิง CLI

```bash
# แสดง hooks ทั้งหมด (เพิ่ม --eligible, --verbose หรือ --json ได้)
openclaw hooks list

# แสดงข้อมูลโดยละเอียดของ hook
openclaw hooks info <hook-name>

# แสดงสรุปคุณสมบัติการใช้งาน
openclaw hooks check

# เปิด/ปิดใช้งาน
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## แนวทางปฏิบัติที่ดีที่สุด

- **ให้ handlers ทำงานเร็วเสมอ** hooks จะทำงานระหว่างการประมวลผลคำสั่ง สำหรับงานหนักให้ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างเหมาะสม** ครอบการทำงานที่เสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handlers อื่นยังทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่เนิ่นๆ** คืนค่าทันทีหาก type/action ของ event ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์แบบเฉพาะเจาะจง** ให้ใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลด overhead

## การแก้ปัญหา

### ไม่พบ hook

```bash
# ตรวจสอบโครงสร้างไดเรกทอรี
ls -la ~/.openclaw/hooks/my-hook/
# ควรแสดง: HOOK.md, handler.ts

# แสดง hooks ที่ค้นพบทั้งหมด
openclaw hooks list
```

### hook ไม่มีคุณสมบัติการใช้งาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบว่าไม่มีไบนารีที่ขาดหายไป (PATH), ตัวแปรสภาพแวดล้อม, ค่าคอนฟิก หรือความเข้ากันได้ของระบบปฏิบัติการ

### hook ไม่ทำงาน

1. ตรวจสอบว่า hook เปิดใช้งานอยู่: `openclaw hooks list`
2. รีสตาร์ต process ของ gateway เพื่อให้ hooks โหลดใหม่
3. ตรวจสอบบันทึกของ gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: hooks](/th/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Plugin hooks](/th/plugins/hooks) — plugin lifecycle hooks ภายใน process
- [Configuration](/th/gateway/configuration-reference#hooks)
