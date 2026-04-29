---
read_when:
    - می‌خواهید برای پاسخ‌های خروجی از سنتز گفتار Azure Speech استفاده کنید
    - به خروجی بومی یادداشت صوتی Ogg Opus از Azure Speech نیاز دارید
summary: تبدیل متن به گفتار Azure AI Speech برای پاسخ‌های OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-04-29T23:23:30Z"
    model: gpt-5.5
    provider: openai
    source_hash: 59baf0865e0eba1076ae5c074b5978e1f5f104b3395c816c30c546da41a303b9
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech یک ارائه‌دهندهٔ تبدیل متن به گفتار Azure AI Speech است. در OpenClaw، به‌طور پیش‌فرض صدای پاسخ خروجی را به‌صورت MP3، برای یادداشت‌های صوتی به‌صورت Ogg/Opus بومی، و برای کانال‌های تلفنی مانند Voice Call به‌صورت صدای mulaw با 8 kHz تولید می‌کند.

OpenClaw مستقیماً از Azure Speech REST API همراه با SSML استفاده می‌کند و قالب خروجی متعلق به ارائه‌دهنده را از طریق `X-Microsoft-OutputFormat` می‌فرستد.

| جزئیات                 | مقدار                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| وب‌سایت                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| مستندات                 | [Speech REST text-to-speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| احراز هویت              | `AZURE_SPEECH_KEY` به‌همراه `AZURE_SPEECH_REGION`                                                              |
| صدای پیش‌فرض            | `en-US-JennyNeural`                                                                                            |
| خروجی فایل پیش‌فرض      | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| فایل یادداشت صوتی پیش‌فرض | `ogg-24khz-16bit-mono-opus`                                                                                    |

## شروع به کار

<Steps>
  <Step title="ایجاد یک منبع Azure Speech">
    در پورتال Azure، یک منبع Speech ایجاد کنید. **KEY 1** را از
    Resource Management > Keys and Endpoint کپی کنید، و موقعیت منبع
    مانند `eastus` را کپی کنید.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="انتخاب Azure Speech در messages.tts">
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
  <Step title="ارسال یک پیام">
    یک پاسخ را از طریق هر کانال متصل ارسال کنید. OpenClaw صدا را
    با Azure Speech تولید می‌کند و برای صدای استاندارد MP3، یا زمانی که
    کانال انتظار یادداشت صوتی دارد Ogg/Opus تحویل می‌دهد.
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه                  | مسیر                                                        | توضیح                                                                                           |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | `messages.tts.providers.azure-speech.apiKey`                | کلید منبع Azure Speech. به `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY` برمی‌گردد. |
| `region`                | `messages.tts.providers.azure-speech.region`                | منطقهٔ منبع Azure Speech. به `AZURE_SPEECH_REGION` یا `SPEECH_REGION` برمی‌گردد.                 |
| `endpoint`              | `messages.tts.providers.azure-speech.endpoint`              | بازنویسی اختیاری endpoint/نشانی پایهٔ Azure Speech.                                                     |
| `baseUrl`               | `messages.tts.providers.azure-speech.baseUrl`               | بازنویسی اختیاری نشانی پایهٔ Azure Speech.                                                              |
| `voice`                 | `messages.tts.providers.azure-speech.voice`                 | مقدار ShortName صدای Azure (پیش‌فرض `en-US-JennyNeural`).                                                  |
| `lang`                  | `messages.tts.providers.azure-speech.lang`                  | کد زبان SSML (پیش‌فرض `en-US`).                                                                 |
| `outputFormat`          | `messages.tts.providers.azure-speech.outputFormat`          | قالب خروجی فایل صوتی (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | قالب خروجی یادداشت صوتی (پیش‌فرض `ogg-24khz-16bit-mono-opus`).                                       |

## یادداشت‌ها

<AccordionGroup>
  <Accordion title="احراز هویت">
    Azure Speech از کلید منبع Speech استفاده می‌کند، نه کلید Azure OpenAI. کلید
    به‌صورت `Ocp-Apim-Subscription-Key` ارسال می‌شود؛ OpenClaw
    `https://<region>.tts.speech.microsoft.com` را از `region` استخراج می‌کند مگر اینکه
    `endpoint` یا `baseUrl` را ارائه کنید.
  </Accordion>
  <Accordion title="نام‌های صدا">
    از مقدار `ShortName` صدای Azure Speech استفاده کنید، برای مثال
    `en-US-JennyNeural`. ارائه‌دهندهٔ همراه می‌تواند صداها را از طریق همان
    منبع Speech فهرست کند و صداهایی را که به‌عنوان منسوخ یا بازنشسته علامت‌گذاری شده‌اند فیلتر می‌کند.
  </Accordion>
  <Accordion title="خروجی‌های صوتی">
    Azure قالب‌های خروجی مانند `audio-24khz-48kbitrate-mono-mp3`،
    `ogg-24khz-16bit-mono-opus` و `riff-24khz-16bit-mono-pcm` را می‌پذیرد. OpenClaw
    برای مقصدهای `voice-note`، Ogg/Opus درخواست می‌کند تا کانال‌ها بتوانند
    حباب‌های صوتی بومی را بدون تبدیل اضافی MP3 ارسال کنند.
  </Accordion>
  <Accordion title="نام مستعار">
    `azure` به‌عنوان نام مستعار ارائه‌دهنده برای PRهای موجود و پیکربندی کاربر پذیرفته می‌شود،
    اما پیکربندی جدید باید از `azure-speech` استفاده کند تا با ارائه‌دهندگان مدل
    Azure OpenAI اشتباه نشود.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تبدیل متن به گفتار" href="/fa/tools/tts" icon="waveform-lines">
    نمای کلی TTS، ارائه‌دهندگان، و پیکربندی `messages.tts`.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی شامل تنظیمات `messages.tts`.
  </Card>
  <Card title="ارائه‌دهندگان" href="/fa/providers" icon="grid">
    همهٔ ارائه‌دهندگان همراه OpenClaw.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
</CardGroup>
