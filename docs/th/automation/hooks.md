---
read_when:
    - คุณต้องการระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์ในวงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบัก hooks
summary: 'Hooks: ระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์ในวงจรชีวิต'
title: Hooks
x-i18n:
    generated_at: "2026-04-25T13:41:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: 437b8b8dc37e9ec9c10bbdddc4d63184ccc46e89bc532aea0c5bd176404186f6
    source_path: automation/hooks.md
    workflow: 15
---

Hooks คือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway โดยสามารถค้นพบได้จากไดเรกทอรีต่างๆ และตรวจสอบได้ด้วย `openclaw hooks` Gateway จะโหลด internal hooks ก็ต่อเมื่อคุณเปิดใช้งาน hooks หรือกำหนดค่า hook entry, hook pack, legacy handler หรือไดเรกทอรี hooks เพิ่มเติมอย่างน้อยหนึ่งรายการ

ใน OpenClaw มี hooks อยู่สองประเภท:

- **Internal hooks** (หน้านี้): ทำงานภายใน Gateway เมื่อเกิดเหตุการณ์ของเอเจนต์ เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์ในวงจรชีวิต
- **Webhooks**: ปลายทาง HTTP ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

นอกจากนี้ hooks ยังสามารถรวมมากับ Plugin ได้ด้วย `openclaw hooks list` จะแสดงทั้ง hooks แบบสแตนด์อโลนและ hooks ที่ Plugin จัดการ

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

| เหตุการณ์               | เวลาที่ทำงาน                                      |
| ----------------------- | ------------------------------------------------- |
| `command:new`            | มีการเรียกใช้คำสั่ง `/new`                        |
| `command:reset`          | มีการเรียกใช้คำสั่ง `/reset`                      |
| `command:stop`           | มีการเรียกใช้คำสั่ง `/stop`                       |
| `command`                | เหตุการณ์คำสั่งใดๆ (listener ทั่วไป)             |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                  |
| `session:compact:after`  | หลังจาก Compaction เสร็จสิ้น                      |
| `session:patch`          | เมื่อมีการแก้ไขพร็อพเพอร์ตีของ session           |
| `agent:bootstrap`        | ก่อนที่ไฟล์ bootstrap ของ workspace จะถูกแทรกเข้าไป |
| `gateway:startup`        | หลังจากช่องทางต่างๆ เริ่มทำงานและโหลด hooks แล้ว |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดก็ได้                   |
| `message:transcribed`    | หลังจากการถอดเสียงเสียงเสร็จสมบูรณ์              |
| `message:preprocessed`   | หลังจากประมวลผลสื่อและความเข้าใจลิงก์ทั้งหมดเสร็จสิ้น |
| `message:sent`           | ส่งข้อความขาออกสำเร็จแล้ว                         |

## การเขียน hooks

### โครงสร้างของ hook

แต่ละ hook เป็นไดเรกทอรีที่มีสองไฟล์:

```
my-hook/
├── HOOK.md          # ข้อมูลเมตา + เอกสารประกอบ
└── handler.ts       # การทำงานของ handler
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

| ฟิลด์      | คำอธิบาย                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่ใช้แสดงใน CLI                               |
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะรับฟัง                       |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)   |
| `os`       | แพลตฟอร์มที่ต้องการ (เช่น `["darwin", "linux"]`)     |
| `requires` | ต้องการ `bins`, `anyBins`, `env` หรือพาธ `config`    |
| `always`   | ข้ามการตรวจสอบคุณสมบัติที่เข้าเกณฑ์ (boolean)       |
| `install`  | วิธีการติดตั้ง                                        |

### การทำงานของ handler

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // ตรรกะของคุณที่นี่

  // สามารถส่งข้อความถึงผู้ใช้ได้หากต้องการ
  event.messages.push("Hook executed!");
};

export default handler;
```

แต่ละ event จะมี: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งถึงผู้ใช้) และ `context` (ข้อมูลเฉพาะของ event) context ของ agent และ tool plugin hook อาจมี `trace` ด้วย ซึ่งเป็นบริบท diagnostic trace แบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C และ Plugin สามารถส่งต่อไปยัง structured logs เพื่อทำ OTEL correlation ได้

### ไฮไลต์ของ event context

**Command events** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**Message events** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`)

**Message events** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**Message events** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**Message events** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่ผ่านการเสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**Bootstrap events** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**Session patch events** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` มีเพียงไคลเอนต์ที่มีสิทธิ์พิเศษเท่านั้นที่สามารถทริกเกอร์ patch events ได้

**Compaction events**: `session:compact:before` มี `messageCount`, `tokenCount` ส่วน `session:compact:after` จะเพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

## การค้นพบ hooks

ระบบจะค้นพบ hooks จากไดเรกทอรีเหล่านี้ ตามลำดับความสำคัญในการ override ที่เพิ่มขึ้น:

