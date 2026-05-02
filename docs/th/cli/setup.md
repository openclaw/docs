---
read_when:
    - คุณกำลังตั้งค่าการใช้งานครั้งแรกโดยไม่มีการเริ่มต้นใช้งาน CLI แบบเต็ม
    - คุณต้องการตั้งค่าเส้นทางพื้นที่ทำงานเริ่มต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้นการกำหนดค่า + พื้นที่ทำงาน)
title: การตั้งค่า
x-i18n:
    generated_at: "2026-05-02T20:42:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 805f60c81f5fc216fc446641efe0bcb60bb6c34b3a50a6fc9e767461206e5f90
    source_path: cli/setup.md
    workflow: 16
---

# `openclaw setup`

เริ่มต้น `~/.openclaw/openclaw.json` และพื้นที่ทำงานของเอเจนต์

ที่เกี่ยวข้อง:

- เริ่มต้นใช้งาน: [เริ่มต้นใช้งาน](/th/start/getting-started)
- การเริ่มใช้งาน CLI: [การเริ่มใช้งาน (CLI)](/th/start/wizard)

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
- `--wizard`: เรียกใช้การเริ่มใช้งาน
- `--non-interactive`: เรียกใช้การเริ่มใช้งานโดยไม่มีพรอมต์
- `--mode <local|remote>`: โหมดการเริ่มใช้งาน
- `--import-from <provider>`: ผู้ให้บริการการย้ายข้อมูลที่จะเรียกใช้ระหว่างการเริ่มใช้งาน
- `--import-source <path>`: โฮมของเอเจนต์ต้นทางสำหรับ `--import-from`
- `--import-secrets`: นำเข้าข้อมูลลับที่รองรับระหว่างการย้ายข้อมูลในการเริ่มใช้งาน
- `--remote-url <url>`: URL WebSocket ของ Gateway ระยะไกล
- `--remote-token <token>`: โทเค็น Gateway ระยะไกล

หากต้องการเรียกใช้การเริ่มใช้งานผ่าน setup:

```bash
openclaw setup --wizard
```

หมายเหตุ:

- `openclaw setup` แบบธรรมดาจะเริ่มต้นการกำหนดค่าและพื้นที่ทำงานโดยไม่เรียกใช้โฟลว์การเริ่มใช้งานแบบเต็ม
- หลังจาก setup แบบธรรมดา ให้เรียกใช้ `openclaw configure` เพื่อเลือกโมเดล ช่องทาง Gateway, Plugin, Skills หรือการตรวจสอบสถานะ
- การเริ่มใช้งานจะทำงานโดยอัตโนมัติเมื่อมีแฟล็กการเริ่มใช้งานใด ๆ (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`)
- หากตรวจพบสถานะ Hermes การเริ่มใช้งานแบบโต้ตอบสามารถเสนอการย้ายข้อมูลโดยอัตโนมัติได้ การเริ่มใช้งานแบบนำเข้าต้องใช้ setup ใหม่ทั้งหมด ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผน dry-run การสำรองข้อมูล และโหมดเขียนทับนอกการเริ่มใช้งาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [ภาพรวมการติดตั้ง](/th/install)
