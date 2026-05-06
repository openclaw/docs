---
read_when:
    - یک ارائه‌دهندهٔ جست‌وجوی وب می‌خواهید که به کلید API نیاز نداشته باشد
    - می‌خواهید از DuckDuckGo برای web_search استفاده کنید
    - به یک راهکار جایگزین جست‌وجو بدون نیاز به پیکربندی نیاز دارید
summary: جست‌وجوی وب DuckDuckGo -- ارائه‌دهنده جایگزین بدون نیاز به کلید (آزمایشی، مبتنی بر HTML)
title: جست‌وجوی DuckDuckGo
x-i18n:
    generated_at: "2026-05-06T09:45:35Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89c23535730dc272b88e22d1dbeef61abd55a7968d9e57bdce20594df8a2c0f2
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw از DuckDuckGo به‌عنوان ارائه‌دهنده‌ی `web_search` **بدون کلید** پشتیبانی می‌کند. هیچ کلید API یا حسابی لازم نیست.

<Warning>
  DuckDuckGo یک یکپارچه‌سازی **آزمایشی و غیررسمی** است که نتایج را
  از صفحه‌های جست‌وجوی غیرجاوااسکریپتی DuckDuckGo می‌گیرد، نه از یک API رسمی. انتظار
  خرابی‌های گاه‌به‌گاه به‌دلیل صفحه‌های چالش ربات یا تغییرات HTML را داشته باشید.
</Warning>

## راه‌اندازی

هیچ کلید API لازم نیست؛ فقط DuckDuckGo را به‌عنوان ارائه‌دهنده‌ی خود تنظیم کنید:

<Steps>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    # Select "duckduckgo" as the provider
    ```
  </Step>
</Steps>

## پیکربندی

```json5
{
  tools: {
    web: {
      search: {
        provider: "duckduckgo",
      },
    },
  },
}
```

تنظیمات اختیاری در سطح Plugin برای منطقه و SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // DuckDuckGo region code
            safeSearch: "moderate", // "strict", "moderate", or "off"
          },
        },
      },
    },
  },
}
```

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
نتایجی که باید برگردانده شوند (۱ تا ۱۰).
</ParamField>

<ParamField path="region" type="string">
کد منطقه‌ی DuckDuckGo (مثلاً `us-en`، `uk-en`، `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
سطح SafeSearch.
</ParamField>

منطقه و SafeSearch را می‌توان در پیکربندی Plugin نیز تنظیم کرد (بالا را ببینید)؛
پارامترهای ابزار در هر پرس‌وجو مقادیر پیکربندی را بازنویسی می‌کنند.

## یادداشت‌ها

- **بدون کلید API**؛ بلافاصله و بدون هیچ پیکربندی کار می‌کند
- **آزمایشی**؛ نتایج را از صفحه‌های جست‌وجوی HTML غیرجاوااسکریپتی DuckDuckGo گردآوری می‌کند، نه از یک API یا SDK رسمی
- **ریسک چالش ربات**؛ DuckDuckGo ممکن است CAPTCHA ارائه کند یا در استفاده‌ی سنگین یا خودکار درخواست‌ها را مسدود کند
- **تجزیه‌ی HTML**؛ نتایج به ساختار صفحه وابسته‌اند، که ممکن است بدون اطلاع تغییر کند
- **ترتیب تشخیص خودکار**؛ DuckDuckGo نخستین جایگزین بدون کلید در تشخیص خودکار است (ترتیب ۱۰۰). ارائه‌دهنده‌های مبتنی بر API که کلیدهای پیکربندی‌شده دارند ابتدا اجرا می‌شوند، سپس Ollama Web Search (ترتیب ۱۱۰)، سپس SearXNG (ترتیب ۲۰۰)
- **SafeSearch در صورت پیکربندی‌نشدن، به‌طور پیش‌فرض روی moderate است**

<Tip>
  برای استفاده در محیط تولید، [Brave Search](/fa/tools/brave-search) (با رده‌ی رایگان
  در دسترس) یا ارائه‌دهنده‌ی دیگری مبتنی بر API را در نظر بگیرید.
</Tip>

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه‌ی ارائه‌دهنده‌ها و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته با رده‌ی رایگان
- [Exa Search](/fa/tools/exa-search) -- جست‌وجوی عصبی همراه با استخراج محتوا
