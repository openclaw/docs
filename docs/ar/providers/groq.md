---
read_when:
    - تريد استخدام Groq مع OpenClaw
    - تحتاج إلى متغير البيئة الخاص بمفتاح API أو خيار مصادقة CLI
    - أنت تضبط نسخ الصوت باستخدام Whisper على Groq
summary: إعداد Groq (المصادقة + اختيار النموذج + تفريغ Whisper)
title: Groq
x-i18n:
    generated_at: "2026-06-27T18:25:08Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: f1133f2b1fa09e2e854b5762e189233597e86e8ccb2df8d619e891b4dc9c8d82
    source_path: providers/groq.md
    workflow: 16
---

يوفّر [Groq](https://groq.com) استدلالًا فائق السرعة على نماذج مفتوحة الأوزان (Llama وGemma وKimi وQwen وGPT OSS وغير ذلك) باستخدام عتاد LPU مخصّص. يسجّل Groq Plugin كلًا من مزوّد محادثة متوافق مع OpenAI ومزوّد لفهم الوسائط الصوتية.

| الخاصية                | القيمة                                   |
| ---------------------- | ---------------------------------------- |
| معرّف المزوّد          | `groq`                                   |
| Plugin                 | حزمة خارجية رسمية                       |
| متغيّر بيئة المصادقة   | `GROQ_API_KEY`                           |
| API                    | متوافق مع OpenAI (`openai-completions`)  |
| عنوان URL الأساسي      | `https://api.groq.com/openai/v1`         |
| تفريغ الصوت            | `whisper-large-v3-turbo` (افتراضي)       |
| افتراضي المحادثة المقترح | `groq/llama-3.3-70b-versatile`         |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/groq-provider
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API في [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="اضبط مفتاح API">
    ```bash
export GROQ_API_KEY=gsk_...
```
  </Step>
  <Step title="اضبط نموذجًا افتراضيًا">
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
  <Step title="تحقّق من إمكانية الوصول إلى الكتالوج">
    ```bash
    openclaw models list --provider groq
    ```
  </Step>
</Steps>

### مثال ملف الإعداد

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

يشحن OpenClaw كتالوج Groq مستندًا إلى manifest، مع إدخالات للاستدلال وبدونه. شغّل `openclaw models list --provider groq` للاطلاع على الصفوف الثابتة في نسختك المثبّتة، أو راجع [console.groq.com/docs/models](https://console.groq.com/docs/models) للحصول على قائمة Groq الموثوقة.

| مرجع النموذج                                    | الاسم                   | الاستدلال | الإدخال       | السياق  |
| ------------------------------------------------ | ----------------------- | --------- | ------------ | ------- |
| `groq/llama-3.3-70b-versatile`                   | Llama 3.3 70B Versatile | لا        | نص           | 131,072 |
| `groq/llama-3.1-8b-instant`                      | Llama 3.1 8B Instant    | لا        | نص           | 131,072 |
| `groq/meta-llama/llama-4-scout-17b-16e-instruct` | Llama 4 Scout 17B       | لا        | نص + صورة    | 131,072 |
| `groq/openai/gpt-oss-120b`                       | GPT OSS 120B            | نعم       | نص           | 131,072 |
| `groq/openai/gpt-oss-20b`                        | GPT OSS 20B             | نعم       | نص           | 131,072 |
| `groq/openai/gpt-oss-safeguard-20b`              | Safety GPT OSS 20B      | نعم       | نص           | 131,072 |
| `groq/qwen/qwen3-32b`                            | Qwen3 32B               | نعم       | نص           | 131,072 |
| `groq/groq/compound`                             | Compound                | نعم       | نص           | 131,072 |
| `groq/groq/compound-mini`                        | Compound Mini           | نعم       | نص           | 131,072 |

<Tip>
  يتطوّر الكتالوج مع كل إصدار من OpenClaw. يعرض `openclaw models list --provider groq` الصفوف المعروفة لنسختك المثبّتة؛ قارِنها مع [console.groq.com/docs/models](https://console.groq.com/docs/models) للتحقّق من النماذج المضافة حديثًا أو المهملة.
</Tip>

## نماذج الاستدلال

يربط OpenClaw مستويات `/think` المشتركة بقيم `reasoning_effort` الخاصة بنماذج Groq:

- بالنسبة إلى `qwen/qwen3-32b`، يرسل تعطيل التفكير `none` ويرسل تفعيل التفكير `default`.
- بالنسبة إلى نماذج الاستدلال Groq GPT OSS (`openai/gpt-oss-*`)، يرسل OpenClaw القيمة `low` أو `medium` أو `high` بناءً على مستوى `/think`. عند تعطيل التفكير، لا يرسل `reasoning_effort` لأن هذه النماذج لا تدعم قيمة معطّلة.
- تستخدم DeepSeek R1 Distill وQwen QwQ وCompound واجهة الاستدلال الأصلية في Groq؛ يتحكّم `/think` في الظهور، لكن النموذج يستدل دائمًا.

راجع [أوضاع التفكير](/ar/tools/thinking) لمعرفة مستويات `/think` المشتركة وكيف يترجمها OpenClaw لكل مزوّد.

## تفريغ الصوت

يسجّل Groq Plugin أيضًا **مزوّدًا لفهم الوسائط الصوتية** حتى يمكن تفريغ الرسائل الصوتية عبر واجهة `tools.media.audio` المشتركة.

| الخاصية               | القيمة                                    |
| --------------------- | ----------------------------------------- |
| مسار الإعداد المشترك  | `tools.media.audio`                       |
| عنوان URL الافتراضي الأساسي | `https://api.groq.com/openai/v1`    |
| النموذج الافتراضي     | `whisper-large-v3-turbo`                  |
| الأولوية التلقائية    | 20                                        |
| نقطة نهاية API        | متوافقة مع OpenAI `/audio/transcriptions` |

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
  <Accordion title="توفّر البيئة للبرنامج الخفي">
    إذا كان Gateway يعمل كخدمة مُدارة (launchd أو systemd أو Docker)، فيجب أن يكون `GROQ_API_KEY` مرئيًا لتلك العملية، وليس فقط للصدفة التفاعلية لديك.

    <Warning>
      لن يفيد المفتاح المصدّر في صدفة تفاعلية فقط برنامجًا خفيًا من launchd أو systemd ما لم تُستورد تلك البيئة هناك أيضًا. اضبط المفتاح في `~/.openclaw/.env` أو عبر `env.shellEnv` لجعله قابلًا للقراءة من عملية gateway.
    </Warning>

  </Accordion>

  <Accordion title="معرّفات نماذج Groq المخصّصة">
    يقبل OpenClaw أي معرّف نموذج Groq وقت التشغيل. استخدم المعرّف الدقيق الذي يعرضه Groq وأضف إليه البادئة `groq/`. يغطي الكتالوج الثابت الحالات الشائعة؛ أما المعرّفات غير المدرجة في الكتالوج فتمرّ إلى القالب الافتراضي المتوافق مع OpenAI.

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

## ذات صلة

<CardGroup cols={2}>
  <Card title="مزوّدو النماذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="أوضاع التفكير" href="/ar/tools/thinking" icon="brain">
    مستويات جهد الاستدلال وتفاعل سياسة المزوّد.
  </Card>
  <Card title="مرجع الإعداد" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعداد الكامل، بما في ذلك إعدادات المزوّد والصوت.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    لوحة تحكم Groq ووثائق API والتسعير.
  </Card>
</CardGroup>
