---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า code_execution
    - คุณต้องการการวิเคราะห์ระยะไกลโดยไม่ต้องมีสิทธิ์เข้าถึงเชลล์ในเครื่อง
    - คุณต้องการรวม x_search หรือ web_search เข้ากับการวิเคราะห์ Python ระยะไกล
summary: 'code_execution: เรียกใช้การวิเคราะห์ Python ระยะไกลในแซนด์บ็อกซ์ด้วย xAI'
title: การเรียกใช้โค้ด
x-i18n:
    generated_at: "2026-06-27T18:25:56Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d510d0d2b41deab527d456e675a23ef80ac3b55b5f01906ba2c43d90e4452e36
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` เรียกใช้การวิเคราะห์ Python ระยะไกลแบบ sandbox บน Responses API ของ xAI เครื่องมือนี้ลงทะเบียนโดยปลั๊กอิน `xai` ที่บันเดิลมาให้ (ภายใต้สัญญา `tools`) และส่งคำขอไปยัง endpoint เดียวกันคือ `https://api.x.ai/v1/responses` ที่ `x_search` ใช้

| คุณสมบัติ             | ค่า                                                                                 |
| ------------------ | --------------------------------------------------------------------------------- |
| ชื่อเครื่องมือ          | `code_execution`                                                                  |
| ปลั๊กอินผู้ให้บริการ      | `xai` (บันเดิลมาให้, `enabledByDefault: true`)                                      |
| การยืนยันตัวตน          | โปรไฟล์ยืนยันตัวตน xAI, `XAI_API_KEY`, หรือ `plugins.entries.xai.config.webSearch.apiKey` |
| โมเดลเริ่มต้น          | `grok-4-1-fast`                                                                   |
| timeout เริ่มต้น      | 30 วินาที                                                                          |
| `maxTurns` เริ่มต้น | ไม่ได้ตั้งค่า (xAI ใช้ขีดจำกัดภายในของตัวเอง)                                      |

สิ่งนี้แตกต่างจาก [`exec`](/th/tools/exec) แบบ local:

- `exec` เรียกใช้คำสั่ง shell บนเครื่องของคุณหรือโหนดที่จับคู่ไว้
- `code_execution` เรียกใช้ Python ใน sandbox ระยะไกลของ xAI

ใช้ `code_execution` สำหรับ:

- การคำนวณ
- การจัดทำตาราง
- สถิติด่วน
- การวิเคราะห์แบบแผนภูมิ
- การวิเคราะห์ข้อมูลที่ได้จาก `x_search` หรือ `web_search`

อย่าใช้เครื่องมือนี้เมื่อคุณต้องการไฟล์ local, shell ของคุณ, repo ของคุณ หรืออุปกรณ์ที่จับคู่ไว้ ให้ใช้ [`exec`](/th/tools/exec) สำหรับกรณีนั้น

## การตั้งค่า

<Steps>
  <Step title="ระบุข้อมูลรับรอง xAI">
    ลงชื่อเข้าใช้ด้วย Grok OAuth โดยใช้การสมัครใช้งาน SuperGrok หรือ X Premium ที่มีสิทธิ์
    หรือจัดเก็บ API key xAI OAuth ใช้การตรวจสอบยืนยันแบบ device-code จึงทำงานได้
    จากโฮสต์ระยะไกลโดยไม่ต้องมี localhost callback OAuth ใช้ได้กับ
    `code_execution` และ `x_search`; `XAI_API_KEY` หรือ config web-search ของปลั๊กอิน
    ยังสามารถขับเคลื่อน Grok `web_search` ได้ด้วย

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    ระหว่างการติดตั้งใหม่ ตัวเลือกการยืนยันตัวตนเดียวกันจะมีให้ใช้งานภายใน
    onboarding:

    ```bash
    openclaw onboard --install-daemon
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    หรือใช้ API key:

    ```bash
    openclaw models auth login --provider xai --method api-key
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

  <Step title="เปิดใช้และปรับแต่ง code_execution">
    `code_execution` จะพร้อมใช้งานเมื่อมีข้อมูลรับรอง xAI ตั้งค่า
    `plugins.entries.xai.config.codeExecution.enabled` เป็น `false` เพื่อปิดใช้
    หรือใช้บล็อกเดียวกันเพื่อปรับแต่งโมเดลและ timeout

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

    `code_execution` จะแสดงในรายการเครื่องมือของ agent เมื่อปลั๊กอิน xAI ลงทะเบียนใหม่ด้วย `enabled: true`

  </Step>
</Steps>

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

เครื่องมือนี้รับพารามิเตอร์ `task` เพียงตัวเดียวภายใน ดังนั้น agent ควรส่งคำขอวิเคราะห์แบบเต็มและข้อมูล inline ใด ๆ ใน prompt เดียว

## ข้อผิดพลาด

เมื่อเครื่องมือทำงานโดยไม่มีการยืนยันตัวตน เครื่องมือจะคืนข้อผิดพลาด `missing_xai_api_key` แบบมีโครงสร้าง ซึ่งชี้ไปที่ตัวเลือก auth-profile, env var และ config ข้อผิดพลาดเป็น JSON ไม่ใช่ exception ที่ถูก throw ดังนั้น agent จึงแก้ไขเองได้:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## ขีดจำกัด

- นี่คือการประมวลผลระยะไกลของ xAI ไม่ใช่การประมวลผล process แบบ local
- ให้ถือผลลัพธ์เป็นการวิเคราะห์ชั่วคราว ไม่ใช่ session notebook แบบถาวร
- อย่าถือว่ามีสิทธิ์เข้าถึงไฟล์ local หรือ workspace ของคุณ
- สำหรับข้อมูล X สดใหม่ ให้ใช้ [`x_search`](/th/tools/web#x_search) ก่อน แล้วส่งผลลัพธ์เข้าไปยัง `code_execution`

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="เครื่องมือ Exec" href="/th/tools/exec" icon="terminal">
    การเรียกใช้ shell แบบ local บนเครื่องของคุณหรือโหนดที่จับคู่ไว้
  </Card>
  <Card title="การอนุมัติ Exec" href="/th/tools/exec-approvals" icon="shield">
    นโยบายอนุญาต/ปฏิเสธสำหรับการเรียกใช้ shell
  </Card>
  <Card title="เครื่องมือเว็บ" href="/th/tools/web" icon="globe">
    `web_search`, `x_search`, และ `web_fetch`
  </Card>
  <Card title="ผู้ให้บริการ xAI" href="/th/providers/xai" icon="microchip">
    โมเดล Grok, การค้นหา web/x และ config การเรียกใช้ code
  </Card>
</CardGroup>
