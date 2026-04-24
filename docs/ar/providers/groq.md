---
read_when:
    - تريد استخدام Groq مع OpenClaw
    - تحتاج إلى متغير بيئة مفتاح API أو خيار المصادقة في CLI
summary: إعداد Groq ‏(المصادقة + اختيار النموذج)
title: Groq
x-i18n:
    generated_at: "2026-04-24T07:59:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1c711297d42dea7fabe8ba941f75ef9dc82bd9b838f78d5dc4385210d9f65ade
    source_path: providers/groq.md
    workflow: 15
---

يوفر [Groq](https://groq.com) استدلالًا فائق السرعة على النماذج مفتوحة المصدر
‏(Llama وGemma وMistral والمزيد) باستخدام عتاد LPU مخصص. ويتصل OpenClaw
بـ Groq عبر واجهة API المتوافقة مع OpenAI.

| الخاصية | القيمة            |
| ------- | ----------------- |
| المزوّد | `groq`            |
| المصادقة | `GROQ_API_KEY`   |
| API     | متوافقة مع OpenAI |

## البدء

<Steps>
  <Step title="احصل على مفتاح API">
    أنشئ مفتاح API على [console.groq.com/keys](https://console.groq.com/keys).
  </Step>
  <Step title="اضبط مفتاح API">
    ```bash
    export GROQ_API_KEY="gsk_..."
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
</Steps>

### مثال على ملف تهيئة

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

يتغير كتالوج نماذج Groq كثيرًا. شغّل `openclaw models list | grep groq`
لرؤية النماذج المتاحة حاليًا، أو تحقق من
[console.groq.com/docs/models](https://console.groq.com/docs/models).

| النموذج                       | ملاحظات                           |
| --------------------------- | --------------------------------- |
| **Llama 3.3 70B Versatile** | عام الاستخدام، وسياق كبير         |
| **Llama 3.1 8B Instant**    | سريع وخفيف                        |
| **Gemma 2 9B**              | مدمج وفعّال                       |
| **Mixtral 8x7B**            | بنية MoE، واستدلال قوي            |

<Tip>
استخدم `openclaw models list --provider groq` للحصول على أحدث قائمة
بالنماذج المتاحة على حسابك.
</Tip>

## النسخ النصي للصوت

يوفّر Groq أيضًا نسخًا نصيًا سريعًا للصوت قائمًا على Whisper. وعند تهيئته كمزوّد
لفهم الوسائط، يستخدم OpenClaw نموذج `whisper-large-v3-turbo` من Groq
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
  <Accordion title="تفاصيل النسخ النصي للصوت">
    | الخاصية | القيمة |
    |----------|--------|
    | مسار التهيئة المشترك | `tools.media.audio` |
    | عنوان URL الأساسي الافتراضي | `https://api.groq.com/openai/v1` |
    | النموذج الافتراضي | `whisper-large-v3-turbo` |
    | نقطة نهاية API | `/audio/transcriptions` متوافقة مع OpenAI |
  </Accordion>

  <Accordion title="ملاحظة حول البيئة">
    إذا كانت Gateway تعمل كخدمة daemon ‏(launchd/systemd)، فتأكد من أن `GROQ_API_KEY`
    متاح لتلك العملية (مثلًا في `~/.openclaw/.env` أو عبر
    `env.shellEnv`).

    <Warning>
    المفاتيح المضبوطة فقط في shell التفاعلية لديك لا تكون مرئية لعمليات
    gateway المُدارة كخدمة daemon. استخدم `~/.openclaw/.env` أو تهيئة `env.shellEnv`
    لتوفير دائم.
    </Warning>

  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="اختيار النموذج" href="/ar/concepts/model-providers" icon="layers">
    اختيار المزوّدين، ومراجع النماذج، وسلوك الرجوع الاحتياطي.
  </Card>
  <Card title="مرجع التهيئة" href="/ar/gateway/configuration-reference" icon="gear">
    schema التهيئة الكاملة بما في ذلك إعدادات المزوّد والصوت.
  </Card>
  <Card title="Groq Console" href="https://console.groq.com" icon="arrow-up-right-from-square">
    لوحة تحكم Groq، ووثائق API، والأسعار.
  </Card>
  <Card title="قائمة نماذج Groq" href="https://console.groq.com/docs/models" icon="list">
    كتالوج نماذج Groq الرسمي.
  </Card>
</CardGroup>
