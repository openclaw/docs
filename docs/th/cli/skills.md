---
read_when:
    - คุณต้องการดูว่า Skills ใดพร้อมใช้งานและพร้อมเรียกใช้
    - คุณต้องการค้นหา ติดตั้ง หรืออัปเดต Skills จาก ClawHub
    - คุณต้องการดีบักไบนารี/env/config ที่ขาดหายไปสำหรับ Skills
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-05-02T20:43:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: d819cdc421151a0093423f57a9e974489e9cc02de644358bd5700ee75181192e
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ตรวจสอบ Skills ภายในเครื่อง และติดตั้ง/อัปเดต Skills จาก ClawHub

ที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- การกำหนดค่า Skills: [Skills config](/th/tools/skills-config)
- การติดตั้งจาก ClawHub: [ClawHub](/th/tools/clawhub)

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
Skills ภายในเครื่องที่เวิร์กสเปซและการกำหนดค่าปัจจุบันมองเห็นได้ คำสั่งที่อิงกับเวิร์กสเปซ
จะระบุเวิร์กสเปซเป้าหมายจาก `--agent <id>` จากนั้นใช้ไดเรกทอรีทำงานปัจจุบัน
เมื่อไดเรกทอรีนั้นอยู่ภายในเวิร์กสเปซของเอเจนต์ที่กำหนดค่าไว้ แล้วจึงใช้
เอเจนต์เริ่มต้น

คำสั่ง CLI `install` นี้ดาวน์โหลดโฟลเดอร์ Skills จาก ClawHub การติดตั้ง
dependency ของ Skills ที่อิงกับ Gateway ซึ่งถูกเรียกจากการเริ่มใช้งานหรือการตั้งค่า Skills จะใช้
เส้นทางคำขอ `skills.install` แยกต่างหากแทน

หมายเหตุ:

- `search [query...]` รับคำค้นหาแบบไม่บังคับ; ละไว้เพื่อเรียกดูฟีดค้นหาเริ่มต้นของ
  ClawHub
- `search --limit <n>` จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `install --force` เขียนทับโฟลเดอร์ Skills ของเวิร์กสเปซที่มีอยู่สำหรับ
  slug เดียวกัน
- `--agent <id>` กำหนดเป้าหมายเป็นเวิร์กสเปซของเอเจนต์ที่กำหนดค่าไว้หนึ่งรายการ และแทนที่การอนุมานจาก
  ไดเรกทอรีทำงานปัจจุบัน
- `update --all` อัปเดตเฉพาะการติดตั้ง ClawHub ที่ติดตามไว้ในเวิร์กสเปซที่ใช้งานอยู่
- `check --agent <id>` ตรวจสอบเวิร์กสเปซของเอเจนต์ที่เลือก และรายงานว่า
  Skills ที่พร้อมใช้งานรายการใดมองเห็นได้จริงในพรอมป์หรืออินเทอร์เฟซคำสั่งของเอเจนต์นั้น
- `list` เป็นการดำเนินการเริ่มต้นเมื่อไม่ได้ระบุคำสั่งย่อย
- `list`, `info` และ `check` เขียนเอาต์พุตที่เรนเดอร์แล้วไปยัง stdout เมื่อใช้
  `--json` หมายความว่า payload ที่เครื่องอ่านได้จะยังคงอยู่บน stdout สำหรับ pipe
  และสคริปต์

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Skills](/th/tools/skills)
