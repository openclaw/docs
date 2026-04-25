---
read_when:
    - คุณต้องการทำความเข้าใจ OAuth ใน OpenClaw แบบครบวงจร end-to-end
    - คุณพบปัญหาโทเค็นใช้งานไม่ได้ / ถูกออกจากระบบ
    - คุณต้องการโฟลว์การยืนยันตัวตนของ Claude CLI หรือ OAuth
    - คุณต้องการหลายบัญชีหรือการกำหนดเส้นทางโปรไฟล์
summary: 'OAuth ใน OpenClaw: การแลกเปลี่ยนโทเค็น การจัดเก็บ และรูปแบบหลายบัญชี'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:46:03Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

OpenClaw รองรับ “subscription auth” ผ่าน OAuth สำหรับ providers ที่มีความสามารถนี้
(โดยเฉพาะ **OpenAI Codex (ChatGPT OAuth)**) สำหรับ Anthropic การแบ่งการใช้งานที่ใช้ได้จริง
ตอนนี้คือ:

- **Anthropic API key**: การคิดค่าบริการผ่าน Anthropic API ตามปกติ
- **Anthropic Claude CLI / subscription auth ภายใน OpenClaw**: ทีมงาน Anthropic
  แจ้งกับเราว่าการใช้งานลักษณะนี้ได้รับอนุญาตอีกครั้งแล้ว

OpenAI Codex OAuth ได้รับการรองรับอย่างชัดเจนสำหรับการใช้งานในเครื่องมือภายนอกอย่าง
OpenClaw หน้านี้อธิบาย:

สำหรับ Anthropic ในการใช้งานจริง การยืนยันตัวตนด้วย API key เป็นเส้นทางที่ปลอดภัยกว่าและแนะนำให้ใช้

- วิธีที่ **token exchange** ของ OAuth ทำงาน (PKCE)
- โทเค็นถูก **จัดเก็บ** ที่ใด (และเพราะเหตุใด)
- วิธีจัดการ **หลายบัญชี** (profiles + การ override รายเซสชัน)

OpenClaw ยังรองรับ **provider plugins** ที่มาพร้อมกับโฟลว์ OAuth หรือ API‑key
ของตัวเอง รันได้ด้วย:

```bash
openclaw models auth login --provider <id>
```

## token sink (เหตุผลที่มีสิ่งนี้)

providers OAuth มักสร้าง **refresh token ใหม่** ระหว่างโฟลว์ login/refresh บาง providers (หรือ OAuth clients) อาจทำให้ refresh tokens เก่าใช้งานไม่ได้เมื่อมีการออก refresh token ใหม่สำหรับ user/app เดียวกัน

อาการที่พบได้จริง:

- คุณล็อกอินผ่าน OpenClaw _และ_ ผ่าน Claude Code / Codex CLI → สักตัวหนึ่งอาจถูก “ออกจากระบบ” แบบสุ่มในภายหลัง

เพื่อลดปัญหานี้ OpenClaw จึงถือให้ `auth-profiles.json` เป็น **token sink**:

- รันไทม์จะอ่าน credentials จาก **ที่เดียว**
- เราสามารถเก็บหลาย profiles และกำหนดเส้นทางได้อย่างแน่นอน
- การนำ CLI ภายนอกกลับมาใช้ซ้ำเป็นแบบเฉพาะ provider: Codex CLI สามารถ bootstrap
  profile ว่าง `openai-codex:default` ได้ แต่เมื่อ OpenClaw มี local OAuth profile แล้ว
  local refresh token จะเป็นตัวหลัก; integrations อื่นยังสามารถคงการจัดการแบบภายนอก
  และอ่าน CLI auth store ของตนซ้ำได้

## การจัดเก็บ (โทเค็นอยู่ที่ใด)

ความลับจะถูกจัดเก็บ **แยกตามเอเจนต์**:

- Auth profiles (OAuth + API keys + value-level refs ที่เป็นทางเลือก): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ไฟล์ความเข้ากันได้แบบเดิม: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (รายการ `api_key` แบบคงที่จะถูกล้างเมื่อพบ)

ไฟล์แบบเดิมที่ใช้เฉพาะการนำเข้า (ยังรองรับอยู่ แต่ไม่ใช่ store หลัก):

