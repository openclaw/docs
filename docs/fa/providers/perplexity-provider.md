---
read_when:
    - می‌خواهید Perplexity را به‌عنوان ارائه‌دهندهٔ جست‌وجوی وب پیکربندی کنید
    - به کلید API پرپلکسیتی یا راه‌اندازی پروکسی OpenRouter نیاز دارید
summary: راه‌اندازی ارائه‌دهندهٔ جست‌وجوی وب Perplexity (کلید API، حالت‌های جست‌وجو، فیلترکردن)
title: Perplexity
x-i18n:
    generated_at: "2026-07-12T10:46:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: ea76a5cb7befce95756e9bcc8f9c1637fac87711d02d8a486ec2a1b9f51b73dc
    source_path: providers/perplexity-provider.md
    workflow: 16
---

افزونه Perplexity یک ارائه‌دهنده `web_search` را با دو روش انتقال ثبت می‌کند: API بومی جست‌وجوی Perplexity (نتایج ساختاریافته همراه با فیلترها) و تکمیل‌های گفت‌وگوی Sonar در Perplexity، به‌صورت مستقیم یا از طریق OpenRouter (پاسخ‌های تولیدشده با هوش مصنوعی همراه با ارجاع‌ها).

<Note>
این صفحه راه‌اندازی **ارائه‌دهنده** Perplexity را پوشش می‌دهد. برای **ابزار** Perplexity (نحوه استفاده عامل از آن)، به [جست‌وجوی Perplexity](/fa/tools/perplexity-search) مراجعه کنید.
</Note>

| ویژگی       | مقدار                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| نوع         | ارائه‌دهنده جست‌وجوی وب (نه ارائه‌دهنده مدل)                           |
| احراز هویت  | `PERPLEXITY_API_KEY` (بومی) یا `OPENROUTER_API_KEY` (از طریق OpenRouter) |
| مسیر پیکربندی | `plugins.entries.perplexity.config.webSearch.apiKey`                   |
| بازنویسی‌ها | `plugins.entries.perplexity.config.webSearch.baseUrl` / `.model`       |
| دریافت کلید | [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)   |

## نصب افزونه

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    ```bash
    openclaw configure --section web
    ```

    یا کلید را مستقیماً تنظیم کنید:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

    کلیدی که در محیط Gateway با نام `PERPLEXITY_API_KEY` یا `OPENROUTER_API_KEY` صادر شده باشد نیز کار می‌کند.

  </Step>
  <Step title="شروع جست‌وجو">
    هنگامی که کلید Perplexity اعتبارنامه جست‌وجوی موجود باشد، `web_search` آن را به‌طور خودکار شناسایی می‌کند؛ به راه‌اندازی بیشتری نیاز نیست. برای تعیین صریح ارائه‌دهنده:

    ```bash
    openclaw config set tools.web.search.provider perplexity
    ```

  </Step>
</Steps>

## حالت‌های جست‌وجو

افزونه روش انتقال را به ترتیب زیر تعیین می‌کند:

1. اگر `webSearch.baseUrl` یا `webSearch.model` تنظیم شده باشد: بدون توجه به نوع کلید، همیشه درخواست را از طریق تکمیل‌های گفت‌وگوی Sonar به آن نقطه پایانی هدایت می‌کند.
2. در غیر این صورت، منبع کلید نقطه پایانی را تعیین می‌کند: پیشوند کلید پیکربندی‌شده روش انتقال را انتخاب می‌کند (پیکربندی بر متغیرهای محیطی اولویت دارد)؛ کلید محیطی مستقیماً از نقطه پایانی متناظر خود استفاده می‌کند.

| پیشوند کلید | روش انتقال                                                | قابلیت‌ها                                         |
| ----------- | --------------------------------------------------------- | ------------------------------------------------- |
| `pplx-`     | API بومی جست‌وجوی Perplexity (`https://api.perplexity.ai`) | نتایج ساختاریافته، فیلترهای دامنه/زبان/تاریخ      |
| `sk-or-`    | OpenRouter (`https://openrouter.ai/api/v1`)، مدل Sonar    | پاسخ‌های تولیدشده با هوش مصنوعی همراه با ارجاع‌ها |

کلید پیکربندی‌شده با هر پیشوند دیگری نیز از API بومی جست‌وجو استفاده می‌کند. مسیر تکمیل‌های گفت‌وگو به‌طور پیش‌فرض از مدل `perplexity/sonar-pro` استفاده می‌کند؛ برای بازنویسی آن از `plugins.entries.perplexity.config.webSearch.model` استفاده کنید.

## فیلترگذاری API بومی

| فیلتر                               | توضیحات                                                               | روش انتقال  |
| ----------------------------------- | --------------------------------------------------------------------- | ----------- |
| `count`                             | تعداد نتایج در هر جست‌وجو، ۱ تا ۱۰ (پیش‌فرض ۵)                       | فقط بومی    |
| `freshness`                         | بازه تازگی: `day`، `week`، `month`، `year`                            | هر دو       |
| `country`                           | کد دوحرفی کشور (`us`، `de`، `jp`)                                    | فقط بومی    |
| `language`                          | کد زبان ISO 639-1 (`en`، `fr`، `zh`)                                 | فقط بومی    |
| `date_after` / `date_before`        | بازه تاریخ انتشار با قالب `YYYY-MM-DD`                                | فقط بومی    |
| `domain_filter`                     | حداکثر ۲۰ دامنه؛ فهرست مجاز یا فهرست مسدود با پیشوند `-`، هرگز ترکیبی نیستند | فقط بومی    |
| `max_tokens` / `max_tokens_per_page` | بودجه محتوا برای همه نتایج / برای هر صفحه                            | فقط بومی    |

فیلترهای مختص API بومی در مسیر تکمیل‌های گفت‌وگو خطایی توصیفی برمی‌گردانند. `freshness` را نمی‌توان با `date_after`/`date_before` ترکیب کرد.

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="متغیر محیطی برای فرایندهای پس‌زمینه">
    <Warning>
    کلیدی که فقط در یک پوسته تعاملی صادر شده باشد، برای دیمن Gateway مبتنی بر launchd/systemd قابل مشاهده نیست، مگر اینکه آن محیط به‌صراحت وارد شود. کلید را در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا فرایند Gateway بتواند آن را بخواند. برای مشاهده ترتیب کامل اولویت‌ها، به [متغیرهای محیطی](/fa/help/environment) مراجعه کنید.
    </Warning>
  </Accordion>

  <Accordion title="راه‌اندازی پراکسی OpenRouter">
    برای هدایت جست‌وجوهای Perplexity از طریق OpenRouter، به‌جای کلید بومی Perplexity یک `OPENROUTER_API_KEY` (با پیشوند `sk-or-`) تنظیم کنید. OpenClaw کلید را شناسایی می‌کند و به‌طور خودکار به روش انتقال Sonar تغییر می‌دهد. این کار زمانی مفید است که از قبل صورت‌حساب OpenRouter را راه‌اندازی کرده‌اید و می‌خواهید ارائه‌دهندگان را در آنجا یکپارچه کنید.
  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزار جست‌وجوی Perplexity" href="/fa/tools/perplexity-search" icon="magnifying-glass">
    نحوه فراخوانی جست‌وجوهای Perplexity و تفسیر نتایج توسط عامل.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی، شامل ورودی‌های افزونه.
  </Card>
</CardGroup>
