---
read_when:
    - คุณกำลังใช้ข้อความส่วนตัวในโหมดจับคู่และต้องอนุมัติผู้ส่ง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw pairing` (อนุมัติ/แสดงรายการคำขอจับคู่)
title: การจับคู่
x-i18n:
    generated_at: "2026-05-06T17:54:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 022018239ab1134b18986be42b8e019f412a1a730a9671f422979909c4a31dc5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

อนุมัติหรือตรวจสอบคำขอจับคู่ทาง DM (สำหรับช่องทางที่รองรับการจับคู่)

ที่เกี่ยวข้อง:

- โฟลว์การจับคู่: [การจับคู่](/th/channels/pairing)

## คำสั่ง

```bash
openclaw pairing list telegram
openclaw pairing list --channel telegram --account work
openclaw pairing list telegram --json

openclaw pairing approve <code>
openclaw pairing approve telegram <code>
openclaw pairing approve --channel telegram --account work <code> --notify
```

## `pairing list`

แสดงรายการคำขอจับคู่ที่รอดำเนินการสำหรับหนึ่งช่องทาง

ตัวเลือก:

- `[channel]`: ID ช่องทางแบบตำแหน่ง
- `--channel <channel>`: ID ช่องทางแบบระบุชัดเจน
- `--account <accountId>`: ID บัญชีสำหรับช่องทางแบบหลายบัญชี
- `--json`: เอาต์พุตที่เครื่องอ่านได้

หมายเหตุ:

- หากกำหนดค่าช่องทางที่รองรับการจับคู่ไว้หลายช่องทาง คุณต้องระบุช่องทางแบบตำแหน่งหรือด้วย `--channel`
- อนุญาตให้ใช้ช่องทางส่วนขยายได้ ตราบใดที่ ID ช่องทางถูกต้อง

## `pairing approve`

อนุมัติโค้ดจับคู่ที่รอดำเนินการและอนุญาตผู้ส่งนั้น

การใช้งาน:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` เมื่อกำหนดค่าช่องทางที่รองรับการจับคู่ไว้เพียงช่องทางเดียว

ตัวเลือก:

- `--channel <channel>`: ID ช่องทางแบบระบุชัดเจน
- `--account <accountId>`: ID บัญชีสำหรับช่องทางแบบหลายบัญชี
- `--notify`: ส่งการยืนยันกลับไปยังผู้ขอบนช่องทางเดียวกัน

การเริ่มต้นเจ้าของ:

- หาก `commands.ownerAllowFrom` ว่างเปล่าเมื่อคุณอนุมัติโค้ดจับคู่ OpenClaw จะบันทึกผู้ส่งที่ได้รับอนุมัติเป็นเจ้าของคำสั่งด้วย โดยใช้รายการที่จำกัดขอบเขตตามช่องทาง เช่น `telegram:123456789`
- การดำเนินการนี้เริ่มต้นเฉพาะเจ้าของคนแรกเท่านั้น การอนุมัติการจับคู่ในภายหลังจะไม่แทนที่หรือขยาย `commands.ownerAllowFrom`
- เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้เรียกใช้คำสั่งเฉพาะเจ้าของและอนุมัติการดำเนินการที่อันตราย เช่น `/diagnostics`, `/export-trajectory`, `/config` และการอนุมัติ exec

## หมายเหตุ

- อินพุตช่องทาง: ส่งแบบตำแหน่ง (`pairing list telegram`) หรือด้วย `--channel <channel>`
- `pairing list` รองรับ `--account <accountId>` สำหรับช่องทางแบบหลายบัญชี
- `pairing approve` รองรับ `--account <accountId>` และ `--notify`
- หากกำหนดค่าช่องทางที่รองรับการจับคู่ไว้เพียงช่องทางเดียว จะอนุญาตให้ใช้ `pairing approve <code>`
- หากคุณอนุมัติผู้ส่งก่อนที่การเริ่มต้นนี้จะมีอยู่ ให้เรียกใช้ `openclaw doctor`; ระบบจะเตือนเมื่อยังไม่ได้กำหนดค่าเจ้าของคำสั่งและแสดงคำสั่ง `openclaw config set commands.ownerAllowFrom ...` เพื่อแก้ไข

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจับคู่ช่องทาง](/th/channels/pairing)
