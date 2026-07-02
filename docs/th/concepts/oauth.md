---
read_when:
    - คุณต้องการทำความเข้าใจ OpenClaw OAuth แบบครบวงจร
    - คุณพบปัญหาโทเค็นถูกยกเลิกการใช้งาน / การออกจากระบบ
    - คุณต้องการโฟลว์การยืนยันตัวตนของ Claude CLI หรือ OAuth
    - คุณต้องการหลายบัญชีหรือการกำหนดเส้นทางโปรไฟล์
summary: 'OAuth ใน OpenClaw: การแลกเปลี่ยนโทเค็น การจัดเก็บ และรูปแบบหลายบัญชี'
title: OAuth
x-i18n:
    generated_at: "2026-07-02T22:53:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 5cffefec8bb3e755bcd4583a7957510c7ba3b605e21a3fd876f27c8fc9aa65aa
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw รองรับ "การยืนยันตัวตนแบบ subscription" ผ่าน OAuth สำหรับผู้ให้บริการที่มีให้ใช้งาน
(โดยเฉพาะ **OpenAI Codex (ChatGPT OAuth)**) สำหรับ Anthropic แนวทางปฏิบัติ
ตอนนี้แบ่งเป็น:

- **คีย์ API ของ Anthropic**: การเรียกเก็บเงิน API ของ Anthropic ตามปกติ
- **Anthropic Claude CLI / การยืนยันตัวตนแบบ subscription ภายใน OpenClaw**: เจ้าหน้าที่ Anthropic
  แจ้งเราว่าการใช้งานนี้ได้รับอนุญาตอีกครั้ง

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานในเครื่องมือภายนอกอย่าง
OpenClaw

OpenClaw จัดเก็บทั้งการยืนยันตัวตนด้วยคีย์ API ของ OpenAI และ ChatGPT/Codex OAuth ไว้ใต้
รหัสผู้ให้บริการมาตรฐาน `openai` รหัสโปรไฟล์ `openai-codex:*` รุ่นเก่าและ
รายการ `auth.order.openai-codex` เป็นสถานะดั้งเดิมที่ซ่อมแซมโดย
`openclaw doctor --fix`; ใช้รหัสโปรไฟล์ `openai:*` และ `auth.order.openai` สำหรับ
การกำหนดค่าใหม่

สำหรับ Anthropic ในโปรดักชัน การยืนยันตัวตนด้วยคีย์ API เป็นเส้นทางที่ปลอดภัยกว่าและแนะนำให้ใช้

หน้านี้อธิบาย:

- การทำงานของ **การแลกเปลี่ยนโทเค็น** OAuth (PKCE)
- ตำแหน่งที่ **จัดเก็บ** โทเค็น (และเหตุผล)
- วิธีจัดการ **หลายบัญชี** (โปรไฟล์ + การ override รายเซสชัน)

OpenClaw ยังรองรับ **Plugin ของผู้ให้บริการ** ที่มาพร้อมโฟลว์ OAuth หรือคีย์ API
ของตัวเอง เรียกใช้ผ่าน:

```bash
openclaw models auth login --provider <id>
```

## จุดรับโทเค็น (เหตุผลที่มีอยู่)

ผู้ให้บริการ OAuth มักออก **refresh token ใหม่** ระหว่างโฟลว์ login/refresh ผู้ให้บริการบางราย (หรือไคลเอนต์ OAuth) อาจทำให้ refresh token เก่าใช้ไม่ได้เมื่อมีการออกโทเค็นใหม่ให้ผู้ใช้/แอปเดียวกัน

อาการที่พบได้จริง:

- คุณเข้าสู่ระบบผ่าน OpenClaw _และ_ ผ่าน Claude Code / Codex CLI → หนึ่งในนั้นถูก "ออกจากระบบ" แบบสุ่มในภายหลัง

เพื่อลดปัญหานั้น OpenClaw จึงปฏิบัติต่อ `auth-profiles.json` เป็น **จุดรับโทเค็น**:

