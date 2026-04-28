---
read_when:
    - تريد نماذج StepFun في OpenClaw
    - تحتاج إلى إرشادات إعداد StepFun
summary: استخدم نماذج StepFun مع OpenClaw
title: StepFun
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-24T08:01:01Z"
    model: gpt-5.4
    provider: openai
    source_hash: a5bc7904a07bed9f8c9bbbaabb9a7ab56e8f19924df9ec493a126a2685079486
    source_path: providers/stepfun.md
    workflow: 15
---

يتضمن OpenClaw Plugin مضمّنًا لمزوّد StepFun مع معرّفي مزوّد:

- `stepfun` لنقطة النهاية القياسية
- `stepfun-plan` لنقطة نهاية Step Plan

<Warning>
القياسي وStep Plan هما **مزوّدان منفصلان** مع نقاط نهاية مختلفة وبادئات مختلفة لمراجع النماذج (`stepfun/...` مقابل `stepfun-plan/...`). استخدم مفتاح China مع نقاط النهاية `.com` ومفتاحًا عالميًا مع نقاط النهاية `.ai`.
</Warning>

## نظرة عامة على المناطق ونقاط النهاية

| نقطة النهاية | الصين (`.com`)                           | العالمية (`.ai`)                        |
| ------------ | ---------------------------------------- | --------------------------------------- |
| القياسي      | `https://api.stepfun.com/v1`             | `https://api.stepfun.ai/v1`             |
| Step Plan    | `https://api.stepfun.com/step_plan/v1`   | `https://api.stepfun.ai/step_plan/v1`   |

متغير env للمصادقة: `STEPFUN_API_KEY`

## الفهرس المدمج

القياسي (`stepfun`):

| مرجع النموذج               | السياق  | الحد الأقصى للإخراج | ملاحظات                 |
| ------------------------- | ------- | ------------------- | ----------------------- |
| `stepfun/step-3.5-flash`  | 262,144 | 65,536              | النموذج القياسي الافتراضي |

Step Plan ‏(`stepfun-plan`):

| مرجع النموذج                         | السياق  | الحد الأقصى للإخراج | ملاحظات                    |
| ----------------------------------- | ------- | ------------------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`       | 262,144 | 65,536              | نموذج Step Plan الافتراضي |
| `stepfun-plan/step-3.5-flash-2603`  | 262,144 | 65,536              | نموذج Step Plan إضافي      |

## البدء

اختر سطح المزوّد واتبع خطوات الإعداد.

<Tabs>
  <Tab title="القياسي">
    **الأفضل لـ:** الاستخدام العام عبر نقطة نهاية StepFun القياسية.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة                   | نقطة النهاية                    | المنطقة        |
        | ------------------------------ | ------------------------------- | -------------- |
        | `stepfun-standard-api-key-intl`| `https://api.stepfun.ai/v1`     | دولي           |
        | `stepfun-standard-api-key-cn`  | `https://api.stepfun.com/v1`    | الصين          |
      </Step>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        أو لنقطة النهاية الصينية:

        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-cn
        ```
      </Step>
      <Step title="بديل غير تفاعلي">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="تحقّق من توفر النماذج">
        ```bash
        openclaw models list --provider stepfun
        ```
      </Step>
    </Steps>

    ### مراجع النماذج

    - النموذج الافتراضي: `stepfun/step-3.5-flash`

  </Tab>

  <Tab title="Step Plan">
    **الأفضل لـ:** نقطة نهاية reasoning الخاصة بـ Step Plan.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة                | نقطة النهاية                             | المنطقة        |
        | --------------------------- | ---------------------------------------- | -------------- |
        | `stepfun-plan-api-key-intl` | `https://api.stepfun.ai/step_plan/v1`    | دولي           |
        | `stepfun-plan-api-key-cn`   | `https://api.stepfun.com/step_plan/v1`   | الصين          |
      </Step>
      <Step title="شغّل onboarding">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        أو لنقطة النهاية الصينية:

        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-cn
        ```
      </Step>
      <Step title="بديل غير تفاعلي">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl \
          --stepfun-api-key "$STEPFUN_API_KEY"
        ```
      </Step>
      <Step title="تحقّق من توفر النماذج">
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

## التكوين المتقدم

<AccordionGroup>
  <Accordion title="التكوين الكامل: المزوّد القياسي">
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

  <Accordion title="التكوين الكامل: مزوّد Step Plan">
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

  <Accordion title="ملاحظات">
    - المزوّد مضمّن مع OpenClaw، لذلك لا توجد خطوة منفصلة لتثبيت Plugin.
    - `step-3.5-flash-2603` مكشوف حاليًا فقط على `stepfun-plan`.
    - يكتب تدفق مصادقة واحد ملفات تعريف مطابقة للمنطقة لكل من `stepfun` و`stepfun-plan`، بحيث يمكن اكتشاف السطحين معًا.
    - استخدم `openclaw models list` و`openclaw models set <provider/model>` لفحص النماذج أو التبديل بينها.
  </Accordion>
</AccordionGroup>

<Note>
للحصول على نظرة عامة أوسع على المزوّدين، راجع [مزوّدو النماذج](/ar/concepts/model-providers).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين، ومراجع النماذج، وسلوك الاحتياط.
  </Card>
  <Card title="مرجع التكوين" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل للمزوّدين، والنماذج، وPlugins.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وتكوينها.
  </Card>
  <Card title="منصة StepFun" href="https://platform.stepfun.com" icon="globe">
    إدارة مفاتيح StepFun API والتوثيق.
  </Card>
</CardGroup>
