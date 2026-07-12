---
read_when:
    - คุณต้องการใช้โมเดล StepFun ใน OpenClaw
    - คุณต้องการคำแนะนำในการตั้งค่า StepFun
summary: ใช้โมเดล StepFun กับ OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T16:37:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

StepFun จัดส่งในรูปแบบ Plugin ทางการภายนอก (`@openclaw/stepfun-provider`) โดยมีรหัสผู้ให้บริการสองรายการ:

- `stepfun` สำหรับปลายทางมาตรฐาน
- `stepfun-plan` สำหรับปลายทาง Step Plan

<Warning>
Standard และ Step Plan เป็น**ผู้ให้บริการแยกจากกัน** ซึ่งใช้ปลายทางและคำนำหน้าการอ้างอิงโมเดลต่างกัน (`stepfun/...` เทียบกับ `stepfun-plan/...`) ใช้คีย์สำหรับจีนกับปลายทาง `.com` และใช้คีย์สากลกับปลายทาง `.ai`
</Warning>

## ติดตั้ง Plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## ภาพรวมภูมิภาคและปลายทาง

| ปลายทาง  | จีน (`.com`)                         | สากล (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| มาตรฐาน  | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

ตัวแปรสภาพแวดล้อมสำหรับการยืนยันตัวตน: `STEPFUN_API_KEY`

## แค็ตตาล็อกในตัว

มาตรฐาน (`stepfun`):

| การอ้างอิงโมเดล                | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                          |
| ------------------------ | ------- | ---------- | ------------------------------ |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | โมเดลมาตรฐานเริ่มต้น         |
| `stepfun/step-3.7-flash` | 262,144 | 262,144    | รองรับอินพุตรูปภาพแบบหลายสื่อ |

Step Plan (`stepfun-plan`):

| การอ้างอิงโมเดล                          | บริบท | เอาต์พุตสูงสุด | หมายเหตุ                          |
| ---------------------------------- | ------- | ---------- | ------------------------------ |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | โมเดล Step Plan เริ่มต้น        |
| `stepfun-plan/step-3.7-flash`      | 262,144 | 262,144    | รองรับอินพุตรูปภาพแบบหลายสื่อ |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | โมเดล Step Plan เพิ่มเติม     |

## เริ่มต้นใช้งาน

<Tabs>
  <Tab title="มาตรฐาน">
    เหมาะที่สุดสำหรับการใช้งานทั่วไปผ่านปลายทางมาตรฐานของ StepFun

    <Steps>
      <Step title="เลือกภูมิภาคปลายทางของคุณ">
        | ตัวเลือกการยืนยันตัวตน                    | ปลายทาง                     | ภูมิภาค        |
        | -------------------------------- | ----------------------------- | -------------- |
        | `stepfun-standard-api-key-intl` | `https://api.stepfun.ai/v1`  | ระหว่างประเทศ |
        | `stepfun-standard-api-key-cn`   | `https://api.stepfun.com/v1` | จีน          |
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        ปลายทางจีน:

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

    โมเดลเริ่มต้น: `stepfun/step-3.5-flash`
    โมเดลทางเลือก: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    เหมาะที่สุดสำหรับปลายทางการให้เหตุผลของ Step Plan

    <Steps>
      <Step title="เลือกภูมิภาคปลายทางของคุณ">
        | ตัวเลือกการยืนยันตัวตน                 | ปลายทาง                                | ภูมิภาค        |
        | ------------------------------ | ------------------------------------------ | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`  | ระหว่างประเทศ |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1` | จีน          |
      </Step>
      <Step title="เรียกใช้การเริ่มต้นใช้งาน">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        ปลายทางจีน:

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

    โมเดลเริ่มต้น: `stepfun-plan/step-3.5-flash`
    โมเดลทางเลือก: `stepfun-plan/step-3.7-flash`, `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

ขั้นตอนการยืนยันตัวตนเพียงครั้งเดียวจะเขียนโปรไฟล์ที่ตรงกับภูมิภาคให้ทั้ง `stepfun` และ `stepfun-plan` ดังนั้นจึงค้นพบทั้งสองพื้นผิวพร้อมกันหลังจากเรียกใช้การเริ่มต้นใช้งานครั้งเดียว

## การกำหนดค่าขั้นสูง

<AccordionGroup>
  <Accordion title="การกำหนดค่าแบบเต็ม: ผู้ให้บริการมาตรฐาน">
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0.2, output: 1.15, cacheRead: 0.04, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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

  <Accordion title="การกำหนดค่าแบบเต็ม: ผู้ให้บริการ Step Plan">
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
                id: "step-3.7-flash",
                name: "Step 3.7 Flash",
                reasoning: true,
                input: ["text", "image"],
                thinkingLevelMap: { off: "low", minimal: "low", xhigh: "high", max: "high" },
                cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                contextWindow: 262144,
                maxTokens: 262144,
                compat: {
                  supportsStore: false,
                  supportsDeveloperRole: false,
                  supportsUsageInStreaming: false,
                  supportsReasoningEffort: true,
                  supportsStrictMode: false,
                  supportedReasoningEfforts: ["low", "medium", "high"],
                  maxTokensField: "max_tokens",
                  reasoningEffortMap: {
                    off: "low",
                    none: "low",
                    minimal: "low",
                    low: "low",
                    medium: "medium",
                    high: "high",
                    xhigh: "high",
                    adaptive: "high",
                    max: "high",
                  },
                },
              },
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
    - `step-3.7-flash` รับอินพุตข้อความและรูปภาพผ่าน OpenClaw นอกจากนี้ API ของ StepFun ยังรองรับวิดีโอ ซึ่งยังไม่ใช่รูปแบบอินพุตของโมเดลใน OpenClaw
    - Step 3.7 รองรับระดับความพยายามในการให้เหตุผล `low`, `medium` และ `high` เนื่องจากโมเดลไม่มีโหมดที่ไม่ใช้การให้เหตุผล `/think off` จึงแมปเป็น `low`
    - ปัจจุบัน `step-3.5-flash-2603` เปิดให้ใช้งานเฉพาะบน `stepfun-plan`
    - ใช้ `openclaw models list` และ `openclaw models set <provider/model>` เพื่อตรวจสอบหรือสลับโมเดล

  </Accordion>
</AccordionGroup>

## เนื้อหาที่เกี่ยวข้อง

<CardGroup cols={2}>
  <Card title="ผู้ให้บริการโมเดล" href="/th/concepts/model-providers" icon="layers">
    ภาพรวมของผู้ให้บริการทั้งหมด การอ้างอิงโมเดล และลักษณะการทำงานเมื่อสลับไปใช้ตัวสำรอง
  </Card>
  <Card title="ข้อมูลอ้างอิงการกำหนดค่า" href="/th/gateway/configuration-reference" icon="gear">
    สคีมาการกำหนดค่าแบบเต็มสำหรับผู้ให้บริการ โมเดล และ Plugin
  </Card>
  <Card title="CLI สำหรับโมเดล" href="/th/concepts/models" icon="brain">
    วิธีเลือกและกำหนดค่าโมเดล
  </Card>
  <Card title="แพลตฟอร์ม StepFun" href="https://platform.stepfun.com" icon="globe">
    การจัดการคีย์ API และเอกสารประกอบของ StepFun
  </Card>
</CardGroup>
