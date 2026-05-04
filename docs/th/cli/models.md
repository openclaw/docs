---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการยืนยันตัวตนของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งาน และดีบักโปรไฟล์การยืนยันตัวตน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, นามแฝง, กลไกสำรอง, การยืนยันตัวตน)
title: โมเดล
x-i18n:
    generated_at: "2026-05-04T18:23:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: dc7842f02e29aa0ac2ae88f3d42bba71f1890a58ab22d818dbee0585bc562fea
    source_path: cli/models.md
    workflow: 16
---

# `openclaw models`

การค้นหา การสแกน และการกำหนดค่าโมเดล (โมเดลเริ่มต้น ตัวสำรอง โปรไฟล์การรับรองความถูกต้อง)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [โมเดล](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิดเกี่ยวกับโมเดล](/th/concepts/models)
- การตั้งค่าการรับรองความถูกต้องของผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` แสดงค่าเริ่มต้น/ตัวสำรองที่ resolve แล้ว พร้อมภาพรวมการรับรองความถูกต้อง
เมื่อมีสแนปช็อตการใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/คีย์ API จะรวม
หน้าต่างการใช้งานของผู้ให้บริการและสแนปช็อตโควตาไว้ด้วย
ผู้ให้บริการหน้าต่างการใช้งานปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai การรับรองความถูกต้องของการใช้งานมาจาก hook เฉพาะผู้ให้บริการ
เมื่อมีให้ใช้งาน มิฉะนั้น OpenClaw จะ fallback ไปใช้ข้อมูลรับรอง OAuth/คีย์ API ที่ตรงกัน
จากโปรไฟล์การรับรองความถูกต้อง env หรือ config
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวมผู้ให้บริการที่รับรู้ env/config/store
ขณะที่ `auth.oauth` คือสถานะความสมบูรณ์ของโปรไฟล์ใน auth-store เท่านั้น
เพิ่ม `--probe` เพื่อเรียกใช้ probe การรับรองความถูกต้องแบบ live กับโปรไฟล์ผู้ให้บริการที่กำหนดค่าไว้แต่ละรายการ
Probe คือคำขอจริง (อาจใช้ token และทำให้เกิด rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การรับรองความถูกต้องของ agent ที่กำหนดค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` ถ้ามีการตั้งค่าไว้ มิฉะนั้นจะใช้
agent เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์การรับรองความถูกต้อง ข้อมูลรับรอง env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: อ่าน config, โปรไฟล์การรับรองความถูกต้อง, สถานะแค็ตตาล็อกที่มีอยู่
  และแถวแค็ตตาล็อกที่ผู้ให้บริการเป็นเจ้าของ แต่จะไม่เขียน
  `models.json` ใหม่
- คอลัมน์ `Auth` เป็นระดับผู้ให้บริการและอ่านอย่างเดียว ค่านี้คำนวณจาก
  metadata โปรไฟล์การรับรองความถูกต้องภายในเครื่อง, marker ของ env, คีย์ผู้ให้บริการที่กำหนดค่าไว้, marker ของ local-provider,
  marker ของ env/profile ของ AWS Bedrock และ metadata synthetic-auth ของ Plugin;
  ค่านี้จะไม่โหลด runtime ของผู้ให้บริการ อ่านความลับจาก keychain เรียก API ของผู้ให้บริการ
  หรือพิสูจน์ความพร้อมในการเรียกใช้งานแบบรายโมเดลอย่างแม่นยำ
- `models list --all --provider <id>` อาจรวมแถวแค็ตตาล็อก static ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ Plugin หรือ metadata แค็ตตาล็อกผู้ให้บริการที่ bundle มา แม้ว่าคุณ
  ยังไม่ได้รับรองความถูกต้องกับผู้ให้บริการนั้นก็ตาม แถวเหล่านั้นยังคงแสดงเป็น
  ใช้งานไม่ได้จนกว่าจะกำหนดค่าการรับรองความถูกต้องที่ตรงกัน
