---
read_when:
    - กำลังอัปเดต UI การตั้งค่า Skills บน macOS
    - การเปลี่ยนการควบคุมเงื่อนไขของ Skills หรือพฤติกรรมการติดตั้ง
summary: UI การตั้งค่า Skills บน macOS และสถานะที่รองรับโดย Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-06-27T17:50:00Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5ecc470f1645051e03ab4f51bcb4972da4853c690354bc8ea18a89fcd387d413
    source_path: platforms/mac/skills.md
    workflow: 16
---

แอป macOS แสดง Skills ของ OpenClaw ผ่าน Gateway โดยไม่ได้แยกวิเคราะห์ Skills ภายในเครื่อง

## แหล่งข้อมูล

- `skills.status` (Gateway) ส่งคืน Skills ทั้งหมด พร้อมคุณสมบัติการใช้งานและข้อกำหนดที่ขาดหาย
  (รวมถึงการบล็อกด้วย allowlist สำหรับ Skills ที่มาพร้อมชุดติดตั้ง)
- ข้อกำหนดได้มาจาก `metadata.openclaw.requires` ในแต่ละ `SKILL.md`

## การดำเนินการติดตั้ง

- `metadata.openclaw.install` กำหนดตัวเลือกการติดตั้ง (brew/node/go/uv)
- แอปเรียก `skills.install` เพื่อรันตัวติดตั้งบนโฮสต์ Gateway
- `security.installPolicy` ที่ผู้ปฏิบัติงานเป็นเจ้าของสามารถบล็อกการติดตั้ง skill
  ที่ทำผ่าน Gateway ก่อนที่เมทาดาทาตัวติดตั้งจะทำงาน การบล็อก dangerous-code
  ในตัวขณะติดตั้งไม่ได้เป็นส่วนหนึ่งของโฟลว์การติดตั้ง skill
- หากตัวเลือกการติดตั้งทุกตัวเป็น `download` Gateway จะแสดงตัวเลือกดาวน์โหลดทั้งหมด
- มิฉะนั้น Gateway จะเลือกตัวติดตั้งที่ต้องการหนึ่งตัวโดยใช้ค่ากำหนดการติดตั้งปัจจุบัน
  และไบนารีบนโฮสต์: Homebrew ก่อนเมื่อเปิดใช้งาน
  `skills.install.preferBrew` และมี `brew` อยู่ จากนั้นเป็น `uv` จากนั้นเป็น
  ตัวจัดการ Node ที่กำหนดค่าจาก `skills.install.nodeManager` จากนั้นจึงเป็น
  ตัวสำรองภายหลัง เช่น `go` หรือ `download`
- ป้ายกำกับการติดตั้ง Node สะท้อนตัวจัดการ Node ที่กำหนดค่าไว้ รวมถึง `yarn`

## คีย์ Env/API

- แอปจัดเก็บคีย์ใน `~/.openclaw/openclaw.json` ภายใต้ `skills.entries.<skillKey>`
- `skills.update` แพตช์ `enabled`, `apiKey` และ `env`

## โหมดระยะไกล

- การติดตั้งและการอัปเดตการกำหนดค่าเกิดขึ้นบนโฮสต์ Gateway (ไม่ใช่ Mac ภายในเครื่อง)

## ที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [แอป macOS](/th/platforms/macos)
