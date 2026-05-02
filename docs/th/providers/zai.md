---
read_when:
    - คุณต้องการใช้โมเดล Z.AI / GLM ใน OpenClaw
    - คุณต้องตั้งค่า ZAI_API_KEY แบบง่าย
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-05-02T10:27:42Z"
    model: gpt-5.5
    provider: openai
    source_hash: 423fc2bc27c62352d9d9acd13c70aa2bc3804112dab25aa46505e844cb166c93
    source_path: providers/zai.md
    workflow: 16
---

Z.AI เป็นแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยมี REST APIs สำหรับ GLM และใช้ API keys
สำหรับการยืนยันตัวตน สร้าง API key ของคุณในคอนโซล Z.AI OpenClaw ใช้ provider `zai`
พร้อม Z.AI API key

- Provider: `zai`
- การยืนยันตัวตน: `ZAI_API_KEY`
- API: Z.AI Chat Completions (การยืนยันตัวตนแบบ Bearer)

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="ตรวจหาปลายทางอัตโนมัติ">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw ตรวจหาปลายทาง Z.AI ที่ตรงกับคีย์และใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ

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
      <Step title="ตรวจสอบว่าโมเดลอยู่ในรายการ">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="ปลายทางภูมิภาคแบบระบุชัดเจน">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ที่ต้องการบังคับใช้ Coding Plan หรือพื้นผิว API ทั่วไปที่เจาะจง

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
      <Step title="ตรวจสอบว่าโมเดลอยู่ในรายการ">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

## แคตตาล็อกในตัว

OpenClaw มาพร้อมแคตตาล็อก provider `zai` ที่รวมมาในแมนิเฟสต์ Plugin ดังนั้นการแสดงรายการแบบอ่านอย่างเดียว
จึงสามารถแสดงแถว GLM ที่รู้จักได้โดยไม่ต้องโหลดรันไทม์ของ provider:

```bash
openclaw models list --all --provider zai
```

แคตตาล็อกที่อิงตามแมนิเฟสต์ในปัจจุบันประกอบด้วย:

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
โมเดล GLM ใช้งานได้ในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`) การอ้างอิงโมเดลที่รวมมาเป็นค่าเริ่มต้นคือ `zai/glm-5.1`
</Tip>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การแก้ไขโมเดล GLM-5 ที่ไม่รู้จักแบบส่งต่อ">
    id `glm-5*` ที่ไม่รู้จักยังคงแก้ไขแบบส่งต่อบนเส้นทาง provider ที่รวมมา โดย
    สังเคราะห์เมทาดาทาที่ provider เป็นเจ้าของจากเทมเพลต `glm-4.7` เมื่อ id
    ตรงกับรูปแบบตระกูล GLM-5 ปัจจุบัน
  </Accordion>

  <Accordion title="การสตรีมการเรียกเครื่องมือ">
    `tool_stream` เปิดใช้งานเป็นค่าเริ่มต้นสำหรับการสตรีมการเรียกเครื่องมือของ Z.AI หากต้องการปิดใช้งาน:

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

  <Accordion title="การคิดและการคงการคิดไว้">
    การคิดของ Z.AI ทำตามตัวควบคุม `/think` ของ OpenClaw เมื่อปิดการคิด
    OpenClaw จะส่ง `thinking: { type: "disabled" }` เพื่อหลีกเลี่ยงคำตอบที่
    ใช้งบประมาณเอาต์พุตกับ `reasoning_content` ก่อนข้อความที่มองเห็นได้

    การคงการคิดไว้เป็นแบบเลือกเปิด เพราะ Z.AI ต้องการให้เล่นซ้ำ
    `reasoning_content` ในประวัติทั้งหมด ซึ่งเพิ่มจำนวนโทเค็นพรอมป์ เปิดใช้งาน
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
    `reasoning_content` ก่อนหน้าสำหรับทรานสคริปต์เดียวกันที่เข้ากันได้กับ OpenAI

    ผู้ใช้ขั้นสูงยังสามารถแทนที่เพย์โหลด provider ที่แน่นอนได้ด้วย
    `params.extra_body.thinking`

  </Accordion>

  <Accordion title="ความเข้าใจรูปภาพ">
    Plugin Z.AI ที่รวมมาจะลงทะเบียนความเข้าใจรูปภาพ

    | คุณสมบัติ     | ค่า         |
    | ------------- | ----------- |
    | โมเดล         | `glm-4.6v`  |

    ความเข้าใจรูปภาพจะถูกแก้ไขโดยอัตโนมัติจากการยืนยันตัวตน Z.AI ที่กำหนดค่าไว้ โดย
    ไม่ต้องมีการกำหนดค่าเพิ่มเติม

  </Accordion>

  <Accordion title="รายละเอียดการยืนยันตัวตน">
    - Z.AI ใช้การยืนยันตัวตนแบบ Bearer ด้วย API key ของคุณ
    - ตัวเลือกการเริ่มต้นใช้งาน `zai-api-key` จะตรวจหาปลายทาง Z.AI ที่ตรงกันจากคำนำหน้าคีย์โดยอัตโนมัติ
    - ใช้ตัวเลือกภูมิภาคแบบระบุชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อคุณต้องการบังคับใช้พื้นผิว API ที่เจาะจง

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ตระกูลโมเดล GLM" href="/th/providers/glm" icon="microchip">
    ภาพรวมตระกูลโมเดลสำหรับ GLM
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    การเลือก provider, การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
</CardGroup>
