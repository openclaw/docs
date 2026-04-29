---
read_when:
    - می‌خواهید از Kimi برای web_search استفاده کنید
    - به KIMI_API_KEY یا MOONSHOT_API_KEY نیاز دارید
summary: جستجوی وب Kimi از طریق جستجوی وب Moonshot
title: جست‌وجوی Kimi
x-i18n:
    generated_at: "2026-04-29T23:43:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: 11e9fce35ee84b433b674d0666459a830eac1a87c5091bb90792cc0cf753fd45
    source_path: tools/kimi-search.md
    workflow: 16
---

OpenClaw از Kimi به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند و از جست‌وجوی وب Moonshot برای تولید پاسخ‌های ترکیب‌شده با هوش مصنوعی همراه با استناد استفاده می‌کند.

## دریافت کلید API

<Steps>
  <Step title="ایجاد کلید">
    از [Moonshot AI](https://platform.moonshot.cn/) یک کلید API دریافت کنید.
  </Step>
  <Step title="ذخیره کلید">
    `KIMI_API_KEY` یا `MOONSHOT_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

وقتی در طول `openclaw onboard` یا
`openclaw configure --section web` گزینه‌ی **Kimi** را انتخاب می‌کنید، OpenClaw می‌تواند این موارد را هم بپرسد:

- ناحیه‌ی API مربوط به Moonshot:
  - `https://api.moonshot.ai/v1`
  - `https://api.moonshot.cn/v1`
- مدل پیش‌فرض جست‌وجوی وب Kimi (پیش‌فرض `kimi-k2.6` است)

## پیکربندی

```json5
{
  plugins: {
    entries: {
      moonshot: {
        config: {
          webSearch: {
            apiKey: "sk-...", // optional if KIMI_API_KEY or MOONSHOT_API_KEY is set
            baseUrl: "https://api.moonshot.ai/v1",
            model: "kimi-k2.6",
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "kimi",
      },
    },
  },
}
```

اگر برای چت از میزبان API چین استفاده می‌کنید (`models.providers.moonshot.baseUrl`:
`https://api.moonshot.cn/v1`)، وقتی `tools.web.search.kimi.baseUrl` حذف شده باشد، OpenClaw همان میزبان را برای `web_search` مربوط به Kimi دوباره استفاده می‌کند؛ بنابراین کلیدهای
[platform.moonshot.cn](https://platform.moonshot.cn/) به‌اشتباه به نقطه‌ی پایانی بین‌المللی ارسال نمی‌شوند (که اغلب HTTP 401 برمی‌گرداند). وقتی به URL پایه‌ی جست‌وجوی متفاوتی نیاز دارید، با `tools.web.search.kimi.baseUrl` بازنویسی کنید.

**جایگزین محیطی:** `KIMI_API_KEY` یا `MOONSHOT_API_KEY` را در محیط Gateway تنظیم کنید. برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

اگر `baseUrl` را حذف کنید، OpenClaw به‌طور پیش‌فرض از `https://api.moonshot.ai/v1` استفاده می‌کند.
اگر `model` را حذف کنید، OpenClaw به‌طور پیش‌فرض از `kimi-k2.6` استفاده می‌کند.

## نحوه کار

Kimi از جست‌وجوی وب Moonshot برای ترکیب پاسخ‌ها با استنادهای درون‌خطی استفاده می‌کند؛ مشابه رویکرد پاسخ مستندشده‌ی Gemini و Grok.

## پارامترهای پشتیبانی‌شده

جست‌وجوی Kimi از `query` پشتیبانی می‌کند.

`count` برای سازگاری مشترک `web_search` پذیرفته می‌شود، اما Kimi همچنان به‌جای فهرستی با N نتیجه، یک پاسخ ترکیب‌شده همراه با استناد برمی‌گرداند.

فیلترهای مخصوص ارائه‌دهنده در حال حاضر پشتیبانی نمی‌شوند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [Moonshot AI](/fa/providers/moonshot) -- مستندات مدل Moonshot و ارائه‌دهنده‌ی Kimi Coding
- [جست‌وجوی Gemini](/fa/tools/gemini-search) -- پاسخ‌های ترکیب‌شده با هوش مصنوعی از طریق زمینه‌سازی Google
- [جست‌وجوی Grok](/fa/tools/grok-search) -- پاسخ‌های ترکیب‌شده با هوش مصنوعی از طریق زمینه‌سازی xAI
