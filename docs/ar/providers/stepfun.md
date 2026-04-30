---
read_when:
    - تريد نماذج StepFun في OpenClaw
    - تحتاج إلى إرشادات إعداد StepFun
summary: استخدام نماذج StepFun مع OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-04-30T08:22:34Z"
    model: gpt-5.5
    provider: openai
    source_hash: c9d43f6e8cda9703a0b9b82d079b282ed5c955676b99b946529582af230d8d10
    source_path: providers/stepfun.md
    workflow: 16
---

OpenClaw يتضمن Plugin موفر StepFun مضمنا مع معرفي موفر:

- `stepfun` لنقطة النهاية القياسية
- `stepfun-plan` لنقطة نهاية Step Plan

<Warning>
الموفر القياسي وStep Plan هما **موفران منفصلان** بنقاط نهاية مختلفة وبادئات مختلفة لمراجع النماذج (`stepfun/...` مقابل `stepfun-plan/...`). استخدم مفتاح الصين مع نقاط نهاية `.com` ومفتاحا عالميا مع نقاط نهاية `.ai`.
</Warning>

## نظرة عامة على المنطقة ونقطة النهاية

| نقطة النهاية | الصين (`.com`)                         | عالمي (`.ai`)                         |
| --------- | -------------------------------------- | ------------------------------------- |
| قياسي | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

متغير بيئة المصادقة: `STEPFUN_API_KEY`

## الكتالوج المضمن

قياسي (`stepfun`):

| مرجع النموذج | السياق | الحد الأقصى للإخراج | ملاحظات |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | النموذج القياسي الافتراضي |

Step Plan (`stepfun-plan`):

| مرجع النموذج | السياق | الحد الأقصى للإخراج | ملاحظات |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | نموذج Step Plan الافتراضي |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | نموذج Step Plan إضافي |

## البدء

اختر سطح الموفر واتبع خطوات الإعداد.

<Tabs>
  <Tab title="Standard">
    **الأفضل لـ:** الاستخدام العام عبر نقطة نهاية StepFun القياسية.

    <Steps>
      <Step title="Choose your endpoint region">
        | خيار المصادقة | نقطة النهاية | المنطقة |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | دولية |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | الصين |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        أو لنقطة نهاية الصين:

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

    ### مراجع النماذج

    - النموذج الافتراضي: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **الأفضل لـ:** نقطة نهاية الاستدلال Step Plan.

    <Steps>
      <Step title="Choose your endpoint region">
        | خيار المصادقة | نقطة النهاية | المنطقة |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | دولية |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | الصين |
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        أو لنقطة نهاية الصين:

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

    ### مراجع النماذج

    - النموذج الافتراضي: `stepfun-plan/step-3.5-flash`
    - النموذج البديل: `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

## الإعدادات المتقدمة

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
    - الموفر مضمن مع OpenClaw، لذلك لا توجد خطوة تثبيت Plugin منفصلة.
    - `step-3.5-flash-2603` متاح حاليا فقط على `stepfun-plan`.
    - يكتب مسار مصادقة واحد ملفات تعريف مطابقة للمنطقة لكل من `stepfun` و`stepfun-plan`، لذلك يمكن اكتشاف السطحين معا.
    - استخدم `openclaw models list` و`openclaw models set <provider/model>` لفحص النماذج أو تبديلها.

  </Accordion>
</AccordionGroup>

<Note>
للاطلاع على النظرة العامة الأوسع للموفرين، راجع [موفري النماذج](/ar/concepts/model-providers).
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل للموفرين والنماذج والـ plugins.
  </Card>
  <Card title="Model selection" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="StepFun Platform" href="https://platform.stepfun.com" icon="globe">
    إدارة مفتاح API الخاص بـ StepFun والوثائق.
  </Card>
</CardGroup>
