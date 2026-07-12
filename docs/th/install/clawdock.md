---
read_when:
    - คุณใช้งาน OpenClaw ด้วย Docker บ่อยครั้งและต้องการคำสั่งที่สั้นลงสำหรับการใช้งานประจำวัน
    - คุณต้องการเลเยอร์ตัวช่วยสำหรับแดชบอร์ด บันทึก การตั้งค่าโทเค็น และขั้นตอนการจับคู่
summary: ตัวช่วยเชลล์ ClawDock สำหรับการติดตั้ง OpenClaw ที่ใช้ Docker เป็นฐาน
title: ClawDock
x-i18n:
    generated_at: "2026-07-12T16:15:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5bb829a3301178503f910931e86a39f7befeaf186044f4088a25dc80ea99130d
    source_path: install/clawdock.md
    workflow: 16
---

ClawDock เป็นเลเยอร์ตัวช่วยเชลล์ขนาดเล็กสำหรับการติดตั้ง OpenClaw ที่ใช้ Docker

ClawDock ช่วยให้คุณใช้คำสั่งสั้น ๆ เช่น `clawdock-start`, `clawdock-dashboard` และ `clawdock-fix-token` แทนการเรียกใช้ `docker compose ...` ที่ยาวกว่า

หากคุณยังไม่ได้ตั้งค่า Docker ให้เริ่มจาก [Docker](/th/install/docker)

## การติดตั้ง

```bash
mkdir -p ~/.clawdock && curl -sL https://raw.githubusercontent.com/openclaw/openclaw/main/scripts/clawdock/clawdock-helpers.sh -o ~/.clawdock/clawdock-helpers.sh
echo 'source ~/.clawdock/clawdock-helpers.sh' >> ~/.zshrc && source ~/.zshrc
```

หากก่อนหน้านี้คุณติดตั้ง ClawDock จาก `scripts/shell-helpers/clawdock-helpers.sh` ให้ติดตั้งใหม่จากพาธปัจจุบัน `scripts/clawdock/clawdock-helpers.sh` เนื่องจากพาธ raw เดิมบน GitHub ถูกนำออกแล้ว

ตัวช่วยจะตรวจหาตำแหน่งเช็กเอาต์ OpenClaw ของคุณโดยอัตโนมัติเมื่อใช้งานครั้งแรก (โดยตรวจสอบพาธทั่วไป เช่น `~/openclaw`, `~/projects/openclaw`) และแคชผลลัพธ์ไว้ใน `~/.clawdock/config` หากเช็กเอาต์ของคุณอยู่ที่อื่น ให้ตั้งค่า `CLAWDOCK_DIR` ด้วยตนเอง

## สิ่งที่คุณจะได้รับ

### การดำเนินการพื้นฐาน

| คำสั่ง             | คำอธิบาย                    |
| ------------------ | --------------------------- |
| `clawdock-start`   | เริ่ม Gateway               |
| `clawdock-stop`    | หยุด Gateway                |
| `clawdock-restart` | เริ่ม Gateway ใหม่          |
| `clawdock-status`  | ตรวจสอบสถานะคอนเทนเนอร์     |
| `clawdock-logs`    | ติดตามบันทึกของ Gateway     |

### การเข้าถึงคอนเทนเนอร์

| คำสั่ง                     | คำอธิบาย                                      |
| ------------------------- | --------------------------------------------- |
| `clawdock-shell`          | เปิดเชลล์ภายในคอนเทนเนอร์ Gateway             |
| `clawdock-cli <command>`  | เรียกใช้คำสั่ง CLI ของ OpenClaw ใน Docker     |
| `clawdock-exec <command>` | เรียกใช้คำสั่งใด ๆ ภายในคอนเทนเนอร์           |

### เว็บ UI และการจับคู่

