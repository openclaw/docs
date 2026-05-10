---
read_when:
    - คุณเรียกใช้ openclaw โดยไม่ระบุคำสั่ง และต้องการทำความเข้าใจ Crestodian
    - คุณต้องมีวิธีที่ปลอดภัยเมื่อไม่มีการกำหนดค่าเพื่อใช้ตรวจสอบหรือซ่อมแซม OpenClaw
    - คุณกำลังออกแบบหรือเปิดใช้งานโหมดกู้คืนช่องทางข้อความ
summary: ข้อมูลอ้างอิง CLI และโมเดลความปลอดภัยสำหรับ Crestodian ตัวช่วยตั้งค่าและซ่อมแซมที่ปลอดภัยแบบไม่มีคอนฟิก
title: Crestodian
x-i18n:
    generated_at: "2026-05-10T19:28:47Z"
    model: gpt-5.5
    provider: openai
    source_hash: e9124629ed8d4df00b8d4bee683bae3d336b7fadfa5a4fc8d84fb5e51be540fb
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian คือ ตัวช่วยตั้งค่า ซ่อมแซม และกำหนดค่าภายในเครื่องของ OpenClaw ออกแบบมาให้ยังเข้าถึงได้เมื่อเส้นทางเอเจนต์ปกติเสียหาย

การเรียกใช้ `openclaw` โดยไม่มีคำสั่งจะเริ่ม Crestodian ในเทอร์มินัลแบบโต้ตอบ
การเรียกใช้ `openclaw crestodian` จะเริ่มตัวช่วยเดียวกันอย่างชัดเจน

## สิ่งที่ Crestodian แสดง

เมื่อเริ่มทำงาน Crestodian แบบโต้ตอบจะเปิดเชลล์ TUI เดียวกับที่
`openclaw tui` ใช้ พร้อมแบ็กเอนด์แชตของ Crestodian บันทึกแชตเริ่มด้วย
คำทักทายสั้นๆ:

- ควรเริ่ม Crestodian เมื่อใด
- โมเดลหรือเส้นทางตัววางแผนแบบกำหนดแน่นอนที่ Crestodian ใช้อยู่จริง
- ความถูกต้องของคอนฟิกและเอเจนต์เริ่มต้น
- การเข้าถึง Gateway จากโพรบเริ่มต้นครั้งแรก
- การดำเนินการดีบักถัดไปที่ Crestodian ทำได้

ระบบจะไม่เทข้อมูลลับหรือโหลดคำสั่ง CLI ของ Plugin เพียงเพื่อเริ่มทำงาน TUI
ยังคงมีส่วนหัวปกติ บันทึกแชต บรรทัดสถานะ ส่วนท้าย การเติมข้อความอัตโนมัติ
และตัวควบคุมตัวแก้ไข

ใช้ `status` สำหรับรายการรายละเอียดพร้อมพาธคอนฟิก พาธเอกสาร/ซอร์ส
โพรบ CLI ภายในเครื่อง การมีอยู่ของคีย์ API เอเจนต์ โมเดล และรายละเอียด Gateway

Crestodian ใช้การค้นพบข้อมูลอ้างอิงของ OpenClaw แบบเดียวกับเอเจนต์ปกติ ใน Git checkout
ระบบจะชี้ตัวเองไปที่ `docs/` ภายในเครื่องและซอร์สทรีภายในเครื่อง ในการติดตั้งแพ็กเกจ npm
ระบบจะใช้เอกสารที่มากับแพ็กเกจและลิงก์ไปยัง
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) พร้อมคำแนะนำชัดเจน
ให้ตรวจทานซอร์สเมื่อเอกสารยังไม่เพียงพอ

## ตัวอย่าง

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

ภายใน TUI ของ Crestodian:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## การเริ่มต้นอย่างปลอดภัย

เส้นทางเริ่มต้นของ Crestodian ตั้งใจให้มีขนาดเล็ก ระบบสามารถทำงานได้เมื่อ:

- `openclaw.json` หายไป
- `openclaw.json` ไม่ถูกต้อง
- Gateway ไม่ทำงาน
- การลงทะเบียนคำสั่ง Plugin ใช้งานไม่ได้
- ยังไม่ได้กำหนดค่าเอเจนต์ใดๆ

