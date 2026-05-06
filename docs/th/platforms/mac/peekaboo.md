---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การผสานรวม Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/เส้นทางของ PeekabooBridge
    - การตัดสินใจเลือกระหว่าง PeekabooBridge, Codex Computer Use และ cua-driver MCP
summary: การผสานการทำงาน PeekabooBridge สำหรับการทำงานอัตโนมัติของส่วนติดต่อผู้ใช้บน macOS
title: บริดจ์จ๊ะเอ๋
x-i18n:
    generated_at: "2026-05-06T09:23:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 724bc6f29b991eb824df01d2b23e87b5d5cf32eb5ebaa0cbbc321dd8fca53c9e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw สามารถโฮสต์ **PeekabooBridge** เป็นโบรกเกอร์ระบบอัตโนมัติของ UI ภายในเครื่องที่รับรู้สิทธิ์ได้ ซึ่งทำให้ CLI `peekaboo` ขับเคลื่อนระบบอัตโนมัติของ UI ได้พร้อมกับใช้สิทธิ์ TCC ของแอป macOS ซ้ำ

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ของ PeekabooBridge ได้
- **ไคลเอนต์**: ใช้ CLI `peekaboo` (ไม่มีพื้นผิว `openclaw ui ...` แยกต่างหาก)
- **UI**: โอเวอร์เลย์ภาพยังคงอยู่ใน Peekaboo.app; OpenClaw เป็นโฮสต์โบรกเกอร์แบบบาง

## ความสัมพันธ์กับ Computer Use

OpenClaw มีเส้นทางควบคุมเดสก์ท็อปสามแบบ และตั้งใจให้แยกจากกัน:

- **โฮสต์ PeekabooBridge**: OpenClaw.app สามารถโฮสต์ซ็อกเก็ต PeekabooBridge ภายในเครื่องได้ CLI `peekaboo` ยังคงเป็นไคลเอนต์และใช้สิทธิ์ macOS ของ OpenClaw.app สำหรับพื้นฐานระบบอัตโนมัติของ Peekaboo เช่น ภาพหน้าจอ การคลิก เมนู กล่องโต้ตอบ การทำงานกับ Dock และการจัดการหน้าต่าง
- **Codex Computer Use**: Plugin `codex` ที่รวมมาเตรียม Codex app-server ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` ของ Codex พร้อมใช้งาน จากนั้นให้ Codex เป็นเจ้าของการเรียกเครื่องมือควบคุมเดสก์ท็อปแบบเนทีฟระหว่างเทิร์นในโหมด Codex OpenClaw ไม่พร็อกซีการทำงานเหล่านั้นผ่าน PeekabooBridge
- **MCP `cua-driver` โดยตรง**: OpenClaw สามารถลงทะเบียนเซิร์ฟเวอร์ `cua-driver mcp` ต้นทางของ TryCua เป็นเซิร์ฟเวอร์ MCP ปกติได้ ซึ่งให้อะเจนต์ใช้สคีมาและเวิร์กโฟลว์ pid/window/element-index ของไดรเวอร์ CUA เอง โดยไม่กำหนดเส้นทางผ่านตลาด Codex หรือซ็อกเก็ต PeekabooBridge

ใช้ Peekaboo เมื่อต้องการพื้นผิวระบบอัตโนมัติของ macOS ที่กว้างและโฮสต์บริดจ์ที่รับรู้สิทธิ์ของ OpenClaw.app ใช้ Codex Computer Use เมื่ออะเจนต์ในโหมด Codex ควรพึ่งพา Plugin computer-use แบบเนทีฟของ Codex ใช้ `cua-driver mcp` โดยตรงเมื่อต้องการให้ไดรเวอร์ CUA เปิดเผยต่อรันไทม์ที่ OpenClaw จัดการในฐานะเซิร์ฟเวอร์ MCP ปกติ

## เปิดใช้บริดจ์

ในแอป macOS:

- การตั้งค่า → **เปิดใช้ Peekaboo Bridge**

เมื่อเปิดใช้ OpenClaw จะเริ่มเซิร์ฟเวอร์ซ็อกเก็ต UNIX ภายในเครื่อง หากปิดใช้ โฮสต์จะหยุดทำงานและ `peekaboo` จะย้อนกลับไปใช้โฮสต์อื่นที่มีอยู่

## ลำดับการค้นพบของไคลเอนต์

โดยทั่วไปไคลเอนต์ Peekaboo จะลองโฮสต์ตามลำดับนี้:

1. Peekaboo.app (UX เต็มรูปแบบ)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (โบรกเกอร์แบบบาง)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใดทำงานอยู่และกำลังใช้เส้นทางซ็อกเก็ตใด คุณสามารถแทนที่ได้ด้วย:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์

- บริดจ์ตรวจสอบ **ลายเซ็นโค้ดของผู้เรียก**; มีการบังคับใช้รายการอนุญาตของ TeamID (TeamID ของโฮสต์ Peekaboo + TeamID ของแอป OpenClaw)
- คำขอจะหมดเวลาหลังจากประมาณ 10 วินาที
- หากขาดสิทธิ์ที่จำเป็น บริดจ์จะส่งคืนข้อความข้อผิดพลาดที่ชัดเจนแทนการเปิดการตั้งค่าระบบ

## พฤติกรรมของสแนปชอต (ระบบอัตโนมัติ)

สแนปชอตจะถูกเก็บไว้ในหน่วยความจำและหมดอายุโดยอัตโนมัติหลังจากช่วงเวลาสั้น ๆ หากต้องการเก็บไว้นานขึ้น ให้จับภาพใหม่จากไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงานว่า "bridge client is not authorized" ให้ตรวจสอบว่าไคลเอนต์ได้รับการลงนามอย่างถูกต้อง หรือเรียกใช้โฮสต์ด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ในโหมด **ดีบัก** เท่านั้น
- หากไม่พบโฮสต์ ให้เปิดหนึ่งในแอปโฮสต์ (Peekaboo.app หรือ OpenClaw.app) และยืนยันว่าสิทธิ์ได้รับการอนุญาตแล้ว

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