- `~/.openclaw/credentials/oauth.json` (จะถูกนำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

ทั้งหมดข้างต้นยังรองรับ `$OPENCLAW_STATE_DIR` ด้วย (override state dir) ดูข้อมูลอ้างอิงแบบเต็มได้ที่: [/gateway/configuration](/th/gateway/configuration-reference#auth-storage)

สำหรับ static secret refs และพฤติกรรมการเปิดใช้งาน runtime snapshot ดู [Secrets Management](/th/gateway/secrets)

## ความเข้ากันได้กับโทเค็น Anthropic แบบเดิม

<Warning>
เอกสารสาธารณะของ Claude Code จาก Anthropic ระบุว่าการใช้งาน Claude Code โดยตรงยังคงอยู่ภายใน
ขีดจำกัดของแพ็กเกจ Claude subscription และทีมงาน Anthropic แจ้งกับเราว่าการใช้งาน Claude
CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการนำ Claude CLI กลับมาใช้ซ้ำและ
การใช้งาน `claude -p` เป็นแนวทางที่ได้รับอนุมัติสำหรับการเชื่อมต่อนี้ เว้นแต่ Anthropic
จะเผยแพร่นโยบายใหม่

สำหรับเอกสารแพ็กเกจ direct-Claude-Code ปัจจุบันของ Anthropic ดู [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
และ [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

หากคุณต้องการตัวเลือกแบบ subscription-style อื่นใน OpenClaw ดู [OpenAI
Codex](/th/providers/openai), [Qwen Cloud Coding
Plan](/th/providers/qwen), [MiniMax Coding Plan](/th/providers/minimax),
และ [Z.AI / GLM Coding Plan](/th/providers/glm)
</Warning>

OpenClaw ยังเปิดให้ Anthropic setup-token เป็นเส้นทาง token-auth ที่รองรับ แต่ตอนนี้ระบบให้ความสำคัญกับการนำ Claude CLI กลับมาใช้ซ้ำและ `claude -p` เมื่อมีให้ใช้

## การย้ายมาใช้ Anthropic Claude CLI

OpenClaw รองรับการนำ Anthropic Claude CLI กลับมาใช้ซ้ำอีกครั้ง หากคุณมีการล็อกอิน
Claude อยู่บนโฮสต์อยู่แล้ว onboarding/configure สามารถนำมาใช้ซ้ำได้โดยตรง

## OAuth exchange (การล็อกอินทำงานอย่างไร)

โฟลว์การล็อกอินแบบอินเทอร์แอคทีฟของ OpenClaw ถูกติดตั้งไว้ใน `@mariozechner/pi-ai` และเชื่อมเข้ากับ wizards/commands

### Anthropic setup-token

ลักษณะโฟลว์:

1. เริ่ม Anthropic setup-token หรือ paste-token จาก OpenClaw
2. OpenClaw จัดเก็บ Anthropic credential ที่ได้ลงใน auth profile
3. การเลือกโมเดลยังคงอยู่ที่ `anthropic/...`
4. Anthropic auth profiles ที่มีอยู่เดิมยังคงพร้อมใช้งานสำหรับการ rollback/ควบคุมลำดับ

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth ได้รับการรองรับอย่างชัดเจนสำหรับการใช้งานนอก Codex CLI รวมถึงเวิร์กโฟลว์ของ OpenClaw

ลักษณะโฟลว์ (PKCE):

1. สร้าง PKCE verifier/challenge + `state` แบบสุ่ม
2. เปิด `https://auth.openai.com/oauth/authorize?...`
3. พยายามจับ callback ที่ `http://127.0.0.1:1455/auth/callback`
4. หาก bind callback ไม่ได้ (หรือคุณใช้งานแบบ remote/headless) ให้ paste redirect URL/code
5. แลกที่ `https://auth.openai.com/oauth/token`
6. ดึง `accountId` จาก access token และจัดเก็บ `{ access, refresh, expires, accountId }`

เส้นทางใน wizard คือ `openclaw onboard` → ตัวเลือก auth `openai-codex`

## Refresh + การหมดอายุ

profiles จะจัดเก็บ timestamp `expires`

ระหว่างรันไทม์:

- หาก `expires` ยังอยู่ในอนาคต → ใช้ access token ที่จัดเก็บไว้
- หากหมดอายุแล้ว → refresh (ภายใต้ file lock) แล้วเขียนทับ credentials ที่จัดเก็บไว้
- ข้อยกเว้น: credentials ของ CLI ภายนอกบางชนิดยังคงถูกจัดการจากภายนอก; OpenClaw
  จะอ่าน CLI auth stores เหล่านั้นซ้ำแทนการใช้ refresh tokens ที่คัดลอกมา
  Codex CLI bootstrap มีขอบเขตที่แคบกว่าโดยตั้งใจ: มัน seed profile ว่าง
  `openai-codex:default` จากนั้น refreshes ที่ OpenClaw เป็นเจ้าของจะคง local
  profile ไว้เป็นตัวหลัก

โฟลว์ refresh เป็นแบบอัตโนมัติ โดยทั่วไปคุณไม่จำเป็นต้องจัดการโทเค็นด้วยตนเอง

## หลายบัญชี (profiles) + การกำหนดเส้นทาง

มี 2 รูปแบบ:

### 1) แนะนำ: แยกเอเจนต์

หากคุณต้องการให้ “ส่วนตัว” และ “ที่ทำงาน” ไม่ปะปนกันเลย ให้ใช้เอเจนต์ที่แยกจากกัน (แยก sessions + credentials + workspace):

```bash
openclaw agents add work
openclaw agents add personal
```

จากนั้นกำหนดค่า auth แยกตามเอเจนต์ (wizard) และกำหนดเส้นทางแชตไปยังเอเจนต์ที่ถูกต้อง

### 2) ขั้นสูง: หลาย profiles ในเอเจนต์เดียว

`auth-profiles.json` รองรับหลาย profile IDs สำหรับ provider เดียวกัน

เลือกว่าจะใช้ profile ใด:

- แบบโกลบอลผ่านการจัดลำดับใน config (`auth.order`)
- รายเซสชันผ่าน `/model ...@<profileId>`

ตัวอย่าง (override รายเซสชัน):

- `/model Opus@anthropic:work`

วิธีดูว่ามี profile IDs อะไรอยู่บ้าง:

- `openclaw channels list --json` (แสดง `auth[]`)

เอกสารที่เกี่ยวข้อง:

- [Model failover](/th/concepts/model-failover) (กฎการหมุนเวียน + cooldown)
- [Slash commands](/th/tools/slash-commands) (พื้นผิวคำสั่ง)

## ที่เกี่ยวข้อง

- [Authentication](/th/gateway/authentication) — ภาพรวมการยืนยันตัวตนของ model provider
- [Secrets](/th/gateway/secrets) — การจัดเก็บ credentials และ SecretRef
- [Configuration Reference](/th/gateway/configuration-reference#auth-storage) — คีย์ config สำหรับ auth
