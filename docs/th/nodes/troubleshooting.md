---
read_when:
    - Node เชื่อมต่อแล้ว แต่เครื่องมือ camera/canvas/screen/exec ล้มเหลว
    - คุณต้องเข้าใจโมเดลความคิดเรื่องการจับคู่โหนดเทียบกับการอนุมัติ
summary: แก้ไขปัญหาการจับคู่ Node, ข้อกำหนดการทำงานเบื้องหน้า, สิทธิ์อนุญาต และความล้มเหลวของเครื่องมือ
title: การแก้ไขปัญหา Node
x-i18n:
    generated_at: "2026-05-10T19:44:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: d53f06367b63125f04b4b542c322e6e50e1f33153e0fbdd09e7a38772c69a438
    source_path: nodes/troubleshooting.md
    workflow: 16
    postprocess_version: locale-links-v1
---

ใช้หน้านี้เมื่อโหนดมองเห็นได้ในสถานะ แต่เครื่องมือของโหนดล้มเหลว

## ลำดับคำสั่ง

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
openclaw channels status --probe
```

จากนั้นเรียกใช้การตรวจสอบเฉพาะโหนด:

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
```

สัญญาณที่สมบูรณ์:

- โหนดเชื่อมต่อแล้วและจับคู่สำหรับบทบาท `node` แล้ว
- `nodes describe` มี capability ที่คุณกำลังเรียกใช้
- การอนุมัติ exec แสดงโหมด/allowlist ที่คาดไว้

## ข้อกำหนดการทำงานเบื้องหน้า

`canvas.*`, `camera.*` และ `screen.*` ใช้ได้เฉพาะเมื่ออยู่เบื้องหน้าบนโหนด iOS/Android

การตรวจสอบและแก้ไขอย่างรวดเร็ว:

```bash
openclaw nodes describe --node <idOrNameOrIp>
openclaw nodes canvas snapshot --node <idOrNameOrIp>
openclaw logs --follow
```

หากคุณเห็น `NODE_BACKGROUND_UNAVAILABLE` ให้นำแอปโหนดขึ้นมาอยู่เบื้องหน้าแล้วลองอีกครั้ง

## ตารางสิทธิ์

| Capability                   | iOS                                      | Android                                         | แอปโหนด macOS                     | รหัสความล้มเหลวทั่วไป          |
| ---------------------------- | ---------------------------------------- | ----------------------------------------------- | ---------------------------------- | ------------------------------- |
| `camera.snap`, `camera.clip` | กล้อง (+ ไมค์สำหรับเสียงของคลิป)        | กล้อง (+ ไมค์สำหรับเสียงของคลิป)               | กล้อง (+ ไมค์สำหรับเสียงของคลิป)  | `*_PERMISSION_REQUIRED`         |
| `screen.record`              | การบันทึกหน้าจอ (+ ไมค์เป็นตัวเลือก)    | พรอมต์จับภาพหน้าจอ (+ ไมค์เป็นตัวเลือก)        | การบันทึกหน้าจอ                   | `*_PERMISSION_REQUIRED`         |
| `location.get`               | ขณะใช้งานหรือเสมอ (ขึ้นอยู่กับโหมด)     | ตำแหน่งเบื้องหน้า/เบื้องหลังตามโหมด            | สิทธิ์ตำแหน่ง                     | `LOCATION_PERMISSION_REQUIRED`  |
| `system.run`                 | n/a (เส้นทางโฮสต์ของโหนด)               | n/a (เส้นทางโฮสต์ของโหนด)                      | ต้องมีการอนุมัติ exec             | `SYSTEM_RUN_DENIED`             |

## การจับคู่เทียบกับการอนุมัติ

สิ่งเหล่านี้เป็นประตูควบคุมที่ต่างกัน:

1. **การจับคู่อุปกรณ์**: โหนดนี้เชื่อมต่อกับ Gateway ได้หรือไม่?
2. **นโยบายคำสั่งโหนดของ Gateway**: ID คำสั่ง RPC ได้รับอนุญาตโดย `gateway.nodes.allowCommands` / `denyCommands` และค่าเริ่มต้นของแพลตฟอร์มหรือไม่?
3. **การอนุมัติ exec**: โหนดนี้เรียกใช้คำสั่งเชลล์เฉพาะในเครื่องได้หรือไม่?

