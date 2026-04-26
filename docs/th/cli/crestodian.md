---
read_when:
    - คุณรัน openclaw โดยไม่ใส่คำสั่งใด ๆ และต้องการทำความเข้าใจ Crestodian
    - คุณต้องการวิธีที่ปลอดภัยแบบไม่ต้องใช้ config เพื่อตรวจสอบหรือซ่อมแซม OpenClaw
    - คุณกำลังออกแบบหรือเปิดใช้โหมดกู้คืนสำหรับช่องทางข้อความ
summary: ข้อมูลอ้างอิง CLI และโมเดลความปลอดภัยสำหรับ Crestodian ตัวช่วยตั้งค่าและซ่อมแซมแบบปลอดภัยโดยไม่ต้องใช้ config
title: Crestodian
x-i18n:
    generated_at: "2026-04-26T11:25:40Z"
    model: gpt-5.4
    provider: openai
    source_hash: aafa46de3c2df2ec4b0b16a0955bb9afc76df92d5ebb928077bb5007118e037c
    source_path: cli/crestodian.md
    workflow: 15
---

# `openclaw crestodian`

Crestodian คือผู้ช่วยสำหรับการตั้งค่า การซ่อมแซม และการกำหนดค่าแบบโลคัลของ OpenClaw โดยถูกออกแบบมาให้ยังเข้าถึงได้เมื่อเส้นทางเอเจนต์ปกติเสียหาย

การรัน `openclaw` โดยไม่ใส่คำสั่งจะเริ่ม Crestodian ในเทอร์มินัลแบบโต้ตอบ การรัน `openclaw crestodian` จะเริ่มผู้ช่วยตัวเดียวกันนี้แบบระบุชัดเจน

## สิ่งที่ Crestodian แสดง

เมื่อเริ่มต้น Crestodian แบบโต้ตอบจะเปิด TUI shell เดียวกับที่ใช้โดย
`openclaw tui` แต่ใช้แบ็กเอนด์แชตของ Crestodian บันทึกแชตจะเริ่มต้นด้วยคำทักทายสั้น ๆ:

- ควรเริ่ม Crestodian เมื่อใด
- โมเดลหรือเส้นทาง deterministic planner ที่ Crestodian กำลังใช้งานจริง
- ความถูกต้องของ config และเอเจนต์ค่าเริ่มต้น
- ความสามารถในการเข้าถึง Gateway จากการ probe ครั้งแรกตอนเริ่มต้น
- การดีบักขั้นถัดไปที่ Crestodian ทำได้

มันจะไม่ dump secrets หรือโหลดคำสั่ง CLI ของ Plugin เพียงเพื่อเริ่มต้น TUI ยังคงมี header, บันทึกแชต, status line, footer, autocomplete และตัวควบคุม editor ตามปกติ

ใช้ `status` เพื่อดูรายการข้อมูลแบบละเอียด ซึ่งรวมถึง path ของ config, path ของ docs/source, local CLI probes, การมีอยู่ของ API key, agents, model และรายละเอียดของ Gateway

Crestodian ใช้การค้นหา reference ของ OpenClaw แบบเดียวกับเอเจนต์ปกติ ใน Git checkout
มันจะชี้ตัวเองไปยัง `docs/` แบบโลคัลและ source tree แบบโลคัล ในการติดตั้งแพ็กเกจจาก npm
มันจะใช้เอกสาร docs ที่มาพร้อมแพ็กเกจและลิงก์ไปยัง
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) พร้อมคำแนะนำแบบชัดเจน
ให้ตรวจสอบ source ทุกครั้งเมื่อ docs ไม่เพียงพอ

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

เส้นทางการเริ่มต้นของ Crestodian ถูกทำให้เล็กอย่างตั้งใจ มันสามารถทำงานได้เมื่อ:

- ไม่มี `openclaw.json`
- `openclaw.json` ไม่ถูกต้อง
- Gateway ล่ม
- การลงทะเบียนคำสั่ง Plugin ใช้งานไม่ได้
- ยังไม่ได้กำหนดค่าเอเจนต์ใดเลย

