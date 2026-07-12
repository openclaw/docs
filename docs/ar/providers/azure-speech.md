---
read_when:
    - تريد استخدام توليف الكلام من Azure للردود الصادرة
    - تحتاج إلى إخراج ملاحظات صوتية أصلي بتنسيق Ogg Opus من Azure Speech
summary: تحويل النص إلى كلام باستخدام Azure AI Speech لردود OpenClaw
title: خدمة Azure للكلام
x-i18n:
    generated_at: "2026-07-12T06:21:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 61e700724dbb7cb8c217f91485cea0eec776698e439f6c6985dac58dc4cafc01
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech هو موفّر مضمن لتحويل النص إلى كلام ضمن Azure AI Speech. يستدعي OpenClaw
واجهة Azure Speech REST API مباشرةً باستخدام SSML، وينشئ ملفات MP3 للردود
القياسية، وOgg/Opus أصليًا للملاحظات الصوتية، وmulaw بتردد 8 كيلوهرتز
لقنوات الاتصالات الهاتفية مثل المكالمات الصوتية. يرسل الطلب تنسيق الإخراج الذي يملكه
الموفّر عبر ترويسة `X-Microsoft-OutputFormat`.

| التفصيل                  | القيمة                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| معرّف الموفّر             | `azure-speech` (الاسم المستعار: `azure`)                                                                        |
| الموقع الإلكتروني         | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| الوثائق                   | [تحويل النص إلى كلام عبر Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| المصادقة                  | `AZURE_SPEECH_KEY` بالإضافة إلى `AZURE_SPEECH_REGION`                                                          |
| الصوت الافتراضي           | `en-US-JennyNeural`                                                                                            |
| إخراج الملف الافتراضي     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ملف الملاحظة الصوتية الافتراضي | `ogg-24khz-16bit-mono-opus`                                                                               |

## بدء الاستخدام

<Steps>
  <Step title="إنشاء مورد Azure Speech">
    في بوابة Azure، أنشئ مورد Speech. انسخ **KEY 1** من
    Resource Management > Keys and Endpoint، وانسخ موقع المورد
    مثل `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="تحديد Azure Speech في messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              voice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="إرسال رسالة">
    أرسل ردًا عبر أي قناة متصلة. ينشئ OpenClaw الصوت
    باستخدام Azure Speech ويرسل MP3 للصوت القياسي، أو Ogg/Opus عندما
    تتوقع القناة ملاحظة صوتية.
  </Step>
</Steps>

## خيارات الإعداد

توجد جميع الخيارات ضمن `messages.tts.providers["azure-speech"]`.

| الخيار                  | الوصف                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | مفتاح مورد Azure Speech. يرجع احتياطيًا إلى `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`. |
| `region`                | منطقة مورد Azure Speech. يرجع احتياطيًا إلى `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.                 |
| `endpoint`              | تجاوز اختياري لنقطة نهاية Azure Speech. يرجع احتياطيًا إلى `AZURE_SPEECH_ENDPOINT`.                       |
| `baseUrl`               | تجاوز اختياري لعنوان URL الأساسي لـ Azure Speech.                                                              |
| `voice`                 | قيمة ShortName لصوت Azure (الافتراضي `en-US-JennyNeural`). الاسم المستعار القديم: `voiceId`.                         |
| `lang`                  | رمز لغة SSML (الافتراضي `en-US`).                                                                 |
| `outputFormat`          | تنسيق إخراج الملف الصوتي (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | تنسيق إخراج الملاحظة الصوتية (الافتراضي `ogg-24khz-16bit-mono-opus`).                                       |
| `timeoutMs`             | تجاوز مهلة الطلب بالمللي ثانية. يرجع احتياطيًا إلى `messages.tts.timeoutMs` العام.          |

يُعدّ الموفّر معدًا بمجرد تعيين `apiKey` بالإضافة إلى أحد الخيارات
`region` أو `endpoint` أو `baseUrl`. لا تُفحص متغيرات البيئة إلا كخيار احتياطي
لمفاتيح الإعداد التي لم تُعيّن.

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Azure Speech مفتاح مورد Speech، وليس مفتاح Azure OpenAI. يُرسل المفتاح
    باسم `Ocp-Apim-Subscription-Key`؛ ويشتق OpenClaw
    `https://<region>.tts.speech.microsoft.com` من `region` ما لم
    توفّر `endpoint` أو `baseUrl`.
  </Accordion>
  <Accordion title="أسماء الأصوات">
    استخدم قيمة `ShortName` لصوت Azure Speech، على سبيل المثال
    `en-US-JennyNeural`. يستطيع الموفّر المضمن سرد الأصوات عبر
    مورد Speech نفسه، ويستبعد الأصوات التي تحمل علامة مهملة أو متقاعدة
    أو معطلة.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    يقبل Azure تنسيقات إخراج مثل `audio-24khz-48kbitrate-mono-mp3`
    و`ogg-24khz-16bit-mono-opus` و`riff-24khz-16bit-mono-pcm`. يطلب OpenClaw
    صيغة Ogg/Opus لأهداف `voice-note` حتى تتمكن القنوات من إرسال
    فقاعات صوتية أصلية دون تحويل إضافي إلى MP3، ويفرض
    `raw-8khz-8bit-mono-mulaw` لأهداف الاتصالات الهاتفية.
  </Accordion>
  <Accordion title="الاسم المستعار">
    يُقبل `azure` كاسم مستعار للموفّر في الإعدادات الحالية، لكن ينبغي أن تستخدم
    الإعدادات الجديدة `azure-speech` لتجنب الخلط مع موفّري نماذج Azure OpenAI.
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
    جميع موفّري OpenClaw المضمنين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
</CardGroup>
