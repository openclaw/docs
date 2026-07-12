---
read_when:
    - การแก้ไขสัญญา IPC หรือ IPC ของแอปแถบเมนู
summary: สถาปัตยกรรม IPC บน macOS สำหรับแอป OpenClaw, การรับส่งข้อมูลของโหนด Gateway และ PeekabooBridge
title: IPC ของ macOS
x-i18n:
    generated_at: "2026-07-12T16:24:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 39e11af2bb9348d1c1f6e4fe6be95e825d23d5c1aa66e32dae713a89afb12b4f
    source_path: platforms/mac/xpc.md
    workflow: 16
---

# สถาปัตยกรรม IPC ของ OpenClaw บน macOS

ซ็อกเก็ต Unix ภายในเครื่องเชื่อมต่อบริการโฮสต์ Node กับแอป macOS สำหรับการอนุมัติการดำเนินการและ `system.run` มี CLI สำหรับดีบัก `openclaw-mac` (`apps/macos/Sources/OpenClawMacCLI`) เพื่อใช้ตรวจสอบการค้นหาและการเชื่อมต่อ ส่วนการดำเนินการของเอเจนต์ยังคงส่งผ่าน Gateway WebSocket และ `node.invoke` เส้นทาง `computer.act` ที่ทำงานผ่าน Node จะเรียกใช้ระบบอัตโนมัติ Peekaboo แบบฝังภายในโปรเซส ส่วนไคลเอ็นต์ Peekaboo แบบสแตนด์อโลนจะใช้ PeekabooBridge

## เป้าหมาย

- แอป GUI เพียงอินสแตนซ์เดียวที่รับผิดชอบงานทั้งหมดซึ่งเกี่ยวข้องกับ TCC (การแจ้งเตือน การบันทึกหน้าจอ ไมโครโฟน เสียงพูด และ AppleScript)
- พื้นผิวขนาดเล็กสำหรับระบบอัตโนมัติ: คำสั่ง Gateway + Node, `computer.act` ภายในโปรเซส และ PeekabooBridge สำหรับไคลเอ็นต์ระบบอัตโนมัติของ UI แบบสแตนด์อโลน
- สิทธิ์ที่คาดการณ์ได้: ใช้ ID ของบันเดิลที่ลงนามชุดเดิมเสมอและเปิดใช้งานโดย launchd เพื่อให้สิทธิ์ที่ TCC อนุมัติยังคงอยู่

## วิธีการทำงาน

### การรับส่งข้อมูลผ่าน Gateway + Node

- แอปเรียกใช้ Gateway (โหมดภายในเครื่อง) และเชื่อมต่อกับ Gateway ในฐานะ Node
- การดำเนินการของเอเจนต์ทำผ่าน `node.invoke` (เช่น `system.run`, `system.notify`, `canvas.*`)
- คำสั่ง Node ประกอบด้วย `canvas.*`, `camera.snap`, `camera.clip`, `screen.snapshot`, `screen.record`, `computer.act`, `system.run` และ `system.notify`
- Node รายงานแมป `permissions` เพื่อให้เอเจนต์ตรวจสอบได้ว่ามีสิทธิ์เข้าถึงหน้าจอ กล้อง ไมโครโฟน เสียงพูด ระบบอัตโนมัติ หรือการช่วยการเข้าถึงหรือไม่

### บริการ Node + IPC ของแอป

- บริการโฮสต์ Node แบบไม่มีส่วนติดต่อผู้ใช้เชื่อมต่อกับ Gateway WebSocket
- คำขอ `system.run` จะถูกส่งต่อไปยังแอป macOS ผ่านซ็อกเก็ต Unix ภายในเครื่อง (`ExecApprovalsSocket.swift`)
- แอปดำเนินการคำสั่งในบริบทของ UI แจ้งขอการยืนยันหากจำเป็น และส่งผลลัพธ์กลับ

แผนภาพ (SCI):

```text
Agent -> Gateway -> Node Service (WS)
                      |  IPC (UDS + token + HMAC + TTL)
                      v
                  Mac App (UI + TCC + system.run)
```

### PeekabooBridge (ระบบอัตโนมัติของ UI)

