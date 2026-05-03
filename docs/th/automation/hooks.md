---
read_when:
    - คุณต้องการระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์วงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบักฮุก
summary: 'ฮุก: การทำงานอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-05-03T21:27:29Z"
    model: gpt-5.5
    provider: openai
    source_hash: 15f0d120ccf7314a991da5d66e65e5c78375222a846ba01d7a04ddfe1f02cb32
    source_path: automation/hooks.md
    workflow: 16
---

ฮุกคือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway โดยสามารถค้นพบได้จากไดเรกทอรีและตรวจสอบด้วย `openclaw hooks` Gateway จะโหลดฮุกภายในก็ต่อเมื่อคุณเปิดใช้งานฮุก หรือกำหนดค่ารายการฮุกอย่างน้อยหนึ่งรายการ ชุดฮุก ตัวจัดการแบบเดิม หรือไดเรกทอรีฮุกเพิ่มเติม

ฮุกใน OpenClaw มีสองชนิด:

- **ฮุกภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเหตุการณ์ของเอเจนต์เกิดขึ้น เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์วงจรชีวิต
- **Webhook**: ปลายทาง HTTP ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ดู [Webhook](/th/automation/cron-jobs#webhooks)

ฮุกยังสามารถถูกรวมไว้ภายใน Plugin ได้ด้วย `openclaw hooks list` จะแสดงทั้งฮุกแบบสแตนด์อโลนและฮุกที่จัดการโดย Plugin

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

| เหตุการณ์                 | เมื่อใดที่จะทำงาน                                         |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                     |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                   |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                    |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)                      |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                           |
| `session:compact:after`  | หลังจาก Compaction เสร็จสิ้น                               |
| `session:patch`          | เมื่อคุณสมบัติของเซสชันถูกแก้ไข                           |
| `agent:bootstrap`        | ก่อนแทรกไฟล์บูตสแตรปของพื้นที่ทำงาน                       |
| `gateway:startup`        | หลังจากช่องทางเริ่มทำงานและโหลดฮุกแล้ว                    |
| `gateway:shutdown`       | เมื่อการปิด Gateway เริ่มขึ้น                              |
| `gateway:pre-restart`    | ก่อนการรีสตาร์ต Gateway ที่คาดไว้                          |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดๆ                                |
| `message:transcribed`    | หลังจากการถอดเสียงจากเสียงเสร็จสิ้น                       |
| `message:preprocessed`   | หลังจากการประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จสิ้นหรือถูกข้าม |
| `message:sent`           | ส่งข้อความขาออกแล้ว                                       |

## การเขียนฮุก

### โครงสร้างฮุก

ฮุกแต่ละรายการคือไดเรกทอรีที่มีสองไฟล์:

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

| ฟิลด์      | คำอธิบาย                                             |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่แสดงสำหรับ CLI                              |
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะรับฟัง                       |
| `export`   | เอ็กซ์พอร์ตที่มีชื่อเพื่อใช้ (ค่าเริ่มต้นคือ `"default"`) |
| `os`       | แพลตฟอร์มที่ต้องใช้ (เช่น `["darwin", "linux"]`)     |
| `requires` | พาธ `bins`, `anyBins`, `env` หรือ `config` ที่ต้องใช้ |
| `always`   | ข้ามการตรวจสอบคุณสมบัติ (บูลีน)                      |
| `install`  | วิธีการติดตั้ง                                       |

### การใช้งานตัวจัดการ

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

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งให้ผู้ใช้) และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบทของฮุกเอเจนต์และ Plugin เครื่องมือยังสามารถมี `trace` ซึ่งเป็นบริบท trace สำหรับการวินิจฉัยที่อ่านอย่างเดียวและเข้ากันได้กับ W3C ซึ่ง Plugin อาจส่งต่อเข้าไปในบันทึกแบบมีโครงสร้างเพื่อเชื่อมโยงกับ OTEL

