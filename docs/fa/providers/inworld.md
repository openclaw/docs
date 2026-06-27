---
read_when:
    - می‌خواهید برای پاسخ‌های خروجی از سنتز گفتار Inworld استفاده کنید
    - به خروجی تلفنی PCM یا یادداشت صوتی OGG_OPUS از Inworld نیاز دارید
summary: پخش جریانی تبدیل متن به گفتار Inworld برای پاسخ‌های OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-06-27T18:41:07Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea65903945586516b51b239f0671b9e59dac92f302442f3cb629f66b68338cfb
    source_path: providers/inworld.md
    workflow: 16
---

Inworld یک ارائه‌دهندهٔ پخش جریانی متن به گفتار (TTS) است. در OpenClaw،
صدای پاسخ خروجی را تولید می‌کند (به‌طور پیش‌فرض MP3، و برای یادداشت‌های صوتی OGG_OPUS)
و برای کانال‌های تلفنی مانند تماس صوتی، صدای PCM می‌سازد.

OpenClaw به نقطهٔ پایانی TTS پخش جریانی Inworld درخواست ارسال می‌کند، قطعه‌های
صوتی base64 برگشتی را در یک بافر واحد به هم متصل می‌کند، و نتیجه را به
خط لولهٔ استاندارد صدای پاسخ تحویل می‌دهد.

| ویژگی      | مقدار                                                           |
| ------------- | --------------------------------------------------------------- |
| شناسهٔ ارائه‌دهنده   | `inworld`                                                       |
| Plugin        | بستهٔ خارجی رسمی                                       |
| قرارداد      | `speechProviders` (فقط TTS)                                    |
| متغیر محیطی احراز هویت  | `INWORLD_API_KEY` (HTTP Basic، اعتبارنامهٔ داشبورد Base64)     |
| URL پایه      | `https://api.inworld.ai`                                        |
| صدای پیش‌فرض | `Sarah`                                                         |
| مدل پیش‌فرض | `inworld-tts-1.5-max`                                           |
| خروجی        | MP3 (پیش‌فرض)، OGG_OPUS (یادداشت‌های صوتی)، PCM 22050 Hz (تلفنی) |
| وب‌سایت       | [inworld.ai](https://inworld.ai)                                |
| مستندات          | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/inworld-speech
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="Set your API key">
    اعتبارنامه را از داشبورد Inworld خود کپی کنید (Workspace > API Keys)
    و آن را به‌عنوان یک متغیر محیطی تنظیم کنید. مقدار، عیناً به‌عنوان اعتبارنامهٔ
    HTTP Basic ارسال می‌شود، بنابراین آن را دوباره Base64-encode نکنید یا به
    توکن bearer تبدیل نکنید.

    ```
    INWORLD_API_KEY=<base64-credential-from-dashboard>
    ```

  </Step>
  <Step title="Select Inworld in messages.tts">
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
  <Step title="Send a message">
    از طریق هر کانال متصل، یک پاسخ ارسال کنید. OpenClaw صدا را با Inworld
    تولید می‌کند و آن را به‌صورت MP3 تحویل می‌دهد (یا وقتی کانال انتظار
    یادداشت صوتی دارد، به‌صورت OGG_OPUS).
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه           | مسیر                                            | توضیح                                                       |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`         | `messages.tts.providers.inworld.apiKey`         | اعتبارنامهٔ داشبورد Base64. در صورت نبود مقدار، از `INWORLD_API_KEY` استفاده می‌کند.     |
| `baseUrl`        | `messages.tts.providers.inworld.baseUrl`        | بازنویسی URL پایهٔ API Inworld (پیش‌فرض `https://api.inworld.ai`). |
| `speakerVoiceId` | `messages.tts.providers.inworld.speakerVoiceId` | شناسهٔ صدا (پیش‌فرض `Sarah`).                               |
| `modelId`        | `messages.tts.providers.inworld.modelId`        | شناسهٔ مدل TTS (پیش‌فرض `inworld-tts-1.5-max`).                     |
| `temperature`    | `messages.tts.providers.inworld.temperature`    | دمای نمونه‌گیری `0..2` (اختیاری).                           |

## یادداشت‌ها

<AccordionGroup>
  <Accordion title="Authentication">
    Inworld از احراز هویت HTTP Basic با یک رشتهٔ اعتبارنامهٔ Base64-encoded
    استفاده می‌کند. آن را عیناً از داشبورد Inworld کپی کنید. ارائه‌دهنده آن را
    به‌صورت `Authorization: Basic <apiKey>` بدون هیچ encoding بیشتری ارسال می‌کند،
    بنابراین خودتان آن را Base64-encode نکنید و توکن سبک bearer ارسال نکنید.
    برای همین نکته، [یادداشت‌های احراز هویت TTS](/fa/tools/tts#inworld-primary) را ببینید.
  </Accordion>
  <Accordion title="Models">
    شناسه‌های مدل پشتیبانی‌شده: `inworld-tts-1.5-max` (پیش‌فرض)،
    `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.
  </Accordion>
  <Accordion title="Audio outputs">
    پاسخ‌ها به‌طور پیش‌فرض از MP3 استفاده می‌کنند. وقتی هدف کانال `voice-note`
    باشد، OpenClaw از Inworld درخواست `OGG_OPUS` می‌کند تا صدا به‌صورت یک
    حباب صوتی بومی پخش شود. تولید صدای تلفنی از `PCM` خام با 22050 Hz استفاده
    می‌کند تا پل تلفنی را تغذیه کند.
  </Accordion>
  <Accordion title="Custom endpoints">
    میزبان API را با `messages.tts.providers.inworld.baseUrl` بازنویسی کنید.
    اسلش‌های انتهایی پیش از ارسال درخواست‌ها حذف می‌شوند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Text-to-speech" href="/fa/tools/tts" icon="waveform-lines">
    نمای کلی TTS، ارائه‌دهنده‌ها، و پیکربندی `messages.tts`.
  </Card>
  <Card title="Configuration" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی شامل تنظیمات `messages.tts`.
  </Card>
  <Card title="Providers" href="/fa/providers" icon="grid">
    همهٔ ارائه‌دهنده‌های پشتیبانی‌شدهٔ OpenClaw.
  </Card>
  <Card title="Troubleshooting" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و گام‌های اشکال‌زدایی.
  </Card>
</CardGroup>
