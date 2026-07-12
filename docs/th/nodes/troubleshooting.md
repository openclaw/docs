---
read_when:
    - Node เชื่อมต่อแล้ว แต่เครื่องมือ camera/canvas/screen/exec ทำงานล้มเหลว
    - คุณต้องเข้าใจกรอบแนวคิดเกี่ยวกับการจับคู่ Node เทียบกับการอนุมัติ
summary: แก้ไขปัญหาการจับคู่ Node ข้อกำหนดการทำงานเบื้องหน้า สิทธิ์ และความล้มเหลวของเครื่องมือ
title: การแก้ไขปัญหา Node
x-i18n:
    generated_at: "2026-07-12T16:20:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 53d082dcd2f4bb022eb683d72d193dbb6800b5a81a8f5ab9506d82feaa0dbc49
    source_path: nodes/troubleshooting.md
    workflow: 16
---

ใช้หน้านี้เมื่อ Node ปรากฏในสถานะ แต่เครื่องมือของ Node ทำงานล้มเหลว

## ลำดับคำสั่ง

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นเรียกใช้การตรวจสอบเฉพาะสำหรับ Node:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

สัญญาณที่บ่งชี้ว่าทำงานปกติ:

- Node เชื่อมต่อและจับคู่แล้วสำหรับบทบาท `node`
- `nodes describe` มีความสามารถที่คุณกำลังเรียกใช้
- การอนุมัติการเรียกใช้แสดงโหมด/รายการอนุญาตที่คาดไว้

## ข้อกำหนดสำหรับการทำงานเบื้องหน้า

`canvas.*`, `camera.*` และ `screen.*` ทำงานได้เฉพาะเบื้องหน้าบน Node iOS/Android

การตรวจสอบและแก้ไขอย่างรวดเร็ว:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

หากพบ `NODE_BACKGROUND_UNAVAILABLE` ให้นำแอป Node มาไว้เบื้องหน้าแล้วลองอีกครั้ง

## ตารางสิทธิ์

| ความสามารถ                   | iOS                                     | Android                                      | แอป Node บน macOS                   | รหัสข้อผิดพลาดที่พบบ่อย                          |
| ---------------------------- | --------------------------------------- | -------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `camera.snap`, `camera.clip` | กล้อง (+ ไมโครโฟนสำหรับเสียงในคลิป)           | กล้อง (+ ไมโครโฟนสำหรับเสียงในคลิป)                | กล้อง (+ ไมโครโฟนสำหรับเสียงในคลิป)    | `*_PERMISSION_REQUIRED`                       |
| `screen.record`              | การบันทึกหน้าจอ (+ ไมโครโฟนเป็นตัวเลือก)       | พรอมต์จับภาพหน้าจอ (+ ไมโครโฟนเป็นตัวเลือก)       | การบันทึกหน้าจอ                 | `*_PERMISSION_REQUIRED`                       |
| `computer.act`               | ไม่มี                                     | ไม่มี                                          | การช่วยการเข้าถึง + การบันทึกหน้าจอ | `COMPUTER_DISABLED`, `ACCESSIBILITY_REQUIRED` |
| `location.get`               | ขณะใช้งานหรือเสมอ (ขึ้นอยู่กับโหมด) | ตำแหน่งเบื้องหน้า/เบื้องหลังตามโหมด | สิทธิ์เข้าถึงตำแหน่ง              | `LOCATION_PERMISSION_REQUIRED`                |
| `system.run`                 | ไม่มี (เส้นทางโฮสต์ของ Node)                    | ไม่มี (เส้นทางโฮสต์ของ Node)                         | ต้องได้รับการอนุมัติการเรียกใช้          | `SYSTEM_RUN_DENIED`                           |

## การจับคู่เทียบกับการอนุมัติ

มีด่านแยกกันสามรายการที่ควบคุมว่าคำสั่งของ Node จะสำเร็จหรือไม่:

1. **การจับคู่อุปกรณ์**: Node นี้สามารถเชื่อมต่อกับ Gateway ได้หรือไม่
2. **นโยบายคำสั่ง Node ของ Gateway**: รหัสคำสั่ง RPC ได้รับอนุญาตจาก `gateway.nodes.allowCommands` / `denyCommands` และค่าเริ่มต้นของแพลตฟอร์มหรือไม่
3. **การอนุมัติการเรียกใช้**: Node นี้สามารถเรียกใช้คำสั่งเชลล์ที่ระบุภายในเครื่องได้หรือไม่

การจับคู่ Node เป็นด่านด้านข้อมูลประจำตัว/ความเชื่อถือ ไม่ใช่ส่วนสำหรับอนุมัติแต่ละคำสั่ง สำหรับ `system.run` นโยบายเฉพาะ Node อยู่ในไฟล์การอนุมัติการเรียกใช้ของ Node นั้น (`openclaw approvals get --node ...`) ไม่ได้อยู่ในระเบียนการจับคู่ของ Gateway

การตรวจสอบอย่างรวดเร็ว:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

