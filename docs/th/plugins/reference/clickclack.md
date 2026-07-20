---
read_when:
    - คุณกำลังติดตั้ง กำหนดค่า หรือตรวจสอบ Plugin clickclack
summary: เพิ่มช่องทาง Clickclack สำหรับส่งและรับข้อความ OpenClaw
title: Plugin Clickclack
x-i18n:
    generated_at: "2026-07-20T06:01:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: e59a11826dfc14a7c6945930547804b10e9cb5144d9cdb75657be9f8f4e9129f
    source_path: plugins/reference/clickclack.md
    workflow: 16
---

# Plugin Clickclack

เพิ่มพื้นผิวช่องทาง Clickclack สำหรับส่งและรับข้อความ OpenClaw

## การเผยแพร่

- แพ็กเกจ: `@openclaw/clickclack`
- ช่องทางการติดตั้ง: npm; ClawHub: `clawhub:@openclaw/clickclack`

## พื้นผิว

ช่องทาง: `clickclack`

Plugin สามารถสร้างช่องทาง ClickClack ที่ซิงโครไนซ์กับวงจรชีวิตสำหรับแต่ละเซสชัน OpenClaw ได้ตามต้องการ ช่องทางการสนทนาที่มีการจัดการจะใช้เซสชันย่อยของเอเจนต์เดียวกันสำหรับการสังเกตการณ์และการส่งต่อ ขณะที่เซสชันหลักที่แนบอยู่จะได้รับเครื่องมือ `discussion` แบบดึงข้อมูลอย่างเดียว ดูข้อกำหนดด้านการกำหนดค่าและการมองเห็นเครื่องมือของเซสชันได้ที่ [การสนทนาของเซสชัน ClickClack](/th/channels/clickclack#session-discussions)

## เอกสารที่เกี่ยวข้อง

- [clickclack](/th/channels/clickclack)