`openclaw --help` และ `openclaw --version` ยังคงใช้เส้นทางแบบเร็วปกติ
ส่วน `openclaw` แบบไม่โต้ตอบจะออกพร้อมข้อความสั้น ๆ แทนการพิมพ์
root help เพราะผลิตภัณฑ์แบบไม่ใส่คำสั่งคือ Crestodian

## การดำเนินการและการอนุมัติ

Crestodian ใช้การดำเนินการแบบกำหนดชนิด แทนการแก้ไข config แบบ ad hoc

การดำเนินการแบบอ่านอย่างเดียวสามารถรันได้ทันที:

- แสดงภาพรวม
- แสดงรายการ agents
- แสดงสถานะ model/backend
- รันการตรวจสอบ status หรือ health
- ตรวจสอบการเข้าถึง Gateway
- รัน doctor โดยไม่มีการแก้ไขแบบโต้ตอบ
- ตรวจสอบความถูกต้องของ config
- แสดง path ของ audit log

การดำเนินการแบบคงอยู่ต้องได้รับการอนุมัติผ่านบทสนทนาในโหมดโต้ตอบ เว้นแต่
คุณจะส่ง `--yes` สำหรับคำสั่งโดยตรง:

- เขียน config
- รัน `config set`
- ตั้งค่า SecretRef ที่รองรับผ่าน `config set-ref`
- รัน setup/onboarding bootstrap
- เปลี่ยน model ค่าเริ่มต้น
- เริ่ม หยุด หรือรีสตาร์ต Gateway
- สร้าง agents
- รันการซ่อมแซมของ doctor ที่เขียนทับ config หรือ state

การเขียนที่ถูกนำไปใช้แล้วจะถูกบันทึกไว้ที่:

```text
~/.openclaw/audit/crestodian.jsonl
```

การค้นหาจะไม่ถูก audit จะบันทึกเฉพาะการดำเนินการและการเขียนที่ถูกนำไปใช้แล้วเท่านั้น

`openclaw onboard --modern` จะเริ่ม Crestodian เป็นตัวอย่าง onboarding แบบสมัยใหม่
ส่วน `openclaw onboard` แบบปกติจะยังคงเรียก onboarding แบบคลาสสิก

## Setup Bootstrap

`setup` คือ onboarding bootstrap แบบ chat-first มันจะเขียนผ่าน
การดำเนินการ config แบบกำหนดชนิดเท่านั้น และจะขอการอนุมัติก่อน

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

เมื่อยังไม่มีการตั้งค่า model, setup จะเลือก backend แรกที่ใช้งานได้ตามลำดับนี้
และจะแจ้งคุณว่ามันเลือกอะไร:

- model แบบ explicit ที่มีอยู่เดิม หากตั้งค่าไว้แล้ว
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

