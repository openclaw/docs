---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการยืนยันตัวตนของ provider
    - คุณต้องการสแกนโมเดล/provider ที่พร้อมใช้งานและดีบักโปรไฟล์การยืนยันตัวตน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (`status`/`list`/`set`/`scan`, aliases, fallbacks, auth)
title: โมเดล
x-i18n:
    generated_at: "2026-04-25T13:44:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: 2c8040159e23789221357dd60232012759ee540ebfd3e5d192a0a09419d40c9a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

การค้นหาโมเดล การสแกน และการกำหนดค่า (โมเดลเริ่มต้น fallbacks และโปรไฟล์การยืนยันตัวตน)

ที่เกี่ยวข้อง:

- Providers + โมเดล: [Models](/th/providers/models)
- แนวคิดการเลือกโมเดล + slash command `/models`: [แนวคิด Models](/th/concepts/models)
- การตั้งค่าการยืนยันตัวตนของ provider: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งที่ใช้บ่อย

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` จะแสดงค่าเริ่มต้น/fallbacks ที่ถูก resolve แล้ว พร้อมภาพรวมการยืนยันตัวตน
เมื่อมี snapshots การใช้งานของ provider ส่วนสถานะ OAuth/API-key จะรวม
หน้าต่างการใช้งานของ provider และ snapshots ของโควตา
provider ที่รองรับหน้าต่างการใช้งานในปัจจุบัน ได้แก่ Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai ข้อมูลการยืนยันตัวตนสำหรับการใช้งานมาจาก hooks
เฉพาะของ provider เมื่อมีให้ใช้; มิฉะนั้น OpenClaw จะ fallback ไปใช้
credentials แบบ OAuth/API-key ที่ตรงกันจากโปรไฟล์การยืนยันตัวตน env หรือ config
ในผลลัพธ์ `--json`, `auth.providers` คือภาพรวมของ provider
ที่รับรู้ env/config/store ส่วน `auth.oauth` คือสถานะสุขภาพของโปรไฟล์ใน auth-store เท่านั้น
เพิ่ม `--probe` เพื่อรัน auth probes แบบสดกับแต่ละโปรไฟล์ provider ที่กำหนดค่าไว้
probes เป็นคำขอจริง (อาจใช้โทเค็นและชนกับ rate limits)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การยืนยันตัวตนของเอเจนต์ที่กำหนดค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ มิฉะนั้นจะใช้
เอเจนต์เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน credentials ใน env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รองรับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: มันอ่าน config โปรไฟล์การยืนยันตัวตน catalog
  state ที่มีอยู่ และแถว catalog ที่ provider เป็นเจ้าของ แต่จะไม่เขียนทับ
  `models.json`
- `models list --all` จะรวมแถว static catalog ที่มาพร้อมระบบและ provider เป็นเจ้าของด้วย แม้
  คุณจะยังไม่ได้ยืนยันตัวตนกับ provider นั้นก็ตาม แถวเหล่านั้นยังคงแสดง
  ว่าไม่พร้อมใช้งานจนกว่าจะมีการกำหนดค่าการยืนยันตัวตนที่ตรงกัน
- `models list` จะแยกข้อมูลเมตาโมเดลแบบเนทีฟออกจาก runtime caps ที่มีผลจริง ใน
  ผลลัพธ์แบบตาราง `Ctx` จะแสดง `contextTokens/contextWindow` เมื่อ runtime cap ที่มีผลจริงต่างจาก
  native context window; แถว JSON จะรวม `contextTokens`
  เมื่อ provider เปิดเผย cap นั้น
- `models list --provider <id>` ใช้กรองตาม id ของ provider เช่น `moonshot` หรือ
  `openai-codex` โดยไม่รองรับป้ายชื่อที่ใช้แสดงผลจากตัวเลือก provider แบบอินเทอร์แอคทีฟ
  เช่น `Moonshot AI`
- model refs จะถูกแยกโดย split ที่ `/` **ตัวแรก** หาก model ID มี `/` อยู่ด้วย (แบบ OpenRouter) ให้ใส่ provider prefix (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณไม่ระบุ provider, OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  จึงพยายามจับคู่ exact model id กับ configured-provider ที่ไม่ซ้ำกัน และสุดท้ายเท่านั้นจึงจะ fallback ไปยัง configured default provider พร้อมคำเตือนเลิกใช้
  หาก provider นั้นไม่ได้เปิดเผย configured default model นั้นอีกต่อไป OpenClaw
  จะ fallback ไปยัง provider/model ตัวแรกที่กำหนดค่าไว้ แทนการแสดงค่าเริ่มต้นของ provider ที่ล้าสมัยและถูกลบออก
- `models status` อาจแสดง `marker(<value>)` ในผลลัพธ์การยืนยันตัวตนสำหรับ placeholders ที่ไม่ใช่ความลับ (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการปิดบังเป็นความลับ

### `models scan`

`models scan` จะอ่าน public catalog `:free` ของ OpenRouter และจัดอันดับตัวเลือกสำหรับ
ใช้เป็น fallback ตัว catalog เองเป็นสาธารณะ ดังนั้นการสแกนแบบ metadata-only จึงไม่ต้องใช้ OpenRouter key

ตามค่าเริ่มต้น OpenClaw จะพยายาม probe ความสามารถด้าน tool และ image ด้วยการเรียกโมเดลจริง
หากไม่มีการกำหนดค่า OpenRouter key คำสั่งจะ fallback ไปยังผลลัพธ์แบบ metadata-only และอธิบายว่า
โมเดล `:free` ยังคงต้องใช้ `OPENROUTER_API_KEY` สำหรับ probes และการอนุมาน

ตัวเลือก:

- `--no-probe` (metadata only; ไม่ค้นหา config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (timeout สำหรับคำขอ catalog และต่อ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้ live probes; ผลลัพธ์การสแกนแบบ metadata-only
มีไว้เพื่อให้ข้อมูลเท่านั้น และจะไม่ถูกนำไปใช้กับ config

### `models status`

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (ออกด้วย 1=หมดอายุ/ไม่มี, 2=ใกล้หมดอายุ)
- `--probe` (live probe ของโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe provider เดียว)
- `--probe-profile <id>` (ระบุซ้ำได้ หรือคั่นด้วย comma)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (configured agent id; override `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

