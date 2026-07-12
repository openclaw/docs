---
read_when:
    - می‌خواهید از Brave Search برای web_search استفاده کنید
    - به یک BRAVE_API_KEY یا جزئیات طرح نیاز دارید
summary: راه‌اندازی API جست‌وجوی Brave برای `web_search`
title: جست‌وجوی Brave
x-i18n:
    generated_at: "2026-07-12T10:54:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35e4bc2d24769f25cac79c36607e1dfe2c6ca2078715edfaed92add070817e46
    source_path: tools/brave-search.md
    workflow: 16
---

OpenClaw از Brave Search API به‌عنوان ارائه‌دهندهٔ `web_search` پشتیبانی می‌کند.

## دریافت کلید API

1. در [https://brave.com/search/api/](https://brave.com/search/api/) یک حساب Brave Search API ایجاد کنید.
2. در داشبورد، طرح **Search** را انتخاب و یک کلید API ایجاد کنید.
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
            mode: "web", // یا "llm-context"
            baseUrl: "https://api.search.brave.com", // بازنویسی اختیاری نشانی پایه/پروکسی
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

تنظیمات جست‌وجوی ویژهٔ ارائه‌دهندهٔ Brave در `plugins.entries.brave.config.webSearch.*` قرار می‌گیرند؛ این مسیر متعارف پیکربندی است. `tools.web.search.apiKey` مشترک در سطح بالا و `tools.web.search.brave.*` محدودشده همچنان از طریق ادغام سازگاری بارگذاری می‌شوند، اما پیکربندی جدید باید از مسیر محدود به Plugin در بالا استفاده کند.

`webSearch.mode` انتقال Brave را کنترل می‌کند:

- `web` (پیش‌فرض): جست‌وجوی عادی وب Brave با عنوان‌ها، نشانی‌های URL و قطعه‌های متنی
- `llm-context`: ‏Brave LLM Context API با بخش‌های متنی و منابع ازپیش‌استخراج‌شده برای استنادپذیری

`webSearch.baseUrl` می‌تواند درخواست‌های Brave را به یک پروکسی
یا Gateway سازگار با Brave و مورد اعتماد هدایت کند. OpenClaw مسیر `/res/v1/web/search` یا `/res/v1/llm/context` را به
نشانی پایهٔ پیکربندی‌شده می‌افزاید و نشانی پایه را در کلید کش نگه می‌دارد. نقاط پایانی
عمومی باید از `https://` استفاده کنند؛ `http://` فقط برای local loopback مورد اعتماد
یا میزبان‌های پروکسی شبکهٔ خصوصی پذیرفته می‌شود.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایجی که باید بازگردانده شوند (۱ تا ۱۰).
</ParamField>

<ParamField path="country" type="string">
کد دوحرفی ISO کشور (برای نمونه `US`، `DE`).
</ParamField>

<ParamField path="language" type="string">
کد زبان ISO 639-1 برای نتایج جست‌وجو (برای نمونه `en`، `de`، `fr`).
</ParamField>

<ParamField path="search_lang" type="string">
کد زبان جست‌وجوی Brave (برای نمونه `en`، `en-gb`، `zh-hans`).
</ParamField>

<ParamField path="ui_lang" type="string">
کد زبان ISO برای عناصر رابط کاربری.
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
// جست‌وجوی مختص کشور و زبان
await web_search({
  query: "renewable energy",
  country: "DE",
  language: "de",
});

// نتایج اخیر (هفتهٔ گذشته)
await web_search({
  query: "AI news",
  freshness: "week",
});

// جست‌وجو در بازهٔ تاریخی
await web_search({
  query: "AI developments",
  date_after: "2024-01-01",
  date_before: "2024-06-30",
});
```

## نکات

- OpenClaw از طرح **Search** در Brave استفاده می‌کند. اگر اشتراک قدیمی دارید (برای نمونه طرح اصلی Free با ۲٬۰۰۰ پرس‌وجو در ماه)، همچنان معتبر است، اما قابلیت‌های جدیدتر مانند LLM Context یا محدودیت نرخ بالاتر را شامل نمی‌شود.
- هر طرح Brave شامل **اعتبار رایگان ماهانهٔ ۵ دلار** است که تمدید می‌شود. هزینهٔ طرح Search برای هر ۱٬۰۰۰ درخواست ۵ دلار است؛ بنابراین این اعتبار هزینهٔ ۱٬۰۰۰ پرس‌وجو در ماه را پوشش می‌دهد. برای جلوگیری از هزینه‌های غیرمنتظره، محدودیت مصرف خود را در داشبورد Brave تنظیم کنید. برای مشاهدهٔ طرح‌های فعلی، به [درگاه Brave API](https://brave.com/search/api/) مراجعه کنید.
- طرح Search شامل نقطهٔ پایانی LLM Context و حقوق استنتاج هوش مصنوعی است. ذخیرهٔ نتایج برای آموزش یا تنظیم مدل‌ها به طرحی با حقوق صریح ذخیره‌سازی نیاز دارد. [شرایط خدمات](https://api-dashboard.search.brave.com/terms-of-service) Brave را ببینید.
- حالت `llm-context` به‌جای قالب معمول قطعهٔ متنی جست‌وجوی وب، ورودی‌های منبع مستندشده را بازمی‌گرداند.
- حالت `llm-context` از `freshness` و بازه‌های محدود `date_after` + `date_before` پشتیبانی می‌کند. از `ui_lang` پشتیبانی نمی‌کند؛ `date_before` بدون `date_after` رد می‌شود، زیرا Brave ملزم می‌کند بازه‌های تازگی سفارشی هم تاریخ آغاز و هم تاریخ پایان را شامل شوند.
- `ui_lang` باید یک زیرتگ منطقه مانند `en-US` داشته باشد.
- نتایج به‌طور پیش‌فرض به‌مدت ۱۵ دقیقه کش می‌شوند (از طریق `cacheTtlMinutes` قابل پیکربندی است).
- مقادیر سفارشی `webSearch.baseUrl` در شناسهٔ کش Brave لحاظ می‌شوند تا
  پاسخ‌های مختص پروکسی با یکدیگر تداخل نداشته باشند.
- برای ثبت نشانی‌های URL/پارامترهای پرس‌وجوی درخواست Brave، وضعیت/زمان‌بندی پاسخ و رویدادهای اصابت/عدم اصابت/نوشتن در کش جست‌وجو هنگام عیب‌یابی، پرچم تشخیصی `brave.http` را فعال کنید. این پرچم هرگز کلید API یا بدنهٔ پاسخ را ثبت نمی‌کند، اما پرس‌وجوهای جست‌وجو می‌توانند حساس باشند.

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و تشخیص خودکار
- [جست‌وجوی Perplexity](/fa/tools/perplexity-search) -- نتایج ساختاریافته با پالایش دامنه
- [جست‌وجوی Exa](/fa/tools/exa-search) -- جست‌وجوی عصبی با استخراج محتوا
