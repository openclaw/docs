---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการตรวจสอบสิทธิ์ของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งานและดีบักโปรไฟล์การตรวจสอบสิทธิ์
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, นามแฝง, กลไกสำรอง, การยืนยันตัวตน)
title: โมเดล
x-i18n:
    generated_at: "2026-04-30T09:44:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 95e2361989b583f7f52947dad1faaaba44dc6a5f58719cc2e83c13fce7c33adc
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น fallback และโปรไฟล์ auth)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [โมเดล](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดโมเดล](/th/concepts/models)
- การตั้งค่า auth ของผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่า default/fallbacks ที่ resolve แล้ว พร้อมภาพรวม auth
เมื่อมี snapshot การใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/API-key จะรวม
หน้าต่างการใช้งานของผู้ให้บริการและ snapshot โควตา
ผู้ให้บริการ usage-window ปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai ข้อมูล auth การใช้งานมาจาก hook เฉพาะของผู้ให้บริการ
เมื่อมีให้ใช้ มิฉะนั้น OpenClaw จะ fallback ไปยังข้อมูลประจำตัว OAuth/API-key
ที่ตรงกันจากโปรไฟล์ auth, env หรือ config
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวมผู้ให้บริการที่รับรู้ env/config/store
ขณะที่ `auth.oauth` คือสุขภาพของโปรไฟล์ auth-store เท่านั้น
เพิ่ม `--probe` เพื่อรัน probe auth แบบสดกับโปรไฟล์ผู้ให้บริการแต่ละรายการที่กำหนดค่าไว้
Probe เป็น request จริง (อาจใช้ token และกระตุ้น rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/auth ของ agent ที่กำหนดค่าไว้ เมื่อไม่ได้ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ มิฉะนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์ auth, ข้อมูลประจำตัว env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: อ่าน config, โปรไฟล์ auth, สถานะแค็ตตาล็อกที่มีอยู่
  และแถวแค็ตตาล็อกที่ผู้ให้บริการเป็นเจ้าของ แต่ไม่เขียน
  `models.json` ใหม่
- คอลัมน์ `Auth` เป็นระดับผู้ให้บริการและอ่านอย่างเดียว ค่านี้คำนวณจาก metadata
  โปรไฟล์ auth ในเครื่อง, marker ของ env, key ของผู้ให้บริการที่กำหนดค่าไว้, marker ของ local-provider,
  marker env/profile ของ AWS Bedrock และ metadata synthetic-auth ของ plugin;
  ค่านี้ไม่โหลด runtime ของผู้ให้บริการ ไม่อ่าน secret จาก keychain ไม่เรียก API ของผู้ให้บริการ
  หรือพิสูจน์ความพร้อมในการรันแบบต่อโมเดลอย่างแม่นยำ
- `models list --all --provider <id>` อาจรวมแถวแค็ตตาล็อก static ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ plugin หรือ metadata แค็ตตาล็อกผู้ให้บริการที่ bundled มา แม้ว่าคุณ
  ยังไม่ได้ authenticate กับผู้ให้บริการนั้นก็ตาม แถวเหล่านั้นยังคงแสดงเป็น
  unavailable จนกว่าจะกำหนดค่า auth ที่ตรงกัน
- `models list --all` แบบกว้างจะ merge แถวแค็ตตาล็อก manifest ทับแถว registry
  โดยไม่โหลด hook supplement ของ runtime ผู้ให้บริการ fast path ของ manifest ที่กรองตามผู้ให้บริการ
  ใช้เฉพาะผู้ให้บริการที่ทำเครื่องหมายเป็น `static`; ผู้ให้บริการที่ทำเครื่องหมายเป็น `refreshable`
  ยังคงอิง registry/cache และผนวกแถว manifest เป็น supplement ขณะที่
  ผู้ให้บริการที่ทำเครื่องหมายเป็น `runtime` ยังคงใช้การค้นพบผ่าน registry/runtime
- `models list` แยก metadata โมเดล native ออกจาก runtime caps ในเอาต์พุตแบบตาราง
  `Ctx` แสดง `contextTokens/contextWindow` เมื่อ runtime cap ที่มีผลต่างจาก native context window;
  แถว JSON รวม `contextTokens` เมื่อผู้ให้บริการ expose cap นั้น
- `models list --provider <id>` กรองตาม provider id เช่น `moonshot` หรือ
  `openai-codex` ไม่รับ label ที่แสดงจากตัวเลือกผู้ให้บริการแบบ interactive
  เช่น `Moonshot AI`
- model refs ถูก parse โดยแยกที่ `/` ตัว **แรก** หาก model ID มี `/` (สไตล์ OpenRouter) ให้ใส่ provider prefix (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละเว้นผู้ให้บริการ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็น match ของ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงตัว และหลังจากนั้นจึง
  fallback ไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หากผู้ให้บริการนั้นไม่ได้ expose โมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยัง provider/model รายการแรกที่กำหนดค่าไว้แทนการแสดง
  default ของผู้ให้บริการที่ถูกลบและค้างอยู่
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุต auth สำหรับ placeholder ที่ไม่ใช่ secret (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็น secret

### การสแกนโมเดล

`models scan` อ่านแค็ตตาล็อก `:free` สาธารณะของ OpenRouter และจัดอันดับ candidate สำหรับ
การใช้เป็น fallback ตัวแค็ตตาล็อกเป็นสาธารณะ ดังนั้นการสแกนเฉพาะ metadata จึงไม่ต้องใช้
key ของ OpenRouter

โดยค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับ tool และ image ด้วยการเรียกโมเดลสด
หากไม่ได้กำหนดค่า key ของ OpenRouter คำสั่งจะ fallback ไปยังเอาต์พุตเฉพาะ metadata
และอธิบายว่าโมเดล `:free` ยังต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (เฉพาะ metadata; ไม่ lookup config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout ของ request แค็ตตาล็อกและต่อ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้ probe สด; ผลการสแกนเฉพาะ metadata
มีไว้เพื่อให้ข้อมูลและจะไม่ถูกนำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe สดของโปรไฟล์ auth ที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ทำซ้ำหรือใช้ id โปรไฟล์คั่นด้วย comma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id ของ agent ที่กำหนดค่าไว้; override `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` สงวน stdout ไว้สำหรับ payload JSON การวินิจฉัยโปรไฟล์ auth, ผู้ให้บริการ
และ startup จะถูกส่งไปยัง stderr เพื่อให้ script สามารถ pipe stdout โดยตรง
เข้า tool เช่น `jq`

bucket สถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

case ของรายละเอียด/reason-code ของ probe ที่ควรคาดไว้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่เก็บไว้ แต่ explicit
  `auth.order.<provider>` ละเว้นโปรไฟล์นั้น ดังนั้น probe จึงรายงานการถูก exclude แทน
  การลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่แต่ไม่ eligible/resolve ไม่ได้
- `no_model`: มี auth ของผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve
  candidate โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์ auth

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` คือ helper auth แบบ interactive สามารถเปิด flow auth ของผู้ให้บริการ
(OAuth/API key) หรือพาคุณไป paste token ด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth login` รัน flow auth ของ Plugin ผู้ให้บริการ (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่ามีผู้ให้บริการใดติดตั้งอยู่
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลลัพธ์ auth ไปยัง
store ของ agent ที่กำหนดค่าไว้รายการหนึ่ง flag parent `--agent` จะถูกใช้โดย
`add`, `login`, `setup-token`, `paste-token` และ `login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับผู้ให้บริการ
  ที่ expose วิธี auth ด้วย token
- `setup-token` ต้องใช้ TTY แบบ interactive และรันวิธี token-auth ของผู้ให้บริการ
  (ค่าเริ่มต้นเป็นวิธี `setup-token` ของผู้ให้บริการนั้นเมื่อมีการ expose
  วิธีดังกล่าว)
- `paste-token` รับสตริง token ที่สร้างจากที่อื่นหรือจาก automation
- `paste-token` ต้องใช้ `--provider`, prompt ให้ใส่ค่า token และเขียน
  ไปยัง profile id เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` เก็บวันหมดอายุ token แบบ absolute จาก
  duration แบบ relative เช่น `365d` หรือ `12h`
- หมายเหตุ Anthropic: staff ของ Anthropic แจ้งเราว่าการใช้งาน Claude CLI สไตล์ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการ reuse Claude CLI และการใช้ `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่ policy ใหม่
- Anthropic `setup-token` / `paste-token` ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะเลือกใช้การ reuse Claude CLI และ `claude -p` ก่อนเมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [เอกสารอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การ failover โมเดล](/th/concepts/model-failover)