- runtime อ่านข้อมูลรับรองจาก **ที่เดียว**
- เราสามารถเก็บหลายโปรไฟล์และกำหนดเส้นทางได้อย่างกำหนดแน่นอน
- การใช้ CLI ภายนอกซ้ำขึ้นกับผู้ให้บริการ: Codex CLI สามารถ bootstrap โปรไฟล์
  `openai:default` ที่ว่างได้ แต่เมื่อ OpenClaw มีโปรไฟล์ OAuth ภายในเครื่องแล้ว
  refresh token ภายในเครื่องจะเป็นมาตรฐาน หาก refresh token ภายในเครื่องนั้นถูกปฏิเสธ
  OpenClaw จะรายงานโปรไฟล์ที่จัดการอยู่เพื่อให้ยืนยันตัวตนใหม่แทนการใช้
  วัสดุโทเค็นของ Codex CLI เป็น fallback runtime ข้างเคียง การผสานรวมอื่นๆ สามารถ
  ยังคงจัดการจากภายนอกและอ่าน auth store ของ CLI ซ้ำได้
- เส้นทางสถานะและเริ่มต้นที่รู้ชุดผู้ให้บริการที่กำหนดค่าไว้แล้วจะจำกัดขอบเขต
  การค้นหา CLI ภายนอกไว้ที่ชุดนั้น ดังนั้น store การเข้าสู่ระบบ CLI ที่ไม่เกี่ยวข้องจะไม่ถูก
  ตรวจสอบสำหรับการตั้งค่าผู้ให้บริการเดียว

## การจัดเก็บ (โทเค็นอยู่ที่ไหน)

Secret ถูกจัดเก็บใน auth store ของเอเจนต์:

- โปรไฟล์ auth (OAuth + คีย์ API + refs ระดับค่าที่ไม่บังคับ): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- ไฟล์ความเข้ากันได้ดั้งเดิม: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (รายการ `api_key` แบบคงที่จะถูกล้างออกเมื่อค้นพบ)

ไฟล์ดั้งเดิมสำหรับนำเข้าเท่านั้น (ยังรองรับอยู่ แต่ไม่ใช่ store หลัก):

- `~/.openclaw/credentials/oauth.json` (นำเข้าไปยัง `auth-profiles.json` เมื่อใช้ครั้งแรก)

