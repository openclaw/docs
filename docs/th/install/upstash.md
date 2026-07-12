---
read_when:
    - การติดตั้งใช้งาน OpenClaw บน Upstash Box
    - คุณต้องการสภาพแวดล้อม Linux ที่มีการจัดการสำหรับ OpenClaw พร้อมการเข้าถึงแดชบอร์ดผ่านอุโมงค์ SSH
summary: โฮสต์ OpenClaw บน Upstash Box พร้อมการคงการเชื่อมต่อและการเข้าถึงผ่านอุโมงค์ SSH
title: กล่อง Upstash
x-i18n:
    generated_at: "2026-07-12T16:17:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 29232c43e0e4940b7445ab8896c9ccd3e81d0fdbdd522d7f50cb8c8057ac18f0
    source_path: install/upstash.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน Upstash Box ซึ่งเป็นสภาพแวดล้อม Linux ที่มีการจัดการ
และรองรับวงจรการทำงานแบบคงสถานะการทำงาน

ใช้ทันเนล SSH เพื่อเข้าถึงแดชบอร์ด ห้ามเปิดเผยพอร์ต Gateway โดยตรง
ต่ออินเทอร์เน็ตสาธารณะ

## ข้อกำหนดเบื้องต้น

- บัญชี Upstash
- Upstash Box แบบคงสถานะการทำงาน
- ไคลเอนต์ SSH บนเครื่องภายในของคุณ

## สร้าง Box

สร้าง Box แบบคงสถานะการทำงานใน Upstash Console จด ID ของ Box (ตัวอย่างเช่น
`right-flamingo-14486`) และคีย์ API ของ Box

Upstash ดูแลคู่มือแนะนำ OpenClaw Box ฉบับปัจจุบันไว้ที่
[การตั้งค่า OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup)

## เชื่อมต่อด้วยทันเนล SSH

ส่งต่อพอร์ตแดชบอร์ด OpenClaw มายังเครื่องภายในของคุณ ใช้คีย์ API ของ Box
เป็นรหัสผ่าน SSH เมื่อระบบแจ้งให้ป้อน:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

ตัวเลือกการคงการเชื่อมต่อช่วยลดปัญหาทันเนลหลุดขณะไม่มีการใช้งานในระหว่างการเริ่มต้นใช้งาน

## ติดตั้ง OpenClaw

ภายใน Box:

```bash
sudo npm install -g openclaw
```

## เรียกใช้การเริ่มต้นใช้งาน

```bash
openclaw onboard --install-daemon
```

ดำเนินการตามข้อความแจ้ง เมื่อการเริ่มต้นใช้งานเสร็จสิ้น ให้คัดลอก URL และโทเค็นของแดชบอร์ด

## เริ่ม Gateway

กำหนดค่า Gateway สำหรับเครือข่ายของ Box และเริ่มทำงานในเบื้องหลัง:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

ขณะที่ทันเนล SSH ทำงานอยู่ ให้เปิด URL ของแดชบอร์ดบนเครื่องภายใน:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## เริ่มใหม่โดยอัตโนมัติ

ตั้งค่าคำสั่งนี้เป็นสคริปต์เริ่มต้นของ Box เพื่อให้ Gateway เริ่มใหม่เมื่อ Box
เริ่มทำงาน:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## การแก้ไขปัญหา

หาก SSH ค้างระหว่างการเริ่มต้นใช้งาน ให้เชื่อมต่อใหม่โดยใช้การกำหนดค่า SSH ที่ไม่มีการตั้งค่าเพิ่มเติม
และตัวเลือกการคงการเชื่อมต่อ:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

วิธีนี้จะข้ามการตั้งค่าที่ล้าสมัยใน `~/.ssh/config` ภายในเครื่อง และทำให้ทันเนลยังคงทำงาน
ในช่วงที่เครือข่ายไม่มีการรับส่งข้อมูล

## เนื้อหาที่เกี่ยวข้อง

- [การเข้าถึงจากระยะไกล](/th/gateway/remote)
- [ความปลอดภัยของ Gateway](/th/gateway/security)
- [การอัปเดต OpenClaw](/th/install/updating)
