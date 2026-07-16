---
read_when:
    - تريد استخدام توليف الكلام من Azure للردود الصادرة
    - تحتاج إلى إخراج ملاحظات صوتية أصلي بتنسيق Ogg Opus من Azure Speech
summary: تحويل النص إلى كلام باستخدام Azure AI Speech لردود OpenClaw
title: الكلام من Azure
x-i18n:
    generated_at: "2026-07-16T14:43:17Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech هو موفّر تحويل النص إلى كلام مضمّن من Azure AI Speech. يستدعي OpenClaw
واجهة Azure Speech REST API مباشرةً باستخدام SSML، وينشئ ملفات MP3 للردود
العادية، وملفات Ogg/Opus أصلية للملاحظات الصوتية، وصوت mulaw بتردد 8 kHz
لقنوات الاتصالات الهاتفية مثل المكالمات الصوتية. يرسل الطلب تنسيق الإخراج المملوك للموفّر
عبر ترويسة `X-Microsoft-OutputFormat`.

| التفصيل                  | القيمة                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| معرّف الموفّر             | `azure-speech` (الاسم البديل: `azure`)                                                                                |
| الموقع الإلكتروني                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| الوثائق                    | [تحويل النص إلى كلام عبر Speech REST](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| المصادقة                    | `AZURE_SPEECH_KEY` بالإضافة إلى `AZURE_SPEECH_REGION`                                                                  |
| الصوت الافتراضي           | `en-US-JennyNeural`                                                                                            |
| إخراج الملف الافتراضي     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| ملف الملاحظة الصوتية الافتراضي | `ogg-24khz-16bit-mono-opus`                                                                                    |

## البدء

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
    باستخدام Azure Speech ويوصّل MP3 للصوت العادي، أو Ogg/Opus عندما
    تتوقع القناة ملاحظة صوتية.
  </Step>
</Steps>

## خيارات التكوين

توجد جميع الخيارات ضمن `messages.tts.providers["azure-speech"]`.

| الخيار                  | الوصف                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | مفتاح مورد Azure Speech. يعود احتياطيًا إلى `AZURE_SPEECH_KEY` أو `AZURE_SPEECH_API_KEY` أو `SPEECH_KEY`. |
| `region`                | منطقة مورد Azure Speech. تعود احتياطيًا إلى `AZURE_SPEECH_REGION` أو `SPEECH_REGION`.                 |
| `endpoint`              | تجاوز اختياري لنقطة نهاية Azure Speech. يعود احتياطيًا إلى `AZURE_SPEECH_ENDPOINT` الموثوق.               |
| `baseUrl`               | تجاوز اختياري لعنوان URL الأساسي لـ Azure Speech.                                                              |
| `voice`                 | الاسم المختصر ShortName لصوت Azure (الافتراضي `en-US-JennyNeural`). الاسم البديل القديم: `voiceId`.                         |
| `lang`                  | رمز لغة SSML (الافتراضي `en-US`).                                                                 |
| `outputFormat`          | تنسيق إخراج ملف الصوت (الافتراضي `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | تنسيق إخراج الملاحظة الصوتية (الافتراضي `ogg-24khz-16bit-mono-opus`).                                       |
| `timeoutMs`             | تجاوز مهلة الطلب بالمللي ثانية. يعود احتياطيًا إلى `messages.tts.timeoutMs` العام.          |

يُعدّ الموفّر مكوّنًا بمجرد تعيين `apiKey` بالإضافة إلى واحد من
`region` أو `endpoint` أو `baseUrl`. لا يجري التحقق من متغيرات البيئة إلا كخيار احتياطي
لمفاتيح التكوين التي لم تُعيّن. لا يمكن لملفات `.env` الخاصة بمساحة العمل تعيين
`AZURE_SPEECH_ENDPOINT`؛ استخدم بيئة العملية أو ملف dotenv العام لوقت التشغيل
أو تكوينًا صريحًا لتوجيه نقطة النهاية.

## ملاحظات

<AccordionGroup>
  <Accordion title="المصادقة">
    يستخدم Azure Speech مفتاح مورد Speech، وليس مفتاح Azure OpenAI. يُرسل المفتاح
    بوصفه `Ocp-Apim-Subscription-Key`؛ ويشتق OpenClaw
    ‏`https://<region>.tts.speech.microsoft.com` من `region` ما لم
    توفّر `endpoint` أو `baseUrl`.
  </Accordion>
  <Accordion title="أسماء الأصوات">
    استخدم قيمة `ShortName` لصوت Azure Speech، مثل
    `en-US-JennyNeural`. يستطيع الموفّر المضمّن سرد الأصوات عبر
    مورد Speech نفسه، ويستبعد الأصوات المعلّمة بأنها مهملة أو متقاعدة
    أو معطّلة.
  </Accordion>
  <Accordion title="مخرجات الصوت">
    يقبل Azure تنسيقات إخراج مثل `audio-24khz-48kbitrate-mono-mp3`
    و`ogg-24khz-16bit-mono-opus` و`riff-24khz-16bit-mono-pcm`. يطلب OpenClaw
    تنسيق Ogg/Opus لأهداف `voice-note` حتى تتمكن القنوات من إرسال فقاعات صوتية أصلية
    من دون تحويل إضافي إلى MP3، ويفرض
    `raw-8khz-8bit-mono-mulaw` لأهداف الاتصالات الهاتفية.
  </Accordion>
  <Accordion title="الاسم البديل">
    يُقبل `azure` كاسم بديل للموفّر في التكوين الحالي، لكن ينبغي أن يستخدم
    التكوين الجديد `azure-speech` لتجنب الخلط مع موفّري نماذج Azure OpenAI.
  </Accordion>
</AccordionGroup>

## ذو صلة

<CardGroup cols={2}>
  <Card title="تحويل النص إلى كلام" href="/ar/tools/tts" icon="waveform-lines">
    نظرة عامة على TTS والموفّرين وتكوين `messages.tts`.
  </Card>
  <Card title="التكوين" href="/ar/gateway/configuration" icon="gear">
    مرجع التكوين الكامل، بما في ذلك إعدادات `messages.tts`.
  </Card>
  <Card title="الموفّرون" href="/ar/providers" icon="grid">
    جميع موفّري OpenClaw المضمّنين.
  </Card>
  <Card title="استكشاف الأخطاء وإصلاحها" href="/ar/help/troubleshooting" icon="wrench">
    المشكلات الشائعة وخطوات تصحيح الأخطاء.
  </Card>
</CardGroup>
