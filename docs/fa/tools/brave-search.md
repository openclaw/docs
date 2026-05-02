---
read_when:
    - می‌خواهید از Brave Search برای web_search استفاده کنید
    - به BRAVE_API_KEY یا جزئیات طرح نیاز دارید
summary: راه‌اندازی Brave Search API برای web_search
title: جست‌وجوی Brave
x-i18n:
    generated_at: "2026-05-02T12:04:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: b1ecb9e3e5475bb26f4058311429b558f49cdd1df907a622f93f297ac6569d65
    source_path: tools/brave-search.md
    workflow: 16
---

# Brave Search API

OpenClaw از Brave Search API به‌عنوان ارائه‌دهندهٔ `web_search` پشتیبانی می‌کند.

## دریافت کلید API

1. در [https://brave.com/search/api/](https://brave.com/search/api/) یک حساب Brave Search API ایجاد کنید.
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
            baseUrl: "https://api.search.brave.com", // optional proxy/base URL override
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

تنظیمات جستجوی Brave مخصوص ارائه‌دهنده اکنون زیر `plugins.entries.brave.config.webSearch.*` قرار دارند.
`tools.web.search.apiKey` قدیمی همچنان از طریق لایه سازگاری بارگذاری می‌شود، اما دیگر مسیر پیکربندی معیار نیست.

`webSearch.mode` انتقال Brave را کنترل می‌کند:

- `web` (پیش‌فرض): جستجوی وب عادی Brave با عنوان‌ها، URLها و قطعه‌متن‌ها
- `llm-context`: API زمینه LLM در Brave با قطعه‌های متنی و منابع ازپیش‌استخراج‌شده برای زمینه‌سازی

`webSearch.baseUrl` می‌تواند درخواست‌های Brave را به یک پراکسی سازگار با Brave یا
gateway مورداعتماد هدایت کند. OpenClaw مسیر `/res/v1/web/search` یا `/res/v1/llm/context` را به
URL پایهٔ پیکربندی‌شده اضافه می‌کند و URL پایه را در کلید کش نگه می‌دارد. نقاط پایانی عمومی
باید از `https://` استفاده کنند؛ `http://` فقط برای میزبان‌های پراکسی local loopback مورداعتماد
یا شبکه خصوصی پذیرفته می‌شود.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جستجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایجی که باید برگردانده شود (1 تا 10).
</ParamField>

<ParamField path="country" type="string">
کد کشور دوحرفی ISO (مثلاً `US`، `DE`).
</ParamField>

<ParamField path="language" type="string">
کد زبان ISO 639-1 برای نتایج جستجو (مثلاً `en`، `de`، `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
کد زبان جستجوی Brave (مثلاً `en`، `en-gb`، `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
کد زبان ISO برای عناصر رابط کاربری.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
فیلتر زمانی — `day` برابر 24 ساعت است.
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

## نکته‌ها

- OpenClaw از طرح **Search** در Brave استفاده می‌کند. اگر اشتراک قدیمی دارید (مثلاً طرح Free اصلی با 2,000 پرس‌وجو در ماه)، همچنان معتبر است، اما قابلیت‌های جدیدتر مانند LLM Context یا سقف نرخ بالاتر را شامل نمی‌شود.
- هر طرح Brave شامل **\$5 اعتبار رایگان ماهانه** (تجدیدشونده) است. طرح Search برای هر 1,000 درخواست، \$5 هزینه دارد؛ بنابراین این اعتبار 1,000 پرس‌وجو در ماه را پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، سقف مصرف خود را در داشبورد Brave تنظیم کنید. برای طرح‌های فعلی، [پرتال API در Brave](https://brave.com/search/api/) را ببینید.
- طرح Search شامل نقطه پایانی LLM Context و حقوق استنتاج هوش مصنوعی است. ذخیره‌سازی نتایج برای آموزش یا تنظیم مدل‌ها به طرحی با حقوق ذخیره‌سازی صریح نیاز دارد. [شرایط خدمات](https://api-dashboard.search.brave.com/terms-of-service) Brave را ببینید.
- حالت `llm-context` به‌جای شکل معمول قطعه‌متن جستجوی وب، ورودی‌های منبع زمینه‌دار برمی‌گرداند.
- حالت `llm-context` از `freshness` و بازه‌های محدود `date_after` + `date_before` پشتیبانی می‌کند. از `ui_lang` پشتیبانی نمی‌کند؛ `date_before` بدون `date_after` رد می‌شود، چون Brave برای بازه‌های تازگی سفارشی به هر دو تاریخ شروع و پایان نیاز دارد.
- `ui_lang` باید شامل زیرتگ منطقه‌ای مانند `en-US` باشد.
- نتایج به‌طور پیش‌فرض برای 15 دقیقه کش می‌شوند (از طریق `cacheTtlMinutes` قابل پیکربندی است).
- مقادیر سفارشی `webSearch.baseUrl` در هویت کش Brave گنجانده می‌شوند، بنابراین
  پاسخ‌های مخصوص پراکسی با هم تداخل پیدا نمی‌کنند.
- برای ثبت URLها/پارامترهای پرس‌وجوی درخواست Brave، وضعیت/زمان‌بندی پاسخ، و رویدادهای برخورد/عدم‌برخورد/نوشتن کش جستجو هنگام عیب‌یابی، پرچم تشخیصی `brave.http` را فعال کنید. این پرچم هرگز کلید API یا بدنه‌های پاسخ را ثبت نمی‌کند، اما پرس‌وجوهای جستجو می‌توانند حساس باشند.

## مرتبط

- [نمای کلی جستجوی وب](/fa/tools/web) -- همه ارائه‌دهنده‌ها و تشخیص خودکار
- [جستجوی Perplexity](/fa/tools/perplexity-search) -- نتایج ساختاریافته با فیلتر دامنه
- [جستجوی Exa](/fa/tools/exa-search) -- جستجوی عصبی با استخراج محتوا
