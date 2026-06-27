---
read_when:
    - คุณต้องการระบบอัตโนมัติแบบขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์วงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือแก้จุดบกพร่องของ hooks
summary: 'ฮุก: ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์วงจรชีวิต'
title: ตะขอ
x-i18n:
    generated_at: "2026-06-27T17:09:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0259739b0547ba4826b540d392c6d6b72c6bec24fd50d5e297817694fd728438
    source_path: automation/hooks.md
    workflow: 16
---

Hooks คือสคริปต์ขนาดเล็กที่ทำงานเมื่อมีบางอย่างเกิดขึ้นภายใน Gateway สามารถค้นพบได้จากไดเรกทอรีและตรวจสอบด้วย `openclaw hooks` Gateway จะโหลดฮุกภายในหลังจากคุณเปิดใช้งานฮุก หรือกำหนดค่ารายการฮุก แพ็กฮุก ตัวจัดการแบบเดิม หรือไดเรกทอรีฮุกเพิ่มเติมอย่างน้อยหนึ่งรายการเท่านั้น

ใน OpenClaw มีฮุกสองประเภท:

- **ฮุกภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเหตุการณ์ของเอเจนต์เกิดขึ้น เช่น `/new`, `/reset`, `/stop` หรือเหตุการณ์วงจรชีวิต
- **Webhooks**: เอ็นด์พอยต์ HTTP ภายนอกที่ให้ระบบอื่นทริกเกอร์งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

ฮุกยังสามารถถูกบันเดิลไว้ภายใน Plugin ได้ด้วย `openclaw hooks list` แสดงทั้งฮุกแบบแยกเดี่ยวและฮุกที่จัดการโดย Plugin

## เลือกพื้นผิวที่เหมาะสม

OpenClaw มีพื้นผิวส่วนขยายหลายแบบที่ดูคล้ายกันแต่แก้ปัญหาคนละแบบ:

| ถ้าคุณต้องการ...                                                                                                     | ใช้...                                | เหตุผล                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| บันทึกสแนปชอตเมื่อ `/new`, บันทึกล็อก `/reset`, เรียก API ภายนอกหลัง `message:sent` หรือเพิ่มการทำงานอัตโนมัติระดับกว้างสำหรับผู้ปฏิบัติงาน | ฮุกภายใน (`HOOK.md`, หน้านี้) | ฮุกแบบไฟล์มีไว้สำหรับผลข้างเคียงที่ผู้ปฏิบัติงานจัดการ และการทำงานอัตโนมัติของคำสั่ง/วงจรชีวิต |
| เขียนพรอมป์ใหม่ บล็อกเครื่องมือ ยกเลิกข้อความขาออก หรือเพิ่มมิดเดิลแวร์/นโยบายแบบมีลำดับ                              | ฮุก Plugin แบบมีชนิดผ่าน `api.on(...)`  | ฮุกแบบมีชนิดมีสัญญาที่ชัดเจน ลำดับความสำคัญ กฎการผสาน และความหมายของการบล็อก/ยกเลิก      |
| เพิ่มการส่งออกเพื่อเทเลเมทรีเท่านั้นหรือความสามารถในการสังเกต                                                                            | เหตุการณ์วินิจฉัย                     | ความสามารถในการสังเกตเป็นบัสเหตุการณ์แยกต่างหาก ไม่ใช่พื้นผิวฮุกสำหรับนโยบาย                              |

ใช้ฮุกภายในเมื่อคุณต้องการการทำงานอัตโนมัติที่ทำตัวเหมือนอินทิเกรชันขนาดเล็กที่ติดตั้งไว้ ใช้ฮุก Plugin แบบมีชนิดเมื่อคุณต้องการควบคุมวงจรชีวิตของรันไทม์

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

| เหตุการณ์                    | เกิดขึ้นเมื่อ                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                      |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                    |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                     |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)                       |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                       |
| `session:compact:after`  | หลังจาก Compaction เสร็จสิ้น                                 |
| `session:patch`          | เมื่อคุณสมบัติของเซสชันถูกแก้ไข                       |
| `agent:bootstrap`        | ก่อนที่ไฟล์บูตสแตรปของเวิร์กสเปซจะถูกแทรก              |
| `gateway:startup`        | หลังจากช่องทางเริ่มทำงานและโหลดฮุกแล้ว                  |
| `gateway:shutdown`       | เมื่อการปิด Gateway เริ่มขึ้น                               |
| `gateway:pre-restart`    | ก่อนการรีสตาร์ต Gateway ที่คาดไว้                         |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดๆ                           |
| `message:transcribed`    | หลังจากการถอดเสียงจากเสียงเสร็จสิ้น                        |
| `message:preprocessed`   | หลังจากการประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จสิ้นหรือถูกข้าม |
| `message:sent`           | ข้อความขาออกถูกส่งสำเร็จ                                 |

