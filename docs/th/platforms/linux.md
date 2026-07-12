---
read_when:
    - กำลังค้นหาสถานะของแอปคู่หูสำหรับ Linux
    - การวางแผนการรองรับแพลตฟอร์มหรือการมีส่วนร่วม
    - การแก้ไขปัญหา Linux OOM ที่ยุติโปรเซสหรือรหัสออก 137 บน VPS หรือคอนเทนเนอร์
summary: สถานะการรองรับ Linux และแอปคู่หู
title: แอป Linux
x-i18n:
    generated_at: "2026-07-12T16:21:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3a1b57fc7e37257a05eb06f265a49f165eef429f1c8d93c988853f39eba89627
    source_path: platforms/linux.md
    workflow: 16
---

Gateway รองรับ Linux อย่างเต็มรูปแบบ แนะนำให้ใช้ Node เป็นรันไทม์ ส่วน Bun
ไม่แนะนำให้ใช้ (มีปัญหาที่ทราบแล้วกับ WhatsApp/Telegram)

ขณะนี้ยังไม่มีแอปคู่หูแบบเนทีฟสำหรับ Linux ยินดีต้อนรับการมีส่วนร่วม

## วิธีด่วน (VPS)

1. ติดตั้ง Node 24 (แนะนำ) หรือ Node 22.19+ (LTS และยังรองรับอยู่)
2. `npm i -g openclaw@latest`
3. `openclaw onboard --install-daemon`
4. จากแล็ปท็อปของคุณ: `ssh -N -L 18789:127.0.0.1:18789 <user>@<host>`
5. เปิด `http://127.0.0.1:18789/` และยืนยันตัวตนด้วยข้อมูลลับที่ใช้ร่วมกันซึ่งกำหนดค่าไว้
   (ค่าเริ่มต้นคือโทเค็น หรือรหัสผ่านหาก `gateway.auth.mode` เป็น `"password"`)

คู่มือเซิร์ฟเวอร์ฉบับเต็ม: [เซิร์ฟเวอร์ Linux](/th/vps) ตัวอย่าง VPS แบบทีละขั้นตอน:
[exe.dev](/th/install/exe-dev)

## การติดตั้ง

- [เริ่มต้นใช้งาน](/th/start/getting-started)
- [การติดตั้งและอัปเดต](/th/install/updating)
- ไม่บังคับ: [Bun (ทดลอง)](/th/install/bun), [Nix](/th/install/nix), [Docker](/th/install/docker)

## บริการ Gateway (systemd)

ติดตั้งด้วยคำสั่งใดคำสั่งหนึ่งต่อไปนี้:

```bash
openclaw onboard --install-daemon
openclaw gateway install
openclaw configure   # select "Gateway service" when prompted
```

ซ่อมแซมหรือย้ายการติดตั้งที่มีอยู่:

```bash
openclaw doctor
```

