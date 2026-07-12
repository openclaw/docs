---
read_when:
    - การสร้างหรือการลงนามบิลด์ดีบักสำหรับ mac
summary: ขั้นตอนการลงนามสำหรับบิลด์ดีบัก macOS ที่สร้างโดยสคริปต์จัดแพ็กเกจ
title: การลงนามบน macOS
x-i18n:
    generated_at: "2026-07-12T16:21:44Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 663c08c031417d5a9f048581421e4fe9f69480917582f74746af675bcca5cf95
    source_path: platforms/mac/signing.md
    workflow: 16
---

# การลงนามบน Mac (บิลด์ดีบัก)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) สร้างและแพ็กเกจแอปไปยังพาธคงที่ (`dist/OpenClaw.app`) จากนั้นเรียกใช้ [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อลงนาม สิทธิ์ TCC ผูกกับรหัสบันเดิลและลายเซ็นโค้ด การคงทั้งสองค่าให้เสถียร (และเก็บแอปไว้ที่พาธคงที่) ระหว่างการสร้างใหม่แต่ละครั้ง จะช่วยป้องกันไม่ให้ macOS ลืมสิทธิ์ที่ TCC อนุญาตไว้ (การแจ้งเตือน การช่วยการเข้าถึง การบันทึกหน้าจอ ไมโครโฟน และเสียงพูด)

- ตัวระบุบันเดิลสำหรับดีบักมีค่าเริ่มต้นเป็น `ai.openclaw.mac.debug` (เขียนทับได้ด้วย `BUNDLE_ID=...`)
- Node: `>=22.19.0 <23` หรือ `>=23.11.0` (`engines` ใน `package.json` ของที่เก็บโค้ด) ตัวแพ็กเกจยังสร้าง UI ควบคุมด้วย (`pnpm ui:build`)
- โดยค่าเริ่มต้นต้องมีข้อมูลประจำตัวสำหรับการลงนามจริง หากไม่พบและไม่ได้ตั้งค่า `ALLOW_ADHOC_SIGNING` สคริปต์ลงนามโค้ดจะจบการทำงานพร้อมข้อผิดพลาด การลงนามเฉพาะกิจ (`SIGN_IDENTITY="-"`) ต้องเลือกใช้โดยชัดแจ้ง และจะไม่คงสิทธิ์ TCC ไว้ระหว่างการสร้างใหม่แต่ละครั้ง ดู [สิทธิ์ของ macOS](/th/platforms/mac/permissions)
- อ่านค่า `SIGN_IDENTITY` จากสภาพแวดล้อม (เช่น `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` หรือใบรับรอง Developer ID Application) หากไม่มีค่านี้ `codesign-mac-app.sh` จะเลือกข้อมูลประจำตัวโดยอัตโนมัติตามลำดับต่อไปนี้: Developer ID Application, Apple Distribution, Apple Development แล้วจึงเลือกข้อมูลประจำตัวสำหรับการลงนามโค้ดที่ถูกต้องรายการแรกที่พบ
- `CODESIGN_TIMESTAMP=auto` (ค่าเริ่มต้น) เปิดใช้การประทับเวลาที่เชื่อถือได้เฉพาะสำหรับลายเซ็น Developer ID Application ตั้งค่าเป็น `on`/`off` เพื่อบังคับให้เปิดหรือปิด
- ประทับค่า `OpenClawBuildTimestamp` (ISO8601 UTC) และ `OpenClawGitCommit` (แฮชแบบย่อ หรือ `unknown` หากไม่มีข้อมูล) ลงใน Info.plist เพื่อให้แท็บเกี่ยวกับสามารถแสดงบิลด์, git และช่องทางดีบัก/รุ่นเผยแพร่ได้
- เรียกใช้การตรวจสอบ Team ID หลังการลงนาม และจะล้มเหลวหาก Mach-O ใดภายในบันเดิลมี Team ID แตกต่างกัน ตั้งค่า `SKIP_TEAM_ID_CHECK=1` เพื่อข้ามการตรวจสอบ

## การใช้งาน

```bash
# จากรากของที่เก็บโค้ด
scripts/package-mac-app.sh                                                      # เลือกข้อมูลประจำตัวอัตโนมัติ; เกิดข้อผิดพลาดหากไม่พบ
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # ใบรับรองจริง
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # เฉพาะกิจ (สิทธิ์จะไม่คงอยู่)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # เฉพาะกิจโดยชัดแจ้ง (มีข้อควรระวังเดียวกัน)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # วิธีแก้ชั่วคราวสำหรับ Team ID ของ Sparkle ที่ไม่ตรงกัน เฉพาะการพัฒนา
```

### หมายเหตุเกี่ยวกับการลงนามเฉพาะกิจ

`SIGN_IDENTITY="-"` ปิดใช้ Hardened Runtime (`--options runtime`) เพื่อป้องกันการหยุดทำงานเมื่อแอปโหลดเฟรมเวิร์กที่ฝังอยู่ (เช่น Sparkle) ซึ่งไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นเฉพาะกิจยังทำให้ไม่สามารถคงสิทธิ์ TCC ไว้ได้ด้วย ดูขั้นตอนการกู้คืนที่ [สิทธิ์ของ macOS](/th/platforms/mac/permissions)

## ข้อมูลเมตาของบิลด์สำหรับส่วนเกี่ยวกับ

แท็บเกี่ยวกับอ่านค่า `OpenClawBuildTimestamp` และ `OpenClawGitCommit` จาก Info.plist เพื่อแสดงเวอร์ชัน วันที่สร้าง คอมมิต git และระบุว่าบิลด์เป็น DEBUG หรือไม่ (ผ่าน `#if DEBUG`) เรียกใช้ตัวแพ็กเกจอีกครั้งหลังจากเปลี่ยนแปลงโค้ดเพื่ออัปเดตค่าเหล่านี้

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ของ macOS](/th/platforms/mac/permissions)
