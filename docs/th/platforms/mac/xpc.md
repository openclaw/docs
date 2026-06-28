---
read_when:
    - การแก้ไขสัญญา IPC หรือ IPC ของแอปแถบเมนู
summary: สถาปัตยกรรม IPC บน macOS สำหรับแอป OpenClaw, การส่งผ่านโหนด Gateway และ PeekabooBridge
title: IPC ของ macOS
x-i18n:
    generated_at: "2026-06-28T00:13:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 436ea0a01dc544d246b4f2f506a2950fd05b36a8cf79f6f03cffe2843eef8c0d
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# สถาปัตยกรรม IPC ของ OpenClaw macOS

**โมเดลปัจจุบัน:** ซ็อกเก็ต Unix ภายในเครื่องเชื่อมต่อ **บริการโฮสต์ Node** กับ **แอป macOS** สำหรับการอนุมัติ exec + `system.run` มี CLI ดีบัก `openclaw-mac` สำหรับการตรวจสอบการค้นพบ/การเชื่อมต่อ; การกระทำของเอเจนต์ยังคงไหลผ่าน Gateway WebSocket และ `node.invoke` การทำ UI automation ใช้ PeekabooBridge

## เป้าหมาย

- อินสแตนซ์แอป GUI เดียวที่เป็นเจ้าของงานทั้งหมดที่เกี่ยวข้องกับ TCC (การแจ้งเตือน, การบันทึกหน้าจอ, ไมโครโฟน, คำพูด, AppleScript)
- พื้นผิวขนาดเล็กสำหรับ automation: Gateway + คำสั่ง Node รวมถึง PeekabooBridge สำหรับ UI automation
- สิทธิ์ที่คาดเดาได้: ใช้ signed bundle ID เดิมเสมอ เปิดโดย launchd เพื่อให้การอนุญาตของ TCC ยังคงอยู่

## วิธีการทำงาน

### Gateway + การขนส่ง Node

- แอปรัน Gateway (โหมดภายในเครื่อง) และเชื่อมต่อกับ Gateway ในฐานะ Node
- การกระทำของเอเจนต์ดำเนินการผ่าน `node.invoke` (เช่น `system.run`, `system.notify`, `canvas.*`)
- คำสั่งทั่วไปของ Mac Node ได้แก่ `canvas.*`, `camera.snap`, `camera.clip`,
  `screen.snapshot`, `screen.record`, `system.run`, และ `system.notify`
- Node รายงานแมป `permissions` เพื่อให้เอเจนต์เห็นได้ว่ามีสิทธิ์เข้าถึงหน้าจอ,
  กล้อง, ไมโครโฟน, คำพูด, automation, หรือ accessibility หรือไม่

### บริการ Node + IPC ของแอป

- บริการโฮสต์ Node แบบ headless เชื่อมต่อกับ Gateway WebSocket
- คำขอ `system.run` จะถูกส่งต่อไปยังแอป macOS ผ่านซ็อกเก็ต Unix ภายในเครื่อง
- แอปดำเนินการ exec ในบริบท UI, แสดงพรอมป์หากจำเป็น, และส่งคืนเอาต์พุต

แผนภาพ (SCI):

```
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (UI automation)

- UI automation ใช้ซ็อกเก็ต UNIX แยกต่างหากชื่อ `bridge.sock` และโปรโตคอล JSON ของ PeekabooBridge
- ลำดับความสำคัญของโฮสต์ (ฝั่งไคลเอนต์): Peekaboo.app → Claude.app → OpenClaw.app → การรันภายในเครื่อง
- ความปลอดภัย: โฮสต์ bridge ต้องใช้ TeamID ที่อนุญาต; ทางออกฉุกเฉินสำหรับ same-UID เฉพาะ DEBUG ถูกควบคุมด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (ข้อตกลงของ Peekaboo)
- ดู: [การใช้งาน PeekabooBridge](/th/platforms/mac/peekaboo) สำหรับรายละเอียด

## โฟลว์การปฏิบัติงาน

- รีสตาร์ต/สร้างใหม่: `SIGN_IDENTITY="Apple Development: <Developer Name> (<TEAMID>)" scripts/restart-mac.sh`
  - ปิดอินสแตนซ์ที่มีอยู่
  - Swift build + package
  - เขียน/บูตสแตรป/kickstart LaunchAgent
- อินสแตนซ์เดียว: แอปจะออกตั้งแต่ต้นหากมีอินสแตนซ์อื่นที่ใช้ bundle ID เดียวกันกำลังทำงานอยู่

## หมายเหตุการเสริมความแข็งแกร่ง

- ควรกำหนดให้ TeamID ตรงกันสำหรับพื้นผิวที่มีสิทธิ์พิเศษทั้งหมด
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (เฉพาะ DEBUG) อาจอนุญาตให้ผู้เรียก same-UID สำหรับการพัฒนาภายในเครื่อง
- การสื่อสารทั้งหมดยังคงเป็นแบบภายในเครื่องเท่านั้น; ไม่มีการเปิดเผยซ็อกเก็ตเครือข่าย
- พรอมป์ TCC มีต้นทางจากชุดแอป GUI เท่านั้น; รักษา signed bundle ID ให้คงที่ตลอดการสร้างใหม่
- การเสริมความแข็งแกร่ง IPC: โหมดซ็อกเก็ต `0600`, token, การตรวจสอบ peer-UID, HMAC challenge/response, TTL สั้น

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [โฟลว์ IPC ของ macOS (การอนุมัติ Exec)](/th/tools/exec-approvals-advanced#macos-ipc-flow)
