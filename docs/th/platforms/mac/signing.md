---
read_when:
    - การสร้างหรือลงนามบิลด์ดีบักสำหรับ Mac
summary: ขั้นตอนการเซ็นสำหรับบิลด์ดีบักของ macOS ที่สร้างโดยสคริปต์การแพ็กเกจ
title: macOS signing
x-i18n:
    generated_at: "2026-06-27T17:49:54Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: df4ee44b6bdf09a24e0d05ed4354e2cb573372d12a667b4fcdfd7d6f88291082
    source_path: platforms/mac/signing.md
    workflow: 16
---

# การลงนามบน mac (บิลด์ดีบัก)

แอปนี้มักสร้างจาก [`scripts/package-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/package-mac-app.sh) ซึ่งตอนนี้:

- ตั้งค่าตัวระบุบันเดิลดีบักที่เสถียร: `ai.openclaw.mac.debug`
- เขียน Info.plist ด้วย bundle id นั้น (แทนที่ได้ผ่าน `BUNDLE_ID=...`)
- เรียก [`scripts/codesign-mac-app.sh`](https://github.com/openclaw/openclaw/blob/main/scripts/codesign-mac-app.sh) เพื่อลงนามไบนารีหลักและบันเดิลแอป เพื่อให้ macOS มองการสร้างใหม่แต่ละครั้งเป็นบันเดิลที่ลงนามเดียวกันและคงสิทธิ์ TCC ไว้ (การแจ้งเตือน, การช่วยการเข้าถึง, การบันทึกหน้าจอ, ไมค์, เสียงพูด) เพื่อสิทธิ์ที่เสถียร ให้ใช้ตัวตนการลงนามจริง; ad-hoc เป็นการเลือกใช้โดยชัดเจนและเปราะบาง (ดู [สิทธิ์ของ macOS](/th/platforms/mac/permissions))
- ใช้ `CODESIGN_TIMESTAMP=auto` เป็นค่าเริ่มต้น; ค่านี้เปิดใช้ timestamp ที่เชื่อถือได้สำหรับลายเซ็น Developer ID ตั้งค่า `CODESIGN_TIMESTAMP=off` เพื่อข้ามการ timestamp (บิลด์ดีบักแบบออฟไลน์)
- แทรกเมตาดาต้าบิลด์ลงใน Info.plist: `OpenClawBuildTimestamp` (UTC) และ `OpenClawGitCommit` (แฮชสั้น) เพื่อให้แผง About แสดงบิลด์, git, และช่องทาง debug/release ได้
- **การแพ็กเกจใช้ Node 24 เป็นค่าเริ่มต้น**: สคริปต์รันบิลด์ TS และบิลด์ Control UI Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังคงรองรับเพื่อความเข้ากันได้
- อ่าน `SIGN_IDENTITY` จากสภาพแวดล้อม เพิ่ม `export SIGN_IDENTITY="Apple Development: Your Name (TEAMID)"` (หรือใบรับรอง Developer ID Application ของคุณ) ลงใน shell rc เพื่อให้ลงนามด้วยใบรับรองของคุณเสมอ การลงนามแบบ ad-hoc ต้องเลือกใช้โดยชัดเจนผ่าน `ALLOW_ADHOC_SIGNING=1` หรือ `SIGN_IDENTITY="-"` (ไม่แนะนำสำหรับการทดสอบสิทธิ์)
- รันการตรวจสอบ Team ID หลังลงนาม และล้มเหลวหาก Mach-O ใดๆ ภายในบันเดิลแอปถูกลงนามด้วย Team ID อื่น ตั้งค่า `SKIP_TEAM_ID_CHECK=1` เพื่อข้าม

## การใช้งาน

```bash
# from repo root
scripts/package-mac-app.sh               # auto-selects identity; errors if none found
SIGN_IDENTITY="Developer ID Application: Your Name" scripts/package-mac-app.sh   # real cert
ALLOW_ADHOC_SIGNING=1 scripts/package-mac-app.sh    # ad-hoc (permissions will not stick)
SIGN_IDENTITY="-" scripts/package-mac-app.sh        # explicit ad-hoc (same caveat)
DISABLE_LIBRARY_VALIDATION=1 scripts/package-mac-app.sh   # dev-only Sparkle Team ID mismatch workaround
```

### หมายเหตุการลงนามแบบ Ad-hoc

เมื่อการลงนามใช้ `SIGN_IDENTITY="-"` (ad-hoc) สคริปต์จะปิดใช้ **Hardened Runtime** (`--options runtime`) โดยอัตโนมัติ สิ่งนี้จำเป็นเพื่อป้องกันการแครชเมื่อแอปพยายามโหลดเฟรมเวิร์กที่ฝังไว้ (เช่น Sparkle) ซึ่งไม่ได้ใช้ Team ID เดียวกัน ลายเซ็นแบบ ad-hoc ยังทำให้การคงอยู่ของสิทธิ์ TCC เสียหายด้วย; ดู [สิทธิ์ของ macOS](/th/platforms/mac/permissions) สำหรับขั้นตอนการกู้คืน

## เมตาดาต้าบิลด์สำหรับ About

`package-mac-app.sh` ประทับบันเดิลด้วย:

- `OpenClawBuildTimestamp`: ISO8601 UTC ณ เวลาแพ็กเกจ
- `OpenClawGitCommit`: แฮช git แบบสั้น (หรือ `unknown` หากไม่พร้อมใช้งาน)

แท็บ About อ่านคีย์เหล่านี้เพื่อแสดงเวอร์ชัน, วันที่บิลด์, git commit, และบอกว่าเป็นบิลด์ดีบักหรือไม่ (ผ่าน `#if DEBUG`) รันตัวแพ็กเกจเพื่อรีเฟรชค่าเหล่านี้หลังจากเปลี่ยนโค้ด

## เหตุผล

สิทธิ์ TCC ผูกกับตัวระบุบันเดิล _และ_ ลายเซ็นโค้ด บิลด์ดีบักที่ไม่ได้ลงนามซึ่งมี UUID เปลี่ยนไปทำให้ macOS ลืมสิทธิ์ที่อนุญาตหลังการสร้างใหม่แต่ละครั้ง การลงนามไบนารี (ค่าเริ่มต้นเป็น ad-hoc) และการคง bundle id/path แบบคงที่ (`dist/OpenClaw.app`) จะรักษาสิทธิ์ที่อนุญาตไว้ระหว่างบิลด์ ซึ่งตรงกับแนวทางของ VibeTunnel

## ที่เกี่ยวข้อง

- [แอป macOS](/th/platforms/macos)
- [สิทธิ์ของ macOS](/th/platforms/mac/permissions)
