---
read_when:
    - คุณรัน openclaw โดยไม่มีคำสั่งหลังจากตั้งค่าเสร็จ และต้องการทำความเข้าใจ Crestodian
    - คุณต้องมีวิธีที่ปลอดภัยแบบไม่ต้องใช้คอนฟิกเพื่อตรวจสอบหรือซ่อมแซม OpenClaw
    - คุณกำลังออกแบบหรือเปิดใช้งานโหมดกู้คืนสำหรับช่องทางข้อความ
summary: ข้อมูลอ้างอิง CLI และโมเดลความปลอดภัยสำหรับ Crestodian ตัวช่วยตั้งค่าและซ่อมแซมแบบไม่ต้องมีคอนฟิกแต่ยังปลอดภัย
title: Crestodian
x-i18n:
    generated_at: "2026-06-27T17:20:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 0933a05ee02ff54e99c2909aa3e0e67fd6ed3b38b541d5b96af07defdf23b80d
    source_path: cli/crestodian.md
    workflow: 16
---

# `openclaw crestodian`

Crestodian คือผู้ช่วยตั้งค่า ซ่อมแซม และกำหนดค่าภายในเครื่องของ OpenClaw ออกแบบมาให้ยังเข้าถึงได้เมื่อเส้นทางเอเจนต์ปกติเสียหาย

การรัน `openclaw` โดยไม่มีคำสั่งจะเริ่มการปฐมนิเทศแบบคลาสสิกก่อน เมื่อไฟล์ config ที่ใช้งานอยู่หายไปหรือไม่มีการตั้งค่าที่ผู้ใช้เขียนไว้ (ว่างเปล่าหรือมีเฉพาะ metadata) หลังจากไฟล์ config มีการตั้งค่าที่ผู้ใช้เขียนไว้แล้ว การรัน `openclaw` โดยไม่มีคำสั่งจะเริ่ม Crestodian ในเทอร์มินัลแบบโต้ตอบ การรัน `openclaw crestodian` จะเริ่มผู้ช่วยเดียวกันนี้อย่างชัดเจน

## สิ่งที่ Crestodian แสดง

เมื่อเริ่มต้น Crestodian แบบโต้ตอบจะเปิดเชลล์ TUI เดียวกับที่ `openclaw tui` ใช้ พร้อมแบ็กเอนด์แชตของ Crestodian บันทึกแชตเริ่มด้วยคำทักทายสั้น ๆ:

- เมื่อใดควรเริ่ม Crestodian
- โมเดลหรือเส้นทางตัววางแผนแบบกำหนดแน่นอนที่ Crestodian ใช้อยู่จริง
- ความถูกต้องของ config และเอเจนต์เริ่มต้น
- การเข้าถึง Gateway จาก probe การเริ่มต้นครั้งแรก
- การดำเนินการ debug ถัดไปที่ Crestodian ทำได้

มันจะไม่ dump ความลับหรือโหลดคำสั่ง CLI ของ Plugin เพียงเพื่อเริ่มต้น TUI ยังคงมี header, บันทึกแชต, บรรทัดสถานะ, footer, autocomplete และตัวควบคุม editor ตามปกติ

ใช้ `status` สำหรับ inventory แบบละเอียดที่มีเส้นทาง config, เส้นทาง docs/source, probe CLI ภายในเครื่อง, การมีอยู่ของ API key, เอเจนต์, โมเดล และรายละเอียด Gateway

Crestodian ใช้การค้นพบข้อมูลอ้างอิง OpenClaw แบบเดียวกับเอเจนต์ปกติ ใน Git checkout มันจะชี้ตัวเองไปที่ `docs/` ภายในเครื่องและ source tree ภายในเครื่อง ในการติดตั้งแพ็กเกจ npm มันจะใช้เอกสารที่ bundled มากับแพ็กเกจและลิงก์ไปยัง
[https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw) พร้อมคำแนะนำชัดเจนให้ตรวจทานซอร์สเมื่อเอกสารยังไม่เพียงพอ

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

## การเริ่มต้นที่ปลอดภัย

เส้นทางเริ่มต้นของ Crestodian ตั้งใจให้มีขนาดเล็ก มันรันได้เมื่อ:

