---
read_when:
    - คุณต้องการทำความเข้าใจ OpenClaw OAuth ตั้งแต่ต้นจนจบ
    - คุณพบปัญหาการทำให้โทเค็นใช้ไม่ได้ / การออกจากระบบ
    - คุณต้องการขั้นตอนการตรวจสอบสิทธิ์ของ Claude CLI หรือ OAuth
    - คุณต้องการหลายบัญชีหรือการกำหนดเส้นทางตามโปรไฟล์
summary: 'OAuth ใน OpenClaw: การแลกเปลี่ยนโทเค็น การจัดเก็บ และรูปแบบการใช้งานหลายบัญชี'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T09:47:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw รองรับ “การยืนยันตัวตนแบบ subscription” ผ่าน OAuth สำหรับผู้ให้บริการที่มีฟีเจอร์นี้
(โดยเฉพาะ **OpenAI Codex (ChatGPT OAuth)**) สำหรับ Anthropic การแบ่งใช้งานที่เหมาะสม
ในตอนนี้คือ:

- **คีย์ API ของ Anthropic**: การคิดค่าบริการ Anthropic API ตามปกติ
- **Anthropic Claude CLI / การยืนยันตัวตนแบบ subscription ภายใน OpenClaw**: เจ้าหน้าที่ Anthropic
  แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง

OpenAI Codex OAuth รองรับการใช้งานในเครื่องมือภายนอกอย่าง
OpenClaw อย่างชัดเจน หน้านี้อธิบาย:

สำหรับ Anthropic ใน production การยืนยันตัวตนด้วยคีย์ API เป็นเส้นทางที่แนะนำและปลอดภัยกว่า

- วิธีการทำงานของ **การแลกเปลี่ยนโทเค็น** OAuth (PKCE)
- **ที่จัดเก็บ** โทเค็น (และเหตุผล)
- วิธีจัดการ **หลายบัญชี** (โปรไฟล์ + การ override ต่อเซสชัน)

OpenClaw ยังรองรับ **Plugin ของผู้ให้บริการ** ที่มาพร้อม flow OAuth หรือคีย์ API
ของตัวเอง เรียกใช้ผ่าน:

```bash
openclaw models auth login --provider <id>
```

## แหล่งรับโทเค็น (เหตุผลที่มีอยู่)

ผู้ให้บริการ OAuth มักสร้าง **refresh token ใหม่** ระหว่าง flow การเข้าสู่ระบบ/การ refresh ผู้ให้บริการบางราย (หรือไคลเอนต์ OAuth บางตัว) อาจทำให้ refresh token เก่าหมดอายุเมื่อมีการออกโทเค็นใหม่สำหรับผู้ใช้/แอปเดียวกัน

อาการที่พบจริง:

- คุณเข้าสู่ระบบผ่าน OpenClaw _และ_ ผ่าน Claude Code / Codex CLI → หนึ่งในนั้นสุ่มถูก “ออกจากระบบ” ในภายหลัง

เพื่อลดปัญหานั้น OpenClaw จึงถือว่า `auth-profiles.json` เป็น **แหล่งรับโทเค็น**:

- runtime อ่านข้อมูลประจำตัวจาก **ที่เดียว**
- เราสามารถเก็บหลายโปรไฟล์และกำหนดเส้นทางได้อย่างแน่นอน
- การนำ CLI ภายนอกกลับมาใช้ซ้ำขึ้นอยู่กับผู้ให้บริการ: Codex CLI สามารถ bootstrap โปรไฟล์
  `openai-codex:default` ว่างได้ แต่เมื่อ OpenClaw มีโปรไฟล์ OAuth ในเครื่องแล้ว
  refresh token ในเครื่องจะเป็น canonical; integration อื่นยังสามารถจัดการจากภายนอก
  และอ่าน auth store ของ CLI ใหม่ได้
- เส้นทางสถานะและการเริ่มต้นที่รู้อยู่แล้วว่าชุดผู้ให้บริการที่กำหนดค่าไว้มีขอบเขตอย่างไร
  จะจำกัดการค้นหา CLI ภายนอกไว้ที่ชุดนั้น ดังนั้น store การเข้าสู่ระบบ CLI ที่ไม่เกี่ยวข้อง
  จะไม่ถูก probe สำหรับการตั้งค่าที่มีผู้ให้บริการเดียว

