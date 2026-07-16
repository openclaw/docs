---
read_when:
    - การโฮสต์ PeekabooBridge ใน OpenClaw.app
    - การผสานรวม Peekaboo ผ่าน Swift Package Manager
    - การเปลี่ยนโปรโตคอล/พาธของ PeekabooBridge
    - การเลือกระหว่าง PeekabooBridge, Codex Computer Use และ cua-driver MCP
summary: การผสานรวม PeekabooBridge สำหรับการทำงานอัตโนมัติของ UI บน macOS
title: บริดจ์ Peekaboo
x-i18n:
    generated_at: "2026-07-16T19:25:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 24d4187b2f5c5f11f44a24e25b350adaa3b068f24dce640ec695d52eb61f8e9a
    source_path: platforms/mac/peekaboo.md
    workflow: 16
---

OpenClaw สามารถโฮสต์ **PeekabooBridge** เป็นโบรกเกอร์ระบบอัตโนมัติ UI ภายในเครื่องที่รับรู้สิทธิ์ (`PeekabooBridgeHostCoordinator` ซึ่งทำงานบนแพ็กเกจ Swift `steipete/Peekaboo`) ซึ่งช่วยให้ CLI `peekaboo` ควบคุมระบบอัตโนมัติ UI โดยใช้สิทธิ์ TCC ของแอป macOS ร่วมกัน

## สิ่งนี้คืออะไร (และไม่ใช่อะไร)

- **โฮสต์**: OpenClaw.app สามารถทำหน้าที่เป็นโฮสต์ PeekabooBridge
- **ไคลเอนต์**: CLI `peekaboo` (ไม่มีส่วนติดต่อ `openclaw ui ...` แยกต่างหาก)
- **UI**: โอเวอร์เลย์ภาพยังคงอยู่ใน Peekaboo.app ส่วน OpenClaw เป็นโฮสต์โบรกเกอร์แบบบาง

## ความสัมพันธ์กับเส้นทางควบคุมเดสก์ท็อปอื่นๆ

OpenClaw มีเส้นทางควบคุมเดสก์ท็อปสี่แบบที่ตั้งใจแยกจากกัน:

- **โฮสต์ PeekabooBridge**: OpenClaw.app โฮสต์ซ็อกเก็ต PeekabooBridge ภายในเครื่อง CLI `peekaboo` เป็นไคลเอนต์และใช้สิทธิ์ macOS ของ OpenClaw.app สำหรับการจับภาพหน้าจอ การคลิก เมนู กล่องโต้ตอบ การดำเนินการกับ Dock และการจัดการหน้าต่าง
- **การใช้คอมพิวเตอร์ที่ขับเคลื่อนโดยเอเจนต์ (`computer.act`)**: เครื่องมือ `computer` ในตัวของเอเจนต์ Gateway จับภาพหน้าจอผ่าน `screen.snapshot` และควบคุมตัวชี้กับแป้นพิมพ์ผ่านคำสั่ง Node `computer.act` ที่เป็นอันตราย Node ของ macOS ดำเนินการ `computer.act` ภายในโพรเซสโดยใช้บริการระบบอัตโนมัติ Peekaboo แบบฝังที่บริดจ์นี้เปิดให้ใช้ ร่วมกับพริมิทีฟ CoreGraphics ที่จำกัด โดยไม่ผ่านซ็อกเก็ต PeekabooBridge หรือ CLI `peekaboo` ดู [การใช้คอมพิวเตอร์](/th/nodes/computer-use)
- **Codex Computer Use**: Plugin `codex` ที่รวมมาให้จะตรวจสอบและสามารถติดตั้ง Plugin MCP `computer-use` ของ Codex (`extensions/codex/src/app-server/computer-use.ts`) จากนั้นให้ Codex เป็นผู้ควบคุมการเรียกเครื่องมือควบคุมเดสก์ท็อปแบบเนทีฟระหว่างเทิร์นในโหมด Codex โดย OpenClaw จะไม่พร็อกซีการดำเนินการเหล่านั้นผ่าน PeekabooBridge
- **MCP `cua-driver` โดยตรง**: OpenClaw สามารถลงทะเบียนเซิร์ฟเวอร์ `cua-driver mcp` ต้นทางของ TryCua เป็นเซิร์ฟเวอร์ MCP ปกติ ทำให้เอเจนต์เข้าถึงสคีมาของไดรเวอร์ CUA เองและเวิร์กโฟลว์ pid/หน้าต่าง/ดัชนีองค์ประกอบได้โดยไม่ต้องกำหนดเส้นทางผ่านมาร์เก็ตเพลส Codex หรือซ็อกเก็ต PeekabooBridge

ใช้ Peekaboo สำหรับพื้นผิวระบบอัตโนมัติ macOS ที่ครอบคลุมผ่านโฮสต์บริดจ์ที่รับรู้สิทธิ์ของ OpenClaw.app ใช้การใช้คอมพิวเตอร์ที่ขับเคลื่อนโดยเอเจนต์เมื่อเอเจนต์ Gateway ควรมองเห็นและควบคุมเดสก์ท็อปผ่านคำสั่ง Node `computer.act` แบบเดียวกันซึ่งโมเดลด้านการมองเห็นใดๆ ก็สามารถควบคุมได้ ใช้ Codex Computer Use เมื่อเอเจนต์ในโหมด Codex ควรพึ่งพา Plugin แบบเนทีฟของ Codex ใช้ `cua-driver mcp` โดยตรงเพื่อเปิดให้รันไทม์ใดๆ ที่ OpenClaw จัดการเข้าถึงไดรเวอร์ CUA ในฐานะเซิร์ฟเวอร์ MCP ปกติ