### จุดเด่นของบริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`) `context.content` จะเลือกเนื้อหาคำสั่งที่ไม่ว่างสำหรับข้อความที่คล้ายคำสั่งก่อน จากนั้นจึงย้อนกลับไปใช้เนื้อหาขาเข้าดิบและเนื้อหาทั่วไป โดยไม่รวมการเสริมข้อมูลที่มีเฉพาะเอเจนต์ เช่น ประวัติเธรดหรือสรุปลิงก์

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์บูตสแตรป** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แพตช์เซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยนแปลง), `context.cfg` เฉพาะไคลเอนต์ที่มีสิทธิ์พิเศษเท่านั้นที่สามารถทริกเกอร์เหตุการณ์แพตช์ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` สังเกตผู้ใช้ออกคำสั่ง `/stop`; นี่คือวงจรชีวิตการยกเลิก/คำสั่ง ไม่ใช่เกตการสรุปของเอเจนต์ Plugin ที่ต้องตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้เอเจนต์ทำอีกหนึ่งรอบควรใช้ฮุก Plugin แบบมีชนิด `before_agent_finalize` แทน ดู [ฮุก Plugin](/th/plugins/hooks)

**เหตุการณ์วงจรชีวิต Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และทำงานเมื่อการปิด Gateway เริ่มขึ้น `gateway:pre-restart` มีบริบทเดียวกัน แต่จะทำงานเฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการรีสตาร์ตที่คาดไว้และมีการระบุค่า `restartExpectedMs` ที่มีขอบเขตจำกัดเท่านั้น ระหว่างการปิด การรอฮุกวงจรชีวิตแต่ละรายการเป็นแบบ best-effort และมีขอบเขต เพื่อให้การปิดดำเนินต่อได้หากตัวจัดการค้าง

## การค้นพบฮุก

ฮุกถูกค้นพบจากไดเรกทอรีเหล่านี้ ตามลำดับความสำคัญการแทนที่ที่เพิ่มขึ้น:

1. **ฮุกที่มาพร้อมกัน**: จัดส่งพร้อม OpenClaw
2. **ฮุก Plugin**: ฮุกที่รวมอยู่ภายใน Plugin ที่ติดตั้งแล้ว
3. **ฮุกที่จัดการไว้**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันข้ามพื้นที่ทำงาน) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ความสำคัญนี้ร่วมกัน
4. **ฮุกพื้นที่ทำงาน**: `<workspace>/hooks/` (ต่อเอเจนต์ ปิดใช้งานตามค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

ฮุกพื้นที่ทำงานสามารถเพิ่มชื่อฮุกใหม่ได้ แต่ไม่สามารถแทนที่ฮุกที่มาพร้อมกัน ฮุกที่จัดการไว้ หรือฮุกที่ Plugin จัดให้ซึ่งมีชื่อเดียวกันได้

Gateway จะข้ามการค้นพบฮุกภายในเมื่อเริ่มต้นจนกว่าจะมีการกำหนดค่าฮุกภายใน เปิดใช้งานฮุกที่มาพร้อมกันหรือฮุกที่จัดการไว้ด้วย `openclaw hooks enable <name>` ติดตั้งชุดฮุก หรือตั้งค่า `hooks.internal.enabled=true` เพื่อเลือกใช้งาน เมื่อคุณเปิดใช้งานฮุกที่ระบุชื่อหนึ่งรายการ Gateway จะโหลดเฉพาะตัวจัดการของฮุกนั้น; `hooks.internal.enabled=true`, ไดเรกทอรีฮุกเพิ่มเติม และตัวจัดการแบบเดิมจะเลือกใช้การค้นพบแบบกว้าง

### ชุดฮุก

ชุดฮุกคือแพ็กเกจ npm ที่เอ็กซ์พอร์ตฮุกผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

สเปก npm ใช้ได้เฉพาะ registry เท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันแบบตรงตัวหรือ dist-tag ที่เป็นตัวเลือก) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ

## ฮุกที่มาพร้อมกัน

| ฮุก                   | เหตุการณ์                                         | สิ่งที่ทำ                                                     |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | แทรกไฟล์บูตสแตรปเพิ่มเติมจากรูปแบบ glob                      |
| command-logger        | `command`                                         | บันทึกคำสั่งทั้งหมดไปยัง `~/.openclaw/logs/commands.log`      |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | ส่งประกาศแชตที่มองเห็นได้เมื่อ Compaction เซสชันเริ่ม/สิ้นสุด |
| boot-md               | `gateway:startup`                                 | รัน `BOOT.md` เมื่อ Gateway เริ่มทำงาน                        |

เปิดใช้งานฮุกที่มาพร้อมกันรายการใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความผู้ใช้/ผู้ช่วย 15 ข้อความล่าสุด สร้าง slug ชื่อไฟล์เชิงพรรณนาผ่าน LLM และบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-slug.md` โดยใช้วันที่ท้องถิ่นของโฮสต์ ต้องกำหนดค่า `workspace.dir`

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

