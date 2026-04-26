---
read_when:
    - تريد توليد الكلام من Inworld للردود الصادرة
    - تحتاج إلى خرج PCM للاتصالات الهاتفية أو OGG_OPUS للملاحظات الصوتية من Inworld
summary: تحويل النص إلى كلام عبر البث من Inworld لردود OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-26T11:39:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 15
---

Inworld هو مزوّد بث لتحويل النص إلى كلام (TTS). وفي OpenClaw
يولّد الصوت للردود الصادرة (بصيغة MP3 افتراضيًا، وOGG_OPUS للملاحظات الصوتية)
وصوت PCM لقنوات الاتصالات الهاتفية مثل Voice Call.

يرسل OpenClaw طلبات إلى نقطة نهاية TTS المتدفقة في Inworld، ويجمع
الكتل الصوتية المعادة والمشفرة بـ base64 في مخزن واحد،
ثم يمرّر النتيجة إلى مسار صوت الرد القياسي.

| التفاصيل      | القيمة                                                      |
| ------------- | ----------------------------------------------------------- |
| الموقع        | [inworld.ai](https://inworld.ai)                            |
| الوثائق       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| المصادقة      | `INWORLD_API_KEY` ‏(HTTP Basic، بيانات اعتماد dashboard بتنسيق Base64) |
| الصوت الافتراضي | `Sarah`                                                    |
| النموذج الافتراضي | `inworld-tts-1.5-max`                                    |

## البدء

<Steps>
  <Step title="اضبط مفتاح API الخاص بك">
    انسخ بيانات الاعتماد من لوحة تحكم Inworld ‏(Workspace > API Keys)
    واضبطها كمتغير env. تُرسَل القيمة كما هي تمامًا كبيانات اعتماد HTTP Basic،
    لذلك لا تُعِد ترميزها بـ Base64 مرة أخرى ولا تحوّلها إلى
    bearer token.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="اختر Inworld في messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "inworld",
          providers: {
            inworld: {
              voiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل رسالة">
    أرسل ردًا عبر أي قناة متصلة. سيولّد OpenClaw
    الصوت باستخدام Inworld ويسلّمه بصيغة MP3 ‏(أو OGG_OPUS عندما تتوقع القناة
    ملاحظة صوتية).
  </Step>
</Steps>

## خيارات الإعدادات

| الخيار         | المسار                                       | الوصف                                                              |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------ |
| `apiKey`       | `messages.tts.providers.inworld.apiKey`      | بيانات اعتماد dashboard بتنسيق Base64. وتعود إلى `INWORLD_API_KEY`. |
| `baseUrl`      | `messages.tts.providers.inworld.baseUrl`     | تجاوز عنوان API الأساسي لـ Inworld ‏(الافتراضي `https://api.inworld.ai`). |
| `voiceId`      | `messages.tts.providers.inworld.voiceId`     | معرّف الصوت ‏(الافتراضي `Sarah`).                                  |
| `modelId`      | `messages.tts.providers.inworld.modelId`     | معرّف نموذج TTS ‏(الافتراضي `inworld-tts-1.5-max`).                 |
| `temperature`  | `messages.tts.providers.inworld.temperature` | درجة حرارة أخذ العينات `0..2` ‏(اختياري).                           |

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    تستخدم Inworld مصادقة HTTP Basic مع سلسلة بيانات اعتماد واحدة
    مشفرة بـ Base64. انسخها كما هي من لوحة تحكم Inworld. ويرسلها المزوّد
    بالشكل `Authorization: Basic <apiKey>` من دون أي ترميز إضافي،
    لذلك لا تقم بترميزها بـ Base64 بنفسك ولا تمرر رمزًا بنمط bearer.
    راجع [ملاحظات مصادقة TTS](/ar/tools/tts#inworld-primary) للاطلاع على التنبيه نفسه.
  </Accordion>
  <Accordion title="النماذج">
    معرّفات النماذج المدعومة: `inworld-tts-1.5-max` ‏(الافتراضي)،
    و`inworld-tts-1.5-mini`، و`inworld-tts-1-max`، و`inworld-tts-1`.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    تستخدم الردود MP3 افتراضيًا. وعندما يكون هدف القناة هو `voice-note`
    يطلب OpenClaw من Inworld الصيغة `OGG_OPUS` بحيث يعمل الصوت كفقاعة
    صوتية أصلية. وتستخدم عملية التوليد الخاصة بالاتصالات الهاتفية `PCM` خامًا بتردد 22050 هرتز لتغذية
    جسر الاتصالات الهاتفية.
  </Accordion>
  <Accordion title="نقاط نهاية مخصصة">
    تجاوز مضيف API عبر `messages.tts.providers.inworld.baseUrl`.
    وتُزال الشرطات المائلة اللاحقة قبل إرسال الطلبات.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS، والمزوّدين، وإعدادات `messages.tts`.
  </Card>
  <Card title="الإعدادات" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعدادات الكامل بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="المزوّدون" href="/ar/providers" icon="grid">
    جميع مزوّدي OpenClaw المضمّنين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
</CardGroup>
