---
read_when:
    - การดีบักสาเหตุที่เอเจนต์ตอบกลับ ล้มเหลว หรือเรียกใช้เครื่องมือในลักษณะเฉพาะ
    - การส่งออกชุดข้อมูลสนับสนุนสำหรับเซสชัน OpenClaw
    - การตรวจสอบบริบทของพรอมต์ การเรียกใช้เครื่องมือ ข้อผิดพลาดขณะรันไทม์ หรือเมตาดาตาการใช้งาน
    - การปิดใช้งานหรือย้ายตำแหน่งการบันทึกเส้นทางการทำงาน
summary: ส่งออกบันเดิลเส้นทางการทำงานที่ปกปิดข้อมูลแล้วสำหรับการดีบักเซสชันเอเจนต์ OpenClaw
title: ชุดรวมทราเจกทอรี
x-i18n:
    generated_at: "2026-05-04T09:37:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: b8b1256e52d27185a48ceddaf7937b4f37ad6d57d075fea0d0b6d3abb871f1d8
    source_path: tools/trajectory.md
    workflow: 16
---

Trajectory capture คือเครื่องบันทึกการทำงานรายเซสชันของ OpenClaw โดยจะบันทึกไทม์ไลน์แบบมีโครงสร้างสำหรับการรัน agent แต่ละครั้ง จากนั้น `/export-trajectory` จะจัดแพ็กเกจเซสชันปัจจุบันเป็นชุดข้อมูลสนับสนุนที่ผ่านการปกปิดข้อมูลแล้ว

ใช้เมื่อต้องตอบคำถามเช่น:

- prompt, system prompt และ tools ใดถูกส่งไปยังโมเดล?
- ข้อความ transcript และ tool calls ใดนำไปสู่คำตอบนี้?
- การรันหมดเวลา ถูกยกเลิก ถูก compact หรือพบข้อผิดพลาดจาก provider หรือไม่?
- โมเดล, Plugin, Skills และการตั้งค่า runtime ใดที่ใช้งานอยู่?
- provider ส่งคืน usage และ prompt-cache metadata อะไรบ้าง?

