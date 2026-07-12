---
read_when:
    - می‌خواهید از Cohere با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API مربوط به Cohere یا انتخاب احراز هویت CLI نیاز دارید
summary: راه‌اندازی Cohere (احراز هویت + انتخاب مدل)
title: کوهر
x-i18n:
    generated_at: "2026-07-12T10:42:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fee46bf80609bd5e8211d6be507713f4de178653941effb81ebae48d8bb6528a
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) از طریق Compatibility API خود، استنتاج سازگار با OpenAI را ارائه می‌دهد. OpenClaw در دورهٔ انتقال Cohere به خارج از هسته، ارائه‌دهندهٔ Cohere را به‌صورت همراه عرضه می‌کند و آن را به‌عنوان یک Plugin خارجی رسمی نیز منتشر می‌کند.

| ویژگی                  | مقدار                                                |
| ---------------------- | ---------------------------------------------------- |
| شناسهٔ ارائه‌دهنده     | `cohere`                                             |
| Plugin                 | همراه در دورهٔ انتقال؛ بستهٔ خارجی رسمی              |
| متغیر محیطی احراز هویت | `COHERE_API_KEY`                                     |
| پرچم راه‌اندازی اولیه  | `--auth-choice cohere-api-key`                       |
| پرچم مستقیم CLI        | `--cohere-api-key <key>`                             |
| API                    | سازگار با OpenAI (`openai-completions`)              |
| نشانی پایه             | `https://api.cohere.ai/compatibility/v1`             |
| مدل پیش‌فرض            | `cohere/command-a-plus-05-2026`                      |
| پنجرهٔ زمینه           | ۱۲۸٬۰۰۰ توکن                                         |

## کاتالوگ داخلی

| مرجع مدل                              | ورودی       | زمینه   | حداکثر خروجی | توضیحات                                                   |
| ------------------------------------- | ----------- | -------- | ------------- | --------------------------------------------------------- |
| `cohere/command-a-plus-05-2026`       | متن، تصویر  | ۱۲۸٬۰۰۰ | ۶۴٬۰۰۰        | پیش‌فرض؛ مدل پرچم‌دار عامل‌محور و استدلالی                 |
| `cohere/command-a-03-2025`            | متن         | ۲۵۶٬۰۰۰ | ۸٬۰۰۰         | مدل پیشین Command A                                       |
| `cohere/command-a-reasoning-08-2025`  | متن         | ۲۵۶٬۰۰۰ | ۳۲٬۰۰۰        | استدلال عامل‌محور و استفاده از ابزار                      |
| `cohere/command-a-vision-07-2025`     | متن، تصویر  | ۱۲۸٬۰۰۰ | ۸٬۰۰۰         | تحلیل بصری و اسناد؛ بدون استفاده از ابزار                 |
| `cohere/north-mini-code-1-0`          | متن، تصویر  | ۲۵۶٬۰۰۰ | ۶۴٬۰۰۰        | کدنویسی عامل‌محور؛ استدلال؛ محدودیت‌های رایگان            |

مدل‌های Cohere دارای قابلیت استدلال، از دو حالت استدلال Compatibility API پشتیبانی می‌کنند. OpenClaw حالت **خاموش** را به `none` و هر سطح تفکر فعال را به `high` نگاشت می‌کند. Command A Vision از استفاده از ابزار پشتیبانی نمی‌کند؛ بنابراین OpenClaw ابزارهای عامل را برای این مدل غیرفعال نگه می‌دارد.

## شروع کار

1. Cohere همراه با بسته‌های فعلی OpenClaw عرضه می‌شود. اگر موجود نیست، بستهٔ خارجی را نصب و Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/cohere-provider
openclaw gateway restart
```

2. یک کلید API برای Cohere ایجاد کنید.
3. راه‌اندازی اولیه را اجرا کنید:

```bash
openclaw onboard --non-interactive \
  --auth-choice cohere-api-key \
  --cohere-api-key "$COHERE_API_KEY"
```

4. تأیید کنید که کاتالوگ در دسترس است:

```bash
openclaw models list --provider cohere
```

راه‌اندازی اولیه تنها زمانی Cohere را به‌عنوان مدل اصلی تنظیم می‌کند که از قبل هیچ مدل اصلی پیکربندی نشده باشد.

## راه‌اندازی فقط با متغیر محیطی

`COHERE_API_KEY` را در دسترس فرایند Gateway قرار دهید، سپس مدل Cohere را انتخاب کنید:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-plus-05-2026" },
    },
  },
}
```

<Note>
اگر Gateway به‌صورت سرویس پس‌زمینه یا در Docker اجرا می‌شود، `COHERE_API_KEY` را برای همان سرویس تنظیم کنید. صادر کردن آن فقط در یک پوستهٔ تعاملی، این متغیر را در اختیار Gateway در حال اجرا قرار نمی‌دهد.
</Note>

## مرتبط

- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [CLI مدل‌ها](/fa/cli/models)
- [فهرست ارائه‌دهندگان](/fa/providers/index)
