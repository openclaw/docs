---
read_when:
    - می‌خواهید از Exa برای web_search استفاده کنید
    - به EXA_API_KEY نیاز دارید
    - جست‌وجوی عصبی یا استخراج محتوا می‌خواهید
summary: جست‌وجوی Exa AI -- جست‌وجوی عصبی و کلیدواژه‌ای با استخراج محتوا
title: جستجوی Exa
x-i18n:
    generated_at: "2026-04-29T23:41:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 73cb69e672f432659c94c8d93ef52a88ecfcc9fa17d89af3e54493bd0cca4207
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw از [Exa AI](https://exa.ai/) به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند. Exa حالت‌های جست‌وجوی عصبی، کلیدواژه‌ای و ترکیبی را همراه با استخراج محتوای داخلی (برجسته‌سازی‌ها، متن، خلاصه‌ها) ارائه می‌دهد.

## دریافت کلید API

<Steps>
  <Step title="ایجاد حساب">
    در [exa.ai](https://exa.ai/) ثبت‌نام کنید و از داشبورد خود یک کلید API ایجاد کنید.
  </Step>
  <Step title="ذخیره کلید">
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
برای نصب Gateway، آن را در `~/.openclaw/.env` قرار دهید.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
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
گزینه‌های استخراج محتوا (در پایین ببینید).
</ParamField>

### استخراج محتوا

Exa می‌تواند محتوای استخراج‌شده را در کنار نتایج جست‌وجو بازگرداند. برای فعال‌سازی، یک شیء `contents` ارسال کنید:

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

| گزینه Contents | نوع                                                                   | توضیح                        |
| --------------- | --------------------------------------------------------------------- | ---------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | استخراج متن کامل صفحه        |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج جمله‌های کلیدی       |
| `summary`       | `boolean \| { query }`                                                | خلاصه‌ی تولیدشده با هوش مصنوعی |

### حالت‌های جست‌وجو

| حالت             | توضیح                                   |
| ---------------- | --------------------------------------- |
| `auto`           | Exa بهترین حالت را انتخاب می‌کند (پیش‌فرض) |
| `neural`         | جست‌وجوی معنایی/مبتنی بر معنا           |
| `fast`           | جست‌وجوی سریع کلیدواژه‌ای               |
| `deep`           | جست‌وجوی عمیق و کامل                    |
| `deep-reasoning` | جست‌وجوی عمیق همراه با استدلال          |
| `instant`        | سریع‌ترین نتایج                         |

## نکات

- اگر هیچ گزینه‌ی `contents` ارائه نشود، Exa به‌طور پیش‌فرض از `{ highlights: true }`
  استفاده می‌کند تا نتایج شامل گزیده‌هایی از جمله‌های کلیدی باشند
- نتایج، در صورت موجود بودن، فیلدهای `highlightScores` و `summary` را از پاسخ API
  مربوط به Exa حفظ می‌کنند
- توضیحات نتیجه ابتدا از برجسته‌سازی‌ها، سپس خلاصه، و سپس متن کامل تعیین می‌شوند؛
  هرکدام که موجود باشد
- `freshness` و `date_after`/`date_before` را نمی‌توان ترکیب کرد؛ از یک
  حالت فیلتر زمانی استفاده کنید
- در هر پرس‌وجو تا 100 نتیجه می‌تواند بازگردانده شود (با توجه به محدودیت‌های
  نوع جست‌وجوی Exa)
- نتایج به‌طور پیش‌فرض برای 15 دقیقه کش می‌شوند (قابل پیکربندی از طریق
  `cacheTtlMinutes`)
- Exa یک یکپارچه‌سازی رسمی API با پاسخ‌های JSON ساخت‌یافته است

## مرتبط

- [نمای کلی جست‌وجوی وب](/fa/tools/web) -- همه‌ی ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساخت‌یافته با فیلترهای کشور/زبان
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساخت‌یافته با فیلترگذاری دامنه
