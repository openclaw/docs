---
read_when:
    - คุณกำลังตั้งค่าครั้งแรกโดยไม่ผ่านการเริ่มต้นใช้งาน CLI แบบเต็ม
    - คุณต้องการตั้งค่าพาธเวิร์กสเปซเริ่มต้น
    - คุณต้องมีทุกแฟล็กและวิธีที่การตั้งค่าตัดสินใจเลือกระหว่างโหมดพื้นฐานกับโหมดตัวช่วยสร้าง
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้นการกำหนดค่าและพื้นที่ทำงาน และเลือกเรียกใช้กระบวนการเริ่มต้นใช้งานได้)
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-10T19:31:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 55f0d771bb07c4c69293a470d54f4b6bb108ee521889bfb944fe450b24938b5e
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

เริ่มต้นการกำหนดค่าพื้นฐานและพื้นที่ทำงานของเอเจนต์ เมื่อมีแฟล็กการเริ่มต้นใช้งานใด ๆ อยู่ด้วย จะเรียกใช้ตัวช่วยตั้งค่าด้วย

<Note>
`openclaw setup` ใช้สำหรับการติดตั้งการกำหนดค่าที่แก้ไขได้ ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw จะปฏิเสธการเขียนจาก setup เพราะไฟล์การกำหนดค่าถูกจัดการโดย Nix ใช้ [คู่มือเริ่มต้นอย่างรวดเร็วของ nix-openclaw](https://github.com/openclaw/nix-openclaw#quick-start) ทางการ หรือการกำหนดค่าต้นทางที่เทียบเท่าสำหรับแพ็กเกจ Nix อื่น
</Note>

## ตัวเลือก

| แฟล็ก                       | คำอธิบาย                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | ไดเรกทอรีพื้นที่ทำงานของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/workspace`; จัดเก็บเป็น `agents.defaults.workspace`) |
| `--wizard`                 | เรียกใช้การเริ่มต้นใช้งานแบบโต้ตอบ                                                                         |
| `--non-interactive`        | เรียกใช้การเริ่มต้นใช้งานโดยไม่มีพรอมป์                                                                     |
| `--mode <mode>`            | โหมดการเริ่มต้นใช้งาน: `local` หรือ `remote`                                                               |
| `--import-from <provider>` | ผู้ให้บริการการย้ายที่จะเรียกใช้ระหว่างการเริ่มต้นใช้งาน                                                        |
| `--import-source <path>`   | โฮมของเอเจนต์ต้นทางสำหรับ `--import-from`                                                              |
| `--import-secrets`         | นำเข้าความลับที่รองรับระหว่างการย้ายในการเริ่มต้นใช้งาน                                               |
| `--remote-url <url>`       | URL ของ WebSocket สำหรับ Gateway ระยะไกล                                                                       |
| `--remote-token <token>`   | โทเค็นของ Gateway ระยะไกล (ไม่บังคับ)                                                                    |

### การเรียกใช้ตัวช่วยตั้งค่าอัตโนมัติ

`openclaw setup` จะเรียกใช้ตัวช่วยตั้งค่าเมื่อมีแฟล็กใด ๆ ต่อไปนี้ระบุไว้อย่างชัดเจน แม้ไม่มี `--wizard`:

`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## ตัวอย่าง

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## หมายเหตุ

- `openclaw setup` แบบธรรมดาจะเริ่มต้นการกำหนดค่าและพื้นที่ทำงานโดยไม่เรียกใช้โฟลว์การเริ่มต้นใช้งานเต็มรูปแบบ
- หลังจาก setup แบบธรรมดา ให้เรียกใช้ `openclaw onboard` สำหรับกระบวนการแนะนำแบบเต็ม, `openclaw configure` สำหรับการเปลี่ยนแปลงเฉพาะจุด หรือ `openclaw channels add` เพื่อเพิ่มบัญชีช่องทาง
- หากตรวจพบสถานะของ Hermes การเริ่มต้นใช้งานแบบโต้ตอบสามารถเสนอการย้ายโดยอัตโนมัติได้ การเริ่มต้นใช้งานแบบนำเข้าต้องใช้ setup ใหม่; ใช้ [ย้าย](/th/cli/migrate) สำหรับแผน dry-run, การสำรองข้อมูล และโหมดเขียนทับภายนอกการเริ่มต้นใช้งาน

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [ภาพรวมการติดตั้ง](/th/install)
