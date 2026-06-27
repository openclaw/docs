---
read_when:
    - กำลังมองหาสถานะของแอปคู่หูบน Linux
    - กำลังวางแผนความครอบคลุมของแพลตฟอร์มหรือการมีส่วนร่วม
    - การดีบักการ kill โดย OOM ของ Linux หรือ exit 137 บน VPS หรือคอนเทนเนอร์
summary: สถานะการรองรับ Linux + แอปคู่หู
title: แอป Linux
x-i18n:
    generated_at: "2026-06-27T17:49:10Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 437eb12d373ff9161ec7fa1e6fc04bf5662f903374d17f55b45ae1ea355c9085
    source_path: platforms/linux.md
    workflow: 16
---

Gateway รองรับบน Linux อย่างเต็มรูปแบบ **Node เป็น runtime ที่แนะนำ**
ไม่แนะนำให้ใช้ Bun สำหรับ Gateway (บั๊ก WhatsApp/Telegram)

มีแผนสำหรับแอปคู่หูแบบเนทีฟบน Linux ยินดีรับการมีส่วนร่วมหากคุณต้องการช่วยสร้างแอปหนึ่ง

## เส้นทางด่วนสำหรับผู้เริ่มต้น (VPS)

1. ติดตั้ง Node 24 (แนะนำ; Node 22 LTS ซึ่งปัจจุบันคือ `22.19+` ยังทำงานได้เพื่อความเข้ากันได้)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. จากแล็ปท็อปของคุณ: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. เปิด `http://127.0.0.1:18789/` และยืนยันตัวตนด้วย shared secret ที่กำหนดไว้ (ค่าเริ่มต้นคือ token; ใช้รหัสผ่านหากคุณตั้งค่า `gateway.auth.mode: "password"`)

คู่มือเซิร์ฟเวอร์ Linux ฉบับเต็ม: [เซิร์ฟเวอร์ Linux](/th/vps) ตัวอย่าง VPS แบบทีละขั้นตอน: [exe.dev](/th/install/exe-dev)

## ติดตั้ง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [ติดตั้งและอัปเดต](/th/install/updating)
- โฟลว์เสริม: [Bun (ทดลอง)](/th/install/bun), [Nix](/th/install/nix), [Docker](/th/install/docker)

## Gateway

- [คู่มือปฏิบัติการ Gateway](/th/gateway)
- [การกำหนดค่า](/th/gateway/configuration)

## การติดตั้งบริการ Gateway (CLI)

ใช้หนึ่งในคำสั่งเหล่านี้:

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
สำหรับเซิร์ฟเวอร์ที่ใช้ร่วมกันหรือเปิดทำงานตลอดเวลา `openclaw gateway install` และ
`openclaw onboard --install-daemon` จะแสดงผล unit ตามรูปแบบมาตรฐานปัจจุบัน
ให้คุณอยู่แล้ว; เขียนเองด้วยมือเฉพาะเมื่อคุณต้องการการตั้งค่า system/service-manager
แบบกำหนดเองเท่านั้น คำแนะนำบริการฉบับเต็มอยู่ใน [คู่มือปฏิบัติการ Gateway](/th/gateway)

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
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

เปิดใช้งาน:

```
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## แรงกดดันหน่วยความจำและการ kill จาก OOM

บน Linux เคอร์เนลจะเลือกเหยื่อ OOM เมื่อ host, VM หรือ container cgroup
หน่วยความจำหมด Gateway อาจเป็นเหยื่อที่ไม่เหมาะสม เพราะเป็นเจ้าของ
เซสชันและการเชื่อมต่อช่องทางที่มีอายุยาว OpenClaw จึงปรับให้น้ำหนักของ
กระบวนการลูกชั่วคราวถูก kill ก่อน Gateway เมื่อทำได้

สำหรับการ spawn กระบวนการลูกบน Linux ที่เข้าเงื่อนไข OpenClaw จะเริ่มกระบวนการลูกผ่าน wrapper
`/bin/sh` สั้น ๆ ที่เพิ่ม `oom_score_adj` ของกระบวนการลูกเองเป็น `1000` จากนั้น
`exec` คำสั่งจริง นี่เป็นการทำงานแบบไม่ต้องใช้สิทธิ์พิเศษ เพราะกระบวนการลูก
เพียงเพิ่มโอกาสที่ตัวเองจะถูก OOM kill เท่านั้น

พื้นผิวกระบวนการลูกที่ครอบคลุมได้แก่:

- กระบวนการลูกของคำสั่งที่ supervisor จัดการ
- กระบวนการลูกของ PTY shell
- กระบวนการลูกของเซิร์ฟเวอร์ MCP stdio
- กระบวนการ browser/Chrome ที่ OpenClaw เรียกใช้

wrapper นี้ใช้เฉพาะ Linux และจะถูกข้ามเมื่อไม่มี `/bin/sh` นอกจากนี้
จะถูกข้ามเช่นกันหาก env ของกระบวนการลูกตั้งค่า `OPENCLAW_CHILD_OOM_SCORE_ADJ=0`, `false`,
`no` หรือ `off`

เพื่อตรวจสอบกระบวนการลูก:

```bash
cat /proc/<child-pid>/oom_score_adj
```

ค่าที่คาดไว้สำหรับกระบวนการลูกที่ครอบคลุมคือ `1000` กระบวนการ Gateway ควรคง
คะแนนปกติของตัวเองไว้ ซึ่งโดยทั่วไปคือ `0`

unit systemd ที่แนะนำยังตั้งค่า `OOMPolicy=continue` ด้วย ค่านี้ทำให้
unit ของ Gateway ยังทำงานอยู่เมื่อกระบวนการลูกชั่วคราวถูกเลือกโดย OOM killer;
คำสั่ง/เซสชันของกระบวนการลูกอาจล้มเหลวและรายงานข้อผิดพลาดได้ โดยที่ systemd ไม่ทำเครื่องหมาย
ว่าบริการ gateway ทั้งหมดล้มเหลวและรีสตาร์ททุกช่องทาง

สิ่งนี้ไม่ได้ทดแทนการปรับแต่งหน่วยความจำตามปกติ หาก VPS หรือ container kill
กระบวนการลูกซ้ำ ๆ ให้เพิ่มขีดจำกัดหน่วยความจำ ลด concurrency หรือเพิ่มการควบคุมทรัพยากร
ที่เข้มงวดขึ้น เช่น `MemoryMax=` ของ systemd หรือขีดจำกัดหน่วยความจำระดับ container

## ที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [เซิร์ฟเวอร์ Linux](/th/vps)
- [Raspberry Pi](/th/install/raspberry-pi)
