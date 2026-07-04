---
read_when:
    - การติดตั้งแอป macOS
    - การตัดสินใจระหว่างโหมด Gateway แบบโลคัลและแบบระยะไกลบน macOS
    - กำลังค้นหาดาวน์โหลดรีลีสแอป macOS
summary: ติดตั้งและใช้แอปแถบเมนู macOS ของ OpenClaw
title: แอป macOS
x-i18n:
    generated_at: "2026-07-04T15:39:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0b693bb8ebced46bac173f47cdd90d1b69948ccf2388fda449c77a47ae2a4fb4
    source_path: platforms/macos.md
    workflow: 16
---

แอป macOS คือ **ตัวช่วยแถบเมนู** ของ OpenClaw ใช้เมื่อคุณต้องการ
UI ถาดระบบแบบเนทีฟ, พรอมป์สิทธิ์ของ macOS, การแจ้งเตือน, WebChat, การป้อนข้อมูลด้วยเสียง,
Canvas หรือเครื่องมือ Node ที่โฮสต์บน Mac เช่น `system.run`

หากคุณต้องการเพียง CLI และ Gateway ให้เริ่มจาก [เริ่มต้นใช้งาน](/th/start/getting-started)

## ดาวน์โหลด

ดาวน์โหลดบิลด์แอป macOS ได้จาก
[รีลีส OpenClaw บน GitHub](https://github.com/openclaw/openclaw/releases)
เมื่อรีลีสมีแอสเซ็ตแอป macOS ให้มองหา:

- `OpenClaw-<version>.dmg` (แนะนำ)
- `OpenClaw-<version>.zip`

บางรีลีสมีเฉพาะ CLI, หลักฐาน หรือแอสเซ็ต Windows เท่านั้น หากรีลีสล่าสุด
ไม่มีแอสเซ็ตแอป macOS ให้ใช้รีลีสล่าสุดที่มี หรือสร้างแอปจากซอร์สด้วย
[การตั้งค่าสำหรับพัฒนา macOS](/th/platforms/mac/dev-setup)

## การรันครั้งแรก

1. ติดตั้งและเปิด **OpenClaw.app**
2. เลือก **Mac เครื่องนี้** สำหรับ Gateway ในเครื่อง หรือเชื่อมต่อกับ Gateway ระยะไกล
3. สำหรับโหมดในเครื่อง ให้รอขณะที่แอปติดตั้งรันไทม์และ Gateway ในพื้นที่ผู้ใช้
4. ตั้งค่าผู้ให้บริการให้เสร็จ และทำรายการตรวจสอบสิทธิ์ของ macOS ให้ครบ
5. ส่งข้อความทดสอบการเริ่มต้นใช้งาน

สำหรับเส้นทางการตั้งค่า CLI/Gateway ให้ใช้ [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับการกู้คืนสิทธิ์ ให้ใช้ [สิทธิ์ของ macOS](/th/platforms/mac/permissions)

## เลือกโหมด Gateway

| โหมด   | ใช้เมื่อ                                                                             | หน้ารายละเอียด                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ในเครื่อง  | Mac เครื่องนี้ควรรัน Gateway และคงการทำงานไว้ด้วย launchd                         | [Gateway บน macOS](/th/platforms/mac/bundled-gateway) |
| ระยะไกล | โฮสต์อื่นรัน Gateway และ Mac เครื่องนี้ควบคุมผ่าน SSH, LAN หรือ Tailnet | [การควบคุมระยะไกล](/th/platforms/mac/remote)            |

โหมดในเครื่องต้องมี CLI `openclaw` ที่ติดตั้งแล้ว บน Mac เครื่องใหม่ แอปจะติดตั้ง
CLI และรันไทม์ที่ตรงกันโดยอัตโนมัติก่อนเริ่มวิซาร์ด Gateway
ดู [Gateway บน macOS](/th/platforms/mac/bundled-gateway) สำหรับการกู้คืนด้วยตนเอง

## สิ่งที่แอปรับผิดชอบ

- สถานะแถบเมนู, การแจ้งเตือน, สุขภาพ และ WebChat
- พรอมป์สิทธิ์ของ macOS สำหรับหน้าจอ, ไมโครโฟน, เสียงพูด, อัตโนมัติ และการช่วยการเข้าถึง
- เครื่องมือ Node ในเครื่อง เช่น Canvas, การจับภาพกล้อง/หน้าจอ, การแจ้งเตือน และ `system.run`
- พรอมป์อนุมัติการดำเนินการสำหรับคำสั่งที่โฮสต์บน Mac
- ทันเนล SSH ในโหมดระยะไกลหรือการเชื่อมต่อ Gateway โดยตรง

แอปนี้ **ไม่** ได้แทนที่ OpenClaw Gateway หรือเอกสาร CLI ทั่วไป การกำหนดค่า
Gateway หลัก, ผู้ให้บริการ, Plugin, ช่องทาง, เครื่องมือ และความปลอดภัยอยู่ใน
เอกสารของแต่ละส่วน

## หน้ารายละเอียด macOS

| งาน                                     | อ่าน                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| ติดตั้งหรือดีบักบริการ CLI/Gateway | [Gateway บน macOS](/th/platforms/mac/bundled-gateway)                                          |
| เก็บสถานะออกจากโฟลเดอร์ที่ซิงก์กับคลาวด์   | [Gateway บน macOS](/th/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| ดีบักการค้นพบแอปและการเชื่อมต่อ     | [Gateway บน macOS](/th/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| ทำความเข้าใจพฤติกรรมของ launchd              | [วงจรชีวิต Gateway](/th/platforms/mac/child-process)                                           |
| แก้ปัญหาสิทธิ์หรือปัญหาการเซ็น/TCC    | [สิทธิ์ของ macOS](/th/platforms/mac/permissions)                                             |
| เชื่อมต่อกับ Gateway ระยะไกล              | [การควบคุมระยะไกล](/th/platforms/mac/remote)                                                     |
| อ่านสถานะแถบเมนูและการตรวจสุขภาพ   | [แถบเมนู](/th/platforms/mac/menu-bar), [การตรวจสุขภาพ](/th/platforms/mac/health)                 |
| ใช้ UI แชตแบบฝัง                 | [WebChat](/th/platforms/mac/webchat)                                                           |
| ใช้การปลุกด้วยเสียงหรือกดเพื่อพูด           | [การปลุกด้วยเสียง](/th/platforms/mac/voicewake)                                                      |
| ใช้ Canvas และดีปลิงก์ของ Canvas         | [Canvas](/th/platforms/mac/canvas)                                                             |
| โฮสต์ PeekabooBridge สำหรับระบบอัตโนมัติของ UI    | [สะพาน Peekaboo](/th/platforms/mac/peekaboo)                                                  |
| กำหนดค่าการอนุมัติคำสั่ง              | [การอนุมัติ Exec](/th/tools/exec-approvals), [รายละเอียดขั้นสูง](/th/tools/exec-approvals-advanced) |
| ตรวจสอบคำสั่ง Node ของ Mac และ IPC ของแอป    | [IPC ของ macOS](/th/platforms/mac/xpc)                                                             |
| จับบันทึก                             | [การบันทึกของ macOS](/th/platforms/mac/logging)                                                     |
| สร้างจากซอร์ส                        | [การตั้งค่าสำหรับพัฒนา macOS](/th/platforms/mac/dev-setup)                                                 |

## ที่เกี่ยวข้อง

- [แพลตฟอร์ม](/th/platforms)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [Gateway](/th/gateway)
- [การอนุมัติ Exec](/th/tools/exec-approvals)
