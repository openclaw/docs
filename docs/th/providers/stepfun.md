---
read_when:
    - คุณต้องการใช้โมเดล StepFun ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า StepFun
summary: ใช้โมเดล StepFun กับ OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-24T09:29:45Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

OpenClaw มี plugin provider ของ StepFun แบบ bundled พร้อม provider ids สองตัว:

- `stepfun` สำหรับ endpoint มาตรฐาน
- `stepfun-plan` สำหรับ endpoint Step Plan

<Warning>
Standard และ Step Plan เป็น **ผู้ให้บริการแยกกัน** โดยมี endpoints และคำนำหน้า model ref ต่างกัน (`stepfun/...` เทียบกับ `stepfun-plan/...`) ใช้คีย์ China กับ endpoints แบบ `.com` และใช้คีย์ global กับ endpoints แบบ `.ai`
</Warning>

## ภาพรวม region และ endpoint

| Endpoint  | China (`.com`)                         | Global (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

env var สำหรับ auth: `STEPFUN_API_KEY`

## แค็ตตาล็อกที่มาพร้อมระบบ

Standard (`stepfun`):

| Model ref                | Context | เอาต์พุตสูงสุด | หมายเหตุ                 |
| ------------------------ | ------- | --------------- | ------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536          | โมเดลมาตรฐานเริ่มต้น     |

Step Plan (`stepfun-plan`):

| Model ref                          | Context | เอาต์พุตสูงสุด | หมายเหตุ                    |
| ---------------------------------- | ------- | --------------- | --------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536          | โมเดล Step Plan เริ่มต้น    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536          | โมเดล Step Plan เพิ่มเติม    |

## เริ่มต้นใช้งาน

เลือกพื้นผิว provider ที่คุณต้องการ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Standard">
    **เหมาะสำหรับ:** การใช้งานทั่วไปผ่าน endpoint StepFun มาตรฐาน

    <Steps>
      <Step title="เลือก region ของ endpoint">
        | ตัวเลือก auth                     | Endpoint                         | Region        |
        | --------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`   | `https://api.stepfun.ai/v1`      | นานาชาติ      |
        | `stepfun-standard-api-key-cn`     | `https://api.stepfun.com/v1`     | จีน           |
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        หรือสำหรับ endpoint ของจีน:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="ทางเลือกแบบไม่โต้ตอบ">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Model refs

    - โมเดลเริ่มต้น: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **เหมาะสำหรับ:** endpoint reasoning ของ Step Plan

    <Steps>
      <Step title="เลือก region ของ endpoint">
        | ตัวเลือก auth                 | Endpoint                               | Region        |
        | ----------------------------- | -------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`  | นานาชาติ      |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1` | จีน           |
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        หรือสำหรับ endpoint ของจีน:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="ทางเลือกแบบไม่โต้ตอบ">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="ตรวจสอบว่าโมเดลพร้อมใช้งาน">
        ```bash
        openclaw models list --provider stepfun-plan
        ```
      </Step>
    </Steps>

    ### Model refs

    - โมเดลเริ่มต้น: `stepfun-plan/step-3.5-flash`
    - โมเดลทางเลือก: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## การตั้งค่าขั้นสูง

<AccordionGroup>
  <Accordion title="config แบบเต็ม: provider มาตรฐาน">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          stepfun: {
            baseUrl: "https://api.stepfun.ai/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="config แบบเต็ม: provider Step Plan">
    ```json5
    {
      env: { STEPFUN_API_KEY: "your-key" },
      agents: { defaults: { model: { primary: "stepfun-plan/step-3.5-flash" } } },
      models: {
        mode: "merge",
        providers: {
          "stepfun-plan": {
            baseUrl: "https://api.stepfun.ai/step_plan/v1",
            api: "openai-completions",
            apiKey: "${STEPFUN_API_KEY}",
            models: [
              {
                id: "step-3.5-flash",
                name: "Step 3.5 Flash",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
              {
                id: "step-3.5-flash-2603",
                name: "Step 3.5 Flash 2603",
                reasoning: true,
                input: ["text"],
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 65536,
              },
            ],
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="หมายเหตุ">
    - provider นี้มาพร้อมกับ OpenClaw ดังนั้นจึงไม่มีขั้นตอนติดตั้ง plugin แยกต่างหาก
    - ปัจจุบัน `step-3.5-flash-2603` เปิดเผยเฉพาะบน `stepfun-plan`
    - โฟลว์ auth เดียวจะเขียนโปรไฟล์ที่ตรงกับ region สำหรับทั้ง `stepfun` และ `stepfun-plan` ดังนั้นจึงสามารถค้นพบทั้งสองพื้นผิวพร้อมกันได้
    - ใช้ `openclaw models list` และ `openclaw models set <provider/model>` เพื่อตรวจสอบหรือสลับโมเดล

  </Accordion>
</AccordionGroup>

<Note>
สำหรับภาพรวมของ provider โดยรวม ดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของ providers ทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="เอกสารอ้างอิงการตั้งค่า" href="/th/gateway/configuration-reference" icon="gear">
    schema ของ config แบบเต็มสำหรับ providers, models และ plugins
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="แพลตฟอร์ม StepFun" href="https://platform.stepfun.com" icon="globe">
    การจัดการคีย์ API และเอกสารของ StepFun
  </Card>
</CardGroup>
