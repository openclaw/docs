---
read_when:
    - تريد توليد الكلام عبر Inworld للردود الصادرة
    - تحتاج إلى مخرجات PCM للاتصالات الهاتفية أو مخرجات ملاحظة صوتية بتنسيق OGG_OPUS من Inworld
summary: تحويل النص إلى كلام بالبث من Inworld لردود OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T08:11:00Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld هو مزوّد تحويل النص إلى كلام (TTS) بالبث. في OpenClaw، يقوم
بتوليف صوت الردود الصادرة (MP3 افتراضيًا، وOGG_OPUS للملاحظات الصوتية)
وصوت PCM لقنوات الاتصالات الهاتفية مثل المكالمة الصوتية.

ينشر OpenClaw إلى نقطة نهاية TTS بالبث الخاصة بـ Inworld، ويجمع مقاطع الصوت
المرجعة بترميز base64 في مخزن مؤقت واحد، ثم يمرر النتيجة إلى
مسار صوت الرد القياسي.

| الخاصية      | القيمة                                                           |
| ------------- | --------------------------------------------------------------- |
| معرّف المزوّد   | `inworld`                                                       |
| Plugin        | مضمن، `enabledByDefault: true`                               |
| العقد      | `speechProviders` (TTS فقط)                                    |
| متغير بيئة المصادقة  | `INWORLD_API_KEY` (HTTP Basic، اعتماد لوحة المعلومات Base64)     |
| عنوان URL الأساسي      | `https://api.inworld.ai`                                        |
| الصوت الافتراضي | `Sarah`                                                         |
| النموذج الافتراضي | `inworld-tts-1.5-max`                                           |
| الإخراج        | MP3 (افتراضي)، OGG_OPUS (ملاحظات صوتية)، PCM 22050 Hz (اتصالات هاتفية) |
| الموقع الإلكتروني       | [inworld.ai](https://inworld.ai)                                |
| المستندات          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## البدء

<Steps>
  <Step title="عيّن مفتاح API الخاص بك">
    انسخ الاعتماد من لوحة معلومات Inworld الخاصة بك (Workspace > API Keys)
    وعيّنه كمتغير بيئة. تُرسل القيمة كما هي كاعتماد HTTP Basic،
    لذلك لا ترمّزها بـ Base64 مرة أخرى ولا تحوّلها إلى رمز bearer.

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
    أرسل ردًا عبر أي قناة متصلة. يقوم OpenClaw بتوليف الصوت
    باستخدام Inworld ويسلّمه كـ MP3 (أو OGG_OPUS عندما تتوقع القناة
    ملاحظة صوتية).
  </Step>
</Steps>

## خيارات التكوين

| الخيار        | المسار                                         | الوصف                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | اعتماد لوحة المعلومات Base64. يعود إلى `INWORLD_API_KEY` عند عدم ضبطه.     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | تجاوز عنوان URL الأساسي لـ API الخاص بـ Inworld (الافتراضي `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | معرّف الصوت (الافتراضي `Sarah`).                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | معرّف نموذج TTS (الافتراضي `inworld-tts-1.5-max`).                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | درجة حرارة أخذ العينات `0..2` (اختياري).                           |

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Inworld مصادقة HTTP Basic بسلسلة اعتماد واحدة مرمّزة بـ Base64.
    انسخها كما هي من لوحة معلومات Inworld. يرسلها المزوّد
    كـ `Authorization: Basic <apiKey>` دون أي ترميز إضافي، لذلك
    لا ترمّزها بـ Base64 بنفسك ولا تمرر رمزًا بأسلوب bearer.
    راجع [ملاحظات مصادقة TTS](/ar/tools/tts#inworld-primary) للاطلاع على التنبيه نفسه.
  </Accordion>
  <Accordion title="النماذج">
    معرّفات النماذج المدعومة: `inworld-tts-1.5-max` (افتراضي)،
    `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    تستخدم الردود MP3 افتراضيًا. عندما يكون هدف القناة هو `voice-note`
    يطلب OpenClaw من Inworld استخدام `OGG_OPUS` بحيث يُشغّل الصوت كفقاعة
    صوتية أصلية. يستخدم توليف الاتصالات الهاتفية `PCM` خامًا عند 22050 Hz لتغذية
    جسر الاتصالات الهاتفية.
  </Accordion>
  <Accordion title="نقاط النهاية المخصصة">
    تجاوز مضيف API باستخدام `messages.tts.providers.inworld.baseUrl`.
    تُزال الشرطات المائلة اللاحقة قبل إرسال الطلبات.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS، والمزوّدون، وتكوين `messages.tts`.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration" icon="gear">
    مرجع التكوين الكامل بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="المزوّدون" href="/ar/providers" icon="grid">
    جميع مزوّدي OpenClaw المضمنين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات التصحيح.
  </Card>
</CardGroup>