1. **Bundled hooks**: มาพร้อมกับ OpenClaw
2. **Plugin hooks**: hooks ที่รวมอยู่ใน Plugin ที่ติดตั้งไว้
3. **Managed hooks**: `~/.openclaw/hooks/` (ผู้ใช้ติดตั้งเอง ใช้ร่วมกันได้ทุก workspace) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` จะมีลำดับความสำคัญเดียวกันนี้
4. **Workspace hooks**: `<workspace>/hooks/` (ต่อเอเจนต์หนึ่งตัว ปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดอย่างชัดเจน)

Workspace hooks สามารถเพิ่มชื่อ hook ใหม่ได้ แต่ไม่สามารถ override bundled, managed หรือ hooks ที่ Plugin ให้มาซึ่งใช้ชื่อเดียวกันได้

Gateway จะข้ามการค้นหา internal hook ระหว่างเริ่มต้นระบบจนกว่าจะมีการกำหนดค่า internal hooks เปิดใช้งาน bundled หรือ managed hook ด้วย `openclaw hooks enable <name>`, ติดตั้ง hook pack หรือกำหนด `hooks.internal.enabled=true` เพื่อเลือกใช้งาน หากคุณเปิดใช้งาน named hook เพียงรายการเดียว Gateway จะโหลดเฉพาะ handler ของ hook นั้น ส่วน `hooks.internal.enabled=true`, ไดเรกทอรี hooks เพิ่มเติม และ legacy handlers จะเป็นการเลือกใช้การค้นหาแบบกว้าง

### Hook packs

Hook packs คือแพ็กเกจ npm ที่ export hooks ผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

Npm specs รองรับเฉพาะ registry เท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันแบบเจาะจงหรือ dist-tag ที่เป็นทางเลือก) ระบบจะปฏิเสธ Git/URL/file specs และ semver ranges

## Bundled hooks

| Hook                  | เหตุการณ์                      | สิ่งที่ทำ                                              |
| --------------------- | ------------------------------ | ------------------------------------------------------ |
| session-memory        | `command:new`, `command:reset` | บันทึกบริบทของ session ไปยัง `<workspace>/memory/`     |
| bootstrap-extra-files | `agent:bootstrap`              | แทรกไฟล์ bootstrap เพิ่มเติมจากรูปแบบ glob            |
| command-logger        | `command`                      | บันทึกคำสั่งทั้งหมดลงใน `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | เรียกใช้ `BOOT.md` เมื่อ gateway เริ่มทำงาน            |

เปิดใช้งาน bundled hook ใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความล่าสุด 15 รายการของผู้ใช้/ผู้ช่วย สร้าง slug ชื่อไฟล์ที่สื่อความหมายผ่าน LLM แล้วบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-slug.md` ต้องมีการกำหนดค่า `workspace.dir`

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

พาธจะอ้างอิงสัมพันธ์กับ workspace ระบบจะโหลดเฉพาะชื่อไฟล์ bootstrap พื้นฐานที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกทุก slash command ลงใน `~/.openclaw/logs/commands.log`

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จาก workspace ที่ใช้งานอยู่เมื่อ gateway เริ่มทำงาน

## Plugin hooks

Plugin สามารถลงทะเบียน typed hooks ผ่าน Plugin SDK เพื่อผสานรวมในระดับลึกยิ่งขึ้น:
ดักจับการเรียกใช้เครื่องมือ แก้ไข prompt ควบคุมการไหลของข้อความ และอื่นๆ
ใช้ plugin hooks เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือ in-process lifecycle hooks อื่นๆ

ดูข้อมูลอ้างอิงฉบับสมบูรณ์ของ plugin hooks ได้ที่ [Plugin hooks](/th/plugins/hooks)

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

ไดเรกทอรี hooks เพิ่มเติม:

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
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` แบบ legacy ยังรองรับอยู่เพื่อความเข้ากันได้ย้อนหลัง แต่ hooks ใหม่ควรใช้ระบบที่อิงกับการค้นพบ
</Note>

## ข้อมูลอ้างอิง CLI

```bash
# แสดงรายการ hooks ทั้งหมด (เพิ่ม --eligible, --verbose หรือ --json ได้)
openclaw hooks list

# แสดงข้อมูลโดยละเอียดเกี่ยวกับ hook
openclaw hooks info <hook-name>

# แสดงสรุปคุณสมบัติที่เข้าเกณฑ์
openclaw hooks check

# เปิดใช้งาน/ปิดใช้งาน
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## แนวทางปฏิบัติที่แนะนำ

- **ทำให้ handlers เร็วอยู่เสมอ** Hooks ทำงานระหว่างการประมวลผลคำสั่ง ใช้ fire-and-forget กับงานหนักด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างเหมาะสม** ครอบการทำงานที่เสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handlers อื่นยังทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่เนิ่นๆ** คืนค่าทันทีหากประเภท/แอ็กชันของ event ไม่เกี่ยวข้อง
- **ใช้ event keys ที่เฉพาะเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลด overhead

## การแก้ไขปัญหา

### ไม่พบ hook

```bash
# ตรวจสอบโครงสร้างไดเรกทอรี
ls -la ~/.openclaw/hooks/my-hook/
# ควรแสดง: HOOK.md, handler.ts

# แสดงรายการ hooks ที่ค้นพบทั้งหมด
openclaw hooks list
```

### hook ไม่เข้าเกณฑ์

```bash
openclaw hooks info my-hook
```

ตรวจสอบว่าไม่มีไบนารี (PATH), ตัวแปรสภาพแวดล้อม, ค่าคอนฟิก หรือความเข้ากันได้ของระบบปฏิบัติการที่ขาดหายไป

### hook ไม่ทำงาน

1. ตรวจสอบว่า hook ถูกเปิดใช้งานแล้ว: `openclaw hooks list`
2. รีสตาร์ต process ของ gateway เพื่อให้ hooks โหลดใหม่
3. ตรวจสอบล็อกของ gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: hooks](/th/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Plugin hooks](/th/plugins/hooks) — in-process lifecycle hooks ของ Plugin
- [Configuration](/th/gateway/configuration-reference#hooks)
