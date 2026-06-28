---
read_when:
    - คุณต้องการการค้นหาแบบครอบคลุมพื้นที่กว้าง (DNS-SD) ผ่าน Tailscale + CoreDNS
    - You're setting up split DNS for a custom discovery domain (example: openclaw.internal)
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw dns` (ตัวช่วยการค้นพบแบบพื้นที่กว้าง)
title: DNS
x-i18n:
    generated_at: "2026-05-06T09:05:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 460bdcbaa2c0c0fc1a4f5bdd76b904d8ac35195a25324c66421abfdc2044bb07
    source_path: cli/dns.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# `openclaw dns`

ตัวช่วย DNS สำหรับการค้นพบแบบพื้นที่กว้าง (Tailscale + CoreDNS) ปัจจุบันมุ่งเน้นที่ macOS + Homebrew CoreDNS

ที่เกี่ยวข้อง:

- การค้นพบ Gateway: [การค้นพบ](/th/gateway/discovery)
- การกำหนดค่าการค้นพบแบบพื้นที่กว้าง: [การกำหนดค่า](/th/gateway/configuration)

## การตั้งค่า

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

วางแผนหรือนำการตั้งค่า CoreDNS ไปใช้สำหรับการค้นพบ DNS-SD แบบ unicast

ตัวเลือก:

- `--domain <domain>`: โดเมนการค้นพบแบบพื้นที่กว้าง (เช่น `openclaw.internal`)
- `--apply`: ติดตั้งหรืออัปเดตการกำหนดค่า CoreDNS แล้วรีสตาร์ทบริการ (ต้องใช้ sudo; เฉพาะ macOS)

สิ่งที่แสดง:

- โดเมนการค้นพบที่แก้ค่าแล้ว
- เส้นทางไฟล์โซน
- IP ของ tailnet ปัจจุบัน
- การกำหนดค่า discovery ของ `openclaw.json` ที่แนะนำ
- ค่า nameserver/domain ของ Tailscale Split DNS ที่ต้องตั้งค่า

หมายเหตุ:

- หากไม่มี `--apply` คำสั่งนี้เป็นเพียงตัวช่วยวางแผนและพิมพ์การตั้งค่าที่แนะนำ
- หากละ `--domain` ไว้ OpenClaw จะใช้ `discovery.wideArea.domain` จากการกำหนดค่า
- ปัจจุบัน `--apply` รองรับเฉพาะ macOS และคาดว่าจะใช้ Homebrew CoreDNS
- `--apply` จะเริ่มต้นไฟล์โซนหากจำเป็น ตรวจให้แน่ใจว่ามี stanza สำหรับ import ของ CoreDNS อยู่ และรีสตาร์ทบริการ brew `coredns`

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การค้นพบ](/th/gateway/discovery)