- เครื่องมือ `computer` ในตัวสำหรับเอเจนต์ **ไม่** ใช้ซ็อกเก็ตนี้ Node ของ macOS ที่จับคู่ไว้จะดำเนินการ `computer.act` ภายในโปรเซสของแอปโดยใช้บริการ Peekaboo แบบฝัง
- ระบบอัตโนมัติของ UI ใช้ซ็อกเก็ต UNIX แยกต่างหาก (`~/Library/Application Support/OpenClaw/<socket>`) และโปรโตคอล JSON ของ PeekabooBridge
- ลำดับความสำคัญของโฮสต์ (ฝั่งไคลเอ็นต์): Peekaboo.app -> Claude.app -> OpenClaw.app -> การดำเนินการภายในเครื่อง
- ความปลอดภัย: โฮสต์บริดจ์กำหนดให้ TeamID ต้องอยู่ในรายการที่อนุญาต (`PeekabooBridgeHostCoordinator` ที่รวมมาให้อนุญาตทีมที่กำหนดไว้ตายตัว รวมถึงทีมที่ลงนามแอปเอง) ส่วนช่องทางยกเว้นสำหรับ UID เดียวกันซึ่งใช้ได้เฉพาะ DEBUG จะถูกควบคุมด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (แนวทางของ Peekaboo)
- ดูรายละเอียดได้ที่: [การใช้งาน PeekabooBridge](/th/platforms/mac/peekaboo)

## ลำดับการดำเนินงาน

- เริ่มใหม่/สร้างใหม่: `scripts/restart-mac.sh` จะหยุดอินสแตนซ์ที่มีอยู่ สร้างใหม่ผ่าน Swift จัดแพ็กเกจใหม่ และเปิดใช้งานอีกครั้ง โดยจะตรวจหาข้อมูลประจำตัวสำหรับลงนามที่พร้อมใช้งานโดยอัตโนมัติ และเปลี่ยนไปใช้ `--no-sign` หากไม่พบ ส่ง `--sign` เพื่อบังคับให้ลงนาม (จะล้มเหลวหากไม่มีคีย์พร้อมใช้งาน) หรือ `--no-sign` เพื่อบังคับใช้เส้นทางที่ไม่ลงนาม ตัวแปร `SIGN_IDENTITY` ที่กำหนดไว้ในสภาพแวดล้อมจะถูกยกเลิกการตั้งค่าบนเส้นทางที่ลงนาม เพื่อให้การตรวจหาข้อมูลประจำตัวอัตโนมัติของ `scripts/codesign-mac-app.sh` เลือกใบรับรอง
- อินสแตนซ์เดียว: แอปตรวจสอบ `NSWorkspace.runningApplications` เพื่อค้นหา ID ของบันเดิลที่ซ้ำกัน และจะออกหากพบมากกว่าหนึ่งอินสแตนซ์ (`isDuplicateInstance()` ใน `MenuBar.swift`)

## หมายเหตุด้านการเสริมความปลอดภัย

- ควรกำหนดให้ TeamID ตรงกันสำหรับพื้นผิวที่มีสิทธิ์ระดับสูงทั้งหมด
- PeekabooBridge: `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` (เฉพาะ DEBUG) อาจอนุญาตให้ผู้เรียกที่ใช้ UID เดียวกันเข้าถึงได้เพื่อการพัฒนาภายในเครื่อง
- การสื่อสารทั้งหมดจำกัดอยู่ภายในเครื่องเท่านั้น โดยไม่มีการเปิดเผยซ็อกเก็ตเครือข่าย
- พรอมต์ TCC มาจากบันเดิลแอป GUI เท่านั้น ควรรักษา ID ของบันเดิลที่ลงนามให้คงเดิมระหว่างการสร้างใหม่
- การเสริมความปลอดภัยของซ็อกเก็ตการอนุมัติการดำเนินการ: โหมดไฟล์ `0600`, โทเค็นที่ใช้ร่วมกัน, การตรวจสอบ UID ของเพียร์ (`getpeereid`), การท้าทาย/ตอบกลับด้วย HMAC-SHA256 และ TTL ระยะสั้นสำหรับคำขอ

## เนื้อหาที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [ลำดับ IPC ของ macOS (การอนุมัติการดำเนินการ)](/th/tools/exec-approvals-advanced#macos-ipc-flow)
