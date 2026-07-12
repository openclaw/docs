---
read_when:
    - تريد استخدام تركيب الكلام من Inworld للردود الصادرة
    - تحتاج إلى إخراج هاتفي بتنسيق PCM أو ملاحظة صوتية بتنسيق OGG_OPUS من Inworld
summary: تحويل النص إلى كلام عبر البث من Inworld لردود OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-07-12T06:27:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld هو موفّر لتحويل النص إلى كلام (TTS) عبر البث. في OpenClaw، يُنشئ صوت الردود الصادرة (MP3 افتراضيًا، وOGG_OPUS للملاحظات الصوتية) وصوت PCM خامًا لقنوات الاتصالات الهاتفية مثل Voice Call.

يرسل OpenClaw طلبات POST إلى نقطة نهاية TTS المتدفقة في Inworld، ويدمج مقاطع الصوت المُعادة والمشفّرة بصيغة base64 في مخزن مؤقت واحد، ثم يمرّر النتيجة إلى مسار معالجة صوت الرد القياسي.

| الخاصية | القيمة |
| ------------- | --------------------------------------------------------------- |
| معرّف الموفّر | `inworld` |
| Plugin | حزمة خارجية رسمية (`@openclaw/inworld-speech`) |
| العقد | `speechProviders` (TTS فقط) |
| متغيّر بيئة المصادقة | `INWORLD_API_KEY` (HTTP Basic، بيانات اعتماد لوحة التحكم بصيغة Base64) |
| عنوان URL الأساسي | `https://api.inworld.ai` |
| الصوت الافتراضي | `Sarah` |
| النموذج الافتراضي | `inworld-tts-1.5-max` |
| المخرجات | MP3 (افتراضي)، وOGG_OPUS (للملاحظات الصوتية)، وPCM بتردد 22050 هرتز (للاتصالات الهاتفية) |
| الموقع الإلكتروني | [inworld.ai](https://inworld.ai) |
| الوثائق | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts) |

## تثبيت Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## بدء الاستخدام

<Steps>
  <Step title="عيّن مفتاح API">
    انسخ بيانات الاعتماد من لوحة تحكم Inworld ‏(Workspace > API Keys) وعيّنها كمتغيّر بيئة. تُرسل القيمة حرفيًا بوصفها بيانات اعتماد HTTP Basic، لذا لا تُشفّرها مجددًا بصيغة Base64 ولا تحوّلها إلى رمز حامل.

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="حدّد Inworld في messages.tts">
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
    أرسل ردًا عبر أي قناة متصلة. يُنشئ OpenClaw الصوت باستخدام Inworld ويسلّمه بصيغة MP3 (أو OGG_OPUS عندما تتوقع القناة ملاحظة صوتية).
  </Step>
</Steps>

## خيارات الإعداد

| الخيار | المسار | الوصف |
| ------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| `apiKey` | `messages.tts.providers.inworld.apiKey` | بيانات اعتماد لوحة التحكم بصيغة Base64. يستخدم `INWORLD_API_KEY` عند عدم تحديدها. |
| `baseUrl` | `messages.tts.providers.inworld.baseUrl` | تجاوز عنوان URL الأساسي لواجهة Inworld API (الافتراضي `https://api.inworld.ai`). |
| `voiceId` | `messages.tts.providers.inworld.voiceId` | معرّف الصوت (الافتراضي `Sarah`). الاسم البديل القديم: `speakerVoiceId`. |
| `modelId` | `messages.tts.providers.inworld.modelId` | معرّف نموذج TTS (الافتراضي `inworld-tts-1.5-max`). |
| `temperature` | `messages.tts.providers.inworld.temperature` | درجة حرارة أخذ العينات، من `0` (غير شامل) إلى `2` (اختياري). |

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Inworld مصادقة HTTP Basic بسلسلة بيانات اعتماد واحدة مشفّرة بصيغة Base64. انسخها حرفيًا من لوحة تحكم Inworld. يرسلها الموفّر بالشكل `Authorization: Basic <apiKey>` من دون أي تشفير إضافي، لذا لا تُشفّرها بنفسك بصيغة Base64 ولا تمرّر رمزًا بنمط الحامل. راجع [ملاحظات مصادقة TTS](/ar/tools/tts#inworld-primary) للاطلاع على التنبيه نفسه.
  </Accordion>
  <Accordion title="النماذج">
    معرّفات النماذج المدعومة: `inworld-tts-1.5-max` (الافتراضي)، و`inworld-tts-1.5-mini`، و`inworld-tts-1-max`، و`inworld-tts-1`.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    تستخدم الردود MP3 افتراضيًا. عندما تكون وجهة القناة `voice-note`، يطلب OpenClaw من Inworld صيغة `OGG_OPUS` لكي يُشغّل الصوت كفقاعة صوتية أصلية. يستخدم إنشاء الصوت للاتصالات الهاتفية صيغة `PCM` الخام بتردد 22050 هرتز لتغذية جسر الاتصالات الهاتفية.
  </Accordion>
  <Accordion title="نقاط النهاية المخصصة">
    تجاوز مضيف API باستخدام `messages.tts.providers.inworld.baseUrl`. تُزال الشرطات المائلة اللاحقة قبل إرسال الطلبات.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS والموفّرين وإعداد `messages.tts`.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل، بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="الموفّرون" href="/ar/providers" icon="grid">
    جميع موفّري OpenClaw المدعومين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
</CardGroup>
