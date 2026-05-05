---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin WhatsApp
summary: เพิ่มอินเทอร์เฟซช่องทาง WhatsApp สำหรับการส่งและรับข้อความ OpenClaw
title: Plugin WhatsApp
x-i18n:
    generated_at: "2026-05-05T06:18:44Z"
    model: gpt-5.5
    provider: openai
    source_hash: a0fa274f7e937894a070abd9307aa12eed17b27275bc7e5cfc432f8a41373c54
    source_path: plugins/reference/whatsapp.md
    workflow: 16
---

# Plugin WhatsApp

เพิ่มพื้นผิวช่องทาง WhatsApp สำหรับส่งและรับข้อความ OpenClaw

## การเผยแพร่

- แพ็กเกจ: `@openclaw/whatsapp`
- เส้นทางการติดตั้ง: npm; ClawHub

## พื้นผิว

channels: whatsapp

## หมายเหตุการติดตั้งบน Windows

บน Windows, Plugin WhatsApp ต้องใช้ Git บน `PATH` ระหว่างการติดตั้ง npm เพราะหนึ่งใน dependency ของ Baileys/libsignal ถูกดึงมาจาก URL ของ git ติดตั้ง Git for Windows จากนั้นรีสตาร์ท shell แล้วเรียกใช้การติดตั้งอีกครั้ง:

```powershell
winget install --id Git.Git -e
```

Portable Git ใช้งานได้เช่นกันหากไดเรกทอรี `bin` ของมันอยู่บน `PATH`

## เอกสารที่เกี่ยวข้อง

- [whatsapp](/th/channels/whatsapp)
