---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การผสานรวม Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/พาธของ PeekabooBridge
    - การตัดสินใจเลือกระหว่าง PeekabooBridge, Codex Computer Use และ cua-driver MCP
summary: การผสานรวม PeekabooBridge สำหรับการทำงานอัตโนมัติของส่วนติดต่อผู้ใช้บน macOS
title: สะพานเชื่อม Peekaboo
x-i18n:
    generated_at: "2026-04-30T10:04:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 92effdd6cfe4002fff2b8cd1092999f837e93694acf110eaebd30648b0a6946e
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw สามารถโฮสต์ **PeekabooBridge** เป็นตัวกลางการทำงานอัตโนมัติของ UI ภายในเครื่องที่คำนึงถึงสิทธิ์ได้ ซึ่งทำให้ CLI `peekaboo` ขับเคลื่อนการทำงานอัตโนมัติของ UI ได้ พร้อมกับนำสิทธิ์ TCC ของแอป macOS มาใช้ซ้ำ

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ PeekabooBridge ได้
- **ไคลเอนต์**: ใช้ CLI `peekaboo` (ไม่มีพื้นผิว `openclaw ui ...` แยกต่างหาก)
- **UI**: โอเวอร์เลย์ภาพยังคงอยู่ใน Peekaboo.app; OpenClaw เป็นเพียงโฮสต์ตัวกลางแบบบาง

## ความสัมพันธ์กับ Computer Use

OpenClaw มีเส้นทางควบคุมเดสก์ท็อปสามแบบ และตั้งใจให้แยกจากกัน:

- **โฮสต์ PeekabooBridge**: OpenClaw.app สามารถโฮสต์ซ็อกเก็ต PeekabooBridge ภายในเครื่องได้
  CLI `peekaboo` ยังคงเป็นไคลเอนต์และใช้สิทธิ์ macOS ของ OpenClaw.app
  สำหรับพื้นฐานการทำงานอัตโนมัติของ Peekaboo เช่น ภาพหน้าจอ การคลิก
  เมนู กล่องโต้ตอบ การทำงานกับ Dock และการจัดการหน้าต่าง
- **Codex Computer Use**: Plugin `codex` ที่รวมมาให้จะเตรียม Codex app-server,
  ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` ของ Codex พร้อมใช้งาน แล้วจึงให้
  Codex เป็นเจ้าของการเรียกเครื่องมือควบคุมเดสก์ท็อปแบบเนทีฟในระหว่างเทิร์นโหมด Codex OpenClaw
  ไม่ได้พร็อกซีการทำงานเหล่านั้นผ่าน PeekabooBridge
- **MCP `cua-driver` โดยตรง**: OpenClaw สามารถลงทะเบียนเซิร์ฟเวอร์
  `cua-driver mcp` ต้นทางของ TryCua เป็นเซิร์ฟเวอร์ MCP ปกติได้ ซึ่งมอบสคีมา
  และเวิร์กโฟลว์ pid/window/element-index ของ CUA driver เองให้กับเอเจนต์ โดยไม่ต้องกำหนดเส้นทาง
  ผ่านตลาด Codex หรือซ็อกเก็ต PeekabooBridge

ใช้ Peekaboo เมื่อคุณต้องการพื้นผิวการทำงานอัตโนมัติ macOS ที่กว้างและโฮสต์บริดจ์ที่คำนึงถึงสิทธิ์ของ OpenClaw.app ใช้ Codex Computer Use เมื่อเอเจนต์โหมด Codex
ควรพึ่งพา Plugin computer-use แบบเนทีฟของ Codex ใช้ `cua-driver mcp` โดยตรง
เมื่อคุณต้องการเปิดเผย CUA driver ให้กับรันไทม์ใดๆ ที่ OpenClaw จัดการในฐานะ
เซิร์ฟเวอร์ MCP ปกติ

## เปิดใช้งานบริดจ์

ในแอป macOS:

- การตั้งค่า → **Enable Peekaboo Bridge**

เมื่อเปิดใช้งาน OpenClaw จะเริ่มเซิร์ฟเวอร์ UNIX socket ภายในเครื่อง หากปิดใช้งาน โฮสต์
จะหยุดทำงานและ `peekaboo` จะย้อนกลับไปใช้โฮสต์อื่นที่พร้อมใช้งาน

## ลำดับการค้นพบของไคลเอนต์

โดยทั่วไปไคลเอนต์ Peekaboo จะลองโฮสต์ตามลำดับนี้:

1. Peekaboo.app (UX เต็มรูปแบบ)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (ตัวกลางแบบบาง)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใดทำงานอยู่และใช้
เส้นทางซ็อกเก็ตใด คุณสามารถแทนที่ได้ด้วย:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์

- บริดจ์ตรวจสอบ **ลายเซ็นโค้ดของผู้เรียก**; มีการบังคับใช้ allowlist ของ TeamID
  (TeamID ของโฮสต์ Peekaboo + TeamID ของแอป OpenClaw)
- คำขอจะหมดเวลาหลังจากประมาณ 10 วินาที
- หากไม่มีสิทธิ์ที่จำเป็น บริดจ์จะส่งคืนข้อความข้อผิดพลาดที่ชัดเจน
  แทนที่จะเปิด System Settings

## พฤติกรรมสแนปช็อต (การทำงานอัตโนมัติ)

สแนปช็อตจะถูกจัดเก็บไว้ในหน่วยความจำและหมดอายุโดยอัตโนมัติหลังจากช่วงเวลาสั้นๆ
หากคุณต้องการเก็บไว้นานขึ้น ให้จับภาพใหม่จากไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงานว่า “bridge client is not authorized” ให้ตรวจสอบว่าไคลเอนต์
  มีการเซ็นอย่างถูกต้อง หรือเรียกใช้โฮสต์ด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  เฉพาะในโหมด **debug** เท่านั้น
- หากไม่พบโฮสต์ ให้เปิดหนึ่งในแอปโฮสต์ (Peekaboo.app หรือ OpenClaw.app)
  และยืนยันว่าสิทธิ์ได้รับการอนุญาตแล้ว

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
