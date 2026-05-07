---
read_when:
    - กำลังค้นหาสถานะของแอปคู่บน Linux
    - การวางแผนความครอบคลุมของแพลตฟอร์มหรือการมีส่วนร่วม
    - การดีบักกรณี Linux ยุติโปรเซสเพราะหน่วยความจำหมด (OOM) หรือรหัสออก 137 บน VPS หรือคอนเทนเนอร์
summary: การรองรับ Linux + สถานะแอปคู่หู
title: แอป Linux
x-i18n:
    generated_at: "2026-05-07T13:22:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 920fa0d3fccac52dfb640ddf7e398fc1f17ca1b46e20b9aaf9525590629ec346
    source_path: platforms/linux.md
    workflow: 16
---

Gateway รองรับ Linux อย่างเต็มรูปแบบ **Node เป็น runtime ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun สำหรับ Gateway (บั๊กของ WhatsApp/Telegram)

มีแผนสำหรับแอปคู่หู Linux แบบเนทีฟ ยินดีรับการมีส่วนร่วมหากคุณต้องการช่วยสร้างแอปหนึ่งตัว

## เส้นทางด่วนสำหรับผู้เริ่มต้น (VPS)

1. ติดตั้ง Node 24 (แนะนำ; Node 22 LTS ซึ่งปัจจุบันคือ `22.16+` ยังใช้งานได้เพื่อความเข้ากันได้)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. จากแล็ปท็อปของคุณ: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. เปิด `http://127.0.0.1:18789/` และยืนยันตัวตนด้วย shared secret ที่กำหนดค่าไว้ (ค่าเริ่มต้นคือ token; ใช้ password หากคุณตั้งค่า `gateway.auth.mode: "password"`)

คู่มือเซิร์ฟเวอร์ Linux ฉบับเต็ม: [เซิร์ฟเวอร์ Linux](/th/vps) ตัวอย่าง VPS แบบทีละขั้นตอน: [exe.dev](/th/install/exe-dev)

## ติดตั้ง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [ติดตั้งและอัปเดต](/th/install/updating)
- ขั้นตอนทางเลือก: [Bun (ทดลอง)](/th/install/bun), [Nix](/th/install/nix), [Docker](/th/install/docker)

## Gateway

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การกำหนดค่า](/th/gateway/configuration)

## ติดตั้งบริการ Gateway (CLI)

ใช้หนึ่งในรายการต่อไปนี้:

```
openclaw onboard --install-daemon
```

หรือ:

```
openclaw gateway install
```

หรือ:

```
openclaw configure
```

เลือก **บริการ Gateway** เมื่อระบบถาม

ซ่อมแซม/ย้ายข้อมูล:

```
openclaw doctor
```

## การควบคุมระบบ (systemd user unit)

OpenClaw ติดตั้งบริการ systemd แบบ **user** เป็นค่าเริ่มต้น ใช้บริการแบบ **system**
สำหรับเซิร์ฟเวอร์ที่ใช้ร่วมกันหรือต้องเปิดตลอดเวลา `openclaw gateway install` และ
`openclaw onboard --install-daemon` จะเรนเดอร์ unit มาตรฐานปัจจุบันให้คุณอยู่แล้ว
ให้เขียนเองเฉพาะเมื่อคุณต้องการการตั้งค่า system/service-manager แบบกำหนดเอง
คำแนะนำบริการฉบับเต็มอยู่ใน [คู่มือปฏิบัติการ Gateway](/th/gateway)

การตั้งค่าขั้นต่ำ:

สร้าง `~/.config/systemd/user/openclaw-gateway[-<profile>].service`:

```
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
KillMode=control-group

[Install]
WantedBy=default.target
```

เปิดใช้งาน:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## แรงกดดันด้านหน่วยความจำและการ kill จาก OOM

บน Linux เคอร์เนลจะเลือกเหยื่อ OOM เมื่อ cgroup ของโฮสต์, VM หรือคอนเทนเนอร์
หน่วยความจำหมด Gateway อาจเป็นเหยื่อที่ไม่เหมาะสม เพราะเป็นเจ้าของ
เซสชันที่มีอายุยาวและการเชื่อมต่อช่องทาง OpenClaw จึงปรับให้กระบวนการลูกแบบชั่วคราว
มีแนวโน้มถูก kill ก่อน Gateway เมื่อทำได้

สำหรับการ spawn กระบวนการลูกบน Linux ที่เข้าเงื่อนไข OpenClaw จะเริ่มกระบวนการลูกผ่าน wrapper
`/bin/sh` แบบสั้นที่เพิ่ม `oom_score_adj` ของกระบวนการลูกเองเป็น `1000` จากนั้น
`exec` คำสั่งจริง นี่เป็นการดำเนินการที่ไม่ต้องใช้สิทธิ์พิเศษ เพราะกระบวนการลูก
เพียงเพิ่มโอกาสที่ตัวเองจะถูก kill จาก OOM เท่านั้น

พื้นผิวของกระบวนการลูกที่ครอบคลุมมีดังนี้:

- กระบวนการลูกของคำสั่งที่จัดการโดย supervisor,
- กระบวนการลูกของเชลล์ PTY,
- กระบวนการลูกของเซิร์ฟเวอร์ MCP stdio,
- กระบวนการ browser/Chrome ที่ OpenClaw เปิดขึ้น

wrapper นี้ใช้ได้เฉพาะ Linux และจะข้ามเมื่อไม่มี `/bin/sh` นอกจากนี้
ยังจะข้ามหาก env ของกระบวนการลูกตั้งค่า `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` หรือ `off`

เพื่อตรวจสอบกระบวนการลูก:

```bash
cat /proc/<child-pid>/oom_score_adj
```

ค่าที่คาดไว้สำหรับกระบวนการลูกที่ครอบคลุมคือ `1000` กระบวนการ Gateway ควรรักษา
คะแนนปกติไว้ โดยทั่วไปคือ `0`

สิ่งนี้ไม่แทนที่การปรับแต่งหน่วยความจำตามปกติ หาก VPS หรือคอนเทนเนอร์ kill
กระบวนการลูกซ้ำ ๆ ให้เพิ่มขีดจำกัดหน่วยความจำ ลด concurrency หรือเพิ่ม
การควบคุมทรัพยากรที่เข้มงวดขึ้น เช่น systemd `MemoryMax=` หรือขีดจำกัดหน่วยความจำระดับคอนเทนเนอร์

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [เซิร์ฟเวอร์ Linux](/th/vps)
- [Raspberry Pi](/th/install/raspberry-pi)