- ไม่มีการจับคู่: อนุมัติอุปกรณ์ Node ก่อน
- `nodes describe` ไม่มีคำสั่ง: ตรวจสอบนโยบายคำสั่ง Node ของ Gateway และตรวจสอบว่า Node ได้ประกาศคำสั่งนั้นจริงเมื่อเชื่อมต่อหรือไม่
- การจับคู่ปกติ แต่ `system.run` ล้มเหลว: แก้ไขการอนุมัติการเรียกใช้/รายการอนุญาตบน Node นั้น

สำหรับการเรียกใช้ `host=node` ที่อาศัยการอนุมัติ Gateway จะผูกการเรียกใช้เข้ากับ `systemRunPlan` มาตรฐานที่เตรียมไว้ด้วย หากผู้เรียกในภายหลังแก้ไขคำสั่ง ไดเรกทอรีทำงาน หรือข้อมูลเมตาของเซสชันก่อนส่งต่อการเรียกใช้ที่ได้รับอนุมัติ Gateway จะปฏิเสธการเรียกใช้นั้นเนื่องจากการอนุมัติไม่ตรงกัน แทนที่จะเชื่อถือเพย์โหลดที่ถูกแก้ไข

## รหัสข้อผิดพลาดทั่วไปของ Node

| รหัส                                   | ความหมาย                                                                                                                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NODE_BACKGROUND_UNAVAILABLE`          | แอปทำงานอยู่เบื้องหลัง ให้นำแอปมาไว้เบื้องหน้า                                                                                                                                        |
| `CAMERA_DISABLED`                      | การสลับเปิด/ปิดกล้องถูกปิดใช้งานในการตั้งค่าของ Node                                                                                                                                                |
| `*_PERMISSION_REQUIRED`                | ไม่มีสิทธิ์ของระบบปฏิบัติการหรือถูกปฏิเสธ                                                                                                                                                           |
| `LOCATION_DISABLED`                    | โหมดตำแหน่งปิดอยู่                                                                                                                                                                   |
| `LOCATION_PERMISSION_REQUIRED`         | ไม่ได้ให้สิทธิ์สำหรับโหมดตำแหน่งที่ร้องขอ                                                                                                                                                    |
| `LOCATION_BACKGROUND_UNAVAILABLE`      | แอปทำงานอยู่เบื้องหลัง แต่มีเพียงสิทธิ์ขณะใช้งาน                                                                                                                             |
| `COMPUTER_DISABLED`                    | เปิดใช้งาน **Allow Computer Control** ในแอป macOS แล้วอนุมัติการอัปเดตการจับคู่                                                                                                    |
| `ACCESSIBILITY_REQUIRED`               | ให้สิทธิ์การช่วยการเข้าถึงแก่ชุดแอป OpenClaw ปัจจุบันในการตั้งค่าระบบของ macOS                                                                                                        |
| `SYSTEM_RUN_DENIED: approval required` | คำขอเรียกใช้ต้องได้รับการอนุมัติอย่างชัดเจน                                                                                                                                                   |
| `SYSTEM_RUN_DENIED: allowlist miss`    | คำสั่งถูกบล็อกโดยโหมดรายการอนุญาต บนโฮสต์ Node ของ Windows รูปแบบที่ครอบด้วยเชลล์ เช่น `cmd.exe /c ...` จะถือว่าไม่อยู่ในรายการอนุญาตเมื่อใช้โหมดรายการอนุญาต เว้นแต่จะได้รับอนุมัติผ่านขั้นตอนการสอบถาม |

## วงรอบการกู้คืนอย่างรวดเร็ว

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

หากยังคงติดขัด:

- อนุมัติการจับคู่อุปกรณ์อีกครั้ง
- เปิดแอป Node อีกครั้ง (เบื้องหน้า)
- ให้สิทธิ์ของระบบปฏิบัติการอีกครั้ง
- สร้างใหม่/ปรับนโยบายการอนุมัติการเรียกใช้

สำหรับการควบคุมคอมพิวเตอร์ ให้ตรวจสอบด้วยว่าเอเจนต์ที่รองรับการมองเห็นเปิดเผยเครื่องมือ `computer`, `screen.snapshot` ทำงานสำเร็จโดยมีสิทธิ์การบันทึกหน้าจอ และ `/phone status` แสดงการอนุญาต Gateway แบบชั่วคราวหรือถาวรตามที่คุณต้องการ รายการใน `gateway.nodes.denyCommands` จะมีผลเหนือกว่า `allowCommands` เสมอ

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวม Node](/th/nodes)
- [Node กล้อง](/th/nodes/camera)
- [คำสั่งตำแหน่ง](/th/nodes/location-command)
- [การใช้งานคอมพิวเตอร์](/th/nodes/computer-use)
- [การอนุมัติการเรียกใช้](/th/tools/exec-approvals)
- [การจับคู่ Gateway](/th/gateway/pairing)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [การแก้ไขปัญหาช่องทาง](/th/channels/troubleshooting)
