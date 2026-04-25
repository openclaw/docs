---
read_when:
    - คุณรัน openclaw โดยไม่ระบุคำสั่ง และต้องการทำความเข้าใจ Crestodian
    - คุณต้องการวิธีที่ปลอดภัยโดยไม่ต้องใช้คอนฟิกในการตรวจสอบหรือซ่อมแซม OpenClaw
    - คุณกำลังออกแบบหรือเปิดใช้โหมดกู้คืนของช่องทางข้อความ
summary: ข้อมูลอ้างอิง CLI และโมเดลความปลอดภัยสำหรับ Crestodian ตัวช่วยสำหรับการตั้งค่าและการซ่อมแซมแบบปลอดภัยโดยไม่ต้องใช้คอนฟิก
title: Crestodian
x-i18n:
    generated_at: "2026-04-25T13:43:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: ebcd6a72f78134fa572a85acc6c2f0381747a27fd6be84269c273390300bb533
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian คือผู้ช่วยภายในเครื่องของ OpenClaw สำหรับการตั้งค่า การซ่อมแซม และการกำหนดค่า โดยถูกออกแบบมาให้ยังเข้าถึงได้เมื่อเส้นทางเอเจนต์ปกติใช้งานไม่ได้

การรัน `openclaw` โดยไม่ระบุคำสั่งจะเริ่ม Crestodian ในเทอร์มินัลแบบโต้ตอบ
การรัน `openclaw crestodian` จะเริ่มผู้ช่วยตัวเดียวกันนี้อย่างชัดเจน

## สิ่งที่ Crestodian แสดง

เมื่อเริ่มต้น Interactive Crestodian จะเปิด TUI shell เดียวกับที่ใช้โดย
`openclaw tui` แต่ใช้แบ็กเอนด์แชตของ Crestodian โดยล็อกแชตจะเริ่มด้วยคำทักทายสั้นๆ:

- ควรเริ่ม Crestodian เมื่อใด
- โมเดลหรือเส้นทาง deterministic planner ที่ Crestodian ใช้งานจริง
- ความถูกต้องของคอนฟิกและเอเจนต์เริ่มต้น
- การเข้าถึง Gateway จาก startup probe ครั้งแรก
- การดีบักขั้นถัดไปที่ Crestodian สามารถทำได้

ระบบจะไม่แสดง secrets หรือโหลดคำสั่ง CLI ของ Plugin เพียงเพื่อเริ่มต้นใช้งาน
TUI ยังคงมีส่วนหัว ล็อกแชต บรรทัดสถานะ ส่วนท้าย การเติมคำอัตโนมัติ
และตัวควบคุม editor ตามปกติ

ใช้ `status` เพื่อดูรายการแบบละเอียดที่มีพาธคอนฟิก พาธ docs/source
การ probe CLI ภายในเครื่อง การมีอยู่ของ API key เอเจนต์ โมเดล และรายละเอียดของ Gateway

Crestodian ใช้การค้นหา reference ของ OpenClaw แบบเดียวกับเอเจนต์ปกติ ใน Git checkout
ระบบจะชี้ไปยัง `docs/` ภายในเครื่องและ source tree ภายในเครื่อง ในการติดตั้งผ่านแพ็กเกจ npm
ระบบจะใช้ docs ที่มาพร้อมแพ็กเกจและลิงก์ไปยัง
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) พร้อมคำแนะนำอย่างชัดเจน
ให้ตรวจสอบ source เมื่อ docs ไม่เพียงพอ

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

ภายใน Crestodian TUI:

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## การเริ่มต้นอย่างปลอดภัย

เส้นทางการเริ่มต้นของ Crestodian ถูกทำให้มีขนาดเล็กโดยเจตนา จึงสามารถทำงานได้เมื่อ:

- ไม่มี `openclaw.json`
- `openclaw.json` ไม่ถูกต้อง
- Gateway ไม่ทำงาน
- ไม่สามารถลงทะเบียนคำสั่งของ Plugin ได้
- ยังไม่ได้กำหนดค่าเอเจนต์ใดเลย

