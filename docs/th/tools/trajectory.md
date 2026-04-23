---
read_when:
    - การดีบักเหตุผลที่ agent ตอบ ล้มเหลว หรือเรียกใช้เครื่องมือในลักษณะหนึ่ง ๆ
    - การส่งออก support bundle สำหรับเซสชัน OpenClaw
    - การตรวจสอบบริบทของ prompt, การเรียกใช้เครื่องมือ, ข้อผิดพลาดระหว่าง runtime หรือ metadata การใช้งาน
    - การปิดใช้งานหรือย้ายตำแหน่งการเก็บ trajectory
summary: ส่งออก trajectory bundles ที่ปกปิดข้อมูลแล้วเพื่อดีบักเซสชัน agent ของ OpenClaw
title: Trajectory Bundles
x-i18n:
    generated_at: "2026-04-23T10:24:44Z"
    model: gpt-5.4
    provider: openai
    source_hash: 18f18c9b0a57fcc85624ae8592778447f61ffbd2aa455f8f92893955af744b23
    source_path: tools/trajectory.md
    workflow: 15
---

# Trajectory Bundles

การเก็บ trajectory คือ flight recorder รายเซสชันของ OpenClaw โดยจะบันทึก
ไทม์ไลน์แบบมีโครงสร้างสำหรับการรัน agent แต่ละครั้ง แล้ว `/export-trajectory` จะจัดแพ็กเกจ
เซสชันปัจจุบันเป็น support bundle ที่ปกปิดข้อมูลแล้ว

ใช้เมื่อคุณต้องการตอบคำถามเช่น:

- prompt, system prompt และเครื่องมือใดถูกส่งไปให้ model?
- ข้อความ transcript และการเรียกใช้เครื่องมือใดนำไปสู่คำตอบนี้?
- การรันหมดเวลา ถูกยกเลิก ถูก compact หรือเจอข้อผิดพลาดจาก provider หรือไม่?
- model, plugins, Skills และการตั้งค่า runtime ใดที่ทำงานอยู่?
- provider ส่งกลับ usage และ metadata ของ prompt-cache อะไรบ้าง?

## เริ่มต้นอย่างรวดเร็ว

ส่งสิ่งนี้ในเซสชันที่กำลังใช้งานอยู่:

```text
/export-trajectory
```

ชื่ออื่น:

```text
/trajectory
```

OpenClaw จะเขียน bundle ไว้ภายใต้ workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

คุณสามารถเลือกชื่อไดเรกทอรีเอาต์พุตแบบอ้างอิงสัมพันธ์ได้:

```text
/export-trajectory bug-1234
```

พาธกำหนดเองนี้จะถูก resolve ภายใน `.openclaw/trajectory-exports/` โดยจะปฏิเสธ
พาธแบบสัมบูรณ์และพาธ `~`

## การเข้าถึง

การส่งออก trajectory เป็นคำสั่งสำหรับ owner ผู้ส่งต้องผ่านการตรวจสอบการอนุญาตคำสั่งตามปกติ
และการตรวจสอบ owner ของ channel

## สิ่งที่ถูกบันทึก

การเก็บ trajectory เปิดใช้งานเป็นค่าเริ่มต้นสำหรับการรัน OpenClaw agent

