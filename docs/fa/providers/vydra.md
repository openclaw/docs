---
read_when:
    - می‌خواهید تولید رسانهٔ Vydra را در OpenClaw داشته باشید
    - به راهنمای تنظیم کلید API Vydra نیاز دارید
summary: استفاده از تصویر، ویدئو و گفتار Vydra در OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-04-29T23:30:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 85420c3f337c13313bf571d5ee92c1f1988ff8119d401e7ec0ea0db1e74d9b69
    source_path: providers/vydra.md
    workflow: 16
---

Plugin بسته‌بندی‌شده‌ی Vydra موارد زیر را اضافه می‌کند:

- تولید تصویر از طریق `vydra/grok-imagine`
- تولید ویدئو از طریق `vydra/veo3` و `vydra/kling`
- سنتز گفتار از طریق مسیر TTS مبتنی بر ElevenLabs در Vydra

OpenClaw برای هر سه قابلیت از همان `VYDRA_API_KEY` استفاده می‌کند.

<Warning>
از `https://www.vydra.ai/api/v1` به‌عنوان URL پایه استفاده کنید.

میزبان apex مربوط به Vydra (`https://vydra.ai/api/v1`) در حال حاضر به `www` تغییرمسیر می‌دهد. برخی کلاینت‌های HTTP در این تغییرمسیر بین‌میزبانی، `Authorization` را حذف می‌کنند و همین باعث می‌شود یک کلید API معتبر به خطای احراز هویت گمراه‌کننده تبدیل شود. Plugin بسته‌بندی‌شده برای جلوگیری از این مشکل، مستقیماً از URL پایه‌ی `www` استفاده می‌کند.
</Warning>

## راه‌اندازی

<Steps>
  <Step title="Run interactive onboarding">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    یا متغیر محیطی را مستقیماً تنظیم کنید:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="Choose a default capability">
    یک یا چند قابلیت زیر را انتخاب کنید (تصویر، ویدئو، یا گفتار) و پیکربندی متناظر را اعمال کنید.
  </Step>
</Steps>

## قابلیت‌ها

<AccordionGroup>
  <Accordion title="Image generation">
    مدل تصویر پیش‌فرض:

    - `vydra/grok-imagine`

    آن را به‌عنوان ارائه‌دهنده‌ی تصویر پیش‌فرض تنظیم کنید:

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

    پشتیبانی بسته‌بندی‌شده‌ی فعلی فقط تبدیل متن به تصویر است. مسیرهای ویرایش میزبانی‌شده‌ی Vydra انتظار URLهای تصویر راه‌دور را دارند و OpenClaw هنوز در Plugin بسته‌بندی‌شده، پل بارگذاری ویژه‌ی Vydra اضافه نکرده است.

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار جایگزینی هنگام خطا، [تولید تصویر](/fa/tools/image-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="Video generation">
    مدل‌های ویدئوی ثبت‌شده:

    - `vydra/veo3` برای تبدیل متن به ویدئو
    - `vydra/kling` برای تبدیل تصویر به ویدئو

    Vydra را به‌عنوان ارائه‌دهنده‌ی ویدئوی پیش‌فرض تنظیم کنید:

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

    نکات:

    - `vydra/veo3` فقط به‌صورت تبدیل متن به ویدئو بسته‌بندی شده است.
    - `vydra/kling` در حال حاضر به ارجاع URL تصویر راه‌دور نیاز دارد. بارگذاری فایل‌های محلی از ابتدا رد می‌شود.
    - مسیر HTTP فعلی `kling` در Vydra درباره‌ی اینکه `image_url` را لازم دارد یا `video_url` را، رفتار ناپایداری داشته است؛ ارائه‌دهنده‌ی بسته‌بندی‌شده همان URL تصویر راه‌دور را در هر دو فیلد قرار می‌دهد.
    - Plugin بسته‌بندی‌شده محافظه‌کار می‌ماند و کنترل‌های مستندنشده‌ی سبک مانند نسبت تصویر، وضوح، واترمارک، یا صدای تولیدشده را ارسال نمی‌کند.

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار جایگزینی هنگام خطا، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="Video live tests">
    پوشش زنده‌ی ویژه‌ی ارائه‌دهنده:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    فایل زنده‌ی بسته‌بندی‌شده‌ی Vydra اکنون موارد زیر را پوشش می‌دهد:

    - تبدیل متن به ویدئوی `vydra/veo3`
    - تبدیل تصویر به ویدئوی `vydra/kling` با استفاده از URL تصویر راه‌دور

    در صورت نیاز fixture تصویر راه‌دور را بازنویسی کنید:

    ```bash
    export OPENCLAW_LIVE_VYDRA_KLING_IMAGE_URL="https://example.com/reference.png"
    ```

  </Accordion>

  <Accordion title="Speech synthesis">
    Vydra را به‌عنوان ارائه‌دهنده‌ی گفتار تنظیم کنید:

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
    - شناسه‌ی صدا: `21m00Tcm4TlvDq8ikWAM`

    Plugin بسته‌بندی‌شده در حال حاضر یک صدای پیش‌فرض شناخته‌شده و سالم را در دسترس قرار می‌دهد و فایل‌های صوتی MP3 برمی‌گرداند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="Provider directory" href="/fa/providers/index" icon="list">
    همه‌ی ارائه‌دهندگان موجود را مرور کنید.
  </Card>
  <Card title="Image generation" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Video generation" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدئو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="Configuration reference" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
</CardGroup>
