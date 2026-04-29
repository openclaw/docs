---
read_when:
    - می‌خواهید از Brave Search برای web_search استفاده کنید
    - به یک BRAVE_API_KEY یا جزئیات طرح نیاز دارید
summary: راه‌اندازی Brave Search API برای web_search
title: جست‌وجوی Brave
x-i18n:
    generated_at: "2026-04-29T23:39:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0a59df7a5d52f665673b82b76ec9dce7ca34bf4e7b678029f6f7f7c5340c173b
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw از Brave Search API به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند.

## دریافت کلید API

1. یک حساب Brave Search API در [https://brave.com/search/api/](https://brave.com/search/api/) ایجاد کنید
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

تنظیمات جست‌وجوی Brave مخصوص ارائه‌دهنده اکنون زیر `plugins.entries.brave.config.webSearch.*` قرار دارند.
`tools.web.search.apiKey` قدیمی همچنان از طریق لایه سازگاری بارگذاری می‌شود، اما دیگر مسیر پیکربندی رسمی نیست.

`webSearch.mode` انتقال Brave را کنترل می‌کند:

- `web` (پیش‌فرض): جست‌وجوی وب معمولی Brave با عنوان‌ها، URLها و قطعه‌متن‌ها
- `llm-context`: Brave LLM Context API با تکه‌های متن و منابع ازپیش‌استخراج‌شده برای زمینه‌سازی

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایجی که باید برگردانده شوند (1–10).
</ParamField>

<ParamField path="country" type="string">
کد کشور ISO دوحرفی (مثلاً `US`، `DE`).
</ParamField>

<ParamField path="language" type="string">
کد زبان ISO 639-1 برای نتایج جست‌وجو (مثلاً `en`، `de`، `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
کد زبان جست‌وجوی Brave (مثلاً `en`، `en-gb`، `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
کد زبان ISO برای عناصر رابط کاربری.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
فیلتر زمانی — `day` یعنی 24 ساعت.
</ParamField>

<ParamField path="date_after" type="string">
فقط نتایجی که پس از این تاریخ منتشر شده‌اند (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
فقط نتایجی که پیش از این تاریخ منتشر شده‌اند (`YYYY-MM-DD`).
</ParamField>

**مثال‌ها:**

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

## یادداشت‌ها

- OpenClaw از طرح **Search** در Brave استفاده می‌کند. اگر اشتراک قدیمی دارید (مثلاً طرح Free اولیه با 2,000 پرس‌وجو در ماه)، همچنان معتبر است اما شامل قابلیت‌های جدیدتر مانند LLM Context یا محدودیت‌های نرخ بالاتر نمی‌شود.
- هر طرح Brave شامل **\$5 اعتبار رایگان ماهانه** (تمدیدشونده) است. طرح Search به‌ازای هر 1,000 درخواست، \$5 هزینه دارد؛ بنابراین این اعتبار 1,000 پرس‌وجو در ماه را پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، محدودیت مصرف خود را در داشبورد Brave تنظیم کنید. برای طرح‌های فعلی، [پرتال Brave API](https://brave.com/search/api/) را ببینید.
- طرح Search شامل endpoint مربوط به LLM Context و حقوق استنتاج AI است. ذخیره‌سازی نتایج برای آموزش یا تنظیم مدل‌ها به طرحی با حقوق صریح ذخیره‌سازی نیاز دارد. [شرایط خدمات](https://api-dashboard.search.brave.com/terms-of-service) Brave را ببینید.
- حالت `llm-context` به‌جای شکل معمول قطعه‌متن جست‌وجوی وب، ورودی‌های منبع زمینه‌دار را برمی‌گرداند.
- حالت `llm-context` از `ui_lang`، `freshness`، `date_after` یا `date_before` پشتیبانی نمی‌کند.
- `ui_lang` باید شامل زیرشناسه منطقه‌ای مانند `en-US` باشد.
- نتایج به‌طور پیش‌فرض به‌مدت 15 دقیقه در کش نگه داشته می‌شوند (از طریق `cacheTtlMinutes` قابل پیکربندی است).

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه ارائه‌دهندگان و تشخیص خودکار
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساختاریافته با فیلتر دامنه
- [Exa Search](/fa/tools/exa-search) -- جست‌وجوی عصبی با استخراج محتوا
