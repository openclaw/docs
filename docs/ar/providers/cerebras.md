---
read_when:
    - تريد استخدام Cerebras مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح Cerebras API أو خيار مصادقة CLI
summary: إعداد Cerebras (المصادقة + اختيار النموذج)
title: Cerebras
x-i18n:
    generated_at: "2026-05-06T08:09:27Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6ba12fcc214ac756111a94f16ec619d26dc01ee2acc1eaef013fcb70bf752610
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) توفّر استدلالًا عالي السرعة متوافقًا مع OpenAI على عتاد استدلال مخصّص. يتضمن OpenClaw Plugin مزوّد Cerebras مضمّنًا مع كتالوج ثابت من أربعة نماذج.

| الخاصية         | القيمة                                   |
| --------------- | ---------------------------------------- |
| معرّف المزوّد   | `cerebras`                               |
| Plugin          | مضمّن، `enabledByDefault: true`          |
| متغير بيئة المصادقة | `CEREBRAS_API_KEY`                       |
| علامة الإعداد الأولي | `--auth-choice cerebras-api-key`         |
| علامة CLI مباشرة | `--cerebras-api-key <key>`               |
| API             | متوافق مع OpenAI (`openai-completions`) |
| عنوان URL الأساسي | `https://api.cerebras.ai/v1`             |
| النموذج الافتراضي | `cerebras/zai-glm-4.7`                   |

## البدء

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API في [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    <CodeGroup>

```bash Onboarding
openclaw onboard --auth-choice cerebras-api-key
```

```bash Direct flag
openclaw onboard --non-interactive \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

```bash Env only
export CEREBRAS_API_KEY=csk-...
```

    </CodeGroup>

  </Step>
  <Step title="التحقق من توفر النماذج">
    ```bash
    openclaw models list --provider cerebras
    ```

    ينبغي أن تتضمن القائمة النماذج الأربعة المضمّنة كلها. إذا تعذّر حل `CEREBRAS_API_KEY`، فسيبلّغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

## إعداد غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## الكتالوج المضمّن

يشحن OpenClaw كتالوج Cerebras ثابتًا يعكس نقطة النهاية العامة المتوافقة مع OpenAI. تشترك النماذج الأربعة كلها في سياق 128k و8,192 رمز إخراج كحد أقصى.

| مرجع النموذج                              | الاسم                | الاستدلال | ملاحظات                               |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | نعم       | النموذج الافتراضي؛ نموذج استدلال للمعاينة |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | نعم       | نموذج استدلال إنتاجي                  |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | لا        | نموذج معاينة غير استدلالي             |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | لا        | نموذج إنتاجي يركز على السرعة          |

<Warning>
  تضع Cerebras علامتَي معاينة على `zai-glm-4.7` و`qwen-3-235b-a22b-instruct-2507`، كما أن `llama3.1-8b` إضافةً إلى `qwen-3-235b-a22b-instruct-2507` موثّقان للإيقاف في 27 مايو 2026. راجع صفحة النماذج المدعومة لدى Cerebras قبل الاعتماد عليها لأحمال العمل الإنتاجية.
</Warning>

## الإعداد اليدوي

يعني Plugin المضمّن عادةً أنك لا تحتاج إلا إلى مفتاح API. استخدم إعداد `models.providers.cerebras` الصريح عندما تريد تجاوز بيانات تعريف النموذج أو التشغيل في `mode: "merge"` مقابل الكتالوج الثابت:

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
  إذا كان Gateway يعمل كخدمة خفية (launchd أو systemd أو Docker)، فتأكد من أن `CEREBRAS_API_KEY` متاح لتلك العملية — على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`. لن يفيد وجود مفتاح في `~/.profile` فقط خدمةً مُدارة ما لم تُستورد البيئة بشكل منفصل.
</Note>

## ذو صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال لنموذجي Cerebras القادرين على الاستدلال.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكلاء وإعدادات النماذج.
  </Card>
  <Card title="الأسئلة الشائعة حول النماذج" href="/ar/help/faq-models" icon="circle-question">
    ملفات المصادقة الشخصية، وتبديل النماذج، وحل أخطاء "no profile".
  </Card>
</CardGroup>
