---
read_when:
    - شما یک ارائه‌دهندهٔ جست‌وجوی وب می‌خواهید که به کلید API نیاز نداشته باشد
    - می‌خواهید از DuckDuckGo برای web_search استفاده کنید
    - به یک سازوکار پشتیبان جست‌وجوی بدون نیاز به پیکربندی نیاز دارید
summary: جستجوی وب DuckDuckGo -- ارائه‌دهندهٔ جایگزین بدون کلید (آزمایشی، مبتنی بر HTML)
title: جستجوی DuckDuckGo
x-i18n:
    generated_at: "2026-04-29T23:41:38Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6828830079b0bee1321f0971ec120ae98bc72ab040ad3a0fe30fe89217ed0722
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw از DuckDuckGo به‌عنوان ارائه‌دهنده‌ی `web_search` **بدون کلید** پشتیبانی می‌کند. هیچ کلید API
یا حسابی لازم نیست.

<Warning>
  DuckDuckGo یک یکپارچه‌سازی **آزمایشی و غیررسمی** است که نتایج را
  از صفحات جست‌وجوی غیر JavaScript متعلق به DuckDuckGo می‌گیرد، نه از یک API رسمی. انتظار
  خرابی‌های گاه‌به‌گاه ناشی از صفحات چالش ربات یا تغییرات HTML را داشته باشید.
</Warning>

## راه‌اندازی

به هیچ کلید API نیاز نیست؛ فقط DuckDuckGo را به‌عنوان ارائه‌دهنده‌ی خود تنظیم کنید:

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

تنظیمات اختیاری در سطح Plugin برای ناحیه و SafeSearch:

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
نتایجی که باید برگردانده شوند (1–10).
</ParamField>

<ParamField path="region" type="string">
کد ناحیه‌ی DuckDuckGo (مثلاً `us-en`، `uk-en`، `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
سطح SafeSearch.
</ParamField>

ناحیه و SafeSearch را می‌توان در پیکربندی Plugin هم تنظیم کرد (بالا را ببینید)؛ پارامترهای
ابزار برای هر پرس‌وجو مقادیر پیکربندی را بازنویسی می‌کنند.

## نکات

- **بدون کلید API** — بدون هیچ پیکربندی و بلافاصله کار می‌کند
- **آزمایشی** — نتایج را از صفحات جست‌وجوی HTML غیر JavaScript مربوط به DuckDuckGo
  جمع‌آوری می‌کند، نه از یک API یا SDK رسمی
- **ریسک چالش ربات** — DuckDuckGo ممکن است در استفاده‌ی سنگین یا خودکار، CAPTCHA ارائه کند یا درخواست‌ها را مسدود کند
- **تجزیه‌ی HTML** — نتایج به ساختار صفحه وابسته‌اند، که ممکن است بدون
  اطلاع قبلی تغییر کند
- **ترتیب تشخیص خودکار** — DuckDuckGo نخستین جایگزین بدون کلید
  (ترتیب 100) در تشخیص خودکار است. ارائه‌دهندگان مبتنی بر API با کلیدهای پیکربندی‌شده ابتدا اجرا می‌شوند،
  سپس Ollama Web Search (ترتیب 110)، سپس SearXNG (ترتیب 200)
- **SafeSearch وقتی پیکربندی نشده باشد به‌طور پیش‌فرض روی moderate است**

<Tip>
  برای استفاده در محیط تولید، [Brave Search](/fa/tools/brave-search) (با سطح رایگان
  در دسترس) یا یک ارائه‌دهنده‌ی دیگر مبتنی بر API را در نظر بگیرید.
</Tip>

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته با سطح رایگان
- [Exa Search](/fa/tools/exa-search) -- جست‌وجوی عصبی با استخراج محتوا