- `openclaw.json` หายไป
- `openclaw.json` ไม่ถูกต้อง
- Gateway ล่ม
- การลงทะเบียนคำสั่ง Plugin ใช้งานไม่ได้
- ยังไม่มีเอเจนต์ที่ถูกกำหนดค่าไว้

`openclaw --help` และ `openclaw --version` ยังคงใช้เส้นทางเร็วตามปกติ
`openclaw` แบบ bare ที่ไม่โต้ตอบจะจบการทำงานพร้อมข้อความสั้น ๆ แทนการพิมพ์ root help เมื่อติดตั้งใหม่ ข้อความจะชี้ไปที่การปฐมนิเทศแบบไม่โต้ตอบ หลังจากตั้งค่าแล้ว มันจะชี้ไปที่คำสั่ง Crestodian แบบครั้งเดียว

## การดำเนินงานและการอนุมัติ

Crestodian ใช้ operation ที่มีชนิดกำกับแทนการแก้ไข config แบบเฉพาะหน้า

operation แบบอ่านอย่างเดียวสามารถรันได้ทันที:

- แสดงภาพรวม
- แสดงรายการเอเจนต์
- แสดงรายการ Plugin ที่ติดตั้งแล้ว
- ค้นหา Plugin ใน ClawHub
- แสดงสถานะโมเดล/แบ็กเอนด์
- รันการตรวจสอบ status หรือ health
- ตรวจสอบการเข้าถึง Gateway
- รัน doctor โดยไม่มีการแก้ไขแบบโต้ตอบ
- ตรวจสอบความถูกต้องของ config
- แสดงเส้นทาง audit-log

operation แบบถาวรต้องได้รับการอนุมัติผ่านบทสนทนาในโหมดโต้ตอบ เว้นแต่คุณส่ง `--yes` สำหรับคำสั่งโดยตรง:

- เขียน config
- รัน `config set`
- ตั้งค่า SecretRef ที่รองรับผ่าน `config set-ref`
- รันการตั้งค่า/บูตสแตรปการปฐมนิเทศ
- เปลี่ยนโมเดลเริ่มต้น
- เริ่ม หยุด หรือรีสตาร์ท Gateway
- สร้างเอเจนต์
- ติดตั้ง Plugin จาก ClawHub หรือ npm
- ถอนการติดตั้ง Plugin
- รันการซ่อมแซม doctor ที่เขียน config หรือ state ใหม่

การเขียนที่ถูกนำไปใช้จะถูกบันทึกไว้ใน:

```text
~/.openclaw/audit/crestodian.jsonl
```

การค้นพบจะไม่ถูก audit เฉพาะ operation และการเขียนที่ถูกนำไปใช้เท่านั้นที่จะถูกบันทึก

`openclaw onboard --modern` เริ่ม Crestodian เป็นตัวอย่างการปฐมนิเทศสมัยใหม่
`openclaw onboard` แบบธรรมดายังคงรันการปฐมนิเทศแบบคลาสสิก

## บูตสแตรปการตั้งค่า

`setup` คือบูตสแตรปการปฐมนิเทศแบบแชตก่อน มันเขียนผ่าน operation config ที่มีชนิดกำกับเท่านั้นและขออนุมัติก่อน

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

เมื่อยังไม่ได้กำหนดค่าโมเดล setup จะเลือกแบ็กเอนด์ที่ใช้งานได้ตัวแรกตามลำดับนี้และบอกคุณว่าเลือกอะไร:

