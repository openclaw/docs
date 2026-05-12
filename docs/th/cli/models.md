---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการตรวจสอบสิทธิ์ของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งานและดีบักโปรไฟล์การยืนยันตัวตน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, ชื่อแฝง, ตัวสำรอง, การตรวจสอบสิทธิ์)
title: โมเดล
x-i18n:
    generated_at: "2026-05-12T00:58:50Z"
    model: gpt-5.5
    provider: openai
    source_hash: 532bccd19b53517447ad784a1103fa65efe890bf35100bb88161a88aeb3c67b1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น โมเดลสำรอง โปรไฟล์การยืนยันตัวตน)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [โมเดล](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดโมเดล](/th/concepts/models)
- การตั้งค่าการยืนยันตัวตนของผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่าเริ่มต้น/โมเดลสำรองที่แก้ไขแล้ว พร้อมภาพรวมการยืนยันตัวตน
เมื่อมีสแนปช็อตการใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/API-key จะรวม
หน้าต่างเวลาการใช้งานของผู้ให้บริการและสแนปช็อตโควตา
ผู้ให้บริการหน้าต่างเวลาการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai การยืนยันตัวตนการใช้งานมาจาก hook เฉพาะผู้ให้บริการ
เมื่อมีให้ใช้ ไม่เช่นนั้น OpenClaw จะถอยกลับไปจับคู่ข้อมูลรับรอง OAuth/API-key
จากโปรไฟล์การยืนยันตัวตน, env หรือ config
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวมผู้ให้บริการที่รับรู้ env/config/store
ขณะที่ `auth.oauth` คือสถานภาพของโปรไฟล์ auth-store เท่านั้น
เพิ่ม `--probe` เพื่อเรียกใช้การ probe การยืนยันตัวตนแบบสดกับโปรไฟล์ผู้ให้บริการที่กำหนดค่าแต่ละรายการ
Probe เป็นคำขอจริง (อาจใช้ token และกระตุ้น rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การยืนยันตัวตนของ agent ที่กำหนดค่าไว้ เมื่อไม่ได้ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ ไม่เช่นนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน ข้อมูลรับรอง env หรือ `models.json`
สำหรับการแก้ปัญหา Codex OAuth, `openclaw models status`,
`openclaw models auth list --provider openai-codex` และ
`openclaw config get agents.defaults.model --json` เป็นวิธีที่เร็วที่สุดในการ
ยืนยันว่า agent มีโปรไฟล์การยืนยันตัวตน `openai-codex` ที่ใช้งานได้สำหรับ
`openai/*` ผ่าน runtime Codex ดั้งเดิมหรือไม่ ดู [การตั้งค่าผู้ให้บริการ OpenAI](/th/providers/openai#check-and-recover-codex-oauth-routing)

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: อ่าน config, โปรไฟล์การยืนยันตัวตน, สถานะแค็ตตาล็อกที่มีอยู่
  และแถวแค็ตตาล็อกที่ผู้ให้บริการเป็นเจ้าของ แต่ไม่เขียน `models.json` ใหม่
- คอลัมน์ `Auth` เป็นระดับผู้ให้บริการและอ่านอย่างเดียว ค่านี้คำนวณจากเมทาดาทาโปรไฟล์การยืนยันตัวตน
  ในเครื่อง, marker ของ env, key ผู้ให้บริการที่กำหนดค่าไว้, marker ของผู้ให้บริการในเครื่อง,
  marker env/profile ของ AWS Bedrock และเมทาดาทา synthetic-auth ของ plugin;
  ค่านี้ไม่โหลด runtime ของผู้ให้บริการ ไม่อ่าน secret ใน keychain ไม่เรียก API
  ของผู้ให้บริการ หรือพิสูจน์ความพร้อมในการทำงานจริงรายโมเดลอย่างแม่นยำ
- `models list --all --provider <id>` อาจรวมแถวแค็ตตาล็อก static ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ plugin หรือเมทาดาทาแค็ตตาล็อกผู้ให้บริการที่ bundled มา แม้คุณ
  ยังไม่ได้ยืนยันตัวตนกับผู้ให้บริการนั้น แถวเหล่านั้นจะยังแสดงเป็น
  ไม่พร้อมใช้งานจนกว่าจะกำหนดค่าการยืนยันตัวตนที่ตรงกัน
- `models list` ทำให้ control plane ตอบสนองได้ขณะที่การค้นหาแค็ตตาล็อกของผู้ให้บริการ
  ช้า มุมมองเริ่มต้นและมุมมองที่กำหนดค่าไว้จะถอยกลับไปใช้แถวโมเดลที่กำหนดค่าไว้หรือ
  synthetic หลังจากรอสั้น ๆ และปล่อยให้การค้นหาเสร็จใน
  background ใช้ `--all` เมื่อคุณต้องการแค็ตตาล็อกที่ค้นพบทั้งหมดอย่างแม่นยำและ
  ยินดีรอการค้นหาของผู้ให้บริการ
- `models list --all` แบบกว้างจะผสานแถวแค็ตตาล็อก manifest ทับแถว registry
  โดยไม่โหลด hook เสริม runtime ของผู้ให้บริการ fast path ของ manifest ที่กรองตามผู้ให้บริการ
  ใช้เฉพาะผู้ให้บริการที่ทำเครื่องหมาย `static`; ผู้ให้บริการที่ทำเครื่องหมาย `refreshable`
  ยังคงอิง registry/cache และเพิ่มแถว manifest เป็นส่วนเสริม ขณะที่
  ผู้ให้บริการที่ทำเครื่องหมาย `runtime` ยังคงใช้การค้นพบ registry/runtime
- `models list` แยกเมทาดาทาโมเดลดั้งเดิมและขีดจำกัด runtime ออกจากกัน ในเอาต์พุตตาราง
  `Ctx` แสดง `contextTokens/contextWindow` เมื่อขีดจำกัด runtime ที่มีผลแตกต่างจากหน้าต่าง context ดั้งเดิม; แถว JSON รวม `contextTokens`
  เมื่อผู้ให้บริการเปิดเผยขีดจำกัดนั้น
- `models list --provider <id>` กรองตาม id ผู้ให้บริการ เช่น `moonshot` หรือ
  `openai-codex` ไม่รับป้ายชื่อแสดงผลจากตัวเลือกผู้ให้บริการแบบโต้ตอบ
  เช่น `Moonshot AI`
- Model ref ถูก parse โดยแยกที่ `/` ตัว**แรก** หาก ID โมเดลมี `/` (สไตล์ OpenRouter) ให้ใส่ prefix ผู้ให้บริการ (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละเว้นผู้ให้บริการ OpenClaw จะแก้ไขอินพุตเป็น alias ก่อน จากนั้น
  เป็นการจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ model id นั้นอย่างตรงตัว และหลังจากนั้นเท่านั้น
  จึงถอยกลับไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะถอยกลับไปยังผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนการแสดง
  ค่าเริ่มต้นของผู้ให้บริการที่ถูกลบซึ่งล้าสมัย
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุตการยืนยันตัวตนสำหรับ placeholder ที่ไม่ใช่ secret (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการปิดบังเป็น secret

### การสแกนโมเดล

`models scan` อ่านแค็ตตาล็อก `:free` สาธารณะของ OpenRouter และจัดอันดับ candidate สำหรับ
การใช้เป็น fallback ตัวแค็ตตาล็อกเป็นสาธารณะ ดังนั้นการสแกนเฉพาะเมทาดาทาจึงไม่ต้องมี
key ของ OpenRouter

โดยค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับเครื่องมือและรูปภาพด้วยการเรียกโมเดลแบบสด
หากไม่ได้กำหนดค่า key ของ OpenRouter คำสั่งจะถอยกลับไปเป็นเอาต์พุตเฉพาะเมทาดาทา
และอธิบายว่าโมเดล `:free` ยังต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (เฉพาะเมทาดาทา; ไม่มีการค้นหา config/secret)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (คำขอแค็ตตาล็อกและ timeout ต่อ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้ probe แบบสด; ผลการสแกนเฉพาะเมทาดาทา
มีไว้เพื่อให้ข้อมูลและจะไม่นำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ซ้ำหรือ id โปรไฟล์คั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent ที่กำหนดค่าไว้; แทนที่ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` กัน stdout ไว้สำหรับ payload JSON diagnostics ของโปรไฟล์การยืนยันตัวตน ผู้ให้บริการ
และ startup จะถูกส่งไปยัง stderr เพื่อให้สคริปต์สามารถ pipe stdout โดยตรง
เข้าสู่เครื่องมือ เช่น `jq`

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

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บไว้ แต่
  `auth.order.<provider>` ที่ระบุไว้อย่างชัดเจนละเว้นโปรไฟล์นั้น ดังนั้น probe จึงรายงานการยกเว้นแทน
  การลองใช้โปรไฟล์นั้น
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่แต่ไม่มีสิทธิ์/ไม่สามารถแก้ไขได้
- `no_model`: มีการยืนยันตัวตนของผู้ให้บริการ แต่ OpenClaw ไม่สามารถแก้ไข
  candidate โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น

## Alias + fallback

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

`models auth add` คือ helper การยืนยันตัวตนแบบโต้ตอบ สามารถเปิด flow การยืนยันตัวตนของผู้ให้บริการ
(OAuth/API key) หรือนำคุณไปสู่การวาง token ด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth list` แสดงรายการโปรไฟล์การยืนยันตัวตนที่บันทึกไว้สำหรับ agent ที่เลือกโดยไม่
พิมพ์ token, API-key หรือ secret material ของ OAuth ใช้ `--provider <id>` เพื่อ
กรองเป็นผู้ให้บริการหนึ่งราย เช่น `openai-codex` และใช้ `--json` สำหรับ scripting

`models auth login` เรียกใช้ flow การยืนยันตัวตนของ plugin ผู้ให้บริการ (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่าติดตั้งผู้ให้บริการใดอยู่
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลการยืนยันตัวตนไปยัง
store ของ agent ที่กำหนดค่าไว้เฉพาะ flag `--agent` ของ parent จะถูกใช้โดย
`add`, `list`, `login`, `setup-token`, `paste-token` และ
`login-github-copilot`

สำหรับโมเดล OpenAI, `--provider openai` ใช้การเข้าสู่ระบบบัญชี ChatGPT/Codex เป็นค่าเริ่มต้น
ใช้ `--method api-key` เฉพาะเมื่อคุณต้องการเพิ่มโปรไฟล์ API-key ของ OpenAI
โดยปกติเป็นตัวสำรองสำหรับขีดจำกัด subscription ของ Codex การสะกดแบบ legacy
`--provider openai-codex` ยังใช้งานได้กับสคริปต์ที่มีอยู่

ตัวอย่าง:

```bash
openclaw models auth login --provider openai --set-default
openclaw models auth login --provider openai --method api-key
openclaw models auth list --provider openai
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยวิธีการยืนยันตัวตนด้วย token
- `setup-token` ต้องใช้ TTY แบบโต้ตอบและเรียกใช้วิธี token-auth ของผู้ให้บริการ
  (ค่าเริ่มต้นเป็นวิธี `setup-token` ของผู้ให้บริการนั้นเมื่อมีการเปิดเผย
  วิธีดังกล่าว)
- `paste-token` รับสตริง token ที่สร้างจากที่อื่นหรือจาก automation
- `paste-token` ต้องใช้ `--provider`, แจ้งให้ป้อนค่า token และเขียน
  ค่านั้นไปยัง id โปรไฟล์เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จัดเก็บเวลาหมดอายุ token แบบสัมบูรณ์จาก
  ระยะเวลาแบบสัมพัทธ์ เช่น `365d` หรือ `12h`
- หมายเหตุ Anthropic: เจ้าหน้าที่ Anthropic บอกเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้และการใช้งาน `claude -p` ได้รับการรับรองสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic `setup-token` / `paste-token` ยังคงพร้อมใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ต้องการใช้ Claude CLI ที่มีอยู่ซ้ำและ `claude -p` เมื่อพร้อมใช้งานมากกว่า

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การ failover โมเดล](/th/concepts/model-failover)
