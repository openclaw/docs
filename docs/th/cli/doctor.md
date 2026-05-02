---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การตรวจสอบสิทธิ์ และต้องการคำแนะนำในการแก้ไข
    - คุณอัปเดตแล้วและต้องการตรวจสอบความสมเหตุสมผล
summary: คู่มืออ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-02T10:11:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: e861fa105737088eafa55815faa1a37ccd61e154e8dbe811cf4b988bc1c571e5
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสอบสถานะ + การแก้ไขด่วนสำหรับ Gateway และช่องทาง

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

- `--no-workspace-suggestions`: ปิดใช้งานคำแนะนำหน่วยความจำ/การค้นหาของเวิร์กสเปซ
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่แจ้งถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่แจ้งถาม; การติดตั้งและการเขียนบริการ Gateway ใหม่ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: ชื่อแทนของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมป์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติม

หมายเหตุ:

- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบไม่มีหน้าจอ (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสอบสถานะแบบไม่มีหน้าจอยังคงรวดเร็ว เซสชันแบบโต้ตอบยังคงโหลด Plugin ทั้งหมดเมื่อการตรวจสอบต้องใช้ข้อมูลจาก Plugin เหล่านั้น
- `--fix` (ชื่อแทนของ `--repair`) เขียนข้อมูลสำรองไปยัง `~/.openclaw/openclaw.json.bak` และลบคีย์การกำหนดค่าที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่หายไปหรือเก่า แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่หายไป หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งาน
- การตรวจสอบความสมบูรณ์ของสถานะตอนนี้ตรวจพบไฟล์ทรานสคริปต์กำพร้าในไดเรกทอรีเซสชัน การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไว้ตามเดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron แบบเดิม และสามารถเขียนใหม่ในที่เดิมก่อนที่ตัวจัดกำหนดการจะต้องปรับให้เป็นมาตรฐานอัตโนมัติขณะรัน
- บน Linux Doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังคงรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม; สคริปต์นั้นไม่ได้รับการดูแลแล้ว และอาจบันทึกเหตุขัดข้องของ WhatsApp Gateway ที่ไม่ถูกต้องเมื่อ Cron ไม่มีสภาพแวดล้อม systemd user-bus
- Doctor ล้างสถานะการเตรียม dependency ของ Plugin แบบเดิมที่สร้างโดย OpenClaw เวอร์ชันเก่า และยังซ่อมแซม Plugin ที่ดาวน์โหลดได้ซึ่งกำหนดค่าไว้แต่หายไป เมื่อ registry สามารถ resolve ได้
- Doctor ซ่อมแซมการกำหนดค่า Plugin ที่เก่า โดยลบ id ของ Plugin ที่หายไปจาก `plugins.allow`/`plugins.entries` รวมถึงการกำหนดค่าช่องทางที่ค้างอยู่ เป้าหมาย Heartbeat และการ override โมเดลของช่องทางที่ตรงกัน เมื่อการค้นพบ Plugin อยู่ในสถานะปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้องออก การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin ที่เสียรายการนั้นอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของวงจรชีวิต Gateway Doctor ยังรายงานสถานะ Gateway/บริการและใช้การซ่อมแซมที่ไม่ใช่บริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ และการล้างบริการแบบเดิม
- บน Linux Doctor จะละเว้น systemd units เพิ่มเติมที่คล้าย Gateway แต่ไม่ทำงาน และจะไม่เขียน metadata คำสั่ง/entrypoint ใหม่สำหรับบริการ systemd Gateway ที่กำลังรันอยู่ระหว่างการซ่อมแซม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งานที่ใช้งานอยู่
- Doctor ย้ายการกำหนดค่า Talk แบบแบนเดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การปรับ Talk ให้เป็นมาตรฐานอีกต่อไป เมื่อความแตกต่างมีเพียงลำดับคีย์ของอ็อบเจกต์
- Doctor มีการตรวจสอบความพร้อมของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อข้อมูลรับรอง embedding หายไป
- Doctor เตือนเมื่อไม่ได้กำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติการที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการกระทำที่อันตราย การจับคู่ DM แค่อนุญาตให้ใครบางคนคุยกับบอตได้เท่านั้น; หากคุณอนุมัติผู้ส่งก่อนที่จะมีการบูตสแตรปเจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่าเอเจนต์โหมด Codex และมีสินทรัพย์ Codex CLI ส่วนตัวอยู่ใน Codex home ของผู้ปฏิบัติการ การเปิด local Codex app-server ใช้ home แยกต่อเอเจนต์ ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำรายการสินทรัพย์ที่ควรเลื่อนขึ้นอย่างตั้งใจ
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน Doctor จะรายงานคำเตือนที่ชัดเจนพร้อมแนวทางแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` จัดการโดย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน Doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและไม่เขียนข้อมูลรับรอง fallback แบบข้อความล้วน
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทางการแก้ไข Doctor จะดำเนินการต่อและรายงานคำเตือนแทนการออกก่อนกำหนด
- หลังการย้ายไดเรกทอรีสถานะ Doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานต้องพึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานสำหรับโปรเซส Doctor
- การ resolve ชื่อผู้ใช้ `allowFrom` ของ Telegram โดยอัตโนมัติ (`doctor --fix`) ต้องใช้โทเค็น Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน Doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติสำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์การกำหนดค่าของคุณและอาจทำให้เกิดข้อผิดพลาด “ไม่ได้รับอนุญาต” แบบต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
