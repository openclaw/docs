---
read_when:
    - คุณกำลังตั้งค่าครั้งแรกด้วยวิซาร์ดการเริ่มต้นใช้งานของ CLI
    - คุณต้องการตั้งค่าเส้นทางเวิร์กสเปซเริ่มต้น
    - คุณต้องใช้แฟล็กการตั้งค่าเฉพาะ baseline สำหรับสคริปต์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw setup` (นามแฝงสำหรับการเริ่มต้นใช้งาน พร้อมการตั้งค่าพื้นฐานที่เปิดใช้ได้ด้วยแฟล็ก)
title: การตั้งค่า
x-i18n:
    generated_at: "2026-06-30T22:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 797c023d5ba27920fbea9828c9bb12f6c10d25dd3aa6fc68fe9c742f432ebb05
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

เรียกใช้ขั้นตอนเริ่มต้นใช้งาน CLI แบบเต็ม `openclaw setup` เป็นนามแฝงของ `openclaw onboard`; ใช้ `--baseline` เมื่อคุณต้องการเพียงเริ่มต้นโฟลเดอร์การกำหนดค่า/พื้นที่ทำงานโดยไม่มีวิซาร์ด

<Note>
`openclaw setup` ใช้สำหรับการติดตั้งการกำหนดค่าที่เปลี่ยนแปลงได้ ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw จะปฏิเสธการเขียนจาก setup เพราะไฟล์การกำหนดค่าถูกจัดการโดย Nix ใช้ [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) ของผู้พัฒนาโดยตรง หรือการกำหนดค่าซอร์สที่เทียบเท่าสำหรับแพ็กเกจ Nix อื่น
</Note>

## ตัวเลือก

| แฟล็ก                       | คำอธิบาย                                                                                         |
| -------------------------- | --------------------------------------------------------------------------------------------------- |
| `--workspace <dir>`        | ไดเรกทอรีพื้นที่ทำงานของเอเจนต์ (ค่าเริ่มต้น `~/.openclaw/workspace`; จัดเก็บเป็น `agents.defaults.workspace`) |
| `--baseline`               | สร้างโฟลเดอร์การกำหนดค่า/พื้นที่ทำงาน/เซสชันพื้นฐานโดยไม่เริ่มต้นใช้งาน                                |
| `--wizard`                 | ยอมรับเพื่อความเข้ากันได้; setup จะเรียกใช้การเริ่มต้นใช้งานเป็นค่าเริ่มต้น                                       |
| `--non-interactive`        | เรียกใช้การเริ่มต้นใช้งานโดยไม่มีพรอมต์                                                                     |
| `--accept-risk`            | รับทราบความเสี่ยงจากการเข้าถึงทั้งระบบของเอเจนต์; จำเป็นต้องใช้ร่วมกับ `--non-interactive`                       |
| `--mode <mode>`            | โหมดการเริ่มต้นใช้งาน: `local` หรือ `remote`                                                               |
| `--import-from <provider>` | ผู้ให้บริการการย้ายข้อมูลที่จะเรียกใช้ระหว่างการเริ่มต้นใช้งาน                                                        |
| `--import-source <path>`   | โฮมของเอเจนต์ต้นทางสำหรับ `--import-from`                                                              |
| `--import-secrets`         | นำเข้าความลับที่รองรับระหว่างการย้ายข้อมูลในการเริ่มต้นใช้งาน                                               |
| `--remote-url <url>`       | URL WebSocket ของ Gateway ระยะไกล                                                                       |
| `--remote-token <token>`   | โทเค็น Gateway ระยะไกล (ไม่บังคับ)                                                                    |

### โหมดพื้นฐาน

`openclaw setup --baseline` รักษาพฤติกรรมแบบพื้นฐานอย่างเดียวเดิมไว้: จะสร้างไดเรกทอรีการกำหนดค่า พื้นที่ทำงาน และเซสชัน แล้วออกโดยไม่เรียกใช้การเริ่มต้นใช้งาน

## ตัวอย่าง

```bash
openclaw setup
openclaw setup --baseline
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --accept-risk --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## หมายเหตุ

- `openclaw setup` แบบธรรมดาจะเรียกใช้ขั้นตอนแบบมีคำแนะนำเดียวกับ `openclaw onboard`
- หลังจาก setup แบบพื้นฐาน ให้เรียกใช้ `openclaw setup` หรือ `openclaw onboard` สำหรับขั้นตอนแบบมีคำแนะนำแบบเต็ม, `openclaw configure` สำหรับการเปลี่ยนแปลงเฉพาะจุด หรือ `openclaw channels add` เพื่อเพิ่มบัญชีช่องทาง
- หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานแบบโต้ตอบสามารถเสนอการย้ายข้อมูลโดยอัตโนมัติได้ การเริ่มต้นใช้งานแบบนำเข้าต้องใช้ setup ใหม่; ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผน dry-run, การสำรองข้อมูล และโหมดเขียนทับนอกการเริ่มต้นใช้งาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)
- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [ภาพรวมการติดตั้ง](/th/install)
