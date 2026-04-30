---
read_when:
    - คุณต้องการใช้โมเดล StepFun ใน OpenClaw
    - คุณต้องการคำแนะนำการตั้งค่า StepFun
summary: ใช้โมเดล StepFun กับ OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-30T10:13:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw มี Plugin ผู้ให้บริการ StepFun ที่รวมมาให้ พร้อม provider id สองรายการ:

- `stepfun` สำหรับ endpoint มาตรฐาน
- `stepfun-plan` สำหรับ endpoint Step Plan

<Warning>
Standard และ Step Plan เป็น **ผู้ให้บริการแยกกัน** โดยมี endpoint และคำนำหน้า model ref ต่างกัน (`stepfun/...` เทียบกับ `stepfun-plan/...`) ใช้คีย์จีนกับ endpoint `.com` และใช้คีย์โกลบอลกับ endpoint `.ai`
</Warning>

## ภาพรวมภูมิภาคและ endpoint

| Endpoint  | จีน (`.com`)                            | โกลบอล (`.ai`)                         |
| --------- | -------------------------------------- | ------------------------------------- |
| Standard  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

ตัวแปรสภาพแวดล้อมสำหรับ auth: `STEPFUN_API_KEY`

## แค็ตตาล็อกในตัว

Standard (`stepfun`):

| Model ref                | Context | เอาต์พุตสูงสุด | หมายเหตุ             |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | โมเดลมาตรฐานเริ่มต้น |

Step Plan (`stepfun-plan`):

| Model ref                          | Context | เอาต์พุตสูงสุด | หมายเหตุ                      |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | โมเดล Step Plan เริ่มต้น    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | โมเดล Step Plan เพิ่มเติม |

## เริ่มต้นใช้งาน

เลือกพื้นผิวผู้ให้บริการของคุณและทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="Standard">
    **เหมาะที่สุดสำหรับ:** การใช้งานทั่วไปผ่าน endpoint StepFun มาตรฐาน

    <Steps>
      <Step title="Choose your endpoint region">
        | ตัวเลือก auth                    | Endpoint                         | ภูมิภาค        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | นานาชาติ |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | จีน         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        หรือสำหรับ endpoint จีน:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### Model refs

    - โมเดลเริ่มต้น: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **เหมาะที่สุดสำหรับ:** endpoint การให้เหตุผลของ Step Plan

    <Steps>
      <Step title="Choose your endpoint region">
        | ตัวเลือก auth                | Endpoint                                | ภูมิภาค        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | นานาชาติ |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | จีน         |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        หรือสำหรับ endpoint จีน:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="Non-interactive alternative">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="Verify models are available">
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

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="Full config: Standard provider">
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

  <Accordion title="Full config: Step Plan provider">
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

  <Accordion title="Notes">
    - ผู้ให้บริการนี้รวมมากับ OpenClaw จึงไม่มีขั้นตอนติดตั้ง Plugin แยกต่างหาก
    - ขณะนี้ `step-3.5-flash-2603` เปิดให้ใช้งานเฉพาะบน `stepfun-plan`
    - โฟลว์ auth เดียวจะเขียนโปรไฟล์ที่ตรงกับภูมิภาคสำหรับทั้ง `stepfun` และ `stepfun-plan` ดังนั้นจึงค้นพบทั้งสองพื้นผิวร่วมกันได้
    - ใช้ `openclaw models list` และ `openclaw models set <provider/model>` เพื่อตรวจสอบหรือสลับโมเดล

  </Accordion>
</AccordionGroup>

<Note>
สำหรับภาพรวมผู้ให้บริการที่กว้างขึ้น โปรดดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="Model selection" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด, model refs และพฤติกรรม failover
  </Card>
  <Card title="Configuration reference" href="/th/gateway/configuration-reference" icon="gear">
    schema การกำหนดค่าเต็มสำหรับผู้ให้บริการ โมเดล และ plugins
  </Card>
  <Card title="Model selection" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    การจัดการคีย์ API ของ StepFun และเอกสารประกอบ
  </Card>
</CardGroup>
