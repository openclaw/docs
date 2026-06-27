---
read_when:
    - شما یک ارائه‌دهندهٔ جست‌وجوی وب می‌خواهید که به کلید API نیاز نداشته باشد
    - می‌خواهید از DuckDuckGo برای web_search استفاده کنید.
    - شما یک ارائه‌دهندهٔ جست‌وجوی بدون کلید را می‌خواهید که به‌صراحت انتخاب شده باشد.
summary: جست‌وجوی وب DuckDuckGo -- ارائه‌دهنده بدون کلید (آزمایشی، مبتنی بر HTML)
title: جست‌وجوی DuckDuckGo
x-i18n:
    generated_at: "2026-06-27T18:57:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c042a3cd4fa6f37cb42b88930b5fe0122a561a810e275f26d9c1eb56502495a7
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw از DuckDuckGo به‌عنوان ارائه‌دهنده‌ی `web_search` **بدون کلید** پشتیبانی می‌کند. هیچ کلید API یا حسابی لازم نیست.

<Warning>
  DuckDuckGo یک یکپارچه‌سازی **آزمایشی و غیررسمی** است که نتایج را
  از صفحه‌های جست‌وجوی بدون JavaScript متعلق به DuckDuckGo می‌گیرد، نه از یک API رسمی. انتظار
  خرابی‌های گاه‌به‌گاه ناشی از صفحه‌های چالش ربات یا تغییرات HTML را داشته باشید.
</Warning>

## راه‌اندازی

به کلید API نیازی نیست؛ فقط DuckDuckGo را به‌عنوان ارائه‌دهنده‌ی خود تنظیم کنید:

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
نتایج برای بازگرداندن (1-10).
</ParamField>

<ParamField path="region" type="string">
کد منطقه‌ی DuckDuckGo (مثلاً `us-en`، `uk-en`، `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
سطح SafeSearch.
</ParamField>

منطقه و SafeSearch را می‌توان در پیکربندی Plugin نیز تنظیم کرد (بالا را ببینید)؛ پارامترهای
ابزار برای هر پرس‌وجو مقادیر پیکربندی را بازنویسی می‌کنند.

## نکته‌ها

- **بدون کلید API**؛ پس از انتخاب DuckDuckGo به‌عنوان ارائه‌دهنده‌ی `web_search`
  شما کار می‌کند
- **آزمایشی**؛ نتایج را از صفحه‌های جست‌وجوی HTML بدون JavaScript متعلق به DuckDuckGo
  گردآوری می‌کند، نه از یک API یا SDK رسمی
- **خطر چالش ربات**؛ DuckDuckGo ممکن است در استفاده‌ی سنگین یا خودکار CAPTCHA ارائه کند یا درخواست‌ها
  را مسدود کند
- **تجزیه‌ی HTML**؛ نتایج به ساختار صفحه وابسته‌اند، که می‌تواند بدون
  اطلاع تغییر کند
- **انتخاب صریح**؛ OpenClaw وقتی هیچ ارائه‌دهنده‌ی متکی به API پیکربندی نشده باشد،
  DuckDuckGo را به‌طور خودکار انتخاب نمی‌کند
- **SafeSearch در صورت پیکربندی نشدن، به‌طور پیش‌فرض روی متوسط است**

<Tip>
  برای استفاده در محیط تولید، [Brave Search](/fa/tools/brave-search) (با سطح رایگان
  در دسترس) یا ارائه‌دهنده‌ی دیگری که متکی به API باشد را در نظر بگیرید.
</Tip>

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته با سطح رایگان
- [Exa Search](/fa/tools/exa-search) -- جست‌وجوی عصبی همراه با استخراج محتوا
