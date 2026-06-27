---
read_when:
    - می‌خواهید تولید رسانه Vydra را در OpenClaw داشته باشید
    - به راهنمای راه‌اندازی کلید API Vydra نیاز دارید
summary: استفاده از تصویر، ویدئو و گفتار Vydra در OpenClaw
title: Vydra
x-i18n:
    generated_at: "2026-06-27T18:45:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4cb1128d877e06a274fe07c42282a7990c322e4d88d4232a1cac78e54deaf163
    source_path: providers/vydra.md
    workflow: 16
---

Plugin همراه Vydra این موارد را اضافه می‌کند:

- تولید تصویر از طریق `vydra/grok-imagine`
- تولید ویدئو از طریق `vydra/veo3` و `vydra/kling`
- سنتز گفتار از طریق مسیر TTS مبتنی بر ElevenLabs در Vydra

OpenClaw برای هر سه قابلیت از همان `VYDRA_API_KEY` استفاده می‌کند.

| ویژگی          | مقدار                                                                    |
| --------------- | ------------------------------------------------------------------------- |
| شناسه ارائه‌دهنده | `vydra`                                                                   |
| Plugin          | همراه، `enabledByDefault: true`                                           |
| متغیر محیطی احراز هویت | `VYDRA_API_KEY`                                                           |
| پرچم راه‌اندازی اولیه | `--auth-choice vydra-api-key`                                             |
| پرچم مستقیم CLI | `--vydra-api-key <key>`                                                   |
| قراردادها       | `imageGenerationProviders`, `videoGenerationProviders`, `speechProviders` |
| URL پایه        | `https://www.vydra.ai/api/v1` (از میزبان `www` استفاده کنید)              |

<Warning>
  از `https://www.vydra.ai/api/v1` به‌عنوان URL پایه استفاده کنید. میزبان ریشه Vydra (`https://vydra.ai/api/v1`) در حال حاضر به `www` هدایت می‌شود. برخی کلاینت‌های HTTP هنگام این تغییر مسیر بین میزبان‌ها، `Authorization` را حذف می‌کنند و این باعث می‌شود یک کلید API معتبر به خطای احراز هویت گمراه‌کننده تبدیل شود. Plugin همراه برای جلوگیری از این مشکل، مستقیماً از URL پایه `www` استفاده می‌کند.
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
    یک یا چند مورد از قابلیت‌های زیر را انتخاب کنید (تصویر، ویدئو، یا گفتار) و پیکربندی متناظر را اعمال کنید.
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

    پشتیبانی همراه فعلی فقط متن‌به‌تصویر است. مسیرهای ویرایش میزبانی‌شده Vydra انتظار URLهای تصویر راه‌دور را دارند، و OpenClaw هنوز در Plugin همراه یک پل بارگذاری اختصاصی Vydra اضافه نمی‌کند.

    <Note>
    برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، [تولید تصویر](/fa/tools/image-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="تولید ویدئو">
    مدل‌های ویدئوی ثبت‌شده:

    - `vydra/veo3` برای متن‌به‌ویدئو
    - `vydra/kling` برای تصویر‌به‌ویدئو

    Vydra را به‌عنوان ارائه‌دهنده ویدئوی پیش‌فرض تنظیم کنید:

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

    - `vydra/veo3` فقط به‌صورت متن‌به‌ویدئو همراه شده است.
    - `vydra/kling` در حال حاضر به یک ارجاع URL تصویر راه‌دور نیاز دارد. بارگذاری فایل‌های محلی از ابتدا رد می‌شود.
    - مسیر HTTP فعلی `kling` در Vydra درباره اینکه به `image_url` نیاز دارد یا `video_url` ناهماهنگ بوده است؛ ارائه‌دهنده همراه همان URL تصویر راه‌دور را در هر دو فیلد قرار می‌دهد.
    - Plugin همراه محافظه‌کار باقی می‌ماند و کنترل‌های سبکِ مستندنشده مانند نسبت تصویر، وضوح، واترمارک، یا صدای تولیدشده را ارسال نمی‌کند.

    <Note>
    برای پارامترهای ابزار مشترک، انتخاب ارائه‌دهنده، و رفتار failover، [تولید ویدئو](/fa/tools/video-generation) را ببینید.
    </Note>

  </Accordion>

  <Accordion title="آزمون‌های زنده ویدئو">
    پوشش زنده ویژه ارائه‌دهنده:

    ```bash
    OPENCLAW_LIVE_TEST=1 \
    OPENCLAW_LIVE_VYDRA_VIDEO=1 \
    pnpm test:live -- extensions/vydra/vydra.live.test.ts
    ```

    فایل زنده همراه Vydra اکنون این موارد را پوشش می‌دهد:

    - `vydra/veo3` متن‌به‌ویدئو
    - `vydra/kling` تصویر‌به‌ویدئو با استفاده از URL تصویر راه‌دور

    در صورت نیاز، نمونه تصویر راه‌دور را بازنویسی کنید:

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
              speakerVoiceId: "21m00Tcm4TlvDq8ikWAM",
            },
          },
        },
      },
    }
    ```

    پیش‌فرض‌ها:

    - مدل: `elevenlabs/tts`
    - شناسه صدا: `21m00Tcm4TlvDq8ikWAM`

    Plugin همراه در حال حاضر یک صدای پیش‌فرض شناخته‌شده و قابل‌اعتماد را ارائه می‌کند و فایل‌های صوتی MP3 برمی‌گرداند.

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="فهرست ارائه‌دهندگان" href="/fa/providers/index" icon="list">
    همه ارائه‌دهندگان موجود را مرور کنید.
  </Card>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل و پیکربندی مدل.
  </Card>
</CardGroup>
