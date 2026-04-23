---
read_when:
    - การติดตั้งใช้งาน OpenClaw บน Render
    - คุณต้องการการติดตั้งใช้งานบนคลาวด์แบบประกาศด้วย Render Blueprints
summary: ติดตั้งใช้งาน OpenClaw บน Render ด้วย Infrastructure-as-Code
title: Render
x-i18n:
    generated_at: "2026-04-23T10:19:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 95ffe98a60e9919826a7c7fdb9cbafd63d20ce3de111ac305f43907b1ae442dc
    source_path: install/render.mdx
    workflow: 15
---

# Render

ติดตั้งใช้งาน OpenClaw บน Render โดยใช้ Infrastructure as Code ไฟล์ Blueprint `render.yaml` ที่รวมมาให้จะกำหนดทั้งสแตกของคุณแบบประกาศ ทั้ง service, disk และ environment variables เพื่อให้คุณติดตั้งใช้งานได้ในคลิกเดียว และจัดการเวอร์ชันของโครงสร้างพื้นฐานไปพร้อมกับโค้ดของคุณ

## ข้อกำหนดเบื้องต้น

- บัญชี [Render account](https://render.com) (มี free tier)
- API key จาก [model provider](/th/providers) ที่คุณต้องการ

## ติดตั้งใช้งานด้วย Render Blueprint

[Deploy to Render](https://render.com/deploy?repo=https://github.com/openclaw/openclaw)

การคลิกลิงก์นี้จะ:

1. สร้าง Render service ใหม่จาก Blueprint `render.yaml` ที่รากของ repo นี้
2. build Docker image และติดตั้งใช้งาน

เมื่อติดตั้งใช้งานแล้ว URL ของ service จะอยู่ในรูปแบบ `https://<service-name>.onrender.com`

## ทำความเข้าใจกับ Blueprint

Render Blueprints คือไฟล์ YAML ที่กำหนดโครงสร้างพื้นฐานของคุณ `render.yaml` ใน
repository นี้ตั้งค่าทุกอย่างที่จำเป็นสำหรับการรัน OpenClaw:

```yaml
services:
  - type: web
    name: openclaw
    runtime: docker
    plan: starter
    healthCheckPath: /health
    envVars:
      - key: OPENCLAW_GATEWAY_PORT
        value: "8080"
      - key: OPENCLAW_STATE_DIR
        value: /data/.openclaw
      - key: OPENCLAW_WORKSPACE_DIR
        value: /data/workspace
      - key: OPENCLAW_GATEWAY_TOKEN
        generateValue: true # auto-generates a secure token
    disk:
      name: openclaw-data
      mountPath: /data
      sizeGB: 1
```

ความสามารถหลักของ Blueprint ที่ใช้:

| ความสามารถ            | วัตถุประสงค์                                              |
| --------------------- | --------------------------------------------------------- |
| `runtime: docker`     | build จาก Dockerfile ของ repo                            |
| `healthCheckPath`     | Render เฝ้าตรวจ `/health` และรีสตาร์ต instance ที่ไม่พร้อมใช้งาน |
| `generateValue: true` | สร้างค่าที่ปลอดภัยเชิงการเข้ารหัสให้โดยอัตโนมัติ       |
| `disk`                | พื้นที่จัดเก็บถาวรที่คงอยู่ข้ามการติดตั้งใช้งานใหม่       |

## การเลือก plan

| Plan      | การหยุดทำงานชั่วคราว | Disk          | เหมาะที่สุดสำหรับ               |
| --------- | -------------------- | ------------- | ------------------------------- |
| Free      | หลังไม่มีการใช้งาน 15 นาที | ไม่มีให้ใช้    | การทดสอบ, เดโม                  |
| Starter   | ไม่หยุด              | 1GB+          | การใช้งานส่วนตัว, ทีมขนาดเล็ก   |
| Standard+ | ไม่หยุด              | 1GB+          | การใช้งานจริง, หลาย channels    |

Blueprint ใช้ค่าเริ่มต้นเป็น `starter` หากต้องการใช้ free tier ให้เปลี่ยน `plan: free` ใน
`render.yaml` ของ fork ของคุณ (แต่โปรดทราบว่า: การไม่มี persistent disk หมายความว่า state ของ OpenClaw
จะถูกรีเซ็ตทุกครั้งที่ติดตั้งใช้งานใหม่)

## หลังการติดตั้งใช้งาน

### เข้าถึง Control UI

เว็บแดชบอร์ดใช้งานได้ที่ `https://<your-service>.onrender.com/`

เชื่อมต่อโดยใช้ shared secret ที่ตั้งค่าไว้ เทมเพลตการติดตั้งนี้จะสร้าง
`OPENCLAW_GATEWAY_TOKEN` ให้โดยอัตโนมัติ (ดูได้ที่ **Dashboard → your service →
Environment**) หากคุณเปลี่ยนไปใช้ password auth ให้ใช้รหัสผ่านนั้นแทน

## ความสามารถของ Render Dashboard

### Logs

ดู logs แบบเรียลไทม์ได้ที่ **Dashboard → your service → Logs** กรองได้ตาม:

- Build logs (การสร้าง Docker image)
- Deploy logs (การเริ่มต้น service)
- Runtime logs (เอาต์พุตของแอปพลิเคชัน)

### การเข้าถึง shell

สำหรับการดีบัก ให้เปิด shell session ผ่าน **Dashboard → your service → Shell** โดย persistent disk จะถูก mount ไว้ที่ `/data`

### Environment variables

แก้ไขตัวแปรได้ที่ **Dashboard → your service → Environment** การเปลี่ยนแปลงจะทริกเกอร์การติดตั้งใช้งานใหม่โดยอัตโนมัติ

### Auto-deploy

หากคุณใช้ OpenClaw repository ต้นฉบับ Render จะไม่ auto-deploy OpenClaw ของคุณ หากต้องการอัปเดต ให้รันการซิงก์ Blueprint แบบ manual จากแดชบอร์ด

## โดเมนกำหนดเอง

1. ไปที่ **Dashboard → your service → Settings → Custom Domains**
2. เพิ่มโดเมนของคุณ
3. ตั้งค่า DNS ตามคำแนะนำ (CNAME ไปยัง `*.onrender.com`)
4. Render จะจัดเตรียมใบรับรอง TLS ให้อัตโนมัติ

## การปรับขนาด

Render รองรับการปรับขนาดทั้งแนวนอนและแนวตั้ง:

- **แนวตั้ง**: เปลี่ยน plan เพื่อรับ CPU/RAM เพิ่ม
- **แนวนอน**: เพิ่มจำนวน instances (แผน Standard ขึ้นไป)

สำหรับ OpenClaw โดยทั่วไปการปรับขนาดแนวตั้งก็เพียงพอ การปรับขนาดแนวนอนต้องใช้ sticky sessions หรือการจัดการ state ภายนอก

## การสำรองข้อมูลและการย้ายระบบ

ส่งออก state, config, auth profiles และ workspace ของคุณได้ทุกเมื่อโดยใช้
การเข้าถึง shell ใน Render Dashboard:

```bash
openclaw backup create
```

คำสั่งนี้จะสร้างไฟล์สำรองแบบพกพาที่มี state ของ OpenClaw พร้อม workspace
ที่ตั้งค่าไว้ ดูรายละเอียดได้ที่ [Backup](/th/cli/backup)

## การแก้ปัญหา

### Service ไม่เริ่มทำงาน

ตรวจสอบ deploy logs ใน Render Dashboard ปัญหาที่พบบ่อย:

- ไม่มี `OPENCLAW_GATEWAY_TOKEN` — ตรวจสอบว่าตั้งค่าไว้ใน **Dashboard → Environment**
- พอร์ตไม่ตรงกัน — ตรวจสอบว่าได้ตั้ง `OPENCLAW_GATEWAY_PORT=8080` เพื่อให้ gateway bind กับพอร์ตที่ Render คาดไว้

### Cold start ช้า (free tier)

services ใน free tier จะหยุดทำงานชั่วคราวหลังไม่มีการใช้งาน 15 นาที คำขอแรกหลังจากหยุดทำงานจะใช้เวลาหลายวินาทีขณะคอนเทนเนอร์เริ่มต้น อัปเกรดเป็น Starter plan เพื่อให้ทำงานตลอดเวลา

### ข้อมูลหายหลังติดตั้งใช้งานใหม่

สิ่งนี้เกิดขึ้นใน free tier (ไม่มี persistent disk) ให้อัปเกรดเป็น plan แบบชำระเงิน หรือ
ส่งออกข้อมูลสำรองแบบเต็มเป็นประจำผ่าน `openclaw backup create` ใน Render shell

### Health check ล้มเหลว

Render คาดหวังการตอบกลับ 200 จาก `/health` ภายใน 30 วินาที หาก build สำเร็จแต่ติดตั้งใช้งานล้มเหลว service อาจใช้เวลาเริ่มต้นนานเกินไป ให้ตรวจสอบ:

- Build logs เพื่อหาข้อผิดพลาด
- ว่าคอนเทนเนอร์รันในเครื่องได้ด้วย `docker build && docker run`

## ขั้นตอนถัดไป

- ตั้งค่า messaging channels: [Channels](/th/channels)
- กำหนดค่า Gateway: [Gateway configuration](/th/gateway/configuration)
- อัปเดต OpenClaw ให้ทันสมัยอยู่เสมอ: [Updating](/th/install/updating)
