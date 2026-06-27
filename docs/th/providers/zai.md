---
read_when:
    - คุณต้องการใช้โมเดล Z.AI / GLM ใน OpenClaw
    - คุณต้องตั้งค่า ZAI_API_KEY แบบง่าย
summary: ใช้ Z.AI (โมเดล GLM) กับ OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-06-27T18:18:14Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a40675d3db518c090828bcc46c3bca348d1bed1027ba6b80228aa27773efd10f
    source_path: providers/zai.md
    workflow: 16
---

Z.AI เป็นแพลตฟอร์ม API สำหรับโมเดล **GLM** โดยมี REST API สำหรับ GLM และ
ใช้ API keys สำหรับการยืนยันตัวตน สร้าง API key ของคุณในคอนโซล Z.AI
OpenClaw ใช้ผู้ให้บริการ `zai` ร่วมกับ Z.AI API key

| คุณสมบัติ | ค่า                                          |
| -------- | -------------------------------------------- |
| ผู้ให้บริการ | `zai`                                        |
| แพ็กเกจ  | `@openclaw/zai-provider`                     |
| การยืนยันตัวตน | `ZAI_API_KEY` (ชื่อแทนเดิม: `Z_AI_API_KEY`) |
| API      | Z.AI Chat Completions (การยืนยันตัวตนแบบ Bearer) |

## โมเดล GLM

GLM เป็นตระกูลโมเดล ไม่ใช่ผู้ให้บริการแยกต่างหาก ใน OpenClaw โมเดล GLM ใช้
refs เช่น `zai/glm-5.2`: ผู้ให้บริการ `zai`, id โมเดล `glm-5.2`

## เริ่มต้นใช้งาน

ติดตั้ง Plugin ผู้ให้บริการก่อน:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Auto-detect endpoint">
    **เหมาะที่สุดสำหรับ:** ผู้ใช้ส่วนใหญ่ OpenClaw จะตรวจสอบปลายทาง Z.AI ที่รองรับด้วย API key ของคุณ และใช้ URL ฐานที่ถูกต้องโดยอัตโนมัติ

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

## ตัวอย่างการกำหนดค่า

<Tip>
`zai-api-key` ช่วยให้ OpenClaw ตรวจหาปลายทาง Z.AI ที่ตรงกับ key และ
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

Plugin ผู้ให้บริการ `zai` มาพร้อมแค็ตตาล็อกในแมนิเฟสต์ของ Plugin ดังนั้นการแสดงรายการแบบอ่านอย่างเดียว
จึงสามารถแสดงแถว GLM ที่รู้จักได้โดยไม่ต้องโหลดรันไทม์ของผู้ให้บริการ:

```bash
openclaw models list --all --provider zai
```

แค็ตตาล็อกที่อิงกับแมนิเฟสต์ในปัจจุบันมีรายการต่อไปนี้:

| ref โมเดล            | หมายเหตุ                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | ค่าเริ่มต้นของ Coding Plan; บริบท 1M |
| `zai/glm-5.1`        | ค่าเริ่มต้นของ API ทั่วไป             |
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
โมเดล GLM ใช้งานได้ในรูปแบบ `zai/<model>` (ตัวอย่าง: `zai/glm-5`)
</Tip>

<Tip>
GLM-5.2 รองรับระดับการคิด `off`, `low`, `high` และ `max` OpenClaw แมป
`low` และ `high` ไปยังความพยายามในการให้เหตุผลระดับสูงของ Z.AI และแมป `max` ไปยังความพยายามสูงสุด
</Tip>

