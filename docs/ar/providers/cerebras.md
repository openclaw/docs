---
read_when:
    - تريد استخدام Cerebras مع OpenClaw
    - تحتاج إلى متغيّر بيئة مفتاح Cerebras API أو اختيار مصادقة CLI
summary: إعداد Cerebras (المصادقة + اختيار النموذج)
title: Cerebras
x-i18n:
    generated_at: "2026-06-27T18:22:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: cd21756ac521c7b60ca6d3dfbef8665574dca52d1a25e6293169b24f4af6273e
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) يوفّر استدلالًا عالي السرعة متوافقًا مع OpenAI على عتاد استدلال مخصص. يتضمن Plugin مزوّد Cerebras كتالوجًا ثابتًا من أربعة نماذج.

| الخاصية          | القيمة                                  |
| ---------------- | --------------------------------------- |
| معرّف المزوّد     | `cerebras`                              |
| Plugin           | حزمة خارجية رسمية                      |
| متغير بيئة المصادقة | `CEREBRAS_API_KEY`                    |
| علم الإعداد الأولي | `--auth-choice cerebras-api-key`       |
| علم CLI المباشر  | `--cerebras-api-key <key>`              |
| API              | متوافق مع OpenAI (`openai-completions`) |
| عنوان URL الأساسي | `https://api.cerebras.ai/v1`           |
| النموذج الافتراضي | `cerebras/zai-glm-4.7`                 |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/cerebras-provider
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="Get an API key">
    أنشئ مفتاح API في [Cerebras Cloud Console](https://cloud.cerebras.ai).
  </Step>
  <Step title="Run onboarding">
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
  <Step title="Verify models are available">
    ```bash
    openclaw models list --provider cerebras
    ```

    يجب أن تتضمن القائمة النماذج الثابتة الأربعة كلها. إذا لم يُحلّ `CEREBRAS_API_KEY`، فسيبلغ `openclaw models status --json` عن بيانات الاعتماد المفقودة ضمن `auth.unusableProfiles`.

  </Step>
</Steps>

## إعداد غير تفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## الكتالوج المدمج

يشحن OpenClaw كتالوج Cerebras ثابتًا يعكس نقطة النهاية العامة المتوافقة مع OpenAI. تشترك النماذج الأربعة كلها في سياق 128 ألفًا و8,192 رمزًا كحد أقصى للإخراج.

| مرجع النموذج                              | الاسم                | الاستدلال | ملاحظات                                      |
| ----------------------------------------- | -------------------- | --------- | -------------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | نعم       | النموذج الافتراضي؛ نموذج استدلال للمعاينة   |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | نعم       | نموذج استدلال للإنتاج                        |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | لا        | نموذج معاينة بلا استدلال                     |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | لا        | نموذج إنتاج يركّز على السرعة                 |

<Warning>
  تضع Cerebras علامتي `zai-glm-4.7` و`qwen-3-235b-a22b-instruct-2507` كنماذج معاينة، وتوثّق أن `llama3.1-8b` مع `qwen-3-235b-a22b-instruct-2507` سيُلغيان في 27 مايو 2026. تحقّق من صفحة النماذج المدعومة لدى Cerebras قبل الاعتماد عليها لأحمال عمل الإنتاج.
</Warning>

## إعداد يدوي

يعني Plugin عادة أنك لا تحتاج إلا إلى مفتاح API. استخدم إعداد `models.providers.cerebras` الصريح عندما تريد تجاوز بيانات تعريف النموذج أو التشغيل في `mode: "merge"` مقابل الكتالوج الثابت:

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
  إذا كان Gateway يعمل كخدمة خفية (launchd أو systemd أو Docker)، فتأكد من أن `CEREBRAS_API_KEY` متاح لتلك العملية، على سبيل المثال في `~/.openclaw/.env` أو عبر `env.shellEnv`. لن يفيد المفتاح المُصدَّر فقط في صدفة تفاعلية خدمةً مُدارة ما لم تُستورد البيئة بشكل منفصل.
</Note>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model providers" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Thinking modes" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال لنموذجي Cerebras القادرين على الاستدلال.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/config-agents#agent-defaults" icon="gear">
    الإعدادات الافتراضية للوكيل وإعدادات النموذج.
  </Card>
  <Card title="Models FAQ" href="/ar/help/faq-models" icon="circle-question">
    ملفات تعريف المصادقة، وتبديل النماذج، وحل أخطاء "no profile".
  </Card>
</CardGroup>