`openclaw --help` และ `openclaw --version` ยังคงใช้เส้นทางแบบรวดเร็วตามปกติ
`openclaw` แบบไม่โต้ตอบจะออกจากการทำงานพร้อมข้อความสั้นๆ แทนการพิมพ์ root
help เพราะผลิตภัณฑ์ที่ทำงานเมื่อไม่มีคำสั่งคือ Crestodian

## การดำเนินการและการอนุมัติ

Crestodian ใช้การดำเนินการแบบมีชนิดแทนการแก้ไขคอนฟิกแบบเฉพาะกิจ

การดำเนินการแบบอ่านอย่างเดียวสามารถรันได้ทันที:

- แสดงภาพรวม
- แสดงรายการเอเจนต์
- แสดงสถานะโมเดล/แบ็กเอนด์
- รันการตรวจสอบ status หรือ health
- ตรวจสอบการเข้าถึง Gateway
- รัน doctor โดยไม่ใช้การแก้ไขแบบโต้ตอบ
- ตรวจสอบความถูกต้องของคอนฟิก
- แสดงพาธ audit-log

การดำเนินการแบบถาวรต้องได้รับการอนุมัติผ่านบทสนทนาในโหมดโต้ตอบ เว้นแต่
คุณจะส่ง `--yes` สำหรับคำสั่งโดยตรง:

- เขียนคอนฟิก
- รัน `config set`
- ตั้งค่า SecretRef ที่รองรับผ่าน `config set-ref`
- รันการ bootstrap สำหรับ setup/onboarding
- เปลี่ยนโมเดลเริ่มต้น
- เริ่ม หยุด หรือรีสตาร์ต Gateway
- สร้างเอเจนต์
- รันการซ่อมแซม doctor ที่เขียนคอนฟิกหรือสถานะใหม่

การเขียนที่ถูกนำไปใช้แล้วจะถูกบันทึกใน:

```text
~/.openclaw/audit/crestodian.jsonl
```

การค้นหาไม่ถูก audit จะบันทึกเฉพาะการดำเนินการและการเขียนที่ถูกนำไปใช้แล้วเท่านั้น

`openclaw onboard --modern` จะเริ่ม Crestodian เป็นตัวอย่าง onboarding แบบสมัยใหม่
ส่วน `openclaw onboard` แบบปกติจะยังคงรัน onboarding แบบคลาสสิก

## Setup Bootstrap

`setup` คือ onboarding bootstrap แบบ chat-first โดยจะเขียนข้อมูลผ่าน
การดำเนินการคอนฟิกแบบมีชนิดเท่านั้น และจะขออนุมัติก่อน

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

เมื่อยังไม่ได้กำหนดค่าโมเดล setup จะเลือกแบ็กเอนด์ตัวแรกที่ใช้งานได้ตามลำดับนี้
และบอกคุณว่าระบบเลือกอะไร:

- โมเดลที่กำหนดไว้อย่างชัดเจนอยู่แล้ว หากมี
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

