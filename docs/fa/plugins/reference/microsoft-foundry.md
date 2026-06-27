---
read_when:
    - شما در حال نصب، پیکربندی یا ممیزی Plugin microsoft-foundry هستید
summary: پشتیبانی از ارائه‌دهندهٔ مدل Microsoft Foundry را به OpenClaw اضافه می‌کند.
title: Plugin Microsoft Foundry
x-i18n:
    generated_at: "2026-06-27T18:27:13Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c120a68393626e5ff9f24cd80bce4612a3772faf3722b93f2ff4677f743d0252
    source_path: plugins/reference/microsoft-foundry.md
    workflow: 16
---

# Plugin Microsoft Foundry

پشتیبانی از ارائه‌دهندهٔ مدل Microsoft Foundry را به OpenClaw اضافه می‌کند.

## توزیع

- بسته: `@openclaw/microsoft-foundry`
- مسیر نصب: همراه OpenClaw ارائه می‌شود

## سطح

ارائه‌دهندگان: microsoft-foundry؛ قراردادها: imageGenerationProviders

<!-- openclaw-plugin-reference:manual-start -->

- ارائه‌دهندهٔ تولید تصویر: `microsoft-foundry`

## الزامات

- یک منبع Microsoft Foundry یا Azure AI Foundry دارای استقرارها.
- احراز هویت با کلید API از طریق `AZURE_OPENAI_API_KEY` یا یک کلید API پیکربندی‌شده برای ارائه‌دهنده.
- برای احراز هویت Entra ID، Azure CLI را نصب کنید و پیش از
  راه‌اندازی اولیه، `az login` را اجرا کنید. OpenClaw توکن‌های زمان اجرای Microsoft Foundry را از طریق
  `az account get-access-token` تازه‌سازی می‌کند.

## مدل‌های چت

استقرارهای چت Microsoft Foundry از ارجاع مدل ارائه‌دهنده با قالب
`microsoft-foundry/<deployment-name>` استفاده می‌کنند. راه‌اندازی اولیه، منابع Foundry
و استقرارها را با Azure CLI کشف می‌کند، سپس نام استقرار انتخاب‌شده را در
پیکربندی مدل می‌نویسد.

OpenClaw برای APIهای چت سازگار با OpenAI که پشتیبانی می‌شوند، از نقطهٔ پایانی Foundry
`/openai/v1` استفاده می‌کند:

- خانواده‌های مدل GPT، `o*`، `computer-use-preview` و DeepSeek-V4 به‌طور پیش‌فرض از
  `openai-responses` استفاده می‌کنند.
- MAI-DS-R1 و دیگر استقرارهای تکمیل چت از `openai-completions`
  استفاده می‌کنند، مگر اینکه یک API پشتیبانی‌شدهٔ صریح پیکربندی شده باشد.
- MAI-DS-R1 از طریق محتوای استدلال، و نه
  از طریق `reasoning_effort`، به‌عنوان دارای قابلیت استدلال ثبت می‌شود. فرادادهٔ توکن‌های زمینه و خروجی آن
  ۱۶۳٬۸۴۰ توکن است.

استقرارهای Anthropic Claude در Microsoft Foundry از شکل API پیام‌های Anthropic
استفاده می‌کنند، نه شکل سازگار با OpenAI یعنی `/openai/v1`. تا زمانی که Plugin Microsoft Foundry
یک زمان اجرای Anthropic بومی اضافه کند، آن‌ها را به‌عنوان یک ارائه‌دهندهٔ سفارشی
`anthropic-messages` پیکربندی کنید. وقتی نام استقرار Foundry با شناسهٔ مدل
Claude متفاوت است، `params.canonicalModelId` را روی ورودی مدل تنظیم کنید تا OpenClaw
بتواند قراردادهای سیمی ویژهٔ مدل را اعمال کند، `/think off` را درست نگاشت کند، و
تفکر امضاشده را به‌طور ایمن حفظ کند.

## تولید تصویر MAI

این Plugin، `microsoft-foundry` را برای `image_generate` با مدل‌های تصویر فعلی
Microsoft AI ثبت می‌کند:

- `MAI-Image-2.5-Flash`
- `MAI-Image-2.5`
- `MAI-Image-2e`
- `MAI-Image-2`

از نام استقرار تصویر MAI مستقرشده به‌عنوان ارجاع مدل استفاده کنید. ارائه‌دهنده
یک مدل تصویر پیش‌فرض اعلام نمی‌کند، زیرا API مربوط به MAI نام استقرار شما را در فیلد
`model` درخواست لازم دارد:

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

فراخوانی‌های تولید فقط با اعلان از نقطهٔ پایانی تولیدهای MAI در Microsoft Foundry استفاده می‌کنند:
`/mai/v1/images/generations`. ویرایش‌های تصویر مرجع، نقطهٔ پایانی
`/mai/v1/images/edits` را فراخوانی می‌کنند و به استقرارهای `MAI-Image-2.5-Flash` و
`MAI-Image-2.5` محدود هستند.

تولید فقط با اعلان می‌تواند از یک نام استقرار سفارشی فقط با پیکربندی نقطهٔ پایانی Foundry
استفاده کند. برای ویرایش‌های تصویر با نام استقرار سفارشی، استقرار را از طریق راه‌اندازی اولیه انتخاب کنید
یا فرادادهٔ مدل را وارد کنید تا OpenClaw بتواند تأیید کند که
استقرار توسط `MAI-Image-2.5-Flash` یا `MAI-Image-2.5` پشتیبانی می‌شود.

محدودیت‌های تصویر MAI:

- خروجی: یک تصویر PNG برای هر درخواست.
- اندازه: پیش‌فرض `1024x1024`؛ هم عرض و هم ارتفاع باید حداقل ۷۶۸ پیکسل باشند.
- مجموع پیکسل‌ها: عرض × ارتفاع باید حداکثر ۱٬۰۴۸٬۵۷۶ باشد.
- ویرایش‌ها: یک تصویر ورودی PNG یا JPEG.
- راهنمایی‌های مشترک پشتیبانی‌نشده مانند `aspectRatio`، `resolution`، `quality`،
  `background` و `outputFormat` غیر PNG به Microsoft Foundry ارسال نمی‌شوند.

## عیب‌یابی

- `az: command not found`: Azure CLI را نصب کنید یا از احراز هویت با کلید API استفاده کنید.
- `Microsoft Foundry endpoint missing for MAI image generation`: یک
  استقرار Foundry را از طریق راه‌اندازی اولیه انتخاب کنید یا `models.providers.microsoft-foundry.baseUrl` را اضافه کنید.
- `supports MAI image deployments only`: مدل تصویر انتخاب‌شده به یک
  استقرار غیر MAI اشاره می‌کند. برای `image_generate` از یک مدل تصویر MAI مستقرشده استفاده کنید.

<!-- openclaw-plugin-reference:manual-end -->
