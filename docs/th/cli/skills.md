---
read_when:
    - คุณต้องการดูว่า Skills ใดพร้อมใช้งานและพร้อมเรียกใช้
    - คุณต้องการค้นหา ติดตั้ง หรืออัปเดต Skills จาก ClawHub
    - คุณต้องการดีบักไบนารี/สภาพแวดล้อม/การกำหนดค่าที่ขาดหายสำหรับ Skills
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw skills` (search/install/update/list/info/check)
title: Skills
x-i18n:
    generated_at: "2026-04-30T09:45:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5059bf04c68dabe289d2c376407a52989c970e3d16e7637a2c83f4e24ad6564c
    source_path: cli/skills.md
    workflow: 16
---

# `openclaw skills`

ตรวจสอบ Skills ภายในเครื่อง และติดตั้ง/อัปเดต Skills จาก ClawHub

ที่เกี่ยวข้อง:

- ระบบ Skills: [Skills](/th/tools/skills)
- การกำหนดค่า Skills: [การกำหนดค่า Skills](/th/tools/skills-config)
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
openclaw skills check --json
openclaw skills check --agent <id>
```

`search`/`install`/`update` ใช้ ClawHub โดยตรงและติดตั้งลงในไดเรกทอรี `skills/`
ของ workspace ที่ใช้งานอยู่ `list`/`info`/`check` ยังคงตรวจสอบ Skills ภายในเครื่อง
ที่ workspace และการกำหนดค่าปัจจุบันมองเห็นได้ คำสั่งที่อิง workspace
จะแก้หา workspace เป้าหมายจาก `--agent <id>` จากนั้นใช้ไดเรกทอรีทำงานปัจจุบัน
เมื่ออยู่ภายใน workspace ของ agent ที่กำหนดค่าไว้ แล้วจึงใช้ agent เริ่มต้น

คำสั่ง `install` ของ CLI นี้ดาวน์โหลดโฟลเดอร์ Skills จาก ClawHub ส่วนการติดตั้ง
การพึ่งพา Skills ที่อิง Gateway ซึ่งถูกทริกเกอร์จาก onboarding หรือการตั้งค่า Skills
จะใช้เส้นทางคำขอ `skills.install` แยกต่างหากแทน

หมายเหตุ:

- `search [query...]` รับ query แบบไม่บังคับ; ไม่ต้องระบุเพื่อเรียกดูฟีดค้นหา
  เริ่มต้นของ ClawHub
- `search --limit <n>` จำกัดจำนวนผลลัพธ์ที่ส่งคืน
- `install --force` เขียนทับโฟลเดอร์ Skills ใน workspace ที่มีอยู่สำหรับ slug
  เดียวกัน
- `--agent <id>` กำหนดเป้าหมายไปยัง workspace ของ agent ที่กำหนดค่าไว้หนึ่งรายการ
  และแทนที่การอนุมานจากไดเรกทอรีทำงานปัจจุบัน
- `update --all` อัปเดตเฉพาะการติดตั้งจาก ClawHub ที่ติดตามไว้ใน workspace
  ที่ใช้งานอยู่
- `list` เป็นการทำงานเริ่มต้นเมื่อไม่ได้ระบุคำสั่งย่อย
- `list`, `info` และ `check` เขียนเอาต์พุตที่เรนเดอร์แล้วไปยัง stdout เมื่อใช้
  `--json` นั่นหมายความว่า payload ที่เครื่องอ่านได้จะยังอยู่บน stdout สำหรับ pipe
  และสคริปต์

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Skills](/th/tools/skills)
