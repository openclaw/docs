---
read_when:
    - คุณพบปัญหาการเชื่อมต่อ/การตรวจสอบสิทธิ์ และต้องการวิธีแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-03T21:28:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: d4baab5b0cd4d046d12ae5bd14ccf05224115856d45e630a57e77a2be15e5db0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทางต่าง ๆ

ที่เกี่ยวข้อง:

- การแก้ปัญหา: [การแก้ปัญหา](/th/gateway/troubleshooting)
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
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่เกี่ยวกับบริการโดยไม่ถาม; การติดตั้งและการเขียนบริการ Gateway ใหม่ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการตั้งค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมป์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่เกี่ยวกับบริการ
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติม

หมายเหตุ:

- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบไม่มีหัว (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin แบบ eager เพื่อให้การตรวจสุขภาพแบบไม่มีหัวทำงานเร็ว เซสชันแบบโต้ตอบยังคงโหลด Plugin ทั้งหมดเมื่อการตรวจต้องใช้ส่วนร่วมจาก Plugin เหล่านั้น
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์การตั้งค่าที่ไม่รู้จัก โดยแสดงรายการการลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่ขาดหายหรือล้าสมัย แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่ขาดหาย หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งาน
- ตอนนี้การตรวจความสมบูรณ์ของสถานะตรวจพบไฟล์ทรานสคริปต์กำพร้าในไดเรกทอรีเซสชันแล้ว การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหัวจะปล่อยไฟล์เหล่านั้นไว้ที่เดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน cron แบบเก่า และสามารถเขียนใหม่ทับที่เดิมได้ก่อนที่ตัวจัดตารางเวลาจะต้องปรับให้เป็นมาตรฐานอัตโนมัติขณะรันไทม์
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังคงรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบเก่า; สคริปต์นั้นไม่ได้รับการดูแลอีกต่อไปและอาจบันทึกเหตุขัดข้อง Gateway ของ WhatsApp ที่เป็นเท็จเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- Doctor ล้างสถานะการเตรียม dependency ของ Plugin แบบเก่าที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อมแซม Plugin แบบดาวน์โหลดได้ที่ถูกตั้งค่าไว้แต่ขาดหายเมื่อ registry สามารถ resolve ได้ และการรัน doctor ใน 2026.5.2 จะติดตั้ง Plugin แบบดาวน์โหลดได้ที่ config เก่าใช้อยู่โดยอัตโนมัติก่อนทำเครื่องหมายว่า config ถูกแตะสำหรับรีลีสนั้น
- Doctor ซ่อมแซม config Plugin ที่ล้าสมัยโดยลบ id ของ Plugin ที่ขาดหายจาก `plugins.allow`/`plugins.entries` รวมถึง config ช่องทางที่ค้างอยู่ เป้าหมาย Heartbeat และการ override โมเดลของช่องทางที่ตรงกัน เมื่อการค้นพบ Plugin ทำงานปกติ
- Doctor กักกัน config Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้อง การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin ที่เสียอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่น ๆ ทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของวงจรชีวิตของ Gateway Doctor ยังคงรายงานสุขภาพ Gateway/บริการและใช้การซ่อมแซมที่ไม่เกี่ยวกับบริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการและการล้างบริการเก่า
- บน Linux, doctor จะไม่สนใจหน่วย systemd เพิ่มเติมที่คล้าย Gateway ซึ่ง inactive และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ Gateway ของ systemd ที่กำลังรันอยู่ระหว่างการซ่อมแซม หยุดบริการก่อนหรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งานที่ active อยู่
- Doctor ย้าย config Talk แบบ flat เก่า (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การ normalize ของ Talk อีกต่อไปเมื่อความแตกต่างมีเพียงลำดับคีย์ของ object
- Doctor รวมการตรวจความพร้อมของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มี credentials สำหรับ embedding
- Doctor เตือนเมื่อไม่มีการกำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติการที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการกระทำที่อันตราย การจับคู่ DM เพียงแค่อนุญาตให้ใครบางคนคุยกับบอตได้; หากคุณอนุมัติผู้ส่งก่อนที่ bootstrap เจ้าของคนแรกจะมีอยู่ ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่าเอเจนต์โหมด Codex และมี asset ของ Codex CLI ส่วนบุคคลอยู่ใน Codex home ของผู้ปฏิบัติการ การเปิด local Codex app-server ใช้ home แยกต่อเอเจนต์ ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำบัญชี asset ที่ควรถูกเลื่อนสถานะอย่างตั้งใจ
- Doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับเอเจนต์เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อมรันไทม์ปัจจุบัน เพราะขาด bin, env var, config หรือข้อกำหนดของ OS `doctor --fix` สามารถปิดใช้งาน Skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดแทนเมื่อคุณต้องการให้ Skills นั้นยัง active
- หากเปิดใช้โหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry sandbox แบบเก่า (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องไปยังไดเรกทอรี registry แบบ sharded และกักกันไฟล์เก่าที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการโดย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและจะไม่เขียน credentials fallback แบบ plaintext
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทางการแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนที่จะออกก่อนเวลา
- หลังการย้ายข้อมูลไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานอยู่พึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานสำหรับโปรเซส doctor
- การ resolve ชื่อผู้ใช้ `allowFrom` ของ Telegram โดยอัตโนมัติ (`doctor --fix`) ต้องใช้โทเค็น Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้ามการ resolve อัตโนมัติสำหรับการรันครั้งนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์ config ของคุณและอาจทำให้เกิดข้อผิดพลาด “unauthorized” ต่อเนื่องได้

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
