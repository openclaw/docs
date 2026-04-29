---
read_when:
    - می‌خواهید از Brave Search برای web_search استفاده کنید
    - به BRAVE_API_KEY یا جزئیات طرح نیاز دارید
summary: راه‌اندازی Brave Search API برای web_search
title: جستجوی Brave (مسیر قدیمی)
x-i18n:
    generated_at: "2026-04-29T22:24:17Z"
    model: gpt-5.5
    provider: openai
    source_hash: e2769da4db2ff5b94217c09b13ef5ee4106ba108a828db2a99892a4a15d7b517
    source_path: brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw از Brave Search API به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند.

## دریافت کلید API

1. در [https://brave.com/search/api/](https://brave.com/search/api/) یک حساب Brave Search API بسازید
2. در داشبورد، طرح **Search** را انتخاب کنید و یک کلید API بسازید.
3. کلید را در پیکربندی ذخیره کنید یا `BRAVE_API_KEY` را در محیط Gateway تنظیم کنید.

## نمونه پیکربندی

```json5
{
  plugins: {
    entries: {
      brave: {
        config: {
          webSearch: {
            apiKey: "BRAVE_API_KEY_HERE",
            mode: "web", // or "llm-context"
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "brave",
        maxResults: 5,
        timeoutSeconds: 30,
      },
    },
  },
}
```

تنظیمات جست‌وجوی Brave ویژه‌ی ارائه‌دهنده اکنون زیر `plugins.entries.brave.config.webSearch.*` قرار دارد.
`tools.web.search.apiKey` قدیمی همچنان از طریق shim سازگاری بارگذاری می‌شود، اما دیگر مسیر پیکربندی معیار نیست.

`webSearch.mode` انتقال Brave را کنترل می‌کند:

- `web` (پیش‌فرض): جست‌وجوی وب معمولی Brave با عنوان‌ها، URLها و قطعه‌متن‌ها
- `llm-context`: Brave LLM Context API با قطعه‌های متنی و منابع ازپیش‌استخراج‌شده برای زمینه‌سازی

## پارامترهای ابزار

| پارامتر       | توضیح                                                               |
| ------------- | ------------------------------------------------------------------- |
| `query`       | عبارت جست‌وجو (الزامی)                                             |
| `count`       | تعداد نتایجی که برگردانده می‌شود (1-10، پیش‌فرض: 5)                |
| `country`     | کد کشور دوحرفی ISO (مثلاً "US"، "DE")                              |
| `language`    | کد زبان ISO 639-1 برای نتایج جست‌وجو (مثلاً "en"، "de"، "fr")      |
| `search_lang` | کد زبان جست‌وجوی Brave (مثلاً `en`، `en-gb`، `zh-hans`)            |
| `ui_lang`     | کد زبان ISO برای عناصر رابط کاربری                                  |
| `freshness`   | فیلتر زمانی: `day` (24 ساعت)، `week`، `month` یا `year`             |
| `date_after`  | فقط نتایجی که پس از این تاریخ منتشر شده‌اند (YYYY-MM-DD)           |
| `date_before` | فقط نتایجی که پیش از این تاریخ منتشر شده‌اند (YYYY-MM-DD)          |

**نمونه‌ها:**

```javascript
// Country and language-specific search
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// Recent results (past week)
await web_search({
  query: "AI news",
  freshness: "week",
});

// Date range search
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## نکته‌ها

- OpenClaw از طرح **Search** در Brave استفاده می‌کند. اگر اشتراک قدیمی دارید (مثلاً طرح Free اصلی با 2,000 پرس‌وجو در ماه)، همچنان معتبر است اما قابلیت‌های جدیدتری مانند LLM Context یا محدودیت نرخ بالاتر را شامل نمی‌شود.
- هر طرح Brave شامل **\$5/month in free credit** (تجدیدشونده) است. طرح Search به‌ازای هر 1,000 درخواست، \$5 هزینه دارد؛ بنابراین این اعتبار 1,000 پرس‌وجو در ماه را پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، سقف مصرف خود را در داشبورد Brave تنظیم کنید. برای طرح‌های فعلی، [درگاه API Brave](https://brave.com/search/api/) را ببینید.
- طرح Search شامل نقطه پایانی LLM Context و حقوق استنتاج AI است. ذخیره‌سازی نتایج برای آموزش یا تنظیم مدل‌ها به طرحی با حقوق صریح ذخیره‌سازی نیاز دارد. [شرایط خدمات](https://api-dashboard.search.brave.com/terms-of-service) Brave را ببینید.
- حالت `llm-context` به‌جای شکل معمول قطعه‌متن جست‌وجوی وب، ورودی‌های منبعِ زمینه‌مند برمی‌گرداند.
- حالت `llm-context` از `ui_lang`، `freshness`، `date_after` یا `date_before` پشتیبانی نمی‌کند.
- `ui_lang` باید شامل زیرشناسه‌ی منطقه مانند `en-US` باشد.
- نتایج به‌طور پیش‌فرض برای 15 دقیقه cache می‌شوند (از طریق `cacheTtlMinutes` قابل پیکربندی است).

برای پیکربندی کامل web_search، [ابزارهای وب](/fa/tools/web) را ببینید.

## مرتبط

- [جست‌وجوی Brave](/fa/tools/brave-search)
