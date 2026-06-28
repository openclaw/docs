---
read_when:
    - می‌خواهید از Brave Search برای web_search استفاده کنید
    - به BRAVE_API_KEY یا جزئیات طرح نیاز دارید
summary: راه‌اندازی Brave Search API برای web_search
title: جستجوی Brave
x-i18n:
    generated_at: "2026-05-06T09:44:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2bff7589ddb54d002853898c6fc37e613fd32b0fa69cb0d712d5955973efb39
    source_path: tools/brave-search.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw از Brave Search API به‌عنوان ارائه‌دهندهٔ `web_search` پشتیبانی می‌کند.

## دریافت کلید API

1. یک حساب Brave Search API در [https://brave.com/search/api/](https://brave.com/search/api/) بسازید
2. در داشبورد، طرح **Search** را انتخاب کنید و یک کلید API بسازید.
3. کلید را در پیکربندی ذخیره کنید یا `BRAVE_API_KEY` را در محیط Gateway تنظیم کنید.

## نمونهٔ پیکربندی

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

تنظیمات جست‌وجوی ویژهٔ ارائه‌دهندهٔ Brave اکنون زیر `plugins.entries.brave.config.webSearch.*` قرار دارند.
`tools.web.search.apiKey` قدیمی همچنان از طریق شیم سازگاری بارگذاری می‌شود، اما دیگر مسیر پیکربندی معیار نیست.

`webSearch.mode` انتقال Brave را کنترل می‌کند:

- `web` (پیش‌فرض): جست‌وجوی عادی وب Brave با عنوان‌ها، URLها و قطعه‌متن‌ها
- `llm-context`: Brave LLM Context API با قطعه‌های متنی و منابع ازپیش‌استخراج‌شده برای اتکاپذیری

`webSearch.baseUrl` می‌تواند درخواست‌های Brave را به یک پراکسی یا Gateway سازگار با Brave و مورداعتماد هدایت کند. OpenClaw مسیر `/res/v1/web/search` یا `/res/v1/llm/context` را به URL پایهٔ پیکربندی‌شده اضافه می‌کند و URL پایه را در کلید کش نگه می‌دارد. نقاط پایانی عمومی باید از `https://` استفاده کنند؛ `http://` فقط برای میزبان‌های پراکسی loopback مورداعتماد یا شبکهٔ خصوصی پذیرفته می‌شود.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایجی که برگردانده می‌شود (۱ تا ۱۰).
</ParamField>

<ParamField path="country" type="string">
کد کشور ISO دوحرفی (برای مثال `US`، `DE`).
</ParamField>

<ParamField path="language" type="string">
کد زبان ISO 639-1 برای نتایج جست‌وجو (برای مثال `en`، `de`، `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
کد زبان جست‌وجوی Brave (برای مثال `en`، `en-gb`، `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
کد زبان ISO برای عناصر UI.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
فیلتر زمانی — `day` برابر با ۲۴ ساعت است.
</ParamField>

<ParamField path="date_after" type="string">
فقط نتایجی که پس از این تاریخ منتشر شده‌اند (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
فقط نتایجی که پیش از این تاریخ منتشر شده‌اند (`YYYY-MM-DD`).
</ParamField>

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

## یادداشت‌ها

- OpenClaw از طرح **Search** در Brave استفاده می‌کند. اگر اشتراک قدیمی دارید (برای مثال طرح Free اصلی با ۲٬۰۰۰ پرس‌وجو در ماه)، همچنان معتبر است، اما قابلیت‌های جدیدتر مانند LLM Context یا محدودیت‌های نرخ بالاتر را شامل نمی‌شود.
- هر طرح Brave شامل **۵ دلار اعتبار رایگان ماهانه** (با تمدید دوره‌ای) است. طرح Search به‌ازای هر ۱٬۰۰۰ درخواست، ۵ دلار هزینه دارد، بنابراین این اعتبار ۱٬۰۰۰ پرس‌وجو در ماه را پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، محدودیت مصرف خود را در داشبورد Brave تنظیم کنید. برای طرح‌های فعلی، [پورتال Brave API](https://brave.com/search/api/) را ببینید.
- طرح Search شامل نقطهٔ پایانی LLM Context و حقوق استنتاج AI است. ذخیرهٔ نتایج برای آموزش یا تنظیم مدل‌ها به طرحی با حقوق صریح ذخیره‌سازی نیاز دارد. [شرایط خدمات](https://api-dashboard.search.brave.com/terms-of-service) Brave را ببینید.
- حالت `llm-context` به‌جای قالب قطعه‌متن عادی جست‌وجوی وب، ورودی‌های منبع اتکاپذیر برمی‌گرداند.
- حالت `llm-context` از `freshness` و بازه‌های محدود `date_after` + `date_before` پشتیبانی می‌کند. از `ui_lang` پشتیبانی نمی‌کند؛ `date_before` بدون `date_after` رد می‌شود، زیرا Brave الزام می‌کند بازه‌های freshness سفارشی هم تاریخ شروع و هم تاریخ پایان را داشته باشند.
- `ui_lang` باید شامل یک زیرتگ منطقه مانند `en-US` باشد.
- نتایج به‌طور پیش‌فرض به‌مدت ۱۵ دقیقه کش می‌شوند (از طریق `cacheTtlMinutes` قابل پیکربندی است).
- مقدارهای سفارشی `webSearch.baseUrl` در هویت کش Brave گنجانده می‌شوند، بنابراین پاسخ‌های ویژهٔ پراکسی با هم تداخل پیدا نمی‌کنند.
- برای ثبت URLها/پارامترهای پرس‌وجوی درخواست Brave، وضعیت/زمان‌بندی پاسخ، و رویدادهای برخورد/عدم‌برخورد/نوشتن کش جست‌وجو هنگام عیب‌یابی، پرچم عیب‌یابی `brave.http` را فعال کنید. این پرچم هرگز کلید API یا بدنهٔ پاسخ‌ها را ثبت نمی‌کند، اما پرس‌وجوهای جست‌وجو می‌توانند حساس باشند.

## مرتبط

- [مرور کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و تشخیص خودکار
- [جست‌وجوی Perplexity](/fa/tools/perplexity-search) -- نتایج ساختاریافته با فیلترکردن دامنه
- [جست‌وجوی Exa](/fa/tools/exa-search) -- جست‌وجوی عصبی با استخراج محتوا
