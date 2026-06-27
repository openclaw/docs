---
read_when:
    - تريد توليد الكلام من Inworld للردود الصادرة
    - تحتاج إلى إخراج مهاتفة PCM أو ملاحظة صوتية OGG_OPUS من Inworld
summary: البثّ الصوتي للنص إلى كلام من Inworld لردود OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:25:19Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld هو موفّر تحويل النص إلى كلام (TTS) بالبث. في OpenClaw
يُنشئ صوت الردود الصادرة (MP3 افتراضيًا، وOGG_OPUS للملاحظات الصوتية)
وصوت PCM لقنوات الهاتف مثل المكالمة الصوتية.

يرسل OpenClaw الطلبات إلى نقطة نهاية TTS بالبث الخاصة بـ Inworld، ويدمج
مقاطع الصوت المرجعة بترميز base64 في مخزن مؤقت واحد، ثم يمرّر النتيجة إلى
مسار صوت الرد القياسي.

| الخاصية | القيمة |
| ------------- | --------------------------------------------------------------- |
| معرّف الموفّر | `inworld` |
| Plugin | حزمة خارجية رسمية |
| العقد | `speechProviders` (TTS فقط) |
| متغير بيئة المصادقة | `INWORLD_API_KEY` (HTTP Basic، بيانات اعتماد لوحة التحكم بصيغة Base64) |
| عنوان URL الأساسي | `https://api.inworld.ai` |
| الصوت الافتراضي | `Sarah` |
| النموذج الافتراضي | `inworld-tts-1.5-max` |
| المخرجات | MP3 (افتراضي)، OGG_OPUS (ملاحظات صوتية)، PCM 22050 Hz (الهاتف) |
| الموقع | [inworld.ai](https://inworld.ai) |
| الوثائق | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts) |

## تثبيت Plugin

ثبّت Plugin الرسمي، ثم أعد تشغيل Gateway:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## البدء

<Steps>
  <Step title="اضبط مفتاح API الخاص بك">
    انسخ بيانات الاعتماد من لوحة تحكم Inworld (Workspace > API Keys)
    واضبطها كمتغير بيئة. تُرسل القيمة كما هي بوصفها بيانات اعتماد HTTP Basic،
    لذلك لا ترمّزها بصيغة Base64 مرة أخرى ولا تحوّلها إلى رمز bearer.

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
              speakerVoiceId: "Sarah",
              modelId: "inworld-tts-1.5-max",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل رسالة">
    أرسل ردًا عبر أي قناة متصلة. يُنشئ OpenClaw الصوت باستخدام Inworld
    ويوصله بصيغة MP3 (أو OGG_OPUS عندما تتوقع القناة ملاحظة صوتية).
  </Step>
</Steps>

## خيارات التكوين

| الخيار | المسار | الوصف |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey` | `messages.tts.providers.inworld.apiKey` | بيانات اعتماد لوحة التحكم بصيغة Base64. يرجع إلى `INWORLD_API_KEY`. |
| `baseUrl` | `messages.tts.providers.inworld.baseUrl` | تجاوز عنوان URL الأساسي لـ API الخاص بـ Inworld (الافتراضي `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | معرّف الصوت (الافتراضي `Sarah`). |
| `modelId` | `messages.tts.providers.inworld.modelId` | معرّف نموذج TTS (الافتراضي `inworld-tts-1.5-max`). |
| `temperature` | `messages.tts.providers.inworld.temperature` | درجة حرارة أخذ العينات `0..2` (اختياري). |

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Inworld مصادقة HTTP Basic بسلسلة بيانات اعتماد واحدة مرمّزة
    بصيغة Base64. انسخها كما هي من لوحة تحكم Inworld. يرسلها الموفّر
    بصيغة `Authorization: Basic <apiKey>` دون أي ترميز إضافي، لذلك
    لا ترمّزها بنفسك بصيغة Base64 ولا تمرّر رمزًا بنمط bearer.
    راجع [ملاحظات مصادقة TTS](/ar/tools/tts#inworld-primary) للاطلاع على التنبيه نفسه.
  </Accordion>
  <Accordion title="النماذج">
    معرّفات النماذج المدعومة: `inworld-tts-1.5-max` (افتراضي)،
    `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    تستخدم الردود MP3 افتراضيًا. عندما يكون هدف القناة هو `voice-note`
    يطلب OpenClaw من Inworld استخدام `OGG_OPUS` حتى يُشغّل الصوت كفقاعة
    صوتية أصلية. يستخدم إنشاء الصوت للهاتف `PCM` خامًا عند 22050 Hz لتغذية
    جسر الهاتف.
  </Accordion>
  <Accordion title="نقاط النهاية المخصصة">
    تجاوز مضيف API باستخدام `messages.tts.providers.inworld.baseUrl`.
    تُزال الشرطات المائلة اللاحقة قبل إرسال الطلبات.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS والموفّرين وتكوين `messages.tts`.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration" icon="gear">
    مرجع التكوين الكامل بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="الموفّرون" href="/ar/providers" icon="grid">
    جميع موفّري OpenClaw المدعومين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات التصحيح.
  </Card>
</CardGroup>
