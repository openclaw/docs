---
read_when:
    - ทำความเข้าใจว่าเกิดอะไรขึ้นในการรัน agent ครั้งแรก
    - อธิบายว่าไฟล์สำหรับการบูตสแตรปอยู่ที่ใด
    - การดีบักการตั้งค่าข้อมูลตัวตนระหว่าง onboarding
sidebarTitle: Bootstrapping
summary: พิธีการบูตสแตรป agent ที่เตรียม workspace และไฟล์ข้อมูลตัวตนเริ่มต้น
title: การบูตสแตรป agent
x-i18n:
    generated_at: "2026-04-25T13:59:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: 435eb2a14707623903ab7873774cc8d4489b960719cf6a525d547983f8338027
    source_path: start/bootstrapping.md
    workflow: 15
---

การบูตสแตรปคือพิธีการ **first-run** ที่เตรียม workspace ของ agent และรวบรวมรายละเอียดข้อมูลตัวตน โดยจะเกิดขึ้นหลัง onboarding เมื่อ agent เริ่มทำงานเป็นครั้งแรก

## การบูตสแตรปทำอะไรบ้าง

ในการรัน agent ครั้งแรก OpenClaw จะบูตสแตรป workspace (ค่าเริ่มต้นคือ
`~/.openclaw/workspace`):

- เตรียม `AGENTS.md`, `BOOTSTRAP.md`, `IDENTITY.md`, `USER.md`
- รันพิธีถาม-ตอบสั้น ๆ (ถามทีละคำถาม)
- เขียนข้อมูลตัวตนและการตั้งค่าลงใน `IDENTITY.md`, `USER.md`, `SOUL.md`
- ลบ `BOOTSTRAP.md` เมื่อเสร็จสิ้น เพื่อให้รันเพียงครั้งเดียว

## การข้ามการบูตสแตรป

หากต้องการข้ามขั้นตอนนี้สำหรับ workspace ที่เตรียมไว้ล่วงหน้า ให้รัน `openclaw onboard --skip-bootstrap`

## ตำแหน่งที่รัน

การบูตสแตรปจะรันบน **โฮสต์ gateway** เสมอ หากแอป macOS เชื่อมต่อกับ Gateway ระยะไกล workspace และไฟล์บูตสแตรปจะอยู่บนเครื่องระยะไกลนั้น

<Note>
เมื่อ Gateway รันอยู่บนอีกเครื่องหนึ่ง ให้แก้ไขไฟล์ workspace บนโฮสต์ gateway (เช่น `user@gateway-host:~/.openclaw/workspace`)
</Note>

## เอกสารที่เกี่ยวข้อง

- onboarding ของแอป macOS: [Onboarding](/th/start/onboarding)
- โครงสร้าง workspace: [workspace ของ Agent](/th/concepts/agent-workspace)
