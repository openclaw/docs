---
read_when:
    - می‌خواهید Perplexity را به‌عنوان ارائه‌دهندهٔ جست‌وجوی وب پیکربندی کنید
    - به کلید API Perplexity یا راه‌اندازی پراکسی OpenRouter نیاز دارید
summary: راه‌اندازی ارائه‌دهنده جست‌وجوی وب Perplexity (کلید API، حالت‌های جست‌وجو، فیلترگذاری)
title: Perplexity
x-i18n:
    generated_at: "2026-06-27T18:43:44Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 3be6f5066ba180a63ea8b374f641613c815be0f84ee1d3577feea04e31ab4694
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity قابلیت‌های جستجوی وب را از طریق Perplexity
Search API یا Perplexity Sonar از طریق OpenRouter فراهم می‌کند.

<Note>
این صفحه راه‌اندازی **ارائه‌دهنده** Perplexity است. برای **ابزار** Perplexity (اینکه عامل چگونه از آن استفاده می‌کند)، [ابزار Perplexity](/fa/tools/perplexity-search) را ببینید.
</Note>

| ویژگی    | مقدار                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| نوع        | ارائه‌دهنده جستجوی وب (نه ارائه‌دهنده مدل)                             |
| احراز هویت        | `PERPLEXITY_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter) |
| مسیر پیکربندی | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## نصب Plugin

Plugin رسمی را نصب کنید، سپس Gateway را راه‌اندازی مجدد کنید:

```bash
openclaw plugins install @openclaw/perplexity-plugin
openclaw gateway restart
```

## شروع به کار

<Steps>
  <Step title="تنظیم کلید API">
    جریان پیکربندی تعاملی جستجوی وب را اجرا کنید:

    ```bash
    openclaw configure --section web
    ```

    یا کلید را مستقیماً تنظیم کنید:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="شروع جستجو">
    پس از پیکربندی کلید، عامل به‌طور خودکار از Perplexity برای جستجوهای وب استفاده می‌کند.
    هیچ مرحله اضافی لازم نیست.
  </Step>
</Steps>

## حالت‌های جستجو

Plugin بر اساس پیشوند کلید API، انتقال را به‌طور خودکار انتخاب می‌کند:

<Tabs>
  <Tab title="API بومی Perplexity (pplx-)">
    وقتی کلید شما با `pplx-` شروع می‌شود، OpenClaw از Perplexity Search
    API بومی استفاده می‌کند. این انتقال نتایج ساخت‌یافته برمی‌گرداند و از فیلترهای دامنه، زبان
    و تاریخ پشتیبانی می‌کند (گزینه‌های فیلتر کردن را در ادامه ببینید).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    وقتی کلید شما با `sk-or-` شروع می‌شود، OpenClaw با استفاده از
    مدل Perplexity Sonar از طریق OpenRouter مسیریابی می‌کند. این انتقال پاسخ‌های تولیدشده با هوش مصنوعی را همراه با
    ارجاع‌ها برمی‌گرداند.
  </Tab>
</Tabs>

| پیشوند کلید | انتقال                    | قابلیت‌ها                                         |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | Perplexity Search API بومی | نتایج ساخت‌یافته، فیلترهای دامنه/زبان/تاریخ |
| `sk-or-`   | OpenRouter (Sonar)           | پاسخ‌های تولیدشده با هوش مصنوعی همراه با ارجاع‌ها            |

## فیلتر کردن API بومی

<Note>
گزینه‌های فیلتر کردن فقط هنگام استفاده از API بومی Perplexity
(کلید `pplx-`) در دسترس هستند. جستجوهای OpenRouter/Sonar از این پارامترها پشتیبانی نمی‌کنند.
</Note>

هنگام استفاده از API بومی Perplexity، جستجوها از فیلترهای زیر پشتیبانی می‌کنند:

| فیلتر         | توضیح                            | مثال                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| کشور        | کد دوحرفی کشور                  | `us`, `de`, `jp`                    |
| زبان       | کد زبان ISO 639-1                | `en`, `fr`, `zh`                    |
| بازه تاریخ     | پنجره تازگی                         | `day`, `week`, `month`, `year`      |
| فیلترهای دامنه | فهرست مجاز یا فهرست مسدود (حداکثر ۲۰ دامنه) | `example.com`                       |
| بودجه محتوا | محدودیت‌های توکن برای هر پاسخ / هر صفحه   | `max_tokens`, `max_tokens_per_page` |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="متغیر محیطی برای فرایندهای daemon">
    اگر OpenClaw Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید
    `PERPLEXITY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در یک پوسته تعاملی export شده باشد، برای یک
    daemon launchd/systemd قابل مشاهده نخواهد بود مگر اینکه آن محیط به‌صراحت وارد شده باشد. کلید را
    در `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید فرایند gateway
    می‌تواند آن را بخواند.
    </Warning>

  </Accordion>

  <Accordion title="راه‌اندازی پراکسی OpenRouter">
    اگر ترجیح می‌دهید جستجوهای Perplexity را از طریق OpenRouter مسیریابی کنید، به‌جای کلید بومی Perplexity
    یک `OPENROUTER_API_KEY` (با پیشوند `sk-or-`) تنظیم کنید.
    OpenClaw پیشوند را تشخیص می‌دهد و به‌طور خودکار به انتقال Sonar
    تغییر می‌دهد.

    <Tip>
    انتقال OpenRouter زمانی مفید است که از قبل حساب OpenRouter داشته باشید
    و بخواهید صورت‌حساب یکپارچه‌ای در میان چند ارائه‌دهنده داشته باشید.
    </Tip>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزار جستجوی Perplexity" href="/fa/tools/perplexity-search" icon="magnifying-glass">
    اینکه عامل چگونه جستجوهای Perplexity را فراخوانی و نتایج را تفسیر می‌کند.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی شامل ورودی‌های Plugin.
  </Card>
</CardGroup>
