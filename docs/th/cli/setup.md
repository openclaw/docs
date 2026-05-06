---
read_when:
    - คุณกำลังตั้งค่าเมื่อใช้งานครั้งแรกโดยไม่มีการเริ่มต้นใช้งานผ่าน CLI แบบเต็ม
    - คุณต้องการตั้งค่าพาธพื้นที่ทำงานเริ่มต้น
summary: อ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้นการกำหนดค่า + พื้นที่ทำงาน)
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-06T17:55:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9a47d41f8c6c59395eaa4bc6055fa09f863af819c7920e29969793904180c910
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

เริ่มต้น `~/.openclaw/openclaw.json` และพื้นที่ทำงานของเอเจนต์

<Note>
`openclaw setup` มีไว้สำหรับการติดตั้งการกำหนดค่าที่แก้ไขได้ ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) OpenClaw จะปฏิเสธการเขียนจากการตั้งค่า เพราะไฟล์กำหนดค่าถูกจัดการโดย Nix เอเจนต์ควรใช้ [nix-openclaw Quick Start](https://github.com/openclaw/nix-openclaw#quick-start) ของทางการ หรือการกำหนดค่าต้นทางที่เทียบเท่าสำหรับแพ็กเกจ Nix อื่น
</Note>

ที่เกี่ยวข้อง:

- เริ่มต้นใช้งาน: [เริ่มต้นใช้งาน](/th/start/getting-started)
- การเริ่มต้นใช้งาน CLI: [การเริ่มต้นใช้งาน (CLI)](/th/start/wizard)

## ตัวอย่าง

```bash
openclaw setup
openclaw setup --workspace ~/.openclaw/workspace
openclaw setup --wizard
openclaw setup --wizard --import-from hermes --import-source ~/.hermes
openclaw setup --non-interactive --mode remote --remote-url wss://gateway-host:18789 --remote-token <token>
```

## ตัวเลือก

- `--workspace <dir>`: ไดเรกทอรีพื้นที่ทำงานของเอเจนต์ (จัดเก็บเป็น `agents.defaults.workspace`)
- `--wizard`: เรียกใช้การเริ่มต้นใช้งาน
- `--non-interactive`: เรียกใช้การเริ่มต้นใช้งานโดยไม่มีพรอมป์
- `--mode <local|remote>`: โหมดการเริ่มต้นใช้งาน
- `--import-from <provider>`: ผู้ให้บริการการย้ายข้อมูลที่จะเรียกใช้ระหว่างการเริ่มต้นใช้งาน
- `--import-source <path>`: โฮมเอเจนต์ต้นทางสำหรับ `--import-from`
- `--import-secrets`: นำเข้าความลับที่รองรับระหว่างการย้ายข้อมูลในการเริ่มต้นใช้งาน
- `--remote-url <url>`: URL WebSocket ของ Gateway ระยะไกล
- `--remote-token <token>`: โทเค็น Gateway ระยะไกล

หากต้องการเรียกใช้การเริ่มต้นใช้งานผ่านการตั้งค่า:

```bash
openclaw setup --wizard
```

หมายเหตุ:

- `openclaw setup` แบบธรรมดาจะเริ่มต้นการกำหนดค่าและพื้นที่ทำงานโดยไม่ใช้โฟลว์การเริ่มต้นใช้งานแบบเต็ม
- หลังจากตั้งค่าแบบธรรมดาแล้ว ให้เรียกใช้ `openclaw configure` เพื่อเลือกโมเดล แชนเนล Gateway, Plugin, Skills หรือการตรวจสอบสุขภาพ
- การเริ่มต้นใช้งานจะทำงานอัตโนมัติเมื่อมีแฟล็กการเริ่มต้นใช้งานใด ๆ (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`)
- หากตรวจพบสถานะ Hermes การเริ่มต้นใช้งานแบบโต้ตอบสามารถเสนอการย้ายข้อมูลโดยอัตโนมัติได้ การเริ่มต้นใช้งานแบบนำเข้าต้องใช้การตั้งค่าใหม่ ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผน dry-run การสำรองข้อมูล และโหมดเขียนทับภายนอกการเริ่มต้นใช้งาน

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [ภาพรวมการติดตั้ง](/th/install)
