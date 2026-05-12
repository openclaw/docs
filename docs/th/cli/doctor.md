---
read_when:
    - คุณมีปัญหาเกี่ยวกับการเชื่อมต่อ/การยืนยันตัวตนและต้องการคำแนะนำในการแก้ไข
    - คุณอัปเดตแล้วและต้องการตรวจสอบเบื้องต้น
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจสอบสุขภาพ
x-i18n:
    generated_at: "2026-05-12T08:45:18Z"
    model: gpt-5.5
    provider: openai
    source_hash: 90050276597a50abcc3638e7b7b50f29ef0682f5da30d33d5dca3ad6117173e0
    source_path: cli/doctor.md
    workflow: 16
---

# `openclaw doctor`

การตรวจสอบสุขภาพ + การแก้ไขด่วนสำหรับ Gateway และช่องทาง

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

โพรบความสามารถ Discord แบบเจาะจงจะรายงานสิทธิ์ช่องทางที่บอทมีผลจริง โพรบสถานะจะตรวจสอบช่องทาง Discord ที่กำหนดค่าไว้และเป้าหมายการเข้าร่วมเสียงอัตโนมัติ

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดใช้งานคำแนะนำหน่วยความจำ/การค้นหาของเวิร์กสเปซ
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่ถาม; การติดตั้งและการเขียนบริการ Gateway ใหม่ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway อย่างชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับการกำหนดค่าบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: เรียกใช้โดยไม่มีพรอมป์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติมและรายงานการส่งต่องานรีสตาร์ทล่าสุดของตัวควบคุม Gateway

หมายเหตุ:

- ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การตรวจสอบ doctor แบบอ่านอย่างเดียวยังทำงานได้ แต่ `doctor --fix`, `doctor --repair`, `doctor --yes` และ `doctor --generate-gateway-token` ถูกปิดใช้งานเพราะ `openclaw.json` เป็นแบบเปลี่ยนแปลงไม่ได้ ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นอย่างรวดเร็ว](https://github.com/openclaw/nix-openclaw#quick-start) แบบ agent-first
- พรอมป์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะทำงานเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบไม่มีหน้าจอ (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมป์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin แบบล่วงหน้า เพื่อให้การตรวจสอบสุขภาพแบบไม่มีหน้าจอยังคงเร็ว เซสชันแบบโต้ตอบจะยังโหลด Plugin เต็มรูปแบบเมื่อการตรวจสอบต้องใช้การมีส่วนร่วมของ Plugin
- `--fix` (นามแฝงของ `--repair`) เขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และทิ้งคีย์การกำหนดค่าที่ไม่รู้จัก โดยแสดงรายการการนำออกแต่ละรายการ
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่หายไปหรือล้าสมัย แต่จะไม่ติดตั้งหรือเขียนใหม่ภายนอกโหมดซ่อมแซมการอัปเดต เรียกใช้ `openclaw gateway install` สำหรับบริการที่หายไป หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ตัวเปิด
- การตรวจสอบความสมบูรณ์ของสถานะตอนนี้ตรวจพบไฟล์ทรานสคริปต์กำพร้าในไดเรกทอรีเซสชัน การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไฟล์เหล่านั้นไว้ที่เดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน Cron แบบเดิมและสามารถเขียนใหม่ในที่เดิมก่อนที่ตัวกำหนดเวลาจะต้องปรับให้เป็นมาตรฐานอัตโนมัติขณะรันไทม์
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังเรียกใช้ `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิมอยู่; สคริปต์นั้นไม่ได้รับการดูแลแล้วและอาจบันทึกเหตุขัดข้องของ WhatsApp Gateway แบบผิดพลาดเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้งาน WhatsApp, doctor จะตรวจสอบลูปเหตุการณ์ Gateway ที่เสื่อมสภาพโดยมีไคลเอนต์ `openclaw-tui` ในเครื่องยังทำงานอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ในเครื่องที่ยืนยันแล้ว เพื่อไม่ให้การตอบกลับ WhatsApp ถูกจัดคิวอยู่หลังลูปรีเฟรช TUI ที่ค้างอยู่
- Doctor เขียน refs โมเดล `openai-codex/*` แบบเดิมใหม่เป็น refs มาตรฐาน `openai/*` ในโมเดลหลัก, fallback, การ override heartbeat/subagent/compaction, hooks, การ override โมเดลช่องทาง และ route pins ของเซสชันที่ล้าสมัย `--fix` ย้ายเจตนา Codex ไปไว้ในรายการ `agentRuntime.id: "codex"` ที่ผูกกับ provider/model, รักษา auth-profile pins ของเซสชัน เช่น `openai-codex:...`, ลบ runtime pins ทั้ง agent/เซสชันที่ล้าสมัย และคง refs agent OpenAI ที่ซ่อมแล้วไว้บนการกำหนดเส้นทาง auth ของ Codex แทนการใช้ auth ด้วย OpenAI API-key โดยตรง
- Doctor ล้างสถานะ staging ของการพึ่งพา Plugin แบบเดิมที่สร้างโดย OpenClaw เวอร์ชันเก่า และลิงก์แพ็กเกจ `openclaw` ของโฮสต์ใหม่สำหรับ Plugin npm ที่มีการจัดการซึ่งประกาศว่าเป็น peer dependency นอกจากนี้ยังซ่อม Plugin ที่ดาวน์โหลดได้ซึ่งหายไปแต่ถูกอ้างอิงโดยการกำหนดค่า เช่น `plugins.entries`, ช่องทางที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือ runtime ของ agent ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อม Plugin ของ package-manager จนกว่าการสลับแพ็กเกจจะเสร็จสมบูรณ์; เรียกใช้ `openclaw doctor --fix` อีกครั้งหลังจากนั้นหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากการดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและเก็บรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมครั้งถัดไป
- Doctor ซ่อมการกำหนดค่า Plugin ที่ล้าสมัยโดยลบ ids ของ Plugin ที่หายไปจาก `plugins.allow`/`plugins.deny`/`plugins.entries` รวมถึงการกำหนดค่าช่องทางที่ค้างอยู่, เป้าหมาย Heartbeat และการ override โมเดลช่องทางที่ตรงกัน เมื่อการค้นพบ Plugin อยู่ในสถานะปกติ
- Doctor กักกันการกำหนดค่า Plugin ที่ไม่ถูกต้องโดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบและลบ payload `config` ที่ไม่ถูกต้องออก การเริ่มต้น Gateway ข้ามเฉพาะ Plugin ที่เสียหายนั้นอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อตัวควบคุมอื่นเป็นเจ้าของวงจรชีวิตของ Gateway Doctor ยังรายงานสุขภาพของ Gateway/บริการและใช้การซ่อมแซมที่ไม่ใช่บริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/บูตสแตรปบริการและการล้างบริการแบบเดิม
- บน Linux, doctor จะละเว้นหน่วย systemd เพิ่มเติมที่คล้าย Gateway ซึ่งไม่ได้ใช้งาน และจะไม่เขียน metadata ของคำสั่ง/entrypoint ใหม่สำหรับบริการ Gateway systemd ที่กำลังทำงานอยู่ระหว่างการซ่อม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ตัวเปิดที่ใช้งานอยู่
- Doctor ย้ายข้อมูลการกำหนดค่า Talk แบบแบนเดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การปรับ Talk ให้เป็นมาตรฐานอีกต่อไป เมื่อความแตกต่างมีเพียงลำดับคีย์ของออบเจ็กต์
- Doctor มีการตรวจสอบความพร้อมของการค้นหาหน่วยความจำและสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มีข้อมูลรับรองสำหรับ embedding
- Doctor เตือนเมื่อไม่มีการกำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติการที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้เรียกใช้คำสั่งเฉพาะเจ้าของและอนุมัติการดำเนินการอันตราย การจับคู่ DM เพียงทำให้บางคนคุยกับบอทได้เท่านั้น; หากคุณอนุมัติผู้ส่งก่อนที่การบูตสแตรปเจ้าของคนแรกจะมีอยู่ ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่า agent โหมด Codex และมีสินทรัพย์ Codex CLI ส่วนบุคคลอยู่ใน Codex home ของผู้ปฏิบัติการ การเปิด Codex app-server ในเครื่องใช้ home แยกต่อ agent ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำบัญชีสินทรัพย์ที่ควรเลื่อนระดับอย่างตั้งใจ
- Doctor ลบ `plugins.entries.codex.config.codexDynamicToolsProfile` ที่เลิกใช้แล้ว; Codex app-server จะคงเครื่องมือเวิร์กสเปซแบบ Codex-native ให้เป็น native เสมอ
- Doctor เตือนเมื่อ skills ที่อนุญาตสำหรับ agent เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อมรันไทม์ปัจจุบัน เพราะขาด bins, env vars, config หรือข้อกำหนดของ OS `doctor --fix` สามารถปิดใช้งาน skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดหายแทนเมื่อคุณต้องการให้ skill ยังทำงานอยู่
- หากเปิดใช้งานโหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ registry sandbox แบบเดิม (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องไปยังไดเรกทอรี registry แบบแบ่งส่วนและกักกันไฟล์เดิมที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` ถูกจัดการโดย SecretRef และไม่พร้อมใช้งานในเส้นทางคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและจะไม่เขียนข้อมูลรับรอง plaintext fallback
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในเส้นทางแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนการออกก่อนกำหนด
- หลังการย้ายข้อมูลไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้งานพึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานสำหรับโปรเซส doctor
- การ auto-resolution ของชื่อผู้ใช้ `allowFrom` ของ Telegram (`doctor --fix`) ต้องมีโทเค็น Telegram ที่ resolve ได้ในเส้นทางคำสั่งปัจจุบัน หากการตรวจสอบโทเค็นไม่พร้อมใช้งาน doctor จะรายงานคำเตือนและข้าม auto-resolution สำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์ config ของคุณและอาจทำให้เกิดข้อผิดพลาด "unauthorized" ต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
