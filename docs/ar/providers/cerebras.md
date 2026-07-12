---
read_when:
    - تريد استخدام Cerebras مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح واجهة Cerebras البرمجية أو خيار المصادقة عبر CLI
summary: إعداد Cerebras (المصادقة + اختيار النموذج)
title: Cerebras
x-i18n:
    generated_at: "2026-07-12T06:21:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fca8110d345c796f0481ebf1a8d85c2cc9630b8bd55db8d4bf60772151b35b37
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) توفر استدلالًا عالي السرعة متوافقًا مع OpenAI على عتاد استدلال مخصص. تأتي Plugin مع كتالوج ثابت يضم أربعة نماذج (من دون اكتشاف مباشر).

| الخاصية                 | القيمة                                                    |
| ----------------------- | --------------------------------------------------------- |
| معرّف المزوّد           | `cerebras`                                                |
| Plugin                  | حزمة خارجية رسمية (`@openclaw/cerebras-provider`)         |
| متغير بيئة المصادقة     | `CEREBRAS_API_KEY`                                        |
| خيار الإعداد الأولي     | `--auth-choice cerebras-api-key`                          |
| خيار CLI المباشر        | `--cerebras-api-key <key>`                                |
| API                     | متوافقة مع OpenAI (`openai-completions`)                  |
| عنوان URL الأساسي       | `https://api.cerebras.ai/v1`                              |
| النموذج الافتراضي       | `cerebras/zai-glm-4.7`                                    |

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم Cerebras السحابية](https://cloud.cerebras.ai).
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    <CodeGroup>

```bash الإعداد الأولي
openclaw onboard --auth-choice cerebras-api-key
```

```bash الخيار المباشر
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash البيئة فقط
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="التحقق من توفر النماذج">
    ```bash
    openclaw models list --provider cerebras
    ```

    يسرد هذا النماذج الثابتة الأربعة جميعها. إذا تعذّر العثور على قيمة `CEREBRAS_API_KEY`، فسيُبلغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

## الإعداد غير التفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## الكتالوج المضمّن

تشترك النماذج الأربعة جميعها في نافذة سياق بسعة 128 ألف رمز وحد أقصى للمخرجات يبلغ 8,192 رمزًا.

| مرجع النموذج                              | الاسم                 | الاستدلال | الملاحظات                                  |
| ----------------------------------------- | -------------------- | --------- | ------------------------------------------ |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | نعم       | النموذج الافتراضي؛ نموذج استدلال تجريبي    |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | نعم       | نموذج استدلال للإنتاج                      |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | لا        | نموذج تجريبي دون استدلال                   |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | لا        | نموذج إنتاج يركز على السرعة                |

<Warning>
تصنّف Cerebras النموذجين `zai-glm-4.7` و`qwen-3-235b-a22b-instruct-2507` كنموذجين تجريبيين، كما تشير وثائقها إلى إيقاف `llama3.1-8b` و`qwen-3-235b-a22b-instruct-2507` في 27 مايو 2026. راجع [صفحة النماذج المدعومة](https://inference-docs.cerebras.ai/models/overview) لدى Cerebras قبل الاعتماد عليها في أعباء عمل الإنتاج.
</Warning>

## الضبط اليدوي

لا تحتاج معظم عمليات الإعداد إلا إلى مفتاح API. استخدم إعداد `models.providers.cerebras` الصريح لتجاوز بيانات النموذج الوصفية أو التشغيل باستخدام `mode: "merge"` مع الكتالوج الثابت:

```json5
{
  env: { CEREBRAS_API_KEY: "csk-..." },
  agents: {
    defaults: {
      model: { primary: "cerebras/zai-glm-4.7" },
    },
  },
  models: {
    mode: "merge",
    providers: {
      cerebras: {
        baseUrl: "https://api.cerebras.ai/v1",
        apiKey: "${CEREBRAS_API_KEY}",
        api: "openai-completions",
        models: [
          { id: "zai-glm-4.7", name: "Z.ai GLM 4.7" },
          { id: "gpt-oss-120b", name: "GPT OSS 120B" },
        ],
      },
    },
  },
}
```

<Note>
إذا كان Gateway يعمل كخدمة خفية (launchd أو systemd أو Docker)، فتأكد من إتاحة `CEREBRAS_API_KEY` لتلك العملية، على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`. لن يفيد المفتاح المصدَّر في صدفة تفاعلية فقط خدمةً مُدارة ما لم تُستورد البيئة بصورة منفصلة.
</Note>

## موضوعات ذات صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الأعطال.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال لنموذجي Cerebras القادرين على الاستدلال.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل وإعداد النماذج.
  </Card>
  <Card title="الأسئلة الشائعة حول النماذج" href="/ar/help/faq-models" icon="circle-question">
    ملفات تعريف المصادقة والتبديل بين النماذج وحل أخطاء "no profile".
  </Card>
</CardGroup>
