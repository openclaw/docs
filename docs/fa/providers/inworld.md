---
read_when:
    - برای پاسخ‌های خروجی، سنتز گفتار Inworld را می‌خواهید
    - به خروجی تلفنی PCM یا یادداشت صوتی OGG_OPUS از Inworld نیاز دارید
summary: تبدیل متن به گفتار جریانی Inworld برای پاسخ‌های OpenClaw
title: این‌ورلد
x-i18n:
    generated_at: "2026-07-12T10:44:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 443797be3eec0f63c52a7b6b697abb85b15db9b878174f6f6b70ddec474e6326
    source_path: providers/inworld.md
    workflow: 16
---

Inworld یک ارائه‌دهندهٔ تبدیل متن به گفتار جریانی (TTS) است. در OpenClaw، این سرویس صدای پاسخ‌های خروجی (به‌طور پیش‌فرض MP3 و برای یادداشت‌های صوتی OGG_OPUS) و صدای خام PCM را برای کانال‌های تلفنی مانند Voice Call تولید می‌کند.

OpenClaw درخواست‌ها را به نقطهٔ پایانی TTS جریانی Inworld ارسال می‌کند، قطعه‌های صوتی base64 بازگشتی را در یک بافر واحد به هم متصل می‌کند و نتیجه را به خط لولهٔ استاندارد صدای پاسخ تحویل می‌دهد.

| ویژگی              | مقدار                                                                      |
| ------------------ | -------------------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده | `inworld`                                                                  |
| Plugin             | بستهٔ خارجی رسمی (`@openclaw/inworld-speech`)                              |
| قرارداد            | `speechProviders` (فقط TTS)                                                |
| متغیر محیطی احراز هویت | `INWORLD_API_KEY` (HTTP Basic، اعتبارنامهٔ Base64 داشبورد)             |
| نشانی پایه         | `https://api.inworld.ai`                                                   |
| صدای پیش‌فرض       | `Sarah`                                                                    |
| مدل پیش‌فرض        | `inworld-tts-1.5-max`                                                      |
| خروجی              | MP3 (پیش‌فرض)، OGG_OPUS (یادداشت صوتی)، PCM با نرخ 22050 هرتز (تلفنی)     |
| وب‌سایت            | [inworld.ai](https://inworld.ai)                                           |
| مستندات            | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)                 |

## نصب Plugin

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    اعتبارنامه را از داشبورد Inworld خود (Workspace > API Keys) کپی کنید و آن را به‌عنوان یک متغیر محیطی تنظیم کنید. مقدار بدون تغییر به‌عنوان اعتبارنامهٔ HTTP Basic ارسال می‌شود؛ بنابراین آن را دوباره با Base64 کدگذاری نکنید و به توکن bearer تبدیل نکنید.

    ```bash
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Inworld را در messages.tts انتخاب کنید">
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
  <Step title="یک پیام ارسال کنید">
    از طریق هر کانال متصل، پاسخی ارسال کنید. OpenClaw صدا را با Inworld تولید می‌کند و آن را به‌صورت MP3 تحویل می‌دهد (یا هنگامی که کانال انتظار یادداشت صوتی دارد، به‌صورت OGG_OPUS).
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه        | مسیر                                         | توضیح                                                                      |
| ------------ | -------------------------------------------- | -------------------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | اعتبارنامهٔ Base64 داشبورد. در صورت نبود، از `INWORLD_API_KEY` استفاده می‌کند. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | بازنویسی نشانی پایهٔ API ‏Inworld (پیش‌فرض `https://api.inworld.ai`).       |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | شناسهٔ صدا (پیش‌فرض `Sarah`). نام مستعار قدیمی: `speakerVoiceId`.           |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | شناسهٔ مدل TTS (پیش‌فرض `inworld-tts-1.5-max`).                             |
| `temperature` | `messages.tts.providers.inworld.temperature` | دمای نمونه‌برداری، از `0` (غیرشامل) تا `2` (اختیاری).                       |

## نکات

<AccordionGroup>
  <Accordion title="احراز هویت">
    Inworld از احراز هویت HTTP Basic با یک رشتهٔ اعتبارنامهٔ کدگذاری‌شده با Base64 استفاده می‌کند. آن را بدون تغییر از داشبورد Inworld کپی کنید. ارائه‌دهنده آن را بدون هیچ کدگذاری دیگری به‌صورت `Authorization: Basic <apiKey>` ارسال می‌کند؛ بنابراین خودتان آن را با Base64 کدگذاری نکنید و توکنی به سبک bearer وارد نکنید. برای همین نکته، [یادداشت‌های احراز هویت TTS](/fa/tools/tts#inworld-primary) را ببینید.
  </Accordion>
  <Accordion title="مدل‌ها">
    شناسه‌های مدل پشتیبانی‌شده: `inworld-tts-1.5-max` (پیش‌فرض)، `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.
  </Accordion>
  <Accordion title="خروجی‌های صوتی">
    پاسخ‌ها به‌طور پیش‌فرض از MP3 استفاده می‌کنند. هنگامی که مقصد کانال `voice-note` است، OpenClaw از Inworld درخواست `OGG_OPUS` می‌کند تا صدا به‌صورت یک حباب صوتی بومی پخش شود. تولید صوت تلفنی از `PCM` خام با نرخ 22050 هرتز برای تغذیهٔ پل تلفنی استفاده می‌کند.
  </Accordion>
  <Accordion title="نقاط پایانی سفارشی">
    میزبان API را با `messages.tts.providers.inworld.baseUrl` بازنویسی کنید. پیش از ارسال درخواست‌ها، ممیزهای انتهایی حذف می‌شوند.
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
    همهٔ ارائه‌دهندگان پشتیبانی‌شدهٔ OpenClaw.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
</CardGroup>
