---
read_when:
    - การปรับใช้ OpenClaw บน EasyRunner
    - การเรียกใช้ Gateway เบื้องหลังพร็อกซี Caddy ของ EasyRunner
    - การเลือกวอลุ่มถาวรและการยืนยันตัวตนสำหรับ Gateway ที่โฮสต์ไว้
summary: เรียกใช้ OpenClaw Gateway บน EasyRunner ด้วย Podman และ Caddy
title: EasyRunner
x-i18n:
    generated_at: "2026-07-12T16:20:38Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 80cbde016a8bf7662d4b4a056a3d122a423264179daf70b5705e8f10b0dad5cb
    source_path: platforms/easyrunner.md
    workflow: 16
---

EasyRunner โฮสต์ OpenClaw Gateway เป็นแอปแบบคอนเทนเนอร์ขนาดเล็กที่อยู่หลังพร็อกซี
Caddy คู่มือนี้ถือว่าคุณมีโฮสต์ EasyRunner ที่เรียกใช้แอป Compose ที่เข้ากันได้กับ
Podman และยุติการเชื่อมต่อ HTTPS ผ่าน Caddy

## ก่อนเริ่มต้น

- เซิร์ฟเวอร์ EasyRunner ที่มีโดเมนกำหนดเส้นทางมายังเซิร์ฟเวอร์
- อิมเมจ OpenClaw อย่างเป็นทางการ (`ghcr.io/openclaw/openclaw`) หรืออิมเมจที่คุณสร้างเอง
- วอลุ่มการกำหนดค่าแบบถาวรสำหรับ `/home/node/.openclaw`
- วอลุ่มพื้นที่ทำงานแบบถาวรสำหรับ `/home/node/.openclaw/workspace`
- โทเค็นหรือรหัสผ่าน Gateway ที่คาดเดาได้ยาก

เปิดใช้การยืนยันตัวตนอุปกรณ์ไว้เมื่อเป็นไปได้ หากรีเวิร์สพร็อกซีของคุณไม่สามารถส่งต่อ
ข้อมูลประจำตัวของอุปกรณ์ได้อย่างถูกต้อง ให้แก้ไขการตั้งค่าพร็อกซีที่เชื่อถือก่อน (ดู
[การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือ](/th/gateway/trusted-proxy-auth)) ใช้การข้าม
การยืนยันตัวตนที่เป็นอันตรายเฉพาะบนเครือข่ายส่วนตัวทั้งหมดที่ผู้ดำเนินการควบคุมเท่านั้น

## แอป Compose

สร้างแอป EasyRunner พร้อมไฟล์ Compose ที่มีโครงสร้างดังนี้:

```yaml
services:
  openclaw:
    image: ghcr.io/openclaw/openclaw:latest
    restart: unless-stopped
    environment:
      OPENCLAW_GATEWAY_TOKEN: ${OPENCLAW_GATEWAY_TOKEN}
      OPENCLAW_HOME: /home/node
      OPENCLAW_STATE_DIR: /home/node/.openclaw
      OPENCLAW_CONFIG_PATH: /home/node/.openclaw/openclaw.json
      OPENCLAW_WORKSPACE_DIR: /home/node/.openclaw/workspace
    volumes:
      - openclaw-config:/home/node/.openclaw
      - openclaw-workspace:/home/node/.openclaw/workspace
    labels:
      caddy: openclaw.example.com
      caddy.reverse_proxy: "{{upstreams 1455}}"
    command: ["node", "openclaw.mjs", "gateway", "--bind", "lan", "--port", "1455"]

volumes:
  openclaw-config:
  openclaw-workspace:
```

แทนที่ `openclaw.example.com` ด้วยชื่อโฮสต์ของ Gateway จัดเก็บ
`OPENCLAW_GATEWAY_TOKEN` ไว้ในตัวจัดการข้อมูลลับ/สภาพแวดล้อมของ EasyRunner แทนการ
คอมมิตลงในข้อกำหนดแอป โดยค่าเริ่มต้นอิมเมจจะผูกกับ local loopback ดังนั้นจึงต้องระบุ
`--bind lan --port 1455` ใน `command` อย่างชัดเจน เพื่อให้ Caddy เข้าถึงคอนเทนเนอร์ได้

