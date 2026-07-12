---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การผสานรวม Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/พาธของ PeekabooBridge
    - การตัดสินใจเลือกระหว่าง PeekabooBridge, Codex Computer Use และ cua-driver MCP
summary: การผสานรวม PeekabooBridge สำหรับระบบอัตโนมัติของ UI บน macOS
title: บริดจ์ Peekaboo
x-i18n:
    generated_at: "2026-07-12T16:21:35Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 030b5017f6a43df58e6843e8a4c37448bdaaa41ac7d7d7ab2a46cce05fa9f893
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw สามารถโฮสต์ **PeekabooBridge** เป็นโบรกเกอร์ระบบอัตโนมัติสำหรับ UI ภายในเครื่องที่คำนึงถึงสิทธิ์ (`PeekabooBridgeHostCoordinator` ซึ่งใช้แพ็กเกจ Swift `steipete/Peekaboo` เป็นระบบเบื้องหลัง) ซึ่งช่วยให้ CLI `peekaboo` ควบคุมระบบอัตโนมัติของ UI โดยใช้สิทธิ์ TCC ของแอป macOS ร่วมกัน

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ PeekabooBridge
- **ไคลเอนต์**: CLI `peekaboo` (ไม่มีส่วนคำสั่ง `openclaw ui ...` แยกต่างหาก)
- **UI**: โอเวอร์เลย์ภาพยังคงอยู่ใน Peekaboo.app ส่วน OpenClaw เป็นเพียงโฮสต์โบรกเกอร์แบบบาง

## ความสัมพันธ์กับช่องทางควบคุมเดสก์ท็อปอื่น

OpenClaw มีช่องทางควบคุมเดสก์ท็อปสี่แบบซึ่งจงใจแยกออกจากกัน:

- **โฮสต์ PeekabooBridge**: OpenClaw.app โฮสต์ซ็อกเก็ต PeekabooBridge ภายในเครื่อง โดย CLI `peekaboo` เป็นไคลเอนต์และใช้สิทธิ์ macOS ของ OpenClaw.app สำหรับการจับภาพหน้าจอ การคลิก เมนู กล่องโต้ตอบ การดำเนินการกับ Dock และการจัดการหน้าต่าง
- **การใช้งานคอมพิวเตอร์ที่ขับเคลื่อนโดยเอเจนต์ (`computer.act`)**: เครื่องมือ `computer` ในตัวของเอเจนต์ Gateway จะจับภาพหน้าจอผ่าน `screen.snapshot` และควบคุมตัวชี้กับแป้นพิมพ์ผ่านคำสั่ง Node `computer.act` ที่มีความเสี่ยง Node บน macOS จะดำเนินการ `computer.act` ภายในโปรเซสโดยใช้บริการระบบอัตโนมัติ Peekaboo แบบฝังตัวที่บริดจ์นี้เปิดให้ใช้ ร่วมกับพรימิทีฟ CoreGraphics ที่จำกัดขอบเขต โดยไม่ผ่านซ็อกเก็ต PeekabooBridge หรือ CLI `peekaboo` โปรดดู [การใช้งานคอมพิวเตอร์](/nodes/computer-use)
- **Codex Computer Use**: Plugin `codex` ที่ให้มาพร้อมระบบจะตรวจสอบและสามารถติดตั้ง Plugin MCP `computer-use` ของ Codex (`extensions/codex/src/app-server/computer-use.ts`) จากนั้นให้ Codex เป็นผู้ควบคุมการเรียกใช้เครื่องมือควบคุมเดสก์ท็อปแบบเนทีฟระหว่างรอบการทำงานในโหมด Codex โดย OpenClaw จะไม่พร็อกซีการดำเนินการเหล่านั้นผ่าน PeekabooBridge
- **MCP `cua-driver` โดยตรง**: OpenClaw สามารถลงทะเบียนเซิร์ฟเวอร์ `cua-driver mcp` ต้นทางของ TryCua เป็นเซิร์ฟเวอร์ MCP ปกติ เพื่อให้เอเจนต์ใช้สคีมาของไดรเวอร์ CUA และเวิร์กโฟลว์ pid/หน้าต่าง/ดัชนีองค์ประกอบได้โดยตรง โดยไม่กำหนดเส้นทางผ่านมาร์เก็ตเพลสของ Codex หรือซ็อกเก็ต PeekabooBridge

