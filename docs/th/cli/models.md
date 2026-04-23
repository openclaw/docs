---
read_when:
    - คุณต้องการเปลี่ยนโมเดลเริ่มต้นหรือดูสถานะ auth ของผู้ให้บริการ
    - คุณต้องการสแกนโมเดล/ผู้ให้บริการที่ใช้งานได้และแก้ไขข้อบกพร่องของโปรไฟล์ auth
summary: เอกสารอ้างอิง CLI สำหรับ `openclaw models` (status/list/set/scan, ชื่อแทน, fallback, auth)
title: models
x-i18n:
    generated_at: "2026-04-23T10:16:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: d4ba72ca8acb7cc31796c119fce3816e6a919eb28a4ed4b03664d3b222498f5a
    source_path: cli/models.md
    workflow: 15
---

# `openclaw models`

การค้นหาโมเดล การสแกน และการกำหนดค่า (โมเดลเริ่มต้น, fallback, โปรไฟล์ auth)

ที่เกี่ยวข้อง:

- ผู้ให้บริการ + โมเดล: [Models](/th/providers/models)
- แนวคิดการเลือกโมเดล + slash command `/models`: [แนวคิดเรื่อง Models](/th/concepts/models)
- การตั้งค่า auth ของผู้ให้บริการ: [เริ่มต้นใช้งาน](/th/start/getting-started)

## คำสั่งที่ใช้บ่อย

```bash
openclaw models status
openclaw models list
openclaw models set <model-or-alias>
openclaw models scan
```

`openclaw models status` จะแสดงค่าเริ่มต้น/fallback ที่ resolve แล้ว พร้อมภาพรวม auth
เมื่อมีสแนปช็อตการใช้งานของผู้ให้บริการ ส่วนสถานะ OAuth/API key จะรวม
หน้าต่างการใช้งานของผู้ให้บริการและสแนปช็อตโควตาไว้ด้วย
ผู้ให้บริการที่รองรับหน้าต่างการใช้งานในปัจจุบันคือ: Anthropic, GitHub Copilot, Gemini CLI, OpenAI
Codex, MiniMax, Xiaomi และ z.ai โดยข้อมูล auth สำหรับการใช้งานมาจาก hook
เฉพาะของผู้ให้บริการเมื่อมี; มิฉะนั้น OpenClaw จะ fallback ไปจับคู่ข้อมูลรับรอง OAuth/API key
จากโปรไฟล์ auth, env หรือคอนฟิก
ในเอาต์พุต `--json`, `auth.providers` คือภาพรวมของผู้ให้บริการที่รับรู้ env/config/store
ส่วน `auth.oauth` คือสถานะสุขภาพของโปรไฟล์ใน auth store เท่านั้น
เพิ่ม `--probe` เพื่อรันการ probe auth แบบสดกับแต่ละโปรไฟล์ผู้ให้บริการที่กำหนดค่าไว้
การ probe เป็นคำขอจริง (อาจใช้โทเค็นและทำให้ติด rate limit)
ใช้ `--agent <id>` เพื่อตรวจสอบสถานะ model/auth ของเอเจนต์ที่กำหนดค่าไว้ เมื่อไม่ระบุ
คำสั่งจะใช้ `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR` หากมีการตั้งค่าไว้ มิฉะนั้นจะใช้
เอเจนต์เริ่มต้นที่กำหนดค่าไว้
แถวของ probe อาจมาจากโปรไฟล์ auth, ข้อมูลรับรองจาก env หรือ `models.json`

หมายเหตุ:

- `models set <model-or-alias>` รองรับ `provider/model` หรือ alias
- `models list --all` จะรวมแถวแค็ตตาล็อกคงที่ที่มากับผู้ให้บริการ แม้ว่า
  คุณจะยังไม่ได้ยืนยันตัวตนกับผู้ให้บริการนั้นก็ตาม แถวเหล่านั้นยังคงแสดง
  เป็น unavailable จนกว่าจะมีการกำหนดค่า auth ที่ตรงกัน
- `models list --provider <id>` กรองตามรหัสผู้ให้บริการ เช่น `moonshot` หรือ
  `openai-codex` โดยไม่รองรับป้ายชื่อที่ใช้แสดงจากตัวเลือกผู้ให้บริการแบบโต้ตอบ
  เช่น `Moonshot AI`
- การแยกวิเคราะห์ model ref จะตัดที่ `/` **ตัวแรก** หาก model ID มี `/` อยู่ด้วย (แบบ OpenRouter) ให้ใส่คำนำหน้าผู้ให้บริการด้วย (ตัวอย่าง: `openrouter/moonshotai/kimi-k2`)
- หากไม่ระบุผู้ให้บริการ OpenClaw จะ resolve อินพุตเป็น alias ก่อน จากนั้น
  เป็นรายการที่ตรงกันแบบไม่ซ้ำในผู้ให้บริการที่กำหนดค่าสำหรับ model id นั้นพอดี และหลังจากนั้นจึงค่อย fallback ไปยังผู้ให้บริการเริ่มต้นที่กำหนดค่าไว้พร้อมคำเตือนการเลิกใช้
  หากผู้ให้บริการนั้นไม่ได้เปิดเผยโมเดลเริ่มต้นที่กำหนดค่าไว้อีกต่อไป OpenClaw
  จะ fallback ไปยังผู้ให้บริการ/โมเดลรายการแรกที่กำหนดค่าไว้ แทนที่จะแสดง
  ค่าเริ่มต้นเก่าของผู้ให้บริการที่ถูกลบออกไปแล้ว
