---
read_when:
    - คุณกำลังตั้งค่าการใช้งานครั้งแรกโดยไม่มีการเริ่มต้นใช้งานผ่าน CLI แบบเต็ม
    - คุณต้องการตั้งค่าเส้นทางพื้นที่ทำงานเริ่มต้น
    - คุณต้องรู้ทุกแฟล็กและวิธีที่การตั้งค่าตัดสินใจระหว่างโหมด baseline กับโหมด wizard
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้นการกำหนดค่าพร้อมพื้นที่ทำงาน และเลือกเรียกใช้ขั้นตอนเริ่มต้นใช้งานได้)
title: การตั้งค่า
x-i18n:
    generated_at: "2026-06-27T17:23:46Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 42bc570cf4c43338d6ca6202aace7c9d669fb1ac6d8bd8b61a591086fff2896a
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

เริ่มต้นการกำหนดค่าพื้นฐานและพื้นที่ทำงานของเอเจนต์ เมื่อมีแฟล็ก onboarding ใด ๆ อยู่ด้วย จะเรียกใช้วิซาร์ดด้วย

<Note>
`openclaw setup` ใช้สำหรับการติดตั้งค่ากำหนดที่เปลี่ยนแปลงได้ ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw จะปฏิเสธการเขียนจาก setup เพราะไฟล์ค่ากำหนดถูกจัดการโดย Nix ใช้ [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) จากผู้พัฒนาโดยตรง หรือค่ากำหนดซอร์สที่เทียบเท่าสำหรับแพ็กเกจ Nix อื่น
</Note>

## ตัวเลือก

| แฟล็ก                       | คำอธิบาย                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | ไดเรกทอรีพื้นที่ทำงานของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/workspace`; เก็บเป็น `agents.defaults.workspace`) |
| `--wizard`                 | เรียกใช้ onboarding แบบโต้ตอบ                                                                         |
| `--non-interactive`        | เรียกใช้ onboarding โดยไม่มีพรอมป์                                                                     |
| `--accept-risk`            | ยอมรับความเสี่ยงจากการให้เอเจนต์เข้าถึงทั้งระบบ; จำเป็นเมื่อใช้กับ `--non-interactive`                       |
| `--mode <mode>`            | โหมด onboarding: `local` หรือ `remote`                                                               |
| `--import-from <provider>` | ผู้ให้บริการการย้ายข้อมูลที่จะเรียกใช้ระหว่าง onboarding                                                        |
| `--import-source <path>`   | โฮมของเอเจนต์ต้นทางสำหรับ `--import-from`                                                              |
| `--import-secrets`         | นำเข้าความลับที่รองรับระหว่างการย้ายข้อมูลใน onboarding                                               |
| `--remote-url <url>`       | URL WebSocket ของ Gateway ระยะไกล                                                                       |
| `--remote-token <token>`   | โทเค็น Gateway ระยะไกล (ไม่บังคับ)                                                                    |

### การเรียกใช้วิซาร์ดอัตโนมัติ

`openclaw setup` จะเรียกใช้วิซาร์ดเมื่อแฟล็กใด ๆ ต่อไปนี้ถูกระบุอย่างชัดเจน แม้ไม่มี `--wizard`:

`--wizard`, `--non-interactive`, `--accept-risk`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`.

## ตัวอย่าง

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## หมายเหตุ

- `openclaw setup` แบบธรรมดาจะเริ่มต้นค่ากำหนดและพื้นที่ทำงานโดยไม่เรียกใช้โฟลว์ onboarding แบบเต็ม
- หลังจาก setup แบบธรรมดา ให้เรียกใช้ `openclaw onboard` สำหรับเส้นทางแบบมีคำแนะนำครบถ้วน, `openclaw configure` สำหรับการเปลี่ยนแปลงแบบเจาะจง หรือ `openclaw channels add` เพื่อเพิ่มบัญชีช่องทาง
- หากตรวจพบสถานะ Hermes, onboarding แบบโต้ตอบสามารถเสนอการย้ายข้อมูลโดยอัตโนมัติ การนำเข้าใน onboarding ต้องใช้ setup ใหม่; ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผน dry-run, การสำรองข้อมูล, และโหมดเขียนทับนอก onboarding

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Onboarding (CLI)](/th/start/wizard)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [ภาพรวมการติดตั้ง](/th/install)
