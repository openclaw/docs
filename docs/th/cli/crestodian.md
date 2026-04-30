---
read_when:
    - คุณเรียกใช้ openclaw โดยไม่มีคำสั่ง และต้องการทำความเข้าใจ Crestodian
    - คุณต้องมีวิธีที่ปลอดภัยสำหรับกรณีไม่มีไฟล์กำหนดค่าในการตรวจสอบหรือซ่อมแซม OpenClaw
    - คุณกำลังออกแบบหรือเปิดใช้โหมดกู้คืนสำหรับช่องทางข้อความ
summary: เอกสารอ้างอิง CLI และโมเดลความปลอดภัยสำหรับ Crestodian ตัวช่วยตั้งค่าและซ่อมแซมแบบปลอดภัยโดยไม่ต้องมีคอนฟิก
title: Crestodian
x-i18n:
    generated_at: "2026-04-30T09:42:19Z"
    model: gpt-5.5
    provider: openai
    source_hash: e09331a5303120e9044ae147426ad17caeed35f092b316506ca8e4e3a1c55157
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian คือเครื่องมือช่วยตั้งค่า ซ่อมแซม และกำหนดค่าภายในเครื่องของ OpenClaw ออกแบบมาให้ยังเข้าถึงได้เมื่อเส้นทาง agent ปกติเสียหาย

การรัน `openclaw` โดยไม่ระบุคำสั่งจะเริ่ม Crestodian ในเทอร์มินัลแบบโต้ตอบ
การรัน `openclaw crestodian` จะเริ่มเครื่องมือช่วยเดียวกันอย่างชัดเจน

## สิ่งที่ Crestodian แสดง

เมื่อเริ่มทำงาน Crestodian แบบโต้ตอบจะเปิดเชลล์ TUI เดียวกับที่ใช้โดย
`openclaw tui` พร้อมแบ็กเอนด์แชตของ Crestodian บันทึกแชตเริ่มด้วยคำทักทายสั้น ๆ:

- ควรเริ่ม Crestodian เมื่อใด
- เส้นทางโมเดลหรือตัววางแผนแบบกำหนดได้ที่ Crestodian ใช้อยู่จริง
- ความถูกต้องของ config และ agent เริ่มต้น
- การเข้าถึง Gateway จากการตรวจสอบครั้งแรกตอนเริ่มทำงาน
- การดำเนินการดีบักถัดไปที่ Crestodian สามารถทำได้

เครื่องมือนี้จะไม่ทิ้ง secrets หรือโหลดคำสั่ง CLI ของ Plugin เพียงเพื่อเริ่มทำงาน TUI
ยังคงมีส่วนหัวปกติ บันทึกแชต บรรทัดสถานะ ส่วนท้าย การเติมคำอัตโนมัติ
และตัวควบคุมตัวแก้ไข

ใช้ `status` สำหรับรายการโดยละเอียดที่มีพาธ config, พาธ docs/source,
การตรวจสอบ CLI ภายในเครื่อง, การมีอยู่ของคีย์ API, agents, โมเดล และรายละเอียด Gateway

Crestodian ใช้การค้นพบข้อมูลอ้างอิง OpenClaw แบบเดียวกับ agents ปกติ ใน Git checkout
เครื่องมือจะชี้ตัวเองไปที่ `docs/` ภายในเครื่องและแผนผังซอร์สภายในเครื่อง ในการติดตั้งแพ็กเกจ npm เครื่องมือจะใช้เอกสารแพ็กเกจที่รวมมาและลิงก์ไปยัง
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) พร้อมคำแนะนำชัดเจนให้ตรวจสอบซอร์สเมื่อเอกสารยังไม่เพียงพอ

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

## การเริ่มทำงานอย่างปลอดภัย

เส้นทางเริ่มทำงานของ Crestodian ตั้งใจให้มีขนาดเล็ก เครื่องมือนี้สามารถทำงานได้เมื่อ:

- ไม่มี `openclaw.json`
- `openclaw.json` ไม่ถูกต้อง
- Gateway ไม่ทำงาน
- การลงทะเบียนคำสั่ง Plugin ไม่พร้อมใช้งาน
- ยังไม่ได้กำหนดค่า agent ใด ๆ

`openclaw --help` และ `openclaw --version` ยังคงใช้เส้นทางด่วนปกติ
`openclaw` แบบไม่โต้ตอบจะออกด้วยข้อความสั้น ๆ แทนการพิมพ์วิธีใช้ระดับ root
เพราะผลิตภัณฑ์เมื่อไม่ระบุคำสั่งคือ Crestodian

## การดำเนินงานและการอนุมัติ

Crestodian ใช้การดำเนินงานแบบมีชนิดแทนการแก้ไข config แบบเฉพาะหน้า

การดำเนินงานแบบอ่านอย่างเดียวสามารถรันได้ทันที:

- แสดงภาพรวม
- แสดงรายการ agents
- แสดงสถานะโมเดล/แบ็กเอนด์
- รันการตรวจสอบ status หรือ health
- ตรวจสอบการเข้าถึง Gateway
- รัน doctor โดยไม่มีการแก้ไขแบบโต้ตอบ
- ตรวจสอบ config
- แสดงพาธ audit-log