กลุ่มสถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณีของรายละเอียด probe/reason-code ที่ควรพบได้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่เก็บไว้ แต่
  `auth.order.<provider>` แบบ explicit ไม่ได้รวมมันไว้ ดังนั้น probe จึงรายงานการยกเว้น แทนที่จะ
  พยายามใช้มัน
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่ แต่ไม่เข้าเกณฑ์/ไม่สามารถ resolve ได้
- `no_model`: มีการยืนยันตัวตนของ provider แต่ OpenClaw ไม่สามารถ resolve
  ตัวเลือกโมเดลที่ใช้ probe ได้สำหรับ provider นั้น

## Aliases + fallbacks

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

`models auth add` คือผู้ช่วยการยืนยันตัวตนแบบอินเทอร์แอคทีฟ มันสามารถเริ่มโฟลว์การยืนยันตัวตนของ provider
(OAuth/API key) หรือแนะนำให้คุณวางโทเค็นด้วยตนเอง ขึ้นอยู่กับ
provider ที่คุณเลือก

`models auth login` จะรันโฟลว์การยืนยันตัวตนของ provider plugin (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่ามี providers ใดติดตั้งอยู่บ้าง

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่งโทเค็นแบบทั่วไปสำหรับ providers
  ที่เปิดเผยวิธีการยืนยันตัวตนแบบ token
- `setup-token` ต้องใช้ TTY แบบอินเทอร์แอคทีฟ และรันวิธี token-auth ของ provider
  (โดยค่าเริ่มต้นจะใช้วิธี `setup-token` ของ provider นั้นเมื่อมีการเปิดเผยไว้)
- `paste-token` รับสตริงโทเค็นที่สร้างจากที่อื่นหรือจากระบบอัตโนมัติ
- `paste-token` ต้องระบุ `--provider`, จะพรอมต์ขอค่าโทเค็น และเขียน
  ไปยัง profile id เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จะเก็บวันหมดอายุของโทเค็นแบบ absolute จาก
  ระยะเวลาแบบ relative เช่น `365d` หรือ `12h`
- หมายเหตุเกี่ยวกับ Anthropic: ทีมงาน Anthropic แจ้งกับเราว่าการใช้งาน Claude CLI แบบ OpenClaw กลับมาได้รับอนุญาตแล้ว ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้งาน `claude -p` เป็นแนวทางที่ได้รับอนุมัติสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- Anthropic `setup-token` / `paste-token` ยังคงพร้อมใช้งานในฐานะเส้นทางโทเค็นที่รองรับของ OpenClaw แต่ตอนนี้ OpenClaw ให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [Model failover](/th/concepts/model-failover)