| คำสั่ง                   | คำอธิบาย                          |
| ----------------------- | --------------------------------- |
| `clawdock-dashboard`    | เปิด URL ของ UI ควบคุม            |
| `clawdock-devices`      | แสดงรายการการจับคู่อุปกรณ์ที่รอดำเนินการ |
| `clawdock-approve <id>` | อนุมัติคำขอจับคู่                 |

### การตั้งค่าและการบำรุงรักษา

| คำสั่ง                | คำอธิบาย                                          |
| -------------------- | ------------------------------------------------- |
| `clawdock-fix-token` | เขียนโทเค็น Gateway ลงในการกำหนดค่าคอนเทนเนอร์    |
| `clawdock-update`    | ดึงข้อมูล สร้างใหม่ และเริ่มใหม่                  |
| `clawdock-rebuild`   | สร้างอิมเมจ Docker ใหม่เท่านั้น                   |
| `clawdock-clean`     | ลบคอนเทนเนอร์และวอลุ่ม                            |

### ยูทิลิตี

| คำสั่ง                  | คำอธิบาย                                            |
| ---------------------- | --------------------------------------------------- |
| `clawdock-health`      | เรียกใช้การตรวจสอบความพร้อมใช้งานของ Gateway        |
| `clawdock-token`       | แสดงโทเค็น Gateway                                  |
| `clawdock-cd`          | ไปยังไดเรกทอรีโครงการ OpenClaw                      |
| `clawdock-config`      | เปิด `~/.openclaw`                                  |
| `clawdock-show-config` | แสดงไฟล์การกำหนดค่าโดยปกปิดค่าที่ละเอียดอ่อน         |
| `clawdock-workspace`   | เปิดไดเรกทอรีเวิร์กสเปซ                              |
| `clawdock-help`        | แสดงรายการคำสั่ง ClawDock ทั้งหมด                   |

## ขั้นตอนการใช้งานครั้งแรก

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

## การกำหนดค่าและข้อมูลลับ

ClawDock อ่านไฟล์ `.env` สองไฟล์แยกกันตามการแบ่งที่อธิบายไว้ใน [Docker](/th/install/docker):

- ไฟล์ `.env` ของโครงการที่อยู่ถัดจาก `docker-compose.yml`: ค่าที่ใช้เฉพาะกับ Docker เช่น ชื่ออิมเมจ พอร์ต และ `OPENCLAW_GATEWAY_TOKEN` โดย `clawdock-token` จะอ่านโทเค็นจากที่นี่
- `~/.openclaw/.env` (เมานต์เข้าไปในคอนเทนเนอร์): ข้อมูลลับที่อ้างอิงจากตัวแปรสภาพแวดล้อมซึ่ง OpenClaw จัดการเอง โดยอยู่ร่วมกับ `openclaw.json` และ `agents/<agentId>/agent/auth-profiles.json`

`clawdock-fix-token` จะคัดลอกโทเค็นจากไฟล์ `.env` ของโครงการไปยังค่าการกำหนดค่า `gateway.remote.token` และ `gateway.auth.token` ของคอนเทนเนอร์ แล้วเริ่ม Gateway ใหม่

ใช้ `clawdock-show-config` เพื่อตรวจสอบ `openclaw.json` และไฟล์ `.env` ทั้งสองอย่างรวดเร็ว โดยคำสั่งนี้จะปกปิดค่าจาก `.env` ในผลลัพธ์ที่แสดง

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Docker" href="/th/install/docker" icon="docker">
    วิธีติดตั้ง OpenClaw ด้วย Docker ที่เป็นมาตรฐาน
  </Card>
  <Card title="รันไทม์ VM ของ Docker" href="/th/install/docker-vm-runtime" icon="cube">
    รันไทม์ VM ที่จัดการโดย Docker เพื่อการแยกสภาพแวดล้อมที่มีความปลอดภัยสูงขึ้น
  </Card>
  <Card title="การอัปเดต" href="/th/install/updating" icon="arrow-up-right-from-square">
    การอัปเดตแพ็กเกจ OpenClaw และบริการที่มีการจัดการ
  </Card>
</CardGroup>
