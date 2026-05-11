---
read_when:
    - คุณมีปัญหาด้านการเชื่อมต่อ/การยืนยันตัวตนและต้องการคำแนะนำในการแก้ไข
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจวินิจฉัย
x-i18n:
    generated_at: "2026-05-11T20:26:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 69f2dd99f339e4fcdeeae840b75098f3c251b3aa133b7ea11b040b3c7f32c200
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทางต่างๆ

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

สำหรับสิทธิ์เฉพาะช่องทาง ให้ใช้โพรบของช่องทางแทน `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

โพรบความสามารถ Discord แบบเจาะจงจะรายงานสิทธิ์ช่องทางที่บอทมีผลจริง ส่วนโพรบสถานะจะตรวจสอบช่องทาง Discord ที่กำหนดค่าไว้และเป้าหมายการเข้าร่วมเสียงอัตโนมัติ

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดใช้งานคำแนะนำหน่วยความจำ/การค้นหาของเวิร์กสเปซ
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่ถาม; การติดตั้งและการเขียนบริการ Gateway ใหม่ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: alias สำหรับ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มี prompt; เฉพาะ migration ที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการของระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติมและรายงานการส่งต่อการรีสตาร์ทล่าสุดของ supervisor ของ Gateway

หมายเหตุ:

- ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การตรวจ `doctor` แบบอ่านอย่างเดียวยังทำงานได้ แต่ `doctor --fix`, `doctor --repair`, `doctor --yes` และ `doctor --generate-gateway-token` จะถูกปิดใช้งานเพราะ `openclaw.json` เป็นแบบเปลี่ยนแปลงไม่ได้ ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นใช้งานอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
- prompt แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และไม่ได้ตั้งค่า `--non-interactive` การรันแบบ headless (cron, Telegram, ไม่มีเทอร์มินัล) จะข้าม prompt
- ประสิทธิภาพ: การรัน `doctor` แบบ non-interactive จะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสุขภาพแบบ headless ยังเร็วอยู่ เซสชันแบบโต้ตอบยังโหลด Plugin ครบถ้วนเมื่อการตรวจต้องใช้ส่วนร่วมจาก Plugin
- `--fix` (alias สำหรับ `--repair`) จะเขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และทิ้งคีย์การกำหนดค่าที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- `doctor --fix --non-interactive` จะรายงานนิยามบริการ Gateway ที่ขาดหายหรือล้าสมัย แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต ให้รัน `openclaw gateway install` สำหรับบริการที่ขาดหาย หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งาน
- ตอนนี้การตรวจความถูกต้องของสถานะจะตรวจพบไฟล์ transcript กำพร้าในไดเรกทอรี sessions การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบ headless จะปล่อยไฟล์ไว้ที่เดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน cron แบบ legacy และสามารถเขียนใหม่ในที่เดิมก่อนที่ scheduler จะต้อง auto-normalize ตอน runtime
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบ legacy; สคริปต์นั้นไม่ได้รับการดูแลแล้วและอาจบันทึกเหตุขัดข้องของ WhatsApp gateway แบบเท็จเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้งาน WhatsApp, doctor จะตรวจหา event loop ของ Gateway ที่เสื่อมสภาพโดยยังมีไคลเอนต์ `openclaw-tui` ภายในเครื่องรันอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ภายในเครื่องที่ตรวจยืนยันแล้ว เพื่อไม่ให้การตอบกลับ WhatsApp ถูกเข้าคิวอยู่หลังลูป refresh ของ TUI ที่ค้างอยู่
- Doctor เขียน model refs แบบ legacy `openai-codex/*` ใหม่เป็น refs มาตรฐาน `openai/*` ทั่วทั้งโมเดลหลัก, fallback, การ override heartbeat/subagent/compaction, hooks, การ override โมเดลของช่องทาง และ route pins ของเซสชันที่ล้าสมัย `--fix` ย้ายเจตนา Codex ไปยังรายการ `agentRuntime.id: "codex"` ที่ผูกกับ provider/model, คง session auth-profile pins เช่น `openai-codex:...`, ลบ runtime pins ทั้ง agent/session ที่ล้าสมัย และคง agent refs ของ OpenAI ที่ซ่อมแล้วไว้บนการ route auth ของ Codex แทน auth ด้วย OpenAI API-key โดยตรง
- Doctor ล้างสถานะ staging ของ dependency ของ Plugin แบบ legacy ที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อม Plugin ที่ดาวน์โหลดได้แต่ขาดหายและถูกอ้างอิงโดยการกำหนดค่า เช่น `plugins.entries`, ช่องทางที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือ agent runtimes ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อม Plugin ของ package-manager จนกว่าการสลับแพ็กเกจจะเสร็จสมบูรณ์; ให้รัน `openclaw doctor --fix` อีกครั้งภายหลังหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากการดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและเก็บรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมครั้งถัดไป
- Doctor ซ่อมการกำหนดค่า Plugin ที่ล้าสมัยโดยลบ plugin ids ที่ขาดหายออกจาก `plugins.allow`/`plugins.deny`/`plugins.entries` รวมถึงการกำหนดค่าช่องทางที่ค้างอยู่, เป้าหมาย Heartbeat และการ override โมเดลของช่องทางที่ตรงกันเมื่อการค้นพบ Plugin ทำงานปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบและลบ payload `config` ที่ไม่ถูกต้อง Startup ของ Gateway จะข้ามเฉพาะ Plugin ที่เสียอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังรันต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อ supervisor อื่นเป็นเจ้าของ lifecycle ของ Gateway Doctor ยังรายงานสุขภาพ Gateway/บริการและใช้การซ่อมแซมที่ไม่ใช่บริการ แต่ข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/bootstrap บริการและการล้างบริการ legacy
- บน Linux, doctor จะเพิกเฉยต่อ unit systemd ที่คล้าย Gateway เพิ่มเติมซึ่งไม่ได้ใช้งาน และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ Gateway ของ systemd ที่กำลังรันอยู่ระหว่างการซ่อม หยุดบริการก่อนหรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจจะแทนที่ตัวเรียกใช้งานที่กำลังใช้งานอยู่
- Doctor auto-migrate การกำหนดค่า Talk แบบแบน legacy (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>`
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้ normalization ของ Talk อีกต่อไปเมื่อความต่างมีเพียงลำดับคีย์ของ object
- Doctor มีการตรวจความพร้อมของ memory-search และสามารถแนะนำ `openclaw configure --section model` เมื่อข้อมูลประจำตัว embedding ขาดหาย
- Doctor เตือนเมื่อไม่ได้กำหนดค่า command owner command owner คือบัญชีผู้ปฏิบัติการที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งเฉพาะ owner และอนุมัติการกระทำที่อันตราย การจับคู่ DM เพียงแค่อนุญาตให้ใครบางคนคุยกับบอทได้; หากคุณอนุมัติผู้ส่งก่อนที่ bootstrap ของ owner คนแรกจะมีอยู่ ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อกำหนดค่า agent โหมด Codex และมี assets ส่วนตัวของ Codex CLI อยู่ใน Codex home ของผู้ปฏิบัติการ การเปิด Codex app-server ภายในเครื่องจะใช้ home แบบแยกสำหรับแต่ละ agent ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำ inventory assets ที่ควรถูกโปรโมตอย่างตั้งใจ
- Doctor ลบ `plugins.entries.codex.config.codexDynamicToolsProfile` ที่เลิกใช้แล้ว; Codex app-server จะคงเครื่องมือ workspace แบบ Codex-native ให้เป็น native เสมอ
- Doctor เตือนเมื่อ Skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อม runtime ปัจจุบัน เพราะ bins, env vars, config หรือข้อกำหนด OS ขาดหาย `doctor --fix` สามารถปิดใช้งาน Skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดหายแทนเมื่อคุณต้องการให้ skill ยังใช้งานอยู่
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry ของ sandbox แบบ legacy (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) อยู่ doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะ migrate รายการที่ถูกต้องไปยังไดเรกทอรี registry แบบ sharded และกักกันไฟล์ legacy ที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการด้วย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและจะไม่เขียนข้อมูลประจำตัว fallback เป็นข้อความธรรมดา
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทาง fix doctor จะทำงานต่อและรายงานคำเตือนแทนที่จะออกก่อนกำหนด
- หลังจาก migration ไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานพึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานสำหรับกระบวนการ doctor
- การ auto-resolution ชื่อผู้ใช้ `allowFrom` ของ Telegram (`doctor --fix`) ต้องมีโทเค็น Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้าม auto-resolution สำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากคุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์ config ของคุณและอาจทำให้เกิดข้อผิดพลาด "unauthorized" แบบคงอยู่

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [doctor ของ Gateway](/th/gateway/doctor)
