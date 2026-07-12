---
read_when:
    - คุณต้องการใช้โมเดล Z.AI / GLM ใน OpenClaw
    - คุณต้องตั้งค่า `ZAI_API_KEY` แบบง่าย ๆ
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-12T16:40:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ab29149da39cbf82fe041ea5932a860c461320e14bf26f83f69060d7ae0ae00a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI คือแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยให้บริการ REST API สำหรับ GLM และ
ใช้คีย์ API สำหรับการยืนยันตัวตน สร้างคีย์ API ของคุณในคอนโซล Z.AI
OpenClaw ใช้ผู้ให้บริการ `zai` ร่วมกับคีย์ API ของ Z.AI

| คุณสมบัติ | ค่า                                           |
| -------- | -------------------------------------------- |
| ผู้ให้บริการ | `zai`                                        |
| แพ็กเกจ  | `@openclaw/zai-provider`                     |
| การยืนยันตัวตน | `ZAI_API_KEY` (นามแฝงเดิม: `Z_AI_API_KEY`) |
| API      | การเติมข้อความสนทนาของ Z.AI (การยืนยันตัวตนแบบ Bearer) |

## โมเดล GLM

GLM เป็นตระกูลโมเดล ไม่ใช่ผู้ให้บริการแยกต่างหาก ใน OpenClaw โมเดล GLM ใช้
การอ้างอิง เช่น `zai/glm-5.2`: ผู้ให้บริการ `zai`, รหัสโมเดล `glm-5.2`

## เริ่มต้นใช้งาน

ติดตั้ง Plugin ของผู้ให้บริการก่อน:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจสอบเอ็นด์พอยต์ Z.AI ที่รองรับด้วยคีย์ API ของคุณ และใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ

    <Steps>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Explicit regional endpoint">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้ Coding Plan หรือพื้นผิว API ทั่วไปแบบเฉพาะเจาะจง

    <Steps>
      <Step title="Pick the right onboarding choice">
        ```bash
        # Coding Plan Global (recommended for Coding Plan users)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (China region)
        openclaw onboard --auth-choice zai-coding-cn

        # General API
        openclaw onboard --auth-choice zai-global

        # General API CN (China region)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verify the model is listed">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### เอ็นด์พอยต์

| ตัวเลือกการเริ่มต้นใช้งาน | URL ฐาน                                      | โมเดลเริ่มต้น |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` จะตรวจหาเอ็นด์พอยต์หนึ่งในสี่รายการนี้โดยอัตโนมัติ ด้วยการทดสอบคีย์ของคุณกับ API
การเติมข้อความสนทนาของแต่ละเอ็นด์พอยต์ โดยตรวจสอบเอ็นด์พอยต์ทั่วไป (`zai-global`
จากนั้น `zai-cn`) ก่อนเอ็นด์พอยต์ Coding Plan (`zai-coding-global` จากนั้น
`zai-coding-cn`) และหยุดที่เอ็นด์พอยต์แรกที่ยอมรับคำขอ
ใช้ `--auth-choice` แบบระบุชัดเจนเพื่อบังคับใช้เอ็นด์พอยต์ Coding Plan หากคีย์ของคุณ
ใช้งานได้กับทั้งสองประเภท

## ตัวอย่างการกำหนดค่า

<Tip>
`zai-api-key` ช่วยให้ OpenClaw ตรวจหาเอ็นด์พอยต์ Z.AI ที่ตรงกับคีย์และ
ใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ ใช้ตัวเลือกภูมิภาคแบบระบุชัดเจนเมื่อ
คุณต้องการบังคับใช้ Coding Plan หรือพื้นผิว API ทั่วไปแบบเฉพาะเจาะจง
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // GLM-5.2 uses the Coding Plan endpoint.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## แค็ตตาล็อกในตัว

Plugin ผู้ให้บริการ `zai` มาพร้อมแค็ตตาล็อกในไฟล์ประกาศของ Plugin ดังนั้นการแสดงรายการ
แบบอ่านอย่างเดียวจึงสามารถแสดงแถว GLM ที่รู้จักได้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ:

```bash
openclaw models list --all --provider zai
```

ปัจจุบันแค็ตตาล็อกที่อ้างอิงจากไฟล์ประกาศประกอบด้วย:

| การอ้างอิงโมเดล       | หมายเหตุ                        |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | ค่าเริ่มต้นของ Coding Plan; บริบท 1M |
| `zai/glm-5.1`        | ค่าเริ่มต้นของ API ทั่วไป       |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
โมเดล GLM พร้อมใช้งานในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`)
</Tip>

<Note>
การตั้งค่า Coding Plan ใช้ `zai/glm-5.2` เป็นค่าเริ่มต้น ส่วนการตั้งค่า API ทั่วไปยังคงใช้
`zai/glm-5.1` บนเอ็นด์พอยต์ Coding Plan การตรวจหาอัตโนมัติจะถอยไปใช้
`glm-5.1` และจากนั้น `glm-4.7` เมื่อคีย์หรือแผนไม่เปิดให้ใช้ GLM-5.2 เวอร์ชัน
และความพร้อมใช้งานของ GLM อาจเปลี่ยนแปลงได้ ให้เรียกใช้ `openclaw models list --all --provider zai`
เพื่อดูแค็ตตาล็อกที่เวอร์ชันซึ่งติดตั้งอยู่รู้จัก
</Note>

## ระดับการคิด

<Tabs>
  <Tab title="GLM-5.2">
    ช่วงทั้งหมด: `off`, `low`, `high`, `max` (ค่าเริ่มต้นคือ `off`) OpenClaw จะแมป
    `low` และ `high` ไปยังระดับความพยายามในการให้เหตุผล `high` ของ Z.AI และแมป `max` ไปยัง
    ระดับความพยายาม `max` ของ Z.AI ผ่าน `reasoning_effort` ในเพย์โหลดคำขอ
  </Tab>
  <Tab title="Other GLM models">
    สลับได้เพียงสองค่า: `off` และ `low` (แสดงเป็น `on` ในตัวเลือก) โดยค่าเริ่มต้นคือ
    `off` การตั้งค่าการคิดเป็น `off` จะส่ง `thinking: { type: "disabled" }`;
    ระดับอื่นทั้งหมดจะไม่แก้ไขเพย์โหลดคำขอ (ใช้พฤติกรรมการให้เหตุผลเริ่มต้น
    ของ Z.AI)
  </Tab>
</Tabs>

การตั้งค่าการคิดเป็น `off` ช่วยหลีกเลี่ยงการตอบกลับที่ใช้โควตาผลลัพธ์ไปกับ
`reasoning_content` ก่อนข้อความที่มองเห็นได้

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    รหัส `glm-5*` ที่ไม่รู้จักยังคงแก้ไขการอ้างอิงแบบส่งต่อในเส้นทางของผู้ให้บริการได้ โดย
    สร้างเมทาดาทาที่ผู้ให้บริการเป็นเจ้าของจากแม่แบบ `glm-4.7` เมื่อรหัส
    ตรงกับรูปแบบปัจจุบันของตระกูล GLM-5
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` เปิดใช้งานเป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกใช้เครื่องมือของ Z.AI หากต้องการปิดใช้งาน:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Preserved thinking">
    การเก็บรักษาการคิดเป็นคุณสมบัติที่ต้องเลือกเปิดใช้ เนื่องจาก Z.AI กำหนดให้ส่ง
    `reasoning_content` ในประวัติทั้งหมดซ้ำ ซึ่งเพิ่มจำนวนโทเค็นของพรอมต์ เปิดใช้งาน
    แยกตามโมเดล:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    เมื่อเปิดใช้งานและเปิดการคิดอยู่ OpenClaw จะส่ง
    `thinking: { type: "enabled", clear_thinking: false }` และส่ง
    `reasoning_content` ก่อนหน้าซ้ำสำหรับทรานสคริปต์เดียวกันที่เข้ากันได้กับ OpenAI คีย์พารามิเตอร์แบบ snake_case
    `preserve_thinking` ใช้งานเป็นนามแฝงได้

    ผู้ใช้ขั้นสูงยังคงสามารถเขียนทับเพย์โหลดของผู้ให้บริการแบบเจาะจงได้ด้วย
    `params.extra_body.thinking`

  </Accordion>

  <Accordion title="Image understanding">
    Plugin Z.AI ลงทะเบียนความสามารถในการทำความเข้าใจภาพ

    | คุณสมบัติ    | ค่า         |
    | ------------- | ----------- |
    | โมเดล        | `glm-4.6v`  |

    ระบบจะแก้ไขการอ้างอิงความสามารถในการทำความเข้าใจภาพโดยอัตโนมัติจากการยืนยันตัวตน Z.AI ที่กำหนดค่าไว้ โดยไม่
    ต้องกำหนดค่าเพิ่มเติม

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI ใช้การยืนยันตัวตนแบบ Bearer ด้วยคีย์ API ของคุณ
    - ตัวเลือกการเริ่มต้นใช้งาน `zai-api-key` จะตรวจหาเอ็นด์พอยต์ Z.AI ที่ตรงกันโดยอัตโนมัติ ด้วยการทดสอบเอ็นด์พอยต์ที่รองรับด้วยคีย์ของคุณ
    - ใช้ตัวเลือกภูมิภาคแบบระบุชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อต้องการบังคับใช้พื้นผิว API แบบเฉพาะเจาะจง
    - ตัวแปรสภาพแวดล้อมเดิม `Z_AI_API_KEY` ยังคงได้รับการยอมรับ โดย OpenClaw จะคัดลอกค่าไปยัง `ZAI_API_KEY` เมื่อเริ่มต้นระบบ หากยังไม่ได้ตั้งค่า `ZAI_API_KEY`

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรมการสลับไปใช้ระบบสำรอง
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่า OpenClaw ฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการและโมเดล
  </Card>
</CardGroup>