## กำหนดค่า OpenClaw

ภายในวอลุ่มการกำหนดค่าแบบถาวร ให้ Gateway เข้าถึงได้ผ่านพร็อกซีเท่านั้น
และกำหนดให้ต้องยืนยันตัวตน:

```json5
{
  gateway: {
    bind: "lan",
    port: 1455,
    auth: {
      token: "${OPENCLAW_GATEWAY_TOKEN}",
    },
  },
}
```

หาก Caddy ยุติ TLS ให้ Gateway ให้กำหนดการตั้งค่าพร็อกซีที่เชื่อถือสำหรับ
เส้นทางพร็อกซีที่แน่นอน แทนการปิดใช้การตรวจสอบการยืนยันตัวตนทั่วทั้งระบบ ดู
[การยืนยันตัวตนผ่านพร็อกซีที่เชื่อถือ](/th/gateway/trusted-proxy-auth)

## ตรวจสอบ

จากเครื่องเวิร์กสเตชันของคุณ:

```bash
openclaw gateway probe --url https://openclaw.example.com --token <token>
openclaw gateway status --url https://openclaw.example.com --token <token>
```

จากโฮสต์ EasyRunner คำขอ `GET /healthz` (สถานะการทำงาน) และ `GET /readyz`
(ความพร้อมใช้งาน) ไม่ต้องยืนยันตัวตน และรองรับการตรวจสอบสถานะคอนเทนเนอร์ที่มีมาใน
อิมเมจ นอกจากนี้ ให้ตรวจสอบบันทึกของแอปเพื่อยืนยันว่า Gateway กำลังรับฟัง และไม่มี
ข้อผิดพลาดระหว่างการเริ่มต้นเกี่ยวกับ SecretRef, Plugin หรือการยืนยันตัวตนของช่องทาง

## การอัปเดตและการสำรองข้อมูล

- ดึงหรือสร้างอิมเมจ OpenClaw ใหม่ แล้วปรับใช้แอป EasyRunner อีกครั้ง
- สำรองวอลุ่ม `openclaw-config` ก่อนอัปเดต วอลุ่มนี้เก็บ
  `openclaw.json`, `agents/<agentId>/agent/auth-profiles.json` และสถานะ
  แพ็กเกจ Plugin ที่ติดตั้งแล้ว
- สำรอง `openclaw-workspace` หากเอเจนต์เขียนข้อมูลโครงการแบบถาวรไว้ที่นั่น
- เรียกใช้ `openclaw doctor` หลังการอัปเดตครั้งใหญ่ เพื่อตรวจหาการย้ายข้อมูล
  การกำหนดค่าและคำเตือนของบริการ

## การแก้ไขปัญหา

- `gateway probe` เชื่อมต่อไม่ได้: ยืนยันว่าชื่อโฮสต์ Caddy ชี้ไปยังแอป
  และคอนเทนเนอร์รับฟังบน `0.0.0.0:1455`
- การยืนยันตัวตนล้มเหลว: หมุนเวียนโทเค็นในข้อมูลลับของ EasyRunner และในคำสั่ง
  ไคลเอนต์ภายในเครื่องพร้อมกัน
- ไฟล์มี root เป็นเจ้าของหลังการกู้คืน: อิมเมจทำงานในฐานะ `node` (uid 1000)
  ให้แก้ไขวอลุ่มที่เมานต์เพื่อให้ผู้ใช้ดังกล่าวเขียนไปยัง
  `/home/node/.openclaw` และ `/home/node/.openclaw/workspace` ได้
- เบราว์เซอร์หรือ Plugin ช่องทางทำงานล้มเหลว: ตรวจสอบว่าไบนารีภายนอกที่จำเป็น
  การเชื่อมต่อเครือข่ายขาออก และข้อมูลประจำตัวที่เมานต์พร้อมใช้งานภายใน
  คอนเทนเนอร์หรือไม่
