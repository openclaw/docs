---
read_when:
    - คุณเรียกใช้ openclaw โดยไม่ระบุคำสั่งและต้องการทำความเข้าใจ Crestodian
    - คุณต้องมีวิธีตรวจสอบหรือซ่อมแซม OpenClaw ที่ปลอดภัยเมื่อไม่มีการกำหนดค่า
    - คุณกำลังออกแบบหรือเปิดใช้งานโหมดกู้คืนของช่องทางข้อความ
summary: เอกสารอ้างอิง CLI และโมเดลความปลอดภัยสำหรับ Crestodian ตัวช่วยตั้งค่าและซ่อมแซมที่ปลอดภัยเมื่อไม่มีคอนฟิก
title: Crestodian
x-i18n:
    generated_at: "2026-05-02T10:10:40Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30e7cd9bea920cb1201d4f17f3db7b04eafdb4c87e8a62f99229e6aeb177f64c
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian คือผู้ช่วยสำหรับการตั้งค่า การซ่อมแซม และการกำหนดค่าภายในเครื่องของ OpenClaw ซึ่งออกแบบมาให้ยังเข้าถึงได้เมื่อเส้นทาง agent ปกติเสียหาย

การรัน `openclaw` โดยไม่มีคำสั่งจะเริ่ม Crestodian ในเทอร์มินัลแบบโต้ตอบ การรัน `openclaw crestodian` จะเริ่มผู้ช่วยเดียวกันนี้อย่างชัดเจน

## สิ่งที่ Crestodian แสดง

เมื่อเริ่มทำงาน Crestodian แบบโต้ตอบจะเปิดเชลล์ TUI เดียวกับที่ใช้โดย `openclaw tui` พร้อมแบ็กเอนด์แชตของ Crestodian บันทึกแชตเริ่มด้วยคำทักทายสั้นๆ:

- เมื่อใดควรเริ่ม Crestodian
- โมเดลหรือเส้นทางตัววางแผนแบบกำหนดแน่นอนที่ Crestodian ใช้อยู่จริง
- ความถูกต้องของ config และ agent เริ่มต้น
- การเข้าถึง Gateway จากการตรวจสอบครั้งแรกตอนเริ่มทำงาน
- การดำเนินการ debug ถัดไปที่ Crestodian ทำได้

ระบบจะไม่ dump secret หรือโหลดคำสั่ง CLI ของ plugin เพียงเพื่อเริ่มทำงาน TUI ยังคงมีส่วนหัว บันทึกแชต บรรทัดสถานะ ส่วนท้าย autocomplete และตัวควบคุม editor ตามปกติ

ใช้ `status` เพื่อดูรายการรายละเอียดพร้อมพาธ config, พาธ docs/source, การตรวจสอบ CLI ภายในเครื่อง, สถานะคีย์ API, agent, โมเดล และรายละเอียด Gateway

Crestodian ใช้การค้นพบอ้างอิงของ OpenClaw แบบเดียวกับ agent ปกติ ใน Git checkout ระบบจะชี้ตัวเองไปที่ `docs/` ภายในเครื่องและ source tree ภายในเครื่อง ในการติดตั้งแพ็กเกจ npm ระบบจะใช้เอกสารที่รวมมากับแพ็กเกจและลิงก์ไปยัง [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) พร้อมคำแนะนำที่ชัดเจนให้ตรวจสอบซอร์สเมื่อเอกสารยังไม่เพียงพอ

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
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## การเริ่มทำงานที่ปลอดภัย

เส้นทางการเริ่มทำงานของ Crestodian ถูกตั้งใจให้มีขนาดเล็ก สามารถรันได้เมื่อ:

- ไม่มี `openclaw.json`
- `openclaw.json` ไม่ถูกต้อง
- Gateway หยุดทำงาน
- การลงทะเบียนคำสั่ง plugin ไม่พร้อมใช้งาน
- ยังไม่มีการกำหนดค่า agent ใดๆ

