---
read_when:
    - برای پاسخ‌های خروجی، به سنتز گفتار Azure نیاز دارید
    - به خروجی بومی یادداشت صوتی Ogg Opus از Azure Speech نیاز دارید
summary: تبدیل متن به گفتار Azure AI Speech برای پاسخ‌های OpenClaw
title: گفتار Azure
x-i18n:
    generated_at: "2026-07-16T17:13:43Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: f5eab231afee8f606c5257465f958d42838efab7fde1642578cad987c564c700
    source_path: providers/azure-speech.md
    workflow: 16
---

Azure Speech یک ارائه‌دهندهٔ تبدیل متن به گفتار Azure AI Speech است که به‌صورت یکپارچه ارائه می‌شود. OpenClaw
با استفاده از SSML مستقیماً API REST سرویس Azure Speech را فراخوانی می‌کند و برای
پاسخ‌های استاندارد MP3، برای یادداشت‌های صوتی Ogg/Opus بومی و برای
کانال‌های تلفنی مانند Voice Call صدای mulaw با فرکانس 8 kHz تولید می‌کند. درخواست، قالب خروجی متعلق به ارائه‌دهنده را
از طریق سرآیند `X-Microsoft-OutputFormat` ارسال می‌کند.

| جزئیات                  | مقدار                                                                                                          |
| ----------------------- | -------------------------------------------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده             | `azure-speech` (نام مستعار: `azure`)                                                                                |
| وب‌سایت                 | [Azure AI Speech](https://azure.microsoft.com/products/ai-services/ai-speech)                                  |
| مستندات                    | [تبدیل متن به گفتار با REST سرویس Speech](https://learn.microsoft.com/azure/ai-services/speech-service/rest-text-to-speech) |
| احراز هویت                    | `AZURE_SPEECH_KEY` به‌همراه `AZURE_SPEECH_REGION`                                                                  |
| صدای پیش‌فرض           | `en-US-JennyNeural`                                                                                            |
| خروجی فایل پیش‌فرض     | `audio-24khz-48kbitrate-mono-mp3`                                                                              |
| فایل پیش‌فرض یادداشت صوتی | `ogg-24khz-16bit-mono-opus`                                                                                    |

## شروع به کار

<Steps>
  <Step title="ایجاد یک منبع Azure Speech">
    در پورتال Azure، یک منبع Speech ایجاد کنید. **KEY 1** را از
    Resource Management > Keys and Endpoint کپی کنید و موقعیت منبع،
    مانند `eastus`، را نیز کپی کنید.

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
  <Step title="ارسال پیام">
    از طریق هر کانال متصل، پاسخی ارسال کنید. OpenClaw صدا را
    با Azure Speech تولید می‌کند و برای صدای استاندارد MP3 یا هنگامی که
    کانال انتظار یادداشت صوتی دارد، Ogg/Opus تحویل می‌دهد.
  </Step>
</Steps>

## گزینه‌های پیکربندی

همهٔ گزینه‌ها زیر `messages.tts.providers["azure-speech"]` قرار دارند.

| گزینه                  | توضیحات                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------- |
| `apiKey`                | کلید منبع Azure Speech. در صورت تنظیم‌نبودن، از `AZURE_SPEECH_KEY`، `AZURE_SPEECH_API_KEY` یا `SPEECH_KEY` استفاده می‌شود. |
| `region`                | منطقهٔ منبع Azure Speech. در صورت تنظیم‌نبودن، از `AZURE_SPEECH_REGION` یا `SPEECH_REGION` استفاده می‌شود.                 |
| `endpoint`              | بازنویسی اختیاری نقطهٔ پایانی Azure Speech. در صورت تنظیم‌نبودن، از `AZURE_SPEECH_ENDPOINT` مورد اعتماد استفاده می‌شود.               |
| `baseUrl`               | بازنویسی اختیاری URL پایهٔ Azure Speech.                                                              |
| `voice`                 | ShortName صدای Azure (پیش‌فرض `en-US-JennyNeural`). نام مستعار قدیمی: `voiceId`.                         |
| `lang`                  | کد زبان SSML (پیش‌فرض `en-US`).                                                                 |
| `outputFormat`          | قالب خروجی فایل صوتی (پیش‌فرض `audio-24khz-48kbitrate-mono-mp3`).                                 |
| `voiceNoteOutputFormat` | قالب خروجی یادداشت صوتی (پیش‌فرض `ogg-24khz-16bit-mono-opus`).                                       |
| `timeoutMs`             | بازنویسی مهلت زمانی درخواست برحسب میلی‌ثانیه. در صورت تنظیم‌نبودن، از `messages.tts.timeoutMs` سراسری استفاده می‌شود.          |

ارائه‌دهنده زمانی پیکربندی‌شده در نظر گرفته می‌شود که `apiKey` به‌همراه یکی از
`region`، `endpoint` یا `baseUrl` تنظیم شده باشد. متغیرهای محیطی فقط به‌عنوان گزینهٔ جایگزین
برای کلیدهای پیکربندی تنظیم‌نشده بررسی می‌شوند. فایل‌های `.env` فضای کاری نمی‌توانند
`AZURE_SPEECH_ENDPOINT` را تنظیم کنند؛ برای مسیریابی نقطهٔ پایانی، از محیط فرایند، dotenv سراسری زمان اجرا
یا پیکربندی صریح استفاده کنید.

## نکات

<AccordionGroup>
  <Accordion title="احراز هویت">
    Azure Speech از کلید منبع Speech استفاده می‌کند، نه کلید Azure OpenAI. کلید
    به‌صورت `Ocp-Apim-Subscription-Key` ارسال می‌شود؛ OpenClaw مقدار
    `https://<region>.tts.speech.microsoft.com` را از `region` استخراج می‌کند، مگر اینکه
    `endpoint` یا `baseUrl` را ارائه کنید.
  </Accordion>
  <Accordion title="نام صداها">
    از مقدار `ShortName` صدای Azure Speech استفاده کنید؛ برای مثال
    `en-US-JennyNeural`. ارائه‌دهندهٔ یکپارچه می‌تواند صداها را از طریق
    همان منبع Speech فهرست کند و صداهای علامت‌گذاری‌شده به‌عنوان منسوخ، بازنشسته
    یا غیرفعال را حذف می‌کند.
  </Accordion>
  <Accordion title="خروجی‌های صوتی">
    Azure قالب‌های خروجی مانند `audio-24khz-48kbitrate-mono-mp3`،
    `ogg-24khz-16bit-mono-opus` و `riff-24khz-16bit-mono-pcm` را می‌پذیرد. OpenClaw
    برای مقصدهای `voice-note`، Ogg/Opus درخواست می‌کند تا کانال‌ها بتوانند حباب‌های صوتی بومی را
    بدون تبدیل اضافی MP3 ارسال کنند و برای مقصدهای تلفنی
    `raw-8khz-8bit-mono-mulaw` را اجباری می‌کند.
  </Accordion>
  <Accordion title="نام مستعار">
    `azure` به‌عنوان نام مستعار ارائه‌دهنده برای پیکربندی موجود پذیرفته می‌شود، اما پیکربندی
    جدید باید از `azure-speech` استفاده کند تا با ارائه‌دهندگان مدل Azure OpenAI
    اشتباه نشود.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="تبدیل متن به گفتار" href="/fa/tools/tts" icon="waveform-lines">
    نمای کلی TTS، ارائه‌دهندگان و پیکربندی `messages.tts`.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی، شامل تنظیمات `messages.tts`.
  </Card>
  <Card title="ارائه‌دهندگان" href="/fa/providers" icon="grid">
    همهٔ ارائه‌دهندگان یکپارچهٔ OpenClaw.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
</CardGroup>
