---
read_when:
    - คุณต้องการระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์วงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบักฮุก
summary: 'ฮุก: ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-05-02T20:41:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 00ebf65dce03c8643fc1eac84c3915aaa00133c7f007a22483a845e61f055d6b
    source_path: automation/hooks.md
    workflow: 16
---

Hooks เป็นสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway สามารถค้นพบ Hooks ได้จากไดเรกทอรีและตรวจสอบได้ด้วย `openclaw hooks` Gateway จะโหลด Hooks ภายในหลังจากคุณเปิดใช้งาน Hooks หรือกำหนดค่า hook entry, hook pack, legacy handler หรือไดเรกทอรี hook เพิ่มเติมอย่างน้อยหนึ่งรายการแล้วเท่านั้น

ใน OpenClaw มี Hooks สองประเภท:

- **Hooks ภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเหตุการณ์ของ agent เกิดขึ้น เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์ lifecycle
- **Webhooks**: HTTP endpoints ภายนอกที่ให้ระบบอื่นเรียกให้งานใน OpenClaw ทำงานได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

Hooks ยังสามารถถูกบันเดิลไว้ภายใน plugins ได้ด้วย `openclaw hooks list` แสดงทั้ง Hooks แบบสแตนด์อโลนและ Hooks ที่จัดการโดย Plugin

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

| เหตุการณ์                 | เกิดขึ้นเมื่อใด                                            |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                     |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                   |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                    |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)                     |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                          |
| `session:compact:after`  | หลังจาก Compaction เสร็จสมบูรณ์                           |
| `session:patch`          | เมื่อคุณสมบัติของเซสชันถูกแก้ไข                           |
| `agent:bootstrap`        | ก่อนที่ไฟล์ bootstrap ของพื้นที่ทำงานจะถูกฉีดเข้าไป       |
| `gateway:startup`        | หลังจาก channels เริ่มทำงานและ Hooks ถูกโหลดแล้ว          |
| `gateway:shutdown`       | เมื่อการปิด Gateway เริ่มต้น                              |
| `gateway:pre-restart`    | ก่อนการรีสตาร์ต Gateway ที่คาดไว้                         |
| `message:received`       | ข้อความขาเข้าจาก channel ใดๆ                              |
| `message:transcribed`    | หลังจากการถอดเสียงเสร็จสมบูรณ์                            |
| `message:preprocessed`   | หลังจากการประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จหรือถูกข้าม |
| `message:sent`           | ข้อความขาออกถูกส่งถึงแล้ว                                |

## การเขียน Hooks

### โครงสร้าง Hook

แต่ละ Hook เป็นไดเรกทอรีที่มีไฟล์สองไฟล์:

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

**ฟิลด์ metadata** (`metadata.openclaw`):

| ฟิลด์      | คำอธิบาย                                              |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่แสดงสำหรับ CLI                              |
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะรับฟัง                       |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นเป็น `"default"`)   |
| `os`       | แพลตฟอร์มที่จำเป็น (เช่น `["darwin", "linux"]`)       |
| `requires` | พาธ `bins`, `anyBins`, `env` หรือ `config` ที่จำเป็น |
| `always`   | ข้ามการตรวจสอบ eligibility (boolean)                  |
| `install`  | วิธีติดตั้ง                                           |

### การใช้งาน handler

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

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งถึงผู้ใช้) และ `context` (ข้อมูลเฉพาะของเหตุการณ์) บริบทของ Hooks สำหรับ agent และ tool plugin ยังสามารถมี `trace` ซึ่งเป็นบริบท trace วินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C ที่ plugins อาจส่งต่อเข้าไปใน structured logs เพื่อทำ OTEL correlation

### ไฮไลต์บริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะ provider รวมถึง `senderId`, `senderName`, `guildId`) `context.content` จะเลือกเนื้อหาคำสั่งที่ไม่ว่างสำหรับข้อความที่คล้ายคำสั่งก่อน จากนั้นจึงย้อนกลับไปใช้เนื้อหาขาเข้าดิบและเนื้อหาทั่วไป โดยจะไม่รวม enrichment เฉพาะ agent เช่น ประวัติเธรดหรือสรุปลิงก์

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่ enrich แล้ว), `context.from`, `context.channelId`

**เหตุการณ์ Bootstrap** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แพตช์เซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` เฉพาะ clients ที่มีสิทธิ์เท่านั้นที่สามารถเรียกเหตุการณ์ patch ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` สังเกตผู้ใช้ที่ออกคำสั่ง `/stop`; มันเป็น lifecycle ของการยกเลิก/คำสั่ง ไม่ใช่เกตการ finalize ของ agent Plugins ที่ต้องตรวจสอบคำตอบสุดท้ายตามธรรมชาติและขอให้ agent ทำอีกหนึ่งรอบควรใช้ typed plugin hook `before_agent_finalize` แทน ดู [Plugin hooks](/th/plugins/hooks)

**เหตุการณ์ lifecycle ของ Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และเกิดขึ้นเมื่อการปิด Gateway เริ่มต้น `gateway:pre-restart` มีบริบทเดียวกัน แต่เกิดขึ้นเฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการรีสตาร์ตที่คาดไว้และมีการระบุค่า `restartExpectedMs` แบบจำกัด ในระหว่างการปิด การรอ lifecycle hook แต่ละรายการเป็นแบบพยายามอย่างดีที่สุดและมีขอบเขตเวลา เพื่อให้การปิดดำเนินต่อได้หาก handler ค้าง

## การค้นพบ Hook

Hooks ถูกค้นพบจากไดเรกทอรีเหล่านี้ ตามลำดับ override precedence จากต่ำไปสูง:

1. **Hooks ที่บันเดิลมา**: จัดส่งมากับ OpenClaw
2. **Plugin Hooks**: Hooks ที่บันเดิลอยู่ภายใน plugins ที่ติดตั้งแล้ว
3. **Hooks ที่จัดการให้**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันข้ามพื้นที่ทำงาน) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ precedence ระดับนี้ร่วมกัน
4. **Hooks ของพื้นที่ทำงาน**: `<workspace>/hooks/` (ต่อ agent, ปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

Hooks ของพื้นที่ทำงานสามารถเพิ่มชื่อ Hook ใหม่ได้ แต่ไม่สามารถ override Hooks ที่บันเดิลมา, ที่จัดการให้ หรือที่ Plugin จัดเตรียมไว้ซึ่งมีชื่อเดียวกันได้

Gateway จะข้ามการค้นพบ Hook ภายในเมื่อเริ่มต้น จนกว่าจะมีการกำหนดค่า Hooks ภายใน เปิดใช้งาน Hook ที่บันเดิลมาหรือที่จัดการให้ด้วย `openclaw hooks enable <name>`, ติดตั้ง hook pack หรือกำหนด `hooks.internal.enabled=true` เพื่อเลือกเข้าร่วม เมื่อคุณเปิดใช้งาน Hook ที่ระบุชื่อหนึ่งรายการ Gateway จะโหลดเฉพาะ handler ของ Hook นั้น; `hooks.internal.enabled=true`, ไดเรกทอรี Hook เพิ่มเติม และ legacy handlers จะเลือกเข้าร่วมการค้นพบแบบกว้าง

### Hook packs

Hook packs เป็น npm packages ที่ส่งออก Hooks ผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

ข้อกำหนด Npm รองรับเฉพาะรีจิสทรีเท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันแบบเจาะจงหรือ dist-tag ที่ไม่บังคับ) ระบบจะปฏิเสธข้อกำหนดแบบ Git/URL/file และช่วง semver

## ฮุกที่รวมมาในตัว

| ฮุก                   | เหตุการณ์                      | สิ่งที่ทำ                                             |
| --------------------- | ------------------------------ | ----------------------------------------------------- |
| session-memory        | `command:new`, `command:reset` | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`        |
| bootstrap-extra-files | `agent:bootstrap`              | แทรกไฟล์บูตสแตรปเพิ่มเติมจากรูปแบบ glob             |
| command-logger        | `command`                      | บันทึกคำสั่งทั้งหมดไปยัง `~/.openclaw/logs/commands.log` |
| boot-md               | `gateway:startup`              | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน          |

เปิดใช้งานฮุกที่รวมมาในตัว:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความผู้ใช้/ผู้ช่วย 15 รายการล่าสุด สร้าง slug ชื่อไฟล์ที่สื่อความหมายผ่าน LLM และบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-slug.md` โดยใช้วันที่ภายในเครื่องโฮสต์ ต้องกำหนดค่า `workspace.dir`

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

พาธจะถูกแปลงโดยอิงจากเวิร์กสเปซ โหลดเฉพาะชื่อฐานของไฟล์บูตสแตรปที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกคำสั่ง slash ทุกคำสั่งไปยัง `~/.openclaw/logs/commands.log`

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จากเวิร์กสเปซที่ใช้งานอยู่เมื่อ Gateway เริ่มทำงาน

## ฮุกของ Plugin

Plugin สามารถลงทะเบียนฮุกแบบมีชนิดผ่าน Plugin SDK เพื่อการผสานรวมที่ลึกขึ้น:
ดักจับการเรียกเครื่องมือ แก้ไขพรอมป์ ควบคุมลำดับการไหลของข้อความ และอื่นๆ
ใช้ฮุกของ Plugin เมื่อต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือฮุกวงจรชีวิตอื่นๆ ภายในกระบวนการ

สำหรับข้อมูลอ้างอิงฮุกของ Plugin ฉบับสมบูรณ์ โปรดดู [ฮุกของ Plugin](/th/plugins/hooks)

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
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` เดิมยังคงรองรับเพื่อความเข้ากันได้ย้อนหลัง แต่ฮุกใหม่ควรใช้ระบบที่อิงจากการค้นพบ
</Note>

## ข้อมูลอ้างอิง CLI

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

- **ทำให้ตัวจัดการทำงานเร็วอยู่เสมอ** ฮุกทำงานระหว่างการประมวลผลคำสั่ง ให้เรียกงานหนักแบบ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างนุ่มนวล** ห่อการดำเนินการที่มีความเสี่ยงด้วย try/catch; อย่า throw เพื่อให้ตัวจัดการอื่นทำงานต่อได้
- **กรองเหตุการณ์ตั้งแต่ต้น** ส่งคืนทันทีหากประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** แนะนำให้ใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลดภาระงาน

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

ตรวจสอบไบนารีที่ขาดหายไป (PATH), ตัวแปรสภาพแวดล้อม, ค่าการกำหนดค่า หรือความเข้ากันได้กับระบบปฏิบัติการ

### ฮุกไม่ทำงาน

1. ตรวจสอบว่าเปิดใช้งานฮุกแล้ว: `openclaw hooks list`
2. รีสตาร์ตกระบวนการ Gateway ของคุณเพื่อให้ฮุกโหลดใหม่
3. ตรวจสอบบันทึก Gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: ฮุก](/th/cli/hooks)
- [Webhook](/th/automation/cron-jobs#webhooks)
- [ฮุกของ Plugin](/th/plugins/hooks) — ฮุกวงจรชีวิตของ Plugin ภายในกระบวนการ
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