`openclaw --help` และ `openclaw --version` ยังคงใช้เส้นทางรวดเร็วตามปกติ `openclaw` แบบไม่โต้ตอบจะออกพร้อมข้อความสั้นๆ แทนการพิมพ์ help ระดับ root เพราะผลิตภัณฑ์เมื่อไม่ระบุคำสั่งคือ Crestodian

## การดำเนินการและการอนุมัติ

Crestodian ใช้การดำเนินการแบบมีชนิดแทนการแก้ไข config แบบเฉพาะหน้า

การดำเนินการแบบอ่านอย่างเดียวสามารถรันได้ทันที:

- แสดงภาพรวม
- แสดงรายการ agent
- แสดงรายการ plugin ที่ติดตั้งแล้ว
- ค้นหา plugin ใน ClawHub
- แสดงสถานะโมเดล/แบ็กเอนด์
- รันการตรวจสอบสถานะหรือสุขภาพ
- ตรวจสอบการเข้าถึง Gateway
- รัน doctor โดยไม่มีการแก้ไขแบบโต้ตอบ
- ตรวจสอบ config
- แสดงพาธ audit-log

การดำเนินการถาวรต้องได้รับการอนุมัติผ่านบทสนทนาในโหมดโต้ตอบ เว้นแต่คุณจะส่ง `--yes` สำหรับคำสั่งโดยตรง:

- เขียน config
- รัน `config set`
- ตั้งค่า SecretRef ที่รองรับผ่าน `config set-ref`
- รัน setup/onboarding bootstrap
- เปลี่ยนโมเดลเริ่มต้น
- เริ่ม หยุด หรือรีสตาร์ต Gateway
- สร้าง agent
- ติดตั้ง plugin จาก ClawHub หรือ npm
- ถอนการติดตั้ง plugin
- รันการซ่อมแซม doctor ที่เขียน config หรือสถานะใหม่

การเขียนที่นำไปใช้แล้วจะถูกบันทึกใน:

```text
~/.openclaw/audit/crestodian.jsonl
```

การค้นพบจะไม่ถูก audit ระบบจะบันทึกเฉพาะการดำเนินการและการเขียนที่นำไปใช้แล้วเท่านั้น

`openclaw onboard --modern` จะเริ่ม Crestodian เป็นตัวอย่าง onboarding แบบใหม่ `openclaw onboard` ธรรมดายังคงรัน onboarding แบบคลาสสิก

## Setup bootstrap

`setup` คือ onboarding bootstrap ที่เน้นแชตก่อน โดยจะเขียนผ่านการดำเนินการ config แบบมีชนิดเท่านั้นและขออนุมัติก่อน

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

เมื่อยังไม่มีการกำหนดค่าโมเดล setup จะเลือกแบ็กเอนด์แรกที่ใช้งานได้ตามลำดับนี้และบอกคุณว่าเลือกอะไร:

- โมเดลที่ระบุไว้อย่างชัดเจนที่มีอยู่ หากกำหนดค่าไว้แล้ว
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

หากไม่มีตัวเลือกใดพร้อมใช้งาน setup จะยังคงเขียน workspace เริ่มต้นและปล่อยโมเดลว่างไว้ ติดตั้งหรือเข้าสู่ระบบ Codex/Claude Code หรือเปิดเผย `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` แล้วรัน setup อีกครั้ง

## ตัววางแผนที่มีโมเดลช่วย

Crestodian เริ่มในโหมดกำหนดแน่นอนเสมอ สำหรับคำสั่งที่กำกวมซึ่งตัวแยกคำสั่งแบบกำหนดแน่นอนไม่เข้าใจ Crestodian ภายในเครื่องสามารถเรียกตัววางแผนแบบจำกัดหนึ่งรอบผ่านเส้นทาง runtime ปกติของ OpenClaw ได้ โดยจะใช้โมเดล OpenClaw ที่กำหนดค่าไว้ก่อน หากยังไม่มีโมเดลที่กำหนดค่าไว้ซึ่งใช้งานได้ ก็สามารถ fallback ไปยัง runtime ภายในเครื่องที่มีอยู่แล้วบนเครื่องได้:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

