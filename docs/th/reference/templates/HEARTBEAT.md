---
read_when:
    - การตั้งค่าเวิร์กสเปซเริ่มต้นด้วยตนเอง
summary: เทมเพลตพื้นที่ทำงานสำหรับ HEARTBEAT.md
title: เทมเพลต HEARTBEAT.md
x-i18n:
    generated_at: "2026-06-27T18:22:05Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 44a1ea787d67110ca53d752706b62f5ce5c4df8637897dee97ce6502f6a05eb6
    source_path: reference/templates/HEARTBEAT.md
    workflow: 16
---

# เทมเพลต HEARTBEAT.md

`HEARTBEAT.md` อยู่ในพื้นที่ทำงานของเอเจนต์ ปล่อยไฟล์ให้ว่างไว้ หรือมีเฉพาะคอมเมนต์และหัวเรื่อง Markdown เมื่อคุณต้องการให้ OpenClaw ข้ามการเรียกโมเดล Heartbeat

เทมเพลตรันไทม์เริ่มต้นคือ:

```markdown
# Keep this file empty (or with only comments) to skip heartbeat API calls.

# Add tasks below when you want the agent to check something periodically.
```

เพิ่มงานสั้น ๆ ไว้ใต้คอมเมนต์เฉพาะเมื่อคุณต้องการให้เอเจนต์ตรวจสอบบางอย่างเป็นระยะเท่านั้น เขียนคำสั่ง Heartbeat ให้สั้น เพราะคำสั่งเหล่านี้จะถูกอ่านระหว่างการปลุกซ้ำ

## ที่เกี่ยวข้อง

- [การกำหนดค่า Heartbeat](/th/gateway/config-agents)
