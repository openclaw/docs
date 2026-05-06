---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การตรวจสอบสิทธิ์และต้องการการแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสุขภาพ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-06T09:05:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: 20eff2f94b41315dbe1d393ebbbf6dce352a7f9e589db3b8fb51f423dd6fed28
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทางต่างๆ

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
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่ถาม; การติดตั้งและเขียนบริการ Gateway ใหม่ยังต้องการการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมป์; ทำเฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการ
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหา Gateway ที่ติดตั้งเพิ่มเติม และรายงานการส่งต่อการรีสตาร์ทของตัวควบคุม Gateway ล่าสุด

หมายเหตุ:

- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` เท่านั้น การรันแบบไม่มีหน้าจอ (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสุขภาพแบบไม่มีหน้าจอยังคงเร็ว เซสชันแบบโต้ตอบยังคงโหลด Plugin ทั้งหมดเมื่อการตรวจต้องใช้การมีส่วนร่วมของ Plugin
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์การกำหนดค่าที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานคำจำกัดความบริการ Gateway ที่หายไปหรือล้าสมัย แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่หายไป หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งาน
- ตอนนี้การตรวจสอบความสมบูรณ์ของสถานะตรวจพบไฟล์ถอดเสียงกำพร้าในไดเรกทอรีเซสชันแล้ว การเก็บถาวรเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไฟล์ไว้ที่เดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน cron เดิม และสามารถเขียนใหม่แทนที่เดิมก่อนที่ scheduler จะต้องทำให้เป็นมาตรฐานอัตโนมัติขณะรัน
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิมอยู่; สคริปต์นั้นไม่ได้รับการดูแลแล้ว และอาจบันทึกเหตุขัดข้องของ Gateway WhatsApp ที่ไม่จริงเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้ WhatsApp, doctor จะตรวจหา event loop ของ Gateway ที่เสื่อมสภาพโดยมีไคลเอนต์ `openclaw-tui` ในเครื่องยังรันอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ในเครื่องที่ตรวจยืนยันแล้วเท่านั้น เพื่อไม่ให้การตอบกลับ WhatsApp ถูกจัดคิวค้างหลังลูปรีเฟรช TUI ที่ล้าสมัย
- Doctor เขียน model refs เดิมแบบ `openai-codex/*` ใหม่เป็น refs มาตรฐาน `openai/*` ครอบคลุมโมเดลหลัก fallback, heartbeat/subagent/compaction overrides, hooks, การ override โมเดลของช่องทาง และพินเส้นทางเซสชันที่ล้าสมัย `--fix` จะเลือก `agentRuntime.id: "codex"` เฉพาะเมื่อมีการติดตั้ง Codex plugin, เปิดใช้งาน, มี harness `codex` และมี OAuth ที่ใช้งานได้; มิฉะนั้นจะเลือก `agentRuntime.id: "pi"` เพื่อให้เส้นทางยังอยู่บนตัวรัน OpenClaw เริ่มต้น
- Doctor ล้างสถานะการเตรียม dependency ของ Plugin แบบเดิมที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อมแซม Plugin ที่ดาวน์โหลดได้ซึ่งหายไปและถูกอ้างอิงโดยการกำหนดค่า เช่น `plugins.entries`, ช่องทางที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือ runtime ของ agent ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อมแซม Plugin ของ package-manager จนกว่าการสลับแพ็กเกจจะเสร็จสิ้น; รัน `openclaw doctor --fix` อีกครั้งหลังจากนั้นหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากการดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและเก็บรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมแซมครั้งถัดไป
- Doctor ซ่อมแซมการกำหนดค่า Plugin ที่ล้าสมัยโดยลบ id ของ Plugin ที่หายไปออกจาก `plugins.allow`/`plugins.entries` พร้อมการกำหนดค่าช่องทางที่ค้างอยู่, เป้าหมาย heartbeat และการ override โมเดลของช่องทางที่ตรงกันเมื่อการค้นพบ Plugin ทำงานปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้อง การเริ่มต้น Gateway จะข้ามเฉพาะ Plugin ที่เสียรายการนั้นอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังคงรันต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของวงจรชีวิตของ Gateway Doctor ยังคงรายงานสุขภาพของ Gateway/บริการ และใช้การซ่อมแซมที่ไม่ใช่บริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/bootstrap บริการ และการล้างบริการเดิม
- บน Linux, doctor จะละเว้น unit systemd ลักษณะคล้าย Gateway เพิ่มเติมที่ไม่ได้ทำงาน และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ Gateway systemd ที่กำลังรันอยู่ระหว่างการซ่อมแซม ให้หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งานที่ใช้งานอยู่
- Doctor ย้ายการกำหนดค่า Talk แบบ flat เดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การทำให้ Talk เป็นมาตรฐานอีกต่อไปเมื่อความแตกต่างมีเพียงลำดับคีย์ของออบเจ็กต์
- Doctor รวมการตรวจความพร้อมของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มีข้อมูลรับรอง embedding
- Doctor เตือนเมื่อไม่ได้กำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานมนุษย์ที่ได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการกระทำที่อันตราย การจับคู่ DM เพียงแค่อนุญาตให้บางคนคุยกับบอทได้; หากคุณอนุมัติผู้ส่งก่อนมี bootstrap เจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่า agent โหมด Codex และมี assets ของ Codex CLI ส่วนตัวอยู่ใน Codex home ของผู้ปฏิบัติงาน การเปิดใช้ app-server ของ Codex ในเครื่องใช้ home แยกตาม agent ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อตรวจรายการ assets ที่ควรยกระดับอย่างตั้งใจ
- Doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อม runtime ปัจจุบัน เพราะขาด bins, env vars, config หรือข้อกำหนด OS `doctor --fix` สามารถปิดใช้งาน skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดแทนเมื่อคุณต้องการให้ skill ยังคงทำงานอยู่
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry sandbox แบบเดิม (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องไปยังไดเรกทอรี registry แบบแบ่ง shard และกักกันไฟล์เดิมที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` จัดการโดย SecretRef และไม่พร้อมใช้งานใน path คำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียว และจะไม่เขียนข้อมูลรับรอง fallback แบบ plaintext
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวใน path การแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนการออกก่อนกำหนด
- หลังจากการย้ายไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานอยู่พึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานต่อกระบวนการ doctor
- การแก้ชื่อผู้ใช้ `allowFrom` ของ Telegram โดยอัตโนมัติ (`doctor --fix`) ต้องใช้โทเค็น Telegram ที่แก้ได้ใน path คำสั่งปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้ามการแก้อัตโนมัติสำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์การกำหนดค่าของคุณและอาจทำให้เกิดข้อผิดพลาด “ไม่ได้รับอนุญาต” อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