`openclaw --help` และ `openclaw --version` ยังคงใช้เส้นทางเร็วปกติ
`openclaw` แบบไม่โต้ตอบจะออกด้วยข้อความสั้นๆ แทนการพิมพ์ความช่วยเหลือระดับราก
เพราะผลิตภัณฑ์เมื่อไม่มีคำสั่งคือ Crestodian

## การดำเนินการและการอนุมัติ

Crestodian ใช้การดำเนินการแบบมีชนิดแทนการแก้คอนฟิกเฉพาะกิจ

การดำเนินการแบบอ่านอย่างเดียวสามารถทำงานได้ทันที:

- แสดงภาพรวม
- แสดงรายชื่อเอเจนต์
- แสดงรายชื่อ Plugin ที่ติดตั้งแล้ว
- ค้นหา Plugin ใน ClawHub
- แสดงสถานะโมเดล/แบ็กเอนด์
- เรียกใช้การตรวจสถานะหรือสุขภาพ
- ตรวจการเข้าถึง Gateway
- เรียกใช้ doctor โดยไม่มีการแก้ไขแบบโต้ตอบ
- ตรวจสอบคอนฟิก
- แสดงพาธบันทึกการตรวจสอบ

การดำเนินการแบบถาวรต้องได้รับการอนุมัติผ่านบทสนทนาในโหมดโต้ตอบ เว้นแต่
คุณส่ง `--yes` สำหรับคำสั่งโดยตรง:

- เขียนคอนฟิก
- เรียกใช้ `config set`
- ตั้งค่า SecretRef ที่รองรับผ่าน `config set-ref`
- เรียกใช้บูตสแตรปการตั้งค่า/การเริ่มใช้งาน
- เปลี่ยนโมเดลเริ่มต้น
- เริ่ม หยุด หรือรีสตาร์ต Gateway
- สร้างเอเจนต์
- ติดตั้ง Plugin จาก ClawHub หรือ npm
- ถอนการติดตั้ง Plugin
- เรียกใช้การซ่อม doctor ที่เขียนคอนฟิกหรือสถานะใหม่

การเขียนที่นำไปใช้แล้วจะถูกบันทึกไว้ใน:

```text
~/.openclaw/audit/crestodian.jsonl
```

การค้นพบจะไม่ถูกตรวจสอบ เฉพาะการดำเนินการที่นำไปใช้แล้วและการเขียนเท่านั้นที่ถูกบันทึก

`openclaw onboard --modern` จะเริ่ม Crestodian เป็นพรีวิวการเริ่มใช้งานแบบสมัยใหม่
`openclaw onboard` แบบธรรมดายังคงเรียกใช้การเริ่มใช้งานแบบคลาสสิก

## บูตสแตรปการตั้งค่า

`setup` คือบูตสแตรปการเริ่มใช้งานแบบแชตก่อน ระบบจะเขียนผ่านการดำเนินการคอนฟิก
แบบมีชนิดเท่านั้น และขออนุมัติก่อน

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

เมื่อยังไม่ได้กำหนดค่าโมเดล setup จะเลือกแบ็กเอนด์ที่ใช้งานได้ตัวแรกตามลำดับนี้
และบอกคุณว่าเลือกอะไร:

- โมเดลที่กำหนดไว้อย่างชัดเจนแล้ว หากกำหนดค่าไว้แล้ว
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

หากไม่มีรายการใดใช้ได้ setup จะยังเขียนเวิร์กสเปซเริ่มต้นและปล่อย
โมเดลให้ไม่ได้ตั้งค่าไว้ ติดตั้งหรือเข้าสู่ระบบ Codex/Claude Code หรือเปิดเผย
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` แล้วเรียกใช้ setup อีกครั้ง

## ตัววางแผนที่ช่วยด้วยโมเดล

Crestodian จะเริ่มในโหมดกำหนดแน่นอนเสมอ สำหรับคำสั่งกำกวมที่ตัวแยกวิเคราะห์
แบบกำหนดแน่นอนไม่เข้าใจ Crestodian ภายในเครื่องสามารถทำรอบตัววางแผนแบบจำกัดหนึ่งรอบ
ผ่านเส้นทางรันไทม์ปกติของ OpenClaw โดยจะใช้โมเดล OpenClaw ที่กำหนดค่าไว้ก่อน
หากยังไม่มีโมเดลที่กำหนดค่าไว้ใช้ได้ ระบบสามารถถอยไปใช้รันไทม์ภายในเครื่องที่มีอยู่แล้วบนเครื่อง:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5`
- Codex CLI: `codex-cli/gpt-5.5`