หากคุณกำลังส่งรายงานสนับสนุนแบบกว้างสำหรับปัญหา Gateway แบบ live ให้เริ่มจาก
[`/diagnostics`](/th/gateway/diagnostics#chat-command) Diagnostics จะรวบรวมชุดข้อมูล Gateway
ที่ผ่านการทำให้ปลอดภัยแล้ว และสำหรับเซสชัน OpenAI Codex harness ยังสามารถส่ง
ข้อเสนอแนะของ Codex ไปยังเซิร์ฟเวอร์ OpenAI หลังได้รับการอนุมัติได้ ใช้ `/export-trajectory` เมื่อคุณต้องการไทม์ไลน์ prompt, tool และ transcript แบบละเอียดเฉพาะรายเซสชัน

## เริ่มต้นอย่างรวดเร็ว

ส่งสิ่งนี้ในเซสชันที่ใช้งานอยู่:

```text
/export-trajectory
```

นามแฝง:

```text
/trajectory
```

OpenClaw จะเขียน bundle ไว้ใต้ workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

คุณสามารถเลือกชื่อไดเรกทอรีเอาต์พุตแบบสัมพัทธ์ได้:

```text
/export-trajectory bug-1234
```

เส้นทางที่กำหนดเองจะถูก resolve ภายใน `.openclaw/trajectory-exports/` เส้นทางแบบ absolute
และเส้นทาง `~` จะถูกปฏิเสธ

Trajectory bundles อาจมี prompts, model messages, tool schemas, tool
results, runtime events และ local paths ดังนั้นคำสั่ง slash ในแชตจึงต้องผ่าน
การอนุมัติ exec ทุกครั้ง อนุมัติการ export หนึ่งครั้งเมื่อคุณตั้งใจจะสร้าง
bundle; อย่าใช้ allow-all ในแชตกลุ่ม OpenClaw จะส่ง prompt ขออนุมัติและผลลัพธ์การ export ให้เจ้าของแบบส่วนตัว แทนที่จะโพสต์รายละเอียด trajectory กลับไปยังห้องที่แชร์

สำหรับการตรวจสอบในเครื่องหรือ workflow งานสนับสนุน คุณยังสามารถรันเส้นทางคำสั่งที่ได้รับอนุมัติโดยตรงได้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## การเข้าถึง

Trajectory export เป็นคำสั่งของเจ้าของ ผู้ส่งต้องผ่านการตรวจสอบสิทธิ์คำสั่งตามปกติและการตรวจสอบเจ้าของสำหรับ channel นั้น

## สิ่งที่ถูกบันทึก

Trajectory capture เปิดใช้งานเป็นค่าเริ่มต้นสำหรับการรัน agent ของ OpenClaw

Runtime events ประกอบด้วย:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step` รวมถึงโมเดลต้นทาง โมเดลถัดไป เหตุผล/รายละเอียดความล้มเหลว ตำแหน่งใน chain และ fallback เดินหน้าต่อ สำเร็จ หรือใช้ chain จนหมดหรือไม่
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript events ยังถูกสร้างใหม่จาก branch เซสชันที่ใช้งานอยู่ด้วย:

- ข้อความผู้ใช้
- ข้อความผู้ช่วย
- tool calls
- tool results
- Compactions
- การเปลี่ยนโมเดล
- labels และรายการเซสชันที่กำหนดเอง

Events จะถูกเขียนเป็น JSON Lines พร้อม schema marker นี้:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## ไฟล์ใน Bundle

Bundle ที่ export แล้วอาจมี:

| ไฟล์                  | เนื้อหา                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | Bundle schema, source files, event counts และรายการไฟล์ที่สร้างขึ้น                             |
| `events.jsonl`        | ไทม์ไลน์ runtime และ transcript ตามลำดับ                                                        |
| `session-branch.json` | Branch transcript ที่ใช้งานอยู่และส่วนหัวเซสชันที่ผ่านการปกปิดข้อมูลแล้ว                                           |
| `metadata.json`       | เวอร์ชัน OpenClaw, OS/runtime, โมเดล, config snapshot, Plugin, Skills และ prompt metadata     |
| `artifacts.json`      | สถานะสุดท้าย, errors, usage, prompt cache, จำนวน Compaction, ข้อความ assistant และ tool metadata |
| `prompts.json`        | prompts ที่ส่งและรายละเอียดที่เลือกเกี่ยวกับการสร้าง prompt                                         |
| `system-prompt.txt`   | system prompt ที่ compile ล่าสุด เมื่อมีการบันทึกไว้                                                   |
| `tools.json`          | tool definitions ที่ส่งไปยังโมเดล เมื่อมีการบันทึกไว้                                              |

`manifest.json` จะแสดงรายการไฟล์ที่มีอยู่ใน bundle นั้น ไฟล์บางไฟล์จะถูกละไว้
เมื่อเซสชันไม่ได้บันทึก runtime data ที่เกี่ยวข้อง

## ตำแหน่งที่บันทึก

โดยค่าเริ่มต้น runtime trajectory events จะถูกเขียนไว้ข้างไฟล์เซสชัน:

```text
<session>.trajectory.jsonl
```

OpenClaw ยังเขียน pointer file แบบ best-effort ไว้ข้างเซสชันด้วย:

```text
<session>.trajectory-path.json
```

ตั้งค่า `OPENCLAW_TRAJECTORY_DIR` เพื่อเก็บ runtime trajectory sidecars ไว้ใน
ไดเรกทอรีเฉพาะ:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

เมื่อตั้งค่าตัวแปรนี้ OpenClaw จะเขียนไฟล์ JSONL หนึ่งไฟล์ต่อ session id ในไดเรกทอรีนั้น

การบำรุงรักษาเซสชันจะลบ trajectory sidecars เมื่อรายการเซสชันที่เป็นเจ้าของถูก
pruned, capped หรือ evicted โดย sessions disk budget ไฟล์ runtime ที่อยู่นอก
ไดเรกทอรี sessions จะถูกลบเฉพาะเมื่อ pointer target ยังพิสูจน์ได้ว่าเป็นของเซสชันนั้น

## ปิดการบันทึก

ตั้งค่า `OPENCLAW_TRAJECTORY=0` ก่อนเริ่ม OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

สิ่งนี้จะปิด runtime trajectory capture `/export-trajectory` ยังคง export
branch transcript ได้ แต่ไฟล์ที่มีเฉพาะ runtime เช่น compiled context,
provider artifacts และ prompt metadata อาจหายไป

## ความเป็นส่วนตัวและข้อจำกัด

Trajectory bundles ถูกออกแบบมาสำหรับงานสนับสนุนและ debugging ไม่ใช่สำหรับโพสต์สาธารณะ
OpenClaw จะปกปิดค่าที่ละเอียดอ่อนก่อนเขียนไฟล์ export:

- credentials และฟิลด์ payload ที่มีลักษณะคล้าย secret ที่รู้จัก
- ข้อมูลรูปภาพ
- local state paths
- workspace paths ซึ่งถูกแทนที่ด้วย `$WORKSPACE_DIR`
- home directory paths เมื่อถูกตรวจพบ

Exporter ยังจำกัดขนาดอินพุตด้วย:

- runtime sidecar files: live capture หยุดที่ 10 MiB และบันทึก truncation event เมื่อยังมีพื้นที่เหลือ; export ยอมรับ runtime sidecars ที่มีอยู่สูงสุด 50 MiB
- session files: 50 MiB
- runtime events: 200,000
- total exported events: 250,000
- บรรทัด runtime event แต่ละบรรทัดจะถูกตัดทอนเมื่อเกิน 256 KiB

ตรวจสอบ bundle ก่อนแชร์ออกนอกทีมของคุณ การปกปิดข้อมูลเป็นแบบ best-effort
และไม่สามารถรู้ secret เฉพาะของทุกแอปพลิเคชันได้

## การแก้ไขปัญหา

หาก export ไม่มี runtime events:

- ยืนยันว่า OpenClaw ถูกเริ่มโดยไม่มี `OPENCLAW_TRAJECTORY=0`
- ตรวจสอบว่า `OPENCLAW_TRAJECTORY_DIR` ชี้ไปยังไดเรกทอรีที่เขียนได้หรือไม่
- รันข้อความอีกหนึ่งข้อความในเซสชัน แล้ว export อีกครั้ง
- ตรวจสอบ `manifest.json` สำหรับ `runtimeEventCount`

หากคำสั่งปฏิเสธเส้นทางเอาต์พุต:

- ใช้ชื่อแบบสัมพัทธ์ เช่น `bug-1234`
- อย่าส่ง `/tmp/...` หรือ `~/...`
- เก็บ export ไว้ภายใน `.openclaw/trajectory-exports/`

หาก export ล้มเหลวด้วยข้อผิดพลาดด้านขนาด เซสชันหรือ sidecar เกิน
ขีดจำกัดความปลอดภัยของการ export ให้เริ่มเซสชันใหม่หรือ export การทำซ้ำปัญหาที่เล็กลง

## ที่เกี่ยวข้อง

- [Diffs](/th/tools/diffs)
- [การจัดการเซสชัน](/th/concepts/session)
- [Exec tool](/th/tools/exec)
