---
read_when:
    - คุณต้องการการเติมคำสั่งเชลล์อัตโนมัติสำหรับ zsh/bash/fish/PowerShell
    - คุณต้องแคชสคริปต์การเติมคำอัตโนมัติไว้ภายใต้สถานะของ OpenClaw
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw completion` (สร้าง/ติดตั้งสคริปต์เติมคำอัตโนมัติของเชลล์)
title: การเติมคำอัตโนมัติ
x-i18n:
    generated_at: "2026-07-12T15:58:19Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 67cb52a47036745150887c752d18e2dfa84fab2722c27c696142d23080bb2efd
    source_path: cli/completion.md
    workflow: 16
---

# `openclaw completion`

สร้างสคริปต์การเติมคำสั่งอัตโนมัติสำหรับเชลล์ แคชไว้ในสถานะของ OpenClaw และเลือกติดตั้งลงในโปรไฟล์เชลล์ของคุณได้

## การใช้งาน

```bash
openclaw completion                          # แสดงสคริปต์ zsh ไปยัง stdout
openclaw completion --shell fish             # แสดงสคริปต์ fish
openclaw completion --write-state            # แคชสคริปต์สำหรับเชลล์ทั้งหมด
openclaw completion --write-state --install  # แคช แล้วติดตั้งในขั้นตอนเดียว
openclaw completion --shell bash --write-state
```

## ตัวเลือก

- `-s, --shell <shell>`: เชลล์เป้าหมาย (`zsh`, `bash`, `powershell`, `fish`; ค่าเริ่มต้น: `zsh`)
- `-i, --install`: ติดตั้งการเติมคำสั่งอัตโนมัติโดยเพิ่มบรรทัด source สำหรับสคริปต์ที่แคชไว้ลงในโปรไฟล์เชลล์ของคุณ
- `--write-state`: เขียนสคริปต์การเติมคำสั่งอัตโนมัติไปยัง `$OPENCLAW_STATE_DIR/completions` (ค่าเริ่มต้น `~/.openclaw/completions`) โดยไม่แสดงไปยัง stdout เมื่อใช้ร่วมกับ `--shell` จะเขียนเฉพาะเชลล์นั้น มิฉะนั้นจะเขียนทั้งสี่เชลล์
- `-y, --yes`: ข้ามข้อความแจ้งยืนยันการติดตั้ง (แบบไม่โต้ตอบ)

## ขั้นตอนการติดตั้ง

`--install` กำหนดให้โปรไฟล์ของคุณอ้างอิงสคริปต์ที่แคชไว้ ดังนั้นแคชต้องมีอยู่ก่อน หากไม่มี คำสั่งจะล้มเหลวและแจ้งให้คุณเรียกใช้ `openclaw completion --write-state` ใช้ `--write-state --install` ร่วมกันเพื่อดำเนินการทั้งสองอย่างในขั้นตอนเดียว หากไม่มี `--shell` ตัวเลือก `--install` จะตรวจหาเชลล์จาก `$SHELL` (และใช้ zsh เป็นทางเลือกสำรอง)

การติดตั้งจะเขียนบล็อก `# OpenClaw Completion` ขนาดเล็กลงในโปรไฟล์เชลล์ของคุณ และแทนที่บรรทัด `source <(openclaw completion ...)` แบบเก่าที่ทำงานช้าด้วยบรรทัด source ที่อ้างอิงแคช:

| เชลล์      | โปรไฟล์                                                                                                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bash       | `~/.bashrc` (ใช้ `~/.bash_profile` เป็นทางเลือกสำรองเมื่อไม่มี `~/.bashrc`)                                                                                                                  |
| fish       | `~/.config/fish/config.fish`                                                                                                                                                               |
| powershell | `~/.config/powershell/Microsoft.PowerShell_profile.ps1` (บน Windows: `Documents/PowerShell/Microsoft.PowerShell_profile.ps1` หรือ `Documents/WindowsPowerShell/...` สำหรับ Windows PowerShell) |
| zsh        | `~/.zshrc`                                                                                                                                                                                 |

## หมายเหตุ

- หากไม่มี `--install` หรือ `--write-state` คำสั่งจะแสดงสคริปต์ไปยัง stdout
- การสร้างการเติมคำสั่งอัตโนมัติจะโหลดโครงสร้างคำสั่งทั้งหมดทันที รวมถึงคำสั่ง CLI ของ Plugin จึงครอบคลุมคำสั่งย่อยแบบซ้อนด้วย
- `openclaw update` จะรีเฟรชแคชการเติมคำสั่งอัตโนมัติโดยอัตโนมัติหลังจากอัปเดตสำเร็จ ส่วน `openclaw doctor` สามารถซ่อมแซมการตั้งค่าการเติมคำสั่งอัตโนมัติที่ขาดหายหรือล้าสมัยได้

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
