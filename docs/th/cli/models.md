---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะการยืนยันตัวตนของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่พร้อมใช้งาน และดีบักโปรไฟล์การยืนยันตัวตน
summary: ข้อมูลอ้างอิง CLI สำหรับ `openclaw models` (`status`/`list`/`set`/`scan`, aliases, fallbacks, auth)
title: Models
x-i18n:
    generated_at: "2026-04-26T11:26:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5acf5972251ee7aa22d1f9222f1a497822fb1f25f29f827702f8b37dda8dadf
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

การค้นหาโมเดล การสแกน และการกำหนดค่า (โมเดลเริ่มต้น, fallback, โปรไฟล์การยืนยันตัวตน)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [Models](/th/providers/models)
- แนวคิดการเลือกโมเดล + คำสั่ง slash `/models`: [แนวคิด Models](/th/concepts/models)
- การตั้งค่าการยืนยันตัวตนของผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งทั่วไป

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` จะแสดงค่าเริ่มต้น/fallback ที่ resolve แล้ว พร้อมภาพรวมการยืนยันตัวตน
เมื่อมี snapshot การใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/API key จะรวม
ช่วงเวลาการใช้งานของผู้ให้บริการและ snapshot โควตา
ผู้ให้บริการที่รองรับช่วงเวลาการใช้งานในปัจจุบัน: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai การยืนยันตัวตนสำหรับการใช้งานมาจาก hook เฉพาะผู้ให้บริการ
เมื่อมี; มิฉะนั้น OpenClaw จะ fallback ไปจับคู่
ข้อมูลรับรอง OAuth/API key จากโปรไฟล์การยืนยันตัวตน, env หรือ config
ในผลลัพธ์ `--json`, `auth.providers` คือภาพรวมของผู้ให้บริการที่รับรู้ env/config/store
ส่วน `auth.oauth` คือเฉพาะสถานะของโปรไฟล์ใน auth store
เพิ่ม `--probe` เพื่อรันการ probe การยืนยันตัวตนแบบสดกับแต่ละโปรไฟล์ผู้ให้บริการที่กำหนดค่าไว้
การ probe เป็นคำขอจริง (อาจใช้โทเค็นและชนข้อจำกัดอัตรา)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะโมเดล/การยืนยันตัวตนของเอเจนต์ที่กำหนดค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากตั้งค่าไว้ มิฉะนั้นจะใช้
เอเจนต์เริ่มต้นที่กำหนดค่าไว้
แถว probe อาจมาจากโปรไฟล์การยืนยันตัวตน, ข้อมูลรับรองใน env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รองรับ `provider/model` หรือ alias
- `models list` เป็นแบบอ่านอย่างเดียว: มันจะอ่าน config, โปรไฟล์การยืนยันตัวตน, สถานะของ catalog
  ที่มีอยู่ และแถว catalog ที่ผู้ให้บริการเป็นเจ้าของ แต่จะไม่เขียน
  `models.json` ใหม่
- `models list --all --provider <id>` สามารถรวมแถว static catalog ที่ผู้ให้บริการเป็นเจ้าของ
  จาก manifest ของ Plugin หรือเมทาดาต้า catalog ของผู้ให้บริการที่มากับระบบได้ แม้ว่าคุณ
  จะยังไม่ได้ยืนยันตัวตนกับผู้ให้บริการนั้นก็ตาม แถวเหล่านั้นยังคงแสดงเป็น
  ไม่พร้อมใช้งานจนกว่าจะมีการกำหนดค่าการยืนยันตัวตนที่ตรงกัน
- `models list` จะแยกเมทาดาต้าโมเดลแบบเนทีฟและ runtime caps ออกจากกัน ในผลลัพธ์
  แบบตาราง `Ctx` จะแสดง `contextTokens/contextWindow` เมื่อ effective runtime
  cap ต่างจาก native context window; แถว JSON จะมี `contextTokens`
  เมื่อผู้ให้บริการเปิดเผย cap นั้น
- `models list --provider <id>` กรองตาม provider id เช่น `moonshot` หรือ
  `openai-codex` ไม่รองรับ label ที่แสดงจากตัวเลือกผู้ให้บริการแบบโต้ตอบ เช่น `Moonshot AI`
- Model refs จะถูกแยกโดยแบ่งที่ `/` **ตัวแรก** หาก model ID มี `/` อยู่ด้วย (แบบ OpenRouter) ให้ใส่ provider prefix (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากคุณละ provider ไว้ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นการจับคู่ provider ที่กำหนดค่าไว้แบบไม่ซ้ำสำหรับ model id ที่ตรงกันพอดี และหลังจากนั้นเท่านั้นจึงจะ
  fallback ไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือนการเลิกใช้งาน
  หากผู้ให้บริการนั้นไม่เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยัง provider/model ตัวแรกที่กำหนดค่าไว้แทนการแสดงค่าเริ่มต้นของผู้ให้บริการที่ถูกลบไปแล้ว
- `models status` อาจแสดง `marker(<value>)` ในผลลัพธ์การยืนยันตัวตนสำหรับ placeholder ที่ไม่ใช่ความลับ (เช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการปิดบังเป็นความลับ

### `models scan`

`models scan` จะอ่าน catalog สาธารณะ `:free` ของ OpenRouter และจัดอันดับตัวเลือก
สำหรับใช้เป็น fallback โดยตัว catalog เองเป็นสาธารณะ ดังนั้นการสแกนแบบเมทาดาต้าเท่านั้น
จึงไม่จำเป็นต้องใช้ OpenRouter key

ตามค่าเริ่มต้น OpenClaw จะพยายาม probe ความสามารถด้าน tools และ image ด้วยการเรียกโมเดลแบบสด
หากไม่ได้กำหนดค่า OpenRouter key คำสั่งจะ fallback ไปยัง
ผลลัพธ์แบบเมทาดาต้าเท่านั้น และอธิบายว่าโมเดล `:free` ยังคงต้องใช้ `OPENROUTER_API_KEY` สำหรับ
การ probe และการอนุมาน

ตัวเลือก:

- `--no-probe` (เมทาดาต้าเท่านั้น; ไม่มีการค้นหา config/secrets)
- `--min-params <b>`
- `--max-age-days <days>`
- `--provider <name>`
- `--max-candidates <n>`
- `--timeout <ms>` (หมดเวลาคำขอ catalog และต่อการ probe)
- `--concurrency <n>`
- `--yes`
- `--no-input`
- `--set-default`
- `--set-image`
- `--json`

`--set-default` และ `--set-image` ต้องใช้การ probe แบบสด; ผลลัพธ์การสแกนแบบเมทาดาต้าเท่านั้น
มีไว้เพื่อให้ข้อมูลและจะไม่ถูกนำไปใช้กับ config

### `models status`

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/หายไป, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์การยืนยันตัวตนที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ระบุซ้ำหรือคั่นด้วยจุลภาคได้)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (configured agent id; แทนที่ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

กลุ่มสถานะ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณี detail/reason-code ของ probe ที่ควรคาดหวัง:

- `excluded_by_auth_order`: มีโปรไฟล์ที่เก็บไว้ แต่
  `auth.order.<provider>` แบบ explicit ไม่ได้รวมโปรไฟล์นั้นไว้ ดังนั้น probe จะรายงานการยกเว้นแทน
  การลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่ แต่ไม่สามารถใช้ได้/resolve ไม่ได้
- `no_model`: มีการยืนยันตัวตนของผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve
  candidate โมเดลที่ใช้ probe ได้สำหรับผู้ให้บริการนั้น

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

`models auth add` คือตัวช่วยการยืนยันตัวตนแบบโต้ตอบ มันสามารถเปิด flow การยืนยันตัวตนของผู้ให้บริการ
(OAuth/API key) หรือแนะนำคุณเข้าสู่การวางโทเค็นด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth login` จะรัน flow การยืนยันตัวตนของ Plugin ผู้ให้บริการ (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่ามีผู้ให้บริการใดติดตั้งอยู่บ้าง
ใช้ `openclaw models auth --agent <id> <subcommand>` เพื่อเขียนผลการยืนยันตัวตนไปยัง
store ของเอเจนต์ที่กำหนดค่าไว้โดยเฉพาะ แฟล็ก `--agent` ระดับแม่จะถูกใช้โดย
`add`, `login`, `setup-token`, `paste-token` และ `login-github-copilot`

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่งโทเค็นแบบทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยเมธอดการยืนยันตัวตนด้วยโทเค็น
- `setup-token` ต้องใช้ TTY แบบโต้ตอบ และจะรันเมธอด token-auth ของผู้ให้บริการ
  (โดยค่าเริ่มต้นจะใช้เมธอด `setup-token` ของผู้ให้บริการนั้น เมื่อมีการเปิดเผยเมธอดดังกล่าว)
- `paste-token` รับสตริงโทเค็นที่สร้างจากที่อื่นหรือจากระบบอัตโนมัติ
- `paste-token` ต้องใช้ `--provider`, จะถามค่าของโทเค็น และเขียน
  ลงใน profile id เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จะเก็บเวลาหมดอายุแบบสัมบูรณ์ของโทเค็นจาก
  ระยะเวลาแบบสัมพัทธ์ เช่น `365d` หรือ `12h`
- หมายเหตุสำหรับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นวิธีที่ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- `setup-token` / `paste-token` ของ Anthropic ยังคงใช้งานได้ในฐานะเส้นทางโทเค็นที่รองรับของ OpenClaw แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` เมื่อมีให้ใช้

## ที่เกี่ยวข้อง

- [ข้อมูลอ้างอิง CLI](/th/cli)
- [การเลือกโมเดล](/th/concepts/model-providers)
- [Model failover](/th/concepts/model-failover)
