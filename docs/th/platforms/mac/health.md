---
read_when:
    - การดีบักตัวบ่งชี้สุขภาพของแอป macOS
summary: วิธีที่แอป macOS รายงานสถานะสุขภาพของ gateway/Baileys
title: Health checks (macOS)
x-i18n:
    generated_at: "2026-04-24T09:21:50Z"
    model: gpt-5.4
    provider: openai
    source_hash: a7488b39b0eec013083f52e2798d719bec35780acad743a97f5646a6891810e5
    source_path: platforms/mac/health.md
    workflow: 15
    postprocess_version: locale-links-v1
---

# Health Checks บน macOS

วิธีดูว่าช่องทางที่เชื่อมต่ออยู่ยังทำงานปกติหรือไม่จากแอปบน menu bar

## Menu bar

- จุดแสดงสถานะตอนนี้สะท้อนสุขภาพของ Baileys:
  - สีเขียว: เชื่อมต่อแล้ว + socket เพิ่งเปิดเมื่อไม่นานมานี้
  - สีส้ม: กำลังเชื่อมต่อ/พยายามใหม่
  - สีแดง: ออกจากระบบแล้วหรือ probe ล้มเหลว
- บรรทัดรองจะแสดง "linked · auth 12m" หรือแสดงเหตุผลของความล้มเหลว
- รายการเมนู "Run Health Check" จะเรียก probe แบบตามต้องการ

## Settings

- แท็บ General มีการ์ด Health ที่แสดง: อายุ auth ของการเชื่อมต่อ, path/count ของ session-store, เวลา last check, last error/status code และปุ่มสำหรับ Run Health Check / Reveal Logs
- ใช้ snapshot ที่แคชไว้เพื่อให้ UI โหลดได้ทันที และย้อนกลับอย่างนุ่มนวลเมื่อออฟไลน์
- **แท็บ Channels** แสดงสถานะช่องทาง + controls สำหรับ WhatsApp/Telegram (login QR, logout, probe, last disconnect/error)

## Probe ทำงานอย่างไร

- แอปรัน `openclaw health --json` ผ่าน `ShellExecutor` ทุกประมาณ ~60 วินาทีและตามต้องการ probe จะโหลด creds และรายงานสถานะโดยไม่ส่งข้อความ
- แคช last good snapshot และ last error แยกกันเพื่อหลีกเลี่ยงการกะพริบ และแสดง timestamp ของแต่ละรายการ

## เมื่อไม่แน่ใจ

- คุณยังสามารถใช้โฟลว์ CLI ใน [Gateway health](/th/gateway/health) (`openclaw status`, `openclaw status --deep`, `openclaw health --json`) และ tail `/tmp/openclaw/openclaw-*.log` เพื่อดู `web-heartbeat` / `web-reconnect`

## ที่เกี่ยวข้อง

- [Gateway health](/th/gateway/health)
- [แอป macOS](/th/platforms/macos)
