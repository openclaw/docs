---
read_when:
    - می‌خواهید از تولید تصویر fal در OpenClaw استفاده کنید
    - به جریان احراز هویت FAL_KEY نیاز دارید
    - شما پیش‌فرض‌های fal را برای image_generate، video_generate یا music_generate می‌خواهید
summary: راه‌اندازی تولید تصویر، ویدیو و موسیقی fal در OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-06-27T18:39:36Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: af294939a39673fb32cb68c882708dbe69b64ca5e5d13f5504de9d1d8715e3bd
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw یک ارائه‌دهنده `fal` همراه برای تولید میزبانی‌شده تصویر، ویدئو و موسیقی
ارائه می‌کند.

| ویژگی | مقدار                                                        |
| -------- | ------------------------------------------------------------- |
| ارائه‌دهنده | `fal`                                                         |
| احراز هویت     | `FAL_KEY` (متعارف؛ `FAL_API_KEY` نیز به‌عنوان جایگزین کار می‌کند) |
| API      | نقاط پایانی مدل fal                                           |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="تنظیم یک مدل تصویر پیش‌فرض">
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

ارائه‌دهنده همراه تولید تصویر `fal` به‌صورت پیش‌فرض از
`fal/fal-ai/flux/dev` استفاده می‌کند.

| قابلیت     | مقدار                                                              |
| -------------- | ------------------------------------------------------------------ |
| حداکثر تصاویر     | 4 در هر درخواست؛ Krea 2: 1 در هر درخواست                               |
| حالت ویرایش      | Flux: 1 تصویر مرجع؛ GPT Image 2: 10؛ Nano Banana 2: 14        |
| مراجع سبک     | Krea 2: تا 10 مرجع سبک از طریق `image` / `images`           |
| بازنویسی اندازه | پشتیبانی می‌شود                                                          |
| نسبت تصویر   | برای تولید، Krea 2 و ویرایش GPT Image 2/Nano Banana 2 پشتیبانی می‌شود |
| وضوح     | پشتیبانی می‌شود                                                          |
| قالب خروجی  | `png` یا `jpeg`                                                    |

<Warning>
درخواست‌های تصویر به تصویر Flux از بازنویسی‌های `aspectRatio` پشتیبانی **نمی‌کنند**. درخواست‌های ویرایش GPT
Image 2 و Nano Banana 2 از نقطه پایانی `/edit` در fal استفاده می‌کنند و
راهنمایی‌های نسبت تصویر را می‌پذیرند. Nano Banana 2 همچنین نسبت‌های عریض/بلند بومی اضافی
مانند `4:1`، `1:4`، `8:1` و `1:8` را می‌پذیرد؛ Krea 2 زیرمجموعه کوچک‌تر
نسبت تصویر خودش را اعتبارسنجی می‌کند.
</Warning>

مدل‌های Krea 2 از طرح‌واره بومی بار Krea در fal استفاده می‌کنند. OpenClaw
`aspect_ratio`، `creativity` و `image_style_references` را به‌جای
بار عمومی `image_size` / نقطه پایانی ویرایش که Flux استفاده می‌کند ارسال می‌کند. مراجع مدل عبارت‌اند از:

- `fal/krea/v2/medium/text-to-image`
- `fal/krea/v2/large/text-to-image`

برای تصویرسازی بیانی سریع‌تر، انیمه، نقاشی و سبک‌های هنری از Medium استفاده کنید.
برای ظاهرهای فوتورئال کندتر، بافت خام، دانه فیلم و جزئیات بیشتر از Large استفاده کنید.
Krea به‌صورت پیش‌فرض از `fal.creativity: "medium"` استفاده می‌کند؛ مقدارهای پشتیبانی‌شده
`raw`، `low`، `medium` و `high` هستند.

Krea 2 در طرح‌واره درخواست fal نسبت تصویر را ارائه می‌کند، نه `image_size`. ترجیحاً از
`aspectRatio` استفاده کنید؛ OpenClaw مقدار `size` را به نزدیک‌ترین نسبت تصویر پشتیبانی‌شده Krea
نگاشت می‌کند و برای Krea به‌جای نادیده گرفتن `resolution`، آن را رد می‌کند.

