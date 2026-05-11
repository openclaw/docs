---
read_when:
    - คุณต้องการระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์วงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบักฮุก
summary: 'ฮุก: ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-05-11T20:20:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 02f44dd117d52040ea1205521c6ecd4eb410510175e2312e2584a15e6df27d96
    source_path: automation/hooks.md
    workflow: 16
---

ฮุกคือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway โดยสามารถค้นพบได้จากไดเรกทอรีและตรวจสอบด้วย `openclaw hooks` Gateway จะโหลดฮุกภายในหลังจากที่คุณเปิดใช้งานฮุกหรือกำหนดค่าอย่างน้อยหนึ่งรายการของฮุก, แพ็กฮุก, ตัวจัดการแบบเดิม, หรือไดเรกทอรีฮุกเพิ่มเติมเท่านั้น

ฮุกใน OpenClaw มีสองประเภท:

- **ฮุกภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเหตุการณ์ของเอเจนต์เกิดขึ้น เช่น `/new`, `/reset`, `/stop`, หรือเหตุการณ์วงจรชีวิต
- **Webhook**: ปลายทาง HTTP ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhook](/th/automation/cron-jobs#webhooks)

ฮุกยังสามารถรวมมากับ Plugin ได้ด้วย `openclaw hooks list` จะแสดงทั้งฮุกแบบสแตนด์อโลนและฮุกที่จัดการโดย Plugin

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

| เหตุการณ์                 | เมื่อใดที่เกิดขึ้น                                           |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                      |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                    |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                     |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวฟังทั่วไป)                          |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                            |
| `session:compact:after`  | หลังจาก Compaction เสร็จสมบูรณ์                             |
| `session:patch`          | เมื่อมีการแก้ไขคุณสมบัติเซสชัน                              |
| `agent:bootstrap`        | ก่อนแทรกไฟล์บูตสแตรปของเวิร์กสเปซ                           |
| `gateway:startup`        | หลังจากช่องทางเริ่มทำงานและโหลดฮุกแล้ว                      |
| `gateway:shutdown`       | เมื่อการปิด Gateway เริ่มขึ้น                               |
| `gateway:pre-restart`    | ก่อนการรีสตาร์ท Gateway ที่คาดไว้                           |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดๆ                                  |
| `message:transcribed`    | หลังจากการถอดเสียงเสร็จสมบูรณ์                              |
| `message:preprocessed`   | หลังจากการประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จสิ้นหรือถูกข้าม |
| `message:sent`           | ส่งข้อความขาออกแล้ว                                         |

## การเขียนฮุก

### โครงสร้างฮุก

ฮุกแต่ละตัวคือไดเรกทอรีที่มีสองไฟล์:

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
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะฟัง                          |
| `export`   | Named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)    |
| `os`       | แพลตฟอร์มที่ต้องใช้ (เช่น `["darwin", "linux"]`)     |
| `requires` | พาธ `bins`, `anyBins`, `env`, หรือ `config` ที่ต้องใช้ |
| `always`   | ข้ามการตรวจสอบสิทธิ์ความพร้อมใช้งาน (บูลีน)          |
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

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งให้ผู้ใช้), และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบทฮุกของเอเจนต์และเครื่องมือ Plugin ยังสามารถมี `trace` ซึ่งเป็นบริบทการติดตามวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C และ Plugin อาจส่งต่อเข้าไปในล็อกแบบมีโครงสร้างเพื่อเชื่อมโยงกับ OTEL ได้

### จุดสำคัญของบริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`) `context.content` จะให้ความสำคัญกับเนื้อหาคำสั่งที่ไม่ว่างสำหรับข้อความที่คล้ายคำสั่ง จากนั้นจึงย้อนกลับไปใช้เนื้อหาขาเข้าแบบดิบและเนื้อหาทั่วไป โดยไม่รวมการเพิ่มข้อมูลเฉพาะเอเจนต์ เช่น ประวัติเธรดหรือสรุปลิงก์

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เพิ่มข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์บูตสแตรป** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แพตช์เซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยนแปลง), `context.cfg` เฉพาะไคลเอนต์ที่มีสิทธิ์พิเศษเท่านั้นที่ทริกเกอร์เหตุการณ์แพตช์ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` สังเกตการที่ผู้ใช้ออกคำสั่ง `/stop`; เป็นวงจรชีวิตของการยกเลิก/คำสั่ง
ไม่ใช่ด่านสำหรับการจบงานของเอเจนต์ Plugin ที่ต้องตรวจสอบคำตอบสุดท้ายตามธรรมชาติ
และขอให้เอเจนต์ดำเนินการอีกหนึ่งรอบควรใช้ฮุก Plugin แบบระบุชนิด
`before_agent_finalize` แทน ดู [ฮุก Plugin](/th/plugins/hooks)

**เหตุการณ์วงจรชีวิต Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และเกิดขึ้นเมื่อการปิด Gateway เริ่มต้น `gateway:pre-restart` มีบริบทเดียวกันแต่เกิดขึ้นเฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการรีสตาร์ทที่คาดไว้และมีการระบุค่า `restartExpectedMs` ที่จำกัด ระหว่างการปิด การรอฮุกวงจรชีวิตแต่ละตัวเป็นแบบพยายามให้ดีที่สุดและมีขอบเขต เพื่อให้การปิดดำเนินต่อไปได้หากตัวจัดการหยุดค้าง

ระหว่างเหตุการณ์ `gateway:shutdown` (หรือ `gateway:pre-restart`) กับลำดับการปิดส่วนที่เหลือ Gateway ยังเรียกฮุก Plugin แบบระบุชนิด `session_end` สำหรับทุกเซสชันที่ยังคงทำงานอยู่เมื่อโปรเซสหยุด ค่า `reason` ของเหตุการณ์คือ `shutdown` สำหรับการหยุด SIGTERM/SIGINT ทั่วไป และ `restart` เมื่อการปิดถูกกำหนดเวลาไว้เป็นส่วนหนึ่งของการรีสตาร์ทที่คาดไว้ การระบายนี้มีขอบเขตเพื่อให้ตัวจัดการ `session_end` ที่ช้าไม่สามารถบล็อกการออกจากโปรเซสได้ และเซสชันที่ถูกจบไปแล้วผ่าน replace / reset / delete / compaction จะถูกข้ามเพื่อหลีกเลี่ยงการเรียกซ้ำ

## การค้นพบฮุก

ฮุกจะถูกค้นพบจากไดเรกทอรีเหล่านี้ ตามลำดับความสำคัญการแทนที่จากน้อยไปมาก:

1. **ฮุกที่รวมมาให้**: จัดส่งมากับ OpenClaw
2. **ฮุก Plugin**: ฮุกที่รวมอยู่ภายใน Plugin ที่ติดตั้งไว้
3. **ฮุกที่จัดการไว้**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันข้ามเวิร์กสเปซ) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ความสำคัญระดับนี้ร่วมกัน
4. **ฮุกของเวิร์กสเปซ**: `<workspace>/hooks/` (ต่อเอเจนต์ ปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

ฮุกของเวิร์กสเปซสามารถเพิ่มชื่อฮุกใหม่ได้ แต่ไม่สามารถแทนที่ฮุกที่รวมมาให้ ฮุกที่จัดการไว้ หรือฮุกจาก Plugin ที่มีชื่อเดียวกันได้

Gateway จะข้ามการค้นพบฮุกภายในตอนเริ่มต้นจนกว่าจะมีการกำหนดค่าฮุกภายใน เปิดใช้งานฮุกที่รวมมาให้หรือฮุกที่จัดการไว้ด้วย `openclaw hooks enable <name>` ติดตั้งแพ็กฮุก หรือกำหนด `hooks.internal.enabled=true` เพื่อเลือกใช้ เมื่อคุณเปิดใช้งานฮุกที่มีชื่อหนึ่งตัว Gateway จะโหลดเฉพาะตัวจัดการของฮุกนั้น; `hooks.internal.enabled=true`, ไดเรกทอรีฮุกเพิ่มเติม, และตัวจัดการแบบเดิมจะเลือกใช้การค้นพบแบบกว้าง

### แพ็กฮุก

แพ็กฮุกคือแพ็กเกจ npm ที่ส่งออกฮุกผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

สเปก npm รองรับเฉพาะรีจิสทรี (ชื่อแพ็กเกจ + เวอร์ชันแบบระบุแน่นอนหรือ dist-tag ที่เป็นทางเลือก) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ

## ฮุกที่รวมมาให้

| ฮุก                   | เหตุการณ์                                         | สิ่งที่ทำ                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | แทรกไฟล์บูตสแตรปเพิ่มเติมจากรูปแบบ glob                       |
| command-logger        | `command`                                         | บันทึกคำสั่งทั้งหมดไปยัง `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | ส่งประกาศแชตที่มองเห็นได้เมื่อ Compaction ของเซสชันเริ่ม/จบ  |
| boot-md               | `gateway:startup`                                 | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน                    |

