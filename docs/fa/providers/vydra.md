---
read_when:
    - شما می‌خواهید تولید رسانه با Vydra را در OpenClaw داشته باشید
    - به راهنمای تنظیم کلید API برای Vydra نیاز دارید
summary: از تصویر، ویدئو و گفتار Vydra در OpenClaw استفاده کنید
title: ویدرا
x-i18n:
    generated_at: "2026-07-12T10:42:42Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e775bdd6f4ec7d1f5189910af450b92d8d6e831c17c338271afee962636ba69f
    source_path: providers/vydra.md
    workflow: 16
---

Plugin همراه Vydra موارد زیر را اضافه می‌کند:

- تولید تصویر از طریق `vydra/grok-imagine`
- تولید ویدئو از طریق `vydra/veo3` (متن‌به‌ویدئو) و `vydra/kling` (تصویر‌به‌ویدئو)
- سنتز گفتار از طریق مسیر TTS مبتنی بر ElevenLabs در Vydra

OpenClaw برای هر سه قابلیت از همان `VYDRA_API_KEY` استفاده می‌کند.

| ویژگی                    | مقدار                                                                     |
| ------------------------ | ------------------------------------------------------------------------- |
| شناسه ارائه‌دهنده        | `vydra`                                                                   |
| Plugin                   | همراه، `enabledByDefault: true`                                            |
| متغیر محیطی احراز هویت   | `VYDRA_API_KEY`                                                           |
| پرچم راه‌اندازی اولیه    | `--auth-choice vydra-api-key`                                             |
| پرچم مستقیم CLI          | `--vydra-api-key <key>`                                                   |
| قراردادها                | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| نشانی پایه               | `https://www.vydra.ai/api/v1` (از میزبان `www` استفاده کنید)              |

<Warning>
از `https://www.vydra.ai/api/v1` به‌عنوان نشانی پایه استفاده کنید. میزبان ریشه Vydra (`https://vydra.ai/api/v1`) در حال حاضر به `www` هدایت می‌شود. برخی کلاینت‌های HTTP هنگام این تغییر مسیر بین‌میزبانی، سرآیند `Authorization` را حذف می‌کنند و در نتیجه یک کلید API معتبر به‌اشتباه به‌صورت شکست احراز هویت نمایش داده می‌شود. Plugin همراه، هر نشانی پایه پیکربندی‌شده با `vydra.ai` را به `www.vydra.ai` عادی‌سازی می‌کند تا از این مشکل جلوگیری شود.
</Warning>

## راه‌اندازی

<Steps>
  <Step title="اجرای راه‌اندازی اولیه تعاملی">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    یا متغیر محیطی را مستقیماً تنظیم کنید:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="انتخاب یک قابلیت پیش‌فرض">
    یک یا چند مورد از قابلیت‌های زیر (تصویر، ویدئو یا گفتار) را انتخاب و پیکربندی متناظر را اعمال کنید.
  </Step>
</Steps>

## قابلیت‌ها

<AccordionGroup>
  <Accordion title="تولید تصویر">
    مدل تصویری پیش‌فرض و تنها مدل همراه:

    - `vydra/grok-imagine`

    آن را به‌عنوان ارائه‌دهنده پیش‌فرض تصویر تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "vydra/grok-imagine",
          },
        },
      },
    }
    ```

    پشتیبانی همراه فقط متن‌به‌تصویر است و در هر درخواست حداکثر یک تصویر تولید می‌کند. مسیرهای ویرایش میزبانی‌شده Vydra انتظار نشانی‌های URL راه‌دور تصویر را دارند و Plugin همراه، پل بارگذاری ویژه‌ای برای Vydra اضافه نمی‌کند.

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید تصویر](/fa/tools/image-generation) مراجعه کنید.
    </Note>

  </Accordion>

  <Accordion title="تولید ویدئو">
    مدل‌های ویدئویی ثبت‌شده:

    - `vydra/veo3` برای متن‌به‌ویدئو (ورودی‌های ارجاع به تصویر را رد می‌کند)
    - `vydra/kling` برای تصویر‌به‌ویدئو (دقیقاً به یک نشانی URL راه‌دور تصویر نیاز دارد)

    Vydra را به‌عنوان ارائه‌دهنده پیش‌فرض ویدئو تنظیم کنید:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "vydra/veo3",
          },
        },
      },
    }
    ```

    نکته‌ها:

    - `vydra/kling` بارگذاری فایل محلی را از ابتدا رد می‌کند؛ فقط ارجاع به یک نشانی URL راه‌دور تصویر کار می‌کند.
    - مسیر HTTP مربوط به `kling` در Vydra درباره اینکه به `image_url` یا `video_url` نیاز دارد، رفتار یکسانی نداشته است؛ ارائه‌دهنده همراه، همان نشانی URL راه‌دور تصویر را در هر دو فیلد ارسال می‌کند.
    - Plugin همراه رویکردی محافظه‌کارانه دارد و تنظیمات سبک مستندنشد‌ه‌ای مانند نسبت ابعاد، وضوح، واترمارک یا صدای تولیدشده را ارسال نمی‌کند.

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده و رفتار جایگزینی هنگام خرابی، به [تولید ویدئو](/fa/tools/video-generation) مراجعه کنید.
    </Note>

  </Accordion>

  <Accordion title="آزمون‌های زنده ویدئو">
    پوشش زنده ویژه ارائه‌دهنده:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    فایل زنده همراه Vydra موارد زیر را پوشش می‌دهد:

    - متن‌به‌ویدئو با `vydra/veo3`
    - تصویر‌به‌ویدئو با `vydra/kling` با استفاده از یک نشانی URL راه‌دور تصویر

    در صورت نیاز، داده آزمایشی تصویر راه‌دور را بازنویسی کنید:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="سنتز گفتار">
    Vydra را به‌عنوان ارائه‌دهنده گفتار تنظیم کنید:

    ```json5
    {
      messages: {
        tts: {
          provider: "vydra",
          providers: {
            vydra: {
              apiKey: "${VYDRA_API_KEY}",
              voiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    پیش‌فرض‌ها:

    - مدل: `elevenlabs/tts`
    - شناسه صدا: `21m00Tcm4TlvDq8ikWAM` («Rachel»)

    Plugin همراه، همین یک صدای پیش‌فرض آزموده‌شده را ارائه می‌کند و فایل‌های صوتی MP3 بازمی‌گرداند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="فهرست ارائه‌دهندگان" href="/fa/providers/index" icon="list">
    همه ارائه‌دهندگان موجود را مرور کنید.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
</CardGroup>
