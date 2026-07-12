---
read_when:
    - คุณต้องการระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับ /new, /reset, /stop และเหตุการณ์ในวงจรชีวิตของเอเจนต์
    - คุณต้องการสร้าง ติดตั้ง หรือแก้ไขข้อบกพร่องของฮุก
summary: 'Hooks: ระบบอัตโนมัติที่ขับเคลื่อนด้วยเหตุการณ์สำหรับคำสั่งและเหตุการณ์ในวงจรชีวิต'
title: ฮุก
x-i18n:
    generated_at: "2026-07-12T15:50:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ba09acf45cc09d4ce84b9dda36af2a720ccefbfaed23a1558dd36358ce56701a
    source_path: automation/hooks.md
    workflow: 16
---

Hooks คือสคริปต์ขนาดเล็กที่ทำงานภายใน Gateway เมื่อเกิดเหตุการณ์ของเอเจนต์ เช่น คำสั่ง `/new`, `/reset`, `/stop`, การทำ Compaction ของเซสชัน, วงจรชีวิตของ Gateway และลำดับการไหลของข้อความ ระบบจะค้นหา Hooks จากไดเรกทอรีและจัดการผ่าน `openclaw hooks` โดย Gateway จะโหลด Hooks ภายในหลังจากที่คุณเปิดใช้ Hooks หรือกำหนดค่ารายการ Hook, แพ็ก Hook, ตัวจัดการแบบเดิม หรือไดเรกทอรี Hook เพิ่มเติมอย่างน้อยหนึ่งรายการแล้วเท่านั้น

Hooks ใน OpenClaw มีสองประเภท:

