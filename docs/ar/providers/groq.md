---
read_when:
    - تريد استخدام Groq مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو اختيار المصادقة عبر CLI
summary: إعداد Groq (المصادقة + اختيار النموذج)
title: Groq
x-i18n:
    generated_at: "2026-04-30T08:20:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: ed612471939e7ac5362f8236f179d38ae07f9076709ff55020c1790f7c56a6fa
    source_path: providers/groq.md
    workflow: 16
---

توفّر [Groq](https://groq.com) استدلالًا فائق السرعة على نماذج مفتوحة المصدر
(Llama وGemma وMistral والمزيد) باستخدام عتاد LPU مخصّص. يتصل OpenClaw
بـ Groq عبر API المتوافق مع OpenAI.

| الخاصية | القيمة             |
| -------- | ----------------- |
| المزوّد | `groq`            |
| المصادقة     | `GROQ_API_KEY`    |
| API      | متوافق مع OpenAI |

## بدء الاستخدام

<Steps>
  <Step title="الحصول على مفتاح API">
    أنشئ مفتاح API في [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="تعيين مفتاح API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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
</Steps>

### مثال ملف الإعدادات

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

يتغير فهرس نماذج Groq كثيرًا. شغّل `openclaw models list | grep groq`
للاطلاع على النماذج المتاحة حاليًا، أو راجع
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| النموذج                       | الملاحظات                              |
| --------------------------- | ---------------------------------- |
| **Llama 3.3 70B Versatile** | للأغراض العامة، سياق كبير     |
| **Llama 3.1 8B Instant**    | سريع وخفيف                  |
| **Gemma 2 9B**              | مدمج وفعّال                 |
| **Mixtral 8x7B**            | معمارية MoE، استدلال قوي |

<Tip>
استخدم `openclaw models list --provider groq` للحصول على أحدث قائمة بالنماذج
المتاحة في حسابك.
</Tip>

## نماذج الاستدلال

يربط OpenClaw مستويات `/think` المشتركة لديه بقيم `reasoning_effort` الخاصة
بنماذج Groq. بالنسبة إلى `qwen/qwen3-32b`، يرسل التفكير المعطّل
`none` ويرسل التفكير المفعّل `default`. بالنسبة إلى نماذج استدلال Groq GPT-OSS،
يرسل OpenClaw `low` أو `medium` أو `high`؛ وعند تعطيل التفكير، يُسقط
`reasoning_effort` لأن هذه النماذج لا تدعم قيمة معطّلة.

## نسخ الصوت

توفّر Groq أيضًا نسخًا سريعًا للصوت مستندًا إلى Whisper. عند تهيئتها كمزوّد
لفهم الوسائط، يستخدم OpenClaw نموذج Groq `whisper-large-v3-turbo`
لنسخ الرسائل الصوتية عبر السطح المشترك `tools.media.audio`.

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
  <Accordion title="تفاصيل نسخ الصوت">
    | الخاصية | القيمة |
    |----------|-------|
    | مسار الإعداد المشترك | `tools.media.audio` |
    | عنوان URL الأساسي الافتراضي   | `https://api.groq.com/openai/v1` |
    | النموذج الافتراضي      | `whisper-large-v3-turbo` |
    | نقطة نهاية API       | متوافقة مع OpenAI `/audio/transcriptions` |
  </Accordion>

  <Accordion title="ملاحظة عن البيئة">
    إذا كان Gateway يعمل كخدمة خلفية (launchd/systemd)، فتأكد من أن `GROQ_API_KEY` متاح
    لتلك العملية (على سبيل المثال، في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).

    <Warning>
    المفاتيح المعيّنة فقط في صدفتك التفاعلية غير مرئية لعمليات gateway المُدارة
    كخدمات خلفية. استخدم إعداد `~/.openclaw/.env` أو `env.shellEnv`
    للتوافر الدائم.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين ومراجع النماذج وسلوك تجاوز الفشل.
  </Card>
  <Card title="مرجع الإعدادات" href="/ar/gateway/configuration-reference" icon="gear">
    مخطط الإعدادات الكامل بما في ذلك إعدادات المزوّد والصوت.
  </Card>
  <Card title="وحدة تحكم Groq" href="https://console.groq.com" icon="arrow-up-right-from-square">
    لوحة معلومات Groq ووثائق API والأسعار.
  </Card>
  <Card title="قائمة نماذج Groq" href="https://console.groq.com/docs/models" icon="list">
    فهرس نماذج Groq الرسمي.
  </Card>
</CardGroup>