- `models list` ทำให้ control plane ตอบสนองได้ดีขณะที่การค้นพบแค็ตตาล็อกของผู้ให้บริการ
  ทำงานช้า มุมมองเริ่มต้นและมุมมองที่กำหนดค่าไว้จะ fallback ไปใช้แถวโมเดลที่กำหนดค่าไว้หรือ
  แถวโมเดลสังเคราะห์หลังจากรอเป็นเวลาสั้น ๆ และปล่อยให้การค้นพบทำงานต่อจนเสร็จใน
  เบื้องหลัง ใช้ `--all` เมื่อคุณต้องการแค็ตตาล็อกที่ค้นพบแบบเต็มที่แม่นยำ
  และยินดีรอการค้นพบจากผู้ให้บริการ
- `models list --all` แบบกว้างจะผสานแถวแค็ตตาล็อกจาก manifest ทับแถวจาก registry
  โดยไม่โหลด hook เสริม runtime ของผู้ให้บริการ fast path ของ manifest ที่กรองตามผู้ให้บริการ
  ใช้เฉพาะผู้ให้บริการที่ถูกทำเครื่องหมายเป็น `static`; ผู้ให้บริการที่ถูกทำเครื่องหมายเป็น `refreshable`
  จะยังคงอิง registry/cache และเพิ่มแถว manifest เป็นส่วนเสริม ขณะที่
  ผู้ให้บริการที่ถูกทำเครื่องหมายเป็น `runtime` จะยังคงใช้การค้นพบผ่าน registry/runtime
- `models list` แยก metadata โมเดลดั้งเดิมออกจากขีดจำกัด runtime อย่างชัดเจน ในเอาต์พุตตาราง
  `Ctx` จะแสดง `contextTokens/contextWindow` เมื่อขีดจำกัด runtime ที่มีผล
  แตกต่างจาก context window ดั้งเดิม; แถว JSON จะรวม `contextTokens`
  เมื่อผู้ให้บริการเปิดเผยขีดจำกัดนั้น
- `models list --provider <id>` กรองตาม id ของผู้ให้บริการ เช่น `moonshot` หรือ
  `openai-codex` ไม่รับ label ที่แสดงจากตัวเลือกผู้ให้บริการแบบโต้ตอบ
  เช่น `Moonshot AI`
