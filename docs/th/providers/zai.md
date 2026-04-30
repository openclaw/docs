---
read_when:
    - คุณต้องการใช้โมเดล Z.AI / GLM ใน OpenClaw
    - คุณต้องตั้งค่า ZAI_API_KEY แบบง่ายๆ
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-30T10:14:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0192797b9e023065a384b0428830e73877a5088d2c40c2190d5322273294607d
    source_path: providers/zai.md
    workflow: 16
---

Z.AI เป็นแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยมี REST APIs สำหรับ GLM และใช้ API keys
สำหรับการยืนยันตัวตน สร้าง API key ของคุณในคอนโซล Z.AI OpenClaw ใช้ผู้ให้บริการ `zai`
พร้อมกับ Z.AI API key

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="ตรวจหา endpoint อัตโนมัติ">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจหา endpoint ของ Z.AI ที่ตรงกับคีย์และใช้ base URL ที่ถูกต้องโดยอัตโนมัติ

    <Steps>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="endpoint ระดับภูมิภาคแบบระบุชัดเจน">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้ Coding Plan หรือพื้นผิว API ทั่วไปที่เฉพาะเจาะจง

    <Steps>
      <Step title="เลือกตัวเลือกการเริ่มต้นใช้งานที่ถูกต้อง">
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
      <Step title="ตั้งค่าโมเดลเริ่มต้น">
        ```json5
        {
          env: { ZAI_API_KEY: "sk-..." },
          agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
        }
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## แค็ตตาล็อกในตัว

ปัจจุบัน OpenClaw ตั้งต้นผู้ให้บริการ `zai` ที่รวมมาให้ด้วยรายการต่อไปนี้:

| อ้างอิงโมเดล         | หมายเหตุ        |
| -------------------- | --------------- |
| `zai/glm-5.1`        | โมเดลเริ่มต้น   |
| `zai/glm-5`          |                 |
| `zai/glm-5-turbo`    |                 |
| `zai/glm-5v-turbo`   |                 |
| `zai/glm-4.7`        |                 |
| `zai/glm-4.7-flash`  |                 |
| `zai/glm-4.7-flashx` |                 |
| `zai/glm-4.6`        |                 |
| `zai/glm-4.6v`       |                 |
| `zai/glm-4.5`        |                 |
| `zai/glm-4.5-air`    |                 |
| `zai/glm-4.5-flash`  |                 |
| `zai/glm-4.5v`       |                 |

<Tip>
โมเดล GLM พร้อมใช้งานในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`) อ้างอิงโมเดลเริ่มต้นที่รวมมาให้คือ `zai/glm-5.1`
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="แก้ไขโมเดล GLM-5 ที่ไม่รู้จักไปข้างหน้า">
    id `glm-5*` ที่ไม่รู้จักยังคงถูกแก้ไขไปข้างหน้าบนเส้นทางผู้ให้บริการที่รวมมาให้
    โดยสังเคราะห์เมทาดาทาที่ผู้ให้บริการเป็นเจ้าของจากเทมเพลต `glm-4.7` เมื่อ id
    ตรงกับรูปแบบตระกูล GLM-5 ปัจจุบัน
  </Accordion>

  <Accordion title="การสตรีมการเรียกเครื่องมือ">
    `tool_stream` เปิดใช้งานตามค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือของ Z.AI หากต้องการปิดใช้งาน:

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

  <Accordion title="การคิดและการคิดที่เก็บรักษาไว้">
    การคิดของ Z.AI ทำตามตัวควบคุม `/think` ของ OpenClaw เมื่อปิดการคิด
    OpenClaw จะส่ง `thinking: { type: "disabled" }` เพื่อหลีกเลี่ยงการตอบกลับที่
    ใช้งบประมาณเอาต์พุตไปกับ `reasoning_content` ก่อนข้อความที่มองเห็นได้

    การคิดที่เก็บรักษาไว้เป็นแบบ opt-in เพราะ Z.AI ต้องเล่นซ้ำ
    `reasoning_content` ในประวัติทั้งหมด ซึ่งเพิ่มจำนวนโทเค็นของพรอมป์ เปิดใช้งานได้
    ต่อโมเดล:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.1": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    เมื่อเปิดใช้งานและการคิดเปิดอยู่ OpenClaw จะส่ง
    `thinking: { type: "enabled", clear_thinking: false }` และเล่นซ้ำ
    `reasoning_content` ก่อนหน้าสำหรับทรานสคริปต์ที่เข้ากันได้กับ OpenAI เดียวกัน

    ผู้ใช้ขั้นสูงยังสามารถแทนที่ payload ของผู้ให้บริการแบบตรงตัวด้วย
    `params.extra_body.thinking` ได้

  </Accordion>

  <Accordion title="การทำความเข้าใจรูปภาพ">
    Plugin Z.AI ที่รวมมาให้ลงทะเบียนการทำความเข้าใจรูปภาพ

    | คุณสมบัติ     | ค่า         |
    | ------------- | ----------- |
    | โมเดล         | `glm-4.6v`  |

    การทำความเข้าใจรูปภาพจะถูกแก้ไขโดยอัตโนมัติจากการยืนยันตัวตน Z.AI ที่กำหนดค่าไว้ โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติม

  </Accordion>

  <Accordion title="รายละเอียดการยืนยันตัวตน">
    - Z.AI ใช้ Bearer auth พร้อม API key ของคุณ
    - ตัวเลือกการเริ่มต้นใช้งาน `zai-api-key` จะตรวจหา endpoint ของ Z.AI ที่ตรงกับคำนำหน้าคีย์โดยอัตโนมัติ
    - ใช้ตัวเลือกระดับภูมิภาคแบบระบุชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อคุณต้องการบังคับใช้พื้นผิว API ที่เฉพาะเจาะจง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ตระกูลโมเดล GLM" href="/th/providers/glm" icon="microchip">
    ภาพรวมตระกูลโมเดลสำหรับ GLM
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ อ้างอิงโมเดล และพฤติกรรม failover
  </Card>
</CardGroup>