## การเขียนฮุก

### โครงสร้างฮุก

ฮุกแต่ละตัวคือไดเรกทอรีที่มีไฟล์สองไฟล์:

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

| ฟิลด์      | คำอธิบาย                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่แสดงสำหรับ CLI                                |
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะรับฟัง                        |
| `export`   | ชื่อเอ็กซ์พอร์ตที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)        |
| `os`       | แพลตฟอร์มที่ต้องใช้ (เช่น `["darwin", "linux"]`)     |
| `requires` | พาธ `bins`, `anyBins`, `env` หรือ `config` ที่ต้องใช้ |
| `always`   | ข้ามการตรวจสอบคุณสมบัติ (บูลีน)                  |
| `install`  | วิธีการติดตั้ง                                 |

### การติดตั้งใช้งานตัวจัดการ

```typescript
const handler = async (event) => {
  if (event.type !== "command" || event.action !== "new") {
    return;
  }

  console.log(`[my-hook] New command triggered`);
  // Your logic here

  // Optionally send a reply on replyable surfaces
  event.messages.push("Hook executed!");
};

export default handler;
```

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` (เพิ่มการตอบกลับที่นี่เฉพาะบนพื้นผิวที่ตอบกลับได้เท่านั้น) และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบทของฮุกเอเจนต์และเครื่องมือของ Plugin ยังสามารถมี `trace` ซึ่งเป็นบริบทเทรซวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C ซึ่ง Plugin อาจส่งต่อเข้าไปในล็อกแบบมีโครงสร้างเพื่อเชื่อมโยงกับ OTEL ได้

`event.messages` จะถูกส่งโดยอัตโนมัติเฉพาะบนพื้นผิวที่ตอบกลับได้ เช่น
`command:*` และ `message:received` เท่านั้น เหตุการณ์ที่เป็นวงจรชีวิตอย่างเดียว เช่น
`agent:bootstrap`, `session:*`, `gateway:*` หรือ `message:sent` ไม่มี
ช่องทางตอบกลับและจะไม่สนใจข้อความที่ถูกเพิ่มเข้าไป

### ไฮไลต์ของบริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`) `context.content` จะเลือกเนื้อหาคำสั่งที่ไม่ว่างสำหรับข้อความที่มีลักษณะคล้ายคำสั่งก่อน จากนั้นจึงย้อนกลับไปใช้เนื้อหาขาเข้าดิบและเนื้อหาทั่วไป โดยไม่รวมการเสริมข้อมูลที่มีเฉพาะเอเจนต์ เช่น ประวัติเธรดหรือสรุปลิงก์

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId`

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์บูตสแตรป** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แพตช์เซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยน), `context.cfg` เฉพาะไคลเอนต์ที่มีสิทธิ์พิเศษเท่านั้นที่ทริกเกอร์เหตุการณ์แพตช์ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` สังเกตผู้ใช้ที่ออกคำสั่ง `/stop`; เป็นวงจรชีวิตของการยกเลิก/คำสั่ง
ไม่ใช่ด่านการจบงานของเอเจนต์ Plugin ที่ต้องตรวจสอบ
คำตอบสุดท้ายตามธรรมชาติและขอให้เอเจนต์ทำอีกหนึ่งรอบควรใช้ฮุก
Plugin แบบมีชนิด `before_agent_finalize` แทน ดู [ฮุก Plugin](/th/plugins/hooks)

**เหตุการณ์วงจรชีวิตของ Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และเกิดขึ้นเมื่อการปิด Gateway เริ่มขึ้น `gateway:pre-restart` มีบริบทเดียวกัน แต่จะเกิดขึ้นเฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการรีสตาร์ตที่คาดไว้และมีการระบุค่า `restartExpectedMs` ที่จำกัดแน่นอน ระหว่างการปิด การรอฮุกวงจรชีวิตแต่ละตัวเป็นแบบพยายามให้ดีที่สุดและมีขอบเขต เพื่อให้การปิดยังดำเนินต่อไปหากตัวจัดการค้าง งบเวลารอเริ่มต้นคือ 5 วินาทีสำหรับ `gateway:shutdown` และ 10 วินาทีสำหรับ `gateway:pre-restart`

ใช้ `gateway:pre-restart` สำหรับประกาศรีสตาร์ตสั้นๆ ขณะที่ช่องทางยังพร้อมใช้งาน:

