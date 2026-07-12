---
read_when:
    - คุณกำลังใช้ข้อความส่วนตัวในโหมดจับคู่และจำเป็นต้องอนุมัติผู้ส่ง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw pairing` (อนุมัติ/แสดงรายการคำขอจับคู่)
title: การจับคู่
x-i18n:
    generated_at: "2026-07-12T15:54:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ca83ad9d9e55cfffd49301cb529b28df370c2dcff03484880f7cfc85ec2d6440
    source_path: cli/pairing.md
    workflow: 16
---

# `openclaw pairing`

อนุมัติหรือตรวจสอบคำขอจับคู่ DM สำหรับช่องทางที่รองรับการจับคู่ (เฉพาะ DM แชตเท่านั้น — การจับคู่ Node/อุปกรณ์ใช้ `openclaw devices`)

ที่เกี่ยวข้อง: [ขั้นตอนการจับคู่](/th/channels/pairing)

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

| ตัวเลือก                 | คำอธิบาย                                      |
| ----------------------- | ------------------------------------- |
| `[channel]`             | รหัสช่องทางแบบอาร์กิวเมนต์ตามตำแหน่ง             |
| `--channel <channel>`   | รหัสช่องทางที่ระบุอย่างชัดเจน                     |
| `--account <accountId>` | รหัสบัญชีสำหรับช่องทางที่รองรับหลายบัญชี            |
| `--json`                | เอาต์พุตที่เครื่องอ่านได้                          |

หากกำหนดค่าช่องทางที่รองรับการจับคู่ไว้หลายช่องทาง ให้ส่งช่องทางเป็นอาร์กิวเมนต์ตามตำแหน่งหรือผ่าน `--channel` ช่องทางส่วนขยายใช้งานได้ตราบใดที่รหัสช่องทางถูกต้อง

## `pairing approve`

อนุมัติรหัสจับคู่ที่รอดำเนินการและอนุญาตผู้ส่งรายนั้น

วิธีใช้:

- `openclaw pairing approve <channel> <code>`
- `openclaw pairing approve --channel <channel> <code>`
- `openclaw pairing approve <code>` เมื่อกำหนดค่าช่องทางที่รองรับการจับคู่ไว้เพียงหนึ่งช่องทางเท่านั้น

ตัวเลือก: `--channel <channel>`, `--account <accountId>`, `--notify` (ส่งข้อความยืนยันกลับไปยังผู้ร้องขอผ่านช่องทางเดียวกัน)

### การตั้งค่าเริ่มต้นของเจ้าของ

หาก `commands.ownerAllowFrom` ว่างอยู่เมื่อคุณอนุมัติรหัสจับคู่ OpenClaw จะบันทึกผู้ส่งที่ได้รับอนุมัติเป็นเจ้าของคำสั่งด้วย โดยใช้รายการที่จำกัดขอบเขตตามช่องทาง เช่น `telegram:123456789` การดำเนินการนี้ใช้ตั้งค่าเริ่มต้นให้เจ้าของรายแรกเท่านั้น — การอนุมัติการจับคู่ในภายหลังจะไม่แทนที่หรือเพิ่มรายการใน `commands.ownerAllowFrom`

เจ้าของคำสั่งคือบัญชีของผู้ดำเนินการที่เป็นมนุษย์ ซึ่งได้รับอนุญาตให้เรียกใช้คำสั่งสำหรับเจ้าของเท่านั้น และอนุมัติการดำเนินการที่เป็นอันตราย เช่น `/diagnostics`, `/export-trajectory`, `/config` และการอนุมัติการเรียกใช้คำสั่ง การจับคู่เพียงอนุญาตให้ผู้ส่งสนทนากับเอเจนต์เท่านั้น โดยตัวมันเองไม่ได้ให้สิทธิ์ของเจ้าของนอกเหนือจากการตั้งค่าเริ่มต้นเพียงครั้งเดียวนี้

หากคุณอนุมัติผู้ส่งก่อนที่จะมีการตั้งค่าเริ่มต้นนี้ ให้เรียกใช้ `openclaw doctor` ซึ่งจะแจ้งเตือนเมื่อยังไม่ได้กำหนดค่าเจ้าของคำสั่ง และแสดงคำสั่ง `openclaw config set commands.ownerAllowFrom ...` ที่ถูกต้องสำหรับแก้ไขปัญหา

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การจับคู่ช่องทาง](/th/channels/pairing)