- โมเดลที่กำหนดอย่างชัดเจนที่มีอยู่ หากกำหนดค่าไว้แล้ว
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-8`
- Claude Code CLI -> `claude-cli/claude-opus-4-8`
- Codex -> `openai/gpt-5.5` ผ่านฮาร์เนส app-server ของ Codex

หากไม่มีรายการใดพร้อมใช้งาน setup ยังคงเขียน workspace เริ่มต้นและปล่อยโมเดลไว้โดยไม่ตั้งค่า ติดตั้งหรือเข้าสู่ระบบ Codex/Claude Code หรือเปิดให้เห็น
`OPENAI_API_KEY`/`ANTHROPIC_API_KEY` แล้วรัน setup อีกครั้ง

## ตัววางแผนที่ช่วยด้วยโมเดล

Crestodian เริ่มในโหมดกำหนดแน่นอนเสมอ สำหรับคำสั่งที่ไม่ชัดเจนซึ่ง parser แบบกำหนดแน่นอนไม่เข้าใจ Crestodian ภายในเครื่องสามารถทำ planner turn ที่มีขอบเขตหนึ่งครั้งผ่านเส้นทาง runtime ปกติของ OpenClaw มันจะใช้โมเดล OpenClaw ที่กำหนดค่าไว้ก่อน หากยังไม่มีโมเดลที่กำหนดค่าไว้ซึ่งใช้งานได้ มันสามารถ fallback ไปยัง runtime ภายในเครื่องที่มีอยู่แล้วบนเครื่อง:

- Claude Code CLI: `claude-cli/claude-opus-4-8`
- ฮาร์เนส app-server ของ Codex: `openai/gpt-5.5`

ตัววางแผนที่ช่วยด้วยโมเดลไม่สามารถ mutate config ได้โดยตรง มันต้องแปลคำขอเป็นหนึ่งในคำสั่งที่มีชนิดกำกับของ Crestodian จากนั้นกฎการอนุมัติและ audit ตามปกติจึงมีผล Crestodian จะพิมพ์โมเดลที่ใช้และคำสั่งที่ตีความได้ก่อนจะรันสิ่งใด planner turn แบบ fallback ที่ไม่มี config เป็นแบบชั่วคราว ปิดเครื่องมือในที่ที่ runtime รองรับ และใช้ workspace/session ชั่วคราว

โหมดกู้คืนผ่านช่องทางข้อความไม่ใช้ตัววางแผนที่ช่วยด้วยโมเดล การกู้คืนระยะไกลยังคงเป็นแบบกำหนดแน่นอน เพื่อไม่ให้เส้นทางเอเจนต์ปกติที่เสียหายหรือถูก compromise ถูกใช้เป็น editor ของ config ได้

## การสลับไปยังเอเจนต์

ใช้ตัวเลือกภาษาธรรมชาติเพื่อออกจาก Crestodian และเปิด TUI ปกติ:

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`, `openclaw chat` และ `openclaw terminal` ยังคงเปิด TUI ของเอเจนต์ปกติโดยตรง พวกมันจะไม่เริ่ม Crestodian

หลังจากสลับเข้าสู่ TUI ปกติแล้ว ให้ใช้ `/crestodian` เพื่อกลับไปยัง Crestodian
คุณสามารถใส่คำขอต่อเนื่องได้:

```text
/crestodian
/crestodian restart gateway
```

การสลับเอเจนต์ภายใน TUI จะทิ้ง breadcrumb ว่า `/crestodian` พร้อมใช้งาน

## โหมดกู้คืนผ่านข้อความ

โหมดกู้คืนผ่านข้อความคือ entrypoint ช่องทางข้อความสำหรับ Crestodian ใช้สำหรับกรณีที่เอเจนต์ปกติของคุณตายแล้ว แต่ช่องทางที่เชื่อถือได้ เช่น WhatsApp ยังรับคำสั่งได้

คำสั่งข้อความที่รองรับ:

- `/crestodian <request>`

ลำดับการทำงานของ operator:

```text
You, in a trusted owner DM: /crestodian status
OpenClaw: Crestodian rescue mode. Gateway reachable: no. Config valid: no.
You: /crestodian restart gateway
OpenClaw: Plan: restart the Gateway. Reply /crestodian yes to apply.
You: /crestodian yes
OpenClaw: Applied. Audit entry written.
```

การสร้างเอเจนต์ยังสามารถถูกเข้าคิวจาก prompt ภายในเครื่องหรือโหมดกู้คืนได้:

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

โหมดกู้คืนระยะไกลเป็นพื้นผิว admin ต้องถูกปฏิบัติเหมือนการซ่อม config ระยะไกล ไม่ใช่เหมือนแชตปกติ

สัญญาความปลอดภัยสำหรับการกู้คืนระยะไกล:

- ปิดใช้งานเมื่อ sandboxing ทำงานอยู่ หากเอเจนต์/session อยู่ใน sandbox,
  Crestodian ต้องปฏิเสธการกู้คืนระยะไกลและอธิบายว่าจำเป็นต้องซ่อมผ่าน CLI ภายในเครื่อง