```typescript
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export default async function handler(event) {
  if (event.type !== "gateway" || event.action !== "pre-restart") {
    return;
  }

  const restartInSeconds = Math.ceil(event.context.restartExpectedMs / 1000);
  await execFileAsync("openclaw", [
    "system",
    "event",
    "--mode",
    "now",
    "--text",
    `Gateway restarting in ~${restartInSeconds}s (${event.context.reason}). Checkpoint now.`,
  ]);
}
```

ระหว่างเหตุการณ์ `gateway:shutdown` (หรือ `gateway:pre-restart`) กับลำดับการปิดส่วนที่เหลือ gateway ยังยิงฮุก Plugin แบบมีชนิด `session_end` สำหรับทุกเซสชันที่ยังทำงานอยู่เมื่อกระบวนการหยุดด้วย `reason` ของเหตุการณ์คือ `shutdown` สำหรับการหยุดแบบ SIGTERM/SIGINT ปกติ และ `restart` เมื่อการปิดถูกกำหนดเวลาไว้เป็นส่วนหนึ่งของการรีสตาร์ตที่คาดไว้ การระบายนี้มีขอบเขตเพื่อไม่ให้ตัวจัดการ `session_end` ที่ช้าบล็อกการออกจากกระบวนการ และเซสชันที่ถูกจบไปแล้วผ่านการแทนที่ / รีเซ็ต / ลบ / Compaction จะถูกข้ามเพื่อหลีกเลี่ยงการยิงซ้ำ

## การค้นพบฮุก

ฮุกจะถูกค้นพบจากไดเรกทอรีเหล่านี้ ตามลำดับความสำคัญในการเขียนทับจากต่ำไปสูง:

1. **ฮุกที่บันเดิลมา**: จัดส่งพร้อม OpenClaw
2. **ฮุก Plugin**: ฮุกที่บันเดิลอยู่ภายใน Plugin ที่ติดตั้งไว้
3. **ฮุกที่จัดการไว้**: `~/.openclaw/hooks/` (ผู้ใช้ติดตั้ง ใช้ร่วมกันข้ามเวิร์กสเปซ) ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ลำดับความสำคัญเดียวกันนี้
4. **ฮุกเวิร์กสเปซ**: `<workspace>/hooks/` (ต่อเอเจนต์ ปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้งานอย่างชัดเจน)

ฮุกเวิร์กสเปซสามารถเพิ่มชื่อฮุกใหม่ได้ แต่ไม่สามารถเขียนทับฮุกที่บันเดิลมา ฮุกที่จัดการไว้ หรือฮุกที่ Plugin ให้มาซึ่งมีชื่อเดียวกันได้

Gateway จะข้ามการค้นพบฮุกภายในเมื่อเริ่มต้นจนกว่าจะมีการกำหนดค่าฮุกภายใน เปิดใช้งานฮุกที่บันเดิลมาหรือฮุกที่จัดการไว้ด้วย `openclaw hooks enable <name>` ติดตั้งแพ็กฮุก หรือตั้งค่า `hooks.internal.enabled=true` เพื่อเลือกใช้ เมื่อคุณเปิดใช้งานฮุกที่ระบุชื่อหนึ่งตัว Gateway จะโหลดเฉพาะตัวจัดการของฮุกนั้น; `hooks.internal.enabled=true`, ไดเรกทอรีฮุกเพิ่มเติม และตัวจัดการแบบเดิมจะเลือกใช้การค้นพบแบบกว้าง

### แพ็กฮุก

แพ็กฮุกคือแพ็กเกจ npm ที่เอ็กซ์พอร์ตฮุกผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

สเปก npm รองรับเฉพาะรีจิสทรีเท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันที่ตรงเป๊ะหรือ dist-tag แบบไม่บังคับ) สเปก Git/URL/file และช่วง semver จะถูกปฏิเสธ

## ฮุกที่บันเดิลมา

| ฮุก                  | เหตุการณ์                                            | สิ่งที่ทำ                                                   |
| --------------------- | ------------------------------------------------- | -------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | บันทึกบริบทเซสชันไปที่ `<workspace>/memory/`                 |
| bootstrap-extra-files | `agent:bootstrap`                                 | แทรกไฟล์บูตสแตรปเพิ่มเติมจากรูปแบบ glob          |
| command-logger        | `command`                                         | บันทึกคำสั่งทั้งหมดไปที่ `~/.openclaw/logs/commands.log`           |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | ส่งการแจ้งเตือนในแชตที่มองเห็นได้เมื่อ Compaction ของเซสชันเริ่ม/สิ้นสุด |
| boot-md               | `gateway:startup`                                 | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน                         |

