---
read_when:
    - تريد استخدام Arcee AI مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API أو خيار مصادقة CLI
summary: إعداد Arcee AI (المصادقة + اختيار النموذج)
title: Arcee AI
x-i18n:
    generated_at: "2026-05-02T23:39:09Z"
    model: gpt-5.5
    provider: openai
    source_hash: 622ee5288aec3ae0b45d3f06ba65fd6f972e07d7a7596ae3905d6fbdac0bf737
    source_path: providers/arcee.md
    workflow: 16
---

توفر [Arcee AI](https://arcee.ai) الوصول إلى عائلة Trinity من نماذج خليط الخبراء عبر API متوافق مع OpenAI. جميع نماذج Trinity مرخصة بترخيص Apache 2.0.

يمكن الوصول إلى نماذج Arcee AI مباشرة عبر منصة Arcee أو من خلال [OpenRouter](/ar/providers/openrouter).

| الخاصية | القيمة                                                                                |
| -------- | ------------------------------------------------------------------------------------- |
| المزوّد | `arcee`                                                                               |
| المصادقة | `ARCEEAI_API_KEY` (مباشر) أو `OPENROUTER_API_KEY` (عبر OpenRouter)                   |
| API      | متوافق مع OpenAI                                                                      |
| عنوان URL الأساسي | `https://api.arcee.ai/api/v1` (مباشر) أو `https://openrouter.ai/api/v1` (OpenRouter) |

## البدء

<Tabs>
  <Tab title="Direct (Arcee platform)">
    <Steps>
      <Step title="Get an API key">
        أنشئ مفتاح API في [Arcee AI](https://chat.arcee.ai/).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-api-key
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```
      </Step>
    </Steps>
  </Tab>

  <Tab title="Via OpenRouter">
    <Steps>
      <Step title="Get an API key">
        أنشئ مفتاح API في [OpenRouter](https://openrouter.ai/keys).
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard --auth-choice arceeai-openrouter
        ```
      </Step>
      <Step title="Set a default model">
        ```json5
        {
          agents: {
            defaults: {
              model: { primary: "arcee/trinity-large-thinking" },
            },
          },
        }
        ```

        تعمل مراجع النماذج نفسها لكل من إعدادات الاتصال المباشر وOpenRouter (على سبيل المثال `arcee/trinity-large-thinking`).
      </Step>
    </Steps>

  </Tab>
</Tabs>

## الإعداد غير التفاعلي

<Tabs>
  <Tab title="Direct (Arcee platform)">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-api-key \
      --arceeai-api-key "$ARCEEAI_API_KEY"
    ```
  </Tab>

  <Tab title="Via OpenRouter">
    ```bash
    openclaw onboard --non-interactive \
      --mode local \
      --auth-choice arceeai-openrouter \
      --openrouter-api-key "$OPENROUTER_API_KEY"
    ```
  </Tab>
</Tabs>

## الكتالوج المضمّن

يشحن OpenClaw حاليًا كتالوج Arcee المضمّن هذا:

| مرجع النموذج                  | الاسم                  | الإدخال | السياق | التكلفة (إدخال/إخراج لكل 1M) | ملاحظات                                      |
| ------------------------------ | ---------------------- | ----- | ------- | -------------------- | ------------------------------------------ |
| `arcee/trinity-large-thinking` | Trinity Large Thinking | text  | 256K    | $0.25 / $0.90        | النموذج الافتراضي؛ التفكير مفعّل؛ بلا أدوات |
| `arcee/trinity-large-preview`  | Trinity Large Preview  | text  | 128K    | $0.25 / $1.00        | متعدد الأغراض؛ 400B معامل، 13B نشط          |
| `arcee/trinity-mini`           | Trinity Mini 26B       | text  | 128K    | $0.045 / $0.15       | سريع وفعّال من حيث التكلفة؛ استدعاء الدوال  |

<Tip>
يضبط إعداد التهيئة المسبق `arcee/trinity-large-thinking` بوصفه النموذج الافتراضي. إنه مخصص للاستدلال/النص فقط ولا يدعم استخدام الأدوات أو استدعاء الدوال.
</Tip>

## الميزات المدعومة

| الميزة                                        | مدعومة                                      |
| --------------------------------------------- | ------------------------------------------- |
| البث                                          | نعم                                         |
| استخدام الأدوات / استدعاء الدوال             | يعتمد على النموذج؛ ليس Trinity Large Thinking |
| الإخراج المنظم (وضع JSON ومخطط JSON)          | نعم                                         |
| التفكير الممتد                                | نعم (Trinity Large Thinking)                |

<AccordionGroup>
  <Accordion title="Environment note">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `ARCEEAI_API_KEY`
    (أو `OPENROUTER_API_KEY`) متاح لتلك العملية (على سبيل المثال، في
    `~/.openclaw/.env` أو عبر `env.shellEnv`).
  </Accordion>

  <Accordion title="OpenRouter routing">
    عند استخدام نماذج Arcee عبر OpenRouter، تنطبق مراجع نماذج `arcee/*` نفسها.
    يتولى OpenClaw التوجيه بشفافية بناءً على خيار المصادقة لديك. راجع
    [وثائق مزوّد OpenRouter](/ar/providers/openrouter) للحصول على تفاصيل
    التهيئة الخاصة بـ OpenRouter.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="OpenRouter" href="/ar/providers/openrouter" icon="shuffle">
    يمكنك الوصول إلى نماذج Arcee وكثير غيرها عبر مفتاح API واحد.
  </Card>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
</CardGroup>
