---
read_when:
    - คุณเรียกใช้ OpenClaw ด้วย Docker เป็นประจำ และต้องการคำสั่งสำหรับการใช้งานประจำวันให้สั้นลง
    - คุณต้องการเลเยอร์ตัวช่วยสำหรับแดชบอร์ด บันทึก การตั้งค่าโทเค็น และโฟลว์การจับคู่
summary: ตัวช่วยเชลล์ ClawDock สำหรับการติดตั้ง OpenClaw แบบใช้ Docker
title: ClawDock
x-i18n:
    generated_at: "2026-05-06T09:18:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: 82d31ba74694cda9e195534ce33f7b61343546f174ceacd2607aeb1d5487229e
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock เป็นเลเยอร์ตัวช่วย shell ขนาดเล็กสำหรับการติดตั้ง OpenClaw แบบใช้ Docker

ช่วยให้คุณใช้คำสั่งสั้น ๆ เช่น `clawdock-start`, `clawdock-dashboard` และ `clawdock-fix-token` แทนการเรียก `docker compose ...` ที่ยาวกว่า

หากคุณยังไม่ได้ตั้งค่า Docker ให้เริ่มที่ [Docker](/th/install/docker)

## ติดตั้ง

ใช้พาธตัวช่วยมาตรฐาน:

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากก่อนหน้านี้คุณติดตั้ง ClawDock จาก `scripts/shell-helpers/clawdock-helpers.sh` ให้ติดตั้งใหม่จากพาธใหม่ `scripts/clawdock/clawdock-helpers.sh` พาธ GitHub raw เดิมถูกนำออกแล้ว

## สิ่งที่คุณจะได้

### การทำงานพื้นฐาน

| คำสั่ง             | คำอธิบาย              |
| ------------------ | ---------------------- |
| `clawdock-start`   | เริ่ม Gateway          |
| `clawdock-stop`    | หยุด Gateway           |
| `clawdock-restart` | รีสตาร์ท Gateway       |
| `clawdock-status`  | ตรวจสอบสถานะ container |
| `clawdock-logs`    | ติดตาม log ของ Gateway |

### การเข้าถึง container

| คำสั่ง                    | คำอธิบาย                                 |
| ------------------------- | ----------------------------------------- |
| `clawdock-shell`          | เปิด shell ภายใน container ของ Gateway    |
| `clawdock-cli <command>`  | เรียกใช้คำสั่ง OpenClaw CLI ใน Docker     |
| `clawdock-exec <command>` | ดำเนินการคำสั่งใด ๆ ภายใน container      |

### Web UI และการจับคู่

| คำสั่ง                  | คำอธิบาย                     |
| ----------------------- | ----------------------------- |
| `clawdock-dashboard`    | เปิด URL ของ Control UI       |
| `clawdock-devices`      | แสดงรายการการจับคู่อุปกรณ์ที่รอดำเนินการ |
| `clawdock-approve <id>` | อนุมัติคำขอจับคู่             |

### การตั้งค่าและการบำรุงรักษา

| คำสั่ง               | คำอธิบาย                                      |
| -------------------- | ---------------------------------------------- |
| `clawdock-fix-token` | กำหนดค่า token ของ Gateway ภายใน container     |
| `clawdock-update`    | pull, build ใหม่ และรีสตาร์ท                  |
| `clawdock-rebuild`   | build อิมเมจ Docker ใหม่เท่านั้น              |
| `clawdock-clean`     | ลบ container และ volume                        |

### ยูทิลิตี

| คำสั่ง                 | คำอธิบาย                                      |
| ---------------------- | ---------------------------------------------- |
| `clawdock-health`      | เรียกใช้การตรวจสุขภาพของ Gateway              |
| `clawdock-token`       | พิมพ์ token ของ Gateway                        |
| `clawdock-cd`          | ไปยังไดเรกทอรีโปรเจกต์ OpenClaw               |
| `clawdock-config`      | เปิด `~/.openclaw`                             |
| `clawdock-show-config` | พิมพ์ไฟล์ config พร้อมปิดบังค่าที่ละเอียดอ่อน |
| `clawdock-workspace`   | เปิดไดเรกทอรี workspace                        |

## ขั้นตอนครั้งแรก

```bash
clawdock-start
clawdock-fix-token
clawdock-dashboard
```

หากเบราว์เซอร์แจ้งว่าจำเป็นต้องจับคู่:

```bash
clawdock-devices
clawdock-approve <request-id>
```

## Config และ secret

ClawDock ทำงานร่วมกับการแยก config ของ Docker แบบเดียวกับที่อธิบายไว้ใน [Docker](/th/install/docker):

- `<project>/.env` สำหรับค่าที่เฉพาะกับ Docker เช่น ชื่ออิมเมจ, port และ token ของ Gateway
- `~/.openclaw/.env` สำหรับคีย์ผู้ให้บริการและ token ของ bot ที่อิง env
- `~/.openclaw/agents/<agentId>/agent/auth-profiles.json` สำหรับ auth ของผู้ให้บริการแบบ OAuth/API-key ที่จัดเก็บไว้
- `~/.openclaw/openclaw.json` สำหรับ config พฤติกรรม

ใช้ `clawdock-show-config` เมื่อต้องการตรวจสอบไฟล์ `.env` และ `openclaw.json` อย่างรวดเร็ว คำสั่งนี้จะปิดบังค่า `.env` ในเอาต์พุตที่พิมพ์ออกมา

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="docker">
    การติดตั้ง Docker มาตรฐานสำหรับ OpenClaw
  </Card>
  <Card title="รันไทม์ Docker VM" href="/th/install/docker-vm-runtime" icon="cube">
    รันไทม์ VM ที่จัดการโดย Docker สำหรับการแยกที่แข็งแกร่งขึ้น
  </Card>
  <Card title="การอัปเดต" href="/th/install/updating" icon="arrow-up-right-from-square">
    การอัปเดตแพ็กเกจ OpenClaw และบริการที่จัดการอยู่
  </Card>
</CardGroup>
