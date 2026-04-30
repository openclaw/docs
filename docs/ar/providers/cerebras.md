---
read_when:
    - تريد استخدام Cerebras مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API لـ Cerebras أو خيار مصادقة CLI
summary: إعداد Cerebras (المصادقة + اختيار النموذج)
title: Cerebras
x-i18n:
    generated_at: "2026-04-30T08:19:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 96f94b23e55340414633ff48e352623907ee36dd2715e5ab053a93c86df1b49a
    source_path: providers/cerebras.md
    workflow: 16
---

[Cerebras](https://www.cerebras.ai) يوفّر استدلالًا عالي السرعة متوافقًا مع OpenAI.

| الخاصية | القيمة                        |
| -------- | ---------------------------- |
| المزوّد | `cerebras`                   |
| المصادقة     | `CEREBRAS_API_KEY`           |
| API      | متوافق مع OpenAI            |
| عنوان URL الأساسي | `https://api.cerebras.ai/v1` |

## البدء

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API في [وحدة تحكم Cerebras Cloud](https://cloud.cerebras.ai).
  </Step>
  <Step title="تشغيل الإعداد الأولي">
    ```bash
    openclaw onboard --auth-choice cerebras-api-key
    ```
  </Step>
  <Step title="التحقق من توفر النماذج">
    ```bash
    openclaw models list --provider cerebras
    ```
  </Step>
</Steps>

### الإعداد غير التفاعلي

```bash
openclaw onboard --non-interactive \
  --mode local \
  --auth-choice cerebras-api-key \
  --cerebras-api-key "$CEREBRAS_API_KEY"
```

## الكتالوج المضمّن

يشحن OpenClaw كتالوج Cerebras ثابتًا لنقطة النهاية العامة المتوافقة مع OpenAI:

| مرجع النموذج                                 | الاسم                 | ملاحظات                                  |
| ----------------------------------------- | -------------------- | -------------------------------------- |
| `cerebras/zai-glm-4.7`                    | Z.ai GLM 4.7         | النموذج الافتراضي؛ نموذج استدلال تجريبي |
| `cerebras/gpt-oss-120b`                   | GPT OSS 120B         | نموذج استدلال للإنتاج             |
| `cerebras/qwen-3-235b-a22b-instruct-2507` | Qwen 3 235B Instruct | نموذج تجريبي بلا استدلال            |
| `cerebras/llama3.1-8b`                    | Llama 3.1 8B         | نموذج إنتاج يركز على السرعة         |

<Warning>
تضع Cerebras علامتَي معاينة على `zai-glm-4.7` و`qwen-3-235b-a22b-instruct-2507`، كما توثّق إيقاف `llama3.1-8b` / `qwen-3-235b-a22b-instruct-2507` في 27 مايو 2026. راجع صفحة النماذج المدعومة لدى Cerebras قبل الاعتماد عليها في الإنتاج.
</Warning>

## الإعداد اليدوي

عادةً يعني Plugin المضمّن أنك لا تحتاج إلا إلى مفتاح API. استخدم إعداد
`models.providers.cerebras` الصريح عندما تريد تجاوز بيانات تعريف النموذج:

```json5
{
  env: { CEREBRAS_API_KEY: "sk-..." },
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
إذا كان Gateway يعمل كبرنامج خفي (launchd/systemd)، فتأكد من أن `CEREBRAS_API_KEY`
متاح لتلك العملية، على سبيل المثال في `~/.openclaw/.env` أو عبر
`env.shellEnv`.
</Note>