หากไม่มีตัวเลือกใดใช้งานได้ setup จะยังคงเขียน workspace เริ่มต้น
และปล่อยให้โมเดลยังไม่ถูกตั้งค่า ติดตั้งหรือลงชื่อเข้าใช้ Codex/Claude Code หรือทำให้
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` พร้อมใช้งาน แล้วรัน setup อีกครั้ง

## Model-Assisted Planner

Crestodian จะเริ่มใน deterministic mode เสมอ สำหรับคำสั่งกำกวมที่
deterministic parser ไม่เข้าใจ Crestodian ภายในเครื่องสามารถทำ planner turn
แบบมีขอบเขตได้หนึ่งครั้งผ่านเส้นทางรันไทม์ปกติของ OpenClaw โดยจะใช้
โมเดล OpenClaw ที่ตั้งค่าไว้ก่อน หากยังไม่มีโมเดลที่ตั้งค่าไว้และใช้งานได้
ระบบสามารถ fallback ไปยังรันไทม์ภายในเครื่องที่มีอยู่แล้วบนเครื่องได้:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` พร้อม `embeddedHarness.runtime: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

model-assisted planner ไม่สามารถแก้ไขคอนฟิกได้โดยตรง
แต่ต้องแปลคำขอให้เป็นหนึ่งในคำสั่งแบบมีชนิดของ Crestodian แล้วจึงใช้กฎการอนุมัติและ
audit ตามปกติ Crestodian จะแสดงโมเดลที่ใช้และคำสั่งที่ตีความได้ก่อนรันสิ่งใดก็ตาม
planner turn แบบ fallback ที่ไม่ใช้คอนฟิกจะเป็นแบบชั่วคราว ปิดการใช้เครื่องมือเมื่อ
รันไทม์รองรับ และใช้ workspace/session ชั่วคราว

message-channel rescue mode จะไม่ใช้ model-assisted planner การกู้คืนระยะไกล
จะคงเป็น deterministic เพื่อไม่ให้เส้นทางเอเจนต์ปกติที่เสียหรือถูกโจมตี
ถูกใช้เป็นตัวแก้ไขคอนฟิก

## การสลับไปยังเอเจนต์

ใช้ตัวเลือกแบบภาษาธรรมชาติเพื่อออกจาก Crestodian และเปิด TUI ปกติ:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` และ `openclaw terminal` จะยังคงเปิด
TUI ของเอเจนต์ปกติโดยตรง โดยจะไม่เริ่ม Crestodian

หลังจากสลับไปยัง TUI ปกติแล้ว ให้ใช้ `/crestodian` เพื่อกลับไปยัง Crestodian
คุณสามารถใส่คำขอต่อเนื่องได้:

```text
/crestodian
/crestodian restart gateway
```

การสลับเอเจนต์ภายใน TUI จะทิ้ง breadcrumb ไว้ว่า `/crestodian` พร้อมใช้งาน

## Message rescue mode

message rescue mode คือจุดเข้าใช้งาน Crestodian ผ่านช่องทางข้อความ ใช้สำหรับกรณีที่
เอเจนต์ปกติของคุณใช้งานไม่ได้ แต่ช่องทางที่เชื่อถือได้ เช่น WhatsApp
ยังคงรับคำสั่งได้

คำสั่งข้อความที่รองรับ:

- `/crestodian <request>`

