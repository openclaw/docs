---
read_when:
    - คุณต้องการการค้นหาในเครือข่ายบริเวณกว้าง (DNS-SD) ผ่าน Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw dns` (ตัวช่วยการค้นหาในเครือข่ายบริเวณกว้าง)
title: DNS
x-i18n:
    generated_at: "2026-07-12T15:58:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: bb07353df03f9d169e1aede2da0b711ffb68e8c9d21d51359e93e92cc0818ca2
    source_path: cli/dns.md
    workflow: 16
---

# `openclaw dns`

เครื่องมือช่วย DNS สำหรับการค้นหาในเครือข่ายบริเวณกว้าง (Tailscale + CoreDNS) ปัจจุบันรองรับเฉพาะ macOS + Homebrew CoreDNS

เนื้อหาที่เกี่ยวข้อง:

- การค้นหา Gateway: [การค้นหา](/th/gateway/discovery)
- การกำหนดค่าการค้นหาในเครือข่ายบริเวณกว้าง: [การกำหนดค่า](/th/gateway/configuration)

## `dns setup`

วางแผนหรือนำการตั้งค่า CoreDNS ไปใช้สำหรับการค้นหาด้วย DNS-SD แบบยูนิแคสต์

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

| ตัวเลือก             | ผลลัพธ์                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| `--domain <domain>` | โดเมนสำหรับการค้นหาในเครือข่ายบริเวณกว้าง (ตัวอย่างเช่น `openclaw.internal`)                      |
| `--apply`           | ติดตั้ง/อัปเดตการกำหนดค่า CoreDNS และเริ่มบริการ (ใหม่) ต้องใช้ sudo และรองรับเฉพาะ macOS เท่านั้น |

หากไม่มี `--domain` OpenClaw จะใช้ `discovery.wideArea.domain` จากการกำหนดค่า

หากไม่มี `--apply` คำสั่งจะแสดงเฉพาะข้อมูลต่อไปนี้:

- โดเมนการค้นหาที่แปลงค่าแล้วและพาธไฟล์โซน
- IP ของ tailnet ปัจจุบัน
- การกำหนดค่าการค้นหาที่แนะนำสำหรับ `openclaw.json`
- ค่าเนมเซิร์ฟเวอร์/โดเมนของ Split DNS ใน Tailscale ที่ต้องตั้งค่าในคอนโซลผู้ดูแลระบบ Tailscale

เมื่อใช้ `--apply` (เฉพาะ macOS และต้องมี Homebrew CoreDNS):

- สร้างไฟล์โซนเริ่มต้นหากยังไม่มี
- เพิ่มส่วนคำสั่ง import ของ CoreDNS หากยังไม่มี
- เริ่มบริการ brew `coredns` ใหม่

## เนื้อหาที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การค้นหา](/th/gateway/discovery)
