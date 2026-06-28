---
read_when:
    - การติดตั้งแอป macOS
    - การตัดสินใจเลือกระหว่างโหมด Gateway แบบภายในเครื่องและแบบระยะไกลบน macOS
    - กำลังมองหาดาวน์โหลดรุ่นเผยแพร่ของแอป macOS
summary: ติดตั้งและใช้แอปแถบเมนู macOS ของ OpenClaw
title: แอป macOS
x-i18n:
    generated_at: "2026-06-28T00:13:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42cd610465f2e60736da4681e028bca3ed3ed00b424028554ea098acc8ea980c
    source_path: platforms/macos.md
    workflow: 16
---

แอป macOS คือ **ตัวช่วยในแถบเมนู** ของ OpenClaw ใช้เมื่อคุณต้องการ
UI ถาดระบบแบบเนทีฟ, พรอมต์สิทธิ์ของ macOS, การแจ้งเตือน, WebChat, การป้อนเสียง,
Canvas หรือเครื่องมือ Node ที่โฮสต์บน Mac เช่น `system.run`

หากคุณต้องการเพียง CLI และ Gateway ให้เริ่มที่ [เริ่มต้นใช้งาน](/th/start/getting-started)

## ดาวน์โหลด

ดาวน์โหลดบิลด์แอป macOS ได้จาก
[รีลีส OpenClaw บน GitHub](https://github.com/openclaw/openclaw/releases)
เมื่อรีลีสมีแอสเซ็ตแอป macOS ให้มองหา:

- `OpenClaw-<version>.dmg` (แนะนำ)
- `OpenClaw-<version>.zip`

บางรีลีสมีเฉพาะ CLI, หลักฐาน หรือแอสเซ็ต Windows เท่านั้น หากรีลีสล่าสุด
ไม่มีแอสเซ็ตแอป macOS ให้ใช้รีลีสล่าสุดที่มี หรือบิลด์แอปจากซอร์สด้วย [การตั้งค่า macOS สำหรับนักพัฒนา](/th/platforms/mac/dev-setup)

## การเรียกใช้ครั้งแรก

1. ติดตั้งและเปิด **OpenClaw.app**
2. ทำรายการตรวจสอบสิทธิ์ของ macOS ให้ครบถ้วน
3. เลือกโหมด **ในเครื่อง** หรือ **ระยะไกล**
4. ติดตั้ง CLI `openclaw` หากแอปถามหา
5. เปิด WebChat จากแถบเมนูและส่งข้อความทดสอบ

สำหรับเส้นทางการตั้งค่า CLI/Gateway ให้ใช้ [เริ่มต้นใช้งาน](/th/start/getting-started)
สำหรับการกู้คืนสิทธิ์ ให้ใช้ [สิทธิ์ macOS](/th/platforms/mac/permissions)

## เลือกโหมด Gateway

| โหมด   | ใช้เมื่อใด                                                                             | หน้ารายละเอียด                                        |
| ------ | --------------------------------------------------------------------------------------- | -------------------------------------------------- |
| ในเครื่อง  | Mac เครื่องนี้ควรรัน Gateway และทำให้ Gateway ทำงานต่อเนื่องด้วย launchd                         | [Gateway บน macOS](/th/platforms/mac/bundled-gateway) |
| ระยะไกล | โฮสต์อีกเครื่องรัน Gateway และ Mac เครื่องนี้ควรควบคุมผ่าน SSH, LAN หรือ Tailnet | [การควบคุมระยะไกล](/th/platforms/mac/remote)            |

โหมดในเครื่องต้องมี CLI `openclaw` ที่ติดตั้งแล้ว แอปสามารถติดตั้งให้ได้ หรือคุณ
สามารถทำตาม [Gateway บน macOS](/th/platforms/mac/bundled-gateway)

## สิ่งที่แอปดูแล

- สถานะแถบเมนู การแจ้งเตือน สุขภาพ และ WebChat
- พรอมต์สิทธิ์ของ macOS สำหรับหน้าจอ ไมโครโฟน เสียงพูด ระบบอัตโนมัติ และการช่วยการเข้าถึง
- เครื่องมือ Node ในเครื่อง เช่น Canvas, การจับภาพกล้อง/หน้าจอ, การแจ้งเตือน และ `system.run`
- พรอมต์อนุมัติการดำเนินการสำหรับคำสั่งที่โฮสต์บน Mac
- ทันเนล SSH ในโหมดระยะไกล หรือการเชื่อมต่อ Gateway โดยตรง

แอปนี้ **ไม่** แทนที่เอกสาร Gateway ของ OpenClaw หรือเอกสาร CLI ทั่วไป การกำหนดค่า
Gateway หลัก ผู้ให้บริการ plugins ช่องทาง เครื่องมือ และความปลอดภัยอยู่ใน
เอกสารของตนเอง

## หน้ารายละเอียด macOS

| งาน                                     | อ่าน                                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| ติดตั้งหรือดีบักบริการ CLI/Gateway | [Gateway บน macOS](/th/platforms/mac/bundled-gateway)                                          |
| เก็บสถานะออกจากโฟลเดอร์ที่ซิงก์กับคลาวด์   | [Gateway บน macOS](/th/platforms/mac/bundled-gateway#state-directory-on-macos)                 |
| ดีบักการค้นพบแอปและการเชื่อมต่อ     | [Gateway บน macOS](/th/platforms/mac/bundled-gateway#debug-app-connectivity)                   |
| ทำความเข้าใจพฤติกรรมของ launchd              | [วงจรชีวิต Gateway](/th/platforms/mac/child-process)                                           |
| แก้ไขปัญหาสิทธิ์หรือปัญหาการลงนาม/TCC    | [สิทธิ์ macOS](/th/platforms/mac/permissions)                                             |
| เชื่อมต่อกับ Gateway ระยะไกล              | [การควบคุมระยะไกล](/th/platforms/mac/remote)                                                     |
| อ่านสถานะแถบเมนูและการตรวจสุขภาพ   | [แถบเมนู](/th/platforms/mac/menu-bar), [การตรวจสุขภาพ](/th/platforms/mac/health)                 |
| ใช้ UI แชทแบบฝัง                 | [WebChat](/th/platforms/mac/webchat)                                                           |
| ใช้การปลุกด้วยเสียงหรือกดเพื่อพูด           | [การปลุกด้วยเสียง](/th/platforms/mac/voicewake)                                                      |
| ใช้ Canvas และลิงก์ลึกของ Canvas         | [Canvas](/th/platforms/mac/canvas)                                                             |
| โฮสต์ PeekabooBridge สำหรับระบบอัตโนมัติของ UI    | [บริดจ์ Peekaboo](/th/platforms/mac/peekaboo)                                                  |
| กำหนดค่าการอนุมัติคำสั่ง              | [การอนุมัติ Exec](/th/tools/exec-approvals), [รายละเอียดขั้นสูง](/th/tools/exec-approvals-advanced) |
| ตรวจสอบคำสั่ง Node บน Mac และ IPC ของแอป    | [IPC ของ macOS](/th/platforms/mac/xpc)                                                             |
| จับบันทึก                             | [การบันทึก macOS](/th/platforms/mac/logging)                                                     |
| บิลด์จากซอร์ส                        | [การตั้งค่า macOS สำหรับนักพัฒนา](/th/platforms/mac/dev-setup)                                                 |

## ที่เกี่ยวข้อง

- [แพลตฟอร์ม](/th/platforms)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [Gateway](/th/gateway)
- [การอนุมัติ Exec](/th/tools/exec-approvals)
