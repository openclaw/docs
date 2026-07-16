---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin acpx
summary: แบ็กเอนด์รันไทม์ ACP ของ OpenClaw พร้อมการจัดการเซสชันและการรับส่งข้อมูลที่ Plugin เป็นเจ้าของเอง
title: Plugin ACPx
x-i18n:
    generated_at: "2026-07-16T19:31:59Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9816ca3ada81eb44883b641f3d761b76f894bd83c8aa978c516125c77842f664
    source_path: plugins/reference/acpx.md
    workflow: 16
---

# Plugin ACPx

แบ็กเอนด์รันไทม์ ACP ของ OpenClaw พร้อมการจัดการเซสชันและทรานสปอร์ตที่ Plugin เป็นเจ้าของ

## การเผยแพร่

- แพ็กเกจ: `@openclaw/acpx`
- ช่องทางการติดตั้ง: npm; ClawHub

## พื้นผิว

Skills

<!-- openclaw-plugin-reference:manual-start -->

## เซสชันเนทีฟของ Pi

รันไทม์ที่รวมมาให้จะตรวจหาที่เก็บเซสชันของ Pi โดยอัตโนมัติบน Gateway และ Node
ที่จับคู่ไว้ เซสชันที่จัดเก็บจะปรากฏในกลุ่ม **Pi** ของแถบด้านข้างเซสชัน พร้อม
การเรียกดูทรานสคริปต์แบบอ่านอย่างเดียวจากรูปแบบเซสชัน JSONL ที่ Pi จัดทำเอกสารไว้
แค็ตตาล็อกรองรับไดเรกทอรีเซสชัน `settings.json` ระดับโปรเจกต์และระดับส่วนกลาง รวมถึง
`PI_CODING_AGENT_DIR` และ `PI_CODING_AGENT_SESSION_DIR` พาธสัมพัทธ์จะได้รับการแก้ไข
จากไดเรกทอรีที่มีไฟล์ `settings.json` ของพาธนั้น

ปิด **Pi Session Catalog** ใต้ **Config > Plugins > ACPX Runtime** เพื่อ
ปิดใช้งานการค้นหา โดยค่าเริ่มต้นจะเปิดใช้งาน

<!-- openclaw-plugin-reference:manual-end -->

## เอกสารที่เกี่ยวข้อง

- [acpx](/th/tools/acp-agents-setup)
