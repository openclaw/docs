---
read_when:
    - شما یک ارائه‌دهندهٔ جست‌وجوی وب خودمیزبان می‌خواهید
    - می‌خواهید از SearXNG برای web_search استفاده کنید
    - شما به یک گزینهٔ جست‌وجوی متمرکز بر حریم خصوصی یا ایزوله از شبکه نیاز دارید
summary: جست‌وجوی وب SearXNG -- ارائه‌دهندهٔ فرا‌جست‌وجوی خودمیزبان و بدون کلید
title: جست‌وجوی SearXNG
x-i18n:
    generated_at: "2026-04-29T23:45:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: a07198ef7a6f363b9e5e78e57e6e31f193f8f10882945208191c8baea5fe67d6
    source_path: tools/searxng-search.md
    workflow: 16
---

OpenClaw از [SearXNG](https://docs.searxng.org/) به‌عنوان ارائه‌دهنده‌ی **خودمیزبان و
بدون کلید** `web_search` پشتیبانی می‌کند. SearXNG یک فراموتور جست‌وجوی متن‌باز است
که نتایج را از Google، Bing، DuckDuckGo و منابع دیگر گردآوری می‌کند.

مزایا:

- **رایگان و نامحدود** -- بدون نیاز به کلید API یا اشتراک تجاری
- **حریم خصوصی / air-gap** -- پرس‌وجوها هرگز از شبکه‌ی شما خارج نمی‌شوند
- **همه‌جا کار می‌کند** -- بدون محدودیت منطقه‌ای در APIهای جست‌وجوی تجاری

## راه‌اندازی

<Steps>
  <Step title="اجرای یک نمونه‌ی SearXNG">
    ```bash
    docker run -d -p 8888:8080 searxng/searxng
    ```

    یا از هر استقرار موجود SearXNG که به آن دسترسی دارید استفاده کنید. برای راه‌اندازی تولید، به
    [مستندات SearXNG](https://docs.searxng.org/) مراجعه کنید.

  </Step>
  <Step title="پیکربندی">
    ```bash
    openclaw configure --section web
    # Select "searxng" as the provider
    ```

    یا متغیر محیطی را تنظیم کنید و اجازه دهید تشخیص خودکار آن را پیدا کند:

    ```bash
    export SEARXNG_BASE_URL="http://localhost:8888"
    ```

  </Step>
</Steps>

## پیکربندی

```json5
{
  tools: {
    web: {
      search: {
        provider: "searxng",
      },
    },
  },
}
```

تنظیمات سطح Plugin برای نمونه‌ی SearXNG:

```json5
{
  plugins: {
    entries: {
      searxng: {
        config: {
          webSearch: {
            baseUrl: "http://localhost:8888",
            categories: "general,news", // optional
            language: "en", // optional
          },
        },
      },
    },
  },
}
```

فیلد `baseUrl` همچنین اشیای SecretRef را می‌پذیرد.

قواعد انتقال:

- `https://` برای میزبان‌های عمومی یا خصوصی SearXNG کار می‌کند
- `http://` فقط برای میزبان‌های قابل‌اعتماد شبکه‌ی خصوصی یا loopback پذیرفته می‌شود
- میزبان‌های عمومی SearXNG باید از `https://` استفاده کنند

## متغیر محیطی

`SEARXNG_BASE_URL` را به‌عنوان جایگزینی برای پیکربندی تنظیم کنید:

```bash
export SEARXNG_BASE_URL="http://localhost:8888"
```

وقتی `SEARXNG_BASE_URL` تنظیم شده باشد و هیچ ارائه‌دهنده‌ای به‌صورت صریح پیکربندی نشده باشد، تشخیص خودکار
SearXNG را به‌طور خودکار انتخاب می‌کند (با پایین‌ترین اولویت -- هر ارائه‌دهنده‌ی متکی به API که
کلید داشته باشد، ابتدا برنده می‌شود).

## مرجع پیکربندی Plugin

| فیلد         | توضیح                                                              |
| ------------ | ------------------------------------------------------------------ |
| `baseUrl`    | URL پایه‌ی نمونه‌ی SearXNG شما (الزامی)                            |
| `categories` | دسته‌های جداشده با ویرگول مانند `general`، `news` یا `science`     |
| `language`   | کد زبان برای نتایج، مانند `en`، `de` یا `fr`                       |

## یادداشت‌ها

- **JSON API** -- از نقطه‌ی پایانی بومی `format=json` در SearXNG استفاده می‌کند، نه استخراج HTML
- **بدون کلید API** -- با هر نمونه‌ی SearXNG بلافاصله کار می‌کند
- **اعتبارسنجی URL پایه** -- `baseUrl` باید یک URL معتبر `http://` یا `https://`
  باشد؛ میزبان‌های عمومی باید از `https://` استفاده کنند
- **ترتیب تشخیص خودکار** -- SearXNG در تشخیص خودکار آخر بررسی می‌شود (ترتیب 200).
  ارائه‌دهندگان متکی به API با کلیدهای پیکربندی‌شده ابتدا اجرا می‌شوند، سپس
  DuckDuckGo (ترتیب 100)، سپس Ollama Web Search (ترتیب 110)
- **خودمیزبان** -- شما نمونه، پرس‌وجوها و موتورهای جست‌وجوی بالادستی را کنترل می‌کنید
- **دسته‌ها** در صورت پیکربندی‌نشدن، به‌طور پیش‌فرض `general` هستند

<Tip>
  برای کارکردن JSON API در SearXNG، مطمئن شوید نمونه‌ی SearXNG شما قالب `json`
  را در `settings.yml` زیر `search.formats` فعال کرده باشد.
</Tip>

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [جست‌وجوی DuckDuckGo](/fa/tools/duckduckgo-search) -- یک گزینه‌ی جایگزین بدون کلید دیگر
- [جست‌وجوی Brave](/fa/tools/brave-search) -- نتایج ساختاریافته با سطح رایگان