หากไม่มีสิ่งใดใช้งานได้ setup ก็จะยังเขียน workspace ค่าเริ่มต้น และปล่อยให้
model ไม่มีค่าอยู่ ติดตั้งหรือล็อกอินเข้า Codex/Claude Code หรือเปิดเผย
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` แล้วรัน setup อีกครั้ง

## Planner ที่ใช้โมเดลช่วย

Crestodian จะเริ่มต้นในโหมด deterministic เสมอ สำหรับคำสั่งคลุมเครือที่
deterministic parser ไม่เข้าใจ Crestodian แบบโลคัลสามารถทำ planner turn
แบบจำกัดได้หนึ่งครั้งผ่านเส้นทาง runtime ปกติของ OpenClaw โดยจะใช้
model ของ OpenClaw ที่ตั้งค่าไว้ก่อน หากยังไม่มี model ที่ตั้งค่าไว้และใช้งานได้
ก็สามารถ fallback ไปใช้ runtime แบบโลคัลที่มีอยู่บนเครื่องแล้วได้:

- Claude Code CLI: `claude-cli/claude-opus-4-7`
- Codex app-server harness: `openai/gpt-5.5` พร้อม `agentRuntime.id: "codex"`
- Codex CLI: `codex-cli/gpt-5.5`

planner ที่ใช้โมเดลช่วยไม่สามารถแก้ไข config โดยตรงได้ มันต้องแปล
คำขอให้เป็นหนึ่งในคำสั่งแบบกำหนดชนิดของ Crestodian ก่อน จากนั้นจึงใช้กฎ
การอนุมัติและการ audit ตามปกติ Crestodian จะแสดง model ที่ใช้และคำสั่ง
ที่ตีความได้ก่อนจะรันสิ่งใดก็ตาม planner turn แบบ fallback ที่ไม่ใช้ config
จะเป็นแบบชั่วคราว ปิด tools ใน runtime ที่รองรับ และใช้ workspace/session ชั่วคราว

โหมดกู้คืนผ่านช่องทางข้อความจะไม่ใช้ planner ที่ใช้โมเดลช่วย การกู้คืนจากระยะไกล
จะคงเป็น deterministic เพื่อไม่ให้เส้นทางเอเจนต์ปกติที่เสียหายหรือถูกเจาะระบบ
ถูกใช้เป็นตัวแก้ไข config ได้

## การสลับไปยังเอเจนต์

ใช้ตัวเลือกแบบภาษาธรรมชาติเพื่อออกจาก Crestodian และเปิด TUI ปกติ:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` และ `openclaw terminal` จะยังคงเปิด
TUI ของเอเจนต์ปกติโดยตรง โดยไม่เริ่ม Crestodian

หลังจากสลับเข้า TUI ปกติแล้ว ให้ใช้ `/crestodian` เพื่อกลับไปที่ Crestodian
คุณสามารถใส่คำขอต่อเนื่องได้:

```text
/crestodian
/crestodian restart gateway
```

การสลับเอเจนต์ภายใน TUI จะทิ้ง breadcrumb ไว้ว่า `/crestodian` ใช้งานได้

## โหมดกู้คืนผ่านข้อความ

โหมดกู้คืนผ่านข้อความคือ entrypoint ของ Crestodian สำหรับช่องทางข้อความ
ใช้สำหรับกรณีที่เอเจนต์ปกติของคุณใช้งานไม่ได้ แต่ช่องทางที่เชื่อถือได้ เช่น WhatsApp
ยังคงรับคำสั่งได้

คำสั่งข้อความที่รองรับ:

- `/crestodian <request>`

ลำดับการทำงานของผู้ปฏิบัติการ:

```text
คุณ ใน DM ของเจ้าของที่เชื่อถือได้: /crestodian status
OpenClaw: โหมดกู้คืน Crestodian Gateway เข้าถึงได้: ไม่ได้ Config ถูกต้อง: ไม่
คุณ: /crestodian restart gateway
OpenClaw: แผน: รีสตาร์ต Gateway ตอบกลับด้วย /crestodian yes เพื่อนำไปใช้
คุณ: /crestodian yes
OpenClaw: นำไปใช้แล้ว เขียนรายการ audit แล้ว
```

การสร้างเอเจนต์สามารถเข้าคิวได้จาก local prompt หรือโหมดกู้คืนเช่นกัน:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

โหมดกู้คืนจากระยะไกลเป็นพื้นผิวสำหรับผู้ดูแลระบบ ต้องปฏิบัติต่อมันเหมือน
การซ่อมแซม config จากระยะไกล ไม่ใช่เหมือนแชตปกติ

ข้อตกลงด้านความปลอดภัยสำหรับการกู้คืนจากระยะไกล:

- ปิดใช้งานเมื่อ sandboxing ทำงานอยู่ หาก agent/session ใดถูก sandbox
  Crestodian ต้องปฏิเสธการกู้คืนจากระยะไกล และอธิบายว่าต้องซ่อมแซมผ่าน CLI แบบโลคัล
- สถานะที่มีผลตามค่าเริ่มต้นคือ `auto`: อนุญาตการกู้คืนจากระยะไกลเฉพาะในการทำงานแบบ YOLO ที่เชื่อถือได้
  ซึ่ง runtime มีอำนาจแบบโลคัลที่ไม่ถูก sandbox อยู่แล้ว