การดำเนินงานที่คงอยู่ต้องได้รับการอนุมัติผ่านการสนทนาในโหมดโต้ตอบ เว้นแต่
คุณจะส่ง `--yes` สำหรับคำสั่งโดยตรง:

- เขียน config
- รัน `config set`
- ตั้งค่า SecretRef ที่รองรับผ่าน `config set-ref`
- รัน setup/onboarding bootstrap
- เปลี่ยนโมเดลเริ่มต้น
- เริ่ม หยุด หรือรีสตาร์ต Gateway
- สร้าง agents
- รันการซ่อมแซม doctor ที่เขียน config หรือ state ใหม่

การเขียนที่ถูกนำไปใช้จะถูกบันทึกใน:

```text
~/.openclaw/audit/crestodian.jsonl
```

การค้นพบจะไม่ถูก audit เฉพาะการดำเนินงานและการเขียนที่ถูกนำไปใช้เท่านั้นที่ถูกบันทึก

`openclaw onboard --modern` เริ่ม Crestodian เป็นตัวอย่างการ onboarding สมัยใหม่
`openclaw onboard` แบบธรรมดายังคงรัน onboarding แบบคลาสสิก

## Setup bootstrap

`setup` คือ onboarding bootstrap แบบเน้นแชตก่อน เครื่องมือนี้เขียนผ่านการดำเนินงาน
config แบบมีชนิดเท่านั้น และขออนุมัติก่อน

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

เมื่อยังไม่ได้กำหนดค่าโมเดล setup จะเลือกแบ็กเอนด์แรกที่ใช้ได้ตามลำดับนี้
และบอกคุณว่าเลือกอะไร:

- โมเดลที่ระบุไว้อย่างชัดเจนที่มีอยู่ หากกำหนดค่าไว้แล้ว
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

หากไม่มีรายการใดพร้อมใช้งาน setup จะยังคงเขียน workspace เริ่มต้นและปล่อยให้
โมเดลยังไม่ได้ตั้งค่า ติดตั้งหรือเข้าสู่ระบบ Codex/Claude Code หรือเปิดเผย
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` แล้วรัน setup อีกครั้ง

## ตัววางแผนที่มีโมเดลช่วย

Crestodian จะเริ่มในโหมดกำหนดได้เสมอ สำหรับคำสั่งคลุมเครือที่
parser แบบกำหนดได้ไม่เข้าใจ Crestodian ภายในเครื่องสามารถทำรอบตัววางแผนแบบจำกัดหนึ่งครั้ง
ผ่านเส้นทาง runtime ปกติของ OpenClaw โดยจะใช้โมเดล OpenClaw ที่กำหนดค่าไว้ก่อน
หากยังไม่มีโมเดลที่กำหนดค่าไว้ซึ่งใช้ได้ เครื่องมือสามารถถอยกลับไปใช้ runtime ภายในเครื่อง
ที่มีอยู่แล้วบนเครื่องได้:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` with `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

ตัววางแผนที่มีโมเดลช่วยไม่สามารถเปลี่ยนแปลง config ได้โดยตรง ต้องแปล
คำขอให้เป็นหนึ่งในคำสั่งแบบมีชนิดของ Crestodian จากนั้นกฎการอนุมัติและ
audit ปกติจะมีผล Crestodian จะพิมพ์โมเดลที่ใช้และคำสั่งที่ตีความได้
ก่อนที่จะรันสิ่งใด ๆ รอบตัววางแผนสำรองแบบไม่มี config เป็นแบบชั่วคราว
ปิดเครื่องมือเมื่อ runtime รองรับ และใช้ workspace/session ชั่วคราว

โหมดกู้คืนผ่านช่องทางข้อความไม่ใช้ตัววางแผนที่มีโมเดลช่วย การกู้คืนระยะไกล
ยังคงกำหนดได้ เพื่อไม่ให้เส้นทาง agent ปกติที่เสียหายหรือถูกยึดครอง
ถูกใช้เป็นตัวแก้ไข config

## การสลับไปยัง agent

ใช้ตัวเลือกภาษาธรรมชาติเพื่อออกจาก Crestodian และเปิด TUI ปกติ:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` และ `openclaw terminal` ยังคงเปิด
agent TUI ปกติโดยตรง คำสั่งเหล่านี้ไม่เริ่ม Crestodian

หลังจากสลับเข้า TUI ปกติแล้ว ใช้ `/crestodian` เพื่อกลับไปยัง Crestodian
คุณสามารถใส่คำขอต่อเนื่องได้:

```text
/crestodian
/crestodian restart gateway
```

การสลับ agent ภายใน TUI จะทิ้ง breadcrumb ไว้ว่า `/crestodian` พร้อมใช้งาน

## โหมดกู้คืนผ่านข้อความ

โหมดกู้คืนผ่านข้อความคือ entrypoint ผ่านช่องทางข้อความสำหรับ Crestodian ใช้สำหรับ
กรณีที่ agent ปกติของคุณตายแล้ว แต่ช่องทางที่เชื่อถือได้ เช่น WhatsApp
ยังคงรับคำสั่งได้

