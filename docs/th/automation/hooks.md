---
read_when:
    - คุณต้องการระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์วงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือดีบักฮุก
summary: 'Hooks: ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-05-05T08:25:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 321eb7a583d5e8c90d2c2026f6e1cf46cd207bef52213774b469a8d46b993967
    source_path: automation/hooks.md
    workflow: 16
---

ฮุกคือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway สามารถค้นพบฮุกจากไดเรกทอรีและตรวจสอบด้วย `openclaw hooks` ได้ Gateway จะโหลดฮุกภายในก็ต่อเมื่อคุณเปิดใช้ฮุก หรือกำหนดค่ารายการฮุก แพ็กฮุก ตัวจัดการแบบเดิม หรือไดเรกทอรีฮุกเพิ่มเติมอย่างน้อยหนึ่งรายการแล้วเท่านั้น

ฮุกใน OpenClaw มีสองชนิด:

- **ฮุกภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเหตุการณ์ของเอเจนต์เกิดขึ้น เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์วงจรชีวิต
- **Webhooks**: ปลายทาง HTTP ภายนอกที่ให้ระบบอื่นเรียกให้งานทำงานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

ฮุกยังสามารถถูกรวมไว้ภายใน Plugin ได้ด้วย `openclaw hooks list` แสดงทั้งฮุกแบบสแตนด์อโลนและฮุกที่จัดการโดย Plugin

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

| เหตุการณ์                 | เกิดขึ้นเมื่อใด                                             |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                      |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                    |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                     |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)                       |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                           |
| `session:compact:after`  | หลังจาก Compaction เสร็จสมบูรณ์                            |
| `session:patch`          | เมื่อพร็อพเพอร์ตีของเซสชันถูกแก้ไข                         |
| `agent:bootstrap`        | ก่อนแทรกไฟล์บูตสแตรปของพื้นที่ทำงาน                        |
| `gateway:startup`        | หลังจากช่องทางเริ่มทำงานและโหลดฮุกแล้ว                     |
| `gateway:shutdown`       | เมื่อการปิด Gateway เริ่มขึ้น                              |
| `gateway:pre-restart`    | ก่อนการรีสตาร์ต Gateway ที่คาดไว้                          |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดๆ                                 |
| `message:transcribed`    | หลังจากถอดเสียงเสร็จสมบูรณ์                                |
| `message:preprocessed`   | หลังจากประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จหรือถูกข้าม        |
| `message:sent`           | ส่งข้อความขาออกแล้ว                                       |

## การเขียนฮุก

### โครงสร้างฮุก

แต่ละฮุกคือไดเรกทอรีที่มีสองไฟล์:

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
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะรับฟัง                      |
| `export`   | named export ที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)   |
| `os`       | แพลตฟอร์มที่จำเป็น (เช่น `["darwin", "linux"]`)      |
| `requires` | พาธ `bins`, `anyBins`, `env` หรือ `config` ที่จำเป็น |
| `always`   | ข้ามการตรวจสอบคุณสมบัติ (บูลีน)                      |
| `install`  | วิธีการติดตั้ง                                      |

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

แต่ละเหตุการณ์มี: `type`, `action`, `sessionKey`, `timestamp`, `messages` (push เพื่อส่งถึงผู้ใช้) และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบทฮุกของ Agent และ Plugin เครื่องมือยังสามารถมี `trace` ซึ่งเป็นบริบทเทรซวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C ซึ่ง Plugin อาจส่งเข้าไปในล็อกแบบมีโครงสร้างเพื่อเชื่อมโยงกับ OTEL

### จุดสำคัญของบริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`) `context.content` จะเลือกเนื้อหาคำสั่งที่ไม่ว่างสำหรับข้อความที่มีลักษณะเป็นคำสั่งก่อน จากนั้นจึงย้อนกลับไปใช้เนื้อหาขาเข้าดิบและเนื้อหาทั่วไป โดยไม่รวมการเพิ่มข้อมูลเฉพาะเอเจนต์ เช่น ประวัติเธรดหรือสรุปลิงก์

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เพิ่มข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์บูตสแตรป** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แพตช์เซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` เฉพาะไคลเอนต์ที่มีสิทธิ์เท่านั้นที่เรียกเหตุการณ์แพตช์ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` เฝ้าดูผู้ใช้ออกคำสั่ง `/stop`; เป็นวงจรชีวิตการยกเลิก/คำสั่ง
ไม่ใช่จุดกั้นการจบงานของเอเจนต์ Plugin ที่ต้องตรวจสอบคำตอบสุดท้ายตามธรรมชาติ
และขอให้เอเจนต์ทำอีกหนึ่งรอบควรใช้ฮุก Plugin แบบมีชนิด
`before_agent_finalize` แทน ดู [ฮุกของ Plugin](/th/plugins/hooks)

**เหตุการณ์วงจรชีวิต Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และจะเกิดขึ้นเมื่อการปิด Gateway เริ่มขึ้น `gateway:pre-restart` มีบริบทเดียวกัน แต่จะเกิดขึ้นเฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการรีสตาร์ตที่คาดไว้และมีการระบุค่า `restartExpectedMs` ที่มีขอบเขตจำกัด ระหว่างการปิด การรอฮุกวงจรชีวิตแต่ละรายการเป็นแบบพยายามอย่างดีที่สุดและมีขอบเขตเวลา เพื่อให้การปิดดำเนินต่อไปได้หากตัวจัดการค้าง

## การค้นพบฮุก

ฮุกจะถูกค้นพบจากไดเรกทอรีเหล่านี้ ตามลำดับความสำคัญในการแทนที่จากน้อยไปมาก:

1. **ฮุกที่มาพร้อมระบบ**: จัดส่งมากับ OpenClaw
2. **ฮุกของ Plugin**: ฮุกที่รวมอยู่ภายใน Plugin ที่ติดตั้งแล้ว
3. **ฮุกที่จัดการแล้ว**: `~/.openclaw/hooks/` (ติดตั้งโดยผู้ใช้ ใช้ร่วมกันข้ามพื้นที่ทำงาน) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ความสำคัญระดับเดียวกันนี้
4. **ฮุกของพื้นที่ทำงาน**: `<workspace>/hooks/` (ต่อเอเจนต์ ปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้อย่างชัดเจน)

ฮุกของพื้นที่ทำงานสามารถเพิ่มชื่อฮุกใหม่ได้ แต่ไม่สามารถแทนที่ฮุกที่มาพร้อมระบบ ฮุกที่จัดการแล้ว หรือฮุกที่ Plugin ให้มาซึ่งมีชื่อเดียวกันได้

Gateway จะข้ามการค้นพบฮุกภายในตอนเริ่มต้นจนกว่าจะกำหนดค่าฮุกภายใน เปิดใช้ฮุกที่มาพร้อมระบบหรือฮุกที่จัดการแล้วด้วย `openclaw hooks enable <name>` ติดตั้งแพ็กฮุก หรือตั้งค่า `hooks.internal.enabled=true` เพื่อเข้าร่วม เมื่อคุณเปิดใช้ฮุกที่ระบุชื่อหนึ่งรายการ Gateway จะโหลดเฉพาะตัวจัดการของฮุกนั้นเท่านั้น; `hooks.internal.enabled=true`, ไดเรกทอรีฮุกเพิ่มเติม และตัวจัดการแบบเดิมจะเข้าร่วมการค้นพบแบบกว้าง

### แพ็กฮุก

แพ็กฮุกคือแพ็กเกจ npm ที่ส่งออกฮุกผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

สเปก npm จำกัดเฉพาะ registry (ชื่อแพ็กเกจ + เวอร์ชันแบบ exact หรือ dist-tag ที่ไม่บังคับ) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ

## ฮุกที่รวมมาให้

