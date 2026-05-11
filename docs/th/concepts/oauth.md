---
read_when:
    - คุณต้องการทำความเข้าใจ OpenClaw OAuth ตั้งแต่ต้นจนจบ
    - คุณพบปัญหาโทเค็นถูกทำให้เป็นโมฆะ / การออกจากระบบ
    - คุณต้องการขั้นตอนการยืนยันตัวตนของ Claude CLI หรือ OAuth
    - คุณต้องการหลายบัญชีหรือการกำหนดเส้นทางตามโปรไฟล์
summary: 'OAuth ใน OpenClaw: การแลกเปลี่ยนโทเค็น การจัดเก็บ และรูปแบบหลายบัญชี'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:28:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw รองรับ "การยืนยันตัวตนแบบสมัครสมาชิก" ผ่าน OAuth สำหรับผู้ให้บริการที่มีฟีเจอร์นี้
(โดยเฉพาะ **OpenAI Codex (ChatGPT OAuth)**) สำหรับ Anthropic การแบ่งในทางปฏิบัติ
ตอนนี้คือ:

- **คีย์ API ของ Anthropic**: การเรียกเก็บเงิน API ของ Anthropic ตามปกติ
- **Anthropic Claude CLI / การยืนยันตัวตนแบบสมัครสมาชิกภายใน OpenClaw**: เจ้าหน้าที่ Anthropic
  บอกเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้ในเครื่องมือภายนอกอย่าง
OpenClaw หน้านี้อธิบาย:

สำหรับ Anthropic ในการใช้งานจริง การยืนยันตัวตนด้วยคีย์ API เป็นแนวทางที่แนะนำและปลอดภัยกว่า

- **การแลกเปลี่ยนโทเค็น** OAuth ทำงานอย่างไร (PKCE)
- โทเค็นถูก **จัดเก็บ** ที่ไหน (และเพราะอะไร)
- วิธีจัดการ **หลายบัญชี** (โปรไฟล์ + การแทนที่รายเซสชัน)

OpenClaw ยังรองรับ **Plugin ผู้ให้บริการ** ที่มาพร้อมโฟลว์ OAuth หรือคีย์ API
ของตัวเอง เรียกใช้ผ่าน:

```bash
openclaw models auth login --provider <id>
```

## แหล่งรับโทเค็น (เหตุผลที่มีอยู่)

ผู้ให้บริการ OAuth มักสร้าง **refresh token ใหม่** ระหว่างโฟลว์การเข้าสู่ระบบ/การรีเฟรช ผู้ให้บริการบางราย (หรือไคลเอนต์ OAuth บางตัว) อาจทำให้ refresh token เก่าใช้ไม่ได้เมื่อมีการออกตัวใหม่ให้ผู้ใช้/แอปเดียวกัน

อาการที่พบในทางปฏิบัติ:

- คุณเข้าสู่ระบบผ่าน OpenClaw _และ_ ผ่าน Claude Code / Codex CLI → ภายหลังหนึ่งในนั้นถูก "ออกจากระบบ" แบบสุ่ม

เพื่อลดปัญหานั้น OpenClaw จึงถือว่า `auth-profiles.json` เป็น **แหล่งรับโทเค็น**:

- รันไทม์อ่านข้อมูลรับรองจาก **ที่เดียว**
- เราสามารถเก็บหลายโปรไฟล์และกำหนดเส้นทางได้อย่างเป็นแบบแผน
- การใช้ CLI ภายนอกซ้ำขึ้นอยู่กับผู้ให้บริการ: Codex CLI สามารถเริ่มโปรไฟล์
  `openai-codex:default` ว่างได้ แต่เมื่อ OpenClaw มีโปรไฟล์ OAuth ในเครื่องแล้ว
  refresh token ในเครื่องจะเป็นแหล่งอ้างอิงหลัก; การผสานรวมอื่นยังคงให้
  ระบบภายนอกจัดการและอ่าน auth store ของ CLI ซ้ำได้
- เส้นทางสถานะและการเริ่มต้นที่รู้ชุดผู้ให้บริการที่กำหนดค่าไว้อยู่แล้วจะจำกัดขอบเขต
  การค้นพบ CLI ภายนอกไว้ที่ชุดนั้น เพื่อไม่ให้ login store ของ CLI ที่ไม่เกี่ยวข้อง
  ถูกตรวจสอบสำหรับการตั้งค่าที่มีผู้ให้บริการเดียว

## การจัดเก็บ (โทเค็นอยู่ที่ไหน)

