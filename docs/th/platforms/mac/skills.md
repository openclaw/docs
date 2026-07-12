---
read_when:
    - การอัปเดต UI การตั้งค่า Skills ของ macOS
    - การเปลี่ยนแปลงการควบคุมการเข้าถึงหรือพฤติกรรมการติดตั้ง Skills
summary: UI การตั้งค่า Skills บน macOS และสถานะที่รองรับโดย Gateway
title: Skills (macOS)
x-i18n:
    generated_at: "2026-07-12T16:21:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fd9d8f1190320889029335e008c3605bd4bf0194f83398cedd4ae658fd90065c
    source_path: platforms/mac/skills.md
    workflow: 16
---

แอป macOS แสดง Skills ของ OpenClaw ผ่าน Gateway โดยไม่ได้แยกวิเคราะห์ Skills ภายในเครื่อง

## แหล่งข้อมูล

- `skills.status` (Gateway) ส่งคืน Skills ทั้งหมด พร้อมสถานะความพร้อมใช้งานและข้อกำหนดที่ยังขาด รวมถึงการบล็อกด้วยรายการอนุญาตสำหรับ Skills ที่มาพร้อมระบบ
- ข้อกำหนดมาจาก `metadata.openclaw.requires` ในไฟล์ `SKILL.md` แต่ละไฟล์

## การดำเนินการติดตั้ง

- `metadata.openclaw.install` กำหนดตัวเลือกการติดตั้ง (brew/node/go/uv/download)
- แอปเรียก `skills.install` เพื่อเรียกใช้โปรแกรมติดตั้งบนโฮสต์ Gateway
- `security.installPolicy` (`enabled`, `targets`, `exec`) ซึ่งผู้ดำเนินการเป็นผู้ควบคุม สามารถบล็อกการติดตั้ง Skills ที่ดำเนินการผ่าน Gateway ก่อนประมวลผลข้อมูลเมตาของโปรแกรมติดตั้ง การสแกนโค้ดอันตรายที่มีมาให้ในตัว (ซึ่งใช้สำหรับการติดตั้ง Plugin) ยังไม่ได้เชื่อมต่อกับกระบวนการติดตั้ง Skills
- หากตัวเลือกการติดตั้งทั้งหมดเป็น `download` Gateway จะแสดงตัวเลือกการดาวน์โหลดทั้งหมด
- มิฉะนั้น Gateway จะเลือกโปรแกรมติดตั้งที่ต้องการหนึ่งรายการ โดยใช้ค่ากำหนดการติดตั้งปัจจุบัน (`skills.install.preferBrew`, `skills.install.nodeManager`) และไบนารีบนโฮสต์: เลือก Homebrew ก่อนเมื่อเปิดใช้ `preferBrew` และมี `brew` จากนั้นเลือก `uv` ตามด้วยตัวจัดการ Node ที่กำหนดค่าไว้ แล้วเลือก Homebrew อีกครั้งหากพร้อมใช้งาน (แม้ไม่ได้เปิดใช้ `preferBrew`) จากนั้นเลือก `go` และสุดท้ายเลือก `download`
- ป้ายกำกับการติดตั้ง Node จะแสดงตามตัวจัดการ Node ที่กำหนดค่าไว้ รวมถึง `yarn`

## ตัวแปรสภาพแวดล้อม/คีย์ API

- แอปจัดเก็บคีย์ไว้ใน `~/.openclaw/openclaw.json` ภายใต้ `skills.entries.<skillKey>`
- `skills.update` แพตช์ค่า `enabled`, `apiKey` และ `env`

## โหมดระยะไกล

- การติดตั้งและการอัปเดตการกำหนดค่าจะเกิดขึ้นบนโฮสต์ Gateway ไม่ใช่บน Mac ภายในเครื่อง

## เนื้อหาที่เกี่ยวข้อง

- [Skills](/th/tools/skills)
- [แอป macOS](/th/platforms/macos)
