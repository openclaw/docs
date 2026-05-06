---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการยืนยันตัวตนของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่มีอยู่ และดีบักโปรไฟล์การตรวจสอบสิทธิ์
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, นามแฝง, กลไกสำรอง, การตรวจสอบสิทธิ์)
title: โมเดล
x-i18n:
    generated_at: "2026-05-06T09:06:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c7a1cce7b1b21411540238b1858580a56b2271d54d0898e261b69bd21f88c0f5
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น ตัวสำรอง และโปรไฟล์การยืนยันตัวตน)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [โมเดล](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดโมเดล](/th/concepts/models)
- การตั้งค่าการยืนยันตัวตนผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่าเริ่มต้น/ตัวสำรองที่ resolve แล้ว พร้อมภาพรวมการยืนยันตัวตน
เมื่อมีสแนปช็อตการใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/API-key จะรวม
หน้าต่างการใช้งานและสแนปช็อตโควตาของผู้ให้บริการไว้ด้วย
ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai การยืนยันตัวตนการใช้งานมาจาก hook เฉพาะผู้ให้บริการ
เมื่อมีให้ใช้ มิฉะนั้น OpenClaw จะถอยกลับไปจับคู่ข้อมูลประจำตัว OAuth/API-key
จากโปรไฟล์การยืนยันตัวตน, env หรือ config
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวมผู้ให้บริการที่รับรู้ env/config/store
ขณะที่ `auth.oauth` คือสุขภาพของโปรไฟล์ auth-store เท่านั้น
เพิ่ม `--probe` เพื่อรันการ probe การยืนยันตัวตนแบบสดกับโปรไฟล์ผู้ให้บริการที่กำหนดค่าไว้แต่ละรายการ
การ probe เป็นคำขอจริง (อาจใช้ token และทำให้เกิด rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การยืนยันตัวตนของ agent ที่กำหนดค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ มิฉะนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน ข้อมูลประจำตัว env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: จะอ่าน config, โปรไฟล์การยืนยันตัวตน, สถานะแค็ตตาล็อกที่มีอยู่
  และแถวแค็ตตาล็อกที่ผู้ให้บริการเป็นเจ้าของ แต่จะไม่เขียน
  `models.json` ใหม่
- คอลัมน์ `Auth` อยู่ระดับผู้ให้บริการและเป็นแบบอ่านอย่างเดียว ค่านี้คำนวณจากเมตาดาตา
  โปรไฟล์การยืนยันตัวตนภายในเครื่อง, marker ของ env, key ผู้ให้บริการที่กำหนดค่าไว้, marker ของผู้ให้บริการภายในเครื่อง,
  marker env/profile ของ AWS Bedrock และเมตาดาตา synthetic-auth ของ Plugin;
  ค่านี้จะไม่โหลด runtime ของผู้ให้บริการ อ่าน secret จาก keychain เรียก API
  ของผู้ให้บริการ หรือพิสูจน์ความพร้อมการรันต่อโมเดลอย่างแม่นยำ
- `models list --all --provider <id>` อาจรวมแถวแค็ตตาล็อก static ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ Plugin หรือเมตาดาตาแค็ตตาล็อกผู้ให้บริการที่ bundled มา แม้คุณ
  จะยังไม่ได้ยืนยันตัวตนกับผู้ให้บริการนั้น แถวเหล่านั้นยังคงแสดงเป็น
  ไม่พร้อมใช้งานจนกว่าจะกำหนดค่าการยืนยันตัวตนที่ตรงกัน
- `models list` ทำให้ control plane ตอบสนองอยู่เสมอขณะที่การค้นหาแค็ตตาล็อกผู้ให้บริการ
  ทำงานช้า มุมมองเริ่มต้นและมุมมองที่กำหนดค่าไว้จะถอยกลับไปใช้แถวโมเดลที่กำหนดค่าไว้หรือ
  synthetic หลังรอสั้น ๆ และปล่อยให้การค้นหาทำงานต่อใน
  เบื้องหลัง ใช้ `--all` เมื่อคุณต้องการแค็ตตาล็อกที่ค้นพบครบถ้วนแน่นอนและ
  ยินดีรอการค้นหาผู้ให้บริการ
- `models list --all` แบบกว้างจะ merge แถวแค็ตตาล็อก manifest ทับแถว registry
  โดยไม่โหลด runtime supplement hooks ของผู้ให้บริการ fast path manifest ที่กรองตามผู้ให้บริการ
  ใช้เฉพาะผู้ให้บริการที่ทำเครื่องหมาย `static`; ผู้ให้บริการที่ทำเครื่องหมาย `refreshable`
  ยังคงอิง registry/cache และต่อท้ายแถว manifest เป็นส่วนเสริม ส่วน
  ผู้ให้บริการที่ทำเครื่องหมาย `runtime` ยังคงใช้การค้นพบแบบ registry/runtime
- `models list` แยกเมตาดาตาโมเดล native ออกจาก runtime caps ในเอาต์พุตตาราง
  `Ctx` จะแสดง `contextTokens/contextWindow` เมื่อ runtime cap ที่มีผล
  แตกต่างจาก native context window; แถว JSON จะรวม `contextTokens`
  เมื่อผู้ให้บริการเปิดเผย cap นั้น
- `models list --provider <id>` กรองตาม provider id เช่น `moonshot` หรือ
  `openai-codex` ไม่รับ label ที่แสดงจากตัวเลือกผู้ให้บริการแบบ interactive
  เช่น `Moonshot AI`
- model refs ถูกแยกโดย split ที่ `/` **ตัวแรก** หาก model ID มี `/` (สไตล์ OpenRouter) ให้ใส่ provider prefix (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละผู้ให้บริการไว้ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็น match ของ configured-provider ที่ไม่ซ้ำสำหรับ model id นั้นแบบตรงตัว และจึงค่อย
  ถอยกลับไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้แล้ว OpenClaw
  จะถอยกลับไปยัง provider/model แรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้ว
  ซึ่งล้าสมัย
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุตการยืนยันตัวตนสำหรับ placeholder ที่ไม่ใช่ secret (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็น secret

### สแกนโมเดล

`models scan` อ่านแค็ตตาล็อกสาธารณะ `:free` ของ OpenRouter และจัดอันดับ candidate สำหรับ
ใช้เป็นตัวสำรอง ตัวแค็ตตาล็อกเป็นสาธารณะ ดังนั้นการสแกนเฉพาะเมตาดาตาไม่จำเป็นต้องมี
key ของ OpenRouter

โดยค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับ tool และ image ด้วยการเรียกโมเดลแบบสด
หากไม่ได้กำหนดค่า key ของ OpenRouter คำสั่งจะถอยกลับไปใช้เอาต์พุตเฉพาะเมตาดาตา
และอธิบายว่าโมเดล `:free` ยังคงต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (เฉพาะเมตาดาตา; ไม่ค้นหา config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout สำหรับคำขอแค็ตตาล็อกและแต่ละ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้ probe แบบสด; ผลลัพธ์การสแกนเฉพาะเมตาดาตา
เป็นข้อมูลประกอบและจะไม่ถูกนำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ไม่มี, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ทำซ้ำหรือระบุ profile ids คั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (configured agent id; แทนที่ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` สงวน stdout สำหรับ payload JSON การวินิจฉัยเกี่ยวกับ auth-profile, ผู้ให้บริการ
และการเริ่มต้นจะถูกส่งไปยัง stderr เพื่อให้สคริปต์ pipe stdout โดยตรง
เข้าเครื่องมืออย่าง `jq` ได้

กลุ่มสถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณี detail/reason-code ของ probe ที่ควรคาดไว้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บไว้ แต่
  `auth.order.<provider>` แบบ explicit ละเว้นโปรไฟล์นั้น ดังนั้น probe จะรายงานการถูกยกเว้นแทน
  การลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่แต่ไม่ eligible/resolve ได้
- `no_model`: มีการยืนยันตัวตนผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve
  candidate โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น

## Alias + ตัวสำรอง

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์การยืนยันตัวตน

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` เป็น helper การยืนยันตัวตนแบบ interactive สามารถเปิด flow การยืนยันตัวตนของผู้ให้บริการ
(OAuth/API key) หรือนำทางคุณไปวาง token แบบ manual ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth list` แสดงรายการโปรไฟล์การยืนยันตัวตนที่บันทึกไว้สำหรับ agent ที่เลือกโดยไม่
พิมพ์ token, API-key หรือ secret material ของ OAuth ใช้ `--provider <id>` เพื่อ
กรองไปยังผู้ให้บริการรายเดียว เช่น `openai-codex` และใช้ `--json` สำหรับสคริปต์

`models auth login` รัน flow การยืนยันตัวตนของ Plugin ผู้ให้บริการ (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่าติดตั้งผู้ให้บริการใดไว้บ้าง
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลลัพธ์การยืนยันตัวตนไปยัง
store ของ agent ที่กำหนดค่าไว้เฉพาะ flag แม่ `--agent` จะถูกใช้งานโดย
`add`, `list`, `login`, `setup-token`, `paste-token` และ
`login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยวิธีการยืนยันตัวตนด้วย token
- `setup-token` ต้องใช้ TTY แบบ interactive และรันวิธี token-auth ของผู้ให้บริการ
  (ค่าเริ่มต้นเป็นวิธี `setup-token` ของผู้ให้บริการนั้นเมื่อมีการเปิดเผย
  วิธีหนึ่ง)
- `paste-token` รับ token string ที่สร้างจากที่อื่นหรือจากระบบอัตโนมัติ
- `paste-token` ต้องใช้ `--provider`, prompt ให้ป้อนค่า token และเขียน
  ไปยัง profile id เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จัดเก็บเวลาหมดอายุ token แบบ absolute จาก
  ระยะเวลา relative เช่น `365d` หรือ `12h`
- หมายเหตุ Anthropic: เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI สไตล์ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จะถือว่าการ reuse Claude CLI และการใช้งาน `claude -p` ได้รับการรับรองสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic `setup-token` / `paste-token` ยังคงพร้อมใช้งานในฐานะเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะเลือกใช้การ reuse Claude CLI และ `claude -p` ก่อนเมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [อ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
