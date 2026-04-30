---
read_when:
    - คุณกำลังใช้ข้อความส่วนตัวในโหมดจับคู่และจำเป็นต้องอนุมัติผู้ส่ง
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw pairing` (อนุมัติ/แสดงรายการคำขอจับคู่)
title: การจับคู่
x-i18n:
    generated_at: "2026-04-30T09:44:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: bffc70a8c08e298f42c8fbc2238fce06993572e72f333e87ad18dea3cf33fab5
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

อนุมัติหรือตรวจสอบคำขอจับคู่ DM (สำหรับช่องทางที่รองรับการจับคู่)

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

แสดงรายการคำขอจับคู่ที่รอดำเนินการสำหรับช่องทางหนึ่งช่องทาง

ตัวเลือก:

- `[channel]`: รหัสช่องทางแบบอาร์กิวเมนต์ตำแหน่ง
- `--channel <channel>`: รหัสช่องทางที่ระบุอย่างชัดเจน
- `--account <accountId>`: รหัสบัญชีสำหรับช่องทางที่มีหลายบัญชี
- `--json`: เอาต์พุตที่เครื่องอ่านได้

หมายเหตุ:

- หากมีการกำหนดค่าหลายช่องทางที่รองรับการจับคู่ คุณต้องระบุช่องทางด้วยอาร์กิวเมนต์ตำแหน่งหรือด้วย `--channel`
- อนุญาตให้ใช้ช่องทางของ Plugin ได้ตราบใดที่รหัสช่องทางถูกต้อง

## `pairing approve`

อนุมัติโค้ดการจับคู่ที่รอดำเนินการและอนุญาตผู้ส่งรายนั้น

วิธีใช้:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` เมื่อมีการกำหนดค่าช่องทางที่รองรับการจับคู่เพียงช่องทางเดียว

ตัวเลือก:

- `--channel <channel>`: รหัสช่องทางที่ระบุอย่างชัดเจน
- `--account <accountId>`: รหัสบัญชีสำหรับช่องทางที่มีหลายบัญชี
- `--notify`: ส่งการยืนยันกลับไปยังผู้ร้องขอบนช่องทางเดียวกัน

การตั้งค่าเจ้าของเริ่มต้น:

- หาก `commands.ownerAllowFrom` ว่างอยู่เมื่อคุณอนุมัติโค้ดการจับคู่ OpenClaw จะบันทึกผู้ส่งที่ได้รับอนุมัติเป็นเจ้าของคำสั่งด้วย โดยใช้รายการที่จำกัดขอบเขตตามช่องทาง เช่น `telegram:123456789`
- การดำเนินการนี้ตั้งค่าเจ้าของคนแรกเท่านั้น การอนุมัติการจับคู่ในภายหลังจะไม่แทนที่หรือขยาย `commands.ownerAllowFrom`
- เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้เรียกใช้คำสั่งเฉพาะเจ้าของและอนุมัติการดำเนินการที่อันตราย เช่น `/diagnostics`, `/export-trajectory`, `/config` และการอนุมัติ exec

## หมายเหตุ

- อินพุตช่องทาง: ส่งเป็นอาร์กิวเมนต์ตำแหน่ง (`pairing list telegram`) หรือใช้ `--channel <channel>`
- `pairing list` รองรับ `--account <accountId>` สำหรับช่องทางที่มีหลายบัญชี
- `pairing approve` รองรับ `--account <accountId>` และ `--notify`
- หากมีการกำหนดค่าช่องทางที่รองรับการจับคู่เพียงช่องทางเดียว จะอนุญาตให้ใช้ `pairing approve <code>`
- หากคุณอนุมัติผู้ส่งก่อนที่จะมีการตั้งค่าเริ่มต้นนี้ ให้เรียกใช้ `openclaw doctor`; คำสั่งนี้จะเตือนเมื่อยังไม่ได้กำหนดค่าเจ้าของคำสั่งและแสดงคำสั่ง `openclaw config set commands.ownerAllowFrom ...` เพื่อแก้ไข

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การจับคู่ช่องทาง](/th/channels/pairing)