โดยค่าเริ่มต้น `openclaw gateway install` จะสร้างยูนิต **ผู้ใช้** ของ systemd คำแนะนำฉบับเต็ม
เกี่ยวกับบริการ รวมถึงรูปแบบยูนิตระดับ **ระบบ** สำหรับโฮสต์ที่ใช้ร่วมกันหรือ
เปิดทำงานตลอดเวลา อยู่ใน [คู่มือการปฏิบัติงาน Gateway](/th/gateway#supervision-and-service-lifecycle)

เขียนยูนิตด้วยตนเองเฉพาะเมื่อตั้งค่าแบบกำหนดเองเท่านั้น ตัวอย่างยูนิตผู้ใช้แบบขั้นต่ำ
(`~/.config/systemd/user/openclaw-gateway[-<profile>].service`):

```ini
[Unit]
Description=OpenClaw Gateway (profile: <profile>, v<version>)
After=network-online.target
Wants=network-online.target
StartLimitBurst=5
StartLimitIntervalSec=60

[Service]
ExecStart=/usr/local/bin/openclaw gateway --port 18789
Restart=always
RestartSec=5
RestartPreventExitStatus=78
TimeoutStopSec=30
TimeoutStartSec=30
SuccessExitStatus=0 143
OOMPolicy=continue
KillMode=control-group

[Install]
WantedBy=default.target
```

เปิดใช้งาน:

```bash
systemctl --user enable --now openclaw-gateway[-<profile>].service
```

## ภาวะหน่วยความจำตึงตัวและการยุติโปรเซสโดย OOM

บน Linux เคอร์เนลจะเลือกโปรเซสเป้าหมายของ OOM เมื่อหน่วยความจำของโฮสต์, VM หรือ cgroup
ของคอนเทนเนอร์หมด Gateway ไม่เหมาะที่จะเป็นเป้าหมาย เพราะจัดการเซสชันที่ใช้งานยาวนาน
และการเชื่อมต่อช่องทาง ดังนั้น OpenClaw จึงเพิ่มโอกาสให้โปรเซสลูกชั่วคราว
ถูกยุติก่อนเมื่อเป็นไปได้

สำหรับการสร้างโปรเซสลูกบน Linux ที่เข้าเกณฑ์ OpenClaw จะครอบคำสั่งด้วย
ชิม `/bin/sh` ขนาดเล็ก ซึ่งเพิ่มค่า `oom_score_adj` ของโปรเซสลูกเองเป็น `1000` แล้ว
ใช้ `exec` เรียกคำสั่งจริง การดำเนินการนี้ไม่ต้องใช้สิทธิ์พิเศษ เพราะโปรเซสสามารถเพิ่ม
คะแนน OOM ของตนเองได้เสมอ

ส่วนที่ครอบคลุมโปรเซสลูก:

- โปรเซสลูกของคำสั่งที่จัดการโดยตัวควบคุม
- โปรเซสลูกของเชลล์ PTY
- โปรเซสลูกของเซิร์ฟเวอร์ stdio ของ MCP
- โปรเซสเบราว์เซอร์/Chrome ที่ OpenClaw เรียกใช้ (ผ่านรันไทม์โปรเซสของ SDK ของ Plugin)

ตัวครอบนี้ใช้เฉพาะ Linux และจะข้ามเมื่อไม่มี `/bin/sh` หรือเมื่อตัวแปรสภาพแวดล้อม
ของโปรเซสลูกกำหนด `OPENCLAW_CHILD_OOM_SCORE_ADJ` เป็น `0`, `false`, `no` หรือ
`off`

ตรวจสอบโปรเซสลูก:

```bash
cat /proc/<child-pid>/oom_score_adj
```

ค่าที่คาดไว้สำหรับโปรเซสลูกที่ครอบคลุมคือ `1000` ส่วนโปรเซส Gateway เอง
จะคงคะแนนปกติไว้ (โดยทั่วไปคือ `0`)

`OOMPolicy=continue` ในยูนิต systemd ทำให้บริการ Gateway ยังคงทำงานเมื่อ
โปรเซสลูกชั่วคราวถูก OOM killer เลือก แทนที่จะทำเครื่องหมายว่ายูนิตทั้งหมด
ล้มเหลวและเริ่มช่องทางทั้งหมดใหม่ โดยโปรเซสลูกหรือเซสชันที่ล้มเหลวจะรายงาน
ข้อผิดพลาดของตนเอง

การดำเนินการนี้ไม่สามารถทดแทนการปรับแต่งหน่วยความจำตามปกติได้ หาก VPS หรือคอนเทนเนอร์
ยุติโปรเซสลูกซ้ำ ๆ ให้เพิ่มขีดจำกัดหน่วยความจำ ลดจำนวนงานพร้อมกัน หรือเพิ่ม
การควบคุมทรัพยากรที่เข้มงวดยิ่งขึ้น (systemd `MemoryMax=`, ขีดจำกัดหน่วยความจำของคอนเทนเนอร์)

## เนื้อหาที่เกี่ยวข้อง

- [ภาพรวมการติดตั้ง](/th/install)
- [เซิร์ฟเวอร์ Linux](/th/vps)
- [Raspberry Pi](/th/install/raspberry-pi)
- [คู่มือการปฏิบัติงาน Gateway](/th/gateway)
- [การกำหนดค่า Gateway](/th/gateway/configuration)
