---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการตรวจสอบสิทธิ์ของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งาน และดีบักโปรไฟล์การตรวจสอบสิทธิ์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, ชื่อแทน, ทางเลือกสำรอง, การยืนยันตัวตน)
title: โมเดล
x-i18n:
    generated_at: "2026-05-06T19:35:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7749d97382529587d54ea96466edc880a731f2c2d39eed1677e4fbf129f11435
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นหาโมเดล การสแกน และการกำหนดค่า (โมเดลเริ่มต้น ตัวสำรอง โปรไฟล์รับรองตัวตน)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [โมเดล](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดโมเดล](/th/concepts/models)
- การตั้งค่าการรับรองตัวตนผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่าเริ่มต้น/ตัวสำรองที่ resolve แล้ว พร้อมภาพรวมการรับรองตัวตน
เมื่อมีสแนปช็อตการใช้งานผู้ให้บริการ ส่วนสถานะ OAuth/API-key จะรวม
หน้าต่างการใช้งานของผู้ให้บริการและสแนปช็อตโควตาไว้ด้วย
ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai การรับรองตัวตนการใช้งานมาจาก hook เฉพาะผู้ให้บริการ
เมื่อมีให้ใช้ มิฉะนั้น OpenClaw จะ fallback ไปใช้ข้อมูลประจำตัว OAuth/API-key
ที่ตรงกันจากโปรไฟล์รับรองตัวตน env หรือ config
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวมผู้ให้บริการที่รับรู้ env/config/store
ส่วน `auth.oauth` คือสถานะสุขภาพของโปรไฟล์ใน auth-store เท่านั้น
เพิ่ม `--probe` เพื่อรัน probe การรับรองตัวตนแบบสดกับแต่ละโปรไฟล์ผู้ให้บริการที่กำหนดค่าไว้
Probe เป็นคำขอจริง (อาจใช้ token และทำให้เจอ rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การรับรองตัวตนของ agent ที่กำหนดค่าไว้ เมื่อไม่ได้ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ มิฉะนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์รับรองตัวตน ข้อมูลประจำตัว env หรือ `models.json`
สำหรับการแก้ปัญหา Codex OAuth, `openclaw models status`,
`openclaw models auth list --provider openai-codex` และ
`openclaw config get agents.defaults.model --json` เป็นวิธีที่เร็วที่สุดในการ
ยืนยันว่า agent กำลังใช้ `openai-codex/*` ผ่าน PI หรือ `openai/*`
ผ่านรันไทม์ Codex ดั้งเดิม ดู [การตั้งค่าผู้ให้บริการ OpenAI](/th/providers/openai#check-and-recover-codex-oauth-routing)

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: อ่าน config, โปรไฟล์รับรองตัวตน, สถานะ catalog
  ที่มีอยู่ และแถว catalog ที่ผู้ให้บริการเป็นเจ้าของ แต่จะไม่เขียน
  `models.json` ใหม่
- คอลัมน์ `Auth` เป็นระดับผู้ให้บริการและอ่านอย่างเดียว ค่านี้คำนวณจาก metadata
  โปรไฟล์รับรองตัวตนภายในเครื่อง, marker ของ env, key ผู้ให้บริการที่กำหนดค่าไว้, marker ของผู้ให้บริการภายในเครื่อง,
  marker env/profile ของ AWS Bedrock และ metadata synthetic-auth ของ Plugin;
  ค่านี้ไม่โหลดรันไทม์ผู้ให้บริการ ไม่อ่านความลับใน keychain ไม่เรียก
  API ผู้ให้บริการ หรือพิสูจน์ความพร้อมในการประมวลผลรายโมเดลอย่างแม่นยำ
- `models list --all --provider <id>` สามารถรวมแถว static catalog ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ Plugin หรือ metadata catalog ของผู้ให้บริการที่บันเดิลมา แม้คุณ
  ยังไม่ได้รับรองตัวตนกับผู้ให้บริการนั้น แถวเหล่านั้นจะยังแสดงเป็น
  unavailable จนกว่าจะกำหนดค่าการรับรองตัวตนที่ตรงกัน
- `models list` ช่วยให้ control plane ตอบสนองได้ในขณะที่การค้นพบ catalog ของผู้ให้บริการ
  ทำงานช้า มุมมองเริ่มต้นและที่กำหนดค่าไว้จะ fallback ไปใช้แถวโมเดลที่กำหนดค่าไว้หรือ
  synthetic หลังรอสั้น ๆ และปล่อยให้การค้นพบทำงานต่อใน
  background ใช้ `--all` เมื่อคุณต้องการ catalog ที่ค้นพบทั้งหมดอย่างแม่นยำและ
  ยินดีรอการค้นพบของผู้ให้บริการ
- `models list --all` แบบกว้างจะ merge แถว manifest catalog ทับแถว registry
  โดยไม่โหลด hook เสริมของรันไทม์ผู้ให้บริการ fast path ของ manifest ที่กรองตามผู้ให้บริการ
  ใช้เฉพาะผู้ให้บริการที่ทำเครื่องหมาย `static`; ผู้ให้บริการที่ทำเครื่องหมาย `refreshable`
  จะยังอิง registry/cache และผนวกแถว manifest เป็นส่วนเสริม ขณะที่
  ผู้ให้บริการที่ทำเครื่องหมาย `runtime` จะยังใช้การค้นพบจาก registry/runtime
- `models list` แยก metadata โมเดลดั้งเดิมออกจาก cap ของรันไทม์อย่างชัดเจน ในเอาต์พุตแบบตาราง
  `Ctx` แสดง `contextTokens/contextWindow` เมื่อ cap รันไทม์ที่มีผล
  ต่างจาก context window ดั้งเดิม; แถว JSON จะรวม `contextTokens`
  เมื่อผู้ให้บริการเปิดเผย cap นั้น
- `models list --provider <id>` กรองตาม id ผู้ให้บริการ เช่น `moonshot` หรือ
  `openai-codex` ไม่รับ label ที่แสดงจากตัวเลือกผู้ให้บริการแบบ interactive
  เช่น `Moonshot AI`
- model ref จะ parse โดยแยกที่ `/` **ตัวแรก** หาก ID โมเดลมี `/` (แบบ OpenRouter) ให้รวม prefix ผู้ให้บริการด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละผู้ให้บริการไว้ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นการจับคู่ผู้ให้บริการที่กำหนดค่าไว้ซึ่งมีค่าเดียวสำหรับ model id นั้นพอดี แล้วจึง
  fallback ไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้แล้ว OpenClaw
  จะ fallback ไปยังผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรก แทนการแสดง
  ค่าเริ่มต้นของผู้ให้บริการเก่าที่ถูกลบไปแล้ว
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุตรับรองตัวตนสำหรับ placeholder ที่ไม่ใช่ความลับ (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็นความลับ

### การสแกนโมเดล

`models scan` อ่าน catalog สาธารณะ `:free` ของ OpenRouter และจัดอันดับตัวเลือกสำหรับ
ใช้เป็น fallback ตัว catalog เองเป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงไม่ต้องใช้
key ของ OpenRouter

โดยค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับเครื่องมือและรูปภาพด้วยการเรียกโมเดลแบบสด
หากไม่มีการกำหนดค่า key ของ OpenRouter คำสั่งจะ fallback ไปใช้เอาต์พุตเฉพาะ metadata
และอธิบายว่าโมเดล `:free` ยังต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (เฉพาะ metadata; ไม่ค้นหา config/ความลับ)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout ของคำขอ catalog และต่อ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้ probe แบบสด; ผลการสแกนเฉพาะ metadata
เป็นข้อมูลประกอบเท่านั้นและจะไม่ถูกนำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์รับรองตัวตนที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (id โปรไฟล์แบบซ้ำได้หรือคั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent ที่กำหนดค่าไว้; override `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` สงวน stdout ไว้สำหรับ payload JSON เท่านั้น diagnostic ของโปรไฟล์รับรองตัวตน ผู้ให้บริการ
และ startup จะถูกส่งไปยัง stderr เพื่อให้สคริปต์สามารถ pipe stdout โดยตรง
เข้าเครื่องมืออย่าง `jq`

กลุ่มสถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณีรายละเอียด/รหัสเหตุผลของ probe ที่ควรคาดไว้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่เก็บไว้ แต่ `auth.order.<provider>` แบบ explicit
  ละไว้ ดังนั้น probe จะรายงานการถูกยกเว้นแทนการ
  ลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่แต่ไม่ eligible/resolve ไม่ได้
- `no_model`: มีการรับรองตัวตนผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve ตัวเลือก
  โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์รับรองตัวตน

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` คือ helper รับรองตัวตนแบบ interactive สามารถเปิด flow รับรองตัวตนของผู้ให้บริการ
(OAuth/API key) หรือแนะนำคุณให้ paste token ด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth list` แสดงรายการโปรไฟล์รับรองตัวตนที่บันทึกไว้สำหรับ agent ที่เลือกโดยไม่
พิมพ์ token, API-key หรือข้อมูลลับ OAuth ใช้ `--provider <id>` เพื่อ
กรองให้เหลือผู้ให้บริการหนึ่งราย เช่น `openai-codex` และใช้ `--json` สำหรับ scripting

`models auth login` รัน flow รับรองตัวตนของ Plugin ผู้ให้บริการ (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่ามีผู้ให้บริการใดติดตั้งอยู่
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลการรับรองตัวตนไปยัง
store ของ agent ที่กำหนดค่าไว้โดยเฉพาะ flag หลัก `--agent` จะถูกใช้โดย
`add`, `list`, `login`, `setup-token`, `paste-token` และ
`login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยวิธีรับรองตัวตนด้วย token
- `setup-token` ต้องใช้ TTY แบบ interactive และรันวิธี token-auth ของผู้ให้บริการ
  (ค่าเริ่มต้นเป็นวิธี `setup-token` ของผู้ให้บริการนั้นเมื่อเปิดเผย
  ไว้)
- `paste-token` รับสตริง token ที่สร้างจากที่อื่นหรือจาก automation
- `paste-token` ต้องใช้ `--provider`, prompt ให้ป้อนค่า token และเขียน
  ไปยัง id โปรไฟล์เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` เก็บวันหมดอายุ token แบบ absolute จาก
  duration แบบ relative เช่น `365d` หรือ `12h`
- หมายเหตุ Anthropic: พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับอนุญาตสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- `setup-token` / `paste-token` ของ Anthropic ยังคงมีให้ใช้เป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะเลือกใช้ Claude CLI ซ้ำและ `claude -p` ก่อนเมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การ failover โมเดล](/th/concepts/model-failover)
