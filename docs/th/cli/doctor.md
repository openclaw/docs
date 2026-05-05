---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การยืนยันตัวตน และต้องการวิธีแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-05T08:25:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6101008d1cb7e08f9902a8a29785710f325966524b003b87b5c628fe906ab78
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
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ต้องถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่เกี่ยวกับบริการโดยไม่ต้องถาม; การติดตั้งและเขียนบริการ Gateway ใหม่ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับ config บริการที่ปรับแต่งเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมป์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่เกี่ยวกับบริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหา Gateway ที่ติดตั้งเพิ่มเติม และรายงานการส่งต่อการรีสตาร์ตล่าสุดของตัวควบคุม Gateway

หมายเหตุ:

- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` ไว้ การรันแบบไม่มีหน้าจอ (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด plugin ล่วงหน้า เพื่อให้การตรวจสอบสถานะแบบไม่มีหน้าจอยังคงรวดเร็ว เซสชันแบบโต้ตอบยังคงโหลด plugins ทั้งหมดเมื่อการตรวจสอบต้องใช้ส่วนร่วมของ plugins เหล่านั้น
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์ config ที่ไม่รู้จัก พร้อมแสดงรายการที่ถูกลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานข้อกำหนดบริการ Gateway ที่หายไปหรือล้าสมัย แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่หายไป หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ launcher
- ตอนนี้การตรวจสอบความถูกต้องของสถานะตรวจพบไฟล์ transcript ที่หลงเหลือในไดเรกทอรี sessions การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไฟล์ไว้ตามเดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron แบบเก่า และสามารถเขียนใหม่ในที่เดิมก่อนที่ตัวจัดตารางเวลาจะต้องปรับให้เป็นปกติอัตโนมัติขณะรันไทม์
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังคงรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบเก่า; สคริปต์นั้นไม่ได้รับการดูแลแล้ว และอาจบันทึกเหตุขัดข้อง Gateway ของ WhatsApp แบบผิดพลาดเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้งาน WhatsApp, doctor จะตรวจสอบลูปเหตุการณ์ Gateway ที่เสื่อมสภาพโดยยังมีไคลเอนต์ `openclaw-tui` ภายในเครื่องทำงานอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ภายในเครื่องที่ยืนยันแล้ว เพื่อไม่ให้การตอบกลับ WhatsApp ถูกต่อคิวไว้หลังลูปรีเฟรช TUI ที่ค้างอยู่
- Doctor ล้างสถานะ staging ของ dependency plugin แบบเก่าที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อมแซม plugins ที่ดาวน์โหลดได้ซึ่งหายไปและถูกอ้างอิงโดย config เช่น `plugins.entries`, ช่องทางที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือรันไทม์ agent ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อมแซม plugin ของ package-manager จนกว่าการสลับแพ็กเกจจะเสร็จสมบูรณ์; รัน `openclaw doctor --fix` อีกครั้งภายหลังหาก plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและคงรายการ plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมแซมครั้งถัดไป
- Doctor ซ่อมแซม config plugin ที่ล้าสมัยโดยลบ id ของ plugin ที่หายไปออกจาก `plugins.allow`/`plugins.entries` พร้อม config ช่องทางที่ค้างอยู่ เป้าหมาย Heartbeat และการ override โมเดลของช่องทางที่ตรงกัน เมื่อการค้นหา plugin ทำงานสมบูรณ์
- Doctor กักกัน config plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้องออก การเริ่มต้น Gateway จะข้ามเฉพาะ plugin ที่เสียตัวนั้นอยู่แล้ว เพื่อให้ plugins และช่องทางอื่นยังทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของวงจรชีวิตของ Gateway Doctor ยังรายงานสถานะ Gateway/บริการและใช้การซ่อมแซมที่ไม่เกี่ยวกับบริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ต/บูตสแตรปบริการ และการล้างบริการเก่า
- บน Linux, doctor จะละเว้น systemd units ที่คล้าย Gateway เพิ่มเติมซึ่งไม่ได้ใช้งาน และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ systemd Gateway ที่กำลังทำงานระหว่างการซ่อมแซม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ launcher ที่ใช้งานอยู่
- Doctor ย้าย config Talk แบบแบนเดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การปรับ Talk ให้เป็นปกติอีกต่อไปเมื่อความแตกต่างมีเพียงลำดับคีย์ของออบเจ็กต์
- Doctor รวมการตรวจสอบความพร้อมของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อข้อมูลรับรอง embedding หายไป
- Doctor เตือนเมื่อไม่ได้กำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการดำเนินการที่อันตราย การจับคู่ DM เพียงอนุญาตให้บางคนคุยกับบอทได้เท่านั้น; หากคุณอนุมัติผู้ส่งก่อนที่จะมีการบูตสแตรปเจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อกำหนดค่า agents โหมด Codex และมีแอสเซ็ต Codex CLI ส่วนตัวอยู่ใน Codex home ของผู้ปฏิบัติงาน การเปิดใช้เซิร์ฟเวอร์แอป Codex ภายในเครื่องใช้ home แยกต่อ agent ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำบัญชีแอสเซ็ตที่ควรเลื่อนระดับอย่างตั้งใจ
- Doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อมรันไทม์ปัจจุบัน เพราะ bins, env vars, config หรือข้อกำหนด OS หายไป `doctor --fix` สามารถปิดใช้งาน Skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่หายไปแทนเมื่อคุณต้องการให้ skill ยังคงใช้งานอยู่
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry sandbox แบบเก่า (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องไปยังไดเรกทอรี registry แบบแบ่ง shard และกักกันไฟล์เก่าที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการโดย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียนข้อมูลรับรอง fallback เป็นข้อความธรรมดา
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทางแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนที่จะออกก่อนเวลา
- หลังจากการย้ายไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานอยู่พึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานต่อโปรเซส doctor
- การแก้ชื่อผู้ใช้ Telegram `allowFrom` อัตโนมัติ (`doctor --fix`) ต้องมีโทเค็น Telegram ที่แก้ได้ในเส้นทางคำสั่งปัจจุบัน หากตรวจสอบโทเค็นไม่ได้ doctor จะรายงานคำเตือนและข้ามการแก้อัตโนมัติสำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะแทนที่ไฟล์ config ของคุณ และอาจทำให้เกิดข้อผิดพลาด “unauthorized” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
