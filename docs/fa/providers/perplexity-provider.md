---
read_when:
    - می‌خواهید Perplexity را به‌عنوان ارائه‌دهندهٔ جست‌وجوی وب پیکربندی کنید
    - به کلید API Perplexity یا راه‌اندازی پروکسی OpenRouter نیاز دارید
summary: راه‌اندازی ارائه‌دهندهٔ جست‌وجوی وب Perplexity (کلید API، حالت‌های جست‌وجو، فیلتر کردن)
title: Perplexity
x-i18n:
    generated_at: "2026-04-29T23:27:52Z"
    model: gpt-5.5
    provider: openai
    source_hash: 36475ba0d6ab7d569f83b7f6fdc13c5dbe6b12ca5acab44e8d213da23d04a795
    source_path: providers/perplexity-provider.md
    workflow: 16
---

Plugin Perplexity قابلیت‌های جست‌وجوی وب را از طریق Perplexity
Search API یا Perplexity Sonar از راه OpenRouter فراهم می‌کند.

<Note>
این صفحه راه‌اندازی **ارائه‌دهنده** Perplexity است. برای **ابزار** Perplexity (اینکه عامل چگونه از آن استفاده می‌کند)، [ابزار Perplexity](/fa/tools/perplexity-search) را ببینید.
</Note>

| ویژگی       | مقدار                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| نوع         | ارائه‌دهنده جست‌وجوی وب (نه ارائه‌دهنده مدل)                           |
| احراز هویت | `PERPLEXITY_API_KEY` (مستقیم) یا `OPENROUTER_API_KEY` (از طریق OpenRouter) |
| مسیر پیکربندی | `plugins.entries.perplexity.config.webSearch.apiKey`                   |

## شروع کار

<Steps>
  <Step title="تنظیم کلید API">
    جریان تعاملی پیکربندی جست‌وجوی وب را اجرا کنید:

    ```bash
    openclaw configure --section web
    ```

    یا کلید را مستقیماً تنظیم کنید:

    ```bash
    openclaw config set plugins.entries.perplexity.config.webSearch.apiKey "pplx-xxxxxxxxxxxx"
    ```

  </Step>
  <Step title="شروع جست‌وجو">
    پس از پیکربندی کلید، عامل به‌طور خودکار از Perplexity برای جست‌وجوهای وب
    استفاده می‌کند. هیچ مرحله اضافی لازم نیست.
  </Step>
</Steps>

## حالت‌های جست‌وجو

Plugin بر اساس پیشوند کلید API، مسیر انتقال را به‌طور خودکار انتخاب می‌کند:

<Tabs>
  <Tab title="API بومی Perplexity (pplx-)">
    وقتی کلید شما با `pplx-` شروع می‌شود، OpenClaw از API بومی Perplexity Search
    استفاده می‌کند. این مسیر انتقال نتایج ساختاریافته برمی‌گرداند و از فیلترهای دامنه، زبان
    و تاریخ پشتیبانی می‌کند (گزینه‌های فیلتر کردن را در پایین ببینید).
  </Tab>
  <Tab title="OpenRouter / Sonar (sk-or-)">
    وقتی کلید شما با `sk-or-` شروع می‌شود، OpenClaw با استفاده از
    مدل Perplexity Sonar از مسیر OpenRouter عبور می‌کند. این مسیر انتقال پاسخ‌های ساخته‌شده با هوش مصنوعی را همراه با
    ارجاع‌ها برمی‌گرداند.
  </Tab>
</Tabs>

| پیشوند کلید | مسیر انتقال                 | قابلیت‌ها                                      |
| ---------- | ---------------------------- | ------------------------------------------------ |
| `pplx-`    | API بومی Perplexity Search | نتایج ساختاریافته، فیلترهای دامنه/زبان/تاریخ |
| `sk-or-`   | OpenRouter (Sonar)           | پاسخ‌های ساخته‌شده با هوش مصنوعی همراه با ارجاع‌ها |

## فیلتر کردن API بومی

<Note>
گزینه‌های فیلتر کردن فقط هنگام استفاده از API بومی Perplexity
(کلید `pplx-`) در دسترس هستند. جست‌وجوهای OpenRouter/Sonar از این پارامترها پشتیبانی نمی‌کنند.
</Note>

هنگام استفاده از API بومی Perplexity، جست‌وجوها از فیلترهای زیر پشتیبانی می‌کنند:

| فیلتر         | توضیح                            | مثال                             |
| -------------- | -------------------------------------- | ----------------------------------- |
| کشور        | کد دوحرفی کشور                  | `us`, `de`, `jp`                    |
| زبان       | کد زبان ISO 639-1                | `en`, `fr`, `zh`                    |
| بازه تاریخ     | پنجره تازگی                         | `day`, `week`, `month`, `year`      |
| فیلترهای دامنه | فهرست مجاز یا فهرست ممنوع (حداکثر ۲۰ دامنه) | `example.com`                       |
| بودجه محتوا | محدودیت‌های توکن برای هر پاسخ / هر صفحه   | `max_tokens`, `max_tokens_per_page` |

## پیکربندی پیشرفته

<AccordionGroup>
  <Accordion title="متغیر محیطی برای فرایندهای daemon">
    اگر OpenClaw Gateway به‌صورت daemon (launchd/systemd) اجرا می‌شود، مطمئن شوید
    `PERPLEXITY_API_KEY` برای آن فرایند در دسترس است.

    <Warning>
    کلیدی که فقط در `~/.profile` تنظیم شده باشد، برای یک daemon
    launchd/systemd قابل مشاهده نخواهد بود، مگر اینکه آن محیط به‌صراحت وارد شده باشد. کلید را در
    `~/.openclaw/.env` یا از طریق `env.shellEnv` تنظیم کنید تا مطمئن شوید فرایند Gateway می‌تواند
    آن را بخواند.
    </Warning>

  </Accordion>

  <Accordion title="راه‌اندازی پروکسی OpenRouter">
    اگر ترجیح می‌دهید جست‌وجوهای Perplexity را از طریق OpenRouter مسیریابی کنید، به‌جای کلید بومی Perplexity،
    یک `OPENROUTER_API_KEY` (با پیشوند `sk-or-`) تنظیم کنید.
    OpenClaw پیشوند را تشخیص می‌دهد و به‌طور خودکار به مسیر انتقال Sonar
    تغییر می‌کند.

    <Tip>
    مسیر انتقال OpenRouter زمانی مفید است که از قبل حساب OpenRouter دارید
    و می‌خواهید صورتحساب را بین چندین ارائه‌دهنده یکپارچه کنید.
    </Tip>

  </Accordion>
</AccordionGroup>

## مرتبط

<CardGroup cols={2}>
  <Card title="ابزار جست‌وجوی Perplexity" href="/fa/tools/perplexity-search" icon="magnifying-glass">
    اینکه عامل چگونه جست‌وجوهای Perplexity را فراخوانی می‌کند و نتایج را تفسیر می‌کند.
  </Card>
  <Card title="مرجع پیکربندی" href="/fa/gateway/configuration-reference" icon="gear">
    مرجع کامل پیکربندی، شامل ورودی‌های Plugin.
  </Card>
</CardGroup>