โฟลว์สำหรับผู้ปฏิบัติงาน:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: โหมดกู้คืน Crestodian Gateway เข้าถึงได้: ไม่ได้ คอนฟิกถูกต้อง: ไม่
You: /crestodian restart gateway
OpenClaw: แผน: รีสตาร์ต Gateway ตอบกลับด้วย /crestodian yes เพื่อนำไปใช้
You: /crestodian yes
OpenClaw: นำไปใช้แล้ว เขียนรายการ audit แล้ว
```

การสร้างเอเจนต์ยังสามารถเข้าคิวได้จาก local prompt หรือ rescue mode:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

remote rescue mode เป็นพื้นผิวสำหรับผู้ดูแลระบบ โดยต้องถือว่าเป็นการซ่อมแซมคอนฟิก
จากระยะไกล ไม่ใช่แชตปกติ

ข้อตกลงด้านความปลอดภัยสำหรับ remote rescue:

- ปิดใช้งานเมื่อ sandboxing ทำงานอยู่ หากเอเจนต์/session อยู่ใน sandbox
  Crestodian ต้องปฏิเสธ remote rescue และอธิบายว่าจำเป็นต้องซ่อมผ่าน local CLI
- สถานะที่มีผลจริงโดยค่าเริ่มต้นคือ `auto`: อนุญาต remote rescue เฉพาะในการทำงาน
  แบบ YOLO ที่เชื่อถือได้ ซึ่งรันไทม์มีอำนาจภายในเครื่องแบบไม่ sandbox อยู่แล้ว
- ต้องใช้ตัวตน owner ที่ระบุชัดเจน Rescue ต้องไม่รับกฎผู้ส่งแบบ wildcard
  นโยบายกลุ่มแบบเปิด Webhook ที่ไม่ยืนยันตัวตน หรือ channels แบบไม่ระบุตัวตน
- ค่าเริ่มต้นคือเฉพาะ owner DMs การกู้คืนในกลุ่ม/ช่องทางต้องเปิดใช้อย่างชัดเจน
  และยังควรกำหนดเส้นทาง prompt การอนุมัติไปยัง owner DM
- remote rescue ไม่สามารถเปิด TUI ภายในเครื่องหรือสลับไปยัง
  session เอเจนต์แบบโต้ตอบได้ ใช้ `openclaw` ภายในเครื่องสำหรับการส่งต่อไปยังเอเจนต์
- การเขียนแบบถาวรยังคงต้องได้รับการอนุมัติ แม้อยู่ใน rescue mode
- ทำ audit ทุกการดำเนินการกู้คืนที่ถูกนำไปใช้ รวมถึง channel, account, sender,
  session key, operation, config hash ก่อนหน้า และ config hash หลังจากนั้น
- ห้าม echo secrets โดยเด็ดขาด การตรวจสอบ SecretRef ควรรายงานความพร้อมใช้งาน
  ไม่ใช่ค่า
- หาก Gateway ยังทำงานอยู่ ให้ใช้การดำเนินการแบบมีชนิดของ Gateway ก่อน หาก Gateway
  ไม่ทำงาน ให้ใช้เฉพาะพื้นผิวการซ่อมแซมภายในเครื่องขั้นต่ำที่ไม่ขึ้นกับลูปเอเจนต์ปกติ

รูปแบบคอนฟิก:

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

`enabled` ควรรองรับค่า:

- `"auto"`: ค่าเริ่มต้น อนุญาตเฉพาะเมื่อรันไทม์ที่มีผลจริงเป็น YOLO และ
  sandboxing ปิดอยู่
- `false`: ไม่อนุญาต message-channel rescue โดยเด็ดขาด
- `true`: อนุญาต rescue อย่างชัดเจนเมื่อผ่านการตรวจสอบ owner/channel แล้ว
  แต่ยังต้องไม่ข้ามการปฏิเสธจาก sandboxing

ท่าที YOLO เริ่มต้นของ `"auto"` คือ:

- sandbox mode ถูก resolve เป็น `off`
- `tools.exec.security` ถูก resolve เป็น `full`
- `tools.exec.ask` ถูก resolve เป็น `off`

remote rescue ถูกครอบคลุมโดย Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

planner fallback ภายในเครื่องแบบไม่ใช้คอนฟิกถูกครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-planner
```

การทดสอบ smoke แบบ opt-in สำหรับพื้นผิวคำสั่งของ live channel จะตรวจสอบ `/crestodian status`
รวมถึง persistent approval roundtrip ผ่าน rescue handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

การตั้งค่าใหม่แบบไม่ใช้คอนฟิกผ่าน Crestodian ถูกครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-first-run
```

lane นี้จะเริ่มจาก state dir ว่าง กำหนดให้ `openclaw` เปล่าไปที่ Crestodian
ตั้งค่าโมเดลเริ่มต้น สร้างเอเจนต์เพิ่มเติมหนึ่งตัว กำหนดค่า Discord ผ่าน
การเปิดใช้งาน Plugin พร้อม token SecretRef ตรวจสอบความถูกต้องของคอนฟิก และตรวจสอบ audit
log QA Lab ยังมี scenario แบบใช้ repo รองรับ Ring 0 flow เดียวกันนี้ด้วย:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Doctor](/th/cli/doctor)
- [TUI](/th/cli/tui)
- [Sandbox](/th/cli/sandbox)
- [Security](/th/cli/security)
