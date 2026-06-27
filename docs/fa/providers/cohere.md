---
read_when:
    - می‌خواهید از Cohere با OpenClaw استفاده کنید
    - به متغیر محیطی کلید API Cohere یا گزینه احراز هویت CLI نیاز دارید
summary: راه‌اندازی Cohere (احراز هویت + انتخاب مدل)
title: Cohere
x-i18n:
    generated_at: "2026-06-27T18:38:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 76365a5d358bd5576d83a24d62ef30e203ee204bca90a2e50c56cc4c549b52af
    source_path: providers/cohere.md
    workflow: 16
---

[Cohere](https://cohere.com) استنتاج سازگار با OpenAI را از طریق API سازگاری خود فراهم می‌کند. OpenClaw در دوره انتقال به خارجی‌سازی، ارائه‌دهنده Cohere را همراه خود عرضه می‌کند و همچنین آن را به‌عنوان یک Plugin خارجی رسمی با کاتالوگ مدل Command A منتشر می‌کند.

| ویژگی           | مقدار                                                |
| --------------- | ---------------------------------------------------- |
| شناسه ارائه‌دهنده | `cohere`                                             |
| Plugin          | همراه در دوره انتقال؛ بسته خارجی رسمی               |
| متغیر محیطی احراز هویت | `COHERE_API_KEY`                                     |
| پرچم راه‌اندازی اولیه | `--auth-choice cohere-api-key`                       |
| پرچم مستقیم CLI | `--cohere-api-key <key>`                             |
| API             | سازگار با OpenAI (`openai-completions`)              |
| URL پایه        | `https://api.cohere.ai/compatibility/v1`             |
| مدل پیش‌فرض     | `cohere/command-a-03-2025`                           |

## شروع کنید

1. Cohere در بسته‌های فعلی OpenClaw گنجانده شده است. اگر در دسترس نیست، بسته خارجی را نصب کنید و Gateway را دوباره راه‌اندازی کنید:

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

مدل پیش‌فرض فقط زمانی تنظیم می‌شود که هیچ مدل اصلی‌ای از قبل پیکربندی نشده باشد.

## راه‌اندازی فقط با محیط

`COHERE_API_KEY` را در اختیار فرایند Gateway قرار دهید، سپس مدل Cohere را انتخاب کنید:

```json5
{
  agents: {
    defaults: {
      model: { primary: "cohere/command-a-03-2025" },
    },
  },
}
```

<Note>
اگر Gateway به‌صورت دیمن یا در Docker اجرا می‌شود، `COHERE_API_KEY` را برای همان سرویس پیکربندی کنید. صادر کردن آن فقط در یک پوسته تعاملی، آن را در اختیار Gatewayای که از قبل در حال اجراست قرار نمی‌دهد.
</Note>

## مرتبط

- [ارائه‌دهندگان مدل](/fa/concepts/model-providers)
- [CLI مدل‌ها](/fa/cli/models)
- [فهرست ارائه‌دهندگان](/fa/providers)
