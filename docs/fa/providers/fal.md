---
read_when:
    - می‌خواهید از تولید تصویر fal در OpenClaw استفاده کنید
    - به جریان احراز هویت FAL_KEY نیاز دارید
    - پیش‌فرض‌های fal را برای image_generate یا video_generate می‌خواهید
summary: راه‌اندازی تولید تصویر و ویدئو با fal در OpenClaw
title: Fal
x-i18n:
    generated_at: "2026-05-11T20:41:10Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7f074629e5274154b7a17686264a8b137d61df321d791d6e47c9d8abe67ad273
    source_path: providers/fal.md
    workflow: 16
---

OpenClaw یک ارائه‌دهنده همراه `fal` برای تولید تصویر و ویدئوی میزبانی‌شده ارائه می‌کند.

| ویژگی | مقدار                                                         |
| -------- | ------------------------------------------------------------- |
| ارائه‌دهنده | `fal`                                                         |
| احراز هویت     | `FAL_KEY` (اصلی؛ `FAL_API_KEY` نیز به‌عنوان fallback کار می‌کند) |
| API      | نقاط پایانی مدل fal                                           |

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw onboard --auth-choice fal-api-key
    ```
  </Step>
  <Step title="تنظیم مدل تصویر پیش‌فرض">
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

| قابلیت     | مقدار                                                       |
| -------------- | ----------------------------------------------------------- |
| حداکثر تصاویر     | 4 در هر درخواست                                               |
| حالت ویرایش      | Flux: 1 تصویر مرجع؛ GPT Image 2: 10؛ Nano Banana 2: 14 |
| بازنویسی اندازه | پشتیبانی می‌شود                                                   |
| نسبت ابعاد   | برای تولید و ویرایش GPT Image 2/Nano Banana 2 پشتیبانی می‌شود   |
| وضوح     | پشتیبانی می‌شود                                                   |
| قالب خروجی  | `png` یا `jpeg`                                             |

<Warning>
درخواست‌های تصویر-به-تصویر Flux از بازنویسی‌های `aspectRatio` پشتیبانی **نمی‌کنند**. درخواست‌های ویرایش GPT
Image 2 و Nano Banana 2 از نقطه پایانی `/edit` متعلق به fal استفاده می‌کنند و
راهنمایی‌های نسبت ابعاد را می‌پذیرند.
</Warning>

وقتی خروجی PNG می‌خواهید، از `outputFormat: "png"` استفاده کنید. fal در OpenClaw
کنترل صریحی برای پس‌زمینه شفاف اعلام نمی‌کند، بنابراین `background:
"transparent"` برای مدل‌های fal به‌عنوان یک بازنویسی نادیده‌گرفته‌شده گزارش می‌شود.

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

## تولید ویدئو

ارائه‌دهنده همراه تولید ویدئوی `fal` به‌صورت پیش‌فرض از
`fal/fal-ai/minimax/video-01-live` استفاده می‌کند.

| قابلیت | مقدار                                                              |
| ---------- | ------------------------------------------------------------------ |
| حالت‌ها      | متن-به-ویدئو، مرجع تک‌تصویری، مرجع-به-ویدئو Seedance |
| زمان اجرا    | جریان ارسال/وضعیت/نتیجه مبتنی بر صف برای کارهای طولانی‌مدت       |

<AccordionGroup>
  <Accordion title="مدل‌های ویدئوی موجود">
    **HeyGen video-agent:**

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

  <Accordion title="نمونه پیکربندی مرجع-به-ویدئو Seedance 2.0">
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

    مرجع-به-ویدئو تا 9 تصویر، 3 ویدئو و 3 مرجع صوتی را از طریق
    پارامترهای مشترک `video_generate` یعنی `images`، `videos` و `audioRefs`
    می‌پذیرد، با حداکثر 12 فایل مرجع در مجموع.

  </Accordion>

  <Accordion title="نمونه پیکربندی HeyGen video-agent">
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

<Tip>
برای دیدن فهرست کامل مدل‌های fal موجود، از `openclaw models list --provider fal` استفاده کنید؛
این فهرست شامل مواردی است که به‌تازگی اضافه شده‌اند.
</Tip>

## مرتبط

<CardGroup cols={2}>
  <Card title="تولید تصویر" href="/fa/tools/image-generation" icon="image">
    پارامترهای ابزار تصویر مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="تولید ویدئو" href="/fa/tools/video-generation" icon="video">
    پارامترهای ابزار ویدئوی مشترک و انتخاب ارائه‌دهنده.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/config-agents#agent-defaults" icon="gear">
    پیش‌فرض‌های عامل، شامل انتخاب مدل تصویر و ویدئو.
  </Card>
</CardGroup>