- ต้องระบุตัวตนเจ้าของอย่างชัดเจน Rescue ต้องไม่ยอมรับกฎผู้ส่งแบบ wildcard
  นโยบายกลุ่มแบบเปิด Webhook ที่ไม่ยืนยันตัวตน หรือช่องทางนิรนาม
- โดยค่าเริ่มต้นอนุญาตเฉพาะ DM ของเจ้าของ การกู้คืนในกลุ่ม/ช่องทางต้องเปิดใช้อย่างชัดเจน
- การกู้คืนจากระยะไกลไม่สามารถเปิด TUI แบบโลคัล หรือสลับไปเป็นเซสชันเอเจนต์แบบโต้ตอบได้
  ให้ใช้ `openclaw` แบบโลคัลสำหรับการส่งต่องานไปยังเอเจนต์
- การเขียนแบบคงอยู่ยังคงต้องได้รับการอนุมัติ แม้จะอยู่ในโหมดกู้คืน
- audit ทุกการดำเนินการกู้คืนที่ถูกนำไปใช้ การกู้คืนผ่านช่องทางข้อความจะบันทึก channel,
  account, sender และ metadata ของ source-address การดำเนินการที่เปลี่ยน config
  จะบันทึก hash ของ config ก่อนและหลังด้วย
- ห้าม echo secrets เด็ดขาด การตรวจสอบ SecretRef ควรรายงานความพร้อมใช้งาน ไม่ใช่ค่า
- หาก Gateway ยังทำงานอยู่ ให้ใช้การดำเนินการแบบกำหนดชนิดของ Gateway ก่อน
  หาก Gateway ตาย ให้ใช้เฉพาะพื้นผิวการซ่อมแซมแบบโลคัลขั้นต่ำที่ไม่ขึ้นกับ agent loop ปกติ

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

`enabled` ควรรับค่า:

- `"auto"`: ค่าเริ่มต้น อนุญาตเฉพาะเมื่อ runtime ที่มีผลเป็น YOLO และ
  sandboxing ปิดอยู่
- `false`: ไม่อนุญาตการกู้คืนผ่านช่องทางข้อความเลย
- `true`: อนุญาตการกู้คืนอย่างชัดเจนเมื่อผ่านการตรวจสอบ owner/channel แล้ว
  แต่ยังต้องไม่ข้ามการปฏิเสธจาก sandboxing

ท่าที YOLO ค่าเริ่มต้นของ `"auto"` คือ:

- sandbox mode resolve เป็น `off`
- `tools.exec.security` resolve เป็น `full`
- `tools.exec.ask` resolve เป็น `off`

การกู้คืนจากระยะไกลครอบคลุมโดย Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

configless local planner fallback ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-planner
```

การตรวจสอบ smoke ของพื้นผิวคำสั่งผ่านช่องทางแบบ live ที่เลือกเปิด จะตรวจสอบ `/crestodian status`
รวมถึงรอบการอนุมัติแบบคงอยู่ผ่าน rescue handler:

```bash
pnpm test:live:crestodian-rescue-channel
```

การตั้งค่าใหม่แบบไม่ใช้ config ผ่าน Crestodian ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-first-run
```

lane นี้จะเริ่มจาก state dir ว่าง ส่ง `openclaw` เปล่าไปยัง Crestodian
ตั้งค่า model ค่าเริ่มต้น สร้างเอเจนต์เพิ่มอีกหนึ่งตัว กำหนดค่า Discord ผ่านการเปิดใช้ Plugin
พร้อม token SecretRef ตรวจสอบ config และตรวจสอบ audit log QA Lab ยังมี
scenario ที่อิงกับ repo สำหรับ Ring 0 flow เดียวกันด้วย:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Doctor](/th/cli/doctor)
- [TUI](/th/cli/tui)
- [Sandbox](/th/cli/sandbox)
- [ความปลอดภัย](/th/cli/security)
