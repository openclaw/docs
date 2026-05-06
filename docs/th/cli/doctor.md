---
read_when:
    - คุณมีปัญหาการเชื่อมต่อ/การตรวจสอบสิทธิ์ และต้องการคำแนะนำในการแก้ไข
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสุขภาพ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-06T17:53:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: eed73ecbec848ae3071448f2444735e2564680fee94cf1e22a73d1e7beaede80
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

- `--no-workspace-suggestions`: ปิดคำแนะนำหน่วยความจำ/การค้นหาใน workspace
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่เกี่ยวกับบริการโดยไม่ถาม; การติดตั้งบริการ Gateway และการเขียนใหม่ยังต้องใช้การยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มี prompt; เฉพาะ migration ที่ปลอดภัยและการซ่อมแซมที่ไม่เกี่ยวกับบริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหา Gateway ที่ติดตั้งเพิ่มเติม และรายงานการส่งต่อการรีสตาร์ทของ supervisor ของ Gateway ล่าสุด

หมายเหตุ:

- ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การตรวจสอบ doctor แบบอ่านอย่างเดียวยังทำงานได้ แต่ `doctor --fix`, `doctor --repair`, `doctor --yes` และ `doctor --generate-gateway-token` จะถูกปิดใช้งานเพราะ `openclaw.json` เปลี่ยนแปลงไม่ได้ ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
- prompt แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และไม่ได้ตั้งค่า `--non-interactive` การรันแบบ headless (cron, Telegram, ไม่มีเทอร์มินัล) จะข้าม prompt
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสุขภาพแบบ headless ยังรวดเร็ว session แบบโต้ตอบยังโหลด Plugin เต็มรูปแบบเมื่อการตรวจสอบต้องการส่วนร่วมจาก Plugin เหล่านั้น
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และตัดคีย์การกำหนดค่าที่ไม่รู้จักออก พร้อมแสดงรายการที่ถูกลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่ขาดหายหรือล้าสมัย แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่ขาดหาย หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ launcher
- ตอนนี้การตรวจสอบความถูกต้องของสถานะจะตรวจจับไฟล์ transcript กำพร้าในไดเรกทอรี sessions การเก็บถาวรเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบ headless จะปล่อยไว้ตามเดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron แบบเก่า และสามารถเขียนใหม่ทับที่เดิมก่อนที่ scheduler จะต้อง auto-normalize ตอน runtime
- บน Linux doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบเก่า; สคริปต์นั้นไม่ได้รับการดูแลแล้ว และอาจบันทึก outage ของ Gateway สำหรับ WhatsApp แบบผิดพลาดเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้ WhatsApp doctor จะตรวจสอบ event loop ของ Gateway ที่เสื่อมสภาพโดยมีไคลเอนต์ `openclaw-tui` ภายในเครื่องยังทำงานอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ภายในเครื่องที่ตรวจยืนยันแล้ว เพื่อให้การตอบกลับ WhatsApp ไม่ถูกคิวไว้หลังลูป refresh ของ TUI ที่ค้างอยู่
- Doctor เขียน model ref แบบเก่า `openai-codex/*` ใหม่เป็น ref มาตรฐาน `openai/*` ทั่วทั้งโมเดลหลัก fallback, override ของ heartbeat/subagent/compaction, hooks, override โมเดลช่องทาง และ route pin ของ session ที่ล้าสมัย `--fix` จะเลือก `agentRuntime.id: "codex"` เฉพาะเมื่อมีการติดตั้ง Plugin Codex, เปิดใช้งานอยู่, มี harness `codex` และมี OAuth ที่ใช้งานได้; มิฉะนั้นจะเลือก `agentRuntime.id: "pi"` เพื่อให้ route ยังคงอยู่บน runner เริ่มต้นของ OpenClaw
- Doctor ล้างสถานะ staging ของ dependency ของ Plugin แบบเก่าที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อม Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดยการกำหนดค่า เช่น `plugins.entries`, ช่องทางที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือ runtime ของ agent ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อม Plugin ของ package-manager จนกว่าการสลับแพ็กเกจจะเสร็จสมบูรณ์; จากนั้นให้รัน `openclaw doctor --fix` อีกครั้งหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากการดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและเก็บรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมครั้งถัดไป
- Doctor ซ่อมการกำหนดค่า Plugin ที่ล้าสมัยโดยลบ id ของ Plugin ที่ขาดหายออกจาก `plugins.allow`/`plugins.entries` พร้อมกับการกำหนดค่าช่องทางที่ค้างอยู่, target ของ heartbeat และ override โมเดลช่องทางที่ตรงกัน เมื่อการค้นพบ Plugin อยู่ในสถานะปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้องออก การเริ่มต้น Gateway ข้ามเฉพาะ Plugin ที่เสียตัวนั้นอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของ lifecycle ของ Gateway Doctor ยังรายงานสุขภาพ Gateway/บริการและใช้การซ่อมแซมที่ไม่เกี่ยวกับบริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/บูตสแตรปบริการ และการล้างบริการเก่า
- บน Linux doctor จะเพิกเฉยต่อ systemd unit เพิ่มเติมที่คล้าย Gateway ซึ่งไม่ได้ active และจะไม่เขียน metadata ของ command/entrypoint ใหม่สำหรับบริการ Gateway ของ systemd ที่กำลังทำงานระหว่างการซ่อม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ launcher ที่ active อยู่
- Doctor auto-migrate การกำหนดค่า Talk แบบ flat เก่า (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>`
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การ normalize ของ Talk อีกต่อไปเมื่อความแตกต่างมีเพียงลำดับคีย์ของ object
- Doctor รวมการตรวจสอบความพร้อมของ memory-search และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มี credentials สำหรับ embedding
- Doctor เตือนเมื่อไม่มีการกำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ดำเนินการที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการดำเนินการอันตราย การจับคู่ DM เพียงแค่ทำให้บางคนคุยกับ bot ได้; หากคุณเคยอนุมัติผู้ส่งก่อนมีการบูตสแตรปเจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่า agent โหมด Codex และมี asset ของ Codex CLI ส่วนตัวอยู่ใน Codex home ของผู้ดำเนินการ การเปิด app-server ของ Codex ภายในเครื่องใช้ home แบบแยกต่อ agent ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำ inventory asset ที่ควรโปรโมตอย่างตั้งใจ
- Doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อม runtime ปัจจุบัน เพราะขาด bin, env var, config หรือข้อกำหนดของ OS `doctor --fix` สามารถปิดใช้งาน Skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดหายแทนเมื่อคุณต้องการให้ skill ยัง active
- หากเปิดใช้โหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมแนวทางแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry sandbox แบบเก่า (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะ migrate รายการที่ถูกต้องไปยังไดเรกทอรี registry แบบ sharded และกักกันไฟล์เก่าที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการโดย SecretRef และไม่พร้อมใช้งานใน command path ปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและไม่เขียน credentials สำรองแบบ plaintext
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวใน path การแก้ไข doctor จะทำงานต่อและรายงานคำเตือนแทนที่จะออกก่อนกำหนด
- หลัง migration ของไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานอยู่พึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานกับ process ของ doctor
- การ auto-resolution ชื่อผู้ใช้ `allowFrom` ของ Telegram (`doctor --fix`) ต้องใช้โทเค็น Telegram ที่ resolve ได้ใน command path ปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้าม auto-resolution สำหรับรอบนั้น

## macOS: override env ของ `launchctl`

หากก่อนหน้านี้คุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์ config ของคุณ และอาจทำให้เกิดข้อผิดพลาด "unauthorized" อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