- **Hooks ภายใน** (หน้านี้): ทำงานภายใน Gateway เมื่อเกิดเหตุการณ์ของเอเจนต์
- **Webhooks**: ปลายทาง HTTP ภายนอกที่ช่วยให้ระบบอื่นเรียกใช้งานใน OpenClaw ได้ ดู [Webhooks](/th/automation/cron-jobs#webhooks)

Hooks สามารถรวมอยู่ภายใน plugins ได้เช่นกัน `openclaw hooks list` จะแสดงทั้ง Hooks แบบแยกเดี่ยวและ Hooks ที่จัดการโดย Plugin (แสดงเป็น `plugin:<id>`)

## เลือกส่วนขยายที่เหมาะสม

OpenClaw มีส่วนขยายหลายแบบที่ดูคล้ายกัน แต่ใช้แก้ปัญหาต่างกัน:

| หากคุณต้องการ...                                                                                                     | ใช้...                                | เหตุผล                                                                                           |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------- |
| บันทึกสแนปช็อตเมื่อใช้ `/new`, บันทึกล็อก `/reset`, เรียก API ภายนอกหลัง `message:sent` หรือเพิ่มระบบอัตโนมัติระดับกว้างสำหรับผู้ควบคุม | Hooks ภายใน (`HOOK.md`, หน้านี้) | Hooks แบบไฟล์ออกแบบมาสำหรับผลข้างเคียงที่ผู้ควบคุมจัดการ และระบบอัตโนมัติสำหรับคำสั่ง/วงจรชีวิต |
| เขียนพรอมต์ใหม่, บล็อกเครื่องมือ, ยกเลิกข้อความขาออก หรือเพิ่มมิดเดิลแวร์/นโยบายที่มีลำดับ                              | Hooks ของ Plugin แบบมีชนิดข้อมูลผ่าน `api.on(...)`  | Hooks แบบมีชนิดข้อมูลมีสัญญาที่ชัดเจน ลำดับความสำคัญ กฎการผสาน และความหมายของการบล็อก/ยกเลิก      |
| เพิ่มการส่งออกข้อมูลสำหรับการวัดและติดตามเท่านั้น หรือเพิ่มความสามารถในการสังเกตการณ์                                                                            | เหตุการณ์วินิจฉัย                     | ความสามารถในการสังเกตการณ์ใช้บัสเหตุการณ์แยกต่างหาก ไม่ใช่ส่วนขยาย Hook สำหรับนโยบาย                              |

ใช้ Hooks ภายในเมื่อต้องการระบบอัตโนมัติที่ทำงานเหมือนการผสานรวมขนาดเล็กที่ติดตั้งไว้ ใช้ Hooks ของ Plugin แบบมีชนิดข้อมูลเมื่อต้องการควบคุมวงจรชีวิตขณะทำงาน

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

Hooks สมัครรับคีย์เฉพาะจากตารางนี้ หรือสมัครรับเฉพาะชื่อกลุ่ม
(`command`, `session`, `agent`, `gateway`, `message`) เพื่อรับทุกการดำเนินการ
ในกลุ่มนั้น แกนหลักของ OpenClaw จะไม่ปล่อยเหตุการณ์ชื่ออื่น ดังนั้นชื่ออื่นแทบ
ทั้งหมดจึงมักเป็นการพิมพ์ผิดที่ทำให้ Hook ไม่ทำงานโดยไม่มีข้อความแจ้งเตือน (เว้นแต่ Plugin จะปล่อย
เหตุการณ์แบบกำหนดเองซึ่งสามารถเรียกใช้งาน Hook นั้นได้) ตัวโหลด Hook จะบันทึกคำเตือนสำหรับชื่อดังกล่าว
(ตัวอย่างเช่น `command:nwe`) และ `openclaw hooks info <name>` จะระบุชื่อเหล่านี้ ทำให้
สามารถวินิจฉัย Hook ที่ไม่เคยทำงานได้

| เหตุการณ์                    | เวลาที่ทำงาน                                              |
| ------------------------ | ---------------------------------------------------------- |
| `command:new`            | มีการออกคำสั่ง `/new`                                      |
| `command:reset`          | มีการออกคำสั่ง `/reset`                                    |
| `command:stop`           | มีการออกคำสั่ง `/stop`                                     |
| `command`                | เหตุการณ์คำสั่งใดๆ (ตัวรับฟังทั่วไป)                       |
| `session:compact:before` | ก่อนที่ Compaction จะสรุปประวัติ                       |
| `session:compact:after`  | หลังจาก Compaction เสร็จสิ้น                                 |
| `session:patch`          | เมื่อมีการแก้ไขคุณสมบัติของเซสชัน                       |
| `agent:bootstrap`        | ก่อนแทรกไฟล์เริ่มต้นของพื้นที่ทำงาน              |
| `gateway:startup`        | หลังจากช่องทางเริ่มทำงานและโหลด Hooks แล้ว                  |
| `gateway:shutdown`       | เมื่อ Gateway เริ่มปิดการทำงาน                               |
| `gateway:pre-restart`    | ก่อนการเริ่ม Gateway ใหม่ตามที่คาดไว้                         |
| `message:received`       | ข้อความขาเข้าจากช่องทางใดๆ                           |
| `message:transcribed`    | หลังจากถอดเสียงเสร็จสมบูรณ์                        |
| `message:preprocessed`   | หลังจากประมวลผลสื่อและลิงก์ล่วงหน้าเสร็จสิ้นหรือถูกข้าม |
| `message:sent`           | มีการพยายามส่งข้อความขาออก (`context.success` เก็บผลลัพธ์) |

## การเขียน Hooks

### โครงสร้าง Hook

Hook แต่ละรายการเป็นไดเรกทอรีที่มีสองไฟล์:

```text
my-hook/
├── HOOK.md          # Metadata + documentation
└── handler.ts       # Handler implementation
```

ไฟล์ตัวจัดการสามารถเป็น `handler.ts`, `handler.js`, `index.ts` หรือ `index.js`

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

**ฟิลด์ข้อมูลเมตา** (`metadata.openclaw`):

| ฟิลด์      | คำอธิบาย                                          |
| ---------- | ---------------------------------------------------- |
| `emoji`    | อีโมจิที่แสดงใน CLI                                |
| `events`   | อาร์เรย์ของเหตุการณ์ที่จะรับฟัง                        |
| `export`   | ชื่อการส่งออกที่จะใช้ (ค่าเริ่มต้นคือ `"default"`)        |
| `os`       | แพลตฟอร์มที่จำเป็น (เช่น `["darwin", "linux"]`)     |
| `requires` | เส้นทาง `bins`, `anyBins`, `env` หรือ `config` ที่จำเป็น |
| `always`   | ข้ามการตรวจสอบคุณสมบัติที่เข้าเกณฑ์ (ค่าบูลีน)                  |
| `hookKey`  | เขียนทับคีย์การกำหนดค่า (ค่าเริ่มต้นคือชื่อ Hook)      |
| `homepage` | URL เอกสารที่แสดงโดย `openclaw hooks info`              |
| `install`  | วิธีการติดตั้ง                                 |

### การสร้างตัวจัดการ

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

แต่ละเหตุการณ์ประกอบด้วย: `type`, `action`, `sessionKey`, `timestamp`, `messages` และ `context` (ข้อมูลเฉพาะเหตุการณ์) บริบท Hook ของ Plugin แบบมีชนิดข้อมูลสำหรับ Hooks ของเอเจนต์และเครื่องมืออาจมี `trace` ด้วย ซึ่งเป็นบริบทการติดตามเพื่อการวินิจฉัยแบบอ่านอย่างเดียวที่เข้ากันได้กับ W3C และ Plugin สามารถส่งต่อไปยังล็อกแบบมีโครงสร้างเพื่อเชื่อมโยงกับ OTEL ได้

สตริงที่เพิ่มเข้าไปใน `event.messages` จะถูกส่งกลับไปยังแชตเฉพาะสำหรับ
`command:new` และ `command:reset` (กำหนดเส้นทางเป็นการตอบกลับไปยัง
บทสนทนาต้นทาง) และสำหรับ `session:compact:before` / `session:compact:after`
(ส่งเป็นการแจ้งสถานะ Compaction) เหตุการณ์อื่นทั้งหมด รวมถึง
`command:stop`, `message:*`, `agent:bootstrap`, `session:patch` และ
`gateway:*` จะไม่สนใจข้อความที่เพิ่มเข้ามา

### ข้อมูลสำคัญของบริบทเหตุการณ์

**เหตุการณ์คำสั่ง** (`command:new`, `command:reset`): `context.sessionEntry`, `context.previousSessionEntry`, `context.commandSource`, `context.senderId`, `context.workspaceDir`, `context.cfg`

**เหตุการณ์คำสั่ง** (`command:stop`): `context.sessionEntry`, `context.sessionId`, `context.commandSource`, `context.senderId`

**เหตุการณ์ข้อความ** (`message:received`): `context.from`, `context.content`, `context.channelId`, `context.metadata` (ข้อมูลเฉพาะผู้ให้บริการ รวมถึง `senderId`, `senderName`, `guildId`) `context.content` จะเลือกเนื้อหาคำสั่งที่ไม่ว่างสำหรับข้อความที่มีลักษณะเป็นคำสั่งก่อน จากนั้นจึงย้อนกลับไปใช้เนื้อหาขาเข้าดิบและเนื้อหาทั่วไป โดยจะไม่รวมข้อมูลเสริมสำหรับเอเจนต์เท่านั้น เช่น ประวัติเธรดหรือสรุปลิงก์

**เหตุการณ์ข้อความ** (`message:sent`): `context.to`, `context.content`, `context.success`, `context.channelId` รวมถึง `context.error` เมื่อส่งไม่สำเร็จ

**เหตุการณ์ข้อความ** (`message:transcribed`): `context.transcript`, `context.from`, `context.channelId`, `context.mediaPath`

**เหตุการณ์ข้อความ** (`message:preprocessed`): `context.bodyForAgent` (เนื้อหาสุดท้ายที่เสริมข้อมูลแล้ว), `context.from`, `context.channelId`

**เหตุการณ์เริ่มต้นระบบ** (`agent:bootstrap`): `context.bootstrapFiles` (อาร์เรย์ที่แก้ไขได้), `context.agentId`

**เหตุการณ์แก้ไขเซสชัน** (`session:patch`): `context.sessionEntry`, `context.patch` (เฉพาะฟิลด์ที่เปลี่ยนแปลง), `context.cfg` เฉพาะไคลเอนต์ที่มีสิทธิ์ระดับสูงเท่านั้นที่เรียกเหตุการณ์แก้ไขได้ บริบทนี้เป็นสำเนา ดังนั้นตัวจัดการจึงแก้ไขรายการเซสชันที่กำลังใช้งานอยู่ไม่ได้

**เหตุการณ์ Compaction**: `session:compact:before` มี `messageCount`, `tokenCount` ส่วน `session:compact:after` เพิ่ม `compactedCount`, `summaryLength`, `tokensBefore`, `tokensAfter`

`command:stop` ตรวจจับการที่ผู้ใช้ออกคำสั่ง `/stop` ซึ่งเป็นวงจรชีวิตของการยกเลิก/คำสั่ง
ไม่ใช่ด่านตรวจสอบการเสร็จสิ้นของเอเจนต์ Plugin ที่ต้องการตรวจสอบ
คำตอบสุดท้ายตามธรรมชาติและขอให้เอเจนต์ประมวลผลเพิ่มอีกหนึ่งรอบ ควรใช้ Hook
ของ Plugin แบบมีชนิดข้อมูล `before_agent_finalize` แทน ดู [Hooks ของ Plugin](/th/plugins/hooks)

**เหตุการณ์วงจรชีวิตของ Gateway**: `gateway:shutdown` มี `reason` และ `restartExpectedMs` และทำงานเมื่อ Gateway เริ่มปิดการทำงาน `gateway:pre-restart` มีบริบทเดียวกัน แต่จะทำงานเฉพาะเมื่อการปิดเป็นส่วนหนึ่งของการเริ่มใหม่ตามที่คาดไว้ และมีการระบุค่า `restartExpectedMs` ที่เป็นจำนวนจำกัด ระหว่างการปิดระบบ การรอ Hook ของวงจรชีวิตแต่ละรายการจะเป็นแบบพยายามเท่าที่ทำได้และมีขอบเขต เพื่อให้การปิดระบบดำเนินต่อได้หากตัวจัดการค้าง งบเวลารอเริ่มต้นคือ 5 วินาทีสำหรับ `gateway:shutdown` และ 10 วินาทีสำหรับ `gateway:pre-restart`

ใช้ `gateway:pre-restart` สำหรับการแจ้งเตือนสั้นๆ ก่อนเริ่มใหม่ ขณะที่ช่องทางยังพร้อมใช้งาน:

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

ระหว่างเหตุการณ์ `gateway:shutdown` (หรือ `gateway:pre-restart`) กับลำดับการปิดระบบส่วนที่เหลือ Gateway จะเรียก Hook ของ Plugin แบบมีชนิดข้อมูล `session_end` สำหรับทุกเซสชันที่ยังทำงานอยู่ในขณะที่โพรเซสหยุดด้วย `reason` ของเหตุการณ์จะเป็น `shutdown` สำหรับการหยุดด้วย SIGTERM/SIGINT ตามปกติ และเป็น `restart` เมื่อมีการกำหนดเวลาให้ปิดเพื่อเป็นส่วนหนึ่งของการเริ่มใหม่ตามที่คาดไว้ กระบวนการระบายงานนี้มีขอบเขตเวลา เพื่อไม่ให้ตัวจัดการ `session_end` ที่ทำงานช้าขัดขวางการออกจากโพรเซส และจะข้ามเซสชันที่เสร็จสิ้นไปแล้วผ่านการแทนที่ / รีเซ็ต / ลบ / Compaction เพื่อหลีกเลี่ยงการเรียกซ้ำ

## การค้นหา Hooks

ระบบค้นหา Hooks จากสี่แหล่ง:

1. **Hooks ที่รวมมากับระบบ**: จัดส่งพร้อม OpenClaw
2. **Hooks ของ Plugin**: รวมอยู่ภายใน plugins ที่ติดตั้ง และสามารถเขียนทับ Hooks ที่รวมมากับระบบซึ่งมีชื่อเดียวกัน
3. **Hooks ที่จัดการโดยผู้ใช้**: `~/.openclaw/hooks/` (ผู้ใช้ติดตั้งและใช้ร่วมกันระหว่างพื้นที่ทำงาน) สามารถเขียนทับ Hooks ที่รวมมากับระบบและ Hooks ของ Plugin ได้ ไดเรกทอรีเพิ่มเติมจาก `hooks.internal.load.extraDirs` ใช้ลำดับความสำคัญเดียวกัน
4. **Hooks ของพื้นที่ทำงาน**: `<workspace>/hooks/` (แยกตามเอเจนต์ และปิดใช้งานโดยค่าเริ่มต้นจนกว่าจะเปิดใช้อย่างชัดเจน)

Hooks ของพื้นที่ทำงานสามารถเพิ่มชื่อ Hook ใหม่ได้ แต่ไม่สามารถเขียนทับ Hooks ที่รวมมากับระบบ, Hooks ที่จัดการโดยผู้ใช้ หรือ Hooks จาก Plugin ที่มีชื่อเดียวกันได้

Gateway จะข้ามการค้นหา Hooks ภายในเมื่อเริ่มทำงาน จนกว่าจะมีการกำหนดค่า Hooks ภายใน เปิดใช้ Hook ที่รวมมากับระบบหรือ Hook ที่จัดการโดยผู้ใช้ด้วย `openclaw hooks enable <name>`, ติดตั้งแพ็ก Hook หรือตั้งค่า `hooks.internal.enabled=true` เพื่อเลือกเปิดใช้ เมื่อคุณเปิดใช้ Hook ที่ระบุชื่อหนึ่งรายการ Gateway จะโหลดเฉพาะตัวจัดการของ Hook นั้น ส่วน `hooks.internal.enabled=true`, ไดเรกทอรี Hook เพิ่มเติม และตัวจัดการแบบเดิม จะเลือกเปิดใช้การค้นหาแบบกว้าง

### แพ็ก Hook

แพ็ก Hook คือแพ็กเกจ npm ที่ส่งออก Hooks ผ่าน `openclaw.hooks` ใน `package.json` ติดตั้งด้วย:

```bash
openclaw plugins install <path-or-spec>
```

ข้อกำหนด Npm รองรับเฉพาะรีจิสทรีเท่านั้น (ชื่อแพ็กเกจ + เวอร์ชันแบบระบุค่าตายตัวหรือ dist-tag ซึ่งเป็นทางเลือก) ระบบจะปฏิเสธข้อกำหนด Git/URL/ไฟล์และช่วง semver คำสั่งรุ่นเก่า `openclaw hooks install` และ `openclaw hooks update` เป็นนามแฝงที่เลิกใช้แล้วของ `openclaw plugins install` / `openclaw plugins update`

## ฮุกที่รวมมาให้

| ฮุก                   | เหตุการณ์                                         | การทำงาน                                                        |
| --------------------- | ------------------------------------------------- | --------------------------------------------------------------- |
| session-memory        | `command:new`, `command:reset`                    | บันทึกบริบทเซสชันไปยัง `<workspace>/memory/`                    |
| bootstrap-extra-files | `agent:bootstrap`                                 | แทรกไฟล์บูตสแตรปเพิ่มเติมจากรูปแบบ glob                         |
| command-logger        | `command`                                         | บันทึกคำสั่งทั้งหมดไปยัง `~/.openclaw/logs/commands.log`        |
| compaction-notifier   | `session:compact:before`, `session:compact:after` | ส่งการแจ้งเตือนที่มองเห็นได้ในแชตเมื่อ Compaction เซสชันเริ่ม/จบ |
| boot-md               | `gateway:startup`                                 | เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงาน                     |

เปิดใช้งานฮุกที่รวมมาให้:

```bash
openclaw hooks enable <hook-name>
```

<a id="session-memory"></a>

### รายละเอียด session-memory

แยกข้อความล่าสุดของผู้ใช้/ผู้ช่วย (ค่าเริ่มต้น 15 ข้อความ กำหนดค่าได้ด้วย `hooks.internal.entries.session-memory.messages`) และบันทึกไปยัง `<workspace>/memory/YYYY-MM-DD-HHMM.md` โดยใช้วันที่ท้องถิ่นของโฮสต์ การบันทึกหน่วยความจำทำงานอยู่เบื้องหลัง ดังนั้นการตอบรับ `/new` และ `/reset` จะไม่ล่าช้าจากการอ่านทรานสคริปต์หรือการสร้าง slug ซึ่งเป็นทางเลือก ตั้งค่า `hooks.internal.entries.session-memory.llmSlug: true` เพื่อสร้าง slug ชื่อไฟล์ที่สื่อความหมาย และเลือกตั้งค่า `hooks.internal.entries.session-memory.model` เป็นนามแฝงที่กำหนดค่าไว้ เช่น `sonnet`, ID โมเดลเปล่าบนผู้ให้บริการเริ่มต้นของเอเจนต์ หรือการอ้างอิง `provider/model` การสร้าง slug จะใช้โมเดลเริ่มต้นของเอเจนต์เมื่อละ `model` ไว้ และจะใช้ slug จากการประทับเวลาแทนเมื่อโมเดลไม่พร้อมใช้งาน ต้องกำหนดค่า `workspace.dir`

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

ยอมรับ `patterns` และ `files` เป็นนามแฝงของ `paths` พาธจะถูกแก้ไขโดยอ้างอิงจากเวิร์กสเปซและต้องอยู่ภายในเวิร์กสเปซ ระบบจะโหลดเฉพาะชื่อฐานของไฟล์บูตสแตรปที่รู้จัก (`AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md`, `MEMORY.md`)

<a id="command-logger"></a>

### รายละเอียด command-logger

บันทึกทุกคำสั่งแบบเครื่องหมายทับเป็นหนึ่งบรรทัด JSON (การประทับเวลา การดำเนินการ คีย์เซสชัน ID ผู้ส่ง แหล่งที่มา) ไปยัง `~/.openclaw/logs/commands.log`

<a id="compaction-notifier"></a>

### รายละเอียด compaction-notifier

ส่งข้อความสถานะสั้น ๆ ไปยังบทสนทนาปัจจุบันเมื่อ OpenClaw เริ่มและเสร็จสิ้นการทำ Compaction ทรานสคริปต์ของเซสชัน ซึ่งช่วยให้เทิร์นที่ยาวสร้างความสับสนน้อยลงบนพื้นผิวแชต เพราะผู้ใช้จะเห็นว่าผู้ช่วยกำลังสรุปบริบทและจะดำเนินการต่อหลังจาก Compaction

<a id="boot-md"></a>

### รายละเอียด boot-md

เรียกใช้ `BOOT.md` เมื่อ Gateway เริ่มทำงานสำหรับขอบเขตเอเจนต์แต่ละรายการที่กำหนดค่าไว้ หากไฟล์นั้นมีอยู่ในเวิร์กสเปซที่แก้ไขพาธแล้วของเอเจนต์นั้น

## ฮุกของ Plugin

Plugin สามารถลงทะเบียนฮุกที่มีชนิดข้อมูลผ่าน Plugin SDK เพื่อการผสานรวมที่ลึกยิ่งขึ้น:
การสกัดกั้นการเรียกใช้เครื่องมือ การแก้ไขพรอมต์ การควบคุมลำดับข้อความ และอื่น ๆ
ใช้ฮุกของ Plugin เมื่อคุณต้องการ `before_tool_call`, `before_agent_reply`,
`before_install` หรือฮุกวงจรชีวิตภายในกระบวนการอื่น ๆ

ฮุกภายในที่ Plugin จัดการมีความแตกต่างกัน โดยฮุกเหล่านี้เข้าร่วมในระบบเหตุการณ์
คำสั่ง/วงจรชีวิตระดับหยาบของหน้านี้ และปรากฏใน `openclaw hooks list` เป็น
`plugin:<id>` ใช้ฮุกเหล่านี้สำหรับผลข้างเคียงและความเข้ากันได้กับชุดฮุก ไม่ใช่
สำหรับมิดเดิลแวร์ที่มีลำดับหรือด่านบังคับใช้นโยบาย

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

ค่าสภาพแวดล้อมเฉพาะแต่ละฮุกจะผ่านการตรวจสอบคุณสมบัติ `requires.env` ของฮุก (ร่วมกับสภาพแวดล้อมของกระบวนการ) และตัวจัดการสามารถอ่านค่าเหล่านี้จากรายการกำหนดค่าของฮุก:

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
รูปแบบการกำหนดค่าอาร์เรย์ `hooks.internal.handlers` แบบเดิมยังคงรองรับเพื่อความเข้ากันได้ย้อนหลัง แต่ฮุกใหม่ควรใช้ระบบที่อิงการค้นหา
</Note>

## ข้อมูลอ้างอิง CLI

```bash
# แสดงรายการฮุกทั้งหมด (เพิ่ม --eligible, --verbose หรือ --json)
openclaw hooks list

# แสดงข้อมูลโดยละเอียดเกี่ยวกับฮุก
openclaw hooks info <hook-name>

# แสดงสรุปคุณสมบัติการใช้งาน
openclaw hooks check

# เปิด/ปิดใช้งาน
openclaw hooks enable <hook-name>
openclaw hooks disable <hook-name>
```

## แนวทางปฏิบัติที่ดี

- **ทำให้ตัวจัดการทำงานรวดเร็ว** ฮุกทำงานระหว่างการประมวลผลคำสั่ง เรียกงานหนักแบบไม่รอผลด้วย `void processInBackground(event)`
- **จัดการข้อผิดพลาดอย่างเหมาะสม** ครอบการดำเนินการที่มีความเสี่ยงด้วย try/catch และอย่าโยนข้อผิดพลาด เพื่อให้ตัวจัดการอื่นสามารถทำงานได้
- **กรองเหตุการณ์ตั้งแต่เนิ่น ๆ** คืนค่าทันทีหากชนิด/การดำเนินการของเหตุการณ์ไม่เกี่ยวข้อง
- **ใช้คีย์เหตุการณ์ที่เฉพาะเจาะจง** เลือกใช้ `"events": ["command:new"]` แทน `"events": ["command"]` เพื่อลดภาระการประมวลผล

## การแก้ไขปัญหา

### ไม่พบฮุก

```bash
# ตรวจสอบโครงสร้างไดเรกทอรี
ls -la ~/.openclaw/hooks/my-hook/
# ควรแสดง: HOOK.md, handler.ts

# แสดงรายการฮุกทั้งหมดที่ค้นพบ
openclaw hooks list
```

### ฮุกไม่มีคุณสมบัติใช้งาน

```bash
openclaw hooks info my-hook
```

ตรวจสอบไบนารีที่ขาดหายไป (PATH) ตัวแปรสภาพแวดล้อม ค่าการกำหนดค่า หรือความเข้ากันได้ของระบบปฏิบัติการ

### ฮุกไม่ทำงาน

1. ตรวจสอบว่าฮุกเปิดใช้งานอยู่: `openclaw hooks list`
2. เริ่มกระบวนการ Gateway ใหม่เพื่อโหลดฮุกอีกครั้ง
3. ตรวจสอบบันทึกของ Gateway: `openclaw logs --follow | grep -i hook`

## เนื้อหาที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI: ฮุก](/th/cli/hooks)
- [Webhook](/th/automation/cron-jobs#webhooks)
- [ฮุกของ Plugin](/th/plugins/hooks) — ฮุกวงจรชีวิตของ Plugin ภายในกระบวนการ
- [การกำหนดค่า](/th/gateway/configuration-reference#hooks)