- `models status` อาจแสดง `marker(<value>)` ในเอาต์พุต auth สำหรับ placeholder ที่ไม่ใช่ความลับ (ตัวอย่างเช่น `OPENAI_API_KEY`, `secretref-managed`, `minimax-oauth`, `oauth:chutes`, `ollama-local`) แทนการปกปิดเป็นความลับ

### `models status`

ตัวเลือก:

- `--json`
- `--plain`
- `--check` (exit 1=หมดอายุ/ไม่มี, 2=ใกล้หมดอายุ)
- `--probe` (probe แบบสดของโปรไฟล์ auth ที่กำหนดค่าไว้)
- `--probe-provider <name>` (probe ผู้ให้บริการหนึ่งราย)
- `--probe-profile <id>` (ระบุซ้ำหรือคั่นด้วยจุลภาคหลาย profile id)
- `--probe-timeout <ms>`
- `--probe-concurrency <n>`
- `--probe-max-tokens <n>`
- `--agent <id>` (รหัสเอเจนต์ที่กำหนดค่าไว้; ใช้แทน `OPENCLAW_AGENT_DIR`/`PI_CODING_AGENT_DIR`)

กลุ่มสถานะของ probe:

- `ok`
- `auth`
- `rate_limit`
- `billing`
- `timeout`
- `format`
- `unknown`
- `no_model`

กรณีรายละเอียด/รหัสเหตุผลของ probe ที่ควรพบได้:

- `excluded_by_auth_order`: มีโปรไฟล์ที่จัดเก็บไว้ แต่
  `auth.order.<provider>` แบบระบุชัดเจนไม่ได้รวมโปรไฟล์นั้นไว้ ดังนั้น probe จะแสดงการยกเว้นแทน
  การลองใช้
- `missing_credential`, `invalid_expires`, `expired`, `unresolved_ref`:
  มีโปรไฟล์อยู่ แต่ยังไม่เข้าเกณฑ์/ไม่สามารถ resolve ได้
- `no_model`: มี auth ของผู้ให้บริการ แต่ OpenClaw ไม่สามารถ resolve
  โมเดลตัวเลือกที่ probe ได้สำหรับผู้ให้บริการนั้น

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

`models auth add` คือตัวช่วย auth แบบโต้ตอบ สามารถเปิดโฟลว์ auth ของผู้ให้บริการ
(OAuth/API key) หรือนำทางคุณไปยังการวางโทเค็นด้วยตนเอง ขึ้นอยู่กับ
ผู้ให้บริการที่คุณเลือก

`models auth login` จะรันโฟลว์ auth ของ Plugin ผู้ให้บริการ (OAuth/API key) ใช้
`openclaw plugins list` เพื่อดูว่ามีผู้ให้บริการใดติดตั้งอยู่บ้าง

ตัวอย่าง:

```bash
openclaw models auth login --provider openai-codex --set-default
```

หมายเหตุ:

- `setup-token` และ `paste-token` ยังคงเป็นคำสั่งโทเค็นทั่วไปสำหรับผู้ให้บริการ
  ที่เปิดเผยวิธี auth แบบโทเค็น
- `setup-token` ต้องใช้ TTY แบบโต้ตอบ และจะรันวิธี token-auth ของผู้ให้บริการ
  (โดยค่าเริ่มต้นจะใช้วิธี `setup-token` ของผู้ให้บริการนั้นเมื่อมีการเปิดเผยไว้)
- `paste-token` รองรับสตริงโทเค็นที่สร้างจากที่อื่นหรือจากระบบอัตโนมัติ
- `paste-token` ต้องระบุ `--provider`, จะถามค่าโทเค็น และเขียน
  ลงใน profile id เริ่มต้น `<provider>:manual` เว้นแต่คุณจะส่ง
  `--profile-id`
- `paste-token --expires-in <duration>` จะจัดเก็บเวลาหมดอายุแบบ absolute ของโทเค็นจาก
  duration แบบสัมพัทธ์ เช่น `365d` หรือ `12h`
- หมายเหตุสำหรับ Anthropic: ทีมงาน Anthropic แจ้งเราว่าการใช้งาน Claude CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและการใช้ `claude -p` เป็นวิธีที่ได้รับอนุญาตสำหรับการผสานรวมนี้ เว้นแต่ Anthropic จะเผยแพร่นโยบายใหม่
- `setup-token` / `paste-token` ของ Anthropic ยังคงพร้อมใช้งานในฐานะเส้นทางโทเค็นที่รองรับของ OpenClaw แต่ตอนนี้ OpenClaw จะให้ความสำคัญกับการใช้ Claude CLI ซ้ำและ `claude -p` ก่อนเมื่อพร้อมใช้งาน
