---
read_when:
    - คุณต้องการเปิดใช้งานหรือกำหนดค่า code_execution
    - คุณต้องการการวิเคราะห์จากระยะไกลโดยไม่ต้องเข้าถึงเชลล์ภายในเครื่อง
    - คุณต้องการผสาน x_search หรือ web_search เข้ากับการวิเคราะห์ด้วย Python ระยะไกล
summary: 'code_execution: เรียกใช้การวิเคราะห์ Python ระยะไกลในแซนด์บ็อกซ์ด้วย xAI'
title: การเรียกใช้โค้ด
x-i18n:
    generated_at: "2026-07-12T16:50:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1ab391daed9154f113535e6d241c45d5c08c22abdc012148a9f0f2ae5ec548b3
    source_path: tools/code-execution.md
    workflow: 16
---

`code_execution` เรียกใช้การวิเคราะห์ด้วย Python แบบระยะไกลในแซนด์บ็อกซ์ผ่าน Responses API ของ xAI
(`https://api.x.ai/v1/responses` ซึ่งเป็นปลายทางเดียวกับที่ `x_search` ใช้) เครื่องมือนี้
ลงทะเบียนโดย Plugin `xai` ที่รวมมาให้ภายใต้สัญญา `tools`

<Warning>
  `code_execution` ทำงานบนเซิร์ฟเวอร์ของ xAI โดย xAI คิดค่าบริการ $5 ต่อการเรียกใช้เครื่องมือ 1,000 ครั้ง
  รวมถึงโทเค็นอินพุตและเอาต์พุตของโมเดล
</Warning>

| คุณสมบัติ           | ค่า                                                                             |
| ------------------ | --------------------------------------------------------------------------------- |
| ชื่อเครื่องมือ          | `code_execution`                                                                  |
| Plugin ผู้ให้บริการ    | `xai` (รวมมาให้, `enabledByDefault: true`)                                         |
| การยืนยันตัวตน               | โปรไฟล์การยืนยันตัวตน xAI, `XAI_API_KEY` หรือ `plugins.entries.xai.config.webSearch.apiKey` |
| โมเดลเริ่มต้น      | `grok-4.3`                                                                        |
| ระยะหมดเวลาเริ่มต้น    | 30 วินาที                                                                        |
| `maxTurns` เริ่มต้น | ไม่ได้กำหนด (xAI ใช้ขีดจำกัดภายในของตนเอง)                                        |

