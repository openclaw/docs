---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตนและต้องการวิธีแก้แบบแนะนำ
    - คุณเพิ่งอัปเดตและต้องการตรวจสอบความเรียบร้อยเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบแนะนำ)
title: Doctor
x-i18n:
    generated_at: "2026-04-26T11:26:15Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1e2c21765f8c287c8d2aa066004ac516566c76a455337c377cf282551619e92a
    source_path: cli/doctor.md
    workflow: 15
---

# `openclaw doctor`

การตรวจสอบสถานะ + การแก้ไขอย่างรวดเร็วสำหรับ Gateway และ channels

ที่เกี่ยวข้อง:

- การแก้ไขปัญหา: [การแก้ไขปัญหา](/th/gateway/troubleshooting)
- การตรวจสอบความปลอดภัย: [ความปลอดภัย](/th/gateway/security)

## ตัวอย่าง

```bash
openclaw doctor
openclaw doctor --repair
openclaw doctor --deep
openclaw doctor --repair --non-interactive
openclaw doctor --generate-gateway-token
```

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดคำแนะนำเกี่ยวกับหน่วยความจำ/การค้นหาของ workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำโดยไม่ถาม
- `--fix`: ชื่ออื่นของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงเขียนทับ service config แบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: ทำงานโดยไม่ถาม; ใช้เฉพาะการย้ายข้อมูลที่ปลอดภัย
- `--generate-gateway-token`: สร้างและกำหนดค่า gateway token
- `--deep`: สแกน system services เพื่อค้นหาการติดตั้ง Gateway เพิ่มเติม

หมายเหตุ:

- prompt แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะทำงานเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้ง `--non-interactive` การรันแบบ headless (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้าม prompt
- ประสิทธิภาพ: การรัน `doctor` แบบ non-interactive จะข้ามการโหลด Plugin แบบ eager เพื่อให้การตรวจสอบสถานะแบบ headless เร็วอยู่เสมอ ส่วนเซสชันแบบโต้ตอบจะยังคงโหลด Plugins เต็มรูปแบบเมื่อการตรวจสอบต้องใช้ข้อมูลจาก Plugin เหล่านั้น
- `--fix` (ชื่ออื่นของ `--repair`) จะเขียนไฟล์สำรองไปยัง `~/.openclaw/openclaw.json.bak` และลบ config keys ที่ไม่รู้จัก พร้อมแสดงรายการแต่ละรายการที่ถูกลบ
- การตรวจสอบความสมบูรณ์ของ state สามารถตรวจจับไฟล์ transcript ที่ไม่มีเจ้าของในไดเรกทอรี sessions ได้แล้ว และสามารถจัดเก็บเป็น `.deleted.<timestamp>` เพื่อกู้คืนพื้นที่อย่างปลอดภัย
- Doctor จะสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบ Cron job แบบเก่า และสามารถเขียนทับให้ใหม่ในที่เดิมก่อนที่ scheduler จะต้องทำการปรับรูปแบบอัตโนมัติขณะรันไทม์
- Doctor ซ่อมแซม runtime dependencies ของ bundled plugin ที่หายไปโดยไม่เขียนลงในการติดตั้ง global แบบแพ็กเกจ สำหรับการติดตั้ง npm ที่เป็นเจ้าของโดย root หรือ systemd units ที่มีการป้องกันเข้มงวด ให้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` เป็นไดเรกทอรีที่เขียนได้ เช่น `/var/lib/openclaw/plugin-runtime-deps`
- ตั้ง `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อมี supervisor อื่นเป็นผู้ดูแลวงจรชีวิตของ Gateway Doctor จะยังคงรายงานสถานะของ Gateway/service และใช้การซ่อมแซมที่ไม่เกี่ยวกับ service แต่จะข้ามการติดตั้ง/เริ่มต้น/รีสตาร์ต/bootstrap service และการล้างบริการแบบเก่า
- Doctor จะย้าย Talk config แบบ flat รุ่นเก่า (`talk.voiceId`, `talk.modelId` และที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้งาน Talk normalization เมื่อความแตกต่างมีเพียงลำดับของคีย์ในอ็อบเจ็กต์
- Doctor มีการตรวจสอบความพร้อมของ memory-search และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มี embedding credentials
- หากเปิดใช้ sandbox mode แต่ Docker ใช้งานไม่ได้ doctor จะรายงานคำเตือนที่ชัดเจนพร้อมแนวทางแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียน credentials แบบ plaintext สำรอง
- หากการตรวจสอบ SecretRef ของ channel ล้มเหลวในเส้นทางการแก้ไข doctor จะทำงานต่อและรายงานคำเตือนแทนการออกจากโปรแกรมก่อนกำหนด
- การ resolve username อัตโนมัติสำหรับ Telegram `allowFrom` (`doctor --fix`) ต้องใช้ Telegram token ที่สามารถ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากไม่สามารถตรวจสอบ token ได้ doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติในรอบนั้น

## macOS: `launchctl` env overrides

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะมีความสำคัญเหนือ config file ของคุณ และอาจทำให้เกิดข้อผิดพลาด “unauthorized” แบบต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