ทั้งหมดข้างต้นยังเคารพ `$OPENCLAW_STATE_DIR` (การ override ไดเรกทอรีสถานะ) อ้างอิงฉบับเต็ม: [/gateway/configuration](/th/gateway/configuration-reference#auth-storage)

สำหรับ refs ของ secret แบบคงที่และพฤติกรรมการเปิดใช้งาน snapshot ของ runtime โปรดดู [การจัดการ Secrets](/th/gateway/secrets)

เมื่อเอเจนต์รองไม่มีโปรไฟล์ auth ภายในเครื่อง OpenClaw จะใช้การสืบทอดแบบอ่านผ่าน
จาก store ของเอเจนต์ default/main โดยจะไม่ clone
`auth-profiles.json` ของเอเจนต์หลักตอนอ่าน OAuth refresh token มีความอ่อนไหวเป็นพิเศษ:
โฟลว์การคัดลอกปกติจะข้ามโทเค็นเหล่านี้โดย default เพราะผู้ให้บริการบางรายหมุนเวียน
หรือทำให้ refresh token ใช้ไม่ได้หลังใช้งาน กำหนดค่าการเข้าสู่ระบบ OAuth แยกสำหรับ
เอเจนต์เมื่อจำเป็นต้องใช้บัญชีอิสระ

## ความเข้ากันได้ของโทเค็นดั้งเดิมของ Anthropic

<Warning>
เอกสาร Claude Code สาธารณะของ Anthropic ระบุว่าการใช้ Claude Code โดยตรงยังอยู่ภายใน
ขีดจำกัด subscription ของ Claude และเจ้าหน้าที่ Anthropic แจ้งเราว่าการใช้งาน Claude
CLI แบบ OpenClaw ได้รับอนุญาตอีกครั้ง ดังนั้น OpenClaw จึงถือว่าการใช้ Claude CLI ซ้ำและ
การใช้งาน `claude -p` ได้รับอนุมัติสำหรับการผสานรวมนี้ เว้นแต่ Anthropic
จะเผยแพร่นโยบายใหม่

สำหรับเอกสารแผน direct-Claude-Code ปัจจุบันของ Anthropic โปรดดู [การใช้ Claude Code
กับแผน Pro หรือ Max ของคุณ](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
และ [การใช้ Claude Code กับแผน Team หรือ Enterprise
ของคุณ](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

หากคุณต้องการตัวเลือกแบบ subscription อื่นๆ ใน OpenClaw โปรดดู [OpenAI
Codex](/th/providers/openai), [Qwen Cloud Coding
Plan](/th/providers/qwen), [MiniMax Coding Plan](/th/providers/minimax),
และ [Z.AI / GLM Coding Plan](/th/providers/zai)
</Warning>

OpenClaw ยังเปิดเผย setup-token ของ Anthropic เป็นเส้นทาง token-auth ที่รองรับ แต่ตอนนี้จะเลือกใช้ Claude CLI ซ้ำและ `claude -p` ก่อนเมื่อมีให้ใช้งาน

## การย้ายข้อมูล Anthropic Claude CLI

OpenClaw รองรับการใช้ Anthropic Claude CLI ซ้ำอีกครั้ง หากคุณมีการเข้าสู่ระบบ Claude
ภายในเครื่องบนโฮสต์อยู่แล้ว onboarding/configure สามารถใช้ซ้ำได้โดยตรง

## การแลกเปลี่ยน OAuth (login ทำงานอย่างไร)

โฟลว์การเข้าสู่ระบบแบบ interactive ของ OpenClaw ถูก implement ใน `openclaw/plugin-sdk/llm` และเชื่อมเข้ากับ wizard/command

### setup-token ของ Anthropic

รูปแบบโฟลว์:

1. เริ่ม setup-token ของ Anthropic หรือ paste-token จาก OpenClaw
2. OpenClaw จัดเก็บข้อมูลรับรอง Anthropic ที่ได้ไว้ในโปรไฟล์ auth
3. การเลือกโมเดลยังอยู่ที่ `anthropic/...`
4. โปรไฟล์ auth ของ Anthropic ที่มีอยู่ยังพร้อมใช้งานสำหรับการ rollback/ควบคุมลำดับ

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth รองรับอย่างชัดเจนสำหรับการใช้งานนอก Codex CLI รวมถึง workflow ของ OpenClaw

คำสั่ง login ยังคงใช้รหัสผู้ให้บริการ OpenAI มาตรฐาน:

```bash
openclaw models auth login --provider openai
```

ใช้ `--profile-id openai:<name>` สำหรับบัญชี ChatGPT/Codex OAuth หลายบัญชีใน
เอเจนต์เดียว อย่าใช้ `openai-codex:<name>` สำหรับโปรไฟล์ใหม่ Doctor จะย้าย
prefix รุ่นเก่านั้นไปเป็นรหัสโปรไฟล์ `openai:*` ที่ไม่ชนกัน; เรียก
`openclaw models auth list --provider openai` หลังซ่อมแซมก่อนคัดลอก
รหัสโปรไฟล์เข้าไปใน `auth.order` หรือ `/model ...@<profileId>`

รูปแบบโฟลว์ (PKCE):

1. สร้าง PKCE verifier/challenge + `state` แบบสุ่ม
2. เปิด `https://auth.openai.com/oauth/authorize?...`
3. พยายามจับ callback ที่ `http://127.0.0.1:1455/auth/callback`
4. หาก callback bind ไม่ได้ (หรือคุณอยู่บน remote/headless) ให้วาง redirect URL/code
5. แลกเปลี่ยนที่ `https://auth.openai.com/oauth/token`
6. ดึง `accountId` จาก access token และจัดเก็บ `{ access, refresh, expires, accountId }`

เส้นทาง wizard คือ `openclaw onboard` → ตัวเลือก auth `openai`

## Refresh + expiry

โปรไฟล์จัดเก็บ timestamp `expires`

ที่ runtime:

- หาก `expires` อยู่ในอนาคต → ใช้ access token ที่จัดเก็บไว้
- หากหมดอายุ → refresh (ภายใต้ file lock) และเขียนทับข้อมูลรับรองที่จัดเก็บไว้
- หากเอเจนต์รองอ่านโปรไฟล์ OAuth ของเอเจนต์หลักที่สืบทอดมา การ refresh
  จะเขียนกลับไปยัง store ของเอเจนต์หลักแทนการคัดลอก refresh token เข้าไปใน
  store ของเอเจนต์รอง
- ข้อยกเว้น: ข้อมูลรับรอง CLI ภายนอกบางรายการยังคงจัดการจากภายนอก; OpenClaw
  อ่าน auth store ของ CLI เหล่านั้นซ้ำแทนการใช้ refresh token ที่คัดลอกมา
  การ bootstrap ของ Codex CLI ถูกจำกัดขอบเขตโดยตั้งใจ: สามารถ seed
  `openai:default` ที่ว่างหรือโปรไฟล์ OpenAI ที่ร้องขออย่างชัดเจนได้เท่านั้น ก่อนที่ OpenClaw
  จะเป็นเจ้าของ OAuth สำหรับผู้ให้บริการ หลังจากนั้น การ refresh ที่ OpenClaw เป็นเจ้าของจะทำให้โปรไฟล์
  ภายในเครื่องเป็นมาตรฐาน และการค้นหาจะไม่เพิ่ม auth ของ Codex CLI ใน slot ข้างเคียงใดๆ
  หากการ refresh ที่จัดการอยู่ล้มเหลว OpenClaw จะรายงานโปรไฟล์ที่ได้รับผลกระทบเพื่อ
  ให้ยืนยันตัวตนใหม่แทนการคืนวัสดุโทเค็น CLI ภายนอก

โฟลว์ refresh เป็นแบบอัตโนมัติ โดยทั่วไปคุณไม่จำเป็นต้องจัดการโทเค็นด้วยตนเอง

## หลายบัญชี (โปรไฟล์) + การกำหนดเส้นทาง

สองรูปแบบ:

### 1) แนะนำ: แยกเอเจนต์

หากคุณต้องการให้ "ส่วนตัว" และ "งาน" ไม่โต้ตอบกันเลย ให้ใช้เอเจนต์ที่แยกกัน (เซสชัน + ข้อมูลรับรอง + workspace แยกกัน):

```bash
openclaw agents add work
openclaw agents add personal
```

จากนั้นกำหนดค่า auth ต่อเอเจนต์ (wizard) และกำหนดเส้นทางแชทไปยังเอเจนต์ที่ถูกต้อง

### 2) ขั้นสูง: หลายโปรไฟล์ในเอเจนต์เดียว

`auth-profiles.json` รองรับรหัสโปรไฟล์หลายรายการสำหรับผู้ให้บริการเดียวกัน

เลือกโปรไฟล์ที่จะใช้:

- ระดับ global ผ่านการเรียงลำดับ config (`auth.order`)
- รายเซสชันผ่าน `/model ...@<profileId>`

ตัวอย่าง (session override):

- `/model Opus@anthropic:work`

วิธีดูว่ามีรหัสโปรไฟล์ใดอยู่บ้าง:

- `openclaw channels list --json` (แสดง `auth[]`)

เอกสารที่เกี่ยวข้อง:

- [Model failover](/th/concepts/model-failover) (กฎ rotation + cooldown)
- [คำสั่ง Slash](/th/tools/slash-commands) (พื้นผิวคำสั่ง)

## ที่เกี่ยวข้อง

- [การยืนยันตัวตน](/th/gateway/authentication) - ภาพรวม auth ของผู้ให้บริการโมเดล
- [Secrets](/th/gateway/secrets) - การจัดเก็บข้อมูลรับรองและ SecretRef
- [อ้างอิงการกำหนดค่า](/th/gateway/configuration-reference#auth-storage) - คีย์ config ของ auth
