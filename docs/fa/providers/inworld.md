---
read_when:
    - می‌خواهید از سنتز گفتار Inworld برای پاسخ‌های خروجی استفاده کنید
    - به خروجی تلفنی PCM یا خروجی یادداشت صوتی OGG_OPUS از Inworld نیاز دارید
summary: تبدیل متن به گفتار جریانی Inworld برای پاسخ‌های OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-05-06T09:39:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: caf291bab5da946262ecaf4263c188c168be08ddb43fda72f250b8f8db87b3ff
    source_path: providers/inworld.md
    workflow: 16
---

Inworld یک ارائه‌دهنده پخش جریانی متن به گفتار (TTS) است. در OpenClaw، صدای پاسخ خروجی را می‌سازد (به‌صورت پیش‌فرض MP3، و برای یادداشت‌های صوتی OGG_OPUS)
و برای کانال‌های تلفنی مانند تماس صوتی، صدای PCM تولید می‌کند.

OpenClaw درخواست را به نقطه پایانی TTS جریانی Inworld ارسال می‌کند، قطعه‌های صوتی base64
برگشتی را در یک بافر واحد به هم متصل می‌کند، و نتیجه را به
خط لوله استاندارد صوت پاسخ تحویل می‌دهد.

| ویژگی         | مقدار                                                           |
| ------------- | --------------------------------------------------------------- |
| شناسه ارائه‌دهنده | `inworld`                                                       |
| Plugin        | همراه، `enabledByDefault: true`                               |
| قرارداد       | `speechProviders` (فقط TTS)                                    |
| متغیر محیطی احراز هویت | `INWORLD_API_KEY` (HTTP Basic، اعتبارنامه داشبورد Base64)     |
| URL پایه      | `https://api.inworld.ai`                                        |
| صدای پیش‌فرض  | `Sarah`                                                         |
| مدل پیش‌فرض   | `inworld-tts-1.5-max`                                           |
| خروجی         | MP3 (پیش‌فرض)، OGG_OPUS (یادداشت‌های صوتی)، PCM 22050 Hz (تلفن) |
| وب‌سایت       | [inworld.ai](https://inworld.ai)                                |
| مستندات       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)      |

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    اعتبارنامه را از داشبورد Inworld خود کپی کنید (Workspace > API Keys)
    و آن را به‌عنوان یک متغیر محیطی تنظیم کنید. مقدار بدون تغییر به‌عنوان
    اعتبارنامه HTTP Basic ارسال می‌شود، بنابراین دوباره آن را Base64-encode
    نکنید و آن را به bearer token تبدیل نکنید.

    ```
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
  <Step title="یک پیام بفرستید">
    از طریق هر کانال متصل، یک پاسخ بفرستید. OpenClaw صدا را با Inworld
    می‌سازد و آن را به‌صورت MP3 تحویل می‌دهد (یا وقتی کانال انتظار
    یادداشت صوتی دارد، به‌صورت OGG_OPUS).
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه         | مسیر                                         | توضیح                                                            |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | اعتبارنامه داشبورد Base64. در صورت نبود، از `INWORLD_API_KEY` استفاده می‌کند. |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | بازنویسی URL پایه API Inworld (پیش‌فرض `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | شناسه صدا (پیش‌فرض `Sarah`).                                      |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | شناسه مدل TTS (پیش‌فرض `inworld-tts-1.5-max`).                    |
| `temperature` | `messages.tts.providers.inworld.temperature` | دمای نمونه‌گیری `0..2` (اختیاری).                                |

## یادداشت‌ها

<AccordionGroup>
  <Accordion title="احراز هویت">
    Inworld از احراز هویت HTTP Basic با یک رشته اعتبارنامه واحد
    کدگذاری‌شده با Base64 استفاده می‌کند. آن را بدون تغییر از داشبورد
    Inworld کپی کنید. ارائه‌دهنده آن را بدون هیچ کدگذاری بیشتر، به‌صورت
    `Authorization: Basic <apiKey>` ارسال می‌کند، بنابراین خودتان آن را
    Base64-encode نکنید و token به سبک bearer ارسال نکنید.
    برای همین نکته، [یادداشت‌های احراز هویت TTS](/fa/tools/tts#inworld-primary) را ببینید.
  </Accordion>
  <Accordion title="مدل‌ها">
    شناسه‌های مدل پشتیبانی‌شده: `inworld-tts-1.5-max` (پیش‌فرض)،
    `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.
  </Accordion>
  <Accordion title="خروجی‌های صوتی">
    پاسخ‌ها به‌صورت پیش‌فرض از MP3 استفاده می‌کنند. وقتی مقصد کانال `voice-note`
    باشد، OpenClaw از Inworld درخواست `OGG_OPUS` می‌کند تا صدا به‌صورت
    حباب صوتی بومی پخش شود. ساخت صدای تلفنی از `PCM` خام با 22050 Hz
    برای تغذیه پل تلفنی استفاده می‌کند.
  </Accordion>
  <Accordion title="نقاط پایانی سفارشی">
    میزبان API را با `messages.tts.providers.inworld.baseUrl` بازنویسی کنید.
    اسلش‌های انتهایی پیش از ارسال درخواست‌ها حذف می‌شوند.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="متن به گفتار" href="/fa/tools/tts" icon="waveform-lines">
    نمای کلی TTS، ارائه‌دهنده‌ها، و پیکربندی `messages.tts`.
  </Card>
  <Card title="پیکربندی" href="/fa/gateway/configuration" icon="gear">
    مرجع کامل پیکربندی شامل تنظیمات `messages.tts`.
  </Card>
  <Card title="ارائه‌دهنده‌ها" href="/fa/providers" icon="grid">
    همه ارائه‌دهنده‌های همراه OpenClaw.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و گام‌های اشکال‌زدایی.
  </Card>
</CardGroup>
