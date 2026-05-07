---
read_when:
    - การสร้างหรือลงนามบิลด์ดีบักของ Mac
summary: ขั้นตอนการลงนามสำหรับบิลด์ดีบักของ macOS ที่สร้างโดยสคริปต์การจัดแพ็กเกจ
title: การลงนามสำหรับ macOS
x-i18n:
    generated_at: "2026-05-07T13:22:49Z"
    model: gpt-5.5
    provider: openai
    source_hash: 58a4edd3d0df0d06c6e60251345a8e4a658bc4a3fceb4c01a21a9e98aeabfb6f
    source_path: platforms/mac/signing.md
    workflow: 16
---

# การลงนาม mac (บิลด์ดีบัก)

โดยปกติแอปนี้จะถูกบิลด์จาก [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ซึ่งตอนนี้จะ:

- ตั้งค่าตัวระบุบันเดิลดีบักแบบคงที่: `ai.openclaw.mac.debug`
- เขียน Info.plist ด้วยรหัสบันเดิลนั้น (แทนที่ได้ผ่าน `BUNDLE_ID=...`)
- เรียก [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อลงนามไบนารีหลักและบันเดิลแอป เพื่อให้ macOS มองการบิลด์ใหม่แต่ละครั้งเป็นบันเดิลที่ลงนามชุดเดิม และคงสิทธิ์ TCC ไว้ (การแจ้งเตือน, การช่วยการเข้าถึง, การบันทึกหน้าจอ, ไมโครโฟน, คำพูด) เพื่อสิทธิ์ที่เสถียร ให้ใช้ข้อมูลประจำตัวการลงนามจริง; แบบ ad-hoc ต้องเลือกใช้เองและเปราะบาง (ดู [สิทธิ์ของ macOS](/th/platforms/mac/permissions))
- ใช้ `CODESIGN_TIMESTAMP=auto` เป็นค่าเริ่มต้น; ค่านี้เปิดใช้เวลาประทับที่เชื่อถือได้สำหรับลายเซ็น Developer ID ตั้งค่า `CODESIGN_TIMESTAMP=off` เพื่อข้ามการประทับเวลา (บิลด์ดีบักแบบออฟไลน์)
- ฉีดข้อมูลเมตาของบิลด์เข้าไปใน Info.plist: `OpenClawBuildTimestamp` (UTC) และ `OpenClawGitCommit` (แฮชสั้น) เพื่อให้บานหน้าต่างเกี่ยวกับแสดงบิลด์, git, และช่องทางดีบัก/รีลีสได้
- **แพ็กเกจจิงใช้ Node 24 เป็นค่าเริ่มต้น**: สคริปต์จะรันบิลด์ TS และบิลด์ UI ควบคุม Node 22 LTS ซึ่งปัจจุบันคือ `22.16+` ยังคงรองรับเพื่อความเข้ากันได้
- อ่าน `SIGN_IDENTITY` จากสภาพแวดล้อม เพิ่ม `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (หรือใบรับรอง Developer ID Application ของคุณ) ลงใน rc ของเชลล์เพื่อให้ลงนามด้วยใบรับรองของคุณเสมอ การลงนามแบบ ad-hoc ต้องเลือกใช้อย่างชัดเจนผ่าน `ALLOW_ADHOC_SIGNING=1` หรือ `SIGN_IDENTITY="-"` (ไม่แนะนำสำหรับการทดสอบสิทธิ์)
- รันการตรวจสอบ Team ID หลังการลงนาม และล้มเหลวถ้า Mach-O ใด ๆ ภายในบันเดิลแอปถูกลงนามโดย Team ID อื่น ตั้งค่า `SKIP_TEAM_ID_CHECK=1` เพื่อข้าม

## การใช้งาน

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### หมายเหตุการลงนามแบบ ad-hoc

เมื่อลงนามด้วย `SIGN_IDENTITY="-"` (ad-hoc) สคริปต์จะปิดใช้ **Hardened Runtime** (`--options runtime`) โดยอัตโนมัติ สิ่งนี้จำเป็นเพื่อป้องกันการแครชเมื่อแอปพยายามโหลดเฟรมเวิร์กที่ฝังมา (เช่น Sparkle) ซึ่งไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นแบบ ad-hoc ยังทำให้การคงสิทธิ์ TCC เสียหายด้วย; ดูขั้นตอนการกู้คืนที่ [สิทธิ์ของ macOS](/th/platforms/mac/permissions)

## ข้อมูลเมตาของบิลด์สำหรับเกี่ยวกับ

`package-mac-app.sh` ประทับบันเดิลด้วย:

- `OpenClawBuildTimestamp`: ISO8601 UTC ณ เวลาจัดแพ็กเกจ
- `OpenClawGitCommit`: แฮช git สั้น (หรือ `unknown` หากไม่พร้อมใช้งาน)

แท็บเกี่ยวกับอ่านคีย์เหล่านี้เพื่อแสดงเวอร์ชัน, วันที่บิลด์, คอมมิต git, และระบุว่าเป็นบิลด์ดีบักหรือไม่ (ผ่าน `#if DEBUG`) รันเครื่องมือจัดแพ็กเกจเพื่อรีเฟรชค่าเหล่านี้หลังจากเปลี่ยนแปลงโค้ด

## เหตุผล

สิทธิ์ TCC ผูกกับตัวระบุบันเดิล _และ_ ลายเซ็นโค้ด บิลด์ดีบักที่ไม่ได้ลงนามและมี UUID เปลี่ยนไปทำให้ macOS ลืมการอนุญาตหลังการบิลด์ใหม่แต่ละครั้ง การลงนามไบนารี (เป็นแบบ ad-hoc โดยค่าเริ่มต้น) และการคงรหัส/พาธบันเดิลให้ตายตัว (`dist/OpenClaw.app`) จะรักษาการอนุญาตระหว่างบิลด์ไว้ ซึ่งสอดคล้องกับแนวทางของ VibeTunnel

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ของ macOS](/th/platforms/mac/permissions)