- refs ของโมเดลถูก parse โดยแยกที่ `/` **ตัวแรก** หาก ID โมเดลมี `/` (แบบ OpenRouter) ให้ใส่ prefix ผู้ให้บริการด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละผู้ให้บริการไว้ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นรายการที่ตรงกับผู้ให้บริการที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ model id ที่ตรงกันนั้น และหลังจากนั้นเท่านั้น
  จึง fallback ไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือน deprecation
  หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยังผู้ให้บริการ/โมเดลที่กำหนดค่าไว้รายการแรกแทนที่จะแสดง
  ค่าเริ่มต้นของผู้ให้บริการที่ถูกลบซึ่งค้างอยู่
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุตการรับรองความถูกต้องสำหรับ placeholder ที่ไม่ใช่ความลับ (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการ mask เป็นความลับ

### การสแกนโมเดล

`models scan` อ่านแค็ตตาล็อก `:free` สาธารณะของ OpenRouter และจัดอันดับ candidate สำหรับ
การใช้เป็น fallback ตัวแค็ตตาล็อกเป็นสาธารณะ ดังนั้นการสแกนแบบ metadata-only จึงไม่ต้องใช้
คีย์ OpenRouter

ตามค่าเริ่มต้น OpenClaw จะพยายาม probe การรองรับเครื่องมือและรูปภาพด้วยการเรียกโมเดลแบบ live
หากไม่ได้กำหนดค่าคีย์ OpenRouter คำสั่งจะ fallback เป็นเอาต์พุตแบบ metadata-only
และอธิบายว่าโมเดล `:free` ยังคงต้องใช้ `OPENROUTER_API_KEY` สำหรับ
probe และ inference

ตัวเลือก:

- `--no-probe` (เฉพาะ metadata; ไม่ค้นหา config/ความลับ)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout ของคำขอแค็ตตาล็อกและแต่ละ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้ probe แบบ live; ผลลัพธ์การสแกนแบบ metadata-only
มีไว้เพื่อให้ข้อมูลและจะไม่นำไปใช้กับ config

### สถานะโมเดล

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ขาดหาย, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบ live ของโปรไฟล์การรับรองความถูกต้องที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ระบุซ้ำหรือใช้ id โปรไฟล์คั่นด้วยจุลภาค)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (id ของ agent ที่กำหนดค่าไว้; แทนที่ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

`--json` สงวน stdout ไว้สำหรับ payload JSON การวินิจฉัยโปรไฟล์การรับรองความถูกต้อง ผู้ให้บริการ
และการเริ่มต้นระบบจะถูกส่งไปยัง stderr เพื่อให้สคริปต์สามารถ pipe stdout โดยตรง
เข้าเครื่องมือเช่น `jq`

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

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บอยู่ แต่ `auth.order.<provider>` แบบ explicit
  ละโปรไฟล์นั้นไว้ ดังนั้น probe จึงรายงานการยกเว้นแทนที่จะ
  ลองใช้โปรไฟล์นั้น
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่แต่ไม่มีสิทธิ์ใช้/resolve ไม่ได้
- `no_model`: มีการรับรองความถูกต้องของผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve
  candidate โมเดลที่ probe ได้สำหรับผู้ให้บริการนั้น

## Alias + fallback

```bash
openclaw models aliases list
openclaw models fallbacks list
```

## โปรไฟล์การรับรองความถูกต้อง

```bash
openclaw models auth add
openclaw models auth list [--provider <id>] [--json]
openclaw models auth login --provider <id>
openclaw models auth setup-token --provider <id>
openclaw models auth paste-token
```

`models auth add` คือ helper การรับรองความถูกต้องแบบโต้ตอบ สามารถเริ่ม flow การรับรองความถูกต้องของผู้ให้บริการ
(OAuth/คีย์ API) หรือแนะนำให้คุณ paste token ด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth list` แสดงรายการโปรไฟล์การรับรองความถูกต้องที่บันทึกไว้สำหรับ agent ที่เลือกโดยไม่
พิมพ์ token, คีย์ API หรือข้อมูลลับ OAuth ใช้ `--provider <id>` เพื่อ
กรองให้เหลือผู้ให้บริการเดียว เช่น `openai-codex` และใช้ `--json` สำหรับสคริปต์

`models auth login` เรียกใช้ flow การรับรองความถูกต้องของ Plugin ผู้ให้บริการ (OAuth/คีย์ API) ใช้
`openclaw plugins list` เพื่อดูว่ามีผู้ให้บริการใดติดตั้งอยู่
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลลัพธ์การรับรองความถูกต้องไปยัง
store ของ agent ที่กำหนดค่าไว้เฉพาะ flag `--agent` ของ parent จะถูกนำไปใช้โดย
`add`, `list`, `login`, `setup-token`, `paste-token` และ
`login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
openclaw models auth list --provider openai-codex
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่ง token ทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยวิธีรับรองความถูกต้องด้วย token
- `setup-token` ต้องใช้ TTY แบบโต้ตอบและเรียกใช้วิธี token-auth ของผู้ให้บริการ
  (ค่าเริ่มต้นคือวิธี `setup-token` ของผู้ให้บริการนั้นเมื่อมีการเปิดเผย
  ไว้)
- `paste-token` รับสตริง token ที่สร้างจากที่อื่นหรือจาก automation
- `paste-token` ต้องใช้ `--provider`, prompt ให้กรอกค่า token และเขียน
  ไปยัง id โปรไฟล์เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จัดเก็บเวลาหมดอายุ token แบบสัมบูรณ์จาก
  ระยะเวลาแบบสัมพัทธ์ เช่น `365d` หรือ `12h`
- หมายเหตุ Anthropic: เจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic `setup-token` / `paste-token` ยังคงมีให้ใช้งานเป็นเส้นทาง token ของ OpenClaw ที่รองรับ แต่ตอนนี้ OpenClaw จะชอบการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้งาน

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [การ failover ของโมเดล](/th/concepts/model-failover)
