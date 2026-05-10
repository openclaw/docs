---
read_when:
    - คุณต้องการดูว่า Skills ใดมีให้ใช้งานและพร้อมเรียกใช้
    - คุณต้องการค้นหา ติดตั้ง หรืออัปเดต Skills จาก ClawHub
    - คุณต้องการดีบักไบนารี/env/config ที่ขาดหายไปสำหรับ Skills
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-10T19:31:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90663068f51cd3aabe9cfcf60e319ce9f9016e338488797869162608132a9e87
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ตรวจสอบ Skills ในเครื่อง และติดตั้ง/อัปเดต Skills จาก ClawHub

ที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- การกำหนดค่า Skills: [Skills config](/th/tools/skills-config)
- การติดตั้ง ClawHub: [ClawHub](/th/clawhub/cli)

## คำสั่ง

```bash
openclaw skills search "calendar"
openclaw skills search --limit 20 --json
openclaw skills install <slug>
openclaw skills install <slug> --version <version>
openclaw skills install <slug> --force
openclaw skills install <slug> --agent <id>
openclaw skills update <slug>
openclaw skills update --all
openclaw skills update --all --agent <id>
openclaw skills list
openclaw skills list --eligible
openclaw skills list --json
openclaw skills list --verbose
openclaw skills list --agent <id>
openclaw skills info <name>
openclaw skills info <name> --json
openclaw skills info <name> --agent <id>
openclaw skills check
openclaw skills check --agent <id>
openclaw skills check --json
```

`search`/`install`/`update` ใช้ ClawHub โดยตรง และติดตั้งลงในไดเรกทอรี
`skills/` ของเวิร์กสเปซที่ใช้งานอยู่ `list`/`info`/`check` ยังคงตรวจสอบ
Skills ในเครื่องที่มองเห็นได้สำหรับเวิร์กสเปซและการกำหนดค่าปัจจุบัน คำสั่งที่มี
เวิร์กสเปซรองรับจะระบุเวิร์กสเปซเป้าหมายจาก `--agent <id>` จากนั้นจึงใช้ไดเรกทอรี
ทำงานปัจจุบันเมื่ออยู่ภายในเวิร์กสเปซของเอเจนต์ที่กำหนดค่าไว้ แล้วจึงใช้เอเจนต์
เริ่มต้น

คำสั่ง CLI `install` นี้ดาวน์โหลดโฟลเดอร์ Skills จาก ClawHub การติดตั้ง
การพึ่งพาของ Skills ที่รองรับโดย Gateway ซึ่งถูกทริกเกอร์จากการเริ่มใช้งานหรือ
การตั้งค่า Skills จะใช้เส้นทางคำขอ `skills.install` แยกต่างหากแทน

หมายเหตุ:

- `search [query...]` รับคำค้นหาที่ไม่บังคับ ระบุได้; ละไว้เพื่อเรียกดูฟีดค้นหา
  ClawHub เริ่มต้น
- `search --limit <n>` จำกัดจำนวนผลลัพธ์ที่ส่งกลับ
- `install --force` เขียนทับโฟลเดอร์ Skills ของเวิร์กสเปซที่มีอยู่สำหรับ
  slug เดียวกัน
- `--agent <id>` กำหนดเป้าหมายไปยังเวิร์กสเปซของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ
  และแทนที่การอนุมานจากไดเรกทอรีทำงานปัจจุบัน
- `update --all` อัปเดตเฉพาะการติดตั้ง ClawHub ที่ถูกติดตามในเวิร์กสเปซที่ใช้งานอยู่
- `check --agent <id>` ตรวจสอบเวิร์กสเปซของเอเจนต์ที่เลือก และรายงานว่า
  Skills ที่พร้อมใช้งานใดมองเห็นได้จริงบนพื้นผิวพรอมป์หรือคำสั่งของเอเจนต์นั้น
- `list` เป็นการดำเนินการเริ่มต้นเมื่อไม่ได้ระบุคำสั่งย่อย
- `list`, `info` และ `check` เขียนเอาต์พุตที่เรนเดอร์แล้วไปยัง stdout เมื่อใช้
  `--json` หมายความว่าเพย์โหลดที่เครื่องอ่านได้จะคงอยู่บน stdout สำหรับไพป์
  และสคริปต์

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
- [Skills](/th/tools/skills)
