---
read_when:
    - คุณกำลังทำการตั้งค่าครั้งแรกโดยไม่มีการเริ่มต้นใช้งาน CLI แบบเต็ม
    - คุณต้องการตั้งค่าเส้นทางเวิร์กสเปซเริ่มต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw setup` (เริ่มต้นการกำหนดค่า + พื้นที่ทำงาน)
title: การตั้งค่า
x-i18n:
    generated_at: "2026-04-30T09:45:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 68e5c07a6b1769420c2125677f3eda9bd4841c938b4fc62583c5bed2a2596250
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
- `--non-interactive`: เรียกใช้การเริ่มใช้งานโดยไม่มีพรอมป์
- `--mode <local|remote>`: โหมดการเริ่มใช้งาน
- `--import-from <provider>`: ผู้ให้บริการการย้ายข้อมูลที่จะเรียกใช้ระหว่างการเริ่มใช้งาน
- `--import-source <path>`: โฮมของเอเจนต์ต้นทางสำหรับ `--import-from`
- `--import-secrets`: นำเข้าข้อมูลลับที่รองรับระหว่างการย้ายข้อมูลในการเริ่มใช้งาน
- `--remote-url <url>`: URL WebSocket ของ Gateway ระยะไกล
- `--remote-token <token>`: โทเค็น Gateway ระยะไกล

หากต้องการเรียกใช้การเริ่มใช้งานผ่านการตั้งค่า:

```bash
openclaw setup --wizard
```

หมายเหตุ:

- `openclaw setup` แบบธรรมดาจะเริ่มต้น config + พื้นที่ทำงานโดยไม่ใช้โฟลว์การเริ่มใช้งานเต็มรูปแบบ
- การเริ่มใช้งานจะรันโดยอัตโนมัติเมื่อมีแฟล็กการเริ่มใช้งานใด ๆ (`--wizard`, `--non-interactive`, `--mode`, `--import-from`, `--import-source`, `--import-secrets`, `--remote-url`, `--remote-token`)
- หากตรวจพบสถานะ Hermes การเริ่มใช้งานแบบโต้ตอบสามารถเสนอการย้ายข้อมูลโดยอัตโนมัติ การเริ่มใช้งานแบบนำเข้าต้องใช้การตั้งค่าใหม่ทั้งหมด ใช้ [ย้ายข้อมูล](/th/cli/migrate) สำหรับแผนการรันทดลอง การสำรองข้อมูล และโหมดเขียนทับนอกการเริ่มใช้งาน

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [ภาพรวมการติดตั้ง](/th/install)