ใช้เครื่องมือนี้สำหรับการคำนวณ การจัดข้อมูลเป็นตาราง สถิติอย่างรวดเร็ว และการวิเคราะห์
ในรูปแบบแผนภูมิ รวมถึงข้อมูลที่ส่งคืนโดย `x_search` หรือ `web_search` เครื่องมือนี้ไม่สามารถ
เข้าถึงไฟล์ในเครื่อง เชลล์ของคุณ ที่เก็บโค้ดของคุณ หรืออุปกรณ์ที่จับคู่ไว้ และจะไม่
เก็บสถานะระหว่างการเรียกใช้ ดังนั้นให้ถือว่าการเรียกใช้แต่ละครั้งเป็นการวิเคราะห์ชั่วคราว ไม่ใช่
เซสชันสมุดบันทึก สำหรับข้อมูล X ล่าสุด ให้เรียกใช้ [`x_search`](/th/tools/web#x_search)
ก่อน แล้วส่งผลลัพธ์ต่อเข้าไป

สำหรับการดำเนินการในเครื่อง ให้ใช้ [`exec`](/th/tools/exec) แทน

## การตั้งค่า

<Steps>
  <Step title="Provide xAI credentials">
    OAuth ต้องใช้การสมัครสมาชิก SuperGrok หรือ X Premium ที่มีสิทธิ์
    (ยืนยันด้วยรหัสอุปกรณ์ จึงใช้งานจากโฮสต์ระยะไกลได้โดยไม่ต้องมี
    การเรียกกลับไปยัง localhost):

    ```bash
    openclaw models auth login --provider xai --method oauth
    ```

    ระหว่างการติดตั้งใหม่ ตัวเลือกเดียวกันนี้มีให้ในขั้นตอนเริ่มต้นใช้งาน:

    ```bash
    openclaw onboard --install-daemon --auth-choice xai-oauth
    ```

    หรือใช้คีย์ API:

    ```bash
    openclaw models auth login --provider xai --method api-key
    export XAI_API_KEY=xai-...
    ```

    หรือผ่านการกำหนดค่า:

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

    ทั้งสามวิธีนี้ยังใช้กับ `x_search` และ `web_search` ของ Grok ได้ด้วย

  </Step>

  <Step title="Enable and tune code_execution">
    เมื่อไม่ระบุ `enabled` ระบบจะแสดง `code_execution` เฉพาะเมื่อผู้ให้บริการของ
    โมเดลที่ใช้งานอยู่คือ `xai` และสามารถระบุข้อมูลประจำตัว xAI ได้ สำหรับโมเดลที่ใช้งานอยู่
    ซึ่งมีผู้ให้บริการที่ทราบแน่ชัดว่าไม่ใช่ xAI ให้ตั้งค่า
    `plugins.entries.xai.config.codeExecution.enabled` เป็น `true` เพื่อเลือกใช้
    ข้ามผู้ให้บริการ หากไม่มีหรือไม่สามารถระบุผู้ให้บริการของโมเดลที่ใช้งานอยู่ได้
    เครื่องมือจะยังคงถูกซ่อน ตั้งค่า `enabled` เป็น `false` เพื่อปิดใช้งานสำหรับ
    ผู้ให้บริการทุกราย จำเป็นต้องมีข้อมูลประจำตัว xAI เสมอ

    ใช้บล็อกเดียวกันนี้เพื่อแทนที่โมเดล ขีดจำกัดรอบ หรือระยะหมดเวลา:

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true, // required for a known non-xAI model provider
                model: "grok-4.3", // override the default xAI code-execution model
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

  <Step title="Restart the Gateway">
    ```bash
    openclaw gateway restart
    ```

    `code_execution` จะปรากฏในรายการเครื่องมือของเอเจนต์เมื่อ Plugin xAI
    ลงทะเบียนใหม่ และผ่านการตรวจสอบผู้ให้บริการ การเปิดใช้งาน และการยืนยันตัวตนข้างต้น

  </Step>
</Steps>

## วิธีใช้งาน

ระบุเจตนาของการวิเคราะห์ให้ชัดเจน เครื่องมือรับพารามิเตอร์ `task` เพียงรายการเดียว
ดังนั้นให้ส่งคำขอทั้งหมดและข้อมูลแบบอินไลน์ในพรอมต์เดียว:

```text
Use code_execution to calculate the 7-day moving average for these numbers: ...
```

```text
Use x_search to find posts mentioning OpenClaw this week, then use code_execution to count them by day.
```

```text
Use web_search to gather the latest AI benchmark numbers, then use code_execution to compare percent changes.
```

## ข้อผิดพลาด

หากไม่มีการยืนยันตัวตน เครื่องมือจะส่งคืนข้อผิดพลาด JSON ที่มีโครงสร้าง (ไม่ใช่ข้อยกเว้น
ที่ถูกโยนออกมา) เพื่อให้เอเจนต์สามารถแก้ไขได้ด้วยตนเอง:

```json
{
  "error": "missing_xai_api_key",
  "message": "code_execution needs xAI credentials. Run `openclaw onboard --auth-choice xai-oauth` to sign in with Grok, run `openclaw onboard --auth-choice xai-api-key`, set `XAI_API_KEY` in the Gateway environment, or configure `plugins.entries.xai.config.webSearch.apiKey`.",
  "docs": "https://docs.openclaw.ai/tools/code-execution"
}
```

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Exec tool" href="/th/tools/exec" icon="terminal">
    เรียกใช้เชลล์ในเครื่องของคุณหรือ Node ที่จับคู่ไว้
  </Card>
  <Card title="Exec approvals" href="/th/tools/exec-approvals" icon="shield">
    นโยบายอนุญาตหรือปฏิเสธการเรียกใช้เชลล์
  </Card>
  <Card title="Web tools" href="/th/tools/web" icon="globe">
    `web_search`, `x_search` และ `web_fetch`
  </Card>
  <Card title="xAI provider" href="/th/providers/xai" icon="microchip">
    โมเดล Grok การค้นหาเว็บ/X และการกำหนดค่าการเรียกใช้โค้ด
  </Card>
</CardGroup>
