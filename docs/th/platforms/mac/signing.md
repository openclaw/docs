---
read_when:
    - การสร้างหรือการเซ็นชื่อบิลด์ดีบักสำหรับ Mac
summary: ขั้นตอนการลงนามสำหรับบิลด์ดีบักของ macOS ที่สร้างโดยสคริปต์การทำแพ็กเกจ
title: การเซ็นชื่อสำหรับ macOS
x-i18n:
    generated_at: "2026-05-06T09:23:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: 08a2f18f0f813c0bb7352b393531ad69d24da55de2e6ec6446febe0661eb4598
    source_path: platforms/mac/signing.md
    workflow: 16
---

# การเซ็นชื่อสำหรับ mac (บิลด์ดีบัก)

แอปนี้มักสร้างจาก [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ซึ่งตอนนี้:

- ตั้งค่าตัวระบุบันเดิลดีบักที่เสถียร: `ai.openclaw.mac.debug`
- เขียน Info.plist ด้วยรหัสบันเดิลนั้น (แทนที่ได้ผ่าน `BUNDLE_ID=...`)
- เรียก [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อลงนามไบนารีหลักและบันเดิลแอป เพื่อให้ macOS ถือว่าแต่ละการรีบิลด์เป็นบันเดิลที่ลงนามชุดเดิม และคงสิทธิ์ TCC ไว้ (การแจ้งเตือน การช่วยการเข้าถึง การบันทึกหน้าจอ ไมโครโฟน คำพูด) สำหรับสิทธิ์ที่เสถียร ให้ใช้อัตลักษณ์การลงนามจริง; แบบ ad-hoc ต้องเลือกใช้เองและเปราะบาง (ดู [สิทธิ์ macOS](/th/platforms/mac/permissions))
- ใช้ `CODESIGN_TIMESTAMP=auto` เป็นค่าเริ่มต้น; ซึ่งเปิดใช้ timestamp ที่เชื่อถือได้สำหรับลายเซ็น Developer ID ตั้งค่า `CODESIGN_TIMESTAMP=off` เพื่อข้ามการ timestamp (บิลด์ดีบักแบบออฟไลน์)
- ใส่เมตาดาต้าบิลด์ลงใน Info.plist: `OpenClawBuildTimestamp` (UTC) และ `OpenClawGitCommit` (แฮชแบบสั้น) เพื่อให้แผง About แสดงบิลด์, git และช่องทางดีบัก/รีลีสได้
- **การแพ็กเกจใช้ Node 24 เป็นค่าเริ่มต้น**: สคริปต์รันบิลด์ TS และบิลด์ Control UI Node 22 LTS ซึ่งปัจจุบันคือ `22.14+` ยังคงรองรับเพื่อความเข้ากันได้
- อ่าน `SIGN_IDENTITY` จากสภาพแวดล้อม เพิ่ม `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (หรือใบรับรอง Developer ID Application ของคุณ) ลงใน shell rc เพื่อเซ็นด้วยใบรับรองของคุณเสมอ การเซ็นแบบ ad-hoc ต้องเลือกใช้โดยชัดเจนผ่าน `ALLOW_ADHOC_SIGNING=1` หรือ `SIGN_IDENTITY="-"` (ไม่แนะนำสำหรับการทดสอบสิทธิ์)
- รันการตรวจสอบ Team ID หลังการเซ็น และล้มเหลวหาก Mach-O ใดๆ ภายในบันเดิลแอปถูกเซ็นโดย Team ID อื่น ตั้งค่า `SKIP_TEAM_ID_CHECK=1` เพื่อข้าม

## การใช้งาน

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### หมายเหตุการเซ็นแบบ Ad-hoc

เมื่อเซ็นด้วย `SIGN_IDENTITY="-"` (ad-hoc) สคริปต์จะปิดใช้งาน **Hardened Runtime** (`--options runtime`) โดยอัตโนมัติ สิ่งนี้จำเป็นเพื่อป้องกันการแครชเมื่อแอปพยายามโหลดเฟรมเวิร์กที่ฝังอยู่ (เช่น Sparkle) ซึ่งไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นแบบ ad-hoc ยังทำให้การคงอยู่ของสิทธิ์ TCC ใช้ไม่ได้ด้วย; ดูขั้นตอนการกู้คืนได้ที่ [สิทธิ์ macOS](/th/platforms/mac/permissions)

## เมตาดาต้าบิลด์สำหรับ About

`package-mac-app.sh` ประทับข้อมูลบันเดิลด้วย:

- `OpenClawBuildTimestamp`: ISO8601 UTC ณ เวลาแพ็กเกจ
- `OpenClawGitCommit`: แฮช git แบบสั้น (หรือ `unknown` หากไม่พร้อมใช้งาน)

แท็บ About อ่านคีย์เหล่านี้เพื่อแสดงเวอร์ชัน วันที่บิลด์ คอมมิต git และบอกว่าเป็นบิลด์ดีบักหรือไม่ (ผ่าน `#if DEBUG`) รันตัวแพ็กเกจเพื่อรีเฟรชค่าเหล่านี้หลังจากเปลี่ยนโค้ด

## เหตุผล

สิทธิ์ TCC ผูกกับตัวระบุบันเดิล _และ_ ลายเซ็นโค้ด บิลด์ดีบักที่ไม่ได้เซ็นและมี UUID เปลี่ยนไปทำให้ macOS ลืมสิทธิ์ที่อนุญาตหลังการรีบิลด์แต่ละครั้ง การเซ็นไบนารี (ค่าเริ่มต้นเป็น ad-hoc) และการคงรหัส/พาธบันเดิลที่ตายตัว (`dist/OpenClaw.app`) จะรักษาสิทธิ์ระหว่างบิลด์ไว้ ซึ่งตรงกับแนวทางของ VibeTunnel

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ macOS](/th/platforms/mac/permissions)
