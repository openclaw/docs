---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า code_execution
    - คุณต้องการการวิเคราะห์ระยะไกลโดยไม่มีสิทธิ์เข้าถึงเชลล์ในเครื่อง
    - คุณต้องการผสาน x_search หรือ web_search กับการวิเคราะห์ด้วย Python ระยะไกล
summary: 'code_execution: เรียกใช้การวิเคราะห์ Python ระยะไกลในสภาพแวดล้อม sandbox ด้วย xAI'
title: การเรียกใช้โค้ด
x-i18n:
    generated_at: "2026-05-06T09:33:05Z"
    model: gpt-5.5
    provider: openai
    source_hash: a37e921c0016a32b01558c255bc05fcf24146f363a022da87feb94f3d6d48527
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` รันการวิเคราะห์ Python ระยะไกลใน sandbox บน Responses API ของ xAI โดยลงทะเบียนผ่าน Plugin `xai` ที่มาพร้อมชุด (ภายใต้สัญญา `tools`) และส่งคำขอไปยัง endpoint เดียวกันคือ `https://api.x.ai/v1/responses` ที่ `x_search` ใช้

| คุณสมบัติ           | ค่า                                                          |
| ------------------ | -------------------------------------------------------------- |
| ชื่อเครื่องมือ          | `code_execution`                                               |
| Plugin ผู้ให้บริการ    | `xai` (มาพร้อมชุด, `enabledByDefault: true`)                      |
| การยืนยันตัวตน               | `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` |
| โมเดลเริ่มต้น      | `grok-4-1-fast`                                                |
| timeout เริ่มต้น    | 30 วินาที                                                     |
| `maxTurns` เริ่มต้น | ไม่ได้ตั้งค่า (xAI ใช้ขีดจำกัดภายในของตัวเอง)                     |

สิ่งนี้แตกต่างจาก [`exec`](/th/tools/exec) แบบ local:

- `exec` รันคำสั่ง shell บนเครื่องของคุณหรือโหนดที่จับคู่ไว้
- `code_execution` รัน Python ใน sandbox ระยะไกลของ xAI

ใช้ `code_execution` สำหรับ:

- การคำนวณ
- การจัดตาราง
- สถิติด่วน
- การวิเคราะห์แบบกราฟ
- การวิเคราะห์ข้อมูลที่ส่งกลับโดย `x_search` หรือ `web_search`

**อย่า** ใช้เมื่อคุณต้องการไฟล์ local, shell ของคุณ, repo ของคุณ หรืออุปกรณ์ที่จับคู่ไว้ ใช้ [`exec`](/th/tools/exec) สำหรับกรณีนั้น

## การตั้งค่า

<Steps>
  <Step title="ระบุคีย์ xAI API">
    ตั้งค่า `XAI_API_KEY` ในสภาพแวดล้อมของ Gateway หรือกำหนดค่าคีย์ภายใต้ Plugin xAI เพื่อให้ credential เดียวกันครอบคลุม `code_execution`, `x_search`, การค้นหาเว็บ และเครื่องมือ xAI อื่นๆ:

    ```bash
    export XAI_API_KEY=xai-...
    ```

    หรือผ่าน config:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              webSearch: {
                apiKey: "xai-...",
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="เปิดใช้งานและปรับแต่ง code_execution">
    เครื่องมือนี้ถูกควบคุมด้วย `plugins.entries.xai.config.codeExecution.enabled` ค่าเริ่มต้นคือปิด

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast", // override the default xAI code-execution model
                maxTurns: 2,            // optional cap on internal tool turns
                timeoutSeconds: 30,     // request timeout (default: 30)
              },
            },
          },
        },
      },
    }
    ```

  </Step>

  <Step title="รีสตาร์ท Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` จะแสดงในรายการเครื่องมือของ agent เมื่อ Plugin xAI ลงทะเบียนใหม่ด้วย `enabled: true`

  </Step>
</Steps>

## วิธีใช้งาน

ถามด้วยภาษาธรรมชาติและระบุเจตนาการวิเคราะห์ให้ชัดเจน:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

เครื่องมือนี้รับพารามิเตอร์ `task` เพียงตัวเดียวภายใน ดังนั้น agent ควรส่งคำขอวิเคราะห์ทั้งหมดและข้อมูล inline ใดๆ ใน prompt เดียว

## ข้อผิดพลาด

เมื่อเครื่องมือรันโดยไม่มีการยืนยันตัวตน จะส่งกลับข้อผิดพลาด `missing_xai_api_key` แบบมีโครงสร้างที่ชี้ไปยัง env var และเส้นทาง config ข้อผิดพลาดนี้เป็น JSON ไม่ใช่ exception ที่ถูก throw ดังนั้น agent จึงแก้ไขได้เอง:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs an xAI API key. Set XAI_API_KEY in the Gateway environment, or configure plugins.entries.xai.config.webSearch.apiKey.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## ขีดจำกัด

- นี่คือการประมวลผลระยะไกลของ xAI ไม่ใช่การประมวลผลโปรเซส local
- ให้ถือว่าผลลัพธ์เป็นการวิเคราะห์ชั่วคราว ไม่ใช่เซสชัน notebook แบบถาวร
- อย่าสันนิษฐานว่ามีสิทธิ์เข้าถึงไฟล์ local หรือ workspace ของคุณ
- สำหรับข้อมูล X ที่สดใหม่ ให้ใช้ [`x_search`](/th/tools/web#x_search) ก่อน แล้วส่งผลลัพธ์เข้า `code_execution`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือ Exec" href="/th/tools/exec" icon="terminal">
    การรัน shell แบบ local บนเครื่องของคุณหรือโหนดที่จับคู่ไว้
  </Card>
  <Card title="การอนุมัติ Exec" href="/th/tools/exec-approvals" icon="shield">
    นโยบายอนุญาต/ปฏิเสธสำหรับการรัน shell
  </Card>
  <Card title="เครื่องมือเว็บ" href="/th/tools/web" icon="globe">
    `web_search`, `x_search` และ `web_fetch`
  </Card>
  <Card title="ผู้ให้บริการ xAI" href="/th/providers/xai" icon="microchip">
    โมเดล Grok, การค้นหาเว็บ/X และ config การรันโค้ด
  </Card>
</CardGroup>
