---
read_when:
    - คุณมีปัญหาด้านการเชื่อมต่อ/การตรวจสอบสิทธิ์ และต้องการการแก้ไขแบบมีคำแนะนำ
    - คุณอัปเดตแล้วและต้องการตรวจสอบความถูกต้องเบื้องต้น
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw doctor` (การตรวจสอบสถานะ + การซ่อมแซมแบบมีคำแนะนำ)
title: ตัวตรวจสอบ
x-i18n:
    generated_at: "2026-05-10T19:29:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: c336915c94b6bf703ebece5be429cc0a86be9a2122dd9a912e956579ecb2b096
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

สำหรับสิทธิ์เฉพาะช่องทาง ให้ใช้โพรบของช่องทางแทน `doctor`:

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

โพรบความสามารถ Discord แบบเจาะจงจะรายงานสิทธิ์ช่องทางที่มีผลจริงของบอท ส่วนโพรบสถานะจะตรวจสอบช่องทาง Discord ที่กำหนดค่าไว้และเป้าหมายการเข้าร่วมเสียงอัตโนมัติ

## ตัวเลือก

- `--no-workspace-suggestions`: ปิดใช้คำแนะนำหน่วยความจำ/การค้นหาของเวิร์กสเปซ
- `--yes`: ยอมรับค่าเริ่มต้นโดยไม่ถาม
- `--repair`: ใช้การซ่อมแซมที่แนะนำซึ่งไม่ใช่บริการโดยไม่ถาม; การติดตั้งและการเขียนทับบริการ Gateway ยังต้องมีการยืนยันแบบโต้ตอบหรือคำสั่ง Gateway ที่ระบุชัดเจน
- `--fix`: นามแฝงของ `--repair`
- `--force`: ใช้การซ่อมแซมเชิงรุก รวมถึงการเขียนทับค่ากำหนดบริการแบบกำหนดเองเมื่อจำเป็น
- `--non-interactive`: รันโดยไม่มีพรอมต์; เฉพาะการย้ายข้อมูลที่ปลอดภัยและการซ่อมแซมที่ไม่ใช่บริการเท่านั้น
- `--generate-gateway-token`: สร้างและกำหนดค่าโทเค็น Gateway
- `--deep`: สแกนบริการระบบเพื่อหาการติดตั้ง Gateway เพิ่มเติม และรายงานการส่งต่อการรีสตาร์ทของตัวควบคุม Gateway ล่าสุด

หมายเหตุ:

- ในโหมด Nix (`OPENCLAW_NIX_MODE=1`) การตรวจ `doctor` แบบอ่านอย่างเดียวยังทำงานได้ แต่ `doctor --fix`, `doctor --repair`, `doctor --yes` และ `doctor --generate-gateway-token` จะถูกปิดใช้ เพราะ `openclaw.json` เปลี่ยนแปลงไม่ได้ ให้แก้ไขซอร์ส Nix สำหรับการติดตั้งนี้แทน; สำหรับ nix-openclaw ให้ใช้ [เริ่มต้นใช้งานด่วน](https://github.com/openclaw/nix-openclaw#quick-start) แบบเริ่มจากเอเจนต์
- พรอมต์แบบโต้ตอบ (เช่น การแก้ไข keychain/OAuth) จะรันเฉพาะเมื่อ stdin เป็น TTY และ **ไม่ได้** ตั้งค่า `--non-interactive` การรันแบบไม่มีหน้าจอ (cron, Telegram, ไม่มีเทอร์มินัล) จะข้ามพรอมต์
- ประสิทธิภาพ: การรัน `doctor` แบบไม่โต้ตอบจะข้ามการโหลด Plugin ล่วงหน้า เพื่อให้การตรวจสุขภาพแบบไม่มีหน้าจอยังคงรวดเร็ว เซสชันแบบโต้ตอบยังคงโหลด Plugin ทั้งหมดเมื่อการตรวจต้องใช้การมีส่วนร่วมจาก Plugin
- `--fix` (นามแฝงของ `--repair`) จะเขียนข้อมูลสำรองไปที่ `~/.openclaw/openclaw.json.bak` และลบคีย์ค่ากำหนดที่ไม่รู้จัก พร้อมแสดงรายการการลบแต่ละรายการ
- `doctor --fix --non-interactive` รายงานนิยามบริการ Gateway ที่ขาดหายหรือเก่า แต่จะไม่ติดตั้งหรือเขียนทับนิยามเหล่านั้นนอกโหมดซ่อมแซมการอัปเดต รัน `openclaw gateway install` สำหรับบริการที่ขาดหาย หรือ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ตัวเรียกใช้งาน
- ตอนนี้การตรวจความสมบูรณ์ของสถานะตรวจพบไฟล์ทรานสคริปต์กำพร้าในไดเรกทอรีเซสชันแล้ว การเก็บถาวรไฟล์เหล่านั้นเป็น `.deleted.<timestamp>` ต้องมีการยืนยันแบบโต้ตอบ; `--fix`, `--yes` และการรันแบบไม่มีหน้าจอจะปล่อยไฟล์เหล่านั้นไว้ที่เดิม
- Doctor ยังสแกน `~/.openclaw/cron/jobs.json` (หรือ `cron.store`) เพื่อหารูปแบบงาน cron แบบเดิม และสามารถเขียนทับในที่เดิมก่อนที่ตัวจัดตารางจะต้องปรับให้เป็นปกติอัตโนมัติขณะรัน
- บน Linux, doctor จะเตือนเมื่อ crontab ของผู้ใช้ยังรัน `~/.openclaw/bin/ensure-whatsapp.sh` แบบเดิม; สคริปต์นั้นไม่ได้รับการดูแลแล้ว และอาจบันทึกเหตุขัดข้อง Gateway ของ WhatsApp ที่ไม่จริงเมื่อ cron ไม่มีสภาพแวดล้อม systemd user-bus
- เมื่อเปิดใช้ WhatsApp, doctor จะตรวจหา event loop ของ Gateway ที่เสื่อมสภาพโดยมีไคลเอนต์ `openclaw-tui` ภายในเครื่องที่ยังทำงานอยู่ `doctor --fix` จะหยุดเฉพาะไคลเอนต์ TUI ภายในเครื่องที่ยืนยันแล้ว เพื่อไม่ให้การตอบกลับ WhatsApp ถูกเข้าคิวอยู่หลังลูปรีเฟรช TUI ที่ค้าง
- Doctor เขียน model refs แบบเดิม `openai-codex/*` ใหม่เป็น refs มาตรฐาน `openai/*` ในโมเดลหลักทั้งหมด, fallbacks, การ override heartbeat/subagent/compaction, hooks, การ override โมเดลช่องทาง และหมุดเส้นทางเซสชันที่ค้างอยู่ `--fix` ย้ายเจตนา Codex ไปยังรายการ `agentRuntime.id: "codex"` ที่กำหนดขอบเขตตาม provider/model, คงหมุด auth-profile ของเซสชันไว้ เช่น `openai-codex:...`, ลบหมุด runtime ทั้งเอเจนต์/เซสชันที่ค้าง และคง refs เอเจนต์ OpenAI ที่ซ่อมแล้วไว้บนการกำหนดเส้นทาง auth ของ Codex แทนการใช้ auth ด้วย API-key ของ OpenAI โดยตรง
- Doctor ล้างสถานะ staging ของการพึ่งพา Plugin แบบเดิมที่สร้างโดย OpenClaw เวอร์ชันเก่า นอกจากนี้ยังซ่อมแซม Plugin ที่ดาวน์โหลดได้ซึ่งขาดหายและถูกอ้างอิงโดยค่ากำหนด เช่น `plugins.entries`, ช่องทางที่กำหนดค่าไว้, การตั้งค่า provider/search ที่กำหนดค่าไว้ หรือ agent runtimes ที่กำหนดค่าไว้ ระหว่างการอัปเดตแพ็กเกจ doctor จะข้ามการซ่อมแซม Plugin ของตัวจัดการแพ็กเกจจนกว่าการสลับแพ็กเกจจะเสร็จสมบูรณ์; หลังจากนั้นให้รัน `openclaw doctor --fix` อีกครั้งหาก Plugin ที่กำหนดค่าไว้ยังต้องกู้คืน หากการดาวน์โหลดล้มเหลว doctor จะรายงานข้อผิดพลาดการติดตั้งและคงรายการ Plugin ที่กำหนดค่าไว้สำหรับความพยายามซ่อมแซมครั้งถัดไป
- Doctor ซ่อมแซมค่ากำหนด Plugin ที่ค้าง โดยลบ ids ของ Plugin ที่ขาดหายออกจาก `plugins.allow`/`plugins.entries` รวมถึงค่ากำหนดช่องทางที่ค้าง, เป้าหมาย Heartbeat และการ override โมเดลช่องทางที่ตรงกัน เมื่อการค้นพบ Plugin ทำงานปกติ
- Doctor กักกันค่ากำหนด Plugin ที่ไม่ถูกต้อง โดยปิดใช้งานรายการ `plugins.entries.<id>` ที่ได้รับผลกระทบ และลบ payload `config` ที่ไม่ถูกต้อง การเริ่มต้น Gateway ข้ามเฉพาะ Plugin ที่เสียตัวนั้นอยู่แล้ว เพื่อให้ Plugin และช่องทางอื่นยังทำงานต่อได้
- ตั้งค่า `OPENCLAW_SERVICE_REPAIR_POLICY=external` เมื่อมีตัวควบคุมอื่นเป็นเจ้าของวงจรชีวิต Gateway Doctor ยังคงรายงานสุขภาพ Gateway/บริการและใช้การซ่อมแซมที่ไม่ใช่บริการ แต่จะข้ามการติดตั้ง/เริ่ม/รีสตาร์ท/บูตสแตรปบริการ และการล้างบริการแบบเดิม
- บน Linux, doctor จะละเว้น systemd units เพิ่มเติมที่คล้าย Gateway แต่ไม่ได้ทำงาน และจะไม่เขียนทับเมทาดาทาของคำสั่ง/entrypoint สำหรับบริการ Gateway ของ systemd ที่กำลังทำงานระหว่างการซ่อมแซม หยุดบริการก่อน หรือใช้ `openclaw gateway install --force` เมื่อคุณตั้งใจต้องการแทนที่ตัวเรียกใช้งานที่กำลังทำงานอยู่
- Doctor ย้ายค่ากำหนด Talk แบบแบนเดิม (`talk.voiceId`, `talk.modelId` และรายการที่เกี่ยวข้อง) ไปเป็น `talk.provider` + `talk.providers.<provider>` โดยอัตโนมัติ
- การรัน `doctor --fix` ซ้ำจะไม่รายงาน/ใช้การปรับ Talk ให้เป็นปกติอีกต่อไปเมื่อความแตกต่างมีเพียงลำดับคีย์ของออบเจกต์
- Doctor รวมการตรวจความพร้อมของการค้นหาหน่วยความจำ และสามารถแนะนำ `openclaw configure --section model` เมื่อไม่มีข้อมูลประจำตัวสำหรับ embedding
- Doctor เตือนเมื่อไม่ได้กำหนดค่าเจ้าของคำสั่ง เจ้าของคำสั่งคือบัญชีผู้ปฏิบัติงานที่เป็นมนุษย์ซึ่งได้รับอนุญาตให้รันคำสั่งเฉพาะเจ้าของและอนุมัติการกระทำที่อันตราย การจับคู่ DM แค่อนุญาตให้บางคนคุยกับบอทได้เท่านั้น; หากคุณเคยอนุมัติผู้ส่งก่อนที่จะมีการบูตสแตรปเจ้าของคนแรก ให้ตั้งค่า `commands.ownerAllowFrom` อย่างชัดเจน
- Doctor เตือนเมื่อมีการกำหนดค่าเอเจนต์โหมด Codex และมีแอสเซ็ต Codex CLI ส่วนตัวอยู่ใน Codex home ของผู้ปฏิบัติงาน การเปิดใช้ app-server ของ Codex ภายในเครื่องใช้ home แยกต่อเอเจนต์ ดังนั้นให้ใช้ `openclaw migrate codex --dry-run` เพื่อทำรายการแอสเซ็ตที่ควรเลื่อนระดับอย่างตั้งใจ
- Doctor ลบ `plugins.entries.codex.config.codexDynamicToolsProfile` ที่เลิกใช้แล้ว; app-server ของ Codex จะคงเครื่องมือเวิร์กสเปซแบบ Codex-native ไว้เป็น native เสมอ
- Doctor เตือนเมื่อ skills ที่อนุญาตสำหรับเอเจนต์เริ่มต้นไม่พร้อมใช้งานในสภาพแวดล้อม runtime ปัจจุบัน เพราะขาด bins, env vars, config หรือข้อกำหนดของ OS `doctor --fix` สามารถปิดใช้ skills ที่ไม่พร้อมใช้งานเหล่านั้นด้วย `skills.entries.<skill>.enabled=false`; ให้ติดตั้ง/กำหนดค่าข้อกำหนดที่ขาดหายแทนเมื่อคุณต้องการให้ skill ยังคงใช้งานอยู่
- หากเปิดใช้โหมด sandbox แต่ Docker ไม่พร้อมใช้งาน doctor จะรายงานคำเตือนที่มีสัญญาณชัดเจนพร้อมวิธีแก้ไข (`install Docker` หรือ `openclaw config set agents.defaults.sandbox.mode off`)
- หากมีไฟล์ทะเบียน sandbox แบบเดิม (`~/.openclaw/sandbox/containers.json` หรือ `~/.openclaw/sandbox/browsers.json`) doctor จะรายงานไฟล์เหล่านั้น; `openclaw doctor --fix` จะย้ายรายการที่ถูกต้องไปยังไดเรกทอรีทะเบียนแบบ shard และกักกันไฟล์เดิมที่ไม่ถูกต้อง
- หาก `gateway.auth.token`/`gateway.auth.password` จัดการโดย SecretRef และไม่พร้อมใช้งานในพาธคำสั่งปัจจุบัน doctor จะรายงานคำเตือนแบบอ่านอย่างเดียวและจะไม่เขียนข้อมูลประจำตัว fallback แบบข้อความล้วน
- หากการตรวจสอบ SecretRef ของช่องทางล้มเหลวในพาธแก้ไข doctor จะดำเนินการต่อและรายงานคำเตือนแทนการออกก่อนเวลา
- หลังจากการย้ายไดเรกทอรีสถานะ doctor จะเตือนเมื่อบัญชี Telegram หรือ Discord เริ่มต้นที่เปิดใช้พึ่งพา env fallback และ `TELEGRAM_BOT_TOKEN` หรือ `DISCORD_BOT_TOKEN` ไม่พร้อมใช้งานกับกระบวนการ doctor
- การแก้ชื่อผู้ใช้ `allowFrom` อัตโนมัติของ Telegram (`doctor --fix`) ต้องมีโทเค็น Telegram ที่แก้ค่าได้ในพาธคำสั่งปัจจุบัน หากไม่สามารถตรวจสอบโทเค็นได้ doctor จะรายงานคำเตือนและข้ามการแก้อัตโนมัติสำหรับรอบนั้น

## macOS: การ override env ของ `launchctl`

หากก่อนหน้านี้คุณเคยรัน `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...` (หรือ `...PASSWORD`) ค่านั้นจะ override ไฟล์ค่ากำหนดของคุณ และอาจทำให้เกิดข้อผิดพลาด "unauthorized" อย่างต่อเนื่อง

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [Gateway doctor](/th/gateway/doctor)
