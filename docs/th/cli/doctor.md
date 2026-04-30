---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตนและต้องการการแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจสอบ
x-i18n:
    generated_at: "2026-04-30T09:42:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9985c84d23861dd9468a4659ee00519573fe6d540c436548da0a68067dbabc4c
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทาง

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

- `--no-workspace-suggestions`: ปิดคำแนะนำหน่วยความจำ/การค้นหาของ workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ต้องถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำโดยไม่ต้องถาม
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมป์ เฉพาะการย้ายข้อมูลที่ปลอดภัยเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหา gateway ที่ติดตั้งเพิ่มเติม

หมายเหตุ:

- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` เท่านั้น การรันแบบไม่มีหน้าจอ (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสุขภาพแบบไม่มีหน้าจอรวดเร็ว เซสชันแบบโต้ตอบจะยังโหลด Plugin อย่างครบถ้วนเมื่อการตรวจต้องใช้ส่วนร่วมจาก Plugin เหล่านั้น
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และทิ้งคีย์การกำหนดค่าที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- การตรวจสอบความถูกต้องของสถานะตอนนี้ตรวจพบไฟล์ transcript ที่ถูกทิ้งไว้ในไดเรกทอรีเซสชัน การเก็บถาวรเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไฟล์เหล่านั้นไว้ตามเดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน cron แบบเดิม และสามารถเขียนทับในที่เดิมก่อนที่ตัวกำหนดเวลาจะต้อง auto-normalize ระหว่างรันไทม์
- Doctor ซ่อมแซม dependency รันไทม์ของ Plugin ที่ bundled มาแต่ขาดหายไป โดยไม่เขียนลงในการติดตั้ง global แบบแพ็กเกจ สำหรับการติดตั้ง npm ที่ root เป็นเจ้าของหรือ systemd unit ที่ hardened ให้ตั้ง `OPENCLAW_PLUGIN_STAGE_DIR` เป็นไดเรกทอรีที่เขียนได้ เช่น `/var/lib/openclaw/plugin-runtime-deps`; ค่านี้ยังเป็นรายการพาธได้ เช่น `/opt/openclaw/plugin-runtime-deps:/var/lib/openclaw/plugin-runtime-deps` โดย root ก่อนหน้าจะเป็นเลเยอร์ค้นหาแบบอ่านอย่างเดียว และ root สุดท้ายคือเป้าหมายการซ่อมแซม
- Doctor ซ่อมแซมการกำหนดค่า Plugin ที่ล้าสมัย โดยลบ id ของ Plugin ที่หายไปออกจาก `plugins.allow`/`plugins.entries` รวมถึงการกำหนดค่าช่องทางที่ค้างอยู่ เป้าหมาย heartbeat และการ override โมเดลของช่องทางที่ตรงกัน เมื่อการค้นพบ Plugin ทำงานปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้อง โดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้องของรายการนั้น การเริ่มต้น Gateway ข้ามเฉพาะ Plugin ที่เสียอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังรันต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของวงจรชีวิตของ gateway Doctor จะยังรายงานสุขภาพของ gateway/บริการ และใช้การซ่อมแซมที่ไม่เกี่ยวกับบริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/bootstrap บริการ และการล้างบริการเดิม
- บน Linux, doctor จะละเว้น systemd unit ที่คล้าย gateway เพิ่มเติมซึ่งไม่ทำงาน และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่ให้บริการ systemd gateway ที่กำลังรันอยู่ระหว่างการซ่อมแซม ให้หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อตั้งใจจะแทนที่ตัวเรียกใช้งานที่ใช้งานอยู่
- Doctor auto-migrate การกำหนดค่า Talk แบบ flat เดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>`
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การ normalize ของ Talk อีกต่อไปเมื่อความแตกต่างมีเพียงลำดับคีย์ของอ็อบเจ็กต์
- Doctor มีการตรวจ readiness ของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อข้อมูลรับรองสำหรับ embedding หายไป
- Doctor เตือนเมื่อไม่ได้กำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานมนุษย์ที่ได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการกระทำที่อันตราย การจับคู่ DM แค่อนุญาตให้บางคนคุยกับบอทได้เท่านั้น หากคุณอนุมัติผู้ส่งก่อนที่ bootstrap เจ้าของคนแรกจะมีอยู่ ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หาก `gateway.auth.token`/`gateway.auth.password` จัดการโดย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียนข้อมูลรับรอง plaintext สำรอง
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทางแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนที่จะออกก่อนกำหนด
- การ auto-resolution ชื่อผู้ใช้ `allowFrom` ของ Telegram (`doctor --fix`) ต้องมีโทเค็น Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้าม auto-resolution สำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์การกำหนดค่าของคุณและอาจทำให้เกิดข้อผิดพลาด “unauthorized” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