พาธจะแก้ไขแบบสัมพัทธ์กับพื้นที่ทำงาน โหลดเฉพาะชื่อฐานของบูตสแตรปที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกคำสั่ง slash ทุกคำสั่งไปยัง `~/.openclaw/logs/commands.log`

<a id="compaction-notifier"></a>

### รายละเอียด compaction-notifier

ส่งข้อความสถานะสั้นๆ เข้าสู่การสนทนาปัจจุบันเมื่อ OpenClaw เริ่มและเสร็จสิ้นการบีบอัดทรานสคริปต์เซสชัน สิ่งนี้ทำให้เทิร์นยาวๆ บนพื้นผิวแชตสับสนน้อยลง เพราะผู้ใช้สามารถเห็นได้ว่าผู้ช่วยกำลังสรุปบริบทและจะดำเนินการต่อหลังจาก Compaction

<a id="boot-md"></a>

### รายละเอียด boot-md

รัน `BOOT.md` จากพื้นที่ทำงานที่ใช้งานอยู่เมื่อ Gateway เริ่มทำงาน

## ฮุก Plugin

Plugin สามารถลงทะเบียนฮุกแบบมีชนิดผ่าน Plugin SDK เพื่อการผสานรวมที่ลึกขึ้น:
ดักจับการเรียกเครื่องมือ แก้ไขพรอมป์ ควบคุมโฟลว์ข้อความ และอื่นๆ
ใช้ฮุก Plugin เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือฮุกวงจรชีวิตอื่นๆ ในโปรเซส

สำหรับเอกสารอ้างอิงฮุก Plugin ฉบับสมบูรณ์ ดู [ฮุก Plugin](/th/plugins/hooks)

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

ตัวแปรสภาพแวดล้อมต่อฮุก:

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
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` แบบเดิมยังรองรับอยู่เพื่อความเข้ากันได้ย้อนหลัง แต่ฮุกใหม่ควรใช้ระบบที่อิงการค้นพบ
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

- **ทำให้ตัวจัดการทำงานเร็วอยู่เสมอ** Hooks ทำงานระหว่างการประมวลผลคำสั่ง สำหรับงานหนัก ให้สั่งทำงานแบบไม่รอผลลัพธ์ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างนุ่มนวล** ครอบการดำเนินการที่มีความเสี่ยงด้วย try/catch; อย่า throw เพื่อให้ตัวจัดการอื่นทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่เนิ่น ๆ** return ทันทีหากประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลดภาระงาน

## การแก้ไขปัญหา

### ไม่พบ Hook

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### Hook ไม่มีสิทธิ์ใช้งาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบไบนารีที่ขาดหายไป (PATH), ตัวแปรสภาพแวดล้อม, ค่าการกำหนดค่า หรือความเข้ากันได้ของ OS

### Hook ไม่ทำงาน

1. ตรวจสอบว่าเปิดใช้ hook แล้ว: `openclaw hooks list`
2. รีสตาร์ทกระบวนการ gateway ของคุณเพื่อให้ hooks โหลดใหม่
3. ตรวจสอบบันทึก gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: hooks](/th/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [Plugin hooks](/th/plugins/hooks) — hooks วงจรชีวิตของ Plugin แบบทำงานในกระบวนการ
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
