---
read_when:
    - می‌خواهید از گفتارسازی Azure Speech برای پاسخ‌های خروجی استفاده کنید
    - به خروجی بومی یادداشت صوتی Ogg Opus از Azure Speech نیاز دارید
summary: تبدیل متن به گفتار Azure AI Speech برای پاسخ‌های OpenClaw
title: Azure Speech
x-i18n:
    generated_at: "2026-06-27T18:37:22Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c14b1f3c2fda9b2f820e537d7133b1dbf71573b7d735207c6a4ca19432a8d8c3
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech یک ارائه‌دهنده تبدیل متن به گفتار Azure AI Speech است. در OpenClaw، صدای پاسخ خروجی را به‌طور پیش‌فرض به‌صورت MP3، برای یادداشت‌های صوتی به‌صورت Ogg/Opus بومی، و برای کانال‌های تلفنی مانند تماس صوتی به‌صورت صدای mulaw با نرخ 8 kHz تولید می‌کند.

OpenClaw مستقیماً از Azure Speech REST API همراه با SSML استفاده می‌کند و قالب خروجی متعلق به ارائه‌دهنده را از طریق `X-Microsoft-OutputFormat` می‌فرستد.

| جزئیات                 | مقدار                                                                                                          |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| وب‌سایت                | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| مستندات                | [تبدیل متن به گفتار REST در Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| احراز هویت             | `AZURE_SPEECH_KEY` به‌همراه `AZURE_SPEECH_REGION`                                                              |
| صدای پیش‌فرض           | `en-US-JennyNeural`                                                                                            |
| خروجی فایل پیش‌فرض     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| فایل یادداشت صوتی پیش‌فرض | `ogg-24khz-16bit-mono-opus`                                                                                    |

## شروع به کار

<Steps>
  <Step title="Create an Azure Speech resource">
    در پورتال Azure، یک منبع Speech ایجاد کنید. **KEY 1** را از
    Resource Management > Keys and Endpoint کپی کنید و مکان منبع
    مانند `eastus` را نیز کپی کنید.

    ```
    AZURE_SPEECH_KEY=<speech-resource-key>
    AZURE_SPEECH_REGION=eastus
    ```

  </Step>
  <Step title="Select Azure Speech in messages.tts">
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
  <Step title="Send a message">
    از طریق هر کانال متصل، یک پاسخ بفرستید. OpenClaw صدا را
    با Azure Speech تولید می‌کند و برای صدای استاندارد MP3، یا زمانی که
    کانال انتظار یادداشت صوتی دارد Ogg/Opus تحویل می‌دهد.
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه                  | مسیر                                                        | توضیح                                                                                           |
| ---------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `apiKey`               | `messages.tts.providers.azure-speech.apiKey`                | کلید منبع Azure Speech. در صورت نبود، به `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY`، یا `SPEECH_KEY` برمی‌گردد. |
| `region`               | `messages.tts.providers.azure-speech.region`                | منطقه منبع Azure Speech. در صورت نبود، به `AZURE_SPEECH_REGION` یا `SPEECH_REGION` برمی‌گردد. |
| `endpoint`             | `messages.tts.providers.azure-speech.endpoint`              | بازنویسی اختیاری endpoint/نشانی پایه Azure Speech.                                             |
| `baseUrl`              | `messages.tts.providers.azure-speech.baseUrl`               | بازنویسی اختیاری نشانی پایه Azure Speech.                                                       |
| `speakerVoice`         | `messages.tts.providers.azure-speech.speakerVoice`          | ShortName صدای Azure (پیش‌فرض `en-US-JennyNeural`). نام مستعار قدیمی: `voice`.                 |
| `lang`                 | `messages.tts.providers.azure-speech.lang`                  | کد زبان SSML (پیش‌فرض `en-US`).                                                                 |
| `outputFormat`         | `messages.tts.providers.azure-speech.outputFormat`          | قالب خروجی فایل صوتی (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).                              |
| `voiceNoteOutputFormat` | `messages.tts.providers.azure-speech.voiceNoteOutputFormat` | قالب خروجی یادداشت صوتی (پیش‌فرض `ogg-24khz-16bit-mono-opus`).                                 |

## یادداشت‌ها

<AccordionGroup>
  <Accordion title="Authentication">
    Azure Speech از کلید منبع Speech استفاده می‌کند، نه کلید Azure OpenAI. کلید
    با عنوان `Ocp-Apim-Subscription-Key` فرستاده می‌شود؛ OpenClaw
    `https://<region>.tts.speech.microsoft.com` را از `region` می‌سازد، مگر اینکه
    `endpoint` یا `baseUrl` را ارائه کنید.
  </Accordion>
  <Accordion title="Voice names">
    از مقدار `ShortName` صدای Azure Speech استفاده کنید، برای نمونه
    `en-US-JennyNeural`. ارائه‌دهنده همراه می‌تواند صداها را از طریق همان
    منبع Speech فهرست کند و صداهایی را که منسوخ یا بازنشسته علامت‌گذاری شده‌اند فیلتر می‌کند.
  </Accordion>
  <Accordion title="Audio outputs">
    Azure قالب‌های خروجی مانند `audio-24khz-48kbitrate-mono-mp3`،
    `ogg-24khz-16bit-mono-opus`، و `riff-24khz-16bit-mono-pcm` را می‌پذیرد. OpenClaw
    برای هدف‌های `voice-note`، Ogg/Opus درخواست می‌کند تا کانال‌ها بتوانند حباب‌های
    صوتی بومی را بدون تبدیل اضافی به MP3 بفرستند.
  </Accordion>
  <Accordion title="Alias">
    `azure` به‌عنوان نام مستعار ارائه‌دهنده برای PRهای موجود و پیکربندی کاربر پذیرفته می‌شود،
    اما پیکربندی جدید باید از `azure-speech` استفاده کند تا با ارائه‌دهندگان مدل
    Azure OpenAI اشتباه نشود.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/fa/tools/tts" icon="waveform-lines">
    نمای کلی تبدیل متن به گفتار، ارائه‌دهندگان، و پیکربندی `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی شامل تنظیمات `messages.tts`.
  </Card>
  <Card title="Providers" href="/fa/providers" icon="grid">
    همه ارائه‌دهندگان همراه OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
</CardGroup>