ตัววางแผนที่ช่วยด้วยโมเดลไม่สามารถเปลี่ยนคอนฟิกโดยตรงได้ ต้องแปลคำขอ
เป็นคำสั่งแบบมีชนิดคำสั่งใดคำสั่งหนึ่งของ Crestodian จากนั้นกฎการอนุมัติและ
การตรวจสอบตามปกติจึงมีผล Crestodian จะพิมพ์โมเดลที่ใช้และคำสั่งที่ตีความได้
ก่อนเรียกใช้อะไรก็ตาม รอบตัววางแผนสำรองแบบไม่มีคอนฟิกเป็นแบบชั่วคราว
ปิดเครื่องมือเมื่อรันไทม์รองรับ และใช้เวิร์กสเปซ/เซสชันชั่วคราว

โหมดกู้คืนผ่านช่องทางข้อความไม่ใช้ตัววางแผนที่ช่วยด้วยโมเดล การกู้คืนระยะไกล
ยังคงเป็นแบบกำหนดแน่นอน เพื่อให้เส้นทางเอเจนต์ปกติที่เสียหายหรือถูกยึดครอง
ไม่สามารถถูกใช้เป็นตัวแก้คอนฟิกได้

## การสลับไปยังเอเจนต์

ใช้ตัวเลือกภาษาธรรมชาติเพื่อออกจาก Crestodian และเปิด TUI ปกติ:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat`, และ `openclaw terminal` ยังคงเปิด TUI ของ
เอเจนต์ปกติโดยตรง คำสั่งเหล่านี้จะไม่เริ่ม Crestodian

หลังจากสลับเข้าสู่ TUI ปกติแล้ว ให้ใช้ `/crestodian` เพื่อกลับไปยัง Crestodian
คุณสามารถใส่คำขอติดตามได้:

```text
/crestodian
/crestodian restart gateway
```

การสลับเอเจนต์ภายใน TUI จะทิ้งเบรดครัมบ์ไว้ว่า `/crestodian` พร้อมใช้งาน

## โหมดกู้คืนผ่านข้อความ

โหมดกู้คืนผ่านข้อความคือจุดเข้าใช้งานช่องทางข้อความสำหรับ Crestodian ใช้สำหรับ
กรณีที่เอเจนต์ปกติของคุณหยุดทำงาน แต่ช่องทางที่เชื่อถือได้อย่าง WhatsApp
ยังรับคำสั่งได้

คำสั่งข้อความที่รองรับ:

- `/crestodian <request>`

ลำดับการทำงานของผู้ปฏิบัติการ:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

การสร้างเอเจนต์ยังสามารถเข้าคิวจากพรอมป์ภายในเครื่องหรือโหมดกู้คืนได้ด้วย:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

โหมดกู้คืนระยะไกลเป็นพื้นผิวสำหรับผู้ดูแลระบบ ต้องถือว่าเป็นการซ่อมคอนฟิกระยะไกล
ไม่ใช่แชตปกติ

สัญญาความปลอดภัยสำหรับการกู้คืนระยะไกล:

- ปิดใช้งานเมื่อ sandboxing ทำงานอยู่ หากเอเจนต์/เซสชันอยู่ใน sandbox
  Crestodian ต้องปฏิเสธการกู้คืนระยะไกลและอธิบายว่าจำเป็นต้องซ่อมด้วย CLI ภายในเครื่อง
- สถานะมีผลเริ่มต้นคือ `auto`: อนุญาตการกู้คืนระยะไกลเฉพาะในการดำเนินการ YOLO
  ที่เชื่อถือได้ ซึ่งรันไทม์มีอำนาจภายในเครื่องแบบไม่อยู่ใน sandbox อยู่แล้ว
- ต้องมีตัวตนเจ้าของที่ชัดเจน การกู้คืนต้องไม่ยอมรับกฎผู้ส่งแบบไวลด์การ์ด
  นโยบายกลุ่มเปิด Webhook ที่ไม่ผ่านการยืนยันตัวตน หรือช่องทางนิรนาม
- ค่าเริ่มต้นคือ DM ของเจ้าของเท่านั้น การกู้คืนในกลุ่ม/ช่องทางต้องเลือกใช้โดยชัดเจน
- การค้นหาและแสดงรายการ Plugin เป็นแบบอ่านอย่างเดียว การติดตั้ง Plugin เป็นแบบภายในเครื่องเท่านั้นโดยค่าเริ่มต้น
  เพราะเป็นการดาวน์โหลดโค้ดที่เรียกทำงานได้ การถอนการติดตั้ง Plugin สามารถอนุญาตเป็นการดำเนินการซ่อม
  ที่ได้รับอนุมัติเมื่ออนุญาตการเขียนถาวรตามนโยบายกู้คืน
- การกู้คืนระยะไกลไม่สามารถเปิด TUI ภายในเครื่องหรือสลับเข้าสู่เซสชันเอเจนต์
  แบบโต้ตอบได้ ใช้ `openclaw` ภายในเครื่องสำหรับการส่งต่อเอเจนต์
- การเขียนถาวรยังต้องได้รับการอนุมัติ แม้อยู่ในโหมดกู้คืน
- ตรวจสอบทุกการดำเนินการกู้คืนที่นำไปใช้แล้ว การกู้คืนผ่านช่องทางข้อความจะบันทึกช่องทาง
  บัญชี ผู้ส่ง และเมตาดาต้าที่อยู่ต้นทาง การดำเนินการที่เปลี่ยนคอนฟิกยัง
  บันทึกแฮชคอนฟิกก่อนและหลังด้วย
- ห้ามสะท้อนข้อมูลลับ การตรวจสอบ SecretRef ควรรายงานความพร้อมใช้งาน ไม่ใช่ค่า
- หาก Gateway ยังทำงานอยู่ ให้ใช้การดำเนินการแบบมีชนิดของ Gateway เป็นหลัก หาก Gateway
  หยุดทำงาน ให้ใช้เฉพาะพื้นผิวซ่อมภายในเครื่องขั้นต่ำที่ไม่ขึ้นกับลูปเอเจนต์ปกติ

รูปร่างคอนฟิก:

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` ควรยอมรับ:

