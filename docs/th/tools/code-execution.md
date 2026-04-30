---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า code_execution
    - คุณต้องการการวิเคราะห์ระยะไกลโดยไม่มีสิทธิ์เข้าถึงเชลล์ภายในเครื่อง
    - คุณต้องการรวม x_search หรือ web_search เข้ากับการวิเคราะห์ Python ระยะไกล
summary: code_execution -- เรียกใช้การวิเคราะห์ Python ระยะไกลในแซนด์บ็อกซ์ด้วย xAI
title: การดำเนินการโค้ด
x-i18n:
    generated_at: "2026-04-30T10:19:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: fe635ec65aaf593a5bd63c139fbfc69e1ba3ea7c58c2bba639ec1ebd70dba1a9
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` เรียกใช้การวิเคราะห์ Python ระยะไกลแบบ sandboxed บน Responses API ของ xAI
ซึ่งต่างจาก [`exec`](/th/tools/exec) แบบ local:

- `exec` เรียกใช้คำสั่ง shell บนเครื่องหรือ Node ของคุณ
- `code_execution` เรียกใช้ Python ใน sandbox ระยะไกลของ xAI

ใช้ `code_execution` สำหรับ:

- การคำนวณ
- การจัดทำตาราง
- สถิติแบบรวดเร็ว
- การวิเคราะห์ในลักษณะแผนภูมิ
- การวิเคราะห์ข้อมูลที่ส่งกลับมาจาก `x_search` หรือ `web_search`

**อย่า** ใช้เมื่อต้องเข้าถึงไฟล์ local, shell ของคุณ, repo ของคุณ หรืออุปกรณ์ที่จับคู่ไว้
ให้ใช้ [`exec`](/th/tools/exec) สำหรับกรณีนั้น

## การตั้งค่า

คุณต้องมีคีย์ API ของ xAI รายการใดก็ได้ต่อไปนี้ใช้ได้:

- `XAI_API_KEY`
- `plugins.entries.xai.config.webSearch.apiKey`

ตัวอย่าง:

```json5
{
  plugins: {
    entries: {
      xai: {
        config: {
          webSearch: {
            apiKey: "xai-...",
          },
          codeExecution: {
            enabled: true,
            model: "grok-4-1-fast",
            maxTurns: 2,
            timeoutSeconds: 30,
          },
        },
      },
    },
  },
}
```

## วิธีใช้งาน

ถามอย่างเป็นธรรมชาติและระบุเจตนาการวิเคราะห์ให้ชัดเจน:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

เครื่องมือรับพารามิเตอร์ `task` เพียงรายการเดียวภายใน ดังนั้น agent ควรส่งคำขอวิเคราะห์ฉบับเต็ม
และข้อมูล inline ใดๆ ใน prompt เดียว

## ข้อจำกัด

- นี่คือการประมวลผลระยะไกลของ xAI ไม่ใช่การประมวลผล process แบบ local
- ควรมองว่าเป็นการวิเคราะห์ชั่วคราว ไม่ใช่ notebook แบบถาวร
- อย่าคาดว่าจะเข้าถึงไฟล์ local หรือ workspace ของคุณได้
- สำหรับข้อมูล X สดใหม่ ให้ใช้ [`x_search`](/th/tools/web#x_search) ก่อน

## ที่เกี่ยวข้อง

- [เครื่องมือ Exec](/th/tools/exec)
- [การอนุมัติ Exec](/th/tools/exec-approvals)
- [เครื่องมือ apply_patch](/th/tools/apply-patch)
- [เครื่องมือเว็บ](/th/tools/web)
- [xAI](/th/providers/xai)