เหตุการณ์ runtime ประกอบด้วย:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.completed`
- `trace.artifacts`
- `session.ended`

เหตุการณ์ transcript ก็ถูกสร้างขึ้นใหม่จากสาขาเซสชันที่กำลังใช้งานอยู่ด้วย:

- ข้อความของผู้ใช้
- ข้อความของ assistant
- การเรียกใช้เครื่องมือ
- ผลลัพธ์ของเครื่องมือ
- compactions
- การเปลี่ยน model
- labels และรายการเซสชันแบบกำหนดเอง

เหตุการณ์จะถูกเขียนเป็น JSON Lines พร้อมตัวระบุ schema นี้:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## ไฟล์ใน bundle

bundle ที่ส่งออกแล้วอาจมี:

| ไฟล์                  | เนื้อหา                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | schema ของ bundle, ไฟล์ต้นทาง, จำนวนเหตุการณ์ และรายการไฟล์ที่สร้างขึ้น                      |
| `events.jsonl`        | ไทม์ไลน์ runtime และ transcript ตามลำดับ                                                     |
| `session-branch.json` | สาขา transcript ที่กำลังใช้งานและส่วนหัวของเซสชันที่ปกปิดข้อมูลแล้ว                           |
| `metadata.json`       | เวอร์ชัน OpenClaw, OS/runtime, model, snapshot ของ config, plugins, Skills และ metadata ของ prompt |
| `artifacts.json`      | สถานะสุดท้าย, ข้อผิดพลาด, usage, prompt cache, จำนวน compaction, ข้อความของ assistant และ metadata ของเครื่องมือ |
| `prompts.json`        | prompts ที่ส่งไปและรายละเอียดบางส่วนของการสร้าง prompt ที่เลือกไว้                            |
| `system-prompt.txt`   | system prompt ที่ compile ล่าสุด เมื่อมีการเก็บไว้                                             |
| `tools.json`          | คำจำกัดความของเครื่องมือที่ส่งไปให้ model เมื่อมีการเก็บไว้                                  |

`manifest.json` จะแสดงรายการไฟล์ที่มีอยู่ใน bundle นั้น บางไฟล์จะถูกละไว้
เมื่อเซสชันไม่ได้เก็บข้อมูล runtime ที่สอดคล้องกัน

## ตำแหน่งการเก็บ

โดยค่าเริ่มต้น เหตุการณ์ trajectory ของ runtime จะถูกเขียนไว้ข้างไฟล์เซสชัน:

```text
<session>.trajectory.jsonl
```

OpenClaw จะเขียนไฟล์ pointer แบบ best-effort ไว้ข้างเซสชันด้วย:

```text
<session>.trajectory-path.json
```

ตั้ง `OPENCLAW_TRAJECTORY_DIR` เพื่อเก็บ sidecars ของ trajectory runtime ไว้ใน
ไดเรกทอรีเฉพาะ:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

เมื่อตั้งค่าตัวแปรนี้ OpenClaw จะเขียนไฟล์ JSONL หนึ่งไฟล์ต่อ session id ใน
ไดเรกทอรีนั้น

## ปิดใช้งานการเก็บ

ตั้ง `OPENCLAW_TRAJECTORY=0` ก่อนเริ่ม OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

การทำเช่นนี้จะปิดการเก็บ trajectory ของ runtime `/export-trajectory` ยังคงส่งออก
สาขา transcript ได้ แต่ไฟล์ที่มีเฉพาะ runtime เช่น compiled context,
provider artifacts และ metadata ของ prompt อาจหายไป

## ความเป็นส่วนตัวและขีดจำกัด

Trajectory bundles ถูกออกแบบมาสำหรับ support และการดีบัก ไม่ใช่สำหรับโพสต์สาธารณะ
OpenClaw จะปกปิดค่าที่อ่อนไหวก่อนเขียนไฟล์ที่ส่งออก:

- credentials และฟิลด์ payload ที่มีลักษณะเหมือน secret ที่รู้จัก
- ข้อมูลภาพ
- พาธ state ในเครื่อง
- พาธ workspace ซึ่งจะถูกแทนที่ด้วย `$WORKSPACE_DIR`
- พาธไดเรกทอรี home เมื่อสามารถตรวจพบได้

ตัวส่งออกยังจำกัดขนาดอินพุตด้วย:

- ไฟล์ sidecar ของ runtime: 50 MiB
- ไฟล์เซสชัน: 50 MiB
- เหตุการณ์ runtime: 200,000
- เหตุการณ์ที่ส่งออกทั้งหมด: 250,000
- บรรทัดเหตุการณ์ runtime แต่ละบรรทัดจะถูกตัดทอนเมื่อเกิน 256 KiB

ตรวจสอบ bundles ก่อนแชร์ออกนอกทีมของคุณ การปกปิดข้อมูลเป็นแบบ best-effort
และไม่สามารถรู้ secrets ที่เฉพาะกับแอปพลิเคชันทุกชนิดได้

## การแก้ปัญหา

หากการส่งออกไม่มีเหตุการณ์ runtime:

- ยืนยันว่า OpenClaw ถูกเริ่มโดยไม่มี `OPENCLAW_TRAJECTORY=0`
- ตรวจสอบว่า `OPENCLAW_TRAJECTORY_DIR` ชี้ไปยังไดเรกทอรีที่เขียนได้หรือไม่
- ส่งข้อความอีกหนึ่งข้อความในเซสชัน แล้วส่งออกอีกครั้ง
- ตรวจสอบ `manifest.json` สำหรับ `runtimeEventCount`

หากคำสั่งปฏิเสธพาธเอาต์พุต:

- ใช้ชื่อแบบอ้างอิงสัมพันธ์ เช่น `bug-1234`
- อย่าส่ง `/tmp/...` หรือ `~/...`
- เก็บการส่งออกไว้ภายใน `.openclaw/trajectory-exports/`

หากการส่งออกล้มเหลวพร้อมข้อผิดพลาดด้านขนาด แสดงว่าเซสชันหรือ sidecar เกิน
ขีดจำกัดความปลอดภัยของการส่งออก ให้เริ่มเซสชันใหม่หรือส่งออกการทำซ้ำที่เล็กกว่า