ความลับถูกจัดเก็บใน auth store ของเอเจนต์:

- โปรไฟล์ auth (OAuth + คีย์ API + refs ระดับค่าแบบเลือกได้): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ไฟล์ความเข้ากันได้แบบเดิม: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (รายการ `api_key` แบบคงที่จะถูกลบออกเมื่อพบ)

ไฟล์นำเข้าเท่านั้นแบบเดิม (ยังรองรับอยู่ แต่ไม่ใช่ store หลัก):

- `~/.openclaw/credentials/oauth.json` (นำเข้าไปยัง `auth-profiles.json` เมื่อใช้งานครั้งแรก)

ทั้งหมดข้างต้นยังเคารพ `$OPENCLAW_STATE_DIR` (การแทนที่ไดเรกทอรีสถานะ) อ้างอิงฉบับเต็ม: [/gateway/configuration](/th/gateway/configuration-reference#auth-storage)

สำหรับ secret refs แบบคงที่และพฤติกรรมการเปิดใช้งาน snapshot ตอนรันไทม์ ดู [การจัดการความลับ](/th/gateway/secrets)

เมื่อเอเจนต์รองไม่มีโปรไฟล์ auth ในเครื่อง OpenClaw จะใช้การสืบทอดแบบอ่านผ่าน
จาก store ของเอเจนต์เริ่มต้น/หลัก โดยจะไม่โคลน `auth-profiles.json` ของเอเจนต์หลัก
เมื่ออ่าน OAuth refresh token มีความอ่อนไหวเป็นพิเศษ: โฟลว์การคัดลอกปกติจะข้ามค่าเหล่านี้
โดยค่าเริ่มต้น เพราะผู้ให้บริการบางรายจะหมุนเวียนหรือทำให้ refresh token ใช้ไม่ได้หลังใช้งาน
ให้กำหนดค่าการเข้าสู่ระบบ OAuth แยกต่างหากสำหรับเอเจนต์เมื่อจำเป็นต้องใช้บัญชีอิสระ

## ความเข้ากันได้กับโทเค็นเดิมของ Anthropic

<Warning>
เอกสาร Claude Code สาธารณะของ Anthropic ระบุว่าการใช้ Claude Code โดยตรงจะยังอยู่ภายใน
ขีดจำกัดการสมัครสมาชิก Claude และเจ้าหน้าที่ Anthropic บอกเราว่าการใช้งาน Claude
CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและ
การใช้งาน `claude -p` ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic
จะเผยแพร่นโยบายใหม่

สำหรับเอกสารแผน direct-Claude-Code ปัจจุบันของ Anthropic ดู [การใช้ Claude Code
กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
และ [การใช้ Claude Code กับแผน Team หรือ Enterprise
ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

หากคุณต้องการตัวเลือกแบบสมัครสมาชิกอื่นใน OpenClaw ดู [OpenAI
Codex](/th/providers/openai), [Qwen Cloud Coding
Plan](/th/providers/qwen), [MiniMax Coding Plan](/th/providers/minimax),
และ [Z.AI / GLM Coding Plan](/th/providers/glm)
</Warning>

OpenClaw ยังเปิดเผย setup-token ของ Anthropic เป็นเส้นทาง token-auth ที่รองรับ แต่ตอนนี้จะเลือกใช้ Claude CLI ซ้ำและ `claude -p` ก่อนเมื่อพร้อมใช้งาน

## การย้ายไปใช้ Anthropic Claude CLI

OpenClaw รองรับการใช้ Anthropic Claude CLI ซ้ำอีกครั้ง หากคุณมีการเข้าสู่ระบบ Claude
ในเครื่องบนโฮสต์อยู่แล้ว onboarding/configure สามารถใช้ซ้ำได้โดยตรง

## การแลกเปลี่ยน OAuth (การเข้าสู่ระบบทำงานอย่างไร)

โฟลว์การเข้าสู่ระบบแบบโต้ตอบของ OpenClaw ถูกนำไปใช้ใน `@earendil-works/pi-ai` และเชื่อมเข้ากับวิซาร์ด/คำสั่ง

### setup-token ของ Anthropic

รูปแบบโฟลว์:

1. เริ่ม setup-token ของ Anthropic หรือ paste-token จาก OpenClaw
2. OpenClaw จัดเก็บข้อมูลรับรอง Anthropic ที่ได้ไว้ในโปรไฟล์ auth
3. การเลือกโมเดลยังคงอยู่ที่ `anthropic/...`
4. โปรไฟล์ auth ของ Anthropic ที่มีอยู่ยังพร้อมใช้สำหรับการย้อนกลับ/การควบคุมลำดับ

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานนอก Codex CLI รวมถึงเวิร์กโฟลว์ของ OpenClaw

รูปแบบโฟลว์ (PKCE):

1. สร้าง PKCE verifier/challenge + `state` แบบสุ่ม
2. เปิด `https://auth.openai.com/oauth/authorize?...`
3. พยายามจับ callback ที่ `http://127.0.0.1:1455/auth/callback`
4. หาก callback ผูกไม่ได้ (หรือคุณอยู่บนรีโมต/ไม่มีหน้าจอ) ให้วาง redirect URL/code
5. แลกเปลี่ยนที่ `https://auth.openai.com/oauth/token`
6. ดึง `accountId` จาก access token แล้วจัดเก็บ `{ access, refresh, expires, accountId }`

เส้นทางวิซาร์ดคือ `openclaw onboard` → ตัวเลือก auth `openai-codex`

## การรีเฟรช + การหมดอายุ

โปรไฟล์จัดเก็บ timestamp `expires`

ตอนรันไทม์:

- หาก `expires` อยู่ในอนาคต → ใช้ access token ที่จัดเก็บไว้
- หากหมดอายุ → รีเฟรช (ภายใต้ file lock) และเขียนทับข้อมูลรับรองที่จัดเก็บไว้
- หากเอเจนต์รองอ่านโปรไฟล์ OAuth ของเอเจนต์หลักที่สืบทอดมา การรีเฟรช
  จะเขียนกลับไปยัง store ของเอเจนต์หลักแทนการคัดลอก refresh token เข้าไปยัง
  store ของเอเจนต์รอง
- ข้อยกเว้น: ข้อมูลรับรอง CLI ภายนอกบางส่วนยังคงให้ระบบภายนอกจัดการ; OpenClaw
  จะอ่าน auth store ของ CLI เหล่านั้นซ้ำแทนการใช้ refresh token ที่คัดลอกมา
  การ bootstrap ของ Codex CLI ตั้งใจให้แคบกว่า: จะ seed โปรไฟล์
  `openai-codex:default` ว่าง จากนั้นการรีเฟรชที่ OpenClaw เป็นเจ้าของจะคงให้โปรไฟล์
  ในเครื่องเป็นแหล่งอ้างอิงหลัก

โฟลว์การรีเฟรชเป็นแบบอัตโนมัติ โดยทั่วไปคุณไม่จำเป็นต้องจัดการโทเค็นด้วยตนเอง

## หลายบัญชี (โปรไฟล์) + การกำหนดเส้นทาง

มีสองรูปแบบ:

### 1) แนะนำ: แยกเอเจนต์

หากคุณต้องการให้ "ส่วนตัว" และ "งาน" ไม่โต้ตอบกัน ให้ใช้เอเจนต์ที่แยกกัน (เซสชัน + ข้อมูลรับรอง + workspace แยกกัน):

```bash
openclaw agents add work
openclaw agents add personal
```

จากนั้นกำหนดค่า auth แยกตามเอเจนต์ (วิซาร์ด) และกำหนดเส้นทางแชตไปยังเอเจนต์ที่ถูกต้อง

### 2) ขั้นสูง: หลายโปรไฟล์ในเอเจนต์เดียว

`auth-profiles.json` รองรับ ID โปรไฟล์หลายรายการสำหรับผู้ให้บริการเดียวกัน

เลือกว่าจะใช้โปรไฟล์ใด:

- ทั่วทั้งระบบผ่านลำดับ config (`auth.order`)
- รายเซสชันผ่าน `/model ...@<profileId>`

ตัวอย่าง (การแทนที่รายเซสชัน):

- `/model Opus@anthropic:work`

วิธีดูว่ามี ID โปรไฟล์ใดอยู่:

- `openclaw channels list --json` (แสดง `auth[]`)

เอกสารที่เกี่ยวข้อง:

- [การสลับโมเดลเมื่อขัดข้อง](/th/concepts/model-failover) (กฎการหมุนเวียน + cooldown)
- [คำสั่ง Slash](/th/tools/slash-commands) (พื้นผิวคำสั่ง)

## ที่เกี่ยวข้อง

- [การยืนยันตัวตน](/th/gateway/authentication) - ภาพรวม auth ของผู้ให้บริการโมเดล
- [ความลับ](/th/gateway/secrets) - การจัดเก็บข้อมูลรับรองและ SecretRef
- [ข้อมูลอ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#auth-storage) - คีย์ config ของ auth
