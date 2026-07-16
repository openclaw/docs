---
read_when:
    - การสร้างหรือการลงนามบิลด์ดีบักสำหรับ Mac
summary: ขั้นตอนการลงนามสำหรับบิลด์ดีบักของ macOS ที่สร้างโดยสคริปต์การแพ็กเกจ
title: การลงนามบน macOS
x-i18n:
    generated_at: "2026-07-16T19:18:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 406211dadc9293cf7983e75ae7dd98234f9088351234cf06c33df2f63d1b9b97
    source_path: platforms/mac/signing.md
    workflow: 16
---

# การลงนามบน Mac (บิลด์ดีบัก)

[`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) จะบิลด์และแพ็กเกจแอปไปยังพาธคงที่ (`dist/OpenClaw.app`) จากนั้นเรียก [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อลงนาม สิทธิ์ TCC ผูกกับ bundle ID และลายเซ็นโค้ด การคงทั้งสองค่าให้เสถียร (รวมถึงวางแอปไว้ที่พาธคงที่) ระหว่างการบิลด์ใหม่แต่ละครั้ง จะป้องกันไม่ให้ macOS ลืมสิทธิ์ TCC ที่อนุญาตไว้ (การแจ้งเตือน การช่วยการเข้าถึง การบันทึกหน้าจอ ไมโครโฟน และเสียงพูด)

- ตัวระบุบันเดิลสำหรับดีบักมีค่าเริ่มต้นเป็น `ai.openclaw.mac.debug` (เขียนทับได้ด้วย `BUNDLE_ID=...`)
- Node: `>=22.22.3 <23`, `>=24.15.0 <25` หรือ `>=25.9.0` (`package.json` `engines` ของรีโพ) ตัวแพ็กเกจจะบิลด์ Control UI (`pnpm ui:build`) ด้วย
- โดยค่าเริ่มต้นต้องมีข้อมูลประจำตัวสำหรับการลงนามจริง สคริปต์ codesign จะจบการทำงานพร้อมข้อผิดพลาดหากไม่พบข้อมูลดังกล่าวและไม่ได้ตั้งค่า `ALLOW_ADHOC_SIGNING` การลงนามแบบเฉพาะกิจ (`SIGN_IDENTITY="-"`) ต้องเลือกเปิดใช้อย่างชัดเจนและจะไม่คงสิทธิ์ TCC ไว้ระหว่างการบิลด์ใหม่แต่ละครั้ง ดู[สิทธิ์ของ macOS](/th/platforms/mac/permissions)
- อ่าน `SIGN_IDENTITY` จากสภาพแวดล้อม (เช่น `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` หรือใบรับรอง Developer ID Application) หากไม่มี `codesign-mac-app.sh` จะเลือกข้อมูลประจำตัวโดยอัตโนมัติตามลำดับนี้: Developer ID Application, Apple Distribution, Apple Development และข้อมูลประจำตัวสำหรับการลงนามโค้ดรายการแรกที่ใช้ได้
- `CODESIGN_TIMESTAMP=auto` (ค่าเริ่มต้น) เปิดใช้การประทับเวลาที่เชื่อถือได้เฉพาะลายเซ็น Developer ID Application เท่านั้น ตั้งค่า `on`/`off` เพื่อบังคับเปิดหรือปิด
- ประทับ Info.plist ด้วย `OpenClawBuildTimestamp` (ISO8601 UTC) และ `OpenClawGitCommit` (แฮชแบบสั้น หรือ `unknown` หากไม่มี) เพื่อให้แท็บเกี่ยวกับสามารถแสดงบิลด์ git และช่องทางดีบัก/รีลีสได้
- เรียกใช้การตรวจสอบ Team ID หลังการลงนาม และจะล้มเหลวหาก Mach-O ใดๆ ภายในบันเดิลมี Team ID แตกต่างกัน ตั้งค่า `SKIP_TEAM_ID_CHECK=1` เพื่อข้ามการตรวจสอบ

## วิธีใช้

```bash
# จากรากของรีโพ
scripts/package-mac-app.sh                                                      # เลือกข้อมูลประจำตัวอัตโนมัติ และเกิดข้อผิดพลาดหากไม่พบ
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # ใบรับรองจริง
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh                                 # เฉพาะกิจ (สิทธิ์จะไม่คงอยู่)
SIGN_IDENTITY="-" scripts/package-mac-app.sh                                     # เฉพาะกิจอย่างชัดเจน (มีข้อควรระวังเดียวกัน)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh                          # วิธีแก้ชั่วคราวสำหรับ Team ID ของ Sparkle ที่ไม่ตรงกัน เฉพาะการพัฒนา
```

### หมายเหตุเกี่ยวกับการลงนามแบบเฉพาะกิจ

`SIGN_IDENTITY="-"` จะปิดใช้ Hardened Runtime (`--options runtime`) เพื่อป้องกันการขัดข้องเมื่อแอปโหลดเฟรมเวิร์กที่ฝังอยู่ (เช่น Sparkle) ซึ่งไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นแบบเฉพาะกิจยังทำให้ไม่สามารถคงสิทธิ์ TCC ไว้ได้ด้วย โปรดดูขั้นตอนการกู้คืนใน[สิทธิ์ของ macOS](/th/platforms/mac/permissions)

## เมทาดาทาของบิลด์สำหรับแท็บเกี่ยวกับ

แท็บเกี่ยวกับจะอ่าน `OpenClawBuildTimestamp` และ `OpenClawGitCommit` จาก Info.plist เพื่อแสดงเวอร์ชัน วันที่บิลด์ คอมมิต git และระบุว่าบิลด์เป็น DEBUG หรือไม่ (ผ่าน `#if DEBUG`) เรียกใช้ตัวแพ็กเกจอีกครั้งหลังจากเปลี่ยนแปลงโค้ดเพื่อรีเฟรชค่าเหล่านี้

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ของ macOS](/th/platforms/mac/permissions)