ใช้ Peekaboo สำหรับระบบอัตโนมัติบน macOS ที่ครอบคลุมผ่านโฮสต์บริดจ์ของ OpenClaw.app ซึ่งคำนึงถึงสิทธิ์ ใช้การใช้งานคอมพิวเตอร์ที่ขับเคลื่อนโดยเอเจนต์เมื่อเอเจนต์ Gateway ควรมองเห็นและควบคุมเดสก์ท็อปผ่านคำสั่ง Node `computer.act` รูปแบบเดียวกันที่โมเดลด้านการมองเห็นใด ๆ ก็สามารถควบคุมได้ ใช้ Codex Computer Use เมื่อเอเจนต์ในโหมด Codex ควรพึ่งพา Plugin แบบเนทีฟของ Codex ใช้ `cua-driver mcp` โดยตรงเพื่อเปิดให้รันไทม์ใด ๆ ที่ OpenClaw จัดการสามารถเข้าถึงไดรเวอร์ CUA ในฐานะเซิร์ฟเวอร์ MCP ปกติ

## เปิดใช้งานบริดจ์

ในแอป macOS: **การตั้งค่า -> เปิดใช้งาน Peekaboo Bridge**

เมื่อเปิดใช้งาน OpenClaw จะเริ่มเซิร์ฟเวอร์ซ็อกเก็ต UNIX ภายในเครื่องที่ `~/Library/Application Support/OpenClaw/<socket-name>` หากปิดใช้งาน โฮสต์จะหยุดทำงานและ `peekaboo` จะเปลี่ยนไปใช้โฮสต์อื่นที่พร้อมใช้งาน นอกจากนี้ ตัวประสานงานยังดูแลลิงก์สัญลักษณ์ของซ็อกเก็ตรุ่นเก่า (`clawdbot`, `clawdis`, `moltbot` ภายใต้ Application Support) ให้ชี้ไปยังซ็อกเก็ตปัจจุบันสำหรับการติดตั้ง `peekaboo` รุ่นเก่า

## ลำดับการค้นหาไคลเอนต์

โดยทั่วไป ไคลเอนต์ Peekaboo จะลองเชื่อมต่อโฮสต์ตามลำดับนี้:

1. Peekaboo.app (ประสบการณ์ผู้ใช้เต็มรูปแบบ)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (โบรกเกอร์แบบบาง)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใดทำงานอยู่และกำลังใช้พาธซ็อกเก็ตใด หากต้องการแทนที่ค่า ให้ใช้:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์

- บริดจ์จะตรวจสอบ **ลายเซ็นโค้ดของผู้เรียกใช้** และบังคับใช้รายการ TeamID ที่อนุญาต (TeamID ของโฮสต์ Peekaboo รวมถึง TeamID ของแอปที่กำลังทำงาน)
- สำหรับสิทธิ์การช่วยการเข้าถึง ควรใช้ข้อมูลประจำตัวของบริดจ์/แอปที่มีลายเซ็นแทนรันไทม์ `node` ทั่วไป การให้สิทธิ์การช่วยการเข้าถึงแก่ `node` จะทำให้แพ็กเกจใด ๆ ที่เรียกใช้โดยไฟล์ปฏิบัติการ Node นั้นได้รับสิทธิ์เข้าถึงระบบอัตโนมัติของ GUI ไปด้วย โปรดดู [สิทธิ์ macOS](/th/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)
- คำขอจะหมดเวลาหลังจาก 10 วินาที (`requestTimeoutSec: 10`)
- หากไม่มีสิทธิ์ที่จำเป็น บริดจ์จะส่งคืนข้อความแสดงข้อผิดพลาดที่ชัดเจนแทนการเปิดการตั้งค่าระบบ

## ลักษณะการทำงานของสแนปช็อต (ระบบอัตโนมัติ)

สแนปช็อตจะถูกเก็บไว้ในหน่วยความจำ โดยมีช่วงเวลาที่ใช้ได้ 10 นาทีและจำกัดสูงสุด 50 สแนปช็อต (`InMemorySnapshotManager`) อาร์ติแฟกต์จะไม่ถูกลบเมื่อทำความสะอาด หากต้องการเก็บไว้นานกว่านั้น ให้จับภาพใหม่จากไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงาน "bridge client is not authorized" ให้ตรวจสอบว่าไคลเอนต์ได้รับการลงนามอย่างถูกต้อง หรือเรียกใช้โฮสต์โดยกำหนด `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` เฉพาะในโหมด **ดีบัก** เท่านั้น
- หากไม่พบโฮสต์ ให้เปิดแอปโฮสต์แอปใดแอปหนึ่ง (Peekaboo.app หรือ OpenClaw.app) และยืนยันว่าได้ให้สิทธิ์แล้ว

## เนื้อหาที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