| ฮุก                   | เหตุการณ์                                         | สิ่งที่ทำ                                                       |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`                  |
| bootstrap-extra-files | `agent:bootstrap`                                 | แทรกไฟล์ bootstrap เพิ่มเติมจากรูปแบบ glob                    |
| command-logger        | `command`                                         | บันทึกคำสั่งทั้งหมดไปยัง `~/.openclaw/logs/commands.log`       |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | ส่งประกาศแชตที่มองเห็นได้เมื่อ Compaction ของเซสชันเริ่ม/จบ |
| boot-md               | `gateway:startup`                                 | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน                   |

เปิดใช้งานฮุกที่รวมมาให้ตัวใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความผู้ใช้/ผู้ช่วย 15 ข้อความล่าสุดแล้วบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-HHMM.md` โดยใช้วันที่ท้องถิ่นของโฮสต์ การจับ Memory ทำงานในเบื้องหลัง ดังนั้นการตอบรับ `/new` และ `/reset` จะไม่ล่าช้าเพราะการอ่าน transcript หรือการสร้าง slug ที่ไม่บังคับ ตั้งค่า `hooks.internal.entries.session-memory.llmSlug: true` เพื่อสร้าง slug ชื่อไฟล์เชิงบรรยายด้วยโมเดลที่กำหนด ต้องกำหนดค่า `workspace.dir`

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

พาธจะ resolve แบบสัมพัทธ์กับ workspace โหลดเฉพาะ basename ของ bootstrap ที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกคำสั่ง slash ทุกคำสั่งไปยัง `~/.openclaw/logs/commands.log`

<a id="compaction-notifier"></a>

### รายละเอียด compaction-notifier

ส่งข้อความสถานะสั้น ๆ เข้าไปในการสนทนาปัจจุบันเมื่อ OpenClaw เริ่มและเสร็จสิ้นการทำ Compaction กับ transcript ของเซสชัน สิ่งนี้ช่วยให้เทิร์นที่ยาวสับสนน้อยลงบนพื้นผิวแชต เพราะผู้ใช้จะเห็นว่าผู้ช่วยกำลังสรุปบริบทและจะดำเนินการต่อหลัง Compaction

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จาก workspace ที่ใช้งานอยู่เมื่อ Gateway เริ่มทำงาน

## ฮุกของ Plugin

Plugin สามารถลงทะเบียนฮุกแบบ typed ผ่าน Plugin SDK เพื่อการผสานที่ลึกขึ้น:
สกัดกั้นการเรียกเครื่องมือ แก้ไขพรอมป์ ควบคุมการไหลของข้อความ และอื่น ๆ
ใช้ฮุกของ Plugin เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือฮุก lifecycle อื่น ๆ ใน process

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
รูปแบบ config array แบบเดิม `hooks.internal.handlers` ยังคงรองรับเพื่อความเข้ากันได้ย้อนหลัง แต่ฮุกใหม่ควรใช้ระบบที่อิงการค้นพบ
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

- **ทำให้ตัวจัดการทำงานเร็ว.** ฮุกทำงานระหว่างการประมวลผลคำสั่ง เรียกใช้งานหนักแบบ fire-and-forget ด้วย `void processInBackground(event)`.
- **จัดการข้อผิดพลาดอย่างเหมาะสม.** ครอบการดำเนินการที่เสี่ยงด้วย try/catch; อย่า throw เพื่อให้ตัวจัดการอื่นทำงานต่อได้.
- **กรองเหตุการณ์ตั้งแต่เนิ่นๆ.** Return ทันทีหากประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง.
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง.** แนะนำให้ใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลด overhead.

## การแก้ไขปัญหา

### ไม่พบฮุก

```bash
# Verify directory structure
ls -la ~/.openclaw/hooks/my-hook/
# Should show: HOOK.md, handler.ts

# List all discovered hooks
openclaw hooks list
```

### ฮุกไม่มีสิทธิ์ทำงาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบ binary ที่ขาดหาย (PATH), environment variables, ค่าคอนฟิก หรือความเข้ากันได้กับ OS.

### ฮุกไม่ทำงาน

1. ตรวจสอบว่าฮุกเปิดใช้งานอยู่: `openclaw hooks list`
2. รีสตาร์ทกระบวนการ gateway เพื่อให้ฮุกโหลดใหม่.
3. ตรวจสอบ gateway logs: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: ฮุก](/th/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [ฮุกของ Plugin](/th/plugins/hooks) — ฮุกวงจรชีวิตของ plugin แบบ in-process
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