- `"auto"`: ค่าเริ่มต้น อนุญาตเฉพาะเมื่อรันไทม์ที่มีผลเป็น YOLO และ
  sandboxing ปิดอยู่
- `false`: ไม่อนุญาตการกู้คืนผ่านช่องทางข้อความ
- `true`: อนุญาตการกู้คืนอย่างชัดเจนเมื่อการตรวจเจ้าของ/ช่องทางผ่าน ค่าแบบนี้
  ยังคงต้องไม่ข้ามการปฏิเสธจาก sandboxing

ท่าที YOLO ค่าเริ่มต้นของ `"auto"` คือ:

- โหมด sandbox แก้ค่าเป็น `off`
- `tools.exec.security` แก้ค่าเป็น `full`
- `tools.exec.ask` แก้ค่าเป็น `off`

การกู้คืนระยะไกลครอบคลุมโดยเลน Docker:

```bash
pnpm test:docker:crestodian-rescue
```

การสำรองตัววางแผนภายในเครื่องแบบไม่มีคอนฟิกครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-planner
```

สโมกพื้นผิวคำสั่งช่องทางสดแบบเลือกใช้จะตรวจ `/crestodian status` พร้อม
รอบการอนุมัติถาวรผ่านตัวจัดการการกู้คืน:

```bash
pnpm test:live:crestodian-rescue-channel
```

การตั้งค่าใหม่แบบไม่มีคอนฟิกผ่าน Crestodian ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-first-run
```

เลนนั้นเริ่มด้วยไดเรกทอรีสถานะว่าง กำหนดเส้นทาง `openclaw` แบบไม่มีคำสั่งไปยัง Crestodian
ตั้งค่าโมเดลเริ่มต้น สร้างเอเจนต์เพิ่มเติม กำหนดค่า Discord ผ่าน
การเปิดใช้ Plugin พร้อม SecretRef โทเค็น ตรวจสอบคอนฟิก และตรวจบันทึก
การตรวจสอบ QA Lab ยังมีสถานการณ์ที่อิงรีโปสำหรับโฟลว์ Ring 0 เดียวกัน:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Doctor](/th/cli/doctor)
- [TUI](/th/cli/tui)
- [Sandbox](/th/cli/sandbox)
- [ความปลอดภัย](/th/cli/security)