เปิดใช้งานฮุกที่รวมมาให้ตัวใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความผู้ใช้/ผู้ช่วยล่าสุด 15 ข้อความและบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-HHMM.md` โดยใช้วันที่ท้องถิ่นของโฮสต์ การจับหน่วยความจำทำงานในเบื้องหลัง ดังนั้นการตอบรับ `/new` และ `/reset` จะไม่ถูกหน่วงโดยการอ่านทรานสคริปต์หรือการสร้าง slug ที่เป็นทางเลือก ตั้งค่า `hooks.internal.entries.session-memory.llmSlug: true` เพื่อสร้าง slug ชื่อไฟล์เชิงบรรยายด้วยโมเดลที่กำหนดค่าไว้ ต้องมีการกำหนดค่า `workspace.dir`

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

พาธจะถูก resolve โดยอิงกับเวิร์กสเปซ โหลดเฉพาะชื่อฐานของบูตสแตรปที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกคำสั่งสแลชทุกคำสั่งไปยัง `~/.openclaw/logs/commands.log`

<a id="compaction-notifier"></a>

### รายละเอียด compaction-notifier

ส่งข้อความสถานะสั้นๆ เข้าไปในบทสนทนาปัจจุบันเมื่อ OpenClaw เริ่มและเสร็จสิ้นการย่อทรานสคริปต์ของเซสชัน สิ่งนี้ทำให้รอบการทำงานที่ยาวสับสนน้อยลงบนพื้นผิวแชต เพราะผู้ใช้เห็นได้ว่าผู้ช่วยกำลังสรุปบริบทและจะดำเนินการต่อหลัง Compaction

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จากเวิร์กสเปซที่ใช้งานอยู่เมื่อ Gateway เริ่มทำงาน

## ฮุก Plugin

Plugin สามารถลงทะเบียนฮุกแบบระบุชนิดผ่าน Plugin SDK เพื่อการผสานรวมที่ลึกขึ้น:
การสกัดกั้นการเรียกเครื่องมือ การแก้ไขพรอมต์ การควบคุมโฟลว์ข้อความ และอื่นๆ
ใช้ฮุก Plugin เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install`, หรือฮุกวงจรชีวิตอื่นๆ ในโปรเซส

สำหรับข้อมูลอ้างอิงฮุก Plugin ฉบับสมบูรณ์ ดู [ฮุก Plugin](/th/plugins/hooks)

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
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` แบบเดิมยังคงรองรับเพื่อความเข้ากันได้ย้อนหลัง แต่ hooks ใหม่ควรใช้ระบบที่อิงตามการค้นพบ
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

## แนวทางปฏิบัติที่แนะนำ

- **ทำให้ handlers ทำงานรวดเร็ว** Hooks จะทำงานระหว่างการประมวลผลคำสั่ง ส่งงานหนักให้ทำแบบ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างเหมาะสม** ครอบการดำเนินการที่มีความเสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handlers อื่นยังทำงานได้
- **กรองเหตุการณ์ตั้งแต่ต้น** return ทันทีหากประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลดภาระงาน

## การแก้ไขปัญหา

### ไม่พบ hook

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### hook ไม่มีสิทธิ์ใช้งาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบไบนารีที่ขาดหายไป (PATH), ตัวแปรสภาพแวดล้อม, ค่าการกำหนดค่า หรือความเข้ากันได้ของ OS

### hook ไม่ทำงาน

1. ตรวจสอบว่า hook เปิดใช้งานอยู่: `openclaw hooks list`
2. รีสตาร์ทกระบวนการ gateway ของคุณเพื่อให้ hooks โหลดใหม่
3. ตรวจสอบบันทึก gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: hooks](/th/cli/hooks)
- [Webhook](/th/automation/cron-jobs#webhooks)
- [hooks ของ Plugin](/th/plugins/hooks) — hooks วงจรชีวิต Plugin แบบ in-process
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