- สถานะ effective เริ่มต้นคือ `auto`: อนุญาตการกู้คืนระยะไกลเฉพาะในการทำงานแบบ YOLO ที่เชื่อถือได้ ซึ่ง runtime มีสิทธิ์ภายในเครื่องแบบไม่ sandbox อยู่แล้ว
- ต้องมีตัวตนเจ้าของที่ชัดเจน Rescue ต้องไม่ยอมรับกฎ sender แบบ wildcard, นโยบายกลุ่มเปิด, webhooks ที่ไม่ผ่านการยืนยันตัวตน หรือช่องทางนิรนาม
- เริ่มต้นเป็น DM ของเจ้าของเท่านั้น การกู้คืนในกลุ่ม/ช่องทางต้อง opt-in อย่างชัดเจน
- การค้นหาและแสดงรายการ Plugin เป็นแบบอ่านอย่างเดียว การติดตั้ง Plugin เป็นเฉพาะภายในเครื่องโดยค่าเริ่มต้น เพราะเป็นการดาวน์โหลดโค้ดที่รันได้ การถอนการติดตั้ง Plugin สามารถอนุญาตเป็น operation ซ่อมแซมที่ได้รับการอนุมัติเมื่อ policy การกู้คืนอนุญาตให้เขียนถาวร
- การกู้คืนระยะไกลไม่สามารถเปิด TUI ภายในเครื่องหรือสลับเข้าสู่ session เอเจนต์แบบโต้ตอบได้ ใช้ `openclaw` ภายในเครื่องสำหรับการส่งต่อไปยังเอเจนต์
- การเขียนถาวรยังคงต้องได้รับการอนุมัติ แม้ในโหมดกู้คืน
- audit ทุก operation กู้คืนที่ถูกนำไปใช้ การกู้คืนผ่านช่องทางข้อความจะบันทึก metadata ของช่องทาง บัญชี sender และ source-address operation ที่ mutate config จะบันทึก hash ของ config ก่อนและหลังด้วย
- ห้าม echo ความลับ การตรวจสอบ SecretRef ควรรายงานความพร้อมใช้งาน ไม่ใช่ค่า
- หาก Gateway ยังทำงานอยู่ ให้เลือกใช้ operation ที่มีชนิดกำกับผ่าน Gateway หาก Gateway ตาย ให้ใช้เฉพาะพื้นผิวซ่อมแซมภายในเครื่องขั้นต่ำที่ไม่พึ่งพา agent loop ปกติ

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

- `"auto"`: ค่าเริ่มต้น อนุญาตเฉพาะเมื่อ effective runtime เป็น YOLO และ sandboxing ปิดอยู่
- `false`: ไม่อนุญาตการกู้คืนผ่านช่องทางข้อความเลย
- `true`: อนุญาตการกู้คืนอย่างชัดเจนเมื่อการตรวจสอบ owner/channel ผ่านแล้ว สิ่งนี้ยังต้องไม่ bypass การปฏิเสธจาก sandboxing

posture YOLO เริ่มต้นของ `"auto"` คือ:

- sandbox mode resolve เป็น `off`
- `tools.exec.security` resolve เป็น `full`
- `tools.exec.ask` resolve เป็น `off`

การกู้คืนระยะไกลครอบคลุมโดย Docker lane:

```bash
pnpm test:docker:crestodian-rescue
```

fallback ตัววางแผนภายในเครื่องที่ไม่มี config ครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-planner
```

smoke แบบ opt-in ของพื้นผิวคำสั่งช่องทาง live ตรวจ `/crestodian status` พร้อม roundtrip การอนุมัติแบบถาวรผ่าน handler การกู้คืน:

```bash
pnpm test:live:crestodian-rescue-channel
```

การตั้งค่าแบบไม่มี config ผ่านคำสั่ง Crestodian อย่างชัดเจนครอบคลุมโดย:

```bash
pnpm test:docker:crestodian-first-run
```

lane นั้นเริ่มด้วย state dir ว่าง ตรวจสอบ entrypoint Crestodian ของ modern onboard ตั้งค่าโมเดลเริ่มต้น สร้างเอเจนต์เพิ่มเติม กำหนดค่า
Discord ผ่านการเปิดใช้ Plugin พร้อม token SecretRef ตรวจสอบ config และตรวจ audit log QA Lab ยังมี scenario ที่อิง repo สำหรับ flow Ring 0 เดียวกัน:

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [Doctor](/th/cli/doctor)
- [TUI](/th/cli/tui)
- [Sandbox](/th/cli/sandbox)
- [Security](/th/cli/security)
