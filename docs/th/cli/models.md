---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการตรวจสอบสิทธิ์ของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งาน และดีบักโปรไฟล์การยืนยันตัวตน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, นามแฝง, กลไกสำรอง, การรับรองความถูกต้อง)
title: โมเดล
x-i18n:
    generated_at: "2026-05-01T10:14:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: 538d3e4808329737fdc044dc6e14e5c7c78052e75d8a8b3b257b1ebd821c84d1
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น ตัวสำรอง โปรไฟล์การยืนยันตัวตน)

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

`openclaw models status` แสดงค่าเริ่มต้น/ตัวสำรองที่ resolve แล้ว พร้อมภาพรวมการยืนยันตัวตน
เมื่อมีสแนปช็อตการใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/คีย์ API จะรวม
หน้าต่างการใช้งานของผู้ให้บริการและสแนปช็อตโควตา
ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai การยืนยันตัวตนสำหรับการใช้งานมาจาก hook เฉพาะผู้ให้บริการ
เมื่อมีให้ใช้งาน ไม่เช่นนั้น OpenClaw จะ fallback ไปยังข้อมูลประจำตัว OAuth/คีย์ API
ที่ตรงกันจากโปรไฟล์การยืนยันตัวตน env หรือ config
ในเอาต์พุต `--json` นั้น `auth.providers` คือภาพรวมผู้ให้บริการที่รับรู้ env/config/store
ส่วน `auth.oauth` คือสถานะสุขภาพของโปรไฟล์ auth-store เท่านั้น
เพิ่ม `--probe` เพื่อเรียกใช้ probe การยืนยันตัวตนแบบ live กับแต่ละโปรไฟล์ผู้ให้บริการที่กำหนดค่าไว้
Probe เป็นคำขอจริง (อาจใช้ token และทำให้เกิด rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การยืนยันตัวตนของ agent ที่กำหนดค่าไว้ เมื่อละไว้
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ ไม่เช่นนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน ข้อมูลประจำตัว env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: จะอ่าน config, โปรไฟล์การยืนยันตัวตน, สถานะ catalog
  ที่มีอยู่ และแถว catalog ที่ผู้ให้บริการเป็นเจ้าของ แต่จะไม่เขียนทับ
  `models.json`
- คอลัมน์ `Auth` เป็นระดับผู้ให้บริการและอ่านอย่างเดียว ค่านี้คำนวณจาก metadata
  โปรไฟล์การยืนยันตัวตนในเครื่อง, marker ของ env, คีย์ผู้ให้บริการที่กำหนดค่าไว้, marker
  ของผู้ให้บริการในเครื่อง, marker ของ AWS Bedrock env/profile และ metadata synthetic-auth ของ Plugin;
  ค่านี้จะไม่โหลด runtime ของผู้ให้บริการ, อ่าน secret จาก keychain, เรียก API
  ของผู้ให้บริการ หรือพิสูจน์ความพร้อมในการรันจริงแบบรายโมเดลอย่างแม่นยำ
- `models list --all --provider <id>` อาจรวมแถว catalog แบบ static ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ Plugin หรือ metadata catalog ของผู้ให้บริการที่ bundle มา แม้คุณ
  ยังไม่ได้ยืนยันตัวตนกับผู้ให้บริการนั้นก็ตาม แถวเหล่านั้นจะยังแสดงเป็น
  ไม่พร้อมใช้งานจนกว่าจะกำหนดค่าการยืนยันตัวตนที่ตรงกัน
- `models list` ทำให้ control plane ยังตอบสนองได้ในขณะที่การค้นพบ catalog
  ของผู้ให้บริการทำงานช้า มุมมองเริ่มต้นและมุมมองที่กำหนดค่าไว้จะ fallback ไปยังแถวโมเดลที่กำหนดค่าไว้หรือ
  สร้างแบบ synthetic หลังรอช่วงสั้น ๆ และปล่อยให้การค้นพบทำงานต่อใน
  เบื้องหลัง ใช้ `--all` เมื่อคุณต้องการ catalog ที่ค้นพบทั้งหมดแบบครบถ้วนจริง
  และยินดีรอการค้นพบของผู้ให้บริการ
- `models list --all` แบบกว้างจะ merge แถว catalog จาก manifest ทับแถว registry
  โดยไม่โหลด hook เสริม runtime ของผู้ให้บริการ fast path ของ manifest ที่กรองตามผู้ให้บริการ
  ใช้เฉพาะผู้ให้บริการที่ทำเครื่องหมายเป็น `static`; ผู้ให้บริการที่ทำเครื่องหมายเป็น `refreshable`
  จะยังอิง registry/cache และเพิ่มแถว manifest เป็นส่วนเสริม ส่วน
  ผู้ให้บริการที่ทำเครื่องหมายเป็น `runtime` จะยังอยู่กับการค้นพบผ่าน registry/runtime
- `models list` แยก metadata โมเดลดั้งเดิมออกจาก runtime cap อย่างชัดเจน ในเอาต์พุตตาราง
  `Ctx` แสดง `contextTokens/contextWindow` เมื่อ runtime cap ที่มีผล
  แตกต่างจาก native context window; แถว JSON จะรวม `contextTokens`
  เมื่อผู้ให้บริการเปิดเผย cap นั้น
- `models list --provider <id>` กรองตาม id ของผู้ให้บริการ เช่น `moonshot` หรือ
  `openai-codex` ค่านี้ไม่รับป้ายแสดงผลจากตัวเลือกผู้ให้บริการแบบโต้ตอบ
  เช่น `Moonshot AI`
- ref ของโมเดลถูก parse โดยแยกที่ `/` ตัว **แรก** หาก ID โมเดลมี `/` (สไตล์ OpenRouter) ให้รวม prefix ผู้ให้บริการด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละผู้ให้บริการ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นการจับคู่ผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ model id นั้นตรง ๆ และหลังจากนั้นเท่านั้น
  จึง fallback ไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยังผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนการแสดง
  ค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปและล้าสมัย
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุตการยืนยันตัวตนสำหรับ placeholder ที่ไม่ใช่ secret (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็น secret

### สแกนโมเดล

`models scan` อ่าน catalog `:free` สาธารณะของ OpenRouter และจัดอันดับ candidate สำหรับ
ใช้เป็น fallback ตัว catalog เองเป็นสาธารณะ ดังนั้นการสแกนแบบ metadata-only จึงไม่จำเป็นต้องมี
คีย์ OpenRouter

โดยค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับ tool และ image ด้วยการเรียกโมเดลแบบ live
หากไม่ได้กำหนดค่าคีย์ OpenRouter คำสั่งจะ fallback ไปยังเอาต์พุตแบบ metadata-only
และอธิบายว่าโมเดล `:free` ยังต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (metadata เท่านั้น; ไม่ค้นหา config/secret)
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

`--set-default` และ `--set-image` ต้องใช้ probe แบบ live; ผลลัพธ์การสแกนแบบ metadata-only
เป็นข้อมูลประกอบและจะไม่ถูกนำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบ live ของโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ทำซ้ำหรือใช้ id โปรไฟล์แบบคั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id agent ที่กำหนดค่าไว้; override `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` สงวน stdout ไว้สำหรับ payload JSON diagnostics ของโปรไฟล์การยืนยันตัวตน, ผู้ให้บริการ
และการเริ่มต้นจะถูกส่งไปที่ stderr เพื่อให้สคริปต์สามารถ pipe stdout ตรง
เข้าเครื่องมืออย่าง `jq` ได้

bucket สถานะ Probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณีรายละเอียด/รหัสเหตุผลของ Probe ที่คาดได้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บไว้ แต่ `auth.order.<provider>` แบบ explicit
  ละไว้ ดังนั้น probe จึงรายงานการยกเว้นแทนที่จะลองใช้โปรไฟล์นั้น
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่แต่ไม่เข้าเกณฑ์/resolve ไม่ได้
- `no_model`: มีการยืนยันตัวตนของผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve candidate
  โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์การยืนยันตัวตน

```bash
openclaw models auth add
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` เป็นตัวช่วยยืนยันตัวตนแบบโต้ตอบ สามารถเปิด flow การยืนยันตัวตนของผู้ให้บริการ
(OAuth/คีย์ API) หรือนำทางคุณไปสู่การวาง token ด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth login` เรียกใช้ flow การยืนยันตัวตนของ Plugin ผู้ให้บริการ (OAuth/คีย์ API) ใช้
`openclaw plugins list` เพื่อดูว่ามีผู้ให้บริการใดติดตั้งอยู่
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลการยืนยันตัวตนไปยัง
store ของ agent ที่กำหนดค่าไว้โดยเฉพาะ flag parent `--agent` จะถูกใช้งานโดย
`add`, `login`, `setup-token`, `paste-token` และ `login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยวิธีการยืนยันตัวตนด้วย token
- `setup-token` ต้องใช้ TTY แบบโต้ตอบและเรียกใช้วิธี token-auth ของผู้ให้บริการ
  (ค่าเริ่มต้นเป็นวิธี `setup-token` ของผู้ให้บริการนั้นเมื่อเปิดเผย
  ไว้)
- `paste-token` รับสตริง token ที่สร้างจากที่อื่นหรือจาก automation
- `paste-token` ต้องใช้ `--provider`, จะแจ้งให้ป้อนค่า token และเขียน
  ลงใน id โปรไฟล์เริ่มต้น `<provider>:manual` เว้นแต่คุณส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จัดเก็บเวลาหมดอายุ token แบบ absolute จาก
  ระยะเวลาแบบ relative เช่น `365d` หรือ `12h`
- หมายเหตุเกี่ยวกับ Anthropic: พนักงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการ reuse Claude CLI และการใช้งาน `claude -p` ได้รับการอนุมัติสำหรับ integration นี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic `setup-token` / `paste-token` ยังคงพร้อมใช้งานในฐานะเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw ชอบการ reuse Claude CLI และ `claude -p` เมื่อมีให้ใช้งาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover)