ตัววางแผนที่มีโมเดลช่วยไม่สามารถเปลี่ยนแปลง config โดยตรงได้ ต้องแปลคำขอเป็นหนึ่งในคำสั่งแบบมีชนิดของ Crestodian จากนั้นกฎการอนุมัติและ audit ปกติจึงมีผล Crestodian จะพิมพ์โมเดลที่ใช้และคำสั่งที่ตีความได้ก่อนรันสิ่งใดๆ รอบ fallback planner ที่ไม่มี config เป็นแบบชั่วคราว ปิดเครื่องมือเมื่อ runtime รองรับ และใช้ workspace/session ชั่วคราว

โหมดกู้คืนผ่านช่องทางข้อความไม่ใช้ตัววางแผนที่มีโมเดลช่วย การกู้คืนระยะไกลยังคงเป็นแบบกำหนดแน่นอน เพื่อไม่ให้เส้นทาง agent ปกติที่เสียหายหรือถูกยึดครองถูกใช้เป็น editor ของ config

## การสลับไปยัง agent

ใช้ตัวเลือกภาษาธรรมชาติเพื่อออกจาก Crestodian และเปิด TUI ปกติ:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` และ `openclaw terminal` ยังคงเปิด TUI ของ agent ปกติโดยตรง และจะไม่เริ่ม Crestodian

หลังจากสลับเข้าสู่ TUI ปกติแล้ว ใช้ `/crestodian` เพื่อกลับไปยัง Crestodian คุณสามารถใส่คำขอต่อเนื่องได้:

```text
/crestodian
/crestodian restart gateway
```

การสลับ agent ภายใน TUI จะทิ้ง breadcrumb ไว้ว่า `/crestodian` พร้อมใช้งาน

## โหมดกู้คืนผ่านข้อความ

โหมดกู้คืนผ่านข้อความคือ entrypoint ผ่านช่องทางข้อความสำหรับ Crestodian ใช้สำหรับกรณีที่ agent ปกติของคุณหยุดทำงาน แต่ช่องทางที่เชื่อถือได้ เช่น WhatsApp ยังคงรับคำสั่งได้

คำสั่งข้อความที่รองรับ:

- `/crestodian <request>`

ลำดับงานของผู้ปฏิบัติการ:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

การสร้าง agent สามารถเข้าคิวจากพรอมป์ภายในเครื่องหรือโหมดกู้คืนได้เช่นกัน:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

โหมดกู้คืนระยะไกลเป็นพื้นผิวสำหรับผู้ดูแลระบบ ต้องปฏิบัติกับมันเหมือนการซ่อมแซม config ระยะไกล ไม่ใช่แชตปกติ

สัญญาความปลอดภัยสำหรับการกู้คืนระยะไกล:

- ปิดใช้งานเมื่อ sandboxing ทำงานอยู่ หาก agent/session อยู่ใน sandbox Crestodian ต้องปฏิเสธการกู้คืนระยะไกลและอธิบายว่าต้องซ่อมผ่าน CLI ภายในเครื่อง
- สถานะ effective เริ่มต้นคือ `auto`: อนุญาตการกู้คืนระยะไกลเฉพาะในการทำงาน YOLO ที่เชื่อถือได้ ซึ่ง runtime มีสิทธิ์ภายในเครื่องแบบไม่อยู่ใน sandbox อยู่แล้ว
- ต้องมีตัวตน owner ที่ชัดเจน Rescue ต้องไม่ยอมรับกฎ sender แบบ wildcard, นโยบายกลุ่มเปิด, webhook ที่ไม่ผ่านการยืนยันตัวตน หรือช่องทางนิรนาม
- ค่าเริ่มต้นอนุญาตเฉพาะ DM ของ owner การกู้คืนในกลุ่ม/ช่องทางต้อง opt-in อย่างชัดเจน
- การค้นหาและแสดงรายการ plugin เป็นแบบอ่านอย่างเดียว การติดตั้ง plugin เป็นแบบ local-only โดยค่าเริ่มต้นเพราะเป็นการดาวน์โหลดโค้ดที่รันได้ การถอนการติดตั้ง plugin สามารถอนุญาตเป็นการดำเนินการซ่อมแซมที่ได้รับอนุมัติเมื่อ policy การกู้คืนอนุญาตให้เขียนแบบถาวร
- การกู้คืนระยะไกลไม่สามารถเปิด TUI ภายในเครื่องหรือสลับเข้าสู่ session agent แบบโต้ตอบได้ ใช้ `openclaw` ภายในเครื่องสำหรับการส่งต่อไปยัง agent
- การเขียนแบบถาวรยังคงต้องได้รับการอนุมัติ แม้ในโหมดกู้คืน
- audit ทุกการดำเนินการกู้คืนที่นำไปใช้ การกู้คืนผ่านช่องทางข้อความบันทึก metadata ของ channel, account, sender และ source-address การดำเนินการที่เปลี่ยน config ยังบันทึก hash ของ config ก่อนและหลังด้วย
- ห้าม echo secret การตรวจสอบ SecretRef ควรรายงานความพร้อมใช้งาน ไม่ใช่ค่า
- หาก Gateway ยังทำงานอยู่ ให้ใช้การดำเนินการแบบมีชนิดของ Gateway หาก Gateway หยุดทำงาน ให้ใช้เฉพาะพื้นผิวซ่อมแซมภายในเครื่องขั้นต่ำที่ไม่พึ่งพา agent loop ปกติ

รูปแบบ config:

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

- `"auto"`: ค่าเริ่มต้น อนุญาตเฉพาะเมื่อ effective runtime เป็น YOLO และ sandboxing ปิดอยู่
- `false`: ไม่อนุญาตการกู้คืนผ่านช่องทางข้อความเลย
- `true`: อนุญาตการกู้คืนอย่างชัดเจนเมื่อการตรวจสอบ owner/channel ผ่าน แต่ยังต้องไม่ข้ามการปฏิเสธจาก sandboxing

ท่าที YOLO เริ่มต้นของ `"auto"` คือ:

- sandbox mode resolve เป็น `off`
- `tools.exec.security` resolve เป็น `full`
- `tools.exec.ask` resolve เป็น `off`

การกู้คืนระยะไกลครอบคลุมโดย Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

fallback ของ local planner ที่ไม่มี config ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-planner
```

smoke แบบ opt-in สำหรับพื้นผิวคำสั่งช่องทาง live ตรวจสอบ `/crestodian status` พร้อม roundtrip การอนุมัติแบบถาวรผ่าน handler การกู้คืน:

```bash
pnpm test:live:crestodian-rescue-channel
```

การตั้งค่าใหม่แบบไม่มี config ผ่าน Crestodian ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-first-run
```

lane นั้นเริ่มด้วยไดเรกทอรีสถานะว่าง route `openclaw` เปล่าไปยัง Crestodian ตั้งค่าโมเดลเริ่มต้น สร้าง agent เพิ่มเติม กำหนดค่า Discord ผ่านการเปิดใช้งาน plugin พร้อม token SecretRef ตรวจสอบ config และตรวจ audit log QA Lab ยังมี scenario ที่อิง repo สำหรับโฟลว์ Ring 0 เดียวกัน:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Doctor](/th/cli/doctor)
- [TUI](/th/cli/tui)
- [Sandbox](/th/cli/sandbox)
- [Security](/th/cli/security)
