---
read_when:
    - การดีบักว่าเหตุใดเอเจนต์จึงตอบ ล้มเหลว หรือเรียกใช้เครื่องมือในลักษณะเฉพาะ
    - การส่งออกบันเดิลสนับสนุนสำหรับเซสชัน OpenClaw
    - การตรวจสอบบริบทของพรอมต์ การเรียกใช้เครื่องมือ ข้อผิดพลาดขณะทำงาน หรือเมตาดาต้าการใช้งาน
    - การปิดใช้งานหรือย้ายตำแหน่งการบันทึกเส้นทางการทำงาน
summary: ส่งออกบันเดิลเส้นทางการทำงานที่ผ่านการปกปิดข้อมูลแล้วสำหรับการดีบักเซสชันเอเจนต์ของ OpenClaw
title: ชุดรวมเส้นทางการทำงาน
x-i18n:
    generated_at: "2026-04-30T10:22:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8dad01b3662d5e75b7626eb7ed3c3ac2dce4e3a7db2ba5952d7086c721151d1f
    source_path: tools/trajectory.md
    workflow: 16
---

การจับ Trajectory คือเครื่องบันทึกการทำงานแบบรายเซสชันของ OpenClaw โดยจะบันทึกไทม์ไลน์แบบมีโครงสร้างสำหรับการรัน agent แต่ละครั้ง จากนั้น `/export-trajectory` จะจัดแพ็กเกจเซสชันปัจจุบันเป็นชุดข้อมูลสนับสนุนที่ผ่านการปกปิดข้อมูลแล้ว

ใช้เมื่อคุณต้องตอบคำถามเช่น:

- prompt, system prompt และเครื่องมือใดถูกส่งไปยังโมเดล?
- ข้อความ transcript และการเรียกใช้เครื่องมือใดนำไปสู่คำตอบนี้?
- การรันหมดเวลา ถูกยกเลิก ถูก compact หรือพบข้อผิดพลาดจากผู้ให้บริการหรือไม่?
- โมเดล, plugins, Skills และการตั้งค่า runtime ใดเปิดใช้งานอยู่?
- ผู้ให้บริการส่ง metadata ของ usage และ prompt-cache ใดกลับมา?

