---
read_when:
    - คุณต้องการขั้นตอน LLM แบบ JSON เท่านั้นภายในเวิร์กโฟลว์
    - คุณต้องใช้เอาต์พุต LLM ที่ผ่านการตรวจสอบความถูกต้องตามสคีมาสำหรับการทำงานอัตโนมัติ
summary: งาน LLM แบบ JSON เท่านั้นสำหรับเวิร์กโฟลว์ (เครื่องมือ Plugin แบบไม่บังคับ)
title: งาน LLM
x-i18n:
    generated_at: "2026-05-07T13:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4f5efe399165e31a7f5966b93c2f83bced4fd96b7f04f5156412fd321bf5f403
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` เป็น **เครื่องมือ Plugin แบบไม่บังคับ** ที่รันงาน LLM แบบ JSON เท่านั้น และ
ส่งคืนเอาต์พุตแบบมีโครงสร้าง (เลือกตรวจสอบกับ JSON Schema ได้)

เหมาะสำหรับเอนจินเวิร์กโฟลว์อย่าง Lobster: คุณสามารถเพิ่มขั้นตอน LLM เดียวได้
โดยไม่ต้องเขียนโค้ด OpenClaw แบบกำหนดเองสำหรับแต่ละเวิร์กโฟลว์

## เปิดใช้งาน Plugin

1. เปิดใช้งาน Plugin:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  }
}
```

2. อนุญาตเครื่องมือแบบไม่บังคับ:

```json
{
  "tools": {
    "alsoAllow": ["llm-task"]
  }
}
```

ใช้ `tools.allow` เฉพาะเมื่อคุณต้องการโหมดรายการอนุญาตแบบจำกัดเท่านั้น

## การกำหนดค่า (ไม่บังคับ)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai-codex",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.4"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` คือรายการอนุญาตของสตริง `provider/model` หากตั้งค่าไว้ คำขอใดๆ
ที่อยู่นอกรายการจะถูกปฏิเสธ

## พารามิเตอร์ของเครื่องมือ

- `prompt` (สตริง, จำเป็น)
- `input` (ค่าใดก็ได้, ไม่บังคับ)
- `schema` (อ็อบเจกต์, JSON Schema แบบไม่บังคับ)
- `provider` (สตริง, ไม่บังคับ)
- `model` (สตริง, ไม่บังคับ)
- `thinking` (สตริง, ไม่บังคับ)
- `authProfileId` (สตริง, ไม่บังคับ)
- `temperature` (ตัวเลข, ไม่บังคับ)
- `maxTokens` (ตัวเลข, ไม่บังคับ)
- `timeoutMs` (ตัวเลข, ไม่บังคับ)

`thinking` รองรับค่าที่ตั้งไว้ล่วงหน้าสำหรับการให้เหตุผลมาตรฐานของ OpenClaw เช่น `low` หรือ `medium`

## เอาต์พุต

ส่งคืน `details.json` ที่มี JSON ที่แยกวิเคราะห์แล้ว (และตรวจสอบกับ
`schema` เมื่อระบุไว้)

## ตัวอย่าง: ขั้นตอนเวิร์กโฟลว์ของ Lobster

### ข้อจำกัดสำคัญ

ตัวอย่างด้านล่างสมมติว่า **Lobster CLI แบบสแตนด์อโลน** กำลังทำงานในสภาพแวดล้อมที่ `openclaw.invoke` มี URL/บริบทการยืนยันตัวตนของ Gateway ที่ถูกต้องอยู่แล้ว

สำหรับตัวรัน Lobster แบบ **ฝังตัว** ที่รวมอยู่ใน OpenClaw รูปแบบ CLI ซ้อนนี้ **ยังไม่น่าเชื่อถือในปัจจุบัน**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

จนกว่า Lobster แบบฝังตัวจะมีบริดจ์ที่รองรับสำหรับโฟลว์นี้ ให้เลือกใช้อย่างใดอย่างหนึ่งต่อไปนี้:

- การเรียกใช้เครื่องมือ `llm-task` โดยตรงนอก Lobster หรือ
- ขั้นตอนของ Lobster ที่ไม่พึ่งพาการเรียก `openclaw.invoke` แบบซ้อน

ตัวอย่าง Lobster CLI แบบสแตนด์อโลน:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": {
    "subject": "Hello",
    "body": "Can you help?"
  },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

## หมายเหตุด้านความปลอดภัย

- เครื่องมือนี้เป็นแบบ **JSON เท่านั้น** และสั่งให้โมเดลส่งออกเฉพาะ JSON (ไม่มี
  code fences ไม่มีคำอธิบายประกอบ)
- ไม่มีเครื่องมือใดถูกเปิดให้โมเดลใช้สำหรับการรันนี้
- ถือว่าเอาต์พุตไม่น่าเชื่อถือ เว้นแต่คุณจะตรวจสอบด้วย `schema`
- ใส่การอนุมัติไว้ก่อนขั้นตอนใดๆ ที่มีผลข้างเคียง (ส่ง, โพสต์, exec)

## ที่เกี่ยวข้อง

- [ระดับการคิด](/th/tools/thinking)
- [Sub-agents](/th/tools/subagents)
- [คำสั่ง Slash](/th/tools/slash-commands)
