---
read_when:
    - คุณต้องการขั้นตอน LLM แบบ JSON เท่านั้นภายในเวิร์กโฟลว์
    - คุณต้องมีเอาต์พุตจาก LLM ที่ผ่านการตรวจสอบด้วยสคีมาสำหรับการทำงานอัตโนมัติ
summary: งาน LLM แบบ JSON เท่านั้นสำหรับเวิร์กโฟลว์ (เครื่องมือ Plugin ที่เลือกใช้ได้)
title: งาน LLM
x-i18n:
    generated_at: "2026-05-04T02:26:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9cdc5d4feef17fb6d6d90d819d4c92d26a4ec43e4f5364c6acbaad1934a89269
    source_path: tools/llm-task.md
    workflow: 16
---

`llm-task` เป็น **เครื่องมือ Plugin แบบไม่บังคับ** ที่เรียกใช้งาน LLM task แบบ JSON-only และ
คืนค่าเอาต์พุตที่มีโครงสร้าง (เลือกตรวจสอบกับ JSON Schema ได้)

เหมาะสำหรับเครื่องมือ workflow เช่น Lobster: คุณสามารถเพิ่มขั้นตอน LLM เพียงขั้นตอนเดียว
โดยไม่ต้องเขียนโค้ด OpenClaw แบบกำหนดเองสำหรับแต่ละ workflow

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

ใช้ `tools.allow` เฉพาะเมื่อคุณต้องการโหมด allowlist แบบจำกัดเท่านั้น

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

`allowedModels` คือ allowlist ของสตริง `provider/model` หากตั้งค่าไว้ คำขอใดๆ
ที่อยู่นอกรายการจะถูกปฏิเสธ

## พารามิเตอร์ของเครื่องมือ

- `prompt` (string, จำเป็น)
- `input` (any, ไม่บังคับ)
- `schema` (object, JSON Schema ไม่บังคับ)
- `provider` (string, ไม่บังคับ)
- `model` (string, ไม่บังคับ)
- `thinking` (string, ไม่บังคับ)
- `authProfileId` (string, ไม่บังคับ)
- `temperature` (number, ไม่บังคับ)
- `maxTokens` (number, ไม่บังคับ)
- `timeoutMs` (number, ไม่บังคับ)

`thinking` รองรับค่าที่ตั้งไว้ล่วงหน้าสำหรับการให้เหตุผลมาตรฐานของ OpenClaw เช่น `low` หรือ `medium`

## เอาต์พุต

คืนค่า `details.json` ที่มี JSON ที่แยกวิเคราะห์แล้ว (และตรวจสอบกับ
`schema` เมื่อระบุไว้)

## ตัวอย่าง: ขั้นตอน workflow ของ Lobster

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

- เครื่องมือนี้เป็น **JSON-only** และสั่งให้โมเดลส่งออกเฉพาะ JSON เท่านั้น (ไม่มี
  code fences ไม่มีคำอธิบายประกอบ)
- ไม่มีการเปิดเผยเครื่องมือใดๆ ให้โมเดลสำหรับการรันนี้
- ถือว่าเอาต์พุตไม่น่าเชื่อถือ เว้นแต่คุณจะตรวจสอบด้วย `schema`
- วางการอนุมัติไว้ก่อนขั้นตอนที่ก่อให้เกิดผลข้างเคียงใดๆ (ส่ง, โพสต์, exec)

## ที่เกี่ยวข้อง

- [ระดับ Thinking](/th/tools/thinking)
- [Sub-agents](/th/tools/subagents)
- [Slash commands](/th/tools/slash-commands)