وقتی خروجی PNG از مدل‌های fal می‌خواهید که `output_format` را ارائه می‌کنند، از
`outputFormat: "png"` استفاده کنید. fal در OpenClaw کنترل صریحی برای پس‌زمینه شفاف
اعلام نمی‌کند، بنابراین `background: "transparent"` برای مدل‌های fal به‌عنوان یک
بازنویسی نادیده‌گرفته‌شده گزارش می‌شود.
نقاط پایانی Krea 2 فیلد درخواست `output_format` را از طریق fal ارائه نمی‌کنند، بنابراین
OpenClaw بازنویسی‌های `outputFormat` را برای درخواست‌های Krea رد می‌کند.

برای استفاده از fal به‌عنوان ارائه‌دهنده تصویر پیش‌فرض:

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

## تولید ویدئو

ارائه‌دهنده همراه تولید ویدئوی `fal` به‌صورت پیش‌فرض از
`fal/fal-ai/minimax/video-01-live` استفاده می‌کند.

| قابلیت | مقدار                                                              |
| ---------- | ------------------------------------------------------------------ |
| حالت‌ها      | متن به ویدئو، مرجع تک‌تصویری، تبدیل مرجع Seedance به ویدئو |
| زمان اجرا    | جریان ارسال/وضعیت/نتیجه مبتنی بر صف برای کارهای طولانی       |

<AccordionGroup>
  <Accordion title="مدل‌های ویدئوی موجود">
    **عامل ویدئویی HeyGen:**

    - `fal/fal-ai/heygen/v2/video-agent`

    **Seedance 2.0:**

    - `fal/bytedance/seedance-2.0/fast/text-to-video`
    - `fal/bytedance/seedance-2.0/fast/image-to-video`
    - `fal/bytedance/seedance-2.0/fast/reference-to-video`
    - `fal/bytedance/seedance-2.0/text-to-video`
    - `fal/bytedance/seedance-2.0/image-to-video`
    - `fal/bytedance/seedance-2.0/reference-to-video`

  </Accordion>

  <Accordion title="نمونه پیکربندی Seedance 2.0">
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

  <Accordion title="نمونه پیکربندی تبدیل مرجع به ویدئوی Seedance 2.0">
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

    تبدیل مرجع به ویدئو از طریق پارامترهای مشترک `video_generate` یعنی `images`،
    `videos` و `audioRefs` تا 9 تصویر، 3 ویدئو و 3 مرجع صوتی را می‌پذیرد،
    با حداکثر 12 فایل مرجع در مجموع.

  </Accordion>

  <Accordion title="نمونه پیکربندی عامل ویدئویی HeyGen">
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

Plugin همراه `fal` همچنین یک ارائه‌دهنده تولید موسیقی برای ابزار مشترک
`music_generate` ثبت می‌کند.

| قابلیت    | مقدار                                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------------------ |
| مدل پیش‌فرض | `fal/fal-ai/minimax-music/v2.6`                                                                        |
| مدل‌ها        | `fal-ai/minimax-music/v2.6`، `fal-ai/ace-step/prompt-to-audio`، `fal-ai/stable-audio-25/text-to-audio` |
| زمان اجرا       | درخواست همگام به‌علاوه دانلود صدای تولیدشده                                                      |

از fal به‌عنوان ارائه‌دهنده موسیقی پیش‌فرض استفاده کنید:

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

`fal-ai/minimax-music/v2.6` از متن ترانه صریح و حالت سازی پشتیبانی می‌کند.
ACE-Step و Stable Audio نقاط پایانی تبدیل پرامپت به صدا هستند؛ وقتی آن خانواده‌های مدل را
می‌خواهید، آن‌ها را با بازنویسی `model` انتخاب کنید.

<Tip>
برای دیدن فهرست کامل مدل‌های fal موجود، از جمله ورودی‌هایی که اخیراً اضافه شده‌اند،
از `openclaw models list --provider fal` استفاده کنید.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید موسیقی" href="/fa/tools/music-generation" icon="music">
    پارامترهای ابزار موسیقی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل، شامل انتخاب مدل تصویر، ویدئو و موسیقی.
  </Card>
</CardGroup>