เปิดใช้งานฮุกที่มาพร้อมชุดใดก็ได้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

ดึงข้อความผู้ใช้/ผู้ช่วย 15 ข้อความล่าสุดและบันทึกไปที่ `<workspace>/memory/YYYY-MM-DD-HHMM.md` โดยใช้วันที่ภายในเครื่องของโฮสต์ การจับ Memory ทำงานในเบื้องหลัง ดังนั้นการตอบรับ `/new` และ `/reset` จะไม่ล่าช้าเพราะการอ่านข้อความถอดเสียงหรือการสร้าง slug ที่เป็นตัวเลือก ตั้งค่า `hooks.internal.entries.session-memory.llmSlug: true` เพื่อสร้าง slug ชื่อไฟล์เชิงอธิบายด้วยโมเดลที่กำหนดค่าไว้ ต้องกำหนดค่า `workspace.dir`

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

พาธจะ resolve สัมพันธ์กับ workspace โหลดเฉพาะ basename สำหรับบูตสแตรปที่รู้จักเท่านั้น (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกคำสั่ง slash ทุกคำสั่งไปที่ `~/.openclaw/logs/commands.log`

<a id="compaction-notifier"></a>

### รายละเอียด compaction-notifier

ส่งข้อความสถานะสั้น ๆ เข้าไปในการสนทนาปัจจุบันเมื่อ OpenClaw เริ่มและเสร็จสิ้นการ compact ข้อความถอดเสียงของเซสชัน สิ่งนี้ช่วยให้เทิร์นยาว ๆ บนพื้นผิวแชตสับสนน้อยลง เพราะผู้ใช้จะเห็นว่าผู้ช่วยกำลังสรุปบริบทและจะดำเนินการต่อหลัง Compaction

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` จาก workspace ที่ใช้งานอยู่เมื่อ Gateway เริ่มทำงาน

## ฮุกของ Plugin

Plugin สามารถลงทะเบียนฮุกแบบ typed ผ่าน Plugin SDK เพื่อการผสานรวมที่ลึกขึ้น:
การดักจับการเรียกเครื่องมือ การแก้ไขพรอมป์ การควบคุมการไหลของข้อความ และอื่น ๆ
ใช้ฮุกของ Plugin เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือฮุกวงจรชีวิตอื่น ๆ ภายในกระบวนการ

ฮุกภายในที่ Plugin จัดการแตกต่างออกไป: ฮุกเหล่านั้นเข้าร่วมระบบเหตุการณ์คำสั่ง/วงจรชีวิตแบบหยาบของหน้านี้ และแสดงใน `openclaw hooks list` เป็น
`plugin:<id>` ใช้ฮุกเหล่านั้นสำหรับผลข้างเคียงและความเข้ากันได้กับชุดฮุก ไม่ใช่
สำหรับ middleware แบบมีลำดับหรือด่านนโยบาย

สำหรับเอกสารอ้างอิงฮุกของ Plugin ฉบับสมบูรณ์ โปรดดู [ฮุกของ Plugin](/th/plugins/hooks)

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

## แนวทางปฏิบัติที่ดี

- **ทำให้ handlers รวดเร็ว** ฮุกทำงานระหว่างการประมวลผลคำสั่ง ส่งงานหนักไปทำแบบ fire-and-forget ด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างนุ่มนวล** ครอบการดำเนินการที่มีความเสี่ยงด้วย try/catch; อย่า throw เพื่อให้ handlers อื่นทำงานได้
- **กรองเหตุการณ์ตั้งแต่ต้น** ส่งคืนทันทีหากประเภท/การกระทำของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** ควรใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลดโอเวอร์เฮด

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

ตรวจสอบไบนารีที่ขาดหาย (PATH), ตัวแปรสภาพแวดล้อม, ค่าการกำหนดค่า หรือความเข้ากันได้กับ OS

### ฮุกไม่ทำงาน

1. ตรวจสอบว่าฮุกเปิดใช้งานอยู่: `openclaw hooks list`
2. รีสตาร์ทกระบวนการ Gateway เพื่อให้โหลดฮุกใหม่
3. ตรวจสอบบันทึก Gateway: `./scripts/clawlog.sh | grep hook`

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI: hooks](/th/cli/hooks)
- [Webhooks](/th/automation/cron-jobs#webhooks)
- [ฮุกของ Plugin](/th/plugins/hooks) — ฮุกวงจรชีวิต Plugin ภายในกระบวนการ
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
