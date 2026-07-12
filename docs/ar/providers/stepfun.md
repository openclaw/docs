---
read_when:
    - تريد نماذج StepFun في OpenClaw
    - تحتاج إلى إرشادات إعداد StepFun
summary: استخدام نماذج StepFun مع OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-07-12T06:31:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c65e6d395f4ea890efc0e4847ec21dc1c2796fa240d20ca3e6d40eea480ed9f4
    source_path: providers/stepfun.md
    workflow: 16
---

يُوزَّع StepFun بوصفه plugin رسميًا خارجيًا (`@openclaw/stepfun-provider`) بمعرّفي موفّر:

- `stepfun` لنقطة النهاية القياسية
- `stepfun-plan` لنقطة نهاية Step Plan

<Warning>
الموفّر القياسي وStep Plan **موفّران منفصلان** بنقطتي نهاية وبادئتي مرجع نموذج مختلفتين (`stepfun/...` مقابل `stepfun-plan/...`). استخدم مفتاح الصين مع نقاط النهاية ذات النطاق `.com`، ومفتاحًا عالميًا مع نقاط النهاية ذات النطاق `.ai`.
</Warning>

## تثبيت الـ plugin

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## نظرة عامة على المناطق ونقاط النهاية

| نقطة النهاية | الصين (`.com`)                         | العالمية (`.ai`)                       |
| ------------- | -------------------------------------- | -------------------------------------- |
| القياسية      | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`            |
| Step Plan     | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1`  |

متغير بيئة المصادقة: `STEPFUN_API_KEY`

## الكتالوج المضمّن

القياسي (`stepfun`):

| مرجع النموذج             | السياق   | الحد الأقصى للإخراج | ملاحظات                         |
| ------------------------ | -------- | ------------------- | ------------------------------- |
| `stepfun/step-3.5-flash` | 262,144  | 65,536              | النموذج القياسي الافتراضي       |
| `stepfun/step-3.7-flash` | 262,144  | 262,144             | يدعم إدخال الصور متعدد الوسائط  |

Step Plan (`stepfun-plan`):

| مرجع النموذج                       | السياق   | الحد الأقصى للإخراج | ملاحظات                         |
| ---------------------------------- | -------- | ------------------- | ------------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144  | 65,536              | نموذج Step Plan الافتراضي       |
| `stepfun-plan/step-3.7-flash`      | 262,144  | 262,144             | يدعم إدخال الصور متعدد الوسائط  |
| `stepfun-plan/step-3.5-flash-2603` | 262,144  | 65,536              | نموذج Step Plan إضافي           |

## بدء الاستخدام

<Tabs>
  <Tab title="القياسي">
    الأنسب للاستخدام العام عبر نقطة نهاية StepFun القياسية.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة                    | نقطة النهاية                 | المنطقة |
        | -------------------------------- | ---------------------------- | ------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`  | دولية   |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1` | الصين   |
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        نقطة نهاية الصين:

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

    النموذج الافتراضي: `stepfun/step-3.5-flash`
    النموذج البديل: `stepfun/step-3.7-flash`

  </Tab>

  <Tab title="Step Plan">
    الأنسب لنقطة نهاية الاستدلال في Step Plan.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة                 | نقطة النهاية                              | المنطقة |
        | ----------------------------- | ----------------------------------------- | ------- |
        | `stepfun-plan-api-key-intl`   | `https://api.stepfun.ai/step_plan/v1`     | دولية   |
        | `stepfun-plan-api-key-cn`     | `https://api.stepfun.com/step_plan/v1`    | الصين   |
      </Step>
      <Step title="شغّل الإعداد الأولي">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        نقطة نهاية الصين:

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

    النموذج الافتراضي: `stepfun-plan/step-3.5-flash`
    النماذج البديلة: `stepfun-plan/step-3.7-flash`، `stepfun-plan/step-3.5-flash-2603`

  </Tab>
</Tabs>

يكتب مسار مصادقة واحد ملفات تعريف مطابقة للمنطقة لكل من `stepfun` و`stepfun-plan`، لذلك يُكتشف السطحان معًا بعد تشغيل الإعداد الأولي مرة واحدة.

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الإعداد الكامل: الموفّر القياسي">
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

  <Accordion title="الإعداد الكامل: موفّر Step Plan">
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

  <Accordion title="ملاحظات">
    - يقبل `step-3.7-flash` إدخال النصوص والصور عبر OpenClaw. تدعم واجهة API الخاصة بـ StepFun الفيديو أيضًا، لكنه ليس بعدُ نمط إدخال للنماذج في OpenClaw.
    - يدعم Step 3.7 مستويات جهد الاستدلال `low` و`medium` و`high`. ولأن النموذج لا يتضمن وضعًا بلا استدلال، يُربط `/think off` بالمستوى `low`.
    - يتوفر `step-3.5-flash-2603` حاليًا على `stepfun-plan` فقط.
    - استخدم `openclaw models list` و`openclaw models set <provider/model>` لفحص النماذج أو التبديل بينها.

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع الموفّرين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل للموفّرين والنماذج والـ plugins.
  </Card>
  <Card title="CLI للنماذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="منصة StepFun" href="https://platform.stepfun.com" icon="globe">
    إدارة مفاتيح API الخاصة بـ StepFun ووثائقها.
  </Card>
</CardGroup>
