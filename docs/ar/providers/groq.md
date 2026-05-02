---
read_when:
    - تريد استخدام Groq مع OpenClaw
    - تحتاج إلى متغير البيئة لمفتاح API أو خيار مصادقة CLI
summary: إعداد Groq (المصادقة + اختيار النموذج)
title: Groq
x-i18n:
    generated_at: "2026-05-02T07:39:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2cf6678047581a438906420894b250bafb68d71254fbaf30ea5dfcfc4799eac7
    source_path: providers/groq.md
    workflow: 16
---

[Groq](https://groq.com) يوفّر استدلالًا فائق السرعة على النماذج مفتوحة المصدر
(Llama وGemma وMistral والمزيد) باستخدام عتاد LPU مخصّص. يتصل OpenClaw
بـ Groq عبر API المتوافق مع OpenAI.

| الخاصية | القيمة            |
| -------- | ----------------- |
| المزوّد | `groq`            |
| المصادقة | `GROQ_API_KEY`    |
| API      | متوافق مع OpenAI |

## البدء

<Steps>
  <Step title="Get an API key">
    أنشئ مفتاح API في [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="Set the API key">
    ```bash
    export GROQ_API_KEY="gsk_..."
    ```
  </Step>
  <Step title="Set a default model">
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
</Steps>

### مثال ملف التكوين

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

## الفهرس المضمّن

يشحن OpenClaw فهرس Groq مدعومًا ببيان لسرد النماذج بسرعة مع التصفية حسب المزوّد.
شغّل `openclaw models list --all --provider groq` لرؤية الصفوف المضمّنة،
أو راجع
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| النموذج                    | ملاحظات                           |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | للأغراض العامة، بسياق كبير        |
| **Llama 3.1 8B Instant**    | سريع وخفيف                        |
| **Gemma 2 9B**              | مدمج وفعّال                       |
| **Mixtral 8x7B**            | بنية MoE، واستدلال قوي            |

<Tip>
استخدم `openclaw models list --all --provider groq` لصفوف Groq المدعومة ببيان
والمعروفة لإصدار OpenClaw هذا.
</Tip>

## نماذج الاستدلال

يربط OpenClaw مستويات `/think` المشتركة لديه بقيم `reasoning_effort` الخاصة
بنماذج Groq. بالنسبة إلى `qwen/qwen3-32b`، يرسل التفكير المعطّل `none`
ويرسل التفكير المفعّل `default`. وبالنسبة إلى نماذج استدلال Groq GPT-OSS،
يرسل OpenClaw `low` أو `medium` أو `high`؛ أما التفكير المعطّل فيحذف
`reasoning_effort` لأن تلك النماذج لا تدعم قيمة تعطيل.

## نسخ الصوت

يوفّر Groq أيضًا نسخًا صوتيًا سريعًا قائمًا على Whisper. عند تكوينه كمزوّد
لفهم الوسائط، يستخدم OpenClaw نموذج Groq `whisper-large-v3-turbo`
لنسخ الرسائل الصوتية عبر سطح `tools.media.audio` المشترك.

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
  <Accordion title="Audio transcription details">
    | الخاصية | القيمة |
    |----------|-------|
    | مسار التكوين المشترك | `tools.media.audio` |
    | عنوان URL الأساسي الافتراضي | `https://api.groq.com/openai/v1` |
    | النموذج الافتراضي | `whisper-large-v3-turbo` |
    | نقطة نهاية API | متوافقة مع OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="Environment note">
    إذا كان Gateway يعمل كخدمة خفية (launchd/systemd)، فتأكد من أن `GROQ_API_KEY`
    متاح لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة فقط في الصدفة التفاعلية لديك لا تكون مرئية لعمليات
    Gateway المُدارة كخدمة خفية. استخدم تكوين `~/.openclaw/.env` أو `env.shellEnv`
    لضمان التوفر الدائم.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="Model selection" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك تجاوز الفشل.
  </Card>
  <Card title="Configuration reference" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط التكوين الكامل بما في ذلك إعدادات المزوّد والصوت.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    لوحة معلومات Groq ووثائق API والتسعير.
  </Card>
  <Card title="Groq model list" href="https://console.groq.com/docs/models" icon="list">
    فهرس نماذج Groq الرسمي.
  </Card>
</CardGroup>
