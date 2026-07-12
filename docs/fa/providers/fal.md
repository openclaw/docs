---
read_when:
    - می‌خواهید از تولید تصویر fal در OpenClaw استفاده کنید
    - به فرایند احراز هویت `FAL_KEY` نیاز دارید
    - برای image_generate، video_generate یا music_generate پیش‌فرض‌های fal را می‌خواهید
summary: راه‌اندازی تولید تصویر، ویدئو و موسیقی با fal در OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-07-12T10:38:33Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9bd868aaf6771f6fa38bb8e2a83133460d150e2a5aa9e5b888e221c07f29e0ad
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw یک ارائه‌دهندهٔ داخلی `fal` برای تولید میزبانی‌شدهٔ تصویر، ویدیو و موسیقی عرضه می‌کند.

| ویژگی          | مقدار                                                                                          |
| -------------- | ---------------------------------------------------------------------------------------------- |
| ارائه‌دهنده    | `fal`                                                                                          |
| احراز هویت     | `FAL_KEY` (کلید اصلی؛ `FAL_API_KEY` نیز به‌عنوان جایگزین کار می‌کند)                           |
| API            | نقاط پایانی مدل fal (`https://fal.run`؛ کارهای ویدیویی از `https://queue.fal.run` استفاده می‌کنند) |
| نشانی پایه     | با `models.providers.fal.baseUrl` بازنویسی کنید                                                |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```

    در راه‌اندازی‌های غیرتعاملی می‌توانید `--fal-api-key <key>` را ارسال یا
    `FAL_KEY` را صادر کنید. فرایند راه‌اندازی اولیه همچنین در صورتی که هیچ
    مدلی پیکربندی نشده باشد، `fal/fal-ai/flux/dev` را به‌عنوان مدل پیش‌فرض
    تصویر تنظیم می‌کند.

  </Step>
  <Step title="تنظیم مدل پیش‌فرض تصویر">
    ```json5
    {
      agents: {
        defaults: {
          imageGenerationModel: {
            primary: "fal/fal-ai/flux/dev",
          },
        },
      },
    }
    ```
  </Step>
</Steps>

## تولید تصویر

ارائه‌دهندهٔ داخلی تولید تصویر `fal` به‌طور پیش‌فرض از
`fal/fal-ai/flux/dev` استفاده می‌کند.

| قابلیت                 | مقدار                                                                     |
| ---------------------- | ------------------------------------------------------------------------- |
| حداکثر تعداد تصاویر    | ۴ تصویر در هر درخواست؛ Krea 2: یک تصویر در هر درخواست                    |
| بازنویسی اندازه        | `1024x1024`، `1024x1536`، `1536x1024`، `1024x1792`، `1792x1024`           |
| نسبت ابعاد             | در همه‌جا به‌جز تبدیل تصویر به تصویر Flux پشتیبانی می‌شود                 |
| وضوح                    | `1K`، `2K`، `4K` (محدودیت‌های هر مدل در ادامه آمده است)                  |
| قالب خروجی             | `png` (پیش‌فرض) یا `jpeg`؛ Krea 2 بازنویسی‌های `outputFormat` را رد می‌کند |

درخواست‌های ویرایش (تصاویر مرجع از طریق پارامترهای مشترک `image` / `images`)
با محدودیت‌های مرجع مختص هر مدل، به نقطهٔ پایانی ویرایش همان مدل هدایت
می‌شوند:

| خانوادهٔ مدل                   | مرجع مدل پس از `fal/`                   | نقطهٔ پایانی ویرایش | حداکثر تصاویر مرجع |
| ------------------------------ | --------------------------------------- | ------------------- | ------------------ |
| Flux و دیگر مدل‌های fal        | `fal-ai/flux/dev` (پیش‌فرض)             | `/image-to-image`   | ۱                  |
| GPT Image                      | `openai/gpt-image-*`                    | `/edit`             | ۱۰                 |
| Grok Imagine                   | `xai/grok-imagine-image`                | `/edit`             | ۳                  |
| Nano Banana (قدیمی)            | `fal-ai/nano-banana`                    | `/edit`             | ۳                  |
| Nano Banana 2                  | `fal-ai/nano-banana-*`                  | `/edit`             | ۱۴                 |
| Nano Banana 2 Lite             | `google/nano-banana-2-lite`             | `/edit`             | ۱۴                 |
| Krea 2                         | `krea/v2/{medium,large}/text-to-image`  | ندارد (مراجع سبک)   | ۱۰ مرجع سبک        |

<Warning>
درخواست‌های تبدیل تصویر به تصویر Flux از بازنویسی `aspectRatio`
پشتیبانی **نمی‌کنند**. درخواست‌های ویرایش GPT Image و Nano Banana 2 از
نقطهٔ پایانی `/edit` متعلق به fal استفاده می‌کنند و راهنمای نسبت ابعاد را
می‌پذیرند. Nano Banana 2 همچنین نسبت‌های بسیار عریض یا بلند بومی دیگری مانند
`4:1`، `1:4`، `8:1` و `1:8` را می‌پذیرد؛ Krea 2 زیرمجموعهٔ کوچک‌تر نسبت‌های
ابعاد مختص خود را اعتبارسنجی می‌کند. Grok Imagine فهرست نسبت‌های مختص خود
را دارد (از جمله `2:1`، `20:9`، `19.5:9` و معکوس آن‌ها) و فقط وضوح‌های
`1K`/`2K` را می‌پذیرد؛ Nano Banana قدیمی و Nano Banana 2 Lite بازنویسی‌های
`resolution` را رد می‌کنند.
</Warning>

مدل‌های Krea 2 از شِمای محمولهٔ بومی Krea در fal استفاده می‌کنند. OpenClaw
به‌جای محمولهٔ عمومی `image_size` / نقطهٔ پایانی ویرایش که Flux استفاده
می‌کند، `aspect_ratio`، `creativity` و `image_style_references` را ارسال
می‌کند. مراجع مدل عبارت‌اند از:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

برای تصویرسازی سریع‌تر و پرجلوه، انیمه، نقاشی و سبک‌های هنری از Medium
استفاده کنید. برای ظاهرهای کندتر و واقع‌گرایانه، بافت خام، دانه‌بندی فیلم
و جزئیات بیشتر از Large استفاده کنید. مقدار پیش‌فرض Krea برای
`fal.creativity` برابر `"medium"` است؛ مقادیر پشتیبانی‌شده عبارت‌اند از
`raw`، `low`، `medium` و `high`.

Krea 2 در شِمای درخواست fal نسبت ابعاد را ارائه می‌کند، نه `image_size`.
`aspectRatio` را ترجیح دهید؛ OpenClaw مقدار `size` را به نزدیک‌ترین نسبت
ابعاد پشتیبانی‌شدهٔ Krea نگاشت می‌کند و به‌جای نادیده گرفتن `resolution`
برای Krea، آن را رد می‌کند.

هنگامی که از مدل‌های fal دارای `output_format` خروجی PNG می‌خواهید، از
`outputFormat: "png"` استفاده کنید. fal کنترل صریحی برای پس‌زمینهٔ شفاف در
OpenClaw تعریف نمی‌کند؛ بنابراین `background: "transparent"` برای مدل‌های
fal به‌عنوان بازنویسی نادیده‌گرفته‌شده گزارش می‌شود.
نقاط پایانی Krea 2 فیلد درخواست `output_format` را از طریق fal ارائه
نمی‌کنند؛ بنابراین OpenClaw بازنویسی‌های `outputFormat` را برای درخواست‌های
Krea رد می‌کند.

برای استفاده از Krea 2 Medium:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "fal/krea/v2/medium/text-to-image",
      },
    },
  },
}
```