การตรวจสอบอย่างรวดเร็ว:

```bash
openclaw devices list
openclaw nodes status
openclaw approvals get --node <idOrNameOrIp>
openclaw approvals allowlist add --node <idOrNameOrIp> "/usr/bin/uname"
```

หากไม่มีการจับคู่ ให้อนุมัติอุปกรณ์โหนดก่อน
หาก `nodes describe` ไม่มีคำสั่ง ให้ตรวจสอบนโยบายคำสั่งโหนดของ Gateway และดูว่าโหนดประกาศคำสั่งนั้นจริงตอนเชื่อมต่อหรือไม่
หากการจับคู่ปกติแต่ `system.run` ล้มเหลว ให้แก้การอนุมัติ exec/allowlist บนโหนดนั้น

การจับคู่โหนดเป็นประตูด้านตัวตน/ความเชื่อถือ ไม่ใช่พื้นผิวการอนุมัติรายคำสั่ง สำหรับ `system.run` นโยบายรายโหนดอยู่ในไฟล์การอนุมัติ exec ของโหนดนั้น (`openclaw approvals get --node ...`) ไม่ได้อยู่ในระเบียนการจับคู่ของ Gateway

สำหรับการเรียกใช้ `host=node` ที่อิงการอนุมัติ Gateway ยังผูกการเรียกใช้งานกับ
`systemRunPlan` แบบ canonical ที่เตรียมไว้ด้วย หากผู้เรียกในภายหลังแก้ไข command/cwd หรือ
เมตาดาตา session ก่อนส่งต่อการเรียกใช้ที่ได้รับอนุมัติ Gateway จะปฏิเสธ
การเรียกใช้นั้นว่าเป็นการอนุมัติไม่ตรงกัน แทนที่จะเชื่อถือ payload ที่ถูกแก้ไข

## รหัสข้อผิดพลาดโหนดที่พบบ่อย

- `NODE_BACKGROUND_UNAVAILABLE` → แอปอยู่เบื้องหลัง ให้นำขึ้นมาอยู่เบื้องหน้า
- `CAMERA_DISABLED` → ปิดตัวสลับกล้องในการตั้งค่าโหนด
- `*_PERMISSION_REQUIRED` → สิทธิ์ของ OS ขาดหาย/ถูกปฏิเสธ
- `LOCATION_DISABLED` → โหมดตำแหน่งปิดอยู่
- `LOCATION_PERMISSION_REQUIRED` → ยังไม่ได้ให้สิทธิ์โหมดตำแหน่งที่ขอ
- `LOCATION_BACKGROUND_UNAVAILABLE` → แอปอยู่เบื้องหลัง แต่มีเพียงสิทธิ์ขณะใช้งาน
- `SYSTEM_RUN_DENIED: approval required` → คำขอ exec ต้องมีการอนุมัติแบบชัดเจน
- `SYSTEM_RUN_DENIED: allowlist miss` → คำสั่งถูกบล็อกโดยโหมด allowlist
  บนโฮสต์โหนด Windows รูปแบบ shell-wrapper เช่น `cmd.exe /c ...` จะถูกถือว่าเป็น allowlist miss ใน
  โหมด allowlist เว้นแต่จะได้รับอนุมัติผ่าน ask flow

## วงจรกู้คืนแบบรวดเร็ว

```bash
openclaw nodes status
openclaw nodes describe --node <idOrNameOrIp>
openclaw approvals get --node <idOrNameOrIp>
openclaw logs --follow
```

หากยังติดอยู่:

- อนุมัติการจับคู่อุปกรณ์อีกครั้ง
- เปิดแอปโหนดอีกครั้ง (เบื้องหน้า)
- ให้สิทธิ์ OS อีกครั้ง
- สร้างใหม่/ปรับนโยบายการอนุมัติ exec

## ที่เกี่ยวข้อง

- [ภาพรวมโหนด](/th/nodes)
- [โหนดกล้อง](/th/nodes/camera)
- [คำสั่งตำแหน่ง](/th/nodes/location-command)
- [การอนุมัติ exec](/th/tools/exec-approvals)
- [การจับคู่ Gateway](/th/gateway/pairing)
- [การแก้ไขปัญหา Gateway](/th/gateway/troubleshooting)
- [การแก้ไขปัญหา Channel](/th/channels/troubleshooting)
