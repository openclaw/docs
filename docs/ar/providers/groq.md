---
read_when:
    - تريد استخدام Groq مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API أو خيار المصادقة عبر CLI
    - أنت تُعِدّ تحويل الصوت إلى نص باستخدام Whisper على Groq
summary: إعداد Groq (المصادقة + اختيار النموذج + النسخ باستخدام Whisper)
title: Groq
x-i18n:
    generated_at: "2026-07-12T06:29:26Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f04f9365127c72aa2f976f453e5d11657b19d6b4a57de1179b88924744db1dc1
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) توفّر استدلالًا فائق السرعة على النماذج ذات الأوزان المفتوحة (Llama وGemma وKimi وQwen وGPT OSS وغيرها) باستخدام عتاد LPU مخصص. يسجّل Plugin ‏Groq موفّر محادثة متوافقًا مع OpenAI وموفّرًا لفهم الوسائط الصوتية.

| الخاصية               | القيمة                                    |
| ---------------------- | ---------------------------------------- |
| معرّف الموفّر            | `groq`                                   |
| Plugin                 | حزمة خارجية رسمية                         |
| متغير بيئة المصادقة      | `GROQ_API_KEY`                           |
| API                    | متوافق مع OpenAI (`openai-completions`) |
| عنوان URL الأساسي       | `https://api.groq.com/openai/v1`         |
| نسخ الصوت               | `whisper-large-v3-turbo` (الافتراضي)       |
| الإعداد الافتراضي المقترح للمحادثة | `groq/llama-3.3-70b-versatile`           |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API على [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="تعيين مفتاح API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="تعيين نموذج افتراضي">
    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/llama-3.3-70b-versatile" },
        },
      },
    }
    ```
  </Step>
  <Step title="التحقق من إمكانية الوصول إلى الكتالوج">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### مثال على ملف الإعداد

```json5
{
  env: { GROQ_API_KEY: "gsk_..." },
  agents: {
    defaults: {
      model: { primary: "groq/llama-3.3-70b-versatile" },
    },
  },
}
```

## الكتالوج المضمّن

يأتي OpenClaw مع كتالوج Groq مدعوم ببيان، ويضم إدخالات استدلالية وغير استدلالية. شغّل `openclaw models list --provider groq` للاطلاع على الصفوف الثابتة الخاصة بالإصدار المثبّت لديك، أو راجع [console.groq.com/docs/models](https://console.groq.com/docs/models) للاطلاع على قائمة Groq المعتمدة.

| مرجع النموذج                                        | الاسم                    | الاستدلال | الإدخال        | السياق |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | لا        | نص         | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | لا        | نص         | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | لا        | نص + صورة | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | نعم       | نص         | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | نعم       | نص         | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | نعم       | نص         | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | نعم       | نص         | 131,072 |
| `groq/groq/compound`                             | Compound                | نعم       | نص         | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | نعم       | نص         | 131,072 |

<Tip>
  يتطوّر الكتالوج مع كل إصدار من OpenClaw. يعرض `openclaw models list --provider groq` الصفوف المعروفة للإصدار المثبّت لديك؛ وقارنها مع [console.groq.com/docs/models](https://console.groq.com/docs/models) لمعرفة النماذج المضافة حديثًا أو المهملة.
</Tip>

## نماذج الاستدلال

تربط نماذج الاستدلال في Groq (ذات `reasoning: true` في الجدول أعلاه) مستويات `/think` المشتركة في OpenClaw بقيم `reasoning_effort` التي تساوي `low` أو `medium` أو `high`. يؤدي `/think off` أو `/think none` إلى حذف `reasoning_effort` من الطلب بدلًا من إرسال قيمة تعطيل.

راجع [أوضاع التفكير](/ar/tools/thinking) لمعرفة مستويات `/think` المشتركة وكيفية ترجمة OpenClaw لها حسب كل موفّر.

## نسخ الصوت

يسجّل Plugin ‏Groq أيضًا **موفّرًا لفهم الوسائط الصوتية** بحيث يمكن نسخ الرسائل الصوتية عبر الواجهة المشتركة `tools.media.audio`.

| الخاصية           | القيمة                                     |
| ------------------ | ----------------------------------------- |
| مسار الإعداد المشترك | `tools.media.audio`                       |
| عنوان URL الأساسي الافتراضي | `https://api.groq.com/openai/v1`          |
| النموذج الافتراضي      | `whisper-large-v3-turbo`                  |
| الأولوية التلقائية      | 20                                        |
| نقطة نهاية API       | `/audio/transcriptions` متوافقة مع OpenAI |

لجعل Groq الواجهة الخلفية الافتراضية للصوت:

```json5
{
  tools: {
    media: {
      audio: {
        models: [{ provider: "groq" }],
      },
    },
  },
}
```

<AccordionGroup>
  <Accordion title="توفر البيئة للخدمة الخفية">
    إذا كان Gateway يعمل كخدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون `GROQ_API_KEY` مرئيًا لتلك العملية، وليس فقط لصدفتك التفاعلية.

    <Warning>
      لن يفيد المفتاح المصدَّر في صدفة تفاعلية فقط خدمة launchd أو systemd الخفية ما لم تُستورد تلك البيئة إليها أيضًا. عيّن المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لجعله قابلًا للقراءة من عملية Gateway.
    </Warning>

  </Accordion>

  <Accordion title="معرّفات نماذج Groq المخصصة">
    يقبل OpenClaw أي معرّف نموذج من Groq في وقت التشغيل. استخدم المعرّف الدقيق الذي تعرضه Groq وأضف إليه البادئة `groq/`. يغطي الكتالوج الثابت الحالات الشائعة؛ أما المعرّفات غير المدرجة في الكتالوج فتستخدم قالب OpenAI المتوافق الافتراضي.

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "groq/<your-model-id>" },
        },
      },
    }
    ```

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="موفّرو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار الموفّرين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال والتفاعل مع سياسة الموفّر.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل، بما في ذلك إعدادات الموفّر والصوت.
  </Card>
  <Card title="وحدة تحكم Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    لوحة معلومات Groq ووثائق API والأسعار.
  </Card>
</CardGroup>
