---
read_when:
    - تريد استخدام تركيب الكلام في Azure Speech للردود الصادرة
    - تحتاج إلى إخراج ملاحظات صوتية بصيغة Ogg Opus أصلية من Azure Speech
summary: تحويل النص إلى كلام باستخدام Azure AI Speech لردود OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:22:24Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech هو موفّر تحويل النص إلى كلام من Azure AI Speech. في OpenClaw، يقوم
بتوليف صوت الردود الصادرة بصيغة MP3 افتراضيًا، وOgg/Opus الأصلي للرسائل
الصوتية، وصوت mulaw بتردد 8 كيلوهرتز لقنوات الهاتف مثل المكالمات الصوتية.

يستخدم OpenClaw واجهة Azure Speech REST API مباشرةً مع SSML ويرسل تنسيق
الإخراج المملوك للموفّر عبر `X-Microsoft-OutputFormat`.

| التفاصيل                | القيمة                                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| الموقع الإلكتروني       | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| الوثائق                 | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| المصادقة                | `AZURE_SPEECH_KEY` بالإضافة إلى `AZURE_SPEECH_REGION`                                                          |
| الصوت الافتراضي         | `en-US-JennyNeural`                                                                                            |
| إخراج الملف الافتراضي   | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ملف الرسالة الصوتية الافتراضي | `ogg-24khz-16bit-mono-opus`                                                                                    |

## البدء

<Steps>
  <Step title="أنشئ مورد Azure Speech">
    في مدخل Azure، أنشئ مورد Speech. انسخ **KEY 1** من
    Resource Management > Keys and Endpoint، وانسخ موقع المورد
    مثل `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="اختر Azure Speech في messages.tts">
    ```json5
    {
      messages: {
        tts: {
          auto: "always",
          provider: "azure-speech",
          providers: {
            "azure-speech": {
              speakerVoice: "en-US-JennyNeural",
              lang: "en-US",
            },
          },
        },
      },
    }
    ```
  </Step>
  <Step title="أرسل رسالة">
    أرسل ردًا عبر أي قناة متصلة. يقوم OpenClaw بتوليف الصوت
    باستخدام Azure Speech ويوصل MP3 للصوت القياسي، أو Ogg/Opus عندما
    تتوقع القناة رسالة صوتية.
  </Step>
</Steps>

## خيارات الإعداد

| الخيار                  | المسار                                                      | الوصف                                                                                                 |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | مفتاح مورد Azure Speech. يعود احتياطيًا إلى `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | منطقة مورد Azure Speech. يعود احتياطيًا إلى `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | تجاوز اختياري لنقطة نهاية/عنوان URL الأساسي لـ Azure Speech.                                         |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | تجاوز اختياري لعنوان URL الأساسي لـ Azure Speech.                                                     |
| `speakerVoice`          | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName لصوت Azure (الافتراضي `en-US-JennyNeural`). الاسم المستعار القديم: `voice`.                 |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | رمز لغة SSML (الافتراضي `en-US`).                                                                     |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | تنسيق إخراج ملف الصوت (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | تنسيق إخراج الرسالة الصوتية (الافتراضي `ogg-24khz-16bit-mono-opus`).                                 |

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Azure Speech مفتاح مورد Speech، وليس مفتاح Azure OpenAI. يُرسل المفتاح
    كـ `Ocp-Apim-Subscription-Key`؛ ويشتق OpenClaw
    `https://<region>.tts.speech.microsoft.com` من `region` ما لم
    توفّر `endpoint` أو `baseUrl`.
  </Accordion>
  <Accordion title="أسماء الأصوات">
    استخدم قيمة `ShortName` لصوت Azure Speech، على سبيل المثال
    `en-US-JennyNeural`. يستطيع الموفّر المضمن سرد الأصوات عبر
    مورد Speech نفسه وتصفية الأصوات المعلّمة كمهملة أو متقاعدة.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    يقبل Azure تنسيقات إخراج مثل `audio-24khz-48kbitrate-mono-mp3`،
    و`ogg-24khz-16bit-mono-opus`، و`riff-24khz-16bit-mono-pcm`. يطلب OpenClaw
    Ogg/Opus لأهداف `voice-note` حتى تتمكن القنوات من إرسال
    فقاعات صوتية أصلية دون تحويل إضافي إلى MP3.
  </Accordion>
  <Accordion title="الاسم المستعار">
    يُقبل `azure` كاسم مستعار للموفّر لطلبات PR الحالية وإعدادات المستخدم،
    لكن يجب أن تستخدم الإعدادات الجديدة `azure-speech` لتجنب الالتباس مع
    موفّري نماذج Azure OpenAI.
  </Accordion>
</AccordionGroup>

## ذات صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS والموفّرين وإعداد `messages.tts`.
  </Card>
  <Card title="الإعداد" href="/ar/gateway/configuration" icon="gear">
    مرجع الإعداد الكامل بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="الموفّرون" href="/ar/providers" icon="grid">
    جميع موفّري OpenClaw المضمنين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات التصحيح.
  </Card>
</CardGroup>
