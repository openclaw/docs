---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการยืนยันตัวตนของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งาน และดีบักโปรไฟล์การตรวจสอบสิทธิ์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, นามแฝง, ตัวสำรอง, auth)
title: โมเดล
x-i18n:
    generated_at: "2026-05-07T13:14:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8e1a7a9304f9d03d11e38262487eae4f0cf8d7e0be7ca71bcc208030784728bf
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นพบโมเดล การสแกน และการกำหนดค่า (โมเดลเริ่มต้น fallback และโปรไฟล์ auth)

ที่เกี่ยวข้อง:

- Provider + โมเดล: [โมเดล](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดโมเดล](/th/concepts/models)
- การตั้งค่า auth ของ Provider: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่า default/fallback ที่ resolve แล้ว พร้อมภาพรวม auth
เมื่อมีสแนปช็อตการใช้งานของ Provider ส่วนสถานะ OAuth/API-key จะรวม
หน้าต่างการใช้งานของ Provider และสแนปช็อตโควตาไว้ด้วย
Provider ที่มีหน้าต่างการใช้งานในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai auth สำหรับการใช้งานมาจาก hook เฉพาะ Provider
เมื่อมีให้ใช้ มิฉะนั้น OpenClaw จะ fallback ไปยังข้อมูลประจำตัว OAuth/API-key
ที่ตรงกันจากโปรไฟล์ auth, env หรือ config
ในเอาต์พุต `--json` นั้น `auth.providers` คือภาพรวม Provider
ที่รับรู้ env/config/store ส่วน `auth.oauth` คือสุขภาพโปรไฟล์ใน auth-store เท่านั้น
เพิ่ม `--probe` เพื่อรันการ probe auth แบบสดกับโปรไฟล์ Provider ที่กำหนดค่าไว้แต่ละรายการ
Probe เป็นคำขอจริง (อาจใช้ token และทำให้ติด rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/auth ของ agent ที่กำหนดค่าไว้ เมื่อไม่ได้ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ มิฉะนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลประจำตัว env หรือ `models.json`
สำหรับการแก้ปัญหา Codex OAuth, `openclaw models status`,
`openclaw models auth list --provider openai-codex` และ
`openclaw config get agents.defaults.model --json` เป็นวิธีที่เร็วที่สุดในการ
ยืนยันว่า agent มีโปรไฟล์ auth `openai-codex` ที่ใช้งานได้สำหรับ
`openai/*` ผ่าน runtime Codex แบบ native หรือไม่ ดู [การตั้งค่า Provider OpenAI](/th/providers/openai#check-and-recover-codex-oauth-routing)

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: คำสั่งนี้อ่าน config, โปรไฟล์ auth, สถานะ catalog
  ที่มีอยู่ และแถว catalog ที่ Provider เป็นเจ้าของ แต่จะไม่เขียน `models.json` ใหม่
- คอลัมน์ `Auth` เป็นระดับ Provider และอ่านอย่างเดียว ค่านี้คำนวณจาก metadata โปรไฟล์ auth
  ภายในเครื่อง, marker ของ env, key ของ Provider ที่กำหนดค่าไว้, marker ของ local-provider,
  marker ของ env/profile ของ AWS Bedrock และ metadata synthetic-auth ของ Plugin;
  โดยจะไม่โหลด runtime ของ Provider, ไม่อ่าน secret ใน keychain, ไม่เรียก
  API ของ Provider หรือพิสูจน์ความพร้อมในการรันแบบรายโมเดลอย่างแน่นอน
- `models list --all --provider <id>` สามารถรวมแถว catalog แบบ static ที่ Provider เป็นเจ้าของ
  จาก manifest ของ Plugin หรือ metadata catalog ของ Provider ที่ bundled ไว้ได้ แม้คุณ
  จะยังไม่ได้ auth กับ Provider นั้นก็ตาม แถวเหล่านั้นยังคงแสดงว่า
  unavailable จนกว่าจะกำหนดค่า auth ที่ตรงกัน
- `models list` ทำให้ control plane ตอบสนองได้ดีขณะที่การค้นพบ catalog ของ Provider
  ทำงานช้า มุมมอง default และมุมมองที่กำหนดค่าไว้จะ fallback ไปยังแถวโมเดลที่กำหนดค่าไว้หรือ
  แถวโมเดล synthetic หลังจากรอสั้น ๆ และปล่อยให้การค้นพบเสร็จใน
  เบื้องหลัง ใช้ `--all` เมื่อต้องการ catalog ที่ค้นพบครบถ้วนและแม่นยำ
  และยินดีรอการค้นพบของ Provider
- `models list --all` แบบกว้างจะ merge แถว catalog จาก manifest ทับแถว registry
  โดยไม่โหลด hook เสริม runtime ของ Provider fast path ของ manifest ที่กรองตาม Provider
  ใช้เฉพาะ Provider ที่ทำเครื่องหมาย `static`; Provider ที่ทำเครื่องหมาย `refreshable`
  จะยังคงอิง registry/cache และผนวกแถว manifest เป็นส่วนเสริม ส่วน
  Provider ที่ทำเครื่องหมาย `runtime` จะยังคงใช้การค้นพบผ่าน registry/runtime
- `models list` แยก metadata โมเดลแบบ native กับ cap ของ runtime ออกจากกัน ในเอาต์พุตแบบตาราง
  `Ctx` แสดง `contextTokens/contextWindow` เมื่อ cap runtime ที่มีผล
  แตกต่างจาก context window แบบ native; แถว JSON จะรวม `contextTokens`
  เมื่อ Provider เปิดเผย cap นั้น
- `models list --provider <id>` กรองตาม id ของ Provider เช่น `moonshot` หรือ
  `openai-codex` คำสั่งนี้ไม่รับ label แสดงผลจากตัวเลือก Provider แบบ interactive
  เช่น `Moonshot AI`
- การ parse model ref ทำโดยแบ่งที่ `/` ตัว**แรก** หาก model ID มี `/` (สไตล์ OpenRouter) ให้รวม prefix ของ Provider (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละ Provider ไว้ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นการ match กับ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงตัว และหลังจากนั้นเท่านั้น
  จึง fallback ไปยัง Provider เริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หาก Provider นั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยัง Provider/โมเดลที่กำหนดค่าไว้รายการแรก แทนการแสดง
  ค่าเริ่มต้นของ Provider ที่ถูกนำออกและล้าสมัย
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุต auth สำหรับ placeholder ที่ไม่ใช่ secret (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็น secret

### การสแกนโมเดล

`models scan` อ่าน catalog `:free` สาธารณะของ OpenRouter และจัดอันดับ candidate สำหรับ
ใช้เป็น fallback ตัว catalog เองเป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงไม่จำเป็นต้องมี
key ของ OpenRouter

ตามค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับ tool และ image ด้วยการเรียกโมเดลแบบสด
หากไม่ได้กำหนดค่า key ของ OpenRouter คำสั่งจะ fallback ไปยัง
เอาต์พุตเฉพาะ metadata และอธิบายว่าโมเดล `:free` ยังคงต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (เฉพาะ metadata; ไม่ค้นหา config/secret)
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
เป็นข้อมูลประกอบและจะไม่นำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์ auth ที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe Provider เดียว)
- `--probe-profile <id>` (ทำซ้ำหรือใช้ id โปรไฟล์คั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id ของ agent ที่กำหนดค่าไว้; override `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` สงวน stdout ไว้สำหรับ payload JSON การวินิจฉัยโปรไฟล์ auth, Provider
และ startup จะถูกส่งไปยัง stderr เพื่อให้ script pipe stdout โดยตรง
ไปยังเครื่องมืออย่าง `jq` ได้

กลุ่มสถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณีรายละเอียด/reason-code ของ probe ที่ควรคาดไว้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บไว้ แต่ `auth.order.<provider>` แบบ explicit
  ละเว้นไว้ ดังนั้น probe จะรายงานการถูกยกเว้นแทนการ
  ลองใช้โปรไฟล์นั้น
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่ แต่ไม่ eligible/resolve ได้
- `no_model`: มี auth ของ Provider อยู่ แต่ OpenClaw ไม่สามารถ resolve candidate โมเดล
  ที่ probe ได้สำหรับ Provider นั้น

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์ auth

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` คือ helper auth แบบ interactive สามารถเริ่ม flow auth ของ Provider
(OAuth/API key) หรือแนะนำให้คุณ paste token ด้วยตนเอง ขึ้นอยู่กับ
Provider ที่คุณเลือก

`models auth list` แสดงรายการโปรไฟล์ auth ที่บันทึกไว้สำหรับ agent ที่เลือก โดยไม่
พิมพ์ token, API-key หรือข้อมูล secret ของ OAuth ใช้ `--provider <id>` เพื่อ
กรองเหลือ Provider เดียว เช่น `openai-codex` และใช้ `--json` สำหรับ scripting

`models auth login` รัน flow auth ของ Plugin Provider (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่า Provider ใดติดตั้งอยู่
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผล auth ไปยัง
store ของ agent ที่กำหนดค่าไว้โดยเฉพาะ flag `--agent` ที่ parent จะถูกใช้งานโดย
`add`, `list`, `login`, `setup-token`, `paste-token` และ
`login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับ Provider
  ที่เปิดเผยวิธี auth ด้วย token
- `setup-token` ต้องใช้ TTY แบบ interactive และรันวิธี token-auth ของ Provider
  (ค่าเริ่มต้นคือวิธี `setup-token` ของ Provider นั้นเมื่อมีการเปิดเผยไว้)
- `paste-token` รับ token string ที่สร้างจากที่อื่นหรือจาก automation
- `paste-token` ต้องใช้ `--provider`, prompt ให้กรอกค่า token และเขียน
  ไปยัง id โปรไฟล์เริ่มต้น `<provider>:manual` เว้นแต่คุณส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จัดเก็บเวลาหมดอายุแบบ absolute ของ token จาก
  duration แบบ relative เช่น `365d` หรือ `12h`
- หมายเหตุ Anthropic: พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI สไตล์ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการ reuse Claude CLI และการใช้งาน `claude -p` ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic `setup-token` / `paste-token` ยังคงพร้อมใช้งานในฐานะเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการ reuse Claude CLI และ `claude -p` เมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การ failover โมเดล](/th/concepts/model-failover)
