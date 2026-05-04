---
read_when:
    - คุณมีปัญหาด้านการเชื่อมต่อ/การยืนยันตัวตนและต้องการคำแนะนำในการแก้ไข
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสุขภาพ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตรวจสุขภาพ
x-i18n:
    generated_at: "2026-05-04T02:22:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: cd7fb09d373c313e4be45ad9e3b19ceb187a5787ef3e70fcd2b1f1f01b50c905
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทางต่าง ๆ

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

- `--no-workspace-suggestions`: ปิดคำแนะนำหน่วยความจำ/การค้นหาของเวิร์กสเปซ
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่ถาม; การติดตั้งและการเขียนบริการ Gateway ใหม่ยังคงต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมป์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติม

หมายเหตุ:

- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบไม่มีหน้าจอ (Cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin แบบ eager เพื่อให้การตรวจสุขภาพแบบไม่มีหน้าจอยังคงเร็ว เซสชันแบบโต้ตอบยังคงโหลด Plugin ทั้งหมดเมื่อการตรวจสอบต้องใช้ข้อมูลจาก Plugin เหล่านั้น
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์การกำหนดค่าที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่หายไปหรือล้าสมัย แต่ไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่หายไป หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ตัวเรียกใช้งาน
- การตรวจสอบความถูกต้องของสถานะตอนนี้ตรวจพบไฟล์ transcript กำพร้าในไดเรกทอรีเซสชันแล้ว การเก็บถาวรเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไว้ตามเดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron รุ่นเก่า และสามารถเขียนใหม่ในที่เดิมก่อนที่ตัวจัดกำหนดการจะต้องทำให้เป็นมาตรฐานโดยอัตโนมัติในขณะรันไทม์
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังรัน `~/.openclaw/bin/ensure-whatsapp.sh` รุ่นเก่า; สคริปต์นั้นไม่ได้รับการดูแลอีกต่อไป และอาจบันทึกเหตุขัดข้อง Gateway ของ WhatsApp ที่เป็นเท็จเมื่อ Cron ไม่มีสภาพแวดล้อม systemd user-bus
- Doctor ล้างสถานะการเตรียม dependency ของ Plugin รุ่นเก่าที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อมแซม Plugin แบบดาวน์โหลดได้ที่กำหนดค่าไว้แต่หายไปเมื่อ registry สามารถ resolve ได้ และการผ่าน doctor รุ่น 2026.5.2 จะติดตั้ง Plugin แบบดาวน์โหลดได้ที่การกำหนดค่ารุ่นเก่าใช้อยู่แล้วโดยอัตโนมัติก่อนทำเครื่องหมายว่าการกำหนดค่านั้นถูกแตะสำหรับรุ่นดังกล่าว หากดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและคงรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมแซมครั้งถัดไป
- Doctor ซ่อมแซมการกำหนดค่า Plugin ที่ล้าสมัยโดยลบ id ของ Plugin ที่หายไปออกจาก `plugins.allow`/`plugins.entries` รวมถึงการกำหนดค่าช่องทางที่ค้างอยู่ เป้าหมาย Heartbeat และการ override โมเดลของช่องทางที่ตรงกันเมื่อการค้นพบ Plugin ทำงานปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบและลบ payload `config` ที่ไม่ถูกต้องออก การเริ่มต้น Gateway ข้ามเฉพาะ Plugin ที่เสียรายการนั้นอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่น ๆ ทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของวงจรชีวิตของ Gateway Doctor ยังคงรายงานสุขภาพของ Gateway/บริการและใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการ และการล้างบริการรุ่นเก่า
- บน Linux, doctor จะละเว้น systemd unit ลักษณะคล้าย Gateway เพิ่มเติมที่ไม่ทำงาน และไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ Gateway ของ systemd ที่กำลังทำงานระหว่างการซ่อมแซม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ตัวเรียกใช้งานที่ใช้งานอยู่
- Doctor ย้ายการกำหนดค่า Talk แบบ flat รุ่นเก่า (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การทำให้ Talk เป็นมาตรฐานอีกต่อไปเมื่อความแตกต่างเดียวคือการเรียงลำดับคีย์ของออบเจ็กต์
- Doctor รวมการตรวจสอบความพร้อมของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อข้อมูลรับรอง embedding หายไป
- Doctor เตือนเมื่อไม่ได้กำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งสำหรับเจ้าของเท่านั้นและอนุมัติการดำเนินการที่อันตราย การจับคู่ DM แค่อนุญาตให้บางคนคุยกับบอทได้; หากคุณเคยอนุมัติผู้ส่งก่อนมี bootstrap เจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่า agent โหมด Codex และมี asset ของ Codex CLI ส่วนบุคคลอยู่ใน Codex home ของผู้ปฏิบัติงาน การเปิดใช้ app-server ของ Codex ในเครื่องใช้ home แยกต่อ agent ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำบัญชี asset ที่ควรเลื่อนระดับอย่างตั้งใจ
- Doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อมรันไทม์ปัจจุบันเนื่องจาก bins, env vars, config หรือข้อกำหนดของ OS หายไป `doctor --fix` สามารถปิดใช้งาน Skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่หายไปแทนเมื่อคุณต้องการให้ skill ยังคงทำงานอยู่
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry ของ sandbox รุ่นเก่า (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องเข้าไปในไดเรกทอรี registry แบบ sharded และกักกันไฟล์รุ่นเก่าที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` จัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและไม่เขียนข้อมูลรับรอง fallback แบบ plaintext
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทาง fix doctor จะทำงานต่อและรายงานคำเตือนแทนที่จะออกก่อนกำหนด
- หลังจากการย้ายไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานพึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานกับโปรเซส doctor
- การ resolve ชื่อผู้ใช้ `allowFrom` ของ Telegram โดยอัตโนมัติ (`doctor --fix`) ต้องใช้โทเค็น Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากไม่สามารถตรวจสอบโทเค็นได้ doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติสำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์การกำหนดค่าของคุณและอาจทำให้เกิดข้อผิดพลาด “ไม่ได้รับอนุญาต” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
