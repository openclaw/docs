---
read_when:
    - می‌خواهید از ترکیب گفتار Inworld برای پاسخ‌های خروجی استفاده کنید
    - به خروجی تلفنی PCM یا پیام صوتی OGG_OPUS از Inworld نیاز دارید
summary: متن‌به‌گفتار جریانی Inworld برای پاسخ‌های OpenClaw
title: Inworld
x-i18n:
    generated_at: "2026-04-29T23:25:56Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4c3908b6ab11fd7bd2e18e5c56d1fdc1ac2e52448538d31cc6c83c2c97917641
    source_path: providers/inworld.md
    workflow: 16
---

Inworld یک ارائه‌دهنده تبدیل متن به گفتار (TTS) جریانی است. در OpenClaw، صدای پاسخ خروجی را ترکیب می‌کند (به‌طور پیش‌فرض MP3، و برای پیام‌های صوتی OGG_OPUS) و برای کانال‌های تلفنی مانند Voice Call صدای PCM تولید می‌کند.

OpenClaw درخواست را به نقطه پایانی TTS جریانی Inworld ارسال می‌کند، قطعه‌های صوتی base64 برگشتی را در یک بافر واحد به هم متصل می‌کند و نتیجه را به خط لوله استاندارد صدای پاسخ تحویل می‌دهد.

| جزئیات        | مقدار                                                       |
| ------------- | ----------------------------------------------------------- |
| وب‌سایت       | [inworld.ai](https://inworld.ai)                            |
| مستندات       | [docs.inworld.ai/tts/tts](https://docs.inworld.ai/tts/tts)  |
| احراز هویت    | `INWORLD_API_KEY` (HTTP Basic، اعتبارنامه داشبورد Base64) |
| صدای پیش‌فرض | `Sarah`                                                     |
| مدل پیش‌فرض  | `inworld-tts-1.5-max`                                       |

## شروع به کار

<Steps>
  <Step title="کلید API خود را تنظیم کنید">
    اعتبارنامه را از داشبورد Inworld خود (Workspace > API Keys) کپی کنید
    و آن را به‌عنوان یک متغیر محیطی تنظیم کنید. مقدار، عیناً به‌عنوان اعتبارنامه HTTP Basic
    ارسال می‌شود، بنابراین آن را دوباره Base64-encode نکنید یا به توکن bearer
    تبدیل نکنید.

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
    از طریق هر کانال متصل، یک پاسخ ارسال کنید. OpenClaw صدا را با Inworld ترکیب می‌کند
    و آن را به‌صورت MP3 تحویل می‌دهد (یا وقتی کانال انتظار پیام صوتی دارد، به‌صورت OGG_OPUS).
  </Step>
</Steps>

## گزینه‌های پیکربندی

| گزینه        | مسیر                                         | توضیح                                                       |
| ------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `apiKey`      | `messages.tts.providers.inworld.apiKey`      | اعتبارنامه داشبورد Base64. به `INWORLD_API_KEY` برمی‌گردد.     |
| `baseUrl`     | `messages.tts.providers.inworld.baseUrl`     | بازنویسی URL پایه API Inworld (پیش‌فرض `https://api.inworld.ai`). |
| `voiceId`     | `messages.tts.providers.inworld.voiceId`     | شناسه صدا (پیش‌فرض `Sarah`).                               |
| `modelId`     | `messages.tts.providers.inworld.modelId`     | شناسه مدل TTS (پیش‌فرض `inworld-tts-1.5-max`).                     |
| `temperature` | `messages.tts.providers.inworld.temperature` | دمای نمونه‌برداری `0..2` (اختیاری).                           |

## نکات

<AccordionGroup>
  <Accordion title="احراز هویت">
    Inworld از احراز هویت HTTP Basic با یک رشته اعتبارنامه Base64-encoded
    استفاده می‌کند. آن را عیناً از داشبورد Inworld کپی کنید. ارائه‌دهنده
    آن را بدون هیچ رمزگذاری بیشتر به‌صورت `Authorization: Basic <apiKey>` ارسال می‌کند، بنابراین
    خودتان آن را Base64-encode نکنید و توکن به سبک bearer ارسال نکنید.
    برای همین نکته، [یادداشت‌های احراز هویت TTS](/fa/tools/tts#inworld-primary) را ببینید.
  </Accordion>
  <Accordion title="مدل‌ها">
    شناسه‌های مدل پشتیبانی‌شده: `inworld-tts-1.5-max` (پیش‌فرض)،
    `inworld-tts-1.5-mini`، `inworld-tts-1-max`، `inworld-tts-1`.
  </Accordion>
  <Accordion title="خروجی‌های صوتی">
    پاسخ‌ها به‌طور پیش‌فرض از MP3 استفاده می‌کنند. وقتی هدف کانال `voice-note` باشد،
    OpenClaw از Inworld درخواست `OGG_OPUS` می‌کند تا صدا به‌صورت حباب صوتی بومی
    پخش شود. ترکیب تلفنی از `PCM` خام در 22050 Hz برای تغذیه
    پل تلفنی استفاده می‌کند.
  </Accordion>
  <Accordion title="نقاط پایانی سفارشی">
    میزبان API را با `messages.tts.providers.inworld.baseUrl` بازنویسی کنید.
    اسلش‌های انتهایی پیش از ارسال درخواست‌ها حذف می‌شوند.
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
    همه ارائه‌دهندگان همراه OpenClaw.
  </Card>
  <Card title="عیب‌یابی" href="/fa/help/troubleshooting" icon="wrench">
    مشکلات رایج و مراحل اشکال‌زدایی.
  </Card>
</CardGroup>