## การจัดเก็บ (โทเค็นอยู่ที่ไหน)

Secret ถูกจัดเก็บใน auth store ของ agent:

- โปรไฟล์ Auth (OAuth + คีย์ API + ref ระดับค่าแบบเลือกได้): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ไฟล์ความเข้ากันได้แบบ legacy: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (รายการ `api_key` แบบ static จะถูกล้างเมื่อค้นพบ)

ไฟล์ import-only แบบ legacy (ยังรองรับอยู่ แต่ไม่ใช่ store หลัก):

- `~/.openclaw/credentials/oauth.json` (import เข้า `auth-profiles.json` เมื่อใช้งานครั้งแรก)

ทั้งหมดข้างต้นยังเคารพ `$OPENCLAW_STATE_DIR` (การ override ไดเรกทอรี state) อ้างอิงฉบับเต็ม: [/gateway/configuration](/th/gateway/configuration-reference#auth-storage)

สำหรับ ref ของ secret แบบ static และพฤติกรรมการเปิดใช้งาน runtime snapshot โปรดดู [การจัดการ Secrets](/th/gateway/secrets)

เมื่อ agent รองไม่มีโปรไฟล์ auth ในเครื่อง OpenClaw จะใช้การสืบทอดแบบ read-through
จาก store ของ agent default/main โดยจะไม่ clone `auth-profiles.json` ของ agent หลัก
เมื่ออ่าน OAuth refresh token มีความละเอียดอ่อนเป็นพิเศษ: flow การคัดลอกตามปกติจะข้าม
สิ่งเหล่านี้โดยค่าเริ่มต้น เพราะผู้ให้บริการบางราย rotate หรือทำให้ refresh token หมดอายุ
หลังใช้งาน กำหนดค่าการเข้าสู่ระบบ OAuth แยกต่างหากสำหรับ agent
เมื่อ agent นั้นต้องใช้บัญชีอิสระ

## ความเข้ากันได้ของโทเค็น Anthropic แบบ legacy

<Warning>
เอกสาร Claude Code สาธารณะของ Anthropic ระบุว่าการใช้ Claude Code โดยตรงยังอยู่ภายใต้
ขีดจำกัดของ subscription ของ Claude และเจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude
CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้ซ้ำและ
การใช้ `claude -p` ได้รับอนุญาตสำหรับ integration นี้ เว้นแต่ Anthropic
จะเผยแพร่นโยบายใหม่

สำหรับเอกสารแผน direct-Claude-Code ปัจจุบันของ Anthropic โปรดดู [การใช้ Claude Code
กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
และ [การใช้ Claude Code กับแผน Team หรือ Enterprise
ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

หากคุณต้องการตัวเลือกแบบ subscription-style อื่นใน OpenClaw โปรดดู [OpenAI
Codex](/th/providers/openai), [Qwen Cloud Coding
Plan](/th/providers/qwen), [MiniMax Coding Plan](/th/providers/minimax),
และ [Z.AI / GLM Coding Plan](/th/providers/glm)
</Warning>

OpenClaw ยังเปิดเผย setup-token ของ Anthropic เป็นเส้นทาง token-auth ที่รองรับ แต่ตอนนี้จะเลือกใช้การนำ Claude CLI กลับมาใช้ซ้ำและ `claude -p` ก่อนเมื่อพร้อมใช้งาน

## การย้ายข้อมูล Anthropic Claude CLI

OpenClaw รองรับการนำ Anthropic Claude CLI กลับมาใช้ซ้ำอีกครั้ง หากคุณมีการเข้าสู่ระบบ Claude
ในเครื่องบน host อยู่แล้ว onboarding/configure สามารถนำมาใช้ซ้ำได้โดยตรง

## การแลกเปลี่ยน OAuth (วิธีการเข้าสู่ระบบ)

flow การเข้าสู่ระบบแบบโต้ตอบของ OpenClaw ถูก implement ใน `@mariozechner/pi-ai` และเชื่อมเข้ากับ wizard/command

### Anthropic setup-token

รูปแบบ flow:

1. เริ่ม Anthropic setup-token หรือ paste-token จาก OpenClaw
2. OpenClaw จัดเก็บข้อมูลประจำตัว Anthropic ที่ได้ไว้ในโปรไฟล์ auth
3. การเลือกโมเดลยังคงอยู่ที่ `anthropic/...`
4. โปรไฟล์ auth ของ Anthropic ที่มีอยู่ยังคงพร้อมใช้งานสำหรับ rollback/การควบคุมลำดับ

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth รองรับการใช้งานนอก Codex CLI อย่างชัดเจน รวมถึง workflow ของ OpenClaw

รูปแบบ flow (PKCE):

1. สร้าง PKCE verifier/challenge + `state` แบบสุ่ม
2. เปิด `https://auth.openai.com/oauth/authorize?...`
3. พยายามจับ callback ที่ `http://127.0.0.1:1455/auth/callback`
4. หาก bind callback ไม่ได้ (หรือคุณใช้งานระยะไกล/headless) ให้วาง URL/code สำหรับ redirect
5. แลกเปลี่ยนที่ `https://auth.openai.com/oauth/token`
6. ดึง `accountId` จาก access token และจัดเก็บ `{ access, refresh, expires, accountId }`

เส้นทาง wizard คือ `openclaw onboard` → ตัวเลือก auth `openai-codex`

## การ Refresh + การหมดอายุ

โปรไฟล์จัดเก็บ timestamp `expires`

ที่ runtime:

- หาก `expires` อยู่ในอนาคต → ใช้ access token ที่จัดเก็บไว้
- หากหมดอายุ → refresh (ภายใต้ file lock) และเขียนทับข้อมูลประจำตัวที่จัดเก็บไว้
- หาก agent รองอ่านโปรไฟล์ OAuth ของ agent หลักที่สืบทอดมา การ refresh
  จะเขียนกลับไปที่ store ของ agent หลักแทนการคัดลอก refresh token เข้าไปใน
  store ของ agent รอง
- ข้อยกเว้น: ข้อมูลประจำตัว CLI ภายนอกบางรายการยังคงถูกจัดการจากภายนอก; OpenClaw
  จะอ่าน auth store ของ CLI เหล่านั้นใหม่แทนการใช้ refresh token ที่คัดลอกมา
  การ bootstrap ของ Codex CLI ถูกจำกัดอย่างตั้งใจ: จะ seed โปรไฟล์
  `openai-codex:default` ว่าง จากนั้นการ refresh ที่ OpenClaw เป็นเจ้าของจะทำให้โปรไฟล์
  ในเครื่องเป็น canonical ต่อไป

flow การ refresh เป็นแบบอัตโนมัติ โดยทั่วไปคุณไม่จำเป็นต้องจัดการโทเค็นด้วยตนเอง

## หลายบัญชี (โปรไฟล์) + การกำหนดเส้นทาง

มีสองรูปแบบ:

### 1) แนะนำ: แยก agent

หากคุณต้องการให้ “ส่วนตัว” และ “งาน” ไม่โต้ตอบกันเลย ให้ใช้ agent ที่แยกกัน (เซสชัน + ข้อมูลประจำตัว + workspace แยกกัน):

```bash
openclaw agents add work
openclaw agents add personal
```

จากนั้นกำหนดค่า auth ต่อ agent (wizard) และกำหนดเส้นทาง chat ไปยัง agent ที่ถูกต้อง

### 2) ขั้นสูง: หลายโปรไฟล์ใน agent เดียว

`auth-profiles.json` รองรับ ID โปรไฟล์หลายรายการสำหรับผู้ให้บริการเดียวกัน

เลือกโปรไฟล์ที่จะใช้:

- แบบ global ผ่านการจัดลำดับ config (`auth.order`)
- ต่อเซสชันผ่าน `/model ...@<profileId>`

ตัวอย่าง (การ override เซสชัน):

- `/model Opus@anthropic:work`

วิธีดูว่า ID โปรไฟล์ใดมีอยู่:

- `openclaw channels list --json` (แสดง `auth[]`)

เอกสารที่เกี่ยวข้อง:

- [Model failover](/th/concepts/model-failover) (กฎ rotation + cooldown)
- [คำสั่ง Slash](/th/tools/slash-commands) (พื้นผิวคำสั่ง)

## ที่เกี่ยวข้อง

- [การยืนยันตัวตน](/th/gateway/authentication) — ภาพรวม auth ของผู้ให้บริการโมเดล
- [Secrets](/th/gateway/secrets) — การจัดเก็บข้อมูลประจำตัวและ SecretRef
- [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#auth-storage) — คีย์ config สำหรับ auth
