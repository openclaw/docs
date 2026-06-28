---
read_when:
    - คุณต้องการ shell completions สำหรับ zsh/bash/fish/PowerShell
    - คุณต้องการแคชสคริปต์ completion ไว้ภายใต้สถานะของ OpenClaw
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw completion` (สร้าง/ติดตั้งสคริปต์ shell completion)
title: Completion
x-i18n:
    generated_at: "2026-04-24T09:02:26Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9d064723b97f09105154197e4ef35b98ccb61e4b775f3fd990b18958f751f713
    source_path: cli/completion.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# `openclaw completion`

สร้างสคริปต์ shell completion และเลือกติดตั้งลงในโปรไฟล์ shell ของคุณได้

## การใช้งาน

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## ตัวเลือก

- `-s, --shell <shell>`: shell เป้าหมาย (`zsh`, `bash`, `powershell`, `fish`; ค่าเริ่มต้น: `zsh`)
- `-i, --install`: ติดตั้ง completion โดยเพิ่มบรรทัด source ลงในโปรไฟล์ shell ของคุณ
- `--write-state`: เขียนสคริปต์ completion ลงใน `$OPENCLAW_STATE_DIR/completions` โดยไม่พิมพ์ไปยัง stdout
- `-y, --yes`: ข้ามข้อความยืนยันการติดตั้ง

## หมายเหตุ

- `--install` จะเขียนบล็อก "OpenClaw Completion" ขนาดเล็กลงในโปรไฟล์ shell ของคุณ และชี้ไปยังสคริปต์ที่แคชไว้
- หากไม่ใช้ `--install` หรือ `--write-state` คำสั่งจะพิมพ์สคริปต์ไปยัง stdout
- การสร้าง completion จะโหลดโครงสร้างคำสั่งแบบ eager เพื่อให้รวม subcommands ที่ซ้อนอยู่ด้วย

## ที่เกี่ยวข้อง

- [CLI reference](/th/cli)
