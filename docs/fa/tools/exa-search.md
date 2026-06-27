---
read_when:
    - می‌خواهید از Exa برای web_search استفاده کنید
    - به یک EXA_API_KEY نیاز دارید
    - به جست‌وجوی عصبی یا استخراج محتوا نیاز دارید
summary: جست‌وجوی Exa AI -- جست‌وجوی عصبی و کلیدواژه‌ای با استخراج محتوا
title: جستجوی Exa
x-i18n:
    generated_at: "2026-06-27T18:57:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ffbf61b6cb7768898842e27805acc34334544b327d010246da12513218aa465f
    source_path: tools/exa-search.md
    workflow: 16
---

OpenClaw از [Exa AI](https://exa.ai/) به‌عنوان ارائه‌دهنده‌ی `web_search` پشتیبانی می‌کند. Exa
حالت‌های جست‌وجوی عصبی، کلیدواژه‌ای و ترکیبی را همراه با استخراج داخلی محتوا
(برجسته‌سازی‌ها، متن، خلاصه‌ها) ارائه می‌دهد.

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را بازراه‌اندازی کنید:

```bash
openclaw plugins install @openclaw/exa-plugin
openclaw gateway restart
```

## دریافت کلید API

<Steps>
  <Step title="ایجاد حساب">
    در [exa.ai](https://exa.ai/) ثبت‌نام کنید و از داشبورد خود یک کلید API
    تولید کنید.
  </Step>
  <Step title="ذخیره کلید">
    `EXA_API_KEY` را در محیط Gateway تنظیم کنید، یا از این طریق پیکربندی کنید:

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

وقتی درخواست‌های جست‌وجوی Exa باید از یک پراکسی سازگار یا نقطه پایانی جایگزین Exa عبور کنند،
`plugins.entries.exa.config.webSearch.baseUrl` را تنظیم کنید. OpenClaw
میزبان‌های بدون طرح را با افزودن `https://` در ابتدا عادی‌سازی می‌کند و `/search` را اضافه می‌کند، مگر اینکه
مسیر از قبل به آن ختم شود. نقطه پایانی حل‌شده در کلید کش جست‌وجو گنجانده می‌شود،
بنابراین نتایج از نقاط پایانی مختلف Exa با هم به اشتراک گذاشته نمی‌شوند.

## پارامترهای ابزار

<ParamField path="query" type="string" required>
پرس‌وجوی جست‌وجو.
</ParamField>

<ParamField path="count" type="number">
نتایج برای بازگرداندن (۱–۱۰۰).
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

Exa می‌تواند محتوای استخراج‌شده را در کنار نتایج جست‌وجو برگرداند. برای فعال‌سازی، یک شیء `contents`
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

| گزینه Contents | نوع                                                                  | توضیح                         |
| --------------- | --------------------------------------------------------------------- | ----------------------------- |
| `text`          | `boolean \| { maxCharacters }`                                        | استخراج متن کامل صفحه         |
| `highlights`    | `boolean \| { maxCharacters, query, numSentences, highlightsPerUrl }` | استخراج جمله‌های کلیدی        |
| `summary`       | `boolean \| { query }`                                                | خلاصه تولیدشده با هوش مصنوعی |

### حالت‌های جست‌وجو

| حالت             | توضیح                                      |
| ---------------- | ----------------------------------------- |
| `auto`           | Exa بهترین حالت را انتخاب می‌کند (پیش‌فرض) |
| `neural`         | جست‌وجوی معنایی/مبتنی بر معنا              |
| `fast`           | جست‌وجوی سریع کلیدواژه‌ای                  |
| `deep`           | جست‌وجوی عمیق و جامع                       |
| `deep-reasoning` | جست‌وجوی عمیق با استدلال                   |
| `instant`        | سریع‌ترین نتایج                            |

## نکات

- اگر گزینه‌ی `contents` ارائه نشود، Exa به‌طور پیش‌فرض از `{ highlights: true }` استفاده می‌کند
  تا نتایج شامل گزیده‌های جمله‌های کلیدی باشند
- نتایج، در صورت موجود بودن، فیلدهای `highlightScores` و `summary` را از پاسخ API
  Exa حفظ می‌کنند
- توضیحات نتیجه ابتدا از برجسته‌سازی‌ها، سپس خلاصه، و سپس
  متن کامل حل می‌شوند — هرکدام که موجود باشد
- `freshness` و `date_after`/`date_before` را نمی‌توان با هم ترکیب کرد — از یک
  حالت فیلتر زمانی استفاده کنید
- در هر پرس‌وجو می‌توان تا ۱۰۰ نتیجه برگرداند (مشروط به محدودیت‌های نوع جست‌وجوی
  Exa)
- نتایج به‌طور پیش‌فرض برای ۱۵ دقیقه کش می‌شوند (قابل پیکربندی از طریق
  `cacheTtlMinutes`)
- Exa یک یکپارچه‌سازی رسمی API با پاسخ‌های ساخت‌یافته JSON است

## مرتبط

- [نمای کلی Web Search](/fa/tools/web) -- همه ارائه‌دهندگان و تشخیص خودکار
- [Brave Search](/fa/tools/brave-search) -- نتایج ساخت‌یافته با فیلترهای کشور/زبان
- [Perplexity Search](/fa/tools/perplexity-search) -- نتایج ساخت‌یافته با فیلتر دامنه
