---
read_when:
    - شما تولید رسانهٔ Vydra را در OpenClaw می‌خواهید
    - به راهنمای تنظیم کلید API Vydra نیاز دارید
summary: استفاده از تصویر، ویدئو و گفتار Vydra در OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-05-06T09:40:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e73121300fc3121124d15ecd285603032644c7d3886703776adc58c7115401a
    source_path: providers/vydra.md
    workflow: 16
---

Plugin همراه Vydra این موارد را اضافه می‌کند:

- تولید تصویر از طریق `vydra/grok-imagine`
- تولید ویدیو از طریق `vydra/veo3` و `vydra/kling`
- سنتز گفتار از طریق مسیر TTS مبتنی بر ElevenLabs در Vydra

OpenClaw برای هر سه قابلیت از همان `VYDRA_API_KEY` استفاده می‌کند.

| ویژگی          | مقدار                                                                     |
| --------------- | ------------------------------------------------------------------------- |
| شناسه ارائه‌دهنده | `vydra`                                                                   |
| Plugin          | همراه، `enabledByDefault: true`                                           |
| متغیر محیطی احراز هویت | `VYDRA_API_KEY`                                                           |
| پرچم راه‌اندازی اولیه | `--auth-choice vydra-api-key`                                             |
| پرچم مستقیم CLI | `--vydra-api-key <key>`                                                   |
| قراردادها       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL پایه        | `https://www.vydra.ai/api/v1` (از میزبان `www` استفاده کنید)              |

<Warning>
  از `https://www.vydra.ai/api/v1` به‌عنوان URL پایه استفاده کنید. میزبان apex در Vydra (`https://vydra.ai/api/v1`) در حال حاضر به `www` هدایت می‌کند. برخی کلاینت‌های HTTP در این هدایت بین‌میزبانی `Authorization` را حذف می‌کنند، که یک کلید API معتبر را به خطای احراز هویت گمراه‌کننده تبدیل می‌کند. Plugin همراه برای جلوگیری از این مشکل مستقیما از URL پایه `www` استفاده می‌کند.
</Warning>

## راه‌اندازی

<Steps>
  <Step title="اجرای راه‌اندازی اولیه تعاملی">
    ```bash
    openclaw onboard --auth-choice vydra-api-key
    ```

    یا متغیر محیطی را مستقیما تنظیم کنید:

    ```bash
    export VYDRA_API_KEY="vydra_live_..."
    ```

  </Step>
  <Step title="انتخاب یک قابلیت پیش‌فرض">
    یک یا چند قابلیت زیر را انتخاب کنید (تصویر، ویدیو، یا گفتار) و پیکربندی متناظر را اعمال کنید.
  </Step>
</Steps>

## قابلیت‌ها

<AccordionGroup>
  <Accordion title="تولید تصویر">
    مدل تصویر پیش‌فرض:

    - `vydra/grok-imagine`

    آن را به‌عنوان ارائه‌دهنده تصویر پیش‌فرض تنظیم کنید:

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

    پشتیبانی همراه فعلی فقط متن به تصویر است. مسیرهای ویرایش میزبانی‌شده Vydra انتظار URLهای تصویر راه‌دور را دارند، و OpenClaw هنوز در Plugin همراه پل آپلود اختصاصی Vydra اضافه نمی‌کند.

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تولید ویدیو">
    مدل‌های ویدیوی ثبت‌شده:

    - `vydra/veo3` برای متن به ویدیو
    - `vydra/kling` برای تصویر به ویدیو

    Vydra را به‌عنوان ارائه‌دهنده ویدیوی پیش‌فرض تنظیم کنید:

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

    - `vydra/veo3` فقط به‌عنوان متن به ویدیو همراه شده است.
    - `vydra/kling` در حال حاضر به ارجاع URL تصویر راه‌دور نیاز دارد. آپلود فایل‌های محلی از ابتدا رد می‌شود.
    - مسیر HTTP فعلی `kling` در Vydra درباره اینکه به `image_url` نیاز دارد یا `video_url` ناسازگار بوده است؛ ارائه‌دهنده همراه همان URL تصویر راه‌دور را به هر دو فیلد نگاشت می‌کند.
    - Plugin همراه محافظه‌کار می‌ماند و کنترل‌های سبک مستندنشده مانند نسبت تصویر، وضوح، واترمارک، یا صدای تولیدشده را ارسال نمی‌کند.

    <Note>
    برای پارامترهای مشترک ابزار، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدیو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تست‌های زنده ویدیو">
    پوشش زنده اختصاصی ارائه‌دهنده:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    فایل زنده همراه Vydra اکنون این موارد را پوشش می‌دهد:

    - `vydra/veo3` متن به ویدیو
    - `vydra/kling` تصویر به ویدیو با استفاده از URL تصویر راه‌دور

    در صورت نیاز، fixture تصویر راه‌دور را بازنویسی کنید:

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
    - شناسه صدا: `21m00Tcm4TlvDq8ikWAM`

    Plugin همراه در حال حاضر یک صدای پیش‌فرض شناخته‌شده و مطمئن را ارائه می‌کند و فایل‌های صوتی MP3 برمی‌گرداند.

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
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های Agent و پیکربندی مدل.
  </Card>
</CardGroup>
