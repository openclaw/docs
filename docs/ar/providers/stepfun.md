---
read_when:
    - تريد نماذج StepFun في OpenClaw
    - تحتاج إلى إرشادات إعداد StepFun
summary: استخدام نماذج StepFun مع OpenClaw
title: StepFun
x-i18n:
    generated_at: "2026-06-27T18:27:48Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 08c5d684382ae98a981f6f441f7eb49c01342598952bcf16dc251d0bdfb526ca
    source_path: providers/stepfun.md
    workflow: 16
---

يدعم Plugin مزوّد StepFun معرّفَي مزوّد:

- `stepfun` لنقطة النهاية القياسية
- `stepfun-plan` لنقطة نهاية Step Plan

<Warning>
المزوّد القياسي وStep Plan هما **مزوّدان منفصلان** بنقاط نهاية وبادئات مراجع نماذج مختلفة (`stepfun/...` مقابل `stepfun-plan/...`). استخدم مفتاح الصين مع نقاط النهاية `.com` ومفتاحًا عالميًا مع نقاط النهاية `.ai`.
</Warning>

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/stepfun-provider
openclaw gateway restart
```

## نظرة عامة على المنطقة ونقطة النهاية

| نقطة النهاية | الصين (`.com`)                         | عالمي (`.ai`)                        |
| --------- | -------------------------------------- | ------------------------------------- |
| قياسي | `https://api.stepfun.com/v1`           | `https://api.stepfun.ai/v1`           |
| Step Plan | `https://api.stepfun.com/step_plan/v1` | `https://api.stepfun.ai/step_plan/v1` |

متغير بيئة المصادقة: `STEPFUN_API_KEY`

## الكتالوج المضمّن

قياسي (`stepfun`):

| مرجع النموذج                | السياق | الحد الأقصى للإخراج | ملاحظات                  |
| ------------------------ | ------- | ---------- | ---------------------- |
| `stepfun/step-3.5-flash` | 262,144 | 65,536     | النموذج القياسي الافتراضي |

Step Plan (`stepfun-plan`):

| مرجع النموذج                          | السياق | الحد الأقصى للإخراج | ملاحظات                      |
| ---------------------------------- | ------- | ---------- | -------------------------- |
| `stepfun-plan/step-3.5-flash`      | 262,144 | 65,536     | نموذج Step Plan الافتراضي    |
| `stepfun-plan/step-3.5-flash-2603` | 262,144 | 65,536     | نموذج Step Plan إضافي |

## البدء

اختر سطح المزوّد واتبع خطوات الإعداد.

<Tabs>
  <Tab title="قياسي">
    **الأفضل لـ:** الاستخدام العام عبر نقطة نهاية StepFun القياسية.

    <Steps>
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة                      | نقطة النهاية                         | المنطقة        |
        | -------------------------------- | -------------------------------- | ------------- |
        | `stepfun-standard-api-key-intl`  | `https://api.stepfun.ai/v1`     | دولية |
        | `stepfun-standard-api-key-cn`    | `https://api.stepfun.com/v1`    | الصين         |
      </Step>
      <Step title="شغّل التهيئة">
        ```bash
        openclaw onboard --auth-choice stepfun-standard-api-key-intl
        ```

        أو لنقطة نهاية الصين:

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
      <Step title="تحقق من توفر النماذج">
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
      <Step title="اختر منطقة نقطة النهاية">
        | خيار المصادقة                  | نقطة النهاية                                | المنطقة        |
        | ---------------------------- | --------------------------------------- | ------------- |
        | `stepfun-plan-api-key-intl`  | `https://api.stepfun.ai/step_plan/v1`  | دولية |
        | `stepfun-plan-api-key-cn`    | `https://api.stepfun.com/step_plan/v1` | الصين         |
      </Step>
      <Step title="شغّل التهيئة">
        ```bash
        openclaw onboard --auth-choice stepfun-plan-api-key-intl
        ```

        أو لنقطة نهاية الصين:

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
      <Step title="تحقق من توفر النماذج">
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

## الإعداد المتقدم

<AccordionGroup>
  <Accordion title="الإعداد الكامل: المزوّد القياسي">
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

  <Accordion title="الإعداد الكامل: مزوّد Step Plan">
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
    - المزوّد حزمة خارجية رسمية؛ ثبّتها قبل الإعداد.
    - `step-3.5-flash-2603` متاح حاليًا فقط على `stepfun-plan`.
    - يكتب مسار مصادقة واحد ملفات تعريف مطابقة للمنطقة لكل من `stepfun` و`stepfun-plan`، لذلك يمكن اكتشاف السطحين معًا.
    - استخدم `openclaw models list` و`openclaw models set <provider/model>` لفحص النماذج أو تبديلها.

  </Accordion>
</AccordionGroup>

<Note>
للاطلاع على النظرة العامة الأوسع للمزوّدين، راجع [مزوّدو النماذج](/ar/concepts/model-providers).
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    نظرة عامة على جميع المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل للمزوّدين، والنماذج، وPlugins.
  </Card>
  <Card title="اختيار النموذج" href="/ar/concepts/models" icon="brain">
    كيفية اختيار النماذج وإعدادها.
  </Card>
  <Card title="منصة StepFun" href="https://platform.stepfun.com" icon="globe">
    إدارة مفاتيح API الخاصة بـ StepFun ووثائقها.
  </Card>
</CardGroup>