<Note>
การตั้งค่า Coding Plan ใช้ค่าเริ่มต้นเป็น `zai/glm-5.2`; การตั้งค่า API ทั่วไปยังคงใช้
`zai/glm-5.1` การตรวจหาปลายทางอัตโนมัติจะย้อนกลับไปใช้ `glm-5.1` หรือ `glm-4.7`
เมื่อแผนที่เลือกไม่ได้เปิดให้ใช้ GLM-5.2 เวอร์ชันและความพร้อมใช้งานของ GLM
อาจเปลี่ยนแปลงได้; เรียกใช้ `openclaw models list --all --provider zai` เพื่อดูแค็ตตาล็อก
ที่เวอร์ชันที่คุณติดตั้งรู้จัก
</Note>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Forward-resolving unknown GLM-5 models">
    id `glm-5*` ที่ไม่รู้จักยังคงถูกแก้ไปข้างหน้าบนเส้นทางผู้ให้บริการ โดย
    สังเคราะห์เมทาดาทาที่ผู้ให้บริการเป็นเจ้าของจากเทมเพลต `glm-4.7` เมื่อ id
    ตรงกับรูปแบบตระกูล GLM-5 ปัจจุบัน
  </Accordion>

  <Accordion title="Tool-call streaming">
    `tool_stream` เปิดใช้งานเป็นค่าเริ่มต้นสำหรับการสตรีม tool-call ของ Z.AI หากต้องการปิดใช้งาน:

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

  <Accordion title="Thinking and preserved thinking">
    การคิดของ Z.AI ทำตามตัวควบคุม `/think` ของ OpenClaw เมื่อปิดการคิด
    OpenClaw จะส่ง `thinking: { type: "disabled" }` เพื่อหลีกเลี่ยงคำตอบที่
    ใช้งบประมาณเอาต์พุตกับ `reasoning_content` ก่อนข้อความที่มองเห็นได้

    การเก็บรักษาการคิดต้องเลือกเปิดใช้ เพราะ Z.AI ต้องการให้เล่นซ้ำ
    `reasoning_content` ในประวัติทั้งหมด ซึ่งเพิ่มจำนวนโทเค็นพรอมป์ เปิดใช้งาน
    ต่อโมเดล:

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

    เมื่อเปิดใช้งานและการคิดเปิดอยู่ OpenClaw จะส่ง
    `thinking: { type: "enabled", clear_thinking: false }` และเล่นซ้ำ
    `reasoning_content` ก่อนหน้าสำหรับทรานสคริปต์ที่เข้ากันได้กับ OpenAI เดียวกัน

    ผู้ใช้ขั้นสูงยังสามารถเขียนทับ payload ของผู้ให้บริการแบบตรงตัวได้ด้วย
    `params.extra_body.thinking`

  </Accordion>

  <Accordion title="Image understanding">
    Plugin Z.AI ลงทะเบียนความเข้าใจรูปภาพ

    | คุณสมบัติ      | ค่า       |
    | ------------- | ----------- |
    | โมเดล         | `glm-4.6v`  |

    ความเข้าใจรูปภาพถูกแก้อัตโนมัติจากการยืนยันตัวตน Z.AI ที่กำหนดค่าไว้ โดยไม่ต้องมี
    การกำหนดค่าเพิ่มเติม

  </Accordion>

  <Accordion title="Auth details">
    - Z.AI ใช้การยืนยันตัวตนแบบ Bearer ด้วย API key ของคุณ
    - ตัวเลือก onboarding `zai-api-key` จะตรวจหาปลายทาง Z.AI ที่ตรงกันโดยอัตโนมัติด้วยการตรวจสอบปลายทางที่รองรับด้วย key ของคุณ
    - ใช้ตัวเลือกภูมิภาคแบบระบุชัดเจน (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) เมื่อคุณต้องการบังคับใช้พื้นผิว API แบบเฉพาะเจาะจง
    - env var เดิม `Z_AI_API_KEY` ยังยอมรับอยู่; OpenClaw จะคัดลอกไปยัง `ZAI_API_KEY` ตอนเริ่มต้น หากไม่ได้ตั้งค่า `ZAI_API_KEY`

  </Accordion>
</AccordionGroup>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    การเลือกผู้ให้บริการ refs โมเดล และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่า OpenClaw ฉบับเต็ม รวมถึงการตั้งค่าผู้ให้บริการและโมเดล
  </Card>
</CardGroup>
