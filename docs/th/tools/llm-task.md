---
read_when:
    - คุณต้องการขั้นตอน LLM ที่ส่งออกเฉพาะ JSON ภายในเวิร์กโฟลว์
    - คุณต้องการเอาต์พุต LLM ที่ตรวจสอบด้วยสคีมาสำหรับระบบอัตโนมัติ
summary: งาน LLM แบบ JSON เท่านั้นสำหรับเวิร์กโฟลว์ (เครื่องมือ Plugin แบบไม่บังคับ)
title: งานของ LLM
x-i18n:
    generated_at: "2026-06-27T18:29:04Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab83202bd0954a948c933c80de17385eb385573b8e3974dba41ff876f91c3ddb
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` เป็น **เครื่องมือ Plugin แบบไม่บังคับ** ที่รันงาน LLM แบบเฉพาะ JSON และ
ส่งคืนเอาต์พุตแบบมีโครงสร้าง (เลือกตรวจสอบความถูกต้องกับ JSON Schema ได้)

เหมาะสำหรับเอนจินเวิร์กโฟลว์อย่าง Lobster: คุณสามารถเพิ่มขั้นตอน LLM เพียงขั้นตอนเดียว
โดยไม่ต้องเขียนโค้ด OpenClaw แบบกำหนดเองสำหรับแต่ละเวิร์กโฟลว์

## เปิดใช้ Plugin

1. เปิดใช้ Plugin:

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

ใช้ `tools.allow` เฉพาะเมื่อคุณต้องการโหมดรายการอนุญาตแบบจำกัด

## การกำหนดค่า (ไม่บังคับ)

```json
{
  "plugins": {
    "entries": {
      "llm-task": {
        "enabled": true,
        "config": {
          "defaultProvider": "openai",
          "defaultModel": "gpt-5.5",
          "defaultAuthProfileId": "main",
          "allowedModels": ["openai/gpt-5.5"],
          "maxTokens": 800,
          "timeoutMs": 30000
        }
      }
    }
  }
}
```

`allowedModels` คือรายการอนุญาตของสตริง `provider/model` หากตั้งค่าไว้ คำขอใดก็ตาม
ที่อยู่นอกรายการจะถูกปฏิเสธ

## พารามิเตอร์ของเครื่องมือ

- `prompt` (สตริง, จำเป็น)
- `input` (ใด ๆ, ไม่บังคับ)
- `schema` (อ็อบเจกต์, JSON Schema ไม่บังคับ)
- `provider` (สตริง, ไม่บังคับ)
- `model` (สตริง, ไม่บังคับ)
- `thinking` (สตริง, ไม่บังคับ)
- `authProfileId` (สตริง, ไม่บังคับ)
- `temperature` (ตัวเลข, ไม่บังคับ)
- `maxTokens` (ตัวเลข, ไม่บังคับ)
- `timeoutMs` (ตัวเลข, ไม่บังคับ)

`thinking` รับพรีเซ็ตการให้เหตุผลมาตรฐานของ OpenClaw เช่น `low` หรือ `medium`

## เอาต์พุต

ส่งคืน `details.json` ที่มี JSON ที่แยกวิเคราะห์แล้ว (และตรวจสอบความถูกต้องกับ
`schema` เมื่อระบุไว้)

## ตัวอย่าง: ขั้นตอนเวิร์กโฟลว์ Lobster

### ข้อจำกัดสำคัญ

ตัวอย่างด้านล่างถือว่า **Lobster CLI แบบสแตนด์อโลน** กำลังรันอยู่ในสภาพแวดล้อมที่ `openclaw.invoke` มี URL ของ Gateway และบริบทการยืนยันตัวตนที่ถูกต้องอยู่แล้ว

สำหรับตัวรัน Lobster แบบ **ฝังในตัว** ที่มาพร้อม OpenClaw รูปแบบ CLI ซ้อนนี้ **ยังไม่น่าเชื่อถือในปัจจุบัน**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

จนกว่า Lobster แบบฝังในตัวจะมีบริดจ์ที่รองรับสำหรับโฟลว์นี้ ให้เลือกใช้อย่างใดอย่างหนึ่งต่อไปนี้:

- เรียกเครื่องมือ `llm-task` โดยตรงนอก Lobster หรือ
- ขั้นตอน Lobster ที่ไม่พึ่งพาการเรียก `openclaw.invoke` แบบซ้อน

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

- เครื่องมือนี้เป็นแบบ **เฉพาะ JSON** และสั่งให้โมเดลส่งออกเฉพาะ JSON (ไม่มี
  code fences ไม่มีคำอธิบายประกอบ)
- ไม่มีเครื่องมือใดถูกเปิดเผยให้โมเดลใช้สำหรับการรันนี้
- ถือว่าเอาต์พุตไม่น่าเชื่อถือ เว้นแต่คุณจะตรวจสอบความถูกต้องด้วย `schema`
- ใส่การอนุมัติก่อนขั้นตอนใด ๆ ที่มีผลข้างเคียง (ส่ง โพสต์ exec)

## ที่เกี่ยวข้อง

- [ระดับการคิด](/th/tools/thinking)
- [เอเจนต์ย่อย](/th/tools/subagents)
- [คำสั่ง Slash](/th/tools/slash-commands)