## تولید ویدیو

ارائه‌دهندهٔ داخلی تولید ویدیوی `fal` به‌طور پیش‌فرض از
`fal/fal-ai/minimax/video-01-live` استفاده می‌کند.

| قابلیت       | مقدار                                                                       |
| ------------ | --------------------------------------------------------------------------- |
| حالت‌ها      | متن به ویدیو، مرجع تک‌تصویری، تبدیل مرجع به ویدیوی Seedance                |
| زمان اجرا    | جریان ارسال/وضعیت/نتیجهٔ مبتنی بر صف برای کارهای طولانی                    |
| مهلت زمانی  | به‌طور پیش‌فرض ۲۰ دقیقه برای هر کار؛ وضعیت هر ۵ ثانیه بررسی می‌شود          |

<AccordionGroup>
  <Accordion title="مدل‌های ویدیویی موجود">
    **MiniMax (پیش‌فرض):**

    - `fal/fal-ai/minimax/video-01-live`

    **عامل ویدیویی HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Kling و Wan:**

    - `fal/fal-ai/kling-video/v2.1/master/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/text-to-video`
    - `fal/fal-ai/wan/v2.2-a14b/image-to-video`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

    درخواست‌های MiniMax Live و HeyGen فقط پرامپت را به‌همراه یک تصویر مرجع
    اختیاری ارسال می‌کنند؛ بازنویسی‌های دیگر منتقل نمی‌شوند. مدل‌های
    Seedance مقادیر `aspectRatio`، `size`، `resolution`، مدت‌زمان‌های ۴ تا
    ۱۵ ثانیه و کلید تغییر وضعیت صدا را می‌پذیرند.

  </Accordion>

  <Accordion title="نمونهٔ پیکربندی Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/text-to-video",
          },
        },
      },
    }
    ```
  </Accordion>

  <Accordion title="نمونهٔ پیکربندی تبدیل مرجع به ویدیوی Seedance 2.0">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/bytedance/seedance-2.0/fast/reference-to-video",
          },
        },
      },
    }
    ```

    تبدیل مرجع به ویدیو از طریق پارامترهای مشترک `images`، `videos` و
    `audioRefs` در `video_generate` حداکثر ۹ تصویر، ۳ ویدیو و ۳ مرجع صوتی
    می‌پذیرد و تعداد کل فایل‌های مرجع نمی‌تواند بیش از ۱۲ باشد. مراجع صوتی
    مستلزم وجود حداقل یک مرجع تصویری یا ویدیویی در همان درخواست هستند.

  </Accordion>

  <Accordion title="نمونهٔ پیکربندی عامل ویدیویی HeyGen">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "fal/fal-ai/heygen/v2/video-agent",
          },
        },
      },
    }
    ```
  </Accordion>
</AccordionGroup>

## تولید موسیقی

Plugin داخلی `fal` همچنین یک ارائه‌دهندهٔ تولید موسیقی برای ابزار مشترک
`music_generate` ثبت می‌کند.

| قابلیت             | مقدار                                                                                                                   |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| مدل پیش‌فرض        | `fal/fal-ai/minimax-music/v2.6`                                                                                         |
| مدل‌ها             | `fal-ai/minimax-music/v2.6` (mp3)، `fal-ai/ace-step/prompt-to-audio` (wav)، `fal-ai/stable-audio-25/text-to-audio` (wav) |
| حداکثر مدت‌زمان    | ۲۴۰ ثانیه                                                                                                               |
| زمان اجرا          | درخواست همگام به‌همراه بارگیری صدای تولیدشده                                                                           |

برای استفاده از fal به‌عنوان ارائه‌دهندهٔ پیش‌فرض موسیقی:

```json5
{
  agents: {
    defaults: {
      musicGenerationModel: {
        primary: "fal/fal-ai/minimax-music/v2.6",
      },
    },
  },
}
```

`fal-ai/minimax-music/v2.6` از متن صریح ترانه و حالت بی‌کلام پشتیبانی
می‌کند، اما نه از هر دو در یک درخواست. ACE-Step و Stable Audio نقاط پایانی
پرامپت به صدا هستند؛ هنگامی که این خانواده‌های مدل را می‌خواهید، آن‌ها را
با بازنویسی `model` انتخاب کنید. ACE-Step متن صریح ترانه را رد می‌کند؛
Stable Audio هم متن ترانه و هم حالت بی‌کلام را رد می‌کند.

<Tip>
جدول‌ها و بخش‌های بازشوندهٔ بالا خانواده‌های مدلی را پوشش می‌دهند که
ارائه‌دهندهٔ داخلی fal برای آن‌ها رفتار ویژه دارد. شناسه‌های دیگر نقاط
پایانی تصویر fal همچنان می‌توانند به‌عنوان مدل تصویر انتخاب شوند؛ با آن‌ها
مانند Flux رفتار می‌شود (محمولهٔ عمومی `image_size` و یک تصویر مرجع از
طریق `/image-to-image`).
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای مشترک ابزار تصویر و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدیو" href="/fa/tools/video-generation" icon="video">
    پارامترهای مشترک ابزار ویدیو و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای مشترک ابزار موسیقی و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل، از جمله انتخاب مدل تصویر، ویدیو و موسیقی.
  </Card>
</CardGroup>