คำสั่งข้อความที่รองรับ:

- `/crestodian <request>`

ขั้นตอนของผู้ปฏิบัติงาน:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

การสร้าง agent ยังสามารถจัดคิวจากพรอมป์ภายในเครื่องหรือโหมดกู้คืนได้:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

โหมดกู้คืนระยะไกลเป็นพื้นผิว admin ต้องปฏิบัติกับมันเหมือนการซ่อมแซม
config ระยะไกล ไม่ใช่เหมือนแชตปกติ

สัญญาความปลอดภัยสำหรับการกู้คืนระยะไกล:

- ปิดใช้งานเมื่อ sandboxing ทำงานอยู่ หาก agent/session อยู่ใน sandbox
  Crestodian ต้องปฏิเสธการกู้คืนระยะไกลและอธิบายว่าจำเป็นต้องซ่อมแซมผ่าน CLI ภายในเครื่อง
- สถานะที่มีผลโดยค่าเริ่มต้นคือ `auto`: อนุญาตการกู้คืนระยะไกลเฉพาะในการทำงาน YOLO
  ที่เชื่อถือได้ ซึ่ง runtime มีอำนาจภายในเครื่องแบบไม่ถูก sandbox อยู่แล้ว
- ต้องมีตัวตนเจ้าของที่ระบุชัดเจน Rescue ต้องไม่ยอมรับกฎผู้ส่งแบบ wildcard
  นโยบายกลุ่มเปิด webhooks ที่ไม่ได้ยืนยันตัวตน หรือช่องทางนิรนาม
- โดยค่าเริ่มต้น เฉพาะ DM ของเจ้าของเท่านั้น การกู้คืนในกลุ่ม/ช่องทางต้อง opt-in อย่างชัดเจน
- การกู้คืนระยะไกลไม่สามารถเปิด TUI ภายในเครื่องหรือสลับเข้าสู่ session agent
  แบบโต้ตอบ ใช้ `openclaw` ภายในเครื่องสำหรับการส่งต่อไปยัง agent
- การเขียนที่คงอยู่ยังคงต้องได้รับการอนุมัติ แม้ในโหมดกู้คืน
- Audit ทุกการดำเนินงานกู้คืนที่ถูกนำไปใช้ การกู้คืนผ่านช่องทางข้อความจะบันทึก metadata
  ของช่องทาง บัญชี ผู้ส่ง และ source-address การดำเนินงานที่เปลี่ยน config ยังบันทึก
  hash ของ config ก่อนและหลังด้วย
- ห้ามสะท้อน secrets การตรวจสอบ SecretRef ควรรายงานความพร้อมใช้งาน ไม่ใช่ค่า
- หาก Gateway ยังทำงาน ให้ใช้การดำเนินงานแบบมีชนิดของ Gateway หาก Gateway
  ตาย ให้ใช้เฉพาะพื้นผิวซ่อมแซมภายในเครื่องขั้นต่ำที่ไม่พึ่งพา loop ของ agent ปกติ

รูปทรง config:

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

- `"auto"`: ค่าเริ่มต้น อนุญาตเฉพาะเมื่อ runtime ที่มีผลเป็น YOLO และ
  sandboxing ปิดอยู่
- `false`: ไม่อนุญาตการกู้คืนผ่านช่องทางข้อความ
- `true`: อนุญาต rescue อย่างชัดเจนเมื่อการตรวจสอบเจ้าของ/ช่องทางผ่าน
  แต่ยังต้องไม่ข้ามการปฏิเสธ sandboxing

ท่าทาง YOLO `"auto"` เริ่มต้นคือ:

- sandbox mode resolve เป็น `off`
- `tools.exec.security` resolve เป็น `full`
- `tools.exec.ask` resolve เป็น `off`

การกู้คืนระยะไกลครอบคลุมโดย Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

ตัววางแผนสำรองภายในเครื่องแบบไม่มี config ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-planner
```

smoke แบบ opt-in สำหรับพื้นผิวคำสั่งช่องทาง live ตรวจสอบ `/crestodian status` พร้อม
approval roundtrip ที่คงอยู่ผ่านตัวจัดการ rescue:

```bash
pnpm test:live:crestodian-rescue-channel
```

การ setup แบบไม่มี config สดใหม่ผ่าน Crestodian ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-first-run
```

lane นั้นเริ่มด้วย state dir ว่างเปล่า route `openclaw` เปล่าไปยัง Crestodian
ตั้งค่าโมเดลเริ่มต้น สร้าง agent เพิ่มเติม กำหนดค่า Discord ผ่านการเปิดใช้งาน
Plugin พร้อม token SecretRef ตรวจสอบ config และตรวจสอบ audit log QA Lab
ยังมี scenario ที่อิง repo สำหรับ flow Ring 0 เดียวกัน:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Doctor](/th/cli/doctor)
- [TUI](/th/cli/tui)
- [Sandbox](/th/cli/sandbox)
- [ความปลอดภัย](/th/cli/security)
