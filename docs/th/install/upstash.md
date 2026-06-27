---
read_when:
    - การปรับใช้ OpenClaw ไปยัง Upstash Box
    - คุณต้องการสภาพแวดล้อม Linux ที่มีการจัดการสำหรับ OpenClaw พร้อมการเข้าถึงแดชบอร์ดผ่านอุโมงค์ SSH
summary: โฮสต์ OpenClaw บน Upstash Box พร้อม keep-alive และการเข้าถึงผ่าน SSH tunnel
title: กล่อง Upstash
x-i18n:
    generated_at: "2026-06-27T17:45:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 06d2eb41e1beb0ab3145baa861e0bee7e3efef20324dc4e0e82ba08910937d20
    source_path: install/upstash.md
    workflow: 16
---

เรียกใช้ OpenClaw Gateway แบบถาวรบน Upstash Box ซึ่งเป็นสภาพแวดล้อม Linux แบบจัดการ
พร้อมรองรับวงจรชีวิตแบบ keep-alive

ใช้ SSH tunnel สำหรับการเข้าถึงแดชบอร์ด อย่าเปิดเผยพอร์ต Gateway โดยตรง
สู่สาธารณะบนอินเทอร์เน็ต

## ข้อกำหนดเบื้องต้น

- บัญชี Upstash
- Upstash Box แบบ keep-alive
- ไคลเอนต์ SSH บนเครื่องภายในของคุณ

## สร้าง Box

สร้าง Box แบบ keep-alive ใน Upstash Console จด Box ID เช่น
`right-flamingo-14486` และ Box API key ของคุณไว้

Upstash ดูแลคำแนะนำ OpenClaw Box ปัจจุบันไว้ที่
[การตั้งค่า OpenClaw](https://upstash.com/docs/box/guides/openclaw-setup)

## เชื่อมต่อด้วย SSH tunnel

ส่งต่อพอร์ตแดชบอร์ด OpenClaw มายังเครื่องภายในของคุณ ใช้ Box API key ของคุณ
เป็นรหัสผ่าน SSH เมื่อระบบแจ้ง:

```bash
ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

ตัวเลือก keepalive ช่วยลดการหลุดของ tunnel เมื่อไม่ได้ใช้งานระหว่างการเริ่มต้นใช้งาน

## ติดตั้ง OpenClaw

ภายใน Box:

```bash
sudo npm install -g openclaw
```

## เรียกใช้การเริ่มต้นใช้งาน

```bash
openclaw onboard --install-daemon
```

ทำตามพรอมป์ คัดลอก URL แดชบอร์ดและโทเค็นเมื่อการเริ่มต้นใช้งานเสร็จสิ้น

## เริ่ม Gateway

กำหนดค่า Gateway สำหรับเครือข่าย Box และเริ่มทำงานในเบื้องหลัง:

```bash
openclaw config set gateway.bind lan
nohup openclaw gateway > gateway.log 2>&1 &
```

เมื่อ SSH tunnel ทำงานอยู่ ให้เปิด URL แดชบอร์ดในเครื่อง:

```text
http://127.0.0.1:18789/#token=<your-token>
```

## รีสตาร์ทอัตโนมัติ

ตั้งค่าคำสั่งนี้เป็นสคริปต์เริ่มต้นของ Box เพื่อให้ Gateway รีสตาร์ทเมื่อ Box
เริ่มทำงาน:

```bash
nohup openclaw gateway > gateway.log 2>&1 &
```

## การแก้ไขปัญหา

หาก SSH ค้างระหว่างการเริ่มต้นใช้งาน ให้เชื่อมต่อใหม่ด้วยการกำหนดค่า SSH ที่สะอาดและ
keepalives:

```bash
ssh -F /dev/null -o ControlMaster=no -o ServerAliveInterval=15 -o ServerAliveCountMax=3 -L 18789:127.0.0.1:18789 <box-id>@us-east-1.box.upstash.com
```

วิธีนี้จะข้ามการตั้งค่า `~/.ssh/config` ภายในเครื่องที่ล้าสมัย และคงให้ tunnel ทำงานอยู่
ตลอดช่วงที่เครือข่ายไม่ได้ใช้งาน

## ที่เกี่ยวข้อง

- [การเข้าถึงระยะไกล](/th/gateway/remote)
- [ความปลอดภัยของ Gateway](/th/gateway/security)
- [การอัปเดต OpenClaw](/th/install/updating)
