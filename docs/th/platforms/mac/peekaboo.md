---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การผสานรวม Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/เส้นทางของ PeekabooBridge
    - การตัดสินใจเลือกระหว่าง PeekabooBridge, Codex Computer Use และ cua-driver MCP
summary: การผสานการทำงาน PeekabooBridge สำหรับการทำ UI automation บน macOS
title: บริดจ์จ๊ะเอ๋
x-i18n:
    generated_at: "2026-06-27T17:49:35Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2343f90e500664b302236a6dabadfe64a24cedd13e57b4e234e70d4fad640c21
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw สามารถโฮสต์ **PeekabooBridge** เป็นโบรกเกอร์ระบบอัตโนมัติ UI แบบภายในเครื่องและรับรู้สิทธิ์ได้
ซึ่งทำให้ `peekaboo` CLI ขับเคลื่อนระบบอัตโนมัติ UI ได้พร้อมกับใช้สิทธิ์ TCC
ของแอป macOS ซ้ำ

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ PeekabooBridge ได้
- **ไคลเอนต์**: ใช้ `peekaboo` CLI (ไม่มีพื้นผิว `openclaw ui ...` แยกต่างหาก)
- **UI**: โอเวอร์เลย์ภาพยังคงอยู่ใน Peekaboo.app; OpenClaw เป็นเพียงโฮสต์โบรกเกอร์แบบบาง

## ความสัมพันธ์กับ Computer Use

OpenClaw มีเส้นทางควบคุมเดสก์ท็อปสามแบบ และตั้งใจให้แยกจากกัน:

- **โฮสต์ PeekabooBridge**: OpenClaw.app สามารถโฮสต์ซ็อกเก็ต PeekabooBridge ภายในเครื่องได้
  `peekaboo` CLI ยังคงเป็นไคลเอนต์และใช้สิทธิ์ macOS ของ OpenClaw.app
  สำหรับพรimitives ระบบอัตโนมัติของ Peekaboo เช่น ภาพหน้าจอ การคลิก
  เมนู กล่องโต้ตอบ การดำเนินการกับ Dock และการจัดการหน้าต่าง
- **Codex Computer Use**: Plugin `codex` ที่รวมมาให้จะเตรียม Codex app-server
  ตรวจสอบว่าเซิร์ฟเวอร์ MCP `computer-use` ของ Codex พร้อมใช้งาน แล้วจึงให้
  Codex เป็นเจ้าของการเรียกเครื่องมือควบคุมเดสก์ท็อปแบบเนทีฟในระหว่างเทิร์นโหมด Codex OpenClaw
  จะไม่พร็อกซีการดำเนินการเหล่านั้นผ่าน PeekabooBridge
- **MCP `cua-driver` โดยตรง**: OpenClaw สามารถลงทะเบียนเซิร์ฟเวอร์
  `cua-driver mcp` ต้นทางของ TryCua เป็นเซิร์ฟเวอร์ MCP ปกติได้ ซึ่งให้ schemas
  ของ CUA driver เองและเวิร์กโฟลว์ pid/window/element-index แก่ agent โดยไม่ต้องกำหนดเส้นทาง
  ผ่าน marketplace ของ Codex หรือซ็อกเก็ต PeekabooBridge

ใช้ Peekaboo เมื่อคุณต้องการพื้นผิวระบบอัตโนมัติ macOS ที่กว้างและโฮสต์บริดจ์แบบรับรู้สิทธิ์ของ OpenClaw.app
ใช้ Codex Computer Use เมื่อ agent โหมด Codex
ควรพึ่งพา Plugin computer-use แบบเนทีฟของ Codex ใช้ `cua-driver mcp` โดยตรง
เมื่อคุณต้องการเปิดเผย CUA driver ให้กับ runtime ใดๆ ที่ OpenClaw จัดการในฐานะ
เซิร์ฟเวอร์ MCP ปกติ

## เปิดใช้บริดจ์

ในแอป macOS:

- Settings → **Enable Peekaboo Bridge**

เมื่อเปิดใช้งาน OpenClaw จะเริ่มเซิร์ฟเวอร์ซ็อกเก็ต UNIX ภายในเครื่อง หากปิดใช้งาน โฮสต์
จะหยุดทำงานและ `peekaboo` จะถอยกลับไปใช้โฮสต์อื่นที่พร้อมใช้งาน

## ลำดับการค้นหาไคลเอนต์

โดยทั่วไปไคลเอนต์ Peekaboo จะลองโฮสต์ตามลำดับนี้:

1. Peekaboo.app (UX เต็มรูปแบบ)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (โบรกเกอร์แบบบาง)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใดทำงานอยู่และใช้
เส้นทางซ็อกเก็ตใด คุณสามารถแทนที่ได้ด้วย:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์

- บริดจ์ตรวจสอบ **ลายเซ็นโค้ดของผู้เรียก**; มีการบังคับใช้ allowlist ของ TeamIDs
  (TeamID โฮสต์ Peekaboo + TeamID แอป OpenClaw)
- ควรใช้ตัวตนบริดจ์/แอปที่ลงนามแล้วแทน runtime `node` ทั่วไปสำหรับ
  Accessibility การให้สิทธิ์ Accessibility แก่ `node` ทำให้แพ็กเกจใดๆ ที่เปิดโดย
  ไฟล์ปฏิบัติการ Node นั้นสืบทอดสิทธิ์การเข้าถึงระบบอัตโนมัติ GUI ได้; ดู
  [สิทธิ์ macOS](/th/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)
- คำขอจะหมดเวลาหลังจากประมาณ 10 วินาที
- หากสิทธิ์ที่จำเป็นขาดหายไป บริดจ์จะส่งคืนข้อความข้อผิดพลาดที่ชัดเจน
  แทนการเปิด System Settings

## พฤติกรรมสแนปช็อต (ระบบอัตโนมัติ)

สแนปช็อตจะถูกเก็บไว้ในหน่วยความจำและหมดอายุโดยอัตโนมัติหลังจากช่วงเวลาสั้นๆ
หากคุณต้องการเก็บไว้นานขึ้น ให้จับภาพใหม่จากไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงานว่า "bridge client is not authorized" ให้ตรวจสอบว่าไคลเอนต์
  ได้รับการลงนามอย่างถูกต้อง หรือรันโฮสต์ด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1`
  ในโหมด **debug** เท่านั้น
- หากไม่พบโฮสต์ ให้เปิดหนึ่งในแอปโฮสต์ (Peekaboo.app หรือ OpenClaw.app)
  และยืนยันว่าได้ให้สิทธิ์แล้ว

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
