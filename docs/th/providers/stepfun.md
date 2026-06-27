---
read_when:
    - คุณต้องการโมเดล StepFun ใน OpenClaw
    - คุณต้องการคำแนะนำการตั้งค่า StepFun
summary: ใช้โมเดล StepFun กับ OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:16:57Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

Plugin ของผู้ให้บริการ StepFun รองรับรหัสผู้ให้บริการสองรายการ:

- `stepfun` สำหรับปลายทางมาตรฐาน
- `stepfun-plan` สำหรับปลายทาง Step Plan

<Warning>
มาตรฐานและ Step Plan เป็น **ผู้ให้บริการแยกกัน** โดยมีปลายทางและคำนำหน้าการอ้างอิงโมเดลต่างกัน (`stepfun/...` กับ `stepfun-plan/...`) ใช้คีย์จีนกับปลายทาง `.com` และใช้คีย์โกลบอลกับปลายทาง `.ai`
</Warning>

## ติดตั้ง Plugin

ติดตั้ง Plugin อย่างเป็นทางการ แล้วรีสตาร์ท Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## ภาพรวมภูมิภาคและปลายทาง

| ปลายทาง  | จีน (`.com`)                         | โกลบอล (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| มาตรฐาน  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน: `STEPFUN_API_KEY`

## แค็ตตาล็อกในตัว

มาตรฐาน (`stepfun`):

| การอ้างอิงโมเดล                | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                  |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | โมเดลมาตรฐานเริ่มต้น |

Step Plan (`stepfun-plan`):

| การอ้างอิงโมเดล                          | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                      |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | โมเดล Step Plan เริ่มต้น    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | โมเดล Step Plan เพิ่มเติม |

## เริ่มต้นใช้งาน

เลือกพื้นผิวผู้ให้บริการของคุณ แล้วทำตามขั้นตอนการตั้งค่า

<Tabs>
  <Tab title="มาตรฐาน">
    **เหมาะที่สุดสำหรับ:** การใช้งานทั่วไปผ่านปลายทาง StepFun มาตรฐาน

    <Steps>
      <Step title="เลือกภูมิภาคปลายทางของคุณ">
        | ตัวเลือกการยืนยันตัวตน                      | ปลายทาง                         | ภูมิภาค        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | นานาชาติ |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | จีน         |
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        หรือสำหรับปลายทางจีน:

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

    ### การอ้างอิงโมเดล

    - โมเดลเริ่มต้น: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **เหมาะที่สุดสำหรับ:** ปลายทางการให้เหตุผลของ Step Plan

    <Steps>
      <Step title="เลือกภูมิภาคปลายทางของคุณ">
        | ตัวเลือกการยืนยันตัวตน                  | ปลายทาง                                | ภูมิภาค        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | นานาชาติ |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | จีน         |
      </Step>
      <Step title="เรียกใช้ onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        หรือสำหรับปลายทางจีน:

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

    ### การอ้างอิงโมเดล

    - โมเดลเริ่มต้น: `stepfun-plan/step-3.5-flash`
    - โมเดลทางเลือก: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การกำหนดค่าเต็ม: ผู้ให้บริการมาตรฐาน">
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

  <Accordion title="การกำหนดค่าเต็ม: ผู้ให้บริการ Step Plan">
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
    - ผู้ให้บริการนี้เป็นแพ็กเกจภายนอกอย่างเป็นทางการ ให้ติดตั้งก่อนการตั้งค่า
    - ปัจจุบัน `step-3.5-flash-2603` เปิดให้ใช้เฉพาะบน `stepfun-plan`
    - โฟลว์การยืนยันตัวตนเดียวจะเขียนโปรไฟล์ที่ตรงกับภูมิภาคสำหรับทั้ง `stepfun` และ `stepfun-plan` เพื่อให้ค้นพบทั้งสองพื้นผิวพร้อมกันได้
    - ใช้ `openclaw models list` และ `openclaw models set <provider/model>` เพื่อตรวจสอบหรือสลับโมเดล

  </Accordion>
</AccordionGroup>

<Note>
สำหรับภาพรวมผู้ให้บริการที่กว้างขึ้น โปรดดู [ผู้ให้บริการโมเดล](/th/concepts/model-providers)
</Note>

## ที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="การเลือกโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และพฤติกรรม failover
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าเต็มสำหรับผู้ให้บริการ โมเดล และ Plugin
  </Card>
  <Card title="การเลือกโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="แพลตฟอร์ม StepFun" href="https://platform.stepfun.com" icon="globe">
    การจัดการคีย์ API และเอกสารประกอบของ StepFun
  </Card>
</CardGroup>
