---
read_when:
    - คุณต้องการใช้ Z.AI / โมเดล GLM ใน OpenClaw
    - คุณต้องการการตั้งค่า `ZAI_API_KEY` แบบง่าย ๆ
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-04-26T11:40:43Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5e2935aae04850539f46908fcbfc12111eac3ebbd963244e6347165afdd14bc5
    source_path: providers/zai.md
    workflow: 15
---

Z.AI คือแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยมี REST API สำหรับ GLM และใช้ API key สำหรับการยืนยันตัวตน สร้าง API key ของคุณได้ในคอนโซลของ Z.AI OpenClaw ใช้ผู้ให้บริการ `zai` ร่วมกับ API key ของ Z.AI

- ผู้ให้บริการ: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- API: Z.AI Chat Completions (Bearer auth)

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="ตรวจจับ endpoint อัตโนมัติ">
    **เหมาะสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจจับ endpoint ของ Z.AI ที่ตรงกับคีย์ และใช้ base URL ที่ถูกต้องโดยอัตโนมัติ

    <Steps>
      <Step title="เรียกใช้การตั้งค่าเริ่มต้น">
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

  <Tab title="endpoint ตามภูมิภาคแบบระบุชัดเจน">
    **เหมาะสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้ Coding Plan ที่เฉพาะเจาะจงหรือพื้นผิว API ทั่วไปแบบใดแบบหนึ่ง

    <Steps>
      <Step title="เลือกตัวเลือกการตั้งค่าเริ่มต้นที่ถูกต้อง">
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

ขณะนี้ OpenClaw เติมข้อมูลผู้ให้บริการ `zai` แบบ bundled ไว้ด้วย:

| การอ้างอิงโมเดล      | หมายเหตุ        |
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
โมเดล GLM ใช้งานได้ในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`) การอ้างอิงโมเดลแบบ bundled เริ่มต้นคือ `zai/glm-5.1`
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การ resolve ล่วงหน้าสำหรับโมเดล GLM-5 ที่ไม่รู้จัก">
    id ที่ไม่รู้จักในรูปแบบ `glm-5*` จะยังคงถูก resolve ล่วงหน้าบนเส้นทางผู้ให้บริการแบบ bundled โดยสังเคราะห์ข้อมูลเมตาที่ผู้ให้บริการเป็นเจ้าของจากแม่แบบ `glm-4.7` เมื่อ id ตรงกับรูปแบบตระกูล GLM-5 ปัจจุบัน
  </Accordion>

  <Accordion title="การสตรีมการเรียก tool">
    `tool_stream` ถูกเปิดใช้งานโดยปริยายสำหรับการสตรีมการเรียก tool ของ Z.AI หากต้องการปิดใช้งาน:

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

  <Accordion title="Thinking และ preserved thinking">
    Thinking ของ Z.AI เป็นไปตามตัวควบคุม `/think` ของ OpenClaw เมื่อปิด thinking OpenClaw จะส่ง `thinking: { type: "disabled" }` เพื่อหลีกเลี่ยงการตอบกลับที่ใช้โควตาเอาต์พุตไปกับ `reasoning_content` ก่อนข้อความที่มองเห็นได้

    preserved thinking เป็นแบบเลือกใช้เอง เนื่องจาก Z.AI ต้องการให้เล่นซ้ำ `reasoning_content` ในประวัติทั้งหมด ซึ่งเพิ่มจำนวน prompt token เปิดใช้งานเป็นรายโมเดลได้ดังนี้:

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

    เมื่อเปิดใช้งานและเปิด thinking อยู่ OpenClaw จะส่ง `thinking: { type: "enabled", clear_thinking: false }` และเล่นซ้ำ `reasoning_content` ก่อนหน้าสำหรับ transcript แบบเข้ากันได้กับ OpenAI เดียวกัน

    ผู้ใช้ขั้นสูงยังสามารถ override payload ของผู้ให้บริการแบบเจาะจงได้ผ่าน `params.extra_body.thinking`

  </Accordion>

  <Accordion title="ความเข้าใจภาพ">
    Plugin Z.AI แบบ bundled จะลงทะเบียนความเข้าใจภาพ

    | คุณสมบัติ | ค่า       |
    | --------- | --------- |
    | โมเดล     | `glm-4.6v`  |

    ความเข้าใจภาพจะถูก resolve อัตโนมัติจากการยืนยันตัวตน Z.AI ที่ตั้งค่าไว้ — ไม่ต้องมีการกำหนดค่าเพิ่มเติม

  </Accordion>

  <Accordion title="รายละเอียดการยืนยันตัวตน">
    - Z.AI ใช้ Bearer auth ร่วมกับ API key ของคุณ
    - ตัวเลือกการตั้งค่าเริ่มต้น `zai-api-key` จะตรวจจับ endpoint ของ Z.AI ที่ตรงกันจากคำนำหน้าของคีย์โดยอัตโนมัติ
    - ใช้ตัวเลือกตามภูมิภาคแบบระบุชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อคุณต้องการบังคับใช้พื้นผิว API ที่เฉพาะเจาะจง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ตระกูลโมเดล GLM" href="/th/providers/glm" icon="microchip">
    ภาพรวมตระกูลโมเดลสำหรับ GLM
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
</CardGroup>