หากคุณกำลังยื่นรายงานสนับสนุนแบบกว้างสำหรับปัญหา Gateway แบบสด ให้เริ่มด้วย
[`/diagnostics`](/th/gateway/diagnostics#chat-command) Diagnostics จะรวบรวมชุดข้อมูล Gateway ที่ผ่านการล้างข้อมูลแล้ว และสำหรับเซสชัน OpenAI Codex harness ยังสามารถส่ง feedback ของ Codex ไปยังเซิร์ฟเวอร์ OpenAI หลังได้รับอนุมัติได้ด้วย ใช้ `/export-trajectory` เมื่อคุณต้องการไทม์ไลน์ prompt, เครื่องมือ และ transcript แบบละเอียดรายเซสชันโดยเฉพาะ

## เริ่มต้นอย่างรวดเร็ว

ส่งข้อความนี้ในเซสชันที่ใช้งานอยู่:

```text
/export-trajectory
```

นามแฝง:

```text
/trajectory
```

OpenClaw จะเขียนชุดข้อมูลไว้ใต้ workspace:

```text
.openclaw/trajectory-exports/openclaw-trajectory-<session>-<timestamp>/
```

คุณสามารถเลือกชื่อไดเรกทอรีเอาต์พุตแบบสัมพัทธ์ได้:

```text
/export-trajectory bug-1234
```

พาธกำหนดเองจะถูก resolve ภายใน `.openclaw/trajectory-exports/` ระบบจะปฏิเสธพาธแบบ absolute และพาธ `~`

ชุดข้อมูล Trajectory อาจมี prompts, ข้อความของโมเดล, schemas ของเครื่องมือ, ผลลัพธ์ของเครื่องมือ, runtime events และพาธภายในเครื่อง ดังนั้นคำสั่ง slash ในแชทจึงต้องผ่านการอนุมัติ exec ทุกครั้ง อนุมัติการ export หนึ่งครั้งเมื่อคุณตั้งใจสร้างชุดข้อมูล อย่าใช้ allow-all ในแชทกลุ่ม OpenClaw จะส่ง prompt ขออนุมัติและผลการ export ไปหาเจ้าของแบบส่วนตัวแทนที่จะโพสต์รายละเอียด trajectory กลับไปยังห้องที่แชร์อยู่

สำหรับการตรวจสอบภายในเครื่องหรือ workflow สนับสนุน คุณยังสามารถรันพาธคำสั่งที่ได้รับอนุมัติโดยตรงได้:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
```

## การเข้าถึง

การ export Trajectory เป็นคำสั่งของเจ้าของ ผู้ส่งต้องผ่านการตรวจสอบสิทธิ์คำสั่งปกติและการตรวจสอบเจ้าของสำหรับช่องทางนั้น

## สิ่งที่ถูกบันทึก

การจับ Trajectory เปิดไว้เป็นค่าเริ่มต้นสำหรับการรัน agent ของ OpenClaw

Runtime events รวมถึง:

- `session.started`
- `trace.metadata`
- `context.compiled`
- `prompt.submitted`
- `model.fallback_step` รวมถึงโมเดลต้นทาง โมเดลถัดไป เหตุผล/รายละเอียดความล้มเหลว ตำแหน่งใน chain และ fallback เดินหน้าต่อ สำเร็จ หรือใช้ chain จนหมดแล้วหรือไม่
- `model.completed`
- `trace.artifacts`
- `session.ended`

Transcript events จะถูกสร้างใหม่จาก branch เซสชันที่ใช้งานอยู่ด้วย:

- ข้อความของผู้ใช้
- ข้อความของ assistant
- การเรียกใช้เครื่องมือ
- ผลลัพธ์ของเครื่องมือ
- compactions
- การเปลี่ยนโมเดล
- labels และรายการเซสชันกำหนดเอง

Events จะถูกเขียนเป็น JSON Lines พร้อม schema marker นี้:

```json
{
  "traceSchema": "openclaw-trajectory",
  "schemaVersion": 1
}
```

## ไฟล์ในชุดข้อมูล

ชุดข้อมูลที่ export แล้วอาจมี:

| ไฟล์                  | เนื้อหา                                                                                       |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `manifest.json`       | schema ของชุดข้อมูล ไฟล์ต้นทาง จำนวน events และรายการไฟล์ที่สร้างขึ้น                             |
| `events.jsonl`        | ไทม์ไลน์ runtime และ transcript ที่เรียงลำดับไว้                                                        |
| `session-branch.json` | branch transcript ที่ใช้งานอยู่และส่วนหัวเซสชันที่ผ่านการปกปิดข้อมูลแล้ว                                           |
| `metadata.json`       | เวอร์ชัน OpenClaw, OS/runtime, โมเดล, snapshot config, plugins, Skills และ prompt metadata     |
| `artifacts.json`      | สถานะสุดท้าย ข้อผิดพลาด usage, prompt cache, จำนวน compaction, ข้อความ assistant และ metadata ของเครื่องมือ |
| `prompts.json`        | prompts ที่ส่งและรายละเอียดการสร้าง prompt ที่เลือกไว้                                         |
| `system-prompt.txt`   | system prompt ที่ compile ล่าสุด เมื่อมีการจับข้อมูลไว้                                                   |
| `tools.json`          | definitions ของเครื่องมือที่ส่งไปยังโมเดล เมื่อมีการจับข้อมูลไว้                                              |

`manifest.json` จะแสดงรายการไฟล์ที่มีอยู่ในชุดข้อมูลนั้น ไฟล์บางรายการจะถูกละไว้เมื่อเซสชันไม่ได้จับข้อมูล runtime ที่เกี่ยวข้อง

## ตำแหน่งการจับข้อมูล

โดยค่าเริ่มต้น runtime trajectory events จะถูกเขียนไว้ข้างไฟล์เซสชัน:

```text
<session>.trajectory.jsonl
```

OpenClaw ยังเขียนไฟล์ pointer แบบ best-effort ไว้ข้างเซสชันด้วย:

```text
<session>.trajectory-path.json
```

ตั้งค่า `OPENCLAW_TRAJECTORY_DIR` เพื่อเก็บ runtime trajectory sidecars ในไดเรกทอรีเฉพาะ:

```bash
export OPENCLAW_TRAJECTORY_DIR=/var/lib/openclaw/trajectories
```

เมื่อตั้งค่าตัวแปรนี้ OpenClaw จะเขียนไฟล์ JSONL หนึ่งไฟล์ต่อ session id ในไดเรกทอรีนั้น

การบำรุงรักษาเซสชันจะลบ trajectory sidecars เมื่อรายการเซสชันที่เป็นเจ้าของถูก prune, capped หรือ evicted ตามงบประมาณดิสก์ของเซสชัน ไฟล์ runtime ที่อยู่นอกไดเรกทอรีเซสชันจะถูกลบเฉพาะเมื่อเป้าหมาย pointer ยังพิสูจน์ได้ว่าเป็นของเซสชันนั้น

## ปิดใช้งานการจับข้อมูล

ตั้งค่า `OPENCLAW_TRAJECTORY=0` ก่อนเริ่ม OpenClaw:

```bash
export OPENCLAW_TRAJECTORY=0
```

การตั้งค่านี้จะปิดใช้งานการจับ runtime trajectory `/export-trajectory` ยังสามารถ export branch ของ transcript ได้ แต่ไฟล์ที่มีเฉพาะ runtime เช่น compiled context, provider artifacts และ prompt metadata อาจขาดหายไป

## ความเป็นส่วนตัวและข้อจำกัด

ชุดข้อมูล Trajectory ออกแบบมาสำหรับการสนับสนุนและการดีบัก ไม่ใช่สำหรับโพสต์สาธารณะ OpenClaw จะปกปิดค่าที่ละเอียดอ่อนก่อนเขียนไฟล์ export:

- credentials และฟิลด์ payload ที่ทราบว่าคล้าย secret
- ข้อมูลรูปภาพ
- พาธ state ภายในเครื่อง
- พาธ workspace ซึ่งถูกแทนที่ด้วย `$WORKSPACE_DIR`
- พาธไดเรกทอรี home เมื่อระบบตรวจพบ

ตัว export ยังจำกัดขนาดอินพุตด้วย:

- ไฟล์ runtime sidecar: 50 MiB
- ไฟล์เซสชัน: 50 MiB
- runtime events: 200,000
- events ที่ export ทั้งหมด: 250,000
- บรรทัด runtime event แต่ละบรรทัดจะถูกตัดเมื่อเกิน 256 KiB

ตรวจทานชุดข้อมูลก่อนแชร์ออกนอกทีมของคุณ การปกปิดข้อมูลเป็นแบบ best-effort และไม่สามารถรู้ secret เฉพาะของทุกแอปพลิเคชันได้

## การแก้ไขปัญหา

หากการ export ไม่มี runtime events:

- ยืนยันว่า OpenClaw เริ่มต้นโดยไม่มี `OPENCLAW_TRAJECTORY=0`
- ตรวจสอบว่า `OPENCLAW_TRAJECTORY_DIR` ชี้ไปยังไดเรกทอรีที่เขียนได้หรือไม่
- รันข้อความอีกหนึ่งข้อความในเซสชัน แล้ว export อีกครั้ง
- ตรวจสอบ `manifest.json` เพื่อดู `runtimeEventCount`

หากคำสั่งปฏิเสธพาธเอาต์พุต:

- ใช้ชื่อแบบสัมพัทธ์ เช่น `bug-1234`
- อย่าส่ง `/tmp/...` หรือ `~/...`
- เก็บการ export ไว้ภายใน `.openclaw/trajectory-exports/`

หากการ export ล้มเหลวด้วยข้อผิดพลาดเรื่องขนาด แปลว่าเซสชันหรือ sidecar เกินขีดจำกัดความปลอดภัยของการ export ให้เริ่มเซสชันใหม่หรือ export การจำลองปัญหาที่เล็กลง

## ที่เกี่ยวข้อง

- [ส่วนต่าง](/th/tools/diffs)
- [การจัดการเซสชัน](/th/concepts/session)
- [เครื่องมือ Exec](/th/tools/exec)
