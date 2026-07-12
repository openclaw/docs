---
read_when:
    - شما یک ارائه‌دهندهٔ جست‌وجوی وب می‌خواهید که به کلید API نیاز نداشته باشد
    - می‌خواهید برای `web_search` از DuckDuckGo استفاده کنید
    - شما یک ارائه‌دهندهٔ جست‌وجوی بدون کلید می‌خواهید که به‌صراحت انتخاب شده باشد
summary: جست‌وجوی وب DuckDuckGo -- ارائه‌دهنده بدون نیاز به کلید (آزمایشی، مبتنی بر HTML)
title: جست‌وجوی DuckDuckGo
x-i18n:
    generated_at: "2026-07-12T11:00:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84e90532de276dcb3f73c67015dffe5f5a62be673e44a19053b2b1dfcb0986ac
    source_path: tools/duckduckgo-search.md
    workflow: 16
---

OpenClaw از DuckDuckGo به‌عنوان ارائه‌دهندهٔ `web_search` **بدون نیاز به کلید** پشتیبانی می‌کند. هیچ کلید API یا حسابی لازم نیست.

<Warning>
  DuckDuckGo یک یکپارچه‌سازی **آزمایشی و غیررسمی** است که صفحات جست‌وجوی HTML بدون JavaScript در DuckDuckGo را استخراج می‌کند و API رسمی نیست. انتظار داشته باشید گاهی به‌دلیل صفحات مقابله با ربات یا تغییرات HTML دچار اختلال شود.
</Warning>

## راه‌اندازی

DuckDuckGo هرگز به‌طور خودکار انتخاب نمی‌شود، زیرا تشخیص خودکار فقط ارائه‌دهندگانی را در نظر می‌گیرد که اعتبارنامه‌های قابل‌استفاده دارند. آن را صریحاً تنظیم کنید:

<Steps>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    # «duckduckgo» را به‌عنوان ارائه‌دهنده انتخاب کنید
    ```
  </Step>
</Steps>

## پیکربندی

ارائه‌دهنده را مستقیماً در پیکربندی تنظیم کنید:

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

تنظیمات اختیاری سطح Plugin برای منطقه و SafeSearch:

```json5
{
  plugins: {
    entries: {
      duckduckgo: {
        config: {
          webSearch: {
            region: "us-en", // کد منطقهٔ DuckDuckGo
            safeSearch: "moderate", // "strict"، "moderate" یا "off"
          },
        },
      },
    },
  },
}
```

## پارامترهای ابزار

<ParamField path="query" type="string" required>
عبارت جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایج بازگردانده‌شده (۱ تا ۱۰).
</ParamField>

<ParamField path="region" type="string">
کد منطقهٔ DuckDuckGo (برای مثال، `us-en`، `uk-en`، `de-de`).
</ParamField>

<ParamField path="safeSearch" type="'strict' | 'moderate' | 'off'" default="moderate">
سطح SafeSearch.
</ParamField>

پارامترهای ابزار `region` و `safeSearch` در هر جست‌وجو بر مقادیر پیکربندی Plugin در بالا اولویت دارند.

## نکات

- **بدون کلید API** — پس از انتخاب DuckDuckGo به‌عنوان ارائه‌دهندهٔ `web_search` کار می‌کند.
- **آزمایشی** — صفحات جست‌وجوی HTML بدون JavaScript در DuckDuckGo را استخراج می‌کند و API یا SDK رسمی نیست. نتایج به ساختار صفحه وابسته‌اند که ممکن است بدون اطلاع تغییر کند.
- **خطر مقابله با ربات** — DuckDuckGo ممکن است هنگام استفادهٔ سنگین یا خودکار، CAPTCHA نمایش دهد یا درخواست‌ها را مسدود کند.
- **فقط با انتخاب صریح** — تشخیص خودکار OpenClaw فقط ارائه‌دهندگانی را در نظر می‌گیرد که اعتبارنامه‌های قابل‌استفاده دارند؛ بنابراین ارائه‌دهنده‌ای بدون نیاز به کلید مانند DuckDuckGo هرگز به‌طور خودکار انتخاب نمی‌شود و باید `provider: "duckduckgo"` را تنظیم کنید.
- **مقدار پیش‌فرض SafeSearch برابر `moderate` است**، مگر اینکه پیکربندی شود.

<Tip>
  برای استفاده در محیط عملیاتی، [Brave Search](/fa/tools/brave-search) (با سطح رایگان) یا ارائه‌دهندهٔ دیگری مبتنی بر API را در نظر بگیرید.
</Tip>

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) — همهٔ ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) — نتایج ساختاریافته با سطح رایگان
- [Exa Search](/fa/tools/exa-search) — جست‌وجوی عصبی همراه با استخراج محتوا
