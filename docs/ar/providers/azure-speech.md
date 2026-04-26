---
read_when:
    - أنت تريد توليف Azure Speech للردود الصادرة
    - أنت تحتاج إلى إخراج ملاحظات صوتية أصلي بصيغة Ogg Opus من Azure Speech
summary: تحويل النص إلى كلام عبر Azure AI Speech لردود OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-26T11:38:35Z"
    model: gpt-5.4
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 15
---

Azure Speech هو مزوّد تحويل النص إلى كلام ضمن Azure AI Speech. وفي OpenClaw
يقوم بتوليف الصوت الصادر للردود بصيغة MP3 افتراضيًا، وبصيغة Ogg/Opus أصلية للملاحظات
الصوتية، وبصوت mulaw بتردد 8 kHz لقنوات الاتصالات الهاتفية مثل Voice Call.

يستخدم OpenClaw واجهة Azure Speech REST API مباشرةً مع SSML ويرسل
تنسيق الإخراج المملوك للمزوّد عبر `X-Microsoft-OutputFormat`.

| التفصيل                  | القيمة                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| الموقع الإلكتروني                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| الوثائق                    | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| المصادقة                    | `AZURE_SPEECH_KEY` بالإضافة إلى `AZURE_SPEECH_REGION`                                                                  |
| الصوت الافتراضي           | `en-US-JennyNeural`                                                                                            |
| إخراج الملف الافتراضي     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ملف الملاحظة الصوتية الافتراضي | `ogg-24khz-16bit-mono-opus`                                                                                    |

## البدء

<Steps>
  <Step title="أنشئ مورد Azure Speech">
    في بوابة Azure، أنشئ مورد Speech. انسخ **KEY 1** من
    Resource Management > Keys and Endpoint، وانسخ موقع المورد
    مثل `eastus`.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="حدد Azure Speech في messages.tts">
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
  <Step title="أرسل رسالة">
    أرسل ردًا عبر أي قناة متصلة. سيقوم OpenClaw بتوليف الصوت
    باستخدام Azure Speech وتسليم MP3 للصوت القياسي، أو Ogg/Opus عندما
    تتوقع القناة ملاحظة صوتية.
  </Step>
</Steps>

## خيارات التكوين

| الخيار                  | المسار                                                        | الوصف                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | مفتاح مورد Azure Speech. ويعود إلى `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`. |
| `region`                | `messages.tts.providers.azure-speech.region`                | منطقة مورد Azure Speech. ويعود إلى `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | تجاوز اختياري لنقطة نهاية/عنوان URL الأساسي لـ Azure Speech.                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | تجاوز اختياري لعنوان URL الأساسي لـ Azure Speech.                                                              |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | قيمة ShortName للصوت في Azure (الافتراضي `en-US-JennyNeural`).                                                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | رمز لغة SSML ‏(الافتراضي `en-US`).                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | تنسيق إخراج ملف الصوت (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | تنسيق إخراج الملاحظة الصوتية (الافتراضي `ogg-24khz-16bit-mono-opus`).                                       |

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Azure Speech مفتاح مورد Speech، وليس مفتاح Azure OpenAI. يتم إرسال
    المفتاح على هيئة `Ocp-Apim-Subscription-Key`؛ ويشتق OpenClaw
    العنوان `https://<region>.tts.speech.microsoft.com` من `region` ما لم
    توفر `endpoint` أو `baseUrl`.
  </Accordion>
  <Accordion title="أسماء الأصوات">
    استخدم قيمة `ShortName` الخاصة بالصوت في Azure Speech، مثل
    `en-US-JennyNeural`. ويمكن للمزوّد المضمن عرض الأصوات عبر
    مورد Speech نفسه ويصفّي الأصوات المعلّمة على أنها deprecated أو retired.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    يقبل Azure تنسيقات إخراج مثل `audio-24khz-48kbitrate-mono-mp3`،
    و`ogg-24khz-16bit-mono-opus`، و`riff-24khz-16bit-mono-pcm`. ويطلب OpenClaw
    Ogg/Opus لأهداف `voice-note` حتى تتمكن القنوات من إرسال
    فقاعات صوتية أصلية من دون تحويل إضافي من MP3.
  </Accordion>
  <Accordion title="الاسم البديل">
    تُقبل `azure` كاسم بديل للمزوّد من أجل PRs الحالية وتكوينات المستخدمين،
    لكن يجب أن تستخدم التكوينات الجديدة `azure-speech` لتجنب الالتباس مع
    مزوّدي نماذج Azure OpenAI.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS، والمزوّدين، وتكوين `messages.tts`.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration" icon="gear">
    المرجع الكامل للتكوين بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="المزوّدون" href="/ar/providers" icon="grid">
    جميع مزوّدي OpenClaw المضمنين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
</CardGroup>