## เปิดใช้งานบริดจ์

ในแอป macOS: **Settings -> Enable Peekaboo Bridge** สวิตช์นี้กำหนดให้ต้องเปิด **Allow Computer Control** เนื่องจากทั้งสองรายการอนุญาตระบบอัตโนมัติ UI ภายในเครื่อง เมื่อปิด Computer Control สวิตช์นี้จะถูกปิดใช้งานและโฮสต์จะไม่ทำงาน หากต้องการควบคุม Peekaboo โดยไม่ใช้ Computer Control ให้เรียกใช้แอป Mac ของ Peekaboo เองเป็นโฮสต์แทน

เมื่อเปิดใช้งาน (และเปิด Computer Control อยู่) OpenClaw จะเริ่มเซิร์ฟเวอร์ซ็อกเก็ต UNIX ภายในเครื่องที่ `~/Library/Application Support/OpenClaw/<socket-name>` หากปิดใช้งาน โฮสต์จะหยุดทำงานและ `peekaboo` จะสลับไปใช้โฮสต์อื่นที่พร้อมใช้งาน ผู้ประสานงานยังดูแลลิงก์สัญลักษณ์ซ็อกเก็ตแบบเดิม (`clawdbot`, `clawdis`, `moltbot` ภายใต้ Application Support) ให้ชี้ไปยังซ็อกเก็ตปัจจุบันสำหรับการติดตั้ง `peekaboo` รุ่นเก่า

## ลำดับการค้นหาไคลเอนต์

โดยทั่วไปไคลเอนต์ Peekaboo จะลองใช้โฮสต์ตามลำดับนี้:

1. Peekaboo.app (ประสบการณ์ผู้ใช้เต็มรูปแบบ)
2. Claude.app (หากติดตั้งไว้)
3. OpenClaw.app (โบรกเกอร์แบบบาง)

ใช้ `peekaboo bridge status --verbose` เพื่อดูว่าโฮสต์ใดกำลังทำงานและใช้เส้นทางซ็อกเก็ตใดอยู่ หากต้องการแทนที่ ให้ใช้:

```bash
export PEEKABOO_BRIDGE_SOCKET=/path/to/bridge.sock
```

## ความปลอดภัยและสิทธิ์

- บริดจ์ตรวจสอบ **ลายเซ็นโค้ดของผู้เรียก** และบังคับใช้รายการ TeamID ที่อนุญาต (TeamID ของโฮสต์ Peekaboo รวมถึง TeamID ของแอปที่กำลังทำงานเอง)
- สำหรับ Accessibility ควรใช้ข้อมูลประจำตัวของบริดจ์/แอปที่ลงลายมือชื่อแล้วแทนรันไทม์ `node` ทั่วไป การให้สิทธิ์ Accessibility แก่ `node` จะทำให้แพ็กเกจใดๆ ที่เรียกใช้โดยไฟล์ปฏิบัติการ Node นั้นสืบทอดสิทธิ์เข้าถึงระบบอัตโนมัติ GUI ได้ ดู [สิทธิ์ macOS](/th/platforms/mac/permissions#accessibility-grants-for-node-and-cli-runtimes)
- คำขอจะหมดเวลาหลังจาก 10 วินาที (`requestTimeoutSec: 10`)
- หากไม่มีสิทธิ์ที่จำเป็น บริดจ์จะส่งคืนข้อความแสดงข้อผิดพลาดที่ชัดเจนแทนการเปิด System Settings

## ลักษณะการทำงานของสแนปช็อต (ระบบอัตโนมัติ)

สแนปช็อตจะจัดเก็บไว้ในหน่วยความจำโดยมีช่วงเวลาที่ใช้ได้ 10 นาทีและจำกัดไว้ที่ 50 สแนปช็อต (`InMemorySnapshotManager`) โดยอาร์ติแฟกต์จะไม่ถูกลบระหว่างการล้างข้อมูล หากต้องการเก็บไว้นานกว่านั้น ให้จับภาพใหม่จากไคลเอนต์

## การแก้ไขปัญหา

- หาก `peekaboo` รายงานว่า "ไคลเอนต์บริดจ์ไม่ได้รับอนุญาต" ให้ตรวจสอบว่าไคลเอนต์ได้รับการลงลายมือชื่ออย่างถูกต้อง หรือเรียกใช้โฮสต์ด้วย `PEEKABOO_ALLOW_UNSIGNED_SOCKET_CLIENTS=1` ในโหมด **debug** เท่านั้น
- หากไม่พบโฮสต์ ให้เปิดแอปโฮสต์แอปใดแอปหนึ่ง (Peekaboo.app หรือ OpenClaw.app) และยืนยันว่าได้ให้สิทธิ์แล้ว

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
