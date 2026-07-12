---
read_when:
    - می‌خواهید از Exa برای web_search استفاده کنید
    - به یک `EXA_API_KEY` نیاز دارید
    - به جست‌وجوی عصبی یا استخراج محتوا نیاز دارید
summary: جست‌وجوی Exa AI — جست‌وجوی عصبی و کلیدواژه‌ای همراه با استخراج محتوا
title: جست‌وجوی Exa
x-i18n:
    generated_at: "2026-07-12T10:55:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3ddfd6fb471f92e705facf5a2d02361c1a343b9032fa8e0a7b135af634df65b7
    source_path: tools/exa-search.md
    workflow: 16
---

[Exa AI](https://exa.ai/) یک ارائه‌دهندهٔ `web_search` با حالت‌های جست‌وجوی عصبی، کلیدواژه‌ای و
ترکیبی، به‌همراه استخراج داخلی محتوا (نکات برجسته، متن و
خلاصه‌ها) است.

## نصب Plugin

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## دریافت کلید API

<Steps>
  <Step title="ایجاد حساب">
    در [exa.ai](https://exa.ai/) ثبت‌نام کنید و از پیشخوان خود یک کلید API
    ایجاد کنید.
  </Step>
  <Step title="ذخیره‌سازی کلید">
    `EXA_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق دستور زیر پیکربندی کنید:

    ```bash
    openclaw configure --section web
    ```

  </Step>
</Steps>

## پیکربندی

```json5
{
  plugins: {
    entries: {
      exa: {
        config: {
          webSearch: {
            apiKey: "exa-...", // اگر EXA_API_KEY تنظیم شده باشد، اختیاری است
            baseUrl: "https://api.exa.ai", // اختیاری؛ OpenClaw مسیر /search را اضافه می‌کند
          },
        },
      },
    },
  },
  tools: {
    web: {
      search: {
        provider: "exa",
      },
    },
  },
}
```

**روش جایگزین با متغیر محیطی:** `EXA_API_KEY` را در محیط Gateway تنظیم کنید. برای
نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید. به
[متغیرهای محیطی](/fa/help/faq#env-vars-and-env-loading) مراجعه کنید.

## بازنویسی URL پایه

برای هدایت درخواست‌های جست‌وجوی Exa از طریق یک پراکسی سازگار یا نقطهٔ پایانی جایگزین،
`plugins.entries.exa.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw
میزبان‌های بدون طرح را با افزودن `https://` در ابتدا عادی‌سازی می‌کند و مسیر `/search` را
اضافه می‌کند، مگر اینکه مسیر از قبل به آن ختم شود. نقطهٔ پایانی حل‌شده بخشی از کلید
حافظهٔ نهان جست‌وجو است؛ بنابراین نتایج نقاط پایانی مختلف هرگز به اشتراک گذاشته نمی‌شوند.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
عبارت جست‌وجو.
</ParamField>

<ParamField path="count" type="number" default="5">
تعداد نتایجی که بازگردانده می‌شوند (۱ تا ۱۰۰، با رعایت محدودیت‌های نوع جست‌وجوی Exa).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
حالت جست‌وجو.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
فیلتر زمانی. نمی‌توان آن را با `date_after`/`date_before` ترکیب کرد.
</ParamField>

<ParamField path="date_after" type="string">
نتایج پس از این تاریخ (`YYYY-MM-DD`).
</ParamField>

<ParamField path="date_before" type="string">
نتایج پیش از این تاریخ (`YYYY-MM-DD`).
</ParamField>

<ParamField path="contents" type="object">
گزینه‌های استخراج محتوا (پایین را ببینید).
</ParamField>

### استخراج محتوا

برای کنترل محتوای استخراج‌شده در نتایج، یک شیء `contents` ارسال کنید:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // متن کامل صفحه
    highlights: { numSentences: 3 }, // جمله‌های کلیدی
    summary: true, // خلاصهٔ هوش مصنوعی
  },
});
```

| گزینهٔ محتوا    | نوع                                                                   | توضیحات                    |
| --------------- | --------------------------------------------------------------------- | -------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | استخراج متن کامل صفحه      |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج جمله‌های کلیدی     |
| `summary`       | `boolean \| { query }`                                                | خلاصهٔ تولیدشده با هوش مصنوعی |

اگر `contents` حذف شود، Exa به‌طور پیش‌فرض از `{ highlights: true }` استفاده می‌کند تا نتایج
شامل گزیده‌هایی از جمله‌های کلیدی باشند. توضیحات نتایج ابتدا از نکات برجسته،
سپس از خلاصه و بعد از متن کامل گرفته می‌شوند؛ هرکدام که زودتر در دسترس باشد. نتایج
همچنین در صورت وجود، فیلدهای خام `highlightScores` و `summary` را از پاسخ API
‏Exa حفظ می‌کنند.

### حالت‌های جست‌وجو

| حالت             | توضیحات                              |
| ---------------- | ------------------------------------ |
| `auto`           | Exa بهترین حالت را انتخاب می‌کند (پیش‌فرض) |
| `neural`         | جست‌وجوی معنایی/مبتنی بر مفهوم       |
| `fast`           | جست‌وجوی سریع کلیدواژه‌ای            |
| `deep`           | جست‌وجوی عمیق و جامع                 |
| `deep-reasoning` | جست‌وجوی عمیق همراه با استدلال       |
| `instant`        | سریع‌ترین نتایج                      |

## نکات

- `count` با رعایت محدودیت‌های نوع جست‌وجوی Exa، تا ۱۰۰ را می‌پذیرد.
- نتایج به‌طور پیش‌فرض به‌مدت ۱۵ دقیقه در حافظهٔ نهان ذخیره می‌شوند. برای تغییر مدت
  ذخیره‌سازی در حافظهٔ نهان و مهلت زمانی درخواست برای همهٔ ارائه‌دهندگان `web_search`،
  از جمله Exa، مقادیر مشترک `tools.web.search.cacheTtlMinutes` (بر حسب دقیقه) و
  `tools.web.search.timeoutSeconds` (پیش‌فرض ۳۰ ثانیه) را پیکربندی کنید.

## مطالب مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همهٔ ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته با فیلترهای کشور/زبان
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساختاریافته با فیلتر دامنه
