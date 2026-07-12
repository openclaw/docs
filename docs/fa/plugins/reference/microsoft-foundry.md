---
read_when:
    - شما در حال نصب، پیکربندی یا ممیزی Plugin ‏microsoft-foundry هستید
summary: پشتیبانی از ارائه‌دهنده مدل Microsoft Foundry را به OpenClaw اضافه می‌کند.
title: Plugin ‏Microsoft Foundry
x-i18n:
    generated_at: "2026-07-12T10:31:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin ‏Microsoft Foundry

پشتیبانی از ارائه‌دهنده مدل Microsoft Foundry را به OpenClaw اضافه می‌کند.

## توزیع

- بسته: `@openclaw/microsoft-foundry`
- مسیر نصب: در OpenClaw گنجانده شده است

## سطح

ارائه‌دهندگان: microsoft-foundry؛ قراردادها: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- ارائه‌دهنده تولید تصویر: `microsoft-foundry`

## پیش‌نیازها

- یک منبع Microsoft Foundry یا Azure AI Foundry دارای استقرارها.
- احراز هویت با کلید API از طریق `AZURE_OPENAI_API_KEY` یا کلید API پیکربندی‌شده برای ارائه‌دهنده.
- برای احراز هویت Entra ID، پیش از
  راه‌اندازی اولیه، Azure CLI را نصب و `az login` را اجرا کنید. OpenClaw توکن‌های زمان اجرای Microsoft Foundry را از طریق
  `az account get-access-token` تازه‌سازی می‌کند.

## مدل‌های گفتگو

استقرارهای گفتگوی Microsoft Foundry از ارجاع مدل ارائه‌دهنده
`microsoft-foundry/<deployment-name>` استفاده می‌کنند. راه‌اندازی اولیه با Azure CLI منابع
و استقرارهای Foundry را شناسایی می‌کند، سپس نام استقرار انتخاب‌شده را در
پیکربندی مدل می‌نویسد.

OpenClaw برای APIهای گفتگوی پشتیبانی‌شده و سازگار با OpenAI از نقطه پایانی
`/openai/v1` در Foundry استفاده می‌کند:

- خانواده‌های مدل GPT،‏ `o*`،‏ `computer-use-preview` و DeepSeek-V4 به‌طور پیش‌فرض از
  `openai-responses` استفاده می‌کنند.
- استقرارهای MAI-DS-R1 و سایر استقرارهای تکمیل گفتگو از `openai-completions`
  استفاده می‌کنند، مگر اینکه یک API پشتیبانی‌شده به‌صراحت پیکربندی شده باشد.
- قابلیت استدلال MAI-DS-R1 از طریق محتوای استدلال ثبت می‌شود، نه
  از طریق `reasoning_effort`. فراداده توکن‌های زمینه و خروجی آن
  ۱۶۳٬۸۴۰ توکن است.

استقرارهای Anthropic Claude در Microsoft Foundry از قالب API ‏Anthropic Messages
استفاده می‌کنند، نه قالب سازگار با OpenAI در `/openai/v1`. تا زمانی که Plugin ‏Microsoft Foundry
از زمان اجرای بومی Anthropic پشتیبانی کند، آن‌ها را به‌عنوان یک ارائه‌دهنده سفارشی
`anthropic-messages` پیکربندی کنید. هنگامی که نام استقرار Foundry با شناسه مدل
Claude متفاوت است، `params.canonicalModelId` را در ورودی مدل تنظیم کنید تا OpenClaw
بتواند قراردادهای سیمی ویژه مدل را اعمال کند، `/think off` را به‌درستی نگاشت کند و
تفکر امضاشده را به‌صورت ایمن حفظ کند.

## تولید تصویر MAI

این Plugin،‏ `microsoft-foundry` را برای `image_generate` با مدل‌های فعلی
تصویر Microsoft AI ثبت می‌کند:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

از نام یک استقرار تصویر MAI مستقرشده به‌عنوان ارجاع مدل استفاده کنید. این ارائه‌دهنده
مدل تصویر پیش‌فرضی اعلام نمی‌کند، زیرا API ‏MAI به نام استقرار شما
در فیلد `model` درخواست نیاز دارد:

```json5
{
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "microsoft-foundry/<deployment-name>",
        timeoutMs: 600000,
      },
    },
  },
}
```

تولید صرفاً با پرامپت، نقطه پایانی تولید MAI در Microsoft Foundry را فراخوانی می‌کند:
`/mai/v1/images/generations`. ویرایش‌های دارای تصویر مرجع، مسیر
`/mai/v1/images/edits` را فراخوانی می‌کنند و به استقرارهای `MAI-Image-2.5-Flash` و
`MAI-Image-2.5` محدود هستند.

تولید صرفاً با پرامپت می‌تواند با تنها پیکربندی نقطه پایانی Foundry از یک نام استقرار
سفارشی استفاده کند. برای ویرایش تصویر با نام استقرار سفارشی، استقرار را
در جریان راه‌اندازی اولیه انتخاب کنید یا فراداده مدل را وارد کنید تا OpenClaw بتواند تأیید کند
که استقرار بر پایه `MAI-Image-2.5-Flash` یا `MAI-Image-2.5` است.

محدودیت‌های تصویر MAI:

- خروجی: یک تصویر PNG برای هر درخواست.
- اندازه: مقدار پیش‌فرض `1024x1024`؛ عرض و ارتفاع هر دو باید حداقل ۷۶۸ پیکسل باشند.
- مجموع پیکسل‌ها: حاصل‌ضرب عرض × ارتفاع باید حداکثر ۱٬۰۴۸٬۵۷۶ باشد.
- ویرایش‌ها: یک تصویر ورودی PNG یا JPEG.
- راهنمایی‌های مشترک پشتیبانی‌نشده مانند `aspectRatio`،‏ `resolution`،‏ `quality`،
  `background` و `outputFormat` غیر PNG به Microsoft Foundry ارسال نمی‌شوند.

## عیب‌یابی

- `az: command not found`:‏ Azure CLI را نصب کنید یا از احراز هویت با کلید API استفاده کنید.
- `Microsoft Foundry endpoint missing for MAI image generation`: یک
  استقرار Foundry را در جریان راه‌اندازی اولیه انتخاب کنید یا `models.providers.microsoft-foundry.baseUrl` را اضافه کنید.
- `supports MAI image deployments only`: مدل تصویر انتخاب‌شده به یک
  استقرار غیر MAI اشاره می‌کند. برای `image_generate` از یک مدل تصویر MAI مستقرشده استفاده کنید.

<!-- openclaw-plugin-reference:manual-end -->
