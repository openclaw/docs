---
read_when:
    - می‌خواهید از Exa برای web_search استفاده کنید
    - به یک EXA_API_KEY نیاز دارید
    - جست‌وجوی عصبی یا استخراج محتوا می‌خواهید
summary: جست‌وجوی Exa AI -- جست‌وجوی عصبی و کلیدواژه‌ای با استخراج محتوا
title: جستجوی Exa
x-i18n:
    generated_at: "2026-05-02T12:04:45Z"
    model: gpt-5.5
    provider: openai
    source_hash: d2ddf83c5130208eadc78eccb10aebf67af11b05690d75a817d6999f79be5fc3
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw از [Exa AI](https://exa.ai/) به‌عنوان ارائه‌دهنده `web_search` پشتیبانی می‌کند. Exa
حالت‌های جست‌وجوی عصبی، کلیدواژه‌ای و ترکیبی را همراه با استخراج محتوای
داخلی (برجسته‌سازی‌ها، متن، خلاصه‌ها) ارائه می‌دهد.

## دریافت کلید API

<Steps>
  <Step title="Create an account">
    در [exa.ai](https://exa.ai/) ثبت‌نام کنید و از داشبورد خود یک کلید API
    تولید کنید.
  </Step>
  <Step title="Store the key">
    `EXA_API_KEY` را در محیط Gateway تنظیم کنید، یا از طریق این دستور پیکربندی کنید:

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
            apiKey: "exa-...", // optional if EXA_API_KEY is set
            baseUrl: "https://api.exa.ai", // optional; OpenClaw appends /search
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

**جایگزین محیطی:** `EXA_API_KEY` را در محیط Gateway تنظیم کنید.
برای نصب gateway، آن را در `~/.openclaw/.env` قرار دهید.

## بازنویسی URL پایه

وقتی درخواست‌های جست‌وجوی Exa باید از طریق یک پروکسی سازگار یا endpoint جایگزین Exa
عبور کنند، `plugins.entries.exa.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw
میزبان‌های خام را با افزودن `https://` به ابتدای آن‌ها عادی‌سازی می‌کند و `/search` را اضافه می‌کند مگر اینکه
مسیر از قبل به آن ختم شده باشد. endpoint نهایی در کلید cache جست‌وجو گنجانده می‌شود،
بنابراین نتایج endpointهای مختلف Exa با هم به اشتراک گذاشته نمی‌شوند.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
عبارت جست‌وجو.
</ParamField>

<ParamField path="count" type="number">
نتایج برای بازگرداندن (1–100).
</ParamField>

<ParamField path="type" type="'auto' | 'neural' | 'fast' | 'deep' | 'deep-reasoning' | 'instant'">
حالت جست‌وجو.
</ParamField>

<ParamField path="freshness" type="'day' | 'week' | 'month' | 'year'">
فیلتر زمانی.
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

Exa می‌تواند محتوای استخراج‌شده را در کنار نتایج جست‌وجو بازگرداند. برای فعال‌سازی، یک شیء `contents`
ارسال کنید:

```javascript
await web_search({
  query: "transformer architecture explained",
  type: "neural",
  contents: {
    text: true, // full page text
    highlights: { numSentences: 3 }, // key sentences
    summary: true, // AI summary
  },
});
```

| گزینه Contents | نوع                                                                   | توضیح                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | استخراج متن کامل صفحه        |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج جمله‌های کلیدی        |
| `summary`       | `boolean \| { query }`                                                | خلاصه تولیدشده با هوش مصنوعی |

### حالت‌های جست‌وجو

| حالت             | توضیح                                      |
| ---------------- | ------------------------------------------ |
| `auto`           | Exa بهترین حالت را انتخاب می‌کند (پیش‌فرض) |
| `neural`         | جست‌وجوی معنایی/مبتنی بر معنا              |
| `fast`           | جست‌وجوی سریع کلیدواژه‌ای                  |
| `deep`           | جست‌وجوی عمیق و کامل                       |
| `deep-reasoning` | جست‌وجوی عمیق با استدلال                   |
| `instant`        | سریع‌ترین نتایج                            |

## نکات

- اگر هیچ گزینه `contents` ارائه نشود، Exa به‌صورت پیش‌فرض از `{ highlights: true }` استفاده می‌کند
  تا نتایج شامل گزیده‌هایی از جمله‌های کلیدی باشند
- نتایج، فیلدهای `highlightScores` و `summary` را از پاسخ API
  مربوط به Exa، در صورت موجود بودن، حفظ می‌کنند
- توضیحات نتیجه ابتدا از برجسته‌سازی‌ها، سپس از خلاصه، و سپس از
  متن کامل استخراج می‌شوند — هرکدام که موجود باشد
- `freshness` و `date_after`/`date_before` را نمی‌توان با هم ترکیب کرد — از یک
  حالت فیلتر زمانی استفاده کنید
- در هر query می‌توان تا 100 نتیجه بازگرداند (با رعایت محدودیت‌های نوع جست‌وجوی
  Exa)
- نتایج به‌صورت پیش‌فرض برای 15 دقیقه cache می‌شوند (قابل پیکربندی از طریق
  `cacheTtlMinutes`)
- Exa یک یکپارچه‌سازی رسمی API با پاسخ‌های JSON ساختاریافته است

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساختاریافته با فیلترهای کشور/زبان
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساختاریافته با فیلتر دامنه
